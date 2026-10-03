import { NextResponse, type NextRequest } from "next/server";
import { getConversationView } from "@/lib/demo/data";
import { demoRoute } from "@/lib/demo/route";

export const runtime = "nodejs";

export function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return demoRoute(req, async () => {
    const view = await getConversationView((await params).id);
    return view ? NextResponse.json(view) : NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  });
}
