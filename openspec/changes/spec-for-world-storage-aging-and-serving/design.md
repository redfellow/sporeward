# Design

Document existing behavior only. Each requirement maps to a focused existing test, or to a source reference where the only check needs PostgreSQL. Uncertain or unbuilt behavior goes under Open questions, not into requirements. The footprint endpoint, accounts, upload idempotency and scoring stay with their owning changes and parts.

## Evidence map

- Atomic snapshot, retries and restart: `apps/server/src/world-store.test.ts`.
- Bounded catch-up, archive merge, history-preserving contour and shoreline upgrades: `apps/server/src/spatial/world-history.test.ts`.
- PostGIS history persistence: `apps/server/src/database/world.test.ts` (mocked `pg`, fast).
- World view fields, protocol shape check and older responses: `apps/server/src/outbreak-view.test.ts`.
- Spatial generation and access: `apps/server/src/spatial/generate.test.ts`, `world-store.test.ts` (fixture access paths).
- Separation and growth: `apps/server/src/spatial/resize.test.ts`, `continuous.test.ts`, `lifecycle.test.ts`.
- Guarded import: source references `apps/server/src/database/world.ts` `importSnapshot` (rejects a different source hash and an existing world without an import record), `apps/server/src/database/import.ts` (snapshot shape validation) and `scripts/migration/check-import.mts` only (needs PostgreSQL); no fast test.
- Failed write leaves the previous state intact: source reference `apps/server/src/world-store.ts` (writes a temporary file, fsyncs it and renames it over the snapshot) and one database transaction per step (`apps/server/src/database/world.ts`); `world-store.test.ts` covers only retries and restart.

## Open questions

- No fast test covers protocol `parseWorldView` geometry budget limits; they exist in source (`packages/protocol/src/world.ts`) but are not specified until tested.
- No cited test checks that the world view omits retired outbreaks or cleaned ones past cleanup protection, or shows Field Lab and Resistance sections only when enabled (Field Lab and Resistance belong to part 3); the requirement does not claim them.
- Migration tests assert unchanged scores and contributions only; unchanged bonuses and activity records are recorded in `docs/field-migration.md` but not tested, so are not specified.
- Excluding `access=customers/delivery/destination` routes as restricted is in `publicAccess` source but untested; the requirement names only private and doubly closed routes.
- Multi-instance PostgreSQL concurrency beyond a single locked client is not specified.
