# Finished goals and implementation evidence

## Field Labs and Outbreak Resistance desktop study — completed 21 October 2026

Owner-approved survey stations have luminous available samples and empty, subdued personal collection states. A combined Tampere map uses the accepted Richer outbreaks and a fixed 227° resistance field below roads and outbreaks, with readable extent contours. Two-player collection, resistance/recovery controls, Night/Bright themes and reduced motion were reviewed; web typecheck and strict spec validation passed. All 7 tasks are complete.

[Archived change](../openspec/changes/archive/2026-10-21-explore-field-labs-and-outbreak-resistance/proposal.md) · [Review and validation](../openspec/changes/archive/2026-10-21-explore-field-labs-and-outbreak-resistance/tasks.md). The main specs baseline only the desktop guide; authoritative gameplay, Android adoption and deployment remain separate.

## Visual guide, map alignment and shoreline delivery — completed steps, 21 October 2026

The owner accepted the visual guide at `/rendering/palettes`, including the latest narrow crack gap and jagged zipper split. Ember & violet is locked: warm effort colours, violet remnants and pale clearing. The guide has centered state badges, concise per-card explanations, growth transitions and separate personal map markers. Cooldown uses a muted appearance; contact this outing adds a green border/check. It omits development-only area multipliers and split-category calculations.

Accepted rendering includes layered translucent membranes, refined inner rims, slow withering tremble, slower irregular disintegration membranes over fine tapered branching lightning, and two complementary irregular splitting halves. Detailed size/effort and split-category decisions remain in [Game concept](game-concept.md); the concise rules remain in [Player rules](player-rules.md).

The accepted visual guide is saved in commit `754a5c1`, superseding the earlier rollback checkpoint `ce34675`. Restore this newer reference when the owner asks to go back.

Map-native MapLibre ImageSources and body/rim/state layers fixed camera alignment; the owner explicitly accepted Fold5 panning. Cached poses crossfade through an eight-second loop, with persistent Night/Bright preferences. The corrected emulator shoreline containment at Hatanpää/Viinikanlahti was explicitly accepted. The parser fix for the 2,108-outbreak response (previous cap 1,000; now 10,000 with a 1,000,000-vertex budget) passed eight focused encounter/parser checks and mobile/server types.

The private field backup is in ignored `work/field-backups/2026-10-21-shoreline/`. Shoreline preparation took 2.26 seconds (391 boundaries changed, 10 relocated). Contour version 5 was deployed; container health, authenticated HTTPS health and preserved score/contribution/bonus/activity fingerprints were verified. Historical contact boundaries remain versioned. The corrected ARM64 release was installed on Fold5 after confirming no active recording; SHA-256 `6f6e48bd7b70fbf97f42d44e1d657707cde9f50e3119a7520c0046ab572e5264`. Final phone visual acceptance remains open, as recorded in the current goal.

The emulator's read-only anonymized field-geometry viewer runs on host port 3112, with device port 3102 reversed to it. Its full-world response took 485 ms, avoiding a remote replay-database round trip of 10.5 seconds. Native geometry is bounded to a padded viewport; gameplay retains the full world. Restore device port 3102 to the normal replay API before recording scenarios. See [Rendering evidence](native-richer-rendering.md), [Field migration](field-migration.md) and [Replay tool](replay-tool.md).

## Native outbreak visuals and map polish — completed 20 October 2026

The accepted wet material and continuous splash generator are shared across browser, native map and authoritative server outlines. The app caches geographic Skia rasters, pauses generation in the background, preserves polygon hit targets, and shows aligned compass/centering controls with a compact idle start button. Emulator inspection covered multiple zooms, lifecycle colours, polygon selection and map controls.

The field API was backed up and migrated to contour version 4 with 620 offline-precomputed bases. Historical footprint intervals remain archived; authenticated health and account world parsing pass. Persisted bases avoid repeating expensive shape sampling during ordinary resizing or restart. [Implementation, cost measurements and screenshots](native-outbreak-rendering.md).

The standalone Android release build and packaged-permission check pass. Installed in place on the connected Fold5 after verifying no app service was active; app data was retained. The owner can review the updated live map. Back navigation and exit confirmation are recorded separately as later UI work.

