# Visual Showcase Specification

## Purpose

Provide a compact isolated Tampere showcase for repeatable inspection of outbreak states and transitions using the normal Android map renderer.

## Requirements

### Requirement: Complete compact state coverage
A tester-only showcase SHALL provide deterministic reachable examples around Hatanpää, Viinikanlahti, Viinikka and Nekala: Light, Medium, Heavy, Disintegrating, Remnants, Withering, Clearing, Cracks forming, Splitting, cooldown and current-outing contact overlays.

#### Scenario: Open the showcase
- **WHEN** a tester selects the showcase scenario
- **THEN** the map fits the compact showcase region and every named example can be selected or jumped to without exploring the full field world.

### Requirement: Independent lifecycle and membrane clocks
The showcase SHALL start with lifecycle time paused while membrane animation continues. Testers SHALL be able to pause/resume lifecycle time, advance it, and reset the scenario.

#### Scenario: Inspect a paused example
- **WHEN** the showcase is opened and no time control is used
- **THEN** outbreak lifecycle state remains unchanged while permitted visual membrane motion continues.

#### Scenario: Reset after advancing time
- **WHEN** the tester advances time and then resets
- **THEN** the original deterministic fixture state, clock and personal-marker examples are restored.

### Requirement: Normal rendering and isolated storage
The showcase SHALL use normal world contracts and the same Android renderer as gameplay, with test-only controls confined to the isolated replay environment. It SHALL NOT change field accounts, recordings, scores or historical contact boundaries.

#### Scenario: Attempt controls against field environment
- **WHEN** the app is connected to the field environment
- **THEN** showcase mutation controls are unavailable and cannot reset or advance the field world.

### Requirement: Replay and owner acceptance
The same renderer SHALL support recorded outings in the living replay world after showcase review. Completion SHALL require explicit owner approval in the emulator and then on the phone; package installation alone SHALL NOT count as approval.

#### Scenario: Progress to phone review
- **WHEN** the owner accepts the emulator visuals and the phone has no active recording
- **THEN** a phone build can be installed for explicit final review, preserving existing app data.

### Requirement: Bounded showcase clock
The showcase clock SHALL start paused at zero, advance only by explicit valid amounts or whole-minute resume, pause at its 720-minute limit, reject invalid or out-of-range advances, and reset deterministically. Tests: `apps/server/src/replay/showcase-clock.test.ts`, `apps/server/src/replay/showcase.test.ts`.

#### Scenario: Advance past the limit
- **WHEN** a tester asks to advance beyond 720 minutes
- **THEN** an advance beyond the limit is rejected, and reaching 720 minutes leaves the clock paused

### Requirement: Examples are reachable and synthetic
Every showcase example SHALL be contactable from public paths, and showcase and presentation worlds SHALL be deterministic valid world data. The presentation world SHALL contain no user tracks or contributions, and the showcase SHALL use only synthetic visitors. Tests: `apps/server/src/replay/showcase.test.ts`, `apps/server/src/replay/presentation.test.ts`.

#### Scenario: Ride public paths
- **WHEN** fixes follow the public paths of the showcase area
- **THEN** every showcase outbreak is contacted
