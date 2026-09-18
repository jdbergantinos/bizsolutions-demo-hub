# ADR 0002: Deploy through an owner-triggered GitHub Actions workflow

Date: 2026-09-18
Status: accepted (John, 2026-09-18)
Decider: John
Governance link: none - technical decision inside approved scope. Closes the open question in APPROVED-SCOPE.md §8, "Whether deployment should remain manual or later use CI/CD."

## Context

Until 2026-09-18 every deployment was manual: build locally, push `dist/` to the
`gh-pages` branch, create a rollback tag, write a release record. The 2026-07-28 audit
found the live site two commits behind `main` because of this friction. On 2026-09-18
two deployments were done by hand in one session; each took eight steps, and one
verification step was blocked by session permission rules. The scope document listed
"manual versus CI/CD" as an open question.

Project rules (CLAUDE.md §5) treat deployment as a change John must decide, and require
install, offline, caching, and update-prompt verification on a device for PWA-affecting
releases. The existing `CI` workflow already runs tests and build on every push using
`actions/checkout` and `actions/setup-node`.

John asked for the one-click deploy after it was recommended as the first technical item
following the pricing and React Router releases.

## Decision

Deployment stays a deliberate, owner-triggered step, but runs through a GitHub Actions
workflow (`.github/workflows/deploy.yml`) started by hand with `workflow_dispatch`. The
workflow repeats the manual procedure exactly: `npm ci`, unit tests, type-check,
production build, an annotated rollback tag on the currently live `gh-pages` commit,
replacement of the `gh-pages` contents with the fresh build (keeping `.nojekyll`), one
normal push, and a run summary. A `dry_run` input performs everything except the pushes.
If the build is byte-identical to what is live, the workflow stops without a new commit.
Release records in `docs/releases/` and installed-phone checks remain manual.

## Alternatives rejected

- **Deploy automatically on every push to `main`.** Rejected: it removes the deliberate
  gate the project rules require, and docs-only commits would trigger deployments.
- **Use a third-party Pages deployment action (e.g. `peaceiris/actions-gh-pages`).**
  Rejected for now: it adds a new external dependency for something four git commands
  already do, and the project rules ask for approval of new dependencies. The two actions
  used are the ones the existing CI workflow already trusts.
- **Keep deploying by hand.** Rejected: the audit and today's session both showed it is
  slow and error-prone, and it repeatedly leaves the live site behind `main`.

## Consequences

- Deploying becomes: open Actions, run the workflow, enter a release name. The rollback
  tag and the deploy commit are created the same way as before, so existing rollback
  instructions still apply.
- The workflow needs `contents: write` permission to push the tag and `gh-pages`; it runs
  under the repository's built-in `GITHUB_TOKEN`, so no secret is added.
- A `concurrency` group prevents two deployments running at once.
- Anyone with write access to the repository can trigger a deployment. Today that is John
  only; if collaborators are added, this should be revisited (environment protection rules
  are the natural next step).
- Release records and phone checks are still human steps; the run summary lists what to
  copy into the record.
- Manual deployment remains possible and follows the same convention.
- Builds are only byte-identical when made on the same platform: the first dry run on
  2026-09-18 (run 1) produced a CSS bundle that differed from the locally built
  deployment then live, so the "identical build, skip" path applies between workflow runs,
  not between a manual deployment and a workflow run.
- The dry run on 2026-09-18 (run 1, main `ee1e9bd`) passed every step and pushed nothing;
  `gh-pages` and the tag list on origin were confirmed unchanged afterwards.
