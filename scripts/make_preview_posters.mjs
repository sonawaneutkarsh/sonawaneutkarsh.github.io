#!/usr/bin/env node
// Regenerate the small WebP poster frames shown in the /explore/ project
// panels (src/lib/content/projects.ts). The full-size JPEG posters
// under static/images/projects/ are left untouched; these are 640px-wide
// derivatives drawn through headless Chromium's canvas encoder.
//
//   node scripts/make_preview_posters.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { serve } from "../tests/support/server.mjs";

const STATIC = join(dirname(fileURLToPath(import.meta.url)), "..", "static");
const JOBS = [
  ["images/projects/nytr/nytr-demo-poster.jpg", "images/previews/nytr-demo-poster-640.webp"],
  ["images/projects/clage/clage-studio-demo-poster.jpg", "images/previews/clage-studio-demo-poster-640.webp"],
];

const server = await serve(STATIC);
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage();
await page.goto(`${origin}/404.html`);
for (const [source, target] of JOBS) {
  const data = await page.evaluate(async (src) => {
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
  mkdirSync(join(STATIC, dirname(target)), { recursive: true });
  writeFileSync(join(STATIC, target), bytes);
  console.log(`static/${target}: ${bytes.length} bytes`);
}
await browser.close();
server.close();
