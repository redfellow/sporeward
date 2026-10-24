# Native Recording Recovery Specification

## Purpose

Defines how the Android recorder preserves an active outing and communicates its state after the app or location service is interrupted. It covers local route continuity and recovery outcomes, not guarantees about physical-device GPS reception.

## Requirements

### Requirement: Recover an interrupted active outing without bridging the route gap
When Android recording state remains active but its location service has stopped, the recorder SHALL preserve saved fixes, close the interrupted route section at its last saved fix, and begin a separate section if service recovery succeeds.

#### Scenario: Location service resumes after app interruption
- **WHEN** an active outing is reopened and the location service is no longer running
- **THEN** the recorder preserves existing fixes, closes the interrupted section at the last saved fix, starts a new section, and reports that recording was recovered

#### Scenario: Recovered route is displayed
- **WHEN** the recap displays fixes from before and after a successful recovery
- **THEN** it renders separate route sections and does not draw a continuous recorded line across the interruption

### Requirement: Preserve and explain an outing when recovery fails
If location service recovery cannot proceed, the recorder SHALL preserve the outing and its saved fixes, leave the outing paused, and expose a user-understandable recovery reason.

#### Scenario: Background location permission is missing
- **WHEN** an interrupted active outing is reopened without background location permission
- **THEN** the outing is paused, saved fixes remain available, and the recorder explains that location permission is required to resume

#### Scenario: Location service cannot be restarted
- **WHEN** the recorder cannot restart location updates during recovery
- **THEN** the outing is paused, saved fixes remain available, and the recorder reports the recovery failure
