# Design

## Context

See [proposal.md](proposal.md) for the motivation and agreed working loop. `AGENTS.md` already points to OpenSpec as the source of active scope, while `docs/openspec-workflow.md` describes the CLI and artifact model. The planned update makes the approval gates and cross-thread handoffs explicit in those two guidance files.

## Goals / Non-Goals

**Goals:**

- Keep `AGENTS.md` as a concise entry point and place the operational sequence and handoff detail in `docs/openspec-workflow.md`.
- Make each transition explicit: explore and clarify; record the plan in repo artifacts; review and accept the plan before apply; obtain independent review; then complete, sync, and archive only after acceptance.
- Explain how rejected review returns to the implementer and implementation ambiguity returns to the explorer for surrounding-document/code inspection or user clarification.
- Require reports to state OpenSpec lifecycle and Git integration separately, including checkout, branch, commit, and push state.

**Non-Goals:**

- Change product behavior, capability requirements, runtime code, field data, or Android map rendering/performance.
- Require every change to have the same owner-acceptance gate; preserve gates already defined by each change and require explicit acceptance where specified.
- Treat OpenSpec archive as merge, commit, push, or Git-main integration.

## Decisions

1. **Use the repository's existing docs-only OpenSpec convention.** Keep the configured `spec-driven` schema and set `skip_specs: true`; no product capability or behavior delta is appropriate for process guidance.
2. **Use two levels of guidance.** Add the short decision sequence and handoff rule to `AGENTS.md`; make `docs/openspec-workflow.md` the detailed procedure, including which available skill applies at each phase. This avoids maintaining two full copies of the workflow.
3. **Keep plan approval before implementation.** The explorer clarifies scope and records the proposal and applicable specs in the repository. The implementer starts apply only after the plan has been reviewed and accepted and works only within the repository and approved change scope.
4. **Keep review independent and route handoffs by role.** A reviewer in a separate worker thread evaluates the completed slice. A rejected review goes back to the implementer with findings; ambiguity that affects implementation returns to the explorer, who inspects adjacent docs/code or asks the user when necessary. The change artifacts carry the durable decisions and next action across threads.
5. **Gate completion and archive on acceptance.** Do not mark the change complete, sync its specs, or archive it until independent review and any acceptance gate in the change are accepted. Use the corresponding available OpenSpec skill for each relevant phase.
6. **Report OpenSpec and Git status independently.** State active/complete/synced/archived status separately from the checkout path, branch, commit state, push state, and whether Git main contains the work. An archived change alone does not establish Git integration.

## Risks / Trade-offs

- **Risk:** The two guidance files drift apart. → Keep `AGENTS.md` to a concise summary that links to the detailed workflow and validate the link after editing.
- **Risk:** Cross-thread handoffs lose context. → Require a durable handoff containing the change/artifacts, decisions, inspected evidence, open questions, review outcome, owner gates, and next action.
- **Risk:** Readers conflate archive with merge. → State the independent Git fields in the workflow and final status-report expectations.
- **Field state and Android map performance:** No runtime or field-state files change, and no Android rendering path is touched; there is no field-state migration or map-performance impact.

## Migration Plan

Edit only `AGENTS.md` and `docs/openspec-workflow.md` when this change is applied. Preserve unrelated edits, verify both documents remain consistent, check local Markdown links, and run strict OpenSpec validation. No runtime migration or rollback is needed.
