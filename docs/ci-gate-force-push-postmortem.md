# Why `develop` lost its CI gate once, and what stops it recurring

Kanban card `t_20cbdbae` recovered a gate that a force-push of `develop` removed.
This note records what is actually established about the incident, so the next
occurrence is diagnosable rather than mysterious, and is the `project-steward`
follow-up the card asked for.

## What happened

1. PR #30 merged `ci(portal): add the missing install/typecheck/lint/test gate` into `develop`.
2. `develop` was force-pushed at 2026-10-03T02:59:18Z (`52dd81f0b...4b17ab6c6`, non-descendant),
   and `.github/` vanished.
3. Every bot merge in that window became unreachable; the gate ran for ~11 hours, then
   disappeared. (PR #30 merged 2026-10-02T16:18:07Z; the force-push landed 10h41m later.)
4. **Eight** PRs (#20, #22, #26, #27, #28, #29, #30, #31) had to be re-landed forward as #32-#36.

Ancestry is verified, not assumed: `git merge-base --is-ancestor <merge-sha> origin/develop`
fails for all eight merge commits (`26906efd4`, `6914639a6`, `f0a1c6ae0`, `fd3e68060`,
`03f386749`, `298719d80`, `d6ecf3e43`, `52dd81f0b`).

The dompurify bump from #26 survived only because human commit `57776ee46` ("Bump vulnerable
dependencies flagged by OSV scanner", Ilja Livenson) independently raised the same pin — there
is no dompurify commit anywhere in the re-land range `ef40d1ada..f93afcad8`. That is luck, not
preservation.

## Root cause: UNVERIFIED

**What force-pushed `develop`, and why, is not established.** An earlier revision of this note
asserted a `git reset --hard origin/<branch>` reconcile against upstream `waldur/waldur-homeport`
and that it was "not a bot action". Both were unsupported. Nothing in the evidence identifies an
actor, and the "not a bot action" half is positively contradicted by what the audit trail can and
cannot show:

- Every one of the 12 `develop` pushes in the window 2026-10-02..10-04 is attributed by the
  GitHub events API to the **same single actor, `jaeko44`** — including both the fleet's bot
  merges and the push carrying Ilja Livenson's own human commit.
- `jaeko44` is the `gh` auth identity on this host. Every fleet merge therefore attributes to
  the same login as a human push, so **actor attribution carries no discriminating power**.
- Every `PushEvent` payload in that window is stripped: `after=None`, `size=None`, `commits=0`.
  The force-push event retains only `before=52dd81f0b`.

So the trail cannot distinguish a bot from a human here. Treat the actor as open.

The upstream-reconcile theory is *mechanically possible* — this repo **is** a fork of
`waldur/waldur-homeport` with a live `upstream` remote — but possible is not evidenced.

### The ESTATE.md analogy is a different mechanism

ESTATE.md records the same *consequence* class (landed work disappears) for `main` at **lines
1385-1395** (`t_9d87174e`), where `hermes_cli/update_cmd.py::_reconcile_diverged_checkout` ran
`git reset --hard origin/main` on the hermes-ops **clone**. That is a **local** branch reset: it
destroys local commits that were never pushed. This incident is the opposite — the **remote**
`develop` was rewritten, which requires a force-update operation (for example, a force push; the
exact mechanism is not evidenced — GitHub's UI/API and automation can all force-update a branch)
and took eight PRs that had already merged *for everyone*.

Two consequences that matter:

1. The local reset *by itself* cannot have caused this one — resetting a clone does not rewrite a
   remote branch — and citing it as cause is wrong. That is narrower than ruling the incident out
   of the hermes-ops update path entirely: an unverified automation sequence that resets locally
   *and then* performs a remote force update is not excluded by this evidence, and nothing here
   should be read as clearing any particular script.
2. The fixes are disjoint. `allow_force_pushes: false` blocks *this* incident and does nothing
   about a local reset; `bin/check-landing-durability.py` guards the local-reset class and does
   nothing about a remote rewrite.

The estate's own record of *this* incident is `bin/check-orphaned-merges.py` (`t_0073e2ad`),
which names the force-push and the eight orphaned PRs.

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
  Setting it is a repo-admin change = human-only. Tracked as kanban `t_23b6c597`.
  Required contexts must be the job **display names** — `Lockfile (yarn install --immutable)`
  and `Typecheck, lint, test` (verified against the check runs on the `develop` tip), not the
  `lockfile`/`verify` job *keys* in `.github/workflows/ci.yaml`; GitHub matches on the display
  name, so the keys would silently never be satisfied.
- **`required_pull_request_reviews` is unset.** The estate's merge gate (`safe-merge.py`)
  enforces author policy in the bot fleet, but GitHub itself enforces nothing.

Both are one-click repo-admin settings. Neither is an agent action.

## If you see this again

- `git fetch origin develop` printing `... (forced update)` is the tell.
- Do **not** respond with a force-push to repair the branch. Restore forward via PRs.
- `git ls-tree -r --name-only origin/develop -- .github` returning empty means the gate is gone.
- **Do not attribute an actor from the events API alone.** Every push on this repo lands as
  `jaeko44`, so that trail cannot tell a bot from a human (see *Root cause* above). Reach for
  a signal that is not the shared token: the estate's `refs/hermes-landing/` refs,
  `bin/check-orphaned-merges.py`, and `bin/check-landing-durability.py`.