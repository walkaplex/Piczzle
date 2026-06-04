# Play Console Internal Testing

Use this when uploading Piczzle to Google Play Console for private internal testing.

## Upload File

Current signed Android App Bundle:

```text
C:\Users\walkm\Downloads\Piczzle-live\release\piczzle-play-internal-20260603-1710.aab
```

Checksum:

```text
C:\Users\walkm\Downloads\Piczzle-live\release\piczzle-play-internal-20260603-1710.aab.sha256
```

## Listing Fields

- App name: `Piczzle`
- App id: `com.walkaplex.piczzle`
- Category: `Game / Puzzle`
- Website: `https://walkaplex.github.io/Piczzle/`
- Privacy policy: `https://walkaplex.github.io/Piczzle/privacy.html`
- Support email: `piczzle.support@gmail.com`
- Short description: `Turn your photos into playable puzzles.`

Use [`play-store-listing-draft.md`](play-store-listing-draft.md) for the full description text.

## Screenshots

Current local screenshot folder:

```text
C:\Users\walkm\Downloads\Piczzle-live\release\play-assets\screenshots
```

Files:

- `01-home.png`
- `02-frame.png`
- `03-size.png`
- `04-puzzle.png`
- `05-share.png`
- `06-complete.png`

These are generated release assets and are intentionally ignored by Git.

## Recommended Play Console Path

1. Create or open the Piczzle app in Google Play Console.
2. Confirm the package name/app id is `com.walkaplex.piczzle`.
3. Complete the basic app setup fields using the listing fields above.
4. Add the privacy policy URL.
5. Add the support email.
6. Upload screenshots from the screenshot folder.
7. Go to the internal testing track.
8. Create a new release.
9. Upload the signed `.aab` listed above.
10. Add internal testers by email.
11. Review and roll out the internal test.

Google's own help describes internal testing as the fastest testing track and says a new Android App Bundle on the internal test track is usually available to testers within minutes.

## Notes

- Internal testing supports up to 100 testers.
- Internal tester feedback does not affect public ratings.
- If the Play Console asks about Play App Signing, use the normal Google Play App Signing flow and keep the local upload key backed up.
- For future uploads, increment `PICZZLE_VERSION_CODE` before building the next `.aab`.
- Do not upload the debug APK to Play Console. Use the signed `.aab`.
