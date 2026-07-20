import type { RoleView } from "../types";

// Role-perspective configurations for the presentation's role-views section.
// Permissions shown are CONCEPTUAL demo behavior, not production-grade
// access control — every role card carries that label in the UI.

const r = (
  id: string,
  name: string,
  description: string,
  dashboardCards: string[],
  menuItems: string[],
  visibleRecords: string,
  allowedActions: string[],
  notifications: string[],
  primaryWorkflow: string,
): RoleView => ({ id, name, description, dashboardCards, menuItems, visibleRecords, allowedActions, notifications, primaryWorkflow });

export const DEFAULT_ROLES: RoleView[] = [
  r("owner", "Owner", "Sees the whole business at a glance.",
    ["Sales this month", "Active jobs", "Overdue accounts", "Branch comparison"],
    ["Dashboard", "Reports", "All records", "Settings"],
    "All records across all branches",
    ["View everything", "Approve high-value items", "Export summaries"],
    ["Daily summary", "Large transactions", "Critical issues"],
    "Review dashboard → drill into a concern → assign follow-up"),
  r("manager", "Manager", "Runs day-to-day operations for a branch or team.",
    ["Today's jobs", "Pending approvals", "Team workload", "Late items"],
    ["Jobs", "Approvals", "Schedules", "Team reports"],
    "All records in their branch or team",
    ["Assign work", "Approve requests", "Update statuses", "Add records"],
    ["Approval requests", "Overdue jobs", "Attendance exceptions"],
    "Check queue → assign and approve → monitor progress"),
  r("admin", "Administrator", "Keeps records, documents, and billing tidy.",
    ["New records today", "Incomplete documents", "Unbilled items"],
    ["Records", "Documents", "Billing status"],
    "Administrative records; no management dashboards",
    ["Create and edit records", "Track documents", "Update billing status"],
    ["Missing requirements", "Upcoming expirations"],
    "Encode → verify requirements → keep statuses current"),
  r("staff", "Staff", "Works the queue assigned to them.",
    ["My tasks today", "My schedule"],
    ["My tasks", "My schedule"],
    "Only records assigned to them",
    ["Update own tasks", "Add notes", "Mark complete"],
    ["New assignments", "Schedule changes"],
    "Open my list → do the work → mark complete"),
  r("sales", "Salesperson", "Owns leads and follow-ups.",
    ["My leads", "Follow-ups due", "My quotations"],
    ["Leads", "Quotations", "Customers"],
    "Their own leads and customers",
    ["Add leads", "Log follow-ups", "Draft quotations"],
    ["Follow-up reminders", "Quotation approvals"],
    "Capture lead → follow up → quote → close"),
  r("technician", "Technician", "Executes field or shop jobs.",
    ["My jobs today", "Parts needed"],
    ["My jobs", "Job details"],
    "Jobs assigned to them",
    ["Update job status", "Add findings", "Request parts"],
    ["New job assignments", "Schedule changes"],
    "Receive job → work → update status → complete"),
  r("customer", "Customer", "The client's customer, kept informed automatically.",
    ["My requests", "Status updates"],
    ["My requests", "History"],
    "Only their own transactions",
    ["Submit requests", "View status", "Receive simulated notifications"],
    ["Booking confirmations", "Status updates", "Reminders"],
    "Request → get confirmation → track status → receive service"),
  r("portal-user", "Client portal user", "External partner or member with self-service access.",
    ["My account", "Open requests"],
    ["Portal home", "Requests", "Documents"],
    "Their own account records",
    ["Submit and track requests", "View shared documents"],
    ["Request updates", "Document approvals"],
    "Log in concept → submit → track → receive updates"),
];

/** Industry-specific role names (fall back to DEFAULT_ROLES elsewhere). */
export const INDUSTRY_ROLES: Record<string, { roleId: string; name: string }[]> = {
  automotive: [
    { roleId: "owner", name: "Owner" },
    { roleId: "sales", name: "Service adviser" },
    { roleId: "technician", name: "Mechanic" },
    { roleId: "admin", name: "Cashier" },
    { roleId: "customer", name: "Customer" },
  ],
  retail: [
    { roleId: "owner", name: "Owner" },
    { roleId: "manager", name: "Branch manager" },
    { roleId: "admin", name: "Cashier" },
    { roleId: "staff", name: "Inventory staff" },
    { roleId: "customer", name: "Customer" },
  ],
  realestate: [
    { roleId: "owner", name: "Broker" },
    { roleId: "manager", name: "Sales manager" },
    { roleId: "sales", name: "Agent" },
    { roleId: "admin", name: "Administrator" },
    { roleId: "customer", name: "Buyer" },
  ],
  professional: [
    { roleId: "owner", name: "Firm owner" },
    { roleId: "manager", name: "Project manager" },
    { roleId: "staff", name: "Consultant" },
    { roleId: "admin", name: "Administrator" },
    { roleId: "customer", name: "Client" },
  ],
  food: [
    { roleId: "owner", name: "Owner" },
    { roleId: "manager", name: "Branch manager" },
    { roleId: "staff", name: "Crew" },
    { roleId: "admin", name: "Cashier" },
    { roleId: "customer", name: "Customer" },
  ],
};

/** Roles for an industry: industry-specific names where defined, defaults otherwise. */
export function getRolesForIndustry(industryId: string | undefined): RoleView[] {
  const mapping = industryId ? INDUSTRY_ROLES[industryId] : undefined;
  if (!mapping) return DEFAULT_ROLES.slice(0, 5);
  return mapping
    .map(({ roleId, name }) => {
      const base = DEFAULT_ROLES.find((x) => x.id === roleId);
      return base ? { ...base, name } : null;
    })
    .filter((x): x is RoleView => x !== null);
}
