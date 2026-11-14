# Visit Scoring Specification

## Purpose

Define the established diminishing and recovery behavior for eligible ordinary visits scored under the legacy scoring version, so prospective awards remain predictable and confirmed awards retain their original value.

## Requirements

### Requirement: Legacy ordinary visit-point diminishing and recovery
Eligible ordinary visits scored under the legacy version SHALL use `base = max(minimum, floor(normal / 2^n))`, where `n` is the number of preceding accepted visits. After the configured delay, recover linearly from `base` to `normal` over the configured duration. Round the final value to the nearest integer, with half points upward. Current provisional values are 100 normal points, minimum 5, delay 72 hours, and duration 14 days.

#### Scenario: Repeat visit before recovery
- **WHEN** a player has one prior accepted visit to the same target and returns while the recovery delay has not elapsed
- **THEN** the eligible visit is worth 50 points from the 100-point normal value

#### Scenario: Recovery begins after the delay
- **WHEN** one prior accepted visit is followed by exactly 72 hours without another accepted visit
- **THEN** the next eligible visit remains worth 50 points

#### Scenario: Partial recovery
- **WHEN** one prior accepted visit is followed by 72 hours plus 7 days without another accepted visit
- **THEN** the next eligible visit is worth 75 points

#### Scenario: Full recovery
- **WHEN** one prior accepted visit is followed by 17 days without another accepted visit
- **THEN** the next eligible visit is worth 100 points

#### Scenario: Repeated visits reach the minimum
- **WHEN** repeated accepted visits reduce the unrecovered base below five points
- **THEN** the next eligible visit's unrecovered base is five points before recovery is applied

#### Scenario: Fractional result rounds to the nearest point
- **WHEN** the recovery calculation produces a value ending in one half point
- **THEN** the awarded legacy visit value rounds upward to the next whole point

### Requirement: Per-player visit cooldown and rejection reasons
An ordinary visit SHALL be rejected with no points while the same player's previous accepted visit to that outbreak is less than 6 hours old. A later-arriving older visit SHALL NOT move the latest cooldown backwards. Visits SHALL also be rejected for a missing target, a stabilizing target, or a target past its protection window or remnant lifetime. Source: `packages/game/src/engine.ts` (`nextVisit`, `applyVisit`); test: `packages/game/src/engine.test.ts`.

#### Scenario: Return within the cooldown
- **WHEN** a player revisits the same outbreak 2 hours after an accepted visit
- **THEN** the visit is rejected as cooldown and awards no points, while other players' cooldowns are independent

### Requirement: Diminishing repeat cleaning strength
In gentle mode, successive accepted visits by one player SHALL commit 100%, 75%, 60% and then 50% cleaning strength. A quarter of each visit's strength SHALL be delivered over 5 minutes and the rest over 12 hours. Point recovery SHALL NOT restore cleaning strength. Source: `packages/game/src/balance.ts`; test: `packages/game/src/engine.test.ts`.

#### Scenario: Second visit by the same player
- **WHEN** a player's second accepted visit to an outbreak is committed
- **THEN** it contributes 75% cleaning strength

### Requirement: Cleanup bonus for the finishing group and protection window
When an outbreak clears, each player SHALL receive the 100-point cleanup bonus exactly once if they visited within 10 minutes before the last visit before clearing, or within the 10-minute protection window after. A protection-window visit SHALL earn full ordinary points regardless of diminished visit history; the cooldown still applies. Later evidence SHALL NOT revoke awards. Source: `packages/game/src/engine.ts` (`reconcileCleanupBonuses`); test: `packages/game/src/engine.test.ts`.

#### Scenario: Arrive just after clearing
- **WHEN** an eligible player reaches a cleared outbreak within 10 minutes of clearing
- **THEN** they receive full visit points and the cleanup bonus once

### Requirement: Remnant and historical visit outcomes
A remnant visit SHALL award no ordinary points and SHALL clear the remnant, and the visitor SHALL receive that remnant's share of the cleanup bonus (a quarter of the original, 25 points today). A historical visit to a retired outbreak SHALL credit its diminished value without a cleanup bonus or new treatment. Test: `packages/game/src/engine.test.ts`.

#### Scenario: Historical repeat to a retired outbreak
- **WHEN** a late upload contains a repeat visit to an outbreak that has since been retired
- **THEN** the diminished visit points are credited without cleanup bonus or cleaning treatment
