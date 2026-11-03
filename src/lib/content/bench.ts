// Layout of the /explore/ workbench: a fixed 1200×820 plane with one dashed
// zone per area. Card positions live with each project in projects.ts.

import type { Area } from './projects.ts';

export const PLANE = { width: 1200, height: 820 } as const;

export const ZONES: { area: Area; label: string; box: [number, number, number, number] }[] = [
	{ area: 'ai', label: 'AI & machine learning', box: [40, 40, 520, 400] },
	{ area: 'apps', label: 'Applications', box: [600, 40, 560, 400] },
	{ area: 'systems', label: 'Systems & developer tools', box: [40, 480, 360, 300] },
	{ area: 'research', label: 'Research', box: [440, 480, 360, 300] },
	{ area: 'other', label: 'Other experiments', box: [840, 480, 320, 300] }
];

/** Card width on the plane, as in V3. */
export const CARD_WIDTH = 190;
