<script lang="ts">
	// /lab/motion/: an experiment page for comparing techniques, not part of
	// the public site's navigation (noindex, not in the sitemap).
	import { onMount } from 'svelte';
	import Seo from '#lib/components/Seo.svelte';
	import NativeVariant from '#lib/lab/NativeVariant.svelte';
	import AdvancedVariant from '#lib/lab/AdvancedVariant.svelte';
	import { FrameMeter, initialScriptBytes } from '#lib/lab/meter.svelte.ts';
	import '#lib/styles/drawings.css';
	import '#lib/styles/lab.css';

	type Mode = 'a' | 'b' | 'both';
	let mode = $state<Mode>('both');
	const meter = new FrameMeter();
	let a = $state<NativeVariant>();
	let b = $state<AdvancedVariant>();
	let pageJs = $state<{ transfer: number; decoded: number; files: number } | null>(null);
	let bLoad = $state<{ transfer: number; decoded: number; files: number; coldMs: number; webgl: boolean } | null>(null);
	let busy = $state(false);

	const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	const variants = () => [mode !== 'b' ? a : undefined, mode !== 'a' ? b : undefined].filter(Boolean) as { light(): void; dim(): void }[];

	// Variants run one after the other, so each run is measured on its own.
	async function play() {
		busy = true;
		for (const v of variants()) {
			v.light();
			await wait(4200);
			v.dim();
			await wait(3600);
		}
		busy = false;
	}

	// Quick in-and-out, like a pointer brushing past: shows how each variant
	// handles being reversed mid-flight.
	async function brush() {
		busy = true;
		for (const v of variants()) {
			for (const [on, ms] of [[true, 320], [false, 220], [true, 420], [false, 3600]] as const) {
				if (on) v.light();
				else v.dim();
				await wait(ms);
			}
		}
		busy = false;
	}

	onMount(() => {
		meter.install();
		const measure = () => (pageJs = initialScriptBytes());
		if (document.readyState === 'complete') measure();
		else window.addEventListener('load', measure, { once: true });
		return () => meter.uninstall();
	});
</script>

<Seo
	description="An experiment page comparing native Svelte motion with GSAP and three.js on the same interactive object."
	noindex
	path="/lab/motion/"
	title="Motion lab — Utkarsh Sonawane"
/>

<main class="container lab-main" id="content">
	<a class="back-link" href="/">← Home</a>
	<h1>Motion lab</h1>
	<p class="index-intro">
		The “AI systems” object from the homepage, built two ways at the same size. Hover, focus or tap a stage to play it, or use
		the buttons below. This page is an experiment for choosing techniques; it is not linked from the site.
	</p>

	<div aria-label="Variants" class="lab-switch" role="group">
		<button aria-pressed={mode === 'a'} data-mode="a" onclick={() => (mode = 'a')} type="button">A · Native Svelte</button>
		<button aria-pressed={mode === 'b'} data-mode="b" onclick={() => (mode = 'b')} type="button">B · GSAP + three.js</button>
		<button aria-pressed={mode === 'both'} data-mode="both" onclick={() => (mode = 'both')} type="button">Side by side</button>
	</div>

	<div class="lab-grid" data-mode={mode}>
		{#if mode !== 'b'}
			<section aria-labelledby="lab-a" class="lab-variant">
				<h2 id="lab-a">A · Native Svelte</h2>
				<p class="lab-stack">Svelte 5 <code>Spring</code>s cued by a playhead, drawn as SVG. Velocity is kept when the target changes.</p>
				<NativeVariant bind:this={a} {meter} />
				<dl class="lab-metrics" data-variant="a">
					<div><dt>Script at page load</dt><dd>{pageJs ? `${kb(pageJs.transfer)} transferred, ${kb(pageJs.decoded)} uncompressed` : '…'}</dd></div>
					<div><dt>Extra script for this variant</dt><dd>none (part of the page)</dd></div>
					{@render runMetrics('A')}
				</dl>
			</section>
		{/if}
		{#if mode !== 'a'}
			<section aria-labelledby="lab-b" class="lab-variant">
				<h2 id="lab-b">B · GSAP + three.js</h2>
				<p class="lab-stack">A paused GSAP timeline played forward and reversed, rendered by three.js (WebGL) only from its updates.</p>
				<AdvancedVariant bind:this={b} {meter} onloaded={(info) => (bLoad = info)} />
				<dl class="lab-metrics" data-variant="b">
					<div>
						<dt>Loaded when B first shows</dt>
						<dd>{bLoad ? `${kb(bLoad.transfer)} transferred, ${kb(bLoad.decoded)} uncompressed, ${bLoad.files} file${bLoad.files === 1 ? '' : 's'}` : '…'}</dd>
					</div>
					<div><dt>Ready after</dt><dd>{bLoad ? `${bLoad.coldMs} ms (fetch, parse, WebGL set-up)` : '…'}</dd></div>
					<div><dt>Renderer</dt><dd>{bLoad ? (bLoad.webgl ? 'WebGL' : 'SVG fallback (no WebGL)') : '…'}</dd></div>
					{@render runMetrics('B')}
				</dl>
			</section>
		{/if}
	</div>

	<div class="lab-actions">
		<button disabled={busy} onclick={play} type="button">Play once{mode === 'both' ? ' (A, then B)' : ''}</button>
		<button disabled={busy} onclick={brush} type="button">Brush past (in, out, in, out)</button>
	</div>

	<section aria-labelledby="lab-notes" class="lab-notes">
		<h2 id="lab-notes">What to compare</h2>
		<ul>
			<li><strong>Reversal.</strong> “Brush past” reverses each variant mid-flight. A’s springs turn round with the speed they had; B’s timeline runs backwards at a constant rate, so it stops and restarts.</li>
			<li><strong>Clarity.</strong> A draws 1–2 px lines at any size; B shades real spheres and boxes and can turn in depth, but its lines are always one device pixel.</li>
			<li><strong>Weight.</strong> A adds nothing to the homepage bundle beyond its own code; B fetches three.js and GSAP the first time it is shown.</li>
			<li><strong>Idle cost.</strong> “Idle frames” counts frames anything requested in the 2 s after a run ends. A’s loop stops when its springs settle. GSAP’s ticker checks for work every 120 frames (its <code>autoSleep</code> default), so after B finishes it can keep requesting empty frames for up to about 2 s before it sleeps.</li>
			<li><strong>Reduced motion.</strong> Both jump to a still of the lit state.</li>
			<li><strong>Failure.</strong> Without WebGL, B shows the SVG version and says so; switching away disposes its context.</li>
		</ul>
	</section>
</main>

{#snippet runMetrics(variant: 'A' | 'B')}
	{@const run = meter.runs[variant]}
	<div><dt>Frames in the last run</dt><dd>{run ? run.frames : 'play it to measure'}</dd></div>
	<div><dt>Frame gap while moving, mean / longest</dt><dd>{run ? `${run.meanMs} ms / ${run.maxMs} ms` : '—'}</dd></div>
	<div><dt>Input to first frame</dt><dd>{run?.firstFrameMs != null ? `${run.firstFrameMs} ms` : '—'}</dd></div>
	<div>
		<dt>Idle frames afterwards (2 s)</dt>
		<dd>{run ? (run.idleFrames === null ? 'measuring…' : run.idleFrames < 0 ? 'not measured: the other variant was moving' : run.idleFrames) : '—'}</dd>
	</div>
{/snippet}
