<script lang="ts">
	// The margin figure: a larger copy of the lit object on a slip of paper in
	// the right margin, joined to its line of text by a pencil leader drawn
	// in the gutter. Decorative (aria-hidden); the sentence carries the meaning.
	import HeroDrawing from './HeroDrawing.svelte';
	import { KINDS, type HeroStage } from './stage.svelte.ts';
	import { dashedDraw, r2 } from '#lib/motion/math.ts';

	let { stage }: { stage: HeroStage } = $props();

	const p = $derived(stage.place);
	const fig = $derived(stage.figure.current);
	const shown = $derived(Boolean(p) && (fig > 0.003 || stage.owner !== null));
	const fy = $derived(stage.figureY.current);
	const ly = $derived(stage.lineY.current);
	const leader = $derived(Math.max(0, Math.min(1, stage.leader.current)));

	// A soft S from the end of the line to the figure's left edge.
	const path = $derived.by(() => {
		if (!p) return '';
		const x0 = p.lineX;
		const x1 = p.x - 7;
		const y1 = fy + p.h * 0.42;
		const mid = (x0 + x1) / 2;
		return `M${r2(x0)} ${r2(ly)} C ${r2(mid)} ${r2(ly)}, ${r2(mid)} ${r2(y1)}, ${r2(x1)} ${r2(y1)}`;
	});

	$effect(() => {
		const onResize = () => stage.relayout();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

{#if p}
	<svg aria-hidden="true" class="hero-leader" focusable="false" style:visibility={shown ? 'visible' : 'hidden'}>
		<circle cx={r2(p.lineX)} cy={r2(ly)} opacity={r2(Math.min(1, leader * 2))} r="2" />
		<path d={path} pathLength="100" stroke-dasharray={dashedDraw(leader, 2.2, 2.6)} />
	</svg>
	<div
		aria-hidden="true"
		class="hero-stage"
		style:height="{p.h}px"
		style:left="{p.x}px"
		style:opacity={r2(Math.max(0, Math.min(1, fig * 1.8)))}
		style:top="{r2(fy)}px"
		style:transform="translateX({r2((1 - fig) * -22)}px) scale({r2(0.55 + 0.45 * fig)}) rotate({r2(-1.4 - 4.5 * (1 - fig))}deg)"
		style:visibility={shown ? 'visible' : 'hidden'}
		style:width="{p.w}px"
	>
		<span class="hero-stage-tape"></span>
		{#each KINDS as kind (kind)}
			{@const presence = stage.model(kind).presence.current}
			{#if presence > 0.003 || stage.owner === kind}
				<div class="hero-stage-layer" style:opacity={r2(Math.max(0, Math.min(1, presence)))}>
					<HeroDrawing detail="stage" {kind} models={stage.models} />
				</div>
			{/if}
		{/each}
	</div>
{/if}
