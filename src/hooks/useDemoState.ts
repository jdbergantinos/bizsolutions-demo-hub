import { useCallback, useEffect, useState } from "react";
import type { ActivityEntry, DemoRecord, ScenarioConfig } from "../types";
import { KEYS, load, remove, save, uid } from "../utils/storage";

function seedRecords(config: ScenarioConfig): DemoRecord[] {
  const now = new Date().toISOString();
  return config.records.map((seed, i) => ({
    id: `seed-${i}`,
    values: seed.values,
    status: seed.status,
    assignee: seed.assignee,
    lineItems: seed.lineItems,
    notes: [],
    activity: [{ id: `a-${i}`, text: "Sample record loaded.", at: now }],
    createdAt: now,
  }));
}

/**
 * localStorage-backed record state for one demo scenario. Seeds from the
 * scenario's mock records on first open; "reset" restores the seeds.
 */
export function useDemoState(config: ScenarioConfig) {
  const storageKey = KEYS.demoPrefix + config.key;
  const [records, setRecords] = useState<DemoRecord[]>(() =>
    load<DemoRecord[] | null>(storageKey, null) ?? seedRecords(config),
  );

  // Re-load when navigating between scenarios that share this component.
  useEffect(() => {
    setRecords(load<DemoRecord[] | null>(storageKey, null) ?? seedRecords(config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => save(storageKey, records), [storageKey, records]);

  const log = (text: string): ActivityEntry => ({ id: uid(), text, at: new Date().toISOString() });

  const createRecord = useCallback(
    (values: DemoRecord["values"], status: string) => {
      const rec: DemoRecord = {
        id: uid(),
        values,
        status,
        notes: [],
        activity: [{ id: uid(), text: "Record created.", at: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        lineItems: [],
      };
      setRecords((r) => [rec, ...r]);
      return rec;
    },
    [],
  );

  const updateRecord = useCallback((id: string, patch: Partial<DemoRecord>, activityText?: string) => {
    setRecords((all) =>
      all.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              activity: activityText ? [...r.activity, log(activityText)] : r.activity,
            }
          : r,
      ),
    );
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords((all) => all.filter((r) => r.id !== id));
  }, []);

  const addNote = useCallback((id: string, text: string) => {
    setRecords((all) =>
      all.map((r) =>
        r.id === id
          ? { ...r, notes: [...r.notes, { id: uid(), text, at: new Date().toISOString() }], activity: [...r.activity, log("Note added.")] }
          : r,
      ),
    );
  }, []);

  const resetScenario = useCallback(() => {
    remove(storageKey);
    setRecords(seedRecords(config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, config]);

  return { records, createRecord, updateRecord, deleteRecord, addNote, resetScenario };
}
