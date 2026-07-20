import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Download, RotateCcw, Save, Upload } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import type { PriceRange, PricingRules, PricingSettings } from "../types";
import { validatePricingRules } from "../engine/validateEstimate";
import {
  loadPricingRules, loadPricingSettings, resetPricingRules, rulesAreCustomized,
  savePricingRules, savePricingSettings,
} from "../store/pricingStorage";
import { SectionCard } from "../components/pricingUi";

export function PricingAdminPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<PricingSettings>(loadPricingSettings);
  const [rules, setRules] = useState<PricingRules>(loadPricingRules);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<{ rules: PricingRules; summary: string[] } | null>(null);

  const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

  const setS = (patch: Partial<PricingSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const saveSettings = () => {
    savePricingSettings(settings);
    toast("Pricing settings saved on this device.");
  };

  const saveRules = () => {
    const errors = savePricingRules(rules);
    if (errors.length > 0) {
      toast(`Rules not saved: ${errors[0]}`, "info");
    } else {
      toast("Pricing rules saved on this device.");
    }
  };

  const exportRules = async () => {
    const json = JSON.stringify(rules, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      toast("Pricing configuration JSON copied to clipboard.");
    } catch {
      setImportText(json);
      toast("Clipboard blocked — JSON placed in the import box for manual copying.", "info");
    }
  };

  const previewImport = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      toast("That is not valid JSON.", "info");
      return;
    }
    const errors = validatePricingRules(parsed);
    if (errors.length > 0) {
      toast(`Import rejected: ${errors[0]}`, "info");
      return;
    }
    const next = parsed as PricingRules;
    setImportPreview({
      rules: next,
      summary: [
        `Version: ${rules.version} → ${next.version}`,
        `Delivery models: ${next.deliveryModels.length}`,
        `Module prices: ${next.modulePricing.length}`,
        `Optional services: ${next.optionalServices.length}`,
        `Support plans: ${next.supportPlans.length}`,
        `Industry risk rules: ${next.industryRisk.length}`,
      ],
    });
  };

  return (
    <div className="space-y-4">
      <Link to="/pricing" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Pricing
      </Link>
      <header>
        <h1 className="text-xl font-bold text-slate-900">Pricing Administration</h1>
        <p className="text-sm text-slate-500">Pricing configuration is stored only on this device.</p>
      </header>

      <SectionCard tone="amber">
        <p className="flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Pricing values are initial internal estimates and require owner review before use with
          clients. Source: {rules.pricingSource}
        </p>
      </SectionCard>

      {/* ---------- Settings ---------- */}
      <SectionCard title="Pricing settings">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Currency">
            <input value="Philippine peso (₱)" disabled className={`${inputCls} bg-slate-50 text-slate-500`} />
          </Field>
          <Field label="Estimate validity (days)">
            <input type="number" min={1} value={settings.estimateValidityDays} onChange={(e) => setS({ estimateValidityDays: Math.max(1, Number(e.target.value) || 30) })} className={inputCls} />
          </Field>
          <Field label="VAT enabled">
            <select value={settings.vatEnabled ? "yes" : "no"} onChange={(e) => setS({ vatEnabled: e.target.value === "yes" })} className={inputCls}>
              <option value="no">Disabled</option>
              <option value="yes">Enabled</option>
            </select>
          </Field>
          <Field label="VAT percentage">
            <input type="number" min={0} max={30} value={settings.vatPct} onChange={(e) => setS({ vatPct: Number(e.target.value) || 0 })} className={inputCls} />
          </Field>
          <Field label="Prices are">
            <select value={settings.pricesVatInclusive ? "inc" : "exc"} onChange={(e) => setS({ pricesVatInclusive: e.target.value === "inc" })} className={inputCls}>
              <option value="exc">VAT-exclusive</option>
              <option value="inc">VAT-inclusive</option>
            </select>
          </Field>
          <Field label="Default contingency %">
            <input type="number" min={0} max={50} value={settings.defaultContingencyPct} onChange={(e) => setS({ defaultContingencyPct: Number(e.target.value) || 0 })} className={inputCls} />
          </Field>
          <Field label="Target gross margin %">
            <input type="number" min={0} max={90} value={settings.targetGrossMarginPct} onChange={(e) => setS({ targetGrossMarginPct: Number(e.target.value) || 0 })} className={inputCls} />
          </Field>
          <Field label="Minimum gross margin %">
            <input type="number" min={0} max={90} value={settings.minimumGrossMarginPct} onChange={(e) => setS({ minimumGrossMarginPct: Number(e.target.value) || 0 })} className={inputCls} />
          </Field>
          <Field label="Maximum sales discount %">
            <input type="number" min={0} max={100} value={settings.maximumDiscountPct} onChange={(e) => setS({ maximumDiscountPct: Number(e.target.value) || 0 })} className={inputCls} />
          </Field>
          <Field label="Default support plan">
            <select value={settings.defaultSupportPlanId} onChange={(e) => setS({ defaultSupportPlanId: e.target.value })} className={inputCls}>
              {rules.supportPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Default delivery model">
            <select value={settings.defaultDeliveryModel} onChange={(e) => setS({ defaultDeliveryModel: e.target.value as PricingSettings["defaultDeliveryModel"] })} className={inputCls}>
              {rules.deliveryModels.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Default configuration level">
            <select value={settings.defaultConfigurationLevel} onChange={(e) => setS({ defaultConfigurationLevel: e.target.value as PricingSettings["defaultConfigurationLevel"] })} className={inputCls}>
              {rules.configurationLevels.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Internal pricing PIN">
            <input type="password" value={settings.internalPin} onChange={(e) => setS({ internalPin: e.target.value })} placeholder="No PIN set" className={inputCls} />
          </Field>
          <Field label="Last price-review date">
            <input type="date" value={settings.lastPriceReviewDate} onChange={(e) => setS({ lastPriceReviewDate: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          The internal PIN provides presentation privacy only and is not production-grade security.
        </p>
        <Field label="Third-party cost disclaimer">
          <textarea value={settings.thirdPartyDisclaimer} onChange={(e) => setS({ thirdPartyDisclaimer: e.target.value })} rows={2} className={`${inputCls} mt-1 py-2`} />
        </Field>
        <Field label="Default assumptions (one per line)">
          <textarea value={settings.defaultAssumptions.join("\n")} onChange={(e) => setS({ defaultAssumptions: e.target.value.split("\n").filter(Boolean) })} rows={4} className={`${inputCls} mt-1 py-2`} />
        </Field>
        <Field label="Default exclusions (one per line)">
          <textarea value={settings.defaultExclusions.join("\n")} onChange={(e) => setS({ defaultExclusions: e.target.value.split("\n").filter(Boolean) })} rows={4} className={`${inputCls} mt-1 py-2`} />
        </Field>
        <button onClick={saveSettings} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:opacity-90">
          <Save className="h-4 w-4" /> Save settings
        </button>
      </SectionCard>

      {/* ---------- Rule editors ---------- */}
      <SectionCard title={`Pricing rules (version ${rules.version}${rulesAreCustomized() ? " · customized" : " · seed"})`}>
        <div className="space-y-5">
          <RuleGroup title="Delivery-model base prices">
            {rules.deliveryModels.map((d, i) => (
              <RangeRow
                key={d.id}
                label={`${d.name} — setup`}
                range={d.baseSetup}
                onChange={(r) => setRules((prev) => ({ ...prev, deliveryModels: prev.deliveryModels.map((x, j) => (j === i ? { ...x, baseSetup: r } : x)) }))}
              />
            ))}
            {rules.deliveryModels.map((d, i) => (
              <RangeRow
                key={d.id + "-m"}
                label={`${d.name} — monthly`}
                range={d.baseMonthly}
                onChange={(r) => setRules((prev) => ({ ...prev, deliveryModels: prev.deliveryModels.map((x, j) => (j === i ? { ...x, baseMonthly: r } : x)) }))}
              />
            ))}
          </RuleGroup>

          <RuleGroup title="Business-size factors">
            {rules.businessSizes.map((s, i) => (
              <NumberRow
                key={s.id}
                label={s.name}
                value={s.sizeFactor}
                step={0.05}
                onChange={(v) => setRules((prev) => ({ ...prev, businessSizes: prev.businessSizes.map((x, j) => (j === i ? { ...x, sizeFactor: v } : x)) }))}
              />
            ))}
          </RuleGroup>

          <RuleGroup title="Configuration-level factors & contingency">
            {rules.configurationLevels.map((c, i) => (
              <div key={c.id} className="grid grid-cols-2 gap-2">
                <NumberRow
                  label={`${c.name} — setup factor`}
                  value={c.setupFactor}
                  step={0.05}
                  onChange={(v) => setRules((prev) => ({ ...prev, configurationLevels: prev.configurationLevels.map((x, j) => (j === i ? { ...x, setupFactor: v } : x)) }))}
                />
                <NumberRow
                  label="Default contingency %"
                  value={c.defaultContingencyPct}
                  step={1}
                  onChange={(v) => setRules((prev) => ({ ...prev, configurationLevels: prev.configurationLevels.map((x, j) => (j === i ? { ...x, defaultContingencyPct: v } : x)) }))}
                />
              </div>
            ))}
          </RuleGroup>

          <RuleGroup title="User & branch price rules">
            <RangeRow label="Additional user (monthly)" range={rules.userBranchRules.extraUserMonthly} onChange={(r) => setRules((prev) => ({ ...prev, userBranchRules: { ...prev.userBranchRules, extraUserMonthly: r } }))} />
            <RangeRow label="Additional branch (monthly)" range={rules.userBranchRules.extraBranchMonthly} onChange={(r) => setRules((prev) => ({ ...prev, userBranchRules: { ...prev.userBranchRules, extraBranchMonthly: r } }))} />
            <RangeRow label="Additional branch (setup)" range={rules.userBranchRules.extraBranchSetup} onChange={(r) => setRules((prev) => ({ ...prev, userBranchRules: { ...prev.userBranchRules, extraBranchSetup: r } }))} />
          </RuleGroup>

          <RuleGroup title="Module prices (baseline)">
            {rules.modulePricing.map((m, i) => (
              <div key={m.module} className="grid grid-cols-2 gap-2">
                <RangeRow label={`${m.module} — setup`} range={m.setupPrice} onChange={(r) => setRules((prev) => ({ ...prev, modulePricing: prev.modulePricing.map((x, j) => (j === i ? { ...x, setupPrice: r } : x)) }))} />
                <RangeRow label="monthly" range={m.monthlyPrice} onChange={(r) => setRules((prev) => ({ ...prev, modulePricing: prev.modulePricing.map((x, j) => (j === i ? { ...x, monthlyPrice: r } : x)) }))} />
              </div>
            ))}
          </RuleGroup>

          <RuleGroup title="Optional-service prices">
            {rules.optionalServices.map((o, i) => (
              <div key={o.id} className="grid grid-cols-2 gap-2">
                {o.oneTimePrice ? (
                  <RangeRow label={`${o.name} — one-time`} range={o.oneTimePrice} onChange={(r) => setRules((prev) => ({ ...prev, optionalServices: prev.optionalServices.map((x, j) => (j === i ? { ...x, oneTimePrice: r } : x)) }))} />
                ) : (
                  <span />
                )}
                {o.monthlyPrice ? (
                  <RangeRow label="monthly" range={o.monthlyPrice} onChange={(r) => setRules((prev) => ({ ...prev, optionalServices: prev.optionalServices.map((x, j) => (j === i ? { ...x, monthlyPrice: r } : x)) }))} />
                ) : (
                  <span />
                )}
              </div>
            ))}
          </RuleGroup>

          <RuleGroup title="Support-plan prices (monthly)">
            {rules.supportPlans.map((p, i) => (
              <RangeRow key={p.id} label={p.name} range={p.monthlyPrice} onChange={(r) => setRules((prev) => ({ ...prev, supportPlans: prev.supportPlans.map((x, j) => (j === i ? { ...x, monthlyPrice: r } : x)) }))} />
            ))}
          </RuleGroup>

          <RuleGroup title="Industry risk adjustments & manual-review rules">
            {rules.industryRisk.map((r, i) => (
              <div key={r.industryId} className="flex items-center gap-2">
                <span className="w-32 shrink-0 truncate text-xs text-slate-600">{r.industryId}</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={r.riskPct}
                  aria-label={`${r.industryId} risk percent`}
                  onChange={(e) => setRules((prev) => ({ ...prev, industryRisk: prev.industryRisk.map((x, j) => (j === i ? { ...x, riskPct: Number(e.target.value) || 0 } : x)) }))}
                  className="min-h-10 w-20 rounded-lg border border-slate-300 px-2 text-sm"
                />
                <span className="text-xs text-slate-400">%</span>
                <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={r.manualReview}
                    onChange={(e) => setRules((prev) => ({ ...prev, industryRisk: prev.industryRisk.map((x, j) => (j === i ? { ...x, manualReview: e.target.checked } : x)) }))}
                    className="h-4 w-4 accent-[var(--app-accent)]"
                  />
                  Manual review
                </label>
              </div>
            ))}
          </RuleGroup>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={saveRules} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:opacity-90">
            <Save className="h-4 w-4" /> Save pricing rules
          </button>
          <button onClick={exportRules} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <button onClick={() => setConfirmReset(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 hover:bg-red-50">
            <RotateCcw className="h-4 w-4" /> Reset to seed pricing
          </button>
        </div>
      </SectionCard>

      {/* ---------- Import ---------- */}
      <SectionCard title="Import pricing configuration (JSON)">
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={5}
          placeholder="Paste an exported pricing-configuration JSON here…"
          className={`${inputCls} py-2 font-mono text-xs`}
        />
        <button onClick={previewImport} disabled={!importText.trim()} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
          <Upload className="h-4 w-4" /> Validate & preview
        </button>
        {importPreview && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Import preview — nothing applied yet:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-slate-600">
              {importPreview.summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  const errors = savePricingRules(importPreview.rules);
                  if (errors.length === 0) {
                    setRules(importPreview.rules);
                    setImportPreview(null);
                    setImportText("");
                    toast("Imported pricing configuration applied.");
                  } else {
                    toast(`Import failed: ${errors[0]}`, "info");
                  }
                }}
                className="min-h-10 rounded-lg bg-accent px-4 text-xs font-semibold text-white"
              >
                Apply import
              </button>
              <button onClick={() => setImportPreview(null)} className="min-h-10 rounded-lg border border-slate-300 px-4 text-xs font-medium text-slate-600">
                Cancel
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {confirmReset && (
        <ConfirmDialog
          title="Reset to seed pricing?"
          message="All local edits to pricing rules will be discarded and the built-in seed values restored. Saved estimates keep their own snapshots."
          confirmLabel="Reset rules"
          onConfirm={() => {
            resetPricingRules();
            setRules(loadPricingRules());
            setConfirmReset(false);
            toast("Pricing rules reset to seed values.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function RuleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200">
      <button onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm font-medium text-slate-700">
        {title}
        <span className="text-xs text-slate-400">{open ? "Hide" : "Edit"}</span>
      </button>
      {open && <div className="space-y-2 border-t border-slate-100 p-3">{children}</div>}
    </div>
  );
}

function RangeRow({ label, range, onChange }: { label: string; range: PriceRange; onChange: (r: PriceRange) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        value={range.minimum}
        aria-label={`${label} minimum`}
        onChange={(e) => onChange({ ...range, minimum: Number(e.target.value) || 0 })}
        className="min-h-10 w-24 rounded-lg border border-slate-300 px-2 text-sm"
      />
      <span className="text-xs text-slate-400">–</span>
      <input
        type="number"
        min={0}
        value={range.maximum}
        aria-label={`${label} maximum`}
        onChange={(e) => onChange({ ...range, maximum: Number(e.target.value) || 0 })}
        className="min-h-10 w-24 rounded-lg border border-slate-300 px-2 text-sm"
      />
    </div>
  );
}

function NumberRow({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="min-h-10 w-24 rounded-lg border border-slate-300 px-2 text-sm"
      />
    </div>
  );
}
