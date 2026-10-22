# Tasks

## 1. Accepted baseline and shared visuals

- [x] 1.1 Save the accepted guide baseline; verified commit `754a5c1` contains the approved showcase files and is the rollback reference.
- [x] 1.2 Extract state selection, palette, motion, gap contours and vector badges into `packages/rendering`; verify its typecheck and meaningful geometry/state boundary checks.
- [x] 1.3 Adapt the web guide to shared definitions and document the interface; compare the shared guide/native output during visual review. Further owner-directed visual refinements remain in task 4.1.

## 2. Android material integration

- [x] 2.1 Adapt `RicherMapImages` and native map layers to shared definitions, with state-aware cache keys and bounded nearby-animation poses; verify mobile typecheck and emulator state rendering.
- [x] 2.2 Integrate centered badges and cooldown/current-outing overlays without hiding lifecycle context; verify an already-ineligible contact does not imply points and native layers remain camera-aligned.
- [x] 2.3 Update native rendering documentation and inspect fast pans, zoom, cold loading, shoreline clipping and reduced-motion/background behavior in the emulator; record observed results and limitations. Rotation and broad performance benchmarking remain limitations, not acceptance claims.

- [x] 2.4 Implement progressive zoom bands, antenna lab badges and tappable complete-world area summaries; verify counts, transitions, clustering isolation and bounded rendering. Owner review is tracked separately below.
- [x] 2.5 Obtain owner review of the progressive overview, including group appearance, zoom transitions and individual lab/outbreak markers; resolve the latest field-lab boundary feedback.

## 3. Isolated showcase fixtures and controls

- [x] 3.1 Extend replay fixtures with deterministic accessible examples in Hatanpää, Viinikanlahti, Viinikka and Nekala; verify coverage of all nine lifecycle/effort examples and two personal markers using normal world parsing.
- [x] 3.2 Implement paused-by-default lifecycle time, resume/pause, advance and deterministic reset in the isolated runtime; verify reset repeatability and rejection/unavailability in the field environment with focused checks. Clock changes are in-memory and confined to the standalone showcase preview.
- [x] 3.3 Add tester-only example selection, fit and previous/next map controls to Android; verify environment identity and emulator forwarding before use.
- [x] 3.4 Add Android controls for lifecycle pause/resume, advance and deterministic reset after the isolated runtime supports them; observe membrane motion while lifecycle time is paused.
- [x] 3.5 Document the current showcase launch, available map controls, isolation and return to normal replay in `docs/replay-tool.md`; verify the documented commands against the isolated environment. Update the documentation when lifecycle controls are implemented.

## 4. Review and normal replay integration

- [x] 4.1 Present the showcase states in the emulator and record implementation findings and owner feedback in the review notes below.
- [x] 4.2 Obtain explicit owner visual acceptance of every showcase state and the revised overview; retain unresolved visual feedback as unfinished work.
- [x] 4.3 Run a representative recorded outing through the living replay world using the same renderer; verify outbreak contacts, cooldown markers and lifecycle transitions while preserving isolated data boundaries.
- [x] 4.4 After emulator approval, build/install on the Fold5 only after confirming no active recording; verify install success and obtain explicit owner phone approval, including shoreline containment. The owner accepted the phone visuals on 2026-10-22.
- [x] 4.5 After acceptance, record completion evidence in `docs/finished-goals.md` and update the current-goal pointer; verify no outstanding owner acceptance is presented as complete.

## Workflow follow-up

- Archive this change and sync its capability deltas only after implementation and acceptance are complete.
- Add baseline specs for other existing capabilities incrementally when they are next changed; do not imply this first change specifies the entire game.

## Implementation and review progress (2026-10-22)

- Added `replay/showcase.ts` and `prepare-showcase.mts`: deterministic public-access examples cover the outbreak lifecycle and effort states, personal overlays, and cleared protection through the normal world parser. Its only mutations are the in-memory showcase clock; example selection, map fitting and clock controls work.
- Shared state selection, palette, motion, outbreak geometry and badges are consumed by the web and native adapters. Native caches include state and personal-overlay changes; state badges are geographic native symbols. Current emulator review drove shape, halo, marker, overview and prewarming refinements.
- Host GPU is verified as Apple M1 / Metal. Native material budgets were reduced from 144 to 52 possible sources. Ahead-of-pan preparation uses visible-first deterministic selection within a half-viewport margin, capped at 24 prepared bodies and four animated visible bodies; see native rendering evidence for observed behavior and limits.
- Fixture task 3.1 is verified: all 13 outbreak footprints intersect public traversable ways with zero contact tolerance, and all twelve named native camera selections were exercised. Recent focused rendering, preparation, lifecycle and fixture checks plus workspace typechecks passed; strict OpenSpec validation passed. These checks establish implementation behavior, not Fold5 installation or field reliability.

