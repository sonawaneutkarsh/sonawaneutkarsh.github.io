import { test, expect, type Page } from '@playwright/test';
import { hydrated, overflow, shot, until, watchErrors } from './helpers.ts';

const stepIs = (page: Page, n: number) => until(page, (k) => document.querySelector('.adr-demo')!.getAttribute('data-step') === String(k), n, 1500);

test('walkthrough: steps, connectors, verdicts, causation note, stable controls @firefox', async ({ page, baseURL }) => {
	const errors = watchErrors(page);
	const requests: string[] = [];
	page.on('request', (r) => requests.push(r.url()));
	await page.goto('/notebook/adr-extraction-demo/');
	await hydrated(page);
	expect(
		await page.evaluate(() =>
			/Illustration only: the posts and drug names are invented, and no real\s+data, models, or results are used\./.test(document.body.innerText)
		)
	).toBe(true);
	expect(await stepIs(page, 1)).toBe(true);
	expect(
		await page.evaluate(() => getComputedStyle(document.querySelector('.adr-example:not([hidden]) mark[data-kind="drug"]')!).backgroundSize),
		'no highlight at step 1'
	).toBe('0% 100%');
	await page.click('[data-move="1"]');
	expect(await stepIs(page, 2)).toBe(true);

	// Scroll so the controls sit low on screen, then step through every state
	// of every example: the controls must not move.
	await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
	await page.waitForTimeout(100);
	const pos = () => page.evaluate(() => Math.round(document.querySelector('[data-move="1"]')!.getBoundingClientRect().top));
	const seen = new Set([await pos()]);
	for (const ex of ['0', '1', '2']) {
		await page.evaluate((e) => (document.querySelector(`[data-example="${e}"]`) as HTMLElement).click(), ex);
		seen.add(await pos());
		for (let k = 0; k < 6; k++) {
			await page.evaluate(() => (document.querySelector('[data-move="1"]') as HTMLElement).click());
			await page.waitForTimeout(60);
			seen.add(await pos());
		}
		for (let k = 0; k < 6; k++) {
			await page.evaluate(() => (document.querySelector('[data-move="-1"]') as HTMLElement).click());
			await page.waitForTimeout(60);
			seen.add(await pos());
		}
	}
	expect([...seen], 'Previous/Next never move').toHaveLength(1);
	await page.evaluate(() => {
		(document.querySelector('[data-example="0"]') as HTMLElement).click();
		(document.querySelector('[data-goto="2"]') as HTMLElement).click();
		window.scrollTo({ top: 0, behavior: 'instant' });
	});
	expect(
		await until(page, () => getComputedStyle(document.querySelector('.adr-example:not([hidden]) mark[data-kind="drug"]')!).backgroundSize === '100% 100%'),
		'drug mentions highlighted at step 2'
	).toBe(true);
	await page.click('[data-move="1"]');
	await page.click('[data-move="1"]');
	expect(await stepIs(page, 4)).toBe(true);
	expect(await page.evaluate(() => document.querySelectorAll('.adr-example:not([hidden]) .adr-link').length)).toBe(1);
	expect(await page.evaluate(() => document.querySelector('.adr-example:not([hidden]) .adr-verdict')!.textContent)).toBe('Candidate');
	await page.focus('[data-move="1"]');
	await page.keyboard.press('ArrowRight');
	expect(await stepIs(page, 5), 'ArrowRight advances').toBe(true);
	expect(await until(page, () => document.querySelector('.adr-example:not([hidden]) .adr-verdict')!.textContent === 'Supported by the text')).toBe(true);
	expect(await page.evaluate(() => Boolean(document.querySelector('.adr-example:not([hidden]) .adr-reason')))).toBe(true);
	await page.click('[data-example="1"]');
	expect(await stepIs(page, 1), 'switching examples restarts').toBe(true);
	await page.click('[data-goto="5"]');
	expect(await page.evaluate(() => Boolean(document.querySelector('.adr-example:not([hidden]) [data-verdict="rejected"]')))).toBe(true);

	for (const ex of ['0', '1', '2']) {
		await page.click(`[data-example="${ex}"]`);
		await page.click('[data-goto="5"]');
		await page.waitForTimeout(500);
		const problems = await page.evaluate(() => {
			const out: string[] = [];
			const example = document.querySelector('.adr-example:not([hidden])')!;
			const badges = [...example.querySelectorAll('.adr-link-badge')].map((b) => b.getBoundingClientRect());
			badges.forEach((a, i) =>
				badges.slice(i + 1).forEach((b, j) => {
					if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) out.push(`badges ${i + 1}/${i + j + 2} overlap`);
				})
			);
			[...example.querySelectorAll('.adr-link path')].forEach((path, i) => {
				const p = path as SVGPathElement;
				const pair = example.querySelectorAll('.adr-pairs > li')[i] as HTMLElement;
				const ends = [p.getPointAtLength(0), p.getPointAtLength(p.getTotalLength())];
				const svg = p.ownerSVGElement!.getBoundingClientRect();
				const near = (pt: DOMPoint, id: string) =>
					[...example.querySelector(`mark[data-id="${id}"]`)!.getClientRects()].some(
						(r) => r.width > 2 && svg.left + pt.x >= r.left - 2 && svg.left + pt.x <= r.right + 2 && (Math.abs(svg.top + pt.y - r.top) < 8 || Math.abs(svg.top + pt.y - r.bottom) < 8)
					);
				const ok = (near(ends[0], pair.dataset.from!) && near(ends[1], pair.dataset.to!)) || (near(ends[0], pair.dataset.to!) && near(ends[1], pair.dataset.from!));
				if (!ok) out.push(`connector ${i + 1} does not attach to its marks`);
			});
			return out;
		});
		expect(problems, `example ${Number(ex) + 1}`).toEqual([]);
	}
	await page.click('[data-example="1"]');
	await page.click('[data-goto="5"]');
	await page.waitForTimeout(900);
	await shot(page, 'demo-review', { fullPage: true });
	await page.click('[data-goto="6"]');
	expect(await page.evaluate(() => /does not\s+show the drug caused it/.test((document.querySelector('.adr-explanations li[data-for="6"]') as HTMLElement).innerText))).toBe(true);
	expect(await page.evaluate(() => document.querySelectorAll('.adr-example:not([hidden]) .adr-caution').length), 'supported pairs say reported, not caused').toBe(2);
	await page.click('[data-move="reset"]');
	expect(await stepIs(page, 1)).toBe(true);
	expect(await page.evaluate(() => document.querySelector('[data-example="0"]')!.getAttribute('aria-pressed'))).toBe('true');
	const origin = new URL(baseURL!).origin;
	expect(requests.filter((u) => !u.startsWith(origin) && !u.startsWith('data:')), 'only same-origin static requests').toEqual([]);
	expect(errors).toEqual([]);
});

