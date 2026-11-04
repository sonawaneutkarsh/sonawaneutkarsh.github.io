// Pointer input for the workbench viewport.
//
// Mouse/pen: drag the background to pan; Ctrl/⌘ + wheel zooms around the
// pointer (Chromium and Firefox also deliver trackpad pinch this way); a
// plain wheel is never captured, so the page keeps scrolling.
// Touch: one-finger sideways drags pan, vertical swipes scroll the page
// (touch-action: pan-y), two fingers pinch around their midpoint. A pinch
// never turns into a drag when one finger lifts, and a drag or pinch never
// opens a card (the click that ends it is swallowed).

import type { Attachment } from 'svelte/attachments';
import type { Camera } from './camera.svelte.ts';

const DRAG_THRESHOLD = 5;

export interface GestureOptions {
	camera: Camera;
	enabled: () => boolean;
	reduced: () => boolean;
}

export function gestures({ camera, enabled, reduced }: GestureOptions): Attachment<HTMLElement> {
	return (viewport) => {
		const pointers = new Map<number, { x: number; y: number }>();
		type Drag = { type: 'drag'; id: number; start: { x: number; y: number }; x0: number; y0: number; moved: boolean; samples: { t: number; x: number; y: number }[] };
		type Pinch = { type: 'pinch'; d0: number; m0: { x: number; y: number }; s0: number; x0: number; y0: number };
		let gesture: Drag | Pinch | null = null;
		let swallowClick = false;

		const local = (event: PointerEvent | WheelEvent) => {
			const frame = viewport.getBoundingClientRect();
			return { x: event.clientX - frame.left, y: event.clientY - frame.top };
		};

		const onWheel = (event: WheelEvent) => {
			if (!enabled() || !(event.ctrlKey || event.metaKey)) return;
			event.preventDefault();
			const p = local(event);
			camera.zoomBy(Math.exp(-event.deltaY * 0.0022), p.x, p.y);
		};

		const startPinch = () => {
			const [p, q] = [...pointers.values()];
			gesture = {
				type: 'pinch',
				d0: Math.max(1, Math.hypot(q.x - p.x, q.y - p.y)),
				m0: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 },
				s0: camera.s.current,
				x0: camera.x.current,
				y0: camera.y.current
			};
			for (const id of pointers.keys()) {
				try {
					viewport.setPointerCapture(id);
				} catch {
					/* pointer already gone */
				}
			}
			viewport.classList.add('is-dragging');
			swallowClick = true;
		};

		const onDown = (event: PointerEvent) => {
			if (!enabled() || (event.pointerType === 'mouse' && event.button !== 0)) return;
			if ((event.target as Element).closest('.bench-detail, .bench-panel')) return;
			pointers.set(event.pointerId, local(event));
			if (pointers.size === 1) {
				const p = local(event);
				gesture = { type: 'drag', id: event.pointerId, start: p, x0: camera.x.current, y0: camera.y.current, moved: false, samples: [{ t: event.timeStamp, ...p }] };
			} else if (pointers.size === 2 && event.pointerType !== 'mouse') {
				startPinch();
			}
		};

		const onMove = (event: PointerEvent) => {
			if (!pointers.has(event.pointerId) || !gesture) return;
			const p = local(event);
			pointers.set(event.pointerId, p);
			if (gesture.type === 'drag') {
				if (event.pointerId !== gesture.id) return;
				const dx = p.x - gesture.start.x;
				const dy = p.y - gesture.start.y;
				if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
				if (!gesture.moved) {
					gesture.moved = true;
					viewport.setPointerCapture(event.pointerId);
					viewport.classList.add('is-dragging');
				}
				gesture.samples.push({ t: event.timeStamp, ...p });
				if (gesture.samples.length > 6) gesture.samples.shift();
				const next = { x: gesture.x0 + dx, y: gesture.y0 + dy, s: camera.s.current };
				if (reduced()) camera.moveTo(next, { instant: true });
				else camera.follow(next);
			} else if (pointers.size >= 2) {
				const [a, b] = [...pointers.values()];
				const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
				const s = Math.min(1.8, Math.max(0.25, (gesture.s0 * Math.hypot(b.x - a.x, b.y - a.y)) / gesture.d0));
				// Keep the plane point that was under the starting midpoint under the fingers.
				const px = (gesture.m0.x - gesture.x0) / gesture.s0;
				const py = (gesture.m0.y - gesture.y0) / gesture.s0;
				camera.moveTo({ x: m.x - px * s, y: m.y - py * s, s }, { instant: true });
			}
		};

		const onEnd = (event: PointerEvent) => {
			if (!pointers.has(event.pointerId)) return;
			pointers.delete(event.pointerId);
			if (!gesture) return;
			if (gesture.type === 'drag' && event.pointerId === gesture.id) {
				if (event.type === 'pointercancel' && gesture.moved) {
					// The browser took the gesture as a vertical page scroll: undo
					// the few pixels the bench panned before it did.
					camera.moveTo({ x: gesture.x0, y: gesture.y0, s: camera.s.current }, { instant: true });
				} else if (gesture.moved) {
					swallowClick = true;
					const first = gesture.samples[0];
					const last = gesture.samples[gesture.samples.length - 1];
					const dt = Math.max(16, last.t - first.t);
					if (reduced() || event.timeStamp - last.t > 90) camera.moveTo(camera.target);
					else camera.release(((last.x - first.x) / dt) * 1000, ((last.y - first.y) / dt) * 1000);
				}
				gesture = null;
			} else if (gesture.type === 'pinch' && pointers.size < 2) {
				gesture = null;
			}
			if (!gesture) {
				viewport.classList.remove('is-dragging');
				setTimeout(() => (swallowClick = false), 0);
			}
		};

		// A gesture that moved swallows the click it would otherwise end with.
		const onClick = (event: MouseEvent) => {
			if (!swallowClick) return;
			swallowClick = false;
			event.preventDefault();
			event.stopPropagation();
		};

		// Fragment navigation and keyboard focus can scroll an overflow:hidden
		// box; the view moves by transform only, so keep the box at 0,0.
		const onScroll = () => {
			viewport.scrollTop = 0;
			viewport.scrollLeft = 0;
		};

		viewport.addEventListener('wheel', onWheel, { passive: false });
		viewport.addEventListener('pointerdown', onDown);
		viewport.addEventListener('pointermove', onMove);
		viewport.addEventListener('pointerup', onEnd);
		viewport.addEventListener('pointercancel', onEnd);
		viewport.addEventListener('click', onClick, true);
		viewport.addEventListener('scroll', onScroll);
		return () => {
			viewport.removeEventListener('wheel', onWheel);
			viewport.removeEventListener('pointerdown', onDown);
			viewport.removeEventListener('pointermove', onMove);
			viewport.removeEventListener('pointerup', onEnd);
			viewport.removeEventListener('pointercancel', onEnd);
			viewport.removeEventListener('click', onClick, true);
			viewport.removeEventListener('scroll', onScroll);
		};
	};
}
