# Piczzle

Piczzle turns a photo into a playable puzzle. The web app is the source of truth, and Capacitor packages the same experience for iOS and Android.

## Current focus

- Stable photo-to-puzzle flow with crop, size selection, solving, hint, restart, and solve controls.
- Android packaging and emulator testing through Capacitor.
- Experimental private puzzle sharing built into the main app flow behind the `Share Puzzle` button.

## Common commands

Install packages once:

```sh
npm install
```

Run all project verifiers:

```sh
npm run verify
```

Check the public GitHub Pages deployment when needed:

```sh
npm run verify:public
```

Check the local Android build setup:

```sh
npm run android:doctor
```

Prepare the native web bundle:

```sh
npm run build
```

Copy the current web bundle into Android:

```sh
npx cap copy android
```

Build the Android debug APK:

```sh
npm run android:debug
```

Build, install, and launch on a running Android emulator:

```sh
npm run android:run
```

Create a shareable private-test APK copy in `release/`:

```sh
npm run android:package
```

## Android notes

On this Windows setup, `npm run android:doctor` checks the Android build environment. `npm run android:debug` uses Android Studio's bundled Java runtime for Gradle builds. `npm run android:run` installs and launches the app on the running emulator. `npm run android:package` creates an ignored private-test APK copy with checksum notes in `release/`. The full manual command sequence is documented in [`docs/native-app.md`](docs/native-app.md).

Use [`docs/tester-handoff.md`](docs/tester-handoff.md) before sending a private build to testers.

## Private sharing

Private puzzle sharing uses Supabase for real cross-browser links. The setup, safety limits, and manual smoke test are documented in [`docs/private-sharing.md`](docs/private-sharing.md).

## Branding

The current icon and visual direction are documented in [`docs/branding.md`](docs/branding.md). When branding changes, regenerate the native launcher and splash assets before handing a build to testers.
