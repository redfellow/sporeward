# Design

## Context

See [proposal.md](proposal.md) for motivation and scope. `AGENTS.md` is loaded as repository guidance, while `docs/openspec-workflow.md` is the detailed OpenSpec reference. The task changes process documentation only; it does not perform cleanup or publish work.

## Goals / Non-Goals

**Goals:**

- Make ownership checks, status reporting and closeout inventories repeatable across work sessions.
- Protect dirty work, unpushed commits and unrelated sessions from accidental cleanup.
- Leave a clear owner and next action whenever work remains parked.
- Require isolated-worktree workers to commit task-owned files before finish, PR creation, or exit, while preserving unrelated edits and avoiding `git stash`.
- Require orchestrators to fetch `origin/main` before assessing worker changes or cleanup safety.

**Non-Goals:**

- Add automation or prescribe a specific session manager, branching model or publication workflow beyond the specified commit and fresh-main safeguards.
- Authorize discarding changes, publishing externally, or removing workspaces as part of this documentation task.
- Change runtime behavior, gameplay requirements or data.

## Decisions

- Put the concise mandatory lifecycle in `AGENTS.md` so it applies to repository work generally, and place its detailed inventory and disposition steps in `docs/openspec-workflow.md`.
- Require a pre-spawn duplicate-owner check and explicit owner/status during work. For closeout, inventory changed paths and staged/unstaged/untracked state, commit counts ahead/behind, PR and review state, and the worktree; record a disposition for each work item.
- Treat unresolved dirty work and unpushed commits as preserved work. Removing a worker's workspace or branch is allowed only after its work is preserved, landed, or explicitly discarded. Limit cleanup to that worker's resources and leave unrelated sessions/worktrees alone.
- Keep publication within existing user or project authorization. A report must name the owner and next action for any parked work.
- Scope the critical stage-and-commit rule to workers operating in isolated worktrees. The main orchestrator has a separate procedure: fetch `origin/main`, then compare worker work with that fresh tree before assessing whether it is current, redundant, or safe to clean up. Do not infer main state from a stale worker checkout. The observed `origin/main` at this revision is `e62866c`; the rule always follows the fetched current ref, not that fixed commit.
- Stage only task-owned paths or hunks. Inspect the staged diff and status, keep unrelated user changes out of the commit, and do not use `git stash` to create a clean handoff.

## Risks / Trade-offs

- [Risk] A checklist can become stale or be read as permission to publish or discard → [Mitigation] State that existing authorization controls publication and unresolved work must be preserved until explicitly resolved.
- [Risk] Broad cleanup can affect parallel work → [Mitigation] Scope removal to the responsible worker's own resources and inventory unrelated state without modifying it.

## Migration Plan

No migration is required. Review the guidance in place, validate Markdown links and diff cleanliness, explicitly stage the scoped task files, and create the authorized local commit. Do not clean worktrees, push, open a PR or archive this change.
