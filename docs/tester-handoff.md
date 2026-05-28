# Tester Handoff Checklist

Use this when preparing a private Android test build for a small group of trusted testers.

## Build Prep

Run the full verification pass:

```sh
npm run verify
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

The generated `.txt` note is meant to travel with the APK. It includes the checksum, private-test warning, basic install notes, and simple feedback prompts for testers.

## Before Sending

- Open the app on the emulator.
- Create a puzzle from a demo image.
- Create a puzzle from a user-style photo in the emulator gallery.
- Use `Hint`, then place a piece and confirm the hint turns off.
- Use `Restart`.
- Use `Solve`.
- Create a `Share Puzzle` link.
- Open the shared puzzle link and confirm it starts in play mode.
- Solve the shared puzzle and confirm `Send One Back` appears.
- Check that the home screen icon and launch splash still look correct.

## Tester Notes

Tell testers:

- This is a private debug build, not a store release.
- Android may warn that the app came from an unknown source.
- They should try their own photos if they are comfortable doing so.
- They should report screenshots, device model, and what they tapped before any issue.

## Feedback To Ask For

- Was choosing a photo obvious?
- Did cropping feel natural?
- Were the puzzle pieces easy to move?
- Did the hint behavior make sense?
- Did the puzzle fit on the screen without awkward scrolling?
- Did share links open and play correctly?
- Did anything feel confusing, broken, or unpolished?

## Not Ready For Public Release

Private sharing is still an MVP. Before a public app-store release, Piczzle needs reporting, deletion/moderation controls, blocking or abuse handling, public terms/privacy text, and clear contact information.
