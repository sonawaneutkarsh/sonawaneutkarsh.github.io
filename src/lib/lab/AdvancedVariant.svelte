<script lang="ts">
	// Variant B: the same object, choreographed by a GSAP timeline and drawn
	// by three.js in WebGL. three.js and GSAP arrive in a chunk that is only
	// fetched when this component mounts, and unmounting disposes the WebGL
	// context. Without WebGL (or if the context is lost) it falls back to the
	// native SVG drawing and says so.
	import { onMount } from 'svelte';
	import { AiModel } from '#lib/hero/ai-model.svelte.ts';
	import AiDrawing from '#lib/hero/AiDrawing.svelte';
	import { keyboardFocus, reducedMotion } from '#lib/motion/environment.ts';
	import { scriptBytesSince, type FrameMeter } from './meter.svelte.ts';
	import type { AdvancedScene } from './advanced-scene.ts';

	let { meter, onloaded }: { meter: FrameMeter; onloaded?: (info: { transfer: number; decoded: number; files: number; coldMs: number; webgl: boolean }) => void } =
		$props();

	let host: HTMLElement;
	let canvas = $state<HTMLCanvasElement>();
	let status = $state<'loading' | 'ready' | 'fallback'>('loading');
	let lit = $state(false);
	let scene: AdvancedScene | null = null;
	let fallback = $state<AiModel | null>(null);
	let touch = false;

	function useFallback() {
		scene?.dispose();
		scene = null;
		fallback ??= new AiModel();
		status = 'fallback';
		if (lit) fallback.light({ still: true });
	}

	export function light() {
		if (lit) return;
		lit = true;
		meter.start('B');
		if (scene) {
			if (reducedMotion()) scene.jump(true);
			else scene.light();
		} else fallback?.light({ still: reducedMotion() });
	}
	export function dim() {
		if (!lit) return;
		lit = false;
		meter.start('B');
		if (scene) {
			if (reducedMotion()) scene.jump(false);
			else scene.dim();
		} else fallback?.dim({ still: reducedMotion() });
	}

	onMount(() => {
		let disposed = false;
		const started = performance.now();
		void import('./advanced-scene.ts').then((mod) => {
			if (disposed) return;
			const bytes = scriptBytesSince(started);
			// The canvas fills the stage's padding box.
			const box = { width: host.clientWidth, height: host.clientHeight };
			let webgl = mod.webglAvailable();
			if (webgl && canvas) {
				try {
					scene = mod.createAdvancedScene(canvas, Math.max(1, box.width), Math.max(1, box.height), useFallback, () =>
						meter.frame('B')
					);
					status = 'ready';
				} catch {
					webgl = false;
				}
			}
			if (!webgl) useFallback();
			onloaded?.({ ...bytes, coldMs: Math.round(performance.now() - started), webgl });
		});

		const resize = new ResizeObserver(() => {
			if (host.clientWidth && host.clientHeight) scene?.resize(host.clientWidth, host.clientHeight);
		});
		resize.observe(host);
		// Stop drawing while the stage is scrolled out of view.
		const visibility = new IntersectionObserver(([entry]) => scene?.setVisible(entry.isIntersecting));
		visibility.observe(host);

		return () => {
			disposed = true;
			resize.disconnect();
			visibility.disconnect();
			scene?.dispose();
			scene = null;
			fallback?.destroy();
		};
	});
</script>

<button
	aria-label="Play variant B, GSAP and three.js"
	aria-pressed={lit}
	bind:this={host}
	class="lab-stage"
	data-status={status}
	data-variant="b"
	onblur={dim}
	onclick={() => touch && (lit ? dim() : light())}
	onfocus={(e) => keyboardFocus(e.currentTarget) && light()}
	onpointerdown={(e) => (touch = e.pointerType === 'touch')}
	onpointerenter={(e) => e.pointerType !== 'touch' && light()}
	onpointerleave={(e) => e.pointerType !== 'touch' && dim()}
	type="button"
>
	{#if status !== 'fallback'}
		<canvas aria-hidden="true" bind:this={canvas} class="lab-canvas"></canvas>
	{/if}
	{#if status === 'loading'}
		<span class="lab-loading">Loading three.js and GSAP…</span>
	{:else if status === 'fallback' && fallback}
		<AiDrawing detail="stage" model={fallback} />
		<span class="lab-fallback">WebGL is not available here, so this is the SVG version.</span>
	{/if}
</button>
