# Private Puzzle Sharing

See the root [`README.md`](../README.md) for the short project overview and common command list.

Stage 2 adds real link-based sharing behind a small cloud adapter.

## Current behavior

- If cloud sharing is not configured, Piczzle keeps using the same-device test preview.
- If cloud sharing is configured, `Share Puzzle` uploads the cropped puzzle image and size, then creates a link like:

```text
https://walkaplex.github.io/Piczzle/index.html?puzzle=abc123
```

Opening that link fetches the puzzle package and starts the normal puzzle engine.

Older `share-lab` experiment files may still exist locally while the feature is being folded into the main app. The Capacitor build prep intentionally leaves those lab files out of the packaged mobile app.

The share modal has three actions:

- `Share Link` opens the platform share sheet when the browser or Android WebView supports it.
- `Copy Link` copies the public GitHub Pages puzzle URL.
- `Open Puzzle` opens the received-puzzle flow for quick local testing. In the Android app, this stays inside Piczzle instead of launching Chrome.

If cloud sharing is unavailable, Piczzle keeps a local preview where possible,
disables both sending and copying, and offers Try again. Local preview links are
visible only with `?tester=1`; they are not public puzzle links.

## Supabase setup

### Audit migration order (2026-10-02)

The configured project was resumed on 2026-10-02. Demo upload/download and the
public recipient flow passed. The reader-only migration was then applied with
owner approval. Anonymous exact-ID RPC reads passed, including matching demo
image bytes; missing, wildcard and injection-like IDs returned no rows. The old
exact-ID table read still works. Retain the existing project URL.

For an existing database:

1. Completed: `supabase/install-share-reader.sql` installed only the reader and
   its grants in a transaction. The existing read policy remains temporarily.
2. Deploy the updated web client and provide an updated APK. Reads use the new
   single-id RPC; uploads use `return=minimal`. The client only falls back to
   the old single-id REST read if Supabase reports that the RPC is not installed.
3. Run the complete `supabase/shared-puzzles.sql` to remove the anonymous list
   policy and enforce an 800,000-character limit for new writes. Existing larger
   rows are preserved by a `NOT VALID` constraint. Old cached clients/APKs need
   to update before reading links after this step.
4. Enable Supabase Cron, then review and run `supabase/schedule-share-cleanup.sql`.
   It permanently deletes expired rows daily. This has NOT been run by Codex.
   See [Supabase Cron](https://supabase.com/docs/guides/cron/quickstart).
5. Verify an anonymous `GET /rest/v1/shared_puzzles?select=id` returns no rows,
   while the RPC returns only the requested unexpired puzzle. Never print photo
   contents or API keys during checks. Check the cleanup job in the dashboard.

No environment variables or signing changes are needed. This changes the read
API and database access policy, but preserves ids, photo data and link format.
Rate-limited inserts are still required before a public launch.

1. Create a Supabase project.
2. Open the SQL editor.
3. Run [`supabase/shared-puzzles.sql`](../supabase/shared-puzzles.sql).
4. In Supabase, copy:
   - Project URL
   - anon public key
5. Edit [`js/share-config.js`](../js/share-config.js):

```js
window.PiczzleShareConfig = {
  enabled: true,
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-SUPABASE-ANON-KEY",
  publicBaseUrl: "https://walkaplex.github.io/Piczzle/index.html"
};
```

The anon key is designed to be used in browser/mobile apps. Row-level security is what limits what it can do.

Use the project URL, such as `https://YOUR-PROJECT.supabase.co`. If Supabase shows a REST URL ending in `/rest/v1`, Piczzle will normalize it, but the shorter project URL is cleaner.

## Local verification

Run this before pushing sharing changes:

```sh
npm run verify:sharing
```

The check confirms that the versioned sharing scripts match the service worker cache entries, the Supabase config is not using placeholders, the public share URL points at `index.html`, and REST-style Supabase URLs are still normalized.

To run every current Piczzle verifier before a tester build or release pass:

```sh
npm run verify
```

To check that GitHub Pages is serving the same cache-sensitive files as the current repo:

```sh
npm run verify:public
```

For a full smoke test:

1. Open Piczzle locally or from GitHub Pages.
2. Choose a demo or user photo.
3. Continue to `Puzzle size`.
4. Tap `Share Puzzle`.
5. Confirm the modal says `Puzzle link created`, shows `Unlisted link. Expires after 30 days.`, and keeps `Share Link` enabled.
6. Open the generated URL in a fresh browser tab.
7. Confirm the received puzzle opens directly in play mode with loose pieces.
8. Solve the puzzle and confirm the completion modal says `Puzzle solved` with `Send One Back`.

## MVP safety limits

- Shared puzzles expire after 30 days.
- Shared image payloads are capped in SQL so accidental huge uploads are rejected.
- After the migration, the single-id RPC blocks expired reads and the anonymous table read policy is removed. The separate cleanup job must be applied in the dashboard to delete expired rows daily.
- Reported or unwanted puzzle links can be removed by running `select public.delete_shared_puzzle('PUZZLE_ID');` with a service-role/admin connection.
- IDs are full UUID-style random values and unlisted.
- The current tester reporting path asks testers to copy the puzzle link and include their device model when sending feedback manually. It is not a public moderation queue.
- This is still an MVP. Before public release, add reporting, deletion, moderation policy, contact info, and blocking.

## Future hardening

- Move image data from the database into Supabase Storage.
- Add one-time delete links or sender controls.
- Add abuse reporting before public beta.
- Add accounts and inbox only after link sharing feels good.
