# ADR 0001: Defer the React Router 7 upgrade and accept two moderate advisories

Date: 2026-09-18
Status: superseded 2026-09-18 — the React Router 7 upgrade landed the same day in PR #12 (main `38999f8`); the two advisories are cleared and this risk acceptance no longer applies
Decider: John
Governance link: none - technical decision. Related open question: APPROVED-SCOPE.md §8, "Whether and when to update dependencies with known vulnerabilities."

## Context

`npm audit` reports two moderate advisories against the shipped router,
`react-router-dom` 6.30.4 (declared range `^6.28.1`):

- GHSA-wrjc-x8rr-h8h6 — open redirect via backslash in `<Link>` and `useNavigate`
  (vulnerable `>=6.0.0 <7.18.0`)
- GHSA-337j-9hxr-rhxg — arbitrary constructor injection in `deserializeErrors()`
  during server-side rendering hydration (vulnerable `>=6.4.0 <7.18.0`)

Facts established on 2026-09-18:

- No 6.x release fixes either advisory. A trial patch bump to 6.30.6 was installed,
  passed type check, 58 unit tests, and a production build, but `npm audit` still
  reported both findings. The bump was reverted; the tree is unchanged.
- The only fix npm offers is `react-router-dom` 7.18.4, a major version.
- 41 source files import from `react-router-dom`. The app uses `HashRouter`,
  `Routes`, `Route`, `Outlet`, `Link`, `NavLink`, `useNavigate` (33 call sites),
  `useSearchParams`, `useParams`, and `useLocation`.
- The app has no server and never uses server-side rendering, so the second
  advisory does not apply.
- The first advisory requires the app to navigate to an attacker-controlled path.
  Navigation targets are internal. Not every place where a URL query parameter
  feeds a navigation call was audited, so exposure is judged low, not zero. The
  app runs offline on a single presenter's device.
- Project rules classify a router upgrade as an architecture-level change that
  requires install, offline, caching, and update-prompt verification on a real
  device before release.

Three options were presented to John: (1) upgrade to React Router 7 as its own
task on a branch; (2) accept the risk for now and record it; (3) do nothing.
John chose option 2.

## Decision

John accepts the two moderate React Router 6 advisories as low risk for the
current single-user, offline, no-server deployment, and defers the React Router 7
upgrade to a separately approved task.

## Alternatives rejected

- **Patch bump to 6.30.6.** Tried and reverted: it does not fix either advisory.
- **Upgrade to React Router 7.18.4 now.** Not rejected permanently, but deferred.
  It is a major version with behavior changes at the core of a live sales PWA,
  and the pricing placeholders are the item that actually blocks real client use.
  The reasoning was presented with the options; John selected this ordering.
- **Do nothing and leave it unrecorded.** Rejected because the risk acceptance
  would then exist only in a chat session, contrary to the rule that approved
  decisions live in git-tracked files.

## Consequences

- `npm audit` will continue to report two moderate findings on `react-router`
  and `react-router-dom` until the version 7 upgrade lands. Anyone reading CI or
  audit output should treat these two as known and accepted, not new.
- The React Router 7 upgrade remains on the queue as a future task. It must run
  on a branch with type check, tests, build, and the full PWA verification pass,
  and needs John's approval before merge.
- Any change that starts feeding user-supplied or URL-supplied strings into
  `useNavigate` or `<Link>` should revisit this decision, because it would
  raise the exposure of the open-redirect advisory.
- APPROVED-SCOPE.md §8 still lists dependency updates as an open question; that
  line is unchanged by this ADR and is John's to update under change control.
