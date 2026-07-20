# BizSolutions Demo Hub

A mobile-first, installable Progressive Web App (PWA) used as an **interactive sales and
presentation tool** for a Philippine web, mobile, business-systems, and automation agency.

Browse 44 industries, open any of ~400 service offers, read the business problem and proposed
solution, then launch a **working interactive demo** — entirely offline, with no backend and no
real data.

> **Demonstration only — no real data is stored or transmitted.** All names, businesses, and
> records are fictional sample data. See [Demo limitations and safety](#demo-limitations-and-safety).

**Live app:** https://jdbergantinos.github.io/bizsolutions-demo-hub/
(deployed from the `gh-pages` branch — rebuild with `npm run build` and push `dist/` there to update)

---

## Technology

- React 18 + TypeScript + Vite
- Tailwind CSS 4
- React Router (hash-based routing so deep links work as an installed PWA)
- Lucide icons, Recharts (dashboards)
- `vite-plugin-pwa` (service worker, offline caching, install support)
- Static TypeScript configuration + `localStorage` for temporary demo state

No backend, no database, no authentication, no real payments/SMS/email.

## Installation (development)

```bash
npm install
npm run dev          # http://localhost:5173
```

## Production build

```bash
npm run build        # generates icons, type-checks, builds to dist/
npm run preview      # serve the production build locally
```

The production build precaches the entire app, so it works fully offline after the first load.
Host the `dist/` folder on any static host (HTTPS required for PWA install).

## Installing on a phone (PWA)

1. Open the hosted app URL in Chrome (Android) or Safari (iOS).
2. Android: menu ⋮ → **Add to Home screen / Install app**.
   iOS: Share button → **Add to Home Screen**.
3. Launch from the home screen — it opens full-screen (standalone).
4. After the first load you'll see a **"Ready to work offline"** notice; from then on the app
   works without internet. When a new version is deployed you'll get an
   **"Update available"** prompt.

---

## Running tests

```bash
npm test             # vitest — pricing-engine unit tests
```

## Project structure

```
src/
  components/       # common UI, catalog cards, demo framework (form/detail)
  data/
    industries/     # seeds.ts — compact source of truth for all 44 industries
    scenarios/      # builders.ts (per-module defaults), custom.ts (flagship overrides)
    mock/ph.ts      # Philippine sample-data pools & formatters
    catalog.ts      # builds the full Industry/ServiceOffer catalog from seeds
    serviceTemplates.ts  # content templates for the 20 demo module types
    guidedScenarios.ts   # Presentation Mode walkthroughs
  demos/            # 6 reusable engines + shared DemoHost
  hooks/            # useDemoState (localStorage records), useOnline
  layouts/          # AppLayout (sidebar / bottom nav)
  pages/            # one file per screen
  store/            # AppStore (favorites, profiles, solutions…), ToastContext
  types/            # all TypeScript interfaces
  utils/storage.ts  # localStorage keys & helpers
```

### How the reusable demo architecture works

There is **no separate app per service offer**. Instead:

1. Every service offer maps to one of **20 demo module types** (CRM, booking, inventory,
   quotation, delivery, …, universal workflow) — see `DemoModuleType` in `src/types/index.ts`.
2. Each module type renders through one of **6 concrete engines**
   (`MODULE_ENGINE` in `src/data/catalog.ts`):
   records / pipeline / booking / inventory / line-items / dashboard.
3. When a demo launches, a `ScenarioConfig` is built for it — labels, form fields, table
   columns, statuses, assignees, mock records — using the industry's vocabulary
   (e.g. "guests" for hotels, "patients" for clinics).
4. `DemoHost` (`src/demos/DemoHost.tsx`) provides all shared behavior: create/edit/delete,
   search/filter/sort, status changes, assignment, notes, line items, activity history,
   toasts, confirmation dialogs, and reset.

## Client Discovery & Guided Presentation (Phase A)

The Discovery workflow turns a client meeting into a structured, presentable solution:

1. **Discovery interview** (`/discovery`) — multi-step questionnaire (business info,
   current operations, desired outcomes) with autosave, completeness %, statuses
   (draft → in progress → ready → follow-up → completed), copy-summary, and reset.
2. **Problem Scanner** (`/problem-scanner`) — 38 catalog problems in 6 categories plus
   custom problems, each with severity, priority, notes, and verified/assumed marking.
3. **Recommendations** (`/solution-recommendations`) — a transparent rule-based engine
   scores every service offer of the client's industry from problem severity/priority,
   desired outcomes, business size, and operations flags. Tiers: recommended, optional,
   future-phase, needs technical review, not-initially (risk-driven). Every card shows
   *why* it was suggested; outputs feed Selected Solutions and the Pricing Configurator
   (`/pricing/new?discovery=1` loads the active discovery).
4. **Workflow Comparison** (`/workflow-comparison`) — before/after workflow builder with
   step editing, reorder, duplicate, convert-to-proposed, bottleneck/approval flags, and
   time figures clearly labeled as estimates from user inputs.
5. **Presentation Builder** (`/presentation-builder`) — client-branded setup (name, logo,
   accent color, meeting details, section toggle/reorder, content sources) feeding the
   full-screen **Guided Presentation** (`/presentation`) with swipe/keyboard navigation,
   client vs presenter view, presenter notes, role-based demo perspectives, and
   position resume. Demos open in a new tab so the presentation keeps its place.

### How to extend Phase A

- **Add a new problem**: append to `src/discovery/config/problemCatalog.ts` — set
  `relatedDemoModuleIds` and the resolver maps it to every industry's matching offers.
- **Map a problem to specific offers**: add `relatedServiceOfferIds` on the problem for
  explicit offer IDs beyond the module mapping.
- **Add an industry-specific role configuration**: add an entry to `INDUSTRY_ROLES` in
  `src/discovery/config/roleConfigs.ts` (role id from `DEFAULT_ROLES` + display name).
- Recommendation weights live in `src/discovery/engine/recommend.ts`
  (severity/priority weight tables) — unit-tested in `src/discovery/engine/__tests__`.

### Phase A storage keys

| Key | Contents |
| --- | --- |
| `bizsolutions.discovery.records.v1` | discovery records (answers, problems, recommendation sets) |
| `bizsolutions.discovery.active.v1` | id of the active discovery |
| `bizsolutions.discovery.workflows.v1` | workflow comparisons |
| `bizsolutions.discovery.presentations.v1` | guided presentations |

All are versioned; the Discovery hub offers validated JSON export/import.

**Phase A limitations**: recommendations are rule-based suggestions, never guarantees;
role permissions are conceptual demo behavior, not access control; time savings are
presenter-entered estimates.

## Business Value, Scope & Next Steps (Phase B)

- **ROI & Business-Value Calculator** (`/roi`) — deliberately separate from pricing
  (pricing = what it could cost; ROI = what value the client might receive). All inputs
  are client-provided; results are ranges grouped into time savings, cost savings,
  revenue opportunity, risk reduction, and nonfinancial benefits, with an uncertainty
  level. The low end of every range assumes only half the stated improvement; recovery
  rates (appointments 30–70%, leads 25–50%, inventory 30–60%) are illustrative defaults
  in `src/value/engine/calculateRoi.ts`. Payback/return appear only when a pricing
  estimate is linked. Every output carries the not-guaranteed disclaimer.
- **Package Comparison** (`/packages`) — Essential/Growth/Advanced (plus custom packages)
  side by side with per-package delivery-model overrides; edits save into the estimate.
- **Preliminary Scope Builder** (`/scope`) — generates included / not-included /
  responsibilities / open-questions lists from the discovery and estimate (templates in
  `src/value/config/scopeTemplates.ts`); everything is editable; labeled "for discussion
  only — not a contract or statement of work." Includes per-module feature-to-value
  explanations (labeled AI-generated, catalog problem text excepted).
- **Implementation Roadmap** (`/roadmap`) — 13 default stages
  (`src/value/config/roadmapStages.ts`) with add/remove/reorder, responsibilities,
  duration ranges (never dates), and client-dependency/technical-review/milestone flags.
- **Meetings & Next Steps** (`/meetings`) — meeting records with decisions, concerns, and
  11 opportunity statuses; a rules-based next-step recommender
  (`src/value/engine/nextStep.ts`, first-match-wins rules: terminal statuses → technical
  blockers → sensitive-industry security review → discovery quality → integration/data
  reviews → sales stage) with manual override. Nothing is sent or scheduled automatically.
- **Discussion Summary** (`/summary`) — assembles everything into a client or internal
  summary (copy/print/share/save) plus a **noncontractual client acknowledgment**
  (choice, name, role, comments; stored locally; explicitly not a signature or commitment).
- **Presentation integration** — new sections: Business Value & ROI, Preliminary Scope,
  Client Acknowledgment; the implementation-process and next-steps slides now render the
  linked roadmap and next-step recommendation. Old saved presentations gain the new
  sections automatically. Internal figures stay hidden in Client View.

### Phase B storage keys

`bizsolutions.value.roi.v1`, `.scopes.v1`, `.roadmaps.v1`, `.meetings.v1`,
`.acknowledgments.v1`, `.summaries.v1` — versioned; included in the Discovery hub's
JSON export/import (invalid imported entries are dropped with readable errors, never
crashes).

## Trust, Scenarios & Presentation History (Phase C)

All Phase C tools live in the Discovery hub's **Presenter toolkit** section:

- **Trust Center** (`/trust`) — client-friendly security explanations grouped honestly
  (production foundation / optional / needs assessment / third-party / not in demo / not
  verified), plus the included/not-included demonstration boundary with industry-specific
  exclusions. **Limitations**: the demo proves workflows, never security, compliance,
  certification, uptime, or data protection — the screen says so verbatim, and no
  compliance claim is ever made. The boundary notice appears automatically (once per
  industry) before opening sensitive-industry demos.
- **Integration Showcase** (`/integrations`) — 37 integrations in 7 categories with honest
  statuses (nothing claims to be live; payment integrations always require technical
  assessment and the system never holds funds), third-party cost notes, risks, and a
  13-question assessment questionnaire saved per integration.
- **Notification Simulator** (`/notifications`) — 9 events × 5 channels with editable
  messages, channel-styled previews, and a stored history. Every simulation is labeled
  "Simulation only — no external message was sent."
- **Approval Showcase** (`/approvals-showcase`) — 9 scenarios with conceptual multi-level
  chains, comments, activity history, and per-scenario reset; labeled demo behavior.
- **Dashboard & Report Selector** (`/dashboard-selector`) — 16 cards with reorder,
  role/branch visibility, custom-report flags; selections are preferences, not final
  requirements.
- **Industry Templates** (`/templates`) — 12 industry starting points (problems, discovery
  questions, workflows, dashboards, integrations, next step). Applying one always creates
  a **new** presentation + starter workflow; saved presentations are never overwritten.
  Configure in `src/toolkit/config/industryTemplates.ts`.
- **Scenario Library** (`/scenario-library`) — 15 realistic walkthroughs (happy path,
  low stock, forgotten lead, failed delivery…) with steps, discussion questions, and
  business value; launch opens the matching demo, customizations/duplicates are stored
  separately and resettable to the library version. Configure in
  `src/toolkit/config/scenarioLibrary.ts`.
- **Objection Guide** (`/objections`) — 16 hard questions with recommended responses,
  client questions, overpromise risks, and commercial-model pointers. **Presenter-only**;
  marked internal guidance.
- **Presentation History** (`/history`) — a lightweight **local** sales tracker (explicitly
  not a secure multi-user CRM): per-presentation records, opportunity statuses, and
  dashboard cards (this month, qualified, proposals, follow-ups due, pipeline value from
  linked estimates, won/lost, by industry).

### Backup & restore

Settings → **Backup & restore** exports every `bizsolutions.*` storage key as one
versioned JSON (`backupVersion: 1`). Restoring validates first (invalid JSON, wrong app,
foreign keys → readable errors, never a crash), previews key counts, then offers
**Merge** (overwrite only keys present in the backup) or **Replace** (destructive, wipes
all app data first, double-confirmed). Sample backups must never contain real client data.

### Phase C storage keys

`bizsolutions.toolkit.assessments.v1`, `.notifications.v1`, `.approvals.v1`,
`.dashboards.v1`, `.scenarios.v1`, `.history.v1`, `.boundaryack.v1`.

## Solution & Pricing Configurator

The Pricing Configurator (`/pricing` navigation item) builds **preliminary, range-based
estimates** from the same catalog the demos use. Every service offer is priceable.

- **Routes**: `/pricing` (estimate list), `/pricing/new` (8-step wizard),
  `/pricing/estimate/:id` (estimate with Client/Internal views and packages),
  `/pricing/admin` (settings + editable pricing rules + JSON export/import).
- **Entry points**: Industry detail ("Create estimate", "View recommended package"),
  Service detail ("Add to estimate"), Selected Solutions ("Estimate selected solutions"),
  Client Profiles (calculator button), Presentation Mode (attach an estimate; client
  view only).
- **Architecture**: `src/pricing/` — `config/` holds all editable seed values (delivery
  models, configuration levels, business sizes, per-module prices, 45 optional services,
  support plans, industry risk); `engine/` holds pure calculation functions
  (unit-tested); `store/pricingStorage.ts` persists everything under the
  `bizsolutions.pricing.*` localStorage keys with schema versioning.
- **Editing prices**: use Pricing Administration in the app (stored on-device), or edit
  the seed files in `src/pricing/config/` and rebuild. **All seed amounts are internal
  placeholders (`pricingSource: "Internal placeholder — owner verification required"`)
  — review them before using estimates with real clients.**
- **Safety**: estimates are labeled preliminary and are not binding quotations; sensitive
  selections (lending, government, high-risk services, payment/custom integrations,
  source-code transfer) force a "Manual Technical Review Required" state that blocks the
  approved-for-proposal status. Internal costing/margins appear only in the PIN-gated
  Internal view (the PIN is presentation privacy, not real security). Third-party costs
  are always listed separately as "not included unless explicitly stated."

## How to add a new industry

1. Open `src/data/industries/seeds.ts`.
2. Add an `IndustrySeed` entry: `id`, `name`, `icon` (any name registered in
   `src/components/common/Icon.tsx`), `description`, `category`, `examples`,
   `priority`, optional `initialMarketRating` / `cautions`, and a `vocab` override
   (what to call clients, items, workers, jobs).
3. Add its `services` list (see below). That's it — the catalog, search, filters, and
   detail screens pick it up automatically.

## How to add a new service offer

In the industry's `services` array add:

```ts
s("Name of the offer", "moduleType", "low" | "moderate" | "high", "optional-custom-scenario-key")
```

- `moduleType` must be one of the 20 `DemoModuleType` values — this is **how an offer is
  mapped to a demo module**. If nothing fits, use `"universal"`.
- Risk defaults to `"low"`; the scenario key defaults to `"<industryId>:<module>"`.
- Problem/solution/benefits/workflow text is generated from the module's template in
  `src/data/serviceTemplates.ts`, interpolated with the industry vocabulary.

## How to add or customize mock data

- General pools (names, businesses, cities, barangays, payment methods, peso/phone
  formatting): `src/data/mock/ph.ts`.
- Default per-module records: the `records` arrays in `src/data/scenarios/builders.ts`.
- Flagship hand-tuned scenarios (retail/restaurant/automotive/construction/clinic inventory,
  real-estate CRM, clinic & salon booking, auto job orders): `src/data/scenarios/custom.ts`.
  To add one, register a builder under the scenario key and reference that key from the
  service seed. Always mark records with `(Sample)`.

## How to create a new guided presentation scenario

Add an entry to `src/data/guidedScenarios.ts`: `id`, `name`, `description`, and `steps`
(each step has a `title`, a spoken-word `detail`, and an optional `module` that powers the
"Open this step's demo" button). It appears automatically in Presentation Mode setup and
can be favorited.

## localStorage keys

All device-local state lives under the `bizsolutions.` prefix
(defined in `src/utils/storage.ts`, also shown in **Settings**):

| Key | Contents |
| --- | --- |
| `bizsolutions.favorites` | favorited industries / services / guided scenarios |
| `bizsolutions.recents` | recently opened demos (max 12) |
| `bizsolutions.profiles` | client profiles, incl. temporary logo (data-URL) |
| `bizsolutions.activeProfile` | id of the active client profile |
| `bizsolutions.solutions` | selected client solutions list |
| `bizsolutions.presentation` | presentation setup + current step |
| `bizsolutions.demo.<scenarioKey>` | record state for one demo scenario |
| `bizsolutions.pricing.estimates.v1` | saved pricing estimates (versioned) |
| `bizsolutions.pricing.settings.v1` | pricing settings (VAT, margins, PIN, defaults) |
| `bizsolutions.pricing.rules.v1` | customized pricing rules (absent = seed values) |
| `bizsolutions.pricing.draft.v1` | in-progress configurator draft (autosaved) |

**Resets** (Home & Settings, all with confirmation): current demo, one industry, client
profiles, selected solutions, favorites, or the entire application.

## Demo limitations and safety

- **Demonstration only** — every demo screen carries the label
  *"Demonstration only — no real data is stored or transmitted."* Nothing leaves the device.
- All names and records are fictional and marked `(Sample)`. Do not enter real client data.
- Payment methods (Cash, GCash, bank transfer, card) are **display-only**; no payments are
  processed or held.
- Deliberately **not implemented**: medical diagnosis/treatment/prescriptions, core
  accounting, tax, payroll, loan calculations, credit scoring, underwriting, core banking,
  payment custody, government identity verification, and safety-critical machinery control.
- Sensitive industries (healthcare, law, accounting, cooperatives, insurance, lending,
  government, etc.) display caution notices sourced from the original market notes.
- The demos are sales aids, **not production-ready software**. Final requirements,
  integrations, security controls, cost, and timeline require a separate discovery and
  technical assessment.