test('step highlight slides between stages and the stepper announces progress', async ({ page }) => {
	await page.goto('/notebook/adr-extraction-demo/');
	await hydrated(page);
	const x = () => page.evaluate(() => (document.querySelector('.adr-stepper-indicator') as HTMLElement).style.transform);
	const at1 = await x();
	await page.click('[data-goto="4"]');
	await page.waitForTimeout(60);
	const moving = await x();
	await page.waitForTimeout(900);
	const at4 = await x();
	expect(moving).not.toBe(at1);
	expect(moving).not.toBe(at4);
	expect(await page.textContent('#adr-progress')).toBe('Step 4 of 6: Candidate pairs');
	await expect(page.locator('[data-goto="4"]')).toHaveAttribute('aria-current', 'step');
});

test('without JavaScript every stage is shown at once', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto('/notebook/adr-extraction-demo/');
	await expect(page.locator('.adr-example')).toHaveCount(3);
	await expect(page.locator('.adr-explanations li')).toHaveCount(6);
	await expect(page.locator('.adr-pairs li')).toHaveCount(6);
	expect(await page.evaluate(() => [...document.querySelectorAll('.adr-example')].every((e) => getComputedStyle(e).display !== 'none'))).toBe(true);
	await context.close();
});

test.describe('reduced motion', () => {
	test.use({ reducedMotion: 'reduce' });
	test('connectors appear at once', async ({ page }) => {
		await page.goto('/notebook/adr-extraction-demo/');
		await hydrated(page);
		await page.click('[data-goto="4"]');
		await page.waitForTimeout(50);
		expect(await page.evaluate(() => document.querySelector('.adr-link path')!.getAttribute('stroke-dashoffset'))).toBeNull();
	});
});

test.describe('phones', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
	for (const width of [390, 320]) {
		test(`review step fits at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 844 });
			await page.goto('/notebook/adr-extraction-demo/');
			await hydrated(page);
			await page.locator('[data-goto="5"]').tap();
			await page.waitForTimeout(500);
			expect(await overflow(page)).toBeLessThanOrEqual(0);
			await shot(page, `demo-mobile-${width}`, { fullPage: true });
		});
	}
});
