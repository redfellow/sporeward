# Outbreak Resistance Specification

## Purpose

Keep local riding useful while encouraging renewable geographic variety through personal resistance, bounded rewards and passive recovery.

## Requirements

### Requirement: Contribution-weighted personal accumulation
Accepted contributions SHALL build personal Outbreak Resistance in proportion to cleaning strength committed, using one representative point per outbreak. Rejected contacts, GPS loops and duplicate deliveries SHALL NOT add resistance. Scheduled treatment delivery SHALL NOT add it again.

#### Scenario: Compare contribution strengths
- **WHEN** otherwise equivalent full-strength and half-strength contributions are committed
- **THEN** their resistance inputs have a two-to-one ratio before spatial aggregation and soft-threshold effects.

#### Scenario: Replay a contribution
- **WHEN** a contribution is retried, overlaps another source or delivers its delayed treatment
- **THEN** resistance is not added a second time.

### Requirement: Renewable geographic resistance
Resistance SHALL be personal, survive replacement of nearby outbreaks and recover passively with elapsed time. Its public-to-owner presentation SHALL use a circular zone strongest at an established centre and fading outward. Another player's contributions SHALL NOT increase that player's resistance.

#### Scenario: Replace a familiar target
- **WHEN** a new outbreak appears on a repeatedly ridden route
- **THEN** existing personal area resistance still affects its visit reward.

#### Scenario: Return after a break
- **WHEN** time passes without further contributions
- **THEN** resistance declines without requiring a Field Lab or new geographic unlocks.

### Requirement: Combined bounded visit rewards
Eligible ordinary visit rewards SHALL use one combined personal reduction, reconciling existing repeat-point penalties with resistance. Provisional targets are about 50% of normal fresh-target visit points after four commuting weeks, slower accumulation below 50%, and an absolute 25% minimum under intensive local riding. Cooldown rejection SHALL still award no visit points.

#### Scenario: Repeated eligible local visit
- **WHEN** repeat history and geographic resistance both apply
- **THEN** the resulting eligible ordinary visit reward respects the combined floor rather than multiplying independent penalties beneath it.

#### Scenario: Soft threshold
- **WHEN** further equivalent local contributions occur below the provisional 50% reward threshold
- **THEN** rewards continue decreasing more slowly toward the provisional minimum rather than stopping abruptly at 50%.

### Requirement: Consistent authoritative reward feedback
Map offers, authoritative awards and recaps SHALL use the same versioned resistance/reward rules. Resistance SHALL NOT retroactively reduce confirmed awards or modify committed cleaning strength, cleanup bonuses or inherited cooldowns in this change.

#### Scenario: Inspect a confirmed outing
- **WHEN** resistance later increases or a lab is collected
- **THEN** the outing's already confirmed awards remain unchanged.

### Requirement: Weekly balancing evidence
The implementation SHALL provide deterministic simulations for commuting, weekend restoration, local walks, alternating destinations and intensive riding. Published results SHALL distinguish provisional tuning targets from measured outcomes and account for passive recovery, repeat strength and replacement outbreaks.

#### Scenario: Four weeks without labs
- **WHEN** the documented reference commute runs for four weeks without lab collection
- **THEN** results show combined reward progression against the approximate 50% target, with bounded rewards and repeatable outputs.
