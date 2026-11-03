// Frame accounting for the motion lab.
//
// Each variant reports the frames it actually draws (A: whenever its
// springs or playhead change the drawing, B: every three.js render). A run
// starts on the input and ends 1 s after the variant's last drawn frame.
// Separately, window.requestAnimationFrame is wrapped (on this page only) so
// the meter can count every frame anything requested in the 2 s after a run
// ends: if a loop does not really stop, that number is not zero.

export interface Run {
	variant: string;
	frames: number;
	meanMs: number;
	maxMs: number;
	firstFrameMs: number | null;
	/** Frames requested by anything on the page in the 2 s after the run; null while measuring. */
	idleFrames: number | null;
}

type Raf = typeof window.requestAnimationFrame;

/** A run ends this long after the variant's last drawn frame. */
const RUN_END = 1000;

interface Active {
	start: number;
	frames: number;
	gaps: number[];
	last: number;
	first: number | null;
	timer: number;
}

export class FrameMeter {
	runs = $state<Record<string, Run>>({});
	#original: Raf | null = null;
	#active = new Map<string, Active>();
	#lastFrame = 0;
	#idleWatch: { frames: number } | null = null;

	install() {
		if (this.#original) return;
		const original = window.requestAnimationFrame.bind(window);
		this.#original = original;
		window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
			original((now) => {
				// Several loops can run in one frame; count each frame once.
				if (now !== this.#lastFrame) {
					this.#lastFrame = now;
					if (this.#idleWatch) this.#idleWatch.frames++;
				}
				cb(now);
			})) as Raf;
	}

	uninstall() {
		if (this.#original) window.requestAnimationFrame = this.#original;
		this.#original = null;
		for (const run of this.#active.values()) clearTimeout(run.timer);
	}

	/** A variant was lit or dimmed (call on the input). Input during a run extends it. */
	start(variant: string) {
		const ongoing = this.#active.get(variant);
		if (ongoing) {
			this.#arm(variant, ongoing);
			return;
		}
		const run: Active = { start: performance.now(), frames: 0, gaps: [], last: 0, first: null, timer: 0 };
		this.#active.set(variant, run);
		this.#arm(variant, run);
	}

	/** A variant drew a frame. */
	frame(variant: string) {
		const run = this.#active.get(variant);
		if (!run) return;
		const now = performance.now();
		if (run.first === null) run.first = now - run.start;
		if (run.last) run.gaps.push(now - run.last);
		run.last = now;
		run.frames++;
		this.#arm(variant, run);
	}

	#arm(variant: string, run: Active) {
		clearTimeout(run.timer);
		run.timer = window.setTimeout(() => this.#finish(variant, run), RUN_END);
	}

	#finish(variant: string, run: Active) {
		if (this.#active.get(variant) !== run) return;
		this.#active.delete(variant);
		const gaps = run.gaps;
		const mean = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
		this.runs = {
			...this.runs,
			[variant]: {
				variant,
				frames: run.frames,
				meanMs: Math.round(mean * 10) / 10,
				maxMs: Math.round((gaps.length ? Math.max(...gaps) : 0) * 10) / 10,
				firstFrameMs: run.first === null ? null : Math.round(run.first),
				idleFrames: null
			}
		};
		// Count every frame requested in the next 2 s, if nothing else is running.
		if (this.#active.size) return;
		const watch = { frames: 0 };
		this.#idleWatch = watch;
		window.setTimeout(() => {
			if (this.#idleWatch !== watch) return;
			this.#idleWatch = null;
			const prev = this.runs[variant];
			if (prev && !this.#active.size) this.runs = { ...this.runs, [variant]: { ...prev, idleFrames: watch.frames } };
		}, 2000);
	}
}

export interface ScriptBytes {
	transfer: number;
	decoded: number;
	files: number;
}

const sum = (entries: PerformanceResourceTiming[]): ScriptBytes => ({
	transfer: entries.reduce((a, e) => a + (e.transferSize || e.encodedBodySize || 0), 0),
	decoded: entries.reduce((a, e) => a + (e.decodedBodySize || 0), 0),
	files: entries.length
});

const scripts = () =>
	(performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter((e) => /\.js(\?|$)/.test(e.name));

/** Script fetched after `since` (ms, performance clock), from Resource Timing. */
export const scriptBytesSince = (since: number) => sum(scripts().filter((e) => e.startTime >= since));

/** Script the page loaded up to its load event. */
export function initialScriptBytes(): ScriptBytes {
	const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
	const cutoff = nav?.loadEventEnd || performance.now();
	return sum(scripts().filter((e) => e.startTime <= cutoff));
}
