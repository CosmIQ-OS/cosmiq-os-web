import {
  addEvents, addMessage, createConversation, createOrders, createQuotation, ensureDemoData, findCustomerForVerification,
  getCatalog, getConversation, getCustomer, getCustomerProfile, getGstRate, getQuotation, getSampleTypes,
  registerCustomer, saveConversation, type Chip, type MessageMeta,
} from "./data";
import { extract } from "./extract";
import { buildQuote, inr } from "./pricing";
import type { Customer, Draft, Extraction, LabTest, PastOrder, TraceEvent } from "./types";
import { compareWithRecord, decideVerification, FIELD_LABEL, listWords, type Check } from "./verify";
import { firstName, nextStep, shortTestName } from "./workflow";

const LAB = "FQLab";
// Fictional details for the "New customer" persona (not in the sample data).
const NEW_PERSONA = "Asha Varma, Spice Route Exports, asha.varma@spiceroute.example, GST 32AAGCS4821K1Z3";
const NOTHING: Extraction = {
  intent: "other", testIds: [], unknownTests: [], sampleType: null, samples: null,
  name: null, company: null, email: null, gstNo: null, noGst: false, engine: "fallback",
};

const emptyDraft = (): Draft => ({
  testIds: [], sampleType: null, samples: null, name: null, company: null, email: null, gstNo: null, noGst: false,
  verification: "pending", verifyAttempts: 0, awaiting: "identity", quotationId: null, orderIds: [],
});

// Demo shortcuts: type the chosen sample customer's details (or a wrong email to show the mismatch path).
function detailChips(persona: Customer | null): Chip[] {
  if (!persona) return [{ label: "Send my details", text: NEW_PERSONA }];
  const details = `${persona.name}, ${persona.company}, ${persona.email}, GST ${persona.gstNo}`;
  const wrongEmail = persona.email.replace(/@.*/, "@outlook.example");
  return [
    { label: "Send my details", text: details },
    { label: "Send with wrong email", text: details.replace(persona.email, wrongEmail) },
  ];
}

const pastSampleTypes = (orders: PastOrder[] | undefined) => [...new Set(orders?.map((o) => o.sampleType) ?? [])];

export async function startConversation(personaId: string | null): Promise<string> {
  await ensureDemoData();
  const persona = personaId ? await getCustomer(personaId) : null;
  if (personaId && !persona) throw new Error("Unknown customer.");
  const id = await createConversation(personaId, "identify", emptyDraft());
  await addMessage(id, "agent",
    `Hello 👋 Welcome to ${LAB}. I can prepare a quotation for any of our tests in a couple of minutes.\n\n` +
    "First, to verify you, please share your name, company, email and GST number.",
    { chips: detailChips(persona) });
  await addEvents(id, [
    { kind: "info", label: "Incoming WhatsApp chat", detail: persona ? `From ${persona.phone}` : "From an unknown number" },
    { kind: "ask", label: "Asked for verification details", detail: "Name, company, email, GST number" },
  ]);
  return id;
}

interface Verified {
  draft: Draft;
  customerId: string | null;
  proceed: boolean; // false = waiting for the customer to re-check details
  reply: string;
  steps: Check[];
  result: string;
  flags: string[];
  events: TraceEvent[];
}

