# Spec Delta

## Purpose

Let players compare loaded-world outbreaks and Field Labs and choose a destination for a self-directed detour without inspecting every map marker.

## ADDED Requirements

### Requirement: Browse destinations from the live map
The live map SHALL offer a dismissible Nearby destinations sheet before and during recording, with All, Outbreaks and Field Labs filters. It SHALL list destinations from the latest received world, independently of the map viewport, and identify that coverage as the loaded world. Cleared or expired destinations SHALL be omitted; cooldown, splitting and personally collected destinations SHALL remain browsable with their status. Historical maps SHALL NOT offer the sheet.

#### Scenario: Compare destinations beyond the viewport
- **WHEN** a player opens Nearby while zoomed into one neighborhood
- **THEN** the sheet includes matching destinations elsewhere in the loaded world and does not claim to search beyond that coverage

#### Scenario: Filter for a lab
- **WHEN** the player selects Field Labs
- **THEN** only unexpired loaded labs are listed, including personally collected labs clearly marked as collected

### Requirement: Available-first proximity ordering
The sheet SHALL group personally available destinations before unavailable ones, based on received eligibility data. Within each group it SHALL order by numeric straight-line distance to the contact area from an existing location at most two minutes old. It SHALL label the ordering and distance as straight-line, make no route, reachability or ETA claim, and use a stable tie-break for equal distances.

#### Scenario: Nearby cooldown versus available farther away
- **WHEN** a close outbreak is on cooldown and a farther outbreak is available
- **THEN** the available outbreak appears in the first group and the cooldown outbreak appears in the secondary group with its reason

#### Scenario: Distances have the same rounded label
- **WHEN** two available destinations have different numeric distances that round to the same displayed value
- **THEN** they are ordered by their numeric distances rather than the formatted labels

### Requirement: Browse without fresh location
When location is missing or over two minutes old, the sheet SHALL omit distance numbers, explain that proximity ordering is unavailable and use stable name ordering within availability groups. It SHALL remain browsable without requesting new permissions or starting another location watch. Location or snapshot updates SHALL recompute list context without moving the camera or changing the pin.

#### Scenario: Location ages while browsing
- **WHEN** the existing location becomes older than two minutes while the sheet remains open
- **THEN** stale distances disappear and the sheet explains its non-proximity ordering

### Requirement: Comparable honest reward context
Rows SHALL show target identity/type, personal availability and relevant reward/effort context consistent with target details. Ordinary visit points SHALL remain separate from possible cleanup points. Lab restoration SHALL use only a matching existing outing offer or confirmed collection. Provisional contacts SHALL remain distinct from awards, and unavailable targets SHALL NOT advertise a currently earnable visit or collection reward.

#### Scenario: Compare before an outing has an offer
- **WHEN** the player browses a Field Lab without a matching outing offer
- **THEN** the row explains that restoration is unconfirmed rather than inventing a percentage

#### Scenario: Contact awaits confirmation
- **WHEN** current-outing evidence records a contact but no authoritative award exists
- **THEN** the row marks it provisional without claiming points or restoration have been earned

### Requirement: Explicit handoff to the single destination pin
Opening a row SHALL close the sheet and open current target details without replacing the pin or moving the camera. The existing explicit pin/replace action SHALL select that destination; show-target remains a separate action. Dismissing or filtering the sheet SHALL preserve the pin. Selecting a vanished row SHALL explain its unavailability and SHALL NOT pin stale data.

#### Scenario: Compare a target while another is pinned
- **WHEN** the player opens a different target's details from Nearby and then closes the details
- **THEN** the original pin remains until the player explicitly replaces or clears it

#### Scenario: Target disappears before selection
- **WHEN** a row's target disappears in a received update before its selection is handled
- **THEN** the app reports it unavailable without replacing the current pin

### Requirement: Understandable snapshot and empty states
The sheet SHALL show the world's last update time and existing connection/error context without presenting cached data as guaranteed current. No world data, no destinations in the chosen filter, and missing recent location SHALL have distinct explanations. Account or environment reset SHALL dismiss the sheet and discard its prior-account rows.

#### Scenario: Browse a cached world
- **WHEN** a world refresh fails and a previous snapshot remains available
- **THEN** the player can browse that snapshot with its update time and refresh failure visible

#### Scenario: No labs in loaded coverage
- **WHEN** the Field Labs filter has no matching rows
- **THEN** the sheet explains that there are no labs in the loaded world instead of claiming that no labs exist anywhere

### Requirement: Non-disruptive sheet interaction
The sheet SHALL remain bounded and scrollable on narrow and wide phone layouts, retain access to recording pause/finish controls, and close on its close action or Android Back before map-level navigation. Opening, scrolling, filtering or closing it SHALL NOT pause recording, award contact, alter world state or change native map geometry.

#### Scenario: Browse during recording
- **WHEN** the player opens Nearby while recording and presses Android Back
- **THEN** the sheet closes first, the map and pin remain, and recording continues unchanged
