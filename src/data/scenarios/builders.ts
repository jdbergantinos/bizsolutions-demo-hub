import type {
  DemoModuleType,
  ScenarioConfig,
  SeedRecord,
  StatusDef,
  Vocab,
} from "../../types";
import { MODULE_ENGINE } from "../catalog";
import { MODULE_TEMPLATES } from "../serviceTemplates";
import {
  businessName,
  futureDate,
  PAYMENT_METHODS,
  personName,
  pesos,
  phAddress,
  phPhone,
  pick,
  recentDate,
} from "../mock/ph";

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const ASSIGNEE_POOL = [
  "Marco Torres",
  "Liza Ramos",
  "Carlo Domingo",
  "Grace Navarro",
  "Paolo Bautista",
];

const BRANCHES = ["Olongapo", "Subic", "Balanga", "San Fernando"];

// Status sets reused across module builders.
const st = (id: string, label: string, tone: StatusDef["tone"]): StatusDef => ({ id, label, tone });

const STATUS_SETS: Record<string, StatusDef[]> = {
  crm: [
    st("new", "New", "blue"),
    st("contacted", "Contacted", "violet"),
    st("qualified", "Qualified", "amber"),
    st("proposal", "Proposal Sent", "amber"),
    st("won", "Won", "green"),
    st("lost", "Lost", "red"),
  ],
  booking: [
    st("requested", "Requested", "blue"),
    st("confirmed", "Confirmed", "amber"),
    st("completed", "Completed", "green"),
    st("cancelled", "Cancelled", "red"),
  ],
  scheduling: [
    st("scheduled", "Scheduled", "blue"),
    st("present", "Present", "green"),
    st("late", "Late", "amber"),
    st("absent", "Absent", "red"),
  ],
  inventory: [
    st("in-stock", "In Stock", "green"),
    st("low", "Low Stock", "amber"),
    st("out", "Out of Stock", "red"),
  ],
  ordering: [
    st("draft", "Draft", "gray"),
    st("confirmed", "Confirmed", "blue"),
    st("preparing", "Preparing", "amber"),
    st("completed", "Completed", "green"),
    st("cancelled", "Cancelled", "red"),
  ],
  procurement: [
    st("draft", "Draft", "gray"),
    st("for-approval", "For Approval", "blue"),
    st("approved", "Approved", "amber"),
    st("received", "Received", "green"),
    st("rejected", "Rejected", "red"),
  ],
  quotation: [
    st("draft", "Draft", "gray"),
    st("submitted", "Submitted", "blue"),
    st("approved", "Approved", "green"),
    st("rejected", "Rejected", "red"),
  ],
  projects: [
    st("new", "New", "blue"),
    st("in-progress", "In Progress", "amber"),
    st("on-hold", "On Hold", "violet"),
    st("completed", "Completed", "green"),
  ],
  portal: [
    st("open", "Open", "blue"),
    st("in-review", "In Review", "amber"),
    st("answered", "Answered", "violet"),
    st("closed", "Closed", "green"),
  ],
  approvals: [
    st("submitted", "Submitted", "blue"),
    st("under-review", "Under Review", "amber"),
    st("approved", "Approved", "green"),
    st("rejected", "Rejected", "red"),
  ],
  tasks: [
    st("todo", "To Do", "blue"),
    st("in-progress", "In Progress", "amber"),
    st("done", "Done", "green"),
  ],
  documents: [
    st("pending", "Pending", "amber"),
    st("submitted", "Submitted", "blue"),
    st("verified", "Verified", "green"),
    st("expired", "Expired", "red"),
  ],
  delivery: [
    st("preparing", "Preparing", "gray"),
    st("dispatched", "Dispatched", "blue"),
    st("in-transit", "In Transit", "amber"),
    st("delivered", "Delivered", "green"),
    st("failed", "Failed", "red"),
  ],
  maintenance: [
    st("open", "Open", "blue"),
    st("in-progress", "In Progress", "amber"),
    st("resolved", "Resolved", "green"),
    st("closed", "Closed", "gray"),
  ],
  membership: [
    st("active", "Active", "green"),
    st("expiring", "Expiring Soon", "amber"),
    st("expired", "Expired", "red"),
    st("renewed", "Renewed", "blue"),
  ],
  learning: [
    st("enrolled", "Enrolled", "blue"),
    st("in-progress", "In Progress", "amber"),
    st("completed", "Completed", "green"),
    st("dropped", "Dropped", "red"),
  ],
  billing: [
    st("unpaid", "Unpaid", "amber"),
    st("partial", "Partial", "blue"),
    st("paid", "Paid", "green"),
    st("overdue", "Overdue", "red"),
  ],
  production: [
    st("planned", "Planned", "gray"),
    st("in-production", "In Production", "blue"),
    st("qc", "Quality Check", "amber"),
    st("released", "Released", "green"),
  ],
  universal: [
    st("new", "New", "blue"),
    st("in-progress", "In Progress", "amber"),
    st("for-review", "For Review", "violet"),
    st("completed", "Completed", "green"),
  ],
};

