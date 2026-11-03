// State for one homepage project frame.
//
// Two springs drive the frame: `lift` (the frame rises a little on hover or
// focus) and `reveal` (the illustration gives way to the animated drawing).
// The drawing is a pure function of a playhead that runs once to the end of
// its sequence and then holds, so an idle frame requests no frames. Only one
// preview plays at a time. Stopping freezes the drawing where it is and
// fades it out; starting again before it has faded resumes it.

import { Spring } from 'svelte/motion';
import { Clock } from '#lib/motion/clock.svelte.ts';
import { CALM, SOFT } from '#lib/motion/springs.ts';
import { reducedMotion } from '#lib/motion/environment.ts';

export type PreviewSource = 'hover' | 'focus' | 'button';

let current: Preview | null = null;

export class Preview {
	active = $state(false);
	/** The drawing is created on first use. */
	built = $state(false);
	/** Reduced motion: the drawing shows one still frame. */
	still = $state(false);
	source: PreviewSource | null = null;

	readonly lift = new Spring(0, CALM);
	readonly reveal = new Spring(0, SOFT);
	readonly clock = new Clock();

	constructor(
		readonly name: string,
		readonly end: number
	) {}

	hover(on: boolean) {
		this.lift.set(on ? 1 : 0, { instant: reducedMotion() });
	}

	start(source: PreviewSource) {
		if (current && current !== this) current.stop();
		current = this;
		if (this.active) return;
		this.built = true;
		this.active = true;
		this.source = source;
		const still = reducedMotion();
		this.still = still;
		this.reveal.set(1, { instant: still });
		if (still) {
			this.clock.pause();
			this.clock.seek(this.end);
			return;
		}
		if (this.reveal.current < 0.05) this.clock.seek(0);
		this.clock.play(this.end);
	}

	stop() {
		if (!this.active) return;
		this.active = false;
		this.source = null;
		if (current === this) current = null;
		this.clock.pause();
		this.reveal.set(0, { instant: reducedMotion() });
	}

	toggle() {
		if (this.active) this.stop();
		else this.start('button');
	}

	static stopCurrent() {
		current?.stop();
	}
}
