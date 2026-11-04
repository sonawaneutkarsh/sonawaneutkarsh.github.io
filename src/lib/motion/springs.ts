// Spring presets for svelte/motion's Spring.
//
// Svelte's Spring integrates per 60 Hz frame and keeps its velocity when the
// target changes (velocity is current − previous value), so a hover that
// reverses half way turns round instead of restarting. Its stiffness and
// damping are per-frame numbers in [0, 1]; `physical()` converts from the
// familiar per-second form (stiffness K in 1/s², damping C in 1/s, unit mass)
// so presets can be read as damping ratios: ζ = C / (2√K).

import type { SpringOptions } from 'svelte/motion';

export function physical(stiffness: number, damping: number, precision = 0.001): SpringOptions {
	return { stiffness: Math.min(1, stiffness / 3600), damping: Math.min(1, damping / 60), precision };
}

/** ζ ≈ 0.6: a visible, soft overshoot. Objects that pop out of something. */
export const POP = physical(260, 19.5);
/** ζ ≈ 0.75: settles with a hint of overshoot. Most moving parts. */
export const SOFT = physical(170, 19.5);
/** ζ ≈ 0.95: no visible overshoot. Fades, lifts, retractions. */
export const CALM = physical(200, 27);
/** ζ ≈ 0.55, slower: large organic moves (a network reorganizing). */
export const DRIFT = physical(120, 12);
/** Critically damped and as fast as Svelte allows: follows a finger. */
export const FOLLOW = physical(900, 60);
/** Camera: smooth, ζ ≈ 0.9. */
export const CAMERA = physical(130, 20.5);
