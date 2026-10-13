import { NextResponse, type NextRequest } from "next/server";
import { denyWithoutDemoAccess } from "./access";
import { ensureDemoData } from "./data";

// Shared guard for /api/demo/*: demo cookie required, schema + seed ready, errors never leak details.
export async function demoRoute(req: NextRequest, run: () => Promise<Response>): Promise<Response> {
  const denied = denyWithoutDemoAccess(req);
  if (denied) return denied;
  try {
    await ensureDemoData();
    const response = await run();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("[demo]", error);
    return NextResponse.json({ error: "The demo backend hit a problem. Please try again." }, { status: 500 });
  }
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
