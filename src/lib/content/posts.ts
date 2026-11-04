// Published writing. `posts.json` is the only list of published posts: the
// homepage's Writing section, /blog/ and /feed.xml are all generated from it,
// so they cannot drift apart. Each article itself is a static page in
// static/blog/<slug>/index.html. scripts/publish_scheduled.py moves a due
// draft into place and prepends its record here; scheduled drafts never appear
// in this file, so they never reach the build.

import records from './posts.json' with { type: 'json' };
import { SITE } from './site.ts';

export interface Post {
	slug: string;
	title: string;
	/** Publication date, YYYY-MM-DD (America/New_York). */
	date: string;
	/** RSS timestamp. Older posts use midnight UTC; scheduled ones use noon in New York. */
	pubDate: string;
	description: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Newest first; ties keep manifest order. */
export const posts: Post[] = [...(records as Post[])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/** How many posts the homepage lists before "All posts →". */
export const HOME_POSTS = 3;

export const latestPosts = (count = HOME_POSTS): Post[] => posts.slice(0, count);

export const postPath = (post: Post): string => `/blog/${post.slug}/`;

/** "Nov 1, 2026", the label the site has always used for post dates. */
export function dateLabel(iso: string): string {
	const [year, month, day] = iso.split('-').map(Number);
	return `${MONTHS[month - 1]} ${day}, ${year}`;
}

/** Posts grouped by year, newest year first, for the writing index. */
export function postsByYear(list: Post[] = posts): { year: string; posts: Post[] }[] {
	const groups = new Map<string, Post[]>();
	for (const post of list) {
		const year = post.date.slice(0, 4);
		groups.set(year, [...(groups.get(year) ?? []), post]);
	}
	return [...groups].map(([year, items]) => ({ year, posts: items }));
}

/** The same escaping as Python's html.escape(quote=True), which wrote the existing feed. */
export function escapeXml(text: string): string {
	return text
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#x27;');
}

/** RSS 2.0 feed, byte-compatible with the hand-maintained feed.xml it replaces. */
export function renderFeed(list: Post[] = posts): string {
	const items = list
		.map((post) => {
			const url = `${SITE.origin}${postPath(post)}`;
			return [
				'    <item>',
				`      <title>${escapeXml(post.title)}</title>`,
				`      <link>${url}</link>`,
				`      <guid isPermaLink="true">${url}</guid>`,
				`      <pubDate>${new Date(post.pubDate).toUTCString()}</pubDate>`,
				`      <description>${escapeXml(post.description)}</description>`,
				'    </item>'
			].join('\n');
		})
		.join('\n');
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		'  <channel>',
		`    <title>${SITE.name} — Writing</title>`,
		`    <link>${SITE.origin}/blog/</link>`,
		`    <description>${SITE.writingDescription}</description>`,
		'    <language>en-us</language>',
		`    <atom:link href="${SITE.origin}/feed.xml" rel="self" type="application/rss+xml" />`,
		items,
		'  </channel>',
		'</rss>',
		''
	].join('\n');
}
