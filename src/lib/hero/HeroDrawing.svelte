<script lang="ts">
	import AiDrawing from './AiDrawing.svelte';
	import SoftwareDrawing from './SoftwareDrawing.svelte';
	import ResearchDrawing from './ResearchDrawing.svelte';
	import type { HeroKind } from './hero-motion.svelte.ts';
	import type { Models } from './stage.svelte.ts';

	let { kind, models, detail = 'inline' }: { kind: HeroKind; models: Models; detail?: 'inline' | 'stage' } = $props();
</script>

{#if kind === 'ai'}
	<AiDrawing {detail} model={models.ai} />
{:else if kind === 'software'}
	<SoftwareDrawing {detail} model={models.software} />
{:else}
	<ResearchDrawing {detail} model={models.research} />
{/if}
