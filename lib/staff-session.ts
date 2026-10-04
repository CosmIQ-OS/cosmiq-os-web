import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export const STAFF_COOKIE = "cosmiq_staff";
export const SESSION_SECONDS = 8 * 60 * 60;

function configuration() {
  const password = process.env.STAFF_PASSWORD;
  const secret = sessionSecret();
  if (!password || !secret) return null;
  return { password, secret };
}

export function sessionSecret(): string | null {
  const secret = process.env.STAFF_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function staffLoginConfigured() {
  return !!configuration();
}

export function secretMatches(value: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(value).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function passwordMatches(value: string): boolean {
  const config = configuration();
  return !!config && secretMatches(value, config.password);
}

// The purpose is signed too, so a token issued for one cookie (e.g. the demo)
// can never be replayed as another (e.g. staff).
function signature(purpose: string, expiresAt: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(`${purpose}:${expiresAt}`).digest("hex");
}

export function signToken(purpose: string, secret: string, seconds: number): string {
  const expiresAt = String(Date.now() + seconds * 1000);
  return `${expiresAt}.${signature(purpose, expiresAt, secret)}`;
}

export function verifyToken(purpose: string, secret: string, token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAt, signed, extra] = token.split(".");
  if (extra || !/^\d+$/.test(expiresAt) || !/^[a-f0-9]{64}$/.test(signed)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  const expected = Buffer.from(signature(purpose, expiresAt, secret), "hex");
  return crypto.timingSafeEqual(Buffer.from(signed, "hex"), expected);
}

export function createSession(): string {
  const config = configuration();
  if (!config) throw new Error("Staff login is not configured.");
  return signToken("staff", config.secret, SESSION_SECONDS);
}

export function isStaff(req: NextRequest): boolean {
  const config = configuration();
  return !!config && verifyToken("staff", config.secret, req.cookies.get(STAFF_COOKIE)?.value);
}
