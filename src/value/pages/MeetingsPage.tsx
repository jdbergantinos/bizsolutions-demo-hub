import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Copy, NotebookPen, Plus, Sparkles, Trash2 } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { Pill } from "../../components/common/Badge";
import { loadEstimates } from "../../pricing/store/pricingStorage";
import { getActiveDiscovery, loadDiscoveries } from "../../discovery/store/discoveryStorage";
import type { MeetingRecord, NextStepId, OpportunityStatus } from "../types";
import { NEXT_STEPS, recommendNextStep } from "../engine/nextStep";
import { meetingRepo, newMeeting } from "../store/valueStorage";

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm";

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  "new-lead": "New lead",
  qualified: "Qualified",
  "discovery-required": "Discovery required",
  "demo-completed": "Demo completed",
  "proposal-requested": "Proposal requested",
  "technical-review-required": "Technical review required",
  negotiation: "Negotiation",
  "on-hold": "On hold",
  won: "Won",
  lost: "Lost",
  "not-qualified": "Not qualified",
};

const MEETING_TYPES = ["First presentation", "Discovery meeting", "Demo session", "Follow-up", "Proposal review", "Negotiation", "Other"];

export function MeetingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [meetings, setMeetings] = useState<MeetingRecord[]>(meetingRepo.loadAll);
  const [editing, setEditing] = useState<MeetingRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MeetingRecord | null>(null);

  if (editing) {
    return (
      <MeetingEditor
        meeting={editing}
        onSaved={(m) => setMeetings(meetingRepo.upsert(m))}
        onExit={() => {
          setMeetings(meetingRepo.loadAll());
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <NotebookPen className="h-5 w-5 text-accent" /> Meetings & Next Steps
        </h1>
        <p className="text-sm text-slate-500">Meeting records, decisions, opportunity status, and the recommended next move.</p>
      </header>

      <button
        onClick={() => {
          const d = getActiveDiscovery();
          setEditing(newMeeting({ clientName: d?.business.businessName ?? "", discoveryId: d?.id }));
        }}
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-bold text-white hover:opacity-90"
      >
        <Plus className="h-5 w-5" /> New meeting record
      </button>

      {meetings.length === 0 ? (
        <EmptyState icon="NotebookPen" title="No meetings recorded" message="Record each client meeting so decisions, concerns, and next steps never get lost." />
      ) : (
        <ul className="space-y-2">
          {meetings
            .slice()
            .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
            .map((m) => (
              <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{m.clientName || "Unnamed client"}</p>
                  <Pill tone={m.status === "won" ? "green" : m.status === "lost" || m.status === "not-qualified" ? "red" : "blue"}>
                    {STATUS_LABELS[m.status]}
                  </Pill>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {m.meetingDate} · {m.meetingType}
                  {m.followUpDate ? ` · Follow-up: ${m.followUpDate}` : ""}
                </p>
                {m.nextAction && <p className="mt-1 text-xs text-slate-600">Next: {m.nextAction}</p>}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setEditing(m)} className="min-h-10 rounded-lg bg-accent px-3 text-xs font-semibold text-white hover:opacity-90">
                    Open
                  </button>
                  <button
                    onClick={() => {
                      const f = newMeeting({
                        clientName: m.clientName,
                        discoveryId: m.discoveryId,
                        pricingEstimateId: m.pricingEstimateId,
                        meetingType: "Follow-up",
                        status: m.status,
                        meetingDate: m.followUpDate || new Date().toISOString().slice(0, 10),
                      });
                      setEditing(f);
                      toast("Follow-up meeting created from this record.");
                    }}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" /> Follow-up
                  </button>
                  <button onClick={() => setConfirmDelete(m)} className="ml-auto min-h-10 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this meeting record?"
          message={`The record for "${confirmDelete.clientName || "Unnamed client"}" on ${confirmDelete.meetingDate} will be removed.`}
          confirmLabel="Delete"
          onConfirm={() => {
            setMeetings(meetingRepo.remove(confirmDelete.id));
            setConfirmDelete(null);
            toast("Meeting deleted.");
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function MeetingEditor({ meeting, onSaved, onExit }: { meeting: MeetingRecord; onSaved: (m: MeetingRecord) => void; onExit: () => void }) {
  const toast = useToast();
  const [m, setM] = useState(meeting);
  const set = (patch: Partial<MeetingRecord>) => setM((x) => ({ ...x, ...patch }));
  const [override, setOverride] = useState<NextStepId | "">("");

  useEffect(() => {
    const t = setTimeout(() => onSaved({ ...m, updatedAt: new Date().toISOString() }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m]);

  const discovery = loadDiscoveries().find((d) => d.id === m.discoveryId) ?? getActiveDiscovery();
  const estimate = loadEstimates().find((e) => e.id === m.pricingEstimateId) ?? loadEstimates().filter((e) => !e.archived)[0] ?? null;
  const rec = recommendNextStep(discovery ?? null, m, estimate);
  const effectiveStep = override || rec.stepId;

  const copySummary = async () => {
    const text = [
      `MEETING SUMMARY — ${m.clientName} (${m.meetingDate}, ${m.meetingType})`,
      `Status: ${STATUS_LABELS[m.status]} · Decision-makers present: ${m.decisionMakersPresent ? "yes" : "no"}`,
      m.attendees && `Attendees: ${m.attendees}`,
      m.topicsDiscussed && `Topics: ${m.topicsDiscussed}`,
      m.confirmedProblems && `Confirmed problems: ${m.confirmedProblems}`,
      m.requestedModules && `Requested modules: ${m.requestedModules}`,
      m.clientConcerns && `Concerns: ${m.clientConcerns}`,
      m.decisionsMade && `Decisions: ${m.decisionsMade}`,
      m.itemsNotApproved && `Not approved: ${m.itemsNotApproved}`,
      m.followUpQuestions && `Follow-up questions: ${m.followUpQuestions}`,
      `Next step: ${NEXT_STEPS[effectiveStep].label}${override ? " (manual override)" : ""}`,
      m.followUpDate && `Follow-up date: ${m.followUpDate}`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(text.join("\n"));
      toast("Meeting summary copied.");
    } catch {
      toast("Clipboard blocked by the browser.", "info");
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onExit} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Meetings
      </button>
      <header className="flex items-start justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">Meeting Record</h1>
        <button onClick={copySummary} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Copy className="h-3.5 w-3.5" /> Copy summary
        </button>
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <L label="Client"><input value={m.clientName} onChange={(e) => set({ clientName: e.target.value })} placeholder="e.g. Bella Salon & Spa" className={inputCls} /></L>
          <L label="Meeting date"><input type="date" value={m.meetingDate} onChange={(e) => set({ meetingDate: e.target.value })} className={inputCls} /></L>
          <L label="Meeting type">
            <select value={m.meetingType} onChange={(e) => set({ meetingType: e.target.value })} className={inputCls}>
              {MEETING_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </L>
          <L label="Presenter"><input value={m.presenter} onChange={(e) => set({ presenter: e.target.value })} placeholder="e.g. John" className={inputCls} /></L>
        </div>
        <L label="Attendees"><input value={m.attendees} onChange={(e) => set({ attendees: e.target.value })} placeholder="e.g. Owner, branch manager, head cashier" className={inputCls} /></L>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700">
          <input type="checkbox" checked={m.decisionMakersPresent} onChange={(e) => set({ decisionMakersPresent: e.target.checked })} className="h-4 w-4 accent-[var(--app-accent)]" />
          Decision-makers were present
        </label>
        <TA label="Topics discussed" value={m.topicsDiscussed} onChange={(v) => set({ topicsDiscussed: v })} />
        <TA label="Confirmed problems" value={m.confirmedProblems} onChange={(v) => set({ confirmedProblems: v })} />
        <TA label="Requested modules" value={m.requestedModules} onChange={(v) => set({ requestedModules: v })} />
        <TA label="Requested changes" value={m.requestedChanges} onChange={(v) => set({ requestedChanges: v })} />
        <TA label="Client concerns" value={m.clientConcerns} onChange={(v) => set({ clientConcerns: v })} />
        <TA label="Budget discussion" value={m.budgetDiscussion} onChange={(v) => set({ budgetDiscussion: v })} />
        <TA label="Questions requiring follow-up" value={m.followUpQuestions} onChange={(v) => set({ followUpQuestions: v })} />
        <TA label="Technical issues requiring verification" value={m.technicalIssues} onChange={(v) => set({ technicalIssues: v })} />
        <TA label="Decisions made" value={m.decisionsMade} onChange={(v) => set({ decisionsMade: v })} />
        <TA label="Items not approved" value={m.itemsNotApproved} onChange={(v) => set({ itemsNotApproved: v })} />
        <div className="grid grid-cols-2 gap-3">
          <L label="Next action"><input value={m.nextAction} onChange={(e) => set({ nextAction: e.target.value })} placeholder="e.g. Send preliminary estimate by Friday" className={inputCls} /></L>
          <L label="Follow-up date"><input type="date" value={m.followUpDate} onChange={(e) => set({ followUpDate: e.target.value })} className={inputCls} /></L>
        </div>
        <L label="Opportunity status">
          <select value={m.status} onChange={(e) => set({ status: e.target.value as OpportunityStatus })} className={inputCls}>
            {Object.entries(STATUS_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </L>
      </section>

      {/* Next-step generator */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Sparkles className="h-4 w-4 text-accent" /> Recommended next step
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Rules-based suggestion from the meeting, discovery, and estimate. Nothing is sent or scheduled automatically.
        </p>
        <div className="mt-3 rounded-xl bg-accent-soft/60 p-3">
          <p className="text-sm font-bold text-slate-900">{NEXT_STEPS[effectiveStep].label}{override && " (manual override)"}</p>
          {!override && <p className="mt-1 text-xs text-slate-600">{rec.reason}</p>}
          <dl className="mt-2 space-y-1 text-xs text-slate-600">
            <D k="Required attendees" v={NEXT_STEPS[effectiveStep].attendees} />
            <D k="Preparation" v={NEXT_STEPS[effectiveStep].preparation} />
            {!override && <D k="Information still needed" v={rec.informationNeeded} />}
            <D k="Suggested output" v={NEXT_STEPS[effectiveStep].output} />
          </dl>
        </div>
        <L label="Manual override">
          <select value={override} onChange={(e) => setOverride(e.target.value as NextStepId | "")} className={`${inputCls} mt-1`}>
            <option value="">— Use the recommendation —</option>
            {Object.entries(NEXT_STEPS).map(([id, s]) => (
              <option key={id} value={id}>{s.label}</option>
            ))}
          </select>
        </L>
        <button
          onClick={() => {
            set({ nextAction: NEXT_STEPS[effectiveStep].label });
            toast("Next step recorded as the meeting's next action.");
          }}
          className="mt-2 min-h-11 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:opacity-90"
        >
          Record as next action
        </button>
      </section>
    </div>
  );
}

const TA_SAMPLES: Record<string, string> = {
  "Topics discussed": "e.g. Booking flow, loyalty packages, pricing ranges",
  "Confirmed problems": "e.g. No-shows; no central client records",
  "Requested modules": "e.g. Booking, loyalty, branch dashboard",
  "Requested changes": "e.g. Tagalog labels on the staff screens",
  "Client concerns": "e.g. Staff might resist a new system",
  "Budget discussion": "e.g. Comfortable around ₱150k to start",
  "Questions requiring follow-up": "e.g. Can it print daily summaries?",
  "Technical issues requiring verification": "e.g. Old POS export format unknown",
  "Decisions made": "e.g. Proceed with a discovery workshop",
  "Items not approved": "e.g. Custom mobile app — parked for now",
};

function TA({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <L label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={TA_SAMPLES[label] ?? "e.g. Notes from the meeting"}
        className={`${inputCls} py-2`}
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

function D({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="inline font-semibold text-slate-500">{k}:</dt> <dd className="inline">{v}</dd>
    </div>
  );
}
