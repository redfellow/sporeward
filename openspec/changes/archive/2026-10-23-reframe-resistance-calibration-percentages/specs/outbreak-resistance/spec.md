# Spec Delta

## MODIFIED Requirements

### Requirement: Combined bounded visit rewards
Eligible ordinary visit rewards SHALL use one combined personal reduction, reconciling existing repeat-point penalties with resistance. The current versioned implementation's 25% reward floor is a provisional code parameter, not a product or acceptance target. Cooldown rejection SHALL still award no visit points.

#### Scenario: Repeated eligible local visit
- **WHEN** repeat history and geographic resistance both apply
- **THEN** the resulting eligible ordinary visit reward respects the combined floor rather than multiplying independent penalties beneath it.

#### Scenario: Soft threshold
- **WHEN** further equivalent local contributions increase accumulated resistance
- **THEN** eligible ordinary rewards continue to decrease smoothly according to the current versioned curve, bounded by its provisional code floor, without a week-specific percentage target.

### Requirement: Weekly balancing evidence
The implementation SHALL provide deterministic simulations for commuting, weekend restoration, local walks, alternating destinations and intensive riding. Published results SHALL report scenario inputs and measured outcomes, distinguish those measurements from product or acceptance targets, and account for passive recovery, repeat strength and replacement outbreaks.

#### Scenario: Four weeks without labs
- **WHEN** the documented reference commute runs for four weeks without lab collection
- **THEN** results report the scenario's measured reward progression with its inputs and timing, without grading it against a fixed percentage target.
