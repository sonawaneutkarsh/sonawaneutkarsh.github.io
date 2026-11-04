// Small numeric helpers shared by the drawings.

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

/** Map `v` from [a, b] onto [0, 1], clamped. Stages one clock into phases. */
export const phase = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smoothstep. */
export const ease = (t: number) => t * t * (3 - 2 * t);

/** Ease out (cubic). */
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Ease out with a small overshoot past 1 before settling (a pop). */
export const easeOutBack = (t: number, overshoot = 1.9) => (t <= 0 ? 0 : 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2);

/** A bump that rises and falls back over [a, b]. */
export const bump = (v: number, a: number, b: number) => Math.sin(phase(v, a, b) * Math.PI);

/** Point on a cubic Bézier. */
export function bezier(
	p0: [number, number],
	p1: [number, number],
	p2: [number, number],
	p3: [number, number],
	t: number
): [number, number] {
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;
	return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Round for SVG attributes, so the DOM gets short strings. */
export const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * stroke-dasharray that draws a dashed line on from its start: dashes of
 * `dash` and gaps of `gap` up to `p` of a path with pathLength="100", then
 * nothing. (A dash offset only slides a repeating pattern along.)
 */
export function dashedDraw(p: number, dash = 3, gap = 2.5): string {
	const end = 100 * clamp(p);
	if (end >= 100) return `${dash} ${gap}`;
	const parts: number[] = [];
	let at = 0;
	while (at < end) {
		const d = Math.min(dash, end - at);
		parts.push(r2(d), gap);
		at += dash + gap;
	}
	parts.push(0, 200);
	return parts.join(' ');
}
