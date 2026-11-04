// /feed.xml, prerendered from posts.json (the same records as /blog/ and
// the homepage's Writing list).
import { renderFeed } from '#lib/content/posts.ts';

export const prerender = true;
export const trailingSlash = 'never';

export function GET() {
	return new Response(renderFeed(), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
