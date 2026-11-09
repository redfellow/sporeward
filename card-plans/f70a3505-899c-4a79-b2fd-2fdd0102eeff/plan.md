# Unblock main's install and unit checks

## Why
main's install and unit checks fail since a934bd4 (#31). That commit only changed OpenSpec Markdown files, so the code is not the cause. The sandbox blocked writes outside the `_main` worktree. `npm ci` tried to write into `/Users/red/Koodit/sporeward/node_modules`, which suggests `_main`'s node_modules points at the main checkout. Vitest could not create its API token in `~/Library/Application Support/vitest` or in that node_modules either.

## What Changes
Nothing in the repo. The user chose to fix this in härvääjä's worktree and sandbox setup.

## Acceptance
- main's install and unit checks pass again, and auto merge resumes.

## Citations
- `git show --stat a934bd4`: OpenSpec files only.
- `.harvaaja/checks.yaml`: install `npm ci`, unit `npx vitest run`.
- Vitest `resolveApiToken`: the two token paths named above.

## Assumptions
- The local sandbox caused the failure, not a dependency change. Ruled out: a repo workaround in a Vitest config. The user declined it, and it would not fix install anyway.
