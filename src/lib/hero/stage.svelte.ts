// Coordinates the three hero objects and the margin figure.
//
// One object is lit at a time. On wide screens the lit object also plays in
// a larger figure in the whitespace right of the text column, joined to its
// line by a leader drawn in the gutter, like a margin sketch in a notebook.
// The figure never crosses the text: it only appears when the margin can
// hold it (about 1100px and wider) and it grows out from the leader's end.
// Narrower screens animate the inline icon only.

import { Spring } from 'svelte/motion';
import type { HeroKind, HeroMotion } from './hero-motion.svelte.ts';
import { AiModel } from './ai-model.svelte.ts';
import { SoftwareModel } from './software-model.svelte.ts';
import { ResearchModel } from './research-model.svelte.ts';
import { CALM, POP, SOFT } from '#lib/motion/springs.ts';
import { reducedMotion } from '#lib/motion/environment.ts';

export type Source = 'hover' | 'focus' | 'tour';

export interface Models {
	software: SoftwareModel;
	ai: AiModel;
	research: ResearchModel;
}

export interface Placement {
	/** Figure box, relative to the intro section. */
	x: number;
	w: number;
	h: number;
	/** Where the leader starts: just right of the text column, on the icon's line. */
	lineX: number;
}

export const KINDS: HeroKind[] = ['software', 'ai', 'research'];

/** Gap between the text column and the figure, and the margin kept from the viewport edge. */
const GAP = 40;
const EDGE = 20;
const MIN_WIDTH = 150;
const MAX_WIDTH = 252;
/** Height / width of the figure (the drawings are 60×42 plus padding). */
const ASPECT = 0.74;

export class HeroStage {
	owner = $state<HeroKind | null>(null);
	source: Source | null = null;
	place = $state<Placement | null>(null);

	/** 0 hidden, 1 shown; slightly underdamped so the figure lands with a small settle. */
	readonly figure = new Spring(0, POP);
	readonly leader = new Spring(0, CALM);
	/** Vertical position of the icon's line and of the figure, so a move between lines glides. */
	readonly lineY = new Spring(0, SOFT);
	readonly figureY = new Spring(0, SOFT);

	readonly icons: Partial<Record<HeroKind, HTMLElement>> = {};
	intro: HTMLElement | null = null;
	bio: HTMLElement | null = null;

	constructor(readonly models: Models) {}

	model(kind: HeroKind): HeroMotion {
		return this.models[kind];
	}

	light(kind: HeroKind, source: Source) {
		const still = reducedMotion();
		if (this.owner === kind) {
			this.source = source;
			return;
		}
		if (this.owner) this.model(this.owner).dim({ still });
		this.owner = kind;
		this.source = source;
		this.model(kind).light({ still });

		const next = this.measure(kind);
		if (!next) {
			this.figure.set(0, { instant: true });
			this.leader.set(0, { instant: true });
			this.place = null;
			return;
		}
		const fresh = !this.place || this.figure.current < 0.05;
		this.place = next.place;
		const instant = still || fresh;
		this.lineY.set(next.lineY, { instant });
		this.figureY.set(next.figureY, { instant });
		this.figure.set(1, { instant: still });
		this.leader.set(1, { instant: still });
	}

	/** Dim `kind` if it is lit, and, when `source` is given, only if it was lit that way. */
	dim(kind: HeroKind, source?: Source) {
		if (this.owner !== kind || (source && this.source !== source)) return;
		const still = reducedMotion();
		this.model(kind).dim({ still });
		this.owner = null;
		this.source = null;
		this.figure.set(0, { instant: still });
		this.leader.set(0, { instant: still });
	}

	/** Re-measure after a resize; drop the figure if the margin no longer holds it. */
	relayout() {
		if (!this.owner) return;
		const next = this.measure(this.owner);
		if (!next) {
			this.figure.set(0, { instant: true });
			this.leader.set(0, { instant: true });
			this.place = null;
			return;
		}
		this.place = next.place;
		this.lineY.set(next.lineY, { instant: true });
		this.figureY.set(next.figureY, { instant: true });
	}

	measure(kind: HeroKind): { place: Placement; lineY: number; figureY: number } | null {
		const icon = this.icons[kind];
		if (!icon || !this.intro || !this.bio) return null;
		if (!matchMedia('(min-width: 720px)').matches) return null;
		const viewport = document.documentElement.clientWidth;
		const intro = this.intro.getBoundingClientRect();
		const column = this.bio.getBoundingClientRect();
		const box = icon.getBoundingClientRect();
		const room = viewport - EDGE - (column.right + GAP);
		if (room < MIN_WIDTH) return null;
		const w = Math.floor(Math.min(MAX_WIDTH, room));
		const h = Math.round(w * ASPECT);
		const lineY = box.top + box.height / 2 - intro.top;
		return {
			place: { x: column.right + GAP - intro.left, w, h, lineX: column.right + 10 - intro.left },
			lineY,
			figureY: Math.max(-8, lineY - h * 0.42)
		};
	}

	destroy() {
		for (const kind of KINDS) this.model(kind).destroy();
	}
}

export function createHeroStage() {
	return new HeroStage({ software: new SoftwareModel(), ai: new AiModel(), research: new ResearchModel() });
}
