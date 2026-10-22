# Design

## Context

See proposal.md for motivation. The accepted browser reference is `apps/web/src/rendering/PaletteStudy.tsx` at `754a5c1`. `packages/rendering/src/richer.ts` currently shares palettes and membranes, but guide-specific gaps, badges and state motion remain web-local. Android `RicherMapImages` rasterizes cached vector poses into native MapLibre ImageSources, and `RouteMap` supplies native boundaries and personal layers. This camera alignment is owner-approved.

The replay runtime already has isolated reset/advance endpoints and geographic lifecycle persistence. `apps/server/src/replay/presentation.ts` provides state fixtures, while `shoreline-presentation.ts` and `serve-map-preview.mts` reproduce field geometry without private histories. That read-only server cannot supply interactive lifecycle controls. Device port 3102 is currently forwarded to its host port 3112.

## Goals / Non-Goals

**Goals:** Share platform-neutral visual data, keep platform drawing adapters small, provide deterministic state inspection through normal world contracts, and preserve a clear separation between visual animation time and lifecycle time.

**Non-Goals:** Changing production scoring or split balance, migrating field-world geometry, account changes, new Strava integrations, or retroactively specifying every existing system. The newly agreed size/category rules remain documented design until implemented in a separately scoped gameplay change.

## Decisions

1. Extract colour, state selection, membrane transforms, contour/gap points and badge vector geometry into `packages/rendering`. Adapt those outputs to Canvas on web and Skia/native MapLibre on Android. Duplicating the browser implementation in mobile would make future refinements diverge.
2. Retain cached geographic ImageSources and native camera-aligned layers. Extend cache identities to include state/material changes. Bound detail and pose generation as the current renderer does; a screen-space overlay would regress accepted camera alignment.
3. Extend the existing isolated replay lifecycle fixture and API rather than the read-only field snapshot viewer. Choose fixed accessible locations within the four agreed neighbourhoods using existing public access/water data. Use disposable identities and ordinary world responses. Add only minimal presentation metadata if crack progress cannot be derived from the current response; never expose private tracks.
4. Add tester-only scenario selection, overview/jump and lifecycle controls through the isolated replay runtime. Keep its lifecycle clock frozen initially; membrane animation remains a local visual clock. Reset must restore fixture clock, treatment and marker histories deterministically. Field endpoints must not offer these controls.
5. Compare the fixed showcase against the browser reference first, then use recorded outings against the living replay world. Keep visual inspection and a small number of meaningful transition checks distinct from owner acceptance. Do not require new outdoor recordings to progress.

6. Use provisional native zoom bands: detailed geographic bodies at 12+ with membrane animation at 14+, simplified coloured bodies with small badges below 12, small individual badges below 12 where space permits, with density-aware screen-distance clustering of nearby destinations below 12. Sparse destinations remain individual tiny badges at the widest zooms. Area summaries show only a centered combined destination count; tapping expands the cluster. Native clustering uses every received destination, independently of near-detail culling. Relative to the settled Overview zoom, the grouping radius falls from 60 to 28 native pixels at −0.375, then 12 at +0.125, with individual destinations at +0.625; all grouping ends by zoom 11.375. This delays grouping by 2.5 quarter-level zoom-out presses. Exact bands, cluster radius and summary presentation remain reviewable tuning.
7. Share procedural remnant cores/droplets, clearing contours and split zipper path commands between the guide and native rendering. Adapt these appearance contours to geographic extents without mutating persisted server contact rings or historical matching. Related stabilizing children share a centre/seed and complementary seams. Preserve the existing detailed-art cache bounds.

## Risks / Trade-offs

- Rich cached animation can increase cold-load cost → share geometry and keep nearby-detail, cache and pose bounds; inspect loading and fast pans in the emulator.
- Static fixture fields can hide broken transitions → construct representative engine states and exercise time advancement and recorded contacts through the normal pipeline.
- A stale port reverse can point tests at the read-only viewer → verify replay environment identity and explicitly configure the emulator connection before lifecycle/recording checks.
- Documented balancing differs from existing implementation → keep fixture tuning scoped to presentation and surface any required gameplay changes before implementation.

## Migration Plan

Port shared visuals in reviewable slices, preserve the accepted browser output, add the isolated showcase and controls, then review emulator and phone. No production database migration is planned. Roll back the visual guide to `754a5c1` if requested; keep any later data migration separate. Restore ordinary replay clock/world and forwarding before faithful GPS recording scenarios. Preserve the existing final-phone shoreline review as part of the final visual acceptance.

Numbered group markers have a tapered radial glow 2.6 times their diameter. Zoom buttons move by 0.25 zoom levels. Detailed outbreak shapes begin at zoom 12; summary grouping ends at zoom 11.375, while small state badges remain until zoom 14.

Group fill and glow use the arithmetic mean of remaining outbreak visits through a muted ochre/terracotta/rose effort palette; labs are excluded and lab-only groups use muted mint. Split siblings share one centered badge while counts/effort retain both exposures. Remnant art is enlarged within its contact footprint. Labs use larger antenna/station art over circular native markers; the exact contact ring is shown from zoom 13.

Group discs use muted opaque effort colors with heavier soft cream numerals and no text halo; water-colored borders and tapered glow preserve area context without neon fills.

Forming cracks use a shared original angular trunk and tapering forks, informed by the owner-provided [crack reference](https://www.vecteezy.com/vector-art/14846952-set-of-vector-cracks-isolated). Boolean subtraction against the actual footprint replaces the old fixed interior slit. Native fill/rim and cached membranes consume those same cut contours; the web guide uses the same recipe. Authoritative contact rings remain unchanged.

Every detailed state now uses the broad Clearing halo, tinted by its state palette; small remnant satellites retain a restrained glow. Simplified body diameter scales are Heavy/Disintegrating 1.0, Medium/Cracking/Clearing/Splitting/Withering 0.9, and Light/Remnant/Cooldown/Visited 0.85. Lab center circles are doubled, new collection rings are circular with twice the former cell width in diameter, and all lab map labels are omitted.

Every state uses Clearing’s shared broad layered stroke recipe: widths 38 / 16 and opacities 0.09 / 0.18 in 77-unit body coordinates. Only palette colors vary. Round-joined strokes are baked into cached, padded Skia textures (maximum 512 pixels) to avoid native corner spikes. Cracked interiors are excluded from glow. The web guide uses the same recipe.

Ahead-of-pan preparation indexes outbreak bounds on world changes, selects visible bodies first then neighbors within a half-viewport margin with deterministic distance/id ties, and retains the existing 24-body source budget. Camera movement refreshes only preparation targets at 200 ms intervals; all artwork placement remains native. Preparation starts at 11.5, sources display at 12+, and only four visible bodies receive animation poses.

New geographic remnants expand their previous contour by 2× about its projected bounds center before applying existing shoreline and neighbor separation. Contact history is captured from the resulting enlarged ring; prior persisted intervals are not rewritten. The frozen showcase and living replay presentation use the same contour helper. Rewards, strength and one-touch behavior are unchanged.
