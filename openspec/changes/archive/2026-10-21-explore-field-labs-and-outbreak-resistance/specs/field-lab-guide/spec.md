# Spec Delta

## Purpose

Let the desktop guide demonstrate shared Field Labs, personal collection states and restoration rewards before gameplay integration.

## ADDED Requirements

### Requirement: Recognisable survey station
The guide SHALL depict a Field Lab as a fictional compact tripod survey station with a luminous sample chamber and subtle scanning ring, distinguishable from ordinary outbreaks by shape as well as colour.

#### Scenario: Compare destinations
- **WHEN** a Field Lab and an ordinary outbreak are shown together
- **THEN** the lab reads as an installation rather than an organic cleaning target.

### Requirement: Independent personal collection
The guide SHALL demonstrate one collection per player per lab. Collection SHALL leave the lab visible but subdued with an empty sample chamber and slightly slumped support, stop its scanning motion and show a personal check until expiry, without consuming another player's opportunity.

#### Scenario: Cooperating players
- **WHEN** the demonstration switches from a player who collected a lab to one who has not
- **THEN** the same lab is available to the second player and remains collected for the first.

### Requirement: Collection reward names
The guide SHALL present collection rewards using this pool: Antiviral Booster, Rare Specimen, Counterstrain, Protocol Override, Adaptive Serum, Wildtype Extract, Resistance Breaker, Mutation Antidote, Experimental Batch and Strain Disruptor. These names SHALL describe the same resistance-reducing reward rather than different mechanics.

#### Scenario: Inspect reward variations
- **WHEN** the tester cycles collection examples
- **THEN** all ten names can be inspected without changing the simulated reward's mechanical meaning.

### Requirement: Advertised restoration
The guide SHALL show an illustrative restoration benefit based on distance from an established personal resistance centre, increasing to a cap and diminishing with successive collections. The displayed offer SHALL remain stable during a simulated outing.

#### Scenario: Compare excursion rewards
- **WHEN** near and farther labs are compared with the same personal state
- **THEN** the farther lab offers at least as much restoration up to the cap, while repeated collections yield diminishing benefits.

#### Scenario: Travel toward a lab
- **WHEN** the simulated player position changes during an outing
- **THEN** that movement does not reduce the advertised restoration by moving its reference centre.

### Requirement: Motion accessibility
The guide SHALL provide readable static available and collected states when motion is disabled.

#### Scenario: Disable animation
- **WHEN** reduced motion or the guide's motion-off control is active
- **THEN** scanning stops while shape and collection cues remain distinguishable.
