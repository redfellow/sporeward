# Proposal

## Why

The repository's OpenSpec guidance does not yet make the agreed explore, plan review, implementation, independent review, and acceptance handoffs explicit. Durable instructions will let work continue across worker threads without confusing an archived OpenSpec change with integration into Git main.

## What Changes

- Update `AGENTS.md` and `docs/openspec-workflow.md` to record the agreed working loop:
  1. Explore and clarify intent, then capture the proposal and any applicable behavior specs in the repository.
  2. Begin apply only after the plan has been reviewed and accepted; apply only within the repository and the approved change scope.
  3. Obtain independent review. A rejected review returns to the implementer; implementation ambiguity returns to the explorer to inspect surrounding docs/code or ask the user.
  4. Mark work complete, sync specs, and archive only after required review and acceptance gates are satisfied.
- Document handoff expectations for continuing work across worker threads, including the current change/artifacts, decisions, findings, unresolved questions, review outcome, and next action.
- Require status reports to distinguish OpenSpec lifecycle from Git integration: report checkout, branch, commit, and push state separately; archiving is not evidence of merging or updating Git main.
- Keep the change documentation-only; do not alter runtime behavior or create a product capability spec for a process change.

## Capabilities

### New Capabilities

None. This changes repository workflow guidance only; `skip_specs: true` is set in `.openspec.yaml`.

### Modified Capabilities

None. No product behavior or existing capability requirements change.

## Impact

Documentation only: `AGENTS.md` and `docs/openspec-workflow.md`. The eventual implementation should preserve unrelated user edits, use the repository's available OpenSpec skills for each relevant phase, and make no claims about Git integration from OpenSpec archive status. No runtime code, APIs, dependencies, or product behavior are in scope.
