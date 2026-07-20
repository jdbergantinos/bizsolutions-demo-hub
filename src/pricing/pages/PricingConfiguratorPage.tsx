import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, ExternalLink, ListPlus, RotateCcw, Save, Star,
} from "lucide-react";
import { getIndustry, INDUSTRIES } from "../../data/catalog";
import { MODULE_TEMPLATES } from "../../data/serviceTemplates";
import { useApp } from "../../store/AppStore";
import { useToast } from "../../store/ToastContext";
import { SearchInput } from "../../components/common/SearchInput";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Pill } from "../../components/common/Badge";
import type {
  BusinessSizeId, ConfigurationLevel, DeliveryModel, EstimateInput, PricingEstimate,
} from "../types";
import { calculateEstimate, calculateModulePrice } from "../engine/calculateEstimate";
import { createPackageOptions } from "../engine/createPackageOptions";
import { validateEstimateInput } from "../engine/validateEstimate";
import { pesoRange } from "../engine/money";
import {
  clearDraft, loadDraft, loadEstimates, loadPricingRules, loadPricingSettings,
  newEstimateId, nextEstimateNumber, saveDraft, upsertEstimate,
} from "../store/pricingStorage";
import {
  ComplexityDots, EstimateDisclaimer, LineTable, ManualReviewBanner, Money, SectionCard,
} from "../components/pricingUi";
import { getActiveDiscovery } from "../../discovery/store/discoveryStorage";
import { sizeRuleFor } from "../../discovery/engine/recommend";

const STEPS = [
  "Client & Industry",
  "Business Size",
  "Select Services",
  "Delivery Model",
  "Configuration",
  "Optional Features",
  "Support Plan",
  "Results",
];

function emptyInput(defaults: { deliveryModel: DeliveryModel; configurationLevel: ConfigurationLevel; supportPlanId: string; contingencyPct: number }): EstimateInput {
  return {
    businessName: "",
    contactPerson: "",
    industryId: "",
    businessExample: "",
    location: "",
    businessSize: "small",
    branches: 1,
    employees: "",
    users: 5,
    monthlyTransactions: "",
    currentSystems: "",
    primaryProblems: "",
    notes: "",
    deliveryModel: defaults.deliveryModel,
    configurationLevel: defaults.configurationLevel,
    selectedServiceOfferIds: [],
    selectedOptionalServiceIds: [],
    supportPlanId: defaults.supportPlanId,
    contingencyPct: defaults.contingencyPct,
    discountPct: 0,
    manualAdjustment: 0,
    manualAdjustmentReason: "",
  };
}

