# Tasks

## 1. Document session and worktree closeout

- [x] 1.1 Add the concise ownership and safe-closeout lifecycle to `AGENTS.md` and the detailed inventory, disposition and parked-work procedure to `docs/openspec-workflow.md`; verify both documents cover the original safeguards.
- [x] 1.2 Add the `CRITICAL GIT WORKFLOW RULES` for isolated-worktree workers to `AGENTS.md` and `docs/openspec-workflow.md`, requiring explicit staging of task-owned files and a valid commit before finish, PR creation, or exit; verify uncommitted/untracked task files are prohibited at handoff and `git stash` is prohibited.
- [x] 1.3 Add a separate orchestrator section to both documents that requires fetching `origin/main` before judging worker work or cleanup safety and warns against inferring main state from a stale worker checkout; verify the worker-only rules are clearly scoped.
- [x] 1.4 Validate strict OpenSpec structure, local Markdown links and `git diff --check`; inspect the scoped staged diff, explicitly stage only task-owned documentation and planning files, create a valid local commit, and verify commit contents and clean task-owned state without pushing, opening a PR or archiving.
