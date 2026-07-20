import type { PriceRange, PricingEstimate } from "../../pricing/types";
import { add, isZero, roundRange, ZERO } from "../../pricing/engine/money";
import type { RoiInputs, RoiLine, RoiResult, UncertaintyLevel } from "../types";

export const ROI_DISCLAIMER =
  "Illustrative estimate based on client-provided assumptions. Actual savings, revenue, productivity gains, and return are not guaranteed.";

const WEEKS_PER_MONTH = 4.33;
/** Approximate working hours per month for converting salary to hourly cost. */
const HOURS_PER_MONTH = 173;

export function emptyRoiInputs(): RoiInputs {
  return {
    manualWorkEmployees: 0,
    manualHoursPerEmployeeWeek: 0,
    employeeMonthlyCost: 0,
    reportHoursPerWeek: 0,
    missedAppointmentsPerMonth: 0,
    valuePerAppointment: 0,
    lostLeadsPerMonth: 0,
    valuePerConvertedLead: 0,
    inventoryLossPerMonth: 0,
    delayedCollections: 0,
    paperCommsCostPerMonth: 0,
    duplicateEntryHoursPerWeek: 0,
    averageProcessDelayDays: 0,
    improvementPct: 30,
    clientAssumptions: "",
    presenterNotes: "",
  };
}

/**
 * A conservative-to-stated range: the low end assumes only half of the
 * client's improvement assumption materializes.
 */
function improvementRange(inputs: RoiInputs): { low: number; high: number } {
  const pct = Math.min(90, Math.max(0, inputs.improvementPct)) / 100;
  return { low: pct * 0.5, high: pct };
}

const rangeOf = (base: number, low: number, high: number): PriceRange => ({
  minimum: Math.round(base * low),
  maximum: Math.round(base * high),
});

