import type { CurrentWorkflowStep, ProposedWorkflowStep } from "../types";
import { uid } from "../../utils/storage";

// Starter template so the workflow builder never opens empty-handed.
// Presenters edit these to match the client's real process.

const flags = (over: Partial<CurrentWorkflowStep["flags"]> = {}): CurrentWorkflowStep["flags"] => ({
  bottleneck: false,
  approvalPoint: false,
  customerInteraction: false,
  duplicateEntry: false,
  reportingStep: false,
  ...over,
});

export function templateCurrentSteps(): CurrentWorkflowStep[] {
  return [
    { id: uid(), title: "Customer sends Messenger message", description: "Inquiry arrives in a personal chat thread.", responsible: "Whoever sees it", tool: "Messenger", estimatedMinutes: 5, delayMinutes: 60, commonError: "Message missed among personal chats", notes: "", flags: flags({ customerInteraction: true }) },
    { id: uid(), title: "Staff writes details in notebook", description: "Details copied by hand from the chat.", responsible: "Front desk", tool: "Paper or notebook", estimatedMinutes: 10, delayMinutes: 0, commonError: "Incomplete or misheard details", notes: "", flags: flags({ duplicateEntry: true }) },
    { id: uid(), title: "Quotation created manually", description: "Amounts computed in a spreadsheet or by hand.", responsible: "Owner", tool: "Excel", estimatedMinutes: 30, delayMinutes: 120, commonError: "Wrong or inconsistent pricing", notes: "", flags: flags({ bottleneck: true }) },
    { id: uid(), title: "Manager approves through chat", description: "Approval requested in a group chat.", responsible: "Manager", tool: "Messenger", estimatedMinutes: 5, delayMinutes: 240, commonError: "Approval scrolls away unrecorded", notes: "", flags: flags({ approvalPoint: true, bottleneck: true }) },
    { id: uid(), title: "Customer repeatedly asks for status", description: "Customer messages again and again for updates.", responsible: "Front desk", tool: "Messenger", estimatedMinutes: 15, delayMinutes: 0, commonError: "Different staff give different answers", notes: "", flags: flags({ customerInteraction: true }) },
  ];
}

export function templateProposedSteps(): ProposedWorkflowStep[] {
  return [
    { id: uid(), title: "Inquiry captured in CRM", automated: true, responsibleRole: "System + front desk", relatedModule: "crm", expectedResult: "Lead recorded with owner and source", notification: "New-lead alert to assigned staff", requiresApproval: false, notes: "" },
    { id: uid(), title: "Quotation generated", automated: false, responsibleRole: "Staff", relatedModule: "quotation", expectedResult: "Itemized quote with automatic totals", notification: "", requiresApproval: false, notes: "" },
    { id: uid(), title: "Manager approves in system", automated: false, responsibleRole: "Manager", relatedModule: "approvals", expectedResult: "Recorded decision with remarks", notification: "Requester notified of decision", requiresApproval: true, notes: "" },
    { id: uid(), title: "Work is scheduled", automated: false, responsibleRole: "Staff", relatedModule: "booking", expectedResult: "Confirmed schedule visible to the team", notification: "Simulated confirmation to customer", requiresApproval: false, notes: "" },
    { id: uid(), title: "Customer receives automated status updates", automated: true, responsibleRole: "System", relatedModule: "portal", expectedResult: "Customer sees progress without calling", notification: "Simulated status notifications", requiresApproval: false, notes: "" },
  ];
}