function statusCycle(statuses: StatusDef[], i: number): string {
  // Spread seed records across the non-terminal statuses for a lively board.
  return statuses[i % Math.max(statuses.length - 1, 1)].id;
}

/** Builds the default scenario for a module type using the industry's vocabulary. */
export function buildDefaultScenario(
  module: DemoModuleType,
  vocab: Vocab,
  industryName: string,
  key: string,
): ScenarioConfig {
  const engine = MODULE_ENGINE[module];
  const template = MODULE_TEMPLATES[module];
  const Client = cap(vocab.client);
  const Item = cap(vocab.item);
  const Worker = cap(vocab.worker);
  const Job = cap(vocab.job);

  const base = {
    key,
    engine,
    module,
    title: template.label,
    assigneeLabel: Worker,
    assigneeOptions: ASSIGNEE_POOL,
    helpText: `Sample workflow for ${industryName.toLowerCase()}. All records are fictional demo data — try creating, editing, and moving records through each status.`,
    notification: "Record saved successfully.",
  };

  const seeds = (count: number, make: (i: number) => SeedRecord): SeedRecord[] =>
    Array.from({ length: count }, (_, i) => make(i));

  switch (module) {
    case "crm":
      return {
        ...base,
        recordName: "Lead",
        recordNamePlural: "Leads",
        nameField: "name",
        notification: `${Client} lead saved successfully.`,
        fields: [
          { key: "name", label: `${Client} name`, type: "text", required: true },
          { key: "company", label: "Company / group", type: "text" },
          { key: "phone", label: "Mobile number", type: "text", placeholder: "0917 000 0000" },
          { key: "source", label: "Lead source", type: "select", options: ["Facebook", "Referral", "Walk-in", "Website", "Phone inquiry"] },
          { key: "interest", label: "Interested in", type: "text" },
          { key: "value", label: "Estimated value (₱)", type: "currency" },
        ],
        columns: [
          { key: "name", label: Client },
          { key: "phone", label: "Mobile" },
          { key: "source", label: "Source" },
          { key: "value", label: "Est. value" },
        ],
        statuses: STATUS_SETS.crm,
        records: seeds(7, (i) => ({
          values: {
            name: personName(i),
            company: i % 2 === 0 ? businessName(i) : "—",
            phone: phPhone(i),
            source: pick(["Facebook", "Referral", "Walk-in", "Website", "Phone inquiry"], i),
            interest: `${Item} inquiry`,
            value: 15000 + i * 8500,
          },
          status: statusCycle(STATUS_SETS.crm, i),
          assignee: pick(ASSIGNEE_POOL, i),
        })),
      };

    case "booking":
      return {
        ...base,
        recordName: "Booking",
        recordNamePlural: "Bookings",
        nameField: "name",
        dateKey: "date",
        timeKey: "time",
        notification: "Appointment confirmed.",
        fields: [
          { key: "name", label: `${Client} name`, type: "text", required: true },
          { key: "service", label: "Service / purpose", type: "text", required: true },
          { key: "date", label: "Date", type: "date", required: true },
          { key: "time", label: "Time", type: "time" },
          { key: "phone", label: "Mobile number", type: "text" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        columns: [
          { key: "name", label: Client },
          { key: "service", label: "Service" },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
        ],
        statuses: STATUS_SETS.booking,
        records: seeds(6, (i) => ({
          values: {
            name: personName(i + 10),
            service: `${Job} — ${pick(["standard", "priority", "follow-up"], i)}`,
            date: i < 4 ? futureDate(i) : recentDate(i),
            time: pick(["09:00", "10:30", "13:00", "15:30"], i),
            phone: phPhone(i + 4),
            notes: "",
          },
          status: statusCycle(STATUS_SETS.booking, i),
          assignee: pick(ASSIGNEE_POOL, i + 1),
        })),
      };

    case "scheduling":
      return {
        ...base,
        recordName: "Shift",
        recordNamePlural: "Shifts",
        nameField: "name",
        dateKey: "date",
        timeKey: "time",
        title: template.label,
        notification: "Shift schedule updated.",
        fields: [
          { key: "name", label: `${Worker} name`, type: "text", required: true },
          { key: "duty", label: "Duty / post", type: "text", required: true },
          { key: "date", label: "Date", type: "date", required: true },
          { key: "time", label: "Shift time", type: "select", options: ["06:00–14:00", "08:00–17:00", "14:00–22:00", "22:00–06:00"] },
          { key: "location", label: "Location / branch", type: "select", options: BRANCHES },
        ],
        columns: [
          { key: "name", label: Worker },
          { key: "duty", label: "Duty" },
          { key: "date", label: "Date" },
          { key: "time", label: "Shift" },
          { key: "location", label: "Location" },
        ],
        statuses: STATUS_SETS.scheduling,
        records: seeds(6, (i) => ({
          values: {
            name: personName(i + 20),
            duty: pick(["Opening duty", "Counter duty", "Closing duty", "Field duty"], i),
            date: i < 4 ? futureDate(i, 6) : recentDate(i, 5),
            time: pick(["06:00–14:00", "08:00–17:00", "14:00–22:00"], i),
            location: pick(BRANCHES, i),
          },
          status: statusCycle(STATUS_SETS.scheduling, i),
        })),
      };

    case "inventory":
      return {
        ...base,
        recordName: Item,
        recordNamePlural: cap(vocab.items),
        nameField: "name",
        qtyKey: "qty",
        reorderKey: "reorder",
        notification: "Inventory record updated.",
        fields: [
          { key: "name", label: `${Item} name`, type: "text", required: true },
          { key: "category", label: "Category", type: "text" },
          { key: "qty", label: "Quantity on hand", type: "number", required: true },
          { key: "reorder", label: "Reorder level", type: "number", required: true },
          { key: "unit", label: "Unit", type: "text", placeholder: "pcs, box, kg" },
          { key: "supplier", label: "Supplier", type: "text" },
        ],
        columns: [
          { key: "name", label: Item },
          { key: "qty", label: "On hand" },
          { key: "reorder", label: "Reorder at" },
          { key: "supplier", label: "Supplier" },
        ],
        statuses: STATUS_SETS.inventory,
        records: seeds(7, (i) => ({
          values: {
            name: `${Item} ${String.fromCharCode(65 + i)} (Sample)`,
            category: pick(["Fast-moving", "Standard", "Seasonal"], i),
            qty: [48, 6, 0, 120, 14, 3, 75][i],
            reorder: [20, 10, 5, 30, 15, 10, 25][i],
            unit: pick(["pcs", "box", "kg", "pack"], i),
            supplier: businessName(i + 2),
          },
          status: "in-stock",
        })),
      };

    case "ordering":
    case "procurement":
    case "quotation": {
      const isPo = module === "procurement";
      const isQuote = module === "quotation";
      const recordName = isPo ? "Purchase Order" : isQuote ? "Quotation" : "Order";
      const statuses = STATUS_SETS[module];
      const catalog = seedsCatalog(vocab, module);
      return {
        ...base,
        recordName,
        recordNamePlural: recordName + "s",
        nameField: "name",
        catalog,
        catalogLabel: isPo ? `${Item} to purchase` : isQuote ? "Line item" : Item,
        notification: isPo
          ? "Purchase order saved."
          : isQuote
            ? "Quotation submitted for approval."
            : "Order saved successfully.",
        fields: [
          {
            key: "name",
            label: isPo ? "Supplier" : `${Client} name`,
            type: "text",
            required: true,
          },
          { key: "date", label: "Date", type: "date", required: true },
          ...(isPo
            ? []
            : [{ key: "payment", label: "Payment method (display only)", type: "select" as const, options: PAYMENT_METHODS }]),
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        columns: [
          { key: "name", label: isPo ? "Supplier" : Client },
          { key: "date", label: "Date" },
        ],
        statuses,
        records: seeds(5, (i) => ({
          values: {
            name: isPo ? businessName(i + 6) : personName(i + 30),
            date: recentDate(i, 20),
            payment: pick(PAYMENT_METHODS, i),
            notes: "",
          },
          status: statusCycle(statuses, i),
          assignee: pick(ASSIGNEE_POOL, i + 2),
          lineItems: catalog.slice(0, (i % 3) + 1).map((c, j) => ({
            id: `li-${i}-${j}`,
            name: c.name,
            qty: (j % 3) + 1,
            price: c.price,
          })),
        })),
      };
    }

    case "projects":
      return {
        ...base,
        recordName: Job,
        recordNamePlural: cap(vocab.jobs),
        nameField: "name",
        notification: `${Job} updated successfully.`,
        fields: [
          { key: "name", label: `${Job} title`, type: "text", required: true },
          { key: "client", label: Client, type: "text" },
          { key: "start", label: "Start date", type: "date" },
          { key: "due", label: "Target completion", type: "date" },
          { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Urgent"] },
          { key: "details", label: "Details", type: "textarea" },
        ],
        columns: [
          { key: "name", label: Job },
          { key: "client", label: Client },
          { key: "due", label: "Due" },
          { key: "priority", label: "Priority" },
        ],
        statuses: STATUS_SETS.projects,
        records: seeds(6, (i) => ({
          values: {
            name: `${Job} #${1041 + i} (Sample)`,
            client: personName(i + 40),
            start: recentDate(i, 25),
            due: futureDate(i, 20),
            priority: pick(["Low", "Normal", "High", "Urgent"], i),
            details: `Sample ${vocab.job} for demonstration.`,
          },
          status: statusCycle(STATUS_SETS.projects, i),
          assignee: pick(ASSIGNEE_POOL, i),
        })),
      };

    case "portal":
      return {
        ...base,
        recordName: "Request",
        recordNamePlural: "Requests",
        nameField: "name",
        notification: "Request updated — status now visible to the client.",
        fields: [
          { key: "name", label: "Subject", type: "text", required: true },
          { key: "client", label: `${Client} name`, type: "text", required: true },
          { key: "type", label: "Request type", type: "select", options: ["Inquiry", "Status update", "Document request", "Complaint"] },
          { key: "details", label: "Details", type: "textarea" },
        ],
        columns: [
          { key: "name", label: "Subject" },
          { key: "client", label: Client },
          { key: "type", label: "Type" },
        ],
        statuses: STATUS_SETS.portal,
        records: seeds(5, (i) => ({
          values: {
            name: pick(["Status of my request", "Follow-up on pending item", "Copy of record", "Schedule question", "Billing question"], i),
            client: personName(i + 50),
            type: pick(["Inquiry", "Status update", "Document request", "Complaint"], i),
            details: "Sample request for demonstration.",
          },
          status: statusCycle(STATUS_SETS.portal, i),
          assignee: pick(ASSIGNEE_POOL, i + 3),
        })),
      };

    case "approvals":
      return {
        ...base,
        recordName: "Approval Request",
        recordNamePlural: "Approval Requests",
        nameField: "name",
        notification: "Request routed for approval.",
        fields: [
          { key: "name", label: "Request subject", type: "text", required: true },
          { key: "requestedBy", label: "Requested by", type: "text" },
          { key: "amount", label: "Amount involved (₱)", type: "currency" },
          { key: "details", label: "Justification", type: "textarea" },
        ],
        columns: [
          { key: "name", label: "Request" },
          { key: "requestedBy", label: "Requested by" },
          { key: "amount", label: "Amount" },
        ],
        statuses: STATUS_SETS.approvals,
        records: seeds(5, (i) => ({
          values: {
            name: pick(
              ["Budget release request", "Change request", "New application", "Discount approval", "Schedule adjustment"],
              i,
            ),
            requestedBy: personName(i + 60),
            amount: 5000 + i * 12000,
            details: "Sample request for demonstration.",
          },
          status: statusCycle(STATUS_SETS.approvals, i),
          assignee: pick(ASSIGNEE_POOL, i + 1),
        })),
      };

    case "tasks":
      return {
        ...base,
        recordName: "Task",
        recordNamePlural: "Tasks",
        nameField: "name",
        notification: "Task updated successfully.",
        fields: [
          { key: "name", label: "Task", type: "text", required: true },
          { key: "due", label: "Due date", type: "date" },
          { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High"] },
          { key: "details", label: "Details", type: "textarea" },
        ],
        columns: [
          { key: "name", label: "Task" },
          { key: "due", label: "Due" },
          { key: "priority", label: "Priority" },
        ],
        statuses: STATUS_SETS.tasks,
        records: seeds(6, (i) => ({
          values: {
            name: pick(
              ["Opening checklist", "Follow up with " + vocab.client, "Prepare weekly report", "Restock check", "Closing checklist", "Site inspection"],
              i,
            ),
            due: futureDate(i, 7),
            priority: pick(["Low", "Normal", "High"], i),
            details: "Sample task for demonstration.",
          },
          status: statusCycle(STATUS_SETS.tasks, i),
          assignee: pick(ASSIGNEE_POOL, i),
        })),
      };

    case "documents":
      return {
        ...base,
        recordName: "Document",
        recordNamePlural: "Documents",
        nameField: "name",
        notification: "Document status updated.",
        fields: [
          { key: "name", label: "Document name", type: "text", required: true },
          { key: "owner", label: `Related ${vocab.client} / ${vocab.job}`, type: "text" },
          { key: "due", label: "Deadline / expiry", type: "date" },
          { key: "remarks", label: "Remarks", type: "textarea" },
        ],
        columns: [
          { key: "name", label: "Document" },
          { key: "owner", label: "Related to" },
          { key: "due", label: "Deadline" },
        ],
        statuses: STATUS_SETS.documents,
        records: seeds(6, (i) => ({
          values: {
            name: pick(
              ["Business permit", "Contract renewal", "Valid ID copy", "Clearance certificate", "Insurance certificate", "Registration papers"],
              i,
            ),
            owner: i % 2 === 0 ? personName(i + 70) : businessName(i + 8),
            due: i < 4 ? futureDate(i, 30) : recentDate(i, 10),
            remarks: "Sample document requirement.",
          },
          status: statusCycle(STATUS_SETS.documents, i),
          assignee: pick(ASSIGNEE_POOL, i + 2),
        })),
      };

    case "delivery":
      return {
        ...base,
        recordName: "Delivery",
        recordNamePlural: "Deliveries",
        nameField: "name",
        assigneeLabel: "Driver / rider",
        notification: "Delivery status updated.",
        fields: [
          { key: "name", label: `${Client} / reference`, type: "text", required: true },
          { key: "destination", label: "Destination", type: "text", required: true },
          { key: "date", label: "Delivery date", type: "date" },
          { key: "load", label: "Items / load", type: "text" },
          { key: "pod", label: "Proof of delivery notes", type: "textarea" },
        ],
        columns: [
          { key: "name", label: "Reference" },
          { key: "destination", label: "Destination" },
          { key: "date", label: "Date" },
        ],
        statuses: STATUS_SETS.delivery,
        records: seeds(6, (i) => ({
          values: {
            name: `DR-${2300 + i} · ${personName(i + 80)}`,
            destination: phAddress(i),
            date: i < 3 ? futureDate(i, 5) : recentDate(i, 5),
            load: `${(i % 4) + 1} × ${vocab.items}`,
            pod: i >= 4 ? "Received in good condition." : "",
          },
          status: statusCycle(STATUS_SETS.delivery, i),
          assignee: pick(ASSIGNEE_POOL, i),
        })),
      };

    case "maintenance":
      return {
        ...base,
        recordName: "Ticket",
        recordNamePlural: "Tickets",
        nameField: "name",
        notification: "Ticket updated successfully.",
        fields: [
          { key: "name", label: "Issue summary", type: "text", required: true },
          { key: "reportedBy", label: "Reported by", type: "text" },
          { key: "asset", label: "Asset / location", type: "text" },
          { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Critical"] },
          { key: "details", label: "Details", type: "textarea" },
        ],
        columns: [
          { key: "name", label: "Issue" },
          { key: "reportedBy", label: "Reported by" },
          { key: "priority", label: "Priority" },
        ],
        statuses: STATUS_SETS.maintenance,
        records: seeds(6, (i) => ({
          values: {
            name: pick(
              ["Aircon not cooling", "Leak reported", "Equipment breakdown", "Request for check-up", "Noise complaint", "Preventive maintenance due"],
              i,
            ),
            reportedBy: personName(i + 90),
            asset: pick(["Unit 2F", "Main area", "Branch — Subic", "Equipment #7", "Front desk"], i),
            priority: pick(["Low", "Normal", "High", "Critical"], i),
            details: "Sample ticket for demonstration.",
          },
          status: statusCycle(STATUS_SETS.maintenance, i),
          assignee: pick(ASSIGNEE_POOL, i + 1),
        })),
      };

    case "membership":
      return {
        ...base,
        recordName: "Member",
        recordNamePlural: "Members",
        nameField: "name",
        notification: "Membership record updated.",
        fields: [
          { key: "name", label: `${Client} name`, type: "text", required: true },
          { key: "plan", label: "Plan / package", type: "select", options: ["Basic", "Standard", "Premium", "Package of 10"] },
          { key: "start", label: "Start date", type: "date" },
          { key: "expiry", label: "Expiry / renewal date", type: "date" },
          { key: "balance", label: "Points / sessions left", type: "number" },
        ],
        columns: [
          { key: "name", label: Client },
          { key: "plan", label: "Plan" },
          { key: "expiry", label: "Renewal" },
          { key: "balance", label: "Balance" },
        ],
        statuses: STATUS_SETS.membership,
        records: seeds(6, (i) => ({
          values: {
            name: personName(i + 100),
            plan: pick(["Basic", "Standard", "Premium", "Package of 10"], i),
            start: recentDate(i, 60),
            expiry: i < 4 ? futureDate(i, 40) : recentDate(i, 5),
            balance: [12, 3, 0, 25, 1, 8][i],
          },
          status: statusCycle(STATUS_SETS.membership, i),
        })),
      };

    case "learning":
      return {
        ...base,
        recordName: "Enrollment",
        recordNamePlural: "Enrollments",
        nameField: "name",
        notification: "Enrollment record updated.",
        fields: [
          { key: "name", label: `${Client} name`, type: "text", required: true },
          { key: "program", label: "Program / course", type: "text", required: true },
          { key: "batch", label: "Batch / schedule", type: "text" },
          { key: "start", label: "Start date", type: "date" },
          { key: "progress", label: "Progress", type: "select", options: ["0%", "25%", "50%", "75%", "100%"] },
        ],
        columns: [
          { key: "name", label: Client },
          { key: "program", label: "Program" },
          { key: "batch", label: "Batch" },
          { key: "progress", label: "Progress" },
        ],
        statuses: STATUS_SETS.learning,
        records: seeds(6, (i) => ({
          values: {
            name: personName(i + 110),
            program: pick(["Foundations Program", "Advanced Track", "Review Batch A", "Weekend Program"], i),
            batch: `Batch ${2026 - (i % 2)}-${(i % 3) + 1}`,
            start: recentDate(i, 45),
            progress: pick(["0%", "25%", "50%", "75%", "100%"], i),
          },
          status: statusCycle(STATUS_SETS.learning, i),
          assignee: pick(ASSIGNEE_POOL, i + 2),
        })),
      };

    case "billing":
      return {
        ...base,
        recordName: "Billing",
        recordNamePlural: "Billings",
        nameField: "name",
        notification: "Collection status updated.",
        fields: [
          { key: "name", label: `${Client} name`, type: "text", required: true },
          { key: "reference", label: "Reference no.", type: "text" },
          { key: "amount", label: "Amount (₱)", type: "currency", required: true },
          { key: "due", label: "Due date", type: "date" },
          { key: "method", label: "Payment method (display only)", type: "select", options: PAYMENT_METHODS },
        ],
        columns: [
          { key: "name", label: Client },
          { key: "reference", label: "Ref no." },
          { key: "amount", label: "Amount" },
          { key: "due", label: "Due" },
        ],
        statuses: STATUS_SETS.billing,
        records: seeds(6, (i) => ({
          values: {
            name: i % 2 === 0 ? personName(i + 120) : businessName(i + 12),
            reference: `INV-${5400 + i}`,
            amount: 3500 + i * 4200,
            due: i < 3 ? futureDate(i, 15) : recentDate(i, 20),
            method: pick(PAYMENT_METHODS, i),
          },
          status: statusCycle(STATUS_SETS.billing, i),
        })),
      };

    case "production":
      return {
        ...base,
        recordName: "Batch",
        recordNamePlural: "Batches",
        nameField: "name",
        notification: "Batch record updated.",
        fields: [
          { key: "name", label: "Batch / product", type: "text", required: true },
          { key: "target", label: "Target output", type: "number" },
          { key: "output", label: "Actual output", type: "number" },
          { key: "rejects", label: "Rejects", type: "number" },
          { key: "date", label: "Production date", type: "date" },
        ],
        columns: [
          { key: "name", label: "Batch" },
          { key: "target", label: "Target" },
          { key: "output", label: "Output" },
          { key: "rejects", label: "Rejects" },
        ],
        statuses: STATUS_SETS.production,
        records: seeds(5, (i) => ({
          values: {
            name: `BATCH-${700 + i} · ${Item} (Sample)`,
            target: 500 + i * 100,
            output: i < 2 ? 0 : 480 + i * 95,
            rejects: i < 2 ? 0 : 5 + i,
            date: recentDate(i, 10),
          },
          status: statusCycle(STATUS_SETS.production, i),
          assignee: pick(ASSIGNEE_POOL, i),
        })),
      };

    case "dashboard":
      return {
        ...base,
        recordName: "Record",
        recordNamePlural: "Records",
        nameField: "name",
        fields: [],
        columns: [],
        statuses: STATUS_SETS.universal,
        records: [],
        dashboard: {
          cards: [
            { label: "Sales this month", value: pesos(412500), sub: "+12% vs last month" },
            { label: `Active ${vocab.jobs}`, value: "23", sub: "4 due this week" },
            { label: `${cap(vocab.clients)} served`, value: "148", sub: "This month" },
            { label: "Pending follow-ups", value: "9", sub: "Needs attention" },
          ],
          barTitle: "Performance by branch (₱ thousands)",
          bar: BRANCHES.map((b, i) => ({ label: b, value: [420, 310, 265, 380][i], value2: [380, 290, 300, 350][i] })),
          lineTitle: "6-month trend (₱ thousands)",
          line: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m, i) => ({
            label: m,
            value: [280, 310, 295, 350, 390, 412][i],
          })),
          pieTitle: `${Job} status mix`,
          pie: [
            { label: "Completed", value: 58 },
            { label: "In progress", value: 27 },
            { label: "On hold", value: 9 },
            { label: "Cancelled", value: 6 },
          ],
        },
      };

    case "universal":
    default:
      return {
        ...base,
        recordName: "Record",
        recordNamePlural: "Records",
        nameField: "name",
        notification: "Record saved successfully.",
        fields: [
          { key: "name", label: "Record title", type: "text", required: true },
          { key: "client", label: `Related ${vocab.client}`, type: "text" },
          { key: "date", label: "Date", type: "date" },
          { key: "details", label: "Details", type: "textarea" },
        ],
        columns: [
          { key: "name", label: "Record" },
          { key: "client", label: cap(vocab.client) },
          { key: "date", label: "Date" },
        ],
        statuses: STATUS_SETS.universal,
        records: seeds(5, (i) => ({
          values: {
            name: `${cap(vocab.job)} record #${300 + i} (Sample)`,
            client: personName(i + 130),
            date: recentDate(i, 15),
            details: "Sample record for demonstration.",
          },
          status: statusCycle(STATUS_SETS.universal, i),
          assignee: pick(ASSIGNEE_POOL, i + 1),
        })),
      };
  }
}

function seedsCatalog(vocab: Vocab, module: "ordering" | "procurement" | "quotation") {
  const Item = cap(vocab.item);
  if (module === "quotation") {
    return [
      { name: "Site assessment / consultation", price: 3500 },
      { name: "Standard package", price: 25000 },
      { name: "Premium package", price: 48000 },
      { name: "Add-on service", price: 6500 },
      { name: "Rush fee", price: 2500 },
    ];
  }
  return [
    { name: `${Item} — Standard (Sample)`, price: 250 },
    { name: `${Item} — Premium (Sample)`, price: 480 },
    { name: `${Item} — Bundle of 5 (Sample)`, price: 1100 },
    { name: `${Item} — Economy (Sample)`, price: 120 },
    { name: `${Item} — Bulk box (Sample)`, price: 2400 },
  ];
}
