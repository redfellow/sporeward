# Design

## Context

`apps/mobile/src/recording/recorder.ts` checks persisted activity state on launch and foreground, compares the Expo location task and Android service state, and attempts to restart updates when an active outing has lost its service. `store.ts` persists activities, segments, and fixes in SQLite; recovery closes the old segment using its last saved fix and opens a new one. The recap model already treats segment changes as route breaks. See [proposal.md](proposal.md) and the [native recording recovery spec](specs/native-recording-recovery/spec.md).

The repo has model tests and isolated emulator replay, but no direct mobile SQLite/recovery state tests. Historical emulator force-stop evidence exists in [finished goals](../../../docs/finished-goals.md); it demonstrates one forced-stop run and explicitly leaves broader recovery/offline integration open.

## Goals / Non-Goals

**Goals:**

- Pin the active-outing recovery state transition and route-section boundary with focused tests.
- Exercise successful and failed recovery through isolated Android replay, checking saved fixes and user-visible status after reopen.
- Correct only defects found in those cases while preserving current activity identity and saved route data.

**Non-Goals:**

- Guarantee background GPS reception, battery behavior, or process survival on physical devices.
- Add iOS behavior, offline upload retry changes, server/API work, or production-readiness claims.
- Change route geometry, scoring, account ownership, or Android map rendering.

## Decisions

1. **Keep the existing SQLite state model and recovery entry points.** Extend focused coverage around the recorder and store instead of introducing another persistence layer or recovery service. The current `activities`, `segments`, and `fixes` records already represent a saved outing and interruption boundary.
   - *Alternative considered:* add a new recovery journal or migration. This duplicates state and creates migration risk without evidence that the current durable records are insufficient.

2. **Treat the last persisted fix as the interruption boundary.** Recovery must not estimate missing points or connect route geometry across the interval; successful recovery begins a new segment. Test recap geometry as well as stored segment state.
   - *Alternative considered:* continue the prior segment at service restart. That could visually imply route continuity through an interval with no received fixes.

3. **Retain the outing and pause on recovery failure.** Missing permission or a service-start error must not delete fixes or finish the outing. Reuse the recorder's existing status/event feedback path and test that a user can later resume explicitly.
   - *Alternative considered:* fail closed by discarding the outing. That loses user data and is not required to prevent an invalid route bridge.

4. **Use synthetic state tests plus isolated emulator replay as separate evidence.** Unit tests cover deterministic state and geometry boundaries. The emulator replay covers actual app reopen/force-stop integration in the disposable loopback environment. Any physical-device field reliability acceptance remains separate.

5. **Do not touch world or server state.** Recovery is local to Android recording. Existing field-world snapshots, historical geometry, uploads, receipts, and account ownership remain unchanged; use disposable replay app data and test fixtures only. No map source or layer changes are planned, so MapLibre camera performance is unaffected.

## Risks / Trade-offs

- [An emulator may not reproduce vendor-specific background process behavior] → Report emulator evidence as integration evidence only and keep physical-device reliability unclaimed.
- [SQLite recovery tests could couple to native Expo setup] → Keep pure route/state boundary checks in the existing Vitest layer and limit any native persistence check to the focused Android replay path.
- [A recovery bug could accidentally alter prior recordings] → Assert byte/value preservation of pre-interruption fixes and avoid schema migrations or broad database resets.
