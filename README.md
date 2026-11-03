# sonawaneutkarsh.github.io

Source for **https://sonawaneutkarsh.github.io**, my portfolio: projects, case studies, blog, and résumé.

This branch (`experiment/svelte-portfolio-v3`) is an experimental SvelteKit version of Portfolio V3. Every page is prerendered to static HTML with `@sveltejs/adapter-static`, so GitHub Pages serves plain files: no server, API or database. The design notes, the comparison with vanilla V3 and the recommendation are in [docs/portfolio-v3-svelte/README.md](docs/portfolio-v3-svelte/README.md).

## Contents

| Path | What it is |
|---|---|
| `src/routes/+page.svelte` | Homepage: introduction, updates, projects, research, experience, writing |
| `src/routes/explore/` | "Explore my work": optional workbench of the published projects, with filters, pan/zoom and detail panels; the homepage list stays the primary route |
| `src/routes/notebook/adr-extraction-demo/` | Step-through illustration of an ADR extraction workflow on synthetic sentences (no model calls, data or results) |
| `src/routes/blog/` | Writing index, generated from `posts.json` (no JavaScript) |
| `src/routes/feed.xml/` | RSS 2.0 feed of published writing, generated from `posts.json` |
| `src/routes/lab/motion/` | Motion lab comparing native Svelte motion with GSAP + three.js (not linked, `noindex`) |
| `src/lib/content/` | The single sources of content: `posts.json` (published posts), `projects.ts`, `site.ts`, `bench.ts`, `adr.ts` |
| `src/lib/` | Components, hero objects, project drawings, explorer, motion helpers and styles |
| `static/` | Files served as they are: case studies (`projects/<name>/`), blog posts (`blog/<slug>/`), `notebook/`, images, videos, `resume.pdf`, `styles.css`, `script.js`, `404.html`, `sitemap.xml`, `robots.txt` |
| `.publishing/` | Scheduled Sunday drafts and `schedule.json` (never deployed) |
| `scripts/` | Sunday publisher and the site checks (HTML, links, feed, preservation, V3 content parity) |
| `tests/` | Playwright suites, node unit tests, publishing tests, and the V3 comparison script |
| `artifacts/website-history/` | Visual history gallery (`timeline.html`, 5 curated milestones, WebP/PNGs, `manifest.json`, `screenshot-audit.md`) |

`resume.pdf` is built separately from LaTeX; the source is not in this repo. Project facts on the site (years, test counts, results) follow each project's own README.

## Run locally

Needs Node 22.18 or newer.

```bash
npm ci
npm run dev        # development server
npm run build      # static site in build/
npm run preview    # serve build/ the way GitHub Pages does, on http://127.0.0.1:4173
```

## Test

```bash
npx playwright install chromium firefox   # first time only
npm test                                  # everything below, in order
```

| Command | What it checks |
|---|---|
| `npm run check` | svelte-check (types and Svelte diagnostics) |
| `npm run validate` | HTML validation of `build/`, internal links and assets, the RSS feed, V2 preservation, and content parity with vanilla V3 (`36fe033`) |
| `npm run test:unit` | Content and feed unit tests (`node --test`) |
| `npm run test:publishing` | Sunday publisher tests, including publishing a post and building the site |
| `npm run test:e2e` | Playwright: Chromium runs every suite, Firefox the `@firefox` ones; `SCREENSHOTS=1` saves scenes to `docs/portfolio-v3-svelte/screenshots/` |

To compare with vanilla V3:

```bash
git worktree add --detach ../v3-vanilla 36fe033
VANILLA_ROOT=../v3-vanilla SCREENSHOTS=1 npm run compare   # writes docs/portfolio-v3-svelte/compare/
git worktree remove ../v3-vanilla
```

## Deploy

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every pull request and on pushes to `main`:

1. **check**: `npm ci`, `npm run check`, `npm run build`, `npm run validate`, and the unit and publishing tests.
2. **deploy**: only for `refs/heads/main`, uploads the `build/` that passed the checks and publishes it to GitHub Pages. Pull requests and other branches cannot deploy.

