import { test, expect, type Page, type Response } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { request } from 'node:http';
import { join } from 'node:path';
import { hydrated } from './helpers.ts';

// Every page and every header link, on the production build served the way
// GitHub Pages serves it (projects chromium and firefox) and on `npm run dev`
// (project dev). Some pages are SvelteKit routes; the notebook index, the
// articles and the case studies are files in static/. Each must answer 200
// to a direct visit, a reload and a click, and land on the right page.

const REPO = join(import.meta.dirname, '..', '..');
const ORIGIN = 'https://sonawaneutkarsh.github.io';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s: string) =>
	s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
		e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e] ?? m)
	);
const firstText = (html: string, tag: string) => {
	const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(html);
	return m ? decode(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim() : '';
};

interface Target {
	path: string;
	h1: string;
	title: string;
	canonical: string | null;
	/** Boots SvelteKit, so clicks go through its client-side router once hydrated. */
	app: boolean;
}

/** A page that lives in static/: what it must show is read from the file itself. */
function staticPage(dir: string): Target {
	const html = readFileSync(join(REPO, 'static', dir, 'index.html'), 'utf8');
	const canonical = /<link\s+href="([^"]+)"\s+rel="canonical"/.exec(html)?.[1] ?? null;
	return { path: `/${dir}/`, h1: firstText(html, 'h1'), title: firstText(html, 'title'), canonical, app: false };
}
const route = (path: string, h1: string, title: string, app = true): Target => ({ path, h1, title, canonical: ORIGIN + path, app });

const posts = JSON.parse(readFileSync(join(REPO, 'src/lib/content/posts.json'), 'utf8')) as { slug: string }[];
const caseStudies = readdirSync(join(REPO, 'static/projects')).filter((d) => existsSync(join(REPO, 'static/projects', d, 'index.html')));

const HOME = route('/', 'Utkarsh Sonawane', 'Utkarsh Sonawane — Software Engineering Portfolio');
const BLOG = route('/blog/', 'Writing', 'Writing — Utkarsh Sonawane', false); // csr = false: plain HTML
const NOTEBOOK = staticPage('notebook');
const ARTICLES = posts.map((p) => staticPage(`blog/${p.slug}`));
const PAGES: Target[] = [
	HOME,
	BLOG,
	...ARTICLES,
	NOTEBOOK,
	route('/notebook/adr-extraction-demo/', 'Reading a post for reported drug reactions', 'Illustrated workflow: reading a post for reported drug reactions — Utkarsh Sonawane'),
	route('/explore/', 'Explore my work', 'Explore my work — Utkarsh Sonawane'),
	route('/lab/motion/', 'Motion lab', 'Motion lab — Utkarsh Sonawane'),
	...caseStudies.map((d) => staticPage(`projects/${d}`))
];
const byPath = (path: string) => PAGES.find((p) => p.path === path)!;

/** Page errors, console errors and hydration mismatches (Svelte reports those in development). */
function watchProblems(page: Page) {
	const problems: string[] = [];
	page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
	page.on('console', (m) => {
		if (m.type() === 'error' || /hydration_/.test(m.text())) problems.push(`${m.type()}: ${m.text().slice(0, 200)}`);
	});
	return problems;
}

/** Main-frame document responses during `action` (none when SvelteKit's router renders the page). */
async function documentsDuring(page: Page, action: () => Promise<unknown>) {
	const documents: string[] = [];
	const record = (r: Response) => {
		if (r.request().isNavigationRequest() && r.frame() === page.mainFrame()) documents.push(`${r.status()} ${new URL(r.url()).pathname}`);
	};
	page.on('response', record);
	try {
		await action();
	} finally {
		page.off('response', record);
	}
	return documents;
}

async function open(page: Page, target: Target) {
	const response = await page.goto(target.path);
	expect(response?.status(), `${target.path}: direct visit`).toBe(200);
	if (target.app) await hydrated(page);
	return response;
}

async function expectAt(page: Page, target: Target, hash = '') {
	await page.waitForURL((url) => url.pathname === target.path && url.hash === hash);
	await expect(page.locator('h1').first(), `${target.path}: heading`).toHaveText(target.h1);
	await expect(page, `${target.path}: title`).toHaveTitle(target.title);
	const canonical = page.locator('link[rel="canonical"]');
	if (target.canonical) await expect(canonical, `${target.path}: canonical`).toHaveAttribute('href', target.canonical);
	else await expect(canonical, `${target.path}: no canonical`).toHaveCount(0);
}

/** Click `link`, land on `target`, and check every page load on the way answered 200. */
async function follow(page: Page, link: ReturnType<Page['locator']>, target: Target, hash = '') {
	const documents = await documentsDuring(page, async () => {
		await link.click();
		await expectAt(page, target, hash);
	});
	for (const doc of documents) expect(doc, `page load while opening ${target.path}`).toMatch(/^200 /);
	return documents;
}

test.describe('every page answers 200 to a direct visit and a reload', () => {
	for (const target of PAGES) {
		test(`${target.path} @firefox`, async ({ page }) => {
			const problems = watchProblems(page);
			await open(page, target);
			await expectAt(page, target);
			const reloaded = await page.reload();
			expect(reloaded?.status(), `${target.path}: reload`).toBe(200);
			if (target.app) await hydrated(page);
			await expectAt(page, target);
			expect(problems).toEqual([]);
		});
	}

	test('/blog/hello-world/ still forwards to the first post @firefox', async ({ page }) => {
		const response = await page.goto('/blog/hello-world/');
		expect(response?.status()).toBe(200);
		await expectAt(page, byPath('/blog/thoughts-on-slms-for-businesses/'));
	});

	test('a URL without its trailing slash redirects to it, as on GitHub Pages @firefox', async ({ page }) => {
		for (const target of PAGES.filter((p) => p.path !== '/')) {
			const bare = target.path.slice(0, -1);
			const response = await page.request.get(bare, { maxRedirects: 0 });
			expect([301, 308], `${bare}: redirect status`).toContain(response.status());
			expect(new URL(response.headers().location, `http://x${bare}`).pathname, `${bare}: redirect target`).toBe(target.path);
		}
		await page.goto('/notebook');
		await expectAt(page, NOTEBOOK);
	});
});

