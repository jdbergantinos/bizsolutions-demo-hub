import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Copy, MonitorPlay, Package, Plus, Star, Trash2 } from "lucide-react";
import { getService } from "../../data/catalog";
import { useToast } from "../../store/ToastContext";
import { EmptyState } from "../../components/common/EmptyState";
import { Modal } from "../../components/common/Modal";
import { Pill } from "../../components/common/Badge";
import type { DeliveryModel, PackageOption, PricingEstimate } from "../../pricing/types";
import { calculateEstimate } from "../../pricing/engine/calculateEstimate";
import { inputForPackage } from "../../pricing/engine/createPackageOptions";
import { pesoRange } from "../../pricing/engine/money";
import { loadEstimates, loadPricingRules, loadPricingSettings, upsertEstimate } from "../../pricing/store/pricingStorage";
import { loadPresentations, upsertPresentation } from "../../discovery/store/discoveryStorage";
import { CLIENT_DISCLAIMER } from "../../pricing/config/pricingSettings";
import { uid } from "../../utils/storage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

export function PackageComparisonPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const rules = useMemo(loadPricingRules, []);
  const settings = useMemo(loadPricingSettings, []);

  const [estimates, setEstimates] = useState<PricingEstimate[]>(() => loadEstimates().filter((e) => !e.archived));
  const [estimateId, setEstimateId] = useState<string>(() => params.get("estimate") ?? loadEstimates().filter((e) => !e.archived)[0]?.id ?? "");
  const estimate = estimates.find((e) => e.id === estimateId) ?? null;
  const [editPkg, setEditPkg] = useState<PackageOption | null>(null);

  if (estimates.length === 0) {
    return (
      <EmptyState
        icon="Package"
        title="No pricing estimates yet"
        message="Packages are built on a pricing estimate. Create one in the Pricing Configurator first."
        action={
          <button onClick={() => navigate("/pricing/new")} className="min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-white">
            Open Pricing Configurator
          </button>
        }
      />
    );
  }

  const persist = (packages: PackageOption[]) => {
    if (!estimate) return;
    const updated = { ...estimate, packages, updatedAt: new Date().toISOString() };
    upsertEstimate(updated);
    setEstimates((all) => all.map((e) => (e.id === updated.id ? updated : e)));
  };

  const packageRows = (estimate?.packages ?? []).map((pkg) => ({
    pkg,
    result: calculateEstimate(inputForPackage(estimate!.input, pkg), rules, settings),
  }));

  const copyComparison = async () => {
    if (!estimate) return;
    const text = [
      `PACKAGE COMPARISON — ${estimate.input.businessName} (${estimate.estimateNumber})`,
      "",
      ...packageRows.map(({ pkg, result }) => {
        const dm = rules.deliveryModels.find((d) => d.id === (pkg.deliveryModel ?? estimate.input.deliveryModel));
        return [
          `${pkg.name}${pkg.recommended ? " ★ Recommended" : ""}`,
          `  Modules: ${pkg.serviceOfferIds.map((id) => getService(id)?.name).filter(Boolean).join(", ")}`,
          `  Delivery: ${dm?.name} · Level: ${pkg.configurationLevel} · Support: ${pkg.supportPlanId}`,
          `  One-time: ${pesoRange(result.oneTimeTotal)} · Monthly: ${pesoRange(result.recurringTotal, "/mo")}`,
        ].join("\n");
      }),
      "",
      CLIENT_DISCLAIMER,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Package comparison copied.");
    } catch {
      toast("Clipboard blocked by the browser.", "info");
    }
  };

  const addToPresentation = () => {
    const p = loadPresentations()[0];
    if (!p || !estimate) {
      toast("No presentation exists yet — create one in the Presentation Builder first.", "info");
      return;
    }
    upsertPresentation({ ...p, estimateId: estimate.id, updatedAt: new Date().toISOString() });
    toast(`Packages attached to "${p.title}" via estimate ${estimate.estimateNumber}.`);
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Package className="h-5 w-5 text-accent" /> Package Comparison
        </h1>
        <p className="text-sm text-slate-500">Side-by-side packages built from a pricing estimate. Changes save into the estimate.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <select value={estimateId} onChange={(e) => setEstimateId(e.target.value)} aria-label="Estimate" className={`${inputCls} flex-1 sm:max-w-xs`}>
          {estimates.map((e) => (
            <option key={e.id} value={e.id}>{e.estimateNumber} · {e.input.businessName}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (!estimate) return;
            const pkg: PackageOption = {
              id: uid(),
              name: "Custom package",
              description: "Presenter-defined package.",
              serviceOfferIds: estimate.input.selectedServiceOfferIds.slice(0, 3),
              optionalServiceIds: [],
              configurationLevel: estimate.input.configurationLevel,
              supportPlanId: estimate.input.supportPlanId,
              recommended: false,
            };
            persist([...(estimate.packages ?? []), pkg]);
            setEditPkg(pkg);
          }}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" /> Custom package
        </button>
        <button onClick={copyComparison} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Copy className="h-4 w-4" /> Copy
        </button>
        <button onClick={addToPresentation} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <MonitorPlay className="h-4 w-4" /> To presentation
        </button>
      </div>

      {/* Mobile: stacked cards. Desktop: side-by-side grid. */}
      <div className="grid gap-3 md:grid-cols-3">
        {packageRows.map(({ pkg, result }) => {
          const dm = rules.deliveryModels.find((d) => d.id === (pkg.deliveryModel ?? estimate!.input.deliveryModel));
          const level = rules.configurationLevels.find((c) => c.id === pkg.configurationLevel);
          const support = rules.supportPlans.find((s) => s.id === pkg.supportPlanId);
          const size = rules.businessSizes.find((s) => s.id === estimate!.input.businessSize);
          return (
            <div key={pkg.id} className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${pkg.recommended ? "border-accent ring-1 ring-accent/30" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-1">
                <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
                {pkg.recommended && <Pill tone="amber"><Star className="mr-0.5 inline h-3 w-3 fill-current" />Recommended</Pill>}
              </div>
              <p className="mt-1 text-lg font-bold text-accent">{pesoRange(result.oneTimeTotal)}</p>
              <p className="text-xs text-slate-500">one-time · {pesoRange(result.recurringTotal, "/mo")}</p>

              <dl className="mt-3 space-y-1 text-[11px] text-slate-600">
                <Row k="Delivery model" v={dm?.name ?? "—"} />
                <Row k="Configuration" v={level?.name ?? "—"} />
                <Row k="Support" v={support?.name ?? "—"} />
                <Row k="Users / branches" v={`${estimate!.input.users} users · ${estimate!.input.branches} branch(es) (size: ${size?.name})`} />
                <Row k="Best for" v={dm?.recommendedFor ?? "—"} />
              </dl>

              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Modules ({pkg.serviceOfferIds.length})</p>
              <ul className="mt-0.5 flex-1 space-y-0.5 text-xs text-slate-600">
                {pkg.serviceOfferIds.map((id) => (
                  <li key={id}>• {getService(id)?.name ?? id}</li>
                ))}
              </ul>
              {pkg.optionalServiceIds.length > 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Options: {pkg.optionalServiceIds.map((id) => rules.optionalServices.find((o) => o.id === id)?.name).filter(Boolean).join(", ")}
                </p>
              )}
              <p className="mt-2 text-[11px] text-amber-700">
                Excludes third-party fees; final scope subject to discovery.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <button onClick={() => setEditPkg(pkg)} className="min-h-10 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  Edit
                </button>
                <button
                  onClick={() => persist(estimate!.packages.map((p) => ({ ...p, recommended: p.id === pkg.id })))}
                  className="min-h-10 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Recommend
                </button>
                <button
                  onClick={() => {
                    const copy = { ...pkg, id: uid(), name: pkg.name + " (Copy)", recommended: false };
                    persist([...estimate!.packages, copy]);
                    toast("Package duplicated.");
                  }}
                  className="min-h-10 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    persist(estimate!.packages.filter((p) => p.id !== pkg.id));
                    toast("Package removed.");
                  }}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs italic text-slate-400">{CLIENT_DISCLAIMER}</p>

      {editPkg && estimate && (
        <Modal title={`Edit package — ${editPkg.name}`} onClose={() => setEditPkg(null)} wide>
          <PackageForm
            pkg={editPkg}
            estimate={estimate}
            onSave={(updated) => {
              persist(estimate.packages.map((p) => (p.id === updated.id ? updated : p)));
              setEditPkg(null);
              toast("Package saved into the estimate.");
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="shrink-0 text-slate-400">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}

function PackageForm({ pkg, estimate, onSave }: { pkg: PackageOption; estimate: PricingEstimate; onSave: (p: PackageOption) => void }) {
  const rules = useMemo(loadPricingRules, []);
  const [draft, setDraft] = useState<PackageOption>(pkg);
  const industryServiceIds = [...new Set([...estimate.input.selectedServiceOfferIds, ...draft.serviceOfferIds])];

  const move = (id: string, dir: -1 | 1) => {
    const i = draft.serviceOfferIds.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= draft.serviceOfferIds.length) return;
    const copy = [...draft.serviceOfferIds];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setDraft({ ...draft, serviceOfferIds: copy });
  };

  return (
    <div className="space-y-3">
      <L label="Package name">
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Starter package" className={inputCls} />
      </L>
      <L label="Delivery model (this package)">
        <select
          value={draft.deliveryModel ?? estimate.input.deliveryModel}
          onChange={(e) => setDraft({ ...draft, deliveryModel: e.target.value as DeliveryModel })}
          className={inputCls}
        >
          {rules.deliveryModels.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </L>
      <div className="grid grid-cols-2 gap-3">
        <L label="Configuration level">
          <select value={draft.configurationLevel} onChange={(e) => setDraft({ ...draft, configurationLevel: e.target.value as PackageOption["configurationLevel"] })} className={inputCls}>
            {rules.configurationLevels.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </L>
        <L label="Support plan">
          <select value={draft.supportPlanId} onChange={(e) => setDraft({ ...draft, supportPlanId: e.target.value })} className={inputCls}>
            {rules.supportPlans.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </L>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Modules (order sets priority)</p>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
          {industryServiceIds.map((id) => {
            const included = draft.serviceOfferIds.includes(id);
            const i = draft.serviceOfferIds.indexOf(id);
            return (
              <div key={id} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={included}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      serviceOfferIds: e.target.checked ? [...draft.serviceOfferIds, id] : draft.serviceOfferIds.filter((x) => x !== id),
                    })
                  }
                  className="h-4 w-4 accent-[var(--app-accent)]"
                />
                <span className="flex-1 truncate">{getService(id)?.name ?? id}</span>
                {included && (
                  <>
                    <button aria-label="Move up" disabled={i === 0} onClick={() => move(id, -1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs disabled:opacity-30">↑</button>
                    <button aria-label="Move down" disabled={i === draft.serviceOfferIds.length - 1} onClick={() => move(id, 1)} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs disabled:opacity-30">↓</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => draft.serviceOfferIds.length > 0 && onSave(draft)}
        disabled={draft.serviceOfferIds.length === 0}
        className="min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        Save package
      </button>
    </div>
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
