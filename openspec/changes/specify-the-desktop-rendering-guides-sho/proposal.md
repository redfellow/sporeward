# Proposal

## Why

The replay tool, the Tampere visual showcase and the desktop rendering lab are merged on main, but their main specs only describe owner-facing goals. Their tested guarantees (timeline rebasing, deterministic reset, isolated storage, showcase clock bounds, shared contact footprints, artwork invariants) are written only in docs and tests. This is part 5 of 5 of "OpenSpec specifications for existing project features".

## What Changes

- New capability `activity-replay`: recorded-track rebasing, the virtual replay clock, scenario determinism and identity checks, native replay window gaps, the mobile replay bridge, and replay storage isolation.
- `visual-showcase`: ADDED requirements for bounded showcase clock control and example reachability on public paths.
- `outbreak-visuals`: ADDED requirement that the desktop rendering lab uses one water-excluded footprint for drawing and contacts.
- `field-lab-guide` and `outbreak-resistance-guide`: ADDED artwork invariants for station poses and the resistance falloff.
- No code, test or gameplay change.

Direction: the Steward's split limited this to merged behavior only, backed by cited tests, and asked for deltas to existing capabilities first. The new `activity-replay` capability is the "replay capability if none fits" from the origin, because `visual-showcase` covers only the showcase. Native field guide visuals stay with `add-native-field-guide`.

## Assumptions

- Requirements cite only behavior pinned by existing tests. Doc-only claims (Strava catalogue scripts, Python normalizer, PostGIS comparison output) are left as open questions in design.md and not specified. The alternative was citing source references for them.
- Numeric limits that tests assert (720-minute showcase limit) are written into the spec. The alternative was leaving them as tuning values.
