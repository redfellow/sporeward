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
