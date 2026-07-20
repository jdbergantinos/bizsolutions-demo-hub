import { load, save, uid } from "../../utils/storage";
import type {
  ApprovalShowcaseState,
  CustomScenario,
  DashboardPreference,
  IntegrationAssessment,
  PresentationHistoryRecord,
  SimulatedNotification,
} from "../types";

export const TOOLKIT_KEYS = {
  assessments: "bizsolutions.toolkit.assessments.v1",
  notifications: "bizsolutions.toolkit.notifications.v1",
  approvals: "bizsolutions.toolkit.approvals.v1",
  dashboards: "bizsolutions.toolkit.dashboards.v1",
  scenarios: "bizsolutions.toolkit.scenarios.v1",
  history: "bizsolutions.toolkit.history.v1",
  boundaryAck: "bizsolutions.toolkit.boundaryack.v1",
} as const;

interface Versioned<T> {
  version: 1;
  items: T[];
}

function makeRepo<T extends { schemaVersion: number; id: string }>(key: string) {
  const loadAll = (): T[] => {
    const store = load<Versioned<T> | null>(key, null);
    if (!store || store.version !== 1 || !Array.isArray(store.items)) return [];
    return store.items.filter((x) => x && x.schemaVersion === 1 && x.id);
  };
  return {
    loadAll,
    upsert: (item: T): T[] => {
      const all = loadAll();
      const next = all.some((x) => x.id === item.id) ? all.map((x) => (x.id === item.id ? item : x)) : [item, ...all];
      save(key, { version: 1, items: next } satisfies Versioned<T>);
      return next;
    },
    remove: (id: string): T[] => {
      const next = loadAll().filter((x) => x.id !== id);
      save(key, { version: 1, items: next } satisfies Versioned<T>);
      return next;
    },
  };
}

export const assessmentRepo = makeRepo<IntegrationAssessment>(TOOLKIT_KEYS.assessments);
export const notificationRepo = makeRepo<SimulatedNotification>(TOOLKIT_KEYS.notifications);
export const approvalStateRepo = makeRepo<ApprovalShowcaseState>(TOOLKIT_KEYS.approvals);
export const dashboardPrefRepo = makeRepo<DashboardPreference>(TOOLKIT_KEYS.dashboards);
export const customScenarioRepo = makeRepo<CustomScenario>(TOOLKIT_KEYS.scenarios);
export const historyRepo = makeRepo<PresentationHistoryRecord>(TOOLKIT_KEYS.history);

export function newAssessment(integrationId: string): IntegrationAssessment {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, id: uid(), integrationId, clientName: "", existingProvider: "",
    accountOwnership: "", apiAvailable: "", documentationAvailable: "", sandboxAvailable: "",
    requiredData: "", dataDirection: "", frequency: "", expectedVolume: "",
    authenticationType: "", errorHandlingExpectation: "", securityRequirement: "",
    technicalContact: "", notes: "", createdAt: now, updatedAt: now,
  };
}

export function newHistoryRecord(partial: Partial<PresentationHistoryRecord> = {}): PresentationHistoryRecord {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, id: uid(), clientName: "", date: now.slice(0, 10), industryId: "",
    attendees: "", problemsDiscussed: "", modulesShown: "", scenariosShown: "",
    roleViewsShown: "", packagePresented: "", questions: "", objections: "",
    decisions: "", nextStep: "", followUpDate: "", status: "new-lead", outcome: "",
    notes: "", createdAt: now, updatedAt: now, ...partial,
  };
}

/** Has the presenter acknowledged the demo-boundary notice for this industry? */
export function boundaryAcknowledged(industryId: string): boolean {
  return load<string[]>(TOOLKIT_KEYS.boundaryAck, []).includes(industryId);
}

export function acknowledgeBoundary(industryId: string): void {
  const list = load<string[]>(TOOLKIT_KEYS.boundaryAck, []);
  if (!list.includes(industryId)) save(TOOLKIT_KEYS.boundaryAck, [...list, industryId]);
}
