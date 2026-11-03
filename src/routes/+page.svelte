<script lang="ts">
	// Homepage. The prose is the V3 homepage's, unchanged; projects and the
	// Writing list render from the shared content modules.
	import { onDestroy } from 'svelte';
	import Seo from '#lib/components/Seo.svelte';
	import CopyEmail from '#lib/components/CopyEmail.svelte';
	import HeroLede from '#lib/hero/HeroLede.svelte';
	import MarginStage from '#lib/hero/MarginStage.svelte';
	import { createHeroStage } from '#lib/hero/stage.svelte.ts';
	import ProjectRow from '#lib/projects/ProjectRow.svelte';
	import { featuredProjects, moreExperiments, isExternal } from '#lib/content/projects.ts';
	import { latestPosts, dateLabel, postPath } from '#lib/content/posts.ts';
	import { SITE } from '#lib/content/site.ts';
	import { reveal } from '#lib/motion/attachments.ts';
	import '#lib/styles/drawings.css';
	import '#lib/styles/home.css';

	const description =
		'Utkarsh Sonawane, Computer Science student at Penn State (Class of 2028). Backend systems, native iOS and watchOS apps, and ML experiments, each tested in CI. Seeking Summer 2027 SWE and AI/ML internships.';

	const stage = createHeroStage();
	onDestroy(() => stage.destroy());

	const featured = featuredProjects.filter((p) => p.featured) as (typeof featuredProjects[number] & {
		featured: NonNullable<(typeof featuredProjects)[number]['featured']>;
	})[];
	const rel = (href: string) => (isExternal(href) ? 'noopener' : undefined);
</script>

<Seo
	{description}
	ogTitle="Utkarsh Sonawane — Software Engineering Portfolio"
	path="/"
	title="Utkarsh Sonawane — Software Engineering Portfolio"
/>

