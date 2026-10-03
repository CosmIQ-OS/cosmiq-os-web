import { NextResponse, type NextRequest } from "next/server";
import { listCustomers } from "@/lib/demo/data";
import { demoRoute } from "@/lib/demo/route";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  return demoRoute(req, async () => NextResponse.json(await listCustomers()));
}
