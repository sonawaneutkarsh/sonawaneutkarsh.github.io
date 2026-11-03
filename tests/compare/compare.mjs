#!/usr/bin/env node
// Measure and photograph vanilla Portfolio V3 and the Svelte build side by side.
//
//   VANILLA_ROOT=/path/to/v3-checkout node tests/compare/compare.mjs
//
// VANILLA_ROOT is a checkout of feat/interactive-portfolio-v3 at 36fe033
// (for example `git worktree add --detach ../v3 36fe033`); the Svelte site is
// ./build (npm run build). Both are served by the same GitHub-Pages-like
// server, uncompressed; gzip sizes are computed from the bytes (level 6).
// Numbers come from a local server with no throttling in headless Chromium,
// so read them as relative, not as field performance.
//
// Writes docs/portfolio-v3-svelte/compare/results.json and, with
// SCREENSHOTS=1, the same scenes from both into docs/portfolio-v3-svelte/compare/.

import { chromium } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { serve } from '../support/server.mjs';

const REPO = resolve(import.meta.dirname, '..', '..');
const OUT = join(REPO, 'docs', 'portfolio-v3-svelte', 'compare');
const VANILLA = process.env.VANILLA_ROOT;
const SVELTE = resolve(REPO, process.env.SVELTE_ROOT ?? 'build');
const RUNS = Number(process.env.RUNS ?? 3);
if (!VANILLA || !existsSync(join(VANILLA, 'index.html'))) {
	console.error('Set VANILLA_ROOT to a checkout of the vanilla V3 site (36fe033).');
	process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const ROUTES = ['/', '/explore/', '/notebook/adr-extraction-demo/', '/blog/', '/blog/80-percent-sleep/', '/projects/clage/'];
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const kb = (n) => Math.round((n / 1024) * 10) / 10;

const INIT = () => {
	const w = window;
	w.__raf = 0;
	const raf = window.requestAnimationFrame.bind(window);
	window.requestAnimationFrame = (cb) => (w.__raf++, raf(cb));
	w.__cls = 0;
	w.__lcp = 0;
	w.__ready = null;
	try {
		new PerformanceObserver((list) => {
			for (const e of list.getEntries()) if (!e.hadRecentInput) w.__cls += e.value;
		}).observe({ type: 'layout-shift', buffered: true });
		new PerformanceObserver((list) => {
			for (const e of list.getEntries()) w.__lcp = e.startTime;
		}).observe({ type: 'largest-contentful-paint', buffered: true });
	} catch {}
	new MutationObserver(() => {
		if (w.__ready === null && document.documentElement.hasAttribute('data-hydrated')) w.__ready = performance.now();
	}).observe(document.documentElement, { attributes: true });
};

async function measure(browser, origin, route) {
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
	const page = await context.newPage();
	await page.addInitScript(INIT);
	const cdp = await context.newCDPSession(page);
	await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
	await cdp.send('Performance.enable');
	const responses = [];
	page.on('response', async (r) => {
		try {
			const body = await r.body();
			responses.push({ url: r.url(), type: r.request().resourceType(), bytes: body.length, gzip: gzipSync(body, { level: 6 }).length });
		} catch {}
	});
	await page.goto(origin + route, { waitUntil: 'load' });
	await page.waitForTimeout(1200);
	const timing = await page.evaluate(() => {
		const nav = performance.getEntriesByType('navigation')[0];
		const fcp = performance.getEntriesByName('first-contentful-paint')[0];
		return {
			fcp: fcp ? Math.round(fcp.startTime) : null,
			lcp: Math.round(window.__lcp),
			dcl: Math.round(nav.domContentLoadedEventEnd),
			load: Math.round(nav.loadEventEnd),
			ready: window.__ready === null ? Math.round(nav.domContentLoadedEventEnd) : Math.round(window.__ready),
			cls: Math.round(window.__cls * 1000) / 1000
		};
	});
	const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
	const before = await metrics();
	const raf0 = await page.evaluate(() => window.__raf);
	await page.waitForTimeout(2000);
	const after = await metrics();
	const idleFrames = (await page.evaluate(() => window.__raf)) - raf0;
	const byType = {};
	for (const r of responses) {
		const t = byType[r.type] ?? (byType[r.type] = { bytes: 0, gzip: 0, files: 0 });
		t.bytes += r.bytes;
		t.gzip += r.gzip;
		t.files++;
	}
	await context.close();
	return {
		...timing,
		requests: responses.length,
		totalKB: kb(responses.reduce((a, r) => a + r.bytes, 0)),
		jsKB: kb(byType.script?.bytes ?? 0),
		jsGzipKB: kb(byType.script?.gzip ?? 0),
		jsFiles: byType.script?.files ?? 0,
		cssGzipKB: kb(byType.stylesheet?.gzip ?? 0),
		htmlKB: kb(byType.document?.bytes ?? 0),
		imgKB: kb(byType.image?.bytes ?? 0),
		idleFrames,
		idleTaskMs: Math.round((after.TaskDuration - before.TaskDuration) * 1000),
		heapMB: Math.round((after.JSHeapUsedSize / 1048576) * 10) / 10
	};
}

/** Hover the AI systems word for 4 s, leave, and count the work. */
async function interaction(browser, origin) {
	const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
	const page = await context.newPage();
	await page.addInitScript(INIT);
	const cdp = await context.newCDPSession(page);
	await cdp.send('Performance.enable');
	await page.goto(origin + '/', { waitUntil: 'load' });
	await page.waitForTimeout(1200);
	const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
	await page.evaluate(() => {
		window.__loaf = 0;
		window.__loafMs = 0;
		try {
			new PerformanceObserver((list) => {
				for (const e of list.getEntries()) {
					window.__loaf++;
					window.__loafMs = Math.max(window.__loafMs, e.duration);
				}
			}).observe({ type: 'long-animation-frame' });
		} catch {}
	});
	const m0 = await metrics();
	const f0 = await page.evaluate(() => window.__raf);
	await page.hover('[data-hero-icon="ai"] .hero-word');
	await page.waitForTimeout(4000);
	await page.mouse.move(4, 880);
	await page.waitForTimeout(2500);
	const m1 = await metrics();
	const f1 = await page.evaluate(() => window.__raf);
	await page.waitForTimeout(2000);
	const f2 = await page.evaluate(() => window.__raf);
	const loaf = await page.evaluate(() => [window.__loaf, Math.round(window.__loafMs)]);
	await context.close();
	return {
		rafCalls: f1 - f0,
		scriptMs: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000),
		taskMs: Math.round((m1.TaskDuration - m0.TaskDuration) * 1000),
		layoutMs: Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000),
		styleMs: Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000),
		longFrames: loaf[0],
		longestFrameMs: loaf[1],
		framesAfterSettling: f2 - f1
	};
}

