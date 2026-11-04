<script lang="ts" module>
	/** Talks transfers: the watch records, the file crosses to the iPhone and
	 * is queued, an acknowledgement comes back before the watch lets go of
	 * its copy, the phone transcribes and summarizes on device, and the page
	 * is saved to Notion. Drawn from the case study's architecture section. */
	export const END = 4300;
</script>

<script lang="ts">
	import { bezier, bump, ease, easeOut, easeOutBack, phase, r2 } from '#lib/motion/math.ts';

	let { t }: { t: number } = $props();

	const send = $derived(ease(phase(t, 320, 900)));
	const sendAt = $derived(bezier([70, 76], [86, 60], [98, 60], [112, 70], send));
	const queued = $derived(phase(t, 880, 1000) * (1 - phase(t, 2200, 2400)));
	const ack = $derived(ease(phase(t, 1000, 1500)));
	const ackAt = $derived(bezier([112, 106], [98, 122], [84, 122], [70, 102], ack));
	const safe = $derived(easeOutBack(phase(t, 1480, 1700)));
	const recording = $derived(1 - phase(t, 300, 420));
	const pulse = $derived(t < 320 ? 0.5 + 0.5 * Math.sin(t / 60) : 0);
	const wave = $derived(bump(t, 1450, 2150));
	const line = (i: number) => easeOut(phase(t, 1950 + i * 110, 2150 + i * 110));
	const summary = $derived(easeOut(phase(t, 2400, 2700)));
	const upload = $derived(ease(phase(t, 2750, 3250)));
	const uploadAt = $derived(bezier([170, 90], [184, 80], [196, 80], [208, 86], upload));
	const block = (i: number) => easeOut(phase(t, 3250 + i * 120, 3450 + i * 120));
	const done = $derived(easeOutBack(phase(t, 3800, 4100)));
</script>

<svg aria-hidden="true" class="preview-drawing" focusable="false" viewBox="0 0 280 175">
	<path class="p-wire" d="M70 76 C 86 60, 98 60, 112 70" />
	<path class="p-wire" d="M112 106 C 98 122, 84 122, 70 102" />
	<path class="p-wire" d="M170 90 C 184 80, 196 80, 208 86" />
	<text class="p-caption sage" opacity={r2(bump(ack, 0, 1))} x="91" y="134">ACK</text>

	<!-- Apple Watch -->
	<g transform="translate(26 52)">
		<rect class="p-strap" height="13" rx="3" width="22" x="11" y="-11" />
		<rect class="p-strap" height="13" rx="3" width="22" x="11" y="50" />
		<rect class="p-device" height="54" rx="12" width="44" />
		<rect class="p-screen" height="44" rx="8" width="34" x="5" y="5" />
		<circle class="p-rec" cx="22" cy="27" opacity={r2(0.35 + 0.65 * recording)} r="6" />
		<circle class="p-rec-ring" cx="22" cy="27" opacity={r2(pulse * 0.8)} r="9" />
		<path class="p-check" d="M15 27 l5 5 l9 -10" opacity={r2(Math.min(1, safe))} transform={`translate(22 27) scale(${r2(Math.max(0.01, safe))}) translate(-22 -27)`} />
	</g>
	<text class="p-caption" x="48" y="137">Watch</text>

	<!-- iPhone: queue, transcript, summary, all on device. -->
	<g transform="translate(112 34)">
		<rect class="p-device" height="108" rx="12" width="58" />
		<rect class="p-screen" height="90" rx="5" width="49" x="4.5" y="9" />
		<rect class="p-notch" height="3" rx="1.5" width="14" x="22" y="3.5" />
		<g opacity={r2(queued)}>
			<rect class="p-pill" height="10" rx="5" width="36" x="11" y="15" />
			<text class="p-tiny" x="29" y="22.4">queued</text>
		</g>
		<g opacity={r2(wave)}>
			{#each [[14, 8], [19, 16], [24, 24], [29, 14], [34, 20], [39, 10], [44, 6]] as [x, h] (x)}
				<line class="p-wave" x1={x} x2={x} y1={r2(53 - h / 2)} y2={r2(53 + h / 2)} />
			{/each}
		</g>
		{#each [36, 30, 38, 24] as w, i (i)}
			<rect class="p-line" height="3" rx="1.5" width={r2(w * line(i))} x="10" y={32 + i * 8} />
		{/each}
		<g opacity={r2(summary)}>
			<rect class="p-strong" height="4" rx="2" width="28" x="10" y="70" />
			<circle class="p-dot" cx="12" cy="81" r="1.6" /><rect class="p-line" height="3" rx="1.5" width="26" x="16" y="79.5" />
			<circle class="p-dot" cx="12" cy="88" r="1.6" /><rect class="p-line" height="3" rx="1.5" width="20" x="16" y="86.5" />
		</g>
	</g>
	<text class="p-caption" x="141" y="158">iPhone · on device</text>

	<!-- Notion page -->
	<g transform="translate(208 52)">
		<path class="p-device" d="M0 0 H40 L52 12 V70 H0 Z" />
		<path class="p-fold" d="M40 0 V12 H52" />
		<rect class="p-strong" height="4" opacity={r2(block(0))} rx="2" width="26" x="8" y="18" />
		{#each [34, 30, 36] as w, i (i)}
			<rect class="p-line" height="3" rx="1.5" width={r2(w * block(i + 1))} x="8" y={29 + i * 8} />
		{/each}
		<g opacity={r2(Math.min(1, done))} transform={`translate(44 62) scale(${r2(Math.max(0.01, done))})`}>
			<circle class="p-badge" r="8" />
			<path class="p-check paper" d="M-4 0 l3 3 l5 -6" />
		</g>
	</g>
	<text class="p-caption" x="234" y="137">Notion</text>

	<g opacity={send > 0 && send < 1 ? 1 : 0} transform={`translate(${r2(sendAt[0])} ${r2(sendAt[1])})`}>
		<rect class="p-packet" height="11" rx="2.5" width="16" x="-8" y="-5.5" />
		<path class="p-check paper thin" d="M-4.5 0 h1.5 l1.5 -3 l1.5 6 l1.5 -3 h1.5" />
	</g>
	<circle class="p-ack" cx={r2(ackAt[0])} cy={r2(ackAt[1])} opacity={ack > 0 && ack < 1 ? 1 : 0} r="3.5" />
	<g opacity={upload > 0 && upload < 1 ? 1 : 0} transform={`translate(${r2(uploadAt[0])} ${r2(uploadAt[1])})`}>
		<rect class="p-page" height="10" rx="2" width="14" x="-7" y="-5" />
		<path class="p-fold" d="M-4 -1.5 h8 M-4 1.5 h5" />
	</g>
</svg>
