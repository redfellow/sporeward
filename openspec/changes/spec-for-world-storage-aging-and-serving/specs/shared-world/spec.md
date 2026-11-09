# Spec Delta

## ADDED Requirements

### Requirement: Single serialized world snapshot
The server SHALL apply world operations one at a time and commit each operation's world effects, footprint history, contributions and reward attribution together. A failed write SHALL leave the previous committed state intact, and committed state SHALL survive a restart.

#### Scenario: Concurrent retries and restart
- **WHEN** the same activity is processed concurrently, retried and the store is restarted
- **THEN** its contacts, cleaning and rewards are stored once and remain unchanged after restart

### Requirement: World ages on access in bounded steps
Before each operation the server SHALL advance the world to the current minute. With database storage, offline catch-up SHALL be committed in transactions of at most one simulated hour, capturing footprint transitions at each step.

#### Scenario: Long offline catch-up
- **WHEN** the database-backed world is accessed after many hours offline
- **THEN** it catches up in successive transactions of at most one hour each before the operation runs

### Requirement: Per-player world view
The world view SHALL include server time, world start time and, for each outbreak, its current ring, status, lifecycle phase and deadline, remaining effort, personal visit points, cleanup bonus and personal eligibility time. Remnants SHALL advertise zero visit points. A cleaned outbreak within cleanup protection SHALL advertise the full first-visit reward.

#### Scenario: Remnant view
- **WHEN** a player requests a world containing a remnant
- **THEN** it is shown with zero visit points, its one-touch cleanup bonus and its expiry

#### Scenario: Cooldown and stabilization eligibility
- **WHEN** the player is in cooldown or the outbreak is stabilizing
- **THEN** the eligibility time is the later of the cooldown end and the stabilization end

#### Scenario: Disintegration deadline
- **WHEN** an outbreak is within its disintegration window and an accepted cleaning visit extends its deadline
- **THEN** the view shows the deadline and updates it after the visit

### Requirement: World view protocol validation
Clients SHALL reject world responses that fail the protocol's shape check and SHALL accept older responses that lack the lifecycle fields.

#### Scenario: Malformed world response
- **WHEN** a world response carries an unknown lifecycle phase
- **THEN** the client rejects it instead of using it

#### Scenario: Older world response
- **WHEN** a world response lacks the lifecycle phase and deadline fields
- **THEN** the client accepts it

### Requirement: Seeded spatial test world
The spatial world SHALL generate seeded, connected five-cell outbreaks only on accessible cells from a saved public access extract, excluding private-access routes and routes closed to both walking and cycling, and SHALL NOT download map data at startup.

#### Scenario: Reproducible generation
- **WHEN** the generator runs twice with the same seed and access extract
- **THEN** it produces the same distinct connected outbreaks without occupied neighbours

### Requirement: History-preserving field migrations
World migrations SHALL be idempotent and SHALL NOT change existing scores or contributions. Geometry upgrades SHALL start new footprint intervals at migration time and keep earlier intervals matchable. A guarded import SHALL reject a different source or a populated destination without a matching import record.

#### Scenario: Shoreline preparation
- **WHEN** shoreline constraints are prepared on an existing world
- **THEN** changed boundaries start at that instant, earlier boundaries remain matchable and scores and contributions are unchanged

#### Scenario: Legacy outline upgrade
- **WHEN** organic contour preparation runs on a world with legacy outlines
- **THEN** each legacy outline's earlier interval ends at that instant and stays matchable, and scores and contributions are unchanged

#### Scenario: Repeated contour upgrade
- **WHEN** organic contour preparation runs on an already upgraded world
- **THEN** it reports already prepared and changes nothing
