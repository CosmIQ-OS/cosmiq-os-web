import { test, expect } from "@playwright/test";
import seed from "../../lib/demo/seed-data.json";
import { parseFallback } from "../../lib/demo/parse-fallback";
import { buildQuote } from "../../lib/demo/pricing";
import type { Draft, Extraction, LabTest } from "../../lib/demo/types";
import { compareWithRecord, decideVerification } from "../../lib/demo/verify";
import { nextStep } from "../../lib/demo/workflow";

// Pure logic: no browser, no database. Runs once (desktop project).
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "logic tests run once"));

const catalog = seed.tests as LabTest[];
const draft = (over: Partial<Draft> = {}): Draft => ({
  testIds: [], sampleType: null, samples: null, name: "Arun", company: "Malabar", email: null, gstNo: null, noGst: false,
  verification: "verified", verifyAttempts: 0, awaiting: "tests", quotationId: null, orderIds: [], ...over,
});
const ex = (over: Partial<Extraction> = {}): Extraction => ({
  intent: "enquiry", testIds: [], unknownTests: [], sampleType: null, samples: null, name: null, company: null,
  email: null, gstNo: null, noGst: false, engine: "fallback", ...over,
});
const arun = seed.customers.find((c) => c.id === "C001")!;
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

test("fallback parser reads contact details without mistaking company names for samples", () => {
  for (const c of seed.customers) {
    const r = parseFallback(`${c.name}, ${c.company}, ${c.email}, GST ${c.gstNo}`, "identity", seed.sampleTypes);
    expect([r.name, r.company, r.email, r.gstNo, r.sampleType, r.testIds], c.id).toEqual([c.name, c.company, c.email, c.gstNo, null, []]);
  }
  const labelled = parseFallback("Email: asha@spiceroute.example, GSTIN 32AAGCS4821K1Z3", "identity", seed.sampleTypes);
  expect([labelled.email, labelled.gstNo]).toEqual(["asha@spiceroute.example", "32AAGCS4821K1Z3"]);
  expect(parseFallback("we don't have GST, asha@spiceroute.example", "identity", seed.sampleTypes).noGst).toBe(true);

  // Found in a live run: spice words in company names and free-form sentences.
  const plain = parseFallback("Vikram Singh, Rajputana Chilli Industries", "identity", seed.sampleTypes);
  expect([plain.name, plain.company, plain.sampleType]).toEqual(["Vikram Singh", "Rajputana Chilli Industries", null]);
  const sentence = parseFallback("Hi, I'm Vikram Singh from Rajputana Chilli Industries. Email vikram@rc.example and our GSTIN is 08HSGCR6533G1ZF", "identity", seed.sampleTypes);
  expect([sentence.name, sentence.company, sentence.gstNo]).toEqual(["Vikram Singh", "Rajputana Chilli Industries", "08HSGCR6533G1ZF"]);
  const noGst = parseFallback("hello, this is Meera from Kottayam Organic Spices, meera@ko.example, we don't have GST yet", "identity", seed.sampleTypes);
  expect([noGst.name, noGst.company, noGst.noGst]).toEqual(["Meera", "Kottayam Organic Spices", true]);
  expect(parseFallback("Asha, Kerala Wellness Foods", "identity", seed.sampleTypes).company).toBe("Kerala Wellness Foods");
  // Naming a test still counts as an enquiry while details are being asked for.
  expect(parseFallback("need aflatoxin test for chilli", "identity", seed.sampleTypes).testIds).toEqual(["T002"]);
});

test("verification matches the record and pinpoints mismatches", () => {
  const given = { name: arun.name, company: "Malabar Spice Traders", email: arun.email.toUpperCase(), gstNo: arun.gstNo };
  const ok = compareWithRecord(given, arun);
  expect([ok.matched, decideVerification(arun, ok, 0)]).toEqual([true, "verified"]);
  const wrongEmail = compareWithRecord({ ...given, email: "arun@outlook.example" }, arun);
  expect([wrongEmail.mismatched, decideVerification(arun, wrongEmail, 0), decideVerification(arun, wrongEmail, 1)])
    .toEqual([["email"], "retry", "unverified"]);
  expect(compareWithRecord({ ...given, gstNo: "32AAGCS4821K1Z3" }, arun).mismatched).toEqual(["gstNo"]);
  expect(compareWithRecord({ ...given, name: "Someone Else", company: "Other Co" }, arun).mismatched).toEqual(["company"]);
  expect(decideVerification(null, null, 0)).toBe("new");
});

test("identify step collects all four details, rejects bad formats, then asks for a database check", () => {
  const base = draft({ name: null, company: null, verification: "pending", awaiting: "identity" });
  const idCtx = ctx({ state: "identify", draft: base });
  const s1 = nextStep(idCtx, ex({ name: "Arun Menon", company: "Malabar Spice Traders", gstNo: "32LJSCM" }));
  expect(s1.notes.join(" ")).toMatch(/doesn't look like a GST number/);
  expect(s1.ask).toBe("Thanks! To finish verifying you, I still need your email and GST number.");
  const s2 = nextStep(ctx({ state: "identify", draft: s1.draft }), ex({ email: arun.email, gstNo: arun.gstNo.toLowerCase() }));
  expect([s2.action, s2.draft.gstNo]).toEqual(["verify", arun.gstNo]);
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
