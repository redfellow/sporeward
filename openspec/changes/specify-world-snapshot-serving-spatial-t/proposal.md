# Proposal

## Why

The authoritative shared world (how it is stored, aged on each request, served to players and migrated in the field) is shipped on main but has no owning OpenSpec capability. Growth and contact-matching specs also omit rules the server applies: occupied-ground separation, density replenishment and matching against archived footprints during catch-up.

## What Changes

- Add a `shared-world` capability documenting existing behavior: a single serialized, atomically committed world snapshot; catch-up aging in bounded one-hour transactions; the per-player world view and its protocol validation; the seeded spatial test world from a saved public access extract; and idempotent, history-preserving field migrations (guarded import, spatial upgrade, contour and shoreline preparation).
- Add requirements to `outbreak-growth` for separation from neighbouring footprints and ordinary density replenishment independent of remnants.
- Add a requirement to `gps-contact-matching` for merging archived PostGIS intervals with the transaction's current intervals.
- Documentation only: no code, gameplay or data changes.

Direction change: the Steward's direction made this part 2 of 5 of an existing-features specification effort, limited it to merged behavior backed by tests or source references, and excluded the activity-footprint endpoint (owned by `enrich-past-outing-history`). Accounts and upload idempotency go to part 1; scoring, resistance and Field Lab settlement go to part 3.

## Capabilities

### New Capabilities

- `shared-world`: World storage, aging, serving, the spatial test world and field migrations.

### Modified Capabilities

- `outbreak-growth`: Separation and replenishment applied by the server.
- `gps-contact-matching`: Archive and transaction footprint merge during processing.

## Impact

OpenSpec artifacts only. Sources: `apps/server/src/world-store.ts`, `outbreak-view.ts`, `test-outbreaks.ts`, `spatial/`, `database/`, `packages/protocol/src/world.ts`, [spatial test world](../../../docs/spatial-test-world.md), [field migration](../../../docs/field-migration.md).

## Assumptions

- A new `shared-world` capability is used because no existing spec owns storage, serving or migration; folding it into `outbreak-growth` was ruled out as a scope mismatch.
- Guarded snapshot import is backed by a source reference (`apps/server/src/database/import.ts`, `scripts/migration/check-import.mts`) because its check needs PostgreSQL; no fast test is claimed for it.
- Provisional numbers (20 replay outbreaks, 600 field density, one-hour checkpoints) are stated as current configuration, not as fixed rules.
