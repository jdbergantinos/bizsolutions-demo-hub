import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileCheck2, RotateCcw } from "lucide-react";
import { useToast } from "../../store/ToastContext";
import { Pill } from "../../components/common/Badge";
import type { ApprovalScenarioDef, ApprovalShowcaseState } from "../types";
import { APPROVAL_DISCLAIMER, APPROVAL_SCENARIOS } from "../config/approvalScenarios";
import { approvalStateRepo } from "../store/toolkitStorage";

function freshState(id: string): ApprovalShowcaseState {
  return { schemaVersion: 1, id, currentLevel: 0, decisions: [], status: "pending", updatedAt: new Date().toISOString() };
}

export function ApprovalShowcasePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [states, setStates] = useState<ApprovalShowcaseState[]>(approvalStateRepo.loadAll);
  const [comment, setComment] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const stateFor = (id: string) => states.find((s) => s.id === id) ?? freshState(id);

  const decide = (scenario: ApprovalScenarioDef, decision: "approved" | "rejected") => {
    const st = stateFor(scenario.id);
    if (st.status !== "pending") return;
    const decisions = [...st.decisions, { level: st.currentLevel, decision, comment: comment.trim(), at: new Date().toISOString() }];
    const isLast = st.currentLevel >= scenario.levels.length - 1;
    const next: ApprovalShowcaseState = {
      ...st,
      decisions,
      currentLevel: decision === "approved" && !isLast ? st.currentLevel + 1 : st.currentLevel,
      status: decision === "rejected" ? "rejected" : isLast ? "approved" : "pending",
      updatedAt: new Date().toISOString(),
    };
    setStates(approvalStateRepo.upsert(next));
    setComment("");
    toast(
      decision === "rejected"
        ? "Request rejected — reason recorded."
        : next.status === "approved"
          ? "Fully approved through every level."
          : `Approved at this level — escalated to ${scenario.levels[next.currentLevel].label}.`,
    );
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/discovery")} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Discovery
      </button>
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileCheck2 className="h-5 w-5 text-accent" /> Approval Workflow Showcase
        </h1>
        <p className="text-sm text-slate-500">{APPROVAL_DISCLAIMER}</p>
      </header>

      <div className="space-y-2">
        {APPROVAL_SCENARIOS.map((sc) => {
          const st = stateFor(sc.id);
          const open = openId === sc.id;
          return (
            <div key={sc.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${open ? "border-accent" : "border-slate-200"}`}>
              <button onClick={() => setOpenId(open ? null : sc.id)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{sc.name}</p>
                  <Pill tone={st.status === "approved" ? "green" : st.status === "rejected" ? "red" : "amber"}>
                    {st.status === "pending" ? `Pending — ${sc.levels[st.currentLevel].label}` : st.status}
                  </Pill>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {sc.subject} · Requested by {sc.requester}
                  {sc.amountNote ? ` · ${sc.amountNote}` : ""}
                </p>
              </button>

              {open && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  {/* Level chain */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {sc.levels.map((l, i) => {
                      const d = st.decisions.find((x) => x.level === i);
                      return (
                        <span key={i} className="flex items-center gap-1.5">
                          {i > 0 && <span className="text-slate-300">→</span>}
                          <Pill tone={d ? (d.decision === "approved" ? "green" : "red") : i === st.currentLevel && st.status === "pending" ? "amber" : "gray"}>
                            L{i + 1}: {l.label}
                          </Pill>
                        </span>
                      );
                    })}
                    <Pill tone="gray">Escalation: placeholder</Pill>
                  </div>

                  {/* Activity */}
                  {st.decisions.length > 0 && (
                    <ul className="space-y-1 text-xs text-slate-600">
                      {st.decisions.map((d, i) => (
                        <li key={i}>
                          • {sc.levels[d.level].label}: <strong>{d.decision}</strong>
                          {d.comment ? ` — "${d.comment}"` : ""} · {new Date(d.at).toLocaleTimeString()}
                        </li>
                      ))}
                    </ul>
                  )}

                  {st.status === "pending" ? (
                    <>
                      <input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Comment as ${sc.levels[st.currentLevel].label}…`}
                        className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => decide(sc, "approved")} className="min-h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
                          Approve
                        </button>
                        <button onClick={() => decide(sc, "rejected")} className="min-h-11 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700">
                          Reject
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setStates(approvalStateRepo.upsert(freshState(sc.id)));
                        toast("Approval scenario reset.");
                      }}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <RotateCcw className="h-4 w-4" /> Reset scenario
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs italic text-slate-400">{APPROVAL_DISCLAIMER}</p>
    </div>
  );
}
