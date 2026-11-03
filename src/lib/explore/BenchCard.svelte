<script lang="ts">
	// One project object on the workbench. A mouse or pen over it tilts it a
	// few degrees towards the pointer and lifts it (springs, so a pass across
	// several cards ripples rather than snaps); keyboard focus lifts it too.
	// Without JavaScript and in the list view it is just the detail below.
	import { Spring } from 'svelte/motion';
	import type { Project } from '#lib/content/projects.ts';
	import BenchSketch from './BenchSketch.svelte';
	import ProjectDetail from './ProjectDetail.svelte';
	import { CALM, SOFT } from '#lib/motion/springs.ts';
	import { keyboardFocus, reducedMotion } from '#lib/motion/environment.ts';

	interface Props {
		project: Project;
		selected: boolean;
		muted: boolean;
		enhanced: boolean;
		onchoose: (project: Project) => void;
		onfocus: (project: Project) => void;
	}
	let { project, selected, muted, enhanced, onchoose, onfocus }: Props = $props();

	const rx = new Spring(0, SOFT);
	const ry = new Spring(0, SOFT);
	const lift = new Spring(0, CALM);
	let hovering = false;
	let focused = false;

	$effect(() => {
		const on = selected || hovering || focused;
		lift.set(on ? 1 : 0, { instant: reducedMotion() });
	});

	function move(event: PointerEvent) {
		if (event.pointerType === 'touch' || reducedMotion()) return;
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const nx = (event.clientX - box.left) / box.width - 0.5;
		const ny = (event.clientY - box.top) / box.height - 0.5;
		ry.target = nx * 8;
		rx.target = -ny * 7;
		if (!hovering) {
			hovering = true;
			lift.target = 1;
		}
	}
	function leave() {
		hovering = false;
		rx.target = 0;
		ry.target = 0;
		if (!selected && !focused) lift.target = 0;
	}
	function focusin(event: FocusEvent) {
		focused = keyboardFocus(event.currentTarget as Element);
		if (focused) lift.target = 1;
		onfocus(project);
	}
	function focusout() {
		focused = false;
		if (!selected && !hovering) lift.target = 0;
	}
	const sketch = $derived(project.bench.sketch);
</script>

<li
	class="bench-item"
	class:is-muted={muted}
	class:is-selected={selected}
	data-categories={project.areas.join(' ')}
	id={project.id}
	inert={enhanced && muted}
	style:left="{project.bench.pos[0]}px"
	style:top="{project.bench.pos[1]}px"
>
	<button
		aria-controls="bench-panel"
		aria-expanded={selected}
		class="bench-object"
		onblur={focusout}
		onclick={() => onchoose(project)}
		onfocus={focusin}
		onpointerleave={leave}
		onpointermove={move}
		style:--lift={Math.max(0, lift.current).toFixed(3)}
		style:--rx={rx.current.toFixed(2)}
		style:--ry={ry.current.toFixed(2)}
		type="button"
	>
		<span class="bench-sketch">
			{#if 'svg' in sketch}
				<BenchSketch kind={sketch.svg} />
			{:else}
				<img alt="" height={sketch.height} loading="lazy" src={sketch.src} width={sketch.width}>
			{/if}
		</span>{' '}
		<span class="bench-label">{project.name}</span>{' '}
		<span class="bench-note">{project.bench.note}</span>
	</button>
	<ProjectDetail {project} />
</li>
