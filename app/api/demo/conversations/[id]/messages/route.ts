import { NextResponse, type NextRequest } from "next/server";
import { ConversationBusy, handleMessage } from "@/lib/demo/agent";
import { ConversationLeaseLost, getConversationView } from "@/lib/demo/data";
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
    try {
      if (!(await handleMessage(id, text.trim()))) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    } catch (error) {
      if (error instanceof ConversationBusy || error instanceof ConversationLeaseLost) return NextResponse.json({ error: error.message }, { status: 409 });
      throw error;
    }
    return NextResponse.json(await getConversationView(id));
  });
}
