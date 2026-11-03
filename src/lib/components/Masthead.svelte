<script lang="ts">
	import { page } from '$app/state';
	import { NAV, navCurrent } from '#lib/content/site.ts';
</script>

<header class="masthead container">
	<a aria-label="Utkarsh Sonawane — home" class="wordmark" href="/"
		><img alt="" height="230" src="/images/brand/utkarsh-wordmark.png" width="684"></a
	>
	<nav aria-label="Primary">
		{#each NAV as link (link.href)}<a
				aria-current={navCurrent(page.url.pathname, link)}
				data-sveltekit-reload={link.href === '/resume.pdf' ? true : undefined}
				href={link.href}>{link.label}</a
			>{/each}
	</nav>
</header>