const SCENES = [
	['home-1440', 1440, '/', null],
	['home-ai', 1440, '/', async (p) => (await p.hover('[data-hero-icon="ai"] .hero-word'), p.waitForTimeout(800))],
	['home-ai-end', 1440, '/', async (p) => (await p.hover('[data-hero-icon="ai"] .hero-word'), p.waitForTimeout(3400))],
	['home-software', 1440, '/', async (p) => (await p.hover('[data-hero-icon="software"] .hero-word'), p.waitForTimeout(2200))],
	['home-research', 1440, '/', async (p) => (await p.hover('[data-hero-icon="research"] .hero-word'), p.waitForTimeout(2600))],
	['home-1024-ai', 1024, '/', async (p) => (await p.hover('[data-hero-icon="ai"] .hero-word'), p.waitForTimeout(2600))],
	['home-390', 390, '/', async (p) => p.waitForTimeout(3200)],
	['projects-talks', 1440, '/', async (p) => (await p.locator('.project-row').nth(2).scrollIntoViewIfNeeded(), await p.hover('.project-row:nth-of-type(3) h3 a'), p.waitForTimeout(2600))],
	['projects-devvy', 1440, '/', async (p) => (await p.locator('.project-row').nth(3).scrollIntoViewIfNeeded(), await p.hover('.project-row:nth-of-type(4) h3 a'), p.waitForTimeout(4200))],
	['explore', 1440, '/explore/', async (p) => (await p.evaluate(() => document.getElementById('bench').scrollIntoView()), p.waitForTimeout(600))],
	['explore-selected', 1440, '/explore/', async (p) => (await p.evaluate(() => document.getElementById('bench').scrollIntoView()), await p.click('#clage .bench-object'), p.waitForTimeout(900))],
	['explore-390', 390, '/explore/', async (p) => p.waitForTimeout(400)],
	['demo-review', 1440, '/notebook/adr-extraction-demo/', async (p) => (await p.click('[data-example="1"]'), await p.click('[data-goto="5"]'), p.waitForTimeout(900))],
	['demo-390', 390, '/notebook/adr-extraction-demo/', async (p) => (await p.click('[data-goto="5"]'), p.waitForTimeout(700))]
];

async function screenshots(browser, name, origin) {
	for (const [scene, width, route, act] of SCENES) {
		const mobile = width < 720;
		const context = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
		const page = await context.newPage();
		await page.goto(origin + route, { waitUntil: 'load' });
		await page.waitForTimeout(400);
		if (act) await act(page);
		await page.screenshot({ path: join(OUT, `${scene}-${name}.png`) });
		await context.close();
	}
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--enable-unsafe-swiftshader'] });
const sites = { vanilla: VANILLA, svelte: SVELTE };
const results = { generated: new Date().toISOString(), browser: browser.version(), runs: RUNS, routes: {}, interaction: {} };
for (const [name, root] of Object.entries(sites)) {
	const server = await serve(root);
	const origin = `http://127.0.0.1:${server.address().port}`;
	for (const route of ROUTES) {
		const runs = [];
		for (let i = 0; i < RUNS; i++) runs.push(await measure(browser, origin, route));
		const merged = {};
		for (const key of Object.keys(runs[0])) merged[key] = median(runs.map((r) => r[key]));
		(results.routes[route] ??= {})[name] = merged;
	}
	const inter = [];
	for (let i = 0; i < RUNS; i++) inter.push(await interaction(browser, origin));
	results.interaction[name] = Object.fromEntries(Object.keys(inter[0]).map((k) => [k, median(inter.map((r) => r[k]))]));
	if (process.env.SCREENSHOTS) await screenshots(browser, name, origin);
	server.close();
}
await browser.close();
writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 2) + '\n');

const rows = [];
for (const [route, r] of Object.entries(results.routes)) {
	for (const name of ['vanilla', 'svelte']) rows.push({ route, impl: name, ...r[name] });
}
console.table(rows.map(({ route, impl, totalKB, jsKB, jsGzipKB, jsFiles, cssGzipKB, requests, fcp, lcp, dcl, ready, cls, idleFrames, idleTaskMs, heapMB }) => ({ route, impl, totalKB, jsKB, jsGzipKB, jsFiles, cssGzipKB, requests, fcp, lcp, dcl, ready, cls, idleFrames, idleTaskMs, heapMB })));
console.table(results.interaction);
