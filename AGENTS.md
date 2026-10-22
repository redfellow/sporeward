# Sporeward repository guidelines

## Current scope

Sporeward has an Android field recorder with a fullscreen game map, automatic uploads and recaps, an account-owned PostgreSQL/PostGIS world with geographic growth/cleaning, and reusable recorded-GPS simulations and emulator replay. The field world covers the urban Tampere riding region; isolated replay uses a deterministic central Tampere baseline. Personal/group field validation and later product stages remain separate from completed implementation milestones. Follow `docs/architecture.md` and `docs/development-roadmap.md` for the selected stack and broader progression.

Active development scope, status and acceptance live in their owning `openspec/changes/<change>/` artifacts. Read the relevant change before continuing implementation and before declaring completion; preserve user edits. `docs/finished-goals.md` records completed scope and historical evidence. Do not create a duplicate project-wide task list.

## Code and checks

`apps/web` uses React/Vite, `apps/mobile` uses React Native/Expo, and `apps/server` uses Fastify. `packages/game` holds pure TypeScript rules and `packages/protocol` holds shared data contracts. Keep platform-specific UI and recording separate from shared rules.

Use `npm ci` for locked dependencies and `npm run check` for workspace typechecks and tests. Development commands and Android setup are in `README.md` and `docs/development-setup.md`. Test changed behaviour and meaningful rule boundaries. Native recording requires real-device validation; passing JavaScript checks is not proof of background GPS reliability.

## Documentation

- `docs/game-concept.md`: design decisions, balancing parameters, development details, and unresolved questions.
- `docs/player-rules.md`: concise player-facing overview and illustrations, followed by detailed rules.
- `docs/tilehunting.md`: background on tile hunting.
- `docs/images/`: concept artwork referenced by the documentation.

Write documentation in English. Keep the concept and player rules consistent when gameplay changes. Preserve user edits and agreed decisions. Remove discarded alternatives and conversational history. Keep tentative balancing values and genuinely open questions clearly identified.

Outbreak artwork illustrates the visual direction, not a fixed set of shape templates. Use relative links for documentation and images, and verify that local references resolve.

## Changes and validation

Keep changes focused on the requested scope. Review staged, unstaged, and untracked files when suggesting commits. Keep editor history and temporary exploration files out of version control. Never commit credentials or local environment files.

For documentation changes, check consistency and links. Once implementation exists, use checks appropriate to the changed behaviour and document how to run them. Do not assume a framework, branching strategy, or release process before one is chosen.

## Version control Guidelines

- Commits: Use ´[$TERM] ´ prefix for commits. For the $TERM, use "Conventional Commits" specification, in uppercase.
- Commit messages: Be concise.
- No co-author attribution

## OpenSpec workflow

Use OpenSpec for substantive features, fixes and architectural changes: explore as needed, propose requirements/design/tasks, apply the agreed change, then archive after completion and review. Small wording or routine maintenance edits can stay direct unless the user requests a proposal. Use the generated Codex skills under `.agents/skills/`; setup and exact invocation names are in `docs/openspec-workflow.md`.

`openspec/specs/` holds the accepted capability baseline after sync/archive; active changes hold proposed deltas. Do not treat pending specs as evidence of implemented behavior. Existing gameplay design remains in `docs/game-concept.md`, concise public guidance in `docs/player-rules.md`, and prior completion evidence in `docs/finished-goals.md`. Baseline existing capabilities incrementally when touched, using implementation and recorded decisions rather than inventing guarantees.
