# Audit Fix Status

Implementation date: 2026-10-02. Source: PRODUCT_FINISHING_PLAN.md.
The checkpoints below record implementation and verification as they happened.
See the latest rollout update at the end for current production status.
The audit's embedded implementation prompt was treated as a suggested work package,
not as the user's request or a restriction to a single fix.

## Implemented

- F-04: preserve measured frame dimensions when the Frame screen is hidden.
  Re-layout the crop on visible frame resize/orientation changes. Preserve intended
  zoom-out letterboxing. Regression checks cover five frame widths.
- F-05: completion sharing uses the exact puzzle image, then the usual compacting
  step. Recipient completion does not offer re-sharing someone else's photo.
- F-06: failed uploads retain the previous photo and report an error. Large uploads
  are downscaled to at most 2400 px on the long edge. Concurrent uploads keep only
  the newest result, and same-file selection remains supported.
- F-07: saves use the original puzzle bytes instead of rebuilding upscaled tiles.
  The file is prepared on solve, before an iOS user gesture. Cancellation and errors
  have separate messages. Android below API 29 shares a cache file using the existing
  FileProvider instead of attempting an unpermitted public-storage write. Failed
  modern MediaStore writes clean up their newly allocated row.
- F-08, partial: tile images use short Blob URLs, released when replaced/discarded.
  The duplicate full-board hint is no longer displayed. Persistent DOM updates and
  phone performance measurements remain future work.
- F-09: dependency-free image/sharing regression checks now run as part of verify.
  verify:public additionally checks the live single-id reader without fetching photos.
- F-11: Android Back uses the existing AndroidX dispatcher (no new dependency).
  It cancels/dismisses the top dialog, preserves the puzzle when returning to Size,
  then goes to Frame and Upload. Only Upload sends the task to the background.
  The timer counts only while play is visible and the app is active. Reopening the
  existing task preserves progress; process-kill recovery is not implemented.
- F-15: Feedback is available during setup, play and completion and includes the app
  version, browser information and puzzle statistics in the email draft.
- F-17/F-22: setup uses full-page scrolling at phone widths, including Frame and Size.
  Panel content remains visible, without an internal scroll trap. The decorative
  pseudo-element causing horizontal overflow is disabled. Branding is preserved.
- F-19: Solve, a Restart with progress, and Start Over with progress request confirmation.
  Play Again remains a direct action after completion. Auto-solve has truthful copy,
  no completion statistics or celebration.
- F-20: focusable step buttons, labelled keyboard-operable board squares, stable piece
  identities, dialog roles/focus/Tab confinement/Escape, announced toasts, focus rings
  and reduced motion. A 4x4 was completed using only keyboard placement.
- F-27/F-28, partial: correct JPEG Open Graph MIME, tester-only recipient preview,
  disabled send/copy on sharing failure, Retry action, updated privacy text, extended
  cache-version checks, and removal of invite pages from the service worker precache.
- F-10/F-28, local release preparation: setup footer displays the same build identifier
  included in feedback. release.md documents sequential builds, deployment gates,
  cache bumps, APK distribution and rollback. Packaging records the app identifier
  and latest-debug.json; verify:play rejects stale identifiers/mismatched checksums
  instead of accepting the June APK just because it exists. Tester docs now reflect
  the recipient intro and Back to Start wording. No invitation download was changed.

## Prepared, Not Applied to Production

Client follow-up: share downloads retain the 12-second deadline through JSON body
consumption, rather than clearing it at headers. Only a missing RPC enables the
transitional reader; permission failures still fail. No API/data/schema/config change
was made in this follow-up. Offline navigation now tries the requested cached page
before the app fallback, so the cached Privacy page opens instead of the start screen.
Network-first navigation and asset caching behavior otherwise remain unchanged.

F-01/F-03: shared-puzzles.sql removes the anonymous list policy, adds a single-id RPC,
uses an 800,000-character cap for new writes, and preserves existing larger rows.
The client uses minimal insert responses and has a narrow transitional reader fallback.
schedule-share-cleanup.sql contains a reviewed daily expiry cleanup job.

Database access and the read API change. Existing ids, stored images and link formats
are preserved. Cleanup permanently deletes only expired rows when explicitly applied.
No environment variables, credentials or signing changes are required.

F-02 remains blocked: the configured Supabase hostname fails DNS lookup (ENOTFOUND).
Restore the project and follow the client-first migration order in private-sharing.md.
No claim is made that live photo enumeration or automatic deletion is fixed yet.

## Verification

- npm run verify: passed (config, image regressions and Capacitor package checks).
- npm run android:debug: compiled a debug APK; no signing configuration changes.
  Installed the refreshed build on the Pixel_8 Android 15/API 35 emulator.
  The initial concurrent packaging attempt collided with verify's generated www;
  rerunning the build alone passed. No packaging code change was needed.
- npm run android:package: built release/piczzle-debug-20261002-2143.apk with checksum,
  text/JSON notes and latest-debug.json in ignored release/. Installed that exact
  package; the API 35 emulator shows Build 20261002-release1. Source remains dirty.
- npm run verify:play: current package identity/checksum and note passed; one expected
  Play signing blocker remains, with version-code and dirty-source warnings. Targeted
  fixture checks passed for valid, stale, checksum-mismatched and missing packages.
- Browser: build footer checked at 375x667 and desktop 1280 width; no horizontal
  overflow or nested upload scrolling. Real iPhone footer verification remains manual.
- Follow-up package: release/piczzle-debug-20261002-2159.apk, build 20261002-network1,
  compiled, checksum verified and installed in the API 35 emulator. latest-debug.json
  points to it. The earlier release1 APK is no longer the latest package.
