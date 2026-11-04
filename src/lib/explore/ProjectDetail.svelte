<script lang="ts">
	// A project's detail: shown inline in the list view (and without
	// JavaScript), and in the workbench's side panel, where its blocks rise in
	// one after another (CSS, .is-staggered).
	import { isExternal, type Project } from '#lib/content/projects.ts';

	let { project, stagger = false }: { project: Project; stagger?: boolean } = $props();

	const b = $derived(project.bench);
	const evidence = $derived(project.featured ? `${project.featured.metricStrong} · ${project.featured.metricRest}` : null);
	const rel = (href: string) => (isExternal(href) ? 'noopener' : undefined);
</script>

<div class="bench-detail" class:is-staggered={stagger}>
	<p class="bench-tags">{b.tags}</p>
	<h2 class="bench-title">
		<a href={project.href} rel={rel(project.href)}>{#if b.titleHtml}{@html b.titleHtml}{:else}{project.name}{/if}</a>
	</h2>
	{#if project.meta}
		<p class="compact-meta">{project.meta}</p>
	{/if}
	{#if b.researchStatus}
		<p class="research-status">{b.researchStatus}</p>
	{/if}
	{#if project.summaryHtml}
		<p>{@html project.summaryHtml}</p>
	{:else}
		<p>{project.summary}</p>
	{/if}
	{#if project.status}
		<p class="project-status"><a href={project.status.href}>{project.status.label}</a></p>
	{/if}
	{#if b.figure}
		<figure class="bench-figure">
			<img alt={b.figure.alt} height={b.figure.height} loading="lazy" src={b.figure.src} width={b.figure.width}>
			<figcaption>{b.figure.caption}</figcaption>
		</figure>
	{/if}
	{#if project.tech}
		<p class="project-tech">{project.tech}</p>
	{/if}
	{#if evidence}
		<p class="bench-evidence">{evidence}</p>
	{/if}
	{#if b.caveat}
		<p class="bench-caveat">{b.caveat}</p>
	{/if}
	<div class="project-links">
		{#each project.links as link (link.href)}
			<a class={link.pill ? 'pill-btn' : undefined} href={link.href} rel={rel(link.href)}>{link.label}</a>{' '}
		{/each}
	</div>
</div>
