# Portfolio V2 design specification

## 1. Direction and scope

A personal engineering notebook with the clarity of an editorial profile. The site should feel like an individual who builds things, investigates how they work and writes honestly about the results. Personality comes from the approved calligraphy, a few useful hand-drawn objects and the voice of the existing writing. Avoid a SaaS landing-page aesthetic: no gradients, giant slogans, floating cards, skill meters, rotating carousels, animated backgrounds or repetitive pill buttons.

The reference, https://www.sophielwang.com/, was inspected on October 19, 2026. Its concise personal introduction, lightweight navigation and month-grouped updates are useful principles. Our composition differs: a sage calligraphic signature in the masthead, left-aligned notebook illustrations, a compact engineering catalogue and a research entry with explicit status. Never copy her illustrations, text or claimed accomplishments. The exact settings below are original design decisions.

Scope for later implementation: home, new `/blog/` index, all existing article and case-study visual styles, research section on home, favicon family, metadata and consistent navigation. Keep GitHub Pages and plain files. No new `/research/` page is needed for this release.

## 2. Color and typography — fixed decisions

| CSS token | Value | Use |
| --- | --- | --- |
| `--paper` | `#FCFAF0` | Entire page; sampled dominant background of the actual wordmark |
| `--ink` | `#282D27` | Body, headings, important labels |
| `--muted` | `#62685E` | Dates, captions, metadata; never lower opacity |
| `--sage` | `#455C47` | Links and primary interactive text |
| `--sage-hover` | `#2E4232` | Hover and pressed text |
| `--sage-soft` | `#E6EBDD` | Code inline background, light selected states |
| `--rule` | `#D8DDCF` | Decorative section dividers, never the only control boundary |
| `--focus` | `#455C47` | 2px outline with 3px paper offset |
| `--illustration-ink` | `#6B745D` | Decorative line art; does not carry body text |
| `--wash` | `#EDF0E5` | Small illustration fills, not full-screen panels |

No dark mode in V2. Do not recolor the approved raster wordmark; its olive/sage ink is its own asset color. Color tokens apply to site UI. Confirm normal text contrast at least 4.5:1 and focus/control boundaries 3:1 on their actual backgrounds; pale rules are decorative only. Selection: sage-soft background with ink text.

Use **system typography** to avoid font downloads, render delays and licensing work:

- Headings, article prose and intro: `Georgia, "Times New Roman", serif`.
- Navigation, project summaries, dates, captions and lists: `-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`.
- Code: `ui-monospace, "SFMono-Regular", Consolas, monospace`.
- Calligraphy: the supplied image only. Do not approximate it with a script font.

| Element | Desktop | Mobile (below 720px) | Weight / line-height |
| --- | --- | --- | --- |
| Main page H1 | 32px | 28px | 400 / 1.2 |
| Article H1 | 38px | 30px | 400 / 1.18; max 22ch |
| Section H2 | 26px | 24px | 400 / 1.25 |
| Entry H3 | 20px | 19px | 400 / 1.35 |
| Intro / article prose | 18px | 17px | 400 / 1.72 |
| General body / project summary | 16px | 16px | 400 / 1.65 |
| Navigation / dates / labels | 14px | 14px | 400 / 1.5 |
| Captions / footnotes | 14px | 14px | 400 / 1.6 |
| Code | 14px | 13px | 400 / 1.6 |

Use native sentence case for new UI labels. Existing lowercase post titles and article prose remain exactly as written. Headings use normal letter spacing; dates use tabular numerals. Links in prose are underlined by default, 1px thickness, 3px offset. Navigation and entry titles gain an underline on hover and focus; keyboard focus always has the visible outline. A color change alone must never identify a link inside prose.

## 3. Grid, spacing and responsive rules

- Site wrapper: `width: min(880px, calc(100% - 64px)); margin-inline: auto` at >=720px. At 1440px this begins at x=280px.
- Below 720px: `width: calc(100% - 40px)`, giving 20px side gutters (including at 320px). No fixed minimum width.
- Reading width: article prose max 640px, centered within wrapper. Home bio max 570px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 80px. Do not invent arbitrary card padding for each section.
- Main section separation 64px desktop / 48px mobile. Each H2 has 24px below it. Paragraph gap 16px. Section headers may use a small 32px notebook motif alongside the text, not a large decorative banner.
- Desktop intro: 180px illustration column + 40px gap + remaining 660px bio column. At <720px use one column; intro illustration 112px wide, below the bio and contact links.
- Updates / blog rows: 104px date column + 24px gap + remaining width. At <720px stack date above text with 4px gap.
- Projects use one column of rows, with a 128px thumbnail + 24px gap + text on >=720px. On mobile place a 96px illustration above the entry text; screenshots can use a full-width figure when needed.
- Wide case studies: up to 1160px total wrapper at >=1200px; 160px left contents column + 40px gap + 720px content with remaining whitespace. At <1200px switch contents to a native `<details>` above the article and retain a centered 640px prose column. Preserve all target IDs and active section functionality.
- No sticky header. Desktop contents can be sticky at 32px; respect viewport height with internal scrolling. `scroll-margin-top: 24px` on headings and notes.

