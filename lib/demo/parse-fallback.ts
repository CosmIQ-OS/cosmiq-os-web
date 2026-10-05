import { matchSampleType } from "./sample-types";
import type { Awaiting, Extraction, Intent } from "./types";

// Offline reader used when Gemini is not configured, slow or failing.
// Deliberately simple: keyword rules over one message, guided by what the agent last asked.
const TEST_KEYWORDS: Array<[string, RegExp]> = [
  ["T001", /pesticide|residue|\bmrls?\b/i],
  ["T002", /afla(toxin)?|mycotoxin/i],
  ["T003", /heavy\s*metals?|cadmium|arsenic|mercury|\blead\b/i],
  ["T004", /micro(bio(logical)?)?|salmonella|e\.?\s?coli|bacteria|plate\s*count|yeast|mou?ld/i],
  ["T005", /adulterat|sudan|colou?r\s*(test|dye)?|\bdyes?\b|starch|brick/i],
];
const UNOFFERED_TESTS = /\b(gluten|vitamins?|allergens?|moisture|nutrition(al)?|protein|fat content|dna|gmo|shelf[- ]life|caffeine|calories?|pesticide-free certification)\b/i;
const OTHER_FOODS = /\b(honey|milk|rice|wheat|flour|oil|ghee|tea|coffee|water|meat|chicken|fish|eggs?|fruits?|vegetables?|juice|sugar|salt|cashews?|almonds?|dates|cocoa|chocolate|pulses|dal)\b/i;

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
};

const INTENTS: Array<[Intent, RegExp]> = [
  ["discount", /discount|cheaper|reduce (the )?price|less price|best price|concession|negotiat|bargain|lower (the )?(price|rate)/i],
  ["faster_tat", /urgent|faster|express|quicker|asap|same day|\brush\b|(in|within)\s+(1|one|2|two)\s+days?|by tomorrow/i],
  ["confirm", /^\s*(yes|yeah|yep|ok(ay)?|confirm(ed)?|go ahead|book( it)?|proceed|accept(ed)?|sure|done)\b/i],
  ["decline", /^\s*(no|nope|not now|cancel|later|no thanks)\b/i],
  ["greeting", /^\s*(hi|hello|hey|good (morning|afternoon|evening)|namaskaram|namaste)\b/i],
];

function readSamples(text: string, awaiting: Awaiting): number | null {
  // Ignore weights, durations and IDs: "500 g each", "5 days", "ORD-1001".
  const cleaned = text.replace(/\b[A-Z]{1,4}-?\d+\b/g, " ").replace(/\d+(\.\d+)?\s*(g|gm|gms|grams?|kg|kgs|ml|l|days?|%)\b/gi, " ");
  // "3 samples", "3 chilli samples", "three pepper batches": up to two words between number and unit.
  const counted = cleaned.match(/(\d+|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\b)\s*(?:[a-z]+\s+){0,2}(samples?|nos?\.?|batch(es)?|lots?|packets?|pcs)\b/i);
  const toNumber = (s: string) => (/^\d+$/.test(s) ? Number(s) : NUMBER_WORDS[s.toLowerCase()] ?? null);
  if (counted) return toNumber(counted[1]);
  if (awaiting === "samples") {
    const bare = cleaned.match(/\d+|\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\b/i);
    if (bare) return toNumber(bare[0]);
  }
  return null;
}

function readIdentity(text: string): { name: string | null; company: string | null } {
  const intro = text.match(/(?:i am|i'm|this is|my name is)\s+([a-z .']+?)(?:\s*(?:,|from|at|of)\s+(.+))?$/i);
  if (intro) return { name: intro[1].trim(), company: intro[2]?.trim() ?? null };
  const parts = text.split(/,|\s+from\s+/i).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { name: parts[0], company: parts.slice(1).join(", ") };
  return { name: text.trim().length <= 40 ? text.trim() : null, company: null };
}

const EMAIL_IN_TEXT = /[^\s@,;:()]+@[^\s@,;:()]+\.[a-z]{2,}/i;
const GSTIN_IN_TEXT = /\b\d{2}\s?[A-Z]{5}\s?\d{4}\s?[A-Z][1-9A-Z]Z[0-9A-Z]\b/i;
const NO_GST = /\b(no|don'?t have( a)?|not registered( for)?|without( a)?|unregistered)\b[^.]{0,20}\bgst/i;
// "Email:", "GST no.", "GSTIN"; "Name:" / "Company:" only with a colon, so "my name is…" survives.
const CONTACT_LABELS = /\b(e-?mail( id| address)?|mail id|gstin|gst\s*(no\.?|number|num)?)\b\s*[:\-]?|\b(name|company)\s*:/gi;

// "Spice Route Exports. Email … and our GSTIN is …" → "Spice Route Exports"
function cleanCompany(raw: string): string | null {
  const cut = raw.split(/[.;,]|\s+(?:and\s+)?(?:our|my|we|email|e-?mail|gst(?:in)?)\b/i)[0].trim();
  return cut.length >= 2 ? cut : null;
}

export function parseFallback(text: string, awaiting: Awaiting, sampleTypes: string[]): Extraction {
  const email = text.match(EMAIL_IN_TEXT)?.[0] ?? null;
  const gstNo = text.match(GSTIN_IN_TEXT)?.[0].replace(/\s/g, "").toUpperCase() ?? null;
  const noGst = NO_GST.test(text);
  // While asking for contact details, spice words are usually company names ("Rajputana Chilli Industries"),
  // so only an explicitly named test turns the message into an enquiry.
  const namesATest = TEST_KEYWORDS.some(([, re]) => re.test(text)) || UNOFFERED_TESTS.test(text);
  const detailsOnly = awaiting === "identity" && (email !== null || gstNo !== null || noGst || !namesATest);

  const intent = detailsOnly ? "other" : INTENTS.find(([, re]) => re.test(text))?.[0] ?? "enquiry";
  const testIds = detailsOnly ? [] : TEST_KEYWORDS.filter(([, re]) => re.test(text)).map(([id]) => id);
  const unknownTests = !detailsOnly && UNOFFERED_TESTS.test(text) ? [text.match(UNOFFERED_TESTS)![0]] : [];

  let sampleType: string | null = detailsOnly ? null : matchSampleType(text, sampleTypes);
  if (!sampleType && !detailsOnly) {
    const other = text.match(OTHER_FOODS);
    if (other) sampleType = other[0];
  }

  // "Hi, I'm Asha from Spice Co, asha@…, GST …" → drop greeting, email, GST and labels; keep name and company.
  const intro = text
    .replace(EMAIL_IN_TEXT, " ").replace(GSTIN_IN_TEXT, " ").replace(NO_GST, " ").replace(CONTACT_LABELS, " ")
    .replace(/^\s*(hi|hello|hey|good (morning|afternoon|evening)|namaskaram|namaste)[\s,!.]*/i, "")
    .replace(/\s*,(\s*,)+/g, ",").replace(/^[\s,.]+|[\s,.]+$/g, "");
  const talksAboutTests = testIds.length > 0 || sampleType !== null || unknownTests.length > 0;
  const identity = awaiting === "identity" && intro && !(talksAboutTests && !/i am|i'm|this is|my name is/i.test(intro))
    ? readIdentity(intro)
    : { name: null, company: null };
  return {
    intent,
    testIds,
    unknownTests,
    sampleType,
    samples: detailsOnly ? null : readSamples(text, awaiting),
    name: identity.name,
    company: identity.company ? cleanCompany(identity.company) : null,
    email,
    gstNo,
    noGst,
    engine: "fallback",
  };
}
