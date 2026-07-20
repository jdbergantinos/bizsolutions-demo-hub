import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, ChevronLeft, ChevronRight, LogOut, MonitorPlay, Play, RotateCcw } from "lucide-react";
import { Modal } from "../components/common/Modal";
import { loadEstimates, loadPricingRules, loadPricingSettings } from "../pricing/store/pricingStorage";
import { calculateEstimate } from "../pricing/engine/calculateEstimate";
import { inputForPackage } from "../pricing/engine/createPackageOptions";
import { pesoRange } from "../pricing/engine/money";
import { EstimateDisclaimer, LineTable, ManualReviewBanner } from "../pricing/components/pricingUi";
import type { ClientProfile, PresentationState } from "../types";
import { getActiveDiscovery } from "../discovery/store/discoveryStorage";
import { getIndustry, INDUSTRIES } from "../data/catalog";
import { GUIDED_SCENARIOS } from "../data/guidedScenarios";
import { EMPTY_PRESENTATION, useApp } from "../store/AppStore";
import { useToast } from "../store/ToastContext";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { FavoriteButton } from "../components/catalog/FavoriteButton";

const ACCENTS = ["#0f4c81", "#0e7490", "#15803d", "#b45309", "#be185d", "#6d28d9"];

export function PresentationPage() {
  const { presentation } = useApp();
  return presentation.active ? <PresentationRunner /> : <PresentationSetup />;
}

/**
 * When the presenter opens Presentation Mode with no client set up yet, default
 * the setup to the active client (the one they set active in Discovery). If that
 * client is saved as a profile we use the profile; otherwise we prefill straight
 * from the active discovery. A presentation already set up for someone is left
 * untouched.
 */
function seedPresentationFromActiveClient(base: PresentationState, profiles: ClientProfile[]): PresentationState {
  if (base.businessName.trim()) return base;
  const d = getActiveDiscovery();
  if (!d) return base;
  const profile = d.clientProfileId ? profiles.find((p) => p.id === d.clientProfileId) : undefined;
  if (profile) {
    return {
      ...base,
      profileId: profile.id,
      businessName: profile.businessName,
      industryId: profile.industryId || base.industryId,
      branches: profile.branches,
      employees: profile.employees,
      primaryProblem: profile.primaryProblems,
      accentColor: profile.accentColor ?? base.accentColor,
      logo: profile.logo ?? base.logo,
    };
  }
  return {
    ...base,
    businessName: d.business.businessName,
    industryId: d.business.industryId || base.industryId,
    branches: String(d.business.branches ?? base.branches),
    employees: d.business.employees || base.employees,
    primaryProblem: d.business.notes || base.primaryProblem,
  };
}

// ---------------- Setup ----------------

