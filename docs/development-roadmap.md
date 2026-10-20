# Sporeward — Development roadmap

## MVP goal

A player can complete a real outdoor activity in Tampere, contribute to a persistent shared outbreak world, and understand the points and cleaning they earned. Multiple players can cooperate and compete under the same rules. Participation supports both Sporeward recordings and eligible Strava activities.

The browser supports map exploration, planning, rankings, and activity review. Browser recording is a foreground-only option requiring a visible page and an awake screen. Native mobile recording is the intended path for screen-off and background activity; its reliability must be demonstrated on real devices.

This roadmap defines outcome gates, not dates. The selected stack and code responsibilities are recorded in [Architecture](architecture.md), with local setup in [Development setup](development-setup.md). The interactive cleaning experiment runs the extracted shared TypeScript engine. It remains a minute-resolution balancing prototype, not the completed authoritative world engine or playable MVP.

## Platform rollout

Android is the first native platform. Initial recording experiments and field tests use the project owner's two available Android phones:

| Device | Android version |
|---|---|
| Samsung Galaxy Z Fold5 | Android 16 (user-reported) |
| Motorola Razr Fold 5G (user-provided name; exact model identifier to confirm) | Android 16 baseline; installed version may have changed and should be checked before testing |

Validate recording on both devices, including screen-off/background operation, battery-management interruptions, and folded/unfolded transitions. Android 16 is the initial test baseline. Record actual installed versions and the Motorola model identifier when testing begins; this information does not block engine development or initial planning. The reported Motorola update commitment is not used as a verified compatibility assumption.

iOS development and validation follow after Android reaches a suitable level of maturity and an external iOS tester is available. The exact handoff milestone remains open. Initial native MVP acceptance applies to Android; iOS support is not implied by passing Android tests. The mobile browser remains part of the initial product scope.

## Current implementation

The Android recorder persists fixes and route sections in SQLite, shows a MapLibre route map and recap, and can build an APK with bundled JavaScript for independent field testing. The app includes secure tester credentials, an HTTPS connection check, and explicit uploads of finished recordings to persistent test-server storage. Background GPS reliability remains a real-device acceptance gate.

`packages/game` now contains the deterministic cleaning simulation used by the interactive planning lab. Tests cover cooldowns, repeat scoring/cleaning, two-phase decay, finishing/group/protection awards, growth, disintegration/remnants, and split conservation/stabilization. The [first outbreak encounter](first-outbreak-encounter.md) connects validated GPS contacts to fixed Tampere footprints, persistent cleaning/scoring, activity markers and confirmed recaps. Automatic geographic growth, full historical lifecycle processing, accounts and Strava reconciliation remain outstanding.

## 1. Reliable game engine

**Goal:** implement the agreed rules independently of map rendering and recording clients.

Acceptance criteria:

- Timestamped, validated visits produce deterministic points, cooldowns, cleaning, and lifecycle events with a seeded random source for splitting.
- Six-hour eligibility and 100/75/60/50% repeat cleaning are covered by automated scenarios, alongside constant-strength comparison for balancing.
- Tests cover phased decay, paused growth, non-overlap, splits and inherited state, stabilization, disintegration, remnants, extensions, and both cleanup bonus windows.
- Historical contacts and overlapping activity sources preserve unique contributions without duplicate points or treatment; late awards do not revoke prior awards.
- Balancing values are centralized and adjustable. The lifecycle clock and remaining-visit estimates have explicit, tested definitions.
- The existing solo-route, group-cleanup, and split scenarios become repeatable automated checks using the engine, with additional race and boundary cases.

**Parallel feasibility gate:** test a minimal native recorder on the intended first mobile platform. Measure timestamp/accuracy quality, screen-off and background continuity, pause/resume, offline persistence, permission loss, interruptions, and battery use. Verify foreground browser recording and wake-lock loss as well. Choose the initial platform and recording architecture from the results.

## 2. Persistent Tampere world

**Goal:** expose a server-owned outbreak world through a responsive map.

Acceptance criteria:

- Spawn five-cell, publicly reachable outbreaks using level-17 cells and accessibility-based effort, with the agreed density and replacement delays.
- Persist outbreak identity, geometry, treatment, deadlines, and histories across server restarts. Reconcile elapsed time without applying events twice.
- The mobile browser shows organic shapes, difficulty after committed treatment, clearing, cracks, stabilization, and disintegration countdowns.
- Keep adjacent outbreaks distinct and non-overlapping. Shrinkage and split descendants remain reachable.
- Retain enough historical world state for contact matching within the import window; retention needs are separate from public replay.
- Validate rendering, contact boundaries, and placement against actual Tampere routes.

## 3. Real activity recording

**Goal:** complete an end-to-end outing on a phone.

