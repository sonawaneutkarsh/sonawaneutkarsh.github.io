# Portfolio V3: interactive engineering notebook

V3 keeps V2's palette, system serif typography, wordmark, illustrations, page
structure and every case study, and adds motion where it explains something.
Plain HTML, CSS and ES modules. There is still no framework, build step,
backend, analytics or third-party runtime dependency.

## What changed

### Stage one: project previews and navigation

| Project | Preview | Source |
| --- | --- | --- |
| Nytr | Existing `videos/nytr-demo.mp4`, muted, in the project frame | 640px WebP poster derived from the existing JPEG poster |
| Clage | Existing `videos/clage-studio-demo.mp4`, muted; a small growing network (two nodes split by a new hidden node, then a new connection) shows while the video buffers | Same |
| Talks | Original SVG: Watch records → `transferFile` packet → iPhone queues → ACK returns and the watch shows a check → on-device transcript and summary → Notion page | Case study's architecture section |
| Devvy | Original SVG: VS Code, OpenCode and Command Code send heartbeats → daemon picks OpenCode by tool kind → OpenCode stops heartbeating, its 15 s TTL expires → Command Code wins and one Discord update is sent. Card shows project basename and state only, with "no prompts, code, or full paths" | Case study's arbitration and privacy sections |

Rules (`js/project-previews.js`):

- Starts on mouse/pen hover of the row (140 ms intent delay), keyboard focus
  inside the row, or the frame's **Preview** button. The button always does
  what its label says.
- One preview at a time. A video is created on first use with
  `preload="none"`, so the homepage requests no video bytes until a visitor
  asks. Videos pause on pointer exit, when scrolled away
  (`IntersectionObserver`) and when the tab is hidden.
- If autoplay is refused, or Save-Data is on and the trigger was a hover, the
  poster stays as a static fallback.
- Reduced motion: hover/focus do nothing; the button shows a still frame of
  a diagram or plays a video only on request.
- Without JavaScript the original illustration is shown.
- Captions say "Demo recording · muted", "Illustration, not a device
  recording", and "Illustration of the daemon’s choice".
- The Nytr row now says **Development paused** before the lessons link.

Navigation: underlines draw in from the left, the current section is marked
with `aria-current`, and project titles, preview frames and the Explore link
have small lift and underline reveals. Sections below the fold rise in once.
They are hidden only after JS confirms motion is allowed and the page was not
opened at a fragment.

### Stage two: hero icons

The introduction opens with one line: **I build software, explore AI systems,
do research, and write about what I learn.** The original biography
paragraphs, research sentence, availability line, Penn State metadata and
contact row follow unchanged.

| Icon | Rest | Motion | Link |
| --- | --- | --- | --- |
| AI systems | Six-node network | Nodes spread, two connections grow, signals travel two paths, nodes re-form into **plan → act → check** with a tool node and a return loop | `/explore/?filter=ai` |
| Software | Laptop with `</>` | Laptop steps back; watch and phone come forward; a recording crosses; phone shows a waveform then text; confirmation mark; everything returns to rest (one shot) | `/#projects` |
| Research | Page with faint lines | Lines fill in; drug mention marked; reaction mention marked (dashed); candidate link drawn; review mark pops | `/#research` |

Implementation (`js/hero-icons.js`, `js/motion.js`):

- Rest drawings are inline SVG in `index.html`, so they render without JS.
- Each moving part is a damped spring (semi-implicit Euler, fixed 4 ms
  substeps, velocity kept on retarget) with staggered targets. Drawn-on
  strokes and fades are derived from elapsed time. The frame loop stops when
  everything settles: the performance check counted 0 `requestAnimationFrame`
  calls during 2 s idle on every page.
- Icon boxes have a fixed size and negative block margins, so the line box
  never changes. The regression test checks that the intro's position and
  height are identical before and during the animation.
- On screens ≥ 720px a **margin figure** beside the intro shows the lit icon
  at about 2.6× scale with a one-sentence caption. The same spring state
  drives both copies, so the detail is readable and the sentence is never
  covered or reflowed.
- Hover and keyboard focus light an icon. On touch-first devices
  (`hover: none` and `pointer: coarse`), each icon plays once, staggered, the
  first time the intro is on screen. A tap follows the link immediately.
- Reduced motion jumps to one still of the lit state.

### Stage three: `/explore/` and `/notebook/adr-extraction-demo/`

