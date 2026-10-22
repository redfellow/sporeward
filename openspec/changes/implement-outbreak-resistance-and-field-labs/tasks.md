# Tasks

## 1. Deterministic rules and calibration

- [x] 1.1 Implement serializable explicit-time resistance accumulation, passive recovery and one combined visit-reward curve; verify strength ratios, duplicate rejection, soft threshold, provisional 25% floor, cooldown exclusion and unchanged cleaning/cleanup bonuses with focused game tests.
- [x] 1.2 Implement representative-point geography and centre experiments; verify replacement persistence, weighted-average versus concentration behaviour, separated clusters and stable outing references with deterministic fixtures; document the selected provisional model and limitations.
- [x] 1.3 Implement capped distance restoration and continuously recovering successive-collection diminishing; verify zero resistance, no stockpiling, cap boundaries, successive collections and two-hotspot repetition with focused tests.
- [x] 1.4 Add a repeatable four-week scenario runner for commute-only, weekend adventure, short local walks, alternating hotspots, fresh replacements and high-mileage collection; publish combined reward curves and next-week effects against the provisional targets, document parameters/run commands, and resolve target conflicts before integration.

## 2. Authoritative resistance and migration

- [x] 2.1 Add account-owned versioned persistence and idempotent events to ordinary contribution settlement; verify restart, concurrent retries, account separation and late/out-of-order upload permutations without changing historical awards.
- [x] 2.2 Add runtime-validated private resistance/reward contracts and consistent map/award/recap calculations; verify malformed input rejection, owner-only access and offer-to-award agreement, and document prospective scoring-version behaviour.
- [x] 2.3 Implement neutral feature activation and migration/rollback tooling on disposable data; verify existing recordings, geometry, contributions, cleanup awards and historical recaps survive unchanged, and document the rollback procedure before any deployment.

## 3. Shared Field Lab lifecycle and collection

- [x] 3.1 Add seeded accessible lab spawning, identity and expiry separate from ordinary density/cleanup accounting; verify deterministic isolated reset, placement accessibility, rarity/lifetime tuning and identical shared destinations across accounts; document configuration.
- [x] 3.2 Integrate validated recorded lab contacts, stable server-issued outing offers and atomic personal collection/restoration; verify co-op independence, collected-until-expiry state, concurrent outings, retries, offline provisional handling, expired-at-contact rejection and delayed settlement limits.
- [x] 3.3 Add validated lab/offer/collection/recap contracts and persisted reward-name selection; verify all ten names have identical mechanics and stable retry feedback, and document endpoints plus provisional-to-confirmed behaviour.

## 4. Gameplay presentation and isolated acceptance

- [x] 4.1 Coordinate with the desktop study and Android visual port, then adopt the shared Field Lab and resistance artwork; verify native camera alignment, bounded/reduced motion, collected cues, expiry and displayed versus actual restoration in the emulator. Remaining owner acceptance is tracked in 4.4.
- [x] 4.2 Update concept and player rules for the implemented scoring/recovery/collection model, marking tuning provisional; document replay setup and verify links, example rewards and actual isolated launch commands.
- [x] 4.3 Run the integrated weekly and two-player recorded scenarios against isolated persistence; verify map offers, collected status, resistance changes, scores and recaps agree, then run the appropriate workspace checks and record limitations.
- [ ] 4.4 Obtain explicit owner acceptance of the gameplay and integrated emulator presentation, retaining unresolved feedback as unfinished; record evidence without claiming field deployment, outdoor reliability or phone approval that has not occurred.

## Workflow follow-up

- Archive and sync only after implementation, calibration evidence and review; keep deployment separately authorized.
- Coordinate final phone review with the existing Android visual change and confirm no recording is active before installation.
- Update current-goal/completion pointers only when agreed work actually changes stage; do not overwrite the parallel visual agent's planning or acceptance records.

## Implementation evidence (2026-10-21)

