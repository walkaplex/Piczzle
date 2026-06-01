import { access, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(root, "android");
const isWindows = process.platform === "win32";

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Release builds require local upload-key signing settings.`);
  }
  return value;
}

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

if (!(await exists(androidDir))) {
  throw new Error("Missing android project. Run npm run cap:add:android first.");
}

const fallbackJavaHome = isWindows
  ? "C:\\Program Files\\Android\\Android Studio\\jbr"
  : process.env.JAVA_HOME;
const javaHome = process.env.JAVA_HOME || fallbackJavaHome;

if (!javaHome || !(await exists(javaHome))) {
  throw new Error("JAVA_HOME is not set and Android Studio's bundled Java runtime was not found.");
}

const keystorePath = requireEnv("PICZZLE_UPLOAD_KEYSTORE");
requireEnv("PICZZLE_UPLOAD_KEYSTORE_PASSWORD");
requireEnv("PICZZLE_UPLOAD_KEY_ALIAS");
requireEnv("PICZZLE_UPLOAD_KEY_PASSWORD");

if (!(await exists(keystorePath))) {
  throw new Error(`PICZZLE_UPLOAD_KEYSTORE does not exist: ${keystorePath}`);
}

const gradleUserHome = process.env.GRADLE_USER_HOME || path.join(root, ".gradle-codex");
await mkdir(gradleUserHome, { recursive: true });

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  GRADLE_USER_HOME: gradleUserHome,
  PATH: isWindows
    ? `${path.join(javaHome, "bin")};${process.env.Path || process.env.PATH || ""}`
    : process.env.PATH,
  Path: isWindows
    ? `${path.join(javaHome, "bin")};${process.env.Path || process.env.PATH || ""}`
    : process.env.PATH
};

const npmCommand = isWindows ? "npm.cmd" : "npm";
const npxCommand = isWindows ? "npx.cmd" : "npx";
const gradleCommand = isWindows ? "gradlew.bat" : "./gradlew";

await run(npmCommand, ["run", "verify:native"], { env });
await run(npxCommand, ["cap", "copy", "android"], { env });
await run(gradleCommand, [":app:bundleRelease", "--console=plain", "--quiet"], {
  cwd: androidDir,
  env
});

console.log("Android release bundle built at android/app/build/outputs/bundle/release/app-release.aab");
