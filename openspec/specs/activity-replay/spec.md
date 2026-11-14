# activity-replay Specification

## Purpose
TBD - created by archiving change specs-for-desktop-visual-guides-visual-s. Update Purpose after archive.

## Requirements

### Requirement: Rebase recorded tracks without compression
Replay SHALL rebase a recorded track to a chosen start time while keeping every relative interval, including GPS gaps, pauses and a final paused period. It SHALL reject corrupt pause boundaries. Test: `apps/server/src/replay/timeline.test.ts`.

#### Scenario: Rebase a paused recording
- **WHEN** a track with a GPS gap and a final pause is rebased
- **THEN** its gap, pause and end times keep their original offsets from the new start

### Requirement: Virtual clock holds future events
The replay clock SHALL NOT deliver an event before its scheduled time, SHALL keep event order and pauses, and reset SHALL restore the baseline so the run repeats. Test: `apps/server/src/replay/timeline.test.ts`.

#### Scenario: Reset after running
- **WHEN** a replay is run, reset and run again
- **THEN** the same events are delivered in the same order at the same virtual times

### Requirement: Deterministic scenarios
A scenario run SHALL repeat its scheduled contributions and decay exactly after reset, with no upload delivered early. An invalid scenario definition SHALL be refused before the run starts. Test: `apps/server/src/replay/scenario.test.ts`.

#### Scenario: Invalid definition
- **WHEN** a scenario definition is incomplete or has an invalid world id
- **THEN** the scenario is refused before any upload

### Requirement: Native replay window gaps
Native replay SHALL stop GPS delivery when the selected window ends inside a source gap. A window that starts inside an outage SHALL position from the earlier fix and restore GPS after positioning. Test: `apps/server/src/replay/native-plan.test.ts`.

#### Scenario: Window ends in a gap
- **WHEN** the selected window ends during a source GPS gap
- **THEN** no further fixes are delivered

### Requirement: Mobile replay bridge commands apply once
The mobile replay bridge SHALL acknowledge a repeated reset without applying it twice, SHALL acknowledge an environment rejection once without retrying it, and SHALL require resetting an accelerated world before a normal-speed GPS replay. Test: `tests/mobile-replay-bridge.test.ts`.

#### Scenario: Repeated reset
- **WHEN** the same reset command arrives twice
- **THEN** the world is reset once and both are acknowledged

### Requirement: Dedicated replay database
The persisted resistance replay SHALL require its explicit dedicated database URL even when `DATABASE_URL` is set, SHALL allocate distinct run-scoped world IDs, and SHALL clean only those IDs, refusing unscoped IDs and rolling back a cleanup that partly fails. Test: `scripts/replay/resistance-postgis-support.test.ts`.

#### Scenario: Only DATABASE_URL is set
- **WHEN** the replay runs without the dedicated replay URL
- **THEN** it refuses to start
