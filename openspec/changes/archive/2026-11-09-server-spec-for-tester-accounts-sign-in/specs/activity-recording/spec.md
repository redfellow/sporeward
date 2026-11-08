# Spec Delta

## ADDED Requirements

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
