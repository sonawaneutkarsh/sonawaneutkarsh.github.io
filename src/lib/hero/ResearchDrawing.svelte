<script lang="ts">
	import { BOOK, type ResearchModel } from './research-model.svelte.ts';
	import { bezier, dashedDraw, phase, r2 } from '#lib/motion/math.ts';

	let { model, detail = 'inline' }: { model: ResearchModel; detail?: 'inline' | 'stage' } = $props();

	const S = $derived(model.spine);
	const a = $derived(model.angle);
	const cos = $derived(Math.cos(a));
	const sin = $derived(Math.sin(a));
	const t = $derived(model.clock.t);
	const lit = $derived(model.lit);
	const top = BOOK.top;
	const bottom = BOOK.top + BOOK.height;
	const W = BOOK.width;

	// The cover turns about the spine; its free edge shortens a little while it
	// is edge-on, which reads as perspective.
	const edgeX = $derived(S + W * cos);
	const inset = $derived(2 * sin);
	const cover = $derived(`M${r2(S)} ${top} L${r2(edgeX)} ${r2(top + inset)} L${r2(edgeX)} ${r2(bottom - inset)} L${r2(S)} ${bottom} Z`);
	const front = $derived(cos > 0);
	// The page block shows as a thin edge beside and below the closed cover.
	const block = $derived(Math.max(0, cos));

	const write = $derived(Math.max(0, Math.min(1, model.write.current)));
	const LINES = [
		{ y: 11.6, w: 13 },
		{ y: 15.4, w: 10.5 },
		{ y: 19.2, w: 14 },
		{ y: 23, w: 8.5 },
		{ y: 26.8, w: 12 }
	];
	const lineW = (i: number) => LINES[i].w * (lit ? phase(t, 540 + i * 90, 760 + i * 90) : 1) * write;

	const drug = $derived(Math.max(0, model.drug.current));
	const reaction = $derived(Math.max(0, model.reaction.current));
	const link = $derived(Math.max(0, Math.min(1, model.link.current)));
	const file = $derived(Math.max(0, Math.min(1, model.file.current)));
	const filed = $derived(Math.max(0, model.filed.current));

	// Highlights sit behind words on lines 1 and 3 of the right page.
	const drugBox = $derived({ x: S + 6.4, y: 10.1, w: 6.8, h: 3 });
	const reactBox = $derived({ x: S + 8, y: 17.7, w: 8.2, h: 3 });
	const linkPath = $derived(
		`M${r2(drugBox.x + drugBox.w + 0.4)} ${r2(drugBox.y + 1.5)} C ${r2(S + 19.5)} ${r2(drugBox.y + 2)}, ${r2(S + 19.5)} ${r2(reactBox.y + 0.6)}, ${r2(reactBox.x + reactBox.w + 0.4)} ${r2(reactBox.y + 1.4)}`
	);

	// The slip travels from the link to the tray on the left page.
	const tray = $derived({ x: S - 16.5, y: 22 });
	const travel = $derived(lit ? phase(t, 1900, 2380) : file);
	const slip = $derived(bezier([S + 18, 14.8], [S + 11, 2.5], [S - 7, 5], [tray.x + 6.5, tray.y + 1.3], Math.min(1, travel)));
	const slipOn = $derived(file > 0.02 ? file : 0);
	const pop = (v: number, box: { x: number; y: number; w: number; h: number }) =>
		`translate(${r2(box.x + box.w / 2)} ${r2(box.y + box.h / 2)}) scale(${r2(Math.max(0.01, v))}) translate(${r2(-box.x - box.w / 2)} ${r2(-box.y - box.h / 2)})`;
</script>

