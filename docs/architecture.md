# Sporeward — Working architecture

## Selected stack

| Component | Choice |
|---|---|
| Shared rules and data contracts | TypeScript |
| Mobile client | React Native + Expo development builds |
| Browser client | React + Vite |
| Map rendering | MapLibre GL JS for web; MapLibre React Native for mobile |
| HTTP server | Node.js + Fastify |
| Persistent spatial data | PostgreSQL + PostGIS |
| Package management | npm workspaces with one root lockfile |
| Rules/server tests | Vitest |

Android is the first physical-device target. iOS follows after the Android experience is mature and a tester is available. Framework versions come from the official Expo TypeScript template and package registries; the lockfile records installed versions.

## Responsibilities

`packages/game` owns pure rules, configurable balance, and deterministic time/event processing. It must not depend on React, GPS services, databases, or the system clock. The shared package exports balance settings and the deterministic minute-resolution cleaning simulation. It accepts explicit time advancement and seeded randomness, with serializable state, cooldown/repeat scoring, two-phase cleaning, bonuses, growth/disintegration, remnants, and split inheritance. Its tests and the interactive lab exercise the same implementation. This planning model is separate from the server's geographic test/replay world; late-import and contact rules remain under the active gameplay scope.

`packages/protocol` owns shared data contracts and runtime request parsing, including activity chunk validation used by the server. TypeScript types alone do not validate incoming requests; extend runtime parsing with any new endpoint contract.

`apps/server` owns the isolated test/replay world, accepted contributions, rewards, tester accounts and historical matching. It supports file-backed replay storage and a PostgreSQL/PostGIS adapter for spatial world state, footprint intervals, contributions and bonus ownership; geographic growth, spawning and lifecycle processing are exercised in deterministic replay. Runtime request parsing validates incoming activity data. The first encounter documentation describes the earlier fixed-footprint slice and is historical context, not a complete inventory of the current server. These capabilities do not establish a public production deployment, distributed multi-instance operation or real-world field reliability. Strava delivery/reconciliation, production authentication, migrations, hosting and live-update transport remain open integration/deployment decisions.

`apps/web` owns browser map exploration, planning, rankings, activity review, and foreground-only recording. `apps/mobile` owns native recording, offline storage, and mobile map interaction. Share rules, contracts, validation, and appropriate networking code; keep platform-specific UI and recording adapters separate.

Shared packages currently export TypeScript source directly. Vite, Metro, tsx, and Vitest consume it during development. Choose production server compilation/deployment as a separate step rather than assuming plain Node can execute all package source unchanged.

## Native recording and field gate

The Expo Android field recorder persists GPS fixes and route sections in local SQLite, provides map and recap views, and supports replay/upload through the test service. The development and standalone APK workflows are documented in [Development setup](development-setup.md). Implemented recording code does not establish reliable background location on physical phones. Validate screen-off operation, task/lifecycle changes, offline persistence, pause/resume, interruptions and battery use on the intended devices before claiming field acceptance.

Begin the recording session through a visible user action and configure the appropriate Android location foreground service and permissions. Keep recording data durably on-device before upload. Native tooling does not guarantee survival of force-stop or vendor battery restrictions; interrupted activities must recover without inventing contacts across gaps.

If Expo's location module fails the measured requirements, isolate that issue in the recording adapter and evaluate a native implementation. Do not couple outbreak logic to one location library.

The field recorder uses OpenFreeMap’s public Liberty style for its online route basemap, with visible attribution and a route-only offline fallback. GPS collection comes from the recording adapter; the map does not start another location watcher. Routes and recaps read local SQLite data. Production map hosting and offline basemap downloads remain undecided.

Production authentication, Strava access, database migration/deployment strategy, hosting and live-update transport remain to be selected. MapLibre supplies rendering, not a production map-data service. See [Product direction](product-direction.md) for priorities and open product questions, and the [Development roadmap](development-roadmap.md) for current gates.

## References

- [Expo monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [MapLibre React Native Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/)
- [Android location foreground services](https://developer.android.com/develop/background-work/services/fgs/service-types#location)
