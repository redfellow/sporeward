# OpenSpec specifications for existing project features

## Why it splits
Reijo asked for retrospective OpenSpec coverage of shipped features, including gaps in the 14 existing main specs, delivered per area. The areas map to largely separate code (server accounts/activity, world/spatial serving, mobile recording, shared game rules, rendering guides/replay tooling). Each area's specs can be written, validated and reviewed on its own, and the areas can be written in parallel.

## Shared constraints
- Document only behavior that is already merged on main; do not change code or gameplay. Each child is an OpenSpec change with proposal, spec deltas, short design and tasks. Where a requirement is added, a focused existing test or a source reference must back it.
- Prefer ADDED/MODIFIED deltas to existing capabilities (account-owned-play, activity-recording, gps-contact-matching, native-recording-recovery, outbreak-growth, outbreak-resistance, visit-scoring, field-labs, outing-feedback, outbreak-visuals, visual-showcase, field-lab-guide, outbreak-resistance-guide, renewable-exploration). Create new capabilities only for shipped behavior that has no owning spec.
- Do not specify behavior owned by the active changes enrich-past-outing-history, add-native-field-guide, add-map-destination-focus, add-nearby-destinations-sheet or add-live-encounter-feedback; they close out separately.
- Each child's proof is `openspec validate --strict` for its change plus the existing tests it cites. Unbuilt or uncertain behavior is recorded as an open question, not specified.

## Children
### 1. Specify accounts, tester sign-in and activity upload on the server
Cover apps/server/src/accounts, activity-store.ts, app.ts routes and packages/protocol activities/scores: tester accounts and authentication, account-scoped activity upload, idempotency, receipts and score responses. Fill gaps in account-owned-play and activity-recording; add new capabilities only where none fits (docs/tester-accounts.md as a source).
Blocked by: none
### 2. Specify world snapshot serving, spatial test world and field migration
Cover apps/server/src/world-store.ts, outbreak-view.ts, spatial/, database/, test-outbreaks.ts and packages/protocol world.ts: how the shared world is stored, aged and served to clients, the spatial test world and field migrations (docs/spatial-test-world.md, docs/field-migration.md). Fill gaps in outbreak-growth and gps-contact-matching where the server applies them.
Blocked by: none
### 3. Specify shared game rules: contacts, scoring, resistance and Field Lab settlement
Cover packages/game (engine, contacts, resistance, balance) and apps/server field-labs.ts, lab-settlement.ts, resistance-state.ts. Compare shipped behavior with visit-scoring, gps-contact-matching, outbreak-resistance, field-labs and renewable-exploration and add the missing requirements, citing the existing unit tests.
Blocked by: none
### 4. Specify the Android recorder, local storage and map client
Cover apps/mobile/src/recording, server/ client, and the live map components already on main: recording lifecycle, local SQLite persistence, upload retry and world refresh. Fill gaps in activity-recording, native-recording-recovery and outbreak-visuals; exclude the in-flight history, guide, destination and live-feedback changes.
Blocked by: none
### 5. Specify the desktop rendering guides, showcase and replay tool
Cover apps/web, packages/rendering, apps/server/src/replay, apps/mobile/src/replay and packages/protocol replay.ts: the desktop visual guides, visual showcase and the replay tool (docs/replay-tool.md, docs/rendering-prototype.md). Fill gaps in field-lab-guide, outbreak-resistance-guide, visual-showcase and outbreak-visuals; add a replay capability if none fits.
Blocked by: none
