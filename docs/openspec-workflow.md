# OpenSpec workflow

OpenSpec is initialized at the Sporeward monorepo root for Codex. CLI version at setup: **1.14.3**, installed globally using npm. It is a developer tool, not an application dependency.

## Working on changes

- `$openspec-explore`: discuss or investigate an idea.
- `$openspec-propose`: create a proposal, capability deltas, design and tasks.
- `$openspec-update-change`: revise a pending plan after feedback.
- `$openspec-apply-change`: implement an agreed change and update its tasks.
- `$openspec-sync-specs`: intentionally sync capability deltas into baseline specs.
- `$openspec-archive-change`: archive completed work after the required review.

In Codex desktop, select the corresponding skill from Skills in the sidebar. Restart/reopen the Codex session if the newly generated skills do not appear. Codex uses skills, so initialization correctly generated no command files.

For example: `$openspec-propose Add a tester leaderboard` or ask to apply `implement-outbreak-resistance-and-field-labs` with `$openspec-apply-change`.

```sh
openspec list
openspec status --change implement-outbreak-resistance-and-field-labs
openspec validate --all --strict
```

## Sources of truth

- `openspec/config.yaml`: shared planning context and artifact rules.
- `openspec/changes/<name>/`: source of truth for each active scope, status, requirements, design, tasks and acceptance.
- `openspec/specs/`: accepted capability baseline populated through sync/archive. It starts empty; existing implementation is not automatically a fully specified system.
- `docs/game-concept.md`: agreed game design and explicitly tentative balancing.
- `docs/player-rules.md`: concise player-facing rules.
- `docs/finished-goals.md`: historical completion and acceptance evidence.

Use OpenSpec for substantive development. Keep small wording fixes and routine maintenance direct when a proposal would add no useful decision. Preserve explicit owner acceptance requirements; a successful build is not visual approval. Generated skills are tooling instructions; project-specific constraints belong in config and AGENTS.md rather than edits that `openspec update` would overwrite.

## Session and worktree closeout

Treat cleanup as a normal completion step. Use this procedure whenever a session, worker, or worktree finishes or hands work off.

### Before starting parallel work

Inspect the available project sessions, active owners, branches, and worktrees for an existing owner covering the same change. If one exists, continue in or coordinate with that owner rather than creating duplicate active ownership. For a new worker, make its owner, scope, branch/worktree, and expected handoff clear in the owning change or session record.

### While work is active

Keep the owner, scope, current status, branch/worktree, and next action visible in the owning change or session handoff. Update that record as the work advances and when a blocker or ownership transfer occurs. OpenSpec task status describes change progress; the session handoff also identifies who currently owns the work and where it lives.

### At completion or handoff

Inventory and report all of the following before calling the work complete:

- Changed paths, grouped by staged, unstaged, and untracked state.
- Commits ahead of and behind the intended base or upstream, including the branch used for comparison.
- PR status and review status, or that no PR exists.
- The worker's worktree and branch, including whether local changes or commits remain.
- A disposition for each work item: **keep**, **publish**, or **discard**. For kept work, name its owner and next action. Publish only within user or configured project authorization. Discard only after the responsible owner explicitly resolves it.

Preserve dirty work and unpushed commits until their owner explicitly resolves them. Do not treat a completion report, workspace removal, or session shutdown as permission to discard them. Remove a worker's workspace or branch only after its work is preserved, landed, or explicitly discarded. Limit removal to the responsible worker's resources; do not use project-wide cleanup where unrelated sessions or worktrees could be affected. If work remains parked, report its owner, current state/location, and next action, and leave the workspace/branch available until that handoff is resolved.

For work governed by an active OpenSpec change, update its task and handoff information so the recorded progress agrees with the inventory. Keep cleanup limited to resources owned by this session; coordinate before touching resources owned by another session.

## CRITICAL GIT WORKFLOW RULES

### Workers operating in isolated worktrees

Before declaring finished, creating a PR, or exiting, explicitly stage the task files and create a valid local commit containing them. Never hand off with uncommitted or untracked task files. Do not use `git stash`.

Stage only task-owned paths or hunks. Review `git diff --cached` and `git status` before committing. Keep unrelated user changes out of the commit and intact; when task and unrelated edits share a file, stage only the task's hunks. The closeout inventory should then identify any other parked work, its owner, and next action.

## Orchestrator worktree decisions

The worker commit, clean-handoff, and no-stash requirements above are scoped to workers operating in isolated worktrees; they do not apply to the main orchestrator in the same way. Before deciding whether worker work is current, redundant, or safe to clean up, the orchestrator must fetch `origin main` and compare the worker work against that fresh main tree, which contains merged worker PRs. The orchestrator must not infer main state from a stale worker checkout. Fetch and compare from the orchestrator's current project view, then limit cleanup to the worker's resolved, owned resources.

The initial showcase change migrated the existing approved goal. Completed scope and historical evidence stay in `docs/finished-goals.md`; do not recreate a separate current-goal checklist. Setup does not implement requirements, change production gameplay, or archive unfinished work. Add baseline specs for other existing capabilities incrementally as those areas are changed.
