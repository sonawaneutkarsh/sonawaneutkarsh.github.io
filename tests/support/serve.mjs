#!/usr/bin/env node
// Serve a built site the way GitHub Pages does (see server.mjs).
//   node tests/support/serve.mjs [dir=build] [port=4173]
import { serve } from './server.mjs';

const [dir = 'build', port = '4173'] = process.argv.slice(2);
const server = await serve(dir, Number(port));
console.log(`Serving ${dir} at http://127.0.0.1:${server.address().port}/`);
