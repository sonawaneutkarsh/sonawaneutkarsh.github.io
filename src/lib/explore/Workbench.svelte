<script lang="ts">
	// "Explore my work": the published projects on one workbench.
	//
	// Prerendered as a plain list with every detail (that is the no-JS page
	// and the List view). With JavaScript it becomes a spatial workbench:
	// fixed positions by area, pan and zoom on springs, filters, connectors
	// between related projects, and a detail panel.
	//
	// The URL is the single source of truth (see state.ts). User actions call
	// navigate(), which writes one history entry through SvelteKit's shallow
	// routing; Back/Forward change the URL and everything below is derived
	// from it, so replaying history never creates entries.
	//   - Opening a project from the overview pushes; Back closes it.
	//   - Previous/Next or another project while one is open replaces.
	//   - Close/Esc on an entry this page pushed goes Back; on a deep link
	//     it replaces, so Back still leaves the page.
	//   - Filter and view changes push.
	import { onMount, tick, untrack } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { AREAS, byId, projects, type Project } from '#lib/content/projects.ts';
	import { CARD_WIDTH, PLANE, ZONES } from '#lib/content/bench.ts';
	import { Camera } from './camera.svelte.ts';
	import { gestures } from './gestures.ts';
	import { LABEL_LINE_HEIGHT, placeConnectors, quad, type Connector, type Rect } from './connectors.ts';
	import { FILTER_LABELS, matches, normalize, readState, urlFor, type ExploreState, type Filter, type Mode } from './state.ts';
	import BenchCard from './BenchCard.svelte';
	import ProjectDetail from './ProjectDetail.svelte';
	import { Clock } from '#lib/motion/clock.svelte.ts';
	import { POP } from '#lib/motion/springs.ts';
	import { coarsePointer, reducedMotion } from '#lib/motion/environment.ts';
	import { dashedDraw } from '#lib/motion/math.ts';

	let enhanced = $state(false);
	let defaultMode: Mode = 'list';
	let touchFirst = $state(false);
	let sidePanel = $state(true);
	let status = $state('');

	const camera = new Camera();
	const panelIn = new Spring(0, POP);
	const linksIn = new Spring(0, { stiffness: 0.03, damping: 0.4, precision: 0.002 });
	const signal = new Clock();

	let viewport = $state<HTMLElement>();
	let panel = $state<HTMLElement>();
	let heights = $state<Record<string, number>>({});
	let connectors = $state<Connector[]>([]);

	/* ---------------- state from the URL ---------------- */
	const url = $derived((page.shallow?.url ?? page.url) as URL);
	const current: ExploreState = $derived(enhanced ? readState(url, defaultMode) : { filter: 'all', mode: 'list', id: null });
	const listMode = $derived(!enhanced || current.mode === 'list');
	const selected = $derived(!listMode && current.id ? byId(current.id) : null);
	const shown = $derived(projects.filter((p) => matches(p, current.filter)));

	const heightOf = (p: Project) => heights[p.id] ?? 168;
	const centerOf = (p: Project): [number, number] => [p.bench.pos[0] + CARD_WIDTH / 2, p.bench.pos[1] + heightOf(p) * 0.42];
	const panelLeft = $derived(selected ? centerOf(selected)[0] > PLANE.width / 2 : false);

	/* ---------------- camera targets ---------------- */
	function area() {
		const open = Boolean(selected) && panel && !panel.hidden;
		const pw = open && sidePanel ? panel!.offsetWidth + 24 : 0;
		const ph = open && !sidePanel ? panel!.offsetHeight : 0;
		return { left: panelLeft ? pw : 0, width: camera.width - pw, height: camera.height - ph };
	}

	function visibleBox(): Rect {
		if (current.filter === 'all') return { x: 20, y: 20, w: PLANE.width - 40, h: PLANE.height - 40 };
		const list = shown.length ? shown : projects;
		const xs = list.flatMap((p) => [p.bench.pos[0], p.bench.pos[0] + CARD_WIDTH]);
		const ys = list.flatMap((p) => [p.bench.pos[1], p.bench.pos[1] + heightOf(p)]);
		const x = Math.min(...xs) - 40;
		const y = Math.min(...ys) - 50;
		return { x, y, w: Math.max(...xs) + 40 - x, h: Math.max(...ys) + 30 - y };
	}

	function fitView(instant: boolean) {
		camera.fit(visibleBox(), area(), { instant: instant || reducedMotion() });
	}

	function focusCard(p: Project, instant: boolean) {
		const a = area();
		const [cx, cy] = centerOf(p);
		const s = Math.min(1.15, Math.max(0.4, Math.max(camera.s.target, 1)));
		camera.moveTo({ x: a.left + a.width / 2 - cx * s, y: a.height / 2 - cy * s, s }, { instant: instant || reducedMotion() });
	}

	/* ---------------- reacting to state ---------------- */
	let applied: ExploreState | null = null;
	let appliedSize = '';
	let pendingFocus: string | null = null;
	let userAction = false;

	// Before the DOM updates: remember whether focus is inside the panel that is about to close.
	let panelHadFocus = false;
	$effect.pre(() => {
		void selected;
		untrack(() => {
			panelHadFocus = Boolean(panel && document.activeElement && panel.contains(document.activeElement));
		});
	});

	$effect(() => {
		const next = current;
		const size = `${camera.width}x${camera.height}x${sidePanel}`;
		const open = selected;
		if (!enhanced) return;
		untrack(() => {
			const prev = applied;
			const resized = size !== appliedSize;
			applied = next;
			appliedSize = size;
			if (!prev || prev.id !== next.id) panelIn.set(open ? 1 : 0, { instant: !open || reducedMotion() });
			if (open && (!prev || prev.id !== next.id)) {
				signal.stop();
				signal.play(1800);
			}
			if (!listMode && camera.width) {
				const first = !prev || prev.mode !== next.mode;
				if (open) {
					if (first || resized || prev?.id !== next.id) focusCard(open, (first && !next.id) || resized);
				} else if (first || resized || prev?.id || prev?.filter !== next.filter) {
					fitView(first || resized);
				}
			}
			if (prev && !userAction) announce(prev, next);
			userAction = false;
			// Focus follows the action that caused the change.
			const wanted = pendingFocus;
			pendingFocus = null;
			if (wanted === 'panel' && open) panel?.focus({ preventScroll: true });
			else if (prev?.id && !next.id && !listMode && (wanted === 'card' || panelHadFocus)) {
				document.querySelector<HTMLElement>(`#${prev.id} .bench-object`)?.focus({ preventScroll: true });
			}
		});
	});

	function announce(prev: ExploreState, next: ExploreState) {
		if (next.id && next.id !== prev.id && !listMode) status = `Showing ${byId(next.id).name}.`;
		else if (!next.id && prev.id) status = 'Back to the overview.';
		else if (next.filter !== prev.filter) status = next.filter === 'all' ? 'Showing all areas.' : `Showing ${FILTER_LABELS[next.filter]}.`;
		else if (next.mode !== prev.mode) status = next.mode === 'list' ? 'List view.' : 'Workbench view.';
	}

	/* ---------------- writing history ---------------- */
	const here = () => `${location.pathname}${location.search}${location.hash}`;

	async function navigate(patch: Partial<ExploreState>, { replace = false } = {}) {
		const next = normalize({ ...current, ...patch });
		const target = urlFor(next, defaultMode, new URL(location.href));
		if (target === here()) return;
		userAction = true;
		const opened = Boolean(next.id && !current.id);
		const state = replace ? { ...page.state } : { explore: { opened } };
		await goto(target, { shallow: true, replace, state });
	}

	function requestClose() {
		if (!selected) return;
		pendingFocus = 'card';
		if (page.state.explore?.opened) {
			history.back();
			return;
		}
		void navigate({ id: null }, { replace: true });
		status = 'Back to the overview.';
	}

	function choose(p: Project) {
		if (listMode) return;
		if (selected?.id === p.id) {
			requestClose();
			return;
		}
		pendingFocus = 'panel';
		void navigate({ id: p.id }, { replace: Boolean(selected) });
		status = `Showing ${p.name}.`;
	}

	function step(direction: number) {
		if (!shown.length) return;
		const index = shown.findIndex((p) => p.id === selected?.id);
		choose(shown[(index + direction + shown.length) % shown.length]);
	}

	function setFilter(filter: Filter) {
		void navigate({ filter });
		const count = projects.filter((p) => matches(p, filter)).length;
		status = filter === 'all' ? `Showing all ${count} entries.` : `Showing ${count} in ${FILTER_LABELS[filter]}.`;
	}

	function setMode(mode: Mode) {
		void navigate({ mode });
		status = mode === 'list' ? 'List view.' : 'Workbench view.';
	}

	function zoom(kind: 'in' | 'out' | 'reset') {
		if (kind === 'in') camera.zoomBy(1.25);
		else if (kind === 'out') camera.zoomBy(0.8);
		else if (selected) requestClose();
		else {
			fitView(false);
			status = 'View reset.';
		}
	}

	// A keyboard-focused object that is out of view is brought into view.
	function bringIntoView(p: Project) {
		if (listMode || selected || !viewport) return;
		const card = document.querySelector(`#${p.id} .bench-object`);
		if (!card) return;
		const r = card.getBoundingClientRect();
		const f = viewport.getBoundingClientRect();
		if (r.left >= f.left && r.right <= f.right && r.top >= f.top && r.bottom <= f.bottom) return;
		const [cx, cy] = centerOf(p);
		const s = camera.s.target;
		camera.moveTo({ x: camera.width / 2 - cx * s, y: camera.height / 2 - cy * s, s }, { instant: reducedMotion() });
	}

	/* ---------------- connectors ---------------- */
	function layoutConnectors() {
		const canvas = document.createElement('canvas').getContext('2d');
		const font = getComputedStyle(document.body).fontFamily;
		if (canvas) canvas.font = `12px ${font}`;
		const measure = (text: string) => (canvas ? canvas.measureText(text).width : text.length * 6.5);
		const centers = new Map(projects.map((p) => [p.id, centerOf(p)]));
		const cards: Rect[] = projects.map((p) => ({ x: p.bench.pos[0], y: p.bench.pos[1], w: CARD_WIDTH, h: heightOf(p) }));
		const captions: Rect[] = [];
		document.querySelectorAll<HTMLElement>('.bench-zone').forEach((zone) => {
			const span = zone.querySelector('span');
			if (span) captions.push({ x: zone.offsetLeft + span.offsetLeft, y: zone.offsetTop + span.offsetTop, w: span.offsetWidth, h: span.offsetHeight });
		});
		const links = projects.flatMap((p) => (p.bench.connections ?? []).map((c) => ({ from: p.id, to: c.to, label: c.label })));
		connectors = placeConnectors(links, centers, [...cards, ...captions], measure);
	}

	function measureCards() {
		const next: Record<string, number> = {};
		document.querySelectorAll<HTMLElement>('.bench-item').forEach((item) => {
			const button = item.querySelector<HTMLElement>('.bench-object');
			if (button) next[item.id] = button.offsetHeight;
		});
		heights = next;
	}

	$effect(() => {
		if (!enhanced || listMode) return;
		void tick().then(() => {
			measureCards();
			layoutConnectors();
			linksIn.set(1, { instant: reducedMotion() });
		});
	});

	const lit = (c: Connector) => Boolean(selected && (c.from === selected.id || c.to === selected.id));
	const linkMuted = (c: Connector) => current.filter !== 'all' && !(matches(byId(c.from), current.filter) && matches(byId(c.to), current.filter));
	// A signal travels once along each of the selected project's connections.
	function signalAt(c: Connector): [number, number, number] {
		const u = Math.min(1, signal.t / 1400);
		if (!selected || u <= 0 || u >= 1) return [0, 0, 0];
		const forward = c.from === selected.id;
		const p = quad(c.a, c.c, c.b, forward ? u : 1 - u);
		return [p[0], p[1], Math.sin(u * Math.PI)];
	}

	/* ---------------- lifecycle ---------------- */
	onMount(() => {
		defaultMode = matchMedia('(max-width: 719px)').matches ? 'list' : 'bench';
		touchFirst = coarsePointer();
		const side = matchMedia('(min-width: 900px)');
		sidePanel = side.matches;
		const onSide = () => (sidePanel = side.matches);
		side.addEventListener('change', onSide);
		enhanced = true;
		document.documentElement.classList.remove('explore-bench');

		// Normalize the address (unknown filter or a hidden project) without a new entry.
		const initial = readState(new URL(location.href), defaultMode);
		const target = urlFor(initial, defaultMode, new URL(location.href));
		if (target !== here()) void goto(target, { shallow: true, replace: true, state: { explore: { opened: false } } });

		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && selected) {
				event.preventDefault();
				requestClose();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => {
			window.removeEventListener('keydown', onKey);
			side.removeEventListener('change', onSide);
			signal.pause();
		};
	});

	const hint = $derived(
		touchFirst
			? 'Swipe sideways to move around · pinch with two fingers or use + and − to zoom'
			: 'Drag to move around · Ctrl or Cmd + scroll, or the + and − buttons, zoom · Esc closes a project'
	);
	const pin = $derived(Math.max(0, panelIn.current));
	const enterFrom = $derived(sidePanel ? (panelLeft ? -1 : 1) : 0);
