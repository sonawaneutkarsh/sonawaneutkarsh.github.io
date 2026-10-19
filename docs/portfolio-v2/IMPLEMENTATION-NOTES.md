# Portfolio V2 implementation and verification

Implemented October 19, 2026 on `codex/portfolio-v2`, based on `design/portfolio-v2-spec-2026-10-19` (`ada03b5`). Main was `5f02a2344d3c5a80d3c406a76a3f36b359d28dab`, matching the supplied baseline. No merge, PR, Pages settings change, workflow dispatch, deployment or publication was performed.

## Result

- Plain static HTML/CSS/JS; cream/sage tokens and system Georgia prose. Shared static masthead, skip link, full favicon family and contact footer on every page, including redirect and 404.
- Homepage in the specified order: introduction, grouped updates, Nytr/Clage/Talks/Devvy, three smaller experiments, in-progress research, Elsewhere, all three dated writing links. Original home technical descriptions/results remain in native expandable details; PyOpt’s complete benchmark and leakage caveat remain visible together.
- Static `/blog/` index, original lowercase article titles/dates/prose, new metadata for Oct 13, unchanged hello-world redirect, and preserved `/#blog`.
- All five complete case studies, with sticky desktop contents, native mobile contents, synchronized active-link feedback, contained scrolling tables and code, original evidence/media/captions/credits/limitations.
- Original SVG notebook illustrations, optimized approved wordmark and SVG/PNG/ICO favicon. See ASSETS.md for provenance. No new generation or recreation of the signature.
- Native endnote styling and a documented repeated-reference pattern; no guessed citations in existing posts.
- CI now validates the blog index and preservation with full checkout history for the baseline comparison; Pages staging includes new root icons and still excludes docs. Deployment requires both a non-PR event and `refs/heads/main`.

## Verification performed

| Check | Result |
| --- | --- |
| Original internal-link baseline | 152 references, 11 HTML pages; passed before edits |
| Final internal links/assets | 313 references, 12 HTML pages; passed |
| `html-validate@10` on all 12 routes | Passed using unchanged validator rules |
| `scripts/check_preservation.py` | 8 full prose bodies, titles, original publication dates, evidence/source/media destinations, 48 original IDs; passed |
| Immutable SHA-256 checks | 23 source assets including résumé, portrait, screenshots, videos, social icons and OG image, plus the original Ideogram master; passed |
| Browser route/viewport sweep | 11 rendered routes × 6 viewports = 66 checks; no horizontal document overflow, missing images, missing shared landmarks, extra H1 or JS exceptions |
| Required screenshot sizes | Home, blog, long Nytr article, Nytr and Clage captured at 1440×1000, 1024×768, 768×1024, 390×844, 320×740; also checked at 1280×800 |
| 200% reflow equivalent | All 11 rendered routes checked at 720×500 CSS px with 2× device scale (equivalent reflow to a 1440×1000 viewport at 200%); passed |
| Keyboard/progressive enhancement | Skip link and visible focus, native details open/close, mobile TOC anchors, desktop scrollspy, all three static post links, expanded technical evidence with JS disabled; passed |
| Email | Correct clipboard payload and live success; forced clipboard denial produces live failure feedback and executes the mailto fallback. Native Email link always available |
| References | Temporary untracked local fixture, repeated callouts and every return anchor tested with JS disabled; long URL wraps at 390px. Fixture is outside the repo and never staged |
| Redirect | Original hello-world meta refresh reaches original SLM post with JS disabled; canonical and fallback preserved |
| Reduced motion | Emulated reduce; computed scroll behavior is `auto`, transitions disabled |
| Contrast | Ink/paper 13.43:1; muted/paper 5.48:1; sage and focus/paper 6.98:1; hover/paper 10.34:1. Lowest tested text combination is muted/sage-soft at 4.72:1. Pale rules and illustrations are decorative |
| Performance budget | Conservative sum of home HTML/CSS/JS, production wordmark and all six illustrations: about 119 KiB raw / 86 KiB gzipped; JS about 1.3 KiB gzipped; no downloaded fonts or home videos |
| Favicons | Actual 16/32/48px ICO frames; 16/32px PNG, SVG and opaque 180px Apple icon. Inspected on light/dark backgrounds |
| Workflow | Existing action versions and gates retained; main-only deploy guard parsed with PyYAML and the actual staging list copied into a temporary directory; deployment never invoked |

Browser verification used bundled Playwright/Chromium locally. The server ran at `127.0.0.1:8765` because port 8000 was already occupied. No browser/testing packages were added to the repository. The 200% check is a device-metric reflow simulation, not a claim of testing a physical device or every browser engine. External project facts/URLs were retained, not independently refreshed or exhaustively fetched.

Pixel review included the original-versus-production signature at 228px and 190px, all six illustrations at their desktop/mobile sizes, favicon curves and separate dot, desktop/tablet/narrow mobile headers, research status, serif prose, all case-study media layouts, mobile tables and 404. Refinements included adequate standalone link targets, responsive screenshot rows, synchronized duplicate TOC navigation, and clean favicon rasterization directly from the vector.

## Representative screenshots

- [Homepage, desktop 1440×1000](verification/home-desktop.png)
- [Homepage, mobile 390×844](verification/home-mobile.png)
- [Writing index, mobile](verification/blog-mobile.png)
- [Long article, desktop](verification/article-desktop.png)
- [Clage evidence table, mobile](verification/clage-table-mobile.png)

The complete viewport matrix was captured locally under `/tmp/portfolio-v2-qa/`. Representative evidence is committed here, outside the Pages staging list. Machine-readable browser results are in [browser-results.json](verification/browser-results.json).

## Reference pattern for future verified sources

Use native anchors with a unique callout ID for each occurrence, one source number reused, and a return link for every mention. This pattern intentionally contains no fabricated source URL or publication metadata:

```html
<p>First mention <sup><a id="ref-1-a" href="#fn-1" role="doc-noteref" aria-label="Reference 1">[1]</a></sup>.</p>
<p>Repeated mention <sup><a id="ref-1-b" href="#fn-1" role="doc-noteref" aria-label="Reference 1">[1]</a></sup>.</p>
<section role="doc-endnotes" aria-labelledby="references">
  <h2 id="references">References</h2>
  <ol>
    <li id="fn-1">
      <!-- Insert the verified author/organization, linked source title and verified date here. -->
      <a href="#ref-1-a" aria-label="Back to reference 1, first mention">↩</a>
      <a href="#ref-1-b" aria-label="Back to reference 1, second mention">↩</a>
    </li>
  </ol>
</section>
```

This is documentation, not a deployed citation. Omit the endnote section whenever there are no verified sources. Reference numbers follow order of first appearance. New external source links use the same tab by default.

## Editorial questions kept separate

Exact URLs for the Lucy Guo podcast, unnamed X post, and Project Nanda mention were not supplied. Existing words are preserved without invented references. The research is in progress; no paper, venue, dataset release, model ranking, clinical validation or unsupported publication link has been added. Project numbers remain baseline claims, including the Nytr historical case study and paused development status. Any factual refresh or source insertion needs a separate editorial decision.
