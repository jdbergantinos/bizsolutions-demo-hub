import { load, remove, save, uid } from "../../utils/storage";
import type { DiscoveryRecord, SalesPresentation, WorkflowComparison } from "../types";
import { defaultSections } from "../config/sections";
import { validateDiscoveryExport, type DiscoveryExport } from "../engine/validate";
import { exportValueBundle, importValueBundle, type ValueExportBundle } from "../../value/store/valueStorage";

// Versioned repositories for discovery-phase data, following the app's
// existing "bizsolutions." key convention (covered by full reset).
export const DISCOVERY_KEYS = {
  discoveries: "bizsolutions.discovery.records.v1",
  activeDiscovery: "bizsolutions.discovery.active.v1",
  workflows: "bizsolutions.discovery.workflows.v1",
  presentations: "bizsolutions.discovery.presentations.v1",
} as const;

interface Versioned<T> {
  version: 1;
  items: T[];
}

function loadItems<T extends { schemaVersion: number; id: string }>(key: string): T[] {
  const store = load<Versioned<T> | null>(key, null);
  if (!store || store.version !== 1 || !Array.isArray(store.items)) return [];
  return store.items.filter((x) => x && x.schemaVersion === 1 && x.id);
}

function saveItems<T>(key: string, items: T[]): void {
  save(key, { version: 1, items } satisfies Versioned<T>);
}

// ---------- Discoveries ----------

export function loadDiscoveries(): DiscoveryRecord[] {
  return loadItems<DiscoveryRecord>(DISCOVERY_KEYS.discoveries);
}

export function upsertDiscovery(record: DiscoveryRecord): DiscoveryRecord[] {
  const all = loadDiscoveries();
  const next = all.some((x) => x.id === record.id)
    ? all.map((x) => (x.id === record.id ? record : x))
    : [record, ...all];
  saveItems(DISCOVERY_KEYS.discoveries, next);
  return next;
}

export function deleteDiscovery(id: string): DiscoveryRecord[] {
  const next = loadDiscoveries().filter((x) => x.id !== id);
  saveItems(DISCOVERY_KEYS.discoveries, next);
  if (getActiveDiscoveryId() === id) remove(DISCOVERY_KEYS.activeDiscovery);
  return next;
}

export function getActiveDiscoveryId(): string | null {
  return load<string | null>(DISCOVERY_KEYS.activeDiscovery, null);
}

export function setActiveDiscoveryId(id: string | null): void {
  if (id) save(DISCOVERY_KEYS.activeDiscovery, id);
  else remove(DISCOVERY_KEYS.activeDiscovery);
}

export function getActiveDiscovery(): DiscoveryRecord | null {
  const id = getActiveDiscoveryId();
  return id ? loadDiscoveries().find((x) => x.id === id) ?? null : null;
}

export function newDiscovery(partial: Partial<DiscoveryRecord> = {}): DiscoveryRecord {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid(),
    createdAt: now,
    updatedAt: now,
    status: "draft",
    business: {
      businessName: "",
      contactPerson: "",
      industryId: "",
      businessExample: "",
      location: "",
      branches: 1,
      employees: "",
      users: 5,
      monthlyTransactions: "",
      yearsOperating: "",
      decisionMaker: "",
      stakeholders: "",
      implementationPeriod: "",
      budgetRange: "",
      notes: "",
    },
    operations: {
      tools: [],
      toolsOther: "",
      manualProcesses: "",
      repeatedProcesses: "",
      slowReports: "",
      delayedTasks: "",
      hardToFindInfo: "",
      errorSpots: "",
      approvalProcesses: "",
      customerConcerns: "",
      multiBranch: false,
      fieldStaff: false,
      customerPortalExpected: false,
    },
    desiredOutcomes: [],
    outcomesOther: "",
    presenterNotes: "",
    unansweredQuestions: "",
    assumptions: "",
    itemsToVerify: "",
    problems: [],
    ...partial,
  };
}

// ---------- Workflows ----------

export function loadWorkflows(): WorkflowComparison[] {
  return loadItems<WorkflowComparison>(DISCOVERY_KEYS.workflows);
}

export function upsertWorkflow(w: WorkflowComparison): WorkflowComparison[] {
  const all = loadWorkflows();
  const next = all.some((x) => x.id === w.id) ? all.map((x) => (x.id === w.id ? w : x)) : [w, ...all];
  saveItems(DISCOVERY_KEYS.workflows, next);
  return next;
}

export function deleteWorkflow(id: string): WorkflowComparison[] {
  const next = loadWorkflows().filter((x) => x.id !== id);
  saveItems(DISCOVERY_KEYS.workflows, next);
  return next;
}

// ---------- Presentations ----------

export function loadPresentations(): SalesPresentation[] {
  return loadItems<SalesPresentation>(DISCOVERY_KEYS.presentations);
}

export function upsertPresentation(p: SalesPresentation): SalesPresentation[] {
  const all = loadPresentations();
  const next = all.some((x) => x.id === p.id) ? all.map((x) => (x.id === p.id ? p : x)) : [p, ...all];
  saveItems(DISCOVERY_KEYS.presentations, next);
  return next;
}

export function deletePresentation(id: string): SalesPresentation[] {
  const next = loadPresentations().filter((x) => x.id !== id);
  saveItems(DISCOVERY_KEYS.presentations, next);
  return next;
}

export function newPresentation(partial: Partial<SalesPresentation> = {}): SalesPresentation {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid(),
    title: "Client Presentation",
    businessName: "",
    industryId: "",
    businessExample: "",
    location: "",
    demoServiceIds: [],
    presenterName: "",
    meetingDate: "",
    meetingPurpose: "",
    presenterNotes: "",
    sections: defaultSections(),
    lastSectionIndex: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

// ---------- Export / import ----------

export function exportDiscoveryData(): string {
  const data: DiscoveryExport = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    discoveries: loadDiscoveries(),
    workflows: loadWorkflows(),
    presentations: loadPresentations(),
    value: exportValueBundle() as unknown as Record<string, unknown[]>,
  };
  return JSON.stringify(data, null, 2);
}

/** Validates and merges imported data (imported items overwrite same-id items). */
export function importDiscoveryData(json: string): { errors: string[]; imported?: { discoveries: number; workflows: number; presentations: number } } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { errors: ["That is not valid JSON."] };
  }
  const { errors, parsed: data } = validateDiscoveryExport(parsed);
  if (errors.length > 0 || !data) return { errors };

  const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]) => {
    const map = new Map(existing.map((x) => [x.id, x]));
    incoming.forEach((x) => map.set(x.id, x));
    return [...map.values()];
  };
  saveItems(DISCOVERY_KEYS.discoveries, mergeById(loadDiscoveries(), data.discoveries));
  saveItems(DISCOVERY_KEYS.workflows, mergeById(loadWorkflows(), data.workflows));
  saveItems(DISCOVERY_KEYS.presentations, mergeById(loadPresentations(), data.presentations));
  if (data.value) importValueBundle(data.value as unknown as Partial<ValueExportBundle>);
  return {
    errors: [],
    imported: {
      discoveries: data.discoveries.length,
      workflows: data.workflows.length,
      presentations: data.presentations.length,
    },
  };
}
