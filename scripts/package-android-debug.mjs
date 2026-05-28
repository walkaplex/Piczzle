import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const releaseDir = path.join(root, "release");
const apkSource = path.join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const spawnCommand = isWindows ? "cmd.exe" : command;
    const spawnArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: options.cwd || root,
      env: options.env || process.env,
      shell: false,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

function stamp(date = new Date()) {
  const pad = value => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join("");
}

const npmCommand = isWindows ? "npm.cmd" : "npm";
await run(npmCommand, ["run", "android:debug"]);

const apk = await readFile(apkSource);
const hash = createHash("sha256").update(apk).digest("hex");
const info = await stat(apkSource);
const version = stamp();
const apkName = `piczzle-debug-${version}.apk`;
const apkTarget = path.join(releaseDir, apkName);
const checksumTarget = `${apkTarget}.sha256`;
const notesTarget = path.join(releaseDir, `piczzle-debug-${version}.txt`);

await mkdir(releaseDir, { recursive: true });
await copyFile(apkSource, apkTarget);
await writeFile(checksumTarget, `${hash}  ${apkName}\n`);
await writeFile(
  notesTarget,
  [
    `Piczzle Android debug build ${version}`,
    "",
    `APK: ${apkName}`,
    `Size: ${info.size} bytes`,
    `SHA-256: ${hash}`,
    "",
    "Install notes:",
    "- This is a debug APK for private testing only.",
    "- Android may warn that the app is from an unknown source.",
    "- Install the APK on an Android device or emulator, then open Piczzle.",
    "",
    "Please try:",
    "- Create a puzzle from one of your own photos.",
    "- Use the crop/zoom controls before creating the puzzle.",
    "- Try Hint, Restart, Solve, and Share Puzzle.",
    "- Open a shared puzzle link if one is available.",
    "",
    "Please report:",
    "- Your device model.",
    "- Screenshots or screen recordings of anything odd.",
    "- What you tapped right before any problem happened.",
    "- Anything that felt confusing or awkward.",
    "",
    "Maintainer note:",
    "- Rebuild with npm run android:package whenever the app changes.",
    ""
  ].join("\n")
);

console.log(`Packaged Android debug APK at release/${apkName}`);