export function PricingConfiguratorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const { profiles, activeProfile, saveProfile, solutions } = useApp();

  const rules = useMemo(loadPricingRules, []);
  const settings = useMemo(loadPricingSettings, []);

  const [input, setInput] = useState<EstimateInput>(() => {
    const base = emptyInput({
      deliveryModel: settings.defaultDeliveryModel,
      configurationLevel: settings.defaultConfigurationLevel,
      supportPlanId: settings.defaultSupportPlanId,
      contingencyPct: settings.defaultContingencyPct,
    });
    // Preselection from launch context (industry / service / client / solutions).
    const industryId = params.get("industry") ?? "";
    const serviceId = params.get("service") ?? "";
    const clientId = params.get("client") ?? "";
    const fromSolutions = params.get("fromSolutions") === "1";
    const fromDiscovery = params.get("discovery") === "1";
    const quick = params.get("quick") === "1";

    // Load business details and accepted recommendations from the active
    // discovery (Phase A → pricing hand-off).
    if (fromDiscovery) {
      const d = getActiveDiscovery();
      if (d) {
        base.clientProfileId = d.clientProfileId;
        base.discoveryId = d.id;
        base.businessName = d.business.businessName;
        base.contactPerson = d.business.contactPerson;
        base.industryId = d.business.industryId;
        base.businessExample = d.business.businessExample;
        base.location = d.business.location;
        base.branches = d.business.branches;
        base.employees = d.business.employees;
        base.users = d.business.users;
        base.monthlyTransactions = d.business.monthlyTransactions;
        base.currentSystems = d.operations.tools.join(", ");
        base.primaryProblems = d.problems.length
          ? `${d.problems.length} problems identified in discovery`
          : d.business.notes;
        base.businessSize = sizeRuleFor(d).id;
        const rec = d.recommendationSet;
        if (rec) {
          base.selectedServiceOfferIds = rec.recommendations
            .filter((r) => r.decision === "accepted")
            .map((r) => r.serviceOfferId);
          base.deliveryModel = rec.suggestedDeliveryModel;
          base.configurationLevel = rec.suggestedConfigurationLevel;
        }
        return base;
      }
    }

    if (!industryId && !serviceId && !clientId && !fromSolutions) {
      const draft = loadDraft();
      if (draft) return draft;
      if (activeProfile) applyProfileTo(base, activeProfile);
      return base;
    }
    if (industryId) base.industryId = industryId;
    if (serviceId) {
      base.selectedServiceOfferIds = [serviceId];
      const ind = INDUSTRIES.find((i) => i.services.some((s) => s.id === serviceId));
      if (ind) base.industryId = ind.id;
    }
    if (fromSolutions) {
      const ids = solutions.map((s) => s.serviceId);
      base.selectedServiceOfferIds = ids;
      if (solutions[0]) base.industryId = solutions[0].industryId;
    }
    const profile = clientId ? profiles.find((p) => p.id === clientId) : activeProfile;
    if (profile) applyProfileTo(base, profile);
    if (clientId && profile?.industryId) base.industryId = profile.industryId;
    if (quick && base.industryId) {
      const ind = getIndustry(base.industryId);
      if (ind) {
        base.selectedServiceOfferIds = ind.services
          .filter((s) => s.riskLevel === "low")
          .slice(0, 5)
          .map((s) => s.id);
      }
    }
    return base;
  });
  const [step, setStep] = useState(() => (params.get("quick") === "1" ? 7 : 0));
  const [confirmReset, setConfirmReset] = useState(false);

  // Autosave the draft so exiting never loses work.
  useEffect(() => {
    const t = setTimeout(() => saveDraft(input), 400);
    return () => clearTimeout(t);
  }, [input]);

  const set = (patch: Partial<EstimateInput>) => setInput((d) => ({ ...d, ...patch }));
  const industry = getIndustry(input.industryId);

  const applyProfile = (profileId: string) => {
    const p = profiles.find((x) => x.id === profileId);
    if (!p) {
      set({ clientProfileId: undefined });
      return;
    }
    setInput((d) => {
      const next = { ...d };
      applyProfileTo(next, p);
      return next;
    });
  };

  const stepValid = (): string | null => {
    if (step === 0) {
      if (!input.businessName.trim()) return "Enter the client's business name (or use a temporary name).";
      if (!input.industryId) return "Select an industry to load its services.";
    }
    if (step === 2 && input.selectedServiceOfferIds.length === 0) {
      return "Select at least one service offer.";
    }
    return null;
  };

  const next = () => {
    const err = stepValid();
    if (err) {
      toast(err, "info");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const saveEstimate = () => {
    const errors = validateEstimateInput(input, rules);
    if (errors.length > 0) {
      toast(errors[0], "info");
      return;
    }
    const result = calculateEstimate(input, rules, settings);
    const existing = loadEstimates();
    const now = new Date().toISOString();
    const estimate: PricingEstimate = {
      schemaVersion: 1,
      id: newEstimateId(),
      estimateNumber: nextEstimateNumber(existing),
      createdAt: now,
      updatedAt: now,
      priceTableVersion: rules.version,
      status: result.manualReviewReasons.length > 0 ? "manual-review" : "preliminary",
      archived: false,
      input,
      result,
      packages: createPackageOptions(input, rules),
    };
    upsertEstimate(estimate);
    clearDraft();
    toast(`Estimate ${estimate.estimateNumber} saved.`);
    navigate(`/pricing/estimate/${estimate.id}`);
  };

  const inputCls =
    "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="space-y-4">
      {/* Header + progress */}
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pricing Configurator</h1>
          <p className="text-sm text-slate-500">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              saveDraft(input);
              toast("Draft saved. You can return anytime.");
              navigate("/pricing");
            }}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Save className="h-3.5 w-3.5" /> Save draft
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            aria-label="Reset configurator"
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="flex gap-1" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
        {STEPS.map((s, i) => (
          <button
            key={s}
            title={s}
            onClick={() => i < step && setStep(i)}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-slate-200"}`}
          />
        ))}
      </div>

      {/* ---------- Step bodies ---------- */}
      {step === 0 && (
        <SectionCard title="Client and industry">
          <div className="space-y-3">
            {profiles.length > 0 && (
              <Field label="Client profile">
                <select value={input.clientProfileId ?? ""} onChange={(e) => applyProfile(e.target.value)} className={inputCls}>
                  <option value="">— Temporary client (not saved) —</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.businessName || "Unnamed business"}</option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business name" required>
                <input value={input.businessName} onChange={(e) => set({ businessName: e.target.value })} placeholder="e.g. Subic Bay Trading Corp." className={inputCls} />
              </Field>
              <Field label="Contact person">
                <input value={input.contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} placeholder="e.g. Ramon Cruz — Owner" className={inputCls} />
              </Field>
            </div>
            <Field label="Industry" required>
              <select
                value={input.industryId}
                onChange={(e) => set({ industryId: e.target.value, businessExample: "", selectedServiceOfferIds: [] })}
                className={inputCls}
              >
                <option value="">— Select industry —</option>
                {INDUSTRIES.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </Field>
            {industry && (
              <Field label="Specific business example">
                <select value={input.businessExample} onChange={(e) => set({ businessExample: e.target.value })} className={inputCls}>
                  <option value="">— Select example —</option>
                  {industry.examples.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Location">
                <input value={input.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Olongapo" className={inputCls} />
              </Field>
              <Field label="Branches">
                <input type="number" min={1} value={input.branches} onChange={(e) => set({ branches: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} />
              </Field>
              <Field label="Employees">
                <input type="number" min={0} value={input.employees} onChange={(e) => set({ employees: e.target.value })} placeholder="e.g. 15" className={inputCls} />
              </Field>
              <Field label="System users">
                <input type="number" min={1} value={input.users} onChange={(e) => set({ users: Math.max(1, Number(e.target.value) || 1) })} className={inputCls} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Estimated monthly transactions">
                <input value={input.monthlyTransactions} onChange={(e) => set({ monthlyTransactions: e.target.value })} placeholder="e.g. 500 orders" className={inputCls} />
              </Field>
              <Field label="Current system or tools">
                <input value={input.currentSystems} onChange={(e) => set({ currentSystems: e.target.value })} placeholder="e.g. Excel, Messenger" className={inputCls} />
              </Field>
            </div>
            <Field label="Primary business problems">
              <textarea value={input.primaryProblems} onChange={(e) => set({ primaryProblems: e.target.value })} rows={2} placeholder="e.g. Stock-outs and slow quotations" className={`${inputCls} py-2`} />
            </Field>
            <Field label="Notes">
              <textarea value={input.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} placeholder="e.g. Wants to start with one branch first" className={`${inputCls} py-2`} />
            </Field>
            {input.clientProfileId && (
              <button
                onClick={() => {
                  const p = profiles.find((x) => x.id === input.clientProfileId);
                  if (!p) return;
                  saveProfile({
                    ...p,
                    businessName: input.businessName,
                    contactPerson: input.contactPerson,
                    industryId: input.industryId || p.industryId,
                    branches: String(input.branches),
                    employees: input.employees,
                    currentSystems: input.currentSystems,
                    primaryProblems: input.primaryProblems,
                  });
                  toast("Active client profile updated.");
                }}
                className="min-h-11 w-full rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Update client profile with these details
              </button>
            )}
          </div>
        </SectionCard>
      )}

      {step === 1 && (
        <div className="space-y-2">
          {rules.businessSizes.map((s) => (
            <button
              key={s.id}
              onClick={() => set({ businessSize: s.id as BusinessSizeId })}
              className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                input.businessSize === s.id ? "border-accent bg-accent-soft/50 ring-1 ring-accent/30" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{s.name}</span>
                {input.businessSize === s.id && <Check className="h-4 w-4 text-accent" />}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Includes {s.includedUsers} users · {s.includedBranches} branch(es) · suggests{" "}
                {rules.configurationLevels.find((c) => c.id === s.suggestedConfigurationLevel)?.name} level
              </p>
            </button>
          ))}
          <p className="text-xs text-slate-400">
            Size influences recommendations and pricing factors — it is never the only basis for the price.
          </p>
        </div>
      )}

      {step === 2 && industry && (
        <ServicesStep input={input} set={set} rules={rules} solutions={solutions.map((s) => s.serviceId)} />
      )}
      {step === 2 && !industry && (
        <SectionCard><p className="text-sm text-slate-500">Select an industry in Step 1 first.</p></SectionCard>
      )}

      {step === 3 && (
        <DeliveryStep input={input} set={set} rules={rules} />
      )}

      {step === 4 && (
        <div className="space-y-2">
          {rules.configurationLevels.map((c) => {
            const suggested = rules.businessSizes.find((s) => s.id === input.businessSize)?.suggestedConfigurationLevel === c.id;
            return (
              <button
                key={c.id}
                onClick={() => set({ configurationLevel: c.id, contingencyPct: c.defaultContingencyPct })}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                  input.configurationLevel === c.id ? "border-accent bg-accent-soft/50 ring-1 ring-accent/30" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                  <span className="flex items-center gap-2">
                    {suggested && <Pill tone="amber">Suggested</Pill>}
                    {input.configurationLevel === c.id && <Check className="h-4 w-4 text-accent" />}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
                <p className="mt-1 text-[11px] text-slate-400">Default contingency: {c.defaultContingencyPct}%</p>
              </button>
            );
          })}
        </div>
      )}

      {step === 5 && <OptionalsStep input={input} set={set} rules={rules} />}

      {step === 6 && (
        <div className="space-y-2">
          {rules.supportPlans.map((p) => (
            <button
              key={p.id}
              onClick={() => set({ supportPlanId: p.id })}
              className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                input.supportPlanId === p.id ? "border-accent bg-accent-soft/50 ring-1 ring-accent/30" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                <Money range={p.monthlyPrice} suffix="/mo" />
              </div>
              <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                <div><dt className="inline font-medium">Channel:</dt> <dd className="inline">{p.channel}</dd></div>
                <div><dt className="inline font-medium">Coverage:</dt> <dd className="inline">{p.coverage}</dd></div>
                <div><dt className="inline font-medium">Response:</dt> <dd className="inline">{p.responseTarget}</dd></div>
                <div><dt className="inline font-medium">Includes:</dt> <dd className="inline">{p.includedScope}</dd></div>
              </dl>
              <p className="mt-1 text-[11px] text-amber-700">{p.limitations}</p>
            </button>
          ))}
          <p className="text-xs text-slate-400">
            Response targets are preliminary and subject to the signed service agreement — not contractual guarantees.
          </p>
        </div>
      )}

      {step === 7 && <ResultsStep input={input} set={set} onSave={saveEstimate} />}

      {/* ---------- Wizard nav ---------- */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={saveEstimate}
            className="flex min-h-13 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            <Save className="h-4 w-4" /> Save estimate
          </button>
        )}
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset the configurator?"
          message="All selections in this estimate draft will be cleared."
          confirmLabel="Reset"
          onConfirm={() => {
            clearDraft();
            setInput(emptyInput({
              deliveryModel: settings.defaultDeliveryModel,
              configurationLevel: settings.defaultConfigurationLevel,
              supportPlanId: settings.defaultSupportPlanId,
              contingencyPct: settings.defaultContingencyPct,
            }));
            setStep(0);
            setConfirmReset(false);
            toast("Configurator reset.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function applyProfileTo(input: EstimateInput, p: { id: string; businessName: string; contactPerson: string; industryId: string; branches: string; employees: string; currentSystems: string; primaryProblems: string }) {
  input.clientProfileId = p.id;
  input.businessName = p.businessName;
  input.contactPerson = p.contactPerson;
  if (p.industryId && !input.industryId) input.industryId = p.industryId;
  input.branches = Math.max(1, Number(p.branches) || 1);
  input.employees = p.employees;
  input.currentSystems = p.currentSystems;
  input.primaryProblems = p.primaryProblems;
}

// ---------- Step 3: services ----------

function ServicesStep({
  input, set, rules, solutions,
}: {
  input: EstimateInput;
  set: (p: Partial<EstimateInput>) => void;
  rules: ReturnType<typeof loadPricingRules>;
  solutions: string[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const toast = useToast();
  const industry = getIndustry(input.industryId)!;
  const selected = input.selectedServiceOfferIds;

  const categories = [...new Set(industry.services.map((s) => MODULE_TEMPLATES[s.demoModule].label))];
  const visible = industry.services.filter((s) => {
    const q = search.trim().toLowerCase();
    return (
      (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) &&
      (!category || MODULE_TEMPLATES[s.demoModule].label === category)
    );
  });

  const toggle = (id: string) =>
    set({
      selectedServiceOfferIds: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
    });

  const move = (id: string, dir: -1 | 1) => {
    const i = selected.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= selected.length) return;
    const copy = [...selected];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    set({ selectedServiceOfferIds: copy });
  };

  return (
    <div className="space-y-3">
      <SearchInput value={search} onChange={setSearch} placeholder="Search service offers…" />
      <div className="flex flex-wrap gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by module category" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => set({ selectedServiceOfferIds: [...new Set([...selected, ...industry.services.filter((s) => s.riskLevel === "low").slice(0, 5).map((s) => s.id)])] })}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Select recommended
        </button>
        {solutions.length > 0 && (
          <button
            onClick={() => {
              set({ selectedServiceOfferIds: [...new Set([...selected, ...solutions])] });
              toast("Selected Solutions added to the estimate.");
            }}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <ListPlus className="h-4 w-4" /> Add Selected Solutions
          </button>
        )}
        <button onClick={() => set({ selectedServiceOfferIds: [] })} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Clear
        </button>
      </div>

      {selected.length > 0 && (
        <SectionCard title={`Selected (${selected.length}) — order sets priority`}>
          <ul className="space-y-1">
            {selected.map((id, i) => {
              const info = calculateModulePrice(id, rules);
              if (!info) return null;
              return (
                <li key={id} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="w-5 text-xs text-slate-400">{i + 1}.</span>
                  <span className="flex-1 truncate">{info.service.name}</span>
                  <button aria-label="Move up" disabled={i === 0} onClick={() => move(id, -1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs disabled:opacity-30">↑</button>
                  <button aria-label="Move down" disabled={i === selected.length - 1} onClick={() => move(id, 1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs disabled:opacity-30">↓</button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      <div className="space-y-2">
        {visible.map((s) => {
          const info = calculateModulePrice(s.id, rules)!;
          const isSel = selected.includes(s.id);
          const recommended = s.riskLevel === "low";
          return (
            <div key={s.id} className={`rounded-2xl border p-4 shadow-sm ${isSel ? "border-accent bg-accent-soft/40" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{s.description}</p>
                </div>
                <ComplexityDots level={info.complexity} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                {recommended && <Pill tone="green"><Star className="mr-0.5 inline h-3 w-3" />Recommended</Pill>}
                <Pill tone="blue">Setup {pesoRange(info.setup)}</Pill>
                <Pill tone="violet">{pesoRange(info.monthly, "/mo")}</Pill>
                {(s.riskLevel === "high" || info.manualReviewRequired) && <Pill tone="red">Manual review</Pill>}
                {s.riskLevel === "moderate" && <Pill tone="amber">Caution applies</Pill>}
              </div>
              {info.notes.length > 0 && <p className="mt-1 text-[11px] text-slate-400">{info.notes.join(" ")}</p>}
              <p className="mt-1 text-[11px] text-slate-400">
                Includes: {rules.modulePricing.find((m) => m.module === s.demoModule)?.includedFunctions.join(", ")}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => toggle(s.id)}
                  className={`min-h-10 flex-1 rounded-lg text-xs font-semibold ${isSel ? "border border-slate-300 text-slate-600 hover:bg-white" : "bg-accent text-white hover:opacity-90"}`}
                >
                  {isSel ? "Remove" : "Add to estimate"}
                </button>
                <a
                  href={`#/demo/${s.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Demo
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Step 4: delivery model ----------

function DeliveryStep({ input, set, rules }: { input: EstimateInput; set: (p: Partial<EstimateInput>) => void; rules: ReturnType<typeof loadPricingRules> }) {
  const suggested = rules.businessSizes.find((s) => s.id === input.businessSize)?.suggestedDeliveryModels ?? [];
  const [compare, setCompare] = useState(false);
  return (
    <div className="space-y-3">
      {rules.deliveryModels.map((d) => (
        <button
          key={d.id}
          onClick={() => set({ deliveryModel: d.id })}
          className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
            input.deliveryModel === d.id ? "border-accent bg-accent-soft/50 ring-1 ring-accent/30" : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900">{d.name}</span>
            <span className="flex items-center gap-2">
              {suggested.includes(d.id) && <Pill tone="amber">Suggested</Pill>}
              {input.deliveryModel === d.id && <Check className="h-4 w-4 text-accent" />}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{d.description}</p>
          <p className="mt-1.5 text-[11px] text-slate-400">Typical charges: {d.typicalCharges.join(" · ")}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Base: {pesoRange(d.baseSetup)} one-time · {pesoRange(d.baseMonthly, "/mo")}
          </p>
        </button>
      ))}

      <button onClick={() => setCompare((v) => !v)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50">
        {compare ? "Hide comparison" : "Compare delivery models"}
      </button>

      {compare && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Aspect</th>
                {rules.deliveryModels.map((d) => (
                  <th key={d.id} className="px-3 py-2 font-medium">{d.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(
                [
                  ["Ownership", (d) => d.ownership],
                  ["Reusability", (d) => d.reusability],
                  ["Initial cost", (d) => d.initialCostTendency],
                  ["Monthly cost", (d) => d.monthlyCostTendency],
                  ["Customization", (d) => d.customizationLevel],
                  ["Recommended for", (d) => d.recommendedFor],
                  ["Source code", (d) => d.sourceCodeAvailability],
                  ["Exclusivity", (d) => d.exclusivity],
                  ["Maintenance", (d) => d.maintenanceResponsibility],
                ] as [string, (d: (typeof rules.deliveryModels)[number]) => string][]
              ).map(([label, fn]) => (
                <tr key={label}>
                  <td className="px-3 py-2 font-medium text-slate-700">{label}</td>
                  {rules.deliveryModels.map((d) => (
                    <td key={d.id} className="px-3 py-2 text-slate-500">{fn(d)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Step 6: optional features ----------

function OptionalsStep({ input, set, rules }: { input: EstimateInput; set: (p: Partial<EstimateInput>) => void; rules: ReturnType<typeof loadPricingRules> }) {
  const categories = [...new Set(rules.optionalServices.map((o) => o.category))];
  const selected = input.selectedOptionalServiceIds;
  const toggle = (id: string) =>
    set({ selectedOptionalServiceIds: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] });

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <SectionCard key={cat} title={cat}>
          <div className="space-y-2">
            {rules.optionalServices
              .filter((o) => o.category === cat)
              .map((o) => {
                const restricted = o.deliveryModels.length > 0 && !o.deliveryModels.includes(input.deliveryModel);
                const isSel = selected.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                      restricted ? "cursor-not-allowed border-slate-100 opacity-50" : isSel ? "border-accent bg-accent-soft/40" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      disabled={restricted}
                      onChange={() => toggle(o.id)}
                      className="mt-0.5 h-4 w-4 accent-[var(--app-accent)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-900">{o.name}</span>
                        <ComplexityDots level={o.complexity} />
                        {o.manualReviewRequired && <Pill tone="red">Manual review</Pill>}
                        {o.pricingStatus === "range-only" && <Pill tone="amber">Range only</Pill>}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{o.description}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {o.oneTimePrice && `One-time ${pesoRange(o.oneTimePrice)}`}
                        {o.oneTimePrice && o.monthlyPrice && " · "}
                        {o.monthlyPrice && `${pesoRange(o.monthlyPrice, "/mo")}`}
                        {o.dependencies.length > 0 &&
                          ` · Needs: ${o.dependencies.map((d) => rules.optionalServices.find((x) => x.id === d)?.name ?? d).join(", ")}`}
                        {restricted && " · Not available for the selected delivery model"}
                      </span>
                      {o.thirdPartyNote && <span className="mt-0.5 block text-[11px] text-amber-700">{o.thirdPartyNote}</span>}
                    </span>
                  </label>
                );
              })}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

// ---------- Step 8: results ----------

function ResultsStep({ input, set, onSave }: { input: EstimateInput; set: (p: Partial<EstimateInput>) => void; onSave: () => void }) {
  const rules = useMemo(loadPricingRules, []);
  const settings = useMemo(loadPricingSettings, []);
  const errors = validateEstimateInput(input, rules);

  if (errors.length > 0) {
    return (
      <SectionCard tone="amber" title="Almost there">
        <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-amber-700">Use Previous to complete the missing steps.</p>
      </SectionCard>
    );
  }

  const result = calculateEstimate(input, rules, settings);
  const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

  return (
    <div className="space-y-4">
      <ManualReviewBanner reasons={result.manualReviewReasons} />

      <SectionCard title="One-time implementation estimate">
        <LineTable lines={result.oneTimeLines} subtotal={result.oneTimeSubtotal} tax={result.oneTimeTax} total={result.oneTimeTotal} />
      </SectionCard>

      <SectionCard title="Recurring monthly estimate">
        <LineTable lines={result.recurringLines} subtotal={result.recurringSubtotal} tax={result.recurringTax} total={result.recurringTotal} suffix="/mo" />
      </SectionCard>

      <SectionCard title="Adjustments">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Contingency % (suggested ${rules.configurationLevels.find((c) => c.id === input.configurationLevel)?.defaultContingencyPct}%)`}>
            <input type="number" min={0} max={50} value={input.contingencyPct} onChange={(e) => set({ contingencyPct: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} />
          </Field>
          <Field label={`Discount % (max ${settings.maximumDiscountPct}%)`}>
            <input type="number" min={0} max={100} value={input.discountPct} onChange={(e) => set({ discountPct: Math.max(0, Number(e.target.value) || 0) })} className={inputCls} />
          </Field>
        </div>
        {result.internalWarnings.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-red-600">
            {result.internalWarnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Third-party costs — not included unless explicitly stated" tone="amber">
        <ul className="list-inside list-disc space-y-1 text-xs text-amber-800">
          {result.thirdPartyNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </SectionCard>

      <EstimateDisclaimer />

      <button onClick={onSave} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-white hover:opacity-90">
        <Save className="h-4 w-4" /> Save estimate & generate packages
      </button>
    </div>
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
