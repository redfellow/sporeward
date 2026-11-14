# Spec Delta

## ADDED Requirements

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
