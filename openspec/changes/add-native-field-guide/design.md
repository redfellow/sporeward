# Design

## Context

The approved map artwork is shared through `packages/rendering`, while the full visual guide exists only in the desktop rendering study. The native map and recorder are separate from the app's simple screen selection. The owner approved implementing an offline native guide on 24 October 2026, following the explicit map-entry/approved-artwork/lab-and-resistance scope in the proposal.

## Goals / Non-Goals

**Goals:** Short initial reading, recognizable specimens, safe navigation during an outing, and lightweight local rendering.

**Non-Goals:** Change gameplay, enable strategic splitting, add a simulated world or real scoring to the guide, require an emulator run, or deploy anything.

## Decisions

- Provide three small sections: Start here, Outbreaks, and Labs & Resistance. The first contains the brief loop and rewards explanation; the specimen gallery is optional reading.
- Use bundled shared specimen geometry, pigments, membrane transforms, centered badge SVGs and the existing survey-station SVG. A local SVG adapter is preferable to embedding a remote browser page or starting additional MapLibre worlds. Keep the live map renderer unchanged.
- Use a virtualized specimen list and animate at most one explicitly selected specimen. Honor reduced motion and foreground status. Static rendering remains the default and the full guide is readable offline.
- Opening/closing changes presentation only; recording and synchronization remain in the mounted app owner. Handle Android back only while the guide is open. Use the existing Bright map preference.
- Keep balance-dependent numbers out of player copy. Label cracks and splitting as preview artwork because ordinary-world strategic splitting remains disabled.

## Risks / Trade-offs

- [A local specimen adapter could drift from accepted artwork] → Consume shared geometry/pigments/membranes/badges and review it independently; leave phone visual acceptance explicit.
- [A long gallery could add rendering work] → Virtualize it and animate one requested example, never all examples on every frame.
- [History and this feature both edit navigation] → Keep this feature on its own branch from current main; the history PR remains independently reviewable.

## Handoff

Owner: root session, `/Users/red/Koodit/sporeward`, branch `feat/native-field-guide`. Approved scope: the owner's “Kyllä, toteuta peliopas” reply on 24 October 2026.

Implementation delivered; independent review accepted with no blocking findings. Mobile/rendering/web TypeScript checks and 11 focused rendering/contour checks passed. Expo exported the Android JavaScript bundle to a temporary directory without running an emulator. Strict OpenSpec validation and `git diff --check` passed. The separately published outing-history implementation remains in PR #23, not merged into main.

Disposition: publish the guide implementation from this branch in a PR targeting main, authorized by the owner on 24 October 2026. The map's separate guide-open flag and additive help button avoid changing the routing/header lines changed by outing-history PR #23. Next: owner PR review and physical-phone readability, back-navigation and motion acceptance (task 3.2), then eventual OpenSpec closeout. Do not claim overall completion, sync specs or archive before that acceptance.
