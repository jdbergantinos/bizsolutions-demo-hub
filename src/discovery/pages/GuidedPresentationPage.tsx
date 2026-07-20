import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, EyeOff, ExternalLink, StickyNote, X } from "lucide-react";
import { getIndustry, getService } from "../../data/catalog";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Pill } from "../../components/common/Badge";
import { calculateEstimate } from "../../pricing/engine/calculateEstimate";
import { inputForPackage } from "../../pricing/engine/createPackageOptions";
import { pesoRange } from "../../pricing/engine/money";
import { LineTable } from "../../pricing/components/pricingUi";
import { CLIENT_DISCLAIMER } from "../../pricing/config/pricingSettings";
import { loadEstimates, loadPricingRules, loadPricingSettings } from "../../pricing/store/pricingStorage";
import type { PresentationSectionId, RoleView, SalesPresentation } from "../types";
import { normalizeSections, SECTION_META } from "../config/sections";
import { getProblem } from "../config/problemCatalog";
import { getRolesForIndustry } from "../config/roleConfigs";
import { loadDiscoveries, loadPresentations, loadWorkflows, upsertPresentation } from "../store/discoveryStorage";
import { meetingRepo, roadmapRepo, roiRepo, scopeRepo } from "../../value/store/valueStorage";
import { calculateRoi, ROI_DISCLAIMER } from "../../value/engine/calculateRoi";
import { recommendNextStep } from "../../value/engine/nextStep";
import { SCOPE_DISCLAIMER } from "../../value/config/scopeTemplates";
import { ROADMAP_DISCLAIMER } from "../../value/config/roadmapStages";

/**
 * Full-screen guided presentation. Rendered OUTSIDE the app layout, so there
 * is no navigation chrome to tap accidentally; leaving requires the explicit
 * Exit control (with confirmation).
 */
export function GuidedPresentationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const presentation = useMemo<SalesPresentation | null>(() => {
    const id = params.get("id");
    const all = loadPresentations();
    return (id ? all.find((x) => x.id === id) : all[0]) ?? null;
  }, [params]);

  const preview = params.get("preview") === "1";

  if (!presentation) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-900 p-6 text-center text-white">
        <p className="text-lg font-semibold">No presentation found</p>
        <p className="text-sm text-white/60">Build one first in the Presentation Builder.</p>
        <button onClick={() => navigate("/presentation-builder")} className="min-h-12 rounded-xl bg-white px-6 text-sm font-semibold text-slate-900">
          Open Presentation Builder
        </button>
      </div>
    );
  }

  return <Runner presentation={presentation} startInPresenterView={preview} />;
}

