import { useState } from "react";
import { History, Plus, StickyNote, Trash2, UserRound } from "lucide-react";
import type { DemoRecord, ScenarioConfig } from "../../types";
import { pesos } from "../../data/mock/ph";
import { Modal } from "../common/Modal";
import { StatusBadge } from "../common/Badge";
import { lineTotal, statusOf } from "../../demos/engineUtils";

/**
 * Detail view shared by all record engines: field values, status changes,
 * assignment, line items (when the scenario has a catalog), notes, activity.
 */
export function RecordDetail({
  config,
  record,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onAssign,
  onAddNote,
  onLineItemsChange,
}: {
  config: ScenarioConfig;
  record: DemoRecord;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (statusId: string) => void;
  onAssign: (assignee: string) => void;
  onAddNote: (text: string) => void;
  onLineItemsChange: (items: NonNullable<DemoRecord["lineItems"]>) => void;
}) {
  const [note, setNote] = useState("");
  const [catalogPick, setCatalogPick] = useState("");
  const status = statusOf(config, record);
  const hasCatalog = Boolean(config.catalog?.length);
  const items = record.lineItems ?? [];

  const name = String(record.values[config.nameField] ?? config.recordName);

  return (
    <Modal title={name} onClose={onClose} wide>
      <div className="space-y-5">
        {/* Status + actions */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {record.assignee && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              <UserRound className="h-3 w-3" /> {record.assignee}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onEdit}
              className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Change status */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Move to status
          </p>
          <div className="flex flex-wrap gap-2">
            {config.statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => onStatusChange(s.id)}
                disabled={s.id === record.status}
                className={`min-h-10 rounded-lg px-3 text-xs font-medium transition ${
                  s.id === record.status
                    ? "cursor-default bg-accent text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignment */}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Assigned {config.assigneeLabel.toLowerCase()}
          </span>
          <select
            value={record.assignee ?? ""}
            onChange={(e) => onAssign(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">Unassigned</option>
            {config.assigneeOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        {/* Field values */}
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          {config.fields.map((f) => (
            <div key={f.key}>
              <dt className="text-xs text-slate-400">{f.label}</dt>
              <dd className="text-sm text-slate-800">
                {f.type === "currency" && record.values[f.key] !== ""
                  ? pesos(Number(record.values[f.key]))
                  : String(record.values[f.key] || "—")}
              </dd>
            </div>
          ))}
        </dl>

        {/* Line items */}
        {hasCatalog && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Line items
            </p>
            {items.length === 0 && (
              <p className="mb-2 text-sm text-slate-400">No line items yet.</p>
            )}
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {items.map((li) => (
                <li key={li.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="flex-1">{li.name}</span>
                  <input
                    type="number"
                    min={1}
                    value={li.qty}
                    aria-label="Quantity"
                    onChange={(e) =>
                      onLineItemsChange(
                        items.map((x) =>
                          x.id === li.id ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x,
                        ),
                      )
                    }
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
                  />
                  <span className="w-24 text-right text-slate-600">{pesos(li.qty * li.price)}</span>
                  <button
                    aria-label="Remove line item"
                    onClick={() => onLineItemsChange(items.filter((x) => x.id !== li.id))}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <select
                value={catalogPick}
                onChange={(e) => setCatalogPick(e.target.value)}
                aria-label={`Add ${config.catalogLabel ?? "line item"}`}
                className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Add {config.catalogLabel?.toLowerCase() ?? "line item"}…</option>
                {config.catalog!.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} — {pesos(c.price)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const item = config.catalog!.find((c) => c.name === catalogPick);
                  if (!item) return;
                  onLineItemsChange([
                    ...items,
                    { id: `${Date.now()}`, name: item.name, qty: 1, price: item.price },
                  ]);
                  setCatalogPick("");
                }}
                disabled={!catalogPick}
                className="min-h-11 rounded-xl bg-accent px-3 text-white disabled:opacity-40"
                aria-label="Add line item"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-right text-sm font-semibold text-slate-900">
              Total: {pesos(lineTotal(record))}
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <StickyNote className="h-3.5 w-3.5" /> Notes
          </p>
          {record.notes.map((n) => (
            <div key={n.id} className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-slate-700">
              {n.text}
              <span className="mt-0.5 block text-[10px] text-slate-400">
                {new Date(n.at).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm"
            />
            <button
              onClick={() => {
                if (note.trim()) {
                  onAddNote(note.trim());
                  setNote("");
                }
              }}
              disabled={!note.trim()}
              className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <History className="h-3.5 w-3.5" /> Activity history
          </p>
          <ul className="space-y-1.5">
            {[...record.activity].reverse().map((a) => (
              <li key={a.id} className="flex items-baseline gap-2 text-sm text-slate-600">
                <span className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full bg-accent" />
                <span className="flex-1">{a.text}</span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  {new Date(a.at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
