import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { hydrated, shot, until, watchErrors } from './helpers.ts';

// Real touch input through Chromium's input pipeline (DevTools protocol
// touch events), as V3 tested it: swipes, vertical scrolling, pinch, taps.
test.skip(({ browserName }) => browserName !== 'chromium', 'touch gestures use the Chromium DevTools protocol');
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

type Point = { x: number; y: number };

async function gesture(cdp: CDPSession, paths: [Point, Point][], steps = 12) {
	const at = (k: number) =>
		paths.map(([a, b], id) => ({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps, id }));
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(0) });
	for (let k = 1; k <= steps; k++) {
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(k) });
		await new Promise((r) => setTimeout(r, 16));
	}
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

const t = (page: Page) => page.evaluate(() => (document.querySelector('.bench-plane') as HTMLElement).style.transform);
const nums = (v: string) => (v.match(/-?\d+(\.\d+)?/g) || []).map(Number);
async function settle(page: Page) {
	let last = '';
	for (let i = 0; i < 40; i++) {
		const now = await t(page);
		if (now === last) return;
		last = now;
		await page.waitForTimeout(80);
	}
}
const center = async (page: Page) => {
	await page.evaluate(() => document.getElementById('bench')!.scrollIntoView({ block: 'center', behavior: 'instant' }));
	await page.waitForTimeout(250);
	const f = await page.evaluate(() => document.querySelector('.bench-viewport')!.getBoundingClientRect().toJSON());
	return { x: f.x + f.width / 2, y: f.y + f.height / 2 };
};

test('swipe, scroll, pinch and tap on the workbench', async ({ page }) => {
	const errors = watchErrors(page);
	const cdp = await page.context().newCDPSession(page);
	await page.goto('/explore/');
	await hydrated(page);
	expect(await page.evaluate(() => document.getElementById('bench')!.classList.contains('is-list'))).toBe(true);
	const scroll0 = await page.evaluate(() => scrollY);
	await gesture(cdp, [[{ x: 200, y: 700 }, { x: 205, y: 300 }]]);
	await page.waitForTimeout(700);
	expect(await page.evaluate(() => scrollY), 'the list scrolls with a vertical swipe').toBeGreaterThan(scroll0 + 100);

	await page.locator('[data-mode="bench"]').tap();
	await page.waitForTimeout(500);
	expect(await page.evaluate(() => /pinch with two fingers/.test(document.querySelector('.bench-hint')!.textContent!))).toBe(true);
	let c = await center(page);
	const offscreen = () =>
		page.evaluate(() => {
			const f = document.querySelector('.bench-viewport')!.getBoundingClientRect();
			const r = document.querySelector('#talks .bench-object')!.getBoundingClientRect();
			return r.right > f.right;
		});
	expect(await offscreen(), 'Talks starts off to the right on a phone').toBe(true);

	const before = nums(await t(page));
	const y0 = await page.evaluate(() => scrollY);
	await gesture(cdp, [[{ x: c.x + 120, y: c.y }, { x: c.x - 120, y: c.y + 6 }]]);
	await page.waitForTimeout(500);
	const after = nums(await t(page));
	expect(after[0], 'a sideways swipe pans').toBeLessThan(before[0] - 150);
	expect(await page.evaluate(() => scrollY), 'without scrolling the page').toBe(y0);

	// A released swipe coasts briefly; let it settle before the next gesture.
	await settle(page);
	const yBefore = await page.evaluate(() => scrollY);
	const tBefore = nums(await t(page));
	await gesture(cdp, [[{ x: c.x, y: c.y - 160 }, { x: c.x + 4, y: c.y + 160 }]]);
	await page.waitForTimeout(700);
	expect(await page.evaluate(() => scrollY), 'a vertical swipe scrolls the page').toBeLessThan(yBefore - 80);
	const tAfter = nums(await t(page));
	expect(Math.max(...tAfter.map((v, i) => Math.abs(v - tBefore[i]))), 'and leaves the bench where it was').toBeLessThan(0.5);

	c = await center(page);
	const s0 = nums(await t(page))[2];
	await gesture(cdp, [
		[{ x: c.x - 30, y: c.y }, { x: c.x - 100, y: c.y }],
		[{ x: c.x + 30, y: c.y }, { x: c.x + 100, y: c.y }]
	]);
	await page.waitForTimeout(400);
	const s1 = nums(await t(page))[2];
	expect(s1, 'pinch out zooms in').toBeGreaterThan(s0 * 2.5);
	expect(await page.evaluate(() => !window.visualViewport || window.visualViewport.scale === 1), 'the page itself does not zoom').toBe(true);
	expect(await page.evaluate(() => (document.getElementById('bench-panel') as HTMLElement).hidden), 'a pinch opens nothing').toBe(true);
	await gesture(cdp, [
		[{ x: c.x - 120, y: c.y }, { x: c.x - 20, y: c.y }],
		[{ x: c.x + 120, y: c.y }, { x: c.x + 20, y: c.y }]
	]);
	await page.waitForTimeout(400);
	const s2 = nums(await t(page))[2];
	expect(s2).toBeLessThan(s1);
	expect(s2).toBeGreaterThanOrEqual(0.25 - 1e-6);

	await page.locator('[data-zoom="reset"]').tap();
	await page.waitForTimeout(1200);
	c = await center(page);
	for (let i = 0; i < 5 && (await offscreen()); i++) {
		await gesture(cdp, [[{ x: c.x + 60, y: c.y }, { x: c.x - 60, y: c.y }]]);
		await page.waitForTimeout(450);
	}
	expect(await offscreen(), 'swiping brings Talks into view').toBe(false);
	const talks = await page.evaluate(() => {
		const r = document.querySelector('#talks .bench-object')!.getBoundingClientRect();
		return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
	});
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [talks] });
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	expect(await until(page, () => document.querySelector('#bench-panel .bench-title')?.textContent?.trim() === 'Talks'), 'a tap after panning opens it').toBe(true);
	await page.waitForTimeout(600);
	await shot(page, 'explore-mobile-bench-panel');
	expect(
		await page.evaluate(() => {
			const p = document.getElementById('bench-panel')!.getBoundingClientRect();
			const f = document.querySelector('.bench-viewport')!.getBoundingClientRect();
			const r = document.querySelector('#talks .bench-object')!.getBoundingClientRect();
			const cy = r.top + r.height / 2;
			return p.left >= f.left && p.right <= f.right + 1 && p.bottom <= f.bottom + 1 && cy > f.top && cy < p.top;
		}),
		'bottom sheet inside the bench, selected card visible above it'
	).toBe(true);
	expect(errors).toEqual([]);
});
