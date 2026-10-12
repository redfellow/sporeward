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

Native directories are generated from Expo configuration. Do not place lasting manual changes in ignored generated directories; use config plugins when native changes become necessary. See [Expo Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).

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

The recorder provides Start/Pause/Resume/Finish, SQLite-persisted fixes, and automatic recovery when reopening an active activity. Paused activities remain paused. Recovery creates a separate route segment to avoid bridging missing travel. Recording pauses after 24 hours until explicit resume or finish. Force-stopping the app can stop GPS; reopening cannot recover missing fixes.

Grant precise location and background location ("Allow all the time") when prompted. Recording uses an ongoing foreground-service notification. Pause stops the location service. Finished activities can be exported as JSON through the system share sheet. Exports contain precise GPS coordinates and timestamps. No recordings are sent to a server.

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

The test backend is deployed separately in WSL2 on port **3101**, bound to `0.0.0.0`. Windows nginx and public HTTPS are managed by the project owner. See [test-server deployment](../ops/test-server/README.md) for container commands, credential handling, and current API limits. The native recorder remains local-only until server integration is implemented.

Deployment verification on 12 October 2026: the container is healthy and listens on `0.0.0.0:3101`. Authenticated health requests returned 200, missing/invalid credentials returned 401, and unknown authenticated routes returned 404. A request from the development Mac to the WSL address also returned 401 without credentials. The project owner configured Windows nginx. Public-domain checks confirmed HTTP redirects to HTTPS, TLS certificate verification succeeds, authenticated `/health` returns 200, and missing/invalid credentials return 401. These checks used the development Mac and WSL host; cellular-network validation remains part of the next outing.
