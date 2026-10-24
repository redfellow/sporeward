# Proposal

## Why

The live map already changes touched shapes and its points tally, but does not clearly explain each personal contact. Brief contact feedback and a recoverable current-outing log would make a chosen detour feel worthwhile and explain what happened while the screen was off, supporting [outing motivation and reward understanding](../../../docs/product-direction.md).

## What Changes

- Show brief, non-blocking live-map banners for newly observed outbreak and Field Lab contacts during foreground recording.
- Keep estimated visit points, points held until the outing qualifies, local cooldown/no-estimate explanations and provisional lab collection distinct from confirmed awards. A contact never guarantees cleanup or restoration.
- Add a scrollable Recent contacts log for the current recording or paused outing, using recorded contact times and retaining known evidence after targets disappear from the current map.
- Preserve a small local feedback record for outbreak and lab contacts so map remounts, app restarts and world refreshes do not repeat celebrations. Recover screen-off/catch-up contacts into the log silently.
- Group rapid contacts into bounded feedback rather than showing a long backlog. Coordinate banners and the log with destination details, Nearby and existing world-cleanup notices, keeping pause/finish controls accessible.
- Keep contact matching, scoring, recording and upload behavior unchanged. Existing authoritative recap remains responsible for final outing results.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outing-feedback`: Add personal live contact notices, recoverable current-outing contact history, evidence-aware wording and deduplicated, non-disruptive presentation. Extend the [existing feedback capability](../../specs/outing-feedback/spec.md); its recap requirements remain unchanged.

## Impact

Android presentation, a pure feedback reducer/formatter and a small additive local SQLite feedback store alongside existing contact previews. Integrate at the app-owned outing context so opening help/history or details does not reset feedback identity; reuse shared matching and current personal offer/recap context.

No server endpoints, protocol payload changes, authoritative gameplay migration, new GPS watch, background processor, permissions, sound or haptics. Preserve saved GPS, activity IDs, ownership, receipts and historical footprints. The [destination focus](../add-map-destination-focus/proposal.md) and [Nearby sheet](../add-nearby-destinations-sheet/proposal.md) implementations were available in open PRs #25 and #26 at proposal time; their phone acceptance remains separate. The owner approved the artifacts and requested apply on 24 October 2026. Current implementation and acceptance evidence is recorded in [design.md](design.md).
