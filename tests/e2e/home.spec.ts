import { test, expect, type Page } from '@playwright/test';
import { countFrames, hydrated, overflow, shot, until, watchErrors, WIDTHS } from './helpers.ts';

const lede = (page: Page) =>
	page.evaluate(() => {
		const r = document.querySelector('.hero-lede')!.getBoundingClientRect();
		return [r.top, r.height, r.width, document.querySelector('.bio')!.getBoundingClientRect().height];
	});

const stageState = (page: Page, kind: string) =>
	page.evaluate((k) => {
		const stage = document.querySelector('.hero-stage') as HTMLElement | null;
		const shown = Boolean(stage && getComputedStyle(stage).visibility !== 'hidden' && Number(getComputedStyle(stage).opacity) > 0.5);
		const box = stage?.getBoundingClientRect();
		const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
		const blocked = [
			document.querySelector('.intro-art')!,
			...document.querySelectorAll('.bio > *'),
			...[...document.querySelectorAll('.hero-link .hero-icon')].filter((el) => !el.closest(`[data-hero-icon="${k}"]`)),
			document.querySelector('.masthead')!
		];
		const bio = document.querySelector('.bio')!.getBoundingClientRect();
		return {
			shown,
			covers: shown && box ? blocked.filter((el) => hit(box, el.getBoundingClientRect())).map((el) => el.className || el.tagName) : [],
			rightOfText: shown && box ? box.left >= bio.right : null,
			inView: shown && box ? box.right <= document.documentElement.clientWidth && box.left >= 0 : null,
			room: document.documentElement.clientWidth - 20 - bio.right - 40 >= 150,
			lit: document.querySelector(`[data-hero-icon="${k}"]`)!.classList.contains('is-lit')
		};
	}, kind);

test.describe('homepage content', () => {
	test('keeps every V3 fact, link and section @firefox', async ({ page }) => {
		const errors = watchErrors(page);
		await page.goto('/');
		const facts = await page.evaluate(() => {
			const text = document.body.innerText;
			const projects = (document.querySelector('#projects') as HTMLElement).innerText;
			return {
				availability: text.includes('Looking for Summer 2027 software engineering and AI/ML internships.'),
				pennState: text.includes('Computer science · Penn State · Class of 2028'),
				noPausedLabel: !/Development paused/.test(projects),
				nytrLessons: Boolean(document.querySelector('#projects a[href="/blog/why-i-stopped-working-on-nytr-problems-and-lessons/"]')),
				threePosts: document.querySelectorAll('#blog .post-row').length === 3 && Boolean(document.querySelector('#blog a[href="/blog/"]')),
				noPreviewCaptions: !/Diagram, not|muted|Preview/.test(projects),
				pyopt: text.includes('13 of the 40 test prompts leaked from training'),
				contacts: ['mailto:utkarshsonawane@psu.edu', 'https://github.com/sonawaneutkarsh', 'https://www.linkedin.com/in/sonawaneutkarsh/', '/resume.pdf'].every((h) =>
					document.querySelector(`a[href="${h}"]`)
				),
				ids: ['hero', 'updates', 'projects', 'research', 'experience', 'blog'].every((id) => document.getElementById(id)),
				explore: Boolean(document.querySelector('#projects a[href="/explore/"]')),
				demo: Boolean(document.querySelector('#research a[href="/notebook/adr-extraction-demo/"]')),
				rss: Boolean(document.querySelector('#blog a[href="/feed.xml"]'))
			};
		});
		for (const [key, ok] of Object.entries(facts)) expect(ok, key).toBe(true);
		const icons = await page.evaluate(() =>
			[...document.querySelectorAll('[data-hero-icon]')].map((a) => [a.getAttribute('data-hero-icon'), a.getAttribute('href'), a.textContent!.trim()])
		);
		expect(icons).toEqual([
			['software', '/#projects', 'software'],
			['ai', '/explore/?filter=ai', 'AI systems'],
			['research', '/#research', 'research']
		]);
		expect(errors).toEqual([]);
	});

	test('reads before hydration: prerendered HTML has the whole page', async ({ browser }) => {
		const context = await browser.newContext({ javaScriptEnabled: false });
		const page = await context.newPage();
		await page.goto('/');
		await expect(page.locator('h1')).toHaveText('Utkarsh Sonawane');
		await expect(page.locator('.hero-lede')).toHaveText('I build software, explore AI systems, do research, and write about what I learn.');
		await expect(page.locator('.project-row')).toHaveCount(4);
		await expect(page.locator('.compact-item')).toHaveCount(3);
		await expect(page.locator('#blog .post-row')).toHaveCount(3);
		// Without JavaScript nothing is hidden and no inert control is offered.
		await expect(page.locator('.preview-toggle')).toHaveCount(0);
		await expect(page.locator('.is-pending')).toHaveCount(0);
		await context.close();
	});
});

