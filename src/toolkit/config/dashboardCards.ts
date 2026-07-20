import type { DashboardCardDef } from "../types";

const d = (id: string, label: string, sampleValue: string, relevantModules: DashboardCardDef["relevantModules"]): DashboardCardDef =>
  ({ id, label, sampleValue, relevantModules });

export const DASHBOARD_CARDS: DashboardCardDef[] = [
  d("total-sales", "Total sales", "₱412,500", ["ordering", "dashboard"]),
  d("new-leads", "New leads", "18", ["crm"]),
  d("conversion", "Conversion rate", "32%", ["crm", "dashboard"]),
  d("pending-quotes", "Pending quotations", "6", ["quotation"]),
  d("open-jobs", "Open jobs", "14", ["projects"]),
  d("completed-jobs", "Completed jobs", "52", ["projects"]),
  d("low-stock", "Low-stock items", "7", ["inventory"]),
  d("pending-po", "Pending purchase orders", "3", ["procurement"]),
  d("overdue", "Overdue accounts", "₱86,300", ["billing"]),
  d("appointments", "Today's appointments", "11", ["booking"]),
  d("attendance", "Staff attendance", "18 / 20", ["scheduling"]),
  d("branch-perf", "Branch performance", "Olongapo +12%", ["dashboard"]),
  d("csat", "Customer satisfaction", "4.6 / 5", ["universal", "portal"]),
  d("doc-exp", "Document expirations", "2 this month", ["documents"]),
  d("tickets", "Support tickets", "5 open", ["maintenance"]),
  d("delivery", "Delivery status", "9 in transit", ["delivery"]),
];
