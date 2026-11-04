// Browser capabilities, read when something happens (never during render, so
// prerendered HTML and the first client render always match).

import { prefersReducedMotion } from 'svelte/motion';

export const reducedMotion = () => prefersReducedMotion.current;

/** Touch-first device: the primary pointer is a finger and cannot hover. */
export const coarsePointer = () =>
	typeof matchMedia === 'function' && matchMedia('(hover: none) and (pointer: coarse)').matches;

export const saveData = () =>
	typeof navigator !== 'undefined' && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

/** `:focus-visible` with a fallback for engines that throw on the selector. */
export function keyboardFocus(el: Element) {
	try {
		return el.matches(':focus-visible');
	} catch {
		return true;
	}
}
