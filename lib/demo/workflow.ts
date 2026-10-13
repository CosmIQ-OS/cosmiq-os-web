import { matchSampleType } from "./sample-types";
import type { ConvState, Draft, Extraction, LabTest, TraceEvent } from "./types";
import { EMAIL, GSTIN, listWords, normaliseGst, normalisePhone, validPhone } from "./verify";

// CONTRACT
// GUARANTEES: service-first, identity check, catalogue-only selection, explicit summary confirmation,
//   then delivery email and a pending-approval submission. Submitted drafts never change in chat.
// EXPECTS: orchestration performs the verify action against the database before collecting.
// FAILURE BEHAVIOR: invalid details remain missing; unsupported requests are flagged for staff.
// DOES NOT: access DB/AI, calculate prices, send emails, approve quotes or create orders.
export interface Ctx {
  state: ConvState; draft: Draft; pastSampleTypes: string[]; catalog: LabTest[]; sampleTypes: string[];
}
export interface Step {
  state: ConvState; draft: Draft; notes: string[]; ask: string | null; chips: string[];
  flags: string[]; events: TraceEvent[]; action: null | "verify" | "submit";
}
const MAX_SAMPLES = 50;
export const firstName = (name: string) => name.trim().split(/\s+/)[0];
export const shortTestName = (t: LabTest) => t.name.replace(/\s*\(.*?\)/g, "").replace(/\s+(Analysis|Testing|Test)\b/g, "").trim();

