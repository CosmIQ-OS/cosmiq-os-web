export interface LabTest {
  id: string;
  name: string;
  category: string;
  method: string;
  certification: string;
  tatDays: number;
  feeInr: number;
  sampleRequired: string; // placeholder values, shown as "illustrative"
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  gstNo: string;
  company: string;
  city: string;
}

export interface PastOrder {
  id: string;
  orderDate: string;
  testId: string;
  testName: string;
  sampleType: string;
  samples: number;
  totalInr: number;
  status: string;
}

export type Intent = "enquiry" | "confirm" | "decline" | "discount" | "faster_tat" | "greeting" | "other";

// What the AI (or the fallback parser) read from one customer message.
// Nothing here is trusted: tests, sample types and counts are re-checked against the database.
export interface Extraction {
  intent: Intent;
  testIds: string[];
  unknownTests: string[];
  sampleType: string | null;
  samples: number | null;
  name: string | null;
  phone: string | null;
  company: string | null;
  email: string | null;
  gstNo: string | null;
  noGst: boolean; // customer says they have no GST registration
  engine: "gemini" | "fallback";
  note?: string; // e.g. why the fallback was used
}

export type ConvState = "requesting" | "identify" | "collecting" | "confirming" | "email" | "pending_approval";
export type Verification = "pending" | "verified" | "new" | "unverified";
export type Awaiting = "identity" | "tests" | "sampleType" | "samples" | "confirm" | "email" | null;

export interface Draft {
  workflowVersion: 2;
  testIds: string[];
  sampleType: string | null;
  samples: number | null;
  name: string | null;
  phone: string | null;
  company: string | null;
  email: string | null;
  gstNo: string | null;
  noGst: boolean;
  verification: Verification;
  verifyAttempts: number;
  awaiting: Awaiting;
  quotationId: string | null;
  orderIds: string[];
}

export type TraceKind = "ai" | "db" | "ask" | "flag" | "quote" | "order" | "info";
export interface TraceEvent {
  kind: TraceKind;
  label: string;
  detail?: string;
}
