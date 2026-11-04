# sonawaneutkarsh.github.io

Source for **https://sonawaneutkarsh.github.io**, my portfolio: projects, case studies, blog, and résumé.

Plain HTML, CSS, and a little JavaScript. No framework and no build step.

## Contents

| Path | What it is |
|---|---|
| `index.html` | Introduction, updates, projects, research, experience, writing |
| `projects/<name>/` | Case studies: Nytr and Clage (with demo videos), Talks, Devvy, ScholarAI |
| `blog/` | Writing index and the published posts (`hello-world/` redirects to the first post) |
| `content/posts.json` | The only list of published posts. The homepage's latest three, `/blog/`, `feed.xml` and the sitemap's post URLs are generated from it (not deployed) |
| `.publishing/` | Sunday drafts and their schedule, released by `scripts/publish_scheduled.py` (not deployed) |
| `notebook/` | Public research notebook index (nothing unpublished or in progress exposed) |
| `notebook/adr-extraction-demo/` | Step-through illustration of an ADR extraction workflow on synthetic sentences (no model calls, data or results) |
| `explore/` | "Explore my work": optional workbench view of the published projects, with filters, pan/zoom and detail panels; the homepage list stays the primary route |
| `feed.xml` | RSS 2.0 feed of published writing |
| `resume.pdf` | Résumé (built separately from LaTeX; the source is not in this repo) |
| `images/`, `videos/`, `icons/` | Screenshots, Nytr and Clage Studio demos, social icons |
| `styles.css`, `script.js` | Cream/sage editorial styles, contents scrollspy, copy-email button, nav section state |
| `css/`, `js/` | V3 interactions as ES modules, loaded only by the pages that use them (homepage, explorer, ADR walkthrough) |
| `tests/e2e/` | Zero-dependency browser regression tests and performance probe (Chrome over DevTools protocol) |
| `tests/content/` | Standard-library tests for the content pipeline and the Sunday publisher, run on scratch copies |
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

- **Illustrated portrait**: an original inline SVG drawing of me leads the introduction (a small byline beside the name on phones). On mouse hover it notices the pointer: the eyes follow, the head tilts slightly, the hair follows, it blinks, and the glasses catch a glint. It springs back when the pointer leaves. Touch screens get one greeting; reduced motion and no-JS visitors see the still drawing. See [docs/portfolio-v3/PORTRAIT.md](docs/portfolio-v3/PORTRAIT.md).
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

1. **check**: checks that the writing lists, feed and sitemap match `content/posts.json` (`scripts/build_writing.py --check`), validates the HTML (`html-validate`, rules in `.htmlvalidate.json`), checks every internal link and asset (`scripts/check_links.py`), the feed (`scripts/check_feed.py`) and preservation (`scripts/check_preservation.py`), then runs the content pipeline tests.
2. **deploy**: publishes to GitHub Pages only after checks pass and only for `refs/heads/main`. Pull requests and manual runs on other branches cannot deploy.

## Portfolio V2

The implementation follows `docs/portfolio-v2/`: system serif typography, the owner-selected Ideogram signature, original SVG notebook illustrations, responsive case studies, a static blog index, and in-progress research. No remote fonts, client framework, analytics, or build step.

```bash
python3 scripts/build_writing.py --check
python3 scripts/check_links.py
python3 scripts/check_feed.py
python3 scripts/check_preservation.py
npx --yes html-validate@10 index.html 404.html projects/*/index.html blog/index.html blog/*/index.html notebook/index.html notebook/*/index.html explore/index.html
python3 -m unittest discover -s tests/content -v
```

`check_preservation.py` compares complete article/case-study prose, dates, titles, original anchors, evidence targets and immutable asset bytes against the pre-redesign Git baseline. Shared template changes and resolved root-relative links are intentional. It needs only Python's standard library and the repository's Git history.

See [implementation and verification notes](docs/portfolio-v2/IMPLEMENTATION-NOTES.md) for screenshot evidence, asset provenance, the native reference pattern, and unresolved citation candidates. Planning documents and verification screenshots are excluded from Pages staging.

The V2 direction draws on the readable density and dated updates of [Sophie Wang’s site](https://www.sophielwang.com/); all illustrations and layouts here are original. The previous layout credited [Alisa Liu's site](https://alisawuffles.github.io/).

## Publishing writing and research notes

`content/posts.json` is the only list of published posts, newest first. `scripts/build_writing.py` generates the homepage's latest three posts, the `/blog/` archive, `/feed.xml` and the sitemap's post URLs from it. The generated files are committed, so the site stays plain static files with no build step for visitors. Edit `content/posts.json`, never the generated lists; they sit between `writing:latest` and `writing:archive` marker comments.

```bash
python3 scripts/build_writing.py           # regenerate after editing content/posts.json
python3 scripts/build_writing.py --check   # what CI runs: fails if anything is stale or inconsistent
```

- **Publish by hand:** add `blog/<slug>/index.html`, add its record at the top of `content/posts.json` (`slug`, `title`, `date`, `pubDate`, `description`), then run `python3 scripts/build_writing.py`. The record's title and date must match the article's `<h1>` and `<time class="date">`.
- **Schedule a Sunday post:** stage the article as `.publishing/posts/<slug>/index.html` and add its `date`, `slug`, `title` and `description` to `.publishing/schedule.json`. `.github/workflows/publish_scheduled.yml` runs `python3 scripts/publish_scheduled.py` every Sunday. That adds the record (RSS time: noon in New York), moves the draft into `blog/`, regenerates, checks everything, then commits and deploys. `python3 scripts/publish_scheduled.py --dry-run` shows what is due and whether it would pass. Use `--as-of YYYY-MM-DD` only on a copy.
- RSS keeps midnight UTC for the original date-only posts and noon New York for scheduled ones. Both are stored in `pubDate`, so feed times and GUIDs never change.

Details, data flow, tests and the V3 comparison: [docs/portfolio-v3/CONTENT-PIPELINE.md](docs/portfolio-v3/CONTENT-PIPELINE.md).

The separate `/notebook/` page is for intentionally published technical notes. Do not expose private current work, drafts, active research progress, or a "Now" section without specific approval.

## Visual history gallery

A reconstructed visual timeline of the website's evolution from August 2026 through October 2026 is published in [`artifacts/website-history/`](artifacts/website-history/):
- **Gallery**: [`artifacts/website-history/timeline.html`](artifacts/website-history/timeline.html) (standalone responsive HTML visual gallery)
- **Audit**: [`artifacts/website-history/screenshot-audit.md`](artifacts/website-history/screenshot-audit.md) (full 79-commit audit report and milestone analysis)
- **Manifest**: [`artifacts/website-history/manifest.json`](artifacts/website-history/manifest.json) (machine-readable metadata for all 5 curated versions)
- **Screenshots**: [`artifacts/website-history/screenshots/`](artifacts/website-history/screenshots/) (1440px lossless PNGs) and [`artifacts/website-history/webp/`](artifacts/website-history/webp/) (optimized WebP derivatives)

