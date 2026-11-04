#!/usr/bin/env node
// Regenerate the small WebP poster frames used by the homepage video previews.
// The full-size JPEG posters under images/projects/ are left untouched; these
// are 640px-wide derivatives drawn through headless Chrome's canvas encoder.
//
//   node scripts/make_preview_posters.mjs

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "../tests/e2e/lib/browser.mjs";
import { serve } from "../tests/e2e/lib/server.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const JOBS = [
  ["images/projects/nytr/nytr-demo-poster.jpg", "images/previews/nytr-demo-poster-640.webp"],
  ["images/projects/clage/clage-studio-demo-poster.jpg", "images/previews/clage-studio-demo-poster-640.webp"],
];

const server = await serve(ROOT);
const origin = `http://127.0.0.1:${server.address().port}`;
const page = await launch();
await page.goto(`${origin}/404.html`);
for (const [source, target] of JOBS) {
  const data = await page.eval(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const width = 640;
    const height = Math.round((img.naturalHeight / img.naturalWidth) * width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/webp", 0.82);
  }, `/${source}`);
  const bytes = Buffer.from(data.split(",")[1], "base64");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(join(ROOT, dirname(target)), { recursive: true });
  writeFileSync(join(ROOT, target), bytes);
  console.log(`${target}: ${bytes.length} bytes`);
}
await page.close();
server.close();
