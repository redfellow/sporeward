# Spec Delta

## ADDED Requirements

### Requirement: Bounded showcase clock
The showcase clock SHALL start paused at zero, advance only by explicit valid amounts or whole-minute resume, pause at its 720-minute limit, reject invalid or out-of-range advances, and reset deterministically. Tests: `apps/server/src/replay/showcase-clock.test.ts`, `apps/server/src/replay/showcase.test.ts`.

#### Scenario: Advance past the limit
- **WHEN** a tester asks to advance beyond 720 minutes
- **THEN** the advance is rejected or the clock pauses at the limit

### Requirement: Examples are reachable and synthetic
Every showcase example SHALL be contactable from public paths, and showcase and presentation worlds SHALL be deterministic valid world data without user tracks or contributions. Tests: `apps/server/src/replay/showcase.test.ts`, `apps/server/src/replay/presentation.test.ts`.

#### Scenario: Ride public paths
- **WHEN** fixes follow the public paths of the showcase area
- **THEN** every showcase outbreak is contacted
