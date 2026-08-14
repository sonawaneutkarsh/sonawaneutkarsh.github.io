# Portfolio

A minimal, premium portfolio site built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. Static-exported and deployed to GitHub Pages. Includes a Recruiter / Experience mode toggle, with all content driven by the `/data` directory.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run build` produces a static export in `/out`.

## How deployment works

Pushing to `main` triggers the GitHub Action in `.github/workflows/deploy.yml`:

1. Installs dependencies (`npm ci`)
2. Builds the static export (`npm run build` → `/out`)
3. Deploys `/out` to GitHub Pages via the `deploy-pages` action

The site is then live at `https://sonawaneutkarsh.github.io/`. The empty `public/.nojekyll` file ships with the export so GitHub Pages doesn't run Jekyll (which would ignore Next.js's `_next` folder).

## Editing content

All site content lives in `/data` — the UI reads these files directly. Edit a file and push; the site rebuilds automatically.

| File | What it controls |
|---|---|
| `data/projects.ts` | Projects (title, one-liner, description, role, tech, metrics, status). Order in the array = display order. `featured: true` marks Clage for the hero proof card. |
| `data/education.ts` | School, degree, honors college, CGPA, graduation, extracurriculars. |
| `data/experience.ts` | Work experience entries (currently empty — add the DataPhi internship here once confirmed). |
| `data/skills.ts` | Skill groups and their tag lists. |
| `data/achievements.ts` | Achievements with optional detail. |
| `data/books.ts` | Books grouped by status (`reading` / `read` / `owned`). |
| `data/certifications.ts` | Certifications (renders nothing while empty). |
| `data/contact.ts` | Name, email, phone, LinkedIn, GitHub, resume URL, location. Only non-empty fields render. |
| `data/types.ts` | TypeScript types for all of the above. |

### Still TODO
- About-section bio copy (marked with a TODO in `components/about.tsx`)
- `data/contact.ts` values beyond GitHub
- Project screenshot slots (marked with TODOs in `components/projects.tsx` / `components/hero.tsx`)
- A real favicon and `og:image` social card
