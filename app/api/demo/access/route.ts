import { NextResponse, type NextRequest } from "next/server";
import { codeMatches, createDemoSession, DEMO_COOKIE, DEMO_SESSION_SECONDS, demoConfigured } from "@/lib/demo/access";
import { readJson } from "@/lib/demo/route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!demoConfigured()) return NextResponse.json({ error: "Demo access is not configured." }, { status: 503 });
  const code = (await readJson(req))?.code;
  if (typeof code !== "string" || code.length > 100 || !codeMatches(code)) {
    return NextResponse.json({ error: "That code isn't right." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_COOKIE, createDemoSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DEMO_SESSION_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
