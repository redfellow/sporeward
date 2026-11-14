# Fix broken live-feedback link in player rules

## Why
`add-live-encounter-feedback` was archived (#40) to `openspec/changes/archive/2026-11-14-add-live-encounter-feedback/`, but `docs/player-rules.md:11` still links to `../openspec/changes/add-live-encounter-feedback/tasks.md`. The link-resolution test in `tests/mobile-resistance-overview-sheet.test.ts` fails on main.

## What Changes
- Repoint that link to `../openspec/changes/archive/2026-11-14-add-live-encounter-feedback/tasks.md`.

## Outcome
- Live feedback link target
  - Now: `../openspec/changes/add-live-encounter-feedback/tasks.md`
  - After: `../openspec/changes/archive/2026-11-14-add-live-encounter-feedback/tasks.md`

## Acceptance
`npx vitest run tests/mobile-resistance-overview-sheet.test.ts` passes.

## Citations
- docs/player-rules.md:11
- tests/mobile-resistance-overview-sheet.test.ts:42
- openspec/changes/archive/2026-11-14-add-live-encounter-feedback/

## Assumptions
- Keep the link (pointing at the archive) rather than removing the sentence; alternative was dropping the acceptance-tracking reference.
