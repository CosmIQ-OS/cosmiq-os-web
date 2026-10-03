import crypto from "node:crypto";
import { query } from "./db";
import type { Enquiry, EnquiryInput } from "./validation";

let ready: Promise<unknown> | undefined;

function ensureSchema() {
  ready ??= query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      domain TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      automations TEXT NOT NULL,
      notes TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      source TEXT NOT NULL
    )
  `).catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

export async function readEnquiries(): Promise<Enquiry[]> {
  await ensureSchema();
  const rows = await query("SELECT * FROM enquiries ORDER BY created_at DESC");
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    role: String(row.role),
    domain: String(row.domain),
    email: String(row.email),
    phone: String(row.phone),
    automations: JSON.parse(String(row.automations)) as string[],
    notes: String(row.notes),
    status: "new",
    createdAt: String(row.created_at),
    source: String(row.source),
  }));
}

export async function saveEnquiry(input: EnquiryInput): Promise<Enquiry> {
  await ensureSchema();
  const row: Enquiry = {
    ...input,
    id: crypto.randomUUID(),
    status: "new",
    createdAt: new Date().toISOString(),
    source: "cosmiq-os-web",
  };
  await query(
    `INSERT INTO enquiries
      (id, name, role, domain, email, phone, automations, notes, status, created_at, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [row.id, row.name, row.role ?? "", row.domain, row.email,
      row.phone ?? "", JSON.stringify(row.automations), row.notes ?? "",
      row.status, row.createdAt, row.source],
  );
  return row;
}
