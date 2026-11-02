# Design

## Context

See [proposal.md](proposal.md) for motivation and the [delta](specs/outbreak-resistance/spec.md) for behavior. `WorldView.resistance` already contains a centre, radius, centre resistance and version/activation metadata. It is optional; omission does not diagnose whether a server disabled the feature. The summary has no global reward-loss percentage, contribution breakdown or recovery deadline. The [baseline contract](../../specs/outbreak-resistance/spec.md) evaluates rewards spatially; a circular visual summary is not the scorer.

`ResistanceLayer.tsx` already renders the personal haze below roads and outbreaks inside MapLibre. `RouteMap.tsx` owns camera fitting and mutually exclusive Nearby/contact/detail surfaces; its existing overview fits labs and Resistance together. `destination-focus.ts` and `nearby-destinations.ts` supply per-player lab availability, matching offer validation, polygon-edge direct distances and deterministic sorting. `use-world.ts` refreshes on an existing interval and foreground return, retaining received/cached snapshots; its status is currently a display string. Its legacy world cache is keyed by player rather than server, so a persisted snapshot alone cannot establish environment provenance.

## Goals / Non-Goals

**Goals:** A short personal explanation with a useful map action and lab candidates, grounded in current account-owned evidence. Preserve the accepted native map rendering and all existing recorder controls.

**Non-Goals:** A new score calculator, global Resistance meter, low/medium/high tuning thresholds, restoration simulator, per-contribution history, route planning, a lab inventory, new location work, server API changes or a general cache-system redesign. No replacement of existing guides/recaps or acceptance claims for earlier features.

## Decisions

- **Extend the existing capability.** Add overview requirements to `outbreak-resistance`; reuse the merged destination/Nearby implementations rather than duplicating their behavioral contracts. Those changes remain active for phone acceptance and need not be archived to consume their source.
- **Use a bounded live-map sheet.** Add a labeled Resistance action alongside the existing live-map tools, also usable when idle or paused. Put a concise summary and recovery explanation first, then Show affected area and an available-lab list. Use text and existing field colors rather than a numerical meter or new arbitrary strength categories. A scrollable/virtualized list keeps a large loaded world bounded. Historical maps receive no overview.
- **Separate state from freshness.** A pure presentation model derives established field, explicitly empty field and unavailable context, plus independent last-known/loading/failed-refresh status and snapshot time. Add structured local receive/provenance metadata to the existing world hook instead of parsing its display string. Tie that metadata to account, server and world, with generation guards and reset invalidation. Never reinterpret an old recap or a local lab touch as current Resistance. With unknown legacy cache provenance, withhold this personal overview context until a matching fetch establishes it; do not rewrite or delete the cache or saved activities. An attributable in-memory snapshot can remain browsable after a refresh failure with explicit last-known wording.
- **Describe geography without inventing a penalty.** Copy explains that familiar cleaning areas can yield fewer ordinary visit points, with passive recovery and optional Field Lab relief. Show no raw `centreResistance` value, global percentage, recovery ETA or before/after attribution. If the summary has no centre or no positive centre resistance, say no active personal field is established in that snapshot; this is not a promise that all visits earn maximum points. When Resistance data is absent, explain unavailability rather than claiming a disabled setting.
- **Focus the field alone.** Reuse existing map projection/bounds helpers to fit the received centre/radius, respecting safe area and recording HUD. Close the sheet first, disable follow as an intentional camera action, retain the pin, and let normal center/follow controls restore following. Reuse `ResistanceLayer` unchanged unless a scoped integration adjustment is necessary; no screen-space overlay or per-camera-frame raster work. Disable the action for an absent/invisible field. The existing combined labs overview stays available.
- **Reuse lab summaries, not a new recommender.** Derive candidates from the loaded world's personally uncollected, unexpired labs. Reuse current-outing offer/receipt/provisional context and direct-distance helpers. Order by numeric direct distance when location is recent, otherwise stable name/ID order; state loaded-world coverage. Do not rank by promised benefit or claim road accessibility/route distance. Provisional collection stays explicitly unconfirmed. With no matching outing offer, display no numeric restoration estimate. Selecting revalidates against current received state, closes the overview and opens existing lab details; only the explicit pin action replaces a pin. No available candidates has a local-coverage empty message, even if a personal field exists. Cached candidates retain last-known qualification.
- **Share surfaces and identity.** Opening the overview closes Nearby, Recent contacts and expanded details while retaining the app-owned pin. Suppress the compact pin card and notices while it is open, using the existing feedback block path so contacts enter the log silently rather than queue a banner burst. Close/Back dismisses the overview first. Account/server/world resets close it; normal snapshots recompute it without camera jumps or pin changes. Recording continues and pause/finish stay outside the sheet.

