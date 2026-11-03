import { expect, type Page, type ConsoleMessage } from '@playwright/test';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const WIDTHS = [1440, 1280, 1024, 900, 768, 390, 320];
export const SHOTS = join(import.meta.dirname, '..', '..', 'docs', 'portfolio-v3-svelte', 'screenshots');

/** Console errors, page errors and Svelte hydration warnings seen by `page`. */
export function watchErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
	page.on('console', (m: ConsoleMessage) => {
		const text = m.text();
		if (m.type() === 'error') errors.push(`console: ${text}`);
		// Svelte reports hydration mismatches as warnings (svelte.dev/e/hydration_mismatch).
		else if (m.type() === 'warning' && /hydration|svelte\.dev\/e\//i.test(text)) errors.push(`svelte: ${text}`);
	});
	return errors;
}

/** Wait until SvelteKit has hydrated the page. */
export const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });

export const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Poll a page function until it returns truthy. */
export async function until<T>(page: Page, fn: (arg: T) => unknown, arg?: T, timeout = 3000): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		if (await page.evaluate(fn as (arg: unknown) => unknown, arg)) return true;
		await page.waitForTimeout(50);
	}
	return false;
}

/** Count every requestAnimationFrame call from page start (install before goto). */
export async function countFrames(page: Page) {
	await page.addInitScript(() => {
		const w = window as unknown as { __raf: number };
		w.__raf = 0;
		const original = window.requestAnimationFrame.bind(window);
		window.requestAnimationFrame = (cb) => {
			w.__raf++;
			return original(cb);
		};
	});
	return {
		read: () => page.evaluate(() => (window as unknown as { __raf: number }).__raf)
	};
}

export async function shot(page: Page, name: string, options: { fullPage?: boolean } = {}) {
	if (!process.env.SCREENSHOTS) return;
	mkdirSync(SHOTS, { recursive: true });
	await page.screenshot({ path: join(SHOTS, `${name}.png`), ...options });
}

/** Every route of the site, built output. */
export function routes() {
	const build = join(import.meta.dirname, '..', '..', 'build');
	const dirs = (sub: string) =>
		readdirSync(join(build, sub)).filter((d) => existsSync(join(build, sub, d, 'index.html')));
	return [
		'/',
		'/explore/',
		'/notebook/',
		'/notebook/adr-extraction-demo/',
		'/blog/',
		'/lab/motion/',
		'/404.html',
		...dirs('projects').map((p) => `/projects/${p}/`),
		...dirs('blog')
			.filter((p) => p !== 'hello-world')
			.map((p) => `/blog/${p}/`)
	];
}

export async function rectOf(page: Page, selector: string) {
	const box = await page.locator(selector).first().boundingBox();
	expect(box, `${selector} has a box`).not.toBeNull();
	return box!;
}
