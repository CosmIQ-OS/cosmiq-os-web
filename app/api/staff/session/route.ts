import { NextRequest, NextResponse } from "next/server";
import { createSession, passwordMatches, SESSION_SECONDS, STAFF_COOKIE, staffLoginConfigured } from "@/lib/staff-session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!staffLoginConfigured()) return NextResponse.json({ error: "Staff login is not configured." }, { status: 503 });
  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length > 256 || !passwordMatches(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_COOKIE, createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
