# Tasks

## 1. Repository workflow guidance

- [x] 1.1 Update `docs/openspec-workflow.md` with the explore/clarify → repository proposal/spec → plan review → repository-scoped apply → independent review → accepted completion/sync/archive sequence; document rejected-review and implementation-ambiguity handoffs across worker threads, and verify each gate and handoff is stated explicitly.
- [x] 1.2 Add the concise loop and a link to `docs/openspec-workflow.md` in `AGENTS.md`; verify the link resolves and the summary agrees with the detailed procedure.
- [x] 1.3 Run strict OpenSpec validation, check local Markdown links for both guidance files and `git diff --check`; verify only the two intended guidance files changed.
- [ ] 1.4 Obtain independent review in a separate worker thread, route any rejection back to the implementer, address findings, and return for acceptance; verify the review is explicitly accepted before marking this task or the change complete.

## Workflow follow-up

- OpenSpec specs are intentionally skipped because this changes process documentation only; there is no capability delta to sync.
- After independent review and any applicable owner acceptance, complete task tracking and archive the change. Report OpenSpec status separately from checkout, branch, commit, push, and Git-main integration status.
