# Building this project

Rules for implementers and fixers, on top of härvääjä's own.

## Proofs

- Run one test file: `npx vitest run <file>`. Type check a workspace: `npm run typecheck --workspace @sporeward/<name>`. Whole suite: `npm run check`.
- A new test gets a first-line comment `@harvaaja-test-tier: fast`, `integration` or `host`.
- No tests may need network, a database server or an emulator unless tiered integration/host.

## Conventions

- TypeScript, ES modules, tabs for indentation.
- Keep pure rules in `packages/game` and shared contracts in `packages/protocol`; keep platform UI/recording out of them.
- Do not commit credentials or env files. Commit messages use the `[TERM] ` prefix from AGENTS.md; no co-author lines.
