# Portfolio V2 — implementation-ready design package

Prepared October 19, 2026 for Utkarsh Sonawane. **Specification only. Implementation, merge, deployment, and public site release require the owner's later approval.** Saving this package on its design branch is authorized.

Read in this order:

1. [Design specification](DESIGN-SPEC.md): exact layouts, visual tokens, content, interaction and responsive behavior.
2. [Asset specifications](ASSETS.md): approved wordmark, original illustration briefs, favicon and export requirements.
3. [Preservation audit](PRESERVATION.md): current repository inventory, facts, routes, limitations and deployment constraints.
4. [Codex implementation instructions](CODEX-IMPLEMENTATION.md): ready-to-paste workflow, implementation sequence and acceptance checks.
5. [Machine-readable baseline](preservation-baseline.json): SHA-256/size for every original tracked file, every HTML ID, href/src/poster and publication date.

## Decisions already made

- Official identity: the user's **second Ideogram-generated `utkarsh.` image**, copied without modification to [assets/utkarsh-wordmark-original.png](assets/utkarsh-wordmark-original.png). This is an actual uploaded asset, not a recreated font treatment.
- Cream canvas, sage links, restrained serif editorial headings, a narrow reading column, reverse-chronological updates, original notebook-inspired illustrations.
- Retain plain HTML/CSS/JavaScript and GitHub Pages. No framework migration, CMS, remote runtime or new hosting service.
- Keep existing article language, dates, URLs, case studies, media, technical evidence and limitations. Add a blog landing page and research anchor without breaking older links.
- Source inspiration: https://www.sophielwang.com/ (inspected October 19, 2026). Borrow readable density and dated updates, not its wording, drawings, personal details, markup or exact composition.

## Status / handoff

This package contains the original wordmark and detailed production briefs. It does **not** contain finished new illustrations, a generated favicon, a rendered V2 mockup, or implemented page changes. Those are explicit implementation tasks. Existing production files remain byte-for-byte unchanged in this planning commit. No user art creation is required.
