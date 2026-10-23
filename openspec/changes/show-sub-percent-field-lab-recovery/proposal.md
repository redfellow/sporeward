# Proposal

## Why

The outing recap rounds a confirmed Field Lab's actual Resistance reduction to a whole percent. A small positive reduction can therefore display as `0% restoration` beside copy that says it can improve later local visits, which misstates the accepted recovery contract.

## What Changes

- Keep the existing accepted behavior: confirmed recap feedback reports actual Resistance removed and describes only the possible later local benefit.
- In the recap display, show a truthful `<1% restoration` label when the actual reduction is positive but rounds below one percent; retain the ordinary whole-percent form for larger reductions and zero for no reduction.
- Add focused regression coverage for small positive, larger positive, and zero reductions so a positive-benefit claim cannot be paired with `0%`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This corrects presentation of an existing contract and does not change product behavior; `skip_specs: true` is set for this implementation correction.

## Impact

- [Accepted renewable-exploration contract](../../../openspec/specs/renewable-exploration/spec.md), especially “Understandable expedition benefit” and its positive-restoration recap scenario.
- [Outing recap](../../../apps/mobile/src/components/OutingRecap.tsx) and focused mobile recap formatting/regression tests.
