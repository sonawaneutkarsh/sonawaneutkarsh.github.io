<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import AdrDemo from '#lib/adr/AdrDemo.svelte';
	import '#lib/styles/adr-demo.css';
</script>

<Seo
	description="An educational, step-by-step illustration of a language-model-assisted adverse drug reaction extraction workflow, using only synthetic example sentences. No model runs and no real data or results are shown."
	ogDescription="An educational, step-by-step illustration of an adverse drug reaction extraction workflow, using only synthetic examples."
	ogTitle="Illustrated workflow: reading a post for reported drug reactions"
	path="/notebook/adr-extraction-demo/"
	title="Illustrated workflow: reading a post for reported drug reactions — Utkarsh Sonawane"
/>

<main class="container" id="content">
	<a class="back-link" href="/notebook/">← Research notebook</a>
	<h1>Reading a post for reported drug reactions</h1>
	<p class="index-intro">
		A step-by-step sketch of the general workflow my <a href="/#research">undergraduate research</a> studies: finding drug and
		reaction mentions in informal text, pairing them, and checking each pair against what the writer actually said.
	</p>

	<p class="adr-note">Illustration only: the posts and drug names are invented, and no real data, models, or results are used.</p>

	<AdrDemo />

	<section aria-labelledby="legend-heading" class="adr-legend">
		<h2 id="legend-heading">Key</h2>
		<ul>
			<li><mark data-kind="drug">Drug</mark> a medication mention</li>
			<li><mark data-kind="reaction">Reaction</mark> a symptom or side-effect mention</li>
			<li><span class="adr-chip" data-verdict="supported">Supported</span> the text backs the pair</li>
			<li><span class="adr-chip" data-verdict="rejected">Contradicted</span> the text rules the pair out</li>
			<li><span class="adr-chip" data-verdict="flagged">Flagged</span> needs a human decision</li>
			<li><span class="adr-chip" data-verdict="uncertain">Abstain</span> evidence too weak to assert</li>
		</ul>
	</section>

	<p class="notebook-crosslink"><a href="/#research">Read about the research →</a></p>
</main>
