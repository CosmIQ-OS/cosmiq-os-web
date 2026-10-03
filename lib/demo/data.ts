import crypto from "node:crypto";
import { query, type Row } from "@/lib/db";
import { gstAmount, type Quote } from "./pricing";
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
    source TEXT NOT NULL DEFAULT 'seed', quotation_id TEXT)`,
  `CREATE TABLE IF NOT EXISTS lab_sample_types (name TEXT PRIMARY KEY)`,
  `CREATE TABLE IF NOT EXISTS lab_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS demo_conversations (id TEXT PRIMARY KEY, customer_id TEXT, state TEXT NOT NULL, draft JSONB NOT NULL,
    needs_staff BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS demo_messages (id BIGSERIAL PRIMARY KEY, conversation_id TEXT NOT NULL, sender TEXT NOT NULL,
    body TEXT NOT NULL, meta JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS demo_events (id BIGSERIAL PRIMARY KEY, conversation_id TEXT NOT NULL, kind TEXT NOT NULL,
    label TEXT NOT NULL, detail TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS demo_quotations (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, customer_id TEXT,
    customer_name TEXT NOT NULL, company TEXT NOT NULL, gst_no TEXT, city TEXT, quote JSONB NOT NULL, status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
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

export async function getGstRate(): Promise<number> {
  const [row] = await query<{ value: string }>("SELECT value FROM lab_settings WHERE key = 'gst_rate'");
  return Number(row.value);
}

export async function listCustomers() {
  const rows = await query(`
    SELECT c.*, count(o.id)::int AS orders, coalesce(sum(o.total_inr), 0)::int AS billed
    FROM lab_customers c LEFT JOIN lab_orders o ON o.customer_id = c.id
    GROUP BY c.id ORDER BY c.id`);
  return rows.map((r) => ({ ...toCustomer(r), orders: Number(r.orders), billedInr: Number(r.billed) }));
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
  customerId: string | null;
  state: ConvState;
  draft: Draft;
  needsStaff: boolean;
}

export async function createConversation(customerId: string | null, state: ConvState, draft: Draft): Promise<string> {
  const id = crypto.randomUUID();
  await query("INSERT INTO demo_conversations (id, customer_id, state, draft) VALUES ($1, $2, $3, $4)",
    [id, customerId, state, JSON.stringify(draft)]);
  return id;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const [r] = await query("SELECT * FROM demo_conversations WHERE id = $1", [id]);
  if (!r) return null;
  const draft = typeof r.draft === "string" ? JSON.parse(r.draft) : r.draft;
  return { id: String(r.id), customerId: r.customer_id ? String(r.customer_id) : null, state: r.state as ConvState, draft, needsStaff: Boolean(r.needs_staff) };
}

export async function saveConversation(id: string, state: ConvState, draft: Draft, needsStaff: boolean) {
  await query("UPDATE demo_conversations SET state = $2, draft = $3, needs_staff = $4 WHERE id = $1",
    [id, state, JSON.stringify(draft), needsStaff]);
}

export interface MessageMeta {
  chips?: string[];
  quote?: { id: string; totalInr: number; subtotalInr: number; gstInr: number; gstRate: number; tatDays: number;
    lines: Array<{ testName: string; sampleType: string; samples: number; feeInr: number; amountInr: number }> };
  order?: { ids: string[]; status: string };
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

async function nextNumber(sql: string): Promise<number> {
  const [{ n }] = await query<{ n: number | null }>(sql);
  return (n ?? 0) + 1;
}

export async function createQuotation(conversationId: string, who: { customerId: string | null; name: string; company: string;
  gstNo: string | null; city: string | null }, quote: Quote): Promise<string> {
  const year = new Date().getFullYear();
  const n = await nextNumber(`SELECT max(split_part(id, '-', 3)::int) AS n FROM demo_quotations WHERE id LIKE 'Q-${year}-%'`);
  const id = `Q-${year}-${String(n).padStart(4, "0")}`;
  await query(`INSERT INTO demo_quotations (id, conversation_id, customer_id, customer_name, company, gst_no, city, quote, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'issued')`,
    [id, conversationId, who.customerId, who.name, who.company, who.gstNo, who.city, JSON.stringify(quote)]);
  return id;
}

export interface Quotation {
  id: string;
  conversationId: string;
  customerId: string | null;
  customerName: string;
  company: string;
  gstNo: string | null;
  city: string | null;
  quote: Quote;
  status: string;
  createdAt: string;
}

export async function getQuotation(id: string): Promise<Quotation | null> {
  const [r] = await query("SELECT * FROM demo_quotations WHERE id = $1", [id]);
  if (!r) return null;
  return {
    id: String(r.id), conversationId: String(r.conversation_id), customerId: r.customer_id ? String(r.customer_id) : null,
    customerName: String(r.customer_name), company: String(r.company), gstNo: r.gst_no ? String(r.gst_no) : null,
    city: r.city ? String(r.city) : null, quote: typeof r.quote === "string" ? JSON.parse(r.quote) : (r.quote as Quote),
    status: String(r.status), createdAt: iso(r.created_at),
  };
}

// One order per test line, matching how the lab's existing orders are recorded.
export async function createOrders(q: Quotation): Promise<string[]> {
  let n = await nextNumber("SELECT max(split_part(id, '-', 2)::int) AS n FROM lab_orders");
  const today = new Date().toISOString().slice(0, 10);
  const rows = q.quote.lines.map((l) => {
    const gst = gstAmount(l.amountInr, q.quote.gstRate);
    return [`ORD-${n++}`, today, q.customerId, q.customerName, q.company, l.testId, l.sampleType, l.samples,
      l.amountInr, gst, l.amountInr + gst, l.certification, "Awaiting sample", "demo", q.id];
  });
  await insertMany("lab_orders", ["id", "order_date", "customer_id", "customer_name", "company", "test_id", "sample_type",
    "samples", "fee_inr", "gst_inr", "total_inr", "certification", "status", "source", "quotation_id"], rows);
  await query("UPDATE demo_quotations SET status = 'accepted' WHERE id = $1", [q.id]);
  return rows.map((r) => String(r[0]));
}

export async function getConversationView(id: string) {
  const conversation = await getConversation(id);
  if (!conversation) return null;
  const [messages, events, quotations, orders, profile] = await Promise.all([
    query("SELECT id, sender, body, meta, created_at FROM demo_messages WHERE conversation_id = $1 ORDER BY id", [id]),
    query("SELECT id, kind, label, detail, created_at FROM demo_events WHERE conversation_id = $1 ORDER BY id", [id]),
    query("SELECT id, status, quote FROM demo_quotations WHERE conversation_id = $1 ORDER BY created_at", [id]),
    query(`SELECT id, test_id, sample_type, samples, total_inr, status FROM lab_orders
      WHERE quotation_id IN (SELECT id FROM demo_quotations WHERE conversation_id = $1) ORDER BY id`, [id]),
    conversation.customerId ? getCustomerProfile(conversation.customerId) : Promise.resolve(null),
  ]);
  const json = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);
  return {
    conversation,
    profile,
    messages: messages.map((m) => ({ id: Number(m.id), sender: String(m.sender), body: String(m.body), meta: (m.meta ? json(m.meta) : null) as MessageMeta | null, at: iso(m.created_at) })),
    events: events.map((e) => ({ id: Number(e.id), kind: String(e.kind), label: String(e.label), detail: e.detail ? String(e.detail) : null, at: iso(e.created_at) })),
    quotations: quotations.map((q) => ({ id: String(q.id), status: String(q.status), totalInr: Number((json(q.quote) as Quote).totalInr) })),
    orders: orders.map((o) => ({ id: String(o.id), testId: String(o.test_id), sampleType: String(o.sample_type), samples: Number(o.samples), totalInr: Number(o.total_inr), status: String(o.status) })),
  };
}

export type ConversationView = NonNullable<Awaited<ReturnType<typeof getConversationView>>>;

export async function resetDemo() {
  await query("DELETE FROM lab_orders WHERE source = 'demo'");
  await query("DELETE FROM demo_quotations");
  await query("DELETE FROM demo_events");
  await query("DELETE FROM demo_messages");
  await query("DELETE FROM demo_conversations");
}
