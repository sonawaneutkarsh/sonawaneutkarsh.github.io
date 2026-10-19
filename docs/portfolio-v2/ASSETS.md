# Asset production specification

## Official wordmark — selected and supplied

- User selection: **second Ideogram image**, reads `utkarsh.` including the final dot.
- Original upload: `image(20261019-040914).png`; saved byte-for-byte as `docs/portfolio-v2/assets/utkarsh-wordmark-original.png`.
- Dimensions: **1134 × 382px**, aspect ratio **2.9686:1**. Cream background with olive/sage handwritten ink and long flourishes. Dominant background pixel: RGB(252,250,240), `#FCFAF0`, which is the site paper token.
- The adjacent preservation-baseline.json records the actual source SHA-256. Treat this master as immutable. Do not regenerate, redraw, replace lettering, or remove the dot. No need to reattach the image in the next conversation: it is in git.
- Later production target: `images/brand/utkarsh-wordmark.png` or lossless WebP after visual verification. Retain the source. Render at 228px wide desktop / 190px mobile, intrinsic ratio. Export 684px wide (3× desktop) if lossless downsampling looks clean. Preserve the original full canvas and padding; no aggressive auto-trim or removal of the k/h flourishes.
- Default is the approved opaque cream image directly on matching paper. Minor compression/color variations may leave a faint edge; inspect at 1×/2×. If that is visible, prepare an alpha derivative from the existing pixels, using image editing tools and preserving stroke shape, then compare against the source. Do not silently apply thresholding or trace into a different signature. A new generation is never an acceptable substitute.
- Website alt behavior: image decorative within an explicitly labeled home link, full accessible name `Utkarsh Sonawane — home`. Keep a real-text H1 elsewhere.
- Budget: derivative <=80 KiB if achievable without visible stroke degradation. No remote Ideogram URL or runtime dependency.

## Original illustration family

Owner does not need to draw anything. The implementing agent produces simple SVG line art directly in code using the following geometric briefs, or uses available image-generation tooling for a raster version if necessary. Prefer native SVG for these tiny objects: consistent curves, light fills, no text, clean exports. This does not authorize recreating the approved raster wordmark as SVG.

Style constants: viewBox `0 0 320 240`, stroke `#6B745D`, stroke-width `2`, rounded caps/joins, fill `none` with occasional `#EDF0E5` washes. Use sparse original asymmetry rather than artificial noisy distress. No black outlines, shadows, faux paper texture, stock icon packs, recognizable mascots or drawings copied from Sophie Wang. No external SVG scripts/fonts/images. Decorative images have `alt=""`; visible text supplies all meaning. Six assets total, <=12 KiB each. Do not generate six large hero pictures.

| File (later implementation path) | Composition | Display / use |
| --- | --- | --- |
| `images/illustrations/notebook.svg` | Open notebook centered x=160,y=132; pages span x=48–272,y=68–194; curved spine x=160; three small connected nodes on left page; one curled page corner top-right; short pencil below tilted -12°. Keep 28px empty margin. | Intro; 180px wide desktop, 112px mobile |
| `images/illustrations/nytr.svg` | Small plate with fork and one leaf, no branded UI, no nutrition numbers. Circle centered x=164,y=123,r=66; short fork at x=66. | Nytr catalogue row; 128px / 96px |
| `images/illustrations/clage.svg` | Five irregular nodes connected by seven curved lines, three small seed-like dots beneath; do not present a real network architecture or measured behavior. | Clage row; 128px / 96px |
| `images/illustrations/talks.svg` | Small rounded watch with a separate note page and a single curved transfer arrow; no Apple logo, fake screen text or transcript. | Talks row; 128px / 96px |
| `images/illustrations/devvy.svg` | Three small plain terminal frames converging toward one simple status dot; omit product logos and faux code. | Devvy row; 128px / 96px |
| `images/illustrations/evidence.svg` | Two overlapping paper slips connected with a fine bracket, three short lines per slip and a small outlined check; no medical cross or simulated clinical claim. | Research margin or header; 80px max |

If a raster route is chosen, reusable generation brief: “Create one original restrained notebook illustration of [composition above], isolated on solid #FCFAF0, thin muted sage #6B745D lines, sparse pale #EDF0E5 fill, generous negative space, no text, no lettering, no logo, no gradients, no shadow, precise simple object silhouette, editorial personal computing notebook mood.” Export to transparent PNG or WebP only if edges remain clean; record generation provenance. Do not ask the user to make assets manually. Use simple code-native SVG by default so no paid external account is needed.

Keep existing product screenshots and both demo videos unchanged. Illustrations distinguish catalogue entries, while actual screenshots remain the evidence in case studies. No invented charts or generated screenshots.

## Custom favicon — exact identity and export brief

Use a **simple lowercase `u` monogram with a separate dot**, drawn as original vector paths, not the full wordmark squeezed into 16px. This is a companion mark; it does not replace the official signature.

- Artboard 64×64. Rounded cream square background, radius 14; sage `#455C47` glyph.
- Draw u as path `M 17 20 L 17 35 C 17 49 39 49 39 35 L 39 20`, no fill, 7px stroke, rounded ends. Draw dot circle center(51,45), radius 3.5. Safe bounds x=10–56, y=12–53. No text/font dependency.
- Export `favicon.svg`, root `favicon.ico` with actual 16/32/48px frames, `favicon-32x32.png`, optional `favicon-16x16.png`, root `apple-touch-icon.png` at 180×180. Apple icon uses opaque cream and safe center padding. Keep root compatibility filenames already referenced across pages.
- At 16px, optically increase monogram stroke/dot if needed; verify the u does not look like a v and dot remains a separate pixel cluster. Inspect on both light and dark browser chrome. No need for dark-mode site styling.
- HTML: SVG icon `type="image/svg+xml"`, PNG size-qualified fallback, `rel="icon"` ICO fallback, Apple touch icon. All pages including 404 get the set. Keep 404 URLs root-relative.
- Do not create a web manifest/PWA unless separately requested. favicon.svg sits at repo root; update the future deployment staging list to include it. No data-URI-only icon.

## Asset QA and availability

Original wordmark is supplied and present. All new illustration and favicon paths above are **planned files**, not currently implemented. Before wiring a path into HTML, create it and run internal link checks. Asset license/provenance: retain user-provided Ideogram source and record owner selection; this package does not independently verify third-party account licensing. Original SVGs should be created in the repo and not copied from the reference site. No asset purchase or subscription required by this plan.
