# Sporeward

An outdoor game where recorded walks, runs, and rides help clear a shared world of spreading outbreaks. Players cooperate on cleaning and compete for points.

The repository contains a native Android field recorder with local route maps and recaps, a deterministic planning simulation, and an account-backed Tampere test/replay service with PostgreSQL/PostGIS persistence, geographic outbreak lifecycle, validated GPS contacts and activity scoring. These capabilities are documented implementation milestones for isolated/test use; they do not establish public production deployment, outdoor GPS reliability or group/field acceptance. Strava delivery and reconciliation remain future integration work. See the [roadmap](docs/development-roadmap.md) and [finished goals](docs/finished-goals.md) for evidence and remaining gates.

## Workspace

| Path | Purpose |
|---|---|
| `apps/web` | React + Vite browser client |
| `apps/mobile` | React Native + Expo; Android first, iOS later |
| `apps/server` | Fastify HTTP service |
| `packages/game` | Shared TypeScript balancing configuration and deterministic cleaning simulation |
| `packages/protocol` | Shared API types and runtime request validation |
| `docs` | Concept, player rules, roadmap, and artwork |

The Android route map uses MapLibre with an OpenFreeMap basemap. The server includes PostgreSQL + PostGIS persistence for the isolated replay/test world; production hosting, authentication and public data services are not established.

## Getting started

Use Node.js 24.3 or newer and npm. The `.nvmrc` selects Node 24.

```sh
npm ci
npm run check
```

Start these in separate terminals:

```sh
npm run dev:server
npm run dev:web
```

The server defaults to `http://127.0.0.1:3001`; `GET /health` returns its status. Vite prints the browser URL, normally `http://127.0.0.1:5173`. Both bind to localhost. `HOST` and `PORT` can configure the server when device access is needed.

## Android development

Sporeward uses an Expo development build, not Expo Go, so native map and background-location modules can be added and tested.

Install Android Studio, its Android SDK tools, and a compatible Java development kit. Enable developer options and USB debugging on a test phone, connect it, and authorize the computer. Then build and install the development app:

```sh
npm run android
```

For a field-test APK that runs without Metro, build and install the locally signed release variant:

```sh
npm run android:field
```

This internal test build uses the generated debug signing key, not store-distribution credentials. It updates the same app and retains its local recordings. The APK is generated at `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`. Rebuild to include subsequent code changes. Recording and saved routes work offline; the street basemap requires internet.

For subsequent JavaScript-only changes in a development build, launch Metro:

```sh
npm run dev:mobile
```

Native dependency or app-configuration changes require rebuilding the development app. Android/iOS directories are generated and ignored; keep native configuration in Expo configuration and config plugins. No cloud-build account is required for this local workflow. See [Development setup](docs/development-setup.md).

## Checks

- `npm run typecheck`: check all five TypeScript workspaces.
- `npm test`: run automated tests.
- `npm run check`: run both.
- `npm run build --workspace @sporeward/web`: build browser assets.

Server tests cover upload persistence, timestamped contacts, duplicate contributions, delayed cleaning and confirmed encounter recaps without an external database. The shared cleaning engine and native recording/route helpers have deterministic regression tests. The [interactive planning simulation](docs/visualizations/sporeward-cleaning-lab.html) contains three repeatable scenarios with 17 assertions and runs the same extracted engine in `packages/game`. This minute-resolution balancing engine is not yet an authoritative GPS/world implementation. After changing shared rules, run `npm run build:lab` to refresh its embedded bundle; `npm run check` verifies it is current and runs the actual lab scenarios. Its source is an inline HTML fragment; standalone previews generated from it remain under ignored `work/visualizations`.

## Planning

- [Development roadmap](docs/development-roadmap.md)
- [Architecture](docs/architecture.md)
- [Game concept](docs/game-concept.md)
- [Player rules](docs/player-rules.md)

## Planning changes

Sporeward uses [OpenSpec](docs/openspec-workflow.md) for substantive development. Read the owning change before resuming work: [Field Labs and Outbreak Resistance](openspec/changes/implement-outbreak-resistance-and-field-labs/proposal.md). The completed [product direction and project status reconciliation](openspec/changes/archive/2026-10-22-align-product-direction-and-project-status/proposal.md) records the project priorities and status handoff. Completed work and evidence are recorded in [Finished goals](docs/finished-goals.md).
