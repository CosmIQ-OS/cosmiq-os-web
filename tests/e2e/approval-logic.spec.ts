import { test, expect } from "@playwright/test";
import { query } from "../../lib/db";
import { ConversationBusy, handleMessage, startConversation } from "../../lib/demo/agent";
import { claimConversation, ensureDemoData, finishConversation, getConversationView, getQuotation, releaseConversation, resetDemo } from "../../lib/demo/data";
import { actOnQuotation } from "../../lib/quotations/approval";
import { claimSend, recordFailed, recordSent } from "../../lib/quotations/store";
import { sendQuotationEmail } from "../../lib/quotations/email";
import { quotationPdf } from "../../lib/demo/pdf";
import seed from "../../lib/demo/seed-data.json";

// Real domain + real isolated Postgres + real HTTP adapter; only the external provider is a fake.
test.describe.configure({ mode: "serial" });
test.beforeEach(({}, info) => test.skip(info.project.name !== "chromium", "integration rules run once"));
test.beforeAll(async ({}, info) => {
  if (info.project.name !== "chromium") return;
  process.env.DATABASE_URL = ""; process.env.VERCEL = ""; process.env.PGLITE_DIR = "memory://";
  process.env.GEMINI_API_KEY = ""; process.env.RESEND_API_KEY = "test-resend-key";
  process.env.QUOTATION_EMAIL_FROM = "FQLab <test@example.com>";
  process.env.QUOTATION_EMAIL_TEST_URL = "http://127.0.0.1:3101/emails";
  await ensureDemoData();
  // Keep test-process IDs separate from the production test-server's IDs at the mail boundary.
  await query("SELECT setval('demo_quote_number', 20000)");
});
const arun = seed.customers[0];
const details = `${arun.name}, phone ${arun.phone}, GST ${arun.gstNo}`;
async function submitted(email: string) {
  const id = await startConversation(arun.id);
  for (const message of ["aflatoxin for chilli, 3 samples", details, "Confirm", email]) {
    expect(await handleMessage(id, message)).toBe(true);
  }
  const view = (await getConversationView(id))!;
  expect(view.conversation.state).toBe("pending_approval");
  return (await getQuotation(view.conversation.draft.quotationId!))!;
}
async function mail(id: string) {
  return (await fetch(`http://127.0.0.1:3101/?key=${encodeURIComponent(`quotation/${id}`)}`)).json();
}

test("full domain flow retains multi-service request and sends no quotation/order before approval", async () => {
  const id = await startConversation(arun.id);
  await handleMessage(id, "pesticide and aflatoxin for pepper, 2 samples");
  let view = (await getConversationView(id))!;
  expect(view.conversation.state).toBe("identify");
  expect(view.quotations).toEqual([]);
  await handleMessage(id, details);
  view = (await getConversationView(id))!;
  expect(view.conversation.state).toBe("confirming");
  expect(view.conversation.draft.email).toBeNull();
  expect(view.messages.at(-1)!.body).toContain("Pesticide Residue, Aflatoxin");
  await handleMessage(id, "Confirm"); await handleMessage(id, "multi@example.com");
  view = (await getConversationView(id))!;
  expect(view.quotations).toHaveLength(1); expect(view.orders).toEqual([]);
  expect(view.messages.at(-1)!.meta?.quote).toBeUndefined();
  const quotation = (await getQuotation(view.quotations[0].id))!;
  expect([quotation.quote.subtotalInr, quotation.quote.gstInr, quotation.quote.totalInr]).toEqual([15400, 2772, 18172]);
  expect(quotation.approvedAt).toBeNull(); expect((await mail(quotation.id)).attempts).toHaveLength(0);
});

