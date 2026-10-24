# Proposal

## Why

The Android recorder already persists fixes and segments in SQLite and can recover an active outing after an app or location-service interruption, but this behavior has no dedicated capability contract or focused automated coverage. A narrow recovery contract will make continuity and route-gap behavior reviewable while keeping device reliability as a separate acceptance gate.

## What Changes

- Define Android recovery behavior for an active outing when the app returns and the location service is missing or stopped.
- Require recovery to preserve saved fixes, close the interrupted segment at the last saved fix, and continue in a new segment without drawing a continuous route across the interruption.
- Require recovery failures to leave the outing saved and paused with an understandable status.
- Add focused storage/state tests and isolated Android emulator replay coverage for process interruption and failed recovery.
- Keep offline upload retry, production readiness, iOS, third-party integrations, privacy, scoring, and outdoor reliability claims outside this change.

## Capabilities

### New Capabilities

- `native-recording-recovery`: Android active-outing recovery after app or location-service interruption, including durable route-section boundaries and a visible recovery outcome.

### Modified Capabilities

None. The `activity-recording` MVP source contract remains unchanged.

## Impact

The change is expected to affect `apps/mobile/src/recording/recorder.ts`, `apps/mobile/src/recording/store.ts`, focused recorder/storage tests, and the isolated Android replay runner or its documentation. It introduces no API, server, database, or dependency changes. Automated tests and emulator replay can verify state transitions and route segmentation; they cannot establish reliable background GPS behavior on physical devices.
