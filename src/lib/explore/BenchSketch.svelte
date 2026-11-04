<script lang="ts">
	// Small drawings for the entries that have no illustration (V3's sketches).
	let { kind }: { kind: 'pyopt' | 'medclarity' | 'scholarai' } = $props();
	const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
</script>

<svg aria-hidden="true" focusable="false" viewBox="0 0 160 110">
	{#if kind === 'pyopt'}
		<rect fill="#fcfaf0" height="70" rx="6" stroke="#282d27" stroke-width="1.5" width="96" x="14" y="20" />
		<path d="M14 34 H110" stroke="#282d27" stroke-width="1.5" />
		<circle cx="24" cy="27" fill="#6b745d" r="2" /><circle cx="32" cy="27" fill="#6b745d" r="2" />
		<path d="M26 46 h22 M32 56 h34 M32 66 h26 M26 76 h18" stroke="#6b745d" stroke-linecap="round" stroke-width="3" />
		<path d="M100 82 C 118 82, 128 68, 140 44" fill="none" stroke="#455c47" stroke-linecap="round" stroke-width="1.75" />
		<path d="M131 46 L141 42 L144 52" fill="none" stroke="#455c47" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" />
	{:else if kind === 'medclarity'}
		<path d="M30 26 H74 L84 36 V92 H30 Z" fill="#edf0e5" stroke="#6b745d" stroke-linejoin="round" stroke-width="1.5" />
		<path d="M42 16 H86 L96 26 V82 H42 Z" fill="#fcfaf0" stroke="#282d27" stroke-linejoin="round" stroke-width="1.5" />
		<path d="M52 38 h30 M52 47 h34 M52 56 h22 M52 65 h28" stroke="#6b745d" stroke-linecap="round" stroke-width="3" />
		<rect fill="#e6ebdd" height="9" rx="2" stroke="#455c47" stroke-width="1.25" width="26" x="50" y="51.5" />
		<path d="M76 56 C 100 56, 108 60, 118 64" fill="none" stroke="#455c47" stroke-dasharray="3 3" stroke-width="1.5" />
		<rect fill="#fcfaf0" height="20" rx="10" stroke="#455c47" stroke-width="1.5" width="28" x="116" y="54" />
		<text fill="#455c47" font-family={FONT} font-size="9" text-anchor="middle" x="130" y="67">p.4</text>
	{:else}
		<ellipse cx="62" cy="28" fill="#fcfaf0" rx="30" ry="9" stroke="#282d27" stroke-width="1.5" />
		<path d="M32 28 V80 C 32 92, 92 92, 92 80 V28" fill="#fcfaf0" stroke="#282d27" stroke-width="1.5" />
		<path d="M32 46 C 32 56, 92 56, 92 46 M32 63 C 32 73, 92 73, 92 63" fill="none" stroke="#6b745d" stroke-width="1.25" />
		<circle cx="122" cy="34" fill="#e6ebdd" r="5" stroke="#455c47" stroke-width="1.25" />
		<circle cx="136" cy="56" fill="#e6ebdd" r="5" stroke="#455c47" stroke-width="1.25" />
		<circle cx="116" cy="74" fill="#e6ebdd" r="5" stroke="#455c47" stroke-width="1.25" />
		<path d="M92 50 L117 36 M92 56 L131 56 M92 62 L112 72" stroke="#455c47" stroke-dasharray="3 3" stroke-width="1.25" />
	{/if}
</svg>
