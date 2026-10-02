export const AUTOMATION_OPTIONS = [
  "WhatsApp enquiries",
  "Quotations",
  "Customer marketing",
  "LIMS order entry",
  "Sample status updates",
  "All of the above",
] as const;

export type AutomationOption = (typeof AUTOMATION_OPTIONS)[number];

export interface EnquiryInput {
  name: string;
  role?: string;
  domain: string;
  email: string;
  phone?: string;
  automations: string[];
  notes?: string;
}

export interface Enquiry extends EnquiryInput {
  id: string;
  status: "new";
  createdAt: string;
  source: string;
}

export const EMAIL_RE =/^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateEnquiry(body: unknown): { ok: true; value: EnquiryInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid payload." };
  const b = body as Record<string, unknown>;
  if (["name", "role", "domain", "email", "phone", "notes"].some((field) =>
    b[field] !== undefined && typeof b[field] !== "string")) {
    return { ok: false, error: "Fields must be text." };
  }
  const name = String(b.name ?? "").trim();
  const domain = String(b.domain ?? "").trim();
  const email = String(b.email ?? "").trim();
  const role = String(b.role ?? "").trim().slice(0, 120);
  const phone = String(b.phone ?? "").trim().slice(0, 40);
  const notes = String(b.notes ?? "").trim().slice(0, 2000);
  const raw = Array.isArray(b.automations) ? b.automations : [];
  if (raw.some((option) => typeof option !== "string" || !(AUTOMATION_OPTIONS as readonly string[]).includes(option))) {
    return { ok: false, error: "Invalid automation selection." };
  }
  const automations = [...new Set(raw as string[])];
  // "All of the above" is unambiguous: expand to the full set for storage clarity
  const expanded = automations.includes("All of the above")
    ? [...AUTOMATION_OPTIONS]
    : automations;
  if (!name) return { ok: false, error: "Name is required." };
  if (name.length > 160 || domain.length > 160 || email.length > 254) {
    return { ok: false, error: "A field is too long." };
  }
  if (!domain) return { ok: false, error: "Lab / organisation is required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid Email ID is required." };
  if (expanded.length === 0) return { ok: false, error: "Pick at least one automation." };
  return { ok: true, value: { name, role, domain, email, phone, automations: expanded, notes } };
}
