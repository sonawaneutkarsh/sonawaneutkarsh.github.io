#!/usr/bin/env python3
"""Publish Sunday essays staged outside the GitHub Pages deployment directory."""
import argparse
import json
from datetime import datetime, date, time, timezone
from email.utils import format_datetime
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
STAGING = ROOT / ".publishing"
ORIGIN = "https://sonawaneutkarsh.github.io"
ET = ZoneInfo("America/New_York")


def insert_index(page, post, home=False):
    url = f"/blog/{post['slug']}/"
    day = date.fromisoformat(post["date"])
    label = f"{day.strftime('%b')} {day.day}, {day.year}"
    title = escape(post["title"])
    if home:
        snippet = (
            f'          <li class="post-row">\n'
            f'            <time class="post-date" datetime="{day}">{label}</time>\n'
            f'            <a class="post-title" href="{url}">{title}</a>\n'
            f'          </li>\n'
        )
        start = page.find('<section id="blog">')
        assert start != -1, "Homepage writing section missing"
        needle = '<ul class="post-list">\n'
        at = page.find(needle, start)
        assert at != -1, "Homepage post list missing"
        return page[:at + len(needle)] + snippet + page[at + len(needle):]

    snippet = (
        f'          <li class="post-row">\n'
        f'            <time class="post-date" datetime="{day}">{label}</time>\n'
        f'            <div>\n'
        f'              <a class="post-title" href="{url}">{title}</a>\n'
        f'              <p>{escape(post["description"])}</p>\n'
        f'            </div>\n'
        f'          </li>\n'
    )
    needle = '<ul class="post-list">\n'
    assert page.count(needle) == 1, "Blog post list missing or ambiguous"
    return page.replace(needle, needle + snippet, 1)


def insert_rss(xml, post):
    day = date.fromisoformat(post["date"])
    at_noon = datetime.combine(day, time(12), tzinfo=ET).astimezone(timezone.utc)
    url = ORIGIN + f"/blog/{post['slug']}/"
    item = (
        "    <item>\n"
        f"      <title>{escape(post['title'])}</title>\n"
        f"      <link>{url}</link>\n"
        f'      <guid isPermaLink="true">{url}</guid>\n'
        f"      <pubDate>{format_datetime(at_noon, usegmt=True)}</pubDate>\n"
        f"      <description>{escape(post['description'])}</description>\n"
        "    </item>\n"
    )
    assert "    <item>" in xml, "Existing RSS items missing"
    return xml.replace("    <item>", item + "    <item>", 1)


def insert_sitemap(xml, post):
    url = ORIGIN + f"/blog/{post['slug']}/"
    assert "</urlset>" in xml, "Sitemap is missing closing urlset"
    return xml.replace(
        "</urlset>",
        f'  <url><loc>{url}</loc><lastmod>{post["date"]}</lastmod></url>\n</urlset>',
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--as-of", help="simulate a publish date as YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    now = date.fromisoformat(args.as_of) if args.as_of else datetime.now(ET).date()
    posts = json.loads((STAGING / "schedule.json").read_text(encoding="utf-8"))
    assert len({post["slug"] for post in posts}) == len(posts), "duplicate slug"
    for post in posts:
        assert date.fromisoformat(post["date"]).weekday() == 6, f"Not a Sunday: {post['date']}"

    due = [
        post for post in sorted(posts, key=lambda p: p["date"])
        if date.fromisoformat(post["date"]) <= now
        and not (ROOT / "blog" / post["slug"] / "index.html").exists()
    ]
    print(f"Sunday publishing check for {now} America/New_York: {len(due)} due.")
    if args.dry_run:
        for post in due:
            print(f"Would publish {post['date']} — {post['title']}")
        return
    if not due:
        return

    paths = {
        "index": ROOT / "index.html",
        "blog": ROOT / "blog" / "index.html",
        "feed": ROOT / "feed.xml",
        "map": ROOT / "sitemap.xml",
    }
    # Validate all due drafts before modifying the working tree.
    for post in due:
        path = STAGING / "posts" / post["slug"] / "index.html"
        if not path.is_file():
            raise RuntimeError(f"Missing staged article: {path}")
        source = path.read_text(encoding="utf-8")
        if f'datetime="{post["date"]}"' not in source or "<article" not in source:
            raise RuntimeError(f"Malformed staged article: {path}")

    result = {name: path.read_text(encoding="utf-8") for name, path in paths.items()}
    for post in due:
        result["index"] = insert_index(result["index"], post, home=True)
        result["blog"] = insert_index(result["blog"], post)
        result["feed"] = insert_rss(result["feed"], post)
        result["map"] = insert_sitemap(result["map"], post)

    for post in due:
        staged = STAGING / "posts" / post["slug"] / "index.html"
        destination = ROOT / "blog" / post["slug"] / "index.html"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(staged.read_bytes())
        staged.unlink()
        print(f"Released: {post['date']} — {post['title']}")
    for name, path in paths.items():
        path.write_text(result[name], encoding="utf-8")
    # The manifest remains as a schedule audit trail. Completed posts are
    # detected by their destination files, so runs are idempotent.


if __name__ == "__main__":
    main()
