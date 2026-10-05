import { inr } from "./pricing";
import { matchSampleType } from "./sample-types";
import type { ConvState, Draft, Extraction, LabTest, TraceEvent } from "./types";
import { EMAIL, GSTIN, listWords, normaliseGst } from "./verify";

// CONTRACT
// GUARANTEES: decides the next step from (state, draft, extraction) alone; only catalogue tests and
//   accepted sample types enter the draft; anything else is declined and flagged for staff.
// DOES NOT: compute prices (pricing.ts), touch the database, or use AI-written text in replies.

export interface Ctx {
  state: ConvState;
  draft: Draft;
  pastSampleTypes: string[]; // known customer's previous sample types, most recent first
  catalog: LabTest[];
  sampleTypes: string[];
}

export interface Step {
  state: ConvState;
  draft: Draft;
  notes: string[]; // guardrail sentences shown before the main reply
  ask: string | null; // follow-up question; null when an action (quote/order) writes the reply
  chips: string[];
  flags: string[]; // reasons this conversation needs staff
  events: TraceEvent[];
  action: null | "verify" | "quote" | "order";
}

const MAX_SAMPLES = 50;
export const firstName = (name: string) => name.trim().split(/\s+/)[0];
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const shortTestName = (t: LabTest) =>
  t.name.replace(/\s*\(.*?\)/g, "").replace(/\s+(Analysis|Testing|Test)\b/g, "").trim();

