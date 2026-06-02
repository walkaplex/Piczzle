# Android Private Beta Plan

Use this as the practical path from the current private APK to a smoother outside-tester beta.

## Current Test Build

- Current APK: `release/piczzle-debug-20260602-1126.apk`
- Build note: `release/piczzle-debug-20260602-1126.txt`
- Build commit: see the generated `.txt` or `.json` note beside the APK.
- Status: ready for a small trusted Android test group after the handoff checklist is completed.

Send testers both the APK and the `.txt` note. The note tells them what build they have, what to try, and what details to report. If app code changes, run `npm run android:package` again and use the newest files in `release/`.

## What Testers Should Expect Now

- This is a private debug build, not a Play Store install.
- Android may ask them to allow installs from the app they used to open the APK.
- They may see warnings about installing an unknown app.
- Install is usually a few taps, but it is not the same as a Play Store one-click install yet.

## What To Ask Testers To Try

- Open Piczzle and create a puzzle from a demo image.
- Create a puzzle from one of their own photos.
- Try crop and zoom before making the puzzle.
- Try `Hint`, `Restart`, `Solve`, and the completion menu.
- Create a `Share Puzzle` link.
- Open a shared puzzle link on another device or browser if possible.
- Report anything confusing, broken, slow, or awkward.

## What To Collect

- Device model.
- Android version.
- Screenshot or screen recording if something looks wrong.
- What they tapped immediately before the issue.
- The shared puzzle link, if the problem involved sharing.

For structured reports, use [`tester-report-template.md`](tester-report-template.md).

## Move To One-Click Install

For a Play Store-like tester experience, the next stage is a Google Play Console internal testing track. That gives invited testers a normal Play Store install flow.

Before that stage, Piczzle should have:

- A release-signed Android build instead of a debug APK.
- Final app id confirmation: `com.walkaplex.piczzle`.
- Incremented Android version codes for repeat uploads.
- Local upload-key signing variables configured outside Git.
- Store listing basics: app name, short description, icon, screenshots, and contact email.
- Play listing draft: [`play-store-listing-draft.md`](play-store-listing-draft.md).
- Public privacy page: `https://walkaplex.github.io/Piczzle/privacy.html`.
- Public support email and final terms text.
- Supabase updated with the service-role-only shared puzzle deletion helper.

## Current Recommendation

Use the debug APK for the first small trusted test group this week. Move to Google Play internal testing after the core puzzle flow and sharing flow survive a few days of real-device feedback.
