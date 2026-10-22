# Design

## Context

At migration time, the active record consisted of two independent OpenSpec changes: `implement-outbreak-resistance-and-field-labs` (13/14 tasks, with explicit owner acceptance pending) and `align-product-direction-and-project-status` (0/7 tasks). `docs/finished-goals.md` holds the completed implementation evidence. The goal file duplicates only a handoff pointer; it is not the sole home of any active requirements or evidence. The owner's later 4.4 acceptance is recorded in the Field Labs change itself.

## Goals / Non-Goals

**Goals:**
- Make each existing OpenSpec change the source of truth for its requirements, task status, acceptance and resumption details.
- Keep `docs/finished-goals.md` as the historical evidence record and remove the redundant goal index.
- Preserve the two changes' task history and acceptance evidence in their owning artifacts.

**Non-Goals:**
- Combining or replacing either active change, copying their checklists, or changing their task completion states.
- Resolving Field Labs gameplay feedback, accepting visuals, changing product direction, or performing implementation work.
- Reclassifying completed evidence or declaring field, outdoor, phone, or group validation complete.

## Decisions

- **Use the existing changes as the active work index.** README and repository guidance link directly to the relevant change artifacts. This avoids creating another umbrella checklist and keeps each acceptance gate with its owning work.
- **Keep historical evidence in `docs/finished-goals.md`.** Its completed milestones and limitations remain intact; its introductory text will identify the two current changes without restating their tasks.
- **Edit only stale handoff wording in the active changes.** Remove statements that require a `current-goal.md` index, but keep their requirements, decisions, task checkboxes, and recorded evidence unchanged.
- **Leave archived OpenSpec records intact.** Historical references describe the workflow and state at the time; they are not live pointers that need rewriting.

## Risks / Trade-offs

- A reader may not know which active change owns a concern → update entry-point docs to link both active changes and keep replay acceptance linked to its owning change.
- Removing the index could lose active scope if it exists only there → verify the index contains no requirements beyond the two active changes and `docs/finished-goals.md` before deletion.
- An existing task could be mistaken as accepted → preserve the migration-time 13/14 and 0/7 snapshot, then record the later 4.4 owner acceptance in its owning change with its scope and limitations.

## Migration Plan

Update current entry-point and handoff references, adjust only conflicting wording in the two active changes, remove `docs/current-goal.md`, then run strict OpenSpec validation and check all live relative documentation links. The migration is documentation-only and has no runtime rollback step; restoring the deleted index would reintroduce a duplicate pointer.
