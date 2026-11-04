// Site-wide constants shared by every Svelte route. The static case studies
// and articles in static/ carry the same values in their own HTML.

export const SITE = {
	origin: 'https://sonawaneutkarsh.github.io',
	name: 'Utkarsh Sonawane',
	ogImage: 'https://sonawaneutkarsh.github.io/images/og-image.png',
	ogImageAlt: 'Utkarsh Sonawane — portfolio',
	writingDescription: 'Notes on building software, learning AI, and figuring things out.',
	email: 'utkarshsonawane@psu.edu',
	github: 'https://github.com/sonawaneutkarsh',
	linkedin: 'https://www.linkedin.com/in/sonawaneutkarsh/',
	resume: '/resume.pdf',
	advisor: { name: 'Dr. Md Sultan Al Nahian', href: 'https://sites.google.com/view/sultanalnahian/home' }
} as const;

/** Primary navigation, in the order every page has always shown it. */
export const NAV = [
	{ href: '/#projects', label: 'Projects', section: ['/projects/', '/explore/'] },
	{ href: '/notebook/', label: 'Research notebook', section: ['/notebook/'] },
	{ href: '/blog/', label: 'Blog', section: ['/blog/'] },
	{ href: '/resume.pdf', label: 'Résumé ↗', section: [] }
] as const;

/**
 * The nav link a path belongs to, with the same rule as script.js's
 * initNavState on the static pages: `page` on the section's own index,
 * `true` anywhere inside it.
 */
export function navCurrent(pathname: string, link: (typeof NAV)[number]): 'page' | 'true' | undefined {
	const prefix = (link.section as readonly string[]).find((p) => pathname.startsWith(p));
	if (!prefix) return undefined;
	return pathname === prefix ? 'page' : 'true';
}
