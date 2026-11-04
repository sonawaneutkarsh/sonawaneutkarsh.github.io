// "Research": a closed notebook opens into a spread. Text writes itself on
// the right page, a drug mention and a reaction mention are marked, and a
// dashed candidate link joins them. The pair is then copied onto a slip and
// filed in the review tray on the left page. The link stays dashed: it is a
// reported co-mention waiting for review, not a causal finding.

import { HeroMotion } from './hero-motion.svelte.ts';
import { CALM, POP, SOFT } from '#lib/motion/springs.ts';
import type { Cue } from '#lib/motion/clock.svelte.ts';

/** Book geometry (60×42 viewBox): closed cover x 20–40; open spread 10–50. */
export const BOOK = { left: 20, top: 7, width: 20, height: 27, shift: 10 } as const;

export class ResearchModel extends HeroMotion {
	readonly kind = 'research';
	readonly end = 2800;

	readonly open = this.spring(0, SOFT);
	readonly write = this.spring(0, CALM);
	readonly drug = this.spring(0, POP);
	readonly reaction = this.spring(0, POP);
	readonly link = this.spring(0, CALM);
	readonly file = this.spring(0, CALM);
	readonly filed = this.spring(0, POP);

	/** Where the spine is: it slides right as the book opens, keeping the spread centred. */
	readonly spine = $derived(BOOK.left + BOOK.shift * Math.max(0, Math.min(1.06, this.open.current)));
	/** Cover angle, 0 (closed) to π (flat open on the left). */
	readonly angle = $derived(Math.PI * Math.max(0, Math.min(1, this.open.current)));

	protected cues(): Cue[] {
		return [
			{ at: 0, run: () => (this.open.target = 1) },
			{ at: 520, run: () => (this.write.target = 1) },
			{ at: 1000, run: () => (this.drug.target = 1) },
			{ at: 1200, run: () => (this.reaction.target = 1) },
			{ at: 1420, run: () => (this.link.target = 1) },
			{ at: 1850, run: () => (this.file.target = 1) },
			{ at: 2380, run: () => (this.filed.target = 1) }
		];
	}

	protected rest() {
		this.filed.target = 0;
		this.file.target = 0;
		this.link.target = 0;
		this.reaction.target = 0;
		this.drug.target = 0;
		this.write.target = 0;
		this.open.target = 0;
	}
}
