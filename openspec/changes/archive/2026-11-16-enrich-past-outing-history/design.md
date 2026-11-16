# Design

## Context

`apps/mobile/App.tsx` already loads the signed-in user's eight most recent outings from SQLite. Each history row currently shows only the start timestamp and opens a text-first recap. `RouteMap` can render a full-screen map with a recorded route and touched-outbreak styling. The local store also holds GPS fixes, recording segments, upload state, and the server receipt; the recap may later refresh authoritative score data.

## Goals / Non-Goals

**Goals:** Make past outings recognizable from their routes, and use one map-first recap in the same visual language after finishing and when opening an outing from history.

**Non-Goals:** Change scoring, upload/retry behavior, account ownership, or GPS retention; add another history store.

## Decisions

- Derive distance from saved fixes and active duration from saved recording segments, excluding pauses. Treat distance as a local GPS summary, not a validated game distance.
- Read upload state and saved server receipts from existing account-scoped records. Show confirmed and possible cleanup points only from an authoritative recap; never label provisional encounter estimates as confirmed.
- Add an authenticated endpoint that derives contact IDs and timestamps from the saved recap for the requesting account, then returns only matching historical footprints valid at those times. Reuse persisted PostGIS history; do not accept player IDs, times, or geometry from the client.
- Give each of the existing eight history cards a static basemap thumbnail with its recorded route and touched outbreaks. Serialize MapLibre static-image rendering rather than starting eight interactive maps; use a local Skia route preview while the basemap loads or is unavailable. Temporary images stay in the app cache and are removed when replaced or the card unmounts. The full recap remains a MapLibre map. Selecting a card opens the same full-screen recap used after finishing an outing; Android back navigation returns to the history list.
- Avoid extra map work on the active recording screen; load history previews only when the history screen is opened. Unprocessed local outings show their route and upload state until authoritative contacts and historical shapes are available. Label local point estimates separately from confirmed server points.

## Risks / Trade-offs

- Old uploaded outings may have no encounter recap in their saved receipt. They will show upload completion without score values until the existing recap flow fetches authoritative details.
- GPS drift can inflate displayed distance. Label it as recorded distance and avoid presenting it as a validated score metric.
- [History loading may issue several account-scoped footprint requests] → Keep requests bounded to the existing eight-item window and load them only when history opens.
- [Old or unprocessed outings may not have authoritative encounter geometry yet] → Show route and upload status without fabricating touched outbreak shapes; load footprints after the server processes the activity.

## Handoff

- Owner: this implementation session, `/Users/red/Koodit/sporeward`, branch `feat/outing-history-summaries`.
- Implementation checks: mobile TypeScript check, focused protocol/server tests and Android debug assembly passed; final focused regression checks are recorded in the PR.
- Independent code review accepted the implementation after fixing selected-outing footprint loading and restoring static basemap previews; its follow-ups on repeated footprint requests and thumbnail bounds were also addressed.
- The owner deferred visual and Android back-navigation review to a later phone session on 24 October 2026. Tasks 2.4 and 3.1 remain open; this change is not archived or visually accepted.
- Next action: publish the implementation PR, then work on the accepted in-app visual guide independently. Return to the pending phone checks before closing this change.