**Explore my work** (`explore/index.html`, `js/explore.js`, `css/explore.css`)
is a graph-paper workbench with five dashed zones: AI & machine learning,
Applications, Systems & developer tools, Research, and Other experiments.
It holds the eight entries already published on the homepage: Nytr, Clage,
Talks, Devvy, MedClarity, PyOpt, ScholarAI, and the ADR research entry.
Positions are fixed in `data-pos`. Dotted lines join projects that share
something stated on the site: Nytr–Talks (Swift · SwiftUI), Clage–PyOpt
(machine learning), PyOpt–research (language models), MedClarity–research
(evidence checks). Lines run under the opaque cards. Each label sits at the
first point on its curve that clears every card, zone caption and other
label, and wraps to two lines if one line will not fit. The `layout` test
suite checks this at five widths and under two filters.

- The HTML holds the data. Each entry's detail (text, tech line, test counts,
  caveats, links) is in the page, copied from the homepage and case studies.
  That includes Nytr's paused status, PyOpt's 13/40 leakage caveat, Talks'
  real-device boundary, Devvy's unreleased Windows build, and ScholarAI's
  team-versus-individual attribution. Without JS it is a plain list.
- Selecting an object springs the view to it and opens a side panel (a bottom
  sheet below 900px). Focus moves to the panel. Previous/Next browse
  entries, and Esc or Close returns focus to the object.
- Filters dim and `inert` entries outside the area, then fit the view to the
  rest.
- Narrow screens start in **List** view. The Workbench view can still be
  chosen.

**Browser history.** The URL is the single source of truth:
`?filter=<area>`, `?view=list|bench` (only when it differs from the
screen-size default) and `#<project>`. User actions write history; the
`popstate` handler only reads the URL and redraws, so replaying history
never creates entries.

| Action | History | Back afterwards |
| --- | --- | --- |
| Open a project from the overview | push | closes it |
| Previous/Next, or pick another project while one is open | replace | returns to the overview in one step |
| Close/Esc on an entry the explorer pushed | `history.back()` | (Forward reopens it) |
| Close on a deep link (`/explore/#pyopt` opened directly) | replace | leaves the page |
| Change filter | push; closes a project the filter hides | restores the filter and that project |
| Switch List/Workbench | push | restores the other view |
| Unknown filter or project in the URL | replaced with the normalized URL | — |

If focus was inside the panel when history closes it, focus returns to that
project's card. Pages restored from the back/forward cache keep their state.

**Input.**

| Device | Pan | Zoom | Page scroll |
| --- | --- | --- | --- |
| Mouse | drag the background | Ctrl/Cmd + wheel, or the + / − buttons | plain wheel, never captured |
| Trackpad | drag | Ctrl/Cmd + scroll; pinch in Chromium-based browsers and Firefox, which report pinch as Ctrl + wheel | two-finger scroll |
| Touch | one-finger sideways swipe | two-finger pinch around the midpoint, or the buttons | vertical swipes scroll the page (`touch-action: pan-y`) |
| Keyboard | focusing a card brings it into view | + / − / Reset buttons | normal |

Zoom is bounded to 0.25–1.8. Automatic fits stop at 0.4 so labels stay
readable, and the viewport centre always stays over the bench, so any card
can be centred on a phone. If the browser claims a one-finger gesture as a
vertical page scroll, the few pixels it panned first are undone. A pinch
never turns into a drag when one finger lifts, and a drag or pinch never
opens a card. The on-screen hint is chosen by input type, so phones are told
about pinch and swipe and desktops about Ctrl/Cmd + scroll.

**Illustrated ADR workflow** (`notebook/adr-extraction-demo/`,
`js/research-demo.js`, `css/adr-demo.css`) steps through six stages on three
synthetic posts about "Drug A–D":

1. Original text
2. Drug mentions
3. Reaction mentions, with normalized terms
4. Candidate pairs and connectors
5. Review verdicts: supported, contradicted, flagged (reported about another
   person), or abstain (writer offers another cause)
6. Why a reported pair is not causation

It has Previous/Next, a step list, arrow keys, Reset, a live progress line,
and reduced-motion support. All annotations are hand-fixed in the HTML.
Nothing calls a model or API. A notice says the page uses no real data,
model output, accuracy measurement or project results. The research notebook
links to it without listing it as a published entry; "No entries published
yet." is unchanged.

## Files

Added:

- `js/motion.js`, `js/home.js`, `js/project-previews.js`,
  `js/preview-diagrams.js`, `js/hero-icons.js`, `js/explore.js`,
  `js/research-demo.js`
