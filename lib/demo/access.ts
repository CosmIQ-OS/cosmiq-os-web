import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { secretMatches, sessionSecret, signToken, verifyToken } from "@/lib/staff-session";

export const DEMO_COOKIE = "cosmiq_demo";
export const DEMO_SESSION_SECONDS = 12 * 60 * 60;

function configuration() {
  const code = process.env.DEMO_ACCESS_CODE;
  const secret = sessionSecret();
  return code && secret ? { code, secret } : null;
}

export function demoConfigured() {
  return !!configuration();
}

export function codeMatches(value: string): boolean {
  const config = configuration();
  return !!config && secretMatches(value.trim(), config.code);
}

export function createDemoSession(): string {
  const config = configuration();
  if (!config) throw new Error("Demo access is not configured.");
  return signToken("demo", config.secret, DEMO_SESSION_SECONDS);
}

export function hasDemoAccess(token: string | undefined): boolean {
  const config = configuration();
  return !!config && verifyToken("demo", config.secret, token);
}

// Route guard: returns a 401 response when the visitor has no demo session.
export function denyWithoutDemoAccess(req: NextRequest): NextResponse | null {
  if (hasDemoAccess(req.cookies.get(DEMO_COOKIE)?.value)) return null;
  return NextResponse.json({ error: "Demo access required." }, { status: 401 });
}
