import { NextResponse, type NextRequest } from "next/server";
import { startConversation } from "@/lib/demo/agent";
import { getConversationView, getCustomer } from "@/lib/demo/data";
import { demoRoute, readJson } from "@/lib/demo/route";

export const runtime = "nodejs";

export function POST(req: NextRequest) {
  return demoRoute(req, async () => {
    const body = await readJson(req);
    if (!body) return NextResponse.json({ error: "A JSON object is required." }, { status: 400 });
    const customerId = body.customerId ?? null;
    if (customerId !== null && (typeof customerId !== "string" || !/^C\d{3}$/.test(customerId))) {
      return NextResponse.json({ error: "Invalid customer." }, { status: 400 });
    }
    if (customerId !== null && !(await getCustomer(customerId as string))) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }
    const id = await startConversation(customerId);
    return NextResponse.json(await getConversationView(id), { status: 201 });
  });
}