- Owner clarified that the first-week target concerns Friday's reward state. Deterministic results and parameters: [calibration](../../../docs/resistance-calibration.md).
- Prospective scoring, private contracts, additive snapshot activation and rollback: [resistance integration](../../../docs/resistance-integration.md). Disposable migration command passed, preserving legacy snapshot data and recording bytes.
- Shared lifecycle, authoritative offers, atomic collection and named recap feedback: [Field Labs integration](../../../docs/field-labs-integration.md). Focused fixtures cover owner access, retry/restart, co-op, concurrent outings, delayed input, expiry and recorded contact ordering.
- Workspace typechecks passed. All 167 tests passed with `npm test -- --maxWorkers=2`. The unrestricted default run timed out in the existing spatial-generation and replay-presentation tests under concurrent load; it is not recorded as a passing `npm run check`. After regenerating the embedded engine with `npm run build:lab`, `npm run check:lab` passed. OpenSpec strict validation and `git diff --check` passed.
- The [desktop study](../archive/2026-10-21-explore-field-labs-and-outbreak-resistance/tasks.md) is approved and archived. Its station drawing, resistance hue/falloff and contours are shared with Android. This lab/resistance adoption does not complete or accept the independent [ordinary-outbreak visual port](../replicate-approved-visuals-and-showcase/tasks.md).

## Integrated verification (2026-10-22)

- Feature bench and Metro launched on isolated loopback ports 3103/8081. The Fold API 36 emulator showed available/collected stations, expiry details, provisional contacts and confirmed restoration; native pan/zoom and reduced-motion states were inspected. Reduced-motion settings were restored. Fresh logs after image-lifetime fixes showed no source-load or JavaScript errors. Canonical artwork remains shared with the desktop guide.
- Actual recorder replay: 604 metres, 51 fixes, maximum GPS gap 1,619 ms. A validated lab contact confirmed Wildtype Extract with the frozen offer and actual restoration both 16.2838%; the native recap displays 16%. No ordinary visit points were expected or awarded for that lab-only path. The map retains the personal collected check.
- Four-week, two-player integration against temporary file persistence passed using the private unchanged 1,330-fix recording and accessible seed 40. Weekly aggregate visit points: 1,494 / 1,216 / 1,136 / 1,110. Both players collected independently; stable offers, retries, persisted reductions, score/recap equality and restart were verified. See [replay commands](../../../docs/replay-tool.md#field-labs-and-resistance) and [detailed evidence](../../../docs/field-labs-integration.md#native-presentation-and-recorded-integration--22-october-2026). Live PostGIS, outdoor reliability and field deployment are not claimed.
- Final workspace typechecks passed; all 169 tests passed with `npm test -- --maxWorkers=1 --testTimeout=20000` while the software-rendered emulator was running. A concurrent two-worker run exceeded the existing spatial-generation test's five-second timeout; assertions passed with the documented execution settings. Lab consistency, strict OpenSpec validation, documentation links and `git diff --check` passed.
- Review screenshots are local and ignored under `work/replay/evidence/2026-10-22-field-labs/` (`map-collected.png`, `recap.png`). The emulator remains on the confirmed recap with no active recording. Task 4.4 remains pending explicit owner acceptance of gameplay and the integrated emulator presentation. No commits, deployment, physical-phone installation or outdoor validation occurred.

## Owner feedback follow-up (2026-10-22)

- Owner confirmed seeing the labs, then reported oversized overview symbols, unclear collection area and poor performance. Task 4.1 remains open for review of the revised presentation; task 4.4 is not accepted.
- Lab icon size now follows native zoom; the exact server collection ring is visible at riding zoom. Details explain crossing that area while recording.
- Running emulator changed from SwiftShader to verified Apple M1 / Metal host graphics. Lower native material pose/layer budgets and resistance-raster reuse address identified code costs; no release-device FPS claim is made.
- A complete read-only guide-state fixture and per-example camera controls now support Android review; see the linked visual-port change and replay documentation. This does not complete its lifecycle controls or final visual acceptance.
- Subsequent owner feedback: apparent station drift and poor readability across zoom. Corrected intrinsic SVG-to-raster scaling; replaced close billboard symbols with geographic image sources and distant art with a readable LAB marker. Close labels sit outside the art. Mobile typecheck and emulator near/far/pan checks passed; this revised presentation still awaits owner review.
- Follow-up visual refinements are implemented: distant labs use the shared antenna badge, the detailed station uses the shared guide artwork, and the collection footprint is circular. The inner solid center outline was removed after the latest owner feedback, leaving the soft center fill and outer dashed collection boundary. Emulator reload confirmed one visible boundary; task 4.4 remains open for explicit gameplay and integrated-presentation acceptance.
- The Android port now consumes the shared outbreak halo and ahead-of-pan artwork preparation described in the [visual showcase change](../replicate-approved-visuals-and-showcase/tasks.md). Newly generated remnants use the doubled collection radius while historical contact intervals remain unchanged. Detailed presentation decisions and evidence belong to that visual change; this feature's remaining review gate is explicit owner acceptance, not a second implementation checklist.