</script>

<div class="bench-toolbar">
	<div aria-label="Filter by area" class="bench-filters" role="group">
		<button aria-pressed={current.filter === 'all'} data-filter="all" onclick={() => setFilter('all')} type="button">All</button>
		{#each AREAS as a (a.id)}
			<button aria-pressed={current.filter === a.id} data-filter={a.id} onclick={() => setFilter(a.id)} type="button">{a.label}</button>
		{/each}
	</div>
	<div class="bench-view-controls" class:is-pending={!enhanced}>
		<div aria-label="View" class="bench-mode" role="group">
			<button aria-pressed={!listMode} data-mode="bench" onclick={() => setMode('bench')} type="button">Workbench</button>
			<button aria-pressed={listMode} data-mode="list" onclick={() => setMode('list')} type="button">List</button>
		</div>
		<div aria-label="Zoom" class="bench-zoom" hidden={enhanced && listMode} role="group">
			<button aria-label="Zoom out" data-zoom="out" onclick={() => zoom('out')} type="button">−</button>
			<button aria-label="Zoom in" data-zoom="in" onclick={() => zoom('in')} type="button">+</button>
			<button data-zoom="reset" onclick={() => zoom('reset')} type="button">Reset view</button>
		</div>
	</div>
</div>
<p aria-live="polite" class="bench-status visually-hidden" id="bench-status">{status}</p>

<div
	class="bench"
	class:has-panel={Boolean(selected)}
	class:is-bench={enhanced && !listMode}
	class:is-list={enhanced && listMode}
	class:is-ready={enhanced}
	class:panel-left={panelLeft}
	id="bench"
>
	{#if enhanced && !listMode}
		<p class="bench-hint">{hint}</p>
	{/if}
	<section
		aria-label="Project workbench"
		bind:clientHeight={camera.height}
		bind:clientWidth={camera.width}
		bind:this={viewport}
		class="bench-viewport"
		{@attach gestures({ camera, enabled: () => enhanced && !listMode, reduced: reducedMotion })}
	>
		<div class="bench-plane" style:transform={enhanced && !listMode ? camera.transform : undefined}>
			<div aria-hidden="true" class="bench-zones">
				{#each ZONES as zone (zone.area)}
					<div
						class="bench-zone"
						class:is-muted={current.filter !== 'all' && current.filter !== zone.area}
						data-zone={zone.area}
						style:height="{zone.box[3]}px"
						style:left="{zone.box[0]}px"
						style:top="{zone.box[1]}px"
						style:width="{zone.box[2]}px"
					>
						<span>{zone.label}</span>
					</div>
				{/each}
			</div>
			<svg aria-hidden="true" class="bench-links" focusable="false" viewBox="0 0 {PLANE.width} {PLANE.height}">
				{#each connectors as c (c.from + c.to)}
					{@const [sx, sy, sv] = signalAt(c)}
					<g class="bench-link" class:is-lit={lit(c)} class:is-muted={linkMuted(c)}>
						<path d={c.d} pathLength="100" stroke-dasharray={lit(c) ? undefined : dashedDraw(linksIn.current, 3.2, 4)} />
						<text dominant-baseline="central" opacity={Math.min(1, Math.max(0, linksIn.current * 1.4 - 0.4)).toFixed(2)} text-anchor="middle">
							{#each c.lines as line, i (i)}
								<tspan x={c.at[0].toFixed(1)} y={(c.at[1] + (i - (c.lines.length - 1) / 2) * LABEL_LINE_HEIGHT).toFixed(1)}>{line}</tspan>
							{/each}
						</text>
						{#if sv > 0}
							<circle class="bench-signal" cx={sx.toFixed(1)} cy={sy.toFixed(1)} opacity={sv.toFixed(2)} r="4" />
						{/if}
					</g>
				{/each}
			</svg>
			<ul class="bench-items">
				{#each projects as project (project.id)}
					<BenchCard
						{enhanced}
						muted={enhanced && !matches(project, current.filter)}
						onchoose={choose}
						onfocus={bringIntoView}
						{project}
						selected={selected?.id === project.id}
					/>
				{/each}
			</ul>
		</div>
	</section>

	<aside
		aria-labelledby="bench-panel-title"
		bind:this={panel}
		class="bench-panel"
		hidden={!selected}
		id="bench-panel"
		style:opacity={selected ? Math.min(1, pin * 1.6).toFixed(3) : undefined}
		style:transform={selected && pin < 0.999 ? `translate(${((1 - pin) * 26 * enterFrom).toFixed(1)}px, ${((1 - pin) * (enterFrom === 0 ? 22 : 0)).toFixed(1)}px) scale(${(0.96 + 0.04 * pin).toFixed(4)})` : undefined}
		tabindex="-1"
	>
		<div class="bench-panel-bar">
			<p class="bench-panel-kicker" id="bench-panel-title">{selected?.name ?? 'Project'}</p>
			<button aria-label="Close project and return to the overview" class="bench-close" onclick={requestClose} type="button">Close</button>
		</div>
		<div class="bench-panel-body">
			{#if selected}
				{#key selected.id}
					<ProjectDetail project={selected} stagger={!reducedMotion()} />
				{/key}
			{/if}
		</div>
		<nav aria-label="Browse projects" class="bench-panel-nav">
			<button data-step="-1" onclick={() => step(-1)} type="button">← Previous</button>
			<button data-step="1" onclick={() => step(1)} type="button">Next →</button>
		</nav>
	</aside>
</div>
