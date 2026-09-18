# Release Record — Route-Level Code Splitting

## Identification

- **Release name:** Route-Level Code Splitting
- **Date recorded:** 2026-09-18 (Asia/Manila)
- **Owner/approver:** John, Product Owner
- **Application source commit:** `8569fce` on `main` — "perf: load each screen on demand
  (route-level code splitting) (#14)"
- **Live deployment commit:** `gh-pages` `03f9c01` — "Deploy: Route-level code splitting
  (main 8569fce)" (normal push; no force push)
- **Previous live deployment:** `gh-pages` `a96356e` (React Router 7 Upgrade, earlier the
  same day)
- **Deployment provenance:** first production run of the **Deploy to GitHub Pages**
  workflow (`.github/workflows/deploy.yml`, run 2,
  https://github.com/jdbergantinos/bizsolutions-demo-hub/actions/runs/35324584913),
  triggered by John's instruction during a Claude Code session; every step succeeded in
  32 seconds. GitHub Pages reported the build of `03f9c01` as `built` with no error at
  2026-09-18T08:29:51Z.
- **Live URL:** https://jdbergantinos.github.io/bizsolutions-demo-hub/

## Scope of this release

One application commit, Shared Core — Now, performance maintenance. Merged through pull
request #14 after John's explicit approval (PWA-affecting change per CLAUDE.md §6).

- **Every screen except Home is loaded on demand** (`React.lazy` in `src/App.tsx`). The
  main JavaScript bundle shrinks from **1,321 KB to 381 KB**; Vite now emits 84 chunks.
  The largest on-demand chunk is the demo runner (471 KB, charts and demo engines),
  fetched only when a demo opens.
- **Offline unchanged by design:** the service worker precaches all 84 chunks
  (95 precache entries, up from 13), so installed devices still hold the whole app.
- **New `PageLoader`** placeholder while a chunk is fetched; `Suspense` around the
  layout's `Outlet` (navigation chrome stays in place) and around the full-screen routes.
- **`ErrorBoundary`** gains a chunk-load-failure branch: if a device still running an
  older version requests a chunk that a newer deployment removed, it shows "This screen
  needs a quick reload" with a one-tap **Reload app** instead of the generic error.

Not included: no route, storage-key, PWA-configuration, dependency, or pricing changes.

## Verification evidence (2026-09-18)

All testing used fictional sample data only. No real prospect information was used.

### Automated and build verification

- **Type-check:** `npx tsc -p tsconfig.app.json --noEmit` — **passed**.
- **Unit tests:** `npm test` (vitest) — **58/58 passed** (6 test files).
- **Production build:** `npx vite build` — **passed**; 84 chunks; 95 precache entries;
  every emitted chunk name present in `dist/sw.js`.
- **CI:** the pull request's workflow (tests and build) **passed** before merge; the
  deploy workflow repeated `npm ci`, tests, type-check, and build on the runner.

### Runtime preview verification (desktop dev server, isolated browser context)

- **All 38 routes — passed:** every route in `src/App.tsx` (including both demo routes,
  the query-string pricing route, `/presentation`, `/intake`, and an unknown path)
  rendered content with the loading placeholder gone; zero console errors, zero window
  errors, zero unhandled rejections during the sweep. Longest wait for a screen's chunk
  in the dev server: 450 ms.
- **Navigation — passed:** industry card link → detail page → Back; no loader left on
  screen.

### Live-site verification

- **Deploy workflow — passed:** all steps green; `gh-pages` diff shows 88 files changed
  (old single bundle removed, 84 chunks added, `index.html` and `sw.js` updated).
- **GitHub Pages build — passed:** `pages/builds/latest` reports commit `03f9c01`,
  status `built`, no error.
- **Direct HTTP fetch of the live page — not performed** (session permission rules block
  outbound fetches to the live URL).

### Installed-phone verification (completed by John on 2026-09-18)

All five checks **passed**, as reported by John after performing them on the installed
device:

1. **Update prompt — passed.** The installed app showed the update notice and restarted
   on the new version.
2. **Navigation — passed.** Home → Industries → industry → service → Demo → back; every
   screen loaded.
3. **Configurator — passed.** New estimate, Next twice, Previous.
4. **Offline, including unvisited screens — passed.** In Airplane mode, after closing and
   reopening the app, Settings, Discovery, an industry, and a Demo not opened in step 2
   all loaded. This confirms the precache holds every chunk, not only visited ones.
5. **Post-update navigation — passed.** Back online, a screen not opened earlier that day
   loaded normally; the "needs a quick reload" fallback did not appear.

## Rollback

- **Rollback reference:** annotated tag `gh-pages-rollback-2026-09-18-run2`, pointing to
  `a96356e` (the deployment live prior to this release); pushed by the workflow. Pushing
  that tag's tree back to `gh-pages` restores the previous version without a rebuild.
- Rollback was **not** required.

## Final release status

**Verified and operational.**

| Check | Result |
| --- | --- |
| Production build | Passed (84 chunks, 95 precache entries) |
| Type checking | Passed |
| Unit tests | 58/58 passed |
| CI on pull request | Passed |
| Runtime preview, all 38 routes | Passed |
| Deploy workflow (first production run) | Passed |
| GitHub Pages build | Passed (`built`, no error) |
| Live-site HTTP fetch | Not performed (permission-blocked in session) |
| Installed-phone verification | Passed |
| Offline verification (including an unvisited screen) | Passed (phone) |
| Rollback reference | `gh-pages-rollback-2026-09-18-run2` → `a96356e` |

## Remaining limitations

- The demo runner chunk (471 KB) is the largest single download after the core; splitting
  the chart library out of it is a possible further step, not part of this release.
- The chunk-load-failure fallback has not been exercised on a device; it only triggers
  when an old, still-open version requests a chunk removed by a newer deployment.
- Total JavaScript across all chunks is about 10% larger than the single bundle (chunk
  overhead); what matters for first load and updates is the 71% smaller core.
- Build-tooling (dev-only) advisories remain in `npm audit` without `--omit=dev`.
- Real prospect data remains local-device data and requires regular manual backups stored
  off the device.
