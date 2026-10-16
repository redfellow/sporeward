# Current goal — Living Tampere simulation and tester experience

Status: active, resumed 15 October 2026. Started 14 October 2026.

## Outcome

Build a reusable simulation tool that produces a living Tampere test world, then provide a rudimentary Android interface and individual accounts suitable for a small tester group. The interface must express the soul of Sporeward: exploring familiar routes, choosing detours, pushing back fluid outbreaks together, and earning understandable points. It may be bare bones, but should feel like an early game rather than a diagnostics screen.

This file is the editable scope for the active development goal. Re-read it when continuing work and before completing the goal. User edits change the remaining scope; preserve them and keep the completion checklist aligned. Completed items and implementation evidence are archived in [Finished goals](finished-goals.md). Only remaining work is listed here. The detailed game rules remain in [Game concept](game-concept.md), with the broader progression in [Development roadmap](development-roadmap.md).

## Development approach

Routine progress must not require outdoor outings. Use recorded tracks, synthetic variations and Android emulator GPS replay during implementation. Real personal outings and later small-group outings are milestone checks after substantial playable functionality is ready, not gates between ordinary changes.

Build a useful flow before broad verification. Use targeted checks to resolve specific failures and important rule boundaries. Run the full suite when an assembled stage is ready, rather than after each small edit. Keep normal-speed recorder checks separate from accelerated game-clock simulations: accelerated tests cannot establish real battery usage or screen-off reliability.

## Stage 1 — Replay tool and living world

- [ ] Provide reusable scenario controls for load, start, pause, resume, reset and replay. Make reset restore the same world seed, players and clock, with a clear result summary. Provide a convenient scenario runner rather than a collection of one-off temporary commands.
- [ ] Ignore original calendar dates for scenario eligibility: rebase relative recording times onto the selected simulation start. Use a fixed, configurable virtual baseline for repeatable server scenarios, with advance/fast-forward controls. Native recording replay uses today's wall clock. End-of-day/month-boundary scenarios are deliberate cases, not the default for every test. Future virtual events execute only when the test clock reaches them.
- [ ] Support several simulated players and scheduled/delayed uploads. Cover repeat contacts, six-hour cooldowns, phased cleaning, group/finishing bonuses, duplicate retries and overlapping sources. Include good GPS and degraded/paused recordings.
- [ ] Implement actual geographic growth and non-uniform withering, readable difficulty after committed cleaning, cleared states and replacement scheduling. Neighbours remain distinct and non-overlapping, growing around occupied areas. A long-running scenario must remain playable instead of exhausting the initial five fixtures.
- [ ] Use PostgreSQL/PostGIS for persistent world geometry, contributions and enough historical state for the 24-hour matching window. Apply the agreed lifecycle clock and disintegration/remnant rules; preserve contribution and bonus identity across changes and restarts. Existing field recordings must survive migration.
- [ ] Demonstrate repeatable scenarios that change the living world through recorded outings and time advancement. A reset and re-run must reproduce the same outcomes for the same inputs and seed.

Strategic corridor splitting can follow this goal; spontaneous splitting remains disabled initially. Do not introduce different initial spawn sizes or change agreed scoring merely to simplify the implementation. Provisional balancing values remain configurable.

## Stage 2 — Fullscreen Android game experience

- [ ] Keep Start/Pause/Resume/Finish readily accessible, preserve the persistent notification controls, and maintain recorded data across interruption/reopening.
- [ ] Provide clear follow/explore controls, including north-up following and direction-of-travel following where meaningful, plus recenter and route/world overview. Browsing the map must not silently leave the tester fighting automatic camera movements.
- [ ] Render varied, organic outbreak shapes and recognizable growing, withering, clearing and cleared feedback. Show difficulty, available visit points, the locked bonus and activity-specific visit markers. Use symbols/labels as well as colour for eligibility and visited state.
- [ ] Give clear contact/score feedback and distinguish provisional, confirmed and possible future bonus points. Provide a concise, game-facing finished-outing recap.
- [ ] Carry a coherent visual identity through the map, overlays and recap: spores/overgrowth, fluid motion and satisfying cleanup feedback, with readable controls outdoors. Artwork remains a direction, not a small fixed set of outbreak silhouettes.
- [ ] Retain cached-world/offline recording and understandable reconnect/upload behavior. Check folded/unfolded layouts in the emulator and build a standalone Android APK for later real testing.

## Stage 3 — Tester accounts and group readiness

- [ ] Replace the shared gameplay identity with individual tester accounts. Provide a simple provisioning/onboarding path, sign-in/sign-out and persistent sessions; an invite/manual provisioning flow is sufficient for this stage.
- [ ] Keep recordings, contributions, cooldowns and scores owned by the authenticated tester. Account switching and replay resets must not merge players or duplicate awards. Preserve the existing owner's data through an explicit migration.
- [ ] Keep the development gateway credentials separate from player identity. Validate server authorization and secure local session storage; do not embed real credentials in the APK or repository.
- [ ] Exercise cooperation and finishing competition using several simulated accounts, including delayed uploads and retries. Provide a repeatable group scenario and practical setup instructions for the later human tester group.

Live sharing of players' precise locations is outside this goal; accounts and shared contributions are enough to prepare group testing. If location sharing is added to scope later, protection areas and sharing permissions must be implemented before exposing locations to other players. Full monthly/yearly/global/country rankings, Strava OAuth/live integration, iOS and public world replay remain later goals.

## Remaining integration and verification

Existing replay, spatial persistence, account and UI implementations provide the foundation; their completed evidence is archived separately. Finish these integrations before checking off the broader requirements above:

- Verify scenario controls, virtual-clock boundaries, changing historical geometry and delayed-treatment/finishing-order semantics together. Include the native warm-up and explicit debug-upload safeguards in the assembled replay flow; short-run evidence is archived.
- Verify the assembled Android recording, notification/recovery, follow/explore controls, lifecycle visuals and provisional/confirmed/group/pending-bonus recap branches. Finish responsive folded/unfolded layouts and validate interactive onboarding, account switching and session restoration.
- Complete the live field PostgreSQL/PostGIS and owner migration using a fresh backup that includes the uploaded 55 km outing. Preserve recordings, contribution identities, cooldowns and rewards; isolated preview imports do not constitute field cutover.
- Deploy the requested urban field coverage across Tampere, eastern Nokia, southern Ylöjärvi, western Kangasala and northern Lempäälä. Regional road data and the additive expansion tool are prepared, but expansion is not deployed. Keep the deterministic 5 × 5 km simulation baseline separate.
- Run the assembled checks and produce the standalone Android build, setup instructions and later field-test checklist once the remaining functionality is ready.

## Completion evidence

- [ ] The replay tool is documented and runnable against the private export without committing its tracks or altering the shared field world with synthetic contributions.
- [ ] A repeated scenario yields a populated, changing Tampere world and the same expected contacts, cleaning and rewards after reset. A persisted world resumes correctly after restart.
- [ ] Historical matching and delayed treatment work against changing geometry; pauses/gaps and duplicate sources retain the agreed validation and scoring rules.
- [ ] The actual Android emulator recorder, fullscreen map and recap work together against the isolated API; accelerated engine scenarios are clearly identified separately.
- [ ] Independent tester accounts cooperate/compete without sharing ownership, and the test group has a usable onboarding and recording flow.
- [ ] The full assembled checks pass, the standalone Android build is ready, and implemented limitations plus the next personal/group field-test checklist are recorded.

Do not mark this goal complete simply because one stage or the development infrastructure is finished. Real outdoor and human group testing follow this implementation milestone and are not required to finish the development goal.
