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
Eligible ordinary visit rewards SHALL use one combined personal reduction, reconciling existing repeat-point penalties with resistance. The current versioned implementation's 25% reward floor is a provisional code parameter, not a product or acceptance target. Cooldown rejection SHALL still award no visit points.

#### Scenario: Repeated eligible local visit
- **WHEN** repeat history and geographic resistance both apply
- **THEN** the resulting eligible ordinary visit reward respects the combined floor rather than multiplying independent penalties beneath it.

#### Scenario: Soft threshold
- **WHEN** further equivalent local contributions increase accumulated resistance
- **THEN** eligible ordinary rewards continue to decrease smoothly according to the current versioned curve, bounded by its provisional code floor, without a week-specific percentage target.

### Requirement: Consistent authoritative reward feedback
Map offers, authoritative awards and recaps SHALL use the same versioned resistance/reward rules. Resistance SHALL NOT retroactively reduce confirmed awards or modify committed cleaning strength, cleanup bonuses or inherited cooldowns in this change.

#### Scenario: Inspect a confirmed outing
- **WHEN** resistance later increases or a lab is collected
- **THEN** the outing's already confirmed awards remain unchanged.

### Requirement: Weekly balancing evidence
The implementation SHALL provide deterministic simulations for commuting, weekend restoration, local walks, alternating destinations and intensive riding. Published results SHALL report scenario inputs and measured outcomes, distinguish those measurements from product or acceptance targets, and account for passive recovery, repeat strength and replacement outbreaks.

#### Scenario: Four weeks without labs
- **WHEN** the documented reference commute runs for four weeks without lab collection
- **THEN** results report the scenario's measured reward progression with its inputs and timing, without grading it against a fixed percentage target.

### Requirement: Spatial ordinary reward evaluation
Resistance-based ordinary visit pricing SHALL weight the player's applicable cleaning contributions by proximity to the evaluated target. Global lab restoration SHALL reduce accumulated contribution resistance without making resistance uniform everywhere. The displayed centre SHALL NOT substitute for local evaluation of the contribution geography.

#### Scenario: Compare local and distant visits
- **WHEN** two eligible targets have different proximity to the player's accumulated cleaning contributions
- **THEN** their resistance reductions are evaluated locally rather than using one identical global resistance value.

#### Scenario: Restore a concentrated footprint
- **WHEN** lab restoration reduces contributions concentrated around the player's usual cleaning area
- **THEN** resistance-based point loss is reduced where those contributions carry spatial weight, subject to subsequent play, elapsed time and reward rounding.

### Requirement: Gradually responsive resistance centre
The established presentation centre SHALL be able to follow changes in the concentration of recent accepted cleaning gradually. Cleaning during adventures SHALL contribute to this geography under the ordinary contribution rules. Travelling without accepted cleaning SHALL NOT add resistance contributions.

#### Scenario: Clean along an adventure
- **WHEN** accepted cleaning along an adventure changes the concentration of recent contributions toward that area
- **THEN** the summary centre can gradually shift in that direction while local reward evaluation continues to use spatial contributions and an existing outing's lab offer retains its frozen reference.
