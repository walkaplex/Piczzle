import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "www");

const copyTargets = [
  "assets",
  "css",
  "js",
  "piczzle-preview.jpg",
  "privacy.html"
];

const devOnlyArtifacts = [
  "share-lab.html",
  "css/share-lab.css",
  "js/share-lab.js"
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const target of copyTargets) {
  await cp(path.join(root, target), path.join(outDir, target), { recursive: true });
}

let index = await readFile(path.join(root, "index.html"), "utf8");

// Native shells do not need the web manifest or service worker. Removing them
// avoids GitHub Pages-specific paths inside the packaged iOS/Android app.
index = index
  .replace(/<link rel="manifest" href="manifest\.webmanifest">\s*/g, "")
  .replace(/<script src="js\/pwa\.js\?v=[^"]+"><\/script>\s*/g, "");

await writeFile(path.join(outDir, "index.html"), index);

for (const artifact of devOnlyArtifacts) {
  await rm(path.join(outDir, artifact), { force: true });
}

const manifest = await readFile(path.join(root, "manifest.webmanifest"), "utf8");
const nativeManifest = JSON.parse(manifest);
nativeManifest.id = "/";
nativeManifest.start_url = "/";
nativeManifest.scope = "/";
nativeManifest.icons = nativeManifest.icons.map(icon => ({
  ...icon,
  src: icon.src.replace(/^\/Piczzle\//, "")
}));
await writeFile(path.join(outDir, "manifest.webmanifest"), `${JSON.stringify(nativeManifest, null, 2)}\n`);

console.log("Prepared Piczzle web assets for Capacitor in www/.");
