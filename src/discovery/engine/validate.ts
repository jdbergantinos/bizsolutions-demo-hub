import type { DiscoveryRecord, SalesPresentation, WorkflowComparison } from "../types";

// Validation for imported discovery-phase JSON. Invalid imports are rejected
// with readable messages instead of crashing the app.

export interface DiscoveryExport {
  exportVersion: 1;
  exportedAt: string;
  discoveries: DiscoveryRecord[];
  workflows: WorkflowComparison[];
  presentations: SalesPresentation[];
}

function isDiscovery(d: unknown): d is DiscoveryRecord {
  const x = d as Partial<DiscoveryRecord>;
  return Boolean(
    x &&
      x.schemaVersion === 1 &&
      typeof x.id === "string" &&
      x.business &&
      typeof x.business.businessName === "string" &&
      Array.isArray(x.problems) &&
      Array.isArray(x.desiredOutcomes) &&
      x.operations &&
      Array.isArray(x.operations.tools),
  );
}

function isWorkflow(w: unknown): w is WorkflowComparison {
  const x = w as Partial<WorkflowComparison>;
  return Boolean(
    x && x.schemaVersion === 1 && typeof x.id === "string" && Array.isArray(x.current) && Array.isArray(x.proposed),
  );
}

function isPresentation(p: unknown): p is SalesPresentation {
  const x = p as Partial<SalesPresentation>;
  return Boolean(
    x &&
      x.schemaVersion === 1 &&
      typeof x.id === "string" &&
      typeof x.businessName === "string" &&
      Array.isArray(x.sections) &&
      Array.isArray(x.demoServiceIds),
  );
}

export function validateDiscoveryExport(data: unknown): { errors: string[]; parsed?: DiscoveryExport } {
  if (typeof data !== "object" || data === null) return { errors: ["Import is not a JSON object."] };
  const x = data as Partial<DiscoveryExport>;
  const errors: string[] = [];
  if (x.exportVersion !== 1) errors.push("Unsupported export version — expected exportVersion 1.");
  if (!Array.isArray(x.discoveries)) errors.push("Missing discoveries array.");
  if (!Array.isArray(x.workflows)) errors.push("Missing workflows array.");
  if (!Array.isArray(x.presentations)) errors.push("Missing presentations array.");
  if (errors.length > 0) return { errors };

  const badD = x.discoveries!.filter((d) => !isDiscovery(d)).length;
  const badW = x.workflows!.filter((w) => !isWorkflow(w)).length;
  const badP = x.presentations!.filter((p) => !isPresentation(p)).length;
  if (badD) errors.push(`${badD} discovery record(s) have an unrecognized structure.`);
  if (badW) errors.push(`${badW} workflow comparison(s) have an unrecognized structure.`);
  if (badP) errors.push(`${badP} presentation(s) have an unrecognized structure.`);

  return errors.length > 0 ? { errors } : { errors: [], parsed: x as DiscoveryExport };
}
