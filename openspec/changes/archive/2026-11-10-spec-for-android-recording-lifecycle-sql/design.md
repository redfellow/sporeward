# Design

Documentation-only change. Each added requirement maps to merged code:

- Lifecycle and persistence: `apps/mobile/src/recording/store.ts` (`begin`, `transition`, `saveFixes`, `recent`, `assertOwner`), `recorder.ts` (24-hour deadline, `pause`), `confirm-finish.ts`; `model.ts` with `model.test.ts`.
- Upload retry: `apps/mobile/src/server/sync.ts` (`syncActivity`, `syncPendingActivities`, 60 s retry), `upload.ts` (chunked upload, receipt validation).
- Recovery resume: `recording/recovery.ts` with `recovery.test.ts`.
- Route gaps: `model.ts` `routeGeometry`, `model.test.ts`.
- World refresh: `server/use-world.ts` (20 s active poll, foreground refresh, cache per player), `world-provenance.ts` with `world-provenance.test.ts`.

The server side of upload and the encounter/footprint contracts belong to parts 1 and 3 and the active history change.