Acceptance criteria:

- Native Start/Pause/Resume/Stop works under the background-recording conditions validated in stage 1. Foreground browser recording communicates its limits clearly.
- Persist activities locally, recover active recordings on reopening, preserve explicit pauses, and never interpolate across interruptions or pause gaps.
- Validate 500-metre minimum distance, timestamped contacts, 10-metre tolerance, and two-second interpolation limits with real recordings.
- Offline contact feedback and points are provisional until server validation. Reconnection and upload retries do not duplicate contributions.
- Live points, visited-this-activity markers, eligibility, pending bonuses, and the final recap agree with server results.
- Pause stops recording and location sharing; the 24-hour recording safeguard requires explicit continuation.

## 4. Shared play

**Goal:** validate cooperation, competition, and location privacy between real players.

Acceptance criteria:

- Accounts identify participants and keep personal history, recordings, and settings separate.
- Simultaneous visits and delayed cleanup award finishing, group-window, and protection-window points correctly.
- Support sharing with everyone nearby, friends only, or nobody. The selected setting is clearly communicated during recording.
- Nearby visibility, stale-location removal, and private protection areas are enforced before data reaches other players.
- Hidden contributions use anonymous support visuals without revealing their rider, route, or protected locations.
- Conduct a small group ride and verify each participant's points and recap against the shared event history.

## 5. Strava and rankings

**Goal:** support participation without recording every outing in Sporeward.

Acceptance criteria:

- Connect Strava and validate actual integration access, available activity data, timestamps, and delivery behaviour before promising import support.
- Apply the 24-hour eligibility rule, including pre-signup activities, and match historical contacts to outbreaks at the recorded time.
- Start imported cleaning in the present through support squads; allocate it to surviving split descendants and never unrelated replacements.
- Reconcile partial and overlapping native/Strava activities by contact, not by discarding an entire recording.
- Monthly, yearly, and all-time global/country rankings use contact location and local calendar time. Define settlement of late and delayed awards.
- Retries, duplicate notifications, delayed delivery, and disconnect/reconnect do not create duplicate rewards.

## 6. Field-test and balance

**Goal:** determine whether Sporeward encourages another outing and offers useful route choices.

Acceptance criteria:

- Solo and group testers complete real Tampere outings, including ordinary routes and optional detours.
- Test dense and sparse route areas, repeat visits, imported recordings, poor GPS, offline periods, and interruption recovery.
- Players can explain earned versus potential points, reduced repeat cleaning, finishing competition, cracks, and remnants from the interface.
- Observe route choice, repeat participation, battery consumption, recording gaps, and score disputes; document findings and adjust configurable values.
- Resolve issues that prevent reliable recording, understandable rewards, or private location handling before accepting the MVP.

## Deferred features

- Android Back navigation returns through screens to the start screen. Back there opens an exit confirmation; pressing Back again exits. Cancel or tapping outside the dialog keeps the app open.

- Group multiple source recordings into one outing, with combined and separate track views.
- Opt-in, link-free Strava activity text showing earned Sporeward points.
- External route-planner browser extension.
- Public world-state replay for a selected area over the past 24 hours.
- Personal activity replay beyond the essential activity summary and recorded route.
- Special trail outbreaks, varied spawn sizes, and additional mode-specific mechanics.
- Administrative-region rankings and additional leaderboard filters.

These remain concept ideas; they are not acceptance requirements for the first MVP.

## Immediate next work

1. Complete field checks on the standalone Android recorder: screen-off GPS, pause/resume, recovery, fold transitions, battery use, and cellular HTTPS access. Initial recorder/engine extraction and server connectivity are implemented; real-device reliability remains unproven.
2. Exercise explicit activity uploads, idempotent retries, persistent server receipts, and basic distance/time eligibility with real outings. The fixed encounter slice awards points for eligible contacts; ineligible recordings remain diagnostics.
3. Extend the fixed encounter slice to automatic accessible spawning, geographic growth and historical boundary changes, with PostgreSQL/PostGIS persistence. Replace remaining minute-resolution prototype assumptions where authoritative processing needs greater precision.
4. Add account-backed shared play and full out-of-order Strava reconciliation, building on the encounter slice’s persistent contributions and retry safety.


Rules and balancing references: [Working game concept](game-concept.md) and [Player rules](player-rules.md).

## Recording constraints: sources

The Screen Wake Lock API can prevent screen dimming while a document is active, but acquired locks are released when the document becomes inactive. It is not a background-recording guarantee. See [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

Native recording still requires platform-specific permissions and lifecycle handling. See [Apple: Handling location updates in the background](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background) and [Android: Location foreground service requirements](https://developer.android.com/develop/background-work/services/fgs/service-types#location).