- `css/interactive.css` (homepage only), `css/explore.css`, `css/adr-demo.css`
- `explore/index.html`, `notebook/adr-extraction-demo/index.html`
- `images/previews/*-640.webp`, made by `scripts/make_preview_posters.mjs`
- `tests/e2e/run.mjs`, `tests/e2e/firefox.mjs`, `tests/e2e/perf.mjs`,
  `tests/e2e/lib/{browser,server}.mjs`
- `.github/workflows/browser-tests.yml` (read-only browser CI, no deploy)
- `docs/portfolio-v3/`: this file, plus screenshots rendered in CI. The
  Chrome set has no prefix; the Firefox set is named `firefox-*.png`.

Changed:

- `index.html`
- `styles.css` (navigation underline only)
- `script.js` (`initNavState`)
- `notebook/index.html` (one cross-link)
- `sitemap.xml` (two routes)
- `scripts/check_links.py`, which now also checks `data-video` and
  `data-poster` targets
- Both workflows: stage `explore css js`; validate `explore/index.html` and
  `notebook/*/index.html`
- `README.md`

Unchanged: every case study and article, `feed.xml`, `resume.pdf`, the
wordmark, illustrations, videos and posters. The preservation check confirms
this. The homepage markup that `scripts/publish_scheduled.py` depends on
(`<section id="blog">` and `<ul class="post-list">`) is untouched. A
simulated 2026-11-08 release on the branch passed all checks.

## Testing

```bash
python3 scripts/check_links.py
python3 scripts/check_feed.py
python3 scripts/check_preservation.py
npx --yes html-validate@10 index.html 404.html projects/*/index.html blog/index.html blog/*/index.html notebook/index.html notebook/*/index.html explore/index.html
node tests/e2e/run.mjs                 # Chrome/Chromium over the DevTools protocol
node tests/e2e/run.mjs history touch   # selected suites
FIREFOX_PATH=/usr/bin/firefox node tests/e2e/firefox.mjs   # Firefox over WebDriver BiDi
SCREENSHOTS=1 node tests/e2e/run.mjs   # also refresh docs/portfolio-v3/screenshots/
node tests/e2e/perf.mjs                # page weight, FCP/DCL, idle animation frames
```

Both browser runners have no dependencies beyond Node 22+ and the browser.
The repo still needs no `package.json`. Set `CHROME_PATH` or `FIREFOX_PATH`
if a browser is not found. `REQUIRE_GLYPHS=1` turns glyph-rendering reports
into failures. `SUITE_TIMEOUT_MS` (default 240 s) stops a stuck suite.

| Chrome suite | Covers |
| --- | --- |
| `routes` | Every route at 1440/1024/768/390/320: overflow and console errors; blog posts load no V3 modules |
| `home` | Hero icons (hover, keyboard, touch tour, reduced motion, no layout shift); previews (start/stop rules, lazy video, one at a time, touch) |
| `explore` | Selection, focus return, filters and `inert`, zoom/reset, drag vs click, plain-wheel scroll, Tab/Enter, deep links, list view |
| `history` | Every row of the history table above, plus leaving and re-entering the page, bfcache restores and no-loop replay |
| `touch` | Real touch input through Chrome's input pipeline: sideways pan, vertical page scroll (list and bench), pinch out and in with bounds, no page zoom, tap after panning, bottom sheet |
| `glyphs` | Whether ← → ↗ − · — – × ’ “ ” é render in the page fonts (canvas comparison against an unassigned code point) |
| `layout` | Connector labels vs cards, zone captions and other labels; cards vs zones; card text overflow; every detail panel; hero icons vs their words; diagram labels vs caption, chip and frame |
| `demo` | ADR stepping, keyboard, reset, example switching, connectors attached to their marks with no badge collisions, reduced motion, same-origin-only requests |

**CI.** `.github/workflows/browser-tests.yml` runs on every pull request and
on pushes to `main`. It has read-only permissions and no deploy step, and it
is separate from the Pages workflow. It has two jobs:

- **chrome**: the full suite on the runner's Google Chrome, with
  `REQUIRE_GLYPHS=1`.
- **firefox**: `tests/e2e/firefox.mjs` on the runner's Firefox. This smoke
  suite covers routes at two widths, module loading, icon hover, preview
  playback or fallback, explorer history and filters, connector overlaps,
  and the ADR walkthrough.

