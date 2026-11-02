# sonawaneutkarsh.github.io

Source for **https://sonawaneutkarsh.github.io**, my portfolio: projects, case studies, blog, and résumé.

Plain HTML, CSS, and a little JavaScript. No framework and no build step.

## Contents

| Path | What it is |
|---|---|
| `index.html` | Introduction, updates, projects, research, experience, writing |
| `projects/<name>/` | Case studies: Nytr and Clage (with demo videos), Talks, Devvy, ScholarAI |
| `blog/` | Static writing index and three posts (`hello-world/` redirects to the first post) |
| `notebook/` | Public research notebook index (nothing unpublished or in progress exposed) |
| `notebook/adr-extraction-demo/` | Step-through illustration of an ADR extraction workflow on synthetic sentences (no model calls, data or results) |
| `explore/` | "Explore my work": optional workbench view of the published projects, with filters, pan/zoom and detail panels; the homepage list stays the primary route |
| `feed.xml` | RSS 2.0 feed of published writing |
| `resume.pdf` | Résumé (built separately from LaTeX; the source is not in this repo) |
| `images/`, `videos/`, `icons/` | Screenshots, Nytr and Clage Studio demos, social icons |
| `styles.css`, `script.js` | Cream/sage editorial styles, contents scrollspy, copy-email button, nav section state |
| `css/`, `js/` | V3 interactions as ES modules, loaded only by the pages that use them (homepage, explorer, ADR walkthrough) |
| `tests/e2e/` | Zero-dependency browser regression tests and performance probe (Chrome over DevTools protocol) |
| `404.html`, `sitemap.xml`, `robots.txt` | Not-found page and crawler files |
| `artifacts/website-history/` | Visual history gallery (`timeline.html`, 5 curated milestones, WebP/PNGs, `manifest.json`, `screenshot-audit.md`) |

Project facts on the site (years, test counts, results) follow each project's own README.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Portfolio V3 interactions

V3 adds motion on top of V2 without changing its content or architecture. See [docs/portfolio-v3/README.md](docs/portfolio-v3/README.md) for the full design and implementation notes.

- **Hero icons**: "software", "AI systems" and "research" in the introduction carry small original SVG drawings that animate on hover or keyboard focus. On wide screens a larger copy appears beside the intro, so the text never moves. Touch screens play each icon once, and a tap follows the link.
- **Project previews**: Nytr and Clage play their existing demo videos, muted, on hover, focus or the Preview button. Talks and Devvy show animated architecture diagrams. Videos are created only on demand.
- **`/explore/`**: an optional workbench of the published projects by area.
- **`/notebook/adr-extraction-demo/`**: an illustrated walkthrough of the research workflow on synthetic examples.

Everything respects `prefers-reduced-motion` and works as plain content without JavaScript. The explorer keeps its filter, view and open project in the URL, so Back/Forward and deep links work. Browser tests run on every pull request in `.github/workflows/browser-tests.yml` (Chrome and Firefox, read-only, no deploy).

```bash
node tests/e2e/run.mjs                 # browser regression tests (Node 22+, Chrome/Chromium; set CHROME_PATH if needed)
node tests/e2e/firefox.mjs             # Firefox smoke tests over WebDriver BiDi (set FIREFOX_PATH if needed)
SCREENSHOTS=1 node tests/e2e/run.mjs   # also refresh docs/portfolio-v3/screenshots/
node tests/e2e/perf.mjs                # page weight, paint timing, idle animation frames
```

## Deploy

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **check**: validates the HTML (`html-validate`, rules in `.htmlvalidate.json`) and checks every internal link and asset (`scripts/check_links.py`).
2. **deploy**: publishes to GitHub Pages only after checks pass and only for `refs/heads/main`. Pull requests and manual runs on other branches cannot deploy.

## Portfolio V2

The implementation follows `docs/portfolio-v2/`: system serif typography, the owner-selected Ideogram signature, original SVG notebook illustrations, responsive case studies, a static blog index, and in-progress research. No remote fonts, client framework, analytics, or build step.

```bash
python3 scripts/check_links.py
python3 scripts/check_feed.py
python3 scripts/check_preservation.py
npx --yes html-validate@10 index.html 404.html projects/*/index.html blog/index.html blog/*/index.html notebook/index.html notebook/*/index.html explore/index.html
```

`check_preservation.py` compares complete article/case-study prose, dates, titles, original anchors, evidence targets and immutable asset bytes against the pre-redesign Git baseline. Shared template changes and resolved root-relative links are intentional. It needs only Python's standard library and the repository's Git history.

See [implementation and verification notes](docs/portfolio-v2/IMPLEMENTATION-NOTES.md) for screenshot evidence, asset provenance, the native reference pattern, and unresolved citation candidates. Planning documents and verification screenshots are excluded from Pages staging.

The V2 direction draws on the readable density and dated updates of [Sophie Wang’s site](https://www.sophielwang.com/); all illustrations and layouts here are original. The previous layout credited [Alisa Liu's site](https://alisawuffles.github.io/).

## Publishing writing and research notes

The RSS feed at `/feed.xml` lists only the public blog posts, newest first. When publishing another post, update the blog index, home Writing list, and `feed.xml`, then run `python3 scripts/check_feed.py`. RSS uses midnight UTC as the conventional timestamp for the original date-only publication records.

The separate `/notebook/` page is for intentionally published technical notes. Do not expose private current work, drafts, active research progress, or a "Now" section without specific approval.

## Visual history gallery

A reconstructed visual timeline of the website's evolution from August 2026 through October 2026 is published in [`artifacts/website-history/`](artifacts/website-history/):
- **Gallery**: [`artifacts/website-history/timeline.html`](artifacts/website-history/timeline.html) (standalone responsive HTML visual gallery)
- **Audit**: [`artifacts/website-history/screenshot-audit.md`](artifacts/website-history/screenshot-audit.md) (full 79-commit audit report and milestone analysis)
- **Manifest**: [`artifacts/website-history/manifest.json`](artifacts/website-history/manifest.json) (machine-readable metadata for all 5 curated versions)
- **Screenshots**: [`artifacts/website-history/screenshots/`](artifacts/website-history/screenshots/) (1440px lossless PNGs) and [`artifacts/website-history/webp/`](artifacts/website-history/webp/) (optimized WebP derivatives)

