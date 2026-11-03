import { test, expect, type Page } from '@playwright/test';
import { hydrated, overflow, shot, until, watchErrors } from './helpers.ts';

const transform = (page: Page) => page.evaluate(() => (document.querySelector('.bench-plane') as HTMLElement).style.transform);
const nums = (t: string) => (t.match(/-?\d+(\.\d+)?/g) || []).map(Number);
const panelTitle = (page: Page) => page.evaluate(() => document.querySelector('#bench-panel .bench-title')?.textContent?.trim() ?? null);

async function open(page: Page, path = '/explore/') {
	await page.goto(path);
	await hydrated(page);
	await page.waitForTimeout(250);
}

test('workbench: entries, connectors, selection, panel, focus, filters, zoom, drag, wheel @firefox', async ({ page, browserName }) => {
	const errors = watchErrors(page);
	await open(page);
	await page.evaluate(() => document.getElementById('bench')!.scrollIntoView({ behavior: 'instant' }));
	await page.waitForTimeout(400);
	await shot(page, 'explore-overview');
	const state = await page.evaluate(() => ({
		bench: document.getElementById('bench')!.classList.contains('is-bench'),
		items: document.querySelectorAll('.bench-item').length,
		links: document.querySelectorAll('.bench-link').length,
		panelHidden: (document.getElementById('bench-panel') as HTMLElement).hidden
	}));
	expect(state).toEqual({ bench: true, items: 8, links: 4, panelHidden: true });
	expect(
		await page.evaluate(() => {
			const frame = document.querySelector('.bench-viewport')!.getBoundingClientRect();
			return [...document.querySelectorAll('.bench-object')].every((b) => {
				const r = b.getBoundingClientRect();
				return r.left >= frame.left - 1 && r.right <= frame.right + 1 && r.top >= frame.top - 1 && r.bottom <= frame.bottom + 1;
			});
		}),
		'every object is inside the initial view'
	).toBe(true);

	await page.click('#clage .bench-object');
	await expect(page.locator('#bench-panel')).toBeVisible();
	const panel = await page.evaluate(() => ({
		hash: location.hash,
		focus: document.activeElement?.id,
		expanded: document.querySelector('#clage .bench-object')!.getAttribute('aria-expanded'),
		caseStudy: Boolean(document.querySelector('#bench-panel a[href="/projects/clage/"]')),
		evidence: (document.getElementById('bench-panel') as HTMLElement).innerText.includes('sine 0/5 with minimal initialization')
	}));
	expect(await panelTitle(page)).toBe('Clage');
	expect(panel).toEqual({ hash: '#clage', focus: browserName === 'firefox' ? panel.focus : 'bench-panel', expanded: 'true', caseStudy: true, evidence: true });
	await page.waitForTimeout(700);
	await shot(page, 'explore-selected');

	await page.click('#bench-panel [data-step="1"]');
	expect(await until(page, () => document.querySelector('#bench-panel .bench-title')?.textContent?.trim() === 'PyOpt')).toBe(true);
	expect(await page.evaluate(() => (document.getElementById('bench-panel') as HTMLElement).innerText.includes('not a clean held-out result'))).toBe(true);
	await page.keyboard.press('Escape');
	expect(
		await until(page, () => (document.getElementById('bench-panel') as HTMLElement).hidden && document.activeElement === document.querySelector('#pyopt .bench-object')),
		'Esc closes and returns focus to the card'
	).toBe(true);
	expect(await page.evaluate(() => location.hash)).toBe('');

	await page.click('[data-filter="ai"]');
	await page.waitForTimeout(300);
	const filtered = await page.evaluate(() => ({
		shown: [...document.querySelectorAll('.bench-item:not(.is-muted)')].map((i) => i.id).sort(),
		inert: [...document.querySelectorAll('.bench-item.is-muted')].every((i) => (i as HTMLElement).inert),
		query: location.search
	}));
	expect(filtered).toEqual({ shown: ['clage', 'medclarity', 'pyopt'], inert: true, query: '?filter=ai' });
	await page.waitForTimeout(700);
	await shot(page, 'explore-filter-ai');
	await page.click('[data-filter="all"]');
	await page.waitForTimeout(1300);

	const t0 = await transform(page);
	await page.click('[data-zoom="in"]');
	await page.waitForTimeout(1100);
	const t1 = await transform(page);
	expect(nums(t1)[2]).toBeGreaterThan(nums(t0)[2] * 1.1);
	await page.click('[data-zoom="reset"]');
	await page.waitForTimeout(1400);
	const t2 = await transform(page);
	expect(nums(t2).every((n, i) => Math.abs(n - nums(t0)[i]) < 0.6), `${t2} vs ${t0}`).toBe(true);

	const frame = (await page.locator('.bench-viewport').boundingBox())!;
	await page.mouse.move(frame.x + 200, frame.y + 220);
	await page.mouse.down();
	await page.mouse.move(frame.x + 260, frame.y + 200, { steps: 4 });
	await page.mouse.move(frame.x + 340, frame.y + 170, { steps: 4 });
	await page.mouse.up();
	await page.waitForTimeout(600);
	expect(await transform(page), 'dragging the background pans').not.toBe(t2);
	expect(await page.evaluate(() => (document.getElementById('bench-panel') as HTMLElement).hidden), 'a drag opens nothing').toBe(true);

	const scrollBefore = await page.evaluate(() => scrollY);
	await page.mouse.move(frame.x + 40, frame.y + 40);
	await page.mouse.wheel(0, 300);
	await page.waitForTimeout(500);
	expect(await page.evaluate(() => scrollY), 'a plain wheel still scrolls the page').toBeGreaterThan(scrollBefore);
	expect(errors).toEqual([]);
});

