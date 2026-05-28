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

const [indexHtml, manifestText, swJs, appJs, shareConfig, shareCloud, privateSharingDoc, sharingSql] = await Promise.all([
  read("index.html"),
  read("manifest.webmanifest"),
  read("sw.js"),
  read("js/app.js"),
  read("js/share-config.js"),
  read("js/share-cloud.js"),
  read("docs/private-sharing.md"),
  read("supabase/shared-puzzles.sql")
]);

const manifest = JSON.parse(manifestText);

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
assert(
  appJs.includes("function normalizeSharedSize(size)") &&
    appJs.includes("startPuzzleFromImage(data.image,normalizeSharedSize(data.size)"),
  "app.js should normalize incoming shared puzzle sizes"
);
assert(
  privateSharingDoc.includes("npm run verify:sharing"),
  "Private sharing docs should mention npm run verify:sharing"
);
assert(
  sharingSql.includes("expires_at timestamptz not null default (now() + interval '30 days')") &&
    sharingSql.includes("using (expires_at > now())"),
  "Supabase sharing SQL should expire shared puzzles after 30 days and block expired reads"
);
assert(
  sharingSql.includes("constraint shared_puzzles_image_size") &&
    sharingSql.includes("char_length(image) <= 2500000"),
  "Supabase sharing SQL should cap shared image payload size"
);
assert(
  sharingSql.includes("function public.delete_expired_shared_puzzles()") &&
    sharingSql.includes("grant execute on function public.delete_expired_shared_puzzles() to service_role") &&
    sharingSql.includes("revoke all on function public.delete_expired_shared_puzzles() from anon"),
  "Supabase sharing SQL should include admin-only expired puzzle cleanup"
);
assert(
  indexHtml.includes('<link rel="apple-touch-icon" href="assets/app-icon-premium.png">'),
  "index.html should use the polished PNG icon for Apple touch installs"
);
assert(
  manifest.icons.some(icon => icon.src === "/Piczzle/assets/app-icon-premium.png" && icon.purpose === "any"),
  "manifest.webmanifest should include the polished PNG app icon"
);
assert(
  manifest.icons.some(icon => icon.src === "/Piczzle/assets/app-icon-maskable.png" && icon.purpose === "maskable"),
  "manifest.webmanifest should include the padded maskable app icon"
);
assert(
  swJs.includes("/Piczzle/assets/app-icon-premium.png") &&
    swJs.includes("/Piczzle/assets/app-icon-maskable.png"),
  "sw.js should cache the PNG app icons"
);

console.log("Sharing configuration verified.");
