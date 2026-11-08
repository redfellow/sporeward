# Design

Document existing behavior only. Each requirement maps to a focused existing test, or to a source reference where the only check needs PostgreSQL. Uncertain or unbuilt behavior goes under Open questions, not into requirements. The footprint endpoint, accounts, upload idempotency and scoring stay with their owning changes and parts.

## Evidence map

- Atomic snapshot, retries and restart: `apps/server/src/world-store.test.ts`.
- Bounded catch-up, archive merge, history-preserving contour and shoreline upgrades: `apps/server/src/spatial/world-history.test.ts`.
- PostGIS history persistence: `apps/server/src/database/world.test.ts` (mocked `pg`, fast).
- World view fields: `apps/server/src/outbreak-view.test.ts`.
- Spatial generation and access: `apps/server/src/spatial/generate.test.ts`, `world-store.test.ts` (fixture access paths).
- Separation and growth: `apps/server/src/spatial/resize.test.ts`, `continuous.test.ts`, `lifecycle.test.ts`.
- Guarded import: source reference `apps/server/src/database/import.ts` only.

## Open questions

- No fast test covers protocol `parseWorldView` budget limits directly; it is cited by source (`packages/protocol/src/world.ts`) only.
- Multi-instance PostgreSQL concurrency beyond a single locked client is not specified.