test('keyboard: Tab reaches objects, Enter opens, Ctrl+wheel zooms around the pointer', async ({ page }) => {
	await open(page);
	await page.focus('[data-filter="all"]');
	let reached = false;
	for (let i = 0; i < 24 && !reached; i++) {
		await page.keyboard.press('Tab');
		reached = await page.evaluate(() => document.activeElement?.closest('#devvy') !== null);
	}
	expect(reached).toBe(true);
	await page.keyboard.press('Enter');
	expect(await until(page, () => document.querySelector('#bench-panel .bench-title')?.textContent?.trim() === 'Devvy')).toBe(true);
	await page.keyboard.press('Escape');
	await page.waitForTimeout(400);
	const before = nums(await transform(page))[2];
	const frame = (await page.locator('.bench-viewport').boundingBox())!;
	await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
	await page.keyboard.down('Control');
	await page.mouse.wheel(0, -240);
	await page.keyboard.up('Control');
	await page.waitForTimeout(900);
	expect(nums(await transform(page))[2]).toBeGreaterThan(before);
});

test('deep link opens the filtered project; list view shows every detail inline', async ({ page }) => {
	await open(page, '/explore/?filter=ai#pyopt');
	await page.waitForTimeout(900);
	expect(await panelTitle(page)).toBe('PyOpt');
	await page.click('[data-mode="list"]');
	expect(
		await until(page, () => document.querySelectorAll('.bench-item > .bench-detail').length === 8 && document.getElementById('bench')!.classList.contains('is-list'))
	).toBe(true);
	// In the list, a filter shows only its entries.
	expect(await page.evaluate(() => [...document.querySelectorAll('.bench-item')].filter((i) => getComputedStyle(i).display !== 'none').length)).toBe(3);
});

test('no layout jump on load: the prerendered list is laid out as the workbench before hydration', async ({ page }) => {
	await page.goto('/explore/');
	const early = await page.evaluate(() => ({ cls: document.documentElement.className, plane: getComputedStyle(document.querySelector('.bench-plane')!).transform }));
	await hydrated(page);
	await page.waitForTimeout(300);
	const late = await transform(page);
	expect(early.cls).toMatch(/explore-bench|js/);
	const a = nums(early.plane); // matrix(s, 0, 0, s, x, y)
	const b = nums(late); // translate(x, y) scale(s)
	if (a.length === 6) {
		expect(Math.abs(a[0] - b[2]), 'same scale before and after hydration').toBeLessThan(0.01);
		expect(Math.abs(a[4] - b[0]) + Math.abs(a[5] - b[1]), 'same position').toBeLessThan(2);
	}
	const shift = await page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				let total = 0;
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!entry.hadRecentInput) total += entry.value;
				}).observe({ type: 'layout-shift', buffered: true });
				setTimeout(() => resolve(total), 300);
			})
	);
	expect(shift, 'cumulative layout shift').toBeLessThan(0.02);
});

for (const [width, query] of [
	[390, ''],
	[1024, '?view=list']
] as const) {
	test(`no layout shift at hydration when the page opens in the list (${width}px ${query || 'default'})`, async ({ browser }) => {
		const mobile = width < 720;
		const context = await browser.newContext({ viewport: { width, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
		const page = await context.newPage();
		// Hold the app scripts (not the CSS) back so the prerendered layout is painted well before hydration.
		await page.route('**/_app/**/*.js', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 700));
			await route.continue();
		});
		await page.addInitScript(() => {
			const w = window as unknown as { __shift: number };
			w.__shift = 0;
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!entry.hadRecentInput) w.__shift += entry.value;
			}).observe({ type: 'layout-shift', buffered: true });
		});
		await page.goto(`/explore/${query}`);
		await hydrated(page);
		await page.waitForTimeout(400);
		await expect(page.locator('.bench.is-list')).toHaveCount(1);
		expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift), 'layout shift').toBeLessThan(0.001);
		await context.close();
	});
}

