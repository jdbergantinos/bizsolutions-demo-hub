import type { ApprovalScenarioDef } from "../types";

export const APPROVAL_DISCLAIMER =
  "Demo behavior only — production approval controls require implemented permissions and audit requirements.";

const a = (id: string, name: string, requester: string, subject: string, levels: ApprovalScenarioDef["levels"], amountNote?: string): ApprovalScenarioDef =>
  ({ id, name, requester, subject, levels, amountNote });

// Reusable approval walkthroughs with conceptual multi-level chains.
export const APPROVAL_SCENARIOS: ApprovalScenarioDef[] = [
  a("quotation", "Quotation approval", "Liza Ramos (Sales)", "Quotation Q-2041 for Subic Bay Trading (Sample)", [{ role: "Manager", label: "Sales manager review" }, { role: "Owner", label: "Owner final approval" }], "₱185,000 quotation total"),
  a("purchase", "Purchase request", "Marco Torres (Inventory)", "PO for 40 boxes of fast-moving stock (Sample)", [{ role: "Manager", label: "Branch manager" }], "₱62,500 estimated"),
  a("discount", "Discount approval", "Carlo Domingo (Sales)", "12% discount for a repeat customer (Sample)", [{ role: "Manager", label: "Sales manager (up to 10%)" }, { role: "Owner", label: "Owner (above 10%)" }], "₱9,000 discount value"),
  a("change-order", "Change order", "Grace Navarro (Projects)", "Additional scope on Job #1041 (Sample)", [{ role: "Manager", label: "Project manager" }, { role: "Owner", label: "Owner sign-off" }], "₱35,000 additional"),
  a("content", "Content approval", "Bea Reyes (Creative)", "July campaign artwork v2 (Sample)", [{ role: "Manager", label: "Creative director" }, { role: "Customer", label: "Client approval" }]),
  a("leave", "Leave request", "Paolo Bautista (Staff)", "3-day leave, Aug 4–6 (Sample)", [{ role: "Manager", label: "Supervisor" }]),
  a("document", "Document approval", "Ana Santos (Admin)", "Updated supplier contract (Sample)", [{ role: "Manager", label: "Department head" }, { role: "Owner", label: "Owner countersign" }]),
  a("completion", "Service completion", "Nato Reyes (Technician)", "Job JO-1043 marked complete (Sample)", [{ role: "Manager", label: "Service adviser check" }, { role: "Customer", label: "Customer confirmation" }]),
  a("refund", "Refund request", "Front desk", "Refund for cancelled booking B-889 (Sample)", [{ role: "Manager", label: "Branch manager" }, { role: "Owner", label: "Owner (above threshold)" }], "₱4,500 refund"),
];
