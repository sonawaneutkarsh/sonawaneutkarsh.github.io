# Visual History Audit: sonawaneutkarsh.github.io (August 2026 – October 2026)

## Executive Summary

This document presents the complete visual history audit and reconstruction of **sonawaneutkarsh.github.io** across its full Git repository history. The repository spans from its initial commit on August 14, 2026 through the approved Portfolio V2 release on October 19, 2026.

Across **79 Git commits**, the website underwent two complete architectural paradigms:
1. **Next.js 14 App Router + Tailwind CSS** (August 14, 2026 – September 29, 2026)
2. **Semantic HTML5 + Pure CSS + Vanilla JavaScript** (October 1, 2026 – Present)

From this history, **5 canonical evolutionary leaps** were selected for the published gallery, reconstructed in isolated temporary Git worktrees, rendered using Chromium via Playwright at an exact **1440px desktop width**, and verified visually. Original lossless PNG screenshots and high-efficiency WebP derivatives (achieving ~58% bandwidth reduction) are preserved in the `artifacts/website-history/` directory.

---

## Published Visual Milestones Overview

| # | Date | Commit SHA | Phase | Architecture | Key Visual Distinction | Published Assets |
|---|------|------------|-------|--------------|------------------------|------------------|
| **01** | 2026-08-14 | `17b95d9` | V1 Initial Scaffold | Next.js 14 / Tailwind | Dark theme, Recruiter/Experience toggle, placeholder bio, 8 projects | `screenshots/01-2026-08-14-17b95d9-initial-portfolio.png`<br>`webp/01-2026-08-14-17b95d9-initial-portfolio.webp` |
| **02** | 2026-09-29 | `5d02121` | V1 Next.js Peak | Next.js 14 / Tailwind | Added Talks case study, 5 primary projects, Summer 2027 recruiter signal | `screenshots/02-2026-09-29-5d02121-nextjs-peak-recruiter.png`<br>`webp/02-2026-09-29-5d02121-nextjs-peak-recruiter.webp` |
| **03** | 2026-10-01 | `c002ec5` | V2 Static Rebuild | HTML5 / Pure CSS | "Alisa Wuffles" system: avatar circle, topic pills, IEEE Technical Chair | `screenshots/03-2026-10-01-c002ec5-static-rebuild-alisa-wuffles.png`<br>`webp/03-2026-10-01-c002ec5-static-rebuild-alisa-wuffles.webp` |
| **04** | 2026-10-15 | `5f02a23` | V2 Mature Static | HTML5 / Pure CSS | Added REU Research Assistant experience, 3 published essays, removed solo tags | `screenshots/04-2026-10-15-5f02a23-static-three-essays-reu.png`<br>`webp/04-2026-10-15-5f02a23-static-three-essays-reu.webp` |
| **05** | 2026-10-19 | `c893e07` | Portfolio V2 Editorial | HTML5 / Editorial CSS | Cream canvas, script "utkarsh." wordmark, 7 illustrations, Research notebook | `screenshots/05-2026-10-19-c893e07-portfolio-v2-editorial.png`<br>`webp/05-2026-10-19-c893e07-portfolio-v2-editorial.webp` |

---

## Detailed Version Audit