Completed scope and supporting evidence moved from [Current goal](current-goal.md). The overall living Tampere goal remains active; historical notes below include limitations as recorded at the time. The current goal file defines the remaining work.

## Living Tampere simulation and tester experience — completed items

- [x] Catalogue and select GPS-bearing recordings from a user-supplied Strava export. Support original FIT/FIT.gz, GPX/GPX.gz and TCX/TCX.gz, plus the recent private Sporeward recordings. Read only relevant activity data; retain raw recordings outside version control. Exclude derived/interpolated tracks from baseline evidence.
- [x] Normalize timestamped fixes, recording segments and available pause events. Preserve original time intervals, pauses and missing GPS coverage; do not silently interpolate across gaps forbidden by the game rules.
- [x] Replay positions through the Android emulator's real recorder at normal speed. The default target is the emulator, with an isolated API and disposable test identities. Provide accelerated gameplay replay separately, with explicit timing semantics.
- [x] Generate accessible, varied five-cell outbreaks in a bounded 5 × 5 km Tampere test area, aiming for the agreed provisional 15–25 ordinary outbreaks. Placement primarily follows public map accessibility, independent of recent player activity.
- [x] Make the map the fullscreen primary view, with compact overlays for recording state, elapsed time/distance, current activity points and nearby outbreak information. Put technical diagnostics in a secondary view.
- [x] Give testers recognizable names and a simple test-world score comparison, with shared outbreak state and individual activity recaps.

## Implementation evidence — 15 October 2026

The original-track importer and timestamp normalization are implemented. Reusable virtual-clock scenarios exercise multiple players, delayed uploads, retries, overlapping sources and reset, with deterministic contribution identities and summaries. The Android app now defaults to a fullscreen map with recording/score overlays; setup, upload and diagnostics remain in a secondary screen. North-up/travel-up follow controls and gesture-driven explore mode are implemented; their recording interaction and responsive layouts still need emulator checks. Outbreak labels and tap details are verified in the emulator; richer lifecycle motion remains unfinished. A concise game-facing recap is implemented and its provisional/upload screen is verified in the emulator; confirmed/group/pending bonus branches still need an assembled recording check. A dedicated loopback replay API and development-only emulator recorder bridge are implemented and documented in [Replay tool](replay-tool.md).

The isolated native replay API now uses 20 varied five-cell outbreaks generated from a fixed public Tampere access snapshot. A PostGIS adapter persists world state, footprint intervals, contributions and bonus ownership transactionally; generated-world restart, rollback and reset checks pass. See [Spatial test world](spatial-test-world.md). The new `living-tampere` accelerated scenario uses the geographic world and reproduces group cleanup plus replacement after reset. Earlier rule-isolation scenarios retain fixed fixtures. The isolated native API now enables the same geographic lifecycle. Continuous contour motion, historical treatment after retirement, field-data migration, fullscreen game UI and individual tester accounts remain required before this goal is complete. Keep the checklist as the completion contract rather than treating this infrastructure milestone as the finished goal.

