# Tasks

## 1. Check the specified behavior

- [x] 1.1 Confirm the recorder lifecycle, storage, route-gap and recovery requirements match the cited tests.
  - proof: `npx vitest run apps/mobile/src/recording/model.test.ts apps/mobile/src/recording/recovery.test.ts`
- [x] 1.2 Confirm the world refresh requirements match the provenance tests and validate the change.
  - proof: `npx vitest run apps/mobile/src/server/world-provenance.test.ts`
  - proof: `openspec validate spec-for-android-recording-lifecycle-sql --strict`

## Manual checks after merge (The user)

- On a phone, record a short outing, turn off data before finishing, and check that the upload retries once data is back.