test("new/no-GST customer remains staff-reviewed and is not silently added to the verified database", async () => {
  const id = await startConversation(null);
  for (const text of ["micro for pepper, 1 sample", "Meera Menon, phone +91 9876543211, no GST", "Confirm", "meera@example.com"]) await handleMessage(id, text);
  const view = (await getConversationView(id))!;
  expect(view.conversation.draft.verification).toBe("new"); expect(view.profile).toBeNull();
  expect(view.conversation.needsStaff).toBe(true);
  const q = view.conversation.draft.quotationId!;
  await expect(actOnQuotation(q, "approve", false)).rejects.toMatchObject({ status: 400 });
  expect((await actOnQuotation(q, "approve", true)).status).toBe("sent");
});

test("invalid email and changed selections cannot bypass explicit confirmation", async () => {
  const id = await startConversation(arun.id);
  for (const text of ["afla for chilli, 2 samples", details, "Confirm", "not-an-email"]) await handleMessage(id, text);
  let view = (await getConversationView(id))!;
  expect(view.conversation.state).toBe("email"); expect(view.quotations).toEqual([]);
  await handleMessage(id, "5 samples, correction@example.com");
  view = (await getConversationView(id))!;
  expect(view.conversation.state).toBe("confirming");
  await handleMessage(id, "early@example.com");
  expect((await getConversationView(id))!.quotations).toEqual([]);
  await handleMessage(id, "Confirm"); await handleMessage(id, "final@example.com");
  view = (await getConversationView(id))!;
  expect(view.conversation.draft.samples).toBe(5); expect(view.quotations).toHaveLength(1);
  await handleMessage(id, "100 samples, replacement@example.com");
  const frozen = (await getConversationView(id))!;
  expect(frozen.conversation.draft.samples).toBe(5);
  expect(frozen.conversation.draft.email).toBe("final@example.com"); expect(frozen.quotations).toHaveLength(1);
});

test("legacy chats in all old states cannot submit or expose customer history", async () => {
  for (const state of ["identify", "collecting", "quoted", "ordered"]) {
    const id = await startConversation(arun.id);
    const initial = (await getConversationView(id))!.conversation.draft;
    const { workflowVersion: _version, phone: _phone, ...legacy } = initial;
    await query("UPDATE demo_conversations SET state = $2, draft = $3, customer_id = $4 WHERE id = $1", [id, state,
      JSON.stringify({ ...legacy, verification: "verified", name: arun.name, gstNo: arun.gstNo,
        testIds: ["T001"], sampleType: "Black Pepper", samples: 3, email: arun.email }), arun.id]);
    expect((await getConversationView(id))!.profile).toBeNull();
    await handleMessage(id, "Confirm");
    const view = (await getConversationView(id))!;
    expect(view.messages.at(-1)!.body).toContain("Please start a new chat");
    expect(view.profile).toBeNull(); expect(view.quotations).toEqual([]);
  }
});

test("a database failure during submission rolls back quote, snapshot, messages and events together", async () => {
  const id = await startConversation(arun.id);
  for (const text of ["afla for chilli, 2 samples", details, "Confirm"]) await handleMessage(id, text);
  const before = (await getConversationView(id))!;
  await query("ALTER TABLE demo_quotations ADD CONSTRAINT submission_fault CHECK (recipient <> 'force-db-failure@example.com')");
  try {
    await expect(handleMessage(id, "force-db-failure@example.com")).rejects.toMatchObject({ code: "23514" });
  } finally { await query("ALTER TABLE demo_quotations DROP CONSTRAINT submission_fault"); }
  const rolledBack = (await getConversationView(id))!;
  expect(rolledBack.conversation.draft).toEqual(before.conversation.draft);
  expect(rolledBack.messages).toEqual(before.messages); expect(rolledBack.events).toEqual(before.events);
  expect(rolledBack.quotations).toEqual([]); expect(rolledBack.conversation.state).toBe("email");
  await handleMessage(id, "corrected-after-failure@example.com");
  const retried = (await getConversationView(id))!;
  const quotation = (await getQuotation(retried.conversation.draft.quotationId!))!;
  expect(quotation.recipient).toBe(retried.conversation.draft.email);
  expect(quotation.recipient).toBe("corrected-after-failure@example.com");
});

