import type { Customer, Draft } from "./types";

// CONTRACT
// GUARANTEES: decides verification from the details given and the database record alone.
//   A match needs the email, plus company or contact name, plus the GST number when one was given.
// DOES NOT: reveal the stored record's details to the customer (only which fields failed).

export const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
export const normaliseGst = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();

const COMPANY_NOISE = /\b(pvt|private|ltd|limited|llp|co|op|company|corp|corporation|inc|and|the)\b/g;
function words(text: string, ignore?: RegExp): string[] {
  let t = text.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  if (ignore) t = t.replace(ignore, " ");
  return t.split(/\s+/).filter((w) => w.length > 1);
}
// "Malabar Spice Traders" ≈ "Malabar Spice Traders Pvt Ltd"; "Arun" ≈ "Arun Menon".
function sameName(a: string, b: string, ignore?: RegExp): boolean {
  const x = words(a, ignore);
  const y = words(b, ignore);
  if (!x.length || !y.length) return false;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.every((w) => long.includes(w));
}

export interface Check {
  label: string;
  ok: boolean | null; // null = informational step
}

export type Field = "email" | "gstNo" | "company";

export interface Comparison {
  checks: Check[];
  matched: boolean;
  mismatched: Field[];
}

export function compareWithRecord(given: Pick<Draft, "name" | "company" | "email" | "gstNo">, record: Customer): Comparison {
  const gstOk = given.gstNo ? normaliseGst(given.gstNo) === normaliseGst(record.gstNo) : null;
  const emailOk = !!given.email && given.email.toLowerCase() === record.email.toLowerCase();
  const companyOk = !!given.company && sameName(given.company, record.company, COMPANY_NOISE);
  const nameOk = !!given.name && sameName(given.name, record.name);
  const checks: Check[] = [];
  if (gstOk !== null) checks.push({ label: "GST number", ok: gstOk });
  checks.push({ label: "Email address", ok: emailOk }, { label: "Company", ok: companyOk }, { label: "Contact name", ok: nameOk });
  const mismatched: Field[] = [];
  if (gstOk === false) mismatched.push("gstNo");
  if (!emailOk) mismatched.push("email");
  if (!companyOk && !nameOk) mismatched.push("company");
  return { checks, matched: mismatched.length === 0, mismatched };
}

export type Outcome = "verified" | "new" | "retry" | "unverified";

// One re-check is allowed; a second mismatch goes to staff.
export function decideVerification(record: Customer | null, comparison: Comparison | null, attempts: number): Outcome {
  if (!record || !comparison) return "new";
  if (comparison.matched) return "verified";
  return attempts === 0 ? "retry" : "unverified";
}

export const FIELD_LABEL: Record<Field, string> = { email: "email address", gstNo: "GST number", company: "company name" };

export function listWords(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
