#!/usr/bin/env python3
"""Publish Sunday essays staged outside the deployed site.

Drafts wait in .publishing/posts/<slug>/index.html, listed in
.publishing/schedule.json. When one is due (its Sunday has arrived in
America/New_York) this script:

1. checks every due draft before touching anything;
2. moves the draft to static/blog/<slug>/index.html (its permanent URL);
3. prepends its record to src/lib/content/posts.json, the single list of
   published posts that the build turns into the homepage's latest three,
   /blog/ and /feed.xml (RSS time: noon in New York, as before);
4. adds the URL to static/sitemap.xml.

The workflow then builds the site, runs the checks and deploys build/.
Runs are idempotent: a post counts as published once its article exists.
Drafts never enter static/ or posts.json before their date, so the build
cannot expose them.
"""
import argparse
import json
from datetime import datetime, date, time, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / ".publishing"
ARTICLES = ROOT / "static" / "blog"
MANIFEST = ROOT / "src" / "lib" / "content" / "posts.json"
SITEMAP = ROOT / "static" / "sitemap.xml"
ORIGIN = "https://sonawaneutkarsh.github.io"
ET = ZoneInfo("America/New_York")


def rss_time(day):
    """Noon in New York on the publication day, as a UTC ISO timestamp."""
    noon = datetime.combine(day, time(12), tzinfo=ET).astimezone(timezone.utc)
    return noon.strftime("%Y-%m-%dT%H:%M:%SZ")


def record(post):
    day = date.fromisoformat(post["date"])
    return {
        "slug": post["slug"],
        "title": post["title"],
        "date": post["date"],
        "pubDate": rss_time(day),
        "description": post["description"],
    }


def insert_sitemap(xml, post):
    url = f"{ORIGIN}/blog/{post['slug']}/"
    assert "</urlset>" in xml, "Sitemap is missing closing urlset"
    if f"<loc>{url}</loc>" in xml:
        return xml
    return xml.replace(
        "</urlset>",
        f'  <url><loc>{url}</loc><lastmod>{post["date"]}</lastmod></url>\n</urlset>',
    )


def write_manifest(records):
    MANIFEST.write_text(json.dumps(records, indent="\t", ensure_ascii=False) + "\n", encoding="utf-8")


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--as-of", help="simulate a publish date as YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    now = date.fromisoformat(args.as_of) if args.as_of else datetime.now(ET).date()
    posts = json.loads((STAGING / "schedule.json").read_text(encoding="utf-8"))
    assert len({post["slug"] for post in posts}) == len(posts), "duplicate slug"
    for post in posts:
        assert date.fromisoformat(post["date"]).weekday() == 6, f"Not a Sunday: {post['date']}"

    published = json.loads(MANIFEST.read_text(encoding="utf-8"))
    known = {p["slug"] for p in published}
    due = [
        post for post in sorted(posts, key=lambda p: p["date"])
        if date.fromisoformat(post["date"]) <= now
        and not (ARTICLES / post["slug"] / "index.html").exists()
    ]
    print(f"Sunday publishing check for {now} America/New_York: {len(due)} due.")
    if args.dry_run:
        for post in due:
            print(f"Would publish {post['date']} — {post['title']}")
        return 0
    if not due:
        return 0

    # Validate all due drafts before modifying the working tree.
    for post in due:
        path = STAGING / "posts" / post["slug"] / "index.html"
        if not path.is_file():
            raise RuntimeError(f"Missing staged article: {path}")
        source = path.read_text(encoding="utf-8")
        if f'datetime="{post["date"]}"' not in source or "<article" not in source:
            raise RuntimeError(f"Malformed staged article: {path}")
        if post["slug"] in known:
            raise RuntimeError(f"{post['slug']} is already in posts.json but its article is missing")

    sitemap = SITEMAP.read_text(encoding="utf-8")
    for post in due:
        published.insert(0, record(post))
        sitemap = insert_sitemap(sitemap, post)
    published.sort(key=lambda p: p["date"], reverse=True)

    for post in due:
        staged = STAGING / "posts" / post["slug"] / "index.html"
        destination = ARTICLES / post["slug"] / "index.html"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(staged.read_bytes())
        staged.unlink()
        try:
            staged.parent.rmdir()
        except OSError:
            pass
        print(f"Released: {post['date']} — {post['title']}")
    write_manifest(published)
    SITEMAP.write_text(sitemap, encoding="utf-8")
    # The schedule stays as an audit trail; completed posts are detected by
    # their destination files, so runs are idempotent.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
