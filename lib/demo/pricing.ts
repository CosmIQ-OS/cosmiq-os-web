import type { LabTest } from "./types";

// Every number a customer sees is computed here, from database rows. Never by the AI.
export interface QuoteLine {
  testId: string;
  testName: string;
  method: string;
  certification: string;
  sampleRequired: string;
  sampleType: string;
  samples: number;
  feeInr: number;
  amountInr: number;
  tatDays: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotalInr: number;
  gstRate: number;
  gstInr: number;
  totalInr: number;
  tatDays: number;
}

// Integer maths in basis points, so 5,200 × 18% is exactly 936 (no float drift).
export function gstAmount(amountInr: number, rate: number): number {
  return Math.round((amountInr * Math.round(rate * 10000)) / 10000);
}

export function buildQuote(tests: LabTest[], sampleType: string, samples: number, gstRate: number): Quote {
  if (tests.length === 0) throw new Error("A quote needs at least one test.");
  if (!Number.isInteger(samples) || samples < 1) throw new Error("Samples must be a positive whole number.");
  const lines = tests.map((t) => ({
    testId: t.id,
    testName: t.name,
    method: t.method,
    certification: t.certification,
    sampleRequired: t.sampleRequired,
    sampleType,
    samples,
    feeInr: t.feeInr,
    amountInr: t.feeInr * samples,
    tatDays: t.tatDays,
  }));
  const subtotalInr = lines.reduce((sum, l) => sum + l.amountInr, 0);
  const gstInr = gstAmount(subtotalInr, gstRate);
  return {
    lines,
    subtotalInr,
    gstRate,
    gstInr,
    totalInr: subtotalInr + gstInr,
    tatDays: Math.max(...lines.map((l) => l.tatDays)),
  };
}

export function inr(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN")}`;
}
