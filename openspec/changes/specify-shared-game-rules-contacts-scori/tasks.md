# Tasks

## 1. Verify documented rules

- [ ] 1.1 Confirm the visit-scoring and contact deltas match the engine and contacts tests
  - proof: `npx vitest run packages/game/src/engine.test.ts packages/game/src/contacts.test.ts`
- [ ] 1.2 Confirm the resistance and Field Lab deltas match the resistance, lab and settlement tests
  - proof: `npx vitest run packages/game/src/resistance.test.ts apps/server/src/resistance-state.test.ts apps/server/src/field-labs.test.ts apps/server/src/lab-settlement.test.ts`
- [ ] 1.3 Validate the change strictly
  - proof: `npx openspec validate specify-shared-game-rules-contacts-scori --strict`
