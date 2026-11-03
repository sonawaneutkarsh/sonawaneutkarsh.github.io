<script lang="ts">
	// A featured project on the homepage. At rest the frame shows the original
	// illustration. Hovering the row with a mouse or pen (after a short intent
	// delay), focusing a link in it with the keyboard, or pressing the frame
	// plays an animated drawing of how the project works; each project has its
	// own kind of motion (Nytr unfolds, Clage grows, Talks transfers, Devvy
	// arbitrates). No video plays on the homepage; the demos stay in the case
	// studies. Reduced motion: hover and focus do nothing, the button shows a
	// still of the drawing's final state.
	import { onMount } from 'svelte';
	import type { Project } from '#lib/content/projects.ts';
	import { isExternal } from '#lib/content/projects.ts';
	import { Preview } from './preview.svelte.ts';
	import { inView } from '#lib/motion/attachments.ts';
	import { keyboardFocus, reducedMotion } from '#lib/motion/environment.ts';
	import NytrFlow, { END as NYTR_END } from './drawings/NytrFlow.svelte';
	import ClageGrowth, { END as CLAGE_END } from './drawings/ClageGrowth.svelte';
	import TalksTransfer, { END as TALKS_END } from './drawings/TalksTransfer.svelte';
	import DevvyArbiter, { END as DEVVY_END } from './drawings/DevvyArbiter.svelte';
	import '#lib/styles/drawings.css';

	let { project }: { project: Project & { featured: NonNullable<Project['featured']> } } = $props();

	const DRAWINGS = {
		nytr: { component: NytrFlow, end: NYTR_END },
		clage: { component: ClageGrowth, end: CLAGE_END },
		talks: { component: TalksTransfer, end: TALKS_END },
		devvy: { component: DevvyArbiter, end: DEVVY_END }
	};
	// svelte-ignore state_referenced_locally
	const drawing = DRAWINGS[project.featured.drawing];
	// svelte-ignore state_referenced_locally
	const preview = new Preview(project.name, drawing.end);
	const Drawing = drawing.component;

	let enhanced = $state(false);
	let row: HTMLElement;
	let intent = 0;

	const lift = $derived(Math.max(0, preview.lift.current));
	const reveal = $derived(Math.max(0, Math.min(1, preview.reveal.current)));

	function enter(event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		preview.hover(true);
		if (reducedMotion()) return;
		clearTimeout(intent);
		intent = window.setTimeout(() => preview.start('hover'), 120);
	}
	function leave(event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		clearTimeout(intent);
		preview.hover(false);
		if (preview.source === 'hover') preview.stop();
	}
	function focusin(event: FocusEvent) {
		preview.hover(true);
		const target = event.target as HTMLElement;
		if (target.classList.contains('preview-toggle') || reducedMotion()) return;
		if (keyboardFocus(target) && !preview.active) preview.start('focus');
	}
	function focusout(event: FocusEvent) {
		if (row.contains(event.relatedTarget as Node | null)) return;
		preview.hover(false);
		if (preview.source === 'focus') preview.stop();
	}

	const offscreen = inView((visible) => {
		if (!visible) preview.stop();
	});

	onMount(() => {
		enhanced = true;
		const hidden = () => document.hidden && preview.stop();
		document.addEventListener('visibilitychange', hidden);
		return () => {
			document.removeEventListener('visibilitychange', hidden);
			clearTimeout(intent);
			preview.stop();
		};
	});

	const rel = (href: string) => (isExternal(href) ? 'noopener' : undefined);
</script>

<article bind:this={row} class="project-row" onfocusin={focusin} onfocusout={focusout} onpointerenter={enter} onpointerleave={leave}>
	<div
		class="project-media"
		class:is-active={preview.active}
		class:is-enhanced={enhanced}
		data-name={project.name}
		data-preview={project.featured.drawing}
		style:--lift={lift.toFixed(4)}
		style:--p={reveal.toFixed(4)}
		{@attach offscreen}
	>
		<img
			alt=""
			class="illustration"
			height={project.featured.illustration.height}
			loading="lazy"
			src={project.featured.illustration.src}
			width={project.featured.illustration.width}
		>
		<div aria-hidden="true" class="preview-stage">
			{#if preview.built}
				<Drawing t={preview.clock.t} />
			{/if}
		</div>
		{#if enhanced}
			<button
				aria-label={`${preview.active ? 'Pause' : 'Play'} ${project.name} animation`}
				aria-pressed={preview.active}
				class="preview-toggle"
				onclick={() => {
					clearTimeout(intent);
					preview.toggle();
				}}
				type="button"><span class="preview-chip"><span aria-hidden="true" class="preview-icon"></span></span></button
			>
		{/if}
	</div>
	<div>
		<h3><a href={project.href}>{project.name}</a></h3>
		<p>{project.summary}</p>
		{#if project.status}
			<p class="project-status"><a href={project.status.href}>{project.status.label}</a></p>
		{/if}
		<p class="project-tech">{project.tech}</p>
		<div class="project-links">
			{#each project.links as link (link.href)}
				<a class={link.pill ? 'pill-btn' : undefined} href={link.href} rel={rel(link.href)}>{link.label}</a>
			{/each}
		</div>
		<details>
			<summary>Technical details</summary>
			<p class="project-desc">{project.featured.detail}</p>
			<p class="project-metric"><strong>{project.featured.metricStrong}</strong> · {project.featured.metricRest}</p>
		</details>
	</div>
</article>
