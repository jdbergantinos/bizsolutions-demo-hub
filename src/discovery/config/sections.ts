import type { PresentationSection, PresentationSectionId } from "../types";

export const SECTION_META: Record<PresentationSectionId, { title: string; presenterTip: string }> = {
  "business-value": { title: "Business Value & ROI", presenterTip: "Anchor every number to an assumption the client gave you. Ranges, never promises." },
  "preliminary-scope": { title: "Preliminary Scope", presenterTip: "Read the 'not included' list aloud — it prevents the most painful misunderstandings." },
  "client-acknowledgment": { title: "Client Acknowledgment", presenterTip: "Frame it as capturing the discussion, never as signing anything." },
  "client-overview": { title: "Client Overview", presenterTip: "Confirm the basics out loud — it shows you listened during discovery." },
  "current-challenges": { title: "Current Challenges", presenterTip: "Let the client correct you; corrections build buy-in." },
  "business-problems": { title: "Business Problems", presenterTip: "Ask: \"Which of these hurts the most?\" and mark it verified." },
  "current-workflow": { title: "Current Workflow", presenterTip: "Walk the steps slowly — clients recognize their own pain." },
  "proposed-workflow": { title: "Proposed Workflow", presenterTip: "Contrast step counts and waiting time. Keep it concrete." },
  "recommended-solution": { title: "Recommended Solution", presenterTip: "Tie every module back to a problem they confirmed." },
  "interactive-demo": { title: "Interactive Demonstration", presenterTip: "Let the client tap the buttons themselves when possible." },
  "role-views": { title: "Role-Based Views", presenterTip: "Show the role of the person in the room first." },
  "package-comparison": { title: "Package Comparison", presenterTip: "Anchor on the Growth package; mention Essential as the safe start." },
  "preliminary-pricing": { title: "Preliminary Pricing", presenterTip: "Ranges only. Repeat that final pricing follows discovery." },
  "implementation-process": { title: "Implementation Process", presenterTip: "Outline only — set expectations, not commitments." },
  "questions": { title: "Questions", presenterTip: "Write their questions into the discovery record as you go." },
  "next-steps": { title: "Next Steps", presenterTip: "Leave with one concrete agreed action and a date." },
};

export const DEFAULT_SECTION_ORDER: PresentationSectionId[] = [
  "client-overview",
  "current-challenges",
  "business-problems",
  "current-workflow",
  "proposed-workflow",
  "recommended-solution",
  "interactive-demo",
  "role-views",
  "business-value",
  "package-comparison",
  "preliminary-pricing",
  "preliminary-scope",
  "implementation-process",
  "questions",
  "next-steps",
  "client-acknowledgment",
];

export function defaultSections(): PresentationSection[] {
  return DEFAULT_SECTION_ORDER.map((id) => ({ id, enabled: true }));
}

/** Appends sections added in later phases to presentations saved before them. */
export function normalizeSections(sections: PresentationSection[]): PresentationSection[] {
  const known = new Set(sections.map((s) => s.id));
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !known.has(id));
  return [...sections, ...missing.map((id) => ({ id, enabled: true }))];
}
