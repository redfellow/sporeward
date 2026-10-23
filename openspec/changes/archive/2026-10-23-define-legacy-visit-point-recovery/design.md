# Design

## Context

The legacy engine already computes the agreed diminishing and recovery rule. Resistance-scored ordinary visits use the separately accepted versioned curve in `openspec/specs/outbreak-resistance/spec.md`.

## Goals / Non-Goals

**Goals:** Align the game concept with the exact legacy rule and preserve the separation between legacy and resistance-scored visits.

**Non-Goals:** Change runtime scoring, recalculate confirmed awards, modify late-event or duplicate handling, or implement leaderboard integration or settlement.

## Decisions

- Document the current engine behavior as the legacy contract: repeat base `max(minimumVisitPoints, floor(firstVisitPoints / 2^n))`, where `n` is the count of preceding accepted visits; after the configured delay without an accepted visit, linearly recover that base to `firstVisitPoints` over the configured duration; round the final eligible value to the nearest integer, with half points upward. Current provisional values are 100 first-visit points, a five-point minimum, a 72-hour delay, and a 14-day duration. This matches `packages/game/src/engine.ts` and `packages/game/src/balance.ts`.
- Keep this rule limited to legacy scoring. Resistance scoring remains described by its existing capability; no second statement of its curve is added.
- State that the contract affects prospective awards only. Existing persisted awards and historical scoring versions remain unchanged.
- Update `docs/game-concept.md` where it currently labels the visit-point rounding/recovery rule as open. Leave `docs/product-direction.md` and all leaderboard settlement decisions unchanged.

## Risks / Trade-offs

- [Readers may mistake legacy tuning for the resistance curve] → Label the rule as legacy and link to the resistance specification.
- [A future product change may need new legacy parameters] → Revise the scoring specification and versioning decision before changing runtime behavior.
