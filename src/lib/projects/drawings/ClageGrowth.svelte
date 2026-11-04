<script lang="ts" module>
	/** Clage grows: a minimal network connects its inputs to its outputs, then
	 * mutates the way NEAT does. A hidden node buds in the middle of one
	 * connection and splits it, a new connection grows towards it, and signals
	 * start to travel through the new structure. */
	export const END = 3600;
</script>

<script lang="ts">
	import { bezier, bump, easeOut, easeOutBack, mix, phase, r2 } from '#lib/motion/math.ts';

	let { t }: { t: number } = $props();

	const IN = [44, 88, 132].map((y) => [62, y] as [number, number]);
	const OUT = [66, 110].map((y) => [218, y] as [number, number]);
	const HIDDEN: [number, number] = [140, 66];
	const DIRECT: [number, number][] = [[0, 0], [1, 0], [1, 1], [2, 1]];

	const drawn = (i: number) => easeOut(phase(t, i * 110, 420 + i * 110));
	// The node buds with a small overshoot, as if it pushed out of the line.
	const budScale = $derived(Math.max(0, easeOutBack(phase(t, 760, 1240))));
	const split = $derived(easeOut(phase(t, 900, 1380)));
	const vine = $derived(easeOut(phase(t, 1450, 2050)));
	const live = $derived(phase(t, 2100, 3500));

	const vinePath = `M${IN[2][0]} ${IN[2][1]} C 96 128, 108 90, ${HIDDEN[0]} ${HIDDEN[1]}`;
	const vinePoint = (u: number) => bezier(IN[2], [96, 128], [108, 90], HIDDEN, u);

	// Two waves of signals: input → hidden → output.
	function signal(k: number): [number, number, number] {
		const u = (live * 2 + k * 0.5) % 1;
		if (live <= 0 || live >= 1) return [0, 0, 0];
		const first = u < 0.5;
		const v = first ? u * 2 : (u - 0.5) * 2;
		const [a, b] = first ? [k === 0 ? IN[0] : IN[2], HIDDEN] : [HIDDEN, OUT[0]];
		const [x, y] = k === 1 && first ? vinePoint(v) : [mix(a[0], b[0], v), mix(a[1], b[1], v)];
		return [x, y, Math.sin(u * Math.PI)];
	}
	const glow = $derived(bump(live, 0.18, 0.5) + bump(live, 0.68, 1));
</script>

<svg aria-hidden="true" class="preview-drawing" focusable="false" viewBox="0 0 280 175">
	<g class="c-edges">
		{#each DIRECT as [a, b], i (i)}
			{@const p = drawn(i)}
			<line
				class="p-edge"
				opacity={i === 0 ? r2(1 - split) : 1}
				x1={IN[a][0]}
				x2={r2(mix(IN[a][0], OUT[b][0], p))}
				y1={IN[a][1]}
				y2={r2(mix(IN[a][1], OUT[b][1], p))}
			/>
		{/each}
		<!-- The split: two halves grow out of the new node. -->
		<line class="p-edge new" opacity={split > 0 ? 1 : 0} x1={HIDDEN[0]} x2={r2(mix(HIDDEN[0], IN[0][0], split))} y1={HIDDEN[1]} y2={r2(mix(HIDDEN[1], IN[0][1], split))} />
		<line class="p-edge new" opacity={split > 0 ? 1 : 0} x1={HIDDEN[0]} x2={r2(mix(HIDDEN[0], OUT[0][0], split))} y1={HIDDEN[1]} y2={r2(mix(HIDDEN[1], OUT[0][1], split))} />
		<path class="p-edge vine" d={vinePath} opacity={vine > 0 ? 1 : 0} pathLength="1" stroke-dasharray={`${r2(vine)} 1`} />
	</g>
	{#each IN as [x, y] (y)}
		<circle class="p-node" cx={x} cy={y} r="7.5" />
	{/each}
	{#each OUT as [x, y] (y)}
		<circle class="p-node" class:lit={glow > 0.3} cx={x} cy={y} r="7.5" />
	{/each}
	<circle class="p-node hidden" cx={HIDDEN[0]} cy={HIDDEN[1]} opacity={budScale > 0 ? 1 : 0} r={r2(7.5 * budScale)} />
	{#each [0, 1, 2] as k (k)}
		{@const [x, y, v] = signal(k)}
		<circle class="p-signal" cx={r2(x)} cy={r2(y)} opacity={r2(v)} r="3.2" />
	{/each}
	<text class="p-caption" x="62" y="164">inputs</text>
	<text class="p-caption" x="218" y="164">outputs</text>
	<text class="p-caption soft" opacity={r2(phase(t, 900, 1200) * (1 - phase(t, 1450, 1700)))} x="140" y="38">add node</text>
	<text class="p-caption soft" opacity={r2(phase(t, 1500, 1800) * (1 - phase(t, 2150, 2450)))} x="108" y="150">add connection</text>
</svg>
