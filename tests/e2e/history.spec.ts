import { test, expect, type Page } from '@playwright/test';
import { hydrated, watchErrors } from './helpers.ts';

// Back/Forward: every user-visible state is one history entry, popstate
// replays it, and nothing pushes during replay (V3's history table).

const st = (page: Page) =>
	page.evaluate(() => ({
		len: history.length,
		url: location.pathname + location.search + location.hash,
		open: Boolean(document.getElementById('bench-panel') && !(document.getElementById('bench-panel') as HTMLElement).hidden),
		title: document.querySelector('#bench-panel .bench-title')?.textContent?.trim() ?? null,
		filter: document.querySelector('[data-filter][aria-pressed="true"]')?.getAttribute('data-filter') ?? null,
		list: Boolean(document.getElementById('bench')?.classList.contains('is-list'))
	}));

async function arrive(page: Page, path: string) {
	await page.goto('/');
	await hydrated(page);
	await page.evaluate((p) => {
		location.href = p;
	}, path);
	await page.waitForURL(`**${path.split('#')[0]}*`);
	await hydrated(page);
	await page.waitForTimeout(300);
}
const back = async (page: Page) => {
	await page.evaluate(() => history.back());
	await page.waitForTimeout(400);
	return st(page);
};
const fwd = async (page: Page) => {
	await page.evaluate(() => history.forward());
	await page.waitForTimeout(400);
	return st(page);
};

test('history follows the V3 rules for projects, filters and views @firefox', async ({ page }) => {
	const errors = watchErrors(page);
	await arrive(page, '/explore/');
	const start = await st(page);
	expect(start.url).toBe('/explore/');
	expect(start.open).toBe(false);

	await page.click('#clage .bench-object');
	await page.waitForTimeout(250);
	const opened = await st(page);
	expect(opened, 'opening pushes one entry').toMatchObject({ len: start.len + 1, url: '/explore/#clage' });
	await page.click('#bench-panel [data-step="1"]');
	await page.waitForTimeout(250);
	await page.click('#bench-panel [data-step="1"]');
	await page.waitForTimeout(250);
	const browsed = await st(page);
	expect(browsed, 'Previous/Next replace').toMatchObject({ len: opened.len, title: 'Nytr', url: '/explore/#nytr' });
	let s = await back(page);
	expect(s, 'Back from a browsed project returns to the overview').toMatchObject({ open: false, url: '/explore/' });
	expect(await page.evaluate(() => document.activeElement?.classList.contains('bench-object') || document.activeElement === document.body)).toBe(true);
	s = await fwd(page);
	expect(s, 'Forward reopens it').toMatchObject({ open: true, url: '/explore/#nytr' });
	await page.keyboard.press('Escape');
	await page.waitForTimeout(400);
	const closed = await st(page);
	expect(closed, 'Esc on a pushed entry goes Back').toMatchObject({ open: false, url: '/explore/', len: opened.len });
	expect((await fwd(page)).open, 'Forward after Esc reopens').toBe(true);
	await page.click('.bench-close');
	await page.waitForTimeout(400);

	await page.click('[data-filter="apps"]');
	await page.waitForTimeout(250);
	await page.click('[data-filter="systems"]');
	await page.waitForTimeout(250);
	expect(await st(page)).toMatchObject({ url: '/explore/?filter=systems', filter: 'systems' });
	let f = await back(page);
	expect(f).toMatchObject({ filter: 'apps', url: '/explore/?filter=apps' });
	expect(await page.evaluate(() => document.querySelector('#devvy')!.classList.contains('is-muted') && !document.querySelector('#nytr')!.classList.contains('is-muted'))).toBe(true);
	f = await back(page);
	expect(f).toMatchObject({ filter: 'all', url: '/explore/' });
	f = await fwd(page);
	expect(f.filter).toBe('apps');

	await page.click('#talks .bench-object');
	await page.waitForTimeout(250);
	await page.click('[data-filter="ai"]');
	await page.waitForTimeout(350);
	expect(await st(page), 'a filter that hides the open project closes it').toMatchObject({ open: false, url: '/explore/?filter=ai' });
	f = await back(page);
	expect(f, 'Back brings the project and its filter back together').toMatchObject({ open: true, title: 'Talks', filter: 'apps' });
	await page.click('.bench-close');
	await page.waitForTimeout(400);

	await page.click('[data-mode="list"]');
	await page.waitForTimeout(250);
	const listed = await st(page);
	expect(listed.list && listed.url.includes('view=list')).toBe(true);
	f = await back(page);
	expect(f.list).toBe(false);
	expect(f.url.includes('view=')).toBe(false);
	await page.waitForTimeout(300);
	expect(await page.evaluate(() => document.querySelectorAll('.bench-link').length), 'connectors redraw after list view').toBe(4);
	f = await fwd(page);
	expect(f.list).toBe(true);

	const top = await st(page);
	for (let i = 0; i < 2; i++) await back(page);
	const bottom = await st(page);
	for (let i = 0; i < 2; i++) await fwd(page);
	const again = await st(page);
	expect(again.len, 'replay creates no entries').toBe(top.len);
	expect(again.url).toBe(top.url);
	expect(bottom.url).toBe('/explore/');
	expect(errors).toEqual([]);
});

test('Back from the overview leaves; deep links close by replacing', async ({ page }) => {
	await arrive(page, '/explore/');
	await page.click('#nytr .bench-object');
	await page.waitForTimeout(250);
	await back(page);
	await page.evaluate(() => history.back());
	await page.waitForURL((u) => u.pathname === '/');
	expect(await page.evaluate(() => location.pathname)).toBe('/');

	await arrive(page, '/explore/?filter=ai#pyopt');
	const deep = await st(page);
	expect(deep).toMatchObject({ open: true, title: 'PyOpt', filter: 'ai' });
	await page.click('.bench-close');
	await page.waitForTimeout(350);
	const deepClosed = await st(page);
	expect(deepClosed, 'closing a deep link replaces it').toMatchObject({ open: false, len: deep.len, url: '/explore/?filter=ai' });
	await page.evaluate(() => history.back());
	await page.waitForURL((u) => u.pathname === '/');
	await page.evaluate(() => history.forward());
	await page.waitForURL((u) => u.pathname === '/explore/');
	await hydrated(page);
	await page.waitForTimeout(400);
	expect(await page.evaluate(() => location.search === '?filter=ai' && (document.getElementById('bench-panel') as HTMLElement).hidden)).toBe(true);
});

test('unknown filter and hash are normalized without an entry', async ({ page }) => {
	await page.goto('/explore/?filter=nonsense#not-a-project');
	await hydrated(page);
	await page.waitForTimeout(400);
	expect(
		await page.evaluate(() => location.search === '' && location.hash === '' && document.querySelector('[data-filter="all"]')!.getAttribute('aria-pressed') === 'true')
	).toBe(true);
});
