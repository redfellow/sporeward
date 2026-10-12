# Sporeward — Development setup

## JavaScript workspace

Install Node.js 24.3 or newer and npm. Run `npm ci` at the repository root to install the locked workspace dependencies, then `npm run check`.

The browser and server use `npm run dev:web` and `npm run dev:server`. Run them separately. Shared packages are linked by npm workspaces; changes do not require publishing them.

## First Android development build

The initial scaffold contains a native welcome screen and shared balance configuration. GPS and maps are not implemented yet.

1. Install Android Studio and follow [Expo's local Android environment guide](https://docs.expo.dev/guides/local-app-development/) to configure a compatible Java development kit, Android SDK, emulator/device tools, and environment paths. Use the SDK required by the installed Expo/React Native versions.
2. Enable Developer options and USB debugging on the phone. Connect it with a data-capable USB cable and accept its authorization prompt.
3. Confirm that `adb devices` lists the phone as authorized.
4. From the repository root, run `npm run android`. This generates the native Android project, builds the development app, and installs it on the selected device.
5. On later sessions, use `npm run dev:mobile` and open the installed development app. Use USB forwarding or a reachable LAN connection if Metro cannot be reached from the device.

Rebuild after adding native libraries or changing native configuration. JavaScript-only changes normally use the running development server. Expo Go is not the testing target for Sporeward's background recording.

The provisional application identifier is `com.sporeward.app`. Confirm it before publishing or configuring external authentication services. No signing keys, store accounts, EAS project, or cloud build have been configured.

Native directories are generated from Expo configuration. Do not place lasting manual changes in ignored generated directories; use config plugins when native changes become necessary. See [Expo Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).

## First recording experiment

The next mobile milestone is a small recorder with Start/Pause/Resume/Stop, persisted timestamped fixes, and recovery. Test it on the Samsung Galaxy Z Fold5 and the Motorola phone, using Android 16 as the initial reported baseline. Confirm their actual OS versions at test time.

Record elapsed time, location timestamps/accuracy, maximum gaps, battery change, and lifecycle events during screen-on, screen-off, background, pause, and offline cases. Repeat with folded/unfolded transitions. Decide pass criteria before declaring background recording reliable.

## Database and maps

PostgreSQL/PostGIS, MapLibre, and a map-data provider are architecture choices but are not installed or connected by the scaffold. Introduce them for the persistent-world milestone after the engine and recording feasibility work establish the required contracts.

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

Terminal environment configuration (`JAVA_HOME`, `ANDROID_HOME`, and SDK paths) and physical-device authorization are still pending. An Android APK has not been built or tested on a device.

`npm audit` reported 22 findings (7 moderate and 15 high) in the Expo/React Native dependency tree. The installed stable versions of `braces` and `node-forge` remain within reported advisory ranges, and another chain involves `xcode`/`uuid`. The suggested automatic fix would downgrade Expo and React Native to incompatible older releases. Review upstream fixes before distribution; do not use `npm audit fix --force` as the scaffold's upgrade strategy. Re-run `npm audit` when updating dependencies.
