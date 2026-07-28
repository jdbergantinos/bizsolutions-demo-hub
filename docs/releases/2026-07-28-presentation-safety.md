# Release Record — Presentation Safety Polish

## Identification

- **Release name:** Presentation Safety Polish
- **Date recorded:** 2026-07-28 (Asia/Manila)
- **Owner/approver:** John, Product Owner
- **Application source commit:** `35a6ba3` on `main` (app content identical to `3338c51`;
  `35a6ba3` added governance documentation only)
- **Live deployment commit:** `gh-pages` `4707a98` — "Deploy: presentation
  client-mismatch banner + empty-section guidance"
- **Previous live deployment:** `gh-pages` `586eb71`
- **Deployment provenance:** GitHub repository Activity attributes the force push from
  `586eb71` to `4707a98` to the account `jdbergantinos`, and displays the event as
  occurring seven days before 2026-07-28 — that is, on 2026-07-21.
- **Live URL:** https://jdbergantinos.github.io/bizsolutions-demo-hub/

## Scope of this release

Application commits included (both Shared Core — Now, per `/docs/APPROVED-SCOPE.md`):

1. `8ab421a` — **Client-mismatch warning** in Presentation Mode (`/present`): an amber
   banner when the staged presentation's client differs from the active client, with a
   one-tap switch; shown on both the setup screen and the running presentation, and
   never changes anything until tapped.
2. `3338c51` — **Empty-section guidance** in the Presentation Builder and Guided
   Presentation (`/presentation-builder`, `/presentation`): empty sections show the
   presenter a specific fill-or-hide guide with "Set up this section" and "Hide this
   section" actions; client view shows a neutral "Details to follow." and never an
   unexplained blank slide.

Not included: no storage-key changes, no PWA-configuration changes, no dependency
changes, no pricing changes, no route additions or removals.

## Verification evidence (2026-07-28)

All testing used fictional sample data only. No real prospect information was used.

### Automated and build verification

- **Type-check:** `npx tsc -p tsconfig.app.json --noEmit` — **passed**, zero errors.
- **Unit tests:** `npx vitest run` — **58/58 passed** (6 test files).
- **Production build:** `npm ci` + `npm run build` in an isolated Git worktree of
  `35a6ba3` — **passed**; PWA service worker generated (13 precache entries); output
  bundles byte-identical to the deployed build (`assets/index-BRFRR8u_.js`).

### Runtime preview verification (desktop, isolated browser context)

- **Required routes — passed:** all 11 main routes rendered with zero console errors and
  zero failed asset requests.
- **Release features — passed:** client-mismatch banner (including the one-tap switch),
  empty-section guidance, hide-section behavior (16 → 15 slides), and client-view
  neutrality all verified end-to-end.
- **Regression — passed:** demo record create/edit/delete; profile, discovery, and
  presentation persistence across reload; localStorage schema unchanged.

### Live-site verification

- **Passed:** the live URL serves the release bundle (`assets/index-BRFRR8u_.js`), and
  both release features' UI strings are present in the served bundle.

### Installed-phone verification (completed on device)

- **Installed PWA opened successfully — passed.**
- **No update prompt appeared.** *(Inference, not a sourced measurement: the installed
  app was already serving the current deployed version, so no update was pending.)*
- **Empty-section guidance — passed.** The Presentation Builder preview showed
  "This section isn't set up yet", "Set up this section", and "Hide this section".
- **Client-facing view — passed.** Presenter controls were hidden and the section showed
  "Details to follow."
- **Offline verification — passed.** The installed PWA opened and worked in Airplane
  mode.
- **Presentation Mode mismatch test — passed.** Active client *FreshOps*, presentation
  client *Sample Client Beta*: the warning appeared.
- **Matching-client resolution — passed.** "Switch to FreshOps" restored the matching
  client and the warning disappeared.

### Behavior note

The client-mismatch banner keys off the **active discovery's client** (the Discovery
workspace concept), not the active profile alone — expected behavior per the feature's
design.

## Rollback

- **Rollback reference:** annotated tag `gh-pages-rollback-2026-07-28`, pointing to
  `586eb71` (the deployment live prior to this release). Pushing that tag's tree back to
  `gh-pages` restores the previous version without a rebuild.
- Rollback was **not** required: all verification passed.

## Final release status

**Verified and operational.**

| Check | Result |
| --- | --- |
| Production build | Passed |
| Type checking | Passed |
| Unit tests | 58/58 passed |
| Runtime preview | Passed |
| Required routes | Passed |
| Live-site verification | Passed |
| Installed-phone presentation verification | Passed |
| Offline verification | Passed |
| Rollback reference | `gh-pages-rollback-2026-07-28` → `586eb71` |

## Remaining limitations

- The main JavaScript bundle remains large (single ~1.3 MB chunk); code-splitting is a
  separate future change, not part of this release.
- Known dependency vulnerabilities remain outstanding and are a separate controlled
  maintenance decision.
- The deployment process is manual (local build pushed to `gh-pages`).
- `.nojekyll` is not produced by the build and must be preserved or re-created during
  future deployments.
- Real prospect data remains local-device data and requires careful operational
  handling, including regular manual backups stored off the device.

Open product questions recorded in `/docs/APPROVED-SCOPE.md` §8 are unchanged by this
release.
