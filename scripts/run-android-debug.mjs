import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const packageName = "com.walkaplex.piczzle";
const activityName = `${packageName}/.MainActivity`;
const apkPath = path.join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const spawnCommand = isWindows ? "cmd.exe" : command;
    const spawnArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: options.cwd || root,
      env: options.env || process.env,
      shell: false,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit"
    });

    let stdout = "";
    let stderr = "";
    if (options.capture) {
      child.stdout.on("data", chunk => {
        stdout += chunk;
      });
      child.stderr.on("data", chunk => {
        stderr += chunk;
      });
    }

    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      if (options.allowFailure) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}${stderr ? `\n${stderr}` : ""}`));
    });
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function defaultAdbPath() {
  if (process.env.ADB) return process.env.ADB;
  if (isWindows) {
    return path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk", "platform-tools", "adb.exe");
  }
  return path.join(os.homedir(), "Library", "Android", "sdk", "platform-tools", "adb");
}

const npmCommand = isWindows ? "npm.cmd" : "npm";
await run(npmCommand, ["run", "android:debug"]);

if (!(await exists(apkPath))) {
  throw new Error("Android debug APK was not created.");
}

const adb = defaultAdbPath();
if (!(await exists(adb))) {
  throw new Error("ADB was not found. Start Android Studio once or set the ADB environment variable.");
}

const devicesOutput = await run(adb, ["devices"], { capture: true });
const devices = devicesOutput
  .split(/\r?\n/)
  .slice(1)
  .map(line => line.trim().split(/\s+/))
  .filter(parts => parts[0] && parts[1] === "device")
  .map(parts => parts[0]);

const serial = process.env.ANDROID_SERIAL || devices[0];
if (!serial) {
  throw new Error("No running Android emulator or device was found.");
}

await run(adb, ["-s", serial, "install", "-r", apkPath]);
await run(adb, ["-s", serial, "shell", "am", "force-stop", packageName]);
await run(adb, ["-s", serial, "shell", "am", "start", "-n", activityName]);

let pid = "";
for (let attempt = 0; attempt < 10; attempt += 1) {
  pid = await run(adb, ["-s", serial, "shell", "pidof", packageName], {
    capture: true,
    allowFailure: true
  });
  if (pid) break;
  await wait(1000);
}

if (!pid) {
  throw new Error("Piczzle was installed, but it did not appear to launch.");
}

console.log(`Piczzle launched on ${serial}.`);
