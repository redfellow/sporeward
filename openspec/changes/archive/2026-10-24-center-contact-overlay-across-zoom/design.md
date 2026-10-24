# Design

## Context

See proposal.md for motivation. The accepted `outbreak-visuals` spec defines contact as a centered green check and border over preserved lifecycle information. Android already renders individual overview markers and detailed outbreak artwork in native MapLibre layers, but the overview currently offsets the contact check from its lifecycle badge. Keep both zoom bands on the same geographic, camera-aligned rendering path.

## Goals / Non-Goals

**Goals:**
- Show the outing-contact check at the marker center with a green border at overview and detailed zoom.
- Keep lifecycle identity and outbreak details legible beneath or alongside the contact cue.
- Keep contact presentation driven by the existing per-outing contact set.
- Preserve contact-aware summary grouping and make clear that contact does not award points by itself.

**Non-Goals:**
- Change accepted lifecycle visuals, marker geometry, contact matching, scoring, or server data.
- Add a React Native screen-space overlay or unbounded animation.

## Decisions

- Compose contact as an independent visual overlay over the lifecycle marker in both `AreaSummaryLayer` and the detailed outbreak layers in `RouteMap`; use the existing shared marker composition in `outbreak-appearance` where it can keep the two zoom bands consistent. A separately offset symbol was rejected because it moves the check away from the centered marker and can separate it from the border.
- Derive lifecycle identity and pigment without the contact flag, then compose a lifecycle glyph with a centered outing-contact check and green border. Continue deriving `summaryGroup` from the existing contact-aware state so contacted outbreaks remain in the same unavailable bucket and grouped totals do not change.
- Keep all visual elements in MapLibre geographic sources and layers so pan, zoom, and rotation move the check, border, badge, and artwork together. Reuse existing contact data and lifecycle rendering; do not add map sources per frame or alter GPS/contact geometry.
- Keep the accepted contract's contact-not-award meaning explicit in the requirement and retain its existing cooldown scenario.
- Add focused mobile composition tests for contacted and uncontacted individual markers across overview and detail, including cooldown and representative lifecycle states. Assert both the centered check/border and retained lifecycle identity, rather than testing only palette selection.
- Treat emulator inspection as implementation evidence and explicit owner approval as a separate completion gate. Check the overview-to-detail transition and marker legibility at the actual zoom bands before requesting that approval.

## Risks / Trade-offs

- The centered check can obscure a compact lifecycle badge → tune the native symbol composition and inspect both zoom bands in the emulator while preserving a recognizable lifecycle cue.
- Separate map layers can drift in filtering or zoom bounds → cover layer composition in focused tests and inspect the transition in the emulator.
- A screen-space overlay would be easier to position but could lag or drift during camera motion → keep the check and border in MapLibre.
