# Proposal

## Why

The merged outing history and field guide help players understand past results and map states. The next player-facing gap is keeping a chosen detour easy to find: current destination details are temporary map-local cards without a compact, persistent target summary.

## What Changes

- Let a player pin one selected outbreak or Field Lab as their current destination and replace or clear it explicitly.
- Keep a compact destination summary visible while panning or reopening the live map, including after viewing help or history in the same app session.
- Show current personal eligibility, ordinary visit points and conditional cleanup reward, or the available Field Lab offer. Do not invent an offer when none has been received.
- Show distance to the contact area from an existing recent location, explicitly labelled straight-line distance. Do not imply cycling-route distance, extra detour distance or an arrival time.
- Highlight the destination within MapLibre and offer a fit-to-target action without changing normal player-follow controls.
- Reflect recorded contacts, confirmed collection, expiry and disappearance using existing evidence and current world data. Pinning itself never counts as a visit.

## Capabilities

### New Capabilities

- `destination-focus`: Session-scoped map destination selection, legible reward/eligibility feedback, direct-distance context and safe target navigation.

### Modified Capabilities

None. Existing [renewable exploration](../../specs/renewable-exploration/spec.md), [Field Lab](../../specs/field-labs/spec.md), [outbreak visual](../../specs/outbreak-visuals/spec.md), and [contact](../../specs/gps-contact-matching/spec.md) rules remain unchanged.

## Impact

Native app/map presentation and a small pure destination-summary model. Reuse existing world snapshots, outing contacts, location access and lab offers. No server changes, new location permissions, routing service, recording changes or gameplay migration. The owner accepted the plan and requested implementation on 24 October 2026; tasks.md owns progress and pending acceptance. Product basis: [optional A-to-B detours](../../../docs/product-direction.md).
