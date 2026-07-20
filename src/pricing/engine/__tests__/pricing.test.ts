import { beforeEach, describe, expect, it } from "vitest";
import type { EstimateInput, PricingEstimate } from "../../types";
import { DEFAULT_PRICING_SETTINGS, SEED_PRICING_RULES } from "../../config/pricingSettings";
import { calculateEstimate, calculateModulePrice, calculateRiskAdjustment } from "../calculateEstimate";
import { createPackageOptions, inputForPackage } from "../createPackageOptions";
import { validateEstimateInput, validatePricingRules } from "../validateEstimate";
import { midpoint } from "../money";

const rules = SEED_PRICING_RULES;
const settings = DEFAULT_PRICING_SETTINGS;

const RETAIL_INVENTORY = "retail--inventory-and-stock-monitoring-system";
const RETAIL_DASHBOARD = "retail--sales-and-branch-dashboard";
const RETAIL_LOYALTY = "retail--customer-loyalty-program";
const LENDING_INTAKE = "lending--application-intake";

function baseInput(overrides: Partial<EstimateInput> = {}): EstimateInput {
  return {
    businessName: "Test Store (Sample)",
    contactPerson: "Juan Dela Cruz",
    industryId: "retail",
    businessExample: "Grocery stores",
    location: "Olongapo",
    businessSize: "small",
    branches: 1,
    employees: "10",
    users: 5,
    monthlyTransactions: "500",
    currentSystems: "Excel",
    primaryProblems: "Stock-outs",
    notes: "",
    deliveryModel: "configured-saas",
    configurationLevel: "configured",
    selectedServiceOfferIds: [RETAIL_INVENTORY, RETAIL_DASHBOARD],
    selectedOptionalServiceIds: [],
    supportPlanId: "basic",
    contingencyPct: 10,
    discountPct: 0,
    manualAdjustment: 0,
    manualAdjustmentReason: "",
    ...overrides,
  };
}

describe("estimate input validation", () => {
  it("1. rejects an empty estimate with clear messages", () => {
    const errors = validateEstimateInput(
      baseInput({ businessName: "", industryId: "", selectedServiceOfferIds: [] }),
      rules,
    );
    expect(errors.length).toBeGreaterThanOrEqual(3);
    expect(errors.join(" ")).toMatch(/business name/i);
    expect(errors.join(" ")).toMatch(/industry/i);
    expect(errors.join(" ")).toMatch(/service offer/i);
  });
});

describe("delivery-model calculations", () => {
  it("2. shared SaaS produces a valid, cheaper one-time estimate", () => {
    const shared = calculateEstimate(baseInput({ deliveryModel: "shared-saas" }), rules, settings);
    const configured = calculateEstimate(baseInput(), rules, settings);
    expect(shared.oneTimeTotal.minimum).toBeGreaterThan(0);
    expect(shared.oneTimeTotal.maximum).toBeGreaterThanOrEqual(shared.oneTimeTotal.minimum);
    expect(shared.oneTimeTotal.minimum).toBeLessThan(configured.oneTimeTotal.minimum);
  });

  it("3. configured SaaS line items add up to the subtotal", () => {
    const r = calculateEstimate(baseInput(), rules, settings);
    const sumMin = r.oneTimeLines.reduce((s, l) => s + l.range.minimum, 0);
    const sumMax = r.oneTimeLines.reduce((s, l) => s + l.range.maximum, 0);
    // Subtotal is rounded to ₱500 steps.
    expect(Math.abs(r.oneTimeSubtotal.minimum - sumMin)).toBeLessThanOrEqual(500);
    expect(Math.abs(r.oneTimeSubtotal.maximum - sumMax)).toBeLessThanOrEqual(500);
  });

  it("4. custom-built costs more up front and adds a maintenance line", () => {
    const custom = calculateEstimate(baseInput({ deliveryModel: "custom-built" }), rules, settings);
    const configured = calculateEstimate(baseInput(), rules, settings);
    expect(custom.oneTimeTotal.minimum).toBeGreaterThan(configured.oneTimeTotal.minimum);
    expect(custom.recurringLines.some((l) => l.id === "maintenance")).toBe(true);
  });

  it("13. exclusive build adds the source-code & exclusivity premium", () => {
    const r = calculateEstimate(baseInput({ deliveryModel: "exclusive-source-transfer" }), rules, settings);
    const premium = r.oneTimeLines.find((l) => l.id === "ownership-premium");
    expect(premium).toBeDefined();
    expect(premium!.range.minimum).toBeGreaterThan(0);
  });
});

