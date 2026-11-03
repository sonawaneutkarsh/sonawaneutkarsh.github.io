import { test, expect } from '@playwright/test';
import { hydrated } from './helpers.ts';

// Keyboard and screen-reader affordances the V3 pages had, checked on the
// Svelte routes: names, roles, landmarks, unique ids, focus order, no traps.

for (const path of ['/', '/explore/', '/notebook/adr-extraction-demo/', '/blog/', '/lab/motion/']) {
	test(`${path}: landmarks, names, ids and images @firefox`, async ({ page }) => {
		await page.goto(path);
		// /blog/ ships no JavaScript, so there is nothing to hydrate.
		if (path !== '/blog/') await hydrated(page);
		const audit = await page.evaluate(() => {
			const problems: string[] = [];
			const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
			const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
			if (dupes.length) problems.push(`duplicate ids: ${dupes.join(', ')}`);
			if (document.querySelectorAll('main').length !== 1) problems.push('one <main>');
			if (!document.querySelector('a.skip-link[href="#content"]') || !document.getElementById('content')) problems.push('skip link');
			if (document.querySelectorAll('h1').length !== 1) problems.push('one h1');
			for (const el of document.querySelectorAll<HTMLElement>('a[href], button')) {
				const name = (el.getAttribute('aria-label') || el.innerText || el.textContent || '').trim();
				if (!name && !el.closest('[aria-hidden="true"]') && el.offsetParent !== null) problems.push(`unnamed ${el.tagName} ${el.className}`);
			}
			for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) problems.push(`img without alt: ${img.src}`);
			for (const svg of document.querySelectorAll('svg')) {
				if (svg.getAttribute('aria-hidden') !== 'true' && !svg.getAttribute('role') && !svg.closest('[aria-hidden="true"]')) problems.push(`svg not hidden: ${svg.className.baseVal}`);
			}
			return problems;
		});
		expect(audit).toEqual([]);
	});
}

test('homepage: the keyboard reaches every link in reading order and focus is visible', async ({ page }) => {
	await page.goto('/');
	await hydrated(page);
	const seen: string[] = [];
	for (let i = 0; i < 80; i++) {
		await page.keyboard.press('Tab');
		const info = await page.evaluate(() => {
			const el = document.activeElement as HTMLElement;
			const style = getComputedStyle(el);
			return { href: el.getAttribute('href') ?? el.tagName, outline: style.outlineStyle !== 'none' && style.outlineWidth !== '0px' };
		});
		if (info.href === 'BODY') break;
		expect(info.outline, `${info.href} shows a focus ring`).toBe(true);
		seen.push(info.href);
	}
	for (const href of ['#content', '/#projects', '/explore/?filter=ai', '/#research', '/blog/', '/explore/', '/projects/nytr/', '/projects/clage/', '/projects/talks/', '/projects/devvy/', '/feed.xml']) {
		expect(seen, `Tab reaches ${href}`).toContain(href);
	}
	expect(seen.indexOf('/#projects')).toBeLessThan(seen.indexOf('/explore/?filter=ai'));
});

test('explorer panel: Esc closes it from anywhere inside, focus returns, no trap', async ({ page }) => {
	await page.goto('/explore/');
	await hydrated(page);
	await page.click('#talks .bench-object');
	await page.waitForTimeout(300);
	await page.keyboard.press('Tab');
	await page.keyboard.press('Tab');
	expect(await page.evaluate(() => document.getElementById('bench-panel')!.contains(document.activeElement))).toBe(true);
	await page.keyboard.press('Escape');
	await page.waitForTimeout(400);
	expect(await page.evaluate(() => document.activeElement === document.querySelector('#talks .bench-object'))).toBe(true);
	await expect(page.locator('#bench-status')).toHaveText(/overview|Talks/);
});
