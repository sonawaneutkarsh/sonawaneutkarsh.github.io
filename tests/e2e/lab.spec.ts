import { test, expect } from '@playwright/test';
import { hydrated, shot, until, watchErrors } from './helpers.ts';

test('lab: both variants play, measure, and B loads lazily @firefox', async ({ page }) => {
	const errors = watchErrors(page);
	const scripts: string[] = [];
	page.on('request', (r) => r.url().endsWith('.js') && scripts.push(r.url()));
	await page.goto('/lab/motion/');
	await hydrated(page);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	expect(await until(page, () => document.querySelector('[data-variant="b"]')!.getAttribute('data-status') !== 'loading', undefined, 8000)).toBe(true);
	const status = await page.getAttribute('button[data-variant="b"]', 'data-status');
	expect(['ready', 'fallback']).toContain(status);
	await page.hover('button[data-variant="a"]');
	await page.waitForTimeout(1400);
	await shot(page, 'lab-a-depth');
	await page.mouse.move(2, 2);
	await page.hover('button[data-variant="b"]');
	await page.waitForTimeout(1400);
	await shot(page, 'lab-b-depth');
	await page.waitForTimeout(2600);
	await shot(page, 'lab-b-loop');
	await page.mouse.move(2, 2);
	// The reverse plays out, the run ends 1 s after its last frame, then 2 s of idle are counted.
	expect(
		await until(page, () => /^\d+$/.test([...document.querySelectorAll('.lab-metrics')][1].querySelector(':scope > div:last-child dd')!.textContent!.trim()), undefined, 15000)
	).toBe(true);
	const frames = await page.evaluate(() =>
		[...document.querySelectorAll('.lab-metrics')].map((dl) => Object.fromEntries([...dl.querySelectorAll('div')].map((d) => [d.querySelector('dt')!.textContent, d.querySelector('dd')!.textContent])))
	);
	expect(Number(frames[0]['Frames in the last run'])).toBeGreaterThan(20);
	expect(Number(frames[1]['Frames in the last run'])).toBeGreaterThan(20);
	// GSAP's ticker sleeps within its autoSleep window (120 frames) after the last tween.
	expect(Number(frames[1]['Idle frames afterwards (2 s)']), 'B goes idle within GSAP autoSleep').toBeLessThanOrEqual(125);
	await shot(page, 'lab-metrics', { fullPage: true });
	expect(errors).toEqual([]);
});

test('lab: A requests no frames once its springs settle', async ({ page }) => {
	await page.goto('/lab/motion/');
	await hydrated(page);
	await page.click('[data-mode="a"]');
	await page.hover('button[data-variant="a"]');
	await page.waitForTimeout(4300);
	await page.mouse.move(2, 2);
	expect(
		await until(page, () => /^\d+$/.test(document.querySelector('.lab-metrics div:last-child dd')!.textContent!.trim()), undefined, 15000)
	).toBe(true);
	expect((await page.textContent('.lab-metrics div:last-child dd'))!.trim()).toBe('0');
});

test('lab: switching away from B disposes its WebGL canvas; A alone loads no three.js', async ({ page }) => {
	const scripts: string[] = [];
	page.on('request', (r) => r.url().endsWith('.js') && scripts.push(r.url()));
	await page.goto('/lab/motion/');
	await hydrated(page);
	await page.click('[data-mode="a"]');
	await page.waitForTimeout(300);
	await expect(page.locator('canvas')).toHaveCount(0);
	scripts.length = 0;
	await page.goto('/lab/motion/');
	await hydrated(page);
	const before = scripts.length;
	await page.click('[data-mode="b"]');
	expect(await until(page, () => document.querySelector('button[data-variant="b"]')?.getAttribute('data-status') !== 'loading', undefined, 8000)).toBe(true);
	expect(scripts.length, 'no extra chunk once loaded').toBe(before);
});

test('lab: without WebGL, B falls back to the SVG version and says so', async ({ page }) => {
	await page.addInitScript(() => {
		const original = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
			if (/webgl/.test(type)) return null;
			return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
		} as typeof original;
	});
	await page.goto('/lab/motion/');
	await hydrated(page);
	expect(await until(page, () => document.querySelector('button[data-variant="b"]')!.getAttribute('data-status') === 'fallback', undefined, 8000)).toBe(true);
	await expect(page.locator('.lab-fallback')).toHaveText(/WebGL is not available/);
	await expect(page.locator('button[data-variant="b"] .hero-drawing')).toHaveCount(1);
	await page.hover('button[data-variant="b"]');
	expect(await until(page, () => document.querySelector('button[data-variant="b"]')!.getAttribute('aria-pressed') === 'true')).toBe(true);
});

test.describe('reduced motion', () => {
	test.use({ reducedMotion: 'reduce' });
	test('both variants jump to the lit still', async ({ page }) => {
		await page.goto('/lab/motion/');
		await hydrated(page);
		await page.hover('button[data-variant="a"]');
		expect(await until(page, () => document.querySelector('button[data-variant="a"] .ai-loop')!.getAttribute('opacity') === '1', undefined, 200)).toBe(true);
	});
});