<svg aria-hidden="true" class="hero-drawing research-drawing" focusable="false" viewBox="0 0 60 42">
	<!-- Page block: the edge of the pages behind the closed cover. -->
	<rect class="w1 pages" height={BOOK.height} opacity={r2(block)} rx="1.4" width={W} x={r2(S + 1.3 * block)} y={r2(top + 1.1 * block)} />
	<!-- Right page: under the cover, revealed as it opens. -->
	<rect class="w15 page" height={BOOK.height} rx="1.4" width={W} x={r2(S)} y={top} />
	<rect class="w1 mark-drug" height={drugBox.h} opacity={r2(Math.min(1, drug))} rx="1" transform={pop(drug, drugBox)} width={drugBox.w} x={r2(drugBox.x)} y={drugBox.y} />
	<rect class="w1 mark-reaction" height={reactBox.h} opacity={r2(Math.min(1, reaction))} rx="1" transform={pop(reaction, reactBox)} width={reactBox.w} x={r2(reactBox.x)} y={reactBox.y} />
	<g class="rs-text">
		{#each LINES as line, i (i)}
			<rect class="text-line" height="0.95" rx="0.47" width={r2(lineW(i))} x={r2(S + 3)} y={line.y} />
		{/each}
	</g>
	<path class="w1 sage" d={linkPath} fill="none" opacity={link > 0.02 ? 1 : 0} pathLength="100" stroke-dasharray={dashedDraw(link, 9, 6)} />

	<!-- The cover, and on its back (once open) the review tray. -->
	<path class="w15 cover" class:inside={!front} d={cover} />
	{#if front}
		<g opacity={r2(Math.max(0, cos))}>
			<rect class="spine" height={BOOK.height - 1} width={r2(2.6 * cos)} x={r2(S + 0.5 * cos)} y={top + 0.5} />
			<rect class="w1 label" height="5" rx="0.8" width={r2(10 * cos)} x={r2(S + 6 * cos)} y="11.5" />
			<path class="w075 line-ink" d={`M${r2(S + 7.6 * cos)} 13.2 H${r2(S + 14 * cos)} M${r2(S + 7.6 * cos)} 15 H${r2(S + 12 * cos)}`} />
			<path class="w1 sage" d={`M${r2(S + 17 * cos)} ${top} V${bottom}`} />
		</g>
	{:else}
		<g class="tray" opacity={r2(Math.max(0, -cos))}>
			<rect class="text-line" height="0.95" rx="0.47" width="9" x={r2(tray.x + 1.5)} y="11.6" />
			<rect class="text-line" height="0.95" rx="0.47" width="6.5" x={r2(tray.x + 1.5)} y="15.4" />
			<path class="w1 line-ink" d={`M${r2(tray.x)} ${r2(tray.y)} v5.6 h13 v-5.6`} fill="none" />
			<rect class="slip-stack" height="2.4" rx="0.5" width="9.5" x={r2(tray.x + 1.75)} y={r2(tray.y + 2.2)} />
		</g>
	{/if}

	<!-- The slip being filed for review. -->
	<g opacity={r2(slipOn)} transform={`translate(${r2(slip[0])} ${r2(slip[1])}) rotate(${r2(-8 * (1 - travel))})`}>
		<rect class="w1 slip" height="3.4" rx="0.7" width="7.4" x="-3.7" y="-1.7" />
		<circle class="dot-drug" cx="-2" cy="0" r="0.85" />
		<circle class="dot-reaction" cx="2" cy="0" r="0.85" />
		<path class="w075 sage" d="M-1 0 H1" stroke-dasharray="0.6 0.5" />
	</g>
	<g opacity={filed > 0.02 ? 1 : 0} transform={`translate(${r2(tray.x + 11.4)} ${r2(tray.y + 1.3)}) scale(${r2(Math.max(0.01, filed))})`}>
		<circle class="badge" r="1.15" />
	</g>

	{#if detail === 'stage'}
		<g class="stage-labels" opacity={r2(Math.max(0, -cos))}>
			<text x={r2(tray.x + 6.5)} y="32">for review</text>
		</g>
	{/if}
</svg>
