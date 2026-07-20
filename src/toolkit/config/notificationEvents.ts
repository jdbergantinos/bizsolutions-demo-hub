import type { NotificationChannel, NotificationEventDef } from "../types";

export const NOTIFICATION_DISCLAIMER = "Simulation only — no external message was sent.";

export const NOTIFICATION_CHANNELS: { id: NotificationChannel; label: string }[] = [
  { id: "in-app", label: "In-app" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "messenger", label: "Messenger" },
  { id: "push", label: "Push notification" },
];

export const NOTIFICATION_EVENTS: NotificationEventDef[] = [
  { id: "appointment-confirmed", label: "Appointment confirmed", defaultMessage: "Hi {name}! Your appointment on {date} at {time} is confirmed. Reply to reschedule. (Sample)", suggestedRoles: ["Customer"] },
  { id: "quotation-ready", label: "Quotation ready", defaultMessage: "Good news, {name} — your quotation #{ref} is ready. Total: {amount}. Valid for 30 days. (Sample)", suggestedRoles: ["Customer"] },
  { id: "approval-requested", label: "Approval requested", defaultMessage: "{requester} submitted {ref} for your approval. Amount: {amount}. Open the app to decide. (Sample)", suggestedRoles: ["Manager", "Owner"] },
  { id: "job-status", label: "Job status updated", defaultMessage: "Update on {ref}: status is now {status}. We'll message you at each step. (Sample)", suggestedRoles: ["Customer"] },
  { id: "low-stock", label: "Low-stock alert", defaultMessage: "Low stock: {item} is at {qty} (reorder level {reorder}). Consider reordering today. (Sample)", suggestedRoles: ["Manager", "Staff"] },
  { id: "payment-overdue", label: "Payment overdue", defaultMessage: "Friendly reminder: invoice {ref} ({amount}) was due {date}. Payment options: Cash, GCash, bank transfer. (Sample)", suggestedRoles: ["Customer"] },
  { id: "document-expiring", label: "Document expiring", defaultMessage: "Heads up: {doc} expires on {date}. Start the renewal now to avoid penalties. (Sample)", suggestedRoles: ["Manager", "Staff"] },
  { id: "service-completed", label: "Service completed", defaultMessage: "Your {service} is complete! Thank you, {name}. We'd love your feedback. (Sample)", suggestedRoles: ["Customer"] },
  { id: "follow-up-due", label: "Follow-up due", defaultMessage: "Reminder: follow up with {name} today about {topic}. Last contact: {date}. (Sample)", suggestedRoles: ["Salesperson", "Staff"] },
];