Screenshots from both jobs are uploaded as workflow artifacts.
`docs/portfolio-v3/screenshots/` holds the copies from CI, which has real
desktop fonts (DejaVu).

## Performance (local server, no throttling, cache disabled)

| Route | Main (V2) | V3 branch |
| --- | --- | --- |
| `/` transfer | 423 KB, 10 requests | 493 KB, 16 requests |
| `/` JS | 3.8 KB | 58 KB raw (≈17 KB gzip), deferred ES modules with `modulepreload` |
| `/` first contentful paint | 64–68 ms | 64 ms |
| `/` DOMContentLoaded | 48–50 ms | 76–78 ms |
| Idle `requestAnimationFrame` calls over 2 s | 0 | 0 |
| `/blog/80-percent-sleep/` | 100.7 KB | 102.2 KB (nav code only; no V3 modules) |

The homepage costs about 20 KB more gzipped, plus 1.1 KB more HTML. First
paint is unchanged because the modules are deferred. DOMContentLoaded is
about 28 ms later because module scripts run before it. A video is fetched
only after a visitor previews it. The explorer loads its seven illustrations
lazily (330 KB on desktop, where all are in view).

## Accessibility notes

- All interactions are ordinary links and buttons with names. Icon links read
  as their word ("AI systems"). Preview buttons say "Play/Pause Nytr demo
  preview". Toggle state uses `aria-pressed` and steps use `aria-current`.
- Visible focus uses the V2 2px sage outline everywhere, inset on preview
  frames.
- No hover-only information. Captions and margin figures repeat nothing
  essential. Everything the explorer shows is also on the homepage or the
  case studies.
- `prefers-reduced-motion` removes transitions (global V2 rule), turns hover
  and focus previews off, and makes icons and the explorer jump to their end
  states.
- No focus traps. Esc closes the explorer panel. The page scroll is never
  hijacked.

## Inspiration and licensing

The interaction ideas come from studying Gordon Tu's site
(https://gordontu.com) and its source (https://github.com/tututwo/gordontu):

- Animated objects inside the intro sentence
- Spring-driven motion with a frame loop that sleeps when idle
- A static still before enhancement
- An exploratory gallery

That repository has no license file, so **no code, artwork, layout or asset
was copied**. Its icons are three.js scenes with text reflow, and the
gallery is a garden. V3 uses its own SVG drawings, its own spring
integrator, a margin figure instead of reflow, and an engineering-workbench
metaphor.

## Browser coverage and known limitations

- **Arrow glyphs.** The earlier report of missing ← → ↗ and − was a font
  problem in the build sandbox, not the site. That sandbox has only Noto
  Sans, which lacks the arrows; the minus sign did render. The `glyphs` suite
  shows all twelve characters rendering on the CI runner, which has DejaVu
  fonts. V2's existing "← All writing" links rely on the same glyphs. macOS,
  iOS, Windows and Android ship fonts with these arrows, but that was not
  tested on those systems.
- **Firefox** (158 on CI) was tested by the smoke suite only. Its
  interactions are DOM events sent from script, not native input. Headless
  Firefox never gives the document focus, so keyboard-focus behavior was
  only verified in Chrome. In Firefox the icon was tested with a mouse
  `pointerenter` instead. Touch, pinch and reduced motion were not tested in
  Firefox.
- **Safari / WebKit was not tested.** GitHub's Ubuntu runners have no
  WebKit, and adding Playwright's WebKit build would bring in an npm
  dependency and a browser download.
  - Safari on macOS reports trackpad pinch as `gesture*` events rather than
    Ctrl + wheel, so trackpad pinch does not zoom the bench there. The
    buttons and Ctrl/Cmd + scroll still work.
  - iOS Safari supports `touch-action: pan-y` and pointer events, so swipe
    and pinch should work, but they are unverified.
- **Touch tests are emulated.** They use Chrome's touch emulation through
  the DevTools protocol, which goes through the real gesture and
  `touch-action` pipeline. They were not run on a physical phone. Two-finger
  pinch is detected only when both fingers land before the browser commits
  to a one-finger scroll, as on most mobile sites with custom pinch.
- **Video in Firefox CI.** The Nytr preview reached its `playing` state in
  CI. Decoding H.264 depends on the system's codecs. Where it fails, the
  poster fallback is used.
- **Zoom softening.** The workbench zoom uses CSS transforms, so the raster
  illustrations soften slightly near the 1.8× cap.
