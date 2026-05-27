import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
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

const [indexHtml, swJs, shareConfig, shareCloud] = await Promise.all([
  read("index.html"),
  read("sw.js"),
  read("js/share-config.js"),
  read("js/share-cloud.js")
]);

const cachedAssets = [
  { file: "css/styles.css", indexPattern: /css\/styles\.css\?v=([^"]+)/ },
  { file: "js/share-config.js", indexPattern: /js\/share-config\.js\?v=([^"]+)/ },
  { file: "js/share-cloud.js", indexPattern: /js\/share-cloud\.js\?v=([^"]+)/ },
  { file: "js/app.js", indexPattern: /js\/app\.js\?v=([^"]+)/ },
  { file: "js/pwa.js", indexPattern: /js\/pwa\.js\?v=([^"]+)/ }
];

for (const asset of cachedAssets) {
  const escapedFile = asset.file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const indexVersion = matchOne(`${asset.file} reference in index.html`, indexHtml, asset.indexPattern);
  const swVersion = matchOne(
    `${asset.file} cache entry in sw.js`,
    swJs,
    new RegExp(`/Piczzle/${escapedFile}\\?v=([^",]+)`)
  );

  assert(
    indexVersion === swVersion,
    `${asset.file} cache version mismatch: index=${indexVersion}, sw=${swVersion}`
  );
}

const supabaseUrl = matchOne("supabaseUrl", shareConfig, /supabaseUrl:\s*"([^"]+)"/);
const publicBaseUrl = matchOne("publicBaseUrl", shareConfig, /publicBaseUrl:\s*"([^"]+)"/);
const anonKey = matchOne("supabaseAnonKey", shareConfig, /supabaseAnonKey:\s*"([^"]+)"/);

assert(!supabaseUrl.includes("YOUR-PROJECT"), "Supabase URL is still a placeholder");
assert(!anonKey.includes("YOUR-SUPABASE"), "Supabase anon key is still a placeholder");
assert(new URL(supabaseUrl).protocol === "https:", "Supabase URL must be HTTPS");
assert(new URL(publicBaseUrl).protocol === "https:", "Public share URL must be HTTPS");
assert(publicBaseUrl.endsWith("/index.html"), "Public share URL should point to index.html");
assert(
  shareCloud.includes(".replace(/\\/rest\\/v1$/, \"\")"),
  "share-cloud.js should normalize Supabase REST URLs"
);

console.log("Sharing configuration verified.");