Tester account persistence is now implemented with single-use expiring invites, password verification, hashed persistent session tokens, logout and expiry. A disposable PostgreSQL check verifies those behaviors, session restoration and separation between account realms. Account-enabled HTTP routes now require a player session separately from the gateway, resolve world/scoring identity from that session and use per-player upload storage. A focused API check verifies that gateway access alone cannot enter gameplay, identical outing IDs stay separate across players, and logout does not affect another player. Android now has sign-in/invite/sign-out controls, endpoint-scoped SecureStore sessions and session-bearing world/upload requests; map caches use player identity. These controls are disabled during an active outing. Enabling accounts in the replay runtime, Local outings now retain recording ownership, filter history by account and reject cross-account upload; expired sessions preserve offline recording identity. Identity switching clears visible outing/map/recap state and invalidates in-flight responses. Existing unassigned recordings remain untouched pending explicit migration. The PostGIS replay runtime now requires player sessions and provides privately saved invites. Real HTTP registration/login/world access passes against a disposable account; gateway access alone is rejected. The native replay tool now bootstraps a disposable account privately and has completed a faithful 120-second recorder/upload run: 102 fixes, 641 m, maximum GPS gap 1.875 s, maximum scheduler lateness 1 ms and 100 confirmed points under the expected tester identity. Interactive emulator form entry remains unresolved and is not claimed as verified. A five-account HTTP/PostGIS scenario verifies shared cleanup, a 30-minute delayed upload, duplicate retries, same-ID isolation and named scores of 200 per rider. The Android named score view is implemented and verified in the emulator with the expected tester name, current-player marker and 100 confirmed points. Administrator-bound legacy-owner invitations preserve canonical gameplay identity; the real PostgreSQL/HTTP owner-link check verifies old upload access, unchanged contribution IDs/cooldowns/rewards and rejection of client-selected claims. Explicit local transfer preserves GPS and receipts and is tested. Both real field recordings are backed up privately and resolve to the preserved owner. The exact world snapshot imports idempotently into an isolated PostGIS namespace; a derived spatial preview reaches 20 outbreaks while retaining the five original outbreak identities, contribution ID and unchanged scores. Live field cutover and the full interactive onboarding/switching flow remain unfinished.

## Field work — 15 October 2026

While the larger goal is paused, the owner requested an updated standalone Fold5 build and urban field coverage across Tampere, eastern Nokia, southern Ylöjärvi, western Kangasala and northern Lempäälä. Keep the deterministic 5 × 5 km simulation baseline separate. The fullscreen APK was installed, but the regional expansion was interrupted before deployment; existing field data remains intact. Public regional road data and an additive expansion tool are prepared locally. The 55 km cycling outing was subsequently uploaded successfully.

Finish now queues automatic score confirmation, including notification Finish; pending uploads retry while the app is open or on reopening. The rebuilt APK was installed as an update on the Fold5 after the owner confirmed recording was finished and saved. The larger goal was subsequently resumed through its continuation request.

## Replay and geographic lifecycle evidence — 15 October 2026

All 960 candidate-mode originals in the private export have been GPS-inspected with the actual replay normalizer: 505 are replay-ready, 221 have no usable timestamped GPS, and 234 are excluded pending investigation (233 duplicate/out-of-order timelines and one malformed XML recording). Resumable catalogue checkpoints use source-content hashes; selection can filter by coverage bounds without printing coordinates. Four Python checks cover compressed originals, no-GPS versus invalid timing, CSV privacy/path boundaries and private atomic checkpoints.

The catalogue-selected `cycling-cooperation` scenario preserves seven source sections and a one-second maximum within-section gap. Five riders, a 30-minute delayed upload and duplicate retries yield 200 points each; reset and rerun produce identical complete results and restore a 20-outbreak world. Source tracks remain ignored.

World responses and map details now distinguish bonus-only one-touch remnants, disintegration warnings/deadlines and stabilization eligibility. Player-facing visit points match the engine during cleanup protection, and configured cooldowns are respected. Focused view/persistence checks pass; visual emulator verification of these lifecycle variants and fluid contour motion remain unfinished.

The isolated 14-day geographic lifecycle run maintained 20–100 visible targets and exercised repeated natural disintegration, remnants and ordinary replacements, with no shared live/protected cells. Continuous polygon overlap remains unverified. Historical uploads to naturally retired parents now retain eligible visit points without falsely earning a player-cleanup bonus or affecting replacements; an end-to-end persisted-world check verifies idempotence and unchanged retired treatments/rewards.

Fractional procedural contours now make growth/withering advance in 1/32-cell steps with stable branch selection and a connected core. Protected footprints remain reserved, and PostGIS verified 1,800 growing/shrinking polygons across ten seeds without invalid rings or overlaps above 0.01 m². A generated interactive contour preview is visually checked in the browser. Changed history rows are batched incrementally; database restart/rollback/reset checks pass. The mobile map has a foreground-only breathing opacity pulse, with in-app lifecycle verification still required.

## Native replay integration — 15 October 2026

