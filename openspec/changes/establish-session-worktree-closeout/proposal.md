# Proposal

## Why

Sporeward work can span multiple sessions, worktrees and branches, but repository guidance does not define how to check for duplicate owners or close out that work safely. A shared closeout procedure will keep ownership visible, preserve unresolved work and make cleanup part of completion.

## What Changes

- Add repository-level instructions for checking active ownership before spawning, maintaining clear ownership and status, and inventorying session state at completion.
- Define how to classify changed work as kept, published or discarded, preserve unresolved dirty work and unpushed commits, and limit cleanup to the responsible worker's workspace and branch.
- Add session and worktree closeout detail to `docs/openspec-workflow.md`, including reporting parked work with its owner and next action.
- Add critical Git workflow rules scoped to workers in isolated worktrees: explicitly stage task-owned files and create a valid commit before declaring finished, creating a PR, or exiting; never hand off task files uncommitted or untracked; and do not use `git stash`.
- Add a separate orchestrator rule requiring a fresh `origin/main` fetch before deciding whether worker work is current, redundant, or safe to clean up, because merged worker PRs are reflected there and a worker checkout may be stale.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is process documentation only and has no spec-level behavior change; `.openspec.yaml` sets `skip_specs: true`.

## Impact

- `AGENTS.md`
- `docs/openspec-workflow.md`
- No runtime code, external publication, repository cleanup, push, PR, or archive action. This task explicitly creates a local commit for the scoped documentation and planning files.
