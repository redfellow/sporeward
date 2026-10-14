# Recorded activity replay tool

The replay tool is being built under [Current goal](current-goal.md). Catalogue and track normalization are available; scenario controls, emulator replay and the living-world integration are still in progress.

## Prepare private sources

Run from the repository root. Catalogue metadata and normalized tracks belong under ignored `work/replay/`; keep the original export in its existing private location.

```sh
python3 scripts/replay/catalog-strava.py /path/to/strava-export --output work/replay/catalog.json
python3 -m venv work/replay/.venv
work/replay/.venv/bin/pip install -r scripts/replay/requirements.txt
work/replay/.venv/bin/python scripts/replay/import-track.py --catalog work/replay/catalog.json --activity ACTIVITY_ID --output work/replay/selected-track.json
```

The catalogue lists activity IDs, modes, calendar dates and available original files. Candidate modes do not guarantee GPS coverage; the importer rejects recordings without timestamped positions. It excludes unrelated profile, social, health and message data from catalogue output. Use original activity files for baseline evidence.

A GPX, TCX, FIT, gzip-compressed variant or finished Sporeward JSON recording can also be imported directly:

```sh
work/replay/.venv/bin/python scripts/replay/import-track.py /path/to/recording.fit --output work/replay/selected-track.json
```

FIT decoding uses the pinned development-only Python dependency `fitdecode`; GPX, TCX and Sporeward JSON use the Python standard library. Native application and server rule code remain TypeScript.

## Timing and provenance

Normalized tracks retain original timestamped fixes, source file hash, recording sections, explicit FIT timer events and a summary of skipped unusable records. Missing positions/time are excluded with counts. Paused FIT records are excluded from active recording coverage; sparse GPS samples alone are preserved as gaps, not converted into claimed user pauses. GPX/TCX track boundaries remain separate. Exact duplicate fixes are removed with a reported count. Conflicting duplicate timestamps or backwards timestamps are rejected for explicit investigation. FIT timer events outside the recorded session are counted and excluded; they do not extend the activity.

Sporeward's activity start/end times are preserved even when the activity ends while paused. The simulation rebases the full timeline to its chosen baseline without changing relative intervals. Speed controls govern execution, not GPS timestamp compression. A virtual simulation clock cannot deliver future events before reaching their scheduled time. Reset restores its baseline and event cursor.

The initial private samples include a paused FIT walk, the recent GPX/phone outing pair and a TCX recording. Their normalization summaries confirm explicit pause preservation and long GPS-gap preservation. These files remain outside version control.

## Accelerated scenario runner

Import the private recent phone outing as `work/replay/field-phone.json`, then run one of the reusable definitions:

```sh
npm run replay -- scripts/replay/scenarios/solo-repeat.json
npm run replay -- scripts/replay/scenarios/group-cleanup.json
npm run replay -- scripts/replay/scenarios/delayed-overlap.json
npm run replay -- scripts/replay/scenarios/group-cleanup.json --interactive
```

The interactive runner supports `start`, `pause`, `resume`, `next`, `advance MINUTES`, `run`, `reset`, `status` and `quit`. A paused runner holds its virtual clock; `next` processes the next scheduled upload, and advancing time processes each upload at its own delivery time before continuing. Clock advancement after the outings finish continues cleaning. Loading a definition starts a fresh disposable run.

Definitions declare a timezone-qualified baseline, random seed, named simulated players, track paths, outing offsets, upload delays, retry counts and a final settling interval. Track paths are resolved relative to the definition file. Source dates are rebased; all relative intervals remain intact. The result shows individual confirmed/potential points, accepted/rejected contacts and current outbreak state.

All scenario effects use the real validation, immutable upload storage and world contribution pipeline in a marked directory under ignored `work/replay/runs/sim-SCENARIO`. Reset removes only that scenario's marked world/activity storage. There is no public API target or shared-field-server reset operation. Contribution identities are deterministic for a given seed and contact, so reset can reproduce complete result objects as well as score totals.

These initial runs still use the five fixed Tampere fixtures. Living geographic lifecycle/PostGIS integration and actual tester authentication are subsequent parts of the active goal; simulated player labels here are not production accounts.

Observed examples with the private 14 October phone outing: the solo/revisit schedule earns 150 visit points for the first and six-hour visits; the intervening visit is on cooldown. Four group riders each earn 100 visit points and a shared 100-point cleanup bonus after phased decay, clearing Hatanpää. The reset test verifies byte-equivalent result data for identical inputs, including contribution identities.

## Normal-speed Android recorder replay

Use the development emulator for this path. Start the persistent disposable API with `npm run replay:server`; it listens only at `127.0.0.1:3102` and stores its marked data under ignored `work/replay/native-server`. Configure its disposable credentials through `REPLAY_USERNAME` and `REPLAY_PASSWORD` (defaults are `emulator` / `emulator-only`), then use the same credentials in the emulator app. These are separate from the field server credentials.

Start Metro from `apps/mobile` with `EXPO_PUBLIC_TEST_SERVER_URL=http://127.0.0.1:3102 npx expo start --dev-client --localhost --port 8081`. Reverse TCP ports 3102 and 8081 onto the emulator with ADB, and open the existing development client against Metro. Do not use the physical phone for synthetic track replay.

```sh
npm run replay:emulator -- work/replay/field-watch.json --from=110 --duration=140
npm run replay:emulator -- work/replay/field-phone.json --upload
```

The runner targets `emulator-5554` by default (`--device=emulator-NNNN` can select another emulator). It refuses physical devices and requires the app's development-only loopback replay bridge. It resets the disposable world before recording unless `--keep-world` is supplied, operates the real Start/Pause/Resume/Finish recorder controls, and optionally uploads through the normal activity pipeline. Ctrl+C finishes the recording without uploading. A private exported recording is saved under `work/replay/native`.

Positions arrive at normal speed using today's recorder clock; source dates do not affect eligibility. Explicit section pauses invoke recorder pause/resume. Sparse source intervals simulate GPS-delivery interruptions, keeping a recovery boundary rather than drawing an invented continuous track. This tests interruption handling, not the full behaviour of a physical receiver losing satellite reception. Native sampling and command latency can differ from the source; the result reports scheduler lateness, fix counts, segments and gaps. Accelerated server scenarios retain the original source timestamps relative to their virtual baseline instead.

The app only accepts replay controls in development builds pointed at the loopback API. The reset endpoint exists exclusively in this isolated marked replay environment; the field API has no corresponding reset route.

A normal-speed 140-second window from the private paused walk completed on the emulator: 29 fixes in two recording sections, preserving the pause/resume boundary, with maximum scheduler lateness of 57 ms. This short recorder check was not uploaded and does not establish minimum-distance eligibility or outdoor GPS reliability. The focused replay timing/reset/gap checks pass; the living-world stage remains unfinished.

The isolated native replay API now starts with the generated 20-outbreak Tampere layout. For the public access snapshot and optional PostgreSQL/PostGIS setup, see [Spatial test world](spatial-test-world.md). Accelerated scenario fixtures and living geographic lifecycle are still being integrated.

Run `npm run replay -- scripts/replay/scenarios/living-tampere.json` for the generated geographic world with group cleanup and replenishment. The other definitions retain fixed fixtures for focused scoring comparisons.