An Android 16 emulator replay completed after noninteractive GPS warm-up: 20 seconds, 14 fixes, 72 metres, maximum GPS gap 1.545 seconds and scheduler lateness 18 ms. It was not uploaded. This verifies removal of the stale California starting fix in that run, not minimum-distance eligibility or outdoor reliability. Ten focused recorder checks cover notification/recovery controls, warm-up options/timeout/development guards and explicit replay versus automatic user Finish uploads.

A subsequent 200-second Android 16 replay completed with 170 fixes, 941 metres, maximum GPS gap 1.993 seconds and maximum scheduler lateness 51 ms. Explicit upload confirmed 100 visit points under the isolated tester account. The actual narrow-screen recap displayed 100 confirmed points, 0.94 km, one helped outbreak and uploaded status. Explore/recenter, north/travel orientation and outbreak overview controls were exercised during recording; narrow and wide active-recording layouts were visually checked. HUD overlays now respect system safe areas and use a compact title/menu/distance layout on narrow screens. Nine storage checks also verify that debug Finish leaves no automatic-upload outbox entry. Full recovery/offline/group/pending-bonus integration gates remain open.

## Account recovery integration — 15 October 2026

The Android 16 UI signed out of the fold-layout tester and signed into a different disposable account using the real username/password form. The authenticated identity changed, the form closed with Signed in status, and the previous tester's 0.94 km outing was absent from the new account view. Expired sessions now retain the visible account name and offer sign-in again; owned pending uploads report that sign-in is needed instead of issuing an unauthenticated upload. Confirmed local receipts remain readable after expiry. Twelve focused session/upload checks pass. Live owner migration and the full offline/recovery integration remain separate completion requirements.

An emulator-only forced stop preserved the active recording and authenticated owner. Reopening recovered it with a second section and resumed fixes; it was explicitly saved with 55 fixes and no receipt/upload. The initial development-client reconnect exceeded the old replay command timeout, so it is not claimed as a faithful 45-second replay. The runner now explicitly opens its loopback Metro development URL and redelivers an idempotent request for up to 60 seconds. A subsequent replay from a stopped app finished normally: 20 seconds, 16 fixes, 71 metres, maximum GPS gap 1.592 seconds and scheduler lateness 8 ms, without upload. Two bridge checks verify repeated reset commands cannot apply twice, including rejected environments and redelivery after another completed command. Main-map status now exposes offline/reconnect/sign-in errors while keeping cached geometry visible.

The actual Android map showed the offline message while retaining 20 cached outbreaks during a deliberate timeout of the isolated loopback API. The replay server was resumed afterward. Removing ADB reverse forwarding alone did not break existing keep-alive connections and was not counted as offline evidence.

## Historical scoring integration — 15 October 2026

Reproduced and fixed two ordering failures: post-cleanup protection arrivals incorrectly displaced the pre-destruction finishing group, and later uploaded visits blocked independent older visits beyond the six-hour cooldown. Historical visits now use preceding known visit history for diminished points/cleaning and preserve the latest cooldown timestamp. Pre-cleanup historical repeats retain their diminished X rather than receiving the later protection-window value; they add no treatment to an already cleared target. Late evidence adds eligible group awards without revoking existing bonuses. Persisted pipeline checks cover late group awards after protection arrivals, retries and restart. An exact six-hour timestamp boundary exposed minute-unit floating-point error; cooldown calculations now resolve at millisecond precision. Twenty-three focused engine/persistent-world checks pass, and the generated planning lab was rebuilt and checked against the updated shared engine.

After these changes, the private recorded `cycling-cooperation` scenario was run, reset and rerun. Complete result objects remained equal: five riders each received 200 points and the world retained 20 outbreaks. Shared-engine and server typechecks pass. These checks do not replace the remaining changing-geometry integration and live field-migration requirements.

## Lifecycle UI presentation — 16 October 2026

The Android map now uses remaining-visit difficulty shades after committed cleaning, with separate clearing/remnant/disintegration/eligibility colours and explicit lifecycle labels. Header and map-control measurements determine detail positioning and camera padding, including wrapped narrow-screen controls. The Android 16 overview and clearing detail card were visually checked against the isolated PostGIS world; the card showed available visit points, locked bonus and sufficient committed cleaning. A source-free fixture supplies ordinary light/heavy effort, protected cleanup, withering, clearing, remnant, disintegration and stabilization examples. It is repeatable, passes protocol validation, can export offline, and can replace only the authenticated disposable native replay world. The focused fixture check and mobile/server typechecks pass. This presentation is not GPS or scoring evidence; continuous cleanup animation and the remaining assembled UI gates still need completion.

