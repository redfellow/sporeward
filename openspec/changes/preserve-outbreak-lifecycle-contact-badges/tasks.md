# Tasks

## 1. Preserve Lifecycle and Contact as Separate Marker Signals

- [x] 1.1 Refactor mobile marker composition so lifecycle badge identity and effort appearance are derived independently from the current-outing contact flag; retain the contact check additively at individual overview and detailed zoom, and verify grouped summaries, MapLibre hit targets, and existing contact behavior are unchanged with focused mobile checks.
- [x] 1.2 Add focused mobile composition coverage for uncontacted and contacted clearing, withering, remnant, and unavailable/cooldown outbreaks at overview and detailed marker modes; verify lifecycle identity remains present alongside the contact check and that no award is implied.

## 2. Emulator Visual Owner Acceptance

- [ ] 2.1 Review the implementation in the Android emulator at individual overview and detailed zoom with representative contacted lifecycle states; verify the check and lifecycle glyph are both legible, remain attached during pan/zoom, and still communicate contact rather than an award, then record the visual result and obtain explicit owner acceptance.
