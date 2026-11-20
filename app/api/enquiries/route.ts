import { NextRequest, NextResponse } from "next/server";
import { validateEnquiry, type EnquiryInput } from "@/lib/validation";
import { readEnquiries, saveEnquiry } from "@/lib/store";
import { isStaff } from "@/lib/staff-session";

export const runtime = "nodejs";

/**
 * Forwards the validated website lead directly to the Customer Service AI Engine.
 * Integrates with Neon Postgres, creates live thread, triggers admin notification,
 * and surfaces in the CosmIQ OS Live Inbox and Leads Dashboard.
 */
async function forwardToCustomerEngine(input: EnquiryInput) {
  const engineBaseUrl = (
    process.env.CUSTOMER_ENGINE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://cosmiq-engine.onrender.com"
      : "http://127.0.0.1:3001")
  ).replace(/\/$/, "");

  const payload = {
    company_name: input.domain || input.name,
    contact_person: input.role ? `${input.name} (${input.role})` : input.name,
    email: input.email || "",
    phone: input.phone || "",
    service_name: Array.isArray(input.automations) ? input.automations.join(", ") : "",
    current_tools: "",
    notes: input.notes || "",
  };

  try {
    const res = await fetch(`${engineBaseUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[forwardToCustomerEngine] Engine returned ${res.status}:`, errText);
      return null;
    }

    const data = await res.json().catch(() => null);
    return data;
  } catch (err) {
    console.warn("[forwardToCustomerEngine] Could not forward lead to customer service engine:", err);
    return null;
  }
}

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
    const engineLead = await forwardToCustomerEngine(v.value);
    return NextResponse.json(
      {
        ok: true,
        id: row.id,
        sessionId: engineLead?.sessionId ?? null,
        intakeId: engineLead?.intakeId ?? null,
      },
      { status: 201 }
    );
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
