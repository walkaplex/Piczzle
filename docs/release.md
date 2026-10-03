# Piczzle Release Runbook

This is a maintainer checklist, not tester installation instructions. A local build
is not a deployed site or a published APK. Do not distribute a build with broken
sharing as if that feature works.

## Release Gates

1. Restore the configured Supabase project. Follow the reader-first migration in
   [private-sharing.md](private-sharing.md); do not remove the old read policy before
   updated web and Android clients are available. Review deletion/cleanup separately.
2. Run `npm run verify`. Complete the practical checks in [tester-handoff.md](tester-handoff.md).
   Real iPhone save behavior and older Android save paths still need device testing.
3. Review and approve the exact source changes before committing/pushing. Keep keys,
   private photos, generated `www/`, and APKs out of the source commit. No history rewrite.
4. Public launch also requires insert rate limiting. Friends/family debug testing is
   not a substitute for the public-release security gates.

## Build Identity and Caches

For each changed web build, update `PiczzleGame.version` in `js/app.js` and the
`js/app.js?v=` reference in both `index.html` and `sw.js`. Give each other changed
CSS/script a new query version in both files. Increment `CACHE_NAME` in `sw.js`;
never reuse a previous cache name. Keep the existing service-worker strategy.

The setup footer and feedback draft show the app build identifier. This identifier
must change for any app asset/code release, not just changes to `js/app.js`.
`verify:sharing` checks app identity and matching cache references.

Run build commands sequentially. `verify`, `android:debug`, and `android:package`
prepare the same generated `www/` directory and must not run concurrently.

## Web Deployment

After owner approval, commit and push the reviewed source. Wait for the GitHub Pages
deployment of that commit to finish; a successful push alone is not a deployment.
Run `npm run verify:public` and check the public app, `sw.js`, and shared-link flow.
Do not repeatedly bump versions or change layout to repair a queued Pages job.

Test the deployed web app on desktop and iPhone Safari. Close/reopen an installed
PWA after the update and confirm its footer shows the intended build. If stale,
close all Piczzle windows, reopen online and reload; clearing site data is a last
resort because it removes local fallback links and preferences.

## Android Private Package

Run `npm run android:package` after source review. It builds the debug APK and writes
the APK, checksum, text note and JSON note into ignored `release/`.
`release/latest-debug.json` points to the newest local package and records its app
build, commit, dirty/clean status, size and checksum. It does not publish anything.

Run `npm run verify:play` to check the package identity and checksum. Missing Play
signing variables are expected for debug testing; do not change signing to bypass
that check. A dirty-source warning means the commit alone cannot reproduce that
package: rebuild from the approved clean commit for distribution.

Install the exact packaged APK on a device/emulator and check create, frame, place,
Hint, confirm Cancel, complete, View Puzzle/Back to Start, Save, Feedback, native
Back and background/reopen. Verify sharing with a second device after restoration.

With distribution approved, upload the APK and checksum to a GitHub Release and
point the existing Android invite download at that exact APK asset. No ZIP is
needed. Keep old source binaries untouched; do not add more APKs to Git. Test the
published download on a phone before inviting testers. Store/AAB signing stays
in the existing separate Play workflow.

## Rollback

Revert only the offending approved commit, assign a new build identifier and a
higher service-worker cache name, then redeploy and verify public output. Rebuild
and redistribute Android separately; installed APKs do not update with Pages.
Database policy rollback is separate: do not reopen anonymous photo enumeration.
Do not delete shared photos as part of an app rollback.
