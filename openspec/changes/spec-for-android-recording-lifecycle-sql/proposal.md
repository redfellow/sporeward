# Proposal

## Why

The Android recorder, its local SQLite store, upload retry and the map's world refresh are merged on main, but the specs only say native recording is the MVP source and describe two recovery outcomes. This is part 4 of 5 of "OpenSpec specifications for existing project features": record the shipped client contract as a baseline.

## What Changes

- `activity-recording`: add requirements for the recording lifecycle (one unfinished outing, explicit finish confirmation, 24-hour limit), local per-account persistence of fixes and segments, and the durable upload outbox with shared transfers and retry.
- `native-recording-recovery`: add explicit resume after a missing permission is restored.
- `outbreak-visuals`: add that the recorded route distinguishes GPS gaps from pauses.
- New `live-world-refresh` capability: cached world display, periodic and foreground refresh, and honest snapshot provenance. No existing spec owns client world refresh.
- No code, test or gameplay changes.

Direction: the Steward's split narrowed the origin to merged behavior only, with deltas preferred over new capabilities, and excluded behavior owned by enrich-past-outing-history, add-native-field-guide, add-map-destination-focus, add-nearby-destinations-sheet and add-live-encounter-feedback (history cards, guide, destination pin, Nearby sheet, contact feedback table and banners).

## Assumptions

- World refresh gets a new capability rather than being stretched into outbreak-visuals; the alternative mixed data freshness with artwork.
- Requirements without a focused test (SQLite store, sync, recorder) cite source; adding tests was ruled out by the documentation-only constraint.
- Open question, not specified: whether a pending upload retries in the background when the app is closed. The code schedules retries only while the app is active.
