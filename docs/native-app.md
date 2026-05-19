# Piczzle Native App Setup

Piczzle is still a web app first. The Capacitor setup in this branch lets the same app be copied into native iOS and Android projects without changing the GitHub Pages version.

## What this adds

- `package.json` lists the Capacitor tools and helper commands.
- `capacitor.config.json` names the app, sets the app id, points Capacitor at `www`, and gives the native launch screen a Piczzle background color.
- `scripts/prepare-capacitor.mjs` builds a native-ready copy of the current web app into `www`.
- The build removes the GitHub Pages service worker from the native copy so iOS and Android do not inherit web-only cache behavior.

## First-time setup

Install the JavaScript packages:

```sh
npm install
```

Prepare the native web bundle:

```sh
npm run build
```

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
