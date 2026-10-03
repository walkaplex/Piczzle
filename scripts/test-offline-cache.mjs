import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const source = await readFile(new URL("sw.js", root), "utf8");
const events = new Map();
const cached = new Map([
  ["/Piczzle/index.html", { page: "app" }],
  ["/Piczzle/privacy.html", { page: "privacy" }],
  ["/Piczzle/assets/demo-pet.jpg", { image: "pet" }]
]);
let online = false;
let shell;
let writes = 0;
let networkCalls = 0;
const context = vm.createContext({ URL,
  self: { location: { origin: "https://example.test" },
    addEventListener: (name, handler) => events.set(name, handler), skipWaiting: async () => {} },
  caches: {
    open: async () => ({ addAll: async assets => { shell = assets; }, put: async () => { writes++; } }),
    match: async (request, options) => {
      const url = new URL(typeof request === "string" ? request : request.url, "https://example.test");
      return cached.get(url.pathname + (options?.ignoreSearch ? "" : url.search));
    }
  },
  fetch: async () => {
    networkCalls++;
    if (!online) throw new TypeError("Offline");
    return { page: "network", status: 200, clone: () => ({ page: "network" }) };
  }
});
vm.runInContext(source, context);
let install;
events.get("install")({ waitUntil: promise => { install = promise; } });
await install;
for (const asset of shell) {
  const relative = new URL(asset, "https://example.test").pathname.slice("/Piczzle/".length) || "index.html";
  await access(new URL(relative, root));
}
assert.equal(shell.some(asset => asset.includes("tester-invite")), false);

function navigate(path, mode = "navigate", method = "GET") {
  let response;
  events.get("fetch")({ request: { url: new URL(path, "https://example.test").href, mode, method },
    respondWith: promise => { response = promise; } });
  return response;
}
assert.equal((await navigate("/Piczzle/")).page, "app");
assert.equal((await navigate("/Piczzle/index.html?puzzle=offline-test")).page, "app");
assert.equal((await navigate("/Piczzle/privacy.html")).page, "privacy");
assert.equal((await navigate("/Piczzle/privacy.html?test=1")).page, "privacy");
assert.equal((await navigate("/Piczzle/unknown-route")).page, "app");
const beforeCached = networkCalls;
assert.equal((await navigate("/Piczzle/assets/demo-pet.jpg", "cors")).image, "pet");
assert.equal(networkCalls, beforeCached);
assert.equal(navigate("https://backend.test/photo", "cors"), undefined);
assert.equal(navigate("/Piczzle/upload", "cors", "POST"), undefined);
assert.equal(writes, 0);
online = true;
assert.equal((await navigate("/Piczzle/privacy.html")).page, "network");
console.log("PASS: precache files exist; offline app/demo/privacy routes work; navigation stays network-first and backend writes are not cached.");
