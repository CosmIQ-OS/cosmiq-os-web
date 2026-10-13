import { NextResponse, type NextRequest } from "next/server";
import { getQuotation } from "@/lib/demo/data";
import { quotationPdf } from "@/lib/demo/pdf";
import { staffQuotationRoute } from "@/lib/quotations/route";
export const runtime = "nodejs";
export function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return staffQuotationRoute(req, async () => {
    const quotation = await getQuotation((await params).id);
    if (!quotation) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    const bytes = quotation.attachmentBase64 ? Buffer.from(quotation.attachmentBase64, "base64") : Buffer.from(await quotationPdf(quotation));
    return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${quotation.id}.pdf"` } });
  });
}
