// Routes and static/ must never claim the same URL.
// Run with: node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const REPO = resolve(import.meta.dirname, '..', '..');
const STATIC = join(REPO, 'static');
const ROUTES = join(REPO, 'src', 'routes');

function* files(dir: string): Generator<string> {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* files(path);
		else yield path;
	}
}
const posix = (path: string) => path.split(sep).join('/');

test('static/ and src/routes/ never write the same file into build/', () => {
	// A page route writes <dir>/index.html; an endpoint (+server) writes <dir>.
	// If both produced the same file, the build would keep one of them
	// silently, while the dev server (src/hooks.server.ts) serves the route.
	const written = new Map<string, string>();
	for (const file of files(ROUTES)) {
		const rel = posix(relative(ROUTES, file));
		const match = /^(?:(.*)\/)?\+(page|server)\.[a-z.]+$/.exec(rel);
		if (!match) continue;
		const dir = match[1] ?? '';
		assert.ok(!/[[(]/.test(dir), `${rel}: this check assumes routes without parameters or groups; extend it before adding one`);
		written.set(match[2] === 'page' ? (dir ? `${dir}/index.html` : 'index.html') : dir, rel);
	}
	assert.ok(written.has('index.html') && written.has('blog/index.html') && written.has('feed.xml'), 'routes were found');
	const clashes = [...files(STATIC)].map((file) => posix(relative(STATIC, file))).filter((rel) => written.has(rel));
	assert.deepEqual(clashes.map((rel) => `static/${rel} and src/routes/${written.get(rel)}`), []);
});
