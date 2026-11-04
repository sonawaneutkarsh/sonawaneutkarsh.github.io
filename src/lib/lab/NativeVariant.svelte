<script lang="ts">
	// Variant A: the homepage's own object. svelte/motion Springs cued by a
	// playhead, drawn as SVG (see #lib/hero/ai-model.svelte.ts).
	import { onDestroy } from 'svelte';
	import { AiModel } from '#lib/hero/ai-model.svelte.ts';
	import AiDrawing from '#lib/hero/AiDrawing.svelte';
	import { keyboardFocus, reducedMotion } from '#lib/motion/environment.ts';
	import type { FrameMeter } from './meter.svelte.ts';

	let { meter }: { meter: FrameMeter } = $props();
	const model = new AiModel();
	let touch = false;

	export function light() {
		if (model.lit) return;
		meter.start('A');
		model.light({ still: reducedMotion() });
	}
	export function dim() {
		if (!model.lit) return;
		meter.start('A');
		model.dim({ still: reducedMotion() });
	}

	// One drawn frame per change of the drawing's inputs (Svelte batches
	// spring updates to one per animation frame).
	$effect(() => {
		void model.nodes;
		void model.clock.t;
		void model.arrows.current;
		void model.loop.current;
		void model.token.current;
		void model.signals.current;
		meter.frame('A');
	});

	onDestroy(() => model.destroy());
</script>

<button
	aria-label="Play variant A, native Svelte"
	aria-pressed={model.lit}
	class="lab-stage"
	data-variant="a"
	onblur={dim}
	onclick={() => touch && (model.lit ? dim() : light())}
	onfocus={(e) => keyboardFocus(e.currentTarget) && light()}
	onpointerdown={(e) => (touch = e.pointerType === 'touch')}
	onpointerenter={(e) => e.pointerType !== 'touch' && light()}
	onpointerleave={(e) => e.pointerType !== 'touch' && dim()}
	type="button"
>
	<AiDrawing detail="stage" {model} />
</button>
