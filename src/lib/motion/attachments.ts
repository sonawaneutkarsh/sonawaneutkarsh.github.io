// Attachments ({@attach ...}) for behaviour that only exists in the browser.

import type { Attachment } from 'svelte/attachments';
import { reducedMotion } from './environment.ts';

/** Call `fn(visible)` whenever the element enters or leaves the viewport. */
export function inView(fn: (visible: boolean) => void, rootMargin = '0px'): Attachment<Element> {
	return (el) => {
		if (!('IntersectionObserver' in window)) {
			fn(true);
			return;
		}
		const observer = new IntersectionObserver((entries) => entries.forEach((e) => fn(e.isIntersecting)), { rootMargin });
		observer.observe(el);
		return () => observer.disconnect();
	};
}

/**
 * Sections below the fold rise in once, as in V3. Nothing is hidden unless
 * motion is allowed, the page was not opened at a fragment, and the element
 * starts below the fold, so no-JS, reduced-motion and deep-link visitors see
 * everything at once and nothing visible ever blinks out.
 */
export const reveal: Attachment<HTMLElement> = (el) => {
	if (reducedMotion() || !('IntersectionObserver' in window) || location.hash) return;
	if (el.getBoundingClientRect().top <= window.innerHeight * 0.92) return;
	el.classList.add('is-pending');
	const show = () => el.classList.remove('is-pending');
	const observer = new IntersectionObserver(
		(entries) => {
			if (entries.some((e) => e.isIntersecting)) {
				show();
				observer.disconnect();
			}
		},
		{ rootMargin: '0px 0px -8% 0px' }
	);
	observer.observe(el);
	// In-page jumps, find-in-page and printing show everything at once.
	window.addEventListener('hashchange', show, { once: true });
	window.addEventListener('beforeprint', show, { once: true });
	return () => {
		observer.disconnect();
		window.removeEventListener('hashchange', show);
		window.removeEventListener('beforeprint', show);
	};
};
