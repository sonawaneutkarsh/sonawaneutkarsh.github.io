import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Static site for GitHub Pages. Every route is prerendered to
// build/<route>/index.html; files in static/ (case studies, articles, media,
// résumé, crawler files) are copied byte for byte.
export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({ pages: 'build', assets: 'build', strict: true }),
			paths: { origin: 'https://sonawaneutkarsh.github.io' },
			prerender: {
				// Links from the Svelte pages into static/ (articles, case studies,
				// the résumé) are checked by scripts/check_links.py against the build
				// output, so the crawler only needs to visit the Svelte routes.
				crawl: false,
				entries: ['/', '/blog/', '/explore/', '/notebook/adr-extraction-demo/', '/lab/motion/', '/feed.xml']
			},
			// A static site has no deployments to detect between page loads.
			version: { pollInterval: 0 }
		})
	],
	build: {
		// three.js is split into its own chunk and only loads on /lab/motion/.
		chunkSizeWarningLimit: 700
	}
});
