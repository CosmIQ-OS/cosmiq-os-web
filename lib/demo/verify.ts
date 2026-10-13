import type { Customer, Draft } from "./types";

// CONTRACT
// GUARANTEES: checks name, phone and (when registered) GST against a database record.
// EXPECTS: formatted fields validated by the workflow; stored phone includes country code.
// FAILURE BEHAVIOR: reports mismatched field names, never discloses the stored values.
// DOES NOT: use AI judgement, verify phone ownership or require a delivery email.
// KNOWN LIMITATIONS: demo record matching is not authentication; no OTP is implemented.
export const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
export const normaliseGst = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();
export const normalisePhone = (s: string) => s.replace(/\D/g, "");
export const validPhone = (s: string) => /^\+?[\d ()-]+$/.test(s) && /^\d{8,15}$/.test(normalisePhone(s));

function sameName(a: string, b: string): boolean {
  const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  // Case/spacing tolerance only: a first name alone must not verify a different full name.
  return words(a).join(" ") === words(b).join(" ");
}

export interface Check { label: string; ok: boolean | null }
export type Field = "name" | "phone" | "gstNo";
export interface Comparison { checks: Check[]; matched: boolean; mismatched: Field[] }

export function compareWithRecord(given: Pick<Draft, "name" | "phone" | "gstNo" | "noGst">, record: Customer): Comparison {
  const checks: Check[] = [
    { label: "Contact name", ok: !!given.name && sameName(given.name, record.name) },
    { label: "Phone number", ok: !!given.phone && normalisePhone(given.phone) === normalisePhone(record.phone) },
    { label: "GST number", ok: given.gstNo ? normaliseGst(given.gstNo) === normaliseGst(record.gstNo) : given.noGst && !record.gstNo },
  ];
  const fields: Field[] = ["name", "phone", "gstNo"];
  const mismatched = fields.filter((_, i) => !checks[i].ok);
  return { checks, matched: mismatched.length === 0, mismatched };
}

export type Outcome = "verified" | "new" | "retry" | "unverified";
export function decideVerification(record: Customer | null, comparison: Comparison | null, attempts: number): Outcome {
  if (!record || !comparison) return "new";
  if (comparison.matched) return "verified";
  return attempts === 0 ? "retry" : "unverified";
}
export const FIELD_LABEL: Record<Field, string> = { name: "full name", phone: "phone number (including country code)", gstNo: "GST number" };
export function listWords(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
