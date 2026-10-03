import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const saveSource = await readFile(new URL("../js/save-image.js", import.meta.url), "utf8");
const cloudSource = await readFile(new URL("../js/share-cloud.js", import.meta.url), "utf8");
const dialogSource = await readFile(new URL("../js/completion-actions.js", import.meta.url), "utf8");

function fixture() {
  const nodes = new Map();
  const canvases = [];
  const events = new Map();
  let interval;
  class Element {
    constructor() {
      this.children = []; this.dataset = {}; this.listeners = new Map();
      this.style = { setProperty() {} }; this.bounds = { width: 297, height: 222.75 };
      const classes = new Set();
      this.classList = { add: (...values) => values.forEach(value => classes.add(value)),
        remove: (...values) => values.forEach(value => classes.delete(value)),
        contains: value => classes.has(value),
        toggle(value, on) { if (on) classes.add(value); else classes.delete(value); } };
    }
    set innerHTML(_) { this.children = []; }
    setAttribute(key, value) { this[key] = value; }
    removeAttribute(key) { delete this[key]; }
    getBoundingClientRect() { return this.bounds; }
    addEventListener(key, fn) { this.listeners.set(key, fn); }
    appendChild(node) { this.children.push(node); }
    querySelector() { return new Element(); }
    querySelectorAll() { return []; }
    closest() { return this; }
    scrollIntoView() {}
    getClientRects() { return [this.bounds]; }
    focus() { document.activeElement = this; }
    click() { this.onclick?.(); this.listeners.get("click")?.({}); }
  }
  const node = id => {
    if (!nodes.has(id)) { const element = new Element(); element.id = id; nodes.set(id, element); }
    return nodes.get(id);
  };
  class Image {
    set src(value) {
      this.loadedSource = value;
      queueMicrotask(() => {
        if (value === "data:broken") return this.onerror(new Error("Corrupt image"));
        const dimensions = value === "data:large" ? [6000, 4000] : [1200, 900];
        this.naturalWidth = dimensions[0]; this.naturalHeight = dimensions[1];
        this.onload();
      });
    }
  }
  class FileReader {
    readAsDataURL() { this.result = "data:image/jpeg;base64,YQ=="; queueMicrotask(() => this.onload()); }
  }
  const document = {
    getElementById: node, querySelector: () => node("panel"),
    querySelectorAll: selector => selector === ".modalBg" ?
      ["modal", "shareModal", "missingShareModal", "sharedIntroModal", "confirmModal"].map(node) : [],
    addEventListener: (name, fn) => events.set(`document:${name}`, fn),
    activeElement: null,
    createElement(tag) {
      const element = new Element();
      if (tag === "canvas") {
        element.getContext = () => ({ fillRect() {}, drawImage: (...args) => { element.draw = args; } });
        element.toDataURL = () => "data:image/jpeg;base64,YQ==";
        element.toBlob = callback => callback(new Blob(["piece"], { type: "image/jpeg" }));
        canvases.push(element);
      }
      return element;
    }
  };
  const window = {
    location: { href: "https://example.test/index.html" }, matchMedia: () => ({ matches: true }),
    scrollTo() {}, addEventListener: (name, fn) => events.set(name, fn),
    dispatchEvent: event => events.get(event.type)?.(event)
  };
  const context = vm.createContext({ document, window, Image, FileReader, URL, URLSearchParams,
    location: { search: "", pathname: "/index.html" }, history: { replaceState() {} },
    localStorage: { length: 0, setItem() {} }, navigator: {}, console, File, Uint8Array, atob,
    Event, MutationObserver: class { observe() {} }, requestAnimationFrame: fn => queueMicrotask(fn),
    setTimeout: fn => { queueMicrotask(fn); return 1; }, clearTimeout() {},
    setInterval: fn => { interval = fn; return 1; }, clearInterval() { interval = null; }, fetch: async () => ({ blob: async () => new Blob() }) });
  vm.runInContext(appSource.replace("const requestedPuzzle=", "window.test={state,resetCrop,clamp,cropSquare,setImage,sharePuzzle,startPuzzleFromImage,start};const requestedPuzzle="), context);
  return { context, node, canvases, window, test: window.test, tick: () => interval?.() };
}

const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

