# Tasks

## 1. Field Lab visual slice

- [x] 1.1 Add the survey-station available/collected examples and motion-off state to the existing desktop guide; verify web typecheck and inspect both map themes beside ordinary outbreak examples without changing their accepted treatment.
- [x] 1.2 Add independent two-player collection simulation and all ten reward names, with concise explanatory copy; verify one player's collection leaves the other player's opportunity intact, repeat collection is disabled, and each name is inspectable.

## 2. Outbreak Resistance visual slice

- [x] 2.1 Add an illustrative geographic resistance circle with centre, soft falloff and local-cleaning/passive-time controls; verify map labels, outbreak effort and personal markers remain readable, and increased resistance/recovery produce opposite visible changes.
- [x] 2.2 Add before/after global restoration, distance/cap and successive-collection comparisons using explicit provisional parameters and a stable outing offer; verify zero-resistance, distance-cap, repeated-collection and reset boundaries with focused checks, plus static rendering with motion disabled.
- [x] 2.3 Document the actual guide URL, launch command, controls and simulation limitations in a short web-preview document; verify its links and run the documented local preview without connecting to live game state.

## 3. Integrated owner review

- [x] 3.1 Present the running desktop guide with lab collection, co-op state, passive recovery and resistance weakening; capture review evidence and explicit owner acceptance, retaining unresolved visual feedback as unfinished work.
- [x] 3.2 Verify the new guide against the existing ordinary-outbreak baseline and pending Android-port scope, record observed validation and limitations in this change, and confirm no engine, field-world or Android implementation has been implied.

## Verification notes

- Web typecheck passed. The local `/rendering/palettes` page reloaded in the in-app browser and was inspected in Night and Bright map themes with motion enabled and paused. The approved ordinary-outbreak cards remain unchanged; the new section is appended below them.
- Two-player check: collecting as Player A disables repeat collection for A while Player B remains eligible. The reward-name control exposed all ten names. Reset returned both players, the selected player, resistance, elapsed time, distance and offer to their initial fixture state.
- Resistance controls: repeated cleaning raised resistance from 66% to 96% and reduced centre points from 52 to 31; 24 hours of recovery lowered resistance to 74% and raised centre points to 47. A 20 km offer reached the 42% cap and remained 42% at the original 20 km reference after moving the slider to 0 km during a simulated outing. Ending the outing recalculated the offer to 0%. Two successive collections yielded 42%, then 29%; at zero resistance the reward control disabled. Reset restored the 66% resistance, 6 km distance and 21% offer.
- The guide adds the `PaletteStudy` import and the web-only `ExplorationLabs`, `ExplorationMap` and styles, using the bundled OSM snapshot and existing Richer rendering primitives. No engine, protocol, server, Android, account, field-world, scoring or activity data changed. The controls use illustrative local values and do not establish production balance. Android adoption remains pending in the separate visual-port change.
- Owner accepted the integrated visual direction after map, visibility, layering and colour refinement; selected hue 227° and requested removing the tuning slider and continuing.

## Approved visual refinement

- One combined map uses the bundled Tampere/Iidesjärvi OSM snapshot, existing organic Richer growth/membrane primitives, ordinary effort and visited cues, and a detailed survey station. The accepted ordinary-outbreak cards are unchanged.
- Available labs have a luminous sample chamber and scanning arcs. Personally collected labs retain their location with an empty chamber, quiet scanner, slightly slumped support and check; other players retain an intact available station.
- Resistance uses the owner-selected fixed hue 227°, visible fading haze and screen-readable contour lines. Layer order is terrain/buildings → resistance → roads → outbreaks/station; resistance is masked out of translucent outbreak silhouettes. The temporary colour slider was removed after selection.
- Geometry and map layers are cached. The scene stops animation requests offscreen, in hidden tabs and with motion paused. No live field-world dependency was added.
- Live review verified A's collection changed resistance 66% → 45% and centre opportunities 52 → 68 points; A became depleted/disabled, B retained the intact lab at 66%, and switching back preserved A's state. Bright map and motion-paused views were inspected. Web typecheck and strict OpenSpec validation passed. Review screenshots remain temporary under `/tmp/`, outside version control.
- Owner acceptance: “We can get rid of the slider and continue.” This completes desktop guide review only; Android/gameplay integration and deployment remain separate.

## Workflow follow-up

- Archive/sync only after visual implementation and owner review; guide capability specs do not baseline an implemented resistance engine.
- Before gameplay implementation, create a separately agreed change covering the future direction and open balancing questions in design.md, with weekly commute/adventure, short local walk, alternating-hotspot and high-mileage scenarios. Reconcile concept/player rules there.
- Scope Android adoption separately after guide approval, coordinating with the existing visual-port change.
