import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export const STAFF_COOKIE = "cosmiq_staff";
export const SESSION_SECONDS = 8 * 60 * 60;

function configuration() {
  const password = process.env.STAFF_PASSWORD;
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) return null;
  return { password, secret };
}

export function staffLoginConfigured() {
  return !!configuration();
}

export function passwordMatches(value: string): boolean {
  const config = configuration();
  if (!config) return false;
  const supplied = crypto.createHash("sha256").update(value).digest();
  const expected = crypto.createHash("sha256").update(config.password).digest();
  return crypto.timingSafeEqual(supplied, expected);
}

function signature(expiresAt: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(expiresAt).digest("hex");
}

export function createSession(): string {
  const config = configuration();
  if (!config) throw new Error("Staff login is not configured.");
  const expiresAt = String(Date.now() + SESSION_SECONDS * 1000);
  return `${expiresAt}.${signature(expiresAt, config.secret)}`;
}

export function isStaff(req: NextRequest): boolean {
  const config = configuration();
  const cookie = req.cookies.get(STAFF_COOKIE)?.value;
  if (!config || !cookie) return false;
  const [expiresAt, signed, extra] = cookie.split(".");
  if (extra || !/^\d+$/.test(expiresAt) || !/^[a-f0-9]{64}$/.test(signed)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  const expected = Buffer.from(signature(expiresAt, config.secret), "hex");
  return crypto.timingSafeEqual(Buffer.from(signed, "hex"), expected);
}