test.describe('header links', () => {
	const STARTS = [HOME, BLOG, NOTEBOOK, ARTICLES[0], byPath(`/projects/${caseStudies[0]}/`), byPath('/explore/'), byPath('/notebook/adr-extraction-demo/'), byPath('/lab/motion/')];
	for (const start of STARTS) {
		test(`from ${start.path} @firefox`, async ({ page }) => {
			const problems = watchProblems(page);
			const nav = () => page.getByRole('navigation', { name: 'Primary' });
			const links: [string, () => ReturnType<Page['locator']>, Target, string][] = [
				['home', () => page.getByRole('link', { name: 'Utkarsh Sonawane — home' }), HOME, ''],
				['Projects', () => nav().getByRole('link', { name: 'Projects', exact: true }), HOME, '#projects'],
				['Research notebook', () => nav().getByRole('link', { name: 'Research notebook', exact: true }), NOTEBOOK, ''],
				['Blog', () => nav().getByRole('link', { name: 'Blog', exact: true }), BLOG, '']
			];
			for (const [, link, target, hash] of links) {
				await open(page, start);
				await follow(page, link(), target, hash);
				if (hash) await expect(page.locator(hash)).toBeAttached();
				// Reloading where the click landed asks the server for that URL.
				const reloaded = await page.reload();
				expect(reloaded?.status(), `${target.path}: reload after the click`).toBe(200);
				if (target.app) await hydrated(page);
				await expectAt(page, target, hash);
			}
			// The résumé is a PDF (a headless browser downloads it rather than showing it).
			await open(page, start);
			const resume = nav().getByRole('link', { name: 'Résumé ↗', exact: true });
			await expect(resume).toHaveAttribute('href', '/resume.pdf');
			const pdf = await page.request.get('/resume.pdf');
			expect(pdf.status()).toBe(200);
			expect(pdf.headers()['content-type']).toContain('application/pdf');
			expect(problems).toEqual([]);
		});
	}
});

/** A raw GET, so a path like "//example.com/x" reaches the server as written. */
function rawGet(base: string, path: string) {
	return new Promise<{ status: number; location: string }>((resolve, reject) => {
		const { hostname, port } = new URL(base);
		const req = request({ hostname, port, path, method: 'GET' }, (res) => {
			res.resume();
			resolve({ status: res.statusCode ?? 0, location: res.headers.location ?? '' });
		});
		req.on('error', reject);
		req.end();
	});
}

test('a path that names another host never makes the server fetch it or redirect to it', async ({ baseURL }) => {
	// Port 9 refuses connections, so a server that tried to fetch this host would answer 5xx.
	for (const path of ['//127.0.0.1:9/notebook', '//127.0.0.1:9/notebook/', '//127.0.0.1:9/blog/80-percent-sleep/']) {
		const { status, location } = await rawGet(baseURL!, path);
		expect(status, path).toBeLessThan(500);
		expect(location, `${path}: Location stays on this site`).not.toMatch(/^(?:[a-z][a-z0-9+.-]*:)?\/\//i);
	}
});

test.describe('links into the writing, the notebook and the case studies', () => {
	test('/blog/ opens every published article @firefox', async ({ page }) => {
		for (const article of ARTICLES) {
			await open(page, BLOG);
			await follow(page, page.locator(`main a.post-title[href="${article.path}"]`), article);
		}
	});

	test('the homepage opens its latest three posts, all writing, and every case study @firefox', async ({ page }) => {
		const problems = watchProblems(page);
		await open(page, HOME);
		const posts = await page.locator('#blog .post-row a.post-title').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
		expect(posts, 'the newest three posts, as in posts.json').toEqual(ARTICLES.slice(0, 3).map((a) => a.path));
		const studies = [...new Set(await page.locator('#projects a[href^="/projects/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!)))];
		expect(studies.length, 'case study links on the homepage').toBeGreaterThan(0);
		for (const href of [...posts, '/blog/', ...studies]) {
			await open(page, HOME);
			const link = href === '/blog/' ? page.locator('#blog a[href="/blog/"]') : page.locator(`main a[href="${href}"]`);
			const { pathname, hash } = new URL(href, ORIGIN); // e.g. /projects/clage/#demo
			await follow(page, link.first(), byPath(pathname), hash);
			if (hash) await expect(page.locator(hash), `${href}: anchor`).toBeAttached();
		}
		expect(problems).toEqual([]);
	});

	test('/notebook/ opens every entry @firefox', async ({ page }) => {
		await open(page, NOTEBOOK);
		const entries = [...new Set(await page.locator('main a[href^="/notebook/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!)))].filter(
			(href) => href !== '/notebook/'
		);
		expect(entries.length, 'notebook entries').toBeGreaterThan(0);
		for (const href of entries) {
			await open(page, NOTEBOOK);
			await follow(page, page.locator(`main a[href="${href}"]`).first(), byPath(href));
		}
	});
});