## Risks / Trade-offs

- [Circle read as an exact penalty boundary] → Explicit spatial-summary copy; use existing per-target offers for rewards, never derive points from the summary.
- [Cache read as current or belonging to another server] → Structured scoped provenance; last-known timestamp/error state; unavailable overview until an unknown cache is attributable.
- [Lab collection looks like guaranteed recovery] → Matching offers only, provisional contact cue and confirmation on upload. No optimistic field weakening or causal claim from snapshot changes. Existing confirmed-zero recap wording remains unchanged.
- [Additional sheet crowds a folding phone] → Measured bounded height, scrollable content, mutually exclusive surfaces, at least 44-point controls and separate owner narrow/wide acceptance.
- [Feature becomes a world-hook/cache rewrite] → Add only overview provenance/status needed for these requirements. Preserve cache storage format, existing consumers and polling; surface any broader need before apply scope expands.

## Migration Plan

No server rollout, database migration or field-world mutation. Add the presentation model/component and local metadata, wire the live map, then add a brief player-rules explanation. Rollback removes the entry point and sheet without changing recordings, owners, contact previews, feedback rows, receipts, historical geometry or scores. Validate synthetic state/offer/selection boundaries and mobile TypeScript/Android JS export; independent implementation review follows. Physical-phone layout/gesture acceptance is a separate task, not replaced by source or bundle checks.

## Planning Handoff

Owner: root session in `/Users/red/Koodit/sporeward`, planning on `main` at `7baedf5` after merged PR #27. This request authorizes proposal/spec/design/tasks only. No runtime edits, implementation checks, commit, push, PR, baseline sync or archive are included. Unrelated investor artwork remains untouched. Next action: owner review, then explicit apply on a separate feature branch. Keep all earlier phone acceptance tasks open.

## Implementation Notes

### Overview model (`apps/mobile/src/components/resistance-overview.ts`)

- Pure function of the received world, the existing destination context (location, outing, offer, recap, provisional labs) and a structured snapshot status (`received` / `unattributed` / `none`, receive time, `idle`/`loading`/`failed` refresh). It reuses `nearbyDestinations` for lab availability, matching-offer validation, provisional versus confirmed collection and direct-distance ordering; it adds no scoring.
- Field state: no world while loading is `loading`; no attributable world is `unavailable`; unattributed legacy cache is `withheld` (no field, no labs); a world without `resistance` is `unavailable`; a summary with no centre or non-positive centre resistance is `empty`; otherwise `established`. The raw centre resistance is never shown or converted.
- Freshness is independent: `current`, `last-known` (failed refresh after an attributable snapshot, with the receive time and a qualifier), `loading` or `none`. Last-known data keeps its lab candidates with a qualified coverage line and never simulates recovery.
- Candidates are labs whose destination summary is `available` (uncollected for this player, unexpired at the received server time, not confirmed collected by the current outing's recap). Lab names are all "Field Lab", so equal-name ties fall back to id order. Copy states loaded-world coverage and straight-line distance to the collection area only.
- Presentation assumption: the affected-area explanation and the lab list are independent, so an established field with no available labs still shows a local-coverage empty message.

### Snapshot provenance boundary (`apps/mobile/src/server/world-provenance.ts`)

- `useWorld` keeps one in-memory `WorldProvenance` (identity `SERVER_URL|player`, source, receive time, world start, refresh state) updated by a pure reducer and exposed as `snapshotStatus`. It is derived inside the existing refresh path: no new poller, no change to the persisted cache format, saved activities or recorder.
- The legacy world cache is still keyed by player only. A world loaded from it is `unattributed` (the overview withholds personal context and labs) until a fetch for the current account and server succeeds; a cache load never downgrades a received snapshot for the same identity. Nothing is rewritten or deleted.
- Account/credential loss and identity reset dispatch `reset`; a changed player resets before the cache is read. The server is part of the identity key, but `SERVER_URL` is fixed per build, so a server change is a different key rather than an in-session transition. A received status is tied to `worldStartedAt`: a world with a different start is reported `unattributed` rather than described by an old receive time.
- Late asynchronous results are dropped by the hook's existing generation guard before any event is dispatched, and the reducer additionally ignores `failed` for a non-current identity. A failed refresh keeps the attributable snapshot as `last-known`; the overview, not the hook, words that state.
