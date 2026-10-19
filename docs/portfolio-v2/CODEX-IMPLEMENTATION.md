# Codex implementation handoff

## Copy-paste task prompt

**NEW conversation for implementation**, using the same repository workspace. Follow-up implementation fixes should **CONTINUE** that conversation. An independent audit should use a **NEW conversation** afterward. Do not consume more Work usage preparing another design exploration; this package resolves visual decisions.

Suggested worker configuration: **GPT-6.1 Sol, Medium reasoning** if available in the user's model picker; High only for a difficult unresolved implementation issue. This is a task suggestion, not a claim about model pricing, availability or subscription allowance. Use the user's available subscription and no paid API keys. No subagents needed.

> Implement Portfolio V2 in `sonawaneutkarsh/sonawaneutkarsh.github.io` using the approved repository design package at `docs/portfolio-v2/`. First read README.md, DESIGN-SPEC.md, ASSETS.md, PRESERVATION.md and CODEX-IMPLEMENTATION.md, and inspect the baseline JSON. These are the source of truth for the agreed visual direction. Keep plain HTML/CSS/JS and GitHub Pages. Use the official second Ideogram `utkarsh.` image already committed under docs/portfolio-v2/assets; do not regenerate it or ask me to draw anything.
>
> My prior authorization was only to prepare the specification. Treat this implementation prompt as approval to implement on a new branch only. It does NOT approve merge, deployment or publication. Start from the design branch containing the package, create a separate implementation branch and do not touch main. Inspect repository instructions and current changes before editing. Complete and validate the design described by the package, including home, static blog index, research section, original simple SVG notebook illustrations, favicon family, existing article/case-study styling, reference support, preservation and accessibility. No external design platform/account or framework is required.
>
> Preserve all existing article bodies, dates, URLs, fragment anchors, case studies, media, captions, metadata, contact destinations, résumé bytes, scientific caveats, team attribution and original source links. Use baseline repo claims until separately verified; no silent fact refresh from memory. Preserve prior removal of “Solo project” labels. Keep all three blog posts linked from home and /blog/; keep hello-world redirect. Add citation mechanics but do not guess the unsupplied podcast/X sources or add unsupported footnotes.
>
> Work autonomously through reversible implementation and checks. Do not merge, push main, dispatch deployment workflows, change Pages settings or publish anything. You may save your completed implementation branch to GitHub. Do not open a PR without approval. Present screenshots and a concise change/validation summary with the implementation branch link and any unresolved factual/citation questions. Stop for my review before release.

## Ordered execution checklist

