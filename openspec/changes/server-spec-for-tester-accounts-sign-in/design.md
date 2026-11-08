# Design

Documentation-only change. Each added requirement maps to merged code: `apps/server/src/app.ts` (routes, auth hooks, receipts, `/scores`), `apps/server/src/accounts/store.ts` (invites, passwords, sessions, legacy owner), `apps/server/src/activity-store.ts` (owner-hashed immutable files, first receipt wins) and `packages/protocol/src/activities.ts` / `scores.ts` (batch parsing, receipt reasons, score payload). Tests backing them: `apps/server/src/accounts/api.test.ts`, `apps/server/src/activity-store.test.ts`, `apps/server/src/app.test.ts`.

Numeric limits (1000-fix batches, 500 m, 24 h window, 30-day session, 7-day invite) are stated because they are observable contract today; balance tuning would modify these requirements later. Footprint, lab-offer and world-view routes stay with their owning parts.
