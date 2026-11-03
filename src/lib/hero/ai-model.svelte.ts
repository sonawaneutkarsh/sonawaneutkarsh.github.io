// "AI systems": a small neural network that turns into depth, grows two
// connections, carries signals through its layers, then rearranges into an
// agent loop (plan → act → check, with a tool) and runs one token round it.
//
// Depth is a real 3D rotation and perspective projection of the node
// positions (drawn in SVG), so near nodes grow and far ones shrink and fade.
// Coordinates are in the icon's 60×42 viewBox.

import { HeroMotion } from './hero-motion.svelte.ts';
import { CALM, DRIFT, SOFT } from '#lib/motion/springs.ts';
import { mix, phase } from '#lib/motion/math.ts';
import type { Cue } from '#lib/motion/clock.svelte.ts';

type P = [number, number];

const CENTER: P = [30, 21];
const FOCAL = 64;
const NODE = 5.4;

/** Rest: a 2–3–1 network, recognisable at icon size. */
const REST: P[] = [[21, 15], [21, 27], [30, 12], [30, 21], [30, 30], [39, 21]];
/** Spread out for the turn into depth. */
const SPREAD: P[] = [[12, 12.5], [12, 29.5], [30, 7.5], [30, 21], [30, 34.5], [48, 21]];
/** Depth of each node once spread (positive comes towards the viewer). */
const DEPTH = [-8, 7, 10, -7, 10, 0];

/** Agent loop: [cx, cy, w, h]. Nodes 1 and 4 fold away into plan and check. */
export const FLOW: [number, number, number, number][] = [
	[11, 25, 13, 9], // plan
	[11, 25, 0, 0],
	[30, 9.5, 5.4, 5.4], // tool
	[30, 25, 13, 9], // act
	[49, 25, 0, 0],
	[49, 25, 13, 9] // check
];
/** Order in which nodes move to their places in the loop. */
const FLOW_ORDER = [0, 3, 5, 2, 1, 4];

export const EDGES: [number, number][] = [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5]];
/** Connections the network grows while it is in depth. */
export const EXTRA: [number, number][] = [[0, 4], [1, 2]];
/** Signal routes through the layers. */
export const ROUTES: [number, number, number][] = [[0, 2, 5], [1, 4, 5], [0, 3, 5]];

export interface NodeView {
	x: number;
	y: number;
	w: number;
	h: number;
	/** Perspective scale: >1 is nearer. */
	s: number;
	/** 0..1 how far this node has moved into the agent loop. */
	f: number;
	/** Ink strength from depth. */
	ink: number;
}

export class AiModel extends HeroMotion {
	readonly kind = 'ai';
	readonly end = 3900;

	readonly depth = this.spring(0, DRIFT);
	readonly flow = FLOW.map(() => this.spring(0, SOFT));
	readonly extra = this.spring(0, CALM);
	readonly signals = this.spring(0, CALM);
	readonly arrows = this.spring(0, CALM);
	readonly loop = this.spring(0, CALM);
	readonly token = this.spring(0, CALM);

	/** Mean progress into the loop; the turn into depth unwinds as it rises. */
	readonly flowMean = $derived(this.flow.reduce((sum, s) => sum + s.current, 0) / this.flow.length);

