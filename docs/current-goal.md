# Current goal — Accepted visuals in Android and a repeatable showcase

Replicate the approved visual guide in the Android emulator, provide every outbreak state in a compact deterministic showcase, then exercise the same renderer in the living replay world. Completed guide, map alignment and shoreline work is recorded in [Finished goals](finished-goals.md).

## Agreed steps

1. **Preserve the accepted guide baseline.** Commit `754a5c1` is the new visual rollback reference, superseding `ce34675`. The checkpoint is complete; preserve this appearance while porting it.
2. **Share visual definitions.** Move palette, lifecycle/eligibility styling, membrane shapes, crack/split geometry and centered vector badges into the shared rendering package. Use the same definitions on web and Android. Keep Android rendering inside MapLibre's camera pipeline to preserve accepted panning.
3. **Build a compact visual showcase.** Use the area around **Hatanpää, Viinikanlahti, Viinikka and Nekala**. Deterministic nearby fixtures must cover Light/Medium/Heavy, Disintegrating, Remnants, Withering, Clearing, Cracks forming and Splitting, plus cooldown and visited-this-outing overlays. A tester-only selector opens the showcase and fits the map; individual examples are easy to find.
4. **Provide repeatable controls.** Reset, pause/resume world time, advance time and jump to an example. Start lifecycle time paused while membrane animation continues. Use the normal world format and production rendering path, with fixtures supplying the states; do not build a separate showcase renderer.
5. **Review and exercise transitions.** Obtain emulator visual approval, then use recorded outings in the living replay world to exercise touches, lifecycle changes, cooldowns and camera performance. Follow with a real-phone build after emulator acceptance and confirmation that recording is inactive. Explicit final phone approval remains required.

## Accepted contracts

- Ember & violet; night map by default with persistent Bright map option.
- Centered circular state badges, distinct violet remnants, pale clearing, slower withering tremble, angular disintegration membranes and tapered branching lightning. Cracks forming shows a narrow gap; Splitting shows complementary irregular halves with a jagged zipper gap.
- Personal markers: muted cooldown appearance, green border/check for contact this outing. Contact alone does not imply a points award; retain lifecycle context.
- Typical Light/Medium/Heavy footprint areas follow 1:2:4. Effort colour subtracts committed cleaning immediately; footprint shrinkage happens gradually. Children follow their shares of remaining work and fall below the parent's category; Light cannot split. Only disintegration creates remnants. Detailed balancing and engine integration must follow [Game concept](game-concept.md); do not treat fixture appearances as implementation of those rules.
- Preserve authoritative contact geometry, historical matching, recording, accounts and existing world data. Keep work bounded to visible foreground content and respect reduced motion. Use focused validation for each implementation slice.

## Environment and remaining acceptance

Fold5 panning and corrected emulator shoreline containment are accepted. The corrected shoreline/parser APK is installed, but final phone visual acceptance is still pending. The current emulator port reverse maps device 3102 to the read-only geometry viewer on host 3112; restore or deliberately replace that mapping before normal recording/replay tests. Keep showcase state isolated from the field world. See [Replay tool](replay-tool.md) and [Native rendering evidence](native-richer-rendering.md).