1. Read applicable AGENTS.md; inspect git status and origin refs. Resolve the spec branch from its repository name, not an assumed default branch. This package was first saved on `design/portfolio-v2-spec-2026-10-19`. Fetch it and check out a new branch such as `feat/portfolio-v2` based on it. Do not reset uncommitted work. Note current upstream main; if it has advanced, preserve later fixes and refresh baseline deliberately rather than overwriting them.
2. Record baseline internal link validation. Parse baseline JSON to understand all existing IDs/targets. Keep HTML body text snapshots of the three posts and complete case studies for later comparison; compare semantic article text, not raw HTML whitespace, after restyling. A changed caveat is content change even if the page still validates.
3. Create site tokens and wrapper/navigation components in existing files. Since there is no build system, reuse small consistent static markup across pages, not runtime-fetched components. Scope home selectors to prevent case-study/table regressions.
4. Copy approved wordmark source to a production image path and optimize only as permitted. Author the six SVGs and favicon vector/PNG/ICO family per ASSETS.md. Review visually at actual sizes before wiring paths. Retain original source bytes under docs.
5. Implement home in exact specified order: masthead, intro, updates, projects, research, experience, writing, footer. Keep all home anchor IDs and existing information reachable; short row summaries can expose full technical detail using native details. Preserve numerical caveats adjacent to results, especially PyOpt. No made-up update events or publications.
6. Add static `/blog/index.html`; retain three original routes and redirect route. Update old `← Blog` links to the new landing page while keeping /#blog usable. Apply shared header/footer/favicon/metadata and typography to posts without editorial changes. Add accessible reference/endnote CSS and a validated component pattern. If no verified source is supplied for an old post, omit its References section. Test the component in a temporary local fixture outside tracked/deployed files, never publish placeholder citations.
7. Restyle all five case studies and 404. Preserve every case-study target ID, screenshot, caption, table, source link, audio/music credit, video controls/posters/downloads and evidence limitation. Keep desktop TOC, mobile native expandable contents and existing script functionality.
8. Preserve crawler files and add /blog/ sitemap entry. Add missing metadata to Oct 13 article. Keep original publication dates; only use real modification dates. Update README and asset documentation with actual implementation choices/provenance.
9. Update CI checks to include new blog landing page and any new HTML routes, and staging to include new root favicon.svg (and 16px PNG if linked). Preserve current gate checks and action versions. Harden deploy condition to `github.event_name != 'pull_request' && github.ref == 'refs/heads/main'`. Do not dispatch or run deploy as a test. Keep planning docs out of staged Pages output.
10. Validate, review at the specified viewport sizes, compare baseline preservation, then commit only intended implementation changes on the feature branch. Push only that branch if requested by this prompt, summarize for review and stop before PR, merge or publication.

## Required checks and evidence

Run from repository root:

```sh
python3 scripts/check_links.py
npx --yes html-validate@10 index.html 404.html projects/*/index.html blog/index.html blog/*/index.html
python3 -m http.server 8000 --bind 127.0.0.1
```

The third command is for local visual review; stop the server afterward. If network blocks the validator download, report it honestly and use an already-installed copy if available. Do not change the validator rules merely to pass.

Required meaningful verification, not a new exhaustive unit-test suite for CSS:

- All 11 existing HTML pages plus new blog index load locally; original routes/anchors and hello-world redirect resolve; links checker passes. Root favicon files and SVG icon exist and each page references correct paths.
- Compare post prose, titles, timestamps and complete project content against baseline. No missing limitation, number, source target, demo fallback, team credit or caption. Track intentional template changes separately. `resume.pdf`, original screenshot/video assets and immutable wordmark master keep baseline hashes.
- Header and footer on every page, skip link, semantic landmarks, one H1, keyboard focus, TOC open/close and scrollspy, all footnote forward/backlinks, email mailto/copy success/failure, reduced motion and JS-disabled navigation/content.
- Numeric contrast checks for text/link/focus combinations; decorative rules excluded appropriately. No horizontal document overflow at 320px, 390px, 768px, 1024px, 1440px or 200% zoom. Tables/code blocks may scroll within their own wrapper.
- Capture local screenshots at sizes in DESIGN-SPEC.md. Review actual pixels for wordmark edges, cropped strokes, mobile nav wrap, favicon 16/32px recognition, serif rendering, research status and article line length. Do not call an unrendered design “verified”.
- Preserve no-framework/no-build behavior and check target resource budgets. Videos must not auto-download fully on homepage. Use existing tools; do not introduce a dependency suite merely for this reskin.
- Validate YAML deployment guard by inspection or an available YAML parser. Never invoke workflow_dispatch, Pages publish, gh workflow run or a deploy command. Verify staging list includes all referenced new root assets and no docs.
- Final git diff should show intended site files and asset additions, with no unrelated change. Do not update resume bytes or old publication dates. Report checks actually run, any blocked checks and residual uncertainties.

## Review response expected from implementing Codex

Provide implementation branch and commit link; 3–5 representative screenshots; concise description of what changed; validation results; preservation findings; unresolved exact citation sources if any. State explicitly that main was not changed and no deployment/publication occurred. Then wait for owner review. Do not assume the owner's approval of the specification also approves release.
