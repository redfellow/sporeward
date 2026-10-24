# Spec Delta

## Purpose

Help a player keep a chosen outbreak or Field Lab legible and easy to find during a self-directed outdoor outing.

## ADDED Requirements

### Requirement: One session-scoped destination
The live map SHALL allow a player to pin, replace or clear one outbreak or Field Lab destination. The pin SHALL survive panning, closing expanded details and revisiting the map in the same app session. It SHALL clear on account or test-world identity changes and SHALL NOT appear in historical outing maps.

#### Scenario: Return from the field guide
- **WHEN** a player pins a destination, opens the field guide and returns to the live map in the same session
- **THEN** the same destination remains pinned with its current summary

#### Scenario: Switch accounts
- **WHEN** the player's account identity changes
- **THEN** the previous account's destination pin is cleared

### Requirement: Current personal reward and effort context
The pinned summary SHALL identify the destination and show current personal eligibility. Outbreak visit points SHALL remain distinct from conditional cleanup rewards and remaining effort. Field Labs SHALL show an existing advertised offer when available and otherwise state that restoration is unconfirmed. The summary SHALL NOT invent rewards or guarantee a cleanup bonus or full resistance reset.

#### Scenario: Pin an outbreak on cooldown
- **WHEN** a player pins an outbreak whose received personal eligibility time is still in the future
- **THEN** the summary shows the cooldown instead of implying that passing through now earns another ordinary visit award

#### Scenario: Pin a lab without an outing offer
- **WHEN** no advertised offer has been received for the pinned Field Lab
- **THEN** the summary shows its personal availability without fabricating a restoration percentage

### Requirement: Honest direct-distance context
When an existing location at most two minutes old is available, the pinned summary SHALL show straight-line distance to the target's contact area, with an explicit direct-distance label. When location is stale or unavailable it SHALL omit the number and explain that distance is unavailable. It SHALL NOT present route distance, extra detour distance or an arrival time.

#### Scenario: Location falls inside the contact area
- **WHEN** the existing location lies within the target's contact polygon
- **THEN** direct-distance context indicates the player is in the area without claiming a validated visit or award

#### Scenario: No recent fix
- **WHEN** the latest available location is over two minutes old
- **THEN** the summary shows distance as unavailable rather than silently reusing the stale position

### Requirement: Map-aligned target focus
The destination highlight SHALL stay attached to the native map camera. A show-target action SHALL fit the target area without requiring automatic routing. Manual panning and the existing player-center controls SHALL remain usable without losing the destination pin.

#### Scenario: Pan away from a chosen destination
- **WHEN** a player pans and then selects show target
- **THEN** the map frames the pinned destination and its highlight follows normal pan, zoom and rotation

### Requirement: Existing evidence governs target progress
The pinned summary SHALL distinguish recorded contact awaiting validation from confirmed collection or eligibility. Refreshes SHALL update the target's current state. A target absent from the latest available world SHALL be shown as unavailable until replaced or cleared. Pinning, fitting or proximity alone SHALL NOT change recording, contact, score or world state.

#### Scenario: A lab contact is recorded offline
- **WHEN** existing outing evidence records contact with the pinned Field Lab before server confirmation
- **THEN** the summary marks contact as provisional without presenting restoration as confirmed

#### Scenario: A target disappears on refresh
- **WHEN** a pinned target is absent from the newly received world
- **THEN** its summary reports that it is no longer available and does not keep presenting stale rewards as current
