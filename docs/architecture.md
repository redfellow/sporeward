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

`packages/game` owns pure rules, configurable balance, and deterministic time/event processing. It must not depend on React, GPS services, databases, or the system clock. The shared package exports balance settings and the extracted deterministic cleaning simulation. It accepts explicit minute advancement and seeded randomness, with serializable state, cooldown/repeat scoring, two-phase cleaning, bonuses, growth/disintegration, remnants, and split inheritance. Its tests and the interactive lab exercise the same implementation. This minute-resolution planning model still needs authoritative event processing, spatial rules, late-import reconciliation, and real contact validation.

`packages/protocol` owns shared data contracts. Add runtime validation when activity and outbreak endpoints are defined; TypeScript alone does not validate incoming requests.

`apps/server` owns authoritative world state, accepted contributions, rewards, authentication, Strava delivery, and historical matching. PostgreSQL/PostGIS integration and background world processing follow the engine milestone. The test API provides Basic-Auth-protected health, activity upload, world and encounter endpoints with request limits. It runs in Docker inside the Windows host’s WSL2 instance on port 3101; Windows nginx supplies public HTTPS separately. Activity uploads persist in an immutable file store. The [first encounter slice](first-outbreak-encounter.md) adds fixed Tampere footprints, timestamped contact matching, atomic world/contribution snapshots and confirmed recaps. Geographic growth, automatic spawning and the full historical lifecycle remain outstanding.

`apps/web` owns browser map exploration, planning, rankings, activity review, and foreground-only recording. `apps/mobile` owns native recording, offline storage, and mobile map interaction. Share rules, contracts, validation, and appropriate networking code; keep platform-specific UI and recording adapters separate.

Shared packages currently export TypeScript source directly. Vite, Metro, tsx, and Vitest consume it during development. Choose production server compilation/deployment as a separate step rather than assuming plain Node can execute all package source unchanged.

## Native recording gate

Use an Expo development build from the outset. Background location and the selected native map library require it. Start with a minimal Android recorder and validate screen-off operation, task/lifecycle changes, offline persistence, pause/resume, and battery consumption on both test phones.

Begin the recording session through a visible user action and configure the appropriate Android location foreground service and permissions. Keep recording data durably on-device before upload. Native tooling does not guarantee survival of force-stop or vendor battery restrictions; interrupted activities must recover without inventing contacts across gaps.

If Expo's location module fails the measured requirements, isolate that issue in the recording adapter and evaluate a native implementation. Do not couple outbreak logic to one location library.

The field recorder uses OpenFreeMap’s public Liberty style for its online route basemap, with visible attribution and a route-only offline fallback. GPS collection comes from the recording adapter; the map does not start another location watcher. Routes and recaps read local SQLite data. Production map hosting and offline basemap downloads remain undecided.

Authentication provider, Strava access, database migrations, hosting, and live-update transport remain to be selected. MapLibre supplies rendering, not a production map-data service.

## References

- [Expo monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [MapLibre React Native Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/)
- [Android location foreground services](https://developer.android.com/develop/background-work/services/fgs/service-types#location)
