# Tasks

## 1. Contract alignment

- [x] 1.1 Update the GPS contact section in `docs/game-concept.md` to preserve the 10 metre tolerance and 2 second same-segment inference limit, state that fix accuracy is informational only, and verify it agrees with the capability delta.
- [x] 1.2 Cross-check the shared matcher and historical-footprint path against the new scenarios; verify no runtime changes or data migration are needed, and record any mismatch here before proceeding.
- [x] 1.3 Run `openspec validate define-gps-contact-matching-contract --strict` and verify the proposal, delta, design, and task artifacts validate; do not run project tests.

## Workflow follow-up

- Sync the new capability into `openspec/specs/gps-contact-matching/spec.md` when archiving.
- Archive this change after the spec sync decision.