<main class="container" id="content">
	<section class="intro" id="hero">
		<div class="intro-art">
			<!-- Future illustrated self-portrait: add images/brand/portrait.webp
			     (square, about 360px, cream or transparent background) and render
			     <img class="intro-portrait"> here; the notebook moves below it. -->
			<img alt="" class="illustration" height="435" src="/images/illustrations/notebook.webp" width="550">
		</div>
		<div class="bio">
			<h1>Utkarsh Sonawane</h1>
			<HeroLede {stage} />
			<p>
				I study computer science at Penn State. I’m fascinated by how large language models (LLMs) work under the hood —
				from transformers and inference to agentic AI systems — and I like turning that curiosity into software people can
				actually use.
			</p>
			<p>
				Right now, I’m doing undergraduate research with
				<a href={SITE.advisor.href}>{SITE.advisor.name}</a> on using LLMs to extract adverse drug reactions from Reddit.
				We’re exploring retrieval-augmented generation (RAG), agentic verification, and evidence-backed extraction to make
				these systems more reliable.
			</p>
			<p>
				In my free time, I love doomscrolling X, working out while vibing to Chris Luno, and
				<a href="https://www.goodreads.com/user/show/85039206-tekcrec">reading books</a>.
			</p>
			<p class="availability">Looking for Summer 2027 software engineering and AI/ML internships.</p>
			<p class="metadata">Computer science · Penn State · Class of 2028</p>
			<nav aria-label="Get in touch" class="contact-row">
				<a href={`mailto:${SITE.email}`}>Email</a><a href={SITE.github}>GitHub</a><a href={SITE.linkedin}>LinkedIn</a><a
					data-sveltekit-reload
					href={SITE.resume}>Résumé (PDF)</a
				><CopyEmail email={SITE.email} />
			</nav>
		</div>
		<MarginStage {stage} />
	</section>

	<section id="updates">
		<h2>Updates</h2>
		<ul class="updates-list">
			<li>
				<time datetime="2026-10">October 2026</time>
				<p>Started undergraduate research on <a href="/#research">extracting adverse drug reaction reports from Reddit</a>.</p>
			</li>
			<li>
				<time datetime="2026-09">September 2026</time>
				<p>Elected <a href="/#experience">Technical Chair of IEEE at Penn State</a>.</p>
			</li>
		</ul>
	</section>

	<section id="projects">
		<h2>Selected projects</h2>
		<p class="section-lede">
			Things I’ve built, and what I learned from them.
			<a class="explore-link" href="/explore/">Explore my work <span aria-hidden="true">↗</span></a>
		</p>
		{#each featured as project (project.id)}
			<ProjectRow {project} />
		{/each}
		<h3 class="subsection-title">More experiments</h3>
		<ul class="compact-list">
			{#each moreExperiments as project (project.id)}
				<li class="compact-item">
					<div class="compact-head">
						<a class="compact-title" href={project.href} rel={rel(project.href)}>{project.name}</a>
						<span class="compact-meta">{project.meta}</span>
					</div>
					{#if project.summaryHtml}
						<p>{@html project.summaryHtml}</p>
					{:else}
						<p>{project.summary}</p>
					{/if}
					<div class="project-links">
						{#each project.links as link (link.href)}
							<a class={link.pill ? 'pill-btn' : undefined} href={link.href} rel={rel(link.href)}>{link.label}</a>
						{/each}
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section id="research">
		<h2>Research</h2>
		<div class="research-entry" data-reveal {@attach reveal}>
			<img alt="" class="illustration" height="525" loading="lazy" src="/images/illustrations/evidence.webp" width="506">
			<div>
				<h3>Extracting adverse drug reaction reports from Reddit</h3>
				<p class="metadata">Undergraduate research · Penn State · 2026–present</p>
				<p class="research-status">In progress</p>
				<p>
					With <a href={SITE.advisor.href}>{SITE.advisor.name}</a>, I’m studying how language models can identify reported
					drug–reaction relationships in Reddit discussions. The work compares direct prompting, retrieval-augmented
					generation, and extraction with verification against human annotations.
				</p>
				<p>Evaluation focuses on precision, recall, F1, and error analysis.</p>
				<p class="notebook-crosslink"><a href="/notebook/">Read the research notebook →</a></p>
				<p class="notebook-crosslink">
					<a href="/notebook/adr-extraction-demo/">Step through an illustrated extraction workflow →</a>
				</p>
				<details>
					<summary>Research plan</summary>
					<p>
						As an Undergraduate Research Assistant at Penn State (REU), I am investigating LLM-based detection of adverse
						drug reaction reports and extraction of suspected drug–reaction relationships. The research plan compares direct
						prompting, retrieval-augmented generation (RAG), and agent-based extraction and verification. Planned analysis
						includes normalizing drug and reaction terminology and comparing extracted relationships with PubMed literature.
					</p>
				</details>
			</div>
		</div>
	</section>

	<section id="experience">
		<h2>Elsewhere</h2>
		<p class="research-crosslink"><a href="/#research">Undergraduate Research Assistant → Research</a></p>
		<div class="experience-list" data-reveal {@attach reveal}>
			<div class="exp-item">
				<div class="exp-header">
					<h3 class="exp-role-org">
						<strong>Technical Chair</strong>, <span class="exp-org">IEEE Student Branch</span>, Penn State Harrisburg
					</h3>
					<div class="exp-date">Sept 2026 – Present</div>
				</div>
				<p class="exp-summary">
					Elected in Sept 2026 after a year on the technical team (Sept 2025 – Sept 2026). Coordinate the branch's software,
					AI, and robotics workshops and projects; hosted hands-on workshops on Markdown and building with Google Gemini.
				</p>
			</div>
			<div class="exp-item">
				<div class="exp-header">
					<h3 class="exp-role-org">
						<strong>Data Engineer</strong> (5-person team), <span class="exp-org">USAII Global AI Hackathon 2026</span>
					</h3>
					<div class="exp-date">Jun 2026</div>
				</div>
				<p class="exp-summary">
					Wrote the normalization, embedding (gte-small), and batched-insert scripts that loaded 1,008 scraped government
					schemes into Supabase PostgreSQL/pgvector. Our team was a finalist among 6,081+ participants.
				</p>
			</div>
			<div class="exp-item">
				<div class="exp-header">
					<h3 class="exp-role-org">
						<strong>Founder &amp; Editor-in-Chief</strong>, <span class="exp-org">Glimpse</span> (student publication)
					</h3>
					<div class="exp-date">Jun 2024 – Feb 2025</div>
				</div>
				<p class="exp-summary">
					Founded the publication and ran editorial operations; grew the campus subscriber base to 250+ readers.
				</p>
			</div>
		</div>
	</section>

	<section id="blog">
		<div class="section-heading">
			<h2>Writing</h2>
			<a href="/blog/">All posts →</a>
		</div>
		<ul class="post-list">
			{#each latestPosts() as post (post.slug)}
				<li class="post-row">
					<time class="post-date" datetime={post.date}>{dateLabel(post.date)}</time>
					<a class="post-title" href={postPath(post)}>{post.title}</a>
				</li>
			{/each}
		</ul>
		<p class="feed-link"><a data-sveltekit-reload href="/feed.xml">Subscribe via RSS →</a></p>
	</section>
</main>