describe("size, branches, and users", () => {
  it("5. extra branches add one-time and monthly lines", () => {
    const r = calculateEstimate(baseInput({ branches: 4 }), rules, settings);
    expect(r.oneTimeLines.some((l) => l.id === "branch-setup")).toBe(true);
    const monthly = r.recurringLines.find((l) => l.id === "extra-branches");
    expect(monthly).toBeDefined();
    // small size includes 1 branch → 3 extra
    expect(monthly!.range.minimum).toBe(rules.userBranchRules.extraBranchMonthly.minimum * 3);
    const single = calculateEstimate(baseInput(), rules, settings);
    expect(single.recurringLines.some((l) => l.id === "extra-branches")).toBe(false);
  });

  it("6. extra users add a monthly line", () => {
    const r = calculateEstimate(baseInput({ users: 12 }), rules, settings);
    const line = r.recurringLines.find((l) => l.id === "extra-users");
    expect(line).toBeDefined();
    // small size includes 5 users → 7 extra (engine rounds monthly lines to ₱100)
    const expected = rules.userBranchRules.extraUserMonthly.maximum * 7;
    expect(Math.abs(line!.range.maximum - expected)).toBeLessThanOrEqual(50);
  });
});

describe("optional services and recurring totals", () => {
  it("7. selected optional services increase the one-time estimate", () => {
    const without = calculateEstimate(baseInput(), rules, settings);
    const withOpt = calculateEstimate(
      baseInput({ selectedOptionalServiceIds: ["data-spreadsheet-import", "train-staff-online"] }),
      rules,
      settings,
    );
    expect(withOpt.oneTimeTotal.minimum).toBeGreaterThan(without.oneTimeTotal.minimum);
    expect(withOpt.oneTimeLines.some((l) => l.id.startsWith("optional-"))).toBe(true);
  });

  it("8. monthly recurring includes base, modules, and support plan", () => {
    const r = calculateEstimate(baseInput({ supportPlanId: "standard" }), rules, settings);
    expect(r.recurringLines.some((l) => l.id === "base-subscription")).toBe(true);
    expect(r.recurringLines.some((l) => l.id === "module-subscription")).toBe(true);
    const support = r.recurringLines.find((l) => l.id === "support-plan");
    expect(support?.range).toEqual(rules.supportPlans.find((p) => p.id === "standard")!.monthlyPrice);
    expect(r.recurringTotal.minimum).toBeGreaterThan(0);
  });
});

describe("discount, tax, and margin", () => {
  it("9. a discount lowers the total and appears as a negative line", () => {
    const plain = calculateEstimate(baseInput(), rules, settings);
    const discounted = calculateEstimate(baseInput({ discountPct: 10 }), rules, settings);
    const line = discounted.oneTimeLines.find((l) => l.id === "discount");
    expect(line).toBeDefined();
    expect(line!.range.maximum).toBeLessThan(0);
    expect(discounted.oneTimeTotal.maximum).toBeLessThan(plain.oneTimeTotal.maximum);
  });

  it("10. enabling VAT adds ~12% tax on both totals", () => {
    const taxed = calculateEstimate(baseInput(), rules, { ...settings, vatEnabled: true, vatPct: 12 });
    expect(taxed.oneTimeTax).not.toBeNull();
    const expected = midpoint(taxed.oneTimeSubtotal) * 0.12;
    expect(midpoint(taxed.oneTimeTax!)).toBeGreaterThan(expected * 0.9);
    expect(midpoint(taxed.oneTimeTax!)).toBeLessThan(expected * 1.1);
    expect(taxed.oneTimeTotal.maximum).toBe(taxed.oneTimeSubtotal.maximum + taxed.oneTimeTax!.maximum);
    expect(taxed.recurringTax).not.toBeNull();
  });

  it("11. a deep discount triggers margin warnings", () => {
    const r = calculateEstimate(baseInput({ discountPct: 60 }), rules, settings);
    expect(r.internalWarnings.join(" ")).toMatch(/margin|below/i);
    expect(r.internalWarnings.join(" ")).toMatch(/exceeds the configured maximum/i);
  });

  it("suggested selling price follows cost ÷ (1 − margin)", () => {
    const r = calculateEstimate(baseInput(), rules, settings);
    const cost = r.internal.estimatedInternalCost;
    const expectedMin = cost.minimum / (1 - settings.targetGrossMarginPct / 100);
    expect(Math.abs(r.internal.suggestedSellingPrice.minimum - expectedMin)).toBeLessThanOrEqual(500);
  });
});

