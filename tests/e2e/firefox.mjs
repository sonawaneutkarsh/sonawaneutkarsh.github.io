#!/usr/bin/env node
// Firefox smoke tests over WebDriver BiDi. Zero dependencies (Node 22+ and a
// Firefox binary). Covers what most often differs between engines: module
// loading, console errors, layout overflow, the hero icons, the previews,
// explorer history and the ADR walkthrough. Interactions use DOM events from
// script, not native input, so they check behavior, not real gestures.
//
//   FIREFOX_PATH=/usr/bin/firefox node tests/e2e/firefox.mjs
//   SCREENSHOTS=1 ...   # also write docs/portfolio-v3/screenshots/firefox-*.png

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "./lib/server.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SHOTS = join(ROOT, "docs", "portfolio-v3", "screenshots");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const binary = [process.env.FIREFOX_PATH, "/usr/bin/firefox", "/usr/lib/firefox/firefox", "/Applications/Firefox.app/Contents/MacOS/firefox"].find(
  (p) => p && existsSync(p),
);
if (!binary) {
  console.error("No Firefox found. Set FIREFOX_PATH.");
  process.exit(2);
}

let failures = 0;
let total = 0;
function check(name, ok, detail = "") {
  total += 1;
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

/* ---------------- minimal BiDi client ---------------- */
const port = 9600 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), "v3-firefox-"));
const child = spawn(binary, ["--headless", "--no-remote", "--profile", profile, `--remote-debugging-port=${port}`, "about:blank"], {
  stdio: ["ignore", "ignore", "pipe"],
});
child.stderr.on("data", () => {});

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  await sleep(200);
  try {
    ws = await new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://127.0.0.1:${port}/session`);
      socket.onopen = () => resolve(socket);
      socket.onerror = reject;
    });
  } catch {
    ws = null;
  }
}
if (!ws) {
  console.error("Firefox did not open a WebDriver BiDi endpoint.");
  child.kill();
  process.exit(2);
}
let nextId = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id !== undefined && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.type === "error") reject(new Error(`${msg.error}: ${msg.message}`));
    else resolve(msg.result);
  } else if (msg.method === "log.entryAdded" && msg.params.level === "error") {
    errors.push(msg.params.text);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const session = await send("session.new", { capabilities: {} });
const version = session.capabilities.browserVersion;
await send("session.subscribe", { events: ["log.entryAdded"] });
const { contexts } = await send("browsingContext.getTree", {});
const context = contexts[0].context;
// Headless windows are not focused by default; focus events need that.
await send("browsingContext.activate", { context }).catch(() => {});

const server = await serve(ROOT);
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

async function open(path, width = 1440, height = 900) {
  await send("browsingContext.setViewport", { context, viewport: { width, height } });
  errors.length = 0;
  await send("browsingContext.navigate", { context, url: `${ORIGIN}${path}`, wait: "complete" });
  await sleep(250);
}
/** Evaluate an expression; it must produce JSON-serializable data. */
async function evaluate(expression) {
  const result = await send("script.evaluate", {
    expression: `(async () => JSON.stringify(await (${expression})))()`,
    target: { context },
    awaitPromise: true,
  });
  if (result.type === "exception") throw new Error(result.exceptionDetails.text);
  return result.result.value === undefined ? undefined : JSON.parse(result.result.value);
}
async function until(expression, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return true;
    await sleep(60);
  }
  return false;
}
async function shot(name) {
  if (!process.env.SCREENSHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const { data } = await send("browsingContext.captureScreenshot", { context });
  writeFileSync(join(SHOTS, `firefox-${name}.png`), Buffer.from(data, "base64"));
}
const overflow = () => evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth");

/* ---------------- checks ---------------- */
console.log(`Firefox ${version}`);
try {
  const routes = ["/", "/explore/", "/notebook/", "/notebook/adr-extraction-demo/", "/blog/", "/projects/clage/", "/projects/nytr/", "/projects/talks/", "/projects/devvy/", "/projects/scholarai/", "/blog/80-percent-sleep/"];
  for (const path of routes) {
    for (const width of [1440, 390]) {
      await open(path, width, width < 720 ? 844 : 900);
      const over = await overflow();
      check(`${path} @${width}: no console errors, no overflow`, errors.length === 0 && over <= 0, `${errors.join("; ")} overflow=${over}`);
    }
  }

  await open("/");
  check("home: ES modules ran (preview frames enhanced)", await evaluate("document.querySelectorAll('.project-media.is-enhanced').length === 4"));
  await evaluate("(document.querySelector('[data-hero-icon=\"ai\"]').focus(), true)");
  // Headless Firefox never gives the document focus, so focus events do not
  // fire there; keyboard focus is covered by the Chrome suite. Use a mouse
  // pointerenter, which is what a hover delivers.
  const focused = await evaluate("document.hasFocus()");
  if (focused) {
    check("home: focusing the AI icon lights it", await until("document.querySelector('[data-hero-icon=\"ai\"]').classList.contains('is-lit')"));
  } else {
    console.log("  skip home: keyboard focus (headless document has no focus)");
    await evaluate("(document.querySelector('[data-hero-icon=\"ai\"]').dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' })), true)");
    check("home: hovering the AI icon (pointerenter) lights it", await until("document.querySelector('[data-hero-icon=\"ai\"]').classList.contains('is-lit')"));
  }
  check("home: AI icon reaches the agent loop", await until("Number(document.querySelector('[data-hero-icon=\"ai\"] .a-loop').getAttribute('opacity')) > 0.8", 3000));
  await shot("home-icon-ai");
  await evaluate("(document.activeElement.blur(), document.querySelector('[data-hero-icon=\"ai\"]').dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })), true)");
  await evaluate("(document.querySelector('[data-name=\"Talks\"] .preview-toggle').click(), true)");
  check("home: Talks diagram runs", await until("document.querySelector('[data-name=\"Talks\"]').classList.contains('is-active') && !!document.querySelector('[data-name=\"Talks\"] .preview-diagram')"));
  await sleep(1500);
  await evaluate("(document.querySelector('[data-name=\"Talks\"]').scrollIntoView({block:'center'}), true)");
  await shot("home-preview-talks");
  // Keep the frame on screen: previews pause when scrolled away, by design.
  await evaluate("(document.querySelector('[data-name=\"Nytr\"]').scrollIntoView({block:'center'}), true)");
  await sleep(200);
  await evaluate("(document.querySelector('[data-name=\"Nytr\"] .preview-toggle').click(), true)");
  const nytr = await until(
    "(() => { const m = document.querySelector('[data-name=\"Nytr\"]'); const v = m.querySelector('video'); return (v && !v.paused && v.currentTime > 0) || m.classList.contains('is-playing') || m.classList.contains('is-poster-only') || m.classList.contains('is-video-failed'); })()",
    6000,
  );
  const how = await evaluate(
    "(() => { const m = document.querySelector('[data-name=\"Nytr\"]'); const v = m.querySelector('video'); return v && !v.paused && v.currentTime > 0 ? 'plays' : m.className; })()",
  );
  check("home: Nytr preview plays, or falls back to its poster", nytr, how);
  check("home: Talks stopped when Nytr started (one at a time)", await evaluate("!document.querySelector('[data-name=\"Talks\"]').classList.contains('is-active')"));

  await open("/explore/");
  check("explore: workbench enhanced with 4 connectors", await evaluate("document.body.classList.contains('bench-ready') && document.querySelectorAll('.bench-link').length === 4"));
  const lenStart = await evaluate("history.length");
  await evaluate("(document.querySelector('#clage .bench-object').click(), true)");
  check("explore: clicking opens the panel and pushes one entry", await until("!document.getElementById('bench-panel').hidden && location.hash === '#clage'") && (await evaluate("history.length")) === lenStart + 1);
  await evaluate("(document.querySelector('#bench-panel [data-step=\"1\"]').click(), true)");
  check("explore: Next replaces the entry", (await evaluate("history.length")) === lenStart + 1 && (await until("location.hash === '#pyopt'")));
  await shot("explore-selected");
  await evaluate("(history.back(), true)");
  check("explore: Back closes the panel", await until("document.getElementById('bench-panel').hidden && location.hash === ''"));
  await evaluate("(history.forward(), true)");
  check("explore: Forward reopens it", await until("!document.getElementById('bench-panel').hidden && location.hash === '#pyopt'"));
  await evaluate("(document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), true)");
  check("explore: Esc closes via Back without a new entry", await until("document.getElementById('bench-panel').hidden") && (await evaluate("history.length")) === lenStart + 1);
  await evaluate("(document.querySelector('[data-filter=\"ai\"]').click(), true)");
  check("explore: filter updates URL and mutes others", await until("location.search === '?filter=ai' && document.querySelector('#devvy').classList.contains('is-muted')"));
  await evaluate("(history.back(), true)");
  check("explore: Back restores All", await until("location.search === '' && !document.querySelector('#devvy').classList.contains('is-muted')"));
  const layout = await evaluate(`(() => {
    const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const labels = [...document.querySelectorAll('.bench-link text')].map((t) => t.getBoundingClientRect());
    const cards = [...document.querySelectorAll('.bench-object')].map((c) => c.getBoundingClientRect());
    return labels.filter((l) => cards.some((c) => hit(l, c))).length;
  })()`);
  check("explore: connector labels clear every card in Firefox's layout", layout === 0, `${layout} overlaps`);
  await evaluate("(document.getElementById('bench').scrollIntoView(), true)");
  await shot("explore-overview");

  await open("/notebook/adr-extraction-demo/");
  await evaluate("(document.querySelector('[data-example=\"1\"]').click(), document.querySelector('[data-goto=\"5\"]').click(), true)");
  check("demo: steps to review with three verdicts and connectors", await until("document.querySelector('.adr-demo').dataset.step === '5' && document.querySelectorAll('.adr-example:not([hidden]) .adr-link').length === 3"));
  await sleep(800);
  await shot("demo-review");
  check("demo: no console errors", errors.length === 0, errors.join("; "));
} catch (error) {
  check("firefox suite crashed", false, error.stack || String(error));
} finally {
  try {
    await send("session.end", {});
  } catch {
    /* ignore */
  }
  ws.close();
  child.kill();
  server.close();
}
console.log(`\n${total - failures}/${total} Firefox checks passed.`);
process.exit(failures ? 1 : 0);
