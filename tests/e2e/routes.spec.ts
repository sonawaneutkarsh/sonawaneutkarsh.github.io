import { test, expect } from '@playwright/test';
import { WIDTHS, overflow, routes, watchErrors } from './helpers.ts';

// Every route at every width: no sideways scrolling, no console errors, no
// hydration warnings. Static articles and case studies load no Svelte code.

for (const path of routes()) {
	test(`${path} renders cleanly at all widths`, async ({ page }) => {
		const errors = watchErrors(page);
		for (const width of WIDTHS) {
			await page.setViewportSize({ width, height: width < 720 ? 844 : 900 });
			await page.goto(path);
			await page.waitForLoadState('load');
			expect(await overflow(page), `${path} @${width}: horizontal overflow`).toBeLessThanOrEqual(0);
		}
		expect(errors, `${path}: errors`).toEqual([]);
	});
}

test('core pages render cleanly @firefox', async ({ page }) => {
	const errors = watchErrors(page);
	for (const path of ['/', '/explore/', '/notebook/adr-extraction-demo/', '/blog/', '/lab/motion/', '/projects/talks/', '/blog/80-percent-sleep/']) {
		for (const width of [1440, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto(path);
			await page.waitForLoadState('load');
			expect(await overflow(page), `${path} @${width}`).toBeLessThanOrEqual(0);
		}
	}
	expect(errors).toEqual([]);
});

test('static articles, case studies and /blog/ load no Svelte or animation code', async ({ page }) => {
	const requests: string[] = [];
	page.on('request', (r) => requests.push(r.url()));
	for (const path of ['/blog/80-percent-sleep/', '/projects/clage/', '/notebook/', '/blog/']) {
		requests.length = 0;
		await page.goto(path);
		await page.waitForLoadState('load');
		expect(requests.filter((u) => u.includes('/_app/')), path).toEqual([]);
	}
});

test('the homepage never loads three.js, GSAP or a video', async ({ page }) => {
	const requests: string[] = [];
	page.on('request', (r) => requests.push(r.url()));
	await page.goto('/');
	await page.hover('[data-hero-icon="ai"] .hero-word');
	await page.hover('.project-row:nth-of-type(1) h3 a');
	await page.waitForTimeout(1500);
	expect(requests.filter((u) => /\.mp4$/.test(u))).toEqual([]);
	const scripts = await page.evaluate(() =>
		performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.js')).map((e) => e.name)
	);
	// The three.js + GSAP chunk is the only chunk containing WebGLRenderer.
	for (const src of scripts) {
		const body = await (await page.request.get(src)).text();
		expect(body.includes('WebGLRenderer'), `${src} contains three.js`).toBe(false);
		expect(/gsap|GreenSock/i.test(body), `${src} contains GSAP`).toBe(false);
	}
});

test('case study keeps its own video with controls and preload=none', async ({ page }) => {
	await page.goto('/projects/clage/');
	const video = await page.evaluate(() => {
		const v = document.querySelector('video.project-video') as HTMLVideoElement | null;
		return v ? { controls: v.controls, preload: v.preload } : null;
	});
	expect(video).toEqual({ controls: true, preload: 'none' });
});

test('public URLs still resolve, feed and sitemap are served', async ({ request }) => {
	for (const path of ['/', '/#projects', '/explore/', '/blog/', '/notebook/', '/notebook/adr-extraction-demo/', '/resume.pdf', '/feed.xml', '/sitemap.xml', '/robots.txt', '/blog/hello-world/', '/projects/nytr/']) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(200);
	}
	expect((await request.get('/no-such-page/')).status()).toBe(404);
	const feed = await (await request.get('/feed.xml')).text();
	expect(feed).toContain('<rss version="2.0"');
	const sitemap = await (await request.get('/sitemap.xml')).text();
	expect(sitemap).not.toContain('/lab/');
});