describe("sensitive-industry rules", () => {
  it("12. lending selections require manual review and block approval status", () => {
    const r = calculateEstimate(
      baseInput({ industryId: "lending", selectedServiceOfferIds: [LENDING_INTAKE] }),
      rules,
      settings,
    );
    expect(r.manualReviewReasons.length).toBeGreaterThan(0);
    expect(r.pricingStatus).toBe("manual-review-required");
    // Non-sensitive portions are still calculated and shown.
    expect(r.oneTimeTotal.minimum).toBeGreaterThan(0);
  });

  it("industry risk falls back to the default % for cautioned industries", () => {
    const healthcare = calculateRiskAdjustment("healthcare", rules);
    expect(healthcare.riskPct).toBe(12);
    const retail = calculateRiskAdjustment("retail", rules);
    expect(retail.riskPct).toBe(0);
  });
});

describe("package generation", () => {
  it("14. builds Essential ⊆ Growth ⊆ Advanced from current selections", () => {
    const input = baseInput({
      selectedServiceOfferIds: [RETAIL_INVENTORY, RETAIL_DASHBOARD, RETAIL_LOYALTY],
      selectedOptionalServiceIds: ["rep-custom-dashboard"],
    });
    const packages = createPackageOptions(input, rules);
    expect(packages).toHaveLength(3);
    const [essential, growth, advanced] = packages;
    expect(essential.serviceOfferIds.length).toBeGreaterThan(0);
    for (const id of essential.serviceOfferIds) expect(growth.serviceOfferIds).toContain(id);
    for (const id of growth.serviceOfferIds) expect(advanced.serviceOfferIds).toContain(id);
    expect(packages.filter((p) => p.recommended)).toHaveLength(1);
    // Each package prices cheaper or equal up the ladder.
    const rEss = calculateEstimate(inputForPackage(input, essential), rules, settings);
    const rAdv = calculateEstimate(inputForPackage(input, advanced), rules, settings);
    expect(rEss.oneTimeTotal.minimum).toBeLessThanOrEqual(rAdv.oneTimeTotal.minimum);
  });
});

describe("module pricing", () => {
  it("resolves overrides for seed industries and falls back to module defaults", () => {
    const overridden = calculateModulePrice(RETAIL_INVENTORY, rules)!;
    expect(overridden.setup.minimum).toBe(20000); // seed override
    const generic = calculateModulePrice(RETAIL_LOYALTY, rules)!;
    expect(generic.setup).toEqual(rules.modulePricing.find((m) => m.module === "membership")!.setupPrice);
  });
});

describe("localStorage save and restore", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    } as Storage;
  });

  it("15. estimates round-trip through the repository with unique numbers", async () => {
    const { loadEstimates, nextEstimateNumber, upsertEstimate } = await import("../../store/pricingStorage");
    const input = baseInput();
    const result = calculateEstimate(input, rules, settings);
    const year = new Date().getFullYear();
    const est: PricingEstimate = {
      schemaVersion: 1,
      id: "e1",
      estimateNumber: nextEstimateNumber([]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceTableVersion: rules.version,
      status: "preliminary",
      archived: false,
      input,
      result,
      packages: createPackageOptions(input, rules),
    };
    expect(est.estimateNumber).toBe(`EST-${year}-0001`);
    upsertEstimate(est);
    const loaded = loadEstimates();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].input.businessName).toBe("Test Store (Sample)");
    expect(loaded[0].result.oneTimeTotal).toEqual(result.oneTimeTotal);
    expect(nextEstimateNumber(loaded)).toBe(`EST-${year}-0002`);
    // Unknown-schema entries are dropped safely, not crashed on.
    localStorage.setItem(
      "bizsolutions.pricing.estimates.v1",
      JSON.stringify({ version: 1, estimates: [...loaded, { schemaVersion: 99 }] }),
    );
    expect(loadEstimates()).toHaveLength(1);
  });
});

describe("imported pricing validation", () => {
  it("16. accepts the seed rules and rejects broken imports", () => {
    expect(validatePricingRules(SEED_PRICING_RULES)).toEqual([]);
    expect(validatePricingRules(null).length).toBeGreaterThan(0);
    expect(validatePricingRules({}).length).toBeGreaterThan(0);
    const broken = JSON.parse(JSON.stringify(SEED_PRICING_RULES));
    broken.modulePricing[0].setupPrice = { minimum: 100, maximum: 50 }; // min > max
    expect(validatePricingRules(broken).length).toBeGreaterThan(0);
    const negativeFactor = JSON.parse(JSON.stringify(SEED_PRICING_RULES));
    negativeFactor.businessSizes[0].sizeFactor = 0;
    expect(validatePricingRules(negativeFactor).length).toBeGreaterThan(0);
  });
});
