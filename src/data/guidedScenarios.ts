import type { GuidedScenario } from "../types";

// Guided walk-throughs used by Presentation Mode. Each step can point to the
// demo module that best illustrates it.

export const GUIDED_SCENARIOS: GuidedScenario[] = [
  {
    id: "inquiry-to-completion",
    name: "Inquiry to Completion",
    description:
      "Follow a customer inquiry all the way to a completed service — the full service-business cycle.",
    steps: [
      { title: "Receive inquiry", detail: "A new inquiry arrives by phone, Facebook, or walk-in. Instead of a sticky note, it becomes a trackable record.", module: "crm" },
      { title: "Create customer", detail: "Capture the customer's name, contact number, and what they need — once, in one place.", module: "crm" },
      { title: "Prepare quotation", detail: "Build an itemized quotation with automatic peso totals. No more spreadsheet errors.", module: "quotation" },
      { title: "Submit for approval", detail: "The quotation is routed for internal approval with a clear record of who approved it.", module: "quotation" },
      { title: "Schedule service", detail: "Once approved, the job is scheduled on a shared calendar everyone can see.", module: "booking" },
      { title: "Assign employee", detail: "The right staff member is assigned, so accountability is clear from the start.", module: "projects" },
      { title: "Update work status", detail: "As work progresses, the status is updated — anyone can answer \"how's it going?\" instantly.", module: "projects" },
      { title: "Complete service", detail: "The job is marked complete with notes for the record.", module: "projects" },
      { title: "Show customer notification", detail: "A simulated notification shows how the customer would be informed automatically.", module: "projects" },
      { title: "Review management dashboard", detail: "Management sees totals, trends, and status mixes — updated from the day's work.", module: "dashboard" },
    ],
  },
  {
    id: "order-to-delivery",
    name: "Order to Delivery",
    description:
      "Follow a sales order from encoding through stock check, dispatch, and proof of delivery.",
    steps: [
      { title: "Create order", detail: "The order is encoded with line items and automatic totals.", module: "ordering" },
      { title: "Check inventory", detail: "Stock on hand is checked instantly — including low-stock warnings.", module: "inventory" },
      { title: "Confirm customer", detail: "Customer details and delivery address are confirmed on the order.", module: "ordering" },
      { title: "Prepare order", detail: "The order moves to \"Preparing\" so the whole team sees its progress.", module: "ordering" },
      { title: "Assign delivery", detail: "A driver is assigned and the delivery is dispatched.", module: "delivery" },
      { title: "Update delivery status", detail: "Status updates flow in: dispatched, in transit, delivered.", module: "delivery" },
      { title: "Record proof of delivery", detail: "Receipt is recorded against the delivery for a complete trail.", module: "delivery" },
      { title: "Review sales dashboard", detail: "The sale appears in totals and trends on the management dashboard.", module: "dashboard" },
    ],
  },
  {
    id: "booking-to-followup",
    name: "Booking to Follow-Up",
    description:
      "Follow an appointment from booking through completion, feedback, and the follow-up reminder.",
    steps: [
      { title: "Select service", detail: "The customer picks a service from a clear, updated list.", module: "booking" },
      { title: "Select schedule", detail: "Available dates and times are checked — no double-booking.", module: "booking" },
      { title: "Create customer booking", detail: "The booking is created with the customer's details.", module: "booking" },
      { title: "Assign staff", detail: "A staff member is assigned to the appointment.", module: "booking" },
      { title: "Confirm appointment", detail: "The booking is confirmed and a simulated confirmation is shown.", module: "booking" },
      { title: "Complete appointment", detail: "After the visit, the appointment is marked completed.", module: "booking" },
      { title: "Record feedback", detail: "Customer feedback is captured while the visit is fresh.", module: "universal" },
      { title: "Schedule reminder", detail: "A simulated follow-up reminder keeps the customer coming back.", module: "membership" },
    ],
  },
];
