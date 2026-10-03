import { test, expect } from "@playwright/test";
import seed from "../../lib/demo/seed-data.json";
import { parseFallback } from "../../lib/demo/parse-fallback";
import { buildQuote } from "../../lib/demo/pricing";
import type { Draft, Extraction, LabTest } from "../../lib/demo/types";
import { nextStep } from "../../lib/demo/workflow";

// Pure logic: no browser, no database. Runs once (desktop project).
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "logic tests run once"));

const catalog = seed.tests as LabTest[];
const draft = (over: Partial<Draft> = {}): Draft => ({
  testIds: [], sampleType: null, samples: null, name: "Arun", company: "Malabar", awaiting: "tests", quotationId: null, orderIds: [], ...over,
});
const ex = (over: Partial<Extraction> = {}): Extraction => ({
  intent: "enquiry", testIds: [], unknownTests: [], sampleType: null, samples: null, name: null, company: null, engine: "fallback", ...over,
});
const ctx = (over: Partial<Parameters<typeof nextStep>[0]> = {}) => ({
  state: "collecting" as const, draft: draft(), pastSampleTypes: [], catalog, sampleTypes: seed.sampleTypes, ...over,
});

test("pricing reproduces every order total in the lab's sample data", () => {
  for (const order of seed.orders) {
    const t = catalog.find((c) => c.id === order.testId)!;
    const q = buildQuote([t], order.sampleType, order.samples, seed.gstRate);
    expect([q.subtotalInr, q.gstInr, q.totalInr], order.id).toEqual([order.feeInr, order.gstInr, order.totalInr]);
  }
  expect(seed.orders).toHaveLength(52);
});

test("fallback parser reads tests, sample types and counts, and ignores weights", () => {
  const a = parseFallback("Need afla test for 3 chilli samples", "tests", seed.sampleTypes);
  expect([a.testIds, a.sampleType, a.samples]).toEqual([["T002"], "Red Chilli Powder", 3]);
  expect(parseFallback("Export. 500 g each", "samples", seed.sampleTypes).samples).toBeNull();
  expect(parseFallback("five", "samples", seed.sampleTypes).samples).toBe(5);
  expect(parseFallback("honey testing please", "tests", seed.sampleTypes).sampleType).toBe("honey");
  expect(parseFallback("can you give a discount?", "confirm", seed.sampleTypes).intent).toBe("discount");
  const intro = parseFallback("Hi, I'm Asha from Spice Route Exports", "identity", seed.sampleTypes);
  expect([intro.name, intro.company]).toEqual(["Asha", "Spice Route Exports"]);
});

test("workflow asks only for what is missing, then quotes", () => {
  const s1 = nextStep(ctx(), ex({ testIds: ["T002"], sampleType: "jeera" }));
  expect(s1.draft.sampleType).toBe("Cumin Seeds");
  expect(s1.ask).toMatch(/how many samples of Cumin Seeds/i);
  const s2 = nextStep(ctx({ draft: s1.draft }), ex({ samples: 4 }));
  expect([s2.action, s2.state]).toEqual(["quote", "quoted"]);
});

test("workflow never invents: unknown tests, sample types and discounts are declined and flagged", () => {
  const s = nextStep(ctx(), ex({ intent: "discount", unknownTests: ["gluten"], sampleType: "honey", testIds: ["T999"] }));
  expect(s.draft.testIds).toEqual([]);
  expect(s.draft.sampleType).toBeNull();
  expect(s.flags).toEqual(["discount requested", "test not in catalogue: gluten", "sample type not accepted: honey"]);
  expect(s.action).toBeNull();
});

test("confirming a quote orders it; changing details re-quotes", () => {
  const quoted = draft({ testIds: ["T001"], sampleType: "Turmeric Powder", samples: 2, quotationId: "Q-2026-0001", awaiting: "confirm" });
  expect(nextStep(ctx({ state: "quoted", draft: quoted }), ex({ intent: "confirm" })).action).toBe("order");
  const changed = nextStep(ctx({ state: "quoted", draft: quoted }), ex({ samples: 5 }));
  expect([changed.action, changed.draft.samples]).toEqual(["quote", 5]);
});
