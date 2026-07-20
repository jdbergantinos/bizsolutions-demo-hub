import type { RoadmapStage } from "../types";
import { uid } from "../../utils/storage";

export const ROADMAP_DISCLAIMER =
  "Final schedule depends on confirmed scope, client availability, integrations, data preparation, technical complexity, and resource availability.";

// The 13 default stages. Duration ranges are talking points, never dates.
const s = (
  title: string,
  description: string,
  responsible: string,
  durationRange: string,
  flags: Partial<Pick<RoadmapStage, "clientDependency" | "technicalReview" | "milestone">> = {},
): RoadmapStage => ({
  id: uid(),
  title,
  description,
  responsible,
  durationRange,
  clientDependency: false,
  technicalReview: false,
  milestone: false,
  ...flags,
});

export function defaultRoadmapStages(): RoadmapStage[] {
  return [
    s("Initial discovery", "Understand operations, problems, and goals.", "Both", "1 session", { clientDependency: true }),
    s("Requirements confirmation", "Confirm scope, priorities, and assumptions in writing.", "Both", "3–5 days", { clientDependency: true, milestone: true }),
    s("Workflow and solution design", "Design workflows, roles, and screens against confirmed requirements.", "Provider", "1–2 weeks"),
    s("Client review", "Walk through the design; collect corrections.", "Client", "2–5 days", { clientDependency: true }),
    s("Prototype or configuration", "Configure modules or build the prototype.", "Provider", "1–3 weeks"),
    s("Development", "Build customizations and integrations in the approved scope.", "Provider", "2–6 weeks", { technicalReview: true }),
    s("Internal testing", "Provider-side testing against the confirmed requirements.", "Provider", "3–5 days"),
    s("Client acceptance testing", "Client verifies the system against agreed scenarios.", "Client", "3–7 days", { clientDependency: true, milestone: true }),
    s("Data preparation", "Prepare, clean, and load agreed starting data.", "Both", "3–10 days", { clientDependency: true }),
    s("Training", "Train administrators and staff on their daily workflows.", "Both", "2–5 days", { clientDependency: true }),
    s("Deployment", "Go live according to the approved plan.", "Provider", "1–3 days", { milestone: true }),
    s("Stabilization", "Close monitoring and quick fixes right after go-live.", "Provider", "1–2 weeks"),
    s("Ongoing support", "Support and maintenance per the agreed plan.", "Provider", "Continuous"),
  ];
}
