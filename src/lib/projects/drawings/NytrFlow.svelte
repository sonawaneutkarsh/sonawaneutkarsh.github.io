<script lang="ts" module>
	/** Nytr unfolds: the day's menu opens row by row, one dish is picked, it is
	 * worked through the backend's exact arithmetic, and the iPhone's Today view
	 * assembles. Drawn from the case study's architecture section. */
	export const END = 3200;
</script>

<script lang="ts">
	import { bezier, ease, easeOut, phase, r2 } from '#lib/motion/math.ts';

	let { t }: { t: number } = $props();

	const ROWS = [44, 62, 80, 98, 116];
	const WIDTHS = [46, 36, 52, 32, 42];
	const PICK = 2;

	const unfold = (i: number) => easeOut(phase(t, 220 + i * 120, 520 + i * 120));
	const picked = $derived(ease(phase(t, 980, 1180)));
	const toBackend = $derived(ease(phase(t, 1180, 1560)));
	const compute = $derived(phase(t, 1560, 1900));
	const toPhone = $derived(ease(phase(t, 1900, 2280)));
	const ring = $derived(easeOut(phase(t, 2280, 2900)));
	const bars = $derived(easeOut(phase(t, 2400, 2950)));
	const card = $derived(easeOut(phase(t, 2650, 3150)));

	const packet = $derived(
		toBackend < 1
			? bezier([104, ROWS[PICK]], [114, ROWS[PICK]], [112, 87], [124, 87], toBackend)
			: bezier([170, 87], [180, 87], [178, 76], [190, 76], toPhone)
	);
	const packetOn = $derived((toBackend > 0 && toBackend < 1) || (toPhone > 0 && toPhone < 1) ? 1 : 0);
</script>

<svg aria-hidden="true" class="preview-drawing" focusable="false" viewBox="0 0 280 175">
	<!-- Menu card that unfolds row by row. -->
	<g transform="translate(14 14)">
		<rect class="p-card" height={r2(36 + 104 * unfold(4))} rx="7" width="90" />
		<text class="p-label" x="10" y="17">Today’s menu</text>
		<path class="p-rule" d="M10 24 H80" />
		{#each ROWS as y, i (y)}
			{@const u = unfold(i)}
			<g opacity={r2(u)} transform={`translate(0 ${r2((1 - u) * -9)})`}>
				<rect class="p-pick" height="14" opacity={r2(i === PICK ? picked : 0)} rx="3.5" width="80" x="5" y={y - 21} />
				<circle class="p-dot" cx="13" cy={y - 14} r="2.3" />
				<rect class="p-line" height="3" rx="1.5" width={WIDTHS[i]} x="20" y={y - 15.5} />
			</g>
		{/each}
		<path class="p-check" d={`M70 ${ROWS[PICK] - 15} l2.5 2.5 l5 -5.5`} opacity={r2(picked)} />
	</g>
	<text class="p-caption" x="59" y="167">Penn State dining</text>

	<path class="p-wire" d={`M104 ${ROWS[PICK]} C 114 ${ROWS[PICK]}, 112 87, 124 87`} />
	<path class="p-wire" d="M170 87 C 180 87, 178 76, 190 76" />

	<!-- Backend: exact, deterministic arithmetic. -->
	<g transform="translate(124 68)">
		<rect class="p-box" height="38" rx="7" width="46" />
		<text class="p-sigma" class:on={compute > 0 && compute < 1} x="23" y="25">Σ</text>
		{#each [0, 1, 2] as k (k)}
			<rect class="p-tick" height="2.4" opacity={r2(Math.min(1, compute * 3 - k))} rx="1.2" width="8" x={8 + k * 11} y="31" />
		{/each}
	</g>
	<text class="p-caption" x="147" y="122">backend</text>

	<!-- iPhone Today view. -->
	<g transform="translate(190 12)">
		<rect class="p-device" height="140" rx="13" width="70" />
		<rect class="p-screen" height="122" rx="6" width="60" x="5" y="11" />
		<rect class="p-notch" height="3" rx="1.5" width="14" x="28" y="4.5" />
		<text class="p-label" x="11" y="27">Today</text>
		<circle class="p-ring-track" cx="35" cy="56" r="15" />
		<circle class="p-ring" cx="35" cy="56" pathLength="1" r="15" stroke-dasharray={`${r2(0.72 * ring)} 1`} transform="rotate(-90 35 56)" />
		<rect class="p-track" height="3" rx="1.5" width="46" x="12" y="82" />
		<rect class="p-fill" height="3" rx="1.5" width={r2(46 * 0.82 * bars)} x="12" y="82" />
		<rect class="p-track" height="3" rx="1.5" width="46" x="12" y="90" />
		<rect class="p-fill soft" height="3" rx="1.5" width={r2(46 * 0.56 * bars)} x="12" y="90" />
		<g opacity={r2(card)} transform={`translate(0 ${r2((1 - card) * 10)})`}>
			<rect class="p-rec" height="22" rx="5" width="50" x="10" y="101" />
			<circle class="p-dot" cx="18" cy="112" r="2.3" />
			<rect class="p-line" height="3" rx="1.5" width="30" x="24" y="110.5" />
		</g>
	</g>
	<text class="p-caption" x="225" y="167">iPhone</text>

	<rect class="p-packet" height="9" opacity={packetOn} rx="2.5" width="13" x={r2(packet[0] - 6.5)} y={r2(packet[1] - 4.5)} />
</svg>
