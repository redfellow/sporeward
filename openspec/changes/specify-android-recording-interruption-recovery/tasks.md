# Tasks

## 1. Pin successful recovery state and route continuity

- [x] 1.1 Add focused recorder/store tests for interruption recovery: preserve pre-interruption fixes, close the prior segment at its last saved fix, and create a new segment; verify the existing route model keeps the sections disconnected with the focused mobile test command.
- [x] 1.2 Review and centralize recovery-boundary handling without changing activity identity or existing saved fixes; no behavioral defect was found, and the focused tests plus mobile typecheck pass.

## 2. Preserve outings when service recovery fails

- [x] 2.1 Add deterministic tests for missing background permission and location-service start failure; verify the outing remains saved and paused, all earlier fixes remain readable, and the failure reason is surfaced.
- [x] 2.2 Show a clear saved-and-resumable message on service-start failure and verify the focused failure tests and mobile typecheck pass, including explicit resume after permission is restored.

## 3. Verify process interruption in isolated Android replay

- [ ] 3.1 Extend or document a repeatable emulator replay procedure that records fixes, force-stops/reopens the app, and checks recovery status, persisted fixes, and separate route sections without uploading to a field service; verify it against disposable loopback replay data.
- [x] 3.2 Document the interruption-replay command, its assertions, the failed emulator startup attempt, and the limits; verify it makes no physical-device or outdoor reliability claim.
