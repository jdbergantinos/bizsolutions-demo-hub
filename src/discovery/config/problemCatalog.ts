import type { BusinessProblem, ProblemCategory } from "../types";
import type { DemoModuleType } from "../../types";

// Centralized problem → solution mapping. Problems map to demo-module types;
// getServicesForProblem() resolves them to the chosen industry's actual
// service offers, so mappings work across all 44 industries.

const p = (
  id: string,
  category: ProblemCategory,
  title: string,
  description: string,
  modules: DemoModuleType[],
  improvement: string,
  benefits: string[],
  riskNotes?: string[],
): BusinessProblem => ({
  id,
  category,
  title,
  description,
  relatedDemoModuleIds: modules,
  suggestedWorkflowImprovement: improvement,
  expectedBenefits: benefits,
  riskNotes,
});

export const PROBLEM_CATALOG: BusinessProblem[] = [
  // ---- Customer and Sales ----
  p("leads-forgotten", "Customer & Sales", "Leads are forgotten", "Inquiries arrive by phone or chat and are never followed up.", ["crm"], "Every inquiry becomes a tracked lead with an owner and follow-up history.", ["Fewer lost sales", "Clear follow-up accountability"]),
  p("customer-info-scattered", "Customer & Sales", "Customer information is scattered", "Contact details live in personal phones, notebooks, and chat threads.", ["crm", "portal"], "One central customer record visible to the whole team.", ["Faster lookups", "Consistent customer data"]),
  p("followups-inconsistent", "Customer & Sales", "Follow-ups are inconsistent", "Follow-ups depend on individual memory.", ["crm", "membership"], "Simulated reminders and a pending-follow-up list.", ["More conversions", "Repeat business"]),
  p("quotations-slow", "Customer & Sales", "Quotations take too long", "Quotes are rebuilt from scratch in chat or spreadsheets.", ["quotation"], "Itemized quotations with automatic totals and an approval trail.", ["Faster quotes", "Consistent pricing"]),
  p("customers-ask-updates", "Customer & Sales", "Customers repeatedly ask for updates", "Staff spend hours answering \"what's the status?\"", ["portal", "projects"], "Status is updated once and visible to the customer.", ["Fewer status calls", "More professional image"]),
  p("no-customer-history", "Customer & Sales", "No customer history", "Past transactions and preferences are unknown.", ["crm", "universal"], "A per-customer history of jobs, notes, and interactions.", ["Better service", "Upsell opportunities"]),
  p("sales-unclear", "Customer & Sales", "Sales performance is unclear", "Nobody knows which products, staff, or branches perform.", ["dashboard"], "Live sales dashboard with branch and trend comparisons.", ["Grounded decisions", "Early warning on dips"]),
  p("no-loyalty", "Customer & Sales", "No structured loyalty program", "Repeat customers get no recognition or incentive.", ["membership"], "Points, packages, and renewal tracking per customer.", ["More repeat visits", "Higher customer lifetime value"]),

  // ---- Operations ----
  p("work-tracked-manually", "Operations", "Work is tracked manually", "Jobs live on whiteboards and in memory.", ["projects", "universal"], "Every job gets a record, stage, and owner.", ["Instant status answers", "Nothing forgotten"]),
  p("tasks-no-owner", "Operations", "Tasks have no clear owner", "Work is announced verbally and ownership is unclear.", ["tasks"], "Tasks assigned to named staff with due dates.", ["Accountability", "Fewer dropped tasks"]),
  p("job-status-hard", "Operations", "Job status is difficult to monitor", "Managers must call around to learn progress.", ["projects", "dashboard"], "A live job board with stages and activity history.", ["Real-time visibility", "Earlier interventions"]),
  p("approvals-in-chat", "Operations", "Approvals happen through chat", "Decisions scroll away with no record.", ["approvals"], "Structured approvals with a decision trail.", ["Documented decisions", "Faster approvals"]),
  p("reports-take-hours", "Operations", "Reports take hours to prepare", "Staff assemble reports manually every period.", ["dashboard"], "Dashboards replace manual report-building.", ["Hours saved weekly", "Fresher numbers"]),
  p("duplicate-data-entry", "Operations", "Multiple entries of the same data", "The same information is retyped into different files.", ["universal", "ordering"], "Enter once; every screen reads the same record.", ["Less encoding work", "Fewer copy errors"]),
  p("branch-processes-differ", "Operations", "Branches use different processes", "Each branch improvises its own way of working.", ["tasks", "universal"], "Standard workflows and checklists across branches.", ["Consistency", "Easier training"]),
  p("no-realtime-visibility", "Operations", "Managers lack real-time visibility", "Owners see problems only at month-end.", ["dashboard"], "Management dashboard updated as work happens.", ["Earlier detection", "Confident decisions"]),

  // ---- Inventory and Purchasing ----
  p("stock-inaccurate", "Inventory & Purchasing", "Stock counts are inaccurate", "System (or notebook) counts never match the shelf.", ["inventory"], "Live stock list with recorded movements.", ["Trustworthy counts", "Less shrinkage"]),
  p("lowstock-late", "Inventory & Purchasing", "Low-stock items are discovered too late", "Stock-outs are found when a customer is already waiting.", ["inventory"], "Reorder levels with low-stock alerts.", ["Fewer stock-outs", "Steadier sales"]),
  p("supplier-scattered", "Inventory & Purchasing", "Supplier records are scattered", "Prices and contacts live in old messages.", ["procurement"], "Supplier records attached to purchase orders.", ["Price history", "Faster reordering"]),
  p("purchase-approvals-slow", "Inventory & Purchasing", "Purchase approvals are delayed", "Requests wait for the owner to be free.", ["procurement", "approvals"], "PO approval queue with clear pending items.", ["Faster purchasing", "Documented spending"]),
  p("transfers-hard", "Inventory & Purchasing", "Stock transfers are difficult to monitor", "Branch transfers vanish in transit.", ["inventory", "delivery"], "Transfer records with dispatch and receipt status.", ["Accountable transfers", "Less loss"]),
  p("expiry-untracked", "Inventory & Purchasing", "Expired or aging stock is not tracked", "Expiries and dead stock are discovered too late.", ["inventory"], "Expiry dates and aging views on stock records.", ["Less waste", "Freed-up cash"]),

  // ---- Scheduling and Staff ----
  p("appointments-missed", "Scheduling & Staff", "Appointments are missed", "Bookings in notebooks get double-booked or forgotten.", ["booking"], "A shared schedule with confirmations and reminders.", ["Fewer no-shows", "Fuller calendar"]),
  p("schedules-conflict", "Scheduling & Staff", "Staff schedules conflict", "Shifts overlap or leave gaps.", ["scheduling"], "Shift planner with conflict visibility.", ["Full coverage", "Less friction"]),
  p("field-staff-hard", "Scheduling & Staff", "Field employees are difficult to monitor", "Nobody knows where field work stands.", ["delivery", "projects"], "Dispatch board with per-job status updates.", ["Field visibility", "Faster dispatch"]),
  p("attendance-manual", "Scheduling & Staff", "Attendance is recorded manually", "Logbooks invite disputes and errors.", ["scheduling"], "Attendance recorded against scheduled shifts.", ["Clean records", "Fewer disputes"]),
  p("assignments-unclear", "Scheduling & Staff", "Work assignments are unclear", "Staff are unsure what is theirs today.", ["tasks", "scheduling"], "Daily assignments visible to each staff member.", ["Clarity", "Faster starts"]),
  p("no-reminders", "Scheduling & Staff", "Customers do not receive reminders", "No-shows and lapsed renewals go unprompted.", ["booking", "membership"], "Simulated automated reminders before appointments and renewals.", ["Fewer no-shows", "More renewals"]),

  // ---- Finance and Collections ----
  p("payment-status-unclear", "Finance & Collections", "Payment status is unclear", "Who has paid is reconstructed from receipts.", ["billing"], "Billing list with paid, partial, and overdue status.", ["Clear receivables", "Less awkward follow-up"]),
  p("accounts-overdue", "Finance & Collections", "Accounts become overdue", "Overdue balances surface only when cash runs short.", ["billing"], "Overdue accounts highlighted for action.", ["Faster collection", "Healthier cash flow"]),
  p("collection-followups", "Finance & Collections", "Collection follow-ups are inconsistent", "Follow-ups depend on who remembers.", ["billing", "crm"], "Follow-up notes and status per account.", ["Systematic collection", "Better relationships"]),
  p("no-balance-visibility", "Finance & Collections", "Managers cannot see outstanding balances", "Receivables totals require manual tallying.", ["billing", "dashboard"], "Collection summary cards and lists.", ["Instant receivables picture", "Planning confidence"]),
  p("billing-docs-manual", "Finance & Collections", "Billing documents are prepared manually", "Statements are retyped for every client.", ["billing", "quotation"], "Billing records generated from system data.", ["Time saved", "Fewer billing errors"], ["Display/status tracking only — no accounting ledger or tax computation."]),

  // ---- Documents and Compliance ----
  p("docs-incomplete", "Documents & Compliance", "Required documents are incomplete", "Requirements are chased through folders and chats.", ["documents"], "Checklist of required documents per client or job.", ["Complete files", "Faster processing"]),
  p("expiry-missed", "Documents & Compliance", "Expiration dates are missed", "Permits and contracts lapse unnoticed.", ["documents"], "Expiry tracking with upcoming-deadline views.", ["No penalty surprises", "Timely renewals"]),
  p("files-hard-to-find", "Documents & Compliance", "Files are difficult to locate", "Documents are scattered across drives and drawers.", ["documents"], "A searchable document register with owners.", ["Fast retrieval", "Audit readiness"]),
  p("approvals-no-audit", "Documents & Compliance", "Approvals have no audit history", "Nobody can prove who approved what.", ["approvals"], "Every decision recorded with decider and remarks.", ["Accountability", "Dispute protection"]),
  p("certs-unmonitored", "Documents & Compliance", "Staff certifications are not monitored", "Licenses expire without warning.", ["documents"], "Certification records with expiry alerts.", ["Compliance", "Deployment readiness"]),
];

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  "Customer & Sales",
  "Operations",
  "Inventory & Purchasing",
  "Scheduling & Staff",
  "Finance & Collections",
  "Documents & Compliance",
];

export function getProblem(id: string): BusinessProblem | undefined {
  return PROBLEM_CATALOG.find((x) => x.id === id);
}
