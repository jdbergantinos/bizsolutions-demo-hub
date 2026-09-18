# Release Record — Owner-Approved Pricing Ranges

## Identification

- **Release name:** Owner-Approved Pricing Ranges
- **Date recorded:** 2026-09-18 (Asia/Manila)
- **Owner/approver:** John, Product Owner
- **Application source commit:** `b833598` on `main` — "pricing: apply owner-approved
  market-researched price ranges"
- **Live deployment commit:** `gh-pages` `0c9b226` — "Deploy: owner-approved pricing
  ranges (main b833598)" (normal push on top of the previous deployment; no force push)
- **Previous live deployment:** `gh-pages` `4707a98`
- **Deployment provenance:** pushed from John's machine during a Claude Code session on
  2026-09-18; GitHub Pages reported the build of `0c9b226` as `built` with no error at
  2026-09-18T06:50:57Z (read via the GitHub API in the same session).
- **Live URL:** https://jdbergantinos.github.io/bizsolutions-demo-hub/

## Scope of this release

One application commit, Shared Core — Now, per `/docs/APPROVED-SCOPE.md` §4 (pricing
configurator with preliminary ranges). It changes seed data and two notice strings only;
no engine logic changed.

- **Seed prices replaced** in `src/pricing/config/`: Shared and Configured SaaS base fees,
  all 20 module prices and the six industry-specific overrides, ten commonly sold optional
  services, the Basic/Standard/Priority support plans, and the extra-user monthly charge.
  Base monthly fees are now platform-level charges; module fees carry the value.
- **Price table stamped** `owner-2026.09.18` with `lastPriceReviewDate` set and a source
  label stating the ranges are owner-approved from Philippine market research and remain
  preliminary.
- **Notices reworded** in Settings and Pricing Administration: they no longer claim the
  prices "require owner review"; they state that estimates remain preliminary and are never
  binding quotations.
- **README** pricing note updated; one unit-test assertion updated for a scaled override.

Still internal placeholders (unchanged): Custom-Built, White-Label, and Exclusive delivery
models; optional services other than the ten approved; Dedicated and Custom SLA support
plans; business-size and configuration-level factors; industry-risk rules.

Not included: no storage-key changes, no PWA-configuration changes, no dependency changes,
no route additions or removals.

Approval basis: two market-research reports supplied by John on 2026-09-18 and reconciled
against the previous placeholders; John approved the reconciled values in the same session.
The decisions are recorded in the private, gitignored `PRICING-WORKSHEET.md` on John's
machine, per `/docs/APPROVED-SCOPE.md` §7 (pricing decisions stay outside the public repo).

## Verification evidence (2026-09-18)

All testing used fictional sample data only. No real prospect information was used.

### Automated and build verification

- **Type-check:** `npx tsc -p tsconfig.app.json --noEmit` — **passed**, zero errors.
- **Unit tests:** `npm test` (vitest) — **58/58 passed** (6 test files).
- **Production build:** `node scripts/generate-icons.mjs` + `npx vite build` from the
  committed `b833598` tree — **passed**; PWA service worker generated (13 precache
  entries); bundle `assets/index-DiE__fW6.js` contains the string `owner-2026.09.18`.
- **Seed replacement audit:** the 53 value/text replacements were applied by a script that
  required each target to match exactly once; all 53 matched.
- **CI:** the push of `b833598` triggered the repository workflow (tests and build).

### Runtime preview verification (desktop dev server, isolated browser context)

- **Pricing Administration — passed:** shows version `owner-2026.09.18 · seed` and the new
  source label; the reworded notice appears.
- **Configurator walkthrough — passed:** micro salon, Online booking only, Shared SaaS,
  Standard level, Self-Service support. Results page showed one-time ₱12,000–₱22,000
  (including 7% contingency) and monthly ₱2,000–₱3,600 (including two users beyond the
  micro allowance); service cards, delivery models, and support plans displayed the new
  ranges. Zero console errors.

### Live-site verification

- **GitHub Pages build — passed:** `pages/builds/latest` reports commit `0c9b226`,
  status `built`, no error.
- **Direct HTTP fetch of the live page — not performed.** The session's permission rules
  blocked outbound fetches to the live URL. The served bundle was therefore not
  re-downloaded and compared in this session; the gh-pages diff shows only `index.html`,
  `sw.js`, and the renamed JavaScript bundle changed (`.nojekyll`, icons, manifest, and
  CSS identical to the previous deployment).

### Installed-phone verification (completed by John on 2026-09-18)

All five checks **passed**, as reported by John after performing them on the installed
device:

1. **Update prompt — passed.** The installed app showed the update notice and restarted
   on the new version.
2. **Version check — passed.** Settings → Pricing showed **Price-table version**
   `owner-2026.09.18` and **Last price review** `2026-09-18`.
3. **New estimate — passed.** The Delivery Model step showed Shared SaaS at
   ₱6,000–₱12,000 one-time and ₱800–₱1,200/mo.
4. **Saved estimate — passed.** A previously saved estimate still opened, with its
   original price-table version in its header (expected behavior).
5. **Offline — passed.** In Airplane mode the app opened and the configurator worked.

## Rollback

- **Rollback reference:** annotated tag `gh-pages-rollback-2026-09-18`, pointing to
  `4707a98` (the deployment live prior to this release); pushed to origin. Pushing that
  tag's tree back to `gh-pages` restores the previous version without a rebuild.
- Rollback was **not** required.

## Final release status

**Verified and operational.**

| Check | Result |
| --- | --- |
| Production build | Passed |
| Type checking | Passed |
| Unit tests | 58/58 passed |
| Runtime preview | Passed |
| GitHub Pages build | Passed (`built`, no error) |
| Live-site HTTP fetch | Not performed (permission-blocked in session) |
| Installed-phone verification | Passed |
| Offline verification | Passed (phone) |
| Rollback reference | `gh-pages-rollback-2026-09-18` → `4707a98` |

## Remaining limitations

- Optional-service and support-plan ranges rest on thin evidence (agency labor-hour
  assumptions) in both research reports; replace with actual hours after several real
  implementations. Obtain two or three real quotes from comparable Philippine providers
  before publishing a price list.
- VAT stays disabled until John's accountant confirms the registration position
  (threshold ₱3,000,000 gross sales; rate 12%).
- The main JavaScript bundle remains a single ~1.3 MB chunk; code-splitting is a separate
  future change.
- Two moderate React Router advisories remain accepted per ADR 0001.
- The deployment process is manual (local build pushed to `gh-pages`); `.nojekyll` must be
  preserved on each deployment (it was, this time).
- Real prospect data remains local-device data and requires regular manual backups stored
  off the device.

Open product questions in `/docs/APPROVED-SCOPE.md` §8: "When real approved pricing values
should replace the placeholders" is now answered for the items listed above; the remaining
placeholders are noted in this record. Updating §8 is John's change-control decision.
