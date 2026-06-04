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

const assetPatterns = [
  ["styles.css", /css\/styles\.css\?v=([^"]+)/],
  ["share-config.js", /js\/share-config\.js\?v=([^"]+)/],
  ["share-cloud.js", /js\/share-cloud\.js\?v=([^"]+)/],
  ["app.js", /js\/app\.js\?v=([^"]+)/],
  ["pwa.js", /js\/pwa\.js\?v=([^"]+)/]
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPublicSite() {
  const [localIndex, localSw, publicIndex, publicSw, publicInvite] = await Promise.all([
    read("index.html"),
    read("sw.js"),
    fetchText(`${publicBase}/index.html`),
    fetchText(`${publicBase}/sw.js`),
    fetchText(`${publicBase}/tester-invite.html`)
  ]);

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
  assert(
    publicInvite.includes("You are invited to test Piczzle") &&
      publicInvite.includes("Download APK") &&
      publicInvite.includes("downloads/piczzle-debug-20260602-1126.apk") &&
      publicInvite.includes("piczzle.support@gmail.com") &&
      publicInvite.includes("unknown source"),
    "Public tester invite should include current install and support text"
  );
}

const attempts = Number(process.env.VERIFY_PUBLIC_ATTEMPTS || 6);
const waitMs = Number(process.env.VERIFY_PUBLIC_WAIT_MS || 10000);
let lastError;
let verified = false;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await checkPublicSite();
    console.log("Public GitHub Pages site verified.");
    verified = true;
    break;
  } catch (error) {
    lastError = error;
    if (attempt < attempts) {
      console.log(`Public site not updated yet (${attempt}/${attempts}): ${error.message}`);
      await wait(waitMs);
    }
  }
}

if (!verified) {
  throw lastError;
}
