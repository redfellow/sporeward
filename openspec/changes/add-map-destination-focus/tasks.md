# Tasks

## 1. Derive honest target context

- [x] 1.1 Add a pure destination-summary/distance model using current world and existing contact evidence; verify cooldown, conditional bonus, missing offer, provisional/confirmed lab, absent target, polygon-inside and stale-location boundaries with focused tests.

## 2. Add live-map destination focus

- [x] 2.1 Add an app-owned session pin with explicit pin/replace/clear actions and identity reset, preserving it across map/help/history navigation; verify mobile TypeScript and Android JavaScript bundle checks pass without changing recorder or upload behavior.
- [x] 2.2 Add compact target feedback, native highlight and show-target action with normal pan/follow controls; document the feature in player rules and verify the map contains no screen-space geographic overlay or historical-recap target UI.

## 3. Review the slice

- [x] 3.1 Obtain independent implementation review, address blocking findings and pass strict OpenSpec validation plus `git diff --check`; record the precise check scope and remaining acceptance.
- [ ] 3.2 Obtain owner phone acceptance of narrow/wide target summary, direct-distance wording, pan/show-target behavior and return from help/history, separately from implementation checks.

## Workflow follow-up

- The owner accepted this plan and requested the apply skill on 24 October 2026.
- Use focused tests and a JavaScript build. Do not make emulator startup or a new outdoor outing a prerequisite for implementation.
- Existing deferred phone checks for outing history and the native guide remain in their owning changes. Do not mark or archive those checks as part of this work.
