import { NextResponse, type NextRequest } from "next/server";
import { getQuotation } from "@/lib/demo/data";
import { quotationPdf } from "@/lib/demo/pdf";
import { demoRoute } from "@/lib/demo/route";

export const runtime = "nodejs";

export function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return demoRoute(req, async () => {
    const quotation = await getQuotation((await params).id);
    if (!quotation) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    const bytes = await quotationPdf(quotation);
    return new Response(Buffer.from(bytes), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${quotation.id}.pdf"` },
    });
  });
}
