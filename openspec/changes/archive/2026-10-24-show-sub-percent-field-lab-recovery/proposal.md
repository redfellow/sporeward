# Proposal

## Why

The confirmed Field Lab row in `OutingRecap.tsx` rounds `actualFraction` to a whole percent, so a positive fraction below one half percent displays as `0% restoration`. The same row unconditionally says “Your resistance was reduced everywhere,” although a confirmed collection can have `resistanceReduction: 0` when no resistance is available to restore. The accepted expedition-benefit requirement calls for feedback that reflects the actual result and explains its possible benefit to later familiar-area visits.

## What Changes

- Add a pure recap formatter for the confirmed Field Lab row and use it in `OutingRecap.tsx`.
- Show `<1% restoration` when a positive `actualFraction` rounds to zero; retain the existing rounded whole-percent form otherwise.
- Base the explanation on `resistanceReduction`: explain the possible benefit to later eligible familiar-area visits when resistance was reduced, and state that no resistance was restored when the reduction is zero.
- Add focused regression coverage for positive sub-percent, larger positive, and zero reductions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This corrects recap presentation of the existing contract without changing gameplay behavior; `skip_specs: true` is set for this implementation correction.

## Impact

- [Accepted renewable-exploration contract](../../../../openspec/specs/renewable-exploration/spec.md), especially “Understandable expedition benefit” and its positive-restoration recap scenario.
- [Outing recap](../../../../apps/mobile/src/components/OutingRecap.tsx), a new pure formatter in `apps/mobile/src/components/outing-recap-format.ts`, and its focused Vitest coverage in `apps/mobile/src/components/outing-recap-format.test.ts`.
