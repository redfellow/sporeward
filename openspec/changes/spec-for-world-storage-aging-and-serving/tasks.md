# Tasks

## 1. Confirm evidence for the specified behavior

- [ ] 1.1 Check the `shared-world` requirements against their cited tests; correct any requirement the tests do not support.
  - proof: `npx vitest run apps/server/src/world-store.test.ts apps/server/src/outbreak-view.test.ts apps/server/src/spatial/generate.test.ts apps/server/src/spatial/world-history.test.ts apps/server/src/database/world.test.ts`
- [x] 1.2 Check the `outbreak-growth` and `gps-contact-matching` deltas against their cited tests.
  - proof: `npx vitest run apps/server/src/spatial/resize.test.ts apps/server/src/spatial/continuous.test.ts apps/server/src/spatial/lifecycle.test.ts apps/server/src/spatial/world-history.test.ts`
- [x] 1.3 Validate the change strictly.
  - proof: `openspec validate spec-for-world-storage-aging-and-serving --strict`