## 4. Exact homepage order and content

Use `<header>`, `<nav aria-label="Primary">`, `<main id="content">` and `<footer>`. First interactive element is a visible-on-focus skip link to `#content`. Preserve the old home IDs `hero`, `projects`, `experience`, `blog`; add `updates`, `research`. Every section has a heading and can be linked directly.

### A. Masthead

Wrapper starts 40px below viewport top desktop, 24px mobile. Wordmark on left: **228px × approximately 77px**, rendered with intrinsic 1134:382 ratio; mobile 190px × approximately 64px. Image links to `/`, with link accessible name `Utkarsh Sonawane — home`; image alt empty when link has that name. No clipping or stretching of flourishes. On desktop, right-aligned navigation: `Projects` → `/#projects`, `Research` → `/#research`, `Blog` → `/blog/`, `Résumé ↗` → `/resume.pdf`. Gap 24px. On mobile navigation is a wrapping second row, 12px below the wordmark, with 16px horizontal gap and at least 44px hit height. No hamburger.

Hairline rule 20px below masthead content, then 48px before intro (32px mobile). This small signature appears on inner pages too; do not repeat a huge calligraphy hero.

### B. Introduction (`#hero`)

Bio right / notebook illustration left on desktop. H1: **Utkarsh Sonawane**. This preserves a readable full name independent of the image. Suggested new intro copy:

> I study computer science at Penn State Harrisburg. I build software and explore language models, from small experiments to systems people can use.
>
> Currently, I’m investigating adverse drug reaction reports on Reddit with Dr. Md Sultan Al Nahian. I’m interested in applied AI, reliable systems, and what it takes to turn an idea into something useful.

Short sans-serif availability line below: **Looking for Summer 2027 software engineering and AI/ML internships.** Keep the existing class-of-2028 fact in a small metadata line: `Computer science · Penn State · Class of 2028`.

Contact row below, 16px gap: `Email`, `GitHub`, `LinkedIn`, `Résumé (PDF)`. Preserve current targets. `Email` is a real mailto link, with adjacent optional `Copy email` button using existing clipboard behavior/live feedback and mailto fallback. Contact does not depend on JavaScript.

Illustration: a small open notebook with connected nodes and one turning page, described in ASSETS.md. It is decorative, `alt=""`, not a replacement for the current portrait. Preserve `avatar.jpg` in the repo. Do not invent hobbies or personal achievements.

### C. Updates (`#updates`)

Heading **Updates**. Semantic list of month groups, newest first; date on left, events on right. No timeline rail, badges or cards. Show four groups; native `<details><summary>Earlier updates</summary>` for older entries when there are more. All content exists in HTML without JS.

Initial content grounded in repository dates (publication dates retained exactly):

| Month label / machine time | Entry text / destination |
| --- | --- |
| October 2026 / `2026-10` | Wrote **why i stopped working on nytr — problems and lessons.** → existing Oct 15 article |
| October 2026 / `2026-10` | Wrote **code is cheap, execution is everything.** → existing Oct 13 article |
| October 2026 / `2026-10` | Started undergraduate research on extracting adverse drug reaction reports from Reddit. → `/#research` |
| September 2026 / `2026-09` | Elected Technical Chair of IEEE at Penn State Harrisburg. → `/#experience` |
| June 2026 / `2026-06` | Our ScholarAI team was a finalist in the USAII Global AI Hackathon. I worked on the data pipeline. → `/projects/scholarai/` |

Group the three October entries under one month label; this is three month groups initially, not five repeated headings. Research October date comes from the owner's provided October 2026 project context; existing repo only says 2026–present. Do not invent an exact appointment day. Display only events already happened. Future work belongs in clearly labeled plans.

### D. Projects (`#projects`)

Heading **Selected projects**, small lede `Things I’ve built, and what I learned from them.` Four primary entries, in order **Nytr, Clage, Talks, Devvy**. Each row has H3 linked to unchanged case-study route, at most two summary sentences, one muted stack line, and text links `Case study`, `Code` (Nytr/Clage also `Demo` to existing `#demo`). Use actual screenshots or the specified small line illustration; do not replace evidence images inside the case study.

