# Tasks

## 1. Validate the documented contracts

- [x] 1.1 Confirm the replay and showcase requirements match their cited tests
  - proof: `npx vitest run apps/server/src/replay/timeline.test.ts apps/server/src/replay/scenario.test.ts apps/server/src/replay/native-plan.test.ts apps/server/src/replay/showcase.test.ts apps/server/src/replay/showcase-clock.test.ts apps/server/src/replay/presentation.test.ts tests/mobile-replay-bridge.test.ts scripts/replay/resistance-postgis-support.test.ts`
- [x] 1.2 Confirm the rendering and guide artwork requirements match their cited tests
  - proof: `npx vitest run apps/web/src/rendering/footprint.test.ts packages/rendering/src/survey-station.test.ts`
- [x] 1.3 Validate the change strictly
  - proof: `openspec validate specs-for-desktop-visual-guides-visual-s --strict`
