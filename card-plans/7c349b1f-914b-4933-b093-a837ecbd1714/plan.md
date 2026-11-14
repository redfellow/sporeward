# Add Maestro device check and field-ride step

## Why
Sporeward's UI and native behaviour can only be proved on an Android emulator or phone, which the agent sandbox can't reach. A final-stage, unsandboxed screenshots check gives cards real emulator images for the visual verdict, with no härvääjä code changes. Background GPS reliability can't be proved on an emulator at all (AGENTS.md:15), so cards that touch recording also get a human field-ride step.

## What Changes
- `.harvaaja/checks.yaml` already exists (#29) with install, typecheck (`npm run typecheck`) and unit (`npx vitest run`). Only a `screenshots` check is added: `role: screenshots`, `stage: final`, `sandbox: none`, the same pattern as härvääjä's Playwright screenshots check.
- `tests/maestro/` has three flows, each taking screenshots:
  1. `launch-map.yaml`: launch the dev client and show the live map.
  2. `field-guide.yaml`: open the field guide from the map, then close it.
  3. `replay-recap.yaml`: a short replay driven by `sporeward://replay/...` deep links and `adb emu geo fix`, ending on the outing recap.
- `scripts/maestro/run.mts` (`npm run maestro:emulator`) starts whatever isn't already running: it boots emulator-5554 from `~/Library/Android/sdk/emulator`, starts the isolated loopback API on 3102 with `adb reverse`, starts Metro with `EXPO_PUBLIC_TEST_SERVER_URL`, installs the dev client with `npm run android:emulator`, and runs the flows into an output folder. Afterwards it stops only what it started. It reuses the adb, deep-link and status helpers from `scripts/replay/emulator.mts`, moved into a shared module.
- If `maestro`, the emulator binary, adb or an AVD is missing, the check fails with a clear install hint. It never passes without screenshots.
- `.harvaaja/instructions/plan.md` gets a rule: plans for cards that touch recording list the step "install the field APK (`npm run android:field`) and ride about 10 minutes" under Manual checks after merge.

## Outcome
- Final-stage check list
  - After: `screenshots`, which shows Maestro images of the map, the field guide and the replay recap

## Acceptance
- The flows parse, and the runner's pure helpers (argument and precondition checks) pass their fast test and the type check.
- On the host, the final-stage screenshots check makes the images for all three flows, or fails with a clear message.

## Citations
- `.harvaaja/checks.yaml`, `scripts/replay/emulator.mts`, `docs/development-setup.md:159`, `AGENTS.md:15`, `apps/mobile/package.json` (android:emulator, android:field).

## Assumptions
- The replay flow uses a short bundled scenario from `scripts/replay/scenarios` rather than a private GPS export.
- Screenshots go to `artifacts/maestro/` (ignored by git), not a tracked folder.
- Maestro is installed by the user (manual step), not by the check, because the check never installs host tools.
- The runner uses the default AVD it finds when emulator-5554 isn't running, and fails if there are none, rather than creating one.
