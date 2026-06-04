# Tester Handoff Checklist

Use this when preparing a private test build or web test for a small group of trusted testers.

For the rollout path and Play Store internal testing notes, see [`android-private-beta-plan.md`](android-private-beta-plan.md).

For a copy/paste message to direct APK testers, see [`manual-apk-tester-message.md`](manual-apk-tester-message.md).

For iPhone, iPad, desktop, or browser testers, see [`web-tester-message.md`](web-tester-message.md).

Track incoming tester feedback in [`feedback-tracker.md`](feedback-tracker.md).

## Build Prep

Run the full verification pass:

```sh
npm run verify
```

Confirm GitHub Pages is serving the current cache-sensitive app files:

```sh
npm run verify:public
```

If an emulator is running, install and launch the current app:

```sh
npm run android:run
```

Create the private-test APK copy:

```sh
npm run android:package
```

The APK, checksum, and short install notes are written to the ignored `release/` folder.

The Android tester invite page is the friendlier path for APK testers:

```text
https://walkaplex.github.io/Piczzle/tester-invite.html
```

The web tester invite page is the best path for iPhone, iPad, desktop, or browser testers:

```text
https://walkaplex.github.io/Piczzle/web-tester-invite.html
```

The generated `.txt` note is a backup if sending the APK or ZIP directly. It includes the branch, commit, working-tree state, checksum, private-test warning, basic install notes, and simple feedback prompts for testers. The generated `.json` file captures the same build identity in a machine-readable form.

## Before Sending

- Open the app on the emulator.
- Create a puzzle from a demo image.
- Create a puzzle from a user-style photo in the emulator gallery.
- Use `Hint`, then place a piece and confirm the hint turns off.
- Use `Restart`.
- Use `Solve`.
- On the completion popup, tap `View Puzzle`.
- Confirm the completed puzzle remains visible and the bottom-right tool button says `Start`.
- Tap `Start` and confirm it returns to the home screen.
- Create a `Share Puzzle` link.
- Confirm the share modal explains that testers should copy the link and include their device model with any report.
- Tap `Share Link` and confirm Android opens the platform sharing options.
- Tap `Copy Link` and confirm the button briefly changes to `Link Copied`.
- Treat missing or stale message-preview thumbnails as a known non-blocker if the shared puzzle URL itself opens.
- Open the shared puzzle link and confirm it starts in play mode.
- Solve the shared puzzle and confirm `Send One Back` appears.
- Check that the home screen icon and launch splash still look correct.

## Tester Notes

Tell testers:

- This is a private debug build, not a store release.
- The tester invite page includes the current APK download.
- The web tester invite page is for iPhone, iPad, desktop, and browser testers.
- Android may warn that the app came from an unknown source.
- They should try their own photos if they are comfortable doing so.
- They can review the current privacy note at `https://walkaplex.github.io/Piczzle/privacy.html`.
- They should report screenshots, device model, and what they tapped before any issue.
- If a shared puzzle looks wrong, they should copy the puzzle link and include it with their report.
- For structured bug reports, use [`tester-report-template.md`](tester-report-template.md).

## Feedback To Ask For

- Was choosing a photo obvious?
- Did cropping feel natural?
- Were the puzzle pieces easy to move?
- Did the hint behavior make sense?
- Did the puzzle fit on the screen without awkward scrolling?
- Did share links open and play correctly?
- Did anything feel confusing, broken, or unpolished?

## Feedback Triage

- Add each report to [`feedback-tracker.md`](feedback-tracker.md).
- Mark unclear reports as `Needs repro`.
- Fix high-severity blockers before polish.
- Batch low-severity visual polish so it does not interrupt core testing.
- Keep tester screenshots out of Git unless they are safe to publish.

## Not Ready For Public Release

Private sharing is still an MVP. Before a public app-store release, Piczzle needs reporting, deletion/moderation controls, blocking or abuse handling, public terms/privacy text, and clear contact information.
