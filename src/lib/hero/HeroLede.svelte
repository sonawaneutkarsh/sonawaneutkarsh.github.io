<script lang="ts">
	// "I build software, explore AI systems, do research, and write about what
	// I learn." The three linked words carry animated objects (see stage.svelte.ts).
	import { onDestroy } from 'svelte';
	import HeroLink from './HeroLink.svelte';
	import { KINDS, type HeroStage } from './stage.svelte.ts';
	import { coarsePointer, reducedMotion } from '#lib/motion/environment.ts';
	import { inView } from '#lib/motion/attachments.ts';

	let { stage }: { stage: HeroStage } = $props();

	// Touch screens cannot hover: play each object once, one after another, the
	// first time the sentence is on screen. Taps on the links navigate as usual.
	const DWELL = { software: 2700, ai: 3500, research: 3000 };
	let toured = false;
	let timers: number[] = [];
	const tour = inView((visible) => {
		if (!visible) {
			if (stage.source === 'tour' && stage.owner) stage.dim(stage.owner, 'tour');
			timers.forEach(clearTimeout);
			timers = [];
			return;
		}
		if (toured || !coarsePointer() || reducedMotion()) return;
		toured = true;
		let at = 450;
		for (const kind of KINDS) {
			timers.push(window.setTimeout(() => stage.light(kind, 'tour'), at));
			at += DWELL[kind];
			timers.push(window.setTimeout(() => stage.dim(kind, 'tour'), at));
			at += 250;
		}
	});

	const anchor = (el: HTMLElement) => {
		stage.intro = el.closest('.intro');
		stage.bio = el.closest('.bio');
	};

	onDestroy(() => timers.forEach(clearTimeout));
</script>

<p class="hero-lede" {@attach anchor} {@attach tour}>
	I build
	<HeroLink href="/#projects" kind="software" {stage}>software</HeroLink>,
	explore
	<HeroLink href="/explore/?filter=ai" kind="ai" {stage}>AI systems</HeroLink>,
	do
	<HeroLink href="/#research" kind="research" {stage}>research</HeroLink>,
	and <a href="/blog/">write</a> about what I learn.
</p>