### Version 1: Initial Portfolio Build
- **Commit:** `17b95d9e5033c5cb2910f5451ec3aa66453f6560` (`17b95d9`)
- **Date:** August 14, 2026 (14:59:11 +0400)
- **Author:** sonawaneutkarsh
- **Commit Message:** `Build portfolio site`
- **Architecture:** Next.js 14.2.15 (App Router), React 18, Tailwind CSS, Geist font
- **Visual Characteristics:**
  - Dark-mode background (`bg-[#0a0a0a]` / `#171717`) with minimal white typography.
  - Header: Left "Portfolio" title, right mode-toggle switch (`Recruiter` vs `Experience`).
  - Hero: Eyebrow `UTKARSH SONAWANE`, headline `Software engineer. In progress, on purpose.`, subline `Penn State Harrisburg · CGPA 3.53/4.0 · USAII Global AI Hackathon — finalist`.
  - About section containing initial scaffolding placeholder: `Your bio goes here — replace this paragraph with your own writing.`
  - Education section with bulleted club memberships (Math Club, CS & AI Club, IEEE technical team, TECS Club, Dean's List).
  - 8 raw project rows: Clage, ScholarAI, MedClarity, ZorabiHealth, ESP32 Plant Monitor, 20 Questions, Hatchling, VOYAGER-9.
  - Skills pills grouped by Languages, AI/ML, Backend/Infra, and Tools.
  - Books section with "Currently reading" (*The Power of Now*), "Read", and "Want to read".
- **Screenshot Asset:** `screenshots/01-2026-08-14-17b95d9-initial-portfolio.png` (1440 × 4855 px, 285 KB)
- **WebP Asset:** `webp/01-2026-08-14-17b95d9-initial-portfolio.webp` (113 KB, 39.7% of PNG size)

---

### Version 2: Next.js Era Peak (Talks Integration & Recruiter Signal)
- **Commit:** `5d02121e7fc304194091c68e0e7a2b270a24aa75` (`5d02121`)
- **Date:** September 29, 2026 (19:12:57 -0400)
- **Author:** Utkarsh Sonawane
- **Commit Message:** `docs: recruiter pass — Devvy Command Code clarity`
- **Architecture:** Next.js 14.2.15, Tailwind CSS, Framer Motion
- **Visual Changes from Previous:**
  - Complete evolution of the Next.js portfolio at its highest point of maturity.
  - Transformed into a light-theme default design with clear graphite borders and smooth section reveal transitions.
  - Hero updated with explicit recruiter availability signal: `CURRENTLY SEEKING SUMMER 2027 SWE/AI INTERNSHIPS.` in blue pill callout.
  - Integrated **Talks** (Apple Watch meeting capture system) as primary project #2, shifting Clage to #3, Devvy to #4, and ScholarAI to #5.
  - Flagship Nytr banner with `940+ Backend · 250+ iOS Tests · Deterministic Decimal Math`.
  - Added technical case study links and rich metadata across all five primary projects.
  - Devvy description updated to explicitly clarify Command Code as a terminal-based AI coding agent.
  - Clage passing test count updated to 300 passing tests.
  - Personal essay section *"Why I build"* and two-column Experience / Leadership grid.
- **Screenshot Asset:** `screenshots/02-2026-09-29-5d02121-nextjs-peak-recruiter.png` (1440 × 6465 px, 813 KB)
- **WebP Asset:** `webp/02-2026-09-29-5d02121-nextjs-peak-recruiter.webp` (375 KB, 46.2% of PNG size)

---

### Version 3: Clean Static Site Rebuild ("Alisa Wuffles" Design System)
- **Commit:** `c002ec56b9c9f45df9e4a36f6dca74f5195d2906` (`c002ec5`)
- **Date:** October 01, 2026 (23:45:12 -0400)
- **Author:** Utkarsh Sonawane
- **Commit Message:** `Update IEEE experience: promoted from Technical Team Member to Technical Chair`
- **Architecture:** Semantic HTML5, Pure CSS, Vanilla JavaScript (zero framework runtime)
- **Visual Changes from Previous:**
  - Radical architectural migration replacing Next.js and npm builds with zero-build semantic HTML5, pure CSS, and vanilla JavaScript.
  - Centered header with a circular 195px headshot avatar of Utkarsh.
  - Official inline PNG social/academic icons (Gmail, Google Scholar, GitHub, LinkedIn, alphaXiv, Hugging Face, and inline CV pill).
  - Topic filter pills above projects: `All`, `AI Agents`, `Mobile`, `ML Research`.
  - Projects displayed as clean white rounded cards with subtle borders against a warm-neutral background (`#F9FAFB`).
  - Added `PyOpt-SLM-Exp` (LoRA-tuned small language model experiments).
  - Experience cards updated: Utkarsh promoted to **Technical Chair** of IEEE Student Branch (Sept 2026 – Present).
  - New `Blog` section at the bottom featuring initial post: `2026-10-01 Hello, world`.
- **Screenshot Asset:** `screenshots/03-2026-10-01-c002ec5-static-rebuild-alisa-wuffles.png` (1440 × 3071 px, 381 KB)
- **WebP Asset:** `webp/03-2026-10-01-c002ec5-static-rebuild-alisa-wuffles.webp` (139 KB, 36.6% of PNG size)

---

### Version 4: Mature Pre-V2 Static Portfolio (Three Essays & REU)
- **Commit:** `5f02a23e809312217c09cbeaa46c4f8286a1df8a` (`5f02a23`)
- **Date:** October 15, 2026 (00:43:16 -0400)
- **Author:** Utkarsh Sonawane
- **Commit Message:** `Publish exact Nytr lessons article dated October 15, 2026`
- **Architecture:** Semantic HTML5, Pure CSS, Vanilla JavaScript
- **Visual Changes from Previous:**
  - Added new flagship research role at top of Experience: **Undergraduate Research Assistant, Penn State Harrisburg (REU)** researching LLM-based extraction of adverse drug reaction reports from Reddit with Dr. Md Sultan Al Nahian.
  - Two-tier project hierarchy with embedded mobile UI mockups: Nytr Today view and Talks Apple Watch + iPhone recording pair.
  - Clage updated for **Clage Studio 1.0**: `429 Python tests + 4 JavaScript tests + 21 browser workflows in CI` with demo video button.
  - Blog expanded to three published technical essays:
    1. `2026-10-15: why i stopped working on nytr — problems and lessons.`
    2. `2026-10-13: code is cheap, execution is everything.`
    3. `2026-10-03: thoughts on slm's for businesses`
  - Cleaned all project kickers by removing redundant "Solo" tags to maintain a cleaner scholarly tone.
- **Screenshot Asset:** `screenshots/04-2026-10-15-5f02a23-static-three-essays-reu.png` (1440 × 3565 px, 563 KB)
- **WebP Asset:** `webp/04-2026-10-15-5f02a23-static-three-essays-reu.webp` (233 KB, 41.3% of PNG size)

---

### Version 5: Portfolio V2 Editorial Redesign (Current Approved Website)
- **Commit:** `c893e07ca07d7211bf7df064731c6328325b7414` (`c893e07`)
- **Date:** October 19, 2026 (15:20:32 -0400)
- **Author:** Utkarsh Sonawane
- **Commit Message:** `Merge portfolio navigation and copy polish` (merging `e27541d` onto Portfolio V2 merge `8767c76`)
- **Architecture:** Semantic HTML5, Custom Editorial Typography, Responsive CSS
- **Visual Changes from Previous:**
  - **Complete aesthetic metamorphosis** inspired by literary notebooks, scholarly presses, and minimalist personal websites (such as Sophie L. Wang):
    - Warm cream parchment background (`#FAF7F2` / `#F5EFEB`).
    - Handcrafted script brand wordmark: `utkarsh.` in the top header.
    - Minimalist navigation: `Projects`, `Research notebook`, `Blog`, `Résumé ↗`.
    - Restrained serif editorial typography (Newsreader serif paired with Inter sans).
  - Seven original hand-drawn editorial illustrations embedded throughout the experience:
    - Open notebook sketch beside the personal bio.
    - Meal plate illustration for Nytr.
    - Neural network graph illustration for Clage.
    - Apple Watch / audio waveform illustration for Talks.
    - Post-it message notes illustration for Devvy.
    - Scientific evidence illustration for research experiments.
    - Research notebook sketch for the ADR research section.
  - Dedicated reverse-chronological **Updates** section (`October 2026: Started undergraduate research on extracting adverse drug reaction reports from Reddit; September 2026: Elected Technical Chair of IEEE at Penn State`).
  - Standalone **Research** anchor featuring the Reddit adverse drug reaction study with link to the standalone research notebook.
  - Dedicated **Writing** section with RSS subscription link.
  - Full support for responsive editorial margin notes / sidenotes across article pages.
- **Screenshot Asset:** `screenshots/05-2026-10-19-c893e07-portfolio-v2-editorial.png` (1440 × 4438 px, 670 KB)
- **WebP Asset:** `webp/05-2026-10-19-c893e07-portfolio-v2-editorial.webp` (256 KB, 38.1% of PNG size)

---

## Gallery Curation & Filter Rationale

To maintain a focused and uncluttered visual narrative, the published visual gallery concentrates on **5 major structural transformations**. Intermediate snapshots previously audited were removed from published gallery assets:

1. **Omitted `02-2026-08-15-406c669-streamlined-nextjs`**:
   - An intermediate polish committed 1 day after the initial build. While it eliminated placeholder text, Version 01 serves as the foundational anchor for the initial Next.js portfolio.
2. **Omitted `03-2026-09-07-31b5f39-nytr-flagship-overhaul`**:
   - An intermediate September redesign. Its features (light mode, Nytr integration) were completely incorporated into Version 02 (`5d02121`), which represents the full peak of the Next.js era with Talks and recruiter signals.
3. **Omitted `06-2026-10-07-48a55a3-ranked-projects-hierarchy`**:
   - An intermediate step in the static HTML hierarchy. Version 04 (`5f02a23`) fully incorporates this hierarchy while adding the REU position and three published technical essays.

Additionally, non-visual commits (lockfile bumps, CI configuration, PDF updates, individual blog post subpages) were excluded from visual milestones.

---

## Portfolio V2 Finalization Status

- Portfolio V2 was officially specified in branch `design/portfolio-v2-spec-2026-10-19` (`ada03b5`), implemented in branch `codex/portfolio-v2` (`10e974d` through `ba494a0`), and merged directly into `main` via PR merge commit `8767c76` on October 19, 2026 at 15:05:05 EDT.
- A final polish pass simplifying the top navigation (`Projects · Research notebook · Blog · Résumé ↗`) was committed in `e27541d` and merged into `main` via merge commit `c893e07` on October 19, 2026 at 15:20:32 EDT.
- **Therefore, Portfolio V2 is finalized and approved on `main` at commit `c893e07`.** It is published as **Milestone 05**.
- Note: An exploratory PR branch, `origin/fix/nav-blog-resume-spacing-2026-10-19` (`43e1748`, 18:26:46 EDT), contains unmerged experimental constellation side ornaments; this is tracked in `manifest.json` as an active feature branch.

---

## Technical Verification & Render Quality

1. **Resolution & Consistency:**
   All 5 screenshots were captured with Playwright Chromium at an exact desktop viewport of `1440 × 900` (device scale factor 1.0) and exported as full-page documents.
2. **Font & Asset Loading:**
   Each render cycle invoked `await page.evaluate('document.fonts.ready')` and `wait_until='networkidle'` to ensure custom typefaces (Geist Sans, Geist Mono, Newsreader, Inter) and webp/jpg images loaded without layout shifts.
3. **Framer Motion Viewport Trigger Resolution:**
   Historical Next.js versions (`5d02121`) contained Framer Motion `<Reveal>` components with `whileInView` observers that initially kept out-of-viewport sections at `opacity: 0`. An automated DOM scroll-and-trigger sequence was executed across all section anchors before snapshot capture, ensuring 100% of the content was rendered at full opacity.
4. **Optimized WebP Derivatives:**
   Google's `cwebp -q 85` tool produced lightweight WebP counterparts, reducing total screenshot weight across all 5 versions from **2.65 MB (PNG)** to **1.11 MB (WebP)**—a **58.1% bandwidth reduction** with zero loss in visual clarity.
