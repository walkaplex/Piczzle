import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";

function defaultAdbPath() {
  if (process.env.ADB) return process.env.ADB;
  if (isWindows) {
    return path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk", "platform-tools", "adb.exe");
  }
  return path.join(os.homedir(), "Library", "Android", "sdk", "platform-tools", "adb");
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || root,
      env: options.env || process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    const stdout = [];
    let stderr = "";
    child.stdout.on("data", chunk => {
      stdout.push(chunk);
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0) {
        resolve(Buffer.concat(stdout));
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}${stderr ? `\n${stderr}` : ""}`));
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
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

const adb = defaultAdbPath();
const devicesOutput = (await run(adb, ["devices"])).toString("utf8");
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

const png = await run(adb, ["-s", serial, "exec-out", "screencap", "-p"]);
const outDir = path.join(root, "preview");
const outFile = path.join(outDir, `android-screen-${stamp()}.png`);

await mkdir(outDir, { recursive: true });
await writeFile(outFile, png);

console.log(`Saved Android screenshot to ${path.relative(root, outFile)}`);
