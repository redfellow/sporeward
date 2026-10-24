# Proposal

## Why

The accepted `outbreak-visuals` contract requires a centered green check and border for current-outing contact while preserving outbreak lifecycle information. The overview currently places its contact check beside the lifecycle badge, and detail rendering does not provide the same centered composition; align both individual zoom bands with the accepted behavior.

## What Changes

- Compose the current-outing contact check and green border consistently over individual outbreak markers at overview and detailed zoom.
- Keep the underlying lifecycle badge and outbreak artwork readable, including cooldown and other lifecycle states.
- Clarify the accepted `Personal marker overlay` requirement for contacted outbreaks across lifecycle states while preserving contact-not-award meaning and grouped summary counts.
- Add focused mobile composition coverage and require owner visual acceptance in the emulator before considering the work complete.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

`outbreak-visuals`: make lifecycle preservation explicit for current-outing contact across active and non-active lifecycle states.

## Impact

Android MapLibre marker composition, the accepted `outbreak-visuals` requirement, and focused mobile tests, including overview markers and detailed outbreak layers. No contact matching, scoring, lifecycle transitions, geometry, grouped summary counts, or field data changes.
