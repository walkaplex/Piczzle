import { access, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
    throw new Error(`Missing ${name}. Set it locally before creating the upload key.`);
  }
  return value;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

const fallbackJavaHome = isWindows
  ? "C:\\Program Files\\Android\\Android Studio\\jbr"
  : process.env.JAVA_HOME;
const javaHome = process.env.JAVA_HOME || fallbackJavaHome;

if (!javaHome || !(await exists(javaHome))) {
  throw new Error("JAVA_HOME is not set and Android Studio's bundled Java runtime was not found.");
}

const keytool = path.join(javaHome, "bin", isWindows ? "keytool.exe" : "keytool");

if (!(await exists(keytool))) {
  throw new Error(`keytool was not found at ${keytool}`);
}

const keystorePath = process.env.PICZZLE_UPLOAD_KEYSTORE || path.join(root, "secrets", "piczzle-upload-key.jks");
const keystorePassword = requireEnv("PICZZLE_UPLOAD_KEYSTORE_PASSWORD");
const keyAlias = process.env.PICZZLE_UPLOAD_KEY_ALIAS || "piczzle-upload";
const keyPassword = requireEnv("PICZZLE_UPLOAD_KEY_PASSWORD");
const distinguishedName = process.env.PICZZLE_UPLOAD_KEY_DNAME || "CN=Piczzle, OU=Piczzle, O=Piczzle, L=Unknown, ST=Unknown, C=CA";

if (await exists(keystorePath)) {
  throw new Error(`Upload keystore already exists: ${keystorePath}`);
}

await mkdir(path.dirname(keystorePath), { recursive: true });

await run(keytool, [
  "-genkeypair",
  "-v",
  "-keystore", keystorePath,
  "-storetype", "JKS",
  "-alias", keyAlias,
  "-keyalg", "RSA",
  "-keysize", "2048",
  "-validity", "10000",
  "-storepass", keystorePassword,
  "-keypass", keyPassword,
  "-dname", distinguishedName
]);

console.log("");
console.log("Android upload key created.");
console.log(`Keystore: ${keystorePath}`);
console.log(`Alias: ${keyAlias}`);
console.log("");
console.log("Set these locally before release builds:");
console.log(`$env:PICZZLE_UPLOAD_KEYSTORE='${keystorePath}'`);
console.log("$env:PICZZLE_UPLOAD_KEYSTORE_PASSWORD='<same password you used>'");
console.log(`$env:PICZZLE_UPLOAD_KEY_ALIAS='${keyAlias}'`);
console.log("$env:PICZZLE_UPLOAD_KEY_PASSWORD='<same password you used>'");
