# Fix cleaning-lab check for paths with spaces

## Why
`npm run check:lab` fails on main when the checkout path contains a space (e.g. `Application Support`). `scripts/build-cleaning-lab.mjs` passes `new URL(...).pathname` to esbuild, which keeps `%20` encoding, so the entry `packages/game/src/index.ts` cannot be resolved.

## What Changes
- In `scripts/build-cleaning-lab.mjs`, convert the entry URL with `fileURLToPath` from `node:url` instead of `.pathname`.

## Acceptance
- `npm run check:lab` passes from this worktree (whose path contains a space).

## Citations
- scripts/build-cleaning-lab.mjs:5

## Assumptions
- The embedded engine in the lab HTML is otherwise current; if the check then reports staleness, run `npm run build:lab` to regenerate it (alternative ruled out: leaving the check red).
