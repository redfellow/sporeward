# Sporeward repository guidelines

## Current scope

Sporeward is in the concept and planning phase. No application stack, package manifests, or build/test commands have been established. Document implementation choices and actual commands when they are introduced.

## Documentation

- `docs/game-concept.md`: design decisions, balancing parameters, development details, and unresolved questions.
- `docs/player-rules.md`: concise player-facing overview and illustrations, followed by detailed rules.
- `docs/tilehunting.md`: background on tile hunting.
- `docs/images/`: concept artwork referenced by the documentation.

Write documentation in English. Keep the concept and player rules consistent when gameplay changes. Preserve user edits and agreed decisions. Remove discarded alternatives and conversational history. Keep tentative balancing values and genuinely open questions clearly identified.

Outbreak artwork illustrates the visual direction, not a fixed set of shape templates. Use relative links for documentation and images, and verify that local references resolve.

## Changes and validation

Keep changes focused on the requested scope. Review staged, unstaged, and untracked files when suggesting commits. Keep editor history and temporary exploration files out of version control. Never commit credentials or local environment files.

For documentation changes, check consistency and links. Once implementation exists, use checks appropriate to the changed behaviour and document how to run them. Do not assume a framework, branching strategy, or release process before one is chosen.
