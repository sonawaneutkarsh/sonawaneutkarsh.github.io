<script lang="ts">
	// Title, description, canonical URL and sharing metadata, in the same form
	// as the static pages' <head>.
	import { SITE } from '#lib/content/site.ts';

	interface Props {
		title: string;
		description: string;
		/** Root-relative path with its trailing slash, e.g. "/explore/". */
		path: string;
		ogTitle?: string;
		ogDescription?: string;
		type?: 'website' | 'article';
		noindex?: boolean;
	}

	let { title, description, path, ogTitle = title, ogDescription = description, type = 'website', noindex = false }: Props =
		$props();
	const url = $derived(`${SITE.origin}${path}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta content={description} name="description">
	<meta content={SITE.name} name="author">
	{#if noindex}
		<meta content="noindex" name="robots">
	{/if}
	<link href={url} rel="canonical">
	<meta content={ogTitle} property="og:title">
	<meta content={ogDescription} property="og:description">
	<meta content={url} property="og:url">
	<meta content={type} property="og:type">
	<meta content={SITE.name} property="og:site_name">
	<meta content={SITE.ogImage} property="og:image">
	<meta content="1200" property="og:image:width">
	<meta content="630" property="og:image:height">
	<meta content={SITE.ogImageAlt} property="og:image:alt">
	<meta content="summary_large_image" name="twitter:card">
</svelte:head>