async function verifyCustomer(input: Draft): Promise<Verified> {
  const draft: Draft = { ...input };
  const record = await findCustomerForVerification(draft.gstNo, draft.email!);
  const comparison = record ? compareWithRecord(draft, record) : null;
  const outcome = decideVerification(record, comparison, draft.verifyAttempts);
  const steps: Check[] = [{ label: "Searching customer database", ok: true }];
  const events: TraceEvent[] = [];
  if (record && comparison) {
    steps.push({ label: "Customer record found", ok: true }, ...comparison.checks);
    events.push(
      { kind: "db", label: `Record found: ${record.id} · ${record.company}`, detail: record.gstNo === draft.gstNo ? "Matched on GST number" : "Matched on email" },
      { kind: "db", label: "Details checked against record", detail: comparison.checks.map((c) => `${c.label} ${c.ok ? "✓" : "✗"}`).join(" · ") },
    );
  } else {
    steps.push({ label: draft.gstNo ? `GST ${draft.gstNo} not on file` : "Email not on file", ok: null });
    events.push({ kind: "db", label: "No customer record found", detail: `GST ${draft.gstNo ?? "none"} · ${draft.email}` });
  }

  if (outcome === "verified") {
    draft.verification = "verified";
    draft.name = record!.name;
    draft.company = record!.company;
    events.push({ kind: "db", label: `Customer verified: ${record!.name} (${record!.id})` });
    return { draft, customerId: record!.id, proceed: true, reply: `✅ You're verified. Welcome back, ${firstName(record!.name)}!`, steps, result: "Verified", flags: [], events };
  }
  if (outcome === "new") {
    const id = await registerCustomer({ name: draft.name!, company: draft.company!, email: draft.email!, gstNo: draft.gstNo });
    draft.verification = "new";
    events.push({ kind: "db", label: `New customer registered: ${id}`, detail: `${draft.company} · ${draft.email} · GST ${draft.gstNo ?? "none"}` });
    return {
      draft, customerId: id, proceed: true, steps, result: "New customer registered", flags: [], events,
      reply: `You're new with us, so I've registered ${draft.company} as a new customer. Welcome to ${LAB}, ${firstName(draft.name!)}!`,
    };
  }
  const fields = comparison!.mismatched;
  if (outcome === "retry") {
    for (const f of fields) draft[f] = null; // ask again only for what didn't match
    draft.verifyAttempts += 1;
    draft.awaiting = "identity";
    events.push({ kind: "db", label: "Details don't match record (attempt 1 of 2)", detail: `Mismatch: ${fields.map((f) => FIELD_LABEL[f]).join(", ")}` });
    return {
      draft, customerId: null, proceed: false, steps, result: "Details don't match", flags: [], events,
      reply: `The details you shared don't match our records. Please re-check your ${listWords(fields.map((f) => FIELD_LABEL[f]))} and send ${fields.length > 1 ? "them" : "it"} again.`,
    };
  }
  draft.verification = "unverified";
  return {
    draft, customerId: null, proceed: true, steps, result: "Not verified · sent to staff", events,
    flags: ["customer details don't match records"],
    reply: "I still can't match those details with our records, so I've asked our team to verify your account. I can still prepare a quotation; it will be marked \"GST unverified\".",
  };
}

function describe(ex: Extraction, testNames: Map<string, string>): string {
  const parts = [`intent: ${ex.intent}`];
  if (ex.testIds.length) parts.push(`tests: ${ex.testIds.map((id) => testNames.get(id) ?? id).join(", ")}`);
  if (ex.unknownTests.length) parts.push(`unlisted: ${ex.unknownTests.join(", ")}`);
  if (ex.sampleType) parts.push(`sample: "${ex.sampleType}"`);
  if (ex.samples !== null) parts.push(`samples: ${ex.samples}`);
  const contact = [ex.name, ex.company, ex.email, ex.gstNo && `GST ${ex.gstNo}`, ex.noGst && "no GST"].filter(Boolean);
  if (contact.length) parts.push(`contact: ${contact.join(" / ")}`);
  if (ex.note) parts.push(`(${ex.note})`);
  return parts.join(" · ");
}

