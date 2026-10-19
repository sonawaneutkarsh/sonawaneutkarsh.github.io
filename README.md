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
| `feed.xml` | RSS 2.0 feed of published writing |
| `resume.pdf` | Résumé (built separately from LaTeX; the source is not in this repo) |
| `images/`, `videos/`, `icons/` | Screenshots, Nytr and Clage Studio demos, social icons |
| `styles.css`, `script.js` | Cream/sage editorial styles, contents scrollspy, copy-email button |
| `404.html`, `sitemap.xml`, `robots.txt` | Not-found page and crawler files |

Project facts on the site (years, test counts, results) follow each project's own README.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
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
npx --yes html-validate@10 index.html 404.html projects/*/index.html blog/index.html blog/*/index.html notebook/index.html
```

`check_preservation.py` compares complete article/case-study prose, dates, titles, original anchors, evidence targets and immutable asset bytes against the pre-redesign Git baseline. Shared template changes and resolved root-relative links are intentional. It needs only Python's standard library and the repository's Git history.

See [implementation and verification notes](docs/portfolio-v2/IMPLEMENTATION-NOTES.md) for screenshot evidence, asset provenance, the native reference pattern, and unresolved citation candidates. Planning documents and verification screenshots are excluded from Pages staging.

The V2 direction draws on the readable density and dated updates of [Sophie Wang’s site](https://www.sophielwang.com/); all illustrations and layouts here are original. The previous layout credited [Alisa Liu's site](https://alisawuffles.github.io/).

## Publishing writing and research notes

The RSS feed at `/feed.xml` lists only the public blog posts, newest first. When publishing another post, update the blog index, home Writing list, and `feed.xml`, then run `python3 scripts/check_feed.py`. RSS uses midnight UTC as the conventional timestamp for the original date-only publication records.

The separate `/notebook/` page is for intentionally published technical notes. Do not expose private current work, drafts, active research progress, or a "Now" section without specific approval.
