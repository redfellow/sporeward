# Planning this project

Rules for planners, on top of härvääjä's own.

## Proofs

- Monorepo (npm workspaces: apps/web, apps/mobile, apps/server, packages/game, packages/protocol); tests run with Vitest from the root. Name proofs like `npx vitest run path/to/file.test.ts`.
- Type check with `npm run typecheck --workspace @sporeward/<name>`; there is no linter.
- Mark test speed with a first-line comment `@harvaaja-test-tier: fast`, `integration` or `host`. Tests needing PostgreSQL/PostGIS, an Android emulator or a device are not fast.
- Native GPS recording cannot be proven by JavaScript checks; plan real-device validation as a manual step.
- Plans follow the change's OpenSpec artifacts in `openspec/changes/<change>/`.
