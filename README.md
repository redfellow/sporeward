# Sporeward

An outdoor game where recorded walks, runs, and rides help clear a shared world of spreading outbreaks. Players cooperate on cleaning and compete for points.

The repository contains a native Android field recorder with local route maps and recaps, a deterministic cleaning simulation engine, and minimal web/server scaffolds. Accounts, Strava integration, authoritative GPS contact matching, and persistent shared outbreaks remain to be implemented. Background recording requires field validation.

## Workspace

| Path | Purpose |
|---|---|
| `apps/web` | React + Vite browser client |
| `apps/mobile` | React Native + Expo; Android first, iOS later |
| `apps/server` | Fastify HTTP service |
| `packages/game` | Shared TypeScript balancing configuration and deterministic cleaning simulation |
| `packages/protocol` | Shared API types and future runtime validation |
| `docs` | Concept, player rules, roadmap, and artwork |

The Android route map uses MapLibre with an OpenFreeMap basemap. PostgreSQL + PostGIS is selected for server persistence but is not connected.

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

The current server test verifies the health endpoint without an external database. The shared cleaning engine and native recording/route helpers have deterministic regression tests. The [interactive planning simulation](docs/visualizations/sporeward-cleaning-lab.html) contains three repeatable scenarios with 17 assertions and runs the same extracted engine in `packages/game`. This minute-resolution balancing engine is not yet an authoritative GPS/world implementation. After changing shared rules, run `npm run build:lab` to refresh its embedded bundle; `npm run check` verifies it is current and runs the actual lab scenarios. Its source is an inline HTML fragment; standalone previews generated from it remain under ignored `work/visualizations`.

## Planning

- [Development roadmap](docs/development-roadmap.md)
- [Architecture](docs/architecture.md)
- [Game concept](docs/game-concept.md)
- [Player rules](docs/player-rules.md)
