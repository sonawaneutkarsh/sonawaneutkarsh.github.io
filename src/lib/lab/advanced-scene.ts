// Variant B of the motion lab: the same "AI systems" object as the
// homepage, choreographed by a GSAP timeline and rendered by three.js.
//
// The timeline is built once, paused, and played forward on hover/focus and
// in reverse on exit (GSAP's idiomatic reversal: continuous position, but
// the motion turns round at constant timeline speed rather than carrying
// velocity like a spring). It renders only from the timeline's onUpdate, so
// nothing draws while the timeline is idle. dispose() releases every
// geometry, material and the WebGL context.
//
// This module is only ever loaded with a dynamic import from the lab page;
// no other route pulls three.js or GSAP into its bundle.

import {
	BackSide,
	BufferGeometry,
	Color,
	CubicBezierCurve3,
	Float32BufferAttribute,
	Group,
	Line,
	LineBasicMaterial,
	LineDashedMaterial,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Scene,
	SphereGeometry,
	Vector3,
	WebGLRenderer,
	type Material,
	type MeshBasicMaterialParameters
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gsap } from 'gsap/gsap-core';

const INK = new Color('#282d27');
const SAGE = new Color('#455c47');
const LINE = new Color('#6b745d');
const PAPER = new Color('#fcfaf0');
const SOFT = new Color('#e6ebdd');

// Layout in the homepage icon's 60×42 units (see ai-model.svelte.ts).
const REST = [[21, 15], [21, 27], [30, 12], [30, 21], [30, 30], [39, 21]];
const SPREAD = [[12, 12.5], [12, 29.5], [30, 7.5], [30, 21], [30, 34.5], [48, 21]];
const DEPTH = [-8, 7, 10, -7, 10, 0];
const FLOW = [[11, 25, 13, 9], [11, 25, 0, 0], [30, 9.5, 5.4, 5.4], [30, 25, 13, 9], [49, 25, 0, 0], [49, 25, 13, 9]];
const EDGES = [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5]];
const EXTRA = [[0, 4], [1, 2]];
const ROUTES = [[0, 2, 5], [1, 4, 5], [0, 3, 5]];

const toWorld = (x: number, y: number, z = 0) => new Vector3(x - 30, -(y - 21), z);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export interface AdvancedScene {
	light(): void;
	dim(): void;
	/** Reduced motion: show the lit state, or rest, without animating. */
	jump(lit: boolean): void;
	resize(width: number, height: number): void;
	setVisible(visible: boolean): void;
	/** Frames rendered so far (for the lab's metrics). */
	frames(): number;
	dispose(): void;
}

export function webglAvailable(): boolean {
	try {
		const canvas = document.createElement('canvas');
		return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
	} catch {
		return false;
	}
}