Summary content:

- Nytr: `A nutrition and training app built around Penn State dining data. Deterministic recommendations, a Python backend, and a native iOS client.` Follow with `Development paused — lessons from building it` linking to Oct 15 post; this reconciles the reflection with the archived case study. Do not call it a currently growing product.
- Clage: `A from-scratch neuroevolution engine and local browser workbench for inspecting agents, experiments, and deterministic replay.`
- Talks: `Record on Apple Watch; transcribe and summarize on iPhone; save to Notion. Built around recoverable transfers and persistent jobs.`
- Devvy: `One local daemon coordinates Discord presence across coding tools while keeping prompts, code, and full paths private.`

Avoid a wall of test-count marketing on home. Preserve all numeric evidence and caveats in case studies or an accessible expandable `Technical details` under the entry. For Nytr use the baseline numbers until separately verified; never silently substitute memory-derived newer counts.

Then **More experiments** as compact rows: MedClarity (66 Vitest tests, code + live demo); PyOpt (code + full existing benchmark statement **including the 13/40 training leakage caveat, v1.2 split fixed but not retrained, and OOD 9/10 vs 8/10**); ScholarAI (case study, team repo, my code, attribution to a five-person team). Do not hide the PyOpt caveat behind hover or a tooltip. Retain all original home facts in these rows or native details; don't discard technical descriptions just to fit shorter copy.

### E. Research (`#research`)

Heading **Research**. One unboxed entry, title **Extracting adverse drug reaction reports from Reddit**; metadata `Undergraduate research · Penn State Harrisburg · 2026–present`; status text **In progress**.

Copy: `With Dr. Md Sultan Al Nahian, I’m studying how language models can identify reported drug–reaction relationships in Reddit discussions. The work compares direct prompting, retrieval-augmented generation, and extraction with verification against human annotations.` Second line: `Evaluation focuses on precision, recall, F1, and error analysis.` Preserve the repo's planned terminology normalization and PubMed comparison in an expandable `Research plan` paragraph, explicitly described as planned. Owner context also permits planned evidence spans and abstention, but do not present them as completed results.

Use ordinary paragraphs, not a publication card with a fake venue. No Scholar link, paper PDF, accepted label, model ranking, dataset release or claimed clinical validation unless a real source is supplied. Optional external links only to verified actual lab/project resources; otherwise omit. Separate this from the informal Clage experiments and avoid claiming a publication record. Decorative margin illustration: two small paper slips with an evidence connector; no patient data or screenshot of Reddit.

### F. Experience (`#experience`)

Heading **Elsewhere**. Compact chronological rows for **Technical Chair — IEEE Student Branch** (Sept 2026–present; retain prior technical-team year and workshop details), **Data Engineer — ScholarAI** (June 2026; 1,008 schemes; finalist and team credit), **Founder & Editor-in-Chief — Glimpse** (Jun 2024–Feb 2025; 250+ readers). Research role lives in `#research`; begin `#experience` with a small `Undergraduate Research Assistant → Research` cross-link so all four original experience entries remain discoverable. Do not imply the hackathon was employment.

### G. Writing (`#blog`)

Heading **Writing**, right-hand `All posts →` linking `/blog/`. Three rows, newest first, exactly the current titles and dates listed in PRESERVATION.md. Date format `Oct 15, 2026`, with original ISO `datetime`. No excerpts on home. Preserve `/#blog` as an anchor even though a dedicated blog page now exists.

### H. Footer

48px top margin, decorative rule, 24px padding. Left `Utkarsh Sonawane · Penn State Harrisburg`; right text links `Email · GitHub · LinkedIn · Résumé`. On mobile stack with 12px gap. Do not add fabricated “last updated” dates or a visitor counter. No newsletter form or analytics introduced by default.

## 5. Blog index and article template

New `/blog/index.html`: shared masthead, H1 **Writing**, short line `Notes on building software, learning AI, and figuring things out.` Year heading **2026**, rows dated and sorted descending. Each row has a linked original title and a single new descriptive excerpt:

- Oct 15: `What building a campus nutrition app taught me about data, distribution, and validating an idea.`
- Oct 13: `Why choosing a useful problem and getting people to use a product matter alongside writing the code.`
- Oct 3: `Thinking aloud about smaller models and narrow business workflows.`

Keep all three posts reachable in static HTML. Do not list `/blog/hello-world/` as a fourth post; preserve its redirect. No categories/filter/search UI with only three posts.

