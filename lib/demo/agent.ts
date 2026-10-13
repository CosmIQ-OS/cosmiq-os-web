import crypto from "node:crypto";
import {
  addEvents, addMessage, allocateQuotationId, claimConversation, createConversation, ensureDemoData, finishConversation,
  findCustomerForVerification, getCatalog, getConversation, getCustomer, getCustomerProfile,
  getGstRate, getSampleTypes, releaseConversation, type Chip, type MessageMeta, type PendingQuotation,
} from "./data";
import { extract } from "./extract";
import { buildQuote, inr } from "./pricing";
import type { Customer, Draft, Extraction, TraceEvent } from "./types";
import { compareWithRecord, decideVerification, FIELD_LABEL, listWords } from "./verify";
import { firstName, nextStep, shortTestName } from "./workflow";

const NOTHING: Extraction = {
  intent: "other", testIds: [], unknownTests: [], sampleType: null, samples: null,
  name: null, phone: null, company: null, email: null, gstNo: null, noGst: false, engine: "fallback",
};
const emptyDraft = (): Draft => ({
  workflowVersion: 2,
  testIds: [], sampleType: null, samples: null, name: null, phone: null, company: null, email: null,
  gstNo: null, noGst: false, verification: "pending", verifyAttempts: 0, awaiting: "tests", quotationId: null, orderIds: [],
  gstFormatAttempts: 0,
});
function detailChips(persona: Customer | null): Chip[] {
  if (!persona) return [{ label: "Send my details", text: "Asha Varma, phone +91 9876543210, GST 32AAGCS4821K1Z3" }];
  const details = `${persona.name}, phone ${persona.phone}, GST ${persona.gstNo}`;
  return [
    { label: "Send my details", text: details },
    { label: "Send with wrong phone", text: details.replace(persona.phone, "+91 9000000000") },
  ];
}
export async function startConversation(personaId: string | null): Promise<string> {
  await ensureDemoData();
  if (personaId && !(await getCustomer(personaId))) throw new Error("Unknown customer.");
  const catalog = await getCatalog();
  const id = await createConversation(personaId, "requesting", emptyDraft());
  await addMessage(id, "agent", "Hello 👋 Welcome to FQLab. Which testing services do you need?", { chips: catalog.map(shortTestName) });
  await addEvents(id, [{ kind: "ask", label: "Waiting for the customer's service request" }]);
  return id;
}

async function verifyCustomer(input: Draft) {
  const draft = { ...input };
  const record = await findCustomerForVerification(draft.gstNo, draft.phone!);
  const comparison = record ? compareWithRecord(draft, record) : null;
  const outcome = decideVerification(record, comparison, draft.verifyAttempts);
  const steps = [{ label: "Searching customer database", ok: true as boolean | null }, ...(comparison?.checks ?? [])];
  const events: TraceEvent[] = [];
  if (outcome === "verified") {
    draft.verification = "verified" as const;
    draft.name = record!.name;
    draft.company = record!.company;
    events.push({ kind: "db", label: `Customer verified: ${record!.name} (${record!.id})`, detail: "Name, phone and GST checked against the record" });
    return { draft, customerId: record!.id, proceed: true, reply: `✅ You're verified. Welcome back, ${firstName(record!.name)}!`, steps, result: "Verified", events, flags: [] as string[] };
  }
  if (outcome === "new") {
    draft.verification = "new" as const;
    steps.push({ label: "No matching customer record", ok: null });
    events.push({ kind: "flag", label: "New customer: identity needs staff review" });
    return { draft, customerId: null, proceed: true, reply: "I couldn't find a matching customer record. Our staff will review your details before approving your quotation.", steps, result: "New customer · staff review required", events, flags: ["new customer needs identity review"] };
  }
  if (outcome === "retry") {
    const fields = comparison!.mismatched;
    for (const field of fields) {
      draft[field] = null;
      if (field === "gstNo") draft.noGst = false;
    }
    draft.verifyAttempts += 1;
    draft.awaiting = fields.length === 1 && fields[0] === "gstNo" ? "gstNo" : "identity";
    events.push({ kind: "db", label: "Details don't match record (attempt 1 of 2)", detail: fields.map((f) => FIELD_LABEL[f]).join(", ") });
    return { draft, customerId: null, proceed: false, reply: `The details don't match our records. Please re-check your ${listWords(fields.map((f) => FIELD_LABEL[f]))}.`, steps, result: "Details don't match", events, flags: [] as string[] };
  }
  draft.verification = "unverified" as const;
  events.push({ kind: "flag", label: "Needs staff: customer details don't match records" });
  return { draft, customerId: null, proceed: true, reply: "I still can't match those details. Staff must verify your account before approving the quotation.", steps, result: "Not verified · sent to staff", events, flags: ["customer details don't match records"] };
}

