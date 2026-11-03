<script lang="ts">
	// Drawing for the AI systems object. The same model drives the inline icon
	// and the larger margin copy; `detail="stage"` adds the small labels that
	// are only legible at that size.
	import { EDGES, EXTRA, ROUTES, LOOP_DIP, type AiModel } from './ai-model.svelte.ts';
	import { dashedDraw, mix, r2 } from '#lib/motion/math.ts';

	let { model, detail = 'inline' }: { model: AiModel; detail?: 'inline' | 'stage' } = $props();

	const nodes = $derived(model.nodes);
	const fm = $derived(model.flowMean);
	const network = $derived(Math.max(0, 1 - fm * 1.6));
	const extra = $derived(Math.max(0, model.extra.current));
	const arrows = $derived(Math.max(0, Math.min(1, model.arrows.current)));
	const loop = $derived(Math.max(0, Math.min(1, model.loop.current)));
	const t = $derived(model.clock.t);
	const token = $derived(model.token.current > 0.01 ? model.tokenAt(t) : null);

	const edge = (a: number, b: number) => ({
		x1: r2(nodes[a].x),
		y1: r2(nodes[a].y),
		x2: r2(nodes[b].x),
		y2: r2(nodes[b].y),
		ink: (nodes[a].ink + nodes[b].ink) / 2
	});
	// Arrow between two boxes' facing edges, drawn on from the first.
	function arrow(a: number, b: number, p: number) {
		const x1 = nodes[a].x + nodes[a].w / 2 + 0.8;
		const x2 = nodes[b].x - nodes[b].w / 2 - 0.8;
		const x = mix(x1, x2, p);
		const y = nodes[a].y;
		return { d: `M${r2(x1)} ${r2(y)} H${r2(x)}`, head: `M${r2(x - 1.8)} ${r2(y - 1.5)} L${r2(x)} ${r2(y)} L${r2(x - 1.8)} ${r2(y + 1.5)}` };
	}
	const a1 = $derived(arrow(0, 3, arrows));
	const a2 = $derived(arrow(3, 5, Math.max(0, Math.min(1, arrows * 1.15 - 0.15))));
	const loopPath = $derived(
		`M${r2(nodes[5].x)} ${r2(nodes[5].y + nodes[5].h / 2)} C ${r2(nodes[5].x)} ${LOOP_DIP}, ${r2(nodes[0].x)} ${LOOP_DIP}, ${r2(nodes[0].x)} ${r2(nodes[0].y + nodes[0].h / 2)}`
	);
</script>

<svg aria-hidden="true" class="hero-drawing ai-drawing" focusable="false" viewBox="0 0 60 42">
	<g class="ai-edges" opacity={r2(network)}>
		{#each EDGES as [a, b] (`${a}-${b}`)}
			{@const e = edge(a, b)}
			<line class="w1 line-ink" stroke-opacity={r2(e.ink)} x1={e.x1} x2={e.x2} y1={e.y1} y2={e.y2} />
		{/each}
		{#each EXTRA as [a, b] (`x${a}-${b}`)}
			{@const e = edge(a, b)}
			<line
				class="w1 sage"
				opacity={extra > 0.02 ? 1 : 0}
				x1={e.x1}
				x2={r2(mix(e.x1, e.x2, Math.min(1, extra)))}
				y1={e.y1}
				y2={r2(mix(e.y1, e.y2, Math.min(1, extra)))}
			/>
		{/each}
	</g>

	<g class="ai-flow" fill="none">
		<path class="w15 sage" d={a1.d} opacity={arrows > 0.02 ? 1 : 0} />
		<path class="w1 sage" d={a1.head} opacity={arrows > 0.6 ? 1 : 0} />
		<path class="w15 sage" d={a2.d} opacity={arrows > 0.15 ? 1 : 0} />
		<path class="w1 sage" d={a2.head} opacity={arrows > 0.7 ? 1 : 0} />
		<line
			class="w1 line-ink dash-tight"
			opacity={r2(arrows)}
			x1={r2(nodes[3].x)}
			x2={r2(nodes[2].x)}
			y1={r2(nodes[3].y - nodes[3].h / 2)}
			y2={r2(nodes[2].y + nodes[2].h / 2)}
		/>
		<path class="w1 sage" d={loopPath} opacity={loop > 0.02 ? 1 : 0} pathLength="100" stroke-dasharray={dashedDraw(loop, 3.4, 3)} />
		<path
			class="w1 sage"
			d={`M${r2(nodes[0].x - 2)} ${r2(nodes[0].y + nodes[0].h / 2 + 2.6)} L${r2(nodes[0].x)} ${r2(nodes[0].y + nodes[0].h / 2 + 0.2)} L${r2(nodes[0].x + 2)} ${r2(nodes[0].y + nodes[0].h / 2 + 2.6)}`}
			opacity={loop > 0.9 ? r2((loop - 0.9) * 10) : 0}
		/>
	</g>

	<g class="ai-nodes">
		{#each nodes as n, i (i)}
			<rect
				class="w15 node"
				fill-opacity={r2(0.55 + 0.45 * n.ink)}
				height={r2(n.h)}
				opacity={n.w < 0.6 || n.h < 0.6 ? 0 : 1}
				rx={r2(Math.min(n.w, n.h) / 2 - (Math.min(n.w, n.h) / 2 - 2.4) * n.f)}
				stroke-opacity={r2(n.ink)}
				width={r2(n.w)}
				x={r2(n.x - n.w / 2)}
				y={r2(n.y - n.h / 2)}
			/>
		{/each}
	</g>

	{#if model.signals.current > 0.01}
		<g class="ai-signals">
			{#each ROUTES as _, k (k)}
				{@const [x, y, v] = model.signal(k, t)}
				<circle class="signal" cx={r2(x)} cy={r2(y)} opacity={r2(Math.max(0, v))} r="1.5" />
			{/each}
		</g>
	{/if}

	{#if token}
		<circle class="signal" cx={r2(token[0])} cy={r2(token[1])} opacity={r2(Math.min(1, model.token.current))} r="1.7" />
	{/if}

	{#if detail === 'stage'}
		<g class="stage-labels" opacity={r2(Math.max(0, Math.min(1, (fm - 0.6) / 0.4)))}>
			<text x={r2(nodes[0].x)} y={r2(nodes[0].y + 1)}>plan</text>
			<text x={r2(nodes[3].x)} y={r2(nodes[3].y + 1)}>act</text>
			<text x={r2(nodes[5].x)} y={r2(nodes[5].y + 1)}>check</text>
			<text class="aside" x={r2(nodes[2].x + 4.6)} y={r2(nodes[2].y + 1)}>tool</text>
		</g>
	{/if}
</svg>
