import type { SecurityControl, SecurityGrouping } from "../types";

export const SECURITY_DISCLAIMER =
  "The demonstration does not prove production security, privacy compliance, regulatory compliance, uptime, certification, or data protection. Final controls require technical design, implementation, testing, and contractual confirmation.";

const c = (id: string, name: string, description: string, grouping: SecurityGrouping): SecurityControl => ({ id, name, description, grouping });

// Client-friendly explanations of possible production controls. Groupings are
// honest defaults — nothing here claims compliance with any law or standard.
export const SECURITY_CONTROLS: SecurityControl[] = [
  c("auth", "User authentication", "Each user signs in with their own account before accessing anything.", "Expected production foundation"),
  c("rbac", "Role-based permissions", "What each person can see and do depends on their assigned role.", "Expected production foundation"),
  c("tls", "Encrypted internet connection", "Traffic between devices and the system is encrypted (HTTPS).", "Expected production foundation"),
  c("backups", "Database backups", "Regular copies of the data so it can be restored after a failure.", "Expected production foundation"),
  c("pwreset", "Password reset", "A controlled way for users to recover access to their account.", "Expected production foundation"),
  c("deactivate", "Account deactivation", "Departing staff lose access without deleting their history.", "Expected production foundation"),
  c("updates", "Security updates", "The platform and its components receive ongoing security patches.", "Expected production foundation"),
  c("audit", "Audit logs", "A record of who did what and when, for accountability.", "Optional"),
  c("session", "Session control", "Automatic sign-out and control over active sessions.", "Optional"),
  c("export", "Data export", "The client can export their records in a usable format.", "Optional"),
  c("history", "Activity history", "Per-record history of changes, as shown in the demos.", "Optional"),
  c("deletion", "Data deletion workflow", "A defined process for deleting data on request.", "Requires technical assessment"),
  c("fileacl", "File-access control", "Rules governing who can open which uploaded files.", "Requires technical assessment"),
  c("recovery", "Recovery procedures", "Documented steps to restore service after an incident.", "Requires technical assessment"),
  c("monitoring", "Monitoring", "Automated alerting when the system misbehaves.", "Requires third-party service"),
];

export const SECURITY_GROUP_ORDER: SecurityGrouping[] = [
  "Expected production foundation",
  "Optional",
  "Requires technical assessment",
  "Requires third-party service",
  "Not included in the demo",
  "Not yet verified",
];
