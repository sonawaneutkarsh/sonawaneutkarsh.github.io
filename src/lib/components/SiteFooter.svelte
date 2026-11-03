<script lang="ts">
	import { SITE } from '#lib/content/site.ts';
</script>

<footer class="site-footer container">
	<p>Utkarsh Sonawane · Penn State</p>
	<nav aria-label="Contact">
		<a href={`mailto:${SITE.email}`}>Email</a><a href={SITE.github}>GitHub</a><a href={SITE.linkedin}>LinkedIn</a><a
			data-sveltekit-reload
			href={SITE.resume}>Résumé</a
		>
	</nav>
</footer>