function PresentationSetup() {
  const { presentation, setPresentation, profiles } = useApp();
  const toast = useToast();
  const [draft, setDraft] = useState<PresentationState>(() =>
    seedPresentationFromActiveClient({ ...EMPTY_PRESENTATION, ...presentation, active: false }, profiles),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<PresentationState>) => setDraft((d) => ({ ...d, ...patch }));

  const industry = getIndustry(draft.industryId);
  const scenario = GUIDED_SCENARIOS.find((g) => g.id === draft.scenarioId);

  const inputCls =
    "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  const applyProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) {
      set({ profileId: undefined });
      return;
    }
    set({
      profileId: p.id,
      businessName: p.businessName,
      industryId: p.industryId || draft.industryId,
      branches: p.branches,
      employees: p.employees,
      primaryProblem: p.primaryProblems,
      accentColor: p.accentColor,
      logo: p.logo,
    });
  };

  const start = () => {
    if (!draft.businessName.trim() || !draft.scenarioId) {
      toast("Enter the client's business name and choose a guided scenario first.", "info");
      return;
    }
    setPresentation({ ...draft, active: true, stepIndex: 0 });
    toast("Presentation started.");
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <MonitorPlay className="h-5 w-5 text-accent" /> Presentation Mode
        </h1>
        <p className="text-sm text-slate-500">
          Set up a guided, client-branded walkthrough. Technical controls are hidden while presenting.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {profiles.length > 0 && (
          <Field label="Client profile">
            <select value={draft.profileId ?? ""} onChange={(e) => applyProfile(e.target.value)} className={inputCls}>
              <option value="">— No profile / enter manually —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.businessName || "Unnamed business"}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Client business name" required>
          <input value={draft.businessName} onChange={(e) => set({ businessName: e.target.value })} placeholder="e.g. Subic Bay Trading Corp." className={inputCls} />
        </Field>

        <Field label="Industry">
          <select value={draft.industryId ?? ""} onChange={(e) => set({ industryId: e.target.value || undefined, serviceIds: [] })} className={inputCls}>
            <option value="">— Select industry —</option>
            {INDUSTRIES.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </Field>

        {industry && (
          <Field label="Service offers to feature">
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {industry.services.map((s) => (
                <label key={s.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={draft.serviceIds.includes(s.id)}
                    onChange={(e) =>
                      set({
                        serviceIds: e.target.checked
                          ? [...draft.serviceIds, s.id]
                          : draft.serviceIds.filter((x) => x !== s.id),
                      })
                    }
                    className="h-4 w-4 accent-[var(--app-accent)]"
                  />
                  <span className="flex-1">{s.name}</span>
                </label>
              ))}
            </div>
          </Field>
        )}

        <Field label="Guided demo scenario" required>
          <div className="space-y-2">
            {GUIDED_SCENARIOS.map((g) => (
              <div
                key={g.id}
                className={`flex items-start gap-2 rounded-xl border p-3 ${draft.scenarioId === g.id ? "border-accent bg-accent-soft/60" : "border-slate-200"}`}
              >
                <button onClick={() => set({ scenarioId: g.id })} className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-900">{g.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {g.description} · {g.steps.length} steps
                  </p>
                </button>
                <FavoriteButton kind="scenarios" id={g.id} />
              </div>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Branches">
            <input type="number" min={0} value={draft.branches} onChange={(e) => set({ branches: e.target.value })} placeholder="e.g. 2" className={inputCls} />
          </Field>
          <Field label="Employees">
            <input type="number" min={0} value={draft.employees} onChange={(e) => set({ employees: e.target.value })} placeholder="e.g. 8" className={inputCls} />
          </Field>
        </div>

        <Field label="Primary business problem">
          <textarea value={draft.primaryProblem} onChange={(e) => set({ primaryProblem: e.target.value })} rows={2} placeholder="e.g. Orders and follow-ups get lost in Messenger" className={`${inputCls} py-2`} />
        </Field>

        <Field label="Temporary accent color">
          <div className="flex items-center gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Accent ${c}`}
                onClick={() => set({ accentColor: c })}
                className={`h-10 w-10 rounded-full border-2 ${draft.accentColor === c ? "border-slate-900" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={draft.accentColor ?? "#0f4c81"}
              onChange={(e) => set({ accentColor: e.target.value })}
              aria-label="Custom accent color"
              className="h-10 w-10 cursor-pointer rounded-full border border-slate-300"
            />
          </div>
        </Field>

        <Field label="Pricing (optional)">
          <div className="space-y-2">
            <select
              value={draft.estimateId ?? ""}
              onChange={(e) => set({ estimateId: e.target.value || undefined, showPricing: Boolean(e.target.value) })}
              className={inputCls}
            >
              <option value="">— No estimate attached —</option>
              {loadEstimates()
                .filter((est) => !est.archived)
                .map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.estimateNumber} · {est.input.businessName}
                  </option>
                ))}
            </select>
            {draft.estimateId && (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={draft.showPricing ?? false}
                  onChange={(e) => set({ showPricing: e.target.checked })}
                  className="h-4 w-4 accent-[var(--app-accent)]"
                />
                Show pricing during the presentation (client-facing estimate only — internal pricing is never shown)
              </label>
            )}
          </div>
        </Field>

        <Field label="Temporary client logo (stored only on this device)">
          <div className="flex items-center gap-3">
            {draft.logo && <img src={draft.logo} alt="Logo preview" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => set({ logo: String(reader.result) });
                reader.readAsDataURL(f);
              }}
              className="text-xs"
            />
            {draft.logo && (
              <button
                type="button"
                onClick={() => {
                  set({ logo: undefined });
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </Field>
      </section>

      <button
        onClick={start}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-bold text-white hover:opacity-90"
        style={draft.accentColor ? { backgroundColor: draft.accentColor } : undefined}
      >
        <Play className="h-5 w-5" /> Start presentation
        {scenario ? ` — ${scenario.name}` : ""}
      </button>
    </div>
  );
}

// ---------------- Runner ----------------

function PresentationRunner() {
  const { presentation, setPresentation, resetPresentation } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const attachedEstimate = useMemo(
    () => (presentation.estimateId ? loadEstimates().find((e) => e.id === presentation.estimateId) ?? null : null),
    [presentation.estimateId],
  );

  const scenario = GUIDED_SCENARIOS.find((g) => g.id === presentation.scenarioId) ?? GUIDED_SCENARIOS[0];
  const industry = getIndustry(presentation.industryId);
  const step = scenario.steps[presentation.stepIndex];
  const total = scenario.steps.length;

  const go = (dir: -1 | 1) => {
    const next = Math.min(total - 1, Math.max(0, presentation.stepIndex + dir));
    setPresentation({ ...presentation, stepIndex: next });
  };

  // Prefer a featured/selected service demo matching this step's module.
  const demoTarget = (() => {
    if (!step.module) return null;
    const pool = industry
      ? industry.services.filter(
          (s) => presentation.serviceIds.length === 0 || presentation.serviceIds.includes(s.id),
        )
      : [];
    const match =
      pool.find((s) => s.demoModule === step.module) ??
      industry?.services.find((s) => s.demoModule === step.module);
    return match ? `/demo/${match.id}` : `/demo/module/${step.module}`;
  })();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Client banner */}
      <div className="flex items-center gap-4 rounded-2xl bg-accent p-5 text-white">
        {presentation.logo ? (
          <img src={presentation.logo} alt="" className="h-14 w-14 rounded-xl bg-white object-cover p-0.5" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-xl font-bold">
            {presentation.businessName.slice(0, 1).toUpperCase() || "?"}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold leading-tight">{presentation.businessName}</p>
          <p className="text-sm text-white/70">
            {[industry?.name, presentation.branches && `${presentation.branches} branch(es)`, presentation.employees && `${presentation.employees} employees`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {presentation.primaryProblem && (
        <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-800">Focus problem:</span> {presentation.primaryProblem}
        </p>
      )}

      {/* Step card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>{scenario.name}</span>
          <span>
            Step {presentation.stepIndex + 1} of {total}
          </span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((presentation.stepIndex + 1) / total) * 100}%` }}
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{step.title}</h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{step.detail}</p>

        {demoTarget && (
          <button
            onClick={() => navigate(demoTarget)}
            className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl border-2 border-accent text-base font-semibold text-accent hover:bg-accent-soft"
          >
            <Play className="h-5 w-5" /> Open this step's demo
          </button>
        )}
        {attachedEstimate && presentation.showPricing && (
          <button
            onClick={() => setPricingOpen(true)}
            className="mt-2 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Calculator className="h-5 w-5" /> View investment estimate
          </button>
        )}
      </div>

      {pricingOpen && attachedEstimate && (
        <PresentationPricingView estimate={attachedEstimate} onClose={() => setPricingOpen(false)} />
      )}

      {/* Prev / Next — large controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => go(-1)}
          disabled={presentation.stepIndex === 0}
          className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronLeft className="h-6 w-6" /> Previous
        </button>
        <button
          onClick={() => go(1)}
          disabled={presentation.stepIndex === total - 1}
          className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-accent text-lg font-bold text-white hover:opacity-90 disabled:opacity-40"
        >
          Next <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setPresentation({ ...presentation, active: false });
            toast("Presentation exited. Setup is kept for next time.");
          }}
          className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" /> Exit presentation
        </button>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <RotateCcw className="h-4 w-4" /> Reset presentation
        </button>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset presentation?"
          message="The client name, selected services, temporary logo, and accent color for this presentation will be cleared."
          confirmLabel="Reset"
          onConfirm={() => {
            resetPresentation();
            setConfirmReset(false);
            toast("Presentation reset.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

/** Client-facing pricing view for presentations. Never shows internal pricing. */
function PresentationPricingView({
  estimate,
  onClose,
}: {
  estimate: NonNullable<ReturnType<typeof loadEstimates>[number]>;
  onClose: () => void;
}) {
  const rules = useMemo(loadPricingRules, []);
  const settings = useMemo(loadPricingSettings, []);
  const { input, result } = estimate;
  const packageTotals = estimate.packages.map((pkg) => ({
    pkg,
    result: calculateEstimate(inputForPackage(input, pkg), rules, settings),
  }));

  return (
    <Modal title={`Investment estimate — ${estimate.estimateNumber}`} onClose={onClose} wide>
      <div className="space-y-4">
        <ManualReviewBanner reasons={result.manualReviewReasons} />

        <div className="grid gap-3 md:grid-cols-3">
          {packageTotals.map(({ pkg, result: r }) => (
            <div key={pkg.id} className={`rounded-xl border p-3 text-center ${pkg.recommended ? "border-accent ring-1 ring-accent/30" : "border-slate-200"}`}>
              <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
              {pkg.recommended && <p className="text-[11px] font-medium text-accent">Recommended</p>}
              <p className="mt-2 text-sm font-semibold text-slate-900">{pesoRange(r.oneTimeTotal)}</p>
              <p className="text-xs text-slate-500">one-time</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{pesoRange(r.recurringTotal)}</p>
              <p className="text-xs text-slate-500">per month</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-900">One-time implementation</h3>
          <LineTable lines={result.oneTimeLines} subtotal={result.oneTimeSubtotal} tax={result.oneTimeTax} total={result.oneTimeTotal} />
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Monthly</h3>
          <LineTable lines={result.recurringLines} subtotal={result.recurringSubtotal} tax={result.recurringTax} total={result.recurringTotal} suffix="/mo" />
        </div>

        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-semibold">Third-party costs — not included unless explicitly stated:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {result.thirdPartyNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>

        <EstimateDisclaimer />
      </div>
    </Modal>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
