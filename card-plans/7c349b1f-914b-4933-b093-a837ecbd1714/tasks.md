# Tasks

- [ ] 1.1 Extract the adb, deep-link command and status helpers from `scripts/replay/emulator.mts` into `scripts/replay/emulator-control.mts`, and keep `replay:emulator` working through them.
  - proof: `npx vitest run tests/mobile-replay-bridge.test.ts`
- [ ] 1.2 Add `scripts/maestro/run.mts` and the `maestro:emulator` npm script. It checks that the tools are present (it fails with an install hint for maestro, emulator, adb or a missing AVD), boots the emulator, starts the loopback API, adb reverse and Metro, installs the dev client, runs `tests/maestro/*.yaml` into `artifacts/maestro/`, and stops only what it started. Put the precondition and argument logic in pure functions and cover them with one table-driven fast test, `scripts/maestro/run.test.ts`. Add `artifacts/` to `.gitignore`.
  - proof: `npx vitest run scripts/maestro/run.test.ts`
- [ ] 1.3 Add the flows `tests/maestro/launch-map.yaml`, `field-guide.yaml` and `replay-recap.yaml`, each with `takeScreenshot` steps. The replay flow uses deep links and geo fixes through the runner and a bundled scenario. Add a short README section on how to run them.
  - proof: `node -e "for(const f of require('fs').readdirSync('tests/maestro').filter(n=>n.endsWith('.yaml')))require('fs').readFileSync('tests/maestro/'+f,'utf8').includes('takeScreenshot')||process.exit(1)"`
  - proof: `npm run typecheck --workspace @sporeward/mobile`
- [ ] 2.1 (human) Add the screenshots check to the end of `checks:`.
  file: .harvaaja/checks.yaml
  snippet:
  ```yaml
  - name: screenshots
    run: npm run maestro:emulator
    role: screenshots
    stage: final
    sandbox: none
    paths: ['apps/mobile/**', 'packages/**', 'tests/maestro/**', 'scripts/maestro/**', 'scripts/replay/**']
    timeoutSeconds: 1800
  ```
- [ ] 2.2 (human) Add the field-ride rule to the planner instructions.
  file: .harvaaja/instructions/plan.md
  snippet:
  ```markdown
  - For cards that touch native recording, list under Manual checks after merge: install the field APK (`npm run android:field`) on a phone and ride about 10 minutes, then confirm the outing recorded and uploaded.
  ```

## Manual checks after merge (The user)
- Install Maestro (`curl -Ls https://get.maestro.mobile.dev | bash`) and check that `maestro --version` works for the user who runs härvääjä.
- Run `npm run maestro:emulator` once and look at the screenshots in `artifacts/maestro/`.
