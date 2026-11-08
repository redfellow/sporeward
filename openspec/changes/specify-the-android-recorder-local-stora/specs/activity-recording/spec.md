# Spec Delta

## ADDED Requirements

### Requirement: Single explicit recording lifecycle
The Android recorder SHALL allow at most one unfinished outing, owned by the signed-in account. Finishing SHALL require an explicit confirmation. A recording that reaches 24 hours SHALL be paused, not finished, until the player resumes or finishes it. Source: `apps/mobile/src/recording/store.ts` (`begin`, `transition`), `recorder.ts`, `confirm-finish.ts`.

#### Scenario: Reach the recording limit
- **WHEN** an outing has been recording for 24 hours
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
