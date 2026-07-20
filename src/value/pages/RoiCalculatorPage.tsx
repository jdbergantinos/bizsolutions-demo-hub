import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, MonitorPlay, RotateCcw, TrendingUp } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Pill } from "../../components/common/Badge";
import { pesoRange } from "../../pricing/engine/money";
import { loadEstimates } from "../../pricing/store/pricingStorage";
import { getActiveDiscovery, loadPresentations, upsertPresentation } from "../../discovery/store/discoveryStorage";
import type { RoiEstimate, RoiInputs } from "../types";
import { calculateRoi, emptyRoiInputs, ROI_DISCLAIMER } from "../engine/calculateRoi";
import { newRoiEstimate, roiRepo } from "../store/valueStorage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

const UNCERTAINTY_TONE = { high: "red", medium: "amber", low: "green" } as const;

export function RoiCalculatorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [roi, setRoi] = useState<RoiEstimate>(() => {
    const existing = roiRepo.loadAll()[0];
    if (existing) return existing;
    const d = getActiveDiscovery();
    return newRoiEstimate({
      name: d ? `ROI — ${d.business.businessName || "client"}` : "ROI estimate",
      discoveryId: d?.id,
    });
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const estimates = loadEstimates().filter((e) => !e.archived);
  const linkedEstimate = estimates.find((e) => e.id === roi.pricingEstimateId) ?? null;

  // Autosave.
  useEffect(() => {
    const t = setTimeout(() => roiRepo.upsert({ ...roi, updatedAt: new Date().toISOString() }), 400);
    return () => clearTimeout(t);
  }, [roi]);

  const result = useMemo(() => calculateRoi(roi.inputs, linkedEstimate), [roi.inputs, linkedEstimate]);
  const set = (patch: Partial<RoiInputs>) => setRoi((r) => ({ ...r, inputs: { ...r.inputs, ...patch } }));

  const loadDiscovery = () => {
    const d = getActiveDiscovery();
    if (!d) {
      toast("No active discovery to load from.", "info");
      return;
    }
    setRoi((r) => ({
      ...r,
      discoveryId: d.id,
      name: `ROI — ${d.business.businessName || "client"}`,
      inputs: {
        ...r.inputs,
        manualWorkEmployees: Number(d.business.employees) || r.inputs.manualWorkEmployees,
        clientAssumptions: [d.operations.manualProcesses, d.operations.repeatedProcesses].filter(Boolean).join("; ") || r.inputs.clientAssumptions,
      },
    }));
    toast("Discovery data loaded — refine the numbers with the client.");
  };

  const copySummary = async () => {
    const lines = [
      `BUSINESS-VALUE ESTIMATE — ${roi.name}`,
      "",
      `Estimated monthly value: ${pesoRange(result.monthlyValueTotal)}`,
      `Estimated yearly value: ${pesoRange(result.yearlyValueTotal)}`,
      result.paybackMonths ? `Estimated payback: ${result.paybackMonths.minimum}–${result.paybackMonths.maximum} months` : "",
      result.firstYearReturnPct ? `Estimated first-year return: ${result.firstYearReturnPct.minimum}% to ${result.firstYearReturnPct.maximum}%` : "",
      "",
      "ASSUMPTIONS",
      ...result.assumptions.map((a) => `• ${a}`),
      "",
      ROI_DISCLAIMER,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast("ROI summary copied.");
    } catch {
      toast("Clipboard blocked by the browser.", "info");
    }
  };

  const addToPresentation = () => {
    const p = loadPresentations()[0];
    if (!p) {
      toast("No presentation exists yet — create one in the Presentation Builder first.", "info");
      return;
    }
    upsertPresentation({ ...p, roiId: roi.id, updatedAt: new Date().toISOString() });
    toast(`ROI estimate attached to "${p.title}".`);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <TrendingUp className="h-5 w-5 text-accent" /> ROI & Business-Value Calculator
        </h1>
        <p className="text-sm text-slate-500">
          What operational value could the client receive? (Pricing answers what it could cost — this is deliberately separate.)
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button onClick={loadDiscovery} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          Load discovery data
        </button>
        <button onClick={copySummary} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Copy className="h-3.5 w-3.5" /> Copy summary
        </button>
        <button onClick={addToPresentation} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <MonitorPlay className="h-3.5 w-3.5" /> Add to presentation
        </button>
        <button onClick={() => setConfirmReset(true)} className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Inputs */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Client-provided inputs</h2>
        <div className="grid grid-cols-2 gap-3">
          <Num label="Employees doing manual work" value={roi.inputs.manualWorkEmployees} onChange={(v) => set({ manualWorkEmployees: v })} />
          <Num label="Manual hours / employee / week" value={roi.inputs.manualHoursPerEmployeeWeek} onChange={(v) => set({ manualHoursPerEmployeeWeek: v })} />
          <Num label="Average employee monthly cost (₱)" value={roi.inputs.employeeMonthlyCost} onChange={(v) => set({ employeeMonthlyCost: v })} />
          <Num label="Report preparation hours / week" value={roi.inputs.reportHoursPerWeek} onChange={(v) => set({ reportHoursPerWeek: v })} />
          <Num label="Missed appointments / month" value={roi.inputs.missedAppointmentsPerMonth} onChange={(v) => set({ missedAppointmentsPerMonth: v })} />
          <Num label="Value per appointment (₱)" value={roi.inputs.valuePerAppointment} onChange={(v) => set({ valuePerAppointment: v })} />
          <Num label="Lost / forgotten leads / month" value={roi.inputs.lostLeadsPerMonth} onChange={(v) => set({ lostLeadsPerMonth: v })} />
          <Num label="Value per converted lead (₱)" value={roi.inputs.valuePerConvertedLead} onChange={(v) => set({ valuePerConvertedLead: v })} />
          <Num label="Inventory loss / discrepancy per month (₱)" value={roi.inputs.inventoryLossPerMonth} onChange={(v) => set({ inventoryLossPerMonth: v })} />
          <Num label="Delayed collections outstanding (₱)" value={roi.inputs.delayedCollections} onChange={(v) => set({ delayedCollections: v })} />
          <Num label="Paper / printing / comms per month (₱)" value={roi.inputs.paperCommsCostPerMonth} onChange={(v) => set({ paperCommsCostPerMonth: v })} />
          <Num label="Repeated data-entry hours / week" value={roi.inputs.duplicateEntryHoursPerWeek} onChange={(v) => set({ duplicateEntryHoursPerWeek: v })} />
          <Num label="Average process delay (days)" value={roi.inputs.averageProcessDelayDays} onChange={(v) => set({ averageProcessDelayDays: v })} />
          <Num label="Assumed improvement (%)" value={roi.inputs.improvementPct} onChange={(v) => set({ improvementPct: Math.min(90, v) })} />
        </div>
        <L label="Client-provided assumptions">
          <textarea value={roi.inputs.clientAssumptions} onChange={(e) => set({ clientAssumptions: e.target.value })} rows={2} className={`${inputCls} py-2`} />
        </L>
        <L label="Presenter notes (internal)">
          <textarea value={roi.inputs.presenterNotes} onChange={(e) => set({ presenterNotes: e.target.value })} rows={2} className={`${inputCls} py-2`} />
        </L>
        <L label="Link a pricing estimate (enables payback & return)">
          <select value={roi.pricingEstimateId ?? ""} onChange={(e) => setRoi((r) => ({ ...r, pricingEstimateId: e.target.value || undefined }))} className={inputCls}>
            <option value="">— None —</option>
            {estimates.map((e) => (
              <option key={e.id} value={e.id}>{e.estimateNumber} · {e.input.businessName}</option>
            ))}
          </select>
        </L>
      </section>

      {/* Results */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Illustrative results</h2>
          <Pill tone={UNCERTAINTY_TONE[result.uncertainty]}>{result.uncertainty} uncertainty</Pill>
        </div>
        <p className="text-xs text-slate-400">{result.uncertaintyReason}</p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Monthly value" value={pesoRange(result.monthlyValueTotal)} />
          <Stat label="Yearly value" value={pesoRange(result.yearlyValueTotal)} />
          <Stat label="Admin hours saved / mo" value={`${result.adminHoursSavedPerMonth.minimum}–${result.adminHoursSavedPerMonth.maximum} h`} />
          <Stat
            label="Payback"
            value={result.paybackMonths ? `${result.paybackMonths.minimum}–${result.paybackMonths.maximum} mo` : "Link an estimate"}
          />
        </div>
        {result.firstYearReturnPct && (
          <p className="text-xs text-slate-600">
            Estimated first-year return: <strong>{result.firstYearReturnPct.minimum}% to {result.firstYearReturnPct.maximum}%</strong> vs. first-year cost.
          </p>
        )}

        <Group title="Time savings" lines={result.timeSavings} />
        <Group title="Cost savings" lines={result.costSavings} />
        <Group title="Revenue opportunity" lines={result.revenueOpportunity} />
        <Group title="Risk reduction & cash flow" lines={result.riskReduction} suffix="" />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nonfinancial benefits</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-slate-600">
            {result.nonFinancialBenefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assumptions</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-slate-500">
            {result.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{ROI_DISCLAIMER}</p>
      </section>

      {confirmReset && (
        <ConfirmDialog
          title="Reset the ROI calculator?"
          message="All inputs will be cleared back to zero."
          confirmLabel="Reset"
          onConfirm={() => {
            setRoi((r) => ({ ...r, inputs: emptyRoiInputs() }));
            setConfirmReset(false);
            toast("ROI inputs reset.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <L label={label}>
      <input
        type="number"
        min={0}
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className={inputCls}
      />
    </L>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 text-center">
      <p className="text-sm font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function Group({ title, lines, suffix = "/mo" }: { title: string; lines: { id: string; label: string; range: { minimum: number; maximum: number }; note?: string }[]; suffix?: string }) {
  if (lines.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="mt-1 divide-y divide-slate-100">
        {lines.map((l) => (
          <li key={l.id} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
            <span className="text-slate-700">
              {l.label}
              {l.note && <span className="block text-[11px] text-slate-400">{l.note}</span>}
            </span>
            <span className="shrink-0 font-semibold text-slate-900">{pesoRange(l.range, suffix)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
