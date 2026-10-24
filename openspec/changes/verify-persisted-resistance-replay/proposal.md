# Proposal

## Why

The existing four-week Field Lab and Outbreak Resistance replay validates authenticated uploads, personal rewards, retry behavior and restart using temporary file persistence. A persisted PostGIS-backed replay remains unverified, leaving the production-shaped storage path without repeatable evidence for the intended weekday-cleaning, weekend-recovery and following-week comparison.

## What Changes

- Extend the existing isolated replay workflow to run the same deterministic multiweek scenarios through the PostGIS-backed server path.
- Compare matched no-lab and weekend-lab outings through the following workweek, reporting scenario inputs and measured outcomes without imposing a recovery percentage target.
- Verify database restart persistence, idempotent upload and collection behavior, and agreement among recaps, account totals and world state.
- Document the command, isolated database requirements, reset boundaries and limits of the evidence.

This adds replay and verification tooling only; it does not change live gameplay rules, field accounts, existing world data, or deployed services.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is isolated verification tooling for behavior already specified by `field-labs` and `outbreak-resistance`; no gameplay requirement changes.

## Impact

The existing `scripts/replay/resistance-integrated.mts`, PostGIS replay persistence in `apps/server/src/database/world.ts`, replay documentation and focused server integration checks. Runs must use a dedicated disposable PostGIS replay world and synthetic or explicitly selected private input; output must not include GPS coordinates or modify the shared field world.
