import { NextResponse, type NextRequest } from "next/server";
import { ensureDemoData } from "@/lib/demo/data";
import { isStaff } from "@/lib/staff-session";
import { ApprovalError } from "./approval";

export async function staffQuotationRoute(req: NextRequest, run: () => Promise<Response>) {
  if (!isStaff(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (req.method !== "GET") {
    const origin = req.headers.get("origin");
    if ((origin && origin !== req.nextUrl.origin) || req.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "Cross-origin actions are not allowed." }, { status: 403 });
    }
  }
  try {
    await ensureDemoData();
    const response = await run();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof ApprovalError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[quotations]", error);
    return NextResponse.json({ error: "Could not process quotations. Please refresh and try again." }, { status: 500 });
  }
}