/** Pure ROI calculation. Payback/return only when a pricing estimate is linked. */
export function calculateRoi(inputs: RoiInputs, estimate?: PricingEstimate | null): RoiResult {
  const imp = improvementRange(inputs);
  const hourlyCost = inputs.employeeMonthlyCost > 0 ? inputs.employeeMonthlyCost / HOURS_PER_MONTH : 0;

  // ---- Time savings ----
  const manualHoursMonthly = inputs.manualWorkEmployees * inputs.manualHoursPerEmployeeWeek * WEEKS_PER_MONTH;
  const adminHoursSaved = rangeOf(manualHoursMonthly, imp.low, imp.high);
  const reportHoursMonthly = inputs.reportHoursPerWeek * WEEKS_PER_MONTH;
  const reportingHoursSaved = rangeOf(reportHoursMonthly, imp.low, imp.high);
  const duplicateHoursMonthly = inputs.duplicateEntryHoursPerWeek * WEEKS_PER_MONTH;
  const duplicateHoursSaved = rangeOf(duplicateHoursMonthly, imp.low, imp.high);

  const timeSavings: RoiLine[] = [];
  if (manualHoursMonthly > 0 && hourlyCost > 0) {
    timeSavings.push({
      id: "manual-work",
      label: "Manual administrative work reduced",
      range: roundRange(rangeOf(manualHoursMonthly * hourlyCost, imp.low, imp.high), 100),
      note: `≈${adminHoursSaved.minimum}–${adminHoursSaved.maximum} hours/month`,
    });
  }
  if (reportHoursMonthly > 0 && hourlyCost > 0) {
    timeSavings.push({
      id: "reporting",
      label: "Report preparation reduced",
      range: roundRange(rangeOf(reportHoursMonthly * hourlyCost, imp.low, imp.high), 100),
      note: `≈${reportingHoursSaved.minimum}–${reportingHoursSaved.maximum} hours/month`,
    });
  }
  if (duplicateHoursMonthly > 0 && hourlyCost > 0) {
    timeSavings.push({
      id: "duplicate-entry",
      label: "Repeated data entry reduced",
      range: roundRange(rangeOf(duplicateHoursMonthly * hourlyCost, imp.low, imp.high), 100),
      note: `≈${duplicateHoursSaved.minimum}–${duplicateHoursSaved.maximum} hours/month`,
    });
  }

  // ---- Cost savings ----
  const costSavings: RoiLine[] = [];
  if (inputs.inventoryLossPerMonth > 0) {
    costSavings.push({
      id: "inventory-loss",
      label: "Inventory loss / discrepancy reduction",
      range: roundRange(rangeOf(inputs.inventoryLossPerMonth, 0.3, 0.6), 100),
      note: "Assumes 30–60% of stated loss becomes preventable",
    });
  }
  if (inputs.paperCommsCostPerMonth > 0) {
    costSavings.push({
      id: "paper-comms",
      label: "Paper, printing, and communication costs reduced",
      range: roundRange(rangeOf(inputs.paperCommsCostPerMonth, 0.4, 0.8), 100),
    });
  }

  // ---- Revenue opportunity ----
  const revenueOpportunity: RoiLine[] = [];
  if (inputs.missedAppointmentsPerMonth > 0 && inputs.valuePerAppointment > 0) {
    revenueOpportunity.push({
      id: "appointments",
      label: "Recovered missed appointments",
      range: roundRange(rangeOf(inputs.missedAppointmentsPerMonth * inputs.valuePerAppointment, 0.3, 0.7), 100),
      note: "Assumes reminders recover 30–70% of missed appointments",
    });
  }
  if (inputs.lostLeadsPerMonth > 0 && inputs.valuePerConvertedLead > 0) {
    revenueOpportunity.push({
      id: "leads",
      label: "Recovered forgotten leads",
      range: roundRange(rangeOf(inputs.lostLeadsPerMonth * inputs.valuePerConvertedLead, 0.25, 0.5), 100),
      note: "Assumes 25–50% of lost leads convert once followed up",
    });
  }

  // ---- Risk reduction (cash-flow / exposure, not recurring income) ----
  const riskReduction: RoiLine[] = [];
  if (inputs.delayedCollections > 0) {
    riskReduction.push({
      id: "collections",
      label: "Delayed collections brought forward (one-time cash-flow effect)",
      range: roundRange(rangeOf(inputs.delayedCollections, 0.3, 0.6), 100),
      note: "Earlier collection of existing receivables — not new revenue",
    });
  }

  const nonFinancialBenefits = [
    "Clearer accountability and audit trails",
    "More professional client experience",
    "Less dependence on individual memory",
    "Faster onboarding of new staff",
    inputs.averageProcessDelayDays > 0
      ? `Shorter process turnaround (currently ~${inputs.averageProcessDelayDays} day(s) of waiting per cycle)`
      : "Shorter waiting time inside processes",
  ];

  // Monthly recurring value excludes the one-time collections effect.
  const monthlyValueTotal = roundRange(
    add(...[...timeSavings, ...costSavings, ...revenueOpportunity].map((l) => l.range), ZERO),
    100,
  );
  const yearlyValueTotal = roundRange(
    { minimum: monthlyValueTotal.minimum * 12, maximum: monthlyValueTotal.maximum * 12 },
    500,
  );

  // ---- Payback & return (needs a linked pricing estimate) ----
  let paybackMonths: PriceRange | undefined;
  let firstYearReturnPct: PriceRange | undefined;
  if (estimate && !isZero(monthlyValueTotal)) {
    const oneTime = estimate.result.oneTimeTotal;
    const monthly = estimate.result.recurringTotal;
    const netMonthlyMin = monthlyValueTotal.minimum - monthly.maximum;
    const netMonthlyMax = monthlyValueTotal.maximum - monthly.minimum;
    if (netMonthlyMax > 0) {
      paybackMonths = {
        minimum: Math.max(1, Math.round(oneTime.minimum / netMonthlyMax)),
        maximum: netMonthlyMin > 0 ? Math.round(oneTime.maximum / netMonthlyMin) : 60,
      };
    }
    const firstYearCostMin = oneTime.minimum + monthly.minimum * 12;
    const firstYearCostMax = oneTime.maximum + monthly.maximum * 12;
    if (firstYearCostMin > 0) {
      firstYearReturnPct = {
        minimum: Math.round(((yearlyValueTotal.minimum - firstYearCostMax) / firstYearCostMax) * 100),
        maximum: Math.round(((yearlyValueTotal.maximum - firstYearCostMin) / firstYearCostMin) * 100),
      };
    }
  }

  // ---- Uncertainty ----
  const filledInputs = [
    inputs.manualWorkEmployees,
    inputs.manualHoursPerEmployeeWeek,
    inputs.employeeMonthlyCost,
    inputs.reportHoursPerWeek,
    inputs.missedAppointmentsPerMonth,
    inputs.lostLeadsPerMonth,
    inputs.inventoryLossPerMonth,
    inputs.paperCommsCostPerMonth,
    inputs.duplicateEntryHoursPerWeek,
  ].filter((n) => n > 0).length;
  let uncertainty: UncertaintyLevel;
  let uncertaintyReason: string;
  if (filledInputs <= 2) {
    uncertainty = "high";
    uncertaintyReason = "Very few inputs were provided — treat every figure as a rough conversation starter.";
  } else if (filledInputs <= 5 || inputs.improvementPct > 50) {
    uncertainty = "medium";
    uncertaintyReason =
      inputs.improvementPct > 50
        ? "The assumed improvement percentage is aggressive — validate it with the client."
        : "Several inputs are still assumptions — verify them during discovery.";
  } else {
    uncertainty = "low";
    uncertaintyReason = "Most inputs came from the client, but results remain illustrative estimates.";
  }

  const assumptions = [
    `Improvement assumption: ${inputs.improvementPct}% (low end assumes half of that).`,
    `Hourly cost derived from ₱${inputs.employeeMonthlyCost.toLocaleString("en-PH")}/month ÷ ${HOURS_PER_MONTH} hours.`,
    "Recovery rates for appointments (30–70%), leads (25–50%), inventory (30–60%), and collections (30–60%) are illustrative defaults.",
    ...(inputs.clientAssumptions ? [`Client-provided: ${inputs.clientAssumptions}`] : []),
  ];

  return {
    adminHoursSavedPerMonth: adminHoursSaved,
    reportingHoursSavedPerMonth: reportingHoursSaved,
    timeSavings,
    costSavings,
    revenueOpportunity,
    riskReduction,
    nonFinancialBenefits,
    monthlyValueTotal,
    yearlyValueTotal,
    paybackMonths,
    firstYearReturnPct,
    assumptions,
    uncertainty,
    uncertaintyReason,
  };
}