## Android safe-area and attribution repair — 16 October 2026

The owner reported top/bottom clipping and attribution floating above the activity panel in the earlier field APK. The app now keeps one safe-area provider with initial window metrics across screens, positions overlays inside the inset map area, and renders linked map credits in a normal-layout footer above the system navigation area. Removed the duplicate floating attribution overlay/native control. Cold-launch narrow and unfolded Android 16 emulator views were visually checked. Mobile typecheck, standalone release build and packaged-permission check pass. The APK was installed in place on the connected Fold5 after confirming no Sporeward app service was running; no app data was cleared. Full UI design remains a later stage.

## Field account and regional cutover — 16 October 2026

- Took a final quiesced private backup containing four uploaded recording receipts and three processed activities, including the latest outing. Preserved the original image, compose configuration and activity volume.
- Activated the PostgreSQL/PostGIS field world and private owner account, bound to the original canonical player. Compared the live database with the final backup: scores, contributions and processed activity records matched exactly.
- Verified public HTTPS health, account login/logout and a 500-outbreak urban world response. Expanded road-access coverage is deployed separately from the deterministic simulation baseline.
- Credentials remain in an ignored mode-600 private file. Explicit phone-local history linking still requires the owner's confirmation in the app.

## Repeat verification command — 16 October 2026

`npm run replay -- scripts/replay/scenarios/cycling-cooperation.json --verify-repeat` passed against the private normalized cycling recording. Complete result objects matched after reset, including world, virtual clock, player scores and contributions. Five riders earned 200 points each and replacement restored 20 outbreaks. Focused scenario, lifecycle-presentation and historical-geometry checks also passed (four tests). These are accelerated server checks, separate from native GPS replay.

## Tester layout and cleanup transition — 16 October 2026

- Refreshed standalone release build passed, with packaged Android permissions validated.
- Recovered the Android 16 Fold emulator after a System UI cold-start hang. Restored the dropped private PostgreSQL replay tunnel; the local map resumed receiving world updates.
- Inspected the narrow 884 × 2208 layout with lifecycle labels and the wide 1768 × 2208 layout: header, controls, bottom card and attribution remain within the system bars.
- Added an isolated near-complete cleaning fixture. The real server tick cleared it and the native cleanup component received the transition and set its notice text. The timed UI-automation observer missed the brief visible notice, so this is integration-state evidence rather than a captured animation. Cleanup notices now remove their content after the animation, including from accessibility traversal.

## Durable activity contact feedback — 16 October 2026

Local observed contacts now persist by outing in SQLite, retaining the first timestamp and provisional visit value when contours move or the world goes offline. They never replace server validation or become submitted rewards. Per-outing storage prevents carrying markers into another outing. The recording HUD explains held potential points before the 500 m coverage threshold.

Focused contact/storage checks passed (16 tests), with mobile typecheck. A synthetic native emulator replay completed with 24 fixes, 29 m covered, one recording section, maximum GPS gap 1.951 s and maximum injection lateness 2 ms. During recording, the actual UI displayed the turquoise touched outbreak and the 100-point eligibility message. It was not uploaded; it is a short HUD check, not evidence of scoring eligibility, battery usage or outdoor reliability.

After force-stopping and reopening the finished emulator outing, native component state restored its one persisted contact. The short-outing recap also explains the 500 m eligible-coverage requirement; mobile typecheck passes.

## Assembled check and owner onboarding — 16 October 2026

- `npm run check` passed all workspace typechecks, 118 tests across 29 files and the shared-engine lab consistency check.
- Disposable PostGIS checks passed adapter restart/rollback, valid geometry and isolated reset; five-account delayed upload/retry/group bonus checks produced 200 points per account. Owner-link checks preserved readable legacy uploads, contribution and cooldown identity and retry awards, rejecting duplicate/client-chosen owner claims.
- The owner confirmed signing into `redfella` on the Fold5 and explicitly linking earlier outings. This completes the manual local owner-migration step.
- Updated the field recording/setup guidance to the deployed account-enabled 500-outbreak region, including automatic upload and the next personal/group field checklist.

