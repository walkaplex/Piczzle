# Private Puzzle Sharing

Stage 2 adds real link-based sharing behind a small cloud adapter.

## Current behavior

- If cloud sharing is not configured, Piczzle keeps using the same-device test preview.
- If cloud sharing is configured, `Share Puzzle` uploads the cropped puzzle image and size, then creates a link like:

```text
https://walkaplex.github.io/Piczzle/index.html?puzzle=abc123
```

Opening that link fetches the puzzle package and starts the normal puzzle engine.

## Supabase setup

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

## MVP safety limits

- Shared puzzles expire after 30 days.
- IDs are random and unlisted.
- This is still an MVP. Before public release, add reporting, deletion, moderation policy, contact info, and blocking.

## Future hardening

- Move image data from the database into Supabase Storage.
- Add one-time delete links or sender controls.
- Add abuse reporting before public beta.
- Add accounts and inbox only after link sharing feels good.
