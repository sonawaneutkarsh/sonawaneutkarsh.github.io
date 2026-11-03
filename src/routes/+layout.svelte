<script lang="ts">
	// Shared frame for the Svelte routes: skip link, masthead and footer, the
	// same markup the static pages carry. Each page renders its own <main>.
	import { page } from '$app/state';
	import Masthead from '#lib/components/Masthead.svelte';
	import SiteFooter from '#lib/components/SiteFooter.svelte';

	let { children } = $props();

	// The V2/V3 stylesheet keys some rules off a page class on <body>; the
	// Svelte routes put the same class on their outermost element instead.
	const PAGE_CLASS: Record<string, string> = {
		'/': 'home-page',
		'/blog': 'blog-index-page',
		'/explore': 'explore-page',
		'/notebook/adr-extraction-demo': 'adr-demo-page',
		'/lab/motion': 'lab-page'
	};
	const pageClass = $derived(PAGE_CLASS[page.route.id ?? ''] ?? '');
</script>

<div class="site {pageClass}">
	<a class="skip-link" href="#content">Skip to content</a>
	<Masthead />
	{@render children()}
	<SiteFooter />
</div>
