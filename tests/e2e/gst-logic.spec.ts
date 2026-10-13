import { test, expect } from "@playwright/test";
import { parseFallback } from "../../lib/demo/parse-fallback";
import seed from "../../lib/demo/seed-data.json";
import { nextStep } from "../../lib/demo/workflow";
import type { Draft } from "../../lib/demo/types";

test.beforeEach(({}, info) => test.skip(info.project.name !== "chromium", "GST parser rules run once"));
const gst = seed.customers[0].gstNo;

test("GST extraction accepts plain and lower-case numbers", () => {
  for (const text of [gst, gst.toLowerCase(), `GST No: ${gst}`]) {
    expect(parseFallback(text, "identity", seed.sampleTypes).gstNo, text).toBe(gst);
  }
});

test("GST extraction accepts copy-pasted whitespace and separators", () => {
  for (const text of ["32-LJSCM-3645-T1Z0", "32  LJSCM  3645  T1Z0", "32 LJSCM 3645 T 1 Z 0"]) {
    expect(parseFallback(text, "identity", seed.sampleTypes).gstNo, text).toBe(gst);
  }
});

test("saying GST is unavailable does not become a customer name or another GST question", () => {
  for (const text of ["GST not available", "I do not have a GST number", "GST is not applicable", "not GST registered"]) {
    const result = parseFallback(text, "identity", seed.sampleTypes);
    expect(result.noGst, text).toBe(true);
    expect(result.name, text).toBeNull();
  }
});

const identityDraft = (over: Partial<Draft> = {}): Draft => ({
  workflowVersion: 2, testIds: ["T002"], sampleType: "Red Chilli Powder", samples: 3,
  name: "Arun Menon", phone: "91982823393", company: null, email: null, gstNo: null, noGst: false,
  verification: "pending", verifyAttempts: 0, gstFormatAttempts: 0, awaiting: "gstNo", quotationId: null, orderIds: [], ...over,
});
function step(draft: Draft, text: string) {
  return nextStep({ state: "identify", draft, catalog: seed.tests, sampleTypes: seed.sampleTypes, pastSampleTypes: [] },
    parseFallback(text, draft.awaiting, seed.sampleTypes));
}

test("contextual N/A and none replies are GST-only answers, not customer names", () => {
  for (const text of ["N/A", "none", "nil", "not applicable", "I don't have one", "No"]) {
    const read = parseFallback(text, "gstNo", seed.sampleTypes);
    expect([read.noGst, read.name], text).toEqual([true, null]);
    const result = step(identityDraft(), text);
    expect([result.action, result.draft.name, result.draft.noGst], text).toEqual(["verify", "Arun Menon", true]);
  }
  expect(parseFallback("No", "confirm", seed.sampleTypes).noGst).toBe(false);
  expect(parseFallback("N/A", "tests", seed.sampleTypes).noGst).toBe(false);
});

test("two unreadable GST replies hand off for staff verification instead of asking indefinitely", () => {
  for (const reply of ["GST 12345", "not sure", "ASDF"]) {
    const first = step(identityDraft(), reply);
    expect(first.action, reply).toBeNull(); expect(first.draft.gstFormatAttempts, reply).toBe(1);
    const second = step(first.draft, reply);
    expect(second.action, reply).toBe("verify"); expect(second.draft.name, reply).toBe("Arun Menon");
    expect(second.draft.verification, reply).toBe("pending");
    expect(second.draft.verifyAttempts, reply).toBeGreaterThanOrEqual(1);
    expect(second.flags, reply).toContain("GST unreadable or not supplied after two attempts");
  }
});

test("a valid GST correction clears the format-attempt counter", () => {
  const invalid = step(identityDraft(), "GST 12345");
  const corrected = step(invalid.draft, "32-LJSCM-3645-T1Z0");
  expect([corrected.action, corrected.draft.gstNo, corrected.draft.gstFormatAttempts]).toEqual(["verify", gst, 0]);
});

test("GST handover does not bypass mandatory name and phone collection", () => {
  const result = step(identityDraft({ name: null, phone: null, gstFormatAttempts: 1 }), "GST 12345");
  expect(result.action).toBeNull();
  expect(result.ask).toContain("full name"); expect(result.ask).toContain("phone number");
  expect(result.ask).not.toContain("GST number");
});

test("a bare numeric GST reply cannot overwrite the phone before a valid correction", () => {
  const first = step(identityDraft(), "12345678901234");
  expect(first.draft.phone).toBe("91982823393");
  const corrected = step(first.draft, gst);
  expect([corrected.action, corrected.draft.phone, corrected.draft.gstNo]).toEqual(["verify", "91982823393", gst]);
});

test("greetings, discounts and urgency preserve intent and do not consume GST attempts", () => {
  for (const [text, intent] of [["Hello", "greeting"], ["Any discount?", "discount"], ["Can you do it faster?", "faster_tat"]]) {
    const read = parseFallback(text, "gstNo", seed.sampleTypes);
    expect(read.intent, text).toBe(intent);
    const result = step(identityDraft(), text);
    expect(result.draft.gstFormatAttempts, text).toBe(0); expect(result.action, text).toBeNull();
    if (intent !== "greeting") expect(result.flags, text).toHaveLength(1);
  }
});
