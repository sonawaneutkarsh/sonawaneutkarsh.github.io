// The explorer's state lives in the URL: ?filter=<area>, ?view=list|bench
// (only when it differs from the screen-size default) and #<project>.
// These helpers are pure so the same rules serve rendering, history and tests.

import { AREAS, projects, type Area, type Project } from '#lib/content/projects.ts';

export type Filter = 'all' | Area;
export type Mode = 'bench' | 'list';

export interface ExploreState {
	filter: Filter;
	mode: Mode;
	id: string | null;
}

export const FILTER_LABELS: Record<Filter, string> = {
	all: 'all areas',
	...(Object.fromEntries(AREAS.map((a) => [a.id, a.label])) as Record<Area, string>)
};

const IDS = new Set(projects.map((p) => p.id));

export const matches = (project: Project, filter: Filter) => filter === 'all' || project.areas.includes(filter);

/** A project hidden by the filter cannot stay open. */
export function normalize(state: ExploreState): ExploreState {
	if (!state.id) return state;
	const project = projects.find((p) => p.id === state.id);
	return project && matches(project, state.filter) ? state : { ...state, id: null };
}

export function readState(url: URL, defaultMode: Mode): ExploreState {
	const f = url.searchParams.get('filter');
	const filter: Filter = f && f in FILTER_LABELS ? (f as Filter) : 'all';
	const v = url.searchParams.get('view');
	const mode: Mode = v === 'list' || v === 'bench' ? v : defaultMode;
	let hash = '';
	try {
		hash = decodeURIComponent(url.hash.slice(1));
	} catch {
		hash = '';
	}
	return normalize({ filter, mode, id: IDS.has(hash) ? hash : null });
}

export function urlFor(state: ExploreState, defaultMode: Mode, base: URL): string {
	const params = new URLSearchParams(base.search);
	if (state.filter === 'all') params.delete('filter');
	else params.set('filter', state.filter);
	if (state.mode === defaultMode) params.delete('view');
	else params.set('view', state.mode);
	const query = params.toString();
	return `${base.pathname}${query ? `?${query}` : ''}${state.id ? `#${state.id}` : ''}`;
}
