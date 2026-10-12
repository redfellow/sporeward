# Sporeward

An outdoor game where recorded walks, runs, and rides help clear a shared world of spreading outbreaks. Players cooperate on cleaning and compete for points.

The repository now has a minimal application scaffold. Playable maps, accounts, background GPS, Strava integration, and persistent outbreaks are still to be implemented.

## Workspace

| Path | Purpose |
|---|---|
| `apps/web` | React + Vite browser client |
| `apps/mobile` | React Native + Expo; Android first, iOS later |
| `apps/server` | Fastify HTTP service |
| `packages/game` | Shared TypeScript balancing configuration and future deterministic rules |
| `packages/protocol` | Shared API types and future runtime validation |
| `docs` | Concept, player rules, roadmap, and artwork |

MapLibre is selected for map rendering. PostgreSQL + PostGIS is selected for server persistence. Neither is connected in this initial scaffold.

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

For subsequent JavaScript-only changes, launch Metro:

```sh
npm run dev:mobile
```

Native dependency or app-configuration changes require rebuilding the development app. Android/iOS directories are generated and ignored; keep native configuration in Expo configuration and config plugins. No cloud-build account is required for this local workflow. See [Development setup](docs/development-setup.md).

## Checks

- `npm run typecheck`: check all five TypeScript workspaces.
- `npm test`: run automated tests.
- `npm run check`: run both.
- `npm run build --workspace @sporeward/web`: build browser assets.

The current server test verifies the health endpoint without an external database. Full engine scenario tests are the next milestone. The [interactive planning simulation](docs/visualizations/sporeward-cleaning-lab.html) contains three repeatable scenarios with 17 assertions and is not the production rules implementation. Its source is an inline HTML fragment; standalone previews generated from it remain under ignored `work/visualizations`.

## Planning

- [Development roadmap](docs/development-roadmap.md)
- [Architecture](docs/architecture.md)
- [Game concept](docs/game-concept.md)
- [Player rules](docs/player-rules.md)
