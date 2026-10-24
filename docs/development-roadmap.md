# Sporeward — Development roadmap

## MVP goal

A player can complete a real outdoor activity in Tampere, contribute to a persistent shared outbreak world, and understand the points and cleaning they earned. MVP participation uses activities recorded with Sporeward's native recorder; Strava import and expanded rankings are post-MVP. Product priorities and proposed evaluation are in [product direction](product-direction.md). Normative behavior belongs to its [OpenSpec capability](../openspec/specs/).

This roadmap tracks outcome gates and evidence, not dates or a second task checklist. The selected stack and technical responsibilities are in [architecture](architecture.md); local setup is in [development setup](development-setup.md).

## Platform rollout

Android is the first native platform. Initial recording checks use the owner's two Android phones:

| Device | Android version |
|---|---|
| Samsung Galaxy Z Fold5 | Android 16 (user-reported) |
| Motorola Razr Fold 5G (user-provided name; exact model identifier to confirm) | Android 16 baseline; installed version may have changed and should be checked before testing |

Check screen-off/background operation, battery-management interruptions, and folded/unfolded transitions. Record installed versions and the Motorola model identifier when testing begins; the reported Motorola update commitment is not a verified compatibility assumption. The exact Android-to-iOS handoff and external tester remain open. Passing Android checks does not establish iOS support.

## Current implementation and evidence

The Android recorder persists fixes and route sections in SQLite, shows a MapLibre route map and recap, and supports explicit uploads to the test service. The server and isolated replay environment provide tester accounts, PostGIS-backed world state, validated activity requests, contact matching, scoring and recaps. A deterministic full-week PostGIS comparison is recorded in [Field Labs integration](field-labs-integration.md#persisted-postgis-replay-evidence). The [finished-goals record](finished-goals.md) links dated verification and its scope limits. The deterministic `packages/game` rules are used by the server; geographic geometry and persistence remain server-owned. None of this establishes reliable outdoor/background recording or public production readiness.

Field Labs and Resistance have recorded synthetic integration and emulator/presentation evidence in the [archived gameplay change](../openspec/changes/archive/2026-10-22-implement-outbreak-resistance-and-field-labs/tasks.md). Ordinary-outbreak visual acceptance is recorded in the [archived visual showcase](../openspec/changes/archive/2026-10-22-replicate-approved-visuals-and-showcase/tasks.md). Their evidence does not substitute for physical-phone gameplay, broad device, outdoor reliability, group/privacy, or deployment gates.

## Remaining outcome gates

- **Native activity reliability:** verify screen-off/background GPS, recovery after interruptions, pause/resume, offline persistence, and battery behavior on the named devices. Dated field reports are under [field tests](field-tests/); procedures are in [development setup](development-setup.md).
- **Product understanding and outing value:** evaluate optional A-to-B detours, repeatable local play, lab recovery, and understanding of confirmed versus conditional rewards. Proposed observations are in [product direction](product-direction.md); no numeric success threshold is set.
- **Shared play and privacy:** validate multiple real players, account attribution, and any future location visibility or protection controls before promising group presence or privacy behavior. Account attribution is specified in the [account-owned play capability](../openspec/specs/account-owned-play/spec.md); live presence and privacy controls remain open.
- **Production operation:** choose and verify production authentication, migration, hosting, map-data and live-update services before making a launch claim. Current architecture describes the test/replay boundary.

## Post-MVP and open scope

Strava import and expanded rankings are explicitly deferred beyond MVP. Their eligibility, source reconciliation, location/time attribution, delivery and settlement rules need a separate proposal. Other deferred ideas are collected without acceptance criteria in [future ideas](future-ideas.md). Unresolved gameplay decisions remain with their owning capability or a separately scoped proposal; the [game concept](game-concept.md) summarizes those boundaries.

## Recording constraints

The Screen Wake Lock API can prevent screen dimming while a document is active, but locks release when the document becomes inactive; this is not a background-recording guarantee. See [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API).

Native recording requires platform-specific permissions and lifecycle handling. See [Apple: Handling location updates in the background](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background) and [Android: Location foreground service requirements](https://developer.android.com/develop/background-work/services/fgs/service-types#location).