export function nextStep(ctx: Ctx, ex: Extraction): Step {
  const draft: Draft = { ...ctx.draft, testIds: [...ctx.draft.testIds], orderIds: [...ctx.draft.orderIds] };
  let state = ctx.state;
  const notes: string[] = [];
  const flags: string[] = [];
  const events: TraceEvent[] = [];
  const byId = new Map(ctx.catalog.map((t) => [t.id, t]));
  const before = JSON.stringify([draft.testIds, draft.sampleType, draft.samples]);

  // Trace order for the lab panel: database checks, then staff flags, then what the agent asked.
  const done = (partial: Partial<Step>): Step => ({
    state, draft, notes, ask: null, chips: [], flags, action: null, ...partial,
    events: [
      ...events.filter((e) => e.kind !== "ask"),
      ...flags.map((f) => ({ kind: "flag" as const, label: `Needs staff: ${f}` })),
      ...events.filter((e) => e.kind === "ask"),
    ],
  });

  // Guardrails: the agent never negotiates price or turnaround.
  if (ex.intent === "discount") {
    flags.push("discount requested");
    notes.push("I can't offer discounts or change prices: every price comes straight from the lab's price list. I've flagged your request for our team, who will get back to you.");
  }
  if (ex.intent === "faster_tat") {
    flags.push("faster turnaround requested");
    notes.push("Turnaround times are fixed per test in our system, so I can't promise anything faster. I've asked our team to check whether an express option is possible.");
  }
  for (const unknown of ex.unknownTests) {
    flags.push(`test not in catalogue: ${unknown}`);
    notes.push(`We don't offer "${unknown}" in our current service list. I've passed it to our team to check.`);
  }

  // Merge what was read, but only what the database recognises.
  for (const id of ex.testIds) {
    const t = byId.get(id);
    if (!t || draft.testIds.includes(id)) continue;
    draft.testIds.push(id);
    events.push({ kind: "db", label: `Test found: ${t.name}`, detail: `${t.id} · ${inr(t.feeInr)} per sample · ${t.tatDays} days` });
  }
  if (ex.sampleType) {
    const accepted = matchSampleType(ex.sampleType, ctx.sampleTypes);
    if (accepted && accepted !== draft.sampleType) {
      draft.sampleType = accepted;
      events.push({ kind: "db", label: `Sample type accepted: ${accepted}` });
    } else if (!accepted) {
      flags.push(`sample type not accepted: ${ex.sampleType}`);
      events.push({ kind: "db", label: `Sample type not in database: ${ex.sampleType}` });
      notes.push(`${capitalise(ex.sampleType)} isn't on our list of accepted sample types, so I can't quote for it here. I've flagged it for our team to check.`);
    }
  }
  if (ex.samples !== null) {
    if (ex.samples >= 1 && ex.samples <= MAX_SAMPLES) draft.samples = ex.samples;
    else if (ex.samples > MAX_SAMPLES) {
      flags.push(`large batch: ${ex.samples} samples`);
      notes.push(`For more than ${MAX_SAMPLES} samples our team prepares the quotation personally. I've flagged it for them.`);
    }
  }
  const changed = before !== JSON.stringify([draft.testIds, draft.sampleType, draft.samples]);

  // Every customer is verified before quoting: collect name, company, email and GST number,
  // then hand over to the agent's database check (action "verify").
  if (state === "identify") {
    const given = [ex.name, ex.company, ex.email, ex.gstNo].filter(Boolean).length;
    if (given === 1 && ex.name && draft.name && !draft.company) draft.company = ex.name; // lone answer to "which company?"
    else {
      if (ex.name) draft.name = ex.name; // later answers overwrite: customers correct themselves on re-check
      if (ex.company) draft.company = ex.company;
    }
    if (ex.email) {
      if (EMAIL.test(ex.email)) draft.email = ex.email.toLowerCase();
      else notes.push(`"${ex.email}" doesn't look like an email address.`);
    }
    if (ex.gstNo) {
      const gst = normaliseGst(ex.gstNo);
      if (GSTIN.test(gst)) {
        draft.gstNo = gst;
        draft.noGst = false;
      } else notes.push(`"${ex.gstNo}" doesn't look like a GST number. A GSTIN has 15 characters, like 32ABCDE1234F1Z5.`);
    }
    if (ex.noGst && !draft.gstNo) draft.noGst = true;

    const missing = [
      !draft.name && "name", !draft.company && "company", !draft.email && "email",
      !draft.gstNo && !draft.noGst && "GST number",
    ].filter((f): f is string => !!f);
    if (missing.length > 0) {
      draft.awaiting = "identity";
      return done({
        ask: missing.length === 4
          ? "To verify you, please share your name, company, email and GST number."
          : `Thanks! To finish verifying you, I still need your ${listWords(missing)}.`,
      });
    }
    events.push({
      kind: "db", label: "Verification details received",
      detail: `${draft.name} · ${draft.company} · ${draft.email} · ${draft.gstNo ?? "no GST registration"}`,
    });
    draft.awaiting = null;
    return done({ action: "verify" });
  }

  if (state === "ordered") {
    return done({ ask: `Your order ${draft.orderIds.join(", ")} is booked. We'll update you here once your samples reach the lab.` });
  }

  if (state === "quoted") {
    if (changed) {
      state = "collecting";
      events.push({ kind: "info", label: "Details changed: preparing a new quotation" });
    } else if (ex.intent === "confirm") {
      draft.awaiting = null;
      return done({ state: "ordered", action: "order" });
    } else if (ex.intent === "decline") {
      return done({ ask: `No problem. Your quotation ${draft.quotationId} stays here; reply CONFIRM whenever you're ready.`, chips: ["Confirm"] });
    } else {
      return done({
        ask: `Would you like to go ahead with quotation ${draft.quotationId}? Reply CONFIRM to book, or tell me what to change.`,
        chips: ["Confirm", "Any discount?", "Can you do it faster?"],
      });
    }
  }

  // Collecting: ask only for what is still missing.
  if (ex.intent === "decline" && !changed && flags.length === 0) {
    return done({ ask: "No problem. Message me any time you need a quotation." });
  }
  const missing = draft.testIds.length === 0 ? "tests" : !draft.sampleType ? "sampleType" : !draft.samples ? "samples" : null;
  if (!missing) {
    draft.awaiting = "confirm";
    return done({ state: "quoted", action: "quote", chips: ["Confirm", "Any discount?", "Can you do it faster?"] });
  }

  const understoodNothing = !changed && flags.length === 0 && ex.intent !== "greeting" && ctx.draft.awaiting === missing;
  const prefix = notes.length > 0 ? "" : ex.intent === "greeting" ? "Hello! " : understoodNothing ? "Sorry, I didn't quite get that. " : "";
  draft.awaiting = missing;
  let ask: string;
  let chips: string[];
  if (missing === "tests") {
    const names = ctx.catalog.map((t) => shortTestName(t).toLowerCase());
    ask = `${prefix}Which test do you need? We offer ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} testing.`;
    chips = ctx.catalog.map(shortTestName);
  } else if (missing === "sampleType") {
    const last = ctx.pastSampleTypes[0];
    ask = `${prefix}Which sample is this for?${last ? ` Your last order was ${last}.` : " For example Black Pepper, Turmeric Powder or Red Chilli Powder."}`;
    chips = [...new Set([...ctx.pastSampleTypes.slice(0, 3), ...ctx.sampleTypes])].slice(0, 6);
  } else {
    ask = `${prefix}How many samples of ${draft.sampleType} will you send?`;
    chips = ["1 sample", "3 samples", "5 samples", "10 samples"];
  }
  events.push({ kind: "ask", label: `Asked for: ${missing === "tests" ? "test" : missing === "sampleType" ? "sample type" : "number of samples"}` });
  return done({ state, ask, chips });
}
