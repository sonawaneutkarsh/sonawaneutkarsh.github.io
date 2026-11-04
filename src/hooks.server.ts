// Development only: answer URLs that match no SvelteKit route the way
// GitHub Pages answers them, from static/<dir>/index.html.
//
// The notebook index, every article and every case study are files in
// static/ (static/notebook/index.html, static/blog/<slug>/index.html,
// static/projects/<name>/index.html). adapter-static copies them into
// build/, and GitHub Pages serves a directory URL from its index.html, so
// the deployed site works. SvelteKit's dev server serves only files from
// static/: a directory URL such as /notebook/ went to the router, which has
// no route there, so `npm run dev` answered 404.
//
// This runs only when no route matched (event.route.id is null), so a route
// always wins, as in the build. The file is read with event.fetch, which
// SvelteKit answers only from its list of files in static/. Prerendering and
// the deployed site never take this branch (`dev` is false there).

import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';

export const handle: Handle = async ({ event, resolve }) => {
	// `dev` is tested first: event.url must not be read while prerendering.
	if (dev && event.route.id === null && !event.isSubRequest && (event.request.method === 'GET' || event.request.method === 'HEAD')) {
		const { origin, pathname, search } = event.url;
		const slash = pathname.endsWith('/');
		const index = new URL(`${pathname}${slash ? '' : '/'}index.html`, origin);
		// One leading slash and the same origin: "//host/..." would send event.fetch off-site.
		if (/^\/(?!\/)/.test(pathname) && index.origin === origin) {
			const file = await event.fetch(index);
			if (file.ok && !slash) {
				// GitHub Pages redirects /notebook to /notebook/.
				await file.body?.cancel();
				return new Response(null, { status: 301, headers: { location: `${pathname}/${search}` } });
			}
			if (file.ok) return new Response(file.body, { headers: { 'content-type': 'text/html; charset=utf-8' } });
		}
	}
	return resolve(event);
};
