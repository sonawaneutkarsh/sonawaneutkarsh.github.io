<script lang="ts" module>
	/** Devvy arbitrates: three coding tools send heartbeats to one local
	 * daemon, which picks what to show by tool kind and sends one Discord
	 * update. When OpenCode stops sending heartbeats its 15 s TTL runs out,
	 * the choice moves to Command Code and Discord gets one new update.
	 * Discord only ever sees the project's basename and a state. */
	export const END = 4600;
</script>

<script lang="ts">
	import { bezier, ease, easeOut, easeOutBack, mix, phase, r2 } from '#lib/motion/math.ts';

	let { t }: { t: number } = $props();

	const TOOLS = [
		{ name: 'VS Code', y: 22 },
		{ name: 'OpenCode', y: 72 },
		{ name: 'Command Code', y: 122 }
	];
	const arrive = (i: number) => easeOut(phase(t, i * 120, 380 + i * 120));
	const choose = $derived(easeOutBack(phase(t, 900, 1250)));
	const expiring = $derived(phase(t, 1900, 3000));
	const expired = $derived(t >= 3000);
	const handover = $derived(easeOutBack(phase(t, 3050, 3450), 1.4));
	const selectY = $derived(mix(68, 118, handover));
	const firstSend = $derived(ease(phase(t, 1250, 1550)));
	const secondSend = $derived(ease(phase(t, 3450, 3750)));
	const state = $derived(t < 3750 ? 'Thinking' : 'Editing');
	const swap = $derived(phase(t, 3700, 3900));

	function beat(i: number): [number, number, number] {
		const alive = i !== 1 || t < 1900;
		if (!alive || t < 420 || t > END - 200) return [0, 0, 0];
		const u = ((t - 420) / 640 + i * 0.29) % 1;
		const y = TOOLS[i].y + 15;
		const [x, yy] = bezier([102, y], [114, y], [112, 87], [124, 87], u);
		return [x, yy, Math.sin(u * Math.PI)];
	}
	const sendAt = $derived(bezier([184, 87], [190, 87], [194, 87], [200, 87], firstSend > 0 && firstSend < 1 ? firstSend : secondSend));
	const sending = $derived((firstSend > 0 && firstSend < 1) || (secondSend > 0 && secondSend < 1));
</script>

<svg aria-hidden="true" class="preview-drawing" focusable="false" viewBox="0 0 280 175">
	{#each TOOLS as tool, i (tool.name)}
		{@const a = arrive(i)}
		{@const chosen = i === (t < 3050 ? 1 : 2) && choose > 0.5}
		<g opacity={r2(a * (i === 1 && expired ? 0.45 : 1))} transform={`translate(${r2(4 - (1 - a) * 18)} ${tool.y})`}>
			<rect class="p-card" height="30" rx="5" width="98" />
			<text class="p-label" x="8" y="19">{tool.name}</text>
			<circle class="p-status" class:off={i === 1 && t >= 1900} cx="89" cy="15" r="3" />
			{#if i === 1 && t >= 1900}
				<circle class="p-ttl" cx="89" cy="15" pathLength="1" r="6" stroke-dasharray={`${r2(1 - expiring)} 1`} transform="rotate(-90 89 15)" />
			{/if}
		</g>
		<path class="p-wire" class:on={chosen} d={`M102 ${tool.y + 15} C 114 ${tool.y + 15}, 112 87, 124 87`} />
	{/each}
	<rect class="p-select" height="38" opacity={r2(Math.min(1, choose))} rx="8" width="106" x="0" y={r2(selectY)} />
	<text class="p-caption sage" opacity={r2(phase(t, 1950, 2200) * (1 - phase(t, 3300, 3600)))} x="53" y="64">no heartbeat · TTL 15 s</text>

	<g transform="translate(124 62)">
		<rect class="p-box" height="50" rx="8" width="60" />
		<text class="p-label mid" x="30" y="22">Devvy</text>
		<text class="p-caption" x="30" y="36">daemon</text>
	</g>
	<path class="p-wire on" d="M184 87 H200" />

	<g transform="translate(200 56)">
		<rect class="p-card" height="62" rx="6" width="76" />
		<circle class="p-avatar" cx="15" cy="18" r="7" />
		<text class="p-label small" x="27" y="16">my-project</text>
		<text class="p-state" opacity={r2(t < 3700 ? 1 : swap)} x="27" y="27">{state}</text>
		<rect class="p-track" height="3" rx="1.5" width="56" x="8" y="38" />
		<rect class="p-track" height="3" rx="1.5" width="40" x="8" y="46" />
	</g>
	<text class="p-caption" x="238" y="134">Discord</text>
	<text class="p-caption" x="238" y="147">no prompts, code,</text>
	<text class="p-caption" x="238" y="157">or full paths</text>

	{#each TOOLS as _, i (i)}
		{@const [x, y, v] = beat(i)}
		<circle class="p-signal small" cx={r2(x)} cy={r2(y)} opacity={r2(v)} r="2.5" />
	{/each}
	<circle class="p-signal" cx={r2(sendAt[0])} cy={r2(sendAt[1])} opacity={sending ? 1 : 0} r="3" />
</svg>
