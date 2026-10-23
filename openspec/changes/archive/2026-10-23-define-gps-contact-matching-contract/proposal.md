# Proposal

## Why

The shared matcher and server already use geometric boundaries and historical footprint intervals, but the project has not captured their GPS contact contract in OpenSpec. Recording accuracy is stored while remaining informational, and the owner has now confirmed that it must not alter contact acceptance in the MVP.

## What Changes

- Add a durable GPS contact-matching capability for the existing 10 m boundary tolerance, same-segment interpolation across gaps up to 2 seconds, informational-only fix accuracy, and matching against the footprint version valid at the recorded timestamp.
- Clarify that longer gaps and segment boundaries do not support inferred crossings; directly observed fixes can still qualify under the same geometric tolerance.
- Clarify the corresponding GPS passage in `docs/game-concept.md` so it reflects the confirmed MVP contract.
- Keep reward settlement, duplicate-source reconciliation, peer-visible location precision, and protection-area behavior outside this contract.
- Make no runtime code changes and run no tests.

## Capabilities

### New Capabilities

- `gps-contact-matching`: Defines geometric contact acceptance and historical footprint selection for timestamped GPS recordings.

### Modified Capabilities

None.

## Impact

- OpenSpec: add `openspec/specs/gps-contact-matching/spec.md` when this change is archived.
- Documentation: `docs/game-concept.md` GPS contact description.
- Existing behavior traced in `packages/game/src/contacts.ts`, `apps/mobile/src/recording/encounters.ts`, `apps/server/src/world-store.ts`, and `apps/server/src/database/world.ts`; implementation is intentionally unchanged.
