// Unit tests for the content and URL-state modules (no browser, no build).
// Run with: node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dateLabel, escapeXml, latestPosts, posts, postsByYear, renderFeed, type Post } from '#lib/content/posts.ts';
import { byId, featuredProjects, moreExperiments, projects } from '#lib/content/projects.ts';
import { normalize, readState, urlFor } from '#lib/explore/state.ts';
import { placeConnectors } from '#lib/explore/connectors.ts';
import { dashedDraw, easeOutBack, phase } from '#lib/motion/math.ts';

const V3 = '36fe033';

test('generated feed is byte-identical to the V3 feed.xml it replaces', () => {
	const original = execFileSync('git', ['show', `${V3}:feed.xml`], { encoding: 'utf8' });
	// Posts published after V3 are new items; the V3 ones must render exactly as before.
	const v3 = new Set([...original.matchAll(/<link>https:\/\/sonawaneutkarsh\.github\.io\/blog\/([^/]+)\/<\/link>/g)].map((m) => m[1]));
	assert.equal(v3.size, 5);
	assert.equal(renderFeed(posts.filter((p) => v3.has(p.slug))), original);
});

test('feed escaping matches Python html.escape', () => {
	assert.equal(escapeXml(`we're <b> & "q"`), 'we&#x27;re &lt;b&gt; &amp; &quot;q&quot;');
});

test('posts are newest first and the homepage shows three', () => {
	const dates = posts.map((p) => p.date);
	assert.deepEqual(dates, [...dates].sort().reverse());
	assert.equal(latestPosts().length, 3);
	assert.equal(latestPosts()[0].slug, posts[0].slug);
});

test('date labels keep the site format', () => {
	assert.equal(dateLabel('2026-11-01'), 'Nov 1, 2026');
	assert.equal(dateLabel('2026-10-15'), 'Oct 15, 2026');
});

test('a post in a new year starts a new group on /blog/', () => {
	const next: Post = { slug: 'x', title: 'x', date: '2027-01-03', pubDate: '2027-01-03T17:00:00Z', description: 'x' };
	const groups = postsByYear([next, ...posts]);
	assert.deepEqual(
		groups.map((g) => g.year),
		['2027', '2026']
	);
});

test('every published project appears once on the homepage and on the workbench', () => {
	const home = [...featuredProjects, ...moreExperiments].map((p) => p.id);
	assert.deepEqual([...home].sort(), ['clage', 'devvy', 'medclarity', 'nytr', 'pyopt', 'scholarai', 'talks']);
	assert.equal(projects.length, 8);
	assert.ok(byId('adr-research').bench.researchStatus);
	assert.match(byId('pyopt').summaryHtml ?? '', /13 of the 40 test prompts leaked from training/);
	assert.match(byId('talks').bench.caveat ?? '', /real iPhone and Apple Watch/);
});

const url = (s: string) => new URL(s, 'https://sonawaneutkarsh.github.io');

test('explorer state reads and writes the V3 URL format', () => {
	assert.deepEqual(readState(url('/explore/?filter=ai#pyopt'), 'bench'), { filter: 'ai', mode: 'bench', id: 'pyopt' });
	assert.deepEqual(readState(url('/explore/?view=list'), 'bench'), { filter: 'all', mode: 'list', id: null });
	const base = url('/explore/');
	assert.equal(urlFor({ filter: 'all', mode: 'bench', id: null }, 'bench', base), '/explore/');
	assert.equal(urlFor({ filter: 'apps', mode: 'list', id: 'talks' }, 'bench', base), '/explore/?filter=apps&view=list#talks');
	// The default view for the screen size is never written.
	assert.equal(urlFor({ filter: 'all', mode: 'list', id: null }, 'list', base), '/explore/');
});

test('unknown filters and projects normalize away; a filtered-out project closes', () => {
	assert.deepEqual(readState(url('/explore/?filter=nonsense#not-a-project'), 'bench'), { filter: 'all', mode: 'bench', id: null });
	assert.equal(normalize({ filter: 'ai', mode: 'bench', id: 'talks' }).id, null);
	assert.equal(normalize({ filter: 'apps', mode: 'bench', id: 'medclarity' }).id, 'medclarity');
});

test('connector labels avoid cards and each other', () => {
	const centers = new Map<string, [number, number]>([
		['a', [100, 100]],
		['b', [400, 100]],
		['c', [400, 300]]
	]);
	const cards = [...centers.values()].map(([x, y]) => ({ x: x - 60, y: y - 40, w: 120, h: 80 }));
	const out = placeConnectors(
		[
			{ from: 'a', to: 'b', label: 'shared idea' },
			{ from: 'b', to: 'c', label: 'another link' }
		],
		centers,
		cards,
		(t) => t.length * 6
	);
	assert.equal(out.length, 2);
	for (const c of out) {
		const w = Math.max(...c.lines.map((l) => l.length * 6)) + 8;
		const box = { x: c.at[0] - w / 2, y: c.at[1] - 9, w, h: 18 };
		for (const card of cards) {
			const hit = box.x < card.x + card.w && box.x + box.w > card.x && box.y < card.y + card.h && box.y + box.h > card.y;
			assert.ok(!hit, `${c.label} overlaps a card`);
		}
	}
});

test('dashed draw-on reveals dashes progressively', () => {
	assert.equal(dashedDraw(0), '0 200');
	assert.equal(dashedDraw(1, 3, 2.5), '3 2.5');
	const half = dashedDraw(0.5, 3, 2).split(' ').map(Number);
	const drawn = half.slice(0, -2).filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
	assert.ok(drawn > 25 && drawn <= 30, `drawn ${drawn}`);
	assert.equal(phase(5, 0, 10), 0.5);
	assert.ok(easeOutBack(0.7) > 1, 'the pop overshoots');
	assert.equal(easeOutBack(1), 1);
});
