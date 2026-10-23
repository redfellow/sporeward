# Proposal

## Why

The project has an implemented provisional growth and lifetime-extension model, but its behavior is not yet captured in an OpenSpec capability contract. Recording that bounded model makes the current behavior reviewable while keeping balancing values provisional.

## What Changes

- Add a gameplay capability spec for current outbreak growth, proportional cleaning effort, and accepted-visit lifetime extension.
- Preserve the existing configurable values and mark them provisional; this change records the inspected contract and does not alter runtime behavior.
- Leave footprint size categories, category cutovers, Light-only split eligibility, corridor classification, and strategic splitting outside this MVP contract. Keep those as future design questions rather than requirements.

## Capabilities

### New Capabilities

- `outbreak-growth`: Provisional growth, proportional cleaning effort, and lifetime-extension behavior.

### Modified Capabilities

None.

## Impact

This is a local OpenSpec baseline for behavior already present in `packages/game` and `apps/server`. It changes no runtime code, transport contract, field data, or visuals. Growth and extension values remain configurable and provisional as described in `docs/game-concept.md`.