	readonly nodes: NodeView[] = $derived.by(() => {
		const d = this.depth.current;
		const unwind = 1 - Math.min(1, this.flowMean * 1.25);
		const yaw = 0.62 * d * unwind;
		const pitch = 0.2 * d * unwind;
		const [cy, sy, cp, sp] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];
		return REST.map((rest, i) => {
			const bx = mix(rest[0], SPREAD[i][0], d) - CENTER[0];
			const by = mix(rest[1], SPREAD[i][1], d) - CENTER[1];
			const bz = DEPTH[i] * d;
			// Yaw about the vertical axis, then pitch about the horizontal one.
			const x1 = bx * cy + bz * sy;
			const z1 = -bx * sy + bz * cy;
			const y2 = by * cp - z1 * sp;
			const z2 = by * sp + z1 * cp;
			const s = FOCAL / (FOCAL - z2);
			const f = Math.max(0, this.flow[i].current);
			const [fx, fy, fw, fh] = FLOW[i];
			return {
				x: mix(CENTER[0] + x1 * s, fx, f),
				y: mix(CENTER[1] + y2 * s, fy, f),
				w: Math.max(0, mix(NODE * s, fw, f)),
				h: Math.max(0, mix(NODE * s, fh, f)),
				s,
				f,
				ink: Math.min(1, Math.max(0.4, 0.55 + (s - 1) * 2.6))
			};
		});
	});

	protected cues(): Cue[] {
		return [
			{ at: 0, run: () => (this.depth.target = 1) },
			{ at: 260, run: () => (this.extra.target = 1) },
			{ at: 430, run: () => (this.signals.target = 1) },
			{ at: 1250, run: () => (this.signals.target = 0) },
			...FLOW_ORDER.map((node, k) => ({ at: 1300 + k * 60, run: () => (this.flow[node].target = 1) })),
			{ at: 1680, run: () => (this.arrows.target = 1) },
			{ at: 1950, run: () => (this.loop.target = 1) },
			{ at: 2200, run: () => (this.token.target = 1) },
			{ at: 3600, run: () => (this.token.target = 0) }
		];
	}

	protected rest() {
		for (const s of [this.depth, this.extra, this.signals, this.arrows, this.loop, this.token, ...this.flow]) s.target = 0;
	}

	/** Where signal `k` is on its route at playhead `t`: [x, y, visibility]. */
	signal(k: number, t: number): [number, number, number] {
		const route = ROUTES[k];
		const u = ((t - 430) / 820 + k * 0.33) % 1;
		const local = u < 0 ? u + 1 : u;
		const first = local < 0.5;
		const a = this.nodes[route[first ? 0 : 1]];
		const b = this.nodes[route[first ? 1 : 2]];
		const v = first ? local * 2 : (local - 0.5) * 2;
		return [mix(a.x, b.x, v), mix(a.y, b.y, v), this.signals.current * Math.sin(local * Math.PI)];
	}

	/** The token's position round the loop at playhead `t`. */
	tokenAt(t: number): [number, number] {
		const [plan, , tool, act, , check] = this.nodes;
		const u = phase(t, 2200, 3600);
		// plan → act → tool → act → check, then under and back to plan.
		const legs: [P, P][] = [
			[[plan.x + plan.w / 2, plan.y], [act.x - act.w / 2, act.y]],
			[[act.x, act.y - act.h / 2], [tool.x, tool.y + tool.h / 2]],
			[[tool.x, tool.y + tool.h / 2], [act.x, act.y - act.h / 2]],
			[[act.x + act.w / 2, act.y], [check.x - check.w / 2, check.y]]
		];
		if (u < 0.62) {
			const leg = Math.min(3, Math.floor(u / 0.155));
			const v = (u - leg * 0.155) / 0.155;
			const [p, q] = legs[leg];
			return [mix(p[0], q[0], v), mix(p[1], q[1], v)];
		}
		// The return loop: a cubic under the row from check to plan.
		const v = (u - 0.62) / 0.38;
		const p0: P = [check.x, check.y + check.h / 2];
		const p3: P = [plan.x, plan.y + plan.h / 2];
		const k = 1 - v;
		const x = k ** 3 * p0[0] + 3 * k * k * v * p0[0] + 3 * k * v * v * p3[0] + v ** 3 * p3[0];
		const y = k ** 3 * p0[1] + 3 * k * k * v * LOOP_DIP + 3 * k * v * v * LOOP_DIP + v ** 3 * p3[1];
		return [x, y];
	}
}

/** How far below the row the return loop's control points sit. */
export const LOOP_DIP = 39;
