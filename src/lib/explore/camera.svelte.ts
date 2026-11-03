// The workbench camera: pan (x, y) and zoom (s) as springs.
//
// Programmatic moves (fit, focus a card, zoom buttons) glide on the CAMERA
// spring. A drag follows the finger on a near-critically-damped spring, so
// on release the plane carries the finger's speed into a short coast, still
// inside the bounds. Every position is bounded so the viewport's centre
// stays over the plane: the bench can never be lost, and any card, even a
// corner one on a phone, can be centred.

import { Spring } from 'svelte/motion';
import { CAMERA, FOLLOW } from '#lib/motion/springs.ts';
import { PLANE } from '#lib/content/bench.ts';

export const MIN_SCALE = 0.25;
export const FIT_MIN = 0.4;
export const MAX_SCALE = 1.8;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface View {
	x: number;
	y: number;
	s: number;
}

export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

export class Camera {
	// Pixel-sized precision for pan, so the springs stop once moves are invisible.
	readonly x = new Spring(0, { ...CAMERA, precision: 0.05 });
	readonly y = new Spring(0, { ...CAMERA, precision: 0.05 });
	readonly s = new Spring(1, { ...CAMERA, precision: 0.0002 });
	/** Viewport size in CSS px (bound from the element). */
	width = $state(0);
	height = $state(0);

	readonly transform = $derived(
		`translate(${this.x.current.toFixed(2)}px, ${this.y.current.toFixed(2)}px) scale(${this.s.current.toFixed(4)})`
	);

	bounded(v: View): View {
		const s = clamp(v.s, MIN_SCALE, MAX_SCALE);
		return {
			x: clamp(v.x, this.width / 2 - PLANE.width * s, this.width / 2),
			y: clamp(v.y, this.height / 2 - PLANE.height * s, this.height / 2),
			s
		};
	}

	#tune(options: typeof CAMERA) {
		for (const spring of [this.x, this.y, this.s]) {
			spring.stiffness = options.stiffness ?? spring.stiffness;
			spring.damping = options.damping ?? spring.damping;
		}
	}

	/** Glide to `v` (or jump, for instant moves and reduced motion). */
	moveTo(v: View, { instant = false } = {}) {
		const next = this.bounded(v);
		this.#tune(CAMERA);
		this.x.set(next.x, { instant });
		this.y.set(next.y, { instant });
		this.s.set(next.s, { instant });
	}

	/** Follow a gesture closely. */
	follow(v: View) {
		const next = this.bounded(v);
		this.#tune(FOLLOW);
		this.x.target = next.x;
		this.y.target = next.y;
		this.s.target = next.s;
	}

	/** Release a drag: coast on in the direction of travel, then settle. */
	release(vx: number, vy: number) {
		const coast = 0.22;
		const max = 420;
		const dx = clamp(vx * coast, -max, max);
		const dy = clamp(vy * coast, -max, max);
		const next = this.bounded({ x: this.x.target + dx, y: this.y.target + dy, s: this.s.target });
		this.#tune(CAMERA);
		this.x.set(next.x, { preserveMomentum: 140 });
		this.y.set(next.y, { preserveMomentum: 140 });
	}

	get target(): View {
		return { x: this.x.target, y: this.y.target, s: this.s.target };
	}

	/** Fit `box` into the area left of/above an open panel. */
	fit(box: Box, area: { left: number; width: number; height: number }, options?: { instant?: boolean }) {
		const pad = 28;
		const s = clamp(Math.min((area.width - pad * 2) / box.w, (area.height - pad * 2) / box.h), FIT_MIN, 1.25);
		this.moveTo({ x: area.left + (area.width - box.w * s) / 2 - box.x * s, y: (area.height - box.h * s) / 2 - box.y * s, s }, options);
	}

	/** Zoom by `factor` about a point in viewport coordinates. */
	zoomBy(factor: number, px = this.width / 2, py = this.height / 2) {
		const { x, y, s } = this.target;
		const s1 = clamp(s * factor, MIN_SCALE, MAX_SCALE);
		const ratio = s1 / s;
		this.moveTo({ x: px - (px - x) * ratio, y: py - (py - y) * ratio, s: s1 });
	}
}
