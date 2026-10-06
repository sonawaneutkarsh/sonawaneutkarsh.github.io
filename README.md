# sonawaneutkarsh.github.io

Source for **https://sonawaneutkarsh.github.io**, my portfolio: projects, case studies, blog, and résumé.

Plain HTML, CSS, and a little JavaScript. No framework and no build step.

## Contents

| Path | What it is |
|---|---|
| `index.html` | Bio, filterable project list, experience, blog index |
| `projects/<name>/` | Case studies: Nytr (with a demo video), Talks, Clage, Devvy, ScholarAI |
| `blog/` | Posts (`hello-world/` only redirects to the first post) |
| `resume.pdf` | Résumé (built separately from LaTeX; the source is not in this repo) |
| `images/`, `videos/`, `icons/` | Screenshots, the Nytr demo, social icons |
| `styles.css`, `script.js` | Styles (light theme), project filter, contents scrollspy, copy-email button |

Project facts on the site (years, test counts, results) follow each project's own README.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **check**: validates the HTML (`html-validate`, rules in `.htmlvalidate.json`) and checks every internal link and asset (`scripts/check_links.py`).
2. **deploy**: publishes the site to GitHub Pages, only if the check passes.

Layout inspired by [Alisa Liu's site](https://alisawuffles.github.io/).
