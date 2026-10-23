# Sporeward — Architecture

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
| Rules and server checks | Vitest |

Android is the first physical-device target. iOS work follows after Android reaches an agreed level of maturity and an external tester is available; the handoff milestone remains open. Framework versions are pinned by the root lockfile.

## Responsibilities

- `packages/game` owns pure deterministic gameplay rules and configurable balance. It receives explicit time and seeded randomness and does not depend on React, GPS, a database or the system clock. The server imports these rules; the package's planning and balancing experiments do not by themselves establish field acceptance.
- `packages/protocol` owns shared data contracts and runtime request parsing. TypeScript types alone do not validate incoming requests.
- `apps/mobile` owns Android native recording, local SQLite storage, upload interaction and the mobile map/recap UI. Map graphics use MapLibre's camera pipeline. Recording code must persist data before upload and must not infer contacts across pause or interruption gaps.
- `apps/server` owns authenticated test/replay requests, account attribution, authoritative activity settlement, geographic world operations and persistence. It supports isolated replay storage and a PostgreSQL/PostGIS spatial adapter. This test/replay service is not a public production deployment.
- `apps/web` currently exposes rendering studies and illustrative map work. A full browser exploration, planning, rankings, activity-review or recording product is not evidenced in the current entry point.
- `packages/rendering` owns shared visual recipes consumed by platform adapters; it does not redefine server contact geometry or scoring.

Keep GPS recording and platform UI separate from shared rules. Keep geographic contact and world persistence in the server. Product contracts and evidence maturity are tracked by [OpenSpec capabilities](../openspec/specs/) and the [development roadmap](development-roadmap.md).

## Recording and field gate

The Expo Android recorder stores GPS fixes and route sections in local SQLite and provides map and recap views. Development and standalone APK workflows are in [development setup](development-setup.md). Implemented recording code and synthetic replay do not prove reliable background location on physical phones. Screen-off operation, task/lifecycle changes, offline persistence, pause/resume, interruptions and battery use require device evidence before field acceptance.

Recording starts from a visible user action and uses Android location foreground-service permissions. Persist fixes before upload. Platform restrictions can stop a process, so recovery must preserve route sections without inventing contacts across gaps. If Expo's location module fails measured requirements, evaluate the change in the recording adapter rather than coupling gameplay rules to one location library.

The field recorder uses OpenFreeMap's public Liberty style online with attribution and a route-only offline fallback. GPS collection comes from the recording adapter; the map must not start another location watcher. Production map hosting and offline basemap downloads are undecided.

## Production boundary

Production authentication, deployment/migrations, hosting, live-update transport, Strava access and a full browser product are not established by the current test/replay service. Choose those as separate product and operational scopes. See [product direction](product-direction.md) for priorities and deferred/open decisions, and the [roadmap](development-roadmap.md) for current evidence gates.

## References

- [Expo monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [MapLibre React Native Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/)
- [Android location foreground services](https://developer.android.com/develop/background-work/services/fgs/service-types#location)
