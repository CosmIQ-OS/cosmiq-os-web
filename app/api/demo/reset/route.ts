import { NextResponse, type NextRequest } from "next/server";
import { resetDemo } from "@/lib/demo/data";
import { demoRoute } from "@/lib/demo/route";

export const runtime = "nodejs";

export function POST(req: NextRequest) {
  return demoRoute(req, async () => {
    await resetDemo();
    return NextResponse.json({ ok: true });
  });
}
