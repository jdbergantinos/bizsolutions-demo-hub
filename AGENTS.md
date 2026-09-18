# AGENTS.md — Project Instructions for BizSolutions Demo Hub

These are the standing project-level instructions for any AI assistant or developer
working in this repository. They are public-safe: they contain no confidential
business information.

## 1. Project Identity

- This application is the **existing BizSolutions Demo Hub** — do not treat it as a
  greenfield project.
- It is a **mobile-first, offline-capable Progressive Web App (PWA)** for interactive
  client discovery, working demonstrations, preliminary solution configuration,
  guided presentations, ROI illustrations, scope discussions, and preliminary
  price ranges.
- It is a **sales and presentation tool, not production client business software**.
  Demos illustrate possible workflows; they are never production systems.
- The primary market context is **Philippine organizations**.

## 2. Source-of-Truth Priority

When guidance conflicts, follow this order (highest first):

1. John's explicit current instruction
2. Approved repository scope in `/docs/APPROVED-SCOPE.md`
3. Approved decision records and change requests, when later added
4. Existing repository architecture and working behavior
5. `README.md`
6. Current task instructions
7. AI assumptions

**Conflicts between these sources must be reported to John before implementation,
not silently resolved.**

## 3. Preserve Existing Application

- **Extend** the existing application; **never recreate it** — in whole or in part —
  without written approval.
- Preserve existing routes (`src/App.tsx`), components, catalog data
  (`src/data/`), demo engines (`src/demos/`), storage behavior
  (`src/utils/storage.ts` and the feature stores), PWA behavior, offline behavior,
  installability, and update prompts.
- Do **not** rename or remove routes, localStorage keys, or major components
  without an approved change.
- Treat **localStorage compatibility** and **PWA regression** as material risks:
  real prospect data lives in versioned localStorage keys, and installed devices
  keep serving cached versions. Breaking either harms a live sales workflow.
- Do **not** replace an existing working implementation merely because another
  implementation seems cleaner.

## 4. Scope Discipline

Every feature must be classified as one of:

- Shared core
- Optional module
- Industry template
- Integration
- Client-specific extension
- Out of scope

Every feature must be labeled with a horizon: **Now**, **Next**, or **Later**.

Rules:

- Do not silently add features.
- Do not move Next or Later items into Now without approval.
- Do not convert the Demo Hub into production SaaS, CRM, ERP, payment processing,
  communication delivery, or multi-user software — that would be a separately
  approved project.
- A **change request is required** for anything affecting scope, price, deadline,
  architecture, privacy, security, support, or client promises.

## 5. Mandatory Pre-Change Check

Before changing any files, report:

- Current branch and Git status
- Task objective
- Files expected to change
- Existing behavior that must be preserved
- Scope classification (per §4)
- Acceptance criteria
- Risks
- Whether escalation or approval is required

**Stop and wait for John** when the requested change materially affects:

- Architecture
- Storage schema
- Authentication
- Privacy
- Security
- Deployment
- Paid services
- Client-facing pricing
- More than five files through a broad refactor
- Removal or replacement of existing behavior

## 6. Build and Validation Rules

- Do not claim completion because files were created. **Completion requires
  suitable evidence.**
- At minimum, changes should pass appropriate type checking and the existing
  test suite.
- UI changes require manual verification instructions.
- PWA-related changes require install, offline, caching, and update-flow
  verification.
- Storage-related changes require compatibility, migration, backup, and restore
  consideration before they ship.
- Destructive actions (deleting data, overwriting files, resets, force pushes)
  require explicit approval.
- Report the exact commands executed and their results.
- Never conceal failing tests or incomplete verification — report failures plainly.

## 7. Data and Privacy

- Do not store secrets in source files, Markdown files, browser storage, or Git.
- Never expose environment-variable **values**; names may be reported.
- **Real prospect information is confidential.** It may exist in local device
  storage; treat it with care and never copy it into the repository, logs,
  examples, or documentation.
- Demo data must remain clearly identified as sample or simulated data.
- Do not claim that UI-level PINs or kiosk screens provide real security — they
  are presentation privacy only.
- Any move toward authentication, encryption, cloud storage, synchronization,
  analytics, or multi-user access requires a separate architecture and privacy
  review before any implementation.

## 8. Pricing and Client-Facing Information

- Client-facing estimates may show **preliminary price ranges with disclaimers**.
- Never expose internal costs, labor assumptions, margins, discount thresholds,
  or approval thresholds in client-facing views, this repository, or its history.
- Do not replace placeholder prices without John's explicit approval.
- Preliminary estimates are **not contracts and not guaranteed final prices**,
  and must always be labeled accordingly.

## 9. Documentation and Handoff

After an approved implementation, report:

- Files changed
- What changed
- What remained unchanged
- Validation evidence
- Known limitations
- Risks
- Required manual verification
- Recommended next action

During the initial governance-baseline assignment, no additional governance
files may be created. After the baseline is approved, new governance documents
may be created only when John explicitly authorizes them.

## 10. Christ-Honoring Operating Standard

Work in this repository is done to a Christ-honoring standard: be truthful in
every claim and report; steward the owner's time, money, and data well; keep
confidential information confidential; deal fairly with clients and suppliers;
make no deceptive or exaggerated claims; copy nothing without authorization;
build no hidden lock-in; and take no unsafe shortcuts.
