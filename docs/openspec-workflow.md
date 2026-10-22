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

The initial showcase change migrated the existing approved goal. Completed scope and historical evidence stay in `docs/finished-goals.md`; do not recreate a separate current-goal checklist. Setup does not implement requirements, change production gameplay, or archive unfinished work. Add baseline specs for other existing capabilities incrementally as those areas are changed.
