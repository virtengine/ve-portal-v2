# Why `develop` lost its CI gate once, and what stops it recurring

Kanban card `t_20cbdbae` recovered a gate that a force-push of `develop` removed.
This note records the root cause so the next occurrence is diagnosable rather than
mysterious, and is the `project-steward` follow-up the card asked for.

## What happened

1. PR #30 merged `ci(portal): add the missing install/typecheck/lint/test gate` into `develop`.
2. `develop` was force-pushed (`52dd81f0b...4b17ab6c6`), and `.github/` vanished.
3. Every bot merge in that window became unreachable; the gate ran for ~1 day, then disappeared.
4. Seven PRs (#20, #22, #27, #28, #29, #30, #31) had to be re-landed forward as #32-#36.

The trigger was a `git reset --hard origin/<branch>`-style reconcile against upstream
`waldur/waldur-homeport`, not a bot action. ESTATE.md records the same class of loss on
`main` at lines 1169-1185.

## Why the gate could not warn us

The `lockfile` job in `.github/workflows/ci.yaml` detects *code* regressions. It cannot
detect a branch rewrite: no workflow runs on a commit that was never pushed, and a
force-push replays no history. Only branch protection prevents the rewrite.

## Current state (verified 2026-10-05)

`develop` now has branch protection enabled:

```
allow_force_pushes: false
allow_deletions:    false
enforce_admins:     true
required_status_checks: NONE
required_pull_request_reviews: NONE
```

So the force-push that caused this loss would now be rejected by GitHub. Two gaps remain:

- **`required_status_checks` is still unset.** The gate runs, but nothing requires it to
  pass before a merge, so a red PR can still be merged without the gate's verdict.
  Setting it to require `lockfile` and `verify` is a repo-admin change = human-only.
- **`required_pull_request_reviews` is unset.** The estate's merge gate (`safe-merge.py`)
  enforces author policy in the bot fleet, but GitHub itself enforces nothing.

Both are one-click repo-admin settings. Neither is an agent action.

## If you see this again

- `git fetch origin develop` printing `... (forced update)` is the tell.
- Do **not** respond with a force-push to repair the branch. Restore forward via PRs.
- `git ls-tree -r --name-only origin/develop -- .github` returning empty means the gate is gone.