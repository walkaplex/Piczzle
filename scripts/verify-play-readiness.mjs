import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function line(status, label, detail) {
  console.log(`${status.padEnd(7)} ${label}${detail ? ` - ${detail}` : ""}`);
}

const blockers = [];
const warnings = [];

function pass(label, detail) {
  line("PASS", label, detail);
}

function warn(label, detail) {
  warnings.push(label);
  line("WARN", label, detail);
}

function block(label, detail) {
  blockers.push(label);
  line("BLOCK", label, detail);
}

const betaPlan = await read("docs/android-private-beta-plan.md");
const listing = await read("docs/play-store-listing-draft.md");
const privacy = await read("privacy.html");
const sql = await read("supabase/shared-puzzles.sql");
const packageJson = JSON.parse(await read("package.json"));

const apkMatch = betaPlan.match(/Current APK: `([^`]+)`/);
const noteMatch = betaPlan.match(/Build note: `([^`]+)`/);

if (apkMatch && await exists(apkMatch[1])) {
  pass("Current debug APK", apkMatch[1]);
} else {
  block("Current debug APK", "missing or not referenced in docs/android-private-beta-plan.md");
}

if (noteMatch && await exists(noteMatch[1])) {
  pass("Current APK note", noteMatch[1]);
} else {
  block("Current APK note", "missing or not referenced in docs/android-private-beta-plan.md");
}

if (packageJson.scripts?.["android:release"]) {
  pass("Release build command", "npm run android:release");
} else {
  block("Release build command", "missing android:release script");
}

const signingNames = [
  "PICZZLE_UPLOAD_KEYSTORE",
  "PICZZLE_UPLOAD_KEYSTORE_PASSWORD",
  "PICZZLE_UPLOAD_KEY_ALIAS",
  "PICZZLE_UPLOAD_KEY_PASSWORD"
];
const missingSigning = signingNames.filter(name => !process.env[name]);

if (missingSigning.length) {
  block("Release signing variables", `missing ${missingSigning.join(", ")}`);
} else {
  pass("Release signing variables", "configured in local environment");
}

if (process.env.PICZZLE_VERSION_CODE && Number(process.env.PICZZLE_VERSION_CODE) > 1) {
  pass("Play version code", `PICZZLE_VERSION_CODE=${process.env.PICZZLE_VERSION_CODE}`);
} else {
  warn("Play version code", "set PICZZLE_VERSION_CODE above 1 before repeat Play uploads");
}

if (privacy.includes("Privacy") && privacy.includes("Shared puzzle links")) {
  pass("Privacy page", "privacy.html is present");
} else {
  block("Privacy page", "privacy.html is missing expected privacy text");
}

if (privacy.includes("A public support email should be added")) {
  block("Support email", "privacy.html still uses private-testing placeholder text");
} else {
  pass("Support email", "privacy.html does not contain the placeholder");
}

if (listing.includes("Support email: pending")) {
  block("Store listing support email", "docs/play-store-listing-draft.md still says pending");
} else {
  pass("Store listing support email", "listing draft has support email text");
}

if (listing.includes("Short Description") && listing.includes("Full Description") && listing.includes("Screenshot Plan")) {
  pass("Store listing draft", "copy and screenshot plan exist");
} else {
  block("Store listing draft", "missing expected listing sections");
}

if (sql.includes("delete_shared_puzzle") && sql.includes("grant execute on function public.delete_shared_puzzle(text) to service_role")) {
  pass("Shared puzzle deletion helper", "service-role function is defined in SQL");
} else {
  block("Shared puzzle deletion helper", "missing service-role delete helper in Supabase SQL");
}

if (await exists("android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png")) {
  pass("Android launcher icon", "checked in");
} else {
  block("Android launcher icon", "missing checked-in launcher assets");
}

console.log("");
console.log(`Play readiness: ${blockers.length} blocker(s), ${warnings.length} warning(s).`);

if (blockers.length) {
  process.exitCode = 1;
}
