# Proposal

## Why

When an outbreak is contacted during the current outing, the mobile map can replace its lifecycle badge with the generic `visited` badge. This hides whether the target is clearing, withering, a remnant, or in another lifecycle state, contrary to the accepted [outbreak visual contract](../../../specs/outbreak-visuals/spec.md).

## What Changes

- Preserve the outbreak's lifecycle badge while showing the current-outing contact check at both detailed and overview zoom.
- Add focused mobile composition coverage for contacted outbreaks in representative lifecycle states at both zoom levels.
- Require emulator visual review and owner acceptance for the corrected composition.

The existing contact check continues to mean contact only; it does not promise that points were awarded. This change adds no gameplay rule or new visual capability.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The accepted `outbreak-visuals` requirement already requires the outing-contact marker to preserve underlying lifecycle information.

## Impact

Mobile map composition in `apps/mobile/src/components/RouteMap.tsx`, `FieldLabLayers.tsx`, and `AreaSummaryLayer.tsx`, plus focused tests under `apps/mobile/src/components/`. The implementation must preserve MapLibre camera alignment, existing contact geometry and field-world data. No API, shared gameplay rules, dependencies, or capability requirements change.
