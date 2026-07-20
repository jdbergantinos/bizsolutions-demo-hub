import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Eye, EyeOff, FileText, MonitorPlay, Printer, Save, Share2 } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { Pill } from "../../components/common/Badge";
import { loadEstimates } from "../../pricing/store/pricingStorage";
import {
  getActiveDiscovery, loadPresentations, upsertPresentation,
} from "../../discovery/store/discoveryStorage";
import {
  estimateForDiscovery, latestMeetingForDiscovery, roadmapForDiscovery,
  roiForDiscovery, scopeForDiscovery, workflowForDiscovery,
} from "../../discovery/engine/workspace";
import { calculateRoi } from "../engine/calculateRoi";
import { recommendNextStep } from "../engine/nextStep";
import { buildDiscussionSummary } from "../engine/summary";
import { ackRepo, summaryRepo } from "../store/valueStorage";
import type { AcknowledgmentChoice, ClientAcknowledgment } from "../types";
import { uid } from "../../utils/storage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

const ACK_CHOICES: { id: AcknowledgmentChoice; label: string }[] = [
  { id: "reflects-discussion", label: "This generally reflects our discussion." },
  { id: "changes-required", label: "Changes are still required." },
  { id: "another-demo", label: "We would like another demonstration." },
  { id: "technical-assessment", label: "We would like a technical assessment." },
  { id: "formal-proposal", label: "We would like a formal proposal." },
  { id: "not-ready", label: "We are not ready to proceed." },
];

const ACK_DISCLAIMER =
  "This acknowledgment is not a contract, purchase order, formal acceptance, or commitment to buy.";

