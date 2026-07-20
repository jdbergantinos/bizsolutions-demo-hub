import { getIndustry } from "../../data/catalog";
import type { SalesPresentation } from "../../discovery/types";
import type { WorkflowComparison } from "../../discovery/types";
import { newPresentation, upsertPresentation, upsertWorkflow } from "../../discovery/store/discoveryStorage";
import { uid } from "../../utils/storage";
import type { IndustryTemplate } from "../types";

/**
 * Creates a NEW presentation (and a starter workflow) from an industry
 * template. Existing saved presentations are never modified.
 */
export function applyIndustryTemplate(template: IndustryTemplate): SalesPresentation {
  const industry = getIndustry(template.industryId);
  const now = new Date().toISOString();

  // Starter workflow from the template's default step titles.
  const workflow: WorkflowComparison = {
    schemaVersion: 1,
    id: uid(),
    name: `${template.name} template workflow`,
    industryId: template.industryId,
    createdAt: now,
    updatedAt: now,
    current: template.defaultCurrentWorkflow.map((title) => ({
      id: uid(),
      title,
      description: "",
      responsible: "",
      tool: "",
      estimatedMinutes: 10,
      delayMinutes: 30,
      commonError: "",
      notes: "",
      flags: { bottleneck: false, approvalPoint: false, customerInteraction: false, duplicateEntry: false, reportingStep: false },
    })),
    proposed: template.defaultProposedWorkflow.map((title) => ({
      id: uid(),
      title,
      automated: false,
      responsibleRole: "",
      relatedModule: "",
      expectedResult: "",
      notification: "",
      requiresApproval: false,
      notes: "",
    })),
  };
  upsertWorkflow(workflow);

  // Featured demos: the industry's services matching the template's sequence.
  const demoServiceIds =
    industry?.services
      .filter((s) => template.demoSequence.includes(s.demoModule))
      .slice(0, 5)
      .map((s) => s.id) ?? [];

  const presentation = newPresentation({
    title: `${template.name} template presentation`,
    industryId: template.industryId,
    workflowId: workflow.id,
    demoServiceIds,
    presenterNotes: `Template notes — discovery questions: ${template.discoveryQuestions.join(" · ")}`,
  });
  upsertPresentation(presentation);
  return presentation;
}
