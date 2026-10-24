# Tasks

## 1. Repair archived references

- [x] 1.1 Correct only relative link destinations in the archived `design.md` and `traceability.md`, preserving all link labels and surrounding historical prose; run a scoped check confirming every local target and referenced heading resolves from those two files.
- [x] 1.2 Review the scoped diff to confirm only link destinations in the two named archive files changed, then run strict OpenSpec validation for this change and `git diff --check` for the scoped edits.
