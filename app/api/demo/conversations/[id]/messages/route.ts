import { NextResponse, type NextRequest } from "next/server";
import { handleMessage } from "@/lib/demo/agent";
import { getConversationView } from "@/lib/demo/data";
import { demoRoute, readJson } from "@/lib/demo/route";

export const runtime = "nodejs";
export const maxDuration = 30;

export function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return demoRoute(req, async () => {
    const { id } = await params;
    const text = (await readJson(req))?.text;
    if (typeof text !== "string" || !text.trim() || text.length > 500) {
      return NextResponse.json({ error: "Message must be 1–500 characters." }, { status: 400 });
    }
    if (!(await handleMessage(id, text.trim()))) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    return NextResponse.json(await getConversationView(id));
  });
}
