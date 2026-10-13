import { NextResponse, type NextRequest } from "next/server";
import { readJson } from "@/lib/demo/route";
import { actOnQuotation } from "@/lib/quotations/approval";
import { staffQuotationRoute } from "@/lib/quotations/route";
export const runtime = "nodejs";
export const maxDuration = 30;
export function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return staffQuotationRoute(req, async () => {
    const body = await readJson(req);
    if (!body || !["approve", "retry", "reject"].includes(String(body.action))) {
      return NextResponse.json({ error: "Choose approve, retry or reject." }, { status: 400 });
    }
    return NextResponse.json(await actOnQuotation((await params).id, body.action as "approve" | "retry" | "reject",
      body.reviewed === true, typeof body.reason === "string" ? body.reason : undefined));
  });
}