test("an expired conversation attempt cannot write after a new token claims it", async () => {
  const id = await startConversation(arun.id);
  const original = (await getConversationView(id))!;
  expect(await claimConversation(id, "old-token")).toBe(true);
  await query("UPDATE demo_conversations SET processing_until = now() - interval '1 minute' WHERE id = $1", [id]);
  expect(await claimConversation(id, "new-token")).toBe(true);
  await expect(finishConversation({ id, token: "old-token", state: "collecting", draft: original.conversation.draft,
    customerId: arun.id, needsStaff: false, text: "stale input", reply: "stale reply", meta: {}, events: [] }))
    .rejects.toThrow("updated by another request");
  expect((await getConversationView(id))!.messages).toEqual(original.messages);
  await releaseConversation(id, "old-token");
  expect(await claimConversation(id, "third-token")).toBe(false);
  await releaseConversation(id, "new-token");
});

test("missing email configuration leaves a quotation pending, not approved or falsely sent", async () => {
  const q = await submitted("unconfigured@example.com");
  const key = process.env.RESEND_API_KEY;
  try {
    delete process.env.RESEND_API_KEY;
    await expect(actOnQuotation(q.id, "approve", false)).rejects.toMatchObject({ status: 503 });
  } finally { process.env.RESEND_API_KEY = key; }
  const unchanged = (await getQuotation(q.id))!;
  expect([unchanged.status, unchanged.approvedAt, unchanged.sentAt]).toEqual(["pending_approval", null, null]);
  expect((await mail(q.id)).attempts).toHaveLength(0);
});

