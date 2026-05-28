import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicBase = "https://walkaplex.github.io/Piczzle";

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function fetchText(url) {
  const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}verify=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function matchOne(label, source, pattern) {
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Missing ${label}`);
  }
  return match[1] || match[0];
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const [localIndex, localSw, publicIndex, publicSw] = await Promise.all([
  read("index.html"),
  read("sw.js"),
  fetchText(`${publicBase}/index.html`),
  fetchText(`${publicBase}/sw.js`)
]);

const assetPatterns = [
  ["styles.css", /css\/styles\.css\?v=([^"]+)/],
  ["share-config.js", /js\/share-config\.js\?v=([^"]+)/],
  ["share-cloud.js", /js\/share-cloud\.js\?v=([^"]+)/],
  ["app.js", /js\/app\.js\?v=([^"]+)/],
  ["pwa.js", /js\/pwa\.js\?v=([^"]+)/]
];

for (const [label, pattern] of assetPatterns) {
  const localVersion = matchOne(`${label} local version`, localIndex, pattern);
  const publicVersion = matchOne(`${label} public version`, publicIndex, pattern);
  assert(
    localVersion === publicVersion,
    `${label} public version mismatch: local=${localVersion}, public=${publicVersion}`
  );
}

const localCacheName = matchOne("local cache name", localSw, /CACHE_NAME\s*=\s*"([^"]+)"/);
const publicCacheName = matchOne("public cache name", publicSw, /CACHE_NAME\s*=\s*"([^"]+)"/);

assert(
  localCacheName === publicCacheName,
  `Public service worker cache mismatch: local=${localCacheName}, public=${publicCacheName}`
);
assert(
  publicIndex.includes("Puzzle link created") &&
    publicIndex.includes("Unlisted link. Expires after 30 days."),
  "Public index should include the current share modal text"
);

console.log("Public GitHub Pages site verified.");
