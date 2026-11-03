<script lang="ts">
	// The writing index, generated from posts.json. Plain HTML: this route
	// ships no JavaScript (csr = false in +page.ts).
	import Seo from '#lib/components/Seo.svelte';
	import { dateLabel, postPath, postsByYear } from '#lib/content/posts.ts';
	import { SITE } from '#lib/content/site.ts';
</script>

<Seo description={SITE.writingDescription} path="/blog/" title="Writing — Utkarsh Sonawane" />

<main class="container writing-index" id="content">
	<h1>Writing</h1>
	<p class="index-intro">{SITE.writingDescription}</p>
	<p class="feed-link"><a href="/feed.xml">Subscribe via RSS ↗</a></p>
	{#each postsByYear() as group (group.year)}
		<h2>{group.year}</h2>
		<ul class="post-list">
			{#each group.posts as post (post.slug)}
				<li class="post-row">
					<time class="post-date" datetime={post.date}>{dateLabel(post.date)}</time>
					<div>
						<a class="post-title" href={postPath(post)}>{post.title}</a>
						<p>{post.description}</p>
					</div>
				</li>
			{/each}
		</ul>
	{/each}
</main>
