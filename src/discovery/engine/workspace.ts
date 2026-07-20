import type { ClientProfile } from "../../types";
import type { DiscoveryRecord, WorkflowComparison } from "../types";
import { loadDiscoveries, loadWorkflows } from "../store/discoveryStorage";
import { getProblem } from "../config/problemCatalog";
import { loadEstimates } from "../../pricing/store/pricingStorage";
import type { PricingEstimate } from "../../pricing/types";
import type { ImplementationRoadmap, MeetingRecord, PreliminaryScope, RoiEstimate } from "../../value/types";
import { meetingRepo, roadmapRepo, roiRepo, scopeRepo } from "../../value/store/valueStorage";
import { uid } from "../../utils/storage";

// The client workspace: the active discovery is the anchor, and every tool
// resolves ITS client's records through these finders instead of grabbing
// "the first record of that type" (which could belong to another client).
// When nothing matches, they return null — showing nothing is always better
// than silently showing another client's data.

/** The active client's pricing estimate: linked by discovery id first, then
 *  by exact business-name match, never "whichever estimate exists". */
export function estimateForDiscovery(d: DiscoveryRecord | null): PricingEstimate | null {
  if (!d) return null;
  const estimates = loadEstimates().filter((e) => !e.archived);
  const byId = estimates.find((e) => e.input.discoveryId === d.id);
  if (byId) return byId;
  const name = d.business.businessName.trim().toLowerCase();
  if (!name) return null;
  return estimates.find((e) => e.input.businessName.trim().toLowerCase() === name) ?? null;
}

export function workflowForDiscovery(d: DiscoveryRecord | null): WorkflowComparison | null {
  if (!d) return null;
  const workflows = loadWorkflows();
  if (d.workflowId) {
    const linked = workflows.find((w) => w.id === d.workflowId);
    if (linked) return linked;
  }
  return workflows.find((w) => w.discoveryId === d.id) ?? null;
}

export function roiForDiscovery(d: DiscoveryRecord | null): RoiEstimate | null {
  if (!d) return null;
  return roiRepo.loadAll().find((r) => r.discoveryId === d.id) ?? null;
}

export function scopeForDiscovery(d: DiscoveryRecord | null): PreliminaryScope | null {
  if (!d) return null;
  return scopeRepo.loadAll().find((s) => s.discoveryId === d.id) ?? null;
}

export function roadmapForDiscovery(d: DiscoveryRecord | null): ImplementationRoadmap | null {
  if (!d) return null;
  return roadmapRepo.loadAll().find((r) => r.discoveryId === d.id) ?? null;
}

export function latestMeetingForDiscovery(d: DiscoveryRecord | null): MeetingRecord | null {
  if (!d) return null;
  return (
    meetingRepo
      .loadAll()
      .filter((m) => m.discoveryId === d.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

/**
 * The client profile that should be active for a given active discovery, so
 * setting a client active in Discovery also activates its saved profile
 * (accent color, Client Profile highlight). Returns null when the discovery
 * has no saved profile — the active profile is then cleared so nothing
 * disagrees with the workspace.
 */
export function activeProfileIdForDiscovery(discoveryId: string | null, profiles: ClientProfile[]): string | null {
  if (!discoveryId) return null;
  const d = loadDiscoveries().find((x) => x.id === discoveryId);
  const linked = d?.clientProfileId;
  return linked && profiles.some((p) => p.id === linked) ? linked : null;
}

/** Builds a permanent Client Profile from a discovery's collected details. */
export function profileFromDiscovery(d: DiscoveryRecord): ClientProfile {
  const problemTitles = d.problems
    .map((p) => getProblem(p.problemId)?.title ?? p.customTitle)
    .filter(Boolean)
    .join("; ");
  const tools = [d.operations.tools.join(", "), d.operations.toolsOther].filter(Boolean).join(" — ");
  const outcomes = [d.desiredOutcomes.join(", "), d.outcomesOther].filter(Boolean).join(" — ");
  return {
    id: uid(),
    businessName: d.business.businessName,
    contactPerson: d.business.contactPerson,
    industryId: d.business.industryId,
    businessType: d.business.businessExample,
    branches: String(d.business.branches),
    employees: d.business.employees,
    currentSystems: tools,
    primaryProblems: problemTitles || d.business.notes,
    desiredOutcomes: outcomes,
    notes: d.business.notes,
    createdAt: new Date().toISOString(),
  };
}