export function nextStep(ctx: Ctx, ex: Extraction): Step {
  const draft: Draft = { ...ctx.draft, testIds: [...ctx.draft.testIds], orderIds: [...ctx.draft.orderIds] };
  let state = ctx.state;
  const notes: string[] = [], flags: string[] = [];
  const events: TraceEvent[] = [];
  const done = (partial: Partial<Step>): Step => ({ state, draft, notes, flags, events, ask: null, chips: [], action: null, ...partial });
  if (ctx.draft.workflowVersion !== 2) return done({ ask: "This chat used an older workflow. Please start a new chat." });
  if (state === "pending_approval") {
    return done({ ask: "Your request has been submitted. Your quotation will be emailed to you after approval. To change it, please contact the lab or start a new enquiry." });
  }
  // Old saved demo sessions cannot safely resume with a different ordering of checks.
  if (!["requesting", "identify", "collecting", "confirming", "email"].includes(state)) {
    return done({ ask: "This chat used an older workflow. Please start a new chat." });
  }
  if (ex.intent === "discount") {
    flags.push("discount requested");
    notes.push("I can't offer discounts or change prices. I've flagged your request for our team.");
  }
  if (ex.intent === "faster_tat") {
    flags.push("faster turnaround requested");
    notes.push("Turnaround times come from our lab system. I've asked our team to check your urgent request.");
  }
  for (const unknown of ex.unknownTests) {
    flags.push(`test not in catalogue: ${unknown}`);
    notes.push(`We don't offer "${unknown}" in our current service list. I've passed it to our team to check.`);
  }
  const before = JSON.stringify([draft.testIds, draft.sampleType, draft.samples]);
  for (const id of ex.testIds) {
    if (!ctx.catalog.some((t) => t.id === id) || draft.testIds.includes(id)) continue;
    draft.testIds.push(id);
  }
  if (ex.sampleType) {
    const accepted = matchSampleType(ex.sampleType, ctx.sampleTypes);
    draft.sampleType = accepted;
    if (!accepted) {
      flags.push(`sample type not accepted: ${ex.sampleType}`);
      notes.push(`${ex.sampleType.charAt(0).toUpperCase() + ex.sampleType.slice(1)} isn't on our list of accepted sample types. I've flagged it for our team to check.`);
    }
  }
  if (ex.samples !== null) {
    draft.samples = Number.isInteger(ex.samples) && ex.samples >= 1 && ex.samples <= MAX_SAMPLES ? ex.samples : null;
    if (!draft.samples) {
      notes.push(`Please enter a whole-number sample count between 1 and ${MAX_SAMPLES}. Larger batches need a staff quotation.`);
      if (ex.samples > MAX_SAMPLES) flags.push(`large batch: ${ex.samples} samples`);
    }
  }
  const changed = before !== JSON.stringify([draft.testIds, draft.sampleType, draft.samples]);

  if (state === "requesting") {
    if (!draft.testIds.length && !ex.unknownTests.length) {
      draft.awaiting = "tests";
      return done({ ask: "Which testing services do you need?", chips: ctx.catalog.map(shortTestName) });
    }
    state = "identify";
  }
  if (state === "identify") {
    if (ex.name) draft.name = ex.name;
    if (ex.phone) {
      if (validPhone(ex.phone)) draft.phone = normalisePhone(ex.phone);
      else notes.push("Please enter a valid phone number including the country code.");
    }
    if (ex.gstNo) {
      const gst = normaliseGst(ex.gstNo);
      if (GSTIN.test(gst)) { draft.gstNo = gst; draft.noGst = false; }
      else notes.push(`"${ex.gstNo}" doesn't look like a GST number. A GSTIN has 15 characters.`);
    }
    if (ex.noGst) { draft.noGst = true; draft.gstNo = null; }
    const missing = [!draft.name && "full name", !draft.phone && "phone number (including country code)",
      !draft.gstNo && !draft.noGst && "GST number"].filter((f): f is string => !!f);
    draft.awaiting = "identity";
    if (missing.length) return done({ state, ask: `To verify you, please share your ${listWords(missing)}.` });
    draft.awaiting = null;
    return done({ state, action: "verify" });
  }

  if (changed && (state === "confirming" || state === "email")) {
    state = "collecting";
    draft.email = null;
    events.push({ kind: "info", label: "Selection changed: confirmation required again" });
  }
  if (state === "email") {
    draft.awaiting = "email";
    if (!ex.email || !EMAIL.test(ex.email) || ex.email.length > 254) {
      return done({ state, ask: ex.email ? "That email doesn't look right. Please send a valid email address." : "What email address should we send your quotation to?" });
    }
    draft.email = ex.email.toLowerCase();
    draft.awaiting = null;
    return done({ state: "pending_approval", action: "submit" });
  }

  const missing = !draft.testIds.length ? "tests" : !draft.sampleType ? "sampleType" : !draft.samples ? "samples" : null;
  if (!missing) {
    if (state === "confirming" && !changed && ex.intent === "confirm" && flags.length === 0) {
      draft.awaiting = "email";
      return done({ state: "email", ask: "What email address should we send your quotation to?" });
    }
    const selected = ctx.catalog.filter((t) => draft.testIds.includes(t.id));
    events.push({ kind: "db", label: "Requested services available", detail: selected.map((t) => t.name).join(", ") });
    draft.awaiting = "confirm";
    const summary = `${selected.map(shortTestName).join(", ")} for ${draft.samples} sample${draft.samples === 1 ? "" : "s"} of ${draft.sampleType}`;
    return done({ state: "confirming", ask: `${ex.intent === "decline" ? "Nothing has been submitted. Tell me what to change, or confirm when ready.\n\n" : ""}Please confirm: ${summary}. Is this correct?`, chips: ["Confirm", "Not yet"] });
  }
  draft.awaiting = missing;
  let ask: string, chips: string[];
  const available = ctx.catalog.filter((t) => draft.testIds.includes(t.id));
  if (available.length) events.push({ kind: "db", label: "Requested services available", detail: available.map((t) => t.name).join(", ") });
  if (missing === "tests") {
    ask = "Which available testing services do you need?"; chips = ctx.catalog.map(shortTestName);
  } else if (missing === "sampleType") {
    ask = "Which sample type is this for? For example Black Pepper, Turmeric Powder or Red Chilli Powder.";
    chips = [...new Set([...ctx.pastSampleTypes.slice(0, 3), ...ctx.sampleTypes])].slice(0, 6);
  } else {
    ask = `How many samples of ${draft.sampleType} will you send?`; chips = ["1 sample", "3 samples", "5 samples", "10 samples"];
  }
  events.push({ kind: "ask", label: `Asked for: ${missing}` });
  return done({ state: "collecting", ask, chips });
}
