<script lang="ts">
	// One linked word in the introduction with its inline object. A mouse or
	// pen hovering it, or keyboard focus, lights it; a finger tap simply
	// follows the link (touch screens get a one-time tour instead).
	import type { Snippet } from 'svelte';
	import HeroDrawing from './HeroDrawing.svelte';
	import type { HeroKind } from './hero-motion.svelte.ts';
	import type { HeroStage } from './stage.svelte.ts';
	import { keyboardFocus } from '#lib/motion/environment.ts';

	let { stage, kind, href, children }: { stage: HeroStage; kind: HeroKind; href: string; children: Snippet } = $props();

	const model = $derived(stage.model(kind));
	const presence = $derived(Math.max(0, Math.min(1, model.presence.current)));

	function enter(event: PointerEvent) {
		if (event.pointerType !== 'touch') stage.light(kind, 'hover');
	}
	function leave(event: PointerEvent) {
		if (event.pointerType !== 'touch') stage.dim(kind, 'hover');
	}
	function focus(event: FocusEvent) {
		if (keyboardFocus(event.currentTarget as Element)) stage.light(kind, 'focus');
	}
	function blur() {
		stage.dim(kind, 'focus');
	}
</script>

<a
	class="hero-link"
	class:is-lit={model.lit}
	data-hero-icon={kind}
	{href}
	onblur={blur}
	onfocus={focus}
	onpointerenter={enter}
	onpointerleave={leave}
	><span bind:this={stage.icons[kind]} class="hero-icon" style:--p={presence.toFixed(3)}
		><HeroDrawing {kind} models={stage.models} /></span
	><span class="hero-word">{@render children()}</span></a
>
