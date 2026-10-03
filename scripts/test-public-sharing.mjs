import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixtures = [
  { name: "RLS hides rows", status: 200, body: "[]", passes: true },
  { name: "permission denied", status: 403, body: "{}", passes: true },
  { name: "anonymous access denied", status: 401, body: "{}", passes: true },
  { name: "listing exposed", status: 200, body: '[{"id":"synthetic-test-id"}]', passes: false },
  { name: "backend error", status: 500, body: "{}", passes: false },
  { name: "unexpected response", status: 200, body: "{}", passes: false },
  { name: "invalid JSON", status: 200, body: "not JSON", passes: false }
];

const originalFetch = globalThis.fetch;
const originalLog = console.log;
const originalError = console.error;
const publicFiles = new Set([
  "index.html", "sw.js", "tester-invite.html", "web-tester-invite.html", "js/share-config.js"
]);

try {
  for (const fixture of fixtures) {
    let listingChecked = false;
    // Exercise the real command without network access or production writes.
    globalThis.fetch = async (input, options = {}) => {
      const url = new URL(input);
      if (url.pathname.startsWith("/Piczzle/")) {
        const file = url.pathname.slice("/Piczzle/".length);
        assert(publicFiles.has(file), "Unexpected public file request");
        return new Response(await readFile(new URL(`../${file}`, import.meta.url), "utf8"));
      }
      if (url.pathname === "/rest/v1/rpc/get_shared_puzzle") {
        assert.equal(options.method, "POST");
        assert.deepEqual(JSON.parse(options.body), { puzzle_id: "piczzle-health-check-no-image" });
        return new Response("[]");
      }
      assert.equal(url.pathname, "/rest/v1/shared_puzzles");
      assert.equal(options.method || "GET", "GET");
      assert.equal(options.body, undefined);
      assert.equal(url.searchParams.get("select"), "id");
      assert.equal(url.searchParams.get("limit"), "1");
      listingChecked = true;
      return new Response(fixture.body, { status: fixture.status });
    };
    console.log = () => {};
    console.error = () => {};
    let failure;
    try {
      await import(`./verify-public-site.mjs?fixture=${encodeURIComponent(fixture.name)}`);
    } catch (error) {
      failure = error;
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
    assert(listingChecked, `${fixture.name}: privacy check was not reached`);
    assert.equal(!failure, fixture.passes, `${fixture.name}: incorrect verification result`);
  }
} finally {
  globalThis.fetch = originalFetch;
  console.log = originalLog;
  console.error = originalError;
}

console.log("Public sharing privacy checks passed (7 fixtures; no network or writes).");
