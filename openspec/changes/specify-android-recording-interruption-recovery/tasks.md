# Tasks

## 1. Pin successful recovery state and route continuity

- [ ] 1.1 Add focused recorder/store tests for interruption recovery: preserve pre-interruption fixes, close the prior segment at its last saved fix, and create a new segment; verify the existing route model keeps the sections disconnected with the focused mobile test command.
- [ ] 1.2 Fix any recovery-boundary defect exposed by those tests without changing activity identity or modifying existing saved fixes; verify the same tests and mobile typecheck pass.

## 2. Preserve outings when service recovery fails

- [ ] 2.1 Add deterministic tests for missing background permission and location-service start failure; verify the outing remains saved and paused, all earlier fixes remain readable, and the failure reason is surfaced.
- [ ] 2.2 Correct the failure path and status feedback where needed; verify the focused failure tests and mobile typecheck pass, including explicit resume after the underlying condition is cleared.

## 3. Verify process interruption in isolated Android replay

- [ ] 3.1 Extend or document a repeatable emulator replay procedure that records fixes, force-stops/reopens the app, and checks recovery status, persisted fixes, and separate route sections without uploading to a field service; verify it against disposable loopback replay data.
- [ ] 3.2 Record the emulator result and its limits in `docs/replay-tool.md`; verify each documented command is accurate and the note does not claim physical-device or outdoor GPS reliability.
