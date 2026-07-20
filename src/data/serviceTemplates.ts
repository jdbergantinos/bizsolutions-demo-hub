import type { DemoModuleType, Vocab } from "../types";

// Each of the 20 reusable demo module types has one content template.
// Placeholders like {clients} or {items} are replaced with each industry's
// own vocabulary, so a booking offer reads "guests" for hotels but
// "patients" for clinics without duplicating content.

export interface ModuleTemplate {
  label: string;
  shortDesc: string;
  problem: string;
  solution: string;
  benefits: string[];
  functions: string[];
  workflow: string[];
  screens: string[];
}

export function interpolate(text: string, vocab: Vocab, industryName: string): string {
  return text
    .replaceAll("{clients}", vocab.clients)
    .replaceAll("{client}", vocab.client)
    .replaceAll("{items}", vocab.items)
    .replaceAll("{item}", vocab.item)
    .replaceAll("{workers}", vocab.workers)
    .replaceAll("{worker}", vocab.worker)
    .replaceAll("{jobs}", vocab.jobs)
    .replaceAll("{job}", vocab.job)
    .replaceAll("{business}", vocab.business)
    .replaceAll("{industry}", industryName.toLowerCase());
}

export const MODULE_TEMPLATES: Record<DemoModuleType, ModuleTemplate> = {
  crm: {
    label: "CRM & Lead Management",
    shortDesc: "Track {clients} and inquiries from first contact to closed deal.",
    problem:
      "Inquiries from {clients} arrive through calls, texts, and social media, then get lost in personal phones and notebooks. Nobody can see which leads were followed up, which went cold, or why deals were lost.",
    solution:
      "A central lead pipeline where every inquiry becomes a trackable record. Staff move leads through clear stages, log follow-ups, and management sees the whole funnel at a glance.",
    benefits: [
      "Fewer lost or forgotten inquiries",
      "Clear follow-up accountability per {worker}",
      "Visibility into which lead sources convert",
      "Faster response times to new {clients}",
    ],
    functions: [
      "Capture new leads with contact details and source",
      "Move leads across pipeline stages",
      "Assign leads to a responsible {worker}",
      "Log notes and follow-up history",
      "Search and filter the pipeline",
      "Review conversion summary cards",
    ],
    workflow: [
      "Receive a new inquiry",
      "Create the lead record",
      "Assign a {worker} to follow up",
      "Log contact attempts and notes",
      "Move the lead through qualification",
      "Mark the lead as won or lost",
      "Review pipeline totals",
    ],
    screens: ["Pipeline board", "Lead form", "Lead detail with notes and history", "Summary cards"],
  },
  booking: {
    label: "Booking & Scheduling",
    shortDesc: "Let {clients} book schedules that staff can confirm and manage.",
    problem:
      "Bookings from {clients} are kept in paper logbooks or group chats. Double-bookings, missed appointments, and unanswered requests damage trust and waste capacity.",
    solution:
      "A booking calendar where requests become confirmed schedules with assigned {workers}, automatic status tracking, and simulated reminders.",
    benefits: [
      "Fewer double-bookings and no-shows",
      "Faster confirmation for {clients}",
      "Balanced workload across {workers}",
      "A clear day-by-day schedule view",
    ],
    functions: [
      "Create bookings with date and time",
      "Confirm, complete, or cancel bookings",
      "Assign a {worker} to each booking",
      "View schedules grouped by day",
      "Search and filter bookings",
      "Show simulated confirmations and reminders",
    ],
    workflow: [
      "Receive a booking request",
      "Check the schedule for conflicts",
      "Create the booking",
      "Assign a {worker}",
      "Confirm the appointment",
      "Complete the appointment",
      "Record feedback or follow-up",
    ],
    screens: ["Schedule list by day", "Booking form", "Booking detail", "Status summary"],
  },
  inventory: {
    label: "Inventory & Stock Monitoring",
    shortDesc: "Monitor {items}, stock levels, and reorder points in real time.",
    problem:
      "Stock counts for {items} live in spreadsheets updated days late. Shortages are discovered only when a {client} is already waiting, while slow-moving stock quietly ties up cash.",
    solution:
      "A live stock list with quantities, reorder levels, and low-stock alerts. Staff record stock movements as they happen so the numbers stay trustworthy.",
    benefits: [
      "Early low-stock warnings before stock-outs",
      "Less over-ordering and expired or dead stock",
      "One trusted stock list across the {business}",
      "Faster stock counts and audits",
    ],
    functions: [
      "Maintain a master list of {items}",
      "Record stock-in and stock-out adjustments",
      "Flag {items} at or below reorder level",
      "Search and filter by category or supplier",
      "Track supplier per {item}",
      "Review stock summary cards",
    ],
    workflow: [
      "Register {items} with reorder levels",
      "Receive deliveries and add stock",
      "Deduct stock as {items} are used or sold",
      "Review the low-stock alert list",
      "Prepare a reorder request",
      "Confirm replenishment",
    ],
    screens: ["Stock list with alerts", "Item form", "Adjustment dialog", "Stock summary cards"],
  },
  ordering: {
    label: "Ordering & Sales",
    shortDesc: "Capture orders from {clients} with line items and running totals.",
    problem:
      "Orders arrive by text and chat, get re-typed into notebooks, and errors creep in. Nobody is sure which orders are paid, packed, or delivered.",
    solution:
      "An order workbench where staff build orders line by line, totals compute automatically, and each order moves through clear fulfillment statuses.",
    benefits: [
      "Fewer order-taking errors",
      "Clear order status for every {client}",
      "Automatic peso totals per order",
      "A daily sales picture without manual tallies",
    ],
    functions: [
      "Create orders for {clients}",
      "Add line items with quantities and prices",
      "Compute totals automatically",
      "Move orders through fulfillment statuses",
      "Search and filter orders",
      "Review sales summary cards",
    ],
    workflow: [
      "Receive an order from a {client}",
      "Encode line items",
      "Confirm the total",
      "Prepare the order",
      "Hand off for delivery or pickup",
      "Mark the order completed",
      "Review sales totals",
    ],
    screens: ["Order list", "Order form with line items", "Order detail", "Sales summary"],
  },
  procurement: {
    label: "Procurement & Purchase Orders",
    shortDesc: "Raise, approve, and receive purchase orders for {items}.",
    problem:
      "Purchases are requested verbally and approved informally, so the {business} loses track of what was ordered, at what price, and whether it ever arrived.",
    solution:
      "A purchase-order workflow: requests become PO records with line items and totals, pass through approval, and are marked received when deliveries arrive.",
    benefits: [
      "Every purchase documented with an approver",
      "Fewer duplicate or forgotten orders",
      "Price history per supplier",
      "Clear list of pending deliveries",
    ],
    functions: [
      "Create purchase orders with line items",
      "Route POs for approval",
      "Approve or reject with remarks",
      "Track expected deliveries",
      "Mark POs as received",
      "Review purchasing summary cards",
    ],
    workflow: [
      "Identify {items} to purchase",
      "Create the purchase order",
      "Submit for approval",
      "Approve or reject",
      "Send to the supplier",
      "Receive the delivery",
      "Close the purchase order",
    ],
    screens: ["PO list", "PO form with line items", "Approval view", "Purchasing summary"],
  },
  quotation: {
    label: "Quotation & Proposal Management",
    shortDesc: "Prepare itemized quotations for {clients} with approval tracking.",
    problem:
      "Quotations are built ad hoc in chat or reused spreadsheets — inconsistent pricing, missing follow-ups, and no record of which quotes were approved, revised, or lost.",
    solution:
      "A quotation builder with line items and automatic totals. Each quotation moves through draft, submitted, approved, or rejected so nothing stalls silently.",
    benefits: [
      "Consistent, professional quotations",
      "A follow-up list of pending quotes",
      "Win/loss visibility per quotation",
      "Faster turnaround from inquiry to quote",
    ],
    functions: [
      "Create quotations for {clients}",
      "Add line items with automatic peso totals",
      "Submit quotations for approval",
      "Approve, reject, or revise",
      "Track quotation status and history",
      "Review quotation summary cards",
    ],
    workflow: [
      "Receive an inquiry from a {client}",
      "Draft the quotation with line items",
      "Review the computed total",
      "Submit for internal approval",
      "Send to the {client}",
      "Record approval or rejection",
      "Convert to a {job} when approved",
    ],
    screens: ["Quotation list", "Quotation builder", "Approval view", "Quotation summary"],
  },
  projects: {
    label: "Project & Job-Order Tracking",
    shortDesc: "Track {jobs} from start to completion with clear stages.",
    problem:
      "Ongoing {jobs} are tracked in the owner's head and scattered chats. {clients} ask for updates nobody can answer quickly, and delays surface too late.",
    solution:
      "A job board where every {job} has an assigned {worker}, a current stage, notes, and a full activity history from start to completion.",
    benefits: [
      "Instant answers to \"what's the status?\"",
      "Early warning on stalled {jobs}",
      "Accountability per assigned {worker}",
      "A record of every {job} for future reference",
    ],
    functions: [
      "Create {job} records with details",
      "Assign a responsible {worker}",
      "Update stages as work progresses",
      "Log notes, issues, and updates",
      "Search and filter active {jobs}",
      "Review workload summary cards",
    ],
    workflow: [
      "Open a new {job}",
      "Assign the {worker} in charge",
      "Start the work",
      "Log progress updates",
      "Flag and resolve issues",
      "Complete the {job}",
      "Notify the {client}",
    ],
    screens: ["Job list", "Job form", "Job detail with activity", "Workload summary"],
  },
  portal: {
    label: "Client / Member Portal",
    shortDesc: "Give {clients} a self-service view of their requests and status.",
    problem:
      "{clients} call and message repeatedly just to ask for updates, eating staff time. Information given out is inconsistent because it comes from memory.",
    solution:
      "A portal-style request tracker: each {client} request is a record with a visible status, so staff update once and everyone sees the same answer.",
    benefits: [
      "Fewer repetitive status calls",
      "Consistent answers for every {client}",
      "A log of all {client} requests",
      "More professional client experience",
    ],
    functions: [
      "Register {client} accounts",
      "Log requests and inquiries",
      "Update request status visibly",
      "Post replies and remarks",
      "Search requests by {client}",
      "Review request summary cards",
    ],
    workflow: [
      "Register the {client}",
      "Receive a request",
      "Acknowledge and assign it",
      "Work on the request",
      "Post the update",
      "Close the request",
    ],
    screens: ["Request list", "Request form", "Request detail", "Portal summary"],
  },
  approvals: {
    label: "Approval Workflow",
    shortDesc: "Route requests for approval with a clear decision trail.",
    problem:
      "Approvals happen verbally or in chat threads that scroll away. Nobody can prove who approved what, and requests stall with no visible owner.",
    solution:
      "A request queue where each item moves through submitted, under review, approved, or rejected — with the decision, decider, and remarks recorded.",
    benefits: [
      "A documented decision trail",
      "No more stalled, invisible requests",
      "Clear pending queue per approver",
      "Faster turnaround on routine approvals",
    ],
    functions: [
      "Submit requests with details",
      "Route to the right approver",
      "Approve or reject with remarks",
      "Track pending and overdue requests",
      "Search the approval history",
      "Review approval summary cards",
    ],
    workflow: [
      "Submit the request",
      "Route to the approver",
      "Review the details",
      "Approve or reject with remarks",
      "Notify the requester",
      "Archive the decision",
    ],
    screens: ["Approval queue", "Request form", "Decision view", "Approval summary"],
  },
  scheduling: {
    label: "Employee Scheduling & Attendance",
    shortDesc: "Plan shifts for {workers} and track attendance records.",
    problem:
      "Duty schedules for {workers} are drawn on whiteboards and revised by text. Gaps, double-shifts, and disputed attendance are constant friction.",
    solution:
      "A shift planner where each {worker} has assigned duties and attendance status, giving supervisors a live picture of coverage.",
    benefits: [
      "No more coverage gaps and shift clashes",
      "Clean attendance records per {worker}",
      "Fair, visible shift distribution",
      "Less time spent building schedules",
    ],
    functions: [
      "Create shift assignments",
      "Assign {workers} to duties and locations",
      "Mark present, late, or absent",
      "Filter schedules by day or {worker}",
      "Log schedule-change notes",
      "Review coverage summary cards",
    ],
    workflow: [
      "Plan the week's shifts",
      "Assign {workers}",
      "Publish the schedule",
      "Record attendance",
      "Handle change requests",
      "Review coverage and attendance",
    ],
    screens: ["Shift list", "Shift form", "Attendance view", "Coverage summary"],
  },
  tasks: {
    label: "Task & Checklist Management",
    shortDesc: "Assign tasks and checklists to {workers} and track completion.",
    problem:
      "Daily tasks are given verbally and forgotten. Recurring checklists — opening, closing, inspections — are skipped with no record of who did what.",
    solution:
      "A task board where work is assigned to {workers}, ticked off when done, and visible to supervisors in real time.",
    benefits: [
      "Nothing assigned gets forgotten",
      "Proof that routine checklists were completed",
      "Clear workload view per {worker}",
      "Faster daily coordination",
    ],
    functions: [
      "Create tasks with due dates",
      "Assign tasks to {workers}",
      "Mark tasks in progress or done",
      "Add remarks and blockers",
      "Filter by status or {worker}",
      "Review completion summary cards",
    ],
    workflow: [
      "List the day's tasks",
      "Assign each task",
      "Work through the list",
      "Flag blockers",
      "Mark tasks complete",
      "Review completion rates",
    ],
    screens: ["Task board", "Task form", "Task detail", "Completion summary"],
  },
  documents: {
    label: "Document & Compliance Tracking",
    shortDesc: "Track required documents, deadlines, and renewal status.",
    problem:
      "Permits, contracts, and required documents expire unnoticed until a renewal scramble — or a penalty. Requirements per {client} are chased through folders and chats.",
    solution:
      "A document register with owners, due dates, and statuses, so upcoming expirations and missing requirements surface before they become emergencies.",
    benefits: [
      "No surprise expirations or penalties",
      "A complete checklist per {client} or {job}",
      "Clear ownership of each requirement",
      "Faster audits and renewals",
    ],
    functions: [
      "Register documents with due dates",
      "Track submitted, pending, and expired items",
      "Assign a responsible {worker}",
      "Attach remarks per document",
      "Filter by status and deadline",
      "Review compliance summary cards",
    ],
    workflow: [
      "List required documents",
      "Assign owners and deadlines",
      "Collect and mark submissions",
      "Monitor upcoming expirations",
      "Renew before the deadline",
      "Archive completed requirements",
    ],
    screens: ["Document register", "Document form", "Deadline view", "Compliance summary"],
  },
  delivery: {
    label: "Delivery & Dispatch",
    shortDesc: "Dispatch deliveries, assign drivers, and track proof of delivery.",
    problem:
      "Dispatch runs on phone calls. Nobody knows which deliveries are on the road, which failed, or whether the {client} actually received the {items}.",
    solution:
      "A dispatch board where each delivery has an assigned driver, live status from preparing to delivered, and a recorded proof-of-delivery note.",
    benefits: [
      "Live visibility of every delivery",
      "Documented proof of delivery",
      "Fewer failed or forgotten deliveries",
      "Better driver accountability",
    ],
    functions: [
      "Create delivery jobs with destinations",
      "Assign drivers or riders",
      "Update status en route",
      "Record proof-of-delivery remarks",
      "Search deliveries by {client}",
      "Review dispatch summary cards",
    ],
    workflow: [
      "Create the delivery job",
      "Assign the driver",
      "Dispatch the vehicle",
      "Update status on the road",
      "Record proof of delivery",
      "Close the delivery",
    ],
    screens: ["Dispatch board", "Delivery form", "Delivery detail", "Dispatch summary"],
  },
  maintenance: {
    label: "Maintenance & Support Ticketing",
    shortDesc: "Log issues as tickets and track them to resolution.",
    problem:
      "Breakdowns and complaints are reported in passing and fixed from memory. Recurring issues repeat because there is no history of what broke and what was done.",
    solution:
      "A ticketing queue where every issue is logged, prioritized, assigned to a {worker}, and closed with a resolution note — building a searchable history.",
    benefits: [
      "No reported issue slips through",
      "Repair history per asset or {client}",
      "Clear priorities for the team",
      "Data to spot recurring problems",
    ],
    functions: [
      "Log tickets with priority levels",
      "Assign tickets to {workers}",
      "Track open, in-progress, and resolved states",
      "Record resolution notes",
      "Filter by priority and status",
      "Review ticket summary cards",
    ],
    workflow: [
      "Receive the issue report",
      "Create and prioritize the ticket",
      "Assign a {worker}",
      "Diagnose and fix",
      "Record the resolution",
      "Close and confirm with the {client}",
    ],
    screens: ["Ticket queue", "Ticket form", "Ticket detail", "Ticket summary"],
  },
  membership: {
    label: "Loyalty, Packages & Membership",
    shortDesc: "Track members, packages, points, and renewals for {clients}.",
    problem:
      "Member lists, package balances, and loyalty points live in notebooks. {clients} dispute balances, renewals lapse silently, and repeat business is left to chance.",
    solution:
      "A membership register tracking each {client}'s plan, remaining sessions or points, and renewal status — with expiring memberships surfaced automatically.",
    benefits: [
      "Accurate package and points balances",
      "Renewal reminders before lapse",
      "More repeat visits from {clients}",
      "A clean, searchable member list",
    ],
    functions: [
      "Register members and plans",
      "Track package usage or points",
      "Monitor renewal dates",
      "Mark renewals and upgrades",
      "Search and filter members",
      "Review membership summary cards",
    ],
    workflow: [
      "Enroll the {client}",
      "Activate the plan or package",
      "Record each visit or redemption",
      "Watch for expiring plans",
      "Send a simulated renewal reminder",
      "Renew or close the membership",
    ],
    screens: ["Member list", "Member form", "Member detail", "Membership summary"],
  },
  learning: {
    label: "Learning, Enrollment & Training",
    shortDesc: "Manage enrollments, sessions, and completion for {clients}.",
    problem:
      "Enrollment lists, attendance, and completion records are scattered across sheets. Certificates and follow-ups depend on someone remembering.",
    solution:
      "An enrollment tracker covering registration, session attendance, progress, and completion status for every enrolled {client}.",
    benefits: [
      "Clean enrollment and attendance records",
      "Clear progress view per {client}",
      "No missed completions or certificates",
      "Simple reporting per batch or class",
    ],
    functions: [
      "Register enrollees per program",
      "Track attendance and progress",
      "Mark completions",
      "Log remarks per enrollee",
      "Filter by program and status",
      "Review enrollment summary cards",
    ],
    workflow: [
      "Receive the enrollment",
      "Confirm the slot and schedule",
      "Track session attendance",
      "Monitor progress",
      "Mark completion",
      "Issue the certificate record",
    ],
    screens: ["Enrollment list", "Enrollment form", "Progress view", "Enrollment summary"],
  },
  billing: {
    label: "Billing & Collection Monitoring",
    shortDesc: "Monitor billed amounts and collection status per {client}.",
    problem:
      "Who owes what is reconstructed from receipts and memory. Follow-ups are awkward and late, and overdue accounts surface only when cash runs short.",
    solution:
      "A billing monitor listing each charge, its peso amount, due date, and collection status — with overdue accounts highlighted for follow-up. Display-only: no real payments are processed.",
    benefits: [
      "A live list of outstanding balances",
      "Earlier, systematic follow-ups",
      "Fewer forgotten or disputed charges",
      "A clearer collection picture for planning",
    ],
    functions: [
      "Record billings with amounts and due dates",
      "Track paid, partial, and overdue status",
      "Log follow-up notes per {client}",
      "Filter by status and due date",
      "Show display-only payment methods",
      "Review collection summary cards",
    ],
    workflow: [
      "Record the billing",
      "Send the statement",
      "Monitor the due date",
      "Follow up when overdue",
      "Record the collection status",
      "Close the account for the period",
    ],
    screens: ["Billing list", "Billing form", "Account detail", "Collection summary"],
  },
  dashboard: {
    label: "Dashboard & Analytics",
    shortDesc: "See performance across the {business} in one live dashboard.",
    problem:
      "Management decisions rely on end-of-month spreadsheets assembled by hand. By the time problems are visible in the numbers, weeks have passed.",
    solution:
      "A management dashboard with headline cards and charts — sales, activity, and status mixes — driven by the demo's sample records.",
    benefits: [
      "One glance replaces manual report-building",
      "Earlier detection of dips and spikes",
      "Shared numbers for the whole team",
      "Branch or category comparison at a glance",
    ],
    functions: [
      "Show headline performance cards",
      "Chart trends over recent periods",
      "Compare branches or categories",
      "Show status distribution",
      "Refresh from current demo data",
      "Present in meetings on any device",
    ],
    workflow: [
      "Open the dashboard",
      "Review headline cards",
      "Inspect the trend chart",
      "Compare categories",
      "Drill into a concern",
      "Agree on actions",
    ],
    screens: ["Headline cards", "Trend chart", "Comparison chart", "Status breakdown"],
  },
  production: {
    label: "Production & Batch Tracking",
    shortDesc: "Track production batches of {items} from start to release.",
    problem:
      "Production runs are tracked on clipboards. Yields, rejects, and batch traceability are guesswork, making quality issues hard to trace back.",
    solution:
      "A batch tracker where each production run records planned vs. actual output, current stage, and quality remarks — giving traceability per batch.",
    benefits: [
      "Traceability for every batch",
      "Visibility of yields and rejects",
      "Earlier detection of quality drift",
      "Grounded production planning",
    ],
    functions: [
      "Open batch records with targets",
      "Track stages from prep to release",
      "Record output and reject counts",
      "Log quality remarks",
      "Filter batches by product or status",
      "Review production summary cards",
    ],
    workflow: [
      "Plan the production batch",
      "Issue materials",
      "Run production",
      "Record output and rejects",
      "Pass quality check",
      "Release the batch",
    ],
    screens: ["Batch list", "Batch form", "Batch detail", "Production summary"],
  },
  universal: {
    label: "Universal Workflow",
    shortDesc: "A configurable record-and-status workflow for any process.",
    problem:
      "The {business} runs an important process through chats and memory — records are inconsistent, statuses unclear, and history unrecoverable.",
    solution:
      "A configurable workflow: records with your own fields move through defined stages with assignments, notes, and a full activity trail.",
    benefits: [
      "One consistent way to track the process",
      "Status visibility for the whole team",
      "A permanent activity history",
      "Adaptable to almost any workflow",
    ],
    functions: [
      "Create records with configurable fields",
      "Move records through stages",
      "Assign responsible {workers}",
      "Log notes and history",
      "Search, filter, and sort records",
      "Review summary cards",
    ],
    workflow: [
      "Create the record",
      "Assign an owner",
      "Progress through each stage",
      "Log updates along the way",
      "Complete the record",
      "Review the summary",
    ],
    screens: ["Record list", "Record form", "Record detail", "Workflow summary"],
  },
};
