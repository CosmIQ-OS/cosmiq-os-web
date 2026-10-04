import { NextResponse, type NextRequest } from "next/server";
import { startConversation } from "@/lib/demo/agent";
import { getConversationView } from "@/lib/demo/data";
import { demoRoute, readJson } from "@/lib/demo/route";

export const runtime = "nodejs";

export function POST(req: NextRequest) {
  return demoRoute(req, async () => {
    const customerId = (await readJson(req))?.customerId ?? null;
    if (customerId !== null && (typeof customerId !== "string" || !/^C\d{3}$/.test(customerId))) {
      return NextResponse.json({ error: "Invalid customer." }, { status: 400 });
    }
    const id = await startConversation(customerId);
    return NextResponse.json(await getConversationView(id), { status: 201 });
  });
}
