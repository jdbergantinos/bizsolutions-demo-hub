import { load, remove, save, uid } from "../../utils/storage";
import type { EstimateInput, PricingEstimate, PricingRules, PricingSettings } from "../types";
import { DEFAULT_PRICING_SETTINGS, SEED_PRICING_RULES } from "../config/pricingSettings";
import { validatePricingRules } from "../engine/validateEstimate";

// Centralized pricing persistence. Follows the app's existing key pattern
// ("bizsolutions." prefix) so "Reset entire application" clears these too.
export const PRICING_KEYS = {
  estimates: "bizsolutions.pricing.estimates.v1",
  settings: "bizsolutions.pricing.settings.v1",
  rules: "bizsolutions.pricing.rules.v1",
  draft: "bizsolutions.pricing.draft.v1",
} as const;

interface EstimateStore {
  version: 1;
  estimates: PricingEstimate[];
}

// ---------- Estimates ----------

export function loadEstimates(): PricingEstimate[] {
  const store = load<EstimateStore | null>(PRICING_KEYS.estimates, null);
  if (!store || store.version !== 1 || !Array.isArray(store.estimates)) return [];
  // Migration-safe: keep only entries this schema understands.
  return store.estimates.filter((e) => e && e.schemaVersion === 1 && e.id && e.input && e.result);
}

export function saveEstimates(estimates: PricingEstimate[]): void {
  save(PRICING_KEYS.estimates, { version: 1, estimates } satisfies EstimateStore);
}

export function upsertEstimate(estimate: PricingEstimate): PricingEstimate[] {
  const all = loadEstimates();
  const i = all.findIndex((e) => e.id === estimate.id);
  const next = i >= 0 ? all.map((e) => (e.id === estimate.id ? estimate : e)) : [estimate, ...all];
  saveEstimates(next);
  return next;
}

export function deleteEstimate(id: string): PricingEstimate[] {
  const next = loadEstimates().filter((e) => e.id !== id);
  saveEstimates(next);
  return next;
}

/** Readable, collision-free number like EST-2026-0007. */
export function nextEstimateNumber(existing: PricingEstimate[]): string {
  const year = new Date().getFullYear();
  const prefix = `EST-${year}-`;
  const max = existing
    .filter((e) => e.estimateNumber.startsWith(prefix))
    .reduce((m, e) => Math.max(m, parseInt(e.estimateNumber.slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export function newEstimateId(): string {
  return uid();
}

// ---------- Settings ----------

export function loadPricingSettings(): PricingSettings {
  const stored = load<Partial<PricingSettings> | null>(PRICING_KEYS.settings, null);
  return { ...DEFAULT_PRICING_SETTINGS, ...(stored ?? {}) };
}

export function savePricingSettings(settings: PricingSettings): void {
  save(PRICING_KEYS.settings, settings);
}

// ---------- Rules ----------

export function loadPricingRules(): PricingRules {
  const stored = load<PricingRules | null>(PRICING_KEYS.rules, null);
  if (stored && validatePricingRules(stored).length === 0) return stored;
  return SEED_PRICING_RULES;
}

export function savePricingRules(rules: PricingRules): string[] {
  const errors = validatePricingRules(rules);
  if (errors.length === 0) save(PRICING_KEYS.rules, rules);
  return errors;
}

export function resetPricingRules(): void {
  remove(PRICING_KEYS.rules);
}

export function rulesAreCustomized(): boolean {
  return load<PricingRules | null>(PRICING_KEYS.rules, null) !== null;
}

// ---------- Wizard draft (exit without losing work) ----------

export function loadDraft(): EstimateInput | null {
  return load<EstimateInput | null>(PRICING_KEYS.draft, null);
}

export function saveDraft(input: EstimateInput): void {
  save(PRICING_KEYS.draft, input);
}

export function clearDraft(): void {
  remove(PRICING_KEYS.draft);
}
