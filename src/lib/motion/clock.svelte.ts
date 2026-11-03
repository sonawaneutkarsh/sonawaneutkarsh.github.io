// A playhead for choreographed sequences.
//
// `t` (milliseconds) advances on requestAnimationFrame only between play()
// and the end of the sequence; nothing ticks while idle, paused or hidden.
// Cues fire once when the playhead passes them, which is how a sequence
// retargets its springs at the right moments. Because the springs keep their
// velocity, a cue that fires mid-flight bends the motion instead of
// restarting it.

export interface Cue {
	at: number;
	run: () => void;
}

export class Clock {
	t = $state(0);
	running = $state(false);

	#cues: (Cue & { fired?: boolean })[] = [];
	#raf = 0;
	#last = 0;
	#end = Infinity;

	/** Replace the cue list (they fire in time order as the playhead passes them). */
	cue(cues: Cue[]) {
		this.#cues = [...cues].sort((a, b) => a.at - b.at).map((c) => ({ ...c, fired: false }));
	}

	/** Run from the current position until `end` ms, then stop. */
	play(end = Infinity) {
		this.#end = end;
		this.#fire();
		if (this.#raf || this.t >= end || typeof requestAnimationFrame === 'undefined') return;
		this.running = true;
		this.#last = performance.now();
		this.#raf = requestAnimationFrame(this.#tick);
	}

	pause() {
		if (this.#raf) cancelAnimationFrame(this.#raf);
		this.#raf = 0;
		this.running = false;
	}

	/** Move the playhead without firing cues (they are re-armed after it). */
	seek(t: number) {
		this.t = t;
		for (const c of this.#cues) c.fired = c.at < t;
	}

	/** Jump to `t`, firing every cue on the way: a still frame for reduced motion. */
	jump(t: number) {
		this.pause();
		this.t = t;
		this.#fire();
	}

	stop() {
		this.pause();
		this.seek(0);
	}

	#fire() {
		for (const c of this.#cues) {
			if (!c.fired && c.at <= this.t) {
				c.fired = true;
				c.run();
			}
		}
	}

	#tick = (now: number) => {
		// Clamp long gaps (a background tab, a debugger) to one 30 Hz frame.
		const dt = Math.min(now - this.#last, 34);
		this.#last = now;
		this.t = Math.min(this.#end, this.t + dt);
		this.#fire();
		if (this.t >= this.#end) {
			this.#raf = 0;
			this.running = false;
			return;
		}
		this.#raf = requestAnimationFrame(this.#tick);
	};
}
