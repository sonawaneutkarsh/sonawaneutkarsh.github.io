<script lang="ts">
	// Step-through for the synthetic ADR extraction illustration.
	//
	// All examples, highlights and verdicts are fixed in adr.ts; this
	// component reveals them one stage at a time by transforming the same
	// post in place: marks fill in, normalized terms drop in under their
	// mentions, connectors draw themselves between the marks, candidate chips
	// turn into verdicts. It makes no network requests. Without JavaScript
	// every stage is shown at once (the prerendered state is step 6).
	//
	// Layout stability: the controls sit above the post, the section keeps the
	// tallest height any example/step reaches at this width (measured by
	// rendering each state once), and it opts out of scroll anchoring, so
	// stepping never moves the controls under the pointer.
	import { flushSync, onMount, tick } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	import { CAUTION_SUFFIX, EXAMPLES, EXPLANATIONS, STEPS } from '#lib/content/adr.ts';
	import { CALM, SOFT } from '#lib/motion/springs.ts';
	import { reducedMotion } from '#lib/motion/environment.ts';

	let enhanced = $state(false);
	let settling = $state(true);
	let step = $state(6);
	let current = $state(0);
	let reserve = $state<number | null>(null);
	let progress = $state('');

	const posts: HTMLElement[] = [];
	let demo: HTMLElement;
	let stepper: HTMLElement;

	interface Link {
		d: string;
		badge: [number, number];
		verdict: string;
		number: number;
	}
	let links = $state<{ w: number; h: number; items: Link[] }[]>(EXAMPLES.map(() => ({ w: 0, h: 0, items: [] })));

	/** 0→1 as the connectors draw; reset when the pairs are hidden or the example changes. */
	const draw = new Spring(1, { ...CALM, precision: 0.002 });
	/** The active step's highlight slides between the step buttons. */
	const ind = { x: new Spring(0, SOFT), y: new Spring(0, SOFT), w: new Spring(0, SOFT), h: new Spring(0, SOFT) };
	let indicatorReady = $state(false);

	const show = (n: number) => step >= n;

	function measureLinks(i: number) {
		const post = posts[i];
		if (!post || post.offsetParent === null) return;
		const frame = post.getBoundingClientRect();
		const box = (id: string) => {
			const mark = post.querySelector(`mark[data-id="${id}"]`);
			// A mark that starts at a line break has an empty fragment at the end
			// of the previous line; anchor on the first fragment with real width.
			const rects = mark ? [...mark.getClientRects()] : [];
			const r = rects.find((rect) => rect.width > 2) ?? rects[0];
			if (!r) return { x: 0, top: 0, bottom: 0 };
			return { x: r.left + r.width / 2 - frame.left, top: r.top - frame.top - 2, bottom: r.bottom - frame.top + 2 };
		};
		const spans = EXAMPLES[i].pairs.map((pair) => {
			const from = box(pair.from);
			const to = box(pair.to);
			return { from, to, same: Math.abs(from.top - to.top) < 8, width: Math.abs(from.x - to.x) };
		});
		// Same-line arches nest: wider spans go higher, so arches never cross.
		const sameLine = spans.filter((s) => s.same).sort((a, b) => a.width - b.width);
		const items = EXAMPLES[i].pairs.map((pair, n) => {
			const { from, to, same } = spans[n];
			if (same) {
				const lift = 16 + sameLine.indexOf(spans[n]) * 14;
				const top = Math.min(from.top, to.top) - lift;
				return {
					d: `M${from.x} ${from.top} C ${from.x} ${top}, ${to.x} ${top}, ${to.x} ${to.top}`,
					badge: [(from.x + to.x) / 2, 0.25 * from.top + 0.75 * top] as [number, number],
					verdict: pair.verdict,
					number: n + 1
				};
			}
			// Different lines: an S-curve through the gap between them.
			const [upper, lower] = from.top < to.top ? [from, to] : [to, from];
			const gap = (upper.bottom + lower.top) / 2;
			return {
				d: `M${upper.x} ${upper.bottom} C ${upper.x} ${gap}, ${lower.x} ${gap}, ${lower.x} ${lower.top}`,
				badge: [(upper.x + lower.x) / 2, gap] as [number, number],
				verdict: pair.verdict,
				number: n + 1
			};
		});
		links[i] = { w: frame.width, h: frame.height, items };
	}

	function placeIndicator(instant: boolean) {
		const button = stepper?.querySelector<HTMLElement>(`[data-goto="${step}"]`);
		if (!button) return;
		const li = button.parentElement as HTMLElement;
		const opts = { instant: instant || reducedMotion() };
		ind.x.set(li.offsetLeft, opts);
		ind.y.set(li.offsetTop, opts);
		ind.w.set(li.offsetWidth, opts);
		ind.h.set(li.offsetHeight, opts);
		indicatorReady = true;
	}

	// Render every example at every step once, synchronously, and keep the
	// tallest height, so stepping never shortens the page.
	function reserveHeight() {
		const keep = { step, current };
		settling = true;
		reserve = null;
		flushSync();
		let tallest = 0;
		for (let i = 0; i < EXAMPLES.length; i++) {
			for (let k = 1; k <= STEPS.length; k++) {
				current = i;
				step = k;
				flushSync();
				tallest = Math.max(tallest, demo.offsetHeight);
			}
		}
		({ step, current } = keep);
		reserve = Math.ceil(tallest);
		flushSync();
		measureLinks(current);
		placeIndicator(true);
		requestAnimationFrame(() => (settling = false));
	}

	function go(target: number) {
		const next = Math.min(STEPS.length, Math.max(1, target));
		const drawing = next >= 4 && step < 4;
		step = next;
		progress = `Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`;
		if (drawing) {
			draw.set(0, { instant: true });
			draw.set(1, { instant: reducedMotion() });
		}
		void tick().then(() => placeIndicator(false));
	}

	function choose(i: number) {
		current = i;
		step = 0;
		go(1);
		void tick().then(() => measureLinks(i));
	}

	function reset() {
		choose(0);
		demo.querySelector<HTMLElement>('[data-example="0"]')?.focus();
	}

	// Arrow keys step through the pipeline while focus is on one of the
	// demo's buttons (delegated from the section).
	const arrowKeys = (section: HTMLElement) => {
		const onKey = (event: KeyboardEvent) => {
			if (event.altKey || event.ctrlKey || event.metaKey) return;
			if (event.key === 'ArrowRight') {
				event.preventDefault();
				go(step + 1);
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				go(step - 1);
			}
		};
		section.addEventListener('keydown', onKey);
		return () => section.removeEventListener('keydown', onKey);
	};

	onMount(() => {
		enhanced = true;
		step = 1;
		progress = `Step 1 of ${STEPS.length}`;
		draw.set(0, { instant: true });
		reserveHeight();
		let timer = 0;
		const onResize = () => {
			clearTimeout(timer);
			timer = window.setTimeout(reserveHeight, 100);
		};
		window.addEventListener('resize', onResize);
		// Fonts settling can move the marks; measure again once they have.
		void document.fonts?.ready.then(() => reserveHeight());
		return () => {
			clearTimeout(timer);
			window.removeEventListener('resize', onResize);
		};
	});

	// The prerendered page is step 6, but the stepper only appears with
	// JavaScript and starts at step 1, so it shows step 1 from first paint.
	const shownStep = $derived(enhanced ? step : 1);
	const chip = (verdictLabel: string) => (show(5) ? verdictLabel : 'Candidate');
	const dash = $derived(Math.max(0, Math.min(1, draw.current)));
	const motion = $derived(settling || !enhanced ? 0 : 1);