## Shape and zoom feedback (2026-10-22)

- Shared browser/native clearing, rounded remnant/droplet and splitting zipper contour definitions; native state-specific stroke scaling and split context now use those definitions. Guide comparison and emulator inspection performed. Exact GPS/contact geometry and saved rewards were not rewritten.
- Replaced distant LAB text with an antenna vector badge, including the personal collected check. Added simplified middle-distance bodies, small badges and native density-aware area summaries from the complete received world; counted the fixture's 13 outbreaks and 2 labs and exercised tap expansion.
- Added task 2.4 and progressive-overview requirements for this scope. Centered combined counts and groups that progressively split soon after Overview are the accepted design.
- Workspace typechecks, all 174 tests, lab consistency and strict OpenSpec validation passed. Shape invariant tests cover separate satellite droplets and complementary open zipper seams. Review evidence is local and ignored under `work/replay/evidence/2026-10-22-field-labs/zoom-shapes/`.

## Latest visual and contact feedback (2026-10-22)

- Restored Clearing's broad layered stroke halo for all detailed outbreak states, with palette-specific colors and rounded joins; cracked interiors are excluded. Emulator evidence is `restored-layered-halos.png` in the ignored review-evidence folder.
- Doubled the contact radius for newly generated remnants using projected geometry, then reapplied shoreline clipping and neighbor separation. The frozen showcase and replay presentation use the same helper; saved historical contact intervals are unchanged. Focused contour and lifecycle checks passed. Evidence is `remnant-radius-2x.png`.
- Added deterministic ahead-of-pan preparation for nearby outbreak artwork. Emulator mid-pan evidence is `prepared-mid-pan.png`; rendering remains bounded and does not guarantee preparation during arbitrarily fast teleports or beyond capacity.
- Removed the solid inner outline from the Field Lab center marker after owner feedback; the soft fill and outer dashed collection boundary remain. The latest emulator reload showed the single boundary.

## Isolated lifecycle controls (2026-10-22)

- The showcase preview now starts paused and exposes authenticated in-memory pause/resume, five-minute advance and deterministic reset controls, capped at 720 minutes. Focused tests cover clock transitions, reset and limit handling; HTTP checks confirmed the preview controls reject unauthenticated requests and reset restores the frozen fixture. The field API has no corresponding route.
- The Android render-test panel exposes the same controls only when connected to the isolated preview. Emulator inspection confirmed `5/720 min` after advancing and that membrane motion continues while lifecycle time is paused. Replay documentation now describes the controls and isolation boundary.

## Accepted visual baseline (2026-10-22)

- The owner accepted the current Android outbreak, Field Lab and progressive-overview visuals as the baseline for this goal. Visual iteration is deferred to a later, separate stage. Tasks 2.5 and 4.2 are complete; this acceptance does not imply Fold5 approval.

## Recorded outing integration (2026-10-22)

- The five-rider `living-tampere` scenario replayed the private recorded route through the living geographic world: all five outbreak contacts were accepted, clearing completed, and the target was replenished after the 13-hour settling window. Reset and replay produced identical full results.
- Added `living-solo-repeat.json` for the same private track and Tampere world. Its first contact was accepted, the one-hour revisit showed cooldown with zero points, and the six-hour revisit was accepted again; reset and replay matched the full world, clock, contacts and rewards.
- Captured the pre-settlement Withering and Clearing `WorldView`s and loaded them through the emulator's normal authenticated map endpoint. The native MapLibre renderer displayed the living outbreak shape and pause/clearing state badge. All replay data and preview endpoints remained local and isolated from field accounts and storage.

## Fold5 release review (2026-10-22)

- Confirmed no active Sporeward recorder service or recording notification on the Fold5. Built the standalone release APK, passed the Android permission check, and installed it with `adb install -r`; the package's original install time remained unchanged, confirming this was an update that preserved app data.
- The owner subsequently reviewed the installed phone visuals and accepted them on 2026-10-22. The accepted visual baseline completes this goal; another rendering pass is deferred to separate future work.
