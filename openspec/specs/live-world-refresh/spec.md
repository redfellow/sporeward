# live-world-refresh Specification

## Purpose
Keep the Android map's shared world current and say honestly how fresh it is.

## Requirements

### Requirement: Cached world with periodic refresh
The map SHALL show the signed-in player's cached world at once, refresh it every 20 seconds while the app is in the foreground and on return to the foreground, and keep the last world after a failed refresh. Source: `apps/mobile/src/server/use-world.ts`.

#### Scenario: Refresh fails
- **WHEN** a world refresh fails
- **THEN** the map keeps the last world and reports that the refresh failed

### Requirement: Honest snapshot provenance
A cached world SHALL be treated as unattributed until a fetch for the current account and server succeeds. Account, server or world resets SHALL clear earlier provenance, and late results for another identity SHALL NOT change the current status. Test: `apps/mobile/src/server/world-provenance.test.ts`.

#### Scenario: Legacy cache before first fetch
- **WHEN** the map loads a cached world and no fetch has succeeded yet
- **THEN** its status shows the snapshot as unattributed, with no received time
