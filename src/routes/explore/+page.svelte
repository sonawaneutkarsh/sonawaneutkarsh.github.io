<script lang="ts">
	import Seo from '#lib/components/Seo.svelte';
	import Workbench from '#lib/explore/Workbench.svelte';
	import '#lib/styles/explore.css';

	const description =
		'An interactive workbench of Utkarsh Sonawane’s published projects and research, grouped by area, with links to every case study.';

	// Runs while the HTML is parsed, before first paint: if this visit will
	// show the workbench (wide screen, or ?view=bench), lay the prerendered
	// list out as the workbench at once, framed the way the camera will frame
	// it, so nothing jumps when the page hydrates. Without JavaScript the
	// list stays a list.
	const early = `(function(){try{var d=document.documentElement,v=new URLSearchParams(location.search).get('view'),n=matchMedia('(max-width: 719px)').matches;if(!(v==='bench'||(v!=='list'&&!n)))return;d.classList.add('explore-bench');var w=Math.min(1160,d.clientWidth-(n?40:64))-2,h=(n?innerHeight*0.72:Math.min(760,Math.max(520,innerHeight*0.72)))-2,b={x:20,y:20,w:1160,h:780},s=Math.min(1.25,Math.max(0.4,Math.min((w-56)/b.w,(h-56)/b.h))),x=(w-b.w*s)/2-b.x*s,y=(h-b.h*s)/2-b.y*s;x=Math.min(w/2,Math.max(w/2-1200*s,x));y=Math.min(h/2,Math.max(h/2-820*s,y));d.style.setProperty('--bench-x',x+'px');d.style.setProperty('--bench-y',y+'px');d.style.setProperty('--bench-s',String(s));}catch(e){}})();`;
</script>

<svelte:head>
	{@html `<script>${early}</script>`}
</svelte:head>

<Seo {description} path="/explore/" title="Explore my work — Utkarsh Sonawane" />

<main class="container explore-main" id="content">
	<div class="explore-head">
		<div>
			<a class="back-link" href="/#projects">← All projects</a>
			<h1>Explore my work</h1>
			<p class="index-intro">
				My published projects and research, laid out on one workbench and grouped by area. Pick anything to read what it is,
				how it was tested, and where to go next. Every case study is also listed on the <a href="/#projects">homepage</a>.
			</p>
		</div>
	</div>
	<Workbench />
</main>