function Runner({ presentation, startInPresenterView }: { presentation: SalesPresentation; startInPresenterView: boolean }) {
  const navigate = useNavigate();
  // Held in state so "Hide this section" can update the running presentation.
  const [pres, setPres] = useState(presentation);
  // Presentations saved before Phase B gain its sections automatically.
  const sections = normalizeSections(pres.sections).filter((s) => s.enabled);
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, pres.lastSectionIndex), Math.max(0, sections.length - 1)),
  );
  // Preview from the builder opens in presenter view (setup prompts visible);
  // a live "Start" opens clean in client view.
  const [clientView, setClientView] = useState(!startInPresenterView);
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const touchX = useRef<number | null>(null);

  const discovery = pres.discoveryId ? loadDiscoveries().find((d) => d.id === pres.discoveryId) ?? null : null;
  const workflow = pres.workflowId ? loadWorkflows().find((w) => w.id === pres.workflowId) ?? null : null;
  const estimate = pres.estimateId ? loadEstimates().find((e) => e.id === pres.estimateId) ?? null : null;
  const roi = pres.roiId ? roiRepo.loadAll().find((r) => r.id === pres.roiId) ?? null : null;
  const scope = pres.scopeId ? scopeRepo.loadAll().find((s) => s.id === pres.scopeId) ?? null : null;
  const roadmap = pres.roadmapId ? roadmapRepo.loadAll().find((r) => r.id === pres.roadmapId) ?? null : null;
  const meeting = pres.meetingId ? meetingRepo.loadAll().find((m) => m.id === pres.meetingId) ?? null : null;
  const industry = getIndustry(pres.industryId);

  const go = (dir: -1 | 1) => setIndex((i) => Math.min(sections.length - 1, Math.max(0, i + dir)));

  // Hide an empty (or unwanted) section so it drops out of the presentation.
  const hideSection = (sectionId: PresentationSectionId) => {
    const updated = {
      ...pres,
      sections: pres.sections.map((s) => (s.id === sectionId ? { ...s, enabled: false } : s)),
      updatedAt: new Date().toISOString(),
    };
    setPres(updated);
    upsertPresentation(updated);
    // The list just shrank by one; keep the position in range.
    setIndex((i) => Math.max(0, Math.min(i, sections.length - 2)));
  };

  // Continue-from-here: remember the last section viewed.
  useEffect(() => {
    upsertPresentation({ ...pres, lastSectionIndex: index, updatedAt: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Keyboard arrows on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length]);

  const section = sections[index];
  const meta = section ? SECTION_META[section.id] : null;

  return (
    <div
      className="flex min-h-dvh flex-col bg-slate-100"
      style={pres.accentColor ? ({ "--app-accent": pres.accentColor, "--app-accent-soft": "#eef2f7" } as React.CSSProperties) : undefined}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        {pres.logo ? (
          <img src={pres.logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            {pres.businessName.slice(0, 1).toUpperCase() || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{pres.businessName}</p>
          <p className="truncate text-[11px] text-slate-400">
            Concept demonstration for {pres.businessName || "the client"}
            {industry ? ` · ${industry.name}` : ""}
          </p>
        </div>
        <button
          onClick={() => setClientView((v) => !v)}
          title={clientView ? "Switch to presenter view" : "Switch to client view"}
          className={`inline-flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-xs font-medium ${clientView ? "border border-slate-300 text-slate-600" : "bg-slate-900 text-white"}`}
        >
          {clientView ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{clientView ? "Client view" : "Presenter view"}</span>
        </button>
        {!clientView && (
          <button
            onClick={() => setNotesOpen((v) => !v)}
            aria-pressed={notesOpen}
            title="Presenter notes"
            className={`min-h-10 rounded-lg px-2.5 ${notesOpen ? "bg-amber-100 text-amber-800" : "border border-slate-300 text-slate-600"}`}
          >
            <StickyNote className="h-4 w-4" />
          </button>
        )}
        <button onClick={() => setConfirmExit(true)} aria-label="Exit presentation" className="min-h-10 rounded-lg border border-slate-300 px-2.5 text-slate-600 hover:bg-slate-50">
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Progress */}
      <div className="flex gap-1 bg-white px-4 pb-2">
        {sections.map((s, i) => (
          <button key={s.id} title={SECTION_META[s.id].title} onClick={() => setIndex(i)} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-accent" : "bg-slate-200"}`} />
        ))}
      </div>

      {/* Slide */}
      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6">
        {meta && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {index + 1} / {sections.length}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{meta.title}</h1>
            {!clientView && notesOpen && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="text-xs font-bold uppercase tracking-wide">Presenter notes</p>
                <p className="mt-1">{meta.presenterTip}</p>
                {pres.presenterNotes && <p className="mt-2 border-t border-amber-200 pt-2">{pres.presenterNotes}</p>}
              </div>
            )}
            <div className="mt-4">
              <Slide
                id={section.id}
                presentation={pres}
                discovery={discovery}
                workflow={workflow}
                estimate={estimate}
                roi={roi}
                scope={scope}
                roadmap={roadmap}
                meeting={meeting}
                clientView={clientView}
                onHide={hideSection}
              />
            </div>
          </>
        )}
      </main>

      {/* Nav controls */}
      <footer className="grid grid-cols-2 gap-3 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" /> Previous
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === sections.length - 1}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent text-base font-bold text-white hover:opacity-90 disabled:opacity-40"
        >
          Next <ChevronRight className="h-5 w-5" />
        </button>
      </footer>

      {confirmExit && (
        <ConfirmDialog
          title="Exit the presentation?"
          message="Your position is saved — you can continue from this section later."
          confirmLabel="Exit"
          destructive={false}
          onConfirm={() => navigate("/presentation-builder")}
          onCancel={() => setConfirmExit(false)}
        />
      )}
    </div>
  );
}

// ---------------- Slides ----------------

interface SlideProps {
  id: PresentationSectionId;
  presentation: SalesPresentation;
  discovery: ReturnType<typeof loadDiscoveries>[number] | null;
  workflow: ReturnType<typeof loadWorkflows>[number] | null;
  estimate: ReturnType<typeof loadEstimates>[number] | null;
  roi: ReturnType<typeof roiRepo.loadAll>[number] | null;
  scope: ReturnType<typeof scopeRepo.loadAll>[number] | null;
  roadmap: ReturnType<typeof roadmapRepo.loadAll>[number] | null;
  meeting: ReturnType<typeof meetingRepo.loadAll>[number] | null;
  clientView: boolean;
  onHide: (id: PresentationSectionId) => void;
}

function Slide({ id, presentation, discovery, workflow, estimate, roi, scope, roadmap, meeting, clientView, onHide }: SlideProps) {
  const industry = getIndustry(presentation.industryId);
  // An empty section renders a presenter-only prompt to set it up or hide it.
  const empty = (sectionId: PresentationSectionId) => (
    <EmptySection sectionId={sectionId} presentationId={presentation.id} clientView={clientView} onHide={onHide} />
  );

  switch (id) {
    case "business-value": {
      if (!roi) return empty(id);
      const linked = roi.pricingEstimateId ? loadEstimates().find((e) => e.id === roi.pricingEstimateId) ?? estimate : estimate;
      const r = calculateRoi(roi.inputs, linked);
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-lg font-bold text-accent">{pesoRange(r.monthlyValueTotal, "/mo")}</p>
              <p className="text-xs text-slate-500">Estimated monthly value</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-lg font-bold text-accent">{pesoRange(r.yearlyValueTotal, "/yr")}</p>
              <p className="text-xs text-slate-500">Estimated yearly value</p>
            </div>
          </div>
          {r.paybackMonths && (
            <Card>
              <p className="text-sm text-slate-700">
                Estimated payback: <strong>{r.paybackMonths.minimum}–{r.paybackMonths.maximum} months</strong>
              </p>
            </Card>
          )}
          {[...r.timeSavings, ...r.costSavings, ...r.revenueOpportunity].slice(0, 6).map((l) => (
            <div key={l.id} className="flex items-baseline justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm">
              <span className="text-slate-700">{l.label}</span>
              <span className="shrink-0 font-semibold text-slate-900">{pesoRange(l.range, "/mo")}</span>
            </div>
          ))}
          <p className="text-xs italic text-slate-400">{ROI_DISCLAIMER}</p>
        </div>
      );
    }

    case "preliminary-scope":
      if (!scope) return empty(id);
      return (
        <div className="space-y-3">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Included</p>
            <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
              {scope.included.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Not included</p>
            <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
              {scope.notIncluded.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Card>
          {!clientView && scope.openQuestions.length > 0 && (
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Open questions (presenter)</p>
              <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
                {scope.openQuestions.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
            </Card>
          )}
          <p className="text-xs italic text-slate-400">{SCOPE_DISCLAIMER}</p>
        </div>
      );

    case "client-acknowledgment":
      return (
        <Card>
          <p className="text-sm text-slate-700">
            To close today's discussion, we'd like to capture where things stand — for example:
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            <li>• This generally reflects our discussion.</li>
            <li>• Changes are still required.</li>
            <li>• We would like another demonstration or a technical assessment.</li>
            <li>• We would like a formal proposal.</li>
            <li>• We are not ready to proceed.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Record the answer on the <strong>Discussion Summary</strong> screen after the presentation.
          </p>
          <p className="mt-2 text-xs italic text-slate-400">
            This acknowledgment is not a contract, purchase order, formal acceptance, or commitment to buy.
          </p>
        </Card>
      );
    case "client-overview":
      return (
        <Card>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Info label="Business" value={presentation.businessName} />
            <Info label="Industry" value={industry?.name ?? "—"} />
            <Info label="Type" value={presentation.businessExample || "—"} />
            <Info label="Location" value={presentation.location || discovery?.business.location || "—"} />
            {discovery && (
              <>
                <Info label="Branches" value={String(discovery.business.branches)} />
                <Info label="Employees" value={discovery.business.employees || "—"} />
                <Info label="Years operating" value={discovery.business.yearsOperating || "—"} />
                <Info label="Timeline" value={discovery.business.implementationPeriod || "—"} />
              </>
            )}
          </dl>
          {presentation.meetingPurpose && (
            <p className="mt-4 rounded-xl bg-accent-soft/60 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">Today:</span> {presentation.meetingPurpose}
            </p>
          )}
        </Card>
      );

    case "current-challenges":
      if (!discovery) return empty(id);
      return (
        <Card>
          <ul className="space-y-3 text-sm text-slate-700">
            {discovery.operations.tools.length > 0 && (
              <li><span className="font-semibold">Today's tools:</span> {discovery.operations.tools.join(", ")}</li>
            )}
            {discovery.operations.manualProcesses && <li><span className="font-semibold">Manual work:</span> {discovery.operations.manualProcesses}</li>}
            {discovery.operations.slowReports && <li><span className="font-semibold">Slow reports:</span> {discovery.operations.slowReports}</li>}
            {discovery.operations.errorSpots && <li><span className="font-semibold">Where errors happen:</span> {discovery.operations.errorSpots}</li>}
            {discovery.operations.customerConcerns && <li><span className="font-semibold">Customers keep asking:</span> {discovery.operations.customerConcerns}</li>}
          </ul>
          {discovery.desiredOutcomes.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">What success looks like</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {discovery.desiredOutcomes.map((o) => (
                  <Pill key={o} tone="green">{o}</Pill>
                ))}
              </div>
            </div>
          )}
        </Card>
      );

    case "business-problems": {
      if (!discovery || discovery.problems.length === 0) return empty(id);
      const tone = { minor: "gray", moderate: "blue", major: "amber", critical: "red" } as const;
      return (
        <div className="space-y-2">
          {discovery.problems.map((p) => {
            const cat = getProblem(p.problemId);
            return (
              <Card key={p.problemId}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{cat?.title ?? p.customTitle}</p>
                  <div className="flex shrink-0 gap-1">
                    <Pill tone={tone[p.severity]}>{p.severity}</Pill>
                    {!clientView && p.verification === "assumed" && <Pill tone="amber">assumed</Pill>}
                  </div>
                </div>
                {cat && <p className="mt-1 text-xs text-slate-500">{cat.description}</p>}
                {p.note && <p className="mt-1 text-xs italic text-slate-500">"{p.note}"</p>}
              </Card>
            );
          })}
        </div>
      );
    }

    case "current-workflow":
      if (!workflow) return empty(id);
      return (
        <div className="space-y-1.5">
          {workflow.current.map((s, i) => (
            <Card key={s.id}>
              <p className="text-sm font-medium text-slate-900">
                <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
                {s.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {[s.responsible, s.tool, `~${s.estimatedMinutes + s.delayMinutes} min`].filter(Boolean).join(" · ")}
              </p>
              {s.flags.bottleneck && <Pill tone="red">Bottleneck</Pill>}
            </Card>
          ))}
          <p className="pt-2 text-xs italic text-slate-400">
            Time figures are estimates based on the values discussed with the client.
          </p>
        </div>
      );

    case "proposed-workflow":
      if (!workflow) return empty(id);
      return (
        <div className="space-y-1.5">
          {workflow.proposed.map((s, i) => (
            <div key={s.id} className="rounded-2xl border border-accent/40 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">
                  <span className="mr-1.5 text-xs text-slate-400">{i + 1}.</span>
                  {s.title}
                </p>
                {s.automated && <Pill tone="green">Automated</Pill>}
              </div>
              {s.expectedResult && <p className="mt-0.5 text-xs text-slate-500">→ {s.expectedResult}</p>}
              {s.notification && <p className="text-xs text-emerald-700">🔔 {s.notification}</p>}
            </div>
          ))}
        </div>
      );

    case "recommended-solution": {
      const recs = discovery?.recommendationSet?.recommendations.filter(
        (r) => r.decision === "accepted" || (r.tier === "recommended" && r.decision === "pending"),
      );
      if (!recs || recs.length === 0) return empty(id);
      return (
        <div className="space-y-2">
          {recs.map((r) => {
            const svc = getService(r.serviceOfferId);
            if (!svc) return null;
            return (
              <Card key={r.serviceOfferId}>
                <p className="text-sm font-semibold text-slate-900">{svc.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{svc.description}</p>
                {r.addressesProblems.length > 0 && (
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="font-semibold">Addresses:</span> {r.addressesProblems.join(", ")}
                  </p>
                )}
              </Card>
            );
          })}
          <p className="pt-1 text-xs italic text-slate-400">
            Recommended based on the client's selected problems and business profile — final scope follows discovery.
          </p>
        </div>
      );
    }

    case "interactive-demo":
      if (presentation.demoServiceIds.length === 0) return empty(id);
      return (
        <div className="space-y-2">
          {presentation.demoServiceIds.map((id) => {
            const svc = getService(id);
            if (!svc) return null;
            return (
              <a
                key={id}
                href={`#/demo/${id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-accent"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{svc.name}</span>
                  <span className="text-xs text-slate-500">{svc.description}</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-accent" />
              </a>
            );
          })}
          <p className="pt-1 text-xs text-slate-400">
            Demos open in a new tab, so this presentation keeps its place.
          </p>
        </div>
      );

    case "role-views":
      return <RoleViewsSlide industryId={presentation.industryId} />;

    case "package-comparison": {
      if (!estimate) return empty(id);
      const rules = loadPricingRules();
      const settings = loadPricingSettings();
      return (
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            {estimate.packages.map((pkg) => {
              const r = calculateEstimate(inputForPackage(estimate.input, pkg), rules, settings);
              return (
                <div key={pkg.id} className={`rounded-2xl border bg-white p-4 text-center shadow-sm ${pkg.recommended ? "border-accent ring-1 ring-accent/30" : "border-slate-200"}`}>
                  <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
                  {pkg.recommended && <p className="text-[11px] font-medium text-accent">Recommended</p>}
                  <p className="mt-2 text-sm font-semibold">{pesoRange(r.oneTimeTotal)}</p>
                  <p className="text-[11px] text-slate-500">one-time</p>
                  <p className="mt-1 text-sm font-semibold">{pesoRange(r.recurringTotal)}</p>
                  <p className="text-[11px] text-slate-500">per month</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs italic text-slate-400">{CLIENT_DISCLAIMER}</p>
        </div>
      );
    }

    case "preliminary-pricing":
      if (!estimate) return empty(id);
      return (
        <div className="space-y-4">
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">One-time implementation</h3>
            <LineTable lines={estimate.result.oneTimeLines} subtotal={estimate.result.oneTimeSubtotal} tax={estimate.result.oneTimeTax} total={estimate.result.oneTimeTotal} />
          </Card>
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Monthly</h3>
            <LineTable lines={estimate.result.recurringLines} subtotal={estimate.result.recurringSubtotal} tax={estimate.result.recurringTax} total={estimate.result.recurringTotal} suffix="/mo" />
          </Card>
          <p className="text-xs italic text-slate-400">{CLIENT_DISCLAIMER}</p>
        </div>
      );

    case "implementation-process":
      if (roadmap) {
        return (
          <Card>
            <ol className="space-y-2 text-sm text-slate-700">
              {roadmap.stages.map((s, i) => (
                <li key={s.id} className="flex items-start gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.milestone ? "bg-amber-100 text-amber-700" : "bg-accent-soft text-accent"}`}>
                    {i + 1}
                  </span>
                  <span className="pt-0.5">
                    {s.title}
                    <span className="ml-1.5 text-xs text-slate-400">({s.durationRange}{s.clientDependency ? " · needs client" : ""})</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs italic text-slate-400">{ROADMAP_DISCLAIMER}</p>
          </Card>
        );
      }
      return (
        <Card>
          <Pill tone="gray">Outline — placeholder (build one in the Roadmap tool)</Pill>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            {["Discovery & requirements confirmation", "Configuration & build", "Data setup & review", "Training", "Go-live with support", "Ongoing support & improvements"].map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs italic text-slate-400">{ROADMAP_DISCLAIMER}</p>
        </Card>
      );

    case "questions":
      return (
        <Card>
          <p className="text-lg font-semibold text-slate-900">What questions do you have?</p>
          <p className="mt-2 text-sm text-slate-500">
            Anything unclear about the workflow, the modules, or how your team would use this day-to-day?
          </p>
        </Card>
      );

    case "next-steps": {
      const rec = recommendNextStep(discovery, meeting, estimate);
      return (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended next step</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{rec.label}</p>
          {!clientView && <p className="mt-1 text-xs text-slate-500">{rec.reason}</p>}
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Who: {rec.requiredAttendees}</li>
            <li>• Preparation: {rec.requiredPreparation}</li>
            <li>• Outcome: {rec.suggestedOutput}</li>
          </ul>
          <p className="mt-3 text-xs italic text-slate-400">
            A suggestion to agree on together — nothing here is binding or scheduled automatically.
          </p>
        </Card>
      );
    }
  }
}

function RoleViewsSlide({ industryId }: { industryId: string }) {
  const roles = getRolesForIndustry(industryId || undefined);
  const [selected, setSelected] = useState<RoleView>(roles[0]);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {roles.map((r) => (
          <button
            key={r.id + r.name}
            onClick={() => setSelected(r)}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium ${selected.id === r.id ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {r.name}
          </button>
        ))}
      </div>
      <Card>
        <p className="text-sm font-semibold text-slate-900">{selected.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{selected.description}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RoleBlock title="Dashboard cards" items={selected.dashboardCards} />
          <RoleBlock title="Menu items" items={selected.menuItems} />
          <RoleBlock title="Allowed actions" items={selected.allowedActions} />
          <RoleBlock title="Notifications" items={selected.notifications} />
        </div>
        <p className="mt-3 text-xs text-slate-600">
          <span className="font-semibold">Sees:</span> {selected.visibleRecords}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          <span className="font-semibold">Primary workflow:</span> {selected.primaryWorkflow}
        </p>
        <p className="mt-3 text-xs italic text-slate-400">
          Conceptual demo behavior — not production-grade access control.
        </p>
      </Card>
    </div>
  );
}

function RoleBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
        {items.map((x) => (
          <li key={x}>• {x}</li>
        ))}
      </ul>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{children}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value || "—"}</dd>
    </div>
  );
}

/**
 * Per-section guidance for empty slides: what to add, and which Presentation
 * Builder field to jump to (`focus` matches the anchor keys in the builder).
 */
const SECTION_SETUP: Partial<Record<PresentationSectionId, { focus: string; guide: string }>> = {
  "interactive-demo": {
    focus: "demos",
    guide: "Choose which demo modules to feature under 'Demos to feature'.",
  },
  "business-value": {
    focus: "roi",
    guide: "Show projected savings. Build an ROI estimate in the ROI & Business Value tool, then attach it under 'ROI / business-value estimate'.",
  },
  "preliminary-scope": {
    focus: "scope",
    guide: "List what's included. Build a preliminary scope in the Scope Builder, then attach it under 'Preliminary scope'.",
  },
  "current-challenges": {
    focus: "discovery",
    guide: "Pull in the client's current challenges by linking their discovery record under 'Discovery record'.",
  },
  "business-problems": {
    focus: "discovery",
    guide: "Show the client's problems. Rate them in the Problem Scanner (saved to the discovery), then link that discovery under 'Discovery record'.",
  },
  "current-workflow": {
    focus: "workflow",
    guide: "Show today's workflow. Build one in Workflow Comparison, then attach it under 'Workflow comparison'.",
  },
  "proposed-workflow": {
    focus: "workflow",
    guide: "Show the improved workflow. Build one in Workflow Comparison, then attach it under 'Workflow comparison'.",
  },
  "recommended-solution": {
    focus: "discovery",
    guide: "Show recommended modules. Accept recommendations on the Recommendations screen, then link that discovery under 'Discovery record'.",
  },
  "package-comparison": {
    focus: "estimate",
    guide: "Show package pricing. Build a pricing estimate in the Pricing Configurator, then attach it under 'Pricing estimate'.",
  },
  "preliminary-pricing": {
    focus: "estimate",
    guide: "Show the price breakdown. Build a pricing estimate in the Pricing Configurator, then attach it under 'Pricing estimate'.",
  },
};

/**
 * Placeholder shown for a section with no content. In client view it stays
 * quiet; in presenter view it guides the presenter to fill the section in
 * (jumping to the right Builder field) or hide it so the client never sees it.
 */
function EmptySection({
  sectionId,
  presentationId,
  clientView,
  onHide,
}: {
  sectionId: PresentationSectionId;
  presentationId: string;
  clientView: boolean;
  onHide: (id: PresentationSectionId) => void;
}) {
  const navigate = useNavigate();
  const setup = SECTION_SETUP[sectionId];

  if (clientView || !setup) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <p className="text-sm text-slate-400">Details to follow.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="text-sm font-medium text-slate-600">This section isn't set up yet</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">{setup.guide}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => navigate(`/presentation-builder?id=${presentationId}&focus=${setup.focus}`)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Set up this section
        </button>
        <button
          onClick={() => onHide(sectionId)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <EyeOff className="h-3.5 w-3.5" /> Hide this section
        </button>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Only you see this — your client never sees setup controls.</p>
    </div>
  );
}
