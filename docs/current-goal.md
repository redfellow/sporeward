# Current work and handoff

## Ongoing — Field Labs and Outbreak Resistance

The active implementation is [implement-outbreak-resistance-and-field-labs](../openspec/changes/implement-outbreak-resistance-and-field-labs/proposal.md). Thirteen of fourteen tasks are complete; [task 4.4](../openspec/changes/implement-outbreak-resistance-and-field-labs/tasks.md) awaits owner acceptance of the gameplay and integrated emulator presentation.

The phone visuals accepted on 2026-10-22 close the separate [visual showcase change](../openspec/changes/archive/2026-10-22-replicate-approved-visuals-and-showcase/proposal.md). They do not by themselves accept the Friday reward state or the Field Lab collection/restoration gameplay. No field deployment or outdoor reliability is claimed. A later rendering pass is separate future work.

**Resume with:** repair the emulator review session, launch the isolated Field Labs bench, inspect the Friday reward state plus available/collected lab and confirmed restoration recap, then ask the owner for explicit acceptance. Do not mark task 4.4 complete before that review. The emulator currently displays a blank screen after the latest Metro reload. Temporary feature API port 3113 and Metro port 8082 were stopped; the original port reverses remain (`8081 → 8081`, `3103 → 3120`). Metro is running on 8081 with `EXPO_PUBLIC_TEST_SERVER_URL=http://127.0.0.1:3103`; the isolated API on 3120 is the showcase preview, not the Field Labs bench. No recording was active when checked.

## Pending — Project direction and status documentation

The documentation-only change [align-product-direction-and-project-status](../openspec/changes/align-product-direction-and-project-status/proposal.md) is planned but not implemented (0/7 tasks). Resume from its task checklist; reconcile confirmed product direction, stale project status, open questions and the resumption map without copying the other changes' checklists. Its capability specs are intentionally skipped because it makes no product-behavior change.

Completed evidence stays in [Finished goals](finished-goals.md). Use [OpenSpec workflow](openspec-workflow.md) when selecting or archiving work.
