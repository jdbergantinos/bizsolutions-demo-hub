# Release Record — React Router 7 Upgrade

## Identification

- **Release name:** React Router 7 Upgrade
- **Date recorded:** 2026-09-18 (Asia/Manila)
- **Owner/approver:** John, Product Owner
- **Application source commit:** `38999f8` on `main` — "chore: upgrade react-router-dom
  to 7.18.4 (#12)". Deployed from `main` `371c00b`, which adds documentation only on top
  of `38999f8`.
- **Live deployment commit:** `gh-pages` `a96356e` — "Deploy: React Router 7 upgrade
  (main 38999f8)" (normal push; no force push)
- **Previous live deployment:** `gh-pages` `0c9b226` (Owner-Approved Pricing Ranges,
  earlier the same day)
- **Deployment provenance:** pushed from John's machine during a Claude Code session on
  2026-09-18; GitHub Pages reported the build of `a96356e` as `built` with no error at
  2026-09-18T08:06:45Z (read via the GitHub API in the same session).
- **Live URL:** https://jdbergantinos.github.io/bizsolutions-demo-hub/

## Scope of this release

One application commit, Shared Core — Now, maintenance. Merged through pull request #12
after John's explicit approval, per CLAUDE.md §5 (dependency change at the routing core).

- **`react-router-dom` upgraded** from 6.30.4 to 7.18.4. This clears the two moderate
  advisories previously accepted in ADR 0001 (GHSA-wrjc-x8rr-h8h6, open redirect via
  backslash; GHSA-337j-9hxr-rhxg, server-side-rendering hydration), neither of which has
  a fix on the 6.x line.
- **No source changes.** Only `package.json` and `package-lock.json` changed. The app's
  router usage (`HashRouter`, `Routes`, `Route`, `Outlet`, `Link`, `NavLink`,
  `useNavigate`, `useSearchParams`, `useParams`, `useLocation`) is unchanged in v7. The
  catch-all route is a static "Page not found" message with no links, so the v7
  relative-splat-path behavior change does not apply.
- **Documentation:** ADR 0001 marked superseded; `/docs/APPROVED-SCOPE.md` §8 updated.

Not included: no storage-key changes, no PWA-configuration changes, no pricing changes,
no route additions or removals. The pricing seeds from the earlier release today are
carried forward unchanged (bundle still contains price table `owner-2026.09.18`).

## Verification evidence (2026-09-18)

All testing used fictional sample data only. No real prospect information was used.

### Automated and build verification

- **Runtime dependency audit:** `npm audit --omit=dev` — **0 vulnerabilities** (was 2
  moderate).
- **Type-check:** `npx tsc -p tsconfig.app.json --noEmit` — **passed**, zero errors.
- **Unit tests:** `npm test` (vitest) — **58/58 passed** (6 test files).
- **Production build:** `node scripts/generate-icons.mjs` + `npx vite build` from `main`
  `371c00b` — **passed**; PWA service worker generated (13 precache entries); main bundle
  `assets/index-D3YM7F7-.js` (about 15 KB larger than the previous build).
- **CI:** the pull request's workflow (tests and build) **passed** before merge.

### Runtime preview verification (desktop dev server, isolated browser context)

- **All 37 routes — passed:** every route in `src/App.tsx`, including the industry and
  service detail routes with parameters, `/pricing/new?discovery=1` (query string), the
  full-screen `/presentation` and `/intake` routes, and an unknown path (rendered
  "Page not found"). Every route rendered content; zero console errors and zero window
  errors captured during the sweep.
- **Navigation — passed:** clicking an industry card's link navigated to the detail page;
  the page's Back button (`useNavigate`) returned to the catalog. Console clean.

### Live-site verification

- **GitHub Pages build — passed:** `pages/builds/latest` reports commit `a96356e`,
  status `built`, no error.
- **Direct HTTP fetch of the live page — not performed** (session permission rules block
  outbound fetches to the live URL). The gh-pages diff shows only `index.html`, `sw.js`,
  and the renamed JavaScript bundle changed; `.nojekyll`, icons, manifest, and CSS are
  identical to the previous deployment.

### Installed-phone verification — pending (John)

1. Open the installed app online; accept the **"Update available"** prompt.
2. Navigate: Home → Industries → open any industry → open a service → **Demo** → back.
   Every screen should load; no blank page.
3. Pricing Configurator → New estimate → Next through two or three steps → Previous.
4. Type a wrong address by hand, e.g. `…/#/nothing-here`: the "Page not found" message
   should appear and the bottom navigation should still work.
5. Airplane mode: close and reopen the app; it should open and navigate normally.

## Rollback

- **Rollback reference:** annotated tag `gh-pages-rollback-2026-09-18-2`, pointing to
  `0c9b226` (the deployment live prior to this release); pushed to origin. Pushing that
  tag's tree back to `gh-pages` restores the previous version without a rebuild.
- Rollback was **not** required.

## Final release status

**Deployed; phone verification pending.**

| Check | Result |
| --- | --- |
| Runtime dependency audit | 0 vulnerabilities |
| Production build | Passed |
| Type checking | Passed |
| Unit tests | 58/58 passed |
| CI on pull request | Passed |
| Runtime preview, all 37 routes | Passed |
| GitHub Pages build | Passed (`built`, no error) |
| Live-site HTTP fetch | Not performed (permission-blocked in session) |
| Installed-phone verification | Pending |
| Offline verification | Pending (phone) |
| Rollback reference | `gh-pages-rollback-2026-09-18-2` → `0c9b226` |

## Remaining limitations

- The main JavaScript bundle remains a single ~1.3 MB chunk; code-splitting is a separate
  future change.
- Build-tooling (dev-only) advisories remain in `npm audit` without `--omit=dev`; they do
  not ship to the browser and are a separate maintenance decision.
- The deployment process is manual (local build pushed to `gh-pages`); `.nojekyll` must be
  preserved on each deployment (it was, this time).
- Real prospect data remains local-device data and requires regular manual backups stored
  off the device.
