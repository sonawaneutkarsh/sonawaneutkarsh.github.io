#!/usr/bin/env node
// Measure page weight, load timing and idle animation work for a set of
// routes. Compare two checkouts by pointing ROOT at each:
//
//   node tests/e2e/perf.mjs                 # this checkout
//   ROOT=/path/to/main-checkout node tests/e2e/perf.mjs
//
// Numbers are from a local server with no throttling, so treat them as
// relative, not as field performance.

import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { launch } from "./lib/browser.mjs";
import { serve } from "./lib/server.mjs";

const ROOT = resolve(process.env.ROOT || join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const ROUTES = (process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/explore/", "/notebook/adr-extraction-demo/", "/blog/80-percent-sleep/", "/projects/clage/"])
  .filter((route) => existsSync(join(ROOT, route, route.endsWith("/") ? "index.html" : "")));

const server = await serve(ROOT);
const origin = `http://127.0.0.1:${server.address().port}`;
const page = await launch();
await page.send("Network.setCacheDisabled", { cacheDisabled: true });
await page.send("Page.addScriptToEvaluateOnNewDocument", {
  source: `window.__raf = 0; const __r = window.requestAnimationFrame.bind(window);
           window.requestAnimationFrame = (cb) => { window.__raf++; return __r(cb); };`,
});

const rows = [];
for (const route of ROUTES) {
  await page.viewport(1440, 900);
  const sizes = new Map();
  const types = new Map();
  const onResponse = (p) => types.set(p.requestId, p.type);
  const onFinished = (p) => sizes.set(p.requestId, p.encodedDataLength);
  page.on("Network.responseReceived", onResponse);
  page.on("Network.loadingFinished", onFinished);
  await page.goto(`${origin}${route}`);
  await page.wait(1500);
  const timing = await page.eval(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return { fcp: fcp ? Math.round(fcp.startTime) : null, dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) };
  });
  const before = await page.eval(() => window.__raf);
  await page.wait(2000);
  const idleFrames = (await page.eval(() => window.__raf)) - before;
  const byType = {};
  let total = 0;
  for (const [id, bytes] of sizes) {
    const type = types.get(id) || "Other";
    byType[type] = (byType[type] || 0) + bytes;
    total += bytes;
  }
  rows.push({ route, kb: (total / 1024).toFixed(1), js: ((byType.Script || 0) / 1024).toFixed(1), css: ((byType.Stylesheet || 0) / 1024).toFixed(1), img: ((byType.Image || 0) / 1024).toFixed(1), media: ((byType.Media || 0) / 1024).toFixed(1), requests: sizes.size, ...timing, idleFrames });
  page.listeners.get("Network.responseReceived").splice(0);
  page.listeners.get("Network.loadingFinished").splice(0);
}
console.table(rows);
await page.close();
server.close();
