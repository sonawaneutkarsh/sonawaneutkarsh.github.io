// "Software": a code window types a few lines, then turns into a product.
// The window itself becomes the iPhone while an Apple Watch buds off its
// side; the watch records, the recording travels to the phone, the phone
// shows a waveform, then text, then a completed mark. Dimming folds the
// devices back into the window. Modelled on Talks (watch → phone → done).

import { HeroMotion } from './hero-motion.svelte.ts';
import { CALM, POP, SOFT } from '#lib/motion/springs.ts';
import { mix } from '#lib/motion/math.ts';
import type { Cue } from '#lib/motion/clock.svelte.ts';

type Box = { x: number; y: number; w: number; h: number; r: number };

const WINDOW: Box = { x: 16, y: 9, w: 28, h: 20, r: 2.4 };
const PHONE: Box = { x: 40, y: 8.5, w: 13.5, h: 24, r: 3.2 };
/** The watch starts as a sliver at the window's left edge. */
const BUD: Box = { x: 16, y: 14, w: 0.01, h: 10, r: 1 };
const WATCH: Box = { x: 8.5, y: 13, w: 12, h: 14, r: 3.6 };

const lerpBox = (a: Box, b: Box, t: number): Box => ({
	x: mix(a.x, b.x, t),
	y: mix(a.y, b.y, t),
	w: Math.max(0.01, mix(a.w, b.w, t)),
	h: Math.max(0.01, mix(a.h, b.h, t)),
	r: Math.max(0, mix(a.r, b.r, t))
});

export const PACKET_PATH: [number, number][] = [[14.5, 19.5], [22, 8.5], [33, 8.5], [40.5, 17.5]];

export class SoftwareModel extends HeroMotion {
	readonly kind = 'software';
	readonly end = 2500;

	readonly lift = this.spring(0, CALM);
	readonly code = this.spring(0, CALM);
	readonly morph = this.spring(0, SOFT);
	readonly bud = this.spring(0, POP);
	readonly chrome = this.spring(0, CALM);
	readonly transfer = this.spring(0, CALM);
	readonly done = this.spring(0, POP);

	readonly frame: Box = $derived.by(() => {
		const b = lerpBox(WINDOW, PHONE, this.morph.current);
		return { ...b, y: b.y - 1.4 * this.lift.current * (1 - this.morph.current) };
	});
	readonly watch: Box = $derived(lerpBox(BUD, WATCH, this.bud.current));

	protected cues(): Cue[] {
		return [
			{ at: 0, run: () => ((this.lift.target = 1), (this.code.target = 1)) },
			{ at: 520, run: () => (this.morph.target = 1) },
			{ at: 600, run: () => (this.bud.target = 1) },
			{ at: 700, run: () => (this.chrome.target = 1) },
			{ at: 940, run: () => (this.transfer.target = 1) },
			{ at: 1960, run: () => (this.done.target = 1) }
		];
	}

	protected rest() {
		this.done.target = 0;
		this.transfer.target = 0;
		this.chrome.target = 0;
		this.bud.target = 0;
		this.morph.target = 0;
		this.code.target = 0;
		this.lift.target = 0;
	}
}
