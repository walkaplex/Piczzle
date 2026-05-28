import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const checks = [];

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise(resolve => {
    const spawnCommand = isWindows ? "cmd.exe" : command;
    const spawnArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: options.cwd || root,
      env: options.env || process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => {
      stdout += chunk;
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.on("error", error => {
      resolve({ ok: false, stdout, stderr: String(error) });
    });
    child.on("exit", code => {
      resolve({ ok: code === 0, code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function record(ok, label, detail = "") {
  checks.push({ ok, label, detail });
}

function defaultJavaHome() {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME;
  if (isWindows) return "C:\\Program Files\\Android\\Android Studio\\jbr";
  return "";
}

function defaultAdbPath() {
  if (process.env.ADB) return process.env.ADB;
  if (isWindows) {
    return path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk", "platform-tools", "adb.exe");
  }
  return path.join(os.homedir(), "Library", "Android", "sdk", "platform-tools", "adb");
}

const androidDir = path.join(root, "android");
const gradleWrapper = path.join(androidDir, isWindows ? "gradlew.bat" : "gradlew");
const apkPath = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const javaHome = defaultJavaHome();
const adb = defaultAdbPath();

record(await exists(androidDir), "Android project", androidDir);
record(await exists(gradleWrapper), "Gradle wrapper", gradleWrapper);
record(Boolean(javaHome) && await exists(javaHome), "Java runtime", javaHome || "JAVA_HOME not set");
record(await exists(adb), "ADB", adb);

const nodeVersion = await run("node", ["--version"]);
record(nodeVersion.ok, "Node.js", nodeVersion.stdout || nodeVersion.stderr);

const npmVersion = await run(isWindows ? "npm.cmd" : "npm", ["--version"]);
record(npmVersion.ok, "npm", npmVersion.stdout || npmVersion.stderr);

if (await exists(adb)) {
  const devicesOutput = await run(adb, ["devices"]);
  const devices = devicesOutput.stdout
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts[0] && parts[1] === "device")
    .map(parts => parts[0]);
  record(devices.length > 0, "Running Android device/emulator", devices.length ? devices.join(", ") : "None connected");
}

record(await exists(apkPath), "Debug APK exists", apkPath);

for (const check of checks) {
  console.log(`${check.ok ? "OK " : "NO "} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
}

const requiredLabels = new Set(["Android project", "Gradle wrapper", "Java runtime", "ADB", "Node.js", "npm"]);
const failedRequired = checks.filter(check => requiredLabels.has(check.label) && !check.ok);

if (failedRequired.length) {
  throw new Error("Android setup has missing required pieces.");
}

console.log("Android setup doctor completed.");
