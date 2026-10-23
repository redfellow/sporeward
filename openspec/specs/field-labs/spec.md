# Field Labs Specification

## Purpose

Provide shared expedition destinations that independently reward each player's adventure by restoring personal local point opportunities.

## Requirements

### Requirement: Shared accessible lab lifecycle
Field Labs SHALL be shared, publicly reachable survey-station destinations, less common and longer-lived than ordinary outbreaks under configurable provisional tuning. They SHALL have stable identities and explicit expiry, separate from ordinary outbreak cleaning and replacement accounting. New lab collection footprints SHALL be circular with a diameter twice the former spawn-cell width, and the rendered boundary SHALL match recorded contact validation.

#### Scenario: Compare player maps
- **WHEN** two players view an unexpired lab
- **THEN** both see the same destination and expiry, with collection availability determined individually.

### Requirement: One collection per player per lab
An eligible recorded visit SHALL collect an unexpired lab at most once per player. Collection SHALL leave it visible and disabled for that player until expiry, without consuming others' opportunities. Retries and concurrent requests SHALL NOT duplicate restoration.

#### Scenario: Co-op collection
- **WHEN** one rider collects a lab before a friend arrives
- **THEN** the first rider sees it collected and the friend can still collect it independently.

#### Scenario: Retry collection after restart
- **WHEN** the same player's collection is delivered again after a server restart
- **THEN** no second restoration occurs and the collected status remains intact.

### Requirement: Immediate global restoration
Collection SHALL reduce accumulated personal resistance everywhere, without a stored item or expiring boost. A lab with no resistance to remove SHALL NOT bank restoration for future use.

#### Scenario: Collect while resistant
- **WHEN** an eligible player collects a lab offering positive restoration
- **THEN** resistance immediately decreases globally and the player's zone visibly weakens.

### Requirement: Stable distance-scaled offers
Restoration SHALL scale gradually with distance from an established personal resistance centre and plateau at a configurable cap. The advertised outing offer SHALL remain stable as the player travels; validation SHALL still enforce expiry, personal collection status and actual resistance available to remove.

#### Scenario: Travel toward a distant lab
- **WHEN** the player approaches a lab during the same outing
- **THEN** movement does not shift the reference centre and reduce its advertised offer.

### Requirement: Diminishing successive restoration
Successive collections SHALL give diminishing restoration with gradual recovery over time, without a calendar-week reset. Repeating a two-destination routine SHALL NOT bypass diminishing benefits. Distance alone SHALL NOT guarantee permanently maximum local rewards.

#### Scenario: Intensive collection ride
- **WHEN** a player collects several distinct labs in quick succession
- **THEN** comparable distance offers give progressively less restoration, bounded by remaining resistance.

### Requirement: Reward identity and clear feedback
The destination SHALL be called Field Lab. Collection SHALL use the agreed ten-name flavour pool without distinct item mechanics, explain actual resistance reduction and retain a non-colour personal collected cue.

#### Scenario: Receive a named reward
- **WHEN** a player receives Protocol Override or Rare Specimen
- **THEN** each represents resistance restoration, not a new inventory item or separate mechanical effect.

### Requirement: Weekend restoration evidence
Balancing SHALL compare a weekend lab expedition with no-lab and high-mileage cases, reporting immediate restoration and its effect on the following familiar local outings. Measured percentages SHALL remain scenario-specific evidence rather than promised recovery targets. Comparisons SHALL account for subsequent contributions and passive recovery without assuming a full reset or a resistance-free week.

#### Scenario: Compare weekly routines
- **WHEN** identical simulated commuters diverge only by one weekend expedition
- **THEN** published results show its immediate restoration and effect through the next workweek alongside the no-lab baseline.

#### Scenario: Attribute reduced local resistance
- **WHEN** a lab expedition and an otherwise equivalent no-collection outing are compared
- **THEN** the comparison identifies the lab's reduction of accumulated resistance and its subsequent local point benefit separately from passive recovery and resistance added by adventure cleaning.

#### Scenario: Report multiple collections
- **WHEN** an expedition includes several eligible lab collections
- **THEN** results show actual cumulative recovery under diminishing returns without requiring a fixed final reward percentage.

### Requirement: Circular collection area
Newly spawned Field Labs SHALL use a circular contact ring twice the former spawn-cell width in diameter. Existing persisted footprints SHALL remain matchable without rewriting historical contact geometry.

#### Scenario: Collect near the widened boundary
- **WHEN** a recorded route crosses the outer portion of a new circular lab area, beyond the former square
- **THEN** collection is eligible inside the circle and ineligible beyond it, subject to normal expiry and personal availability.