[`.github/workflows/browser-tests.yml`](.github/workflows/browser-tests.yml) runs Playwright in Chromium and Firefox and the vanilla V3 comparison on pull requests and on `main`. It is read-only and uploads screenshots as workflow artifacts.

## Publishing writing

`src/lib/content/posts.json` is the only list of published posts. The homepage's latest three, `/blog/` and `/feed.xml` are all generated from it, and each article is a static page in `static/blog/<slug>/index.html`.

Sunday essays wait in `.publishing/posts/<slug>/` and are listed in `.publishing/schedule.json`. [`.github/workflows/publish_scheduled.yml`](.github/workflows/publish_scheduled.yml) runs on Sundays. When a post's date has arrived in America/New_York, `scripts/publish_scheduled.py` moves it into `static/blog/`, prepends its record to `posts.json` and adds it to `static/sitemap.xml`. The workflow then builds the site, runs every check, commits to `main` and deploys. Re-runs are idempotent, and drafts never reach the build before their date.

To publish a post by hand: add its page under `static/blog/<slug>/`, add its record at the top of `posts.json` (and its URL to `static/sitemap.xml`), then run `npm run build && npm run validate`. Older posts use midnight UTC as the RSS timestamp; scheduled ones use noon in New York.

The separate `/notebook/` page is for intentionally published technical notes. Do not expose private current work, drafts, active research progress, or a "Now" section without specific approval.

## Portfolio V3 interactions

V3 added motion on top of V2 without changing its content. This branch rebuilds those interactions in Svelte 5; the vanilla implementation and its notes are in [docs/portfolio-v3/README.md](docs/portfolio-v3/README.md) on `feat/interactive-portfolio-v3`.

- **Hero objects**: "software", "AI systems" and "research" in the introduction carry small original drawings that play on hover or keyboard focus. On wide screens a larger copy appears as a sketch in the right margin, so the text never moves. Touch screens play each object once, and a tap follows the link.
- **Project drawings**: each project row has its own animated drawing, played on hover, focus or its button. The homepage plays no video; demo videos stay on the case studies.
- **`/explore/`**: an optional workbench of the published projects by area. It keeps its filter, view and open project in the URL, so Back/Forward and deep links work.
- **`/notebook/adr-extraction-demo/`**: an illustrated walkthrough of the research workflow on synthetic examples.

Everything respects `prefers-reduced-motion` and reads as plain content without JavaScript.

## Portfolio V2

The implementation follows `docs/portfolio-v2/`: system serif typography, the owner-selected Ideogram signature, original SVG notebook illustrations, responsive case studies, a static blog index, and in-progress research. No remote fonts or analytics.

`scripts/check_preservation.py` (part of `npm run validate`) compares complete article and case-study prose, dates, titles, original anchors, evidence targets and immutable asset bytes in `build/` against the pre-redesign Git baseline. Shared template changes and resolved root-relative links are intentional. It needs only Python's standard library and the repository's Git history.

See [implementation and verification notes](docs/portfolio-v2/IMPLEMENTATION-NOTES.md) for screenshot evidence, asset provenance, the native reference pattern, and unresolved citation candidates. Planning documents and verification screenshots are never deployed.

The V2 direction draws on the readable density and dated updates of [Sophie Wang’s site](https://www.sophielwang.com/); all illustrations and layouts here are original. The previous layout credited [Alisa Liu's site](https://alisawuffles.github.io/).

## Visual history gallery

A reconstructed visual timeline of the website's evolution from August 2026 through October 2026 is published in [`artifacts/website-history/`](artifacts/website-history/):
- **Gallery**: [`artifacts/website-history/timeline.html`](artifacts/website-history/timeline.html) (standalone responsive HTML visual gallery)
- **Audit**: [`artifacts/website-history/screenshot-audit.md`](artifacts/website-history/screenshot-audit.md) (full 79-commit audit report and milestone analysis)
- **Manifest**: [`artifacts/website-history/manifest.json`](artifacts/website-history/manifest.json) (machine-readable metadata for all 5 curated versions)
- **Screenshots**: [`artifacts/website-history/screenshots/`](artifacts/website-history/screenshots/) (1440px lossless PNGs) and [`artifacts/website-history/webp/`](artifacts/website-history/webp/) (optimized WebP derivatives)