// CONTRACT
// GUARANTEES: serialises writes per conversation; only creates a pending quote after confirmation/email.
// FAILURE BEHAVIOR: concurrent messages fail with ConversationBusy; DB/extraction errors propagate.
// DOES NOT: approve, mail quotations or create orders. AI output never supplies prices or replies.
export class ConversationBusy extends Error {}
export async function handleMessage(conversationId: string, text: string): Promise<boolean> {
  await ensureDemoData();
  if (!(await getConversation(conversationId))) return false;
  const token = crypto.randomUUID();
  if (!(await claimConversation(conversationId, token))) throw new ConversationBusy("A message is already being processed. Please wait and try again.");
  try {
    return await processMessage(conversationId, text, token);
  } finally {
    await releaseConversation(conversationId, token);
  }
}

async function processMessage(conversationId: string, text: string, token: string): Promise<boolean> {
  const conversation = (await getConversation(conversationId))!;
  // Resume existing version-2 chats that were already asking only for GST before this fix.
  if (conversation.state === "identify" && conversation.draft.workflowVersion === 2
    && conversation.draft.name && conversation.draft.phone && !conversation.draft.gstNo && !conversation.draft.noGst) {
    conversation.draft.awaiting = "gstNo";
  }
  const [catalog, sampleTypes, gstRate, persona] = await Promise.all([
    getCatalog(), getSampleTypes(), getGstRate(), conversation.personaId ? getCustomer(conversation.personaId) : Promise.resolve(null),
  ]);
  let customerId = conversation.customerId;
  let profile = customerId ? await getCustomerProfile(customerId) : null;
  const ex = conversation.state === "pending_approval" || conversation.draft.workflowVersion !== 2 ? NOTHING : await extract(text, { catalog, sampleTypes, state: conversation.state, awaiting: conversation.draft.awaiting });
  const events: TraceEvent[] = [{ kind: "ai", label: ex.engine === "gemini" ? "AI read the message (Gemini)" : "Message read by fallback parser", detail: `intent: ${ex.intent} · tests: ${ex.testIds.join(", ") || "none"}${ex.note ? ` · ${ex.note}` : ""}` }];
  const context = { state: conversation.state, draft: conversation.draft, pastSampleTypes: [...new Set(profile?.orders.map((o) => o.sampleType) ?? [])], catalog, sampleTypes };
  let step = nextStep(context, ex);
  events.push(...step.events);
  const lead = [...step.notes], flags = [...step.flags];
  const meta: MessageMeta = {};
  if (step.action === "verify") {
    const verified = await verifyCustomer(step.draft);
    events.push(...verified.events);
    flags.push(...verified.flags);
    lead.push(verified.reply);
    meta.verification = { steps: verified.steps, result: verified.result, outcome: verified.draft.verification };
    customerId = verified.customerId;
    if (!verified.proceed) {
      step = { ...step, draft: verified.draft, state: "identify", action: null, ask: null };
    } else {
      profile = customerId ? await getCustomerProfile(customerId) : null;
      step = nextStep({ ...context, state: "collecting", draft: verified.draft,
        pastSampleTypes: [...new Set(profile?.orders.map((o) => o.sampleType) ?? [])] }, NOTHING);
      events.push(...step.events);
    }
  }
  const draft = step.draft;
  let pendingQuotation: PendingQuotation | undefined;
  let main = step.ask ?? "";
  meta.chips = draft.workflowVersion !== 2 ? [] : draft.awaiting === "identity" ? detailChips(persona) : step.chips;
  if (draft.awaiting === "gstNo") meta.chips = [
    ...(persona?.gstNo ? [{ label: "Send GST", text: `GST ${persona.gstNo}` }] : []),
    { label: "No GST registration", text: "NO GST" },
  ];
  if (draft.awaiting === "email") meta.chips = [{ label: "Send email", text: persona?.email ?? "asha.varma@spiceroute.example" }];
  if (step.action === "submit") {
    const quote = buildQuote(draft.testIds.map((id) => catalog.find((t) => t.id === id)!), draft.sampleType!, draft.samples!, gstRate);
    const quotationId = await allocateQuotationId();
    pendingQuotation = { id: quotationId, name: draft.name!, company: draft.company ?? "", email: draft.email!,
      gstNo: draft.gstNo, city: profile?.customer.city ?? null, quote };
    draft.quotationId = quotationId;
    main = "Your quotation will be emailed to you after approval.";
    meta.chips = [];
    events.push({ kind: "quote", label: `Quotation ${quotationId} awaiting staff approval`, detail: `${inr(quote.totalInr)} · recipient ${draft.email} · not sent` });
  }
  events.push(...flags.map((f) => ({ kind: "flag" as const, label: `Needs staff: ${f}` })));
  await finishConversation({ id: conversationId, token, state: step.state, draft,
    needsStaff: conversation.needsStaff || flags.length > 0, customerId, text,
    reply: [...lead, main].filter(Boolean).join("\n\n"), meta, events, quotation: pendingQuotation });
  return true;
}
