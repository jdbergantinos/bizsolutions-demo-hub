import type { DemoRecord, ScenarioConfig, StatusDef } from "../types";

/**
 * A record's effective status. Inventory status is derived from quantity vs.
 * reorder level instead of being stored.
 */
export function statusOf(config: ScenarioConfig, record: DemoRecord): StatusDef {
  if (config.engine === "inventory" && config.qtyKey) {
    const qty = Number(record.values[config.qtyKey] ?? 0);
    const reorder = config.reorderKey ? Number(record.values[config.reorderKey] ?? 0) : 0;
    const id = qty <= 0 ? "out" : reorder && qty <= reorder ? "low" : "in-stock";
    return config.statuses.find((s) => s.id === id) ?? config.statuses[0];
  }
  return config.statuses.find((s) => s.id === record.status) ?? config.statuses[0];
}

export function lineTotal(record: DemoRecord): number {
  return (record.lineItems ?? []).reduce((sum, li) => sum + li.qty * li.price, 0);
}

export type SortMode = "newest" | "name" | "status";

export function filterAndSort(
  config: ScenarioConfig,
  records: DemoRecord[],
  search: string,
  statusFilter: string,
  sort: SortMode,
): DemoRecord[] {
  const q = search.trim().toLowerCase();
  let out = records.filter((r) => {
    const matchesSearch =
      !q ||
      Object.values(r.values).some((v) => String(v).toLowerCase().includes(q)) ||
      (r.assignee ?? "").toLowerCase().includes(q);
    const matchesStatus = !statusFilter || statusOf(config, r).id === statusFilter;
    return matchesSearch && matchesStatus;
  });
  out = [...out];
  if (sort === "name") {
    out.sort((a, b) =>
      String(a.values[config.nameField] ?? "").localeCompare(String(b.values[config.nameField] ?? "")),
    );
  } else if (sort === "status") {
    const order = new Map(config.statuses.map((s, i) => [s.id, i]));
    out.sort((a, b) => (order.get(statusOf(config, a).id) ?? 0) - (order.get(statusOf(config, b).id) ?? 0));
  } else {
    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return out;
}
