// Shared lifecycle for the three hero objects.
//
// Every visible change is a svelte/motion Spring, retargeted by cues on a
// playhead (Clock) while the object is lit. Lighting sets the cues and plays;
// dimming pauses the playhead and sends every spring back to rest from
// wherever it is, keeping its velocity, so a quick in-and-out turns round
// smoothly. Nothing ticks once the springs settle and the playhead ends.
// Reduced motion jumps straight to one still of the lit state.

import { Spring, type SpringOptions } from 'svelte/motion';
import { Clock, type Cue } from '#lib/motion/clock.svelte.ts';
import { CALM } from '#lib/motion/springs.ts';

export type HeroKind = 'software' | 'ai' | 'research';

export abstract class HeroMotion {
	abstract readonly kind: HeroKind;
	/** When the lit sequence has nothing left to do (ms). */
	abstract readonly end: number;

	lit = $state(false);
	readonly clock = new Clock();
	/** 0 at rest, 1 lit: the wash behind the inline icon and the margin layer's opacity. */
	readonly presence = new Spring(0, CALM);

	#springs: Spring<number>[] = [this.presence];

	protected spring(value: number, options: SpringOptions) {
		const s = new Spring(value, options);
		this.#springs.push(s);
		return s;
	}

	/** Cues for the lit sequence, relative to lighting. */
	protected abstract cues(): Cue[];
	/** Send every part back to rest. */
	protected abstract rest(): void;

	light({ still = false } = {}) {
		this.lit = true;
		this.presence.target = 1;
		this.clock.cue(this.cues());
		this.clock.seek(0);
		if (still) {
			this.clock.jump(this.end);
			this.#settle();
		} else {
			this.clock.play(this.end);
		}
	}

	dim({ still = false } = {}) {
		this.lit = false;
		this.clock.pause();
		this.presence.target = 0;
		this.rest();
		if (still) this.#settle();
	}

	/** Jump every spring to its target (reduced motion). */
	#settle() {
		for (const s of this.#springs) s.set(s.target, { instant: true });
	}

	destroy() {
		this.clock.pause();
	}
}
