# Portfolio V3, Svelte experiment

A SvelteKit rebuild of Portfolio V3 (`feat/interactive-portfolio-v3` at `36fe033`) on the branch `experiment/svelte-portfolio-v3`. It keeps every URL, all content, the SEO tags, the RSS feed and Sunday publishing, and reworks the interactive parts with Svelte 5. It is an experiment for comparison: it is not merged into V3 or `main` and has never been deployed.

All numbers below come from GitHub Actions run [41679417255](https://github.com/sonawaneutkarsh/sonawaneutkarsh.github.io/actions/runs/41679417255) (Chromium 156, 5 runs per measurement, medians) unless a row says otherwise. The raw data is in [`compare/results.json`](compare/results.json).

## Recommendation

Keep the vanilla homepage. Adopt the Svelte version's data model and publishing, and decide on the explorer separately.

- **Homepage: vanilla is better.** For a page that is mostly text, the Svelte version ships 64 KB of gzipped JavaScript where V3 ships 19 KB. On the phone profile it becomes interactive at 1.16 s instead of 0.62 s, and first paint is about 80 ms later because the 20 preloaded modules compete with the CSS for bandwidth. The motion is richer (depth, the agent loop, the taped margin sketch), but V3's hero already had velocity-keeping springs and an idle loop that stops. The Svelte drawings could be ported back to V3's `motion.js` without the framework.
- **Content and publishing: Svelte is better.** `posts.json` is now the only list of posts: the homepage's latest three, `/blog/` and `/feed.xml` are generated from it, so they cannot drift apart. `projects.ts` replaces the project text that V3 kept twice (homepage and `/explore/`). The Sunday publisher writes JSON instead of splicing three HTML/XML files, and a test publishes a post and then builds the site.
- **Explorer and ADR walkthrough: a toss-up.** The Svelte explorer is easier to change (state, URL and rendering in one place), has no layout shift (V3: CLS 0.014) and adds lift, tilt and a spring camera. The cost is 55 KB gzip of JavaScript instead of 11 KB, for a page few visitors open.
- **GSAP and three.js: not justified anywhere on the site.** In the lab, the native version turns round smoothly mid-flight, stops requesting frames as soon as it settles, and costs no extra download. The GSAP + three.js version needs a 150 KB gzip chunk, reverses at constant speed, cannot draw its labels without a font pipeline, and keeps GSAP's ticker running for up to 2 s after it finishes.
- **Spring physics: V3's integrator is better.** Svelte's built-in `Spring` takes one step per frame, so the same preset behaves differently at 120 Hz than at 60 Hz (details below; [sveltejs/svelte#10717](https://github.com/sveltejs/svelte/issues/10717), open since March 2024). V3's spring uses fixed 4 ms substeps and behaves the same at any refresh rate.

If you want one site rather than a mix: stay on vanilla V3 and bring over `posts.json`, the generated feed and the publisher tests. That keeps the 19 KB homepage and gains the single content source, which is the main structural improvement here.

## Versions

| Package | Version |
|---|---|
| svelte | 5.57.3 |
| @sveltejs/kit | 3.1.1 |
| @sveltejs/adapter-static | 4.0.1 |
| @sveltejs/vite-plugin-svelte | 7.3.1 |
| vite | 8.3.5 |
| typescript | 6.0.3 (svelte-check does not support TypeScript 7 yet) |
| svelte-check | 4.7.8 |
| gsap | 3.15.0 (lab only) |
| three | 0.187.0 (lab only) |
| @playwright/test | 1.64.1 |
| html-validate | 10.17.0 |
| Node | 22.18 or newer (the unit tests run as TypeScript through Node's type stripping) |

The lockfile has 112 packages, 110 of them dev-only. `gsap` and `three` are the only runtime dependencies, and only the lab page loads them.

## How it is built

SvelteKit 3 with `adapter-static`. Every page is prerendered to plain HTML in `build/` (no server, no API, no database), and GitHub Pages serves that directory.

| URL | Source | JavaScript |
|---|---|---|
| `/` | `src/routes/+page.svelte` | hydrated |
| `/explore/` | `src/routes/explore/+page.svelte` | hydrated |
| `/notebook/adr-extraction-demo/` | `src/routes/notebook/adr-extraction-demo/+page.svelte` | hydrated |
| `/lab/motion/` | `src/routes/lab/motion/+page.svelte` (new, `noindex`, not linked, not in the sitemap) | hydrated |
| `/blog/` | `src/routes/blog/+page.svelte` with `csr = false` | none |
| `/feed.xml` | `src/routes/feed.xml/+server.ts`, prerendered | n/a |
| articles, case studies, `/notebook/`, `404.html`, images, videos, `resume.pdf`, `sitemap.xml` | `static/`, copied byte for byte | V3's `script.js` only |

- **Single content sources.** `src/lib/content/posts.json` (published posts), `projects.ts` (the homepage rows and the explorer), `site.ts` (identity, links), `bench.ts` (explorer layout), `adr.ts` (the walkthrough's synthetic examples).
- **Motion.** `src/lib/motion/springs.ts` defines spring presets for `svelte/motion`'s `Spring` in physical units. `clock.svelte.ts` is a playhead that ticks only while a sequence runs and fires cues that retarget the springs. Every hero object and project drawing is a pure function of its springs and playhead, so nothing runs once they settle.
- **Without JavaScript** every page reads fully: the prerendered HTML has all the text, the explorer is a list, and the walkthrough shows all six steps. Controls that need JavaScript are not shown until the page is interactive.
- **Before hydration.** An inline script in `/explore/` sets the camera position before the first paint, so hydration moves nothing (CLS 0 at every width).
- **URLs.** Every page, image, video and document V3 deployed is still at its URL. The only URLs that went away are V3's own modules (`/js/*.js` and `/css/{interactive,explore,adr-demo}.css`), which the bundles under `/_app/` replace; no page links to them and they were never on `main`. `check_content_parity.py` enforces this.
- **Kit settings.** `trailingSlash: 'always'` keeps V3's URLs. `prerender.crawl: false` with explicit entries means drafts can never be discovered. `version.pollInterval: 0`, but see Limitations.

## What changed from V3

**Hero objects.** The sentence is the same: "I build software, explore AI systems, do research, and write about what I learn." Each object plays a longer sequence:

- **AI systems:** the network gains depth, extra connections and signals, then reorganises into an agent loop (plan, act, check, with a tool call).
- **Software:** the code window becomes a watch and a phone, records, completes, then folds back (Talks).
- **Research:** a notebook page sends extracted drug/reaction pairs to a review tray. It never shows a causal arrow.

On wide screens (from about 1100 px, whenever the margin has 150 px free) a taped "margin sketch" grows out of a pencil leader drawn in the gutter. It never crosses the text column. V3 sprang a card out of the icon across the text. Medium screens animate the inline icon only, and phones play each icon once when the introduction comes into view. Keyboard focus does everything hover does. Reduced motion jumps to a still.

**Project drawings.** Each project has its own drawing and behaviour: Nytr unfolds, Clage grows, Talks transfers (watch, phone, Notion), Devvy reorganises around its daemon. There is no homepage video, no "muted" or "Diagram, not…" captions, the Writing list shows the latest three posts, and the Nytr lessons link stays without "Development paused". V3 had drawings for all four projects too; the Svelte versions add per-project motion.

**`/explore/`.** It has every V3 feature: filters, the detail panel with Previous/Next, drag, Ctrl/⌘ + wheel and button zoom, pinch, keyboard (Tab, Enter, Esc), list view, deep links (`?filter=`, `?view=`, `#project`), Back/Forward, a list by default on phones, and reduced motion. New: cards lift and tilt under the pointer, the camera is a spring that carries a drag's speed into a short coast, the panel slides in from the side it opens on, connectors draw in, and the list view hides filtered-out items (in V3 a filter had no visible effect in the list view, because its muted style only applied to the workbench).

**`/notebook/adr-extraction-demo/`.** The same six steps and three synthetic examples (clear report, two drugs, hedged report), the same short disclaimer, no model calls and no results. The step controls stay in place, the stage keeps its height (no scroll jumps), and the arrow keys step through. "Reported together, not shown to be caused." is now real text; V3 added it with CSS `content`, which screen readers and find-in-page could miss.

**`/lab/motion/`** is new. It shows the homepage's AI object built two ways (next section).

## GSAP and three.js

They are used only in variant B of `/lab/motion/`, in `src/lib/lab/advanced-scene.ts`. That module is loaded with a dynamic `import()` the first time B is shown, as one 577 KB (150 KB gzip) chunk. No other page requests it. `tests/e2e/routes.spec.ts` checks that none of the homepage's scripts contain three.js or GSAP, and `tests/e2e/lab.spec.ts` checks that the chunk loads only when B is shown.

- A paused GSAP timeline plays forward on hover or focus and reverses on exit. three.js renders only from the timeline's `onUpdate`, so nothing draws while it is idle.
- Unmounting B kills the timeline, disposes every geometry and material, and calls `renderer.forceContextLoss()`. Switching to "A only" removes the canvas.
- Without WebGL, or if the context is lost, B shows the SVG drawing and says so. Headless Firefox on CI has no WebGL, so the Firefox run exercises that path.

| Motion lab, Chromium on CI | A · native Svelte | B · GSAP + three.js |
|---|---|---|
| Extra script | none | 150 KB gzip, fetched when B first shows |
| Ready after first show | immediately | 133 ms (fetch, parse, WebGL set-up) |
| Frames drawn in one play | 145 | 309 (renders on every timeline update) |
| Frame gap while moving, mean / longest | 20.5 / 54.9 ms | 20.0 / 56.8 ms |
| Input to first frame | 3 ms | 22 ms |
| Frames requested in the 2 s after a run | 0 (asserted on every CI run) | 0 and 7 in two CI runs, 39 in a local run |
| Reversal mid-flight | keeps its speed and turns round | runs backwards at constant speed |
| Labels in the agent loop | yes | no (text in WebGL needs a font atlas or an HTML overlay) |

**Why B keeps ticking.** GSAP's ticker only checks whether it may sleep every 120 ticks (the `autoSleep` default; `Timeline.updateRoot` in `gsap-core.js`). After the timeline ends it keeps requesting empty frames until the next check, which is 0 to 2 s away depending on where the run ended. The meter starts counting 1 s after the last drawn frame, so it sees between 0 and about 60 of them. A's loop stops on the frame its springs settle.

## Measurements

The comparison script (`tests/compare/compare.mjs`) serves a checkout of `36fe033` and `build/` with the same GitHub-Pages-like server and measures both in the same browser. Desktop runs use a 1440×900 viewport, no throttling and a disabled cache, with responses uncompressed; gzip sizes are computed from the bytes at level 6. Read the desktop timings as relative, not as field data.

### Desktop

| Route | Build | JS raw / gzip (files) | Requests | First paint | Ready | CLS | JS heap |
|---|---|---|---|---|---|---|---|
| `/` | V3 | 63.0 / 19.4 KB (6) | 16 | 68 ms | 69 ms | 0 | 1.4 MB |
| `/` | Svelte | 165.5 / 64.0 KB (21) | 32 | 116 ms | 157 ms | 0 | 2.5 MB |
| `/explore/` | V3 | 34.4 / 11.3 KB (3) | 14 | 56 ms | 68 ms | 0.014 | 1.5 MB |
| `/explore/` | Svelte | 136.7 / 54.6 KB (19) | 28 | 112 ms | 134 ms | 0 | 2.9 MB |
| ADR walkthrough | V3 | 17.4 / 6.2 KB (3) | 7 | 88 ms | 67 ms | 0 to 0.016 | 1.3 MB |
| ADR walkthrough | Svelte | 115.6 / 46.2 KB (17) | 21 | 68 ms | 117 ms | 0 | 2.5 MB |
| `/blog/` | V3 | 4.4 / 1.4 KB (1) | 4 | 48 ms | 21 ms | 0 | 1.1 MB |
| `/blog/` | Svelte | none | 3 | 48 ms | 22 ms | 0 | 1.1 MB |
| articles, case studies | both | identical files | | | | | |

"Ready" is when the page's scripts have run: DOMContentLoaded for V3 (its modules are deferred), the end of hydration for Svelte. CSS is about 7 KB gzip on the interactive pages in both builds. CLS on V3's walkthrough and on the case studies, which are byte-identical in both builds, varies between 0 and 0.016 from run to run with image load timing; the Svelte explorer and walkthrough measured 0 in every run.

Idle cost: with the page left alone (a 2 s window starting 3 s after load), both builds request 0 animation frames on every route, with at most 1 ms of main-thread work. Neither build has an infinite CSS animation, so an idle page gives the GPU nothing to redraw. On the homepage the only idle difference is memory: 2.5 MB of JS heap against 1.4 MB.

### Phone profile

390×844 with touch, 4× CPU slowdown, a slow-4G link (150 ms round trip, 1.6 Mbit/s down, 750 kbit/s up) and gzip-compressed responses, as on GitHub Pages.

| Route | Build | Transferred (JS) | First paint | Ready | Blocking time | CLS |
|---|---|---|---|---|---|---|
| `/` | V3 | 252 KB (19 KB) | 532 ms | 616 ms | 23 ms | 0 |
| `/` | Svelte | 302 KB (64 KB) | 616 ms | 1158 ms | 87 ms | 0 |
| `/explore/` | V3 | 116 KB (11 KB) | 512 ms | 734 ms | 9 ms | 0 |
| `/explore/` | Svelte | 163 KB (55 KB) | 588 ms | 1050 ms | 52 ms | 0 |
| ADR walkthrough | V3 | 93 KB (6 KB) | 544 ms | 817 ms | 104 ms | 0 |
| ADR walkthrough | Svelte | 136 KB (46 KB) | 588 ms | 1054 ms | 197 ms | 0 |

Blocking time is the sum of each long task's time over 50 ms. The prerendered page is readable and its links work before "Ready". Hovering and the touch tour start after it.

The later first paint comes from bandwidth, not from rendering. In a local check (5 runs each, same profile), the Svelte homepage painted at 584 ms with JavaScript, 520 ms with JavaScript disabled, and 520 ms with its scripts held back 1.5 s. V3 painted at 500 ms. The 20 `modulepreload` requests share the slow link with the stylesheets.

### Hovering "AI systems" for 4 s

Measured over the 4 s hover plus 2.5 s after the pointer leaves, at 1440 px.

| | V3 | Svelte |
|---|---|---|
| `requestAnimationFrame` calls | 366 | 483 |
| Script time | 92 ms | 198 ms |
| Main-thread task time | 468 ms | 638 ms |
| Style recalculation / layout | 50 / 23 ms | 81 / 31 ms |
| Long animation frames | 0 | 0 |
| Frames requested after settling | 0 | 0 |

The Svelte sequence does more (depth, reorganisation into the loop, the margin sketch and its leader), so this is not identical work. Both stay well inside a frame budget.

### What the homepage's 64 KB is

Measured from the built chunks. The split inside the site's own code comes from source maps and is approximate.

- Svelte runtime: about 19 KB gzip.
- SvelteKit client (router, history, hydration bootstrap): about 15 KB.
- The site's own code: about 29 KB. That covers the hero objects, the four project drawings, the motion helpers, and the content data that hydration needs a second copy of (V3 sends it once, as HTML).

Kit cannot drop its router while keeping hydration (`csr = false` removes all JavaScript, as on `/blog/`), so about 35 KB is the fixed price of the framework on any interactive page.

### Springs at 60 Hz and 120 Hz

Svelte's `Spring` takes one step per animation frame and scales it by the frame's length (`node_modules/svelte/src/motion/spring.js`). The velocity change per frame does not shrink with the frame, so at 120 Hz the effective damping ratio is about √2 higher. V3's `js/motion.js` integrates in fixed 4 ms substeps. The table puts this branch's presets through both integrators: overshoot, and time to settle within 2 %.

| Preset (damping ratio) | Svelte 60 Hz | Svelte 120 Hz | V3 integrator, 60 or 120 Hz |
|---|---|---|---|
| POP (0.60) | 6.2 %, 317 ms | 0 %, 200 ms | 8.5 %, 350 ms |
| SOFT (0.75) | 1.1 %, 250 ms | 0 %, 367 ms | 2.5 %, 417 ms |
| CALM (0.95) | 0 %, 400 ms | 0 %, 475 ms | 0 %, 383 ms |
| DRIFT (0.55) | 10.8 %, 500 ms | 1.2 %, 233 ms | 12.3 %, 517 ms |
| CAMERA (0.90) | 0 %, 433 ms | 0 %, 542 ms | 0.1 %, 417 ms |

On a 120 Hz display (recent iPhones, MacBook Pros, many Android phones) the pop and drift overshoots that give the objects their character disappear, and the camera settles about 25 % later. The site keeps the native `Spring`, as the brief asked, and the presets are tuned at 60 Hz. V3's fixed-step spring is about 50 lines and could replace it if this version is adopted.

## Screenshots

Rendered on GitHub's Ubuntu runner. Georgia is not installed there, so serif text uses its fallback; macOS and Windows render Georgia.

Vanilla V3 next to Svelte, same browser and run ([`compare/`](compare/)):

| Scene | V3 | Svelte |
|---|---|---|
| Homepage, 1440 | [home-1440-vanilla](compare/home-1440-vanilla.png) | [home-1440-svelte](compare/home-1440-svelte.png) |
| AI systems, early | [home-ai-vanilla](compare/home-ai-vanilla.png) | [home-ai-svelte](compare/home-ai-svelte.png) |
| AI systems, end | [home-ai-end-vanilla](compare/home-ai-end-vanilla.png) | [home-ai-end-svelte](compare/home-ai-end-svelte.png) |
| Software | [home-software-vanilla](compare/home-software-vanilla.png) | [home-software-svelte](compare/home-software-svelte.png) |
| Research | [home-research-vanilla](compare/home-research-vanilla.png) | [home-research-svelte](compare/home-research-svelte.png) |
| AI systems at 1024 | [home-1024-ai-vanilla](compare/home-1024-ai-vanilla.png) | [home-1024-ai-svelte](compare/home-1024-ai-svelte.png) |
| Homepage, 390 | [home-390-vanilla](compare/home-390-vanilla.png) | [home-390-svelte](compare/home-390-svelte.png) |
| Talks drawing | [projects-talks-vanilla](compare/projects-talks-vanilla.png) | [projects-talks-svelte](compare/projects-talks-svelte.png) |
| Devvy drawing | [projects-devvy-vanilla](compare/projects-devvy-vanilla.png) | [projects-devvy-svelte](compare/projects-devvy-svelte.png) |
| Explorer | [explore-vanilla](compare/explore-vanilla.png) | [explore-svelte](compare/explore-svelte.png) |
| Explorer, project open | [explore-selected-vanilla](compare/explore-selected-vanilla.png) | [explore-selected-svelte](compare/explore-selected-svelte.png) |
| Explorer, 390 | [explore-390-vanilla](compare/explore-390-vanilla.png) | [explore-390-svelte](compare/explore-390-svelte.png) |
| Walkthrough, review step | [demo-review-vanilla](compare/demo-review-vanilla.png) | [demo-review-svelte](compare/demo-review-svelte.png) |
| Walkthrough, 390 | [demo-390-vanilla](compare/demo-390-vanilla.png) | [demo-390-svelte](compare/demo-390-svelte.png) |

The Playwright suites also save their own scenes in [`screenshots/`](screenshots/): every hero state, the four project drawings, the explorer at 1024, 900, 768, 390 and 320 px, the walkthrough at 390 and 320 px, the lab, and `firefox-*.png` from the Firefox run.

## Accessibility

- Keyboard focus lights a hero object exactly as hover does. Tab order follows reading order, and focus stays visible on every control (`tests/e2e/a11y.spec.ts`).
- Everything respects `prefers-reduced-motion`. Objects jump to one still, the explorer camera moves instantly, and sections do not rise in.
- Each page has one `main`, labelled regions and named controls. Decorative SVG is `aria-hidden`. The explorer and the walkthrough announce changes through `aria-live` status text.
- Without JavaScript nothing is hidden and no inert control is shown.
- The caution sentence on step 6 of the walkthrough is now real text (see above).

## Maintainability

- **Code size.** V3's interactive layer is about 5,000 lines: 2,302 of JavaScript, 1,246 of CSS, and 1,454 lines of the five pages that Svelte now generates. The Svelte source is 6,644 lines, of which the lab is 921, so about 5,700 for the same pages. It has types and component boundaries; V3 has none and needs no tooling.
- **Duplication.** V3 kept each project's text in both `index.html` and `explore/index.html`, and each post in three places. The Svelte version has one record for each.
- **Tooling cost.** V3 deploys by copying files and has no dependencies. This version needs `npm ci` (112 packages) and a 3 to 4 s `vite build`, and framework majors bring migrations (Kit 3 moved its configuration into `vite.config.js` and replaced `$lib` with a `#lib` subpath import). The CI check job takes about 75 s.
- **Tests.** V3's zero-dependency browser runners are replaced by Playwright (Chromium and Firefox from one suite) and node unit tests.

## Publishing

The Sunday workflow (`.github/workflows/publish_scheduled.yml`) still runs at 17:17 UTC on Sundays, and the publisher still decides by the date in America/New_York. When a post is due:

1. `scripts/publish_scheduled.py` checks every due draft first, moves it from `.publishing/posts/<slug>/` to `static/blog/<slug>/index.html`, prepends its record to `src/lib/content/posts.json`, and adds its URL to `static/sitemap.xml`.
2. The workflow builds the site, which regenerates the homepage's latest three, `/blog/` and `/feed.xml` from `posts.json`.
3. It runs every check (`npm run validate`) and only then commits, pushes to `main` and deploys `build/`.

Canonical URLs are unchanged. The feed generated from today's `posts.json` is byte-identical to V3's `feed.xml`. Drafts never enter `static/` or `posts.json` before their date, so a build cannot expose them. `tests/publishing/test_publish.py` (13 tests) covers due and future posts, catching up after missed Sundays, idempotent re-runs, dry runs, malformed drafts and daylight saving. One test publishes the 8 November essay into a copy of the repository and builds it.

## Tests

| Check | Result on CI |
|---|---|
| `npm run check` (svelte-check) | 0 errors, 0 warnings |
| HTML validation | 13 static and 5 generated pages valid |
| Links and assets | 542 internal references in 18 pages |
| RSS | 5 posts; links and dates match `/blog/` |
| V2 preservation | prose, titles, dates, anchors and asset bytes match the V2 baseline |
| V3 content parity | homepage, explorer, walkthrough and `/blog/` text, links and ids match `36fe033`; 75 files from `static/` byte-identical; all 90 files V3 deployed are in the build except its 10 JS/CSS modules |
| Unit tests (`node --test`) | 10 pass |
| Publishing tests | 13 pass |
| Playwright, Chromium | 71 pass |
| Playwright, Firefox (`@firefox` suites) | 12 pass |

The Playwright suites check content against V3, the hero objects at 1440, 1280, 1024, 900, 768, 390 and 320 px (nothing covered, no text movement, no horizontal overflow), keyboard paths, reduced motion, touch (emulated), the explorer's gestures, URL history and deep links, layout shift, the walkthrough's stable controls, the lab's lazy loading, WebGL fallback and disposal, and zero idle frames.

## Limitations

- No Safari or WebKit run, and touch is emulated in Chromium rather than tested on devices.
- Timings come from a local server in headless browsers on shared CI runners, so compare the two builds with each other, not with field data.
- SvelteKit 3 fetches `/_app/version.json` (27 bytes) whenever the tab regains focus or becomes visible, even with polling turned off. V3 makes no requests after load.
- The springs depend on refresh rate (see above).
- The three.js variant has no labels and runs only in the lab.

## Run it

```bash
npm ci
npm run dev           # development server
npm run build         # static site in build/
npm run preview       # serve build/ the way GitHub Pages does, on :4173
npm test              # svelte-check, build, every site check, unit, publishing and Playwright tests

# Compare with vanilla V3 (writes docs/portfolio-v3-svelte/compare/)
git worktree add --detach ../v3-vanilla 36fe033
VANILLA_ROOT=../v3-vanilla SCREENSHOTS=1 npm run compare
git worktree remove ../v3-vanilla
```

`npx playwright install chromium firefox` downloads the browsers the first time.

## How this branch was built

The sandbox that built this branch could not reach the npm registry. A temporary workflow, `.github/workflows/sandbox-deps.yml`, ran `npm install` on a GitHub runner and uploaded `node_modules`, the lockfile and Playwright's Chromium as a 3-day artifact. It was read-only, used no secrets and deployed nothing. It was deleted before review (commit "chore: remove the temporary sandbox dependency workflow"). The lockfile comes from that install.

Gordon Tu's site and repository (no license) were read for techniques only. No code, artwork or text was copied.
