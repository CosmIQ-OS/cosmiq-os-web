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
  workflowVersion: 2,
  testIds: [], sampleType: null, samples: null, name: "Arun", phone: null, company: "Malabar", email: null, gstNo: null, noGst: false,
  verification: "verified", verifyAttempts: 0, awaiting: "tests", quotationId: null, orderIds: [], ...over,
});
const ex = (over: Partial<Extraction> = {}): Extraction => ({
  intent: "enquiry", testIds: [], unknownTests: [], sampleType: null, samples: null, name: null, phone: null, company: null,
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

test("verification checks name, phone and GST, without requiring email", () => {
  const given = { name: arun.name, phone: arun.phone.replace(/\s/g, ""), gstNo: arun.gstNo, noGst: false };
  const ok = compareWithRecord(given, arun);
  expect([ok.matched, decideVerification(arun, ok, 0)]).toEqual([true, "verified"]);
  const wrongPhone = compareWithRecord({ ...given, phone: "+91 9000000000" }, arun);
  expect([wrongPhone.mismatched, decideVerification(arun, wrongPhone, 0), decideVerification(arun, wrongPhone, 1)])
    .toEqual([["phone"], "retry", "unverified"]);
  expect(compareWithRecord({ ...given, gstNo: "32AAGCS4821K1Z3" }, arun).mismatched).toEqual(["gstNo"]);
  expect(compareWithRecord({ ...given, name: "Arun" }, arun).mismatched).toEqual(["name"]);
  expect(decideVerification(null, null, 0)).toBe("new");
});

test("identity collects name, phone and GST, rejects bad formats, then requests a database check", () => {
  const base = draft({ name: null, company: null, verification: "pending", awaiting: "identity" });
  const idCtx = ctx({ state: "identify", draft: base });
  const s1 = nextStep(idCtx, ex({ name: "Arun Menon", phone: "bad-phone", gstNo: "32LJSCM" }));
  expect(s1.notes.join(" ")).toMatch(/doesn't look like a GST number/);
  expect(s1.ask).toContain("phone number (including country code) and GST number");
  expect(s1.ask).not.toContain("email");
  const s2 = nextStep(ctx({ state: "identify", draft: s1.draft }), ex({ phone: arun.phone, gstNo: arun.gstNo.toLowerCase() }));
  expect([s2.action, s2.draft.gstNo]).toEqual(["verify", arun.gstNo]);
});

test("workflow confirms selections, asks email last, and only then submits for approval", () => {
  const s1 = nextStep(ctx(), ex({ testIds: ["T002"], sampleType: "jeera" }));
  expect(s1.draft.sampleType).toBe("Cumin Seeds");
  expect(s1.ask).toMatch(/how many samples of Cumin Seeds/i);
  const s2 = nextStep(ctx({ draft: s1.draft }), ex({ samples: 4 }));
  expect([s2.action, s2.state]).toEqual([null, "confirming"]);
  expect(s2.ask).toContain("4 samples of Cumin Seeds");
  const s3 = nextStep(ctx({ state: s2.state, draft: s2.draft }), ex({ intent: "confirm", email: "early@example.com" }));
  expect([s3.state, s3.draft.email]).toEqual(["email", null]);
  const s4 = nextStep(ctx({ state: s3.state, draft: s3.draft }), ex({ email: "final@example.com" }));
  expect([s4.state, s4.action, s4.draft.email]).toEqual(["pending_approval", "submit", "final@example.com"]);
});

test("workflow never invents: unknown tests, sample types and discounts are declined and flagged", () => {
  const s = nextStep(ctx(), ex({ intent: "discount", unknownTests: ["gluten"], sampleType: "honey", testIds: ["T999"] }));
  expect(s.draft.testIds).toEqual([]);
  expect(s.draft.sampleType).toBeNull();
  expect(s.flags).toEqual(["discount requested", "test not in catalogue: gluten", "sample type not accepted: honey"]);
  expect(s.action).toBeNull();
});

test("changing samples invalidates confirmation; submitted details are immutable", () => {
  const selected = draft({ testIds: ["T001"], sampleType: "Turmeric Powder", samples: 2, awaiting: "confirm" });
  const changed = nextStep(ctx({ state: "confirming", draft: selected }), ex({ intent: "confirm", samples: 5 }));
  expect([changed.state, changed.action, changed.draft.samples]).toEqual(["confirming", null, 5]);
  const submitted = nextStep(ctx({ state: "pending_approval", draft: selected }), ex({ intent: "confirm", samples: 5, email: "hijack@example.com" }));
  expect([submitted.action, submitted.draft.samples, submitted.draft.email]).toEqual([null, 2, null]);
});

test("first request retains services and sample details, but requires identity first", () => {
  const first = nextStep(ctx({ state: "requesting", draft: draft({ name: null, verification: "pending" }) }),
    ex({ testIds: ["T001", "T002"], sampleType: "pepper", samples: 3 }));
  expect([first.state, first.draft.testIds, first.draft.samples]).toEqual(["identify", ["T001", "T002"], 3]);
  expect(first.ask).toContain("full name");
  expect(first.events).not.toContainEqual(expect.objectContaining({ label: "Requested services available" }));
});

test("fallback reads phone/GST without using them as sample counts or company names", () => {
  for (const c of seed.customers) {
    const result = parseFallback(`${c.name}, Phone: ${c.phone}, GST ${c.gstNo}`, "identity", seed.sampleTypes);
    expect([result.name, result.phone, result.gstNo, result.samples, result.email], c.id)
      .toEqual([c.name, c.phone, c.gstNo, null, null]);
  }
  expect(parseFallback("3 samples", "samples", seed.sampleTypes).phone).toBeNull();
  expect(parseFallback("pepper.lab@example.com", "email", seed.sampleTypes).sampleType).toBeNull();
  expect(parseFallback("5 samples", "email", seed.sampleTypes).samples).toBe(5);
  expect(parseFallback("-1 samples", "samples", seed.sampleTypes).samples).toBe(-1);
  expect(parseFallback("1.5 samples", "samples", seed.sampleTypes).samples).toBe(1.5);
  expect(parseFallback("Need aflatoxin testing for 3 red chilli powder samples", "tests", seed.sampleTypes).samples).toBe(3);
  for (const email of ["discount@example.com", "urgent@example.com", "aflatoxin.pepper@example.com"]) {
    const read = parseFallback(email, "email", seed.sampleTypes);
    expect([read.intent, read.testIds, read.sampleType, read.samples]).toEqual(["other", [], null, null]);
  }
});

test("invalid counts and unsupported sample changes cannot reuse a previously valid selection", () => {
  const selected = draft({ testIds: ["T001"], sampleType: "Turmeric Powder", samples: 2 });
  for (const samples of [0, -1, 1.5, 51]) {
    const result = nextStep(ctx({ state: "confirming", draft: selected }), ex({ samples, intent: "confirm" }));
    expect(result.action).toBeNull(); expect(result.draft.samples).toBeNull();
  }
  const unsupported = nextStep(ctx({ state: "email", draft: selected }), ex({ sampleType: "honey", email: "user@example.com" }));
  expect([unsupported.action, unsupported.draft.sampleType]).toEqual([null, null]);
});

test("invalid email cannot submit a quotation", () => {
  const selected = draft({ testIds: ["T001"], sampleType: "Turmeric Powder", samples: 2 });
  for (const email of ["bad", "x@y", "a@example.com\r\nBcc: x@y.com", "a".repeat(250) + "@example.com"]) {
    const result = nextStep(ctx({ state: "email", draft: selected }), ex({ email }));
    expect(result.state).toBe("email"); expect(result.action).toBeNull();
  }
});

test("sample count boundaries 1 and 50 are accepted but still need explicit confirmation", () => {
  for (const samples of [1, 50]) {
    const result = nextStep(ctx(), ex({ testIds: ["T002"], sampleType: "chilli", samples }));
    expect([result.state, result.action, result.draft.samples]).toEqual(["confirming", null, samples]);
  }
});

test("duplicate service mentions do not create duplicate quotation lines", () => {
  const result = nextStep(ctx(), ex({ testIds: ["T002", "T002", "T001"], sampleType: "pepper", samples: 3 }));
  expect(result.draft.testIds).toEqual(["T002", "T001"]);
});

test("a discount or urgent request cannot double as confirmation", () => {
  const selected = draft({ testIds: ["T001"], sampleType: "Turmeric Powder", samples: 2, awaiting: "confirm" });
  for (const intent of ["discount", "faster_tat"] as const) {
    const result = nextStep(ctx({ state: "confirming", draft: selected }), ex({ intent }));
    expect(result.state).toBe("confirming"); expect(result.action).toBeNull(); expect(result.flags).toHaveLength(1);
  }
});