export function createAdvancedScene(
	canvas: HTMLCanvasElement,
	width: number,
	height: number,
	onLost: () => void,
	onFrame: () => void = () => {}
): AdvancedScene {
	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
	renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
	renderer.setSize(width, height, false);
	renderer.setClearColor(0x000000, 0);

	const scene = new Scene();
	const camera = new PerspectiveCamera(32, width / height, 1, 400);
	camera.position.set(0, 0, 92);

	const owned: { dispose(): void }[] = [];
	const own = <T extends { dispose(): void }>(thing: T): T => {
		owned.push(thing);
		return thing;
	};
	const basic = (color: Color, extra: MeshBasicMaterialParameters = {}) =>
		own(new MeshBasicMaterial({ color, transparent: true, ...extra }));

	const network = new Group();
	scene.add(network);

	// Nodes: a paper sphere inside a slightly larger back-faced ink sphere
	// (an inverted-hull outline), and a rounded box that grows in as the node
	// becomes a step of the agent loop.
	const sphere = own(new SphereGeometry(2.7, 32, 20));
	const box = own(new RoundedBoxGeometry(1, 1, 1, 4, 0.12));
	const paper = basic(PAPER);
	const soft = basic(SOFT);
	const outline = basic(INK, { side: BackSide });
	const nodes = REST.map((_, i) => {
		const group = new Group();
		const ball = new Mesh(sphere, i === 2 ? soft : paper);
		const ballEdge = new Mesh(sphere, outline);
		ballEdge.scale.setScalar(1.13);
		const block = new Mesh(box, paper);
		const blockEdge = new Mesh(box, outline);
		group.add(ballEdge, ball, blockEdge, block);
		network.add(group);
		return { group, ball, ballEdge, block, blockEdge };
	});

	const lineMat = own(new LineBasicMaterial({ color: LINE, transparent: true }));
	const sageMat = own(new LineBasicMaterial({ color: SAGE, transparent: true }));
	const segment = (material: Material) => {
		const geometry = own(new BufferGeometry());
		geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(6), 3));
		const line = new Line(geometry, material);
		network.add(line);
		return line;
	};
	const set = (line: Line, a: Vector3, b: Vector3) => {
		const p = line.geometry.getAttribute('position') as Float32BufferAttribute;
		p.setXYZ(0, a.x, a.y, a.z);
		p.setXYZ(1, b.x, b.y, b.z);
		p.needsUpdate = true;
	};
	const edges = EDGES.map(() => segment(lineMat));
	const extras = EXTRA.map(() => segment(sageMat));
	const arrows = [segment(sageMat), segment(sageMat)];
	const toolMat = own(new LineDashedMaterial({ color: LINE, dashSize: 1.2, gapSize: 1.4, transparent: true }));
	const toolLink = segment(toolMat);

	const loopGeometry = own(new BufferGeometry());
	const LOOP_POINTS = 48;
	loopGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(LOOP_POINTS * 3), 3));
	const loopMat = own(new LineDashedMaterial({ color: SAGE, dashSize: 2.4, gapSize: 2.2, transparent: true }));
	const loopLine = new Line(loopGeometry, loopMat);
	network.add(loopLine);

	const dot = own(new SphereGeometry(1.25, 16, 12));
	const sageFill = basic(SAGE);
	const signals = ROUTES.map(() => {
		const m = new Mesh(dot, sageFill);
		network.add(m);
		return m;
	});
	const token = new Mesh(dot, sageFill);
	network.add(token);

	// Everything the timeline animates.
	const s = { depth: 0, extra: 0, signals: 0, sig: 0, arrows: 0, loop: 0, token: 0, tok: 0 };
	const flow = FLOW.map(() => ({ v: 0 }));

	let rendered = 0;
	let visible = true;

	function positions() {
		const fm = flow.reduce((a, f) => a + f.v, 0) / flow.length;
		const d = s.depth;
		const unwind = 1 - Math.min(1, fm * 1.25);
		network.rotation.y = 0.62 * d * unwind;
		network.rotation.x = -0.2 * d * unwind;
		return REST.map((rest, i) => {
			const f = Math.max(0, flow[i].v);
			const base = toWorld(mix(rest[0], SPREAD[i][0], d), mix(rest[1], SPREAD[i][1], d), DEPTH[i] * d * (1 - f));
			const [fx, fy] = FLOW[i];
			const target = toWorld(fx, fy, 0);
			return { p: base.lerp(target, f), f, w: mix(5.4, FLOW[i][2], f), h: mix(5.4, FLOW[i][3], f) };
		});
	}

	function render() {
		if (!visible) return;
		const ps = positions();
		ps.forEach(({ p, f, w, h }, i) => {
			const n = nodes[i];
			n.group.position.copy(p);
			const ball = Math.max(0.001, 1 - f);
			n.ball.scale.setScalar(ball);
			n.ballEdge.scale.setScalar(ball * 1.13);
			const bw = Math.max(0.001, w * f);
			const bh = Math.max(0.001, h * f);
			n.block.scale.set(bw, bh, 3 * f + 0.001);
			n.blockEdge.scale.set(bw + 0.7, bh + 0.7, 3 * f + 0.5);
			n.group.visible = !(FLOW[i][2] === 0 && f > 0.98);
		});
		const fm = flow.reduce((a, f) => a + f.v, 0) / flow.length;
		const net = Math.max(0, 1 - fm * 1.6);
		edges.forEach((line, k) => {
			const [a, b] = EDGES[k];
			set(line, ps[a].p, ps[b].p);
			(line.material as LineBasicMaterial).opacity = net;
		});
		sageMat.opacity = 1;
		extras.forEach((line, k) => {
			const [a, b] = EXTRA[k];
			set(line, ps[a].p, ps[a].p.clone().lerp(ps[b].p, Math.min(1, s.extra)));
			line.visible = s.extra > 0.02 && net > 0.02;
		});
		// Agent loop arrows between the boxes' facing edges.
		const edgeOf = (i: number, side: number) => ps[i].p.clone().add(new Vector3((side * ps[i].w) / 2 + side * 0.8, 0, 0));
		[[0, 3], [3, 5]].forEach(([a, b], k) => {
			const from = edgeOf(a, 1);
			const to = edgeOf(b, -1);
			set(arrows[k], from, from.clone().lerp(to, Math.min(1, Math.max(0, s.arrows * 1.15 - k * 0.15))));
			arrows[k].visible = s.arrows > 0.02;
		});
		set(toolLink, ps[3].p.clone().add(new Vector3(0, ps[3].h / 2, 0)), ps[2].p.clone().add(new Vector3(0, -ps[2].h / 2, 0)));
		toolLink.computeLineDistances();
		toolMat.opacity = Math.min(1, s.arrows);
		const curve = new CubicBezierCurve3(
			ps[5].p.clone().add(new Vector3(0, -ps[5].h / 2, 0)),
			toWorld(49, 39),
			toWorld(11, 39),
			ps[0].p.clone().add(new Vector3(0, -ps[0].h / 2, 0))
		);
		const pts = curve.getPoints(LOOP_POINTS - 1);
		const lp = loopGeometry.getAttribute('position') as Float32BufferAttribute;
		pts.forEach((pt, k) => lp.setXYZ(k, pt.x, pt.y, pt.z));
		lp.needsUpdate = true;
		loopLine.computeLineDistances();
		loopGeometry.setDrawRange(0, Math.round(LOOP_POINTS * Math.min(1, s.loop)));
		loopLine.visible = s.loop > 0.02;

		signals.forEach((m, k) => {
			const u = (s.sig + k * 0.33) % 1;
			const [a, b, c] = ROUTES[k];
			const first = u < 0.5;
			const from = ps[first ? a : b].p;
			const to = ps[first ? b : c].p;
			m.position.copy(from.clone().lerp(to, first ? u * 2 : (u - 0.5) * 2));
			m.visible = s.signals > 0.02;
			m.scale.setScalar(Math.max(0.001, s.signals * Math.sin(u * Math.PI)));
		});
		const route = [edgeOf(0, 1), edgeOf(3, -1), ps[3].p.clone().add(new Vector3(0, ps[3].h / 2, 0)), ps[2].p.clone(), ps[3].p.clone().add(new Vector3(0, ps[3].h / 2, 0)), edgeOf(3, 1), edgeOf(5, -1)];
		const u = s.tok;
		if (u < 0.62) {
			const leg = Math.min(route.length - 2, Math.floor((u / 0.62) * (route.length - 1)));
			const v = (u / 0.62) * (route.length - 1) - leg;
			token.position.copy(route[leg].clone().lerp(route[leg + 1], v));
		} else {
			token.position.copy(curve.getPoint((u - 0.62) / 0.38));
		}
		token.visible = s.token > 0.02;
		token.scale.setScalar(Math.max(0.001, s.token * 1.3));

		renderer.render(scene, camera);
		rendered++;
		onFrame();
	}

	const tl = gsap.timeline({ paused: true, onUpdate: render, onComplete: render, onReverseComplete: render });
	tl.to(s, { depth: 1, duration: 0.9, ease: 'elastic.out(1, 0.6)' }, 0)
		.to(s, { extra: 1, duration: 0.45, ease: 'power2.out' }, 0.26)
		.to(s, { signals: 1, duration: 0.2, ease: 'power1.out' }, 0.43)
		.to(s, { sig: 1, duration: 0.82, ease: 'none' }, 0.43)
		.to(s, { signals: 0, duration: 0.2, ease: 'power1.in' }, 1.25)
		.to(flow, { v: 1, duration: 0.7, ease: 'back.out(1.5)', stagger: { each: 0.06, from: 'start' } }, 1.3)
		.to(s, { arrows: 1, duration: 0.45, ease: 'power2.out' }, 1.68)
		.to(s, { loop: 1, duration: 0.5, ease: 'power1.inOut' }, 1.95)
		.to(s, { token: 1, duration: 0.15 }, 2.2)
		.to(s, { tok: 1, duration: 1.4, ease: 'none' }, 2.2)
		.to(s, { token: 0, duration: 0.2 }, 3.6);

	const onContextLost = (event: Event) => {
		event.preventDefault();
		tl.pause();
		onLost();
	};
	canvas.addEventListener('webglcontextlost', onContextLost);

	render();

	return {
		light() {
			tl.timeScale(1).play();
		},
		dim() {
			tl.timeScale(1.6).reverse();
		},
		jump(lit) {
			tl.pause();
			tl.progress(lit ? 1 : 0);
			render();
		},
		resize(w, h) {
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			render();
		},
		setVisible(on) {
			visible = on;
			if (!on) tl.pause();
		},
		frames: () => rendered,
		dispose() {
			tl.kill();
			canvas.removeEventListener('webglcontextlost', onContextLost);
			for (const thing of owned) thing.dispose();
			renderer.dispose();
			// dispose() keeps the context alive until garbage collection; release it now.
			renderer.forceContextLoss();
		}
	};
}
