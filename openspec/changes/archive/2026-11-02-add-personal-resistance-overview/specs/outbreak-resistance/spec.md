# Spec Delta

## ADDED Requirements

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