Articles: shared small masthead, `← All writing` link to `/blog/`, original H1, original publication date, optional distinct modified date only if an actual content edit occurs. 640px reading column, 18px Georgia prose, 16px paragraph gaps. Never change post language, lowercase style, ordering, emphasis, punctuation or publication dates as part of reskinning. Formatting the one-line Oct 13 HTML is permitted only if rendered article content remains identical. Add its missing canonical, social metadata, favicon, skip link and shared footer in the later implementation.

Case studies retain complete text, evidence tables, source links, limitations, screenshots, videos and section anchors; restyle to this token system. Keep existing captions and synthetic-data disclosures. Tables scroll inside a wrapper on small screens; the document itself must not overflow.

## 6. References and footnotes

Purpose: add a real scholarly-style reference system for sourced claims in future writing without changing the author's voice or inventing citations for old personal reflections.

- Use inline numbered superscript links `[1]`, `[2]` in order of first appearance. A source cited again reuses its number, with a unique reference-callout ID for every occurrence.
- Endnotes appear after article body under H2 **References**. Each numbered entry contains author/organization, linked title, publication year/date if verified, and a short context note only where useful. Mutable web sources may include an actual access date; do not fabricate dates, page numbers, DOI or URLs.
- Use `<sup><a id="ref-1-a" href="#fn-1" role="doc-noteref" aria-label="Reference 1">[1]</a></sup>`; repeated callout `ref-1-b` shares `href="#fn-1"`.
- End section `<section role="doc-endnotes" aria-labelledby="references"><h2 id="references">References</h2><ol>...<li id="fn-1">...<a href="#ref-1-a" aria-label="Back to reference 1, first mention">↩</a>...</li>...</ol></section>`. Give every repeated mention its own backlink. Browser-native anchor navigation must work with JS disabled.
- Explanatory notes may share numbering and are labeled as notes in their text. Do not add a reference section at all if there are no verified sources.
- Footnotes use 14px sans-serif, 1.6 line-height, `overflow-wrap: anywhere`, a decorative top rule and 24px top spacing. `:target` uses sage-soft background. No hover-only popovers or marginal notes in V2.
- External links use the same tab by default. If any opens a new tab, set `rel="noopener"` and communicate that behavior accessibly.
- Existing posts make mentions of a Lucy Guo podcast, Project Nanda and an unnamed X post without precise supplied source URLs. Keep these words; do not guess which source was meant. Record unresolved citation candidates in implementation notes, not visible fake footnotes. Add real citations to existing prose only after source verification and owner authorization for that editorial addition. A design implementation alone does not authorize rewriting the claims.

## 7. Interaction, accessibility and performance

All content and navigation work without JavaScript. Preserve copy-email fallback and TOC scrollspy, but do not let scripts hide content. Interactive hit targets at least 44×44px except inline prose links. Mobile contact rows can wrap naturally. Visible focus for all links, buttons, details summaries and footnote backlinks. One H1 per page, logical heading order, real `<time>` elements, semantic lists, descriptive link names and explicit image dimensions.

Use `prefers-reduced-motion: reduce` to disable smooth scrolling and optional transitions. Default hover transition at most 120ms; no automatic illustration animation. Videos retain `controls playsinline preload="none"`, poster frames and download fallbacks. Do not autoplay.

Illustrations have empty alt when decorative. Product screenshots retain accurate descriptive alt and captions; no new diagrams that imply performance results. Add a real text caption to a meaningful diagram if one is introduced. Preserve source media files rather than substituting low-quality generated device screenshots.

Home target: <=350 KiB initial compressed transferred assets excluding optional media after user interaction; no font requests; <=30 KiB compressed JS; no client framework. Wordmark source may be large, so optimized derivative is appropriate after visual review. Explicit dimensions avoid layout shift. Lazy-load below-fold art/screenshots. Keep images/og-image.png unless an owner-approved replacement is prepared.

## 8. Acceptance views and done criteria

Review screenshots at **1440×1000, 1024×768, 768×1024, 390×844 and 320×740**; render home, blog index, a long article, Nytr and Clage. Verify all other case studies and 404 visually for shared-style regressions. At 200% zoom no lost text or controls; keyboard navigation reaches all content; reduced motion respected. Check desktop and narrow mobile masthead, long URLs in references, tables and TOC expansion.

Homepage should show signature, full name, bio and at least the start of updates at 1440×1000 without a giant empty hero. Preserve comfortable mobile density rather than forcing the same fold. Every existing route, original fragment, source link, image and media fallback must still resolve. Validation commands and preservation audit are in CODEX-IMPLEMENTATION.md. Implementation is reviewable on a branch; merging and publication remain separate owner decisions.
