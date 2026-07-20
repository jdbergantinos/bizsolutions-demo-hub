import type { FieldDef } from "../types";

/**
 * Shared sample-answer placeholders. Demo forms derive one from the field's
 * label via placeholderFor(); other screens use hand-written examples and
 * only fall back to this when nothing better exists.
 */

// Order matters: specific patterns must come before generic ones
// (e.g. "Plate no." must match the plate rule, not the "no." rule).
const RULES: [RegExp, string][] = [
  [/mobile|phone/, "0917 000 0000"],
  [/plate/, "e.g. NDA 3921"],
  [/vehicle/, "e.g. Toyota Vios 2019"],
  [/sku|part number/, "e.g. GRO-0042"],
  [/job order/, "e.g. JO-1041"],
  [/batch/, "e.g. Batch 2026-1"],
  [/company|group/, "e.g. Subic Bay Trading Corp. (Sample)"],
  [/supplier/, "e.g. Zambales Trading Corp. (Sample)"],
  [/concern|justification|details|notes|remarks|proof/, "e.g. Discussed by phone — details to follow (sample)"],
  [/reported by|requested by|owner|related/, "e.g. Maria Santos (Sample)"],
  [/name|customer|client|dealer|buyer|guest|patient|member|student|participant|applicant|family/, "e.g. Juan Dela Cruz (Sample)"],
  [/interested|interest/, "e.g. Monthly bulk order"],
  [/service|purpose|program|course/, "e.g. Standard package"],
  [/title|subject/, "e.g. Follow-up on pending order"],
  [/reference|ref\b|no\./, "e.g. INV-5401"],
  [/category/, "e.g. Fast-moving"],
  [/unit\b/, "pcs, box, kg"],
  [/branch|location|destination/, "e.g. Olongapo City"],
  [/duty|post\b/, "e.g. Counter duty"],
  [/asset/, "e.g. Aircon unit — 2F"],
  [/load|items/, "e.g. 3 boxes assorted"],
];

/** Sample answer for a free-text label. */
export function sampleFor(label: string): string {
  const lower = label.toLowerCase();
  for (const [re, text] of RULES) if (re.test(lower)) return text;
  return "Sample answer (demo only)";
}

/** Placeholder for a demo-scenario field definition. */
export function placeholderFor(f: FieldDef): string | undefined {
  if (f.placeholder) return f.placeholder;
  if (f.type === "currency") return "e.g. 25000";
  if (f.type === "number") return "e.g. 10";
  if (f.type === "date" || f.type === "time" || f.type === "select") return undefined;
  return sampleFor(f.label);
}
