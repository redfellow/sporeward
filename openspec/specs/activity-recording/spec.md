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
