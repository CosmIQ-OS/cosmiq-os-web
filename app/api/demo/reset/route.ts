import { NextResponse, type NextRequest } from "next/server";
import { ResetBusy, resetDemo } from "@/lib/demo/data";
import { demoRoute } from "@/lib/demo/route";
import { staffQuotationRoute } from "@/lib/quotations/route";

export const runtime = "nodejs";

export function POST(req: NextRequest) {
  return demoRoute(req, () => staffQuotationRoute(req, async () => {
    try { await resetDemo(); }
    catch (error) {
      if (error instanceof ResetBusy) return NextResponse.json({ error: error.message }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ ok: true });
  }));
}
