# APPROVED-SCOPE.md — BizSolutions Demo Hub Scope Baseline

## 1. Document Control

- **Product:** BizSolutions Demo Hub
- **Owner and approver:** John
- **Status:** Approved governance baseline
- **Approved by:** John, Product Owner
- **Approval date:** 2026-07-28, Asia/Manila
- **Baseline date:** 2026-07-28
- **Repository:** public (github.com/jdbergantinos/bizsolutions-demo-hub)
- **Change control:** future scope changes require an approved change record.
  This document records the current state; it does not authorize new work.

## 2. Product Outcome

The application helps a presenter conduct structured prospect conversations and
demonstrate possible digital workflows — discovery, working demos, recommendations,
value illustration, preliminary scope, and preliminary price ranges — **without
pretending that the demos are production systems**. Every demonstration is
explicitly a sales aid.

## 3. Target User

- **Primary user:** FaithBuilders presenter or salesperson
- **Secondary user:** a prospect using the controlled intake screen (`/intake`)
  on the presenter's device
- **Market context:** Philippine organizations
- **Current deployment model:** single-user, offline-capable, browser-based
  sales tool (installable PWA; no backend)

## 4. Current Approved Product Classification

### Shared Core — Now

- Industry and service catalog
- Reusable demo engines and DemoHost
- Client profiles
- Discovery interview
- Problem scanner
- Rule-based recommendations
- Workflow comparison
- Client intake
- Presentation builder and guided presentation
- ROI illustration
- Package comparison
- Preliminary scope builder
- Roadmap
- Meetings and next-step recommendations
- Discussion summary
- Pricing configurator with preliminary ranges
- Trust and integration showcase
- Notification and approval simulations
- Dashboard and report showcase
- Templates and scenario library
- Objection guide
- Presentation history
- Backup, restore, snapshots, and storage migrations
- Offline PWA installation and update prompt

### Industry Templates — Now

- Existing industry-specific catalogs, scenarios, terminology, and demo
  configurations (currently 44 industries built from shared seeds)

### Integrations — Demonstration Only

- All currently listed integration examples (the Integration Showcase catalog)
- **None of these are live integrations.** They are honest illustrations of what
  could be assessed and built in a separate, real project.

## 5. Explicit Current Boundaries

The current application does **not** include:

- Backend server
- Production database
- Real authentication or authorization
- Tenant isolation
- Real payment processing
- Real SMS, email, messaging, or notification delivery
- Real accounting
- Real CRM suitable for multiple users
- Production audit logging
- Cloud synchronization
- Production security or compliance controls
- Production client operations
- Broad self-service SaaS

Adding any of the above would be a separately approved project, not an extension
of this scope.

## 6. Current Data Boundary

- All data is **static seed data plus browser localStorage** (versioned keys under
  the `bizsolutions.*` and `bizsolutions-meta.*` prefixes).
- No sessionStorage is currently used.
- No network calls are currently used — nothing leaves the device.
- **Prospect data can be stored locally** (profiles, discoveries, meetings,
  acknowledgments, history) and therefore requires deliberate operational care.
- Browser data loss and device loss remain risks.
- Backups are manual JSON exports and should be stored securely **outside** the
  device; on-device daily snapshots are a safety net, not a backup strategy.

## 7. Current Pricing Boundary

- The pricing engine exists and is unit-tested.
- **Amounts are owner-approved preliminary ranges** as of 2026-09-18 for Shared and
  Configured SaaS, the 20 modules, per-user charges, ten common optional services, and
  the Basic/Standard/Priority support plans (see the
  [Owner-Approved Pricing release record](releases/2026-09-18-approved-pricing.md)).
  Custom-built, white-label, and exclusive delivery models, the remaining optional
  services, and the Dedicated/Custom SLA plans remain internal placeholders until John
  approves replacement values.
- Estimates must remain clearly preliminary and range-based, never presented as
  quotations or commitments.
- Internal pricing worksheets and pricing decisions must remain **outside** this
  public repository.

## 8. Known Existing Product Questions (recorded, not decided)

- Whether to keep, merge, or retire the older `/present` presentation flow,
  which overlaps the newer presentation builder and guided presentation.
- The privacy posture for real prospect data stored on the device.
- Whether deployment should remain manual or later use CI/CD.
- Whether and when to update dependencies with known vulnerabilities.
  See [ADR 0001](decisions/0001-defer-react-router-7-upgrade.md): the two moderate
  React Router 6 advisories were accepted as low risk on 2026-09-18, then cleared the
  same day when the React Router 7 upgrade merged (PR #12, `main` `38999f8`). The
  ADR is marked superseded. The live deployment picks this up at the next release.
- When real approved pricing values should replace the placeholders.
  Answered in part on 2026-09-18: see the
  [Owner-Approved Pricing release record](releases/2026-09-18-approved-pricing.md).
  Shared/Configured SaaS, all 20 modules, per-user charges, ten common optional
  services, and the Basic/Standard/Priority support plans now carry owner-approved
  ranges (price table `owner-2026.09.18`). Custom-built, white-label, and exclusive
  delivery models, the remaining optional services, and the Dedicated/Custom SLA
  plans are still placeholders.

## 9. Current Release State

- Main branch latest audited commit: `3338c51`
- The live `gh-pages` deployment was **two commits behind** `main` during the
  2026-07-28 audit.
- Deployment is not part of this governance-file assignment.
- No deployment should occur merely from creating these documents.

## 10. Acceptance Criteria for This Baseline

This baseline is acceptable when:

- It describes the existing application accurately.
- It does not add new product features.
- It separates demos from production systems.
- It protects routes, storage, PWA behavior, and existing architecture.
- It excludes confidential business information.
- It records unresolved decisions without silently resolving them.
- It requires change control for future scope changes.
