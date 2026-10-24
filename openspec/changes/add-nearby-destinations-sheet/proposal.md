# Proposal

## Why

Choosing a worthwhile detour currently means tapping destinations individually on the map. A compact comparison sheet would let players find an attractive nearby outbreak or Field Lab and pin it without losing the map context, supporting [player-chosen A-to-B detours](../../../docs/product-direction.md).

## What Changes

- Add a Nearby destinations sheet to the native live map, usable before or during an outing.
- Browse All, Outbreaks or Field Labs from the latest received world, including destinations outside the current viewport; label the list as limited to that loaded world.
- Put personally available destinations first, then order by straight-line distance to their contact areas when an existing recent location is available. Keep unavailable destinations in a secondary group with their reason; omit cleared and expired destinations.
- Reuse the pinned-target summary for eligibility, visit points, conditional cleanup, remaining effort, lab offers and provisional contact. Do not manufacture idle lab offers.
- Open existing target details from a row, then explicitly pin or replace the single destination using the existing map action. Dismissing or merely browsing the sheet preserves the current pin.
- Keep browsing useful without recent location, show snapshot/update context and clear empty states, and preserve recording and map controls.

## Capabilities

### New Capabilities

- `nearby-destinations`: Live-map destination comparison, type filters, honest proximity ordering and handoff to the existing destination details/pin.

### Modified Capabilities

None. The [renewable exploration](../../specs/renewable-exploration/spec.md) and [Field Lab](../../specs/field-labs/spec.md) contracts are unchanged. This adds a catalogue beside the active [destination-focus change](../add-map-destination-focus/proposal.md), rather than changing its single-pin contract.

## Impact

Native map UI, a pure destination-list selector and a short player-rules update. Reuse `RouteMap`, `destination-focus.ts`, the app-owned pin and existing world/outing evidence. No new server endpoints, dependencies, GPS watch, permissions, routing, ETA, scoring, lab offers, recorder/upload behavior or world migration.

Dependency: destination focus is implemented in commit `ac7f331`, [PR #25](https://github.com/redfellow/sporeward/pull/25), which is open at proposal time. Its phone acceptance remains separate. The owner approved this plan and requested apply on 24 October 2026; tasks.md owns implementation progress and remaining acceptance.
