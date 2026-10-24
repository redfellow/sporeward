# Proposal

## Why

The accepted expedition-benefit contract calls for Field Lab feedback to explain how confirmed resistance reduction can affect later familiar-area visit points. The recap already reports restoration, but its current explanation omits that later contributions, elapsed time, and reward rounding affect any eventual point outcome.

## What Changes

- Clarify that confirmed positive resistance reduction may lessen resistance-based point loss on later eligible familiar-area visits, without predicting an exact point amount and with subsequent contributions, elapsed time, and reward rounding affecting future points.
- Specify that confirmed zero resistance reduction makes no later-benefit claim.
- Update only the Field Lab recap explanation and focused formatter tests; retain existing restoration labels and limited/reconciled recap details.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `renewable-exploration`: define truthful feedback for positive and zero confirmed resistance reduction, including the limits on later point outcomes.

## Impact

- Accepted capability: `openspec/specs/renewable-exploration/spec.md`.
- Mobile recap formatter and focused tests in `apps/mobile/src/components/`.
- No protocol, scoring, settlement, or recording changes.