for (const width of [240, 282, 297, 352, 520]) {
  const f = fixture(); await flush();
  f.test.state.img = { naturalWidth: 1200, naturalHeight: 900 };
  f.node("cropStage").bounds = { width, height: width * .75 };
  f.test.resetCrop();
  f.node("cropStage").bounds = { width: 0, height: 0 };
  await f.test.cropSquare();
  const canvas = f.canvases.at(-1);
  const [, x, y, w, h] = canvas.draw;
  assert.equal(canvas.width, 1200); assert.equal(canvas.height, 900);
  assert.ok(Math.abs(x) < .001 && Math.abs(y) < .001 && Math.abs(w - 1200) < .001 && Math.abs(h - 900) < .001);
}
console.log("PASS: hidden frame retains its crop geometry at five stage widths; no unintended bands.");

{
  const f = fixture(); await flush();
  f.test.state.img = { naturalWidth: 900, naturalHeight: 1800 };
  f.test.resetCrop(); f.test.state.zoom = f.test.state.minZoom; f.test.clamp();
  f.node("cropStage").bounds = { width: 0, height: 0 };
  await f.test.cropSquare();
  const [, x, y, w, h] = f.canvases.at(-1).draw;
  assert.ok(x > 0 && Math.abs(y) < .001 && w < 1200 && Math.abs(h - 900) < .001);
  const oldImage = f.test.state.img; const oldSrc = f.test.state.src;
  await f.test.setImage("data:broken");
  assert.equal(f.test.state.img, oldImage); assert.equal(f.test.state.src, oldSrc);
  assert.match(f.node("toast").textContent, /couldn't be opened/);
  await f.test.setImage("data:large");
  assert.equal(f.canvases.at(-1).width, 2400); assert.equal(f.canvases.at(-1).height, 1600);
}
console.log("PASS: intentional letterboxing survives; corrupt upload preserves photo; large photo is downscaled.");

{
  const f = fixture(); await flush();
  f.test.state.square = "data:image/jpeg;base64,c29sdmVk";
  await f.test.sharePuzzle("puzzle");
  assert.equal(f.node("sendShareBtn").disabled, true);
  assert.equal(f.node("copyShareBtn").disabled, true);
  assert.equal(f.node("shareLink").value, "");
  let saved;
  f.window.PiczzleShareCloud = { isReady: () => true, savePuzzle: async data => { saved = data; return data; }, publicLink: () => "https://example.test/?puzzle=id" };
  await f.test.sharePuzzle("puzzle");
  assert.equal(f.canvases.at(-1).draw[0].loadedSource, f.test.state.square);
  assert.ok(saved.image && !f.node("sendShareBtn").disabled);
  f.test.state.shared = true;
  saved = null;
  await f.test.sharePuzzle("puzzle");
  assert.equal(saved, null);
  await f.test.startPuzzleFromImage("data:image/jpeg;base64,YQ==", 4, "", { shared: true });
  assert.equal(f.node("completeShareBtn").hidden, true);
}
console.log("PASS: unavailable links cannot be sent/copied; received images cannot be re-shared.");

{
  const f = fixture(); await flush();
  f.test.state.solved = true; f.test.state.square = "data:image/jpeg;base64,YQ==";
  let shared;
  f.context.navigator = { canShare: () => true, share: async data => { shared = data; throw Object.assign(new Error(), { name: "AbortError" }); } };
  vm.runInContext(saveSource, f.context);
  await f.node("saveImageBtn").listeners.get("click")({ preventDefault() {}, stopPropagation() {} });
  assert.equal(await shared.files[0].text(), "a");
  assert.equal(f.node("toast").textContent, "Save cancelled");
}
console.log("PASS: save uses original puzzle bytes and reports cancellation honestly.");

{
  const f = fixture(); await flush();
  vm.runInContext(dialogSource, f.context);
  const game = f.window.PiczzleGame;
  assert.equal(f.node("appVersion").textContent, `Build ${game.version}`);
  f.test.state.solved = true;
  f.test.state.square = "data:image/jpeg;base64,c29sdmVk";
  f.window.dispatchEvent(new Event("piczzle:solved"));
  assert.equal(f.node("completedPhoto").src, f.test.state.square);
  assert.equal(f.node("completedPhoto").hidden, false);
  f.test.state.solved = false;
  f.window.dispatchEvent(new Event("piczzle:solved"));
  assert.equal(f.node("completedPhoto").hidden, true);
  assert.equal(f.node("completedPhoto").src, undefined);
  f.node("app").classList.add("playMode");
  f.test.state.board = [3, null]; f.test.state.moves = 1;
  const board = f.test.state.board;
  f.node("solveBtn").onclick = undefined;
  f.test.state.pieces = [{ id: 3, url: "blob:test" }];
  // Closing a confirmation must resolve its promise as Cancel, not lose progress.
  const restart = f.node("restartBtn").onclick();
  assert.equal(f.node("confirmModal").classList.contains("show"), true);
  assert.equal(game.back(), true);
  await restart;
  assert.equal(f.test.state.board, board);
  assert.equal(f.node("app").classList.contains("playMode"), true);
  f.node("shareModal").classList.add("show");
  assert.equal(game.back(), true);
  assert.equal(f.node("shareModal").classList.contains("show"), false);
  f.test.start(); f.tick(); assert.equal(f.test.state.time, 1);
  game.setActive(false); f.tick(); assert.equal(f.test.state.time, 1);
  game.setActive(true); f.context.document.hidden = true; f.tick(); assert.equal(f.test.state.time, 1);
  f.context.document.hidden = false; f.tick(); assert.equal(f.test.state.time, 2);
  assert.equal(game.back(), true);
  assert.equal(f.node("panel").classList.contains("mobile-size"), true);
  f.tick(); assert.equal(f.test.state.time, 2);
  assert.equal(f.test.state.board, board); assert.equal(f.test.state.moves, 1);
  assert.equal(game.back(), true); assert.equal(f.node("panel").classList.contains("mobile-crop"), true);
  assert.equal(game.back(), true); assert.equal(f.node("panel").classList.contains("mobile-upload"), true);
  assert.equal(game.back(), false);
  f.node("stepPlay").onclick();
  f.tick(); assert.equal(f.test.state.time, 3);
  f.test.state.solved = true; f.tick(); assert.equal(f.test.state.time, 3);
}
console.log("PASS: Back cancels dialogs, preserves the puzzle and steps through setup; hidden/background timers pause.");

{
  const calls = [];
  const context = vm.createContext({ window: { PiczzleShareConfig: { enabled: true, supabaseUrl: "https://example.test", supabaseAnonKey: "test", publicBaseUrl: "https://example.test/index.html" } }, AbortController, setTimeout, clearTimeout, URL,
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => [] }; } });
  vm.runInContext(cloudSource, context);
  const cloud = context.window.PiczzleShareCloud;
  await cloud.savePuzzle({ id: "id", image: "image", size: 4 });
  assert.equal(calls[0].options.headers.Prefer, "return=minimal");
  assert.equal(await cloud.loadPuzzle("id"), null);
  assert.match(calls[1].url, /rpc\/get_shared_puzzle$/);
  assert.equal(JSON.parse(calls[1].options.body).puzzle_id, "id");
}
console.log("PASS: sharing inserts without returning photos and reads via single-id RPC.");

