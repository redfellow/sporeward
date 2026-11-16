# Fix broken native field guide link in player rules

## Why
The unit test `tests/mobile-resistance-overview-sheet.test.ts` checks that every link in `docs/player-rules.md` points to a file that exists, and it fails on `main`. The change `add-native-field-guide` was archived to `openspec/changes/archive/2026-11-16-add-native-field-guide/`, but line 5 of the rules doc still links to `../openspec/changes/add-native-field-guide/tasks.md`, which no longer exists.

## What Changes
- Change the "native guide change" link in `docs/player-rules.md` to `../openspec/changes/archive/2026-11-16-add-native-field-guide/tasks.md`.

## Acceptance
- `npx vitest run tests/mobile-resistance-overview-sheet.test.ts` passes.

## Citations
- docs/player-rules.md:5
- tests/mobile-resistance-overview-sheet.test.ts:39-43
- openspec/changes/archive/2026-11-16-add-native-field-guide/tasks.md

## Assumptions
- The link stays and points to the archived tasks file. The alternative was to remove the link.
