import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import type { Enquiry, EnquiryInput } from "./validation";

const url = process.env.LIBSQL_DATABASE_URL ?? "file:./data/enquiries.db";

function assertConfigured() {
  if (url.startsWith("file:") && process.env.VERCEL) {
    throw new Error(
      "Set LIBSQL_DATABASE_URL to a persistent remote database before deploying. " +
        "Local file storage is not available on hosted serverless runtimes."
    );
  }
}

if (!url.startsWith("file:") || !process.env.VERCEL) {
  if (url.startsWith("file:")) fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

const db = createClient({ url, authToken: process.env.LIBSQL_AUTH_TOKEN });
let ready: Promise<unknown> | undefined;

function ensureSchema() {
  assertConfigured();
  ready ??= db.execute(`
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
  const result = await db.execute("SELECT * FROM enquiries ORDER BY created_at DESC");
  return result.rows.map((row) => ({
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
  await db.execute({
    sql: `INSERT INTO enquiries
      (id, name, role, domain, email, phone, automations, notes, status, created_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [row.id, row.name, row.role ?? "", row.domain, row.email,
      row.phone ?? "", JSON.stringify(row.automations), row.notes ?? "",
      row.status, row.createdAt, row.source],
  });
  return row;
}
