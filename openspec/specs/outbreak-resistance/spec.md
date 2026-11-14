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

### Requirement: Personal Resistance overview
The live map SHALL offer a personal Resistance overview before and during an outing, including while paused. It SHALL explain that accepted cleaning builds personal geographic resistance, passive recovery reduces it over time and Field Labs can reduce it. It SHALL distinguish ordinary visit-point effects from unchanged committed cleaning and cleanup bonuses, without predicting exact future points or a full reset.

#### Scenario: Understand familiar-route rewards
- **WHEN** a player opens the overview with an established personal field
- **THEN** it explains why eligible ordinary visit points around familiar cleaning areas can be reduced while cleaning and cleanup bonuses retain their existing rules

#### Scenario: Continue local play without labs
- **WHEN** the player reads the recovery explanation
- **THEN** it explains passive recovery and continuing bounded eligible rewards without presenting a lab expedition as mandatory or promising a recovery deadline

### Requirement: Honest spatial summary
The overview SHALL identify its affected-area display as a geographic summary, not a uniform personal penalty. It SHALL NOT convert the received centre resistance into a global reward-loss percentage or imply that the circular boundary is an exact reward cutoff. A Show affected area action SHALL frame the established visible field on the map without changing the player's chosen destination.

#### Scenario: Locate the established field
- **WHEN** the player selects Show affected area for a received field with a centre and positive resistance
- **THEN** the overview closes, the map frames that field with its overlay attached to normal pan/zoom/rotation, and the destination pin remains unchanged

#### Scenario: Inspect the circular edge
- **WHEN** the player reads the affected-area explanation
- **THEN** it says the circle summarizes their cleaning geography and that rewards vary by location rather than switching uniformly at its edge

### Requirement: Relevant lab discovery
The overview SHALL offer personally uncollected, unexpired Field Labs from the loaded world through existing destination details. It SHALL distinguish provisional contacts from confirmed collections and use only matching, unexpired outing offers for restoration estimates. It SHALL label distance as straight-line to the collection area, omit unavailable distances and avoid claiming an optimal route or guaranteed recovery.

#### Scenario: Explore before recording
- **WHEN** a player opens available labs without a current outing offer
- **THEN** lab availability is shown without fabricated restoration percentages, with recent-location direct distance or an unavailable-distance explanation

#### Scenario: Open a lab from the overview
- **WHEN** the player selects a lab that remains available in the received world
- **THEN** the overview closes and existing lab details open, allowing the player to explicitly pin it without replacing an existing pin merely through selection

#### Scenario: Target changes before selection
- **WHEN** a listed lab has expired, disappeared or become confirmed collected in an updated snapshot
- **THEN** it is removed from available candidates and stale selection does not open it as collectable or change the pin

### Requirement: Evidence-aware overview states
The overview SHALL distinguish a received field, an explicitly empty personal field and missing Resistance information. Cached or failed-refresh context SHALL remain visibly qualified with its known snapshot time. Missing or unverifiable data SHALL NOT claim zero resistance, disabled rules or confirmed restoration. The overview SHALL NOT optimistically reduce Resistance after an unconfirmed contact or infer how much a lab alone caused a later snapshot change.

#### Scenario: Explicitly empty personal field
- **WHEN** a matching received Resistance summary has no established centre or has zero centre resistance
- **THEN** the overview explains that no active personal field is established in that summary and does not offer to frame an invisible field

#### Scenario: World lacks Resistance data
- **WHEN** the received world omits its Resistance summary
- **THEN** the overview reports that Resistance information is unavailable for that world rather than diagnosing zero resistance or a disabled setting

#### Scenario: Offline after a known snapshot
- **WHEN** refreshing fails but an attributable prior snapshot exists
- **THEN** the overview labels it as last-known information with its snapshot time, qualifies lab availability and does not simulate recovery or new confirmation locally

### Requirement: Owner and world isolation
Personal overview data SHALL belong to the current account, server and world. Identity or environment changes SHALL dismiss the overview and invalidate its prior personal context; late asynchronous responses SHALL NOT restore it. Cached information with unverifiable ownership or environment SHALL be treated as unavailable until matching context is received.

#### Scenario: Change player or test environment
- **WHEN** the account, server or world identity changes while the overview is open or loading
- **THEN** the old overview closes and neither its resistance summary nor its lab offers are presented for the new context

### Requirement: Non-disruptive overview interaction
The overview SHALL share space exclusively with Nearby, Recent contacts and destination details. It SHALL suppress competing notices without a later personal-banner backlog. Close or Android Back SHALL dismiss the overview before leaving the map, preserving the route and pin. Opening, focusing or selecting within it SHALL NOT pause recording, submit contacts, award points or change world state; pause and finish SHALL remain accessible.

#### Scenario: Inspect during recording
- **WHEN** a player opens the overview during an active outing and then uses Back
- **THEN** recording continues, the sheet closes to the same map and destination, and the recording controls remain usable

### Requirement: Current versioned resistance parameters
Rules version 1 SHALL decay resistance with a 7-day half-life and apply one reward curve with a soft threshold at half reward and a 25% floor. Invalid numerical inputs SHALL be rejected. Contributions with the same identity SHALL count once regardless of delivery order. Source: `packages/game/src/resistance.ts` (`RESISTANCE_RULES`); test: `packages/game/src/resistance.test.ts`.

#### Scenario: Deliveries arrive out of order
- **WHEN** the same contributions are committed in different orders or serialized through JSON
- **THEN** the resulting resistance is identical

### Requirement: Neutral activation without backfill
Server resistance SHALL start neutral when enabled and SHALL NOT backfill uploads accepted before activation. It SHALL keep state across rollback and reactivation. Late uploads in either order SHALL NOT rewrite confirmed awards or replay resistance. Test: `apps/server/src/resistance-state.test.ts`.

#### Scenario: Old uploads before activation
- **WHEN** resistance is activated on a server with earlier accepted uploads
- **THEN** those uploads add no resistance

### Requirement: Account-isolated resistance
Personal resistance events and awards SHALL be stored per hashed account and persisted atomically across concurrent retries and restarts. Map offers SHALL use only the authenticated owner, never an account chosen by query input. Test: `apps/server/src/resistance-state.test.ts`.

#### Scenario: Query names another account
- **WHEN** a request supplies another player's identity in its query
- **THEN** offers, awards and recaps reflect only the authenticated owner
