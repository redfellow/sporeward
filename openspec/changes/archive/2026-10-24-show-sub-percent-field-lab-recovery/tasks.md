# Tasks

## 1. Truthful recap percentage

- [x] 1.1 Add `apps/mobile/src/components/outing-recap-format.ts` and use it in `OutingRecap.tsx` to format the percentage from `actualFraction` and select explanatory copy from `resistanceReduction`.
- [x] 1.2 Add `apps/mobile/src/components/outing-recap-format.test.ts` covering positive sub-percent, positive whole-percent, and zero reductions; verify the zero case does not claim resistance was reduced.
- [x] 1.3 Run `npm test -- apps/mobile/src/components/outing-recap-format.test.ts` and `npm run typecheck --workspace @sporeward/mobile`; record both results with the change.

## Validation

- `npm test -- apps/mobile/src/components/outing-recap-format.test.ts` — passed (1 test file, 3 tests).
- `npm run typecheck --workspace @sporeward/mobile` — passed.
