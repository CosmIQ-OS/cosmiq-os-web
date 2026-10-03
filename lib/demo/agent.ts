import {
  addEvents, addMessage, createConversation, createOrders, createQuotation, ensureDemoData, getCatalog,
  getConversation, getCustomerProfile, getGstRate, getQuotation, getSampleTypes, saveConversation, type MessageMeta,
} from "./data";
import { extract } from "./extract";
import { buildQuote, inr } from "./pricing";
import type { Draft, Extraction, TraceEvent } from "./types";
import { nextStep, shortTestName } from "./workflow";

const LAB = "FQLab";

const emptyDraft = (): Draft => ({
  testIds: [], sampleType: null, samples: null, name: null, company: null, awaiting: null, quotationId: null, orderIds: [],
});

export async function startConversation(customerId: string | null): Promise<string> {
  await ensureDemoData();
  const catalog = await getCatalog();
  const profile = customerId ? await getCustomerProfile(customerId) : null;
  if (customerId && !profile) throw new Error("Unknown customer.");

  const draft = emptyDraft();
  let body: string;
  let chips: string[];
  const events: TraceEvent[] = [];
  if (profile) {
    const { customer, orders } = profile;
    const last = orders[0];
    draft.name = customer.name;
    draft.company = customer.company;
    draft.awaiting = "tests";
    events.push({ kind: "db", label: `Customer recognised: ${customer.name} (${customer.id})`, detail: `${customer.company} · ${customer.city} · ${orders.length} previous orders` });
    body = `Hello ${customer.name.split(" ")[0]} 👋 Welcome back to ${LAB}.` +
      (last ? ` Your last order was ${shortTestName(catalog.find((t) => t.id === last.testId)!)} testing on ${last.sampleType}.` : "") +
      " Which test can I quote for you today?";
    chips = catalog.map(shortTestName);
  } else {
    draft.awaiting = "identity";
    events.push({ kind: "db", label: "Number not found in customer database", detail: "Treating as a new customer" });
    body = `Hello 👋 Welcome to ${LAB}. I can prepare a quotation for any of our tests in a couple of minutes. May I have your name and company?`;
    chips = [];
  }
  const id = await createConversation(customerId, profile ? "collecting" : "identify", draft);
  await addMessage(id, "agent", body, { chips });
  await addEvents(id, [{ kind: "info", label: "Conversation started" }, ...events]);
  return id;
}

function describe(ex: Extraction, testNames: Map<string, string>): string {
  const parts = [`intent: ${ex.intent}`];
  if (ex.testIds.length) parts.push(`tests: ${ex.testIds.map((id) => testNames.get(id) ?? id).join(", ")}`);
  if (ex.unknownTests.length) parts.push(`unlisted: ${ex.unknownTests.join(", ")}`);
  if (ex.sampleType) parts.push(`sample: "${ex.sampleType}"`);
  if (ex.samples !== null) parts.push(`samples: ${ex.samples}`);
  if (ex.name || ex.company) parts.push(`contact: ${[ex.name, ex.company].filter(Boolean).join(" / ")}`);
  if (ex.note) parts.push(`(${ex.note})`);
  return parts.join(" · ");
}

export async function handleMessage(conversationId: string, text: string): Promise<boolean> {
  await ensureDemoData();
  const conversation = await getConversation(conversationId);
  if (!conversation) return false;
  const [catalog, sampleTypes, gstRate, profile] = await Promise.all([
    getCatalog(), getSampleTypes(), getGstRate(),
    conversation.customerId ? getCustomerProfile(conversation.customerId) : Promise.resolve(null),
  ]);

  await addMessage(conversationId, "customer", text);
  const ex = await extract(text, { catalog, sampleTypes, state: conversation.state, awaiting: conversation.draft.awaiting });
  const testNames = new Map(catalog.map((t) => [t.id, shortTestName(t)]));
  const events: TraceEvent[] = [{ kind: "ai", label: ex.engine === "gemini" ? "AI read the message (Gemini)" : "Message read by fallback parser", detail: describe(ex, testNames) }];

  const step = nextStep({
    state: conversation.state,
    draft: conversation.draft,
    pastSampleTypes: [...new Set(profile?.orders.map((o) => o.sampleType) ?? [])],
    catalog,
    sampleTypes,
  }, ex);
  events.push(...step.events);

  const draft = step.draft;
  let main = step.ask ?? "";
  const meta: MessageMeta = { chips: step.chips };

  if (step.action === "quote") {
    const tests = draft.testIds.map((id) => catalog.find((t) => t.id === id)!);
    const quote = buildQuote(tests, draft.sampleType!, draft.samples!, gstRate);
    const who = profile
      ? { customerId: profile.customer.id, name: profile.customer.name, company: profile.customer.company, gstNo: profile.customer.gstNo, city: profile.customer.city }
      : { customerId: null, name: draft.name ?? "Customer", company: draft.company ?? "", gstNo: null, city: null };
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

  const reply = [...step.notes, main].filter(Boolean).join("\n\n");
  await addMessage(conversationId, "agent", reply, meta);
  await addEvents(conversationId, events);
  await saveConversation(conversationId, step.state, draft, conversation.needsStaff || step.flags.length > 0);
  return true;
}
