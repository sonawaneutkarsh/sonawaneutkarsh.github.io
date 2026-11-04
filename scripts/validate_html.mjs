#!/usr/bin/env node
// Validate every HTML file in the build output with html-validate.
//
// Pages copied unchanged from static/ (case studies, articles, the notebook
// index, 404) are checked against .htmlvalidate.json, the same rules V2 and
// V3 used. Pages SvelteKit generates are checked against
// .htmlvalidate.generated.json, which differs only in formatting rules that
// Svelte's server renderer decides (see that file and docs/portfolio-v3-svelte/).
// Configs are applied explicitly (StaticConfigLoader) so neither set can
// leak into the other through html-validate's directory lookup.
//
//   node scripts/validate_html.mjs [build]

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { HtmlValidate, StaticConfigLoader, formatterFactory } from 'html-validate';

const ROOT = resolve(import.meta.dirname, '..');
const BUILD = resolve(ROOT, process.argv[2] ?? 'build');

function htmlFiles(dir) {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return name === '_app' ? [] : htmlFiles(path);
		return name.endsWith('.html') ? [path] : [];
	});
}

const files = htmlFiles(BUILD).sort();
const fromStatic = (file) => existsSync(join(ROOT, 'static', relative(BUILD, file)));
const groups = [
	{ name: 'static pages', config: '.htmlvalidate.json', files: files.filter(fromStatic) },
	{ name: 'generated pages', config: '.htmlvalidate.generated.json', files: files.filter((f) => !fromStatic(f)) }
];

const stylish = formatterFactory('stylish');
let failed = false;
for (const group of groups) {
	const config = JSON.parse(readFileSync(join(ROOT, group.config), 'utf8'));
	const validator = new HtmlValidate(new StaticConfigLoader(config));
	const reports = [];
	for (const file of group.files) reports.push(await validator.validateFile(file));
	const results = reports.flatMap((r) => r.results);
	const valid = reports.every((r) => r.valid);
	console.log(`${group.name}: ${group.files.length} files against ${group.config}: ${valid ? 'valid' : 'INVALID'}`);
	if (!valid) {
		failed = true;
		console.log(stylish(results));
	}
}
process.exit(failed ? 1 : 0);
