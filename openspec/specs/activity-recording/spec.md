# activity-recording Specification

## Purpose

Define which activity source participates in the agreed MVP. Contact geometry, visit eligibility, scoring, upload mechanics and device reliability remain with their owning capabilities and acceptance evidence.

## Requirements

### Requirement: Native recording is the MVP activity source
MVP activity participation that earns points or cleaning SHALL originate from an outing recorded with Sporeward's native recorder and submitted for authoritative validation. This requirement does not establish outdoor recording reliability or extend to third-party imports.

#### Scenario: Submit a native-recorded outing
- **WHEN** a player records an outing with Sporeward and submits it
- **THEN** its timestamped activity proceeds through the existing contact, eligibility and scoring rules before points or cleaning are confirmed.

### Requirement: Validated batched upload
An activity SHALL be uploaded in numbered batches of at most 1000 fixes, up to 100000 fixes, with batch count matching the declared total. Each fix SHALL have a strictly increasing timestamp, valid coordinates, non-negative or absent accuracy and lie within its declared recording section. Invalid batches SHALL receive a 400 response. Source: `packages/protocol/src/activities.ts`; test: `apps/server/src/activity-store.test.ts`.

#### Scenario: Fix outside its section
- **WHEN** a batch contains a fix whose section ID is not declared
- **THEN** the batch is rejected as invalid

### Requirement: Idempotent upload and completion
Re-sending an identical batch SHALL succeed without change; a different batch for the same activity and index SHALL receive 409. Completing before all batches are stored SHALL receive 409. Repeated or concurrent completion SHALL return the first persisted receipt unchanged, including after a server restart. Test: `apps/server/src/activity-store.test.ts`.

#### Scenario: Retry completion
- **WHEN** a client completes the same activity twice
- **THEN** both responses carry the same receipt

### Requirement: Completion receipt states game eligibility
The completion receipt SHALL report fix count, recorded distance and received time, and mark the activity ineligible for game effects with reasons when distance is below 500 m (excluding gaps over 2 s or across sections), the activity ended more than 24 hours before receipt, or it ends more than 30 s in the future. Test: `apps/server/src/activity-store.test.ts`.

#### Scenario: Late upload
- **WHEN** an activity is completed more than 24 hours after it ended
- **THEN** the receipt lists `outside-upload-window` and is not eligible for game effects

### Requirement: Receipt carries processed encounters
When the world is enabled, completion SHALL process the stored activity for the authenticated player and return its encounter results with the receipt; the player's processed encounters SHALL be retrievable later by activity ID, with 404 for an unprocessed or unowned activity. Source: `apps/server/src/app.ts`.

#### Scenario: Read encounters of an unprocessed activity
- **WHEN** a tester requests encounters for an activity they have not completed
- **THEN** the server responds 404

### Requirement: Single explicit recording lifecycle
The Android recorder SHALL allow at most one unfinished outing, owned by the signed-in account. Finishing SHALL require an explicit confirmation. A recording SHALL be paused, not finished, 24 hours of wall-clock time after it started or was last explicitly resumed (an explicit resume restarts the 24 hours), until the player resumes or finishes it. Source: `apps/mobile/src/recording/store.ts` (`begin`, `transition`), `recorder.ts`, `confirm-finish.ts`.

#### Scenario: Reach the recording limit
- **WHEN** 24 hours of wall-clock time have passed since an outing started or was last explicitly resumed
- **THEN** the recorder pauses it and asks the player to resume or finish explicitly

### Requirement: Local per-account route storage
The recorder SHALL save valid timestamped fixes into the current outing's recording sections in on-device SQLite, rejecting invalid or future fixes and never joining distance across sections. The outing list SHALL show only the current account's recent outings. Test: `apps/mobile/src/recording/model.test.ts`; source: `store.ts` (`saveFixes`, `recent`).

#### Scenario: Invalid fix
- **WHEN** a fix has a non-finite time, an out-of-range coordinate or a negative accuracy
- **THEN** it is not saved

### Requirement: Durable upload outbox with retry
Finishing an outing SHALL queue its upload in the same transaction. Uploads SHALL be sent in batches, share one transfer per outing, reuse a saved receipt, and on failure keep the recording and retry about a minute later while the app is open. An upload SHALL be refused for an outing owned by another account. Source: `apps/mobile/src/server/sync.ts`, `upload.ts`, `store.ts` (`transition`, `assertOwner`).

#### Scenario: Upload interrupted
- **WHEN** an upload fails because the connection drops
- **THEN** the outing stays pending with an explanation and is retried later without losing its fixes
