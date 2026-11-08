# Review criteria

Besides tracing every behavior to the change's spec, hold the change to these.

## Safety

- Nothing weakens handling of secrets, credentials, location data or account data.
- No automated test reaches a real outside service.

## Structure

- Shared rules stay in `packages/game`, contracts in `packages/protocol`, free of platform code.
- Changed behavior has tests at meaningful rule boundaries; `npm run check` passes.
- Gameplay changes keep `docs/game-concept.md` and `docs/player-rules.md` consistent.

## Compatibility

- Stored data, protocol messages and database schema stay readable by the previous version, or the change says how they move.

## Words

- Text a person reads is plain and specific: what happened and what can be done.
