# Play Store Listing Draft

Use this as the starting copy and checklist for Google Play internal testing and later public release.

## App Identity

- App name: Piczzle
- App id: `com.walkaplex.piczzle`
- Category: Game / Puzzle
- Current privacy URL: `https://walkaplex.github.io/Piczzle/privacy.html`
- Support email: `piczzle.support@gmail.com`
- Website: `https://walkaplex.github.io/Piczzle/`

## Short Description

Turn your photos into playable puzzles.

## Full Description

Piczzle turns your own photos into quick, playable puzzles.

Choose a photo, frame it, pick a puzzle size, and start solving. Use demo photos when you just want to try it, or create puzzles from your own gallery images. Piczzle includes simple puzzle controls for shuffling, hints, restarting, solving, saving the completed image, and creating private puzzle links for people you trust.

Current private-test features:

- Create puzzles from demo photos or your own images.
- Frame and zoom photos before creating a puzzle.
- Choose beginner, classic, or challenge puzzle sizes.
- Use hint, restart, solve, and completion actions.
- Save completed puzzle images.
- Create unlisted puzzle links that expire after 30 days.

Piczzle is currently in private testing. Shared puzzle links are intended for trusted testers and friends during this stage.

## Screenshot Plan

Capture these after the next near-final Android build:

- Home screen with demo/photo choices.
- Crop/framing screen.
- Puzzle size screen.
- Active puzzle board with loose pieces.
- Completed puzzle menu.
- Share puzzle modal.

Avoid showing personal photos in public screenshots. Use demo images or staged test images.

## Internal Testing Notes

For a Play Store-like tester install, use Google Play Console internal testing after release signing is configured.

Before uploading:

- Configure local upload-key signing variables.
- Build a signed `.aab` with `npm run android:release`.
- Increment `PICZZLE_VERSION_CODE`.
- Confirm the privacy page is public.
- Confirm `piczzle.support@gmail.com` is monitored for tester and support messages.
- Confirm shared puzzle deletion/moderation process is available in Supabase.

## Content Notes

- Photos are user-selected.
- Shared puzzle links upload compressed image data and puzzle size.
- Shared links are unlisted and expire after 30 days.
- No user accounts are required in the current private-test flow.
- Do not claim public moderation or account controls until they exist.
