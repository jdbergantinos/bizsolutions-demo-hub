import { load, save, uid } from "../../utils/storage";
import type {
  ClientAcknowledgment,
  ImplementationRoadmap,
  MeetingRecord,
  PreliminaryScope,
  RoiEstimate,
} from "../types";
import { emptyRoiInputs } from "../engine/calculateRoi";
import { defaultRoadmapStages } from "../config/roadmapStages";

// Versioned Phase B repositories, same "bizsolutions." convention.
export const VALUE_KEYS = {
  roi: "bizsolutions.value.roi.v1",
  scopes: "bizsolutions.value.scopes.v1",
  roadmaps: "bizsolutions.value.roadmaps.v1",
  meetings: "bizsolutions.value.meetings.v1",
  acknowledgments: "bizsolutions.value.acknowledgments.v1",
  summaries: "bizsolutions.value.summaries.v1",
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

function makeRepo<T extends { schemaVersion: number; id: string }>(key: string) {
  return {
    loadAll: () => loadItems<T>(key),
    upsert: (item: T): T[] => {
      const all = loadItems<T>(key);
      const next = all.some((x) => x.id === item.id) ? all.map((x) => (x.id === item.id ? item : x)) : [item, ...all];
      saveItems(key, next);
      return next;
    },
    remove: (id: string): T[] => {
      const next = loadItems<T>(key).filter((x) => x.id !== id);
      saveItems(key, next);
      return next;
    },
    replaceAll: (items: T[]) => saveItems(key, items),
  };
}

export const roiRepo = makeRepo<RoiEstimate>(VALUE_KEYS.roi);
export const scopeRepo = makeRepo<PreliminaryScope>(VALUE_KEYS.scopes);
export const roadmapRepo = makeRepo<ImplementationRoadmap>(VALUE_KEYS.roadmaps);
export const meetingRepo = makeRepo<MeetingRecord>(VALUE_KEYS.meetings);
export const ackRepo = makeRepo<ClientAcknowledgment>(VALUE_KEYS.acknowledgments);

export interface SavedSummary {
  schemaVersion: 1;
  id: string;
  title: string;
  discoveryId?: string;
  clientView: boolean;
  text: string;
  createdAt: string;
}
export const summaryRepo = makeRepo<SavedSummary>(VALUE_KEYS.summaries);

// ---------- Factories ----------

export function newRoiEstimate(partial: Partial<RoiEstimate> = {}): RoiEstimate {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid(),
    name: "ROI estimate",
    inputs: emptyRoiInputs(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function newRoadmap(partial: Partial<ImplementationRoadmap> = {}): ImplementationRoadmap {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid(),
    name: "Implementation roadmap",
    stages: defaultRoadmapStages(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function newMeeting(partial: Partial<MeetingRecord> = {}): MeetingRecord {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid(),
    clientName: "",
    meetingDate: now.slice(0, 10),
    meetingType: "First presentation",
    attendees: "",
    decisionMakersPresent: false,
    presenter: "",
    topicsDiscussed: "",
    confirmedProblems: "",
    requestedModules: "",
    requestedChanges: "",
    clientConcerns: "",
    budgetDiscussion: "",
    followUpQuestions: "",
    technicalIssues: "",
    decisionsMade: "",
    itemsNotApproved: "",
    nextAction: "",
    followUpDate: "",
    status: "new-lead",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/** Bundle used by the discovery hub's export/import. */
export interface ValueExportBundle {
  roi: RoiEstimate[];
  scopes: PreliminaryScope[];
  roadmaps: ImplementationRoadmap[];
  meetings: MeetingRecord[];
  acknowledgments: ClientAcknowledgment[];
  summaries: SavedSummary[];
}

export function exportValueBundle(): ValueExportBundle {
  return {
    roi: roiRepo.loadAll(),
    scopes: scopeRepo.loadAll(),
    roadmaps: roadmapRepo.loadAll(),
    meetings: meetingRepo.loadAll(),
    acknowledgments: ackRepo.loadAll(),
    summaries: summaryRepo.loadAll(),
  };
}

export function importValueBundle(bundle: Partial<ValueExportBundle>): void {
  const mergeInto = <T extends { id: string; schemaVersion: number }>(
    repo: { loadAll: () => T[]; replaceAll: (items: T[]) => void },
    incoming: T[] | undefined,
  ) => {
    if (!Array.isArray(incoming)) return;
    const valid = incoming.filter((x) => x && x.schemaVersion === 1 && x.id);
    const map = new Map(repo.loadAll().map((x) => [x.id, x]));
    valid.forEach((x) => map.set(x.id, x));
    repo.replaceAll([...map.values()]);
  };
  mergeInto(roiRepo, bundle.roi);
  mergeInto(scopeRepo, bundle.scopes);
  mergeInto(roadmapRepo, bundle.roadmaps);
  mergeInto(meetingRepo, bundle.meetings);
  mergeInto(ackRepo, bundle.acknowledgments);
  mergeInto(summaryRepo, bundle.summaries);
}
