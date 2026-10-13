import { NextResponse, type NextRequest } from "next/server";
import { staffQuotationRoute } from "@/lib/quotations/route";
import { listQuotations } from "@/lib/quotations/store";
export const runtime = "nodejs";
export function GET(req: NextRequest) {
  return staffQuotationRoute(req, async () => NextResponse.json(await listQuotations()));
}
