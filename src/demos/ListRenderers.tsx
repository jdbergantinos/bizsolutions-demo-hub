import { Minus, Plus, UserRound } from "lucide-react";
import type { DemoRecord, ScenarioConfig } from "../types";
import { pesos } from "../data/mock/ph";
import { StatusBadge } from "../components/common/Badge";
import { EmptyState } from "../components/common/EmptyState";
import { lineTotal, statusOf } from "./engineUtils";

interface ListProps {
  config: ScenarioConfig;
  records: DemoRecord[];
  onOpen: (r: DemoRecord) => void;
}

function cellValue(config: ScenarioConfig, r: DemoRecord, key: string): string {
  const field = config.fields.find((f) => f.key === key);
  const raw = r.values[key];
  if (field?.type === "currency" && raw !== "" && raw !== undefined) return pesos(Number(raw));
  return String(raw ?? "—") || "—";
}

const emptyProps = (config: ScenarioConfig) => ({
  title: `No ${config.recordNamePlural.toLowerCase()} found`,
  message: "Try clearing the search or filters, or create a new record with the button above.",
});

/** Card list (mobile) + table (desktop) used by records & line-item engines. */
export function RecordsList({ config, records, onOpen, showTotal }: ListProps & { showTotal?: boolean }) {
  if (records.length === 0) return <EmptyState {...emptyProps(config)} />;
  return (
    <>
      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {records.map((r) => (
          <li key={r.id}>
            <button
              onClick={() => onOpen(r)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm active:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">
                  {String(r.values[config.nameField] ?? "—")}
                </span>
                <StatusBadge status={statusOf(config, r)} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                {config.columns
                  .filter((c) => c.key !== config.nameField)
                  .slice(0, 3)
                  .map((c) => (
                    <span key={c.key}>
                      {c.label}: {cellValue(config, r, c.key)}
                    </span>
                  ))}
                {showTotal && <span className="font-medium text-slate-700">{pesos(lineTotal(r))}</span>}
                {r.assignee && (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3 w-3" /> {r.assignee}
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {config.columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
              ))}
              {showTotal && <th className="px-4 py-3 font-medium">Total</th>}
              <th className="px-4 py-3 font-medium">{config.assigneeLabel}</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id} onClick={() => onOpen(r)} className="cursor-pointer hover:bg-slate-50">
                {config.columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-slate-700">
                    {cellValue(config, r, c.key)}
                  </td>
                ))}
                {showTotal && <td className="px-4 py-3 font-medium">{pesos(lineTotal(r))}</td>}
                <td className="px-4 py-3 text-slate-500">{r.assignee ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={statusOf(config, r)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Kanban-style pipeline board for the CRM engine. */
export function PipelineBoard({ config, records, onOpen }: ListProps) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
      {config.statuses.map((s) => {
        const col = records.filter((r) => statusOf(config, r).id === s.id);
        return (
          <div key={s.id} className="w-60 shrink-0 rounded-xl bg-slate-50 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <StatusBadge status={s} />
              <span className="text-xs font-medium text-slate-400">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpen(r)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left shadow-sm active:bg-slate-50"
                >
                  <p className="truncate text-sm font-medium text-slate-900">
                    {String(r.values[config.nameField] ?? "—")}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {config.columns
                      .filter((c) => c.key !== config.nameField)
                      .slice(0, 2)
                      .map((c) => cellValue(config, r, c.key))
                      .join(" · ")}
                  </p>
                  {r.assignee && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      <UserRound className="h-3 w-3" /> {r.assignee}
                    </p>
                  )}
                </button>
              ))}
              {col.length === 0 && (
                <p className="px-1 py-3 text-center text-xs text-slate-400">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Day-grouped schedule list for the booking/scheduling engine. */
export function BookingList({ config, records, onOpen }: ListProps) {
  if (records.length === 0) return <EmptyState icon="CalendarCheck" {...emptyProps(config)} />;
  const dateKey = config.dateKey ?? "date";
  const groups = new Map<string, DemoRecord[]>();
  for (const r of records) {
    const d = String(r.values[dateKey] || "No date");
    groups.set(d, [...(groups.get(d) ?? []), r]);
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="space-y-4">
      {sorted.map(([date, list]) => (
        <div key={date}>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {date === "No date"
              ? "No date"
              : new Date(date + "T00:00:00").toLocaleDateString("en-PH", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
          </h3>
          <ul className="space-y-2">
            {list
              .sort((a, b) => String(a.values[config.timeKey ?? "time"] ?? "").localeCompare(String(b.values[config.timeKey ?? "time"] ?? "")))
              .map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => onOpen(r)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm active:bg-slate-50"
                  >
                    <span className="w-16 shrink-0 rounded-lg bg-accent-soft py-1.5 text-center text-xs font-semibold text-accent">
                      {String(r.values[config.timeKey ?? "time"] || "—")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {String(r.values[config.nameField] ?? "—")}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {config.columns
                          .filter((c) => ![config.nameField, dateKey, config.timeKey].includes(c.key))
                          .slice(0, 2)
                          .map((c) => cellValue(config, r, c.key))
                          .join(" · ")}
                        {r.assignee ? ` · ${r.assignee}` : ""}
                      </span>
                    </span>
                    <StatusBadge status={statusOf(config, r)} />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Stock table with quick +/- adjustments for the inventory engine. */
export function InventoryList({
  config,
  records,
  onOpen,
  onAdjust,
}: ListProps & { onAdjust: (r: DemoRecord, delta: number) => void }) {
  if (records.length === 0) return <EmptyState icon="Boxes" {...emptyProps(config)} />;
  const qtyKey = config.qtyKey ?? "qty";
  const low = records.filter((r) => statusOf(config, r).id !== "in-stock");
  return (
    <div className="space-y-3">
      {low.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{low.length}</strong> {low.length === 1 ? "item needs" : "items need"} replenishment:{" "}
          {low.map((r) => String(r.values[config.nameField])).join(", ")}
        </div>
      )}
      <ul className="space-y-2">
        {records.map((r) => {
          const st = statusOf(config, r);
          return (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <button onClick={() => onOpen(r)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {String(r.values[config.nameField] ?? "—")}
                  </span>
                  <StatusBadge status={st} />
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {config.columns
                    .filter((c) => ![config.nameField, qtyKey].includes(c.key))
                    .slice(0, 3)
                    .map((c) => `${c.label}: ${cellValue(config, r, c.key)}`)
                    .join(" · ")}
                </p>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  aria-label="Stock out (deduct 1)"
                  onClick={() => onAdjust(r, -1)}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  disabled={Number(r.values[qtyKey] ?? 0) <= 0}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-900">
                  {String(r.values[qtyKey] ?? 0)}
                </span>
                <button
                  aria-label="Stock in (add 1)"
                  onClick={() => onAdjust(r, 1)}
                  className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