{
  const config = { enabled: true, supabaseUrl: "https://example.test", supabaseAnonKey: "test" };
  const makeCloud = (fetch, timers = {}) => {
    const context = vm.createContext({ window: { PiczzleShareConfig: config }, AbortController,
      setTimeout, clearTimeout, URL, fetch, ...timers });
    vm.runInContext(cloudSource, context);
    return context.window.PiczzleShareCloud;
  };
  let calls = 0;
  const transitional = makeCloud(async () => ++calls === 1 ?
    { ok: false, status: 404, json: async () => ({ code: "PGRST202" }) } :
    { ok: true, status: 200, json: async () => [{ id: "id", image: "test", size: 4 }] });
  assert.equal((await transitional.loadPuzzle("id")).id, "id");
  assert.equal(calls, 2);
  calls = 0;
  const forbidden = makeCloud(async () => {
    calls++;
    return { ok: false, status: 403, json: async () => ({ code: "42501" }) };
  });
  await assert.rejects(forbidden.loadPuzzle("id"), /403/);
  assert.equal(calls, 1);
  const missing = makeCloud(async () => ({ ok: true, status: 200, json: async () => [] }));
  assert.equal(await missing.loadPuzzle("expired-or-missing"), null);
  const invalid = makeCloud(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError("invalid JSON"); } }));
  await assert.rejects(invalid.loadPuzzle("id"), SyntaxError);

  // The body can stall after headers succeed; trigger the real abort handler without a 12-second test wait.
  let deadline;
  let cleared = false;
  const stalled = makeCloud(async (_url, options) => ({ ok: true, status: 200,
    json: () => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(Object.assign(new Error("timed out"), { name: "AbortError" })));
      queueMicrotask(() => { assert.equal(cleared, false); deadline(); });
    }) }), { setTimeout: callback => { deadline = callback; return 1; }, clearTimeout: () => { cleared = true; } });
  await assert.rejects(stalled.loadPuzzle("id"), { name: "AbortError" });
  assert.equal(cleared, true);
}
console.log("PASS: sharing fallback is limited to a missing RPC; permission, missing, corrupt and stalled-body cases are handled.");
