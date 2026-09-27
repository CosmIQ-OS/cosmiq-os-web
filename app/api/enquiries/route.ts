import { NextRequest, NextResponse } from "next/server";
import { validateEnquiry } from "@/lib/validation";
import { readEnquiries, saveEnquiry } from "@/lib/store";
import { isStaff } from "@/lib/staff-session";

export const runtime = "nodejs";

// CONTRACT
// GUARANTEES: valid POST persists one enquiry and returns { ok, id }; invalid input -> 400 with { error }; never implies success on storage failure (500).
// EXPECTS: JSON body matching EnquiryInput; GET requires a valid staff session cookie.
// DOES NOT: send emails, call agents, or expose leads to the public.

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const v = validateEnquiry(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    const row = await saveEnquiry(v.value);
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isStaff(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const response = NextResponse.json(await readEnquiries());
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Could not load enquiries." }, { status: 500 });
  }
}
