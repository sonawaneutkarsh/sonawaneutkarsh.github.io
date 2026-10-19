# Preservation audit — inspected repository

Baseline: **5f02a2344d3c5a80d3c406a76a3f36b359d28dab**, main as cloned October 19, 2026. Recent commits include exact Nytr article publication (5f02a23), blog homepage/Pages repair (b23b090), and removal of solo labels (08832d5). Do not undo these. Full tracked-file hashes and HTML IDs/references are in preservation-baseline.json; use that as the exhaustive inventory, including filenames not individually repeated below.

## Architecture and production safeguards

Plain HTML/CSS/JS, no build step. Current home `index.html`, shared `styles.css`, `script.js`; 404; `.nojekyll`; `robots.txt`; `sitemap.xml`; `.htmlvalidate.json`; `scripts/check_links.py`; `.github/workflows/deploy.yml`; README and videos/README.md. Keep no-framework operation and all HTML validation fixes. Production files are untouched by this documentation branch.

**Deployment trap:** workflow triggers main pushes, all PRs and manual dispatch. Deployment job is guarded only by `github.event_name != 'pull_request'`, so manually dispatching the workflow on a non-main branch can deploy it. Do not manually dispatch any workflow in this task. A normal push of this design branch does not match the main-only push trigger. Do not change settings, publish a Site, create a deployment or push to main. Future implementation should harden the deployment condition to also require `github.ref == 'refs/heads/main'` before any owner-approved release.

Existing staging is an explicit `cp` list, not a blanket repo publish. Keep docs/portfolio-v2 out of the Pages staging list; copying the docs should not expose internal plans in deployed site files. Future new root favicon.svg must be added explicitly. New subdirectories under `images/` and `/blog/index.html` are already covered by directory copying. Existing HTML validator glob omits a new `blog/index.html`; add it explicitly during implementation.

## Routes and content

| Existing URL / path | Preserve |
| --- | --- |
| `/` | Bio, class of 2028, Summer 2027 internship intent, all seven project entries, four experience entries, three blog links, contact information |
| `/#hero`, `/#projects`, `/#experience`, `/#blog` | Keep IDs and usable destinations after reordering |
| `/projects/nytr/` | Complete architecture, sync anchors/tombstones, Decimal calculations, policy versions, evidence, limitations, synthetic screenshot disclosure, source links; `#demo` |
| `/projects/clage/` | Studio features, current vs historical experiments, seed budgets, benchmark tables, figures, measurement caveats, evidence, limitations; `#demo` |
| `/projects/talks/` | Watch→phone pipeline, persistent queue, ACK deletion safety, watchdog, Notion retry, real-device caveats, test table, screenshots and source link |
| `/projects/devvy/` | Daemon/Discord IPC, arbitration/heartbeats, privacy table, release boundaries, screenshot and all source links |
| `/projects/scholarai/` | Exact team attribution vs author's three data scripts; 1,008 schemes and 384 dimensions; screenshots explicitly teammates' work; no automated test claim |
| `/blog/why-i-stopped-working-on-nytr-problems-and-lessons/` | Exact title **why i stopped working on nytr — problems and lessons.**, date **2026-10-15**, all original prose and project link |
| `/blog/code-is-cheap-execution-is-everything/` | Exact title **code is cheap, execution is everything.**, date **2026-10-13**, all original lowercase prose; file is currently a single HTML line with fewer metadata elements |
| `/blog/thoughts-on-slms-for-businesses/` | Exact title **thoughts on slm’s for businesses**, date **2026-10-03**, all original prose |
| `/blog/hello-world/` | Existing meta-refresh redirect and fallback link to `/blog/thoughts-on-slms-for-businesses/`; keep canonical target |
| `/resume.pdf` | Existing PDF bytes; no regeneration, editing or filename change |
| `/404.html` | Functional 404 page, noindex, root-relative CSS/favicon/navigation |

All original fragment IDs are recorded in JSON, including `content`, `demo-caption`, `screens`, `mine`, `team`, `problem`, `built`, `hard`, `decision`, `evidence`, `limits`, `presence`, `results`. Preserve IDs on the same semantically relevant content, not dummy invisible anchors at the bottom.

### Evidence that must survive the visual redesign

Treat numbers as **claims currently on the site**, not a fresh verification of upstream project results. This task inspected this repository, not all project repos. Do not update counts from chat memories.

