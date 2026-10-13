import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { Quotation } from "./data";
import { inr } from "./pricing";

const INK = rgb(0.04, 0.04, 0.04);
const MUTED = rgb(0.29, 0.28, 0.25);
const ORANGE = rgb(1, 0.35, 0.12);
const PAPER = rgb(0.96, 0.95, 0.92);

// Standard PDF fonts only cover WinAnsi; replace anything else so generation never throws.
const safe = (s: string) => s.replace(/₹/g, "INR ").replace(/[–—]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF·×]/g, "");

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of safe(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function quotationPdf(q: Quotation): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Quotation ${q.id}`);
  doc.setAuthor("FQLab (prototype)");
  const page: PDFPage = doc.addPage([595, 842]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = (s: string, x: number, y: number, size = 10, font = regular, color = INK) =>
    page.drawText(safe(s), { x, y, size, font, color });
  const right = (s: string, xRight: number, y: number, size = 10, font = regular) =>
    text(s, xRight - font.widthOfTextAtSize(safe(s), size), y, size, font);

  // Header
  page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: INK });
  page.drawRectangle({ x: 40, y: 790, width: 18, height: 18, color: ORANGE });
  text("FQLab and Research Centre Pvt Ltd", 68, 798, 15, bold, PAPER);
  text("Food & spice testing laboratory", 68, 782, 9, regular, PAPER);
  page.drawText("QUOTATION", { x: 555 - bold.widthOfTextAtSize("QUOTATION", 18), y: 796, size: 18, font: bold, color: ORANGE });
  page.drawRectangle({ x: 0, y: 742, width: 595, height: 20, color: ORANGE });
  text("PROTOTYPE · SAMPLE DATA · NOT A REAL QUOTATION", 40, 748, 9, bold);

  // Meta + customer
  let y = 712;
  text("Quotation no.", 40, y, 9, regular, MUTED); text(q.id, 120, y, 10, bold);
  text("Date", 330, y, 9, regular, MUTED); text(new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), 400, y, 10, bold);
  y -= 26;
  text("BILL TO", 40, y, 8, bold, MUTED);
  y -= 15; text(q.customerName, 40, y, 11, bold);
  y -= 14; text(q.company, 40, y, 10);
  if (q.city) { y -= 14; text(q.city, 40, y, 10); }
  y -= 14; text(`GST No.: ${q.gstNo ?? "Not on file"}`, 40, y, 10);

  // Table
  y -= 30;
  const cols = { n: 40, test: 60, sample: 275, qty: 365, fee: 470, amount: 555 };
  page.drawRectangle({ x: 36, y: y - 6, width: 523, height: 20, color: INK });
  const head = (s: string, x: number) => text(s, x, y, 8, bold, PAPER);
  head("#", cols.n); head("TEST", cols.test); head("SAMPLE TYPE", cols.sample); head("SAMPLES", cols.qty - 10);
  text("FEE / SAMPLE", cols.fee - bold.widthOfTextAtSize("FEE / SAMPLE", 8), y, 8, bold, PAPER);
  text("AMOUNT", cols.amount - bold.widthOfTextAtSize("AMOUNT", 8), y, 8, bold, PAPER);
  y -= 24;
  q.quote.lines.forEach((l, i) => {
    text(String(i + 1), cols.n, y, 10, bold);
    const nameLines = wrap(l.testName, bold, 10, 210);
    nameLines.forEach((ln, k) => text(ln, cols.test, y - k * 12, 10, bold));
    text(l.sampleType, cols.sample, y, 10);
    text(String(l.samples), cols.qty + 10, y, 10);
    right(inr(l.feeInr), cols.fee, y, 10);
    right(inr(l.amountInr), cols.amount, y, 10, bold);
    y -= nameLines.length * 12 + 2;
    for (const detail of [`Method: ${l.method}`, `Certificate: ${l.certification}`, `Sample required: ${l.sampleRequired} (illustrative)`, `Turnaround: ${l.tatDays} days`]) {
      for (const ln of wrap(detail, regular, 8, 300)) { text(ln, cols.test, y, 8, regular, MUTED); y -= 10; }
    }
    y -= 8;
    page.drawLine({ start: { x: 36, y: y + 4 }, end: { x: 559, y: y + 4 }, thickness: 0.8, color: INK });
    y -= 12;
  });

  // Totals
  const total = (label: string, value: string, strong = false) => {
    right(label, 450, y, strong ? 11 : 10, strong ? bold : regular);
    right(value, cols.amount, y, strong ? 11 : 10, strong ? bold : regular);
    y -= 16;
  };
  total("Subtotal", inr(q.quote.subtotalInr));
  total(`GST @ ${Math.round(q.quote.gstRate * 100)}%`, inr(q.quote.gstInr));
  y -= 8; // keep the boxed total clear of the GST row
  page.drawRectangle({ x: 330, y: y - 7, width: 229, height: 22, color: PAPER, borderColor: INK, borderWidth: 1.5 });
  total("Total payable", inr(q.quote.totalInr), true);
  y -= 6;
  text(`Turnaround: ${q.quote.tatDays} days from sample receipt (longest test).`, 40, y, 10, bold);

  // Footer
  const notes = [
    "Prices, GST and turnaround are read from the lab database and calculated by business logic. The AI assistant does not set any figure on this document.",
    "Sample data for demonstration only. Fees, GST rate and sample quantities are illustrative.",
    "Prepared for staff approval. Approved quotations are emailed; please contact the lab to proceed.",
  ];
  let fy = 92;
  page.drawLine({ start: { x: 36, y: fy + 18 }, end: { x: 559, y: fy + 18 }, thickness: 2, color: INK });
  for (const n of notes) for (const ln of wrap(n, regular, 8, 515)) { text(ln, 40, fy, 8, regular, MUTED); fy -= 11; }
  text("Generated by the CosmIQ agentic enquiry desk (prototype)", 40, 30, 8, bold, MUTED);

  return doc.save();
}
