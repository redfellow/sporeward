# Current goal — Richer graphical style

Implement the accepted layered Richer style and obtain the owner's approval in the emulator, then on the real phone. Iterate until the owner considers it done.

- Replace the rejected heavy textured PNG appearance with translucent layers, refined inner rims, slow staggered breathing/skew and smaller faster-moving layers.
- Default to the accepted night map palette; offer a persistent Bright map option across map views.
- Preserve authoritative contact geometry, historical matching, recording and map interactions.
- Keep map loading responsive and animation bounded to visible/foreground content; respect reduced motion.
- Inspect camera alignment, state colours, pan/zoom/rotation and cold loading in the emulator with focused checks.
- Get explicit emulator approval before installing on the phone. Check recording is inactive before installation.
- Get explicit physical-phone approval; a build, test or our own screenshot does not complete this goal.

Status: active — owner reports the unified overlay still lags during emulator pans; Fold5 comparison installation is authorized before further tuning. Emulator visual/performance acceptance remains unproven.

All visible outbreak parts now share one Skia canvas and viewport transform, including bodies, rims and animated inner layers. This replaces the separate surfaces that caused detached layers while panning. The isolated emulator world now uses regional OSM water clipping for authoritative contact boundaries, preserving historical footprints. The public field world has not been migrated.

Night remains the default; Bright map persists across map views and process restarts. Focused geometry/history/lifecycle tests (12 tests), mobile/server typechecks and long emulator pans passed. These checks support another owner review, not acceptance.

Standalone release APK built successfully and installed on the Fold5 on 2026-10-21 with `adb install -r`, after confirming no active Sporeward service. Packaged recording permissions passed inspection. Account and recordings were preserved through an update installation. Owner phone comparison is pending.

Still required: owner camera/performance feedback and iteration, current field shoreline migration preflight and deployment, and explicit owner acceptance on emulator and phone. The owner specifically authorized the phone comparison despite the unresolved emulator lag.

[Current implementation and emulator evidence](native-richer-rendering.md).

Checkpoint: the owner confirmed overlay lag also occurs on Fold5. An event-driven camera transform is under development in the emulator; mid-pan reference checks still show misalignment, so this is not a finished fix. The Fold5 retains the earlier standalone comparison build. Next: resolve native-map/overlay synchronization, then repeat emulator and phone review.
