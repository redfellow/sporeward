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

`packages/game` owns pure rules, configurable balance, and deterministic time/event processing. It must not depend on React, GPS services, databases, or the system clock. The initial scaffold exports the current balance settings; the complete engine remains to be extracted and tested.

`packages/protocol` owns shared data contracts. Add runtime validation when activity and outbreak endpoints are defined; TypeScript alone does not validate incoming requests.

`apps/server` owns authoritative world state, accepted contributions, rewards, authentication, Strava delivery, and historical matching. PostgreSQL/PostGIS integration and background world processing follow the engine milestone. The scaffold only provides a health endpoint.

`apps/web` owns browser map exploration, planning, rankings, activity review, and foreground-only recording. `apps/mobile` owns native recording, offline storage, and mobile map interaction. Share rules, contracts, validation, and appropriate networking code; keep platform-specific UI and recording adapters separate.

Shared packages currently export TypeScript source directly. Vite, Metro, tsx, and Vitest consume it during development. Choose production server compilation/deployment as a separate step rather than assuming plain Node can execute all package source unchanged.

## Native recording gate

Use an Expo development build from the outset. Background location and the selected native map library require it. Start with a minimal Android recorder and validate screen-off operation, task/lifecycle changes, offline persistence, pause/resume, and battery consumption on both test phones.

Begin the recording session through a visible user action and configure the appropriate Android location foreground service and permissions. Keep recording data durably on-device before upload. Native tooling does not guarantee survival of force-stop or vendor battery restrictions; interrupted activities must recover without inventing contacts across gaps.

If Expo's location module fails the measured requirements, isolate that issue in the recording adapter and evaluate a native implementation. Do not couple outbreak logic to one location library.

Map styles/tile hosting, authentication provider, Strava access, database migrations, hosting, and live-update transport remain to be selected. MapLibre supplies rendering, not a production map-data service.

## References

- [Expo monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [MapLibre React Native Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/)
- [Android location foreground services](https://developer.android.com/develop/background-work/services/fgs/service-types#location)