</script>

<section
	aria-labelledby="demo-heading"
	bind:this={demo}
	class="adr-demo"
	class:is-enhanced={enhanced}
	class:is-settling={settling}
	class:show-caution={show(6)}
	class:show-drugs={show(2)}
	class:show-pairs={show(4)}
	class:show-reactions={show(3)}
	class:show-review={show(5)}
	data-step={step}
	id="demo"
	{@attach arrowKeys}
	style:min-height={reserve ? `${reserve}px` : undefined}
>
	<h2 id="demo-heading">Step through an example</h2>

	<div aria-label="Choose an example" class="adr-examples" role="group">
		{#each EXAMPLES as example, i (i)}
			<button aria-pressed={i === current} data-example={i} onclick={() => choose(i)} type="button">{example.button}</button>
		{/each}
	</div>

	<div class="adr-stepper-wrap">
		{#if enhanced && indicatorReady}
			<span
				aria-hidden="true"
				class="adr-stepper-indicator"
				style:height="{ind.h.current.toFixed(1)}px"
				style:transform="translate({ind.x.current.toFixed(1)}px, {ind.y.current.toFixed(1)}px)"
				style:width="{ind.w.current.toFixed(1)}px"
			></span>
		{/if}
		<ol bind:this={stepper} class="adr-stepper">
			{#each STEPS as title, k (k)}
				<li class:is-done={k + 1 < shownStep}>
					<button aria-current={k + 1 === shownStep ? 'step' : undefined} data-goto={k + 1} onclick={() => go(k + 1)} type="button"
						><span>{k + 1}</span> {title}</button
					>
				</li>
			{/each}
		</ol>
	</div>

	<div class="adr-controls" class:is-pending={!enhanced}>
		<button data-move="-1" disabled={enhanced && step === 1} onclick={() => go(step - 1)} type="button">← Previous</button>
		<button data-move="1" disabled={enhanced && step === STEPS.length} onclick={() => go(step + 1)} type="button">Next →</button>
		<button data-move="reset" onclick={reset} type="button">Reset</button>
		<p aria-live="polite" class="adr-progress" id="adr-progress">{progress}</p>
	</div>

	<div class="adr-examples-list">
		{#each EXAMPLES as example, i (i)}
			<figure class="adr-example" data-index={i} hidden={enhanced && i !== current}>
				<figcaption class="adr-example-label">{example.caption}</figcaption>
				<div bind:this={posts[i]} class="adr-post">
					<p class="adr-post-meta">example post</p>
					<p class="adr-text">
						{#each example.text as seg, s (s)}{#if typeof seg === 'string'}{seg}{:else}<mark
									data-id={seg.id}
									data-kind={seg.kind}
									data-norm={seg.norm}>{seg.text}</mark
								>{/if}{/each}
					</p>
					<svg
						aria-hidden="true"
						class="adr-links"
						focusable="false"
						height={links[i].h || undefined}
						viewBox={links[i].w ? `0 0 ${links[i].w} ${links[i].h}` : undefined}
						width={links[i].w || undefined}
					>
						{#each links[i].items as link (link.number)}
							<g class="adr-link" data-verdict={link.verdict}>
								<path
									d={link.d}
									pathLength="1"
									stroke-dasharray={dash < 1 ? '1 1' : undefined}
									stroke-dashoffset={dash < 1 ? (1 - dash).toFixed(3) : undefined}
								/>
								<g class="adr-link-badge" transform="translate({link.badge[0]} {link.badge[1]})">
									<circle r="8" />
									<text dy="3.5" text-anchor="middle">{link.number}</text>
								</g>
							</g>
						{/each}
					</svg>
				</div>
				{#if show(4)}
					<ul class="adr-pairs">
						{#each example.pairs as pair, n (n)}
							<li
								data-from={pair.from}
								data-number={n + 1}
								data-to={pair.to}
								data-verdict={pair.verdict}
								in:fly|global={{ y: 8, duration: 320 * motion, delay: n * 70 * motion }}
							>
								<span class="adr-pair"><b>{pair.drug}</b> → <b>{pair.reaction}</b></span>
								{#key chip(pair.verdictLabel)}
									<span class="adr-verdict" in:fly={{ y: -6, duration: 260 * motion }}>{chip(pair.verdictLabel)}</span>
								{/key}
								{#if show(5)}
									<span class="adr-reason" in:fly={{ y: 6, duration: 300 * motion, delay: 60 * motion }}
										>{pair.reason}{#if show(6) && pair.verdict === 'supported'}<span class="adr-caution">{CAUTION_SUFFIX}</span>{/if}</span
									>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</figure>
		{/each}
	</div>

	<ol class="adr-explanations">
		{#each EXPLANATIONS as explanation, k (k)}
			<li data-for={k + 1} hidden={enhanced && k + 1 !== step}>
				<h3>{explanation.title}</h3>
				<p>{@html explanation.html}</p>
			</li>
		{/each}
	</ol>
</section>
