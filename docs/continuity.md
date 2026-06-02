# Piczzle Continuity Note

Use this file as the durable handoff when the chat context fills, an automation is removed, or a new Codex session starts.

## Read First

1. Check `git status --short --branch`.
2. Read `README.md`, this file, and `docs/tester-handoff.md`.
3. Run `npm.cmd run verify` on Windows PowerShell, because plain `npm` may be blocked by execution policy.
4. Run `npm.cmd run verify:public` before sending testers to the public GitHub Pages flow.
5. If app code or package inputs changed, run `npm.cmd run android:package` to create a fresh ignored APK in `release/`.

## Current State

- Branch: `main`
- Latest known app-code commit at handoff: see the generated APK `.txt` or `.json` note.
- Working tree at handoff: clean
- App focus: web-first photo puzzle app, packaged for Android through Capacitor.
- Sharing status: Supabase-backed private puzzle links are integrated into the main app flow behind `Share Puzzle`.
- Tester status: private Android debug packaging and tester handoff docs exist.
- Latest known APK at handoff: `release/piczzle-debug-20260601-2038.apk`
- APK build commit: see the generated APK `.txt` or `.json` note.
- Difference after that APK: none.

## What Is Ready

- Local verification scripts:
  - `npm.cmd run verify`
  - `npm.cmd run verify:public`
- Android helper scripts:
  - `npm.cmd run android:doctor`
  - `npm.cmd run android:debug`
  - `npm.cmd run android:release`
  - `npm.cmd run android:run`
  - `npm.cmd run android:package`
  - `npm.cmd run android:screenshot`
- Tester docs:
  - `docs/tester-handoff.md`
  - `docs/tester-report-template.md`
  - `docs/android-private-beta-plan.md`
- Sharing docs:
  - `docs/private-sharing.md`
- Native setup docs:
  - `docs/native-app.md`

## Recommended Next Decisions

1. Run the tester handoff checklist on an emulator.
2. Send the newest APK plus its generated `.txt` notes to a small trusted tester group.
3. Collect tester feedback using `docs/tester-report-template.md`.
4. Before public release, add reporting, deletion/moderation controls, blocking or abuse handling, public terms/privacy text, and clear contact information.

## Known Non-Blockers

- Social/message preview thumbnails are inconsistent across receiving apps and app caches. Piczzle exposes a valid generic `piczzle-preview.png` through Open Graph/Twitter metadata, but preview rendering should not block private Android testing as long as shared links open the puzzle.

## Automation Style

When continuing autonomously, make conservative forward progress:

- Prefer verification and packaging over broad refactors.
- Treat `README.md`, this file, and `docs/tester-handoff.md` as the source of truth.
- Keep generated private build outputs in ignored folders unless explicitly asked to commit them.
- If the repo is clean and checks pass, choose the next tester-readiness step.
- If the repo is dirty, inspect changes before editing and preserve user work.
