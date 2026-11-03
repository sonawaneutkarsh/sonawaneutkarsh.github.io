<script lang="ts">
	import { PACKET_PATH, type SoftwareModel } from './software-model.svelte.ts';
	import { bezier, bump, phase, r2 } from '#lib/motion/math.ts';

	let { model, detail = 'inline' }: { model: SoftwareModel; detail?: 'inline' | 'stage' } = $props();

	const f = $derived(model.frame);
	const w = $derived(model.watch);
	const t = $derived(model.clock.t);
	const lit = $derived(model.lit);
	const morph = $derived(Math.max(0, Math.min(1, model.morph.current)));
	const code = $derived(Math.max(0, Math.min(1, model.code.current)));
	const chrome = $derived(Math.max(0, Math.min(1, model.chrome.current)));
	const transfer = $derived(Math.max(0, Math.min(1, model.transfer.current)));
	const done = $derived(Math.max(0, model.done.current));

	// Typed lines inside the window, then hidden as it becomes the phone.
	const LINES = [
		{ dx: 4, dy: 7.5, w: 12 },
		{ dx: 6.5, dy: 10.5, w: 15 },
		{ dx: 6.5, dy: 13.5, w: 9 },
		{ dx: 4, dy: 16.5, w: 6 }
	];
	const typed = (i: number) => (lit ? phase(t, 80 + i * 110, 300 + i * 110) : 1) * code;

	// Time-based parts are scaled by a spring, so dimming fades them out
	// rather than cutting them.
	const sending = $derived(lit ? phase(t, 1000, 1420) : 0);
	const packet = $derived(bezier(...(PACKET_PATH as [[number, number], [number, number], [number, number], [number, number]]), sending));
	const packetOn = $derived(sending > 0 && sending < 1 ? transfer : 0);
	const recording = $derived(lit ? 1 - phase(t, 1450, 1600) * 0.65 : 1);
	const pulse = $derived(lit && t > 860 && t < 1450 ? 0.5 + 0.5 * Math.sin((t - 860) / 70) : 0);
	const wave = $derived((lit ? bump(t, 1430, 1760) : 0) * transfer);
	const screenLine = (i: number) => (lit ? phase(t, 1600 + i * 75, 1720 + i * 75) : 0) * transfer;
</script>

<svg aria-hidden="true" class="hero-drawing software-drawing" focusable="false" viewBox="0 0 60 42">
	<!-- Watch: buds from the window's edge, straps arrive with the chrome. -->
	<g class="sw-watch" opacity={w.w < 0.4 ? 0 : 1}>
		<rect class="w1 strap" height="3.8" opacity={r2(chrome)} rx="1.1" width="6" x={r2(w.x + w.w / 2 - 3)} y={r2(w.y - 3.3)} />
		<rect class="w1 strap" height="3.8" opacity={r2(chrome)} rx="1.1" width="6" x={r2(w.x + w.w / 2 - 3)} y={r2(w.y + w.h - 0.5)} />
		<rect class="w15 device" height={r2(w.h)} rx={r2(Math.min(w.r, w.w / 2))} width={r2(w.w)} x={r2(w.x)} y={r2(w.y)} />
		<circle class="rec" cx={r2(w.x + w.w / 2)} cy={r2(w.y + w.h / 2)} opacity={r2(chrome * recording)} r="2.1" />
		<circle class="w1 rec-ring" cx={r2(w.x + w.w / 2)} cy={r2(w.y + w.h / 2)} fill="none" opacity={r2(chrome * pulse * 0.8)} r={r2(3 + pulse * 0.8)} />
	</g>

	<!-- The window, which becomes the phone. -->
	<g class="sw-frame">
		<rect class="w15 device" height={r2(f.h)} rx={r2(f.r)} width={r2(f.w)} x={r2(f.x)} y={r2(f.y)} />
		<g class="titlebar" opacity={r2(1 - morph)}>
			<path class="w1 line-ink" d={`M${r2(f.x)} ${r2(f.y + 3.4)} H${r2(f.x + f.w)}`} />
			<circle class="dot" cx={r2(f.x + 2.6)} cy={r2(f.y + 1.75)} r="0.62" />
			<circle class="dot" cx={r2(f.x + 4.6)} cy={r2(f.y + 1.75)} r="0.62" />
			<circle class="dot" cx={r2(f.x + 6.6)} cy={r2(f.y + 1.75)} r="0.62" />
		</g>
		<!-- </> at rest; typed code lines when lit. -->
		<path
			class="w125 sage"
			d={`M${r2(f.x + 9.5)} ${r2(f.y + 6.5)} l-3 3.3 l3 3.2 M${r2(f.x + 18.5)} ${r2(f.y + 6.5)} l3 3.3 l-3 3.2 M${r2(f.x + 15.6)} ${r2(f.y + 5.6)} l-3.2 8.4`}
			fill="none"
			opacity={r2(Math.max(0, 1 - code * 1.6) * (1 - morph))}
		/>
		{#each LINES as line, i (i)}
			<rect
				class="code-line"
				height="1.25"
				opacity={r2((1 - morph * 1.4) > 0 ? 1 - morph * 1.4 : 0)}
				rx="0.6"
				width={r2(line.w * typed(i))}
				x={r2(f.x + line.dx)}
				y={r2(f.y + line.dy)}
			/>
		{/each}
		<!-- Phone details. -->
		<rect class="notch" height="1.3" opacity={r2(chrome)} rx="0.65" width="4.4" x={r2(f.x + f.w / 2 - 2.2)} y={r2(f.y + 1.5)} />
		<path
			class="w1 sage"
			d={`M${r2(f.x + 3)} ${r2(f.y + 11)} h1.4 l1 -3 l1.5 6 l1.5 -5 l1 2 h1.6`}
			fill="none"
			opacity={r2(wave)}
		/>
		{#each [0, 1, 2, 3] as i (i)}
			<rect
				class="screen-line"
				height="1.15"
				opacity={r2(screenLine(i))}
				rx="0.55"
				width={[8, 6.5, 7.5, 4.5][i]}
				x={r2(f.x + 2.6)}
				y={r2(f.y + 6.5 + i * 3.1)}
			/>
		{/each}
	</g>

	<!-- The recording on its way. -->
	<g opacity={r2(packetOn)} transform={`translate(${r2(packet[0])} ${r2(packet[1])})`}>
		<rect class="packet" height="3.6" rx="1" width="5.4" x="-2.7" y="-1.8" />
		<path class="w075 paper-ink" d="M-1.8 0 h0.7 l0.5 -1 l0.6 2 l0.6 -1.6 l0.4 0.6 h0.5" fill="none" />
	</g>

	<!-- Completed. -->
	<g class="sw-done" opacity={done > 0.02 ? 1 : 0} transform={`translate(${r2(f.x + f.w - 0.5)} ${r2(f.y + 0.8)}) scale(${r2(Math.max(0.01, done))})`}>
		<circle class="badge" r="3.4" />
		<path class="w11 paper-ink" d="M-1.6 0 l1.1 1.2 l2.2 -2.4" fill="none" />
	</g>

	{#if detail === 'stage'}
		<g class="stage-labels" opacity={r2(chrome)}>
			<text x={r2(w.x + w.w / 2)} y="36.5">watch</text>
			<text x={r2(f.x + f.w / 2)} y="36.5">iPhone</text>
		</g>
	{/if}
</svg>
