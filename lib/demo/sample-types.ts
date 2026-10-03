// Maps what customers type ("chilli", "jeera", "haldi") to the lab's accepted sample types.
// Used for both AI and fallback output, so the database list is always the final word.
const SYNONYMS: Array<[RegExp, string]> = [
  [/black\s*pepper|\bpepper\b|kali\s*mirch/i, "Black Pepper"],
  [/cardamom|elaichi|elakkai/i, "Cardamom"],
  [/cinnamon|dalchini|karuvapatta/i, "Cinnamon"],
  [/clove|laung|grambu/i, "Cloves"],
  [/coriander|dhania|malli/i, "Coriander Powder"],
  [/cumin|jeera|jeerakam/i, "Cumin Seeds"],
  [/fenugreek|methi|uluva/i, "Fenugreek"],
  [/garam\s*masala/i, "Garam Masala"],
  [/ginger|sonth|chukku/i, "Ginger Powder"],
  [/nutmeg|jaiphal|jathikka/i, "Nutmeg"],
  [/chil+[iy]e?s?|chili|mirch|mulaku/i, "Red Chilli Powder"],
  [/saffron|kesar/i, "Saffron"],
  [/turmeric|haldi|manjal/i, "Turmeric Powder"],
];

export function matchSampleType(text: string, accepted: string[]): string | null {
  const exact = accepted.find((t) => t.toLowerCase() === text.trim().toLowerCase());
  if (exact) return exact;
  for (const [pattern, type] of SYNONYMS) {
    if (pattern.test(text) && accepted.includes(type)) return type;
  }
  return null;
}
