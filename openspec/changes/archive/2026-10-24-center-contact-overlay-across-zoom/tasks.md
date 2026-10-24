# Tasks

## 1. Center the contact composition across individual zoom bands

- [x] 1.1 Compose the outing-contact check and green border at the marker center for individual overview and detailed outbreak rendering, retaining each lifecycle badge and artwork; add focused mobile tests for contacted/uncontacted markers across both zoom bands, including cooldown and lifecycle cases.
- [x] 1.2 Keep the composition in camera-aligned MapLibre sources and layers with existing contact data and geometry; verify the focused mobile tests and mobile typecheck pass without introducing screen-space overlays or per-frame work.
- [x] 1.3 Sync the accepted lifecycle-preservation scenario into the main `outbreak-visuals` spec while preserving the cooldown scenario, grouped summary counts, and contact-not-award meaning.

## 2. Emulator visual acceptance

- [x] 2.1 Inspect contacted and uncontacted examples at overview and detailed zoom in the emulator, including the transition between bands; record that the check stays centered, the green border remains visible, and lifecycle details remain readable.
  - API 37 emulator review: the contacted cooldown example retained its lifecycle clock glyph above the centered mint check inside the green ring at overview and detailed zoom; the uncontacted light example retained its amber glyph without the contact ring. The detailed outbreak outline remained green and map-attached through the zoom transition.
- [x] 2.2 Obtain explicit owner visual acceptance of the emulator composition before marking the change complete; resolve any requested visual adjustments and repeat the focused checks.
  - Owner visual acceptance received: “Looks great.”

## Workflow follow-up

- Archive the change only after the implementation checks and explicit owner visual acceptance are complete.
