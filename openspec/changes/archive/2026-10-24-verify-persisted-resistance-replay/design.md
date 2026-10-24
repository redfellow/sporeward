# Design

## Context

The archived four-week integration runner drives authenticated activity endpoints and validates personal lab collection, stable offers, retries, recaps and restart, but it persists the world to temporary files. `PostgresWorldPersistence` already provides the production-shaped PostGIS adapter, and the native replay server can use it, though its fixed replay world is shared by local emulator sessions. The new verification must use isolated world IDs and leave the field/replay worlds intact.

## Goals / Non-Goals

**Goals:**

- Reuse normal server activity and lab endpoints with the PostGIS adapter.
- Compare matched weekday cleaning and following-week rewards with and without a weekend lab collection.
- Verify persistence across process/store reconstruction and idempotency under retry.
- Produce aggregate evidence that can be repeated without publishing GPS coordinates or changing a shared world.

**Non-Goals:**

- Change Field Lab or Resistance gameplay rules, tuning values, or player-facing UI.
- Use this replay as proof of outdoor GPS reliability, multiplayer field acceptance, or production readiness.
- Reset or migrate the owner-managed field database/world.

## Decisions

- Extend the integrated replay pattern rather than build a second simulator. Use the same `WorldStore`, authenticated activity API routes, `PostgresWorldPersistence`, and deterministic virtual timestamps.
- Require a separately named `REPLAY_DATABASE_URL`; never fall back to generic `DATABASE_URL` or the native replay server's existing world ID. Create unique, run-scoped world IDs for the comparison arms, and delete only rows bearing those IDs after results are written. Report the connected database name before starting the run.
- Use a deterministic, GPS-coordinate-free synthetic route fixture aligned with the bounded Tampere test geography. Both arms receive identical weekday contacts and timings. One arm includes the weekend lab outing; the control performs the matched outing without collecting. Record actual collection and subsequent ordinary visit outcomes; do not grade against a fixed percentage.
- Reconstruct the persistence and app adapters after the weekend collection, then retry a previously completed upload and lab collection. Confirm the persisted recap, account totals, collected state, resistance and historical contact geometry remain consistent.
- Print aggregate scenario inputs, per-week visit points, lab offer and actual restoration, following-week reward comparison, retry/restart results and cleanup status. Do not print route coordinates, usernames, or database credentials.

## Risks / Trade-offs

- [Risk] A misconfigured connection could point at a valuable database → [Mitigation] require the explicit replay-only URL, use new run-scoped IDs, never reset fixed IDs, and clean only rows created by the run.
- [Risk] A synthetic route may prove persistence but not route realism → [Mitigation] describe the evidence as deterministic integration evidence and retain the separate private-recording and field checks.
- [Risk] Scenario outcomes vary when access data or balance parameters change → [Mitigation] record fixture version, seed and parameters with the result; assert invariants rather than fixed score percentages.

## Migration Plan

No production migration. Run only against a dedicated replay PostGIS database. The runner creates isolated worlds, emits aggregate results, and removes only its own world rows in a `finally` cleanup. Existing field and emulator replay world IDs and historical footprints are outside its write scope.