## Replay/world and tester-account stage completion — 16 October 2026

The original stage requirements are preserved below; only unfinished Android integration/build items remain in the current goal.

- [x] Provide reusable scenario controls for load, start, pause, resume, reset and replay. Make reset restore the same world seed, players and clock, with a clear result summary. Provide a convenient scenario runner rather than a collection of one-off temporary commands.
- [x] Ignore original calendar dates for scenario eligibility: rebase relative recording times onto the selected simulation start. Use a fixed, configurable virtual baseline for repeatable server scenarios, with advance/fast-forward controls. Native recording replay uses today's wall clock. End-of-day/month-boundary scenarios are deliberate cases, not the default for every test. Future virtual events execute only when the test clock reaches them.
- [x] Support several simulated players and scheduled/delayed uploads. Cover repeat contacts, six-hour cooldowns, phased cleaning, group/finishing bonuses, duplicate retries and overlapping sources. Include good GPS and degraded/paused recordings.
- [x] Implement actual geographic growth and non-uniform withering, readable difficulty after committed cleaning, cleared states and replacement scheduling. Neighbours remain distinct and non-overlapping, growing around occupied areas. A long-running scenario must remain playable instead of exhausting the initial five fixtures.
- [x] Use PostgreSQL/PostGIS for persistent world geometry, contributions and enough historical state for the 24-hour matching window. Apply the agreed lifecycle clock and disintegration/remnant rules; preserve contribution and bonus identity across changes and restarts. Existing field recordings must survive migration.
- [x] Demonstrate repeatable scenarios that change the living world through recorded outings and time advancement. A reset and re-run must reproduce the same outcomes for the same inputs and seed.
- [x] Replace the shared gameplay identity with individual tester accounts. Provide a simple provisioning/onboarding path, sign-in/sign-out and persistent sessions; an invite/manual provisioning flow is sufficient for this stage.
- [x] Keep recordings, contributions, cooldowns and scores owned by the authenticated tester. Account switching and replay resets must not merge players or duplicate awards. Preserve the existing owner's data through an explicit migration.
- [x] Keep the development gateway credentials separate from player identity. Validate server authorization and secure local session storage; do not embed real credentials in the APK or repository.
- [x] Exercise cooperation and finishing competition using several simulated accounts, including delayed uploads and retries. Provide a repeatable group scenario and practical setup instructions for the later human tester group.

Evidence: the assembled 118-test workspace check covers virtual-clock controls/rebasing, future-event scheduling, six-hour eligibility, phased treatment, overlapping sources, historical changing geometry and finishing-order reconciliation. Recorded cycling replay with `--verify-repeat` reproduces complete result objects. The current 14-day lifecycle check maintained 20–100 visible targets, generated 40 ordinary replacements and 160 remnants, and returned to 20 ordinary outbreaks. The PostGIS contour check validated 1,800 polygons with no overlap above 0.01 m². Adapter restart, rollback and isolated reset checks passed. Real field import preserved scores/contributions and the owner completed explicit local history linking.

The reusable authenticated five-account check now exercises both cooperation and finishing competition in separate disposable worlds: closely spaced visitors each receive the shared cleanup bonus; visitors spaced 30 minutes apart retain their visit points while cleanup bonuses are `[0,0,0,0,100]`. Delayed upload, immutable retries, same-ID ownership isolation, named scores and server-side owner linking also passed. Onboarding instructions cover private field invites, personal sign-in and separate gateway configuration.

## Native recording → shared pending bonus → cleanup recap — 16 October 2026

A three-minute original cycling window was replayed through the actual Android 16 recorder and uploaded through its normal authenticated pipeline. It produced 152 fixes, 854 m, one section, maximum GPS gap 2.494 s and injection lateness 4 ms, earning 100 confirmed visit points. An earlier attempt stopped at the two-second injection-lateness safeguard, preserved its short recording and skipped upload; it was not counted as a faithful run. Temporarily pausing the other idle emulator reduced contention for the successful retry.

