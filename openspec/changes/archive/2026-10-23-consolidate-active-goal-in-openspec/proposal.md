# Proposal

## Why

`docs/current-goal.md` is now a handoff pointer to two existing OpenSpec changes, so it repeats their status while leaving active scope split across files. Removing this obsolete index makes the owning changes authoritative and keeps completed implementation evidence in `docs/finished-goals.md`.

## What Changes

- Remove `docs/current-goal.md` and replace links to it with direct references to the existing active changes.
- Update the existing project-status change's references to the goal index while preserving its 0/7 task state and scope.
- Preserve the Field Labs and Outbreak Resistance change's migration-time 13/14 state and explicit owner-acceptance requirement; record any later acceptance in that owning change.
- Keep completed scope and evidence in `docs/finished-goals.md`; do not recreate a parallel goal checklist.
- Validate OpenSpec status, strict change validation and documentation links after the migration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is documentation and work-index maintenance; it changes no product behavior. `skip_specs: true` is set in `.openspec.yaml`.

## Impact

Documentation only: `AGENTS.md`, `README.md`, `docs/openspec-workflow.md`, `docs/finished-goals.md`, `docs/replay-tool.md`, and wording in the two existing active OpenSpec changes. The migration preserves the earlier acceptance gate; the later owner confirmation is recorded in the Field Labs change with its scope and limitations. No implementation, gameplay, data, or deployment changes are included.
