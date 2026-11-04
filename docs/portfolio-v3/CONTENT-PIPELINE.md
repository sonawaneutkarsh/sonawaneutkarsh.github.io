# Content pipeline: one list of published posts

Branch `feat/vanilla-content-pipeline`, based on `feat/interactive-portfolio-v3`
at `36fe033`. It brings the Svelte experiment's content model
(`experiment/svelte-portfolio-v3`, PR #9 at `0996b9a`) to the vanilla site.
It does not bring Svelte, Vite, npm packages, a backend or hydration.
Visitors still get plain static files, and nothing about the homepage's look
or motion changes.

## What changed

V3 kept each post's listing metadata in four hand-edited places: the
homepage's Writing list, `/blog/`, `feed.xml` and `sitemap.xml`. The Sunday
publisher spliced strings into all four. Now:

- **`content/posts.json`** is the only list of published posts.
- **`scripts/build_writing.py`** renders the four places from it, using only
  Python's standard library. The output is committed, so GitHub Pages
  deploys the same kind of static files as before.
- **`scripts/publish_scheduled.py`** releases a due Sunday draft by adding its
  record to `content/posts.json`, moving the draft into `blog/<slug>/`, and
  regenerating. It checks the whole result before it writes, and then writes
  every file or none.
- CI checks that the committed files match `content/posts.json`, and runs 83
  new tests.

## Data flow

```
.publishing/schedule.json            date, slug, title, description (audit trail, never edited)
.publishing/posts/<slug>/index.html  the staged article (never deployed)
        │
        │  scripts/publish_scheduled.py, on the post's Sunday in America/New_York
        ▼
content/posts.json  ──  scripts/build_writing.py  ──►  index.html       writing:latest (newest 3)
the only list of                                  ├─►  blog/index.html  writing:archive (all, by year)
published posts                                   ├─►  feed.xml         RSS 2.0 (all, newest first)
        ▲                                         └─►  sitemap.xml      post URLs (other URLs untouched)
        │
        └─ a post published by hand: add blog/<slug>/index.html and its record, run build_writing.py
```

Article pages (`blog/<slug>/index.html`) stay hand-written HTML. The
generator only reads them, to check that each page agrees with its record.

### `content/posts.json`

A JSON array, newest first. Records with the same date keep their file order.

| Field | Required | Used for |
| --- | --- | --- |
| `slug` | yes | URL `/blog/<slug>/`. The RSS `<link>`, the `<guid isPermaLink="true">` and the canonical URL are all derived from it. |
| `title` | yes | Homepage and `/blog/` link text, RSS title. Must equal the article's `<h1>`. The article's `<title>` must be `<title> — Utkarsh Sonawane`. |
| `date` | yes | `YYYY-MM-DD`, the publication day in New York. Used for ordering, the "Nov 1, 2026" label, `<time datetime>`, and the year headings on `/blog/`. Must equal the article's `<time class="date">`. |
| `pubDate` | yes | RSS timestamp in UTC, e.g. `2026-11-01T17:00:00Z`. Posts from before the scheduled releases use midnight UTC. Scheduled ones use noon in New York. It is stored rather than computed, so historical feed times never move. |
| `description` | yes | `/blog/` excerpt and RSS `<description>`. This can differ from the article's meta description, and does for three older posts. |
| `updated` | no | Sitemap `lastmod` when it differs from `date`. Only `thoughts-on-slms-for-businesses` has one (2026-10-06), because that is what V3's sitemap said. |

Unknown fields, duplicate slugs, wrong ordering, a `pubDate` on a different
UTC day from `date`, and posts dated after today in New York are all
rejected.

The file was derived mechanically from V3's `feed.xml`, `blog/index.html` and
`sitemap.xml`. From it the generator reproduces `feed.xml` and `sitemap.xml`
byte for byte.

### Generated regions

`index.html` and `blog/index.html` each contain one generated block between
marker comments. Everything outside the markers is hand-written and never
touched:

```html
<!-- BEGIN writing:latest (generated from content/posts.json by scripts/build_writing.py; edit that file, not this list) -->
<ul class="post-list">…</ul>
<!-- END writing:latest -->
```

The rows use the same elements and classes as before. Homepage rows are
`li.post-row > time.post-date + a.post-title`. `/blog/` rows are
`li.post-row > time.post-date + div > (a.post-title + p)`, with one `<h2>`
year heading and list per year. A 2027 post therefore starts a new "2027"
group. V3's publisher would have put it under "2026".

`feed.xml` is regenerated whole. `sitemap.xml` keeps every URL that is not a
post exactly where it is. Each post keeps its line and position, new posts
are appended (oldest first, as the old publisher did), and `/blog/<slug>/`
URLs with no record are removed.

## Commands

| Task | V3 | Now |
| --- | --- | --- |
| Publish a post by hand | Edit the homepage list, `/blog/`, `feed.xml` and the sitemap, then run `check_feed.py` | Add `blog/<slug>/index.html`, add its record at the top of `content/posts.json`, run `python3 scripts/build_writing.py` |
| Fix a title or description | Edit it in three or four files | Edit `content/posts.json` (for a title, the article's `<h1>` and `<title>` too), run `python3 scripts/build_writing.py` |
| Check the writing pages | `python3 scripts/check_feed.py` | `python3 scripts/build_writing.py --check` (`check_feed.py` still runs too) |
| Schedule a Sunday post | Stage the draft, add it to `.publishing/schedule.json` | Unchanged |
| See what would be released | `publish_scheduled.py --dry-run` (printed the due list only) | Same command. It now also validates each due draft and the complete result, and exits 1 if the release would fail. |
| Rehearse a date | `publish_scheduled.py --as-of YYYY-MM-DD` | Unchanged. Use it on a copy, never on the real checkout. |
| Test the pipeline | none | `python3 -m unittest discover -s tests/content -v` |

`build_writing.py --check` exits 1 and prints a diff if a generated file was
edited by hand. Running `build_writing.py` repairs it.

## Sunday publishing

The cron (`17 17 * * 0`, 12:17 EST) and the workflow's shape are unchanged:
check out `main`, release, check, commit, push, deploy. What changed:

- **Release.** A due post is released by adding its record. A post counts as
  published once its slug is in `content/posts.json`. Due means its date is
  on or before today in America/New_York. Due posts are released oldest
  first, so missed Sundays catch up in order.
- **Validate before writing.** Each due draft must exist and must be an
  article whose canonical URL, `og:url`, `<h1>`, `<title>`, `og:title` and
  `<time class="date">` match its schedule entry. The new list of records is
  validated, every generated file is rendered in memory, and the whole site
  check runs on that in-memory result.
- **Write all or nothing.** The new files are written to temporary files and
  then renamed into place. If anything fails, every touched file is restored
  and new directories are removed.
- **Idempotent.** A repeated run finds nothing due and changes no byte. A
  staged draft whose slug is already published is ignored, with a note. It
  never overwrites the live article and never adds a second row, feed item
  or sitemap entry.
- **Inconsistent states stop the release**, before anything is written:
  - a record whose article is missing;
  - an article in `blog/` that has no record;
  - a duplicate slug in the schedule;
  - a schedule date that is not a Sunday.
- **Nothing early.** Nothing outside `content/posts.json` reaches the lists,
  feed or sitemap. A record dated after today is rejected. `--check` also
  fails if a not-yet-due schedule entry is already in `content/posts.json`,
  has a page in `blog/`, or is linked from any generated file. Drafts live in
  `.publishing/`, which neither Pages workflow copies into `_site`.
- **Workflow.**
  - `publish_scheduled.yml` runs `build_writing.py --check` next to the
    existing four checks, before the commit.
  - It adds `content/` to the release commit (`git add -A index.html blog/
    feed.xml sitemap.xml .publishing/ content/`).
  - It refuses to push if the release left any change outside the commit.
  - `deploy.yml`'s `check` job runs `build_writing.py --check` and the
    content tests on every pull request and push to `main`. Its timeout went
    from 5 to 10 minutes.

## Tests

`tests/content/` uses only the standard library and has no fixtures to keep
up to date. Every test that writes uses a scratch copy in a temporary
directory, so none of them touches the checkout. A guard fails the run if
one does.

Baselines come from git: `1792466` is `main` when V3 branched from it. It
has V3's five posts, `feed.xml` and `blog/index.html` byte for byte, plus
both staged drafts, and it stays in `main`'s history whatever happens to the
V3 branch. The tests therefore need full history (`fetch-depth: 0`, which
the `check` job already uses).

| Area | Tests |
| --- | --- |
| 1. Single-source consistency | `SingleSourceTests`, `ValidationTests` (`test_posts.py`) |
| 2. Homepage latest three | `LatestThreeTests` |
| 3. Archive completeness | `ArchiveTests` |
| 4. RSS and stable GUIDs | `FeedTests`: byte-identical to the baseline feed for the original posts; old items keep their bytes when a post is added; EDT/EST noon |
| 5. Sitemap | `SitemapTests`: every baseline line kept in order; append, removal and dedupe; non-post URLs untouched |
| 6. Scheduled publication | `ScheduledPublicationTests` (`test_publisher.py`): New York date boundary, two successive Sundays plus repeats, catch-up, dry run |
| 7. Duplicate prevention | `DuplicatePreventionTests` |
| 8. Unpublished content exclusion | `UnpublishedExclusionTests`, `DeployedSiteTests` (stages `_site` from the workflow's own `cp -r` list) |
| 9. HTML output and links | `HtmlOutputTests`: markers, no trailing whitespace, nothing outside the markers changes, baseline links kept, `check_links.py`, `html-validate` |
| 10. Articles and protected assets | `PreservationTests`, `GeneratorCommandTests` |
| Failures | `FailureTests`: one bad draft blocks the whole release; a simulated disk failure on the third rename restores every file |
| Full rehearsal | `RealDraftRehearsal`, `SyntheticRehearsal` (`test_rehearsal.py`) |
| Workflows | `WorkflowTests`: same deploy allowlist in both workflows; the release commit covers every file a release writes; checks come before the commit |

About the full rehearsal:

- It releases each pending real draft on its own Sunday, in a scratch clone
  that shares this repository's objects. Today those drafts are Nov 8 and
  Nov 15.
- After each release it runs `build_writing.py --check`, `check_feed.py`,
  `check_links.py`, `check_preservation.py` and `html-validate`. It then runs
  the publisher again on the last Sunday and stages the Pages artifact.
- The synthetic rehearsal does the same with two 2030 drafts, so the release
  path stays tested after the real drafts are published.
- `html-validate` is required when `CI` is set. Locally it is skipped if it
  is not installed.

## Verification

Run in the sandbox on November 4, 2026 (Chrome for Testing 151, Python 3.11,
Node 22):

| Check | V3 (`36fe033`) | This branch |
| --- | --- | --- |
| `check_links.py` | 525 references in 20 pages | 525 references in 20 pages |
| `check_feed.py` | 5 posts | 5 posts |
| `check_preservation.py` | passed (8 bodies, 48 IDs, 23 assets) | passed (8 bodies, 48 IDs, 23 assets) |
| `node tests/e2e/run.mjs` (all suites) | 245/245 | 245/245, the same check list |
| `node tests/e2e/run.mjs` after rehearsing Nov 8 and Nov 15 on a copy | | 249/249 (4 route checks for the two new posts) |
| `python3 -m unittest discover -s tests/content` | | 83 run: 82 pass, 1 skipped (html-validate not installable in the sandbox) |
| Mutation check: 23 deliberate breakages of the generator, publisher, workflows and content | | 23 caught |

Not run in the sandbox, so pull-request CI is the evidence:

- `html-validate`: the sandbox cannot reach the npm registry.
- The Firefox suite: Firefox is not installed in the sandbox.

**Same output as the old publisher.** A copy of V3 was released with its old
publisher, and a copy of this branch with the new one, for 2026-11-08 and
then 2026-11-15. The two copies ended with byte-identical `feed.xml`,
`sitemap.xml` and article files, and identical homepage and `/blog/` rows.
The new publisher also removes the empty draft folders that the old one left
behind.

**Visual comparison.** `/` and `/blog/` were captured as full-page
screenshots at 1440, 1024, 768, 390 and 320 px, with reduced motion and with
full motion (after a 3.5 s settle), for V3 and for this branch. That is 20
pairs, decoded and compared pixel by pixel. The writing section's text,
links, markup and row boxes were compared too.

- 19 pairs are pixel-identical.
- The other pair, `/` at 390 px with full motion, differs by 8 pixels inside
  the hero icon (y ≈ 303). That is an animation frame: two runs of V3
  against itself differ at the same spot (8 and 47 pixels).
- The writing DOM is identical in all 20 pairs.

**Deployed files.** The `_site` tree staged by the workflow's `cp -r` list
has 90 files on both sides. Only `index.html` and `blog/index.html` differ.

| File | V3 raw → now | gzip -9 |
| --- | --- | --- |
| `index.html` | 27,999 → 28,112 B | 6,809 → 6,873 B |
| `blog/index.html` | 5,256 → 5,173 B | 1,695 → 1,722 B |
| `feed.xml`, `sitemap.xml` | identical | identical |
| JavaScript (`js/*.js`, `script.js`) | 99,351 B, identical | identical |

`node tests/e2e/perf.mjs` (local server, so treat timings as noise):

- `/` is 497.2 vs 497.3 KB, with 64.1 KB of JS on both and 16 requests on
  both. FCP is 52 ms on both.
- `/blog/` is 103.4 vs 103.3 KB.
- No route has idle animation frames.

There are no new runtime dependencies, no `package.json` and no build step
for visitors.

## Before this reaches `main`

GitHub runs scheduled workflows from the default branch, and this workflow
checks out `main`. Until V3 and this branch are merged, **`main`'s old
publisher keeps releasing the Sunday posts on `main`**: Nov 8 (the next big
AI company) and Nov 15 (how my website came into being). This branch changes
nothing on `main`.

If those releases happen first, merging `main` into the V3 line will
conflict in `index.html`, `blog/index.html`, `feed.xml`, `sitemap.xml` and
`.publishing/`. To resolve it:

1. Keep `main`'s `blog/<slug>/index.html` for each released post, and let the
   staged drafts be deleted.
2. Add a record for each released post at the top of `content/posts.json`,
   with `pubDate` at noon New York in UTC: `2026-11-15T17:00:00Z` and
   `2026-11-08T17:00:00Z`. The title, date and description come from
   `.publishing/schedule.json`.
3. Resolve the four generated files with either side, then run
   `python3 scripts/build_writing.py`. It rewrites them from the records.
4. Run `python3 scripts/build_writing.py --check` and
   `python3 -m unittest discover -s tests/content`.

`--check` lists anything that is still inconsistent, such as an article
without a record. The two pipelines produce the same feed and sitemap for
these releases (see above), so subscribers see no change.

## Notes

- The Nov 15 draft's meta description reads "Five snapshots … from the
  first portfolio in August …". Its schedule entry, which feeds `/blog/` and
  RSS, reads "five snapshots … from the first version in August …". Both are
  kept as written, the same way older posts have separate excerpts and meta
  descriptions.
- The sitemap `lastmod` for `/` and `/blog/` is not bumped on release, the
  same as before.
- `images/website-history/`, which the Nov 15 post uses, is deployed through
  `images/` already. This predates this branch and exposes no article text.
- A post is due on its Sunday's date in New York, as before. A manual
  `workflow_dispatch` early on a Sunday would release it before its noon
  `pubDate`.