test('no overlaps between connector labels, cards and zone captions; panels fit', async ({ page }) => {
	for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768], [900, 1000], [768, 1024]]) {
		await page.setViewportSize({ width, height });
		await open(page);
		const audit = () =>
			page.evaluate(() => {
				const box = (el: Element) => el.getBoundingClientRect();
				const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
				const labels = [...document.querySelectorAll('.bench-link:not(.is-muted) text')];
				const cards = [...document.querySelectorAll('.bench-item:not(.is-muted) .bench-object')];
				const captions = [...document.querySelectorAll('.bench-zone:not(.is-muted) span')];
				const problems: string[] = [];
				labels.forEach((l, i) => {
					cards.forEach((c) => hit(box(l), box(c)) && problems.push(`label ${l.textContent} × card ${c.querySelector('.bench-label')!.textContent}`));
					captions.forEach((c) => hit(box(l), box(c)) && problems.push(`label ${l.textContent} × caption ${c.textContent}`));
					labels.slice(i + 1).forEach((o) => hit(box(l), box(o)) && problems.push(`label ${l.textContent} × label ${o.textContent}`));
				});
				cards.forEach((c, i) => cards.slice(i + 1).forEach((o) => hit(box(c), box(o)) && problems.push(`card × card`)));
				cards.forEach((c) => {
					const note = c.querySelector('.bench-note') as HTMLElement;
					const label = c.querySelector('.bench-label') as HTMLElement;
					if (note.scrollWidth > note.clientWidth + 1 || label.scrollWidth > label.clientWidth + 1) problems.push(`${label.textContent} text overflows`);
				});
				return problems;
			});
		expect(await audit(), `@${width}`).toEqual([]);
		for (const filter of ['ai', 'apps']) {
			await page.click(`[data-filter="${filter}"]`);
			await page.waitForTimeout(1000);
			expect(await audit(), `@${width} filter=${filter}`).toEqual([]);
		}
		await page.click('[data-filter="all"]');
		await page.waitForTimeout(300);
		const panelProblems: string[] = [];
		for (const id of ['clage', 'pyopt', 'nytr', 'talks', 'medclarity', 'devvy', 'adr-research', 'scholarai']) {
			await page.evaluate((i) => (document.querySelector(`#${i} .bench-object`) as HTMLElement).click(), id);
			await page.waitForTimeout(500);
			const bad = await page.evaluate(() => {
				const p = document.getElementById('bench-panel')!;
				const body = p.querySelector('.bench-panel-body') as HTMLElement;
				const pr = p.getBoundingClientRect();
				const out = [...body.querySelectorAll('*')].filter((el) => {
					const r = el.getBoundingClientRect();
					return r.width && (r.right > pr.right + 1 || r.left < pr.left - 1);
				});
				return [body.scrollWidth > body.clientWidth + 1, out.length, pr.right <= document.querySelector('.bench-viewport')!.getBoundingClientRect().right + 1];
			});
			if (bad[0] || bad[1] || !bad[2]) panelProblems.push(`${id}: ${JSON.stringify(bad)}`);
		}
		await page.keyboard.press('Escape');
		expect(panelProblems, `@${width} panels`).toEqual([]);
		expect(await overflow(page)).toBeLessThanOrEqual(0);
		if ([1024, 900, 768].includes(width)) await shot(page, `explore-${width}`);
	}
});

test.describe('phones', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
	for (const width of [390, 320]) {
		test(`starts in list view at ${width}px without overflow`, async ({ page }) => {
			await page.setViewportSize({ width, height: 844 });
			await open(page);
			expect(await page.evaluate(() => document.getElementById('bench')!.classList.contains('is-list'))).toBe(true);
			expect(await overflow(page)).toBeLessThanOrEqual(0);
			await shot(page, `explore-mobile-${width}`);
		});
	}
});

test('connectors and the selected card animate, then go idle', async ({ page }) => {
	await page.addInitScript(() => {
		const w = window as unknown as { __raf: number };
		w.__raf = 0;
		const raf = window.requestAnimationFrame.bind(window);
		window.requestAnimationFrame = (cb) => (w.__raf++, raf(cb));
	});
	await open(page);
	await page.click('#nytr .bench-object');
	await page.waitForTimeout(2500);
	const lit = await page.evaluate(() => [...document.querySelectorAll('.bench-link.is-lit')].length);
	expect(lit, 'the Nytr–Talks connection lights').toBe(1);
	const a = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
	await page.waitForTimeout(2000);
	const b = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
	expect(b - a, 'no frames while idle with a project open').toBe(0);
});
