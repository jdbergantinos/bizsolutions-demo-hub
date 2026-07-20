import { useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import type { DemoRecord, ScenarioConfig } from "../types";
import { useDemoState } from "../hooks/useDemoState";
import { useToast } from "../store/ToastContext";
import { pesos } from "../data/mock/ph";
import { DemoDisclaimer } from "../components/common/DemoDisclaimer";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { SearchInput } from "../components/common/SearchInput";
import { RecordForm } from "../components/demo/RecordForm";
import { RecordDetail } from "../components/demo/RecordDetail";
import { filterAndSort, lineTotal, statusOf, type SortMode } from "./engineUtils";
import { BookingList, InventoryList, PipelineBoard, RecordsList } from "./ListRenderers";
import { DashboardEngine } from "./DashboardEngine";

/**
 * Shared demo host: one component drives all six engines. Engine-specific
 * rendering is delegated to the list renderers; create/edit/detail/status/
 * reset behavior is identical across modules.
 */
export function DemoHost({ config, cautions }: { config: ScenarioConfig; cautions?: string[] }) {
  const toast = useToast();
  const { records, createRecord, updateRecord, deleteRecord, addNote, resetScenario } =
    useDemoState(config);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DemoRecord | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DemoRecord | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const openRecord = records.find((r) => r.id === openId) ?? null;
  const visible = useMemo(
    () => filterAndSort(config, records, search, statusFilter, sort),
    [config, records, search, statusFilter, sort],
  );

  const isDashboard = config.engine === "dashboard";

  const summary = useMemo(() => {
    if (isDashboard) return [];
    if (config.engine === "inventory") {
      const low = records.filter((r) => statusOf(config, r).id === "low").length;
      const out = records.filter((r) => statusOf(config, r).id === "out").length;
      return [
        { label: `Total ${config.recordNamePlural.toLowerCase()}`, value: records.length },
        { label: "Low stock", value: low },
        { label: "Out of stock", value: out },
      ];
    }
    const cards = config.statuses.slice(0, 3).map((s) => ({
      label: s.label,
      value: records.filter((r) => statusOf(config, r).id === s.id).length,
    }));
    const extra =
      config.engine === "lineitems"
        ? [{ label: "Total value", value: pesos(records.reduce((sum, r) => sum + lineTotal(r), 0)) }]
        : [{ label: "Total", value: records.length }];
    return [...cards, ...extra];
  }, [config, records, isDashboard]);

  const handleStatusChange = (record: DemoRecord, statusId: string) => {
    const label = config.statuses.find((s) => s.id === statusId)?.label ?? statusId;
    updateRecord(record.id, { status: statusId }, `Status changed to ${label}.`);
    toast(config.notification);
    const tone = config.statuses.find((s) => s.id === statusId)?.tone;
    if (tone === "green") {
      toast(`Simulated notification: "${String(record.values[config.nameField])}" — ${label}.`, "info");
    }
  };

  return (
    <div className="space-y-4">
      {cautions && cautions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          {cautions.map((c) => (
            <p key={c}>⚠ {c}</p>
          ))}
        </div>
      )}

      {/* Summary cards */}
      {!isDashboard && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {summary.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="truncate text-[11px] text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      {!isDashboard && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${config.recordNamePlural.toLowerCase()}…`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm sm:flex-none"
            >
              <option value="">All statuses</option>
              {config.statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              aria-label="Sort"
              className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm sm:flex-none"
            >
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="status">By status</option>
            </select>
          </div>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between gap-2">
        {!isDashboard ? (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New {config.recordName.toLowerCase()}
          </button>
        ) : (
          <span className="text-xs text-slate-500">Figures are sample data for demonstration.</span>
        )}
        <button
          onClick={() => setConfirmReset(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" /> Reset demo
        </button>
      </div>

      {/* Engine body */}
      {config.engine === "dashboard" && <DashboardEngine config={config} />}
      {config.engine === "pipeline" && (
        <PipelineBoard config={config} records={visible} onOpen={(r) => setOpenId(r.id)} />
      )}
      {config.engine === "booking" && (
        <BookingList config={config} records={visible} onOpen={(r) => setOpenId(r.id)} />
      )}
      {config.engine === "inventory" && (
        <InventoryList
          config={config}
          records={visible}
          onOpen={(r) => setOpenId(r.id)}
          onAdjust={(r, delta) => {
            const qtyKey = config.qtyKey ?? "qty";
            const next = Math.max(0, Number(r.values[qtyKey] ?? 0) + delta);
            updateRecord(
              r.id,
              { values: { ...r.values, [qtyKey]: next } },
              `${delta > 0 ? "Stock in" : "Stock out"}: quantity now ${next}.`,
            );
            toast("Inventory record updated.");
          }}
        />
      )}
      {(config.engine === "records" || config.engine === "lineitems") && (
        <RecordsList
          config={config}
          records={visible}
          onOpen={(r) => setOpenId(r.id)}
          showTotal={config.engine === "lineitems"}
        />
      )}

      <p className="text-xs italic text-slate-400">{config.helpText}</p>
      <DemoDisclaimer />

      {/* Create */}
      {creating && (
        <RecordForm
          title={`New ${config.recordName}`}
          fields={config.fields}
          onSubmit={(values) => {
            createRecord(values, config.statuses[0].id);
            setCreating(false);
            toast(config.notification);
          }}
          onClose={() => setCreating(false)}
          submitLabel="Create"
        />
      )}

      {/* Edit */}
      {editing && (
        <RecordForm
          title={`Edit ${config.recordName}`}
          fields={config.fields}
          initial={editing.values}
          onSubmit={(values) => {
            updateRecord(editing.id, { values }, "Record details updated.");
            setEditing(null);
            toast(config.notification);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Detail */}
      {openRecord && !editing && (
        <RecordDetail
          config={config}
          record={openRecord}
          onClose={() => setOpenId(null)}
          onEdit={() => setEditing(openRecord)}
          onDelete={() => setConfirmDelete(openRecord)}
          onStatusChange={(sid) => handleStatusChange(openRecord, sid)}
          onAssign={(a) => {
            updateRecord(openRecord.id, { assignee: a || undefined }, a ? `Assigned to ${a}.` : "Unassigned.");
            if (a) toast(`Assigned to ${a}.`);
          }}
          onAddNote={(text) => {
            addNote(openRecord.id, text);
            toast("Note added.");
          }}
          onLineItemsChange={(items) => updateRecord(openRecord.id, { lineItems: items })}
        />
      )}

      {/* Confirmations */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete this ${config.recordName.toLowerCase()}?`}
          message={`"${String(confirmDelete.values[config.nameField])}" will be removed from the demo. This only affects sample data on this device.`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteRecord(confirmDelete.id);
            setConfirmDelete(null);
            setOpenId(null);
            toast(`${config.recordName} deleted.`);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          title="Reset this demo?"
          message="All changes you made in this demo will be discarded and the original sample records restored."
          confirmLabel="Reset demo"
          onConfirm={() => {
            resetScenario();
            setConfirmReset(false);
            setOpenId(null);
            toast("Demo data restored.");
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