Four additional isolated accounts submitted the same native-recorded GPS through ordinary activity upload endpoints. The native outing's actual recap showed 100 confirmed visit points and a separately styled +100 possible cleanup bonus, with the warning that another visitor could take the finish. Wide and narrow recaps were visually inspected. After recording was finished, the explicitly accelerated isolated clock advanced cleaning by 530 minutes. The native recap updated to 200 confirmed points (100 visit + 100 cleanup), removed the pending block and labelled the encounter's cleanup bonus. The map's native fade/slide cleanup notice was captured visibly during this server transition. No synthetic contribution was sent to the public field server.

The isolated clock persists its offset, uses absolute forward offsets for retry safety, rejects backwards/out-of-bounds control requests, and resets to wall mode. The actual native runner refused to begin GPS in accelerated mode. `npm run replay:clock` provides authenticated status, advance and reset controls. These accelerated game-effect checks are separate from normal-speed GPS replay and do not establish battery or outdoor reliability.

## Living Tampere simulation and tester milestone — completed 16 October 2026

The remaining Android requirements and completion gates from the editable goal are preserved here:

- [x] Keep Start/Pause/Resume/Finish readily accessible, preserve the persistent notification controls, and maintain recorded data across interruption/reopening.
- [x] Provide clear follow/explore controls, including north-up following and direction-of-travel following where meaningful, plus recenter and route/world overview. Browsing the map must not silently leave the tester fighting automatic camera movements.
- [x] Render varied, organic outbreak shapes and recognizable growing, withering, clearing and cleared feedback. Show difficulty, available visit points, the locked bonus and activity-specific visit markers. Use symbols/labels as well as colour for eligibility and visited state.
- [x] Give clear contact/score feedback and distinguish provisional, confirmed and possible future bonus points. Provide a concise, game-facing finished-outing recap.
- [x] Carry a coherent visual identity through the map, overlays and recap: spores/overgrowth, fluid motion and satisfying cleanup feedback, with readable controls outdoors. Artwork remains a direction, not a small fixed set of outbreak silhouettes.
- [x] Retain cached-world/offline recording and understandable reconnect/upload behavior. Check folded/unfolded layouts in the emulator and build a standalone Android APK for later real testing.
- [x] The actual Android emulator recorder, fullscreen map and recap work together against the isolated API; accelerated engine scenarios are clearly identified separately.
- [x] The full assembled checks pass, the standalone Android build is ready, and implemented limitations plus the next personal/group field-test checklist are recorded.

### Final requirement audit

| Requirement | Completion evidence |
| --- | --- |
| Recorder controls, notification and durable recovery | Native notification Pause/Resume/Finish checks; interrupted recording recovery with preserved owner and a new section; stopped-app replay; final successful native upload. |
| Follow/explore and responsive layouts | Native recording checks exercised recenter, north/travel orientation, manual exploration and overview. Wide/narrow map and actual pending/confirmed recaps were visually inspected. Safe-area and attribution repair passed cold launch. |
| Organic lifecycle and readable eligibility | Procedural fractional contours, explicit lifecycle/visited/wait labels and detail points/locked bonus; native presentation states inspected; actual server-driven cleanup fade/slide notice captured on the narrow map. |
| Provisional, confirmed and pending/group feedback | Held-point HUD check; 854 m native recording confirmed 100 visit points; four real isolated account uploads produced a separately displayed +100 possible bonus; accelerated cleaning updated the actual native recap to 200 confirmed points. |
| Offline/reconnect and ownership | Native cached-map timeout/reconnection and forced-stop recovery; endpoint-scoped account sessions; actual sign-in/switching and owner-confirmed local migration; focused store/session/upload checks. |
| Replay/world/accounts | Completed original stage requirements and their evidence are preserved in the preceding stage-completion section, including 14-day lifecycle, PostGIS restart/geometry, deterministic recorded replay and five-account cooperation/competition. |
| Assembled checks and deliverables | Final workspace check: 119 tests across 29 files, all workspace typechecks and lab consistency. Four Python import/catalogue checks passed. Standalone release build and packaged Android permissions passed. Setup, private invitation flow, limitations and next personal/group outing checklist are documented. |

