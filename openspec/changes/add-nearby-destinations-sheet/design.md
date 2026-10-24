# Design

## Context

See [proposal.md](proposal.md) for motivation. `RouteMap.tsx` already owns target selection, current location timestamps, provisional lab contacts and HUD measurements. `destination-focus.ts` derives personal eligibility, rewards and direct distance. `App.tsx` owns the session pin and account/environment resets. `use-world.ts` supplies the latest received snapshot, status, cached data and existing refresh cadence; there is no nearby endpoint or catalogue today.

The reusable focus implementation is committed as `ac7f331` in open [PR #25](https://github.com/redfellow/sporeward/pull/25), not yet integrated into main. Its separate phone gate is not evidence that the new sheet has been accepted. Relevant baseline contracts are [renewable exploration](../../specs/renewable-exploration/spec.md) and [Field Labs](../../specs/field-labs/spec.md); the unsynced [focus delta](../add-map-destination-focus/specs/destination-focus/spec.md) supplies the single-pin dependency.

## Goals / Non-Goals

**Goals:** A comparison surface that shares target truth with map details, works with existing data and hands one target back to the live map without remounting it.

**Non-Goals:** A recommendation algorithm, points-per-kilometre ranking, arbitrary search radius, external search, routing, persistent multi-stop plans or new location/server behavior. Historical maps and accepted outbreak artwork remain untouched.

## Decisions

- **Scope and ordering.** Default each opening to All; offer Outbreaks and Field Labs tabs. Use all loaded world destinations rather than the rendered viewport subset or a new radius. Exclude cleared/expired destinations. Group `available`/`clearing` before cooldown/splitting/collected; contact evidence stays a separate qualifier and never proves eligibility. Within each group sort by numeric polygon-edge distance, then name and stable kind/id. With missing/stale location, sort by name and kind/id instead and explain the fallback. These are proposed presentation defaults for owner review, not new eligibility rules.
- **Shared pure model.** Add a small nearby-list selector beside `destination-focus.ts`. Reuse its summaries, clock split (world time for eligibility; device time for location freshness), current-outing guards and numeric distance helper. Keep numeric distance alongside formatted text; do not parse labels. If reuse would repeatedly scan the complete world for every row, extract a shared per-target summarizer or index lookups once rather than duplicating reward rules. Test ordering/filtering with synthetic worlds, not private GPS exports.
- **Bounded sheet.** Add a live-map Nearby control and a non-modal, bounded sheet with a virtualized section list, dark game styling, type/status cues and at least 44-point actions. Use measured top HUD, bottom recording HUD and control insets to keep pause/finish accessible. Show only one of the sheet, expanded details or compact destination card at a time; the underlying app pin remains unchanged. Default the filter on opening and keep it local, with no persistence requirement.
- **Explicit selection.** Row press closes the sheet and opens the existing selected outbreak/lab details, re-resolving kind/id against the current snapshot. Do not move the camera or change the pin. Existing Pin/Replace and Show target handle later actions. Closing or Android Back dismisses the sheet first; leaving the live map or identity/environment reset dismisses it. A removed target produces a short unavailable message instead of silently picking another destination.
- **Freshness and feedback.** Pass the existing world status into the sheet and show the snapshot's server timestamp as last update. Retain cached rows after a failed refresh with the failure visible; never call them live guarantees. No world data, no matches and no recent location get different explanations. An absent location does not block browsing, and no synthetic map-centre position is substituted. The existing two-minute threshold also governs ordering; reuse the lightweight freshness tick while the sheet is open even with no pin.
- **Keep map cost bounded.** Derive rows only while the sheet is open and when snapshot, relevant evidence, filter or location/freshness changes. Do not compute on camera pan/animation frames, build material images for list rows, fetch per-row data or start an extra poll/watch. Geographic highlights and panning stay in MapLibre. Opening the sheet adds client presentation work only; field geometry, account data, recorder, uploads and authoritative rules stay intact.

## Risks / Trade-offs

- [Nearby can suggest reachable cycling distance] → Label straight-line-to-area and loaded-world coverage; no accessibility or route guarantee.
- [Many unavailable rows distract from useful choices] → Available-first sections and clear status labels, with unavailable rewards suppressed by the shared summary. No speculative reward-based ranking.
- [Device movement or world polling reorders a visible list] → Stable kind/id keys, preserve the list instance and filter during refresh, re-resolve selection, and avoid resetting scroll to the top on each update.
- [Idle last-known location is often stale] → Browse by name with an explicit explanation; do not introduce a watch or repurpose the map centre as the player.
- [HUD crowding on folded phones] → Measured bounded list and mutually exclusive cards; owner narrow/wide phone acceptance remains a separate task.

## Migration Plan

No backend deployment or data migration. Once approved, implement on a separate feature branch based on the landed PR #25, or explicitly record a stacked dependency if it remains open. Rollback removes the sheet/selector and retains the existing focus feature. No field-world or historical contact data is rewritten.

## Implementation evidence

- Shared selector and destination tests: `npx vitest run apps/mobile/src/components/destination-focus.test.ts apps/mobile/src/components/nearby-destinations.test.ts` passed (16 tests). Indexed list summaries are compared with single-target summaries; tests cover clock/offer isolation, raw-distance ties, world expiry and vanished-target selection.
- `npm run typecheck --workspace @sporeward/mobile` passed. `npx expo export --platform android --output-dir /tmp/sporeward-nearby-destinations --max-workers 2` passed from the mobile workspace (1422 modules). No native APK, emulator or phone test was run.
- Source integration check: only the live map receives sheet enablement, update status and identity reset key. Rows re-resolve received world state before opening details; the handler has no camera, recorder or pin mutation. Pin/replace remains the existing explicit details action. The sheet, compact card and details are mutually exclusive. The sheet's Back listener consumes Back while open; leaving the map unmounts it. App account/server/replay/world resets dismiss it through the reset key, with world identity additionally guarded in the map.
- The sheet bounds stop above the recording HUD; optional map controls hide while browsing and return on dismissal. List data is memoized independently of viewport events and rendered virtually. No extra network poll or GPS watch was added. These source checks do not establish actual narrow/wide phone layout or gesture acceptance.
- Player guidance and 20 local Markdown links were checked. Strict change validation and `git diff --check` passed. Independent read-only implementation review approved the slice with no blocking findings; that review did not run tests or launch an emulator. Owner narrow/wide phone layout and interaction acceptance remains open in task 3.2.

## Handoff

Owner: root session in `/Users/red/Koodit/sporeward`, branch `feat/nearby-destinations-sheet`, based on `ac7f331` from open PR #25 (stacked dependency; origin/main does not yet contain destination focus). The owner approved this plan and requested apply on 24 October 2026. Implementation is delivered and independently reviewed: tasks 1.1, 2.1, 2.2 and 3.1 are complete; task 3.2 remains open for owner phone acceptance. Prior phone gates remain with their changes.

Disposition: publish this change's implementation and planning files in a PR from `feat/nearby-destinations-sheet` targeting main, as requested by the owner on 24 October 2026. PR #25 is still open and must land first; the branch includes its existing `ac7f331` dependency. Keep the new PR unmerged for owner review. Phone layout/interaction acceptance in task 3.2 is explicitly deferred; do not sync or archive before that gate passes. Main does not yet contain this feature. The unrelated investor PNG/prompt are preserved locally and excluded. Next action: owner review of the dependent PRs, phone acceptance when convenient, and further feature planning independently.
