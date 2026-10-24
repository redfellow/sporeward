# Spec Delta

## ADDED Requirements

### Requirement: Summarize finished outings in the history
The outing history SHALL show each finished outing's local start time, recorded GPS distance, active recording duration, upload state, and a compact route map with touched outbreaks.

#### Scenario: Review a saved outing
- **WHEN** a player opens past outings
- **THEN** each finished outing shows its local start time, GPS distance, active recording duration excluding pauses, upload state, and a compact basemap preview of its route and touched outbreaks

### Requirement: Show only authoritative points in history
The outing history and map recap SHALL show confirmed points and possible cleanup points only when an authoritative server recap is saved, with the amounts kept separate.

#### Scenario: Outing has a saved server recap
- **WHEN** a finished outing has an authoritative recap
- **THEN** its history card and map recap show confirmed points separately from possible cleanup points in corner badges

#### Scenario: Outing has no saved server recap
- **WHEN** a finished outing has no authoritative recap saved on the device
- **THEN** its history card and map recap show upload state without presenting provisional points as confirmed

### Requirement: Show a full-screen map recap for a finished outing
A finished outing recap SHALL use a full-screen basemap showing the recorded A-to-B route as a heatmap and visually highlighting touched outbreaks, with score badges in the map corner.

#### Scenario: Finish an outing
- **WHEN** a player finishes an outing
- **THEN** the app shows its full-screen map recap with the recorded route, touched outbreaks, and score badges

#### Scenario: Select a past outing
- **WHEN** a player opens a finished outing from history
- **THEN** the app shows the same full-screen map recap for that outing

#### Scenario: Return to outing history
- **WHEN** a player uses Android back navigation from a history recap
- **THEN** the app returns to the previous outing list

### Requirement: Retrieve historical touched outbreak footprints
The server SHALL return the historical footprint at each contact time only for outbreaks recorded in the authenticated player's processed outing recap.

#### Scenario: Retrieve an owned outing's footprints
- **WHEN** an authenticated player requests footprints for their processed outing
- **THEN** the response contains only the contacted outbreaks' shapes valid at their recorded contact times

#### Scenario: Request another player's outing footprints
- **WHEN** a player requests footprints for an outing not owned by their account
- **THEN** the server returns not found without revealing the other player's activity or geometry