test.describe('hero objects', () => {
	test('AI systems: lights on hover, plays in the margin, text never moves, settles idle', async ({ page }) => {
		const frames = await countFrames(page);
		const errors = watchErrors(page);
		await page.goto('/');
		const before = await lede(page);
		await page.hover('[data-hero-icon="ai"] .hero-word');
		expect(await until(page, () => document.querySelector('[data-hero-icon="ai"]')!.classList.contains('is-lit'))).toBe(true);
		await page.waitForTimeout(900);
		const mid = await stageState(page, 'ai');
		expect(mid.shown && mid.rightOfText && mid.inView, JSON.stringify(mid)).toBe(true);
		expect(mid.covers, 'the margin sketch covers nothing').toEqual([]);
		expect(await lede(page), 'the sentence does not move or reflow').toEqual(before);
		await shot(page, 'home-ai-depth');
		expect(
			await until(page, () => Number(getComputedStyle(document.querySelector('.hero-stage .stage-labels')!).opacity) > 0.8 || Number(document.querySelector('.hero-stage .stage-labels')?.getAttribute('opacity')) > 0.8, undefined, 3500),
			'reorganizes into the agent loop'
		).toBe(true);
		await shot(page, 'home-ai-loop');
		await page.mouse.move(4, 880);
		expect(await until(page, () => !document.querySelector('[data-hero-icon="ai"]')!.classList.contains('is-lit'))).toBe(true);
		expect(await until(page, () => getComputedStyle(document.querySelector('.hero-stage')!).visibility === 'hidden', undefined, 3000), 'the sketch folds away').toBe(true);
		await page.waitForTimeout(1500);
		const settled = await frames.read();
		await page.waitForTimeout(2000);
		expect((await frames.read()) - settled, 'no animation frames once settled').toBe(0);
		expect(errors).toEqual([]);
	});

	test('software and research objects play their sequences and return to rest', async ({ page }) => {
		await page.goto('/');
		await page.hover('[data-hero-icon="software"] .hero-word');
		expect(await until(page, () => document.querySelector('[data-hero-icon="software"] .sw-done')!.getAttribute('opacity') === '1', undefined, 3500), 'phone reaches its completed state').toBe(true);
		await shot(page, 'home-software');
		await page.hover('[data-hero-icon="research"] .hero-word');
		expect(await until(page, () => !document.querySelector('[data-hero-icon="software"]')!.classList.contains('is-lit')), 'one object at a time').toBe(true);
		expect(await until(page, () => document.querySelector('[data-hero-icon="research"] .rs-filed')!.getAttribute('opacity') === '1', undefined, 4000), 'pair filed for review').toBe(true);
		await shot(page, 'home-research');
		await page.mouse.move(4, 880);
		expect(
			await until(page, () => document.querySelector('[data-hero-icon="software"] .sw-watch')!.getAttribute('opacity') === '0', undefined, 3000),
			'the devices fold back into the code window'
		).toBe(true);
	});

	test('a quick pass across the word turns round smoothly, keeping its speed', async ({ page }) => {
		await page.goto('/');
		await hydrated(page);
		const box = (await page.locator('[data-hero-icon="ai"] .hero-word').boundingBox())!;
		// Record the first node's x every frame while the pointer passes over the word.
		await page.evaluate(() => {
			const w = window as unknown as { __xs: number[] };
			w.__xs = [];
			const node = document.querySelector('[data-hero-icon="ai"] .ai-nodes rect')!;
			const tick = () => {
				w.__xs.push(Number(node.getAttribute('x')));
				if (w.__xs.length < 90) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
		await page.mouse.move(box.x + 5, box.y + box.height / 2);
		await page.waitForTimeout(220);
		await page.mouse.move(4, 880);
		await page.waitForTimeout(1300);
		const xs = await page.evaluate(() => (window as unknown as { __xs: number[] }).__xs);
		const steps = xs.slice(1).map((x, i) => Math.abs(x - xs[i]));
		const rest = xs[0];
		const far = Math.min(...xs);
		const turn = xs.indexOf(far);
		const leaveAt = Math.round(220 / 16.7);
		expect(Math.max(...steps), 'no jump between frames').toBeLessThan(1.6);
		expect(far, 'it moved outwards').toBeLessThan(rest - 2);
		expect(turn, 'it kept moving outwards after the pointer left (velocity carried), then turned').toBeGreaterThan(leaveAt);
		expect(Math.abs(xs[xs.length - 1] - rest), 'and settled back at rest').toBeLessThan(0.1);
	});

	test('keyboard focus lights an object like hover does', async ({ page }) => {
		await page.goto('/');
		for (let i = 0; i < 12; i++) {
			await page.keyboard.press('Tab');
			if (await page.evaluate(() => document.activeElement?.getAttribute('data-hero-icon') === 'software')) break;
		}
		expect(await page.evaluate(() => document.activeElement?.getAttribute('data-hero-icon'))).toBe('software');
		expect(await until(page, () => document.querySelector('[data-hero-icon="software"]')!.classList.contains('is-lit'))).toBe(true);
		await page.keyboard.press('Tab');
		expect(await until(page, () => document.querySelector('[data-hero-icon="ai"]')!.classList.contains('is-lit'))).toBe(true);
		expect(await page.evaluate(() => document.querySelector('[data-hero-icon="software"]')!.classList.contains('is-lit'))).toBe(false);
	});

	test('hover lights an object in Firefox @firefox', async ({ page }) => {
		await page.goto('/');
		await hydrated(page);
		await page.hover('[data-hero-icon="research"] .hero-word');
		expect(await until(page, () => document.querySelector('[data-hero-icon="research"]')!.classList.contains('is-lit'))).toBe(true);
		const state = await stageState(page, 'research');
		expect(state.covers).toEqual([]);
		expect(await until(page, () => document.querySelector('[data-hero-icon="research"] .rs-filed')!.getAttribute('opacity') === '1', undefined, 4000)).toBe(true);
		await shot(page, 'home-research');
		await page.hover('[data-hero-icon="ai"] .hero-word');
		await page.waitForTimeout(900);
		await shot(page, 'home-ai-depth');
	});

	for (const width of WIDTHS.filter((w) => w >= 720)) {
		test(`margin sketch at ${width}px only where the margin holds it, covering nothing`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/');
			for (const kind of ['software', 'ai', 'research']) {
				await page.hover(`[data-hero-icon="${kind}"] .hero-word`);
				await page.waitForTimeout(800);
				const s = await stageState(page, kind);
				expect(s.lit, `${kind} lit`).toBe(true);
				expect(s.shown, `${kind}: sketch shown iff there is room (${JSON.stringify(s)})`).toBe(s.room);
				expect(s.covers, `${kind} covers`).toEqual([]);
				if (s.shown) expect(s.rightOfText && s.inView).toBe(true);
				await page.mouse.move(2, 880);
				await page.waitForTimeout(400);
			}
			expect(await overflow(page)).toBeLessThanOrEqual(0);
		});
	}

	test('icons stay with their words and inside the column at every width', async ({ page }) => {
		for (const width of WIDTHS) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/');
			const problems = await page.evaluate(() => {
				const out: string[] = [];
				document.querySelectorAll('.hero-link').forEach((a) => {
					const icon = a.querySelector('.hero-icon')!.getBoundingClientRect();
					const word = a.querySelector('.hero-word')!.getBoundingClientRect();
					if (icon.top > word.bottom || icon.bottom < word.top) out.push(`${a.getAttribute('data-hero-icon')} icon split from its word`);
					if (icon.right > word.left + 1 && Math.abs(icon.top - word.top) < 1) out.push(`${a.getAttribute('data-hero-icon')} icon overlaps its word`);
				});
				if (document.querySelector('.hero-lede')!.getBoundingClientRect().right > document.documentElement.clientWidth) out.push('lede overflows');
				return out;
			});
			expect(problems, `@${width}`).toEqual([]);
			if ([1024, 900, 768].includes(width)) await shot(page, `home-${width}`);
		}
	});
});

test.describe('project drawings', () => {
	test('row hover plays that project only; no video; button toggles', async ({ page }) => {
		const requests: string[] = [];
		page.on('request', (r) => requests.push(r.url()));
		await page.goto('/');
		await page.hover('.project-row:nth-of-type(3) h3 a');
		expect(await until(page, () => document.querySelector('[data-name="Talks"]')!.classList.contains('is-active'))).toBe(true);
		expect(await page.locator('[data-name="Talks"] .preview-drawing').count()).toBe(1);
		await page.waitForTimeout(1800);
		await shot(page, 'home-preview-talks');
		await page.hover('.project-row:nth-of-type(4) h3 a');
		expect(
			await until(page, () => !document.querySelector('[data-name="Talks"]')!.classList.contains('is-active') && document.querySelector('[data-name="Devvy"]')!.classList.contains('is-active')),
			'one preview at a time'
		).toBe(true);
		await page.waitForTimeout(3600);
		await shot(page, 'home-preview-devvy');
		for (const [n, name] of [[1, 'Nytr'], [2, 'Clage']] as const) {
			await page.hover(`.project-row:nth-of-type(${n}) h3 a`);
			expect(await until(page, (nm) => document.querySelector(`[data-name="${nm}"]`)!.classList.contains('is-active'), name)).toBe(true);
			await page.waitForTimeout(3000);
			await shot(page, `home-preview-${name.toLowerCase()}`);
		}
		await page.mouse.move(5, 5);
		expect(
			await until(page, () => {
				const m = document.querySelector('[data-name="Clage"]') as HTMLElement;
				return !m.classList.contains('is-active') && Number(m.style.getPropertyValue('--p')) === 0 && Number(m.style.getPropertyValue('--lift')) === 0;
			}, undefined, 3000),
			'frame springs settle back to rest'
		).toBe(true);
		await page.click('[data-name="Clage"] .preview-toggle');
		await expect(page.locator('[data-name="Clage"] .preview-toggle')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('[data-name="Clage"] .preview-toggle')).toHaveAttribute('aria-label', 'Pause Clage animation');
		await page.click('[data-name="Clage"] .preview-toggle');
		await expect(page.locator('[data-name="Clage"]')).not.toHaveClass(/is-active/);
		expect(requests.filter((u) => u.endsWith('.mp4'))).toEqual([]);
	});

	test('each drawing stays inside its frame, labels clear of the button', async ({ page }) => {
		for (const width of [1440, 768, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/');
			await hydrated(page);
			for (const name of ['Nytr', 'Clage', 'Talks', 'Devvy']) {
				await page.evaluate((n) => (document.querySelector(`[data-name="${n}"] .preview-toggle`) as HTMLElement).click(), name);
				await page.waitForTimeout(1200);
				const fit = await page.evaluate((n) => {
					const frame = document.querySelector(`[data-name="${n}"]`)!.getBoundingClientRect();
					const texts = [...document.querySelectorAll(`[data-name="${n}"] .preview-drawing text`)].map((t) => t.getBoundingClientRect()).filter((r) => r.width);
					return texts.filter((r) => r.left < frame.left - 1 || r.right > frame.right + 1 || r.top < frame.top - 1 || r.bottom > frame.bottom + 1).length;
				}, name);
				expect(fit, `${name} @${width}`).toBe(0);
				await page.evaluate((n) => (document.querySelector(`[data-name="${n}"] .preview-toggle`) as HTMLElement).click(), name);
			}
		}
	});
});

test.describe('reduced motion', () => {
	test.use({ reducedMotion: 'reduce' });
	test('hover starts no drawing; objects jump to a still; nothing is hidden', async ({ page }) => {
		await page.goto('/');
		await page.hover('.project-row:nth-of-type(1) h3 a');
		await page.waitForTimeout(500);
		expect(await page.evaluate(() => document.querySelector('[data-name="Nytr"]')!.classList.contains('is-active'))).toBe(false);
		await page.hover('[data-hero-icon="ai"] .hero-word');
		expect(
			await until(page, () => document.querySelector('[data-hero-icon="ai"] .ai-loop')!.getAttribute('opacity') === '1', undefined, 200),
			'jumps straight to the agent loop'
		).toBe(true);
		expect(await page.evaluate(() => document.querySelectorAll('.is-pending').length)).toBe(0);
		await page.click('[data-name="Talks"] .preview-toggle');
		expect(await page.evaluate(() => document.querySelector('[data-name="Talks"] .preview-drawing') !== null)).toBe(true);
	});
});

test.describe('touch', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
	test('one-time tour, visible preview button, a tap on a word navigates', async ({ page }) => {
		await page.goto('/');
		expect(await until(page, () => document.querySelector('.hero-link.is-lit'), undefined, 2500), 'tour plays').toBeTruthy();
		await shot(page, 'home-mobile-390');
		expect(await page.evaluate(() => getComputedStyle(document.querySelector('.preview-chip')!).opacity)).toBe('1');
		expect(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-stage') ?? document.body).display !== 'block' || !document.querySelector('.hero-stage'))).toBe(true);
		await page.locator('[data-name="Talks"] .preview-toggle').tap();
		expect(await until(page, () => document.querySelector('[data-name="Talks"]')!.classList.contains('is-active'))).toBe(true);
		await page.locator('[data-hero-icon="research"] .hero-word').tap();
		expect(await until(page, () => location.hash === '#research')).toBe(true);
		expect(await overflow(page)).toBeLessThanOrEqual(0);
	});
});
