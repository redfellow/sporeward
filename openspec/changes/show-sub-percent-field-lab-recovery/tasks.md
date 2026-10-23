# Tasks

## 1. Truthful recap percentage

- [ ] 1.1 Add `apps/mobile/src/components/outing-recap-format.ts` and use it in `OutingRecap.tsx` to format the percentage from `actualFraction` and select explanatory copy from `resistanceReduction`.
- [ ] 1.2 Add `apps/mobile/src/components/outing-recap-format.test.ts` covering positive sub-percent, positive whole-percent, and zero reductions; verify the zero case does not claim resistance was reduced.
- [ ] 1.3 Run `npm test -- apps/mobile/src/components/outing-recap-format.test.ts` and `npm run typecheck --workspace @sporeward/mobile`; record both results with the change.
