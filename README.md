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
