# Proposal

## Why

Legacy ordinary visits already use a specific diminishing and recovery calculation, but the game concept still lists visit-point rounding and recovery as open. Recording the current rule and provisional baseline values avoids silently changing prospective legacy awards while keeping resistance-scored visits under their existing accepted specification.

## What Changes

- Specify legacy ordinary visit-point diminishing, recovery timing, minimum, and integer rounding.
- Clarify that the rule prices eligible future visits only and does not recalculate confirmed awards or replace resistance scoring.
- Update the game concept's open-decision entry to reflect the agreed legacy rule.

## Capabilities

### New Capabilities
- `visit-scoring`: Legacy ordinary visit-point diminishing and recovery behavior.

### Modified Capabilities
- None.

## Impact

The rule is already implemented in `packages/game/src/engine.ts` and configured in `packages/game/src/balance.ts`; this change documents and specifies that behavior. It does not alter scoring code, persisted awards, late-event reconciliation, duplicate handling, or leaderboard integration. Resistance scoring remains governed by `openspec/specs/outbreak-resistance/spec.md`.
