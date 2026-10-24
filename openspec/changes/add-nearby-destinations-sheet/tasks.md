# Tasks

## 1. Derive comparable destination rows

- [x] 1.1 Add a pure loaded-world list selector sharing destination summaries and numeric polygon-edge distance; verify type filters, available-first ordering, unrounded distances/ties, excluded cleared/expired targets, stale/missing location fallback and current-outing/offer isolation with focused synthetic tests. Keep existing destination-summary tests passing if the helper is refactored.

## 2. Add the live-map sheet

- [x] 2.1 Add Nearby entry, All/Outbreaks/Field Labs filters, bounded virtualized sections, snapshot/error context and distinct empty/location states; verify mobile TypeScript and Android JavaScript export, and inspect that list work is independent of camera frames and adds no network/GPS loop.
- [x] 2.2 Connect row selection to current details and existing explicit pin/replace, coordinate card visibility, close/Back and identity resets, and update player rules; verify vanished-target handling and source paths preserve the pin, recording controls, historical-map exclusion and existing native highlight/camera behavior. Check documentation links and record focused integration evidence without claiming phone acceptance.

## 3. Review and accept the slice

- [x] 3.1 Obtain independent implementation review against this change, resolve blocking findings, and pass strict change validation plus `git diff --check`; record actual checks, dependency/branch state and remaining phone acceptance in the handoff.
- [ ] 3.2 Obtain owner phone acceptance on narrow/wide layouts: sheet readability and scrolling, filters/status/distance wording, row-to-details-to-pin flow, Back dismissal, preserved map/pin and accessible pause/finish controls during recording. Record it separately from automated checks and prior changes' phone gates.

## Workflow follow-up

- The owner approved the plan and requested apply on 24 October 2026. Implementation branch `feat/nearby-destinations-sheet` is stacked on `ac7f331` while PR #25 remains open; preserve the dependency explicitly.
- Prefer focused synthetic tests, mobile typecheck and Android JavaScript export. Emulator startup and another outdoor outing are not implementation prerequisites; builds do not satisfy task 3.2.
- Preserve the current destination-focus, history and guide acceptance tasks. Do not sync/archive this change until its independent review and owner acceptance pass.
- Commit, push and PR creation remain separate user-authorized steps.
