import { GoogleGenAI } from "@google/genai";
import { parseFallback } from "./parse-fallback";
import type { Awaiting, ConvState, Extraction, Intent, LabTest } from "./types";

// CONTRACT
// GUARANTEES: always returns an Extraction. Gemini when configured and answering within the timeout,
//   otherwise the keyword parser (note explains why). Output is sanitised: test IDs limited to the catalogue.
// DOES NOT: decide workflow steps, prices or replies. Those stay in workflow.ts / pricing.ts.

const TIMEOUT_MS = 5000;
const INTENTS: Intent[] = ["enquiry", "confirm", "decline", "discount", "faster_tat", "greeting", "other"];

let client: GoogleGenAI | null | undefined;
function gemini(): GoogleGenAI | null {
  if (client === undefined) client = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
  return client;
}

// Comma-separated, in order of preference: on a "busy" answer the next model gets one try.
export function geminiModels(): string[] {
  const list = (process.env.GEMINI_MODEL || "gemini-2.5-flash,gemini-3.5-flash").split(",").map((m) => m.trim()).filter(Boolean);
  return list.length ? list : ["gemini-2.5-flash"];
}

function instructions(catalog: LabTest[], sampleTypes: string[], state: ConvState, awaiting: Awaiting) {
  return [
    "You read WhatsApp messages sent to a food testing laboratory and extract structured fields. You never reply to the customer.",
    "Test catalogue (use ONLY these IDs in testIds):",
    ...catalog.map((t) => `- ${t.id}: ${t.name} (${t.category}; ${t.method})`),
    `Accepted sample types: ${sampleTypes.join(", ")}.`,
    "Rules:",
    "- testIds: catalogue IDs the customer is asking for in THIS message. Map plain words: 'pesticide' -> pesticide residue, 'afla' -> aflatoxin, 'micro'/'salmonella' -> microbiological, 'sudan dye'/'adulteration'/'colour' -> adulteration.",
    "- unknownTests: tests the customer asks for that are NOT in the catalogue (e.g. 'gluten', 'vitamin D'), in their words. Empty if none.",
    "- sampleType: the food or spice to be tested as the customer said it; use the accepted name when it clearly matches (chilli -> Red Chilli Powder, jeera -> Cumin Seeds, haldi -> Turmeric Powder). Return a non-matching food as written (e.g. 'honey'). null if not mentioned.",
    "- samples: number of samples/batches to test, if stated. Ignore weights (500 g), days and order numbers. A bare number answers 'how many samples' only when the agent asked for it. null otherwise.",
    "- intent: confirm (accepts/agrees to book), decline (not now/no), discount (asks for a lower price/discount/offer), faster_tat (asks for faster/urgent/express turnaround), greeting (only a greeting), enquiry (asks for or gives test details), other.",
    "- name / phone / company / email / gstNo: contact details when the customer gives them (gstNo = 15-character GSTIN as written). Otherwise null. phone is a phone number, never a sample count or GST number; preserve the country code.",
    "- noGst: true only if the customer says they have no GST registration.",
    "- When the message is the customer's contact details, do NOT take tests or sample types from the company name (e.g. 'Rajputana Chilli Industries' is a company, not a chilli sample).",
    `Conversation state: ${state}. The agent last asked for: ${awaiting ?? "nothing specific"}.`,
  ].join("\n");
}

const SCHEMA = {
  type: "object",
  properties: {
    intent: { type: "string", enum: INTENTS },
    testIds: { type: "array", items: { type: "string" } },
    unknownTests: { type: "array", items: { type: "string" } },
    sampleType: { type: ["string", "null"] },
    samples: { type: ["integer", "null"] },
    name: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    company: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    gstNo: { type: ["string", "null"] },
    noGst: { type: "boolean" },
  },
  required: ["intent", "testIds", "unknownTests", "sampleType", "samples", "name", "phone", "company", "email", "gstNo", "noGst"],
};

function fallbackReason(error: unknown, timedOut: boolean): string {
  if (timedOut) return `Gemini took over ${TIMEOUT_MS / 1000}s`;
  const message = error instanceof Error ? error.message : String(error);
  if (/\b429\b|quota|RESOURCE_EXHAUSTED/i.test(message)) return "Gemini rate limit reached";
  if (/\b503\b|overloaded|high demand|UNAVAILABLE/i.test(message)) return "Gemini busy";
  return "Gemini unavailable";
}

function sanitise(raw: Record<string, unknown>, catalog: LabTest[]): Omit<Extraction, "engine"> {
  const ids = new Set(catalog.map((t) => t.id));
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : null);
  const samples = typeof raw.samples === "number" && Number.isInteger(raw.samples) ? raw.samples : null;
  return {
    intent: INTENTS.includes(raw.intent as Intent) ? (raw.intent as Intent) : "other",
    testIds: Array.isArray(raw.testIds) ? [...new Set(raw.testIds.filter((id): id is string => typeof id === "string" && ids.has(id)))] : [],
    unknownTests: Array.isArray(raw.unknownTests) ? raw.unknownTests.map(str).filter((s): s is string => !!s).slice(0, 3) : [],
    sampleType: str(raw.sampleType),
    samples,
    name: str(raw.name),
    phone: str(raw.phone),
    company: str(raw.company),
    email: str(raw.email),
    gstNo: str(raw.gstNo),
    noGst: raw.noGst === true,
  };
}

export async function extract(text: string, ctx: { catalog: LabTest[]; sampleTypes: string[]; state: ConvState; awaiting: Awaiting }): Promise<Extraction> {
  const ai = gemini();
  if (!ai) return { ...parseFallback(text, ctx.awaiting, ctx.sampleTypes), note: "GEMINI_API_KEY not set" };
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  const started = Date.now();
  const models = geminiModels();
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: models[Math.min(attempt, models.length - 1)],
          contents: text,
          config: {
            systemInstruction: instructions(ctx.catalog, ctx.sampleTypes, ctx.state, ctx.awaiting),
            responseMimeType: "application/json",
            responseJsonSchema: SCHEMA,
            temperature: 0,
            abortSignal: abort.signal,
          },
        });
        const raw = JSON.parse(response.text ?? "{}") as Record<string, unknown>;
        return { ...sanitise(raw, ctx.catalog), engine: "gemini" };
      } catch (error) {
        // Overloaded models answer "busy" within a few seconds: one more try (next model if listed) while time allows.
        const busy = fallbackReason(error, abort.signal.aborted) === "Gemini busy";
        if (attempt === 0 && busy && Date.now() - started < 3500) continue;
        // Short, client-safe reason for the lab dashboard; the raw error goes to the server log.
        console.error("[demo] Gemini failed, using fallback parser:", error);
        return { ...parseFallback(text, ctx.awaiting, ctx.sampleTypes), note: fallbackReason(error, abort.signal.aborted) };
      }
    }
  } finally {
    clearTimeout(timer);
  }
}
