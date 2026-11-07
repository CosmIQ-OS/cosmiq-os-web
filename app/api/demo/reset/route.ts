import { NextResponse, type NextRequest } from "next/server";
import { resetDemo } from "@/lib/demo/data";
import { demoRoute } from "@/lib/demo/route";
import { isStaff } from "@/lib/staff-session";

export const runtime = "nodejs";

export function POST(req: NextRequest) {
  return demoRoute(req, async () => {
    if (!isStaff(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    await resetDemo();
    return NextResponse.json({ ok: true });
  });
}
