// Connector curves between related projects, and where their labels go.
//
// Lines run from card centre to card centre under the (opaque) cards. Each
// label sits at the first point along its curve, trying from the middle
// outwards, where its box clears every card, every zone caption and every
// label already placed; if one line does not fit anywhere it tries the label
// split over two lines. The same rule as V3, measured with canvas text
// metrics instead of laid-out SVG.

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface Connector {
	from: string;
	to: string;
	label: string;
	d: string;
	/** Quadratic control point, for travelling signals. */
	a: [number, number];
	c: [number, number];
	b: [number, number];
	lines: string[];
	at: [number, number];
}

const overlaps = (a: Rect, b: Rect, pad = 0) =>
	a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

const TRIES = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.2, 0.8];
const LINE_HEIGHT = 14;

export function quad(a: [number, number], c: [number, number], b: [number, number], t: number): [number, number] {
	const u = 1 - t;
	return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

export function placeConnectors(
	links: { from: string; to: string; label: string }[],
	centers: Map<string, [number, number]>,
	obstacles: Rect[],
	measure: (text: string) => number
): Connector[] {
	const placed: Rect[] = [];
	const out: Connector[] = [];
	for (const link of links) {
		const a = centers.get(link.from);
		const b = centers.get(link.to);
		if (!a || !b) continue;
		const c: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 36];
		const words = link.label.split(' ');
		const layouts = [[link.label]];
		if (words.length > 1) {
			const half = Math.ceil(words.length / 2);
			layouts.push([words.slice(0, half).join(' '), words.slice(half).join(' ')]);
		}
		let chosen: { lines: string[]; at: [number, number]; box: Rect } | null = null;
		for (const lines of layouts) {
			const w = Math.max(...lines.map(measure)) + 8;
			const h = lines.length * LINE_HEIGHT + 4;
			for (const t of TRIES) {
				const p = quad(a, c, b, t);
				const box = { x: p[0] - w / 2, y: p[1] - h / 2, w, h };
				if (!obstacles.some((o) => overlaps(box, o, 4)) && !placed.some((o) => overlaps(box, o, 4))) {
					chosen = { lines, at: p, box };
					break;
				}
			}
			if (chosen) break;
		}
		if (!chosen) {
			const p = quad(a, c, b, 0.5);
			const w = measure(link.label) + 8;
			chosen = { lines: [link.label], at: p, box: { x: p[0] - w / 2, y: p[1] - 9, w, h: 18 } };
		}
		placed.push(chosen.box);
		out.push({
			...link,
			d: `M${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`,
			a,
			c,
			b,
			lines: chosen.lines,
			at: chosen.at
		});
	}
	return out;
}

export const LABEL_LINE_HEIGHT = LINE_HEIGHT;
