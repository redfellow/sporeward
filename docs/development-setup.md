# Sporeward — Development setup

## JavaScript workspace

Install Node.js 24.3 or newer and npm. Run `npm ci` at the repository root to install the locked workspace dependencies, then `npm run check`.

The browser and server use `npm run dev:web` and `npm run dev:server`. Run them separately. Shared packages are linked by npm workspaces; changes do not require publishing them.

## First Android development build

The native app contains a local GPS recording experiment. Recorded-route maps and recaps are implemented; outbreak gameplay is not connected yet.

1. Install Android Studio and follow [Expo's local Android environment guide](https://docs.expo.dev/guides/local-app-development/) to configure a compatible Java development kit, Android SDK, emulator/device tools, and environment paths. Use the SDK required by the installed Expo/React Native versions.
2. Enable Developer options and USB debugging on the phone. Connect it with a data-capable USB cable and accept its authorization prompt.
3. Confirm that `adb devices` lists the phone as authorized.
4. From the repository root, run `npm run android`. This generates the native Android project, builds the development app, and installs it on the selected device.
5. On later sessions, use `npm run dev:mobile` and open the installed development app. Use USB forwarding or a reachable LAN connection if Metro cannot be reached from the device.

Rebuild after adding native libraries or changing native configuration. JavaScript-only changes normally use the running development server. Expo Go is not the testing target for Sporeward's background recording.

The provisional application identifier is `com.sporeward.app`. Confirm it before publishing or configuring external authentication services. No distribution signing keys, store accounts, EAS project, or cloud build have been configured. Local test APKs use the generated debug signing key.

The local `with-android-toolchain` Expo plugin pins Gradle daemon criteria to JDK 17, including builds launched from Android Studio. Studio can otherwise generate criteria for its bundled newer JDK that override `JAVA_HOME` and break Android native packaging.

Native directories are generated from Expo configuration. Do not place lasting manual changes in ignored generated directories; use config plugins when native changes become necessary. See [Expo Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).

## Fast emulator workflow

Use the emulator for UI, recording controls, pause/resume, recap, export, recovery, and upload error/retry checks. Use the real phone for GPS accuracy, screen-off reliability, battery use, folding, and manufacturer-specific background behaviour.

1. Open Android Studio's Device Manager and start the installed **Medium Phone API 37.0** emulator. The first cold boot can take several minutes. Check `adb devices`; the commands below target `emulator-5554`, so adjust the serial if another emulator is already running.
2. Build/install the development client once with `npm run android:emulator`. This also starts Metro. Keep the phone on its standalone field build.
3. On later sessions, run `adb -s emulator-5554 reverse tcp:8081 tcp:8081`, then `npm run dev:mobile:local`. Open Sporeward's development client using `http://127.0.0.1:8081`. Metro serves JavaScript locally; the emulator does not need LAN access to the development server.
4. Save a TypeScript/React change to use Fast Refresh. SQLite recordings survive refreshes; component state may reset. For changes to Kotlin, native dependencies, permissions, schemes, or module configuration, rebuild the development APK. The recording notification module lives in `apps/mobile/modules/recorder-notification`, outside the generated Android directory.
5. Use the emulator's Extended Controls → Location for synthetic GPS routes. Synthetic tests verify control flow, not outdoor GPS reliability. Keep them on the emulator and avoid uploading them to the shared test server unless explicitly running a server test.

Run `npm run check` for shared rules, recording storage, control routing/recovery, client retry behaviour, and server persistence. Use `npm run check:android -- path/to.apk` to inspect native permissions. Build a standalone field APK for every outing; the development client requires Metro.

## Standalone Android field build

Use this build for outings instead of the Metro-dependent development build:

```sh
npm run android:field
```

The command builds the release variant with embedded JavaScript, selects an authorized device, and installs it. It needs no EAS account or cloud build. Prefer USB while connected; if it is absent, connect wireless ADB and select the same phone. Java/SDK environment variables must be available in the shell.

The APK is at `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`. This is an internal test APK signed with the generated debug key, not a store release. It uses the same application ID and signing key as the development app, so installing it as an update preserves local recordings. Do not uninstall the app when switching builds. Code changes require another field build; Metro hot reload only applies to the development variant.

Recording, persisted activity recovery, saved recaps, and route-only rendering work without a development server. The street basemap uses [OpenFreeMap’s public Liberty style](https://openfreemap.org/quick_start/); internet access is needed for uncached map resources. If the style fails or times out, the map falls back to a locally defined route-only view. No offline basemap download has been implemented. Map requests expose the viewed area to the tile provider; Sporeward does not upload the GPS recording itself.

## Route map and recap

The map initially shows Tampere, then fits the first recorded location. Use **Fit route** to frame the full route after more travel. Green lines show recorded sections; pink dashed lines mark within-section GPS gaps longer than two seconds. No line is drawn across an explicit pause or known interruption. These gap connectors visualize missing coverage rather than validated travel or outbreak contacts.

Finish an activity to see its recap. Tap a recent saved activity to review it, then use **Export this activity** for JSON containing timestamped fixes, section boundaries, diagnostics, and summary statistics. Recording time excludes pauses and known recovery gaps. Raw GPS distance includes drift and straight-line estimates across missing fixes, and is not the gameplay minimum-distance validator.

## First recording experiment

The recorder provides Start/Pause/Resume/Finish, SQLite-persisted fixes, and automatic recovery when reopening an active activity. Paused activities remain paused. Recovery checks both Expo task registration and the actual Android location foreground service, restarting it when needed. A known interruption creates a separate route segment to avoid bridging missing travel. Recording pauses after 24 hours until explicit resume or finish. Force-stopping the app can stop GPS; reopening cannot recover missing fixes.

Grant precise location and background location ("Allow all the time") when prompted. Allow notifications when prompted so the ongoing recording notification is visible. It shows recording time and raw GPS distance with **Pause** and **Finish & save** controls. A paused notification provides **Resume** and **Finish & save**, while GPS collection is stopped. Controls open Sporeward and apply the action to that outing; stale controls cannot change a later outing. Finishing removes the recording notification. Android can allow users to dismiss ongoing notifications, so visibility also depends on system settings. Pause stops the location service. Finished activities can be exported as JSON through the system share sheet. Exports contain precise GPS coordinates and timestamps. Recordings are sent to the test server only through the explicit upload flow described below.

The app requests one-second fixes but Android delivery is not guaranteed. It shows raw GPS distance (including drift), fix count, latest accuracy, longest within-segment gap, and gaps over two seconds. These are feasibility diagnostics, not validated gameplay distances.

First field test:

1. Start outdoors; move for five minutes with the screen on and confirm fixes arrive.
2. Lock the screen for ten minutes while moving, then reopen and inspect GPS gaps.
3. Pause for two minutes, move while paused, then resume. Paused travel must not be joined into distance.
4. Repeat offline, folded/unfolded, and after Android removes the app.
5. Finish and export each recording. Note device/OS, conditions, and battery percentage before and after.

Use the standalone field build for this test. It bundles JavaScript and does not require Metro or home Wi-Fi to launch. The development build still requires Metro.

Initial gate: no unexplained recording loss during the ten-minute screen-off test; no distance bridge across pause/recovery; fixes survive reopening. Background reliability remains unverified until device tests pass.

Test it on the Samsung Galaxy Z Fold5 and the Motorola phone, using Android 16 as the initial reported baseline. Confirm their actual OS versions at test time.

Record elapsed time, location timestamps/accuracy, maximum gaps, battery change, and lifecycle events during screen-on, screen-off, background, pause, and offline cases. Repeat with folded/unfolded transitions. Decide pass criteria before declaring background recording reliable.

## Database and maps

The recorder uses SQLite for on-device storage and MapLibre React Native for route rendering. OpenFreeMap supplies the online basemap. PostgreSQL/PostGIS, authoritative outbreak geometry, and server persistence remain to be implemented.

## Dependency status

On 12 October 2026, workspace typechecks, the server health test, the browser entry smoke check, Expo dependency validation, and all 21 Expo Doctor checks passed.

The local Android tools have now been installed and verified:

- Android Studio for Apple Silicon.
- Azul Zulu JDK 17.0.20.1, including `javac`.
- Android SDK Platform API 36, including `android.jar`; additional 36.1 and 37 platforms are also installed.
- Android SDK Build-Tools 36.0.0.
- Android SDK Platform-Tools, with working ADB 37.0.1.
- Android SDK Command-line Tools (latest).
- Watchman 2026.10.05.00.

Java and Android SDK environment paths are configured in the local shell and verified in a new interactive session. The Galaxy Z Fold5 is authorized over USB and wireless ADB. Prefer USB while the cable is connected; use wireless ADB when it is absent. Wireless discovery/connection ports may change between sessions.

The first Android development APK was built, installed, and launched on the Galaxy Z Fold5 over USB on 12 October 2026. Metro successfully served the Android JavaScript bundle and the app process was confirmed running. This verifies the native scaffold and shared-package bundling, not background GPS or gameplay. The build also installed NDK 27.1.12297006 and CMake 3.22.1 automatically. The recorder build was also installed and its JavaScript bundle loaded successfully on the Fold5. Workspace typechecks and recording storage tests passed, including real SQLite checks for pause filtering, duplicate fixes, and recovery deadlines. GPS permissions and real screen-off recording still need field validation. Generated native projects, APKs, and local signing files remain ignored.

`npm audit` reported 24 findings (8 moderate and 16 high) in the Expo/React Native dependency tree. The installed stable versions of `braces` and `node-forge` remain within reported advisory ranges, and another chain involves `xcode`/`uuid`. The suggested automatic fix would downgrade Expo and React Native to incompatible older releases. Review upstream fixes before distribution; do not use `npm audit fix --force` as the scaffold's upgrade strategy. Re-run `npm audit` when updating dependencies.

## WSL2 test API

The test backend is deployed separately in WSL2 on port **3101**, bound to `0.0.0.0`. Windows nginx and public HTTPS are managed by the project owner. See [test-server deployment](../ops/test-server/README.md) for container commands, credential handling, and current API limits. The recorder now includes a Test server panel for authenticated HTTPS health checks. Finished activities can now be explicitly uploaded in retryable batches. World/contact matching is not implemented.

Deployment verification on 12 October 2026: the container is healthy and listens on `0.0.0.0:3101`. Authenticated health requests returned 200, missing/invalid credentials returned 401, and unknown authenticated routes returned 404. A request from the development Mac to the WSL address also returned 401 without credentials. The project owner configured Windows nginx. Public-domain checks confirmed HTTP redirects to HTTPS, TLS certificate verification succeeds, authenticated `/health` returns 200, and missing/invalid credentials return 401. These checks used the development Mac and WSL host; cellular-network validation remains part of the next outing.

### Configure the mobile test connection

In the app’s **Test server** panel, tap **Configure**, enter the current tester username/password from the private server environment file, and save. Tap **Check connection** to verify `https://sporeward.redlan.co/health`, including over cellular during an outing. Settings survive app updates and restarts through Expo SecureStore; they are excluded from Android backup. Credentials are not embedded in the APK, included in route exports, or logged. Use **Forget credentials** to remove them, or configure again after a server credential change.

Connection checks are explicit and time out after eight seconds. Offline access, rejected credentials, and rate limits are displayed separately; none blocks local recording. The connection panel checks connectivity only. A separate Upload recording action sends finished recordings; eligible uploaded contacts now award points through the encounter slice.

The connection-panel field APK was built and installed on the Fold5 on 12 October 2026. All 25 workspace tests pass, and the same client request code successfully authenticated against the public HTTPS health endpoint from the development machine. Native credential entry/persistence and cellular connectivity still need verification on the phone.

### Upload a finished activity

Finish the recording, review its recap, and choose **Upload recording**. Confirm that its precise GPS locations and timestamps will be sent to the test server. Uploads use 1,000-fix batches, with progress and a final receipt. Offline failures leave the local recording intact and save a pending state; retry explicitly when connected. There is no automatic background upload yet.

The server validates batch shape, coordinates, ordered timestamps, section membership, and counts. Identical batches and repeat completion are idempotent; changing already-uploaded content for the same ID returns a conflict. Partial uploads survive server restarts in a Docker volume. Each recording is capped at 100,000 fixes and 256 sections for this test service. Receipts distinguish stored diagnostics from basic game eligibility: at least 500 metres of GPS coverage and receipt within 24 hours of activity completion. Distance does not bridge pauses or GPS gaps over two seconds. These checks are not complete anti-cheat. Eligible uploads additionally pass timestamped outbreak-contact matching in the fixed encounter slice. Ineligible test recordings can still be stored for inspection.

Eligible outbreak contacts now contribute cleaning and points. Keep local recordings/exports during field validation; the broader geographic lifecycle is still being developed.

Upload verification on 13 October 2026: all 32 workspace tests pass. The deployed HTTPS API accepted 1,001 synthetic fixes in two batches, returned an identical receipt on retry, and preserved that receipt through a container restart. The synthetic fixture was removed after verification. The updated standalone APK was built, installed over USB on the Fold5, and launched without reported JavaScript or Android runtime errors. No real outing was uploaded by the development agent.

### Android persisted-job permission

Expo TaskManager schedules persisted jobs for location updates. Android requires `android.permission.RECEIVE_BOOT_COMPLETED` for those jobs; omitting it crashes the native receiver when a location update arrives. This permission is explicitly declared in Expo configuration so generated native projects retain it. It does not create a new activity or change the manual Start/Pause controls. Run `npm run check:android` against each built field APK to verify packaged location/service/job permissions; workspace JavaScript tests do not inspect native manifests.

## Recording delivery diagnostics

Version 3 JSON exports include activity-specific `diagnostics`: app-state transitions, service start/recovery, notification actions, and each location batch. Batches store callback receipt time separately from the first/last GPS source timestamps, oldest/newest delivery lag, within-batch gaps, and the source-time gap from the preceding fix in the current section. These diagnostic records do not add coordinates beyond the existing exported GPS track. They are retained locally and included in JSON exports; the current activity upload API does not upload them.

A long source-time gap suggests missing samples; old source timestamps arriving together suggest delayed delivery. Negative lag can indicate timestamp/clock differences. React Native app state identifies foreground/background, not exact screen-lock state. Diagnostics are observations, not proof of why Android delayed a callback, and do not change scoring or validation.

For tomorrow's cycling test: allow notifications; check increasing time/distance; lock the screen while riding; use notification Pause, wait/move, then Resume; finish from the notification and check the saved sections. Note battery before/after and approximate screen-off times. Upload the recording and separately export its diagnostic JSON. Preserve today's walk when installing the APK as an update.

## Recorder controls verification — 13–14 October 2026

The API 37 emulator development build loaded through Metro, and a JavaScript copy change appeared through Fast Refresh without rebuilding the APK. Actual notification taps were verified for Pause, Resume, and Finish. Pause stopped GPS collection; Resume created a new section; Finish saved the outing, stopped the foreground service, and removed its notification. A synthetic route increased notification distance from roughly 0.01 km to 0.14 km. Force-stop/reopen preserved fixes and restored the actual foreground service in a separate recovery section, without resetting the recording deadline.

The tests found and fixed native intent routing, concurrent SQLite writers, and recovery relying only on a retained Expo task registration. Recording publication also waits for the real location-service notification instead of briefly adding a duplicate. Structured diagnostics captured app-state transitions, control actions, recovery reasons, GPS source gaps, and delivery lag. These checks verify control flow; real cycling GPS/battery behaviour remains tomorrow's field test.

The standalone field APK also passed cold-launch Finish: the requested outing was saved before automatic recovery could create another section, and its GPS foreground service and recording notification were absent afterward. The final standalone APK was installed as an update on the Fold5. The emulator was returned to the development client for subsequent Fast Refresh work.

## First outbreak encounter

The app now loads a persistent five-zone Tampere test world, shows activity-specific contacts and a provisional tally, and obtains a confirmed recap through finished-activity uploads. See [First outbreak encounter](first-outbreak-encounter.md) for locations, implemented rules, API persistence and the field checklist. Cached map data works offline; changes to shared world state are applied when the activity is uploaded.

For emulator-only encounter development, run a separate local API with disposable data and tester credentials. Set `EXPO_PUBLIC_TEST_SERVER_URL=http://127.0.0.1:3102` when starting Metro, then run `adb -s emulator-5554 reverse tcp:3102 tcp:3102`. This override is accepted only in development builds and only for loopback HTTP; standalone field builds always use `https://sporeward.redlan.co`. Use separate local tester credentials in the emulator. Synthetic visits must not alter the shared field-test world.