- Nytr: 1,135 backend tests; 1,124 pass with Postgres, 11 private-fixture skips; 251 XCTest run locally, not CI; one dining location (Stacks Market); no Android/App Store release. Oct 15 post says development paused. Preserve the historical case study and clearly label its status rather than rewriting its history.
- Clage: 429 Python + 4 JS + 21 Playwright; OR/AND/XOR 5/5, sine 0/5 in current minimal-v1 budget; dense-random Studio ecosystem differs from benchmark setup. Historical XOR 4/5, figures and measurement caveats remain explicitly historical. No learned-foraging/intelligence claim. Preserve Soft Circuit video music credit and 600-frame/16 MiB recording limits.
- Talks: 57 XCTest cases in CI and watchOS build; actual paired-device/Apple Intelligence boundaries; full pipeline iOS 26 while project minimums differ; potential duplicate Notion page after a specific crash window; Xcode installation.
- Devvy: 26 test scripts, zero runtime npm dependencies; released macOS v4.0.x; Windows on main, v4.1.0 not yet released in the site's baseline. No silent “now released” claim without upstream verification. Privacy permits project basename but excludes full paths/prompts/code.
- MedClarity: 66 Vitest tests; code and live demo links; page-level citations checked against loaded PDFs.
- PyOpt: 40/40 correctness both variants, faster 29/40→36/40, median speedup 3.57×→5.65×, OOD base 9/10 vs LoRA 8/10. **13 of 40 prompts leaked from training; not clean held-out evidence. v1.2 split fixed, no retraining yet.** Keep the caveat adjacent to results.
- ScholarAI: finalist among 6,081+ participants, five-person team, 1,008 scheme rows; author's normalization/embeddings/ingestion only. No author credit for scraping, React UI, search/backend or LLM pipeline; no automated tests for these scripts.

### Existing experience and contact

Retain undergraduate researcher at Penn State Harrisburg advised by **Dr. Md Sultan Al Nahian**, original planned methods and evaluation; IEEE Technical Chair Sept 2026–present with prior technical-team year Sept 2025–Sept 2026 and workshops; ScholarAI data engineer June 2026; Glimpse founder/editor June 2024–Feb 2025 and 250+ readers.

Keep `utkarshsonawane@psu.edu`, `https://github.com/sonawaneutkarsh`, `https://www.linkedin.com/in/sonawaneutkarsh/`, `/resume.pdf`. Preserve original external code/demo/architecture/review links. The JSON records every actual target. No invented Google Scholar or research publication account.

## Assets and behavior

- Keep avatar.jpg even if the new home uses an illustration instead. Existing icons/email.png, github.png, linkedin.png can remain as source assets if text contact links replace their visual use.
- Keep all `images/projects/` screenshots and all original paths (Nytr, Talks, Clage, Devvy, ScholarAI), captions, intrinsic dimensions and demo poster images.
- Keep `videos/nytr-demo.mp4`, `videos/clage-studio-demo.mp4`, their controls/download links/preload behavior, and videos/README.md.
- Keep `images/og-image.png`, its 1200×630 sharing metadata unless an actual verified replacement is approved. Keep canonical URLs, descriptions, author, Open Graph and Twitter card metadata; add missing metadata to Oct 13 article during later implementation.
- Existing favicon.ico, favicon-32x32.png and apple-touch-icon.png may be replaced with the approved future companion mark at the same paths, never deleted leaving broken references.
- Preserve `initCopyEmail()` with clipboard feedback and mailto fallback; preserve `initTOC()` active section behavior. Improve accessibility/progressive enhancement as specified, without introducing content that requires JS to exist.
- Keep sitemap entries, canonical origin, robots sitemap declaration, 404 behavior and validation gates. Add `/blog/` to sitemap during implementation; do not retimestamp unmodified articles as if they were newly published.

## Known gaps / future editorial checks

- Current Nytr case study and some project counts may predate newer work described by the owner; do not “correct” them from memory in a design pass. Separate factual refresh from reskinning.
- Repository home dates research only to 2026. October start in the proposed updates is grounded in owner's supplied project context; exact day is intentionally omitted.
- Named podcast/X/Project Nanda mentions lack precise citation targets in existing prose. Do not invent footnotes.
- Current Oct 13 article has less metadata and no shared footer/skip link. Bring template parity without changing article body.
- Research has no standalone page/publication link. New home section is a description of in-progress work, not a publications list.
