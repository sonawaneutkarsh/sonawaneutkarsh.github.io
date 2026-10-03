# Utkarsh Sonawane — Personal Portfolio

Clean, fast, static portfolio and personal site deployable directly to **GitHub Pages**. Modeled directly on [Alisa Liu's site](https://alisawuffles.github.io/).

## Design Language & System

- **Background:** Near-white (`#FAFAFA`) in pure light mode.
- **Cards:** Crisp white (`#FFFFFF`) with thin light-gray border (`#E5E7EB`) and subtle shadow (`0 1px 3px rgba(0, 0, 0, 0.04)`).
- **Typography:** System sans-serif stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Source Sans 3`, `Inter`).
- **Accent:** Deep violet / purple (`#6D28D9`) used for inline links, active filter pills, outlined pill buttons, and section subheadings.
- **Projects Showcase:** Replicates academic publication section with client-side instant filtering across topics (`AI Agents`, `Mobile`, `ML Research`), key metric callouts, and purple pill buttons (`Code`, `Deep Dive`).
- **Deep Dives:** Comprehensive standalone case studies for Nytr, Talks, Clage, Devvy, and ScholarAI featuring sticky left `CONTENTS` scrollspy navigation, local video demo, architecture breakdowns, and benchmarks.
- **Blog:** Minimal blog index with clean date alignment (`YYYY-MM-DD Title`) and individual post pages.
- **Performance:** Zero framework dependencies, pure static HTML5 / CSS3 / ES6.

## Directory Structure

```text
.
├── index.html              # Main single-scrolling portfolio
├── styles.css              # Custom responsive stylesheet (light mode & typography)
├── script.js               # Client-side topic filtering and TOC scrollspy
├── avatar.jpg              # High-DPI circular profile photo
├── resume.pdf              # PDF résumé
├── favicon.ico             # Favicon
├── favicon-32x32.png       # High-res Favicon
├── .nojekyll               # Disables Jekyll processing on GitHub Pages
├── assets/                 # Brand icons (alphaXiv, Hugging Face, Google Scholar)
├── images/                 # Project screenshots and diagrams
├── videos/                 # Project demo videos
├── blog/
│   ├── thoughts-on-slms-for-businesses/
│   │   └── index.html      # Blog post page
│   └── hello-world/
│       └── index.html      # Redirect to thoughts-on-slms-for-businesses
└── projects/
    ├── nytr/index.html     # Nytr technical case study
    ├── talks/index.html    # Talks technical case study
    ├── clage/index.html    # Clage technical case study
    ├── devvy/index.html    # Devvy technical case study
    └── scholarai/index.html# ScholarAI technical case study
```

## Local Preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.
