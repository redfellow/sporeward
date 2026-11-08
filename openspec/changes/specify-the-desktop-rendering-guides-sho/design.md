# Design

Documentation-only. Each added requirement names the test that backs it:

- Replay timeline: `apps/server/src/replay/timeline.test.ts` (`packages/protocol/src/replay.ts` rebasing, `apps/server/src/replay/timeline.ts`).
- Scenarios: `apps/server/src/replay/scenario.test.ts`. Native window: `apps/server/src/replay/native-plan.test.ts`. Bridge: `tests/mobile-replay-bridge.test.ts` (`apps/mobile/src/replay/bridge.ts`). Dedicated database: `scripts/replay/resistance-postgis-support.test.ts`.
- Showcase: `apps/server/src/replay/showcase.test.ts`, `showcase-clock.test.ts`, `presentation.test.ts`.
- Rendering lab: `apps/web/src/rendering/footprint.test.ts`. Artwork: `packages/rendering/src/survey-station.test.ts`.

Open questions (not specified): Strava catalogue and Python import behavior (covered only by `tests/replay` Python tests outside Vitest); the interactive runner's command set; PostGIS comparison report contents; the desktop guide UI (`ExplorationLabs.tsx`) controls, which have no automated test.
