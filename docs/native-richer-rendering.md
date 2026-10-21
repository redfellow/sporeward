# Richer native rendering — review pending

The accepted style uses translucent bodies, overlapping gradient membranes, refined rims and slow organic motion, including smaller faster layers. Night is the default; **Bright map** persists across map views and restarts.

## Current emulator implementation

`RicherMapImages.tsx` draws the accepted gradient-vector membranes with Skia into cached, geographically anchored images. Native MapLibre ImageSources and native body/rim/state layers handle all pan, zoom and rotation placement. There is no screen-space overlay following asynchronous projection events. The rejected per-pixel wet texture shader is not used.

The nearest eight detailed outbreaks have 16 cached poses spanning a seamless eight-second loop, with native opacity transitions every 500 ms. Up to 24 nearby outbreaks show interiors. Images are bounded to 384 pixels, the LRU cache to 192 entries. Generation yields between poses; bodies appear independently of image readiness. Background/reduced-motion states stop the animation timer; per-map disposable directories are removed on unmount. Reduced motion retains a single pose. The owner approved the emulator version. It has now been promoted to standalone builds, and an ARM64 release APK built successfully; it was installed successfully on the Fold5 after confirming recording was inactive.

## Evidence and limits

Mobile types and whitespace checks pass. Captured interior pixels changed over time (18,900 pixels above a five-level difference in a 246,400-pixel outbreak crop). A fast-pan frame shows map-native bodies and material together. The initial image cache occupied approximately 4.6 MiB; the emulator process later reported roughly 597 MiB PSS, including the development runtime and basemap. Neither value establishes physical-phone performance. Close-zoom edge quality, animation crossfades, loading, follow/rotation and state cues need owner review and focused checks.

The owner confirmed the earlier overlay lags on both emulator and Fold5. Removing projection round trips improved settled alignment but failed a fast-pan native-reference check; a direct UI-thread event experiment also showed separation. Those experiments were reverted before the map-native prototype. Do not use settled screenshots as proof of camera synchronization.

The map-native standalone APK was installed on the Fold5 on 2026-10-21 as an update, preserving app data. Physical-phone approval remains pending.

## Shorelines and field rollout

The isolated emulator world uses contour version 5: continuous shapes clipped against the regional OSM water mask, with identical display/contact boundaries and preserved historical intervals. Disconnected pieces across water are discarded, islands preserved, and candidates requiring unsupported polygon holes rejected or relocated. Public field-world migration is deployed and contour version 5 verified.

The mask uses the Finland OSM snapshot dated 2026-10-14 and is approximately 955 KiB compressed. Regeneration runs `scripts/world/extract-water.py`, then `scripts/world/tile-water.py`. An older 500-outbreak regional preview took 46.6 seconds for continuous surfaces and 1.53 seconds for shoreline preparation locally, preserving scores, contributions, bonuses and activities. The current 2,608-fixture field snapshot was privately backed up with owner approval; shoreline preflight took 2.26 seconds, changing 391 boundaries and relocating 10 outbreaks. After deployment, scores, contributions, bonuses and activity fingerprints matched the backup, the container was healthy and public authenticated HTTPS health returned 200. See [Field migration](field-migration.md).

Next: obtain owner phone feedback, iterate if needed and obtain explicit final approval. Emulator approval, installation and field shoreline rollout are complete; the overall goal is not yet complete.

## Shoreline cache failure and emulator comparison

The owner accepted Fold5 panning but reported water coverage in Viinikanlahti/Hatanpää. A read-only audit found 2,108 visible field outbreaks: the installed client rejected the response above its 1,000-outbreak limit, retaining the older map. The corrected parser allows 10,000 outbreaks with a one-million-vertex total budget. Native geometry is bounded to a padded viewport without reducing the world used for gameplay.

The emulator now displays an anonymized field-geometry fixture through the [read-only map viewer](replay-tool.md). Its Hatanpää view shows the bay clear; owner review and the corrected phone installation remain pending. The small yellow shapes are remnants from the field data, not a palette change. Three mask-idempotence discrepancies measured essentially zero water area and do not explain the reported bay-sized spill.

![Full field geometry in the emulator](images/native-shoreline-field-review-20261021.png)