export function SummaryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [clientView, setClientView] = useState(true);

  const sources = useMemo(() => {
    // All records resolve to the ACTIVE client only — never "the first record",
    // so the summary can no longer mix one client's problems with another's pricing.
    const discovery = getActiveDiscovery();
    const estimate = estimateForDiscovery(discovery);
    const roi = roiForDiscovery(discovery);
    const meeting = latestMeetingForDiscovery(discovery);
    const workflow = workflowForDiscovery(discovery);
    return {
      discovery,
      workflow,
      estimate,
      roiResult: roi ? calculateRoi(roi.inputs, roi.pricingEstimateId ? loadEstimates().find((e) => e.id === roi.pricingEstimateId) : estimate) : null,
      scope: scopeForDiscovery(discovery),
      roadmap: roadmapForDiscovery(discovery),
      meeting,
      nextStep: recommendNextStep(discovery, meeting, estimate),
    };
  }, []);

  const text = useMemo(() => buildDiscussionSummary(sources, clientView), [sources, clientView]);

  // Acknowledgment form
  const [ackChoice, setAckChoice] = useState<AcknowledgmentChoice | "">("");
  const [ackName, setAckName] = useState("");
  const [ackRole, setAckRole] = useState("");
  const [ackComments, setAckComments] = useState("");
  const existingAcks = ackRepo.loadAll().filter((a) => !sources.discovery || a.discoveryId === sources.discovery.id);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Summary copied.");
    } catch {
      toast("Clipboard blocked by the browser.", "info");
    }
  };

  const shareText = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Client discussion summary", text });
      } catch {
        // cancelled
      }
    } else {
      toast("Sharing not supported here — use Copy instead.", "info");
    }
  };

  const saveSummary = () => {
    summaryRepo.upsert({
      schemaVersion: 1,
      id: uid(),
      title: `Summary — ${sources.discovery?.business.businessName ?? "client"} (${new Date().toISOString().slice(0, 10)})`,
      discoveryId: sources.discovery?.id,
      clientView,
      text,
      createdAt: new Date().toISOString(),
    });
    toast("Summary saved on this device.");
  };

  const addToPresentation = () => {
    const p = loadPresentations()[0];
    if (!p) {
      toast("No presentation exists yet — create one in the Presentation Builder first.", "info");
      return;
    }
    upsertPresentation({
      ...p,
      roiId: roiForDiscovery(sources.discovery)?.id ?? p.roiId,
      scopeId: sources.scope?.id ?? p.scopeId,
      roadmapId: sources.roadmap?.id ?? p.roadmapId,
      meetingId: sources.meeting?.id ?? p.meetingId,
      updatedAt: new Date().toISOString(),
    });
    toast(`Summary content linked into "${p.title}".`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Discovery
        </button>
        <button
          onClick={() => setClientView((v) => !v)}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${clientView ? "border border-slate-300 text-slate-600" : "bg-slate-900 text-white"}`}
        >
          {clientView ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {clientView ? "Client view" : "Internal view"}
        </button>
      </div>

      <header className="print:hidden">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileText className="h-5 w-5 text-accent" /> Client Discussion Summary
        </h1>
        <p className="text-sm text-slate-500">
          Assembled from the active discovery, workflow, ROI, pricing, scope, roadmap, and latest meeting.
        </p>
      </header>

      <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-700 shadow-sm">
        {text}
      </pre>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 print:hidden">
        <Btn onClick={copyText}><Copy className="h-4 w-4" /> Copy</Btn>
        <Btn onClick={shareText}><Share2 className="h-4 w-4" /> Share</Btn>
        <Btn onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Btn>
        <Btn onClick={saveSummary}><Save className="h-4 w-4" /> Save</Btn>
        <Btn onClick={addToPresentation}><MonitorPlay className="h-4 w-4" /> To presentation</Btn>
      </div>

      {/* Client acknowledgment */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <h2 className="text-sm font-semibold text-slate-900">Client acknowledgment (noncontractual)</h2>
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{ACK_DISCLAIMER}</p>

        {existingAcks.length > 0 && (
          <ul className="mt-2 space-y-1">
            {existingAcks.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <Pill tone="blue">{ACK_CHOICES.find((c) => c.id === a.choice)?.label ?? a.choice}</Pill>
                {a.representativeName} ({a.representativeRole || "—"}) · {a.date}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 space-y-2">
          {ACK_CHOICES.map((c) => (
            <label key={c.id} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${ackChoice === c.id ? "border-accent bg-accent-soft/50" : "border-slate-200 hover:bg-slate-50"}`}>
              <input type="radio" name="ack" checked={ackChoice === c.id} onChange={() => setAckChoice(c.id)} className="h-4 w-4 accent-[var(--app-accent)]" />
              {c.label}
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <L label="Client representative name">
              <input value={ackName} onChange={(e) => setAckName(e.target.value)} placeholder="e.g. Maria Santos" className={inputCls} />
            </L>
            <L label="Role">
              <input value={ackRole} onChange={(e) => setAckRole(e.target.value)} placeholder="e.g. Owner" className={inputCls} />
            </L>
          </div>
          <L label="Comments">
            <textarea value={ackComments} onChange={(e) => setAckComments(e.target.value)} rows={2} placeholder="e.g. Please show the staff screens to the team next visit" className={`${inputCls} py-2`} />
          </L>
          <button
            onClick={() => {
              if (!ackChoice || !ackName.trim()) {
                toast("Choose an option and enter the representative's name.", "info");
                return;
              }
              const ack: ClientAcknowledgment = {
                schemaVersion: 1,
                id: uid(),
                discoveryId: sources.discovery?.id,
                meetingId: sources.meeting?.id,
                choice: ackChoice,
                representativeName: ackName.trim(),
                representativeRole: ackRole.trim(),
                date: new Date().toISOString().slice(0, 10),
                comments: ackComments.trim(),
                createdAt: new Date().toISOString(),
              };
              ackRepo.upsert(ack);
              setAckChoice("");
              setAckName("");
              setAckRole("");
              setAckComments("");
              toast("Acknowledgment recorded on this device.");
            }}
            className="min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            Record acknowledgment
          </button>
          <p className="text-[11px] text-slate-400">
            Stored locally only. This is not a legally binding electronic signature.
          </p>
        </div>
      </section>
    </div>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50">
      {children}
    </button>
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