test("simultaneous approvals submit exactly one email", async () => {
  const q = await submitted("slow-concurrent@example.com");
  const results = await Promise.allSettled([actOnQuotation(q.id, "approve", false), actOnQuotation(q.id, "approve", false)]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect((await mail(q.id)).attempts).toHaveLength(1);
  expect((await getQuotation(q.id))!.status).toBe("sent");
});

test("an ambiguous provider failure retries the same payload without creating a second accepted email", async () => {
  const q = await submitted("ambiguous-once@example.com");
  await expect(actOnQuotation(q.id, "approve", false)).rejects.toMatchObject({ status: 502 });
  expect((await getQuotation(q.id))!.status).toBe("email_failed");
  const first = await mail(q.id);
  expect(first.accepted).not.toBeNull();
  const retried = await actOnQuotation(q.id, "retry", false);
  expect(retried.providerId).toBe(first.accepted.id);
  const final = await mail(q.id);
  expect(final.attempts).toHaveLength(2); expect(final.attempts[0]).toEqual(final.attempts[1]);
});

test("stale sending lease recovers after a crash with the same stored PDF/key", async () => {
  const q = await submitted("stale@example.com");
  const pdf = Buffer.from(await quotationPdf(q)).toString("base64");
  const claimed = (await claimSend(q.id, "approve", pdf, process.env.QUOTATION_EMAIL_FROM!))!;
  const accepted = await sendQuotationEmail({ quotationId: q.id, from: claimed.emailFrom!, to: claimed.recipient!, customerName: q.customerName, attachmentBase64: pdf });
  // Simulate acceptance followed by process death before recording it.
  await query("UPDATE demo_quotations SET send_started_at = now() - interval '3 minutes' WHERE id = $1", [q.id]);
  const recovered = await actOnQuotation(q.id, "retry", false);
  expect(recovered.providerId).toBe(accepted);
  const recorded = (await getQuotation(q.id))!;
  expect(recorded.attachmentBase64).toBe(pdf); expect(recorded.status).toBe("sent");
});

test("expired idempotency window blocks resend rather than risking duplicate mail", async () => {
  const q = await submitted("always-fail-expired@example.com");
  await expect(actOnQuotation(q.id, "approve", false)).rejects.toMatchObject({ status: 502 });
  await query("UPDATE demo_quotations SET approved_at = now() - interval '25 hours' WHERE id = $1", [q.id]);
  await expect(actOnQuotation(q.id, "retry", false)).rejects.toMatchObject({ status: 409 });
  expect((await mail(q.id)).attempts).toHaveLength(1);
});

test("completion from an expired email attempt cannot overwrite a reclaimed attempt", async () => {
  const q = await submitted("fenced@example.com");
  const pdf = Buffer.from(await quotationPdf(q)).toString("base64");
  const old = (await claimSend(q.id, "approve", pdf, process.env.QUOTATION_EMAIL_FROM!))!;
  await query("UPDATE demo_quotations SET send_started_at = now() - interval '3 minutes' WHERE id = $1", [q.id]);
  const current = (await claimSend(q.id, "retry", pdf, process.env.QUOTATION_EMAIL_FROM!))!;
  expect(current.sendToken).not.toBe(old.sendToken);
  expect(await recordFailed(q.id, old.sendToken!, "late failure")).toBe(false);
  expect(await recordSent(q.id, old.sendToken!, "old-provider-id")).toBe(false);
  expect((await getQuotation(q.id))!.status).toBe("sending");
  expect(await recordSent(q.id, current.sendToken!, "current-provider-id")).toBe(true);
  const final = (await getQuotation(q.id))!;
  expect([final.status, final.providerId]).toEqual(["sent", "current-provider-id"]);
});

test("overlapping customer messages are serialised by a database lease", async () => {
  const id = await startConversation(arun.id);
  const outcomes = await Promise.allSettled([handleMessage(id, "aflatoxin for pepper"), handleMessage(id, "micro for pepper")]);
  expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const denied = outcomes.find((r) => r.status === "rejected") as PromiseRejectedResult;
  expect(denied.reason).toBeInstanceOf(ConversationBusy);
  const view = (await getConversationView(id))!;
  expect(view.messages.filter((m) => m.sender === "customer")).toHaveLength(1);
  // Lease is released, so a subsequent message proceeds.
  expect(await handleMessage(id, details)).toBe(true);
});

test("staff reset refuses unresolved emails and preserves every seeded record", async () => {
  const q = await submitted("reset@example.com");
  const pdf = Buffer.from(await quotationPdf(q)).toString("base64");
  await claimSend(q.id, "approve", pdf, process.env.QUOTATION_EMAIL_FROM!);
  await expect(resetDemo()).rejects.toThrow("Cannot reset");
  await query("UPDATE demo_quotations SET status = 'email_failed' WHERE id = $1", [q.id]);
  await resetDemo();
  const [customers] = await query<{ n: number }>("SELECT count(*)::int AS n FROM lab_customers");
  const [orders] = await query<{ n: number }>("SELECT count(*)::int AS n FROM lab_orders");
  const [chats] = await query<{ n: number }>("SELECT count(*)::int AS n FROM demo_conversations");
  expect([customers.n, orders.n, chats.n]).toEqual([20, 52, 0]);
});

test("overlapping reset and approval cannot send after removing the approval record", async () => {
  const q = await submitted("slow-reset-race@example.com");
  const outcomes = await Promise.allSettled([actOnQuotation(q.id, "approve", false), resetDemo()]);
  const acceptance = await mail(q.id);
  if (outcomes[0].status === "fulfilled") {
    expect(outcomes[1].status).toBe("rejected");
    expect((await getQuotation(q.id))!.status).toBe("sent");
    expect(acceptance.accepted).not.toBeNull();
  } else {
    expect(outcomes[1].status).toBe("fulfilled");
    expect(await getQuotation(q.id)).toBeNull(); expect(acceptance.accepted).toBeNull();
  }
});
