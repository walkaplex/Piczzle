# Piczzle Native App Setup

Piczzle is still a web app first. The Capacitor setup in this branch lets the same app be copied into native iOS and Android projects without changing the GitHub Pages version.

## What this adds

- `package.json` lists the Capacitor tools and helper commands.
- `capacitor.config.json` names the app, sets the app id, points Capacitor at `www`, and gives the native launch screen a Piczzle background color.
- `scripts/prepare-capacitor.mjs` builds a native-ready copy of the current web app into `www`.
- The build removes the GitHub Pages service worker from the native copy so iOS and Android do not inherit web-only cache behavior.
- `js/native.js` detects the Capacitor shell, adds native-only styling hooks, hides the launch splash, applies the dark status bar treatment, and enables optional haptic feedback.
- Mobile users now get a `Take Photo` action that opens the device camera through the normal file picker flow.

## First-time setup

Install the JavaScript packages:

```sh
npm install
```

Prepare the native web bundle:

```sh
npm run build
```

Before handing a native build to testers, verify the packaged app copy:

```sh
npm run verify:native
```

This confirms that the native bundle does not include GitHub Pages service-worker wiring, web-only manifest hookup, or old dev-only sharing lab files.

Add native projects when you are ready:

```sh
npm run cap:add:ios
npm run cap:add:android
```

After that, use these commands when the web app changes:

```sh
npm run cap:sync
npm run cap:open:ios
npm run cap:open:android
```

## Windows Android verification

On this Windows setup, Android Studio's bundled Java runtime is the reliable Gradle runtime. From the project root, use this PowerShell flow to build the debug APK without depending on a global `JAVA_HOME`:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:Path="$env:JAVA_HOME\bin;C:\Program Files\nodejs;$env:Path"
$env:GRADLE_USER_HOME='C:\Users\walkm\Downloads\Piczzle-live\.gradle-codex'
npm run build
Push-Location android
.\gradlew.bat :app:assembleDebug --console=plain --quiet
Pop-Location
```

With the emulator running, install and launch the current debug build:

```powershell
$adb="$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb -s emulator-5554 install -r .\android\app\build\outputs\apk\debug\app-debug.apk
& $adb -s emulator-5554 shell am force-stop com.walkaplex.piczzle
& $adb -s emulator-5554 shell am start -n com.walkaplex.piczzle/.MainActivity
Start-Sleep -Seconds 8
& $adb -s emulator-5554 shell pidof com.walkaplex.piczzle
```

The final command should print a process id when Piczzle launches successfully.

## Requirements

- iOS builds require a Mac with Xcode.
- Android builds require Android Studio.
- The GitHub Pages site does not need any of this to keep working.

## App id

The current app id is:

```text
com.walkaplex.piczzle
```

This can be changed before publishing, but it should not be changed casually after the app is submitted to the app stores.

## Icons and splash screens

This setup reuses the current Piczzle app icon as the brand source. The next step is to generate platform-specific icon and splash assets after the native projects exist, then check them in with `ios/` and `android/`.

## Native shell behavior

The web app still runs normally in a browser. Inside iOS or Android, `js/native.js` adds a small native layer:

- the launch splash is hidden after the web view finishes loading;
- the status bar is matched to Piczzle's dark background;
- supported devices get light haptic feedback for selection, moves, restarts, and completion;
- native-only CSS reduces long-press selection and improves tray scrolling.

These features depend on the Capacitor plugins listed in `package.json`. Run `npm install` before the first native sync so the plugins are available to iOS and Android.
