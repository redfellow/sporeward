# Design

This change is documentation only. Each ADDED requirement cites the source and an existing focused Vitest file:
- Engine and balance: `packages/game/src/engine.ts`, `balance.ts`, tested by `engine.test.ts`.
- Contacts: `packages/game/src/contacts.ts`, tested by `contacts.test.ts`.
- Resistance: `packages/game/src/resistance.ts` and `apps/server/src/resistance-state.ts`, tested by `resistance.test.ts` and `resistance-state.test.ts`.
- Field Labs: `apps/server/src/field-labs.ts` and `lab-settlement.ts`, tested by `field-labs.test.ts` and `lab-settlement.test.ts`.

All deltas are ADDED, so existing requirements stay unchanged. Behavior owned by active changes is excluded: footprint API, live feedback, destination focus, nearby sheet and field guide. The proof is strict validation plus the cited tests.