Final standalone APK: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` (122,715,348 bytes). Private screenshots, logs and its SHA-256 manifest are under ignored `work/replay/evidence/2026-10-16`; precise track imagery is not committed. The API restart retained the accelerated clock and the earned native cleanup bonus. The reusable clock status/advance/reset commands were exercised; the bench was then reset to wall-clock mode with zero offset. The Fold emulator returned to normal size and the temporarily paused API 37 emulator was resumed.

This completes the implementation milestone, not outdoor reliability or public-launch readiness. The next personal/group field checklist is in [Outbreak recording field check](first-outbreak-encounter.md). Full art/UI design, continuous contour morphing, extended regional-density performance profiling, strategic splitting, live player sharing, Strava integration, final rankings and iOS remain later work. Source GPS, account secrets and server configuration remain private. Changes produced since the prior approved commit batch remain uncommitted for review.


## Continuous outbreak rendering prototype — completed 17 October 2026

Started 16 October 2026. Implemented the [isolated rendering lab](rendering-prototype.md) against the [fluid growth target](images/sporeward-fluid-growth-target.png), then refined pointed tentacles into broader rounded splashes and added original wet folds inspired by the user's slime references.

The objective and completion evidence:

| Requirement | Authoritative implementation and verification |
| --- | --- |
| Keep cells for bookkeeping; independent continuous geographic footprint | `growth-field.ts` generates a seeded surface without cell centres; `footprint.ts` contours and clips it, then derives actual level-17 cells through polygon intersection. Seed variation and bookkeeping independence pass focused tests. |
| Same footprint for rendering and GPS contacts | Canvas paths and the contact query consume the same final rings. The 1 Hz geographic route is projected into the same metre space; tests verify first-contact fixes. Browser replay completed 836 seconds with three contacts on the default seed and two on the second. |
| Constrain growth with mapped shorelines | Exact polygon subtraction of the full real Iidesjärvi water geometry, including island holes, occurs after surface sampling. Tests prove no water intersection, correct island contact, neighbour separation and empty submerged geometry. The retained shoreline screenshot shows the actual rendered result. |
| Geographic glow scale without distant inflation | Live rendering and repeatable raster audit share `drawGrowth`. Material coordinates and inward rim widths are metres. Six-render wet-material audit: PASS, 0.31 m zoom-bound variation and 0.36 m outward antialiasing extent. |
| Capture the art direction well | Runtime inspection of several zooms and two seeds: irregular continuous pooled bodies, rounded edge accumulations, translucent sheets, darker material concentrations, bright rims and wet glossy folds; distinct amber, crimson and mint/lavender clearing treatments. Original material images add detail without fixed silhouette templates. Representative runtime screenshots and exact generation prompts are retained in the prototype documentation. |

Final checks: web typecheck and production build pass; five focused geometry/replay tests pass. The build reports a large bundle because the lab includes a local map fixture and textures; production packaging/performance is separate.

This completes the rendering prototype, not native integration or production boundary migration. The field server and Android app were not changed by this prototype. Remaining production considerations—global projection, historical footprint migration, lifecycle animation, detached shoreline components and native rendering—are documented in the lab notes.

## Android outbreak visuals and deterministic showcase — completed 22 October 2026

The owner accepted the Android phone visuals as the baseline. Shared outbreak rendering, progressive overview and field-lab presentation, deterministic showcase fixtures and lifecycle controls, and recorded-outing integration are complete. The Fold5 release update was installed after confirming no active recording; the owner then reviewed and accepted the phone visuals, including map containment. Another rendering pass is deferred to separate future work.

Validation included focused rendering, geometry, fixture and showcase-clock tests; workspace typechecks; strict OpenSpec validation; deterministic recorded replay; an Android release build and packaged-permission check; emulator review; and Fold5 installation/owner review. The standalone showcase clock and fixture mutations remain isolated from field accounts and storage. Implementation details and evidence are in the [archived OpenSpec change](../openspec/changes/archive/2026-10-22-replicate-approved-visuals-and-showcase/proposal.md).
