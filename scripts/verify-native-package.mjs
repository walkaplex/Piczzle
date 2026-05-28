import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const [indexHtml, manifestText] = await Promise.all([
  read("www/index.html"),
  read("www/manifest.webmanifest")
]);

const nativeManifest = JSON.parse(manifestText);
const devOnlyArtifacts = [
  "www/share-lab.html",
  "www/css/share-lab.css",
  "www/js/share-lab.js",
  "android/app/src/main/assets/public/share-lab.html",
  "android/app/src/main/assets/public/css/share-lab.css",
  "android/app/src/main/assets/public/js/share-lab.js"
];

assert(
  !indexHtml.includes("manifest.webmanifest"),
  "Native index.html should not load the web manifest"
);
assert(
  !indexHtml.includes("js/pwa.js"),
  "Native index.html should not load the service worker script"
);
assert(nativeManifest.id === "/", "Native manifest id should be rooted at /");
assert(nativeManifest.start_url === "/", "Native manifest start_url should be /");
assert(nativeManifest.scope === "/", "Native manifest scope should be /");
assert(
  nativeManifest.icons.every(icon => !icon.src.startsWith("/Piczzle/")),
  "Native manifest icon paths should be app-relative, not GitHub Pages paths"
);

for (const artifact of devOnlyArtifacts) {
  assert(!(await exists(artifact)), `Dev-only artifact should not be packaged: ${artifact}`);
}

console.log("Native package verified.");
