import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Copy, Eye, EyeOff, Lock, MonitorPlay, Pencil, Printer, Share2, Star,
} from "lucide-react";
import { getIndustry, getService } from "../../data/catalog";
import { useApp } from "../../store/AppStore";
import { useToast } from "../../store/ToastContext";
import { EmptyState } from "../../components/common/EmptyState";
import { Modal } from "../../components/common/Modal";
import { Pill } from "../../components/common/Badge";
import type { EstimateStatus, PackageOption, PricingEstimate } from "../types";
import { calculateEstimate } from "../engine/calculateEstimate";
import { createPackageOptions, inputForPackage } from "../engine/createPackageOptions";
import { pesoRange } from "../engine/money";
import { loadEstimates, loadPricingRules, loadPricingSettings, upsertEstimate } from "../store/pricingStorage";
import { buildClientSummary, buildPackageComparison, validUntil } from "../utils/summary";
import { EstimateDisclaimer, LineTable, ManualReviewBanner, SectionCard } from "../components/pricingUi";

export function EstimateViewPage() {
  const { estimateId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { presentation, setPresentation } = useApp();
  const rules = useMemo(loadPricingRules, []);
  const settings = useMemo(loadPricingSettings, []);

  const [estimate, setEstimate] = useState<PricingEstimate | null>(
    () => loadEstimates().find((e) => e.id === estimateId) ?? null,
  );
  const [internalMode, setInternalMode] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [editPkg, setEditPkg] = useState<PackageOption | null>(null);

  if (!estimate) {
    return (
      <EmptyState
        icon="FileText"
        title="Estimate not found"
        action={<Link to="/pricing" className="text-sm font-medium text-accent hover:underline">Back to estimates</Link>}
      />
    );
  }

  const { input, result } = estimate;
  const industry = getIndustry(input.industryId);
  const manualReview = result.manualReviewReasons.length > 0;

  const update = (patch: Partial<PricingEstimate>) => {
    const next = { ...estimate, ...patch, updatedAt: new Date().toISOString() };
    upsertEstimate(next);
    setEstimate(next);
  };

  const packageTotals = estimate.packages.map((pkg) => {
    const r = calculateEstimate(inputForPackage(input, pkg), rules, settings);
    return { pkg, result: r };
  });

  const summaryText = buildClientSummary(estimate, settings, rules);

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      toast("Could not copy — clipboard access was blocked.", "info");
    }
  };

  const shareText = async (text: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {
        // user cancelled
      }
    } else {
      toast("Sharing is not supported here — use Copy instead.", "info");
    }
  };

  const tryInternal = () => {
    if (internalMode) {
      setInternalMode(false);
      return;
    }
    if (settings.internalPin) {
      setPinOpen(true);
    } else {
      setInternalMode(true);
      toast("Internal view opened. Set a PIN in Pricing Admin for presentation privacy.", "info");
    }
  };

  const setStatus = (status: EstimateStatus) => {
    if (status === "approved-for-proposal" && manualReview) {
      toast("This estimate requires manual technical review and cannot be approved yet.", "info");
      return;
    }
    update({ status });
    toast(`Status set to ${status.replace(/-/g, " ")}.`);
  };

  const openInPresentation = () => {
    setPresentation({
      ...presentation,
      businessName: input.businessName || presentation.businessName,
      industryId: input.industryId || presentation.industryId,
      estimateId: estimate.id,
      showPricing: true,
    });
    toast("Estimate attached to Presentation Mode.");
    navigate("/present");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate("/pricing")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Estimates
        </button>
        <button
          onClick={tryInternal}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${internalMode ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}
        >
          {internalMode ? <EyeOff className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {internalMode ? "Exit internal view" : "Internal view"}
        </button>
      </div>

      {/* Header */}
      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{input.businessName}</h1>
            <p className="text-sm text-slate-500">
              {estimate.estimateNumber} · {industry?.name}
              {input.businessExample ? ` · ${input.businessExample}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Created {estimate.createdAt.slice(0, 10)} · Valid until {validUntil(estimate, settings)} · Price table {estimate.priceTableVersion}
            </p>
          </div>
          <Pill tone={estimate.status === "approved-for-proposal" ? "green" : estimate.status === "manual-review" ? "amber" : "blue"}>
            {estimate.status.replace(/-/g, " ")}
          </Pill>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {rules.businessSizes.find((s) => s.id === input.businessSize)?.name} · {input.branches} branch(es) · {input.users} users ·{" "}
          {rules.deliveryModels.find((d) => d.id === input.deliveryModel)?.name} ·{" "}
          {rules.configurationLevels.find((c) => c.id === input.configurationLevel)?.name} level
        </p>
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <button onClick={() => navigate("/pricing/new")} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Pencil className="h-3.5 w-3.5" /> New from configurator
          </button>
          <button onClick={() => setStatus("manual-review")} className="min-h-10 rounded-lg border border-amber-300 px-3 text-xs font-medium text-amber-700 hover:bg-amber-50">
            Mark for manual review
          </button>
          <button
            onClick={() => setStatus("approved-for-proposal")}
            disabled={manualReview}
            title={manualReview ? "Blocked: manual technical review required" : ""}
            className="min-h-10 rounded-lg border border-emerald-300 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
          >
            Mark ready for proposal
          </button>
          <button onClick={openInPresentation} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90">
            <MonitorPlay className="h-3.5 w-3.5" /> Open in Presentation Mode
          </button>
        </div>
      </SectionCard>

      <ManualReviewBanner reasons={result.manualReviewReasons} />

      {/* Client-facing figures */}
      <SectionCard title="One-time implementation estimate">
        <LineTable lines={result.oneTimeLines} subtotal={result.oneTimeSubtotal} tax={result.oneTimeTax} total={result.oneTimeTotal} />
      </SectionCard>
      <SectionCard title="Recurring monthly estimate">
        <LineTable lines={result.recurringLines} subtotal={result.recurringSubtotal} tax={result.recurringTax} total={result.recurringTotal} suffix="/mo" />
      </SectionCard>

      {/* Packages */}
      <SectionCard title="Package options">
        <div className="grid gap-3 md:grid-cols-3">
          {packageTotals.map(({ pkg, result: r }) => (
            <div key={pkg.id} className={`rounded-xl border p-3 ${pkg.recommended ? "border-accent ring-1 ring-accent/30" : "border-slate-200"}`}>
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
                {pkg.recommended && <Pill tone="amber"><Star className="mr-0.5 inline h-3 w-3 fill-current" />Recommended</Pill>}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{pkg.description}</p>
              <p className="mt-2 text-xs font-semibold text-slate-900">{pesoRange(r.oneTimeTotal)}</p>
              <p className="text-xs text-slate-600">{pesoRange(r.recurringTotal, "/mo")}</p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                {pkg.serviceOfferIds.slice(0, 5).map((id) => (
                  <li key={id}>• {getService(id)?.name}</li>
                ))}
                {pkg.serviceOfferIds.length > 5 && <li>… and {pkg.serviceOfferIds.length - 5} more</li>}
              </ul>
              <div className="mt-2 flex gap-1.5 print:hidden">
                <button onClick={() => setEditPkg(pkg)} className="min-h-9 flex-1 rounded-lg border border-slate-300 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                  Edit
                </button>
                <button
                  onClick={() =>
                    update({ packages: estimate.packages.map((p) => ({ ...p, recommended: p.id === pkg.id })) })
                  }
                  className="min-h-9 flex-1 rounded-lg border border-slate-300 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Set recommended
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => {
              update({ packages: createPackageOptions(input, rules) });
              toast("Packages regenerated from current selections.");
            }}
            className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Regenerate packages
          </button>
          <button
            onClick={() =>
              copyText(
                buildPackageComparison(
                  estimate,
                  packageTotals.map(({ pkg, result: r }) => ({
                    name: pkg.name,
                    oneTime: pesoRange(r.oneTimeTotal),
                    monthly: pesoRange(r.recurringTotal, "/mo"),
                    recommended: pkg.recommended,
                  })),
                ),
                "Package comparison copied.",
              )
            }
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Copy className="h-3.5 w-3.5" /> Copy comparison
          </button>
          <button
            onClick={() =>
              shareText(
                buildPackageComparison(
                  estimate,
                  packageTotals.map(({ pkg, result: r }) => ({
                    name: pkg.name,
                    oneTime: pesoRange(r.oneTimeTotal),
                    monthly: pesoRange(r.recurringTotal, "/mo"),
                    recommended: pkg.recommended,
                  })),
                ),
                "Package options",
              )
            }
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </SectionCard>

      {/* Notes */}
      <SectionCard title="Third-party costs — not included unless explicitly stated" tone="amber">
        <ul className="list-inside list-disc space-y-1 text-xs text-amber-800">
          {result.thirdPartyNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Assumptions">
        <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Exclusions">
        <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
          {result.exclusions.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </SectionCard>

      {/* Internal view */}
      {internalMode && (
        <SectionCard title="Internal pricing (never shown to clients)">
          <p className="mb-2 rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-slate-500">
            This local PIN provides presentation privacy only and is not production-grade security.
          </p>
          <LineTable
            lines={result.internal.allowances}
            subtotal={result.internal.estimatedInternalCost}
            tax={null}
            total={result.internal.estimatedInternalCost}
          />
          <dl className="mt-3 space-y-1.5 text-sm">
            <InternalRow label="Sales commission allowance">{pesoRange(result.internal.salesCommission)}</InternalRow>
            <InternalRow label={`Suggested selling price (target margin ${result.internal.targetGrossMarginPct}%)`}>
              {pesoRange(result.internal.suggestedSellingPrice)}
            </InternalRow>
            <InternalRow label="Minimum acceptable price">₱{result.internal.minimumAcceptablePrice.toLocaleString("en-PH")}</InternalRow>
            <InternalRow label="Effective margin at current estimate">~{result.internal.effectiveMarginPct}%</InternalRow>
            <InternalRow label="Discount applied">{input.discountPct}% (max {settings.maximumDiscountPct}%)</InternalRow>
            {input.manualAdjustment !== 0 && (
              <InternalRow label="Manual adjustment">
                ₱{input.manualAdjustment.toLocaleString("en-PH")} — {input.manualAdjustmentReason || "no reason recorded"}
              </InternalRow>
            )}
          </dl>
          {result.internalWarnings.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs font-medium text-red-600">
              {result.internalWarnings.map((w) => (
                <li key={w}>⚠ {w}</li>
              ))}
            </ul>
          )}
          {input.notes && <p className="mt-2 text-xs text-slate-500">Internal notes: {input.notes}</p>}
        </SectionCard>
      )}

      {/* Summary actions */}
      <SectionCard title="Client estimate summary">
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
          {summaryText}
        </pre>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 print:hidden">
          <ActionBtn onClick={() => copyText(summaryText, "Client summary copied.")}>
            <Copy className="h-4 w-4" /> Copy
          </ActionBtn>
          <ActionBtn onClick={() => shareText(summaryText, `Estimate ${estimate.estimateNumber}`)}>
            <Share2 className="h-4 w-4" /> Share
          </ActionBtn>
          <ActionBtn onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </ActionBtn>
          <ActionBtn onClick={() => { update({}); toast("Estimate saved locally."); }}>
            <Eye className="h-4 w-4" /> Save
          </ActionBtn>
        </div>
      </SectionCard>

      <EstimateDisclaimer />

      {/* PIN dialog */}
      {pinOpen && (
        <Modal title="Internal pricing PIN" onClose={() => setPinOpen(false)}>
          <p className="mb-3 text-xs text-slate-500">
            This local PIN provides presentation privacy only and is not production-grade security.
          </p>
          <input
            type="password"
            inputMode="numeric"
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            placeholder="Enter PIN"
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
          />
          <button
            onClick={() => {
              if (pinValue === settings.internalPin) {
                setInternalMode(true);
                setPinOpen(false);
                setPinValue("");
              } else {
                toast("Incorrect PIN.", "info");
              }
            }}
            className="mt-3 min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white"
          >
            Unlock internal view
          </button>
        </Modal>
      )}

      {/* Package editor */}
      {editPkg && (
        <Modal title={`Edit package — ${editPkg.name}`} onClose={() => setEditPkg(null)} wide>
          <PackageEditor
            pkg={editPkg}
            serviceIds={input.selectedServiceOfferIds}
            onSave={(updated) => {
              update({ packages: estimate.packages.map((p) => (p.id === updated.id ? updated : p)) });
              setEditPkg(null);
              toast("Package updated.");
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function InternalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50">
      {children}
    </button>
  );
}

function PackageEditor({
  pkg,
  serviceIds,
  onSave,
}: {
  pkg: PackageOption;
  serviceIds: string[];
  onSave: (p: PackageOption) => void;
}) {
  const [draft, setDraft] = useState(pkg);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Package name</span>
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
        />
      </label>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Modules in this package</p>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
          {serviceIds.map((id) => (
            <label key={id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                checked={draft.serviceOfferIds.includes(id)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    serviceOfferIds: e.target.checked
                      ? [...draft.serviceOfferIds, id]
                      : draft.serviceOfferIds.filter((x) => x !== id),
                  })
                }
                className="h-4 w-4 accent-[var(--app-accent)]"
              />
              {getService(id)?.name}
            </label>
          ))}
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