export async function handleMessage(conversationId: string, text: string): Promise<boolean> {
  await ensureDemoData();
  const conversation = await getConversation(conversationId);
  if (!conversation) return false;
  const [catalog, sampleTypes, gstRate, persona] = await Promise.all([
    getCatalog(), getSampleTypes(), getGstRate(),
    conversation.personaId ? getCustomer(conversation.personaId) : Promise.resolve(null),
  ]);
  let customerId = conversation.customerId;
  let profile = customerId ? await getCustomerProfile(customerId) : null;

  await addMessage(conversationId, "customer", text);
  const ex = await extract(text, { catalog, sampleTypes, state: conversation.state, awaiting: conversation.draft.awaiting });
  const testNames = new Map(catalog.map((t) => [t.id, shortTestName(t)]));
  const events: TraceEvent[] = [{ kind: "ai", label: ex.engine === "gemini" ? "AI read the message (Gemini)" : "Message read by fallback parser", detail: describe(ex, testNames) }];

  let step = nextStep({ state: conversation.state, draft: conversation.draft, pastSampleTypes: pastSampleTypes(profile?.orders), catalog, sampleTypes }, ex);
  events.push(...step.events);
  const lead: string[] = [...step.notes]; // sentences before the main reply
  const flags = [...step.flags];
  const meta: MessageMeta = {};

  if (step.action === "verify") {
    const v = await verifyCustomer(step.draft);
    events.push(...v.events, ...v.flags.map((f) => ({ kind: "flag" as const, label: `Needs staff: ${f}` })));
    flags.push(...v.flags);
    meta.verification = { steps: v.steps, result: v.result, outcome: v.draft.verification };
    lead.push(v.reply);
    customerId = v.customerId;
    if (!v.proceed) {
      step = { ...step, draft: v.draft, state: "identify", ask: null, action: null, chips: [] };
    } else {
      profile = customerId ? await getCustomerProfile(customerId) : null;
      const last = profile?.orders[0];
      if (v.draft.verification === "verified" && last) {
        lead.push(`Your last order was ${shortTestName(catalog.find((t) => t.id === last.testId)!)} testing on ${last.sampleType}.`);
      }
      // Continue straight into the enquiry, keeping any test details given earlier.
      step = nextStep({ state: "collecting", draft: { ...v.draft, awaiting: null }, pastSampleTypes: pastSampleTypes(profile?.orders), catalog, sampleTypes }, NOTHING);
      events.push(...step.events);
    }
  }

  const draft = step.draft;
  let main = step.ask ?? "";
  meta.chips = draft.awaiting === "identity" ? detailChips(persona) : step.chips;

  if (step.action === "quote") {
    const tests = draft.testIds.map((id) => catalog.find((t) => t.id === id)!) as LabTest[];
    const quote = buildQuote(tests, draft.sampleType!, draft.samples!, gstRate);
    const who = profile
      ? { customerId: profile.customer.id, name: profile.customer.name, company: profile.customer.company, gstNo: profile.customer.gstNo || null, city: profile.customer.city || null }
      : { customerId: null, name: draft.name ?? "Customer", company: draft.company ?? "", gstNo: draft.gstNo ? `${draft.gstNo} (unverified)` : null, city: null };
    const quotationId = await createQuotation(conversationId, who, quote);
    draft.quotationId = quotationId;
    meta.quote = {
      id: quotationId, totalInr: quote.totalInr, subtotalInr: quote.subtotalInr, gstInr: quote.gstInr, gstRate: quote.gstRate, tatDays: quote.tatDays,
      lines: quote.lines.map((l) => ({ testName: l.testName, sampleType: l.sampleType, samples: l.samples, feeInr: l.feeInr, amountInr: l.amountInr })),
    };
    main = `Here's your quotation ${quotationId} for ${draft.samples} × ${draft.sampleType}. Prices, GST and turnaround come straight from our lab system.\nReply CONFIRM to book, or tell me what to change.`;
    events.push({ kind: "quote", label: `Quotation ${quotationId} issued · ${inr(quote.totalInr)}`, detail: `${quote.lines.map((l) => `${shortTestName(tests.find((t) => t.id === l.testId)!)} ${l.samples} × ${inr(l.feeInr)}`).join(" + ")} + GST ${Math.round(quote.gstRate * 100)}% · ${quote.tatDays} days` });
  }

  if (step.action === "order") {
    const quotation = draft.quotationId ? await getQuotation(draft.quotationId) : null;
    if (!quotation) throw new Error("No quotation to confirm.");
    const orderIds = await createOrders(quotation);
    draft.orderIds = orderIds;
    const required = [...new Set(quotation.quote.lines.map((l) => l.sampleRequired))].join(" / ");
    meta.order = { ids: orderIds, status: "Awaiting sample" };
    main = `Booked ✅ ${orderIds.length > 1 ? "Orders" : "Order"} ${orderIds.join(", ")} created (status: Awaiting sample).\n` +
      `Please send ${required} (illustrative quantity) of ${quotation.quote.lines[0].sampleType}, labelled with ${orderIds[0]}. We'll message you here when your samples reach the lab.`;
    events.push({ kind: "order", label: `Order ${orderIds.join(", ")} created in lab system`, detail: `From ${quotation.id} · status Awaiting sample` });
  }

  const reply = [...lead, main].filter(Boolean).join("\n\n");
  await addMessage(conversationId, "agent", reply, meta);
  await addEvents(conversationId, events);
  await saveConversation(conversationId, step.state, draft, conversation.needsStaff || flags.length > 0, customerId);
  return true;
}
