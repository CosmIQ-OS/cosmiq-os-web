import crypto from "node:crypto";
import { query, transaction, type Row, type Statement } from "@/lib/db";
import seed from "./seed-data.json";
import type { ConvState, Customer, Draft, LabTest, PastOrder, TraceEvent } from "./types";

// Seed tables mirror the lab's system (stand-in for QLIMS). Demo tables hold what the
// prototype creates and are wiped by resetDemo(); seeded rows are never modified.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS lab_tests (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
    method TEXT NOT NULL, certification TEXT NOT NULL, tat_days INT NOT NULL, fee_inr INT NOT NULL, sample_required TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS lab_customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL,
    gst_no TEXT NOT NULL, company TEXT NOT NULL, city TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS lab_orders (id TEXT PRIMARY KEY, order_date DATE NOT NULL, customer_id TEXT, customer_name TEXT NOT NULL,
    company TEXT NOT NULL, test_id TEXT NOT NULL, sample_type TEXT NOT NULL, samples INT NOT NULL, fee_inr INT NOT NULL,
    gst_inr INT NOT NULL, total_inr INT NOT NULL, certification TEXT NOT NULL, status TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'seed')`,
  `CREATE TABLE IF NOT EXISTS lab_sample_types (name TEXT PRIMARY KEY)`,
  `CREATE TABLE IF NOT EXISTS lab_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS demo_conversations (id TEXT PRIMARY KEY, customer_id TEXT, state TEXT NOT NULL, draft JSONB NOT NULL,
    needs_staff BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  // Added for customer verification (idempotent on databases created before it).
  `ALTER TABLE lab_customers ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'seed'`,
  `ALTER TABLE demo_conversations ADD COLUMN IF NOT EXISTS persona_id TEXT`,
  // WhatsApp is a channel on the same conversation model; web rows keep the default.
  `ALTER TABLE demo_conversations ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web'`,
  `ALTER TABLE demo_conversations ADD COLUMN IF NOT EXISTS external_id TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS one_whatsapp_conversation_per_number
    ON demo_conversations (external_id) WHERE channel = 'whatsapp'`,
  `CREATE TABLE IF NOT EXISTS whatsapp_inbound (message_id TEXT PRIMARY KEY, conversation_id TEXT, reply TEXT,
    status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS demo_messages (id BIGSERIAL PRIMARY KEY, conversation_id TEXT NOT NULL, sender TEXT NOT NULL,
    body TEXT NOT NULL, meta JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS demo_events (id BIGSERIAL PRIMARY KEY, conversation_id TEXT NOT NULL, kind TEXT NOT NULL,
    label TEXT NOT NULL, detail TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `ALTER TABLE demo_conversations ADD COLUMN IF NOT EXISTS processing_token TEXT`,
  `ALTER TABLE demo_conversations ADD COLUMN IF NOT EXISTS processing_until TIMESTAMPTZ`,
  // Chats that stopped at the old email/approval step are now terminal confirmations.
  `UPDATE demo_conversations SET state = 'confirmed', draft = draft - 'email' - 'quotationId' - 'orderIds'
    WHERE state IN ('email', 'pending_approval')`,
];

// Builds "($1,$2),($3,$4)…" so each seed table loads in one round trip.
function insertMany(table: string, columns: string[], rows: unknown[][]) {
  const values = rows.map((r, i) => `(${r.map((_, j) => `$${i * columns.length + j + 1}`).join(",")})`).join(",");
  return query(`INSERT INTO ${table} (${columns.join(",")}) VALUES ${values} ON CONFLICT DO NOTHING`, rows.flat());
}

let ready: Promise<void> | undefined;

export function ensureDemoData(): Promise<void> {
  ready ??= (async () => {
    for (const statement of SCHEMA) await query(statement);
    const [{ n }] = await query<{ n: number }>("SELECT count(*)::int AS n FROM lab_tests");
    if (n > 0) return;
    await insertMany("lab_tests", ["id", "name", "category", "method", "certification", "tat_days", "fee_inr", "sample_required"],
      seed.tests.map((t) => [t.id, t.name, t.category, t.method, t.certification, t.tatDays, t.feeInr, t.sampleRequired]));
    await insertMany("lab_customers", ["id", "name", "phone", "email", "gst_no", "company", "city"],
      seed.customers.map((c) => [c.id, c.name, c.phone, c.email, c.gstNo, c.company, c.city]));
    const companyOf = new Map(seed.customers.map((c) => [c.id, c.company]));
    const nameOf = new Map(seed.customers.map((c) => [c.id, c.name]));
    await insertMany("lab_orders", ["id", "order_date", "customer_id", "customer_name", "company", "test_id", "sample_type",
      "samples", "fee_inr", "gst_inr", "total_inr", "certification", "status"],
      seed.orders.map((o) => [o.id, o.orderDate, o.customerId, nameOf.get(o.customerId) ?? "", companyOf.get(o.customerId) ?? "",
        o.testId, o.sampleType, o.samples, o.feeInr, o.gstInr, o.totalInr, o.certification, o.status]));
    await insertMany("lab_sample_types", ["name"], seed.sampleTypes.map((s) => [s]));
    await insertMany("lab_settings", ["key", "value"], [["gst_rate", String(seed.gstRate)]]);
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

const toTest = (r: Row): LabTest => ({
  id: String(r.id), name: String(r.name), category: String(r.category), method: String(r.method),
  certification: String(r.certification), tatDays: Number(r.tat_days), feeInr: Number(r.fee_inr),
  sampleRequired: String(r.sample_required),
});
const toCustomer = (r: Row): Customer => ({
  id: String(r.id), name: String(r.name), phone: String(r.phone), email: String(r.email),
  gstNo: String(r.gst_no), company: String(r.company), city: String(r.city),
});
const iso = (v: unknown) => new Date(v as string | Date).toISOString();

export async function getCatalog(): Promise<LabTest[]> {
  return (await query("SELECT * FROM lab_tests ORDER BY id")).map(toTest);
}

export async function getSampleTypes(): Promise<string[]> {
  return (await query<{ name: string }>("SELECT name FROM lab_sample_types ORDER BY name")).map((r) => r.name);
}

export async function listCustomers() {
  const rows = await query(`
    SELECT c.*, count(o.id)::int AS orders, coalesce(sum(o.total_inr), 0)::int AS billed
    FROM lab_customers c LEFT JOIN lab_orders o ON o.customer_id = c.id
    WHERE c.source = 'seed'
    GROUP BY c.id ORDER BY c.id`);
  return rows.map((r) => ({ ...toCustomer(r), orders: Number(r.orders), billedInr: Number(r.billed) }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const [row] = await query("SELECT * FROM lab_customers WHERE id = $1", [id]);
  return row ? toCustomer(row) : null;
}

// A GST lookup takes precedence, but all three fields are checked after lookup.
export async function findCustomerForVerification(gstNo: string | null, phone: string): Promise<Customer | null> {
  const rows = await query(
    `SELECT *, (upper(gst_no) = $1) AS gst_match FROM lab_customers
     WHERE ($1 <> '' AND upper(gst_no) = $1) OR regexp_replace(phone, '[^0-9]', '', 'g') = $2
     ORDER BY gst_match DESC, id LIMIT 1`,
    [gstNo ?? "", phone],
  );
  return rows[0] ? toCustomer(rows[0]) : null;
}

export async function getCustomerProfile(id: string): Promise<{ customer: Customer; orders: PastOrder[] } | null> {
  const [row] = await query("SELECT * FROM lab_customers WHERE id = $1", [id]);
  if (!row) return null;
  const orders = await query(`
    SELECT o.id, to_char(o.order_date, 'YYYY-MM-DD') AS order_date, o.test_id, t.name AS test_name, o.sample_type, o.samples, o.total_inr, o.status
    FROM lab_orders o JOIN lab_tests t ON t.id = o.test_id
    WHERE o.customer_id = $1 ORDER BY o.order_date DESC, o.id DESC`, [id]);
  return {
    customer: toCustomer(row),
    orders: orders.map((o) => ({
      id: String(o.id), orderDate: String(o.order_date), testId: String(o.test_id), testName: String(o.test_name),
      sampleType: String(o.sample_type), samples: Number(o.samples), totalInr: Number(o.total_inr), status: String(o.status),
    })),
  };
}

export interface Conversation {
  id: string;
  customerId: string | null; // set once the customer is verified or registered
  personaId: string | null; // sample customer the presenter is chatting as (drives demo shortcuts)
  state: ConvState;
  draft: Draft;
  needsStaff: boolean;
}

export async function createConversation(personaId: string | null, state: ConvState, draft: Draft): Promise<string> {
  const id = crypto.randomUUID();
  await query("INSERT INTO demo_conversations (id, persona_id, state, draft) VALUES ($1, $2, $3, $4)",
    [id, personaId, state, JSON.stringify(draft)]);
  return id;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const [r] = await query("SELECT * FROM demo_conversations WHERE id = $1", [id]);
  if (!r) return null;
  const draft = typeof r.draft === "string" ? JSON.parse(r.draft) : r.draft;
  return {
    id: String(r.id), customerId: draft.workflowVersion === 2 && r.customer_id ? String(r.customer_id) : null, personaId: r.persona_id ? String(r.persona_id) : null,
    state: r.state as ConvState, draft, needsStaff: Boolean(r.needs_staff),
  };
}

// One active WhatsApp conversation per number. The partial unique index resolves concurrent first messages.
export async function getOrCreateWhatsAppConversation(waId: string, draft: Draft): Promise<{ id: string; created: boolean }> {
  const id = crypto.randomUUID();
  const inserted = await query<{ id: string }>(
    `INSERT INTO demo_conversations (id, channel, external_id, state, draft)
     VALUES ($1, 'whatsapp', $2, 'requesting', $3)
     ON CONFLICT (external_id) WHERE channel = 'whatsapp' DO NOTHING RETURNING id`,
    [id, waId, JSON.stringify(draft)],
  );
  if (inserted.length) return { id: String(inserted[0].id), created: true };
  const [row] = await query<{ id: string }>(
    "SELECT id FROM demo_conversations WHERE channel = 'whatsapp' AND external_id = $1", [waId],
  );
  if (!row) throw new Error("Could not open a WhatsApp conversation.");
  return { id: String(row.id), created: false };
}

// Detach the completed chat instead of deleting it, so staff can still reach its quotation.
export async function restartWhatsAppConversation(waId: string, draft: Draft): Promise<{ id: string; created: boolean }> {
  await query("UPDATE demo_conversations SET external_id = NULL WHERE channel = 'whatsapp' AND external_id = $1", [waId]);
  return getOrCreateWhatsAppConversation(waId, draft);
}

export async function getLastAgentMessageId(conversationId: string): Promise<number> {
  const [row] = await query<{ id: string | null }>(
    "SELECT max(id)::text AS id FROM demo_messages WHERE conversation_id = $1 AND sender = 'agent'", [conversationId],
  );
  return row?.id ? Number(row.id) : 0;
}

export async function getAgentMessagesAfter(conversationId: string, afterId: number): Promise<string[]> {
  const rows = await query<{ body: string }>(
    "SELECT body FROM demo_messages WHERE conversation_id = $1 AND sender = 'agent' AND id > $2 ORDER BY id",
    [conversationId, afterId],
  );
  return rows.map((row) => String(row.body));
}

export type InboundClaimState = "new" | "retry" | "ready" | "done" | "busy";
export interface InboundClaim {
  state: InboundClaimState;
  reply?: string;
  conversationId?: string | null;
}

// CONTRACT
// GUARANTEES: a Meta message id is processed at most once; a stored reply survives send failures.
// FAILURE BEHAVIOR: a fresh in-flight claim is reported busy; a claim older than 90 seconds is reclaimed.
// DOES NOT: run the workflow, send messages or infer delivery from a claim.
export async function claimInboundMessage(messageId: string): Promise<InboundClaim> {
  const inserted = await query(
    "INSERT INTO whatsapp_inbound (message_id, status) VALUES ($1, 'processing') ON CONFLICT DO NOTHING RETURNING message_id",
    [messageId],
  );
  if (inserted.length) return { state: "new" };
  const [row] = await query<{
    conversation_id: string | null; reply: string | null; status: string; stale: boolean;
  }>(
    `SELECT conversation_id, reply, status, updated_at < now() - interval '90 seconds' AS stale
     FROM whatsapp_inbound WHERE message_id = $1`, [messageId],
  );
  if (!row) return { state: "new" };
  if (row.status === "done") return { state: "done" };
  if (row.status === "ready") {
    return { state: "ready", reply: row.reply ?? "", conversationId: row.conversation_id };
  }
  if (row.status === "processing" && !row.stale) return { state: "busy" };
  const reclaimed = await query(
    `UPDATE whatsapp_inbound SET status = 'processing', updated_at = now()
     WHERE message_id = $1
       AND (status = 'failed' OR (status = 'processing' AND updated_at < now() - interval '90 seconds'))
     RETURNING message_id`, [messageId],
  );
  return reclaimed.length ? { state: "retry" } : { state: "busy" };
}

export async function setInboundReply(messageId: string, conversationId: string, reply: string) {
  await query(
    `UPDATE whatsapp_inbound SET status = 'ready', conversation_id = $2, reply = $3, updated_at = now()
     WHERE message_id = $1`, [messageId, conversationId, reply],
  );
}

export async function markInboundDone(messageId: string) {
  await query("UPDATE whatsapp_inbound SET status = 'done', updated_at = now() WHERE message_id = $1", [messageId]);
}

export async function markInboundFailed(messageId: string) {
  await query("UPDATE whatsapp_inbound SET status = 'failed', updated_at = now() WHERE message_id = $1", [messageId]);
}

// DB-backed leases work across server processes, unlike an in-memory mutex.
export async function claimConversation(id: string, token: string): Promise<boolean> {
  const rows = await query(`UPDATE demo_conversations SET processing_token = $2,
    processing_until = now() + interval '90 seconds'
    WHERE id = $1 AND (processing_until IS NULL OR processing_until < now()) RETURNING id`, [id, token]);
  return rows.length === 1;
}
export async function releaseConversation(id: string, token: string) {
  await query(`UPDATE demo_conversations SET processing_token = NULL, processing_until = NULL
    WHERE id = $1 AND processing_token = $2`, [id, token]);
}

export type Chip = string | { label: string; text: string }; // label shown, text sent

export interface MessageMeta {
  chips?: Chip[];
  verification?: { steps: Array<{ label: string; ok: boolean | null }>; result: string; outcome: string };
}

export async function addMessage(conversationId: string, sender: "customer" | "agent", body: string, meta?: MessageMeta) {
  await query("INSERT INTO demo_messages (conversation_id, sender, body, meta) VALUES ($1, $2, $3, $4)",
    [conversationId, sender, body, meta ? JSON.stringify(meta) : null]);
}

export async function addEvents(conversationId: string, events: TraceEvent[]) {
  if (events.length === 0) return;
  await insertMany("demo_events", ["conversation_id", "kind", "label", "detail"],
    events.map((e) => [conversationId, e.kind, e.label, e.detail ?? null]));
}

export class ConversationLeaseLost extends Error {}
// CONTRACT
// GUARANTEES: draft, customer message, reply and events commit together or not at all.
// EXPECTS: active processing token.
// FAILURE BEHAVIOR: a reclaimed/expired lease aborts the entire batch.
// DOES NOT: create quotations, send email or approve anything.
export async function finishConversation(input: {
  id: string; token: string; state: ConvState; draft: Draft; needsStaff: boolean; customerId: string | null;
  text: string; reply: string; meta: MessageMeta; events: TraceEvent[];
}) {
  const { id, token, state, draft, needsStaff, customerId, text, reply, meta, events } = input;
  const statements: Statement[] = [
    { text: `UPDATE demo_conversations SET state = $3, draft = $4, needs_staff = $5, customer_id = $6
      WHERE id = $1 AND processing_token = $2 AND processing_until > now() RETURNING id`,
      params: [id, token, state, JSON.stringify(draft), needsStaff, customerId] },
    // SQL assertion keeps this atomic on both batch-only Neon HTTP and PGlite.
    { text: `SELECT 1 / count(*)::int AS lease_guard FROM demo_conversations
      WHERE id = $1 AND processing_token = $2 AND processing_until > now()`, params: [id, token] },
    { text: `INSERT INTO demo_messages (conversation_id, sender, body, meta)
      VALUES ($1, 'customer', $2, NULL), ($1, 'agent', $3, $4)`, params: [id, text, reply, JSON.stringify(meta)] },
  ];
  if (events.length) statements.push({ text: `INSERT INTO demo_events (conversation_id, kind, label, detail)
    SELECT $1, kind, label, detail FROM jsonb_to_recordset($2::jsonb) AS e(kind text, label text, detail text)`,
    params: [id, JSON.stringify(events)] });
  try { await transaction(statements); }
  catch (error) {
    if ((error as { code?: string }).code === "22012") throw new ConversationLeaseLost("This chat was updated by another request. Please refresh and try again.");
    throw error;
  }
}

export async function getConversationView(id: string) {
  const conversation = await getConversation(id);
  if (!conversation) return null;
  const [messages, events, profile] = await Promise.all([
    query("SELECT id, sender, body, meta, created_at FROM demo_messages WHERE conversation_id = $1 ORDER BY id", [id]),
    query("SELECT id, kind, label, detail, created_at FROM demo_events WHERE conversation_id = $1 ORDER BY id", [id]),
    conversation.customerId ? getCustomerProfile(conversation.customerId) : Promise.resolve(null),
  ]);
  const json = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);
  return {
    conversation,
    profile,
    messages: messages.map((m) => ({ id: Number(m.id), sender: String(m.sender), body: String(m.body), meta: (m.meta ? json(m.meta) : null) as MessageMeta | null, at: iso(m.created_at) })),
    events: events.map((e) => ({ id: Number(e.id), kind: String(e.kind), label: String(e.label), detail: e.detail ? String(e.detail) : null, at: iso(e.created_at) })),
  };
}

export type ConversationView = NonNullable<Awaited<ReturnType<typeof getConversationView>>>;

export async function resetDemo() {
  await transaction([
    { text: "LOCK TABLE demo_conversations IN EXCLUSIVE MODE" },
    { text: "DELETE FROM lab_orders WHERE source = 'demo'" },
    { text: "DELETE FROM lab_customers WHERE source = 'demo'" },
    { text: "DELETE FROM demo_events" },
    { text: "DELETE FROM demo_messages" },
    { text: "DELETE FROM whatsapp_inbound" },
    { text: "DELETE FROM demo_conversations" },
  ]);
}