- npm run verify includes new offline-cache checks. Sharing fixtures cover a stalled
  response body, corrupt JSON, empty/expired ids, permission rejection and missing-RPC
  migration fallback. All passed; this is not a live database policy test.
- Browser offline check: isolated production-style /Piczzle/ preview with its server
  network unavailable reopened the app, loaded demo images, created a 4x4 and placed
  pieces. Updated build also passed at 390x844 with Hint feedback. Cached Privacy
  navigation displayed the real Privacy page. The isolated preview was then removed.
- npm run verify:public with one attempt: failed as expected because the live site
  serves 20260705-ux4 and the configured sharing backend is unreachable.
- Browser: setup controls reachable at 320x568, 375x667, 390x664, 430x932; no horizontal
  overflow or nested panel scroll. Desktop layout checked at 1280x800.
- Browser: demo -> frame -> create -> full keyboard solve -> completion -> View Puzzle;
  correct image with no visible fill bands, persistent Back to Start, usable dialogs,
  sharing failure with no copyable broken link, and no unexpected console errors.
- Browser Save opened the share path. Android API 35 Save wrote a 1200x900 JPEG to
  Pictures/Piczzle, confirmed by the file and MediaStore entry. Real iPhone photo
  placement, screen readers, physical Android devices and older Android saves are
  not verified.
- Emulator Back cancelled Restart with one placed piece intact, navigated through
  Size -> Frame -> Upload, backgrounded the task, and resumed the same piece/move
  count through Play. Automated checks also cover hidden/background timer pausing.
- Node regressions check crop draw geometry, not JPEG edge pixels on a real device.
  No live Supabase RLS or cleanup validation was possible.

## Still Pending

- M2/M3 visual direction, font/palette changes, stylesheet consolidation, merged setup
  steps, reward-sheet redesign, tray gestures and optional 8x8 enlarged targets require
  product/design review. No design direction was selected on the owner's behalf.
- Process-kill recovery (optional resume feature) and the remaining Android API matrix.
- Publish the new tester APK through Releases and update the invite download only
  after release distribution is selected. No binaries were added to version control.
- Insert rate limiting before a public launch; private friends/family testing first.
- Real-device/iPhone offline/PWA, screen-reader, contrast and performance acceptance checks.

## Rollout and Manual Checks

Current local app/share-cloud queries: 20261002-network1; dialog/main CSS retain
20261002-release1 and other changed assets retain 20261002-fixes.
Service worker cache: piczzle-app-v44.
Keep index.html and sw.js references identical; verify:sharing checks them.

1. Supabase and the new reader are ready (see update below); deploy updated clients before
   removing the old read policy. Follow private-sharing.md for the remaining SQL.
2. After deployment, run verify:public. Reopen installed PWAs to receive cache v44.
3. On iPhone Safari/PWA and desktop, choose a demo, adjust zoom/drag, continue and create.
   Check all difficulty levels and compare the board against the framed photo.
4. Upload a photo twice, try a corrupt file, then a large photo. Check the current
   photo survives errors and thumbnails remain visible with normal page scrolling.
5. Check Hint, keyboard placement, confirmation Cancel/Escape, normal completion,
   auto-solve, View Puzzle/Back to Start, Save/cancel and Feedback.
6. Once restored, send a puzzle to another device. Check intro -> solve -> Send One
   Back. Check expired links, failed sharing/Retry and anonymous enumeration protection.
7. Install the fresh APK and check save/share/feedback and hardware Back on a device.
   Check background/reopen retains the puzzle and does not add time while away;
   repeat saves on API 26/29/34 before claiming full Android coverage.

Rollback: revert the implementation, use a new higher service-worker cache name,
keep asset query strings aligned, redeploy, and run verify:public. Database policy
rollback is separate; do not restore broad photo-listing access casually.

## Sharing Restore Update - 2026-10-02

- Owner approved resuming the existing Piczzle project; resume was submitted in the
  Supabase dashboard. Its configured API is reachable again.
- A public demo-only test puzzle uploaded and downloaded successfully through the
  current local share client, with matching image bytes and difficulty. Its public
  link opened the recipient introduction and a 16-piece puzzle in the browser.
- Initially the new get_shared_puzzle RPC returned PGRST202; the restore test used
  the local client's exact-ID transitional fallback.
- Earlier unreachable-backend verification notes above describe the pre-resume
  state. Privacy hardening and publication remain pending, not verified complete.
- The reader-only first step is isolated in supabase/install-share-reader.sql.
  verify:sharing checks it matches the full migration with no extra operations.
- After explicit owner approval, the exact reader-only SQL was run in the existing
  Piczzle project. The dashboard reported Success. No rows returned.
- Live anonymous RPC checks passed: the requested demo image and size matched;
  missing, wildcard and injection-like IDs returned no rows. The old exact-ID read
  remained available for existing clients. No photos or keys were printed.
- No tables, stored photos, old read policies, cleanup schedule, credentials,
  plan or deployments were changed. Full table-list protection remains pending
  until the updated clients are deployed and the stricter policy is applied.

## Client Publication Preparation - 2026-10-02

- The Android invitation now targets the versioned GitHub Release APK for build
  20261002-network1. Publication is not complete until its download and Pages pass.
- npm run verify passed again before source publication. All app/build inputs
  are being committed; the owner's untracked PRODUCT_FINISHING_PLAN.md is preserved
  locally, not included in the public release. That document alone may cause the
  package metadata to report a dirty worktree; it is not packaged into the app.
- The reader-only migration is installed. Stricter read/write policies and the
  expiry cleanup job are prepared files only; they are not applied by this release.
