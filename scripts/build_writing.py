#!/usr/bin/env python3
"""Generate the writing lists, RSS feed and sitemap entries from content/posts.json.

content/posts.json is the only list of published posts. From it, using only
Python's standard library, this script writes:

- the homepage's latest three posts (index.html, between the writing:latest
  markers);
- the complete /blog/ archive, grouped by year (blog/index.html, between the
  writing:archive markers);
- feed.xml, an RSS 2.0 feed of every published post, newest first;
- the post URLs in sitemap.xml. Existing entries keep their place, new posts
  are appended, and URLs that are not posts are left alone.

The generated files are committed, so GitHub Pages still serves plain static
files and visitors run nothing new. Article pages (blog/<slug>/index.html) are
written by hand or released by scripts/publish_scheduled.py. This script only
reads them, to check that each page's title, date and canonical URL match its
record.

    python3 scripts/build_writing.py           # rewrite the generated files
    python3 scripts/build_writing.py --check   # change nothing; exit 1 if stale or inconsistent
"""
from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import sys
from datetime import date, datetime, time, timezone
from email.utils import format_datetime
from html import escape
from html.parser import HTMLParser
from itertools import groupby
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://sonawaneutkarsh.github.io"
SITE_NAME = "Utkarsh Sonawane"
WRITING_DESCRIPTION = "Notes on building software, learning AI, and figuring things out."
NEW_YORK = ZoneInfo("America/New_York")
HOME_POSTS = 3

# Repository-relative paths.
POSTS = "content/posts.json"
SCHEDULE = ".publishing/schedule.json"
STAGED = ".publishing/posts"
HOME = "index.html"
ARCHIVE = "blog/index.html"
FEED = "feed.xml"
SITEMAP = "sitemap.xml"
GENERATED = (HOME, ARCHIVE, FEED, SITEMAP)

POST_FIELDS = ("slug", "title", "date", "updated", "pubDate", "description")
REQUIRED_POST_FIELDS = ("slug", "title", "date", "pubDate", "description")
SCHEDULE_FIELDS = ("date", "slug", "title", "description")
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
ISO_DAY = re.compile(r"\d{4}-\d{2}-\d{2}")
UTC_STAMP = "%Y-%m-%dT%H:%M:%SZ"
MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


class ContentError(Exception):
    """The content or the generated files are inconsistent. Nothing was written."""

    def __init__(self, problems):
        self.problems = [problems] if isinstance(problems, str) else list(problems)
        super().__init__("\n".join(self.problems))


# --------------------------------------------------------------------------
# Small helpers


def iso_day(value):
    """Parse a strict YYYY-MM-DD string. Return None for anything else."""
    if isinstance(value, str) and ISO_DAY.fullmatch(value):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
    return None


def day_argument(value):
    """argparse type for --as-of."""
    day = iso_day(value)
    if day is None:
        raise argparse.ArgumentTypeError(f"expected YYYY-MM-DD, got {value!r}")
    return day


def today_in_new_york(now=None):
    """The calendar date in New York at `now` (an aware datetime; default: the current time)."""
    return (now or datetime.now(timezone.utc)).astimezone(NEW_YORK).date()


def normalize_space(text):
    return " ".join((text or "").split())


def post_path(post):
    return f"/blog/{post['slug']}/"


def post_url(post):
    return ORIGIN + post_path(post)


def date_label(iso):
    """'Nov 1, 2026': the label the site has always used for post dates."""
    day = date.fromisoformat(iso)
    return f"{MONTHS[day.month - 1]} {day.day}, {day.year}"


def release_pub_date(day):
    """Noon in New York on a release day, as the UTC timestamp stored in pubDate."""
    noon = datetime.combine(day, time(12), tzinfo=NEW_YORK).astimezone(timezone.utc)
    return noon.strftime(UTC_STAMP)


def rss_date(pub_date):
    """'2026-11-01T17:00:00Z' -> 'Sun, 01 Nov 2026 17:00:00 GMT' (RFC 822, as before)."""
    moment = datetime.strptime(pub_date, UTC_STAMP).replace(tzinfo=timezone.utc)
    return format_datetime(moment, usegmt=True)


def read_json(root, rel):
    path = Path(root) / rel
    try:
        return json.loads(path.read_bytes().decode("utf-8"))
    except FileNotFoundError:
        raise ContentError(f"{rel} is missing") from None
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ContentError(f"{rel} is not valid UTF-8 JSON: {error}") from None


# --------------------------------------------------------------------------
# content/posts.json and .publishing/schedule.json


def validate_posts(records, today=None):
    """Return the problems with a list of post records (empty when valid).

    Records must be newest first. With `today`, a post dated in the future is a
    problem: it would go live as soon as the site deploys.
    """
    if not isinstance(records, list):
        return [f"{POSTS} must be a JSON array of post records"]
    problems = []
    seen = set()
    oldest_so_far = None
    for index, post in enumerate(records):
        where = f"{POSTS}[{index}]"
        if not isinstance(post, dict):
            problems.append(f"{where} must be an object")
            continue
        slug = post.get("slug")
        if isinstance(slug, str):
            where = f"{POSTS} {slug!r}"
        missing = [key for key in REQUIRED_POST_FIELDS if key not in post]
        unknown = sorted(set(post) - set(POST_FIELDS))
        if missing:
            problems.append(f"{where}: missing {', '.join(missing)}")
        if unknown:
            problems.append(f"{where}: unknown field(s) {', '.join(unknown)}")
        if not (isinstance(slug, str) and SLUG.fullmatch(slug)):
            problems.append(f"{where}: slug must be lowercase letters and digits joined by single hyphens")
        elif slug in seen:
            problems.append(f"{where}: duplicate slug")
        else:
            seen.add(slug)
        for key in ("title", "description"):
            value = post.get(key)
            if not isinstance(value, str) or not value.strip() or value != normalize_space(value):
                problems.append(f"{where}: {key} must be non-empty text on one line, without extra spaces")
        day = iso_day(post.get("date"))
        if day is None:
            problems.append(f"{where}: date must be YYYY-MM-DD")
        else:
            if oldest_so_far is not None and day > oldest_so_far:
                problems.append(f"{where}: posts must be listed newest first, but {day} follows an older post")
            oldest_so_far = day if oldest_so_far is None else min(oldest_so_far, day)
            if today is not None and day > today:
                problems.append(
                    f"{where}: dated {day}, after today ({today} in New York). "
                    f"Schedule it in {SCHEDULE} instead of publishing it early."
                )
        pub_date = post.get("pubDate")
        try:
            moment = datetime.strptime(pub_date, UTC_STAMP) if isinstance(pub_date, str) else None
        except ValueError:
            moment = None
        if moment is None:
            problems.append(f"{where}: pubDate must be a UTC timestamp such as 2026-11-01T17:00:00Z")
        elif day is not None and moment.date() != day:
            problems.append(f"{where}: pubDate {pub_date} falls on {moment.date()} in UTC, not on its date {day}")
        if "updated" in post:
            updated = iso_day(post["updated"])
            if updated is None:
                problems.append(f"{where}: updated must be YYYY-MM-DD")
            elif day is not None and updated < day:
                problems.append(f"{where}: updated {updated} is before its date {day}")
            elif today is not None and updated > today:
                problems.append(f"{where}: updated {updated} is after today ({today} in New York)")
    return problems


def load_posts(root=ROOT, today=None):
    records = read_json(root, POSTS)
    problems = validate_posts(records, today)
    if problems:
        raise ContentError(problems)
    return records


def dump_posts(records):
    """content/posts.json text: two-space JSON, UTF-8 characters kept, fixed key order."""
    ordered = [{key: post[key] for key in POST_FIELDS if key in post} for post in records]
    return json.dumps(ordered, indent=2, ensure_ascii=False) + "\n"


def load_schedule(root=ROOT):
    """Read and validate .publishing/schedule.json (an empty list if there is none)."""
    if not (Path(root) / SCHEDULE).exists():
        return []
    entries = read_json(root, SCHEDULE)
    if not isinstance(entries, list):
        raise ContentError(f"{SCHEDULE} must be a JSON array")
    problems = []
    seen = set()
    for index, entry in enumerate(entries):
        where = f"{SCHEDULE}[{index}]"
        if not isinstance(entry, dict):
            problems.append(f"{where} must be an object")
            continue
        slug = entry.get("slug")
        if isinstance(slug, str):
            where = f"{SCHEDULE} {slug!r}"
        missing = [key for key in SCHEDULE_FIELDS if key not in entry]
        unknown = sorted(set(entry) - set(SCHEDULE_FIELDS))
        if missing:
            problems.append(f"{where}: missing {', '.join(missing)}")
        if unknown:
            problems.append(f"{where}: unknown field(s) {', '.join(unknown)}")
        if not (isinstance(slug, str) and SLUG.fullmatch(slug)):
            problems.append(f"{where}: slug must be lowercase letters and digits joined by single hyphens")
        elif slug in seen:
            problems.append(f"{where}: duplicate slug")
        else:
            seen.add(slug)
        for key in ("title", "description"):
            value = entry.get(key)
            if not isinstance(value, str) or not value.strip() or value != normalize_space(value):
                problems.append(f"{where}: {key} must be non-empty text on one line, without extra spaces")
        day = iso_day(entry.get("date"))
        if day is None:
            problems.append(f"{where}: date must be YYYY-MM-DD")
        elif day.weekday() != 6:
            problems.append(f"{where}: {day} is not a Sunday")
    if problems:
        raise ContentError(problems)
    return entries


# --------------------------------------------------------------------------
# Reading a checkout, with pending changes layered on top


class Tree:
    """A checkout's files, optionally overlaid with pending changes.

    `changes` maps repository-relative paths to new bytes, or to None for a
    file about to be deleted. The publisher checks the overlaid tree before it
    writes anything.
    """

    def __init__(self, root, changes=None):
        self.root = Path(root)
        self.changes = dict(changes or {})

    def read_bytes(self, rel):
        if rel in self.changes:
            return self.changes[rel]
        path = self.root / rel
        return path.read_bytes() if path.is_file() else None

    def read_text(self, rel):
        data = self.read_bytes(rel)
        return None if data is None else data.decode("utf-8")

    def exists(self, rel):
        return self.read_bytes(rel) is not None

    def _slugs(self, directory):
        found = {path.parent.name for path in (self.root / directory).glob("*/index.html")}
        pattern = re.compile(re.escape(directory) + r"/([^/]+)/index\.html")
        for rel, data in self.changes.items():
            match = pattern.fullmatch(rel)
            if match:
                (found.add if data is not None else found.discard)(match.group(1))
        return sorted(found)

    def blog_pages(self):
        """Slugs of every blog/<slug>/index.html."""
        return self._slugs("blog")

    def staged_drafts(self):
        """Slugs of every .publishing/posts/<slug>/index.html."""
        return self._slugs(STAGED)


# --------------------------------------------------------------------------
# Article pages: the metadata each listing depends on


class PageMeta(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = self.h1 = ""
        self.canonical = self.og_url = self.og_title = self.date = None
        self.article = self.redirect = self.noindex = False
        self._open = []
        self._done = set()

    def handle_starttag(self, tag, attrs):
        a = {key: value or "" for key, value in attrs}
        if tag in ("title", "h1") and tag not in self._done:
            self._open.append(tag)
        elif tag == "link" and "canonical" in a.get("rel", "").split():
            self.canonical = a.get("href")
        elif tag == "meta":
            if a.get("property") == "og:url":
                self.og_url = a.get("content")
            elif a.get("property") == "og:title":
                self.og_title = a.get("content")
            if a.get("http-equiv", "").lower() == "refresh":
                self.redirect = True
            if a.get("name", "").lower() == "robots" and "noindex" in a.get("content", "").lower():
                self.noindex = True
        elif tag == "time" and "date" in a.get("class", "").split() and self.date is None:
            self.date = a.get("datetime")
        elif tag == "article":
            self.article = True

    def handle_endtag(self, tag):
        if self._open and self._open[-1] == tag:
            self._open.pop()
            self._done.add(tag)

    def handle_data(self, data):
        if "title" in self._open:
            self.title += data
        if "h1" in self._open:
            self.h1 += data


def page_meta(text):
    meta = PageMeta()
    meta.feed(text)
    meta.close()
    return meta


def page_problems(text, rel, post):
    """Ways an article page disagrees with the record that lists it."""
    if text is None:
        return [f"{rel} is missing"]
    meta = page_meta(text)
    url = post_url(post)
    title = f"{post['title']} — {SITE_NAME}"
    problems = []
    if meta.redirect or not meta.article:
        problems.append(f"{rel} is not an article page (no <article>, or it redirects)")
    if meta.noindex:
        problems.append(f"{rel} is marked noindex")
    if meta.canonical != url:
        problems.append(f"{rel}: canonical URL is {meta.canonical!r}, expected {url}")
    if meta.og_url is not None and meta.og_url != url:
        problems.append(f"{rel}: og:url is {meta.og_url!r}, expected {url}")
    if normalize_space(meta.h1) != post["title"]:
        problems.append(f"{rel}: <h1> is {normalize_space(meta.h1)!r}, but the record's title is {post['title']!r}")
    if normalize_space(meta.title) != title:
        problems.append(f"{rel}: <title> is {normalize_space(meta.title)!r}, expected {title!r}")
    if meta.og_title is not None and normalize_space(meta.og_title) != title:
        problems.append(f"{rel}: og:title is {meta.og_title!r}, expected {title!r}")
    if meta.date != post["date"]:
        problems.append(f"{rel}: <time class=\"date\"> is {meta.date!r}, but the record's date is {post['date']}")
    return problems


# --------------------------------------------------------------------------
# Rendering


def render_latest(posts):
    """The homepage's Writing list: the newest HOME_POSTS posts, titles only."""
    lines = ['<ul class="post-list">']
    for post in posts[:HOME_POSTS]:
        lines += [
            '  <li class="post-row">',
            f'    <time class="post-date" datetime="{post["date"]}">{date_label(post["date"])}</time>',
            f'    <a class="post-title" href="{post_path(post)}">{escape(post["title"])}</a>',
            "  </li>",
        ]
    lines.append("</ul>")
    return lines


def render_archive(posts):
    """/blog/: every published post with its description, one list per year."""
    lines = []
    for year, group in groupby(posts, key=lambda post: post["date"][:4]):
        lines += [f"<h2>{year}</h2>", '<ul class="post-list">']
        for post in group:
            lines += [
                '  <li class="post-row">',
                f'    <time class="post-date" datetime="{post["date"]}">{date_label(post["date"])}</time>',
                "    <div>",
                f'      <a class="post-title" href="{post_path(post)}">{escape(post["title"])}</a>',
                f'      <p>{escape(post["description"])}</p>',
                "    </div>",
                "  </li>",
            ]
        lines.append("</ul>")
    return lines


REGIONS = {
    HOME: ("writing:latest", render_latest),
    ARCHIVE: ("writing:archive", render_archive),
}


def begin_marker(name):
    return f"<!-- BEGIN {name} (generated from {POSTS} by scripts/build_writing.py; edit that file, not this list) -->"


def fill_region(page, rel, name, lines):
    """Replace everything from the BEGIN marker line to the END marker line."""
    begin = re.compile(rf"^([ \t]*)<!-- BEGIN {re.escape(name)}[ (].*-->[ \t]*\n", re.M)
    end = re.compile(rf"^[ \t]*<!-- END {re.escape(name)} -->[ \t]*\n", re.M)
    begins, ends = list(begin.finditer(page)), list(end.finditer(page))
    if len(begins) != 1 or len(ends) != 1 or ends[0].start() < begins[0].end():
        raise ContentError(
            f"{rel} needs exactly one '<!-- BEGIN {name} ... -->' line followed by one '<!-- END {name} -->' line"
        )
    indent = begins[0].group(1)
    body = [begin_marker(name), *lines, f"<!-- END {name} -->"]
    block = "".join(f"{indent}{line}\n" for line in body)
    return page[: begins[0].start()] + block + page[ends[0].end():]


def render_feed(posts):
    """RSS 2.0, byte for byte the format the hand-maintained feed.xml used."""
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        f"    <title>{escape(SITE_NAME)} — Writing</title>",
        f"    <link>{ORIGIN}/blog/</link>",
        f"    <description>{escape(WRITING_DESCRIPTION)}</description>",
        "    <language>en-us</language>",
        f'    <atom:link href="{ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />',
    ]
    for post in posts:
        url = post_url(post)
        lines += [
            "    <item>",
            f"      <title>{escape(post['title'])}</title>",
            f"      <link>{url}</link>",
            f'      <guid isPermaLink="true">{url}</guid>',
            f"      <pubDate>{rss_date(post['pubDate'])}</pubDate>",
            f"      <description>{escape(post['description'])}</description>",
            "    </item>",
        ]
    lines += ["  </channel>", "</rss>"]
    return "\n".join(lines) + "\n"


SITEMAP_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
SITEMAP_TAIL = "</urlset>\n"
SITEMAP_LINE = re.compile(r"  <url><loc>([^<]+)</loc><lastmod>(\d{4}-\d{2}-\d{2})</lastmod></url>")
POST_LOC = re.compile(re.escape(ORIGIN) + r"/blog/([^/]+)/")


def sitemap_line(post):
    return f"  <url><loc>{post_url(post)}</loc><lastmod>{post.get('updated', post['date'])}</lastmod></url>"


def render_sitemap(xml, posts):
    """Keep every URL that is not a post where it is; make the post URLs match `posts`.

    A published post keeps its line and position (lastmod comes from its
    record). A post URL with no record is removed. New posts are appended,
    oldest first, as the publisher has always done.
    """
    if not (xml.startswith(SITEMAP_HEAD) and xml.endswith(SITEMAP_TAIL)):
        raise ContentError(f"{SITEMAP} must start with the XML declaration and <urlset ...> and end with </urlset>")
    by_slug = {post["slug"]: post for post in posts}
    lines, placed = [], set()
    for line in xml[len(SITEMAP_HEAD): -len(SITEMAP_TAIL)].splitlines():
        match = SITEMAP_LINE.fullmatch(line)
        if not match:
            raise ContentError(f"{SITEMAP}: unexpected line {line!r}; keep one <url><loc>…</loc><lastmod>…</lastmod></url> per line")
        post_match = POST_LOC.fullmatch(match.group(1))
        if not post_match:
            lines.append(line)
            continue
        slug = post_match.group(1)
        if slug in by_slug and slug not in placed:
            placed.add(slug)
            lines.append(sitemap_line(by_slug[slug]))
    lines += [sitemap_line(post) for post in reversed(posts) if post["slug"] not in placed]
    return SITEMAP_HEAD + "".join(line + "\n" for line in lines) + SITEMAP_TAIL


def render_site(tree, posts):
    """New text of every generated file, rendered from `posts`."""
    out = {}
    for rel, (name, render) in REGIONS.items():
        page = tree.read_text(rel)
        if page is None:
            raise ContentError(f"{rel} is missing")
        out[rel] = fill_region(page, rel, name, render(posts))
    out[FEED] = render_feed(posts)
    sitemap = tree.read_text(SITEMAP)
    if sitemap is None:
        raise ContentError(f"{SITEMAP} is missing")
    out[SITEMAP] = render_sitemap(sitemap, posts)
    return out


# --------------------------------------------------------------------------
# Whole-site consistency


def site_problems(tree, posts, schedule, today):
    """Everything that must hold before the site is committed or deployed.

    Returns (problems, notes). Problems block a release; notes are reported.
    """
    problems, notes = [], []
    for rel, expected in render_site(tree, posts).items():
        if tree.read_text(rel) != expected:
            problems.append(f"{rel} is out of date with {POSTS}; run python3 scripts/build_writing.py")
    listed = {post["slug"] for post in posts}
    for post in posts:
        rel = f"blog/{post['slug']}/index.html"
        problems += page_problems(tree.read_text(rel), rel, post)
    for slug in tree.blog_pages():
        rel = f"blog/{slug}/index.html"
        if slug not in listed and not page_meta(tree.read_text(rel)).redirect:
            problems.append(f"{rel} would be deployed but is not in {POSTS}; add its record or remove the page")
    scheduled = set()
    for entry in schedule:
        slug, day = entry["slug"], date.fromisoformat(entry["date"])
        scheduled.add(slug)
        draft = f"{STAGED}/{slug}/index.html"
        if day > today:
            if slug in listed:
                problems.append(f"{slug!r} is scheduled for {day} but is already in {POSTS}")
            if tree.exists(f"blog/{slug}/index.html"):
                problems.append(f"{slug!r} is scheduled for {day} but blog/{slug}/ already exists")
            for rel in GENERATED:
                if f"/blog/{slug}/" in (tree.read_text(rel) or ""):
                    problems.append(f"{rel} links to {slug!r} before its release on {day}")
            if not tree.exists(draft):
                problems.append(f"{slug!r} is scheduled for {day} but {draft} is missing")
        elif slug not in listed:
            notes.append(f"{slug!r} was due on {day} and is not published yet; scripts/publish_scheduled.py releases it")
        elif tree.exists(draft):
            notes.append(f"{draft} is still staged although {slug!r} is published; it is ignored")
    for slug in tree.staged_drafts():
        if slug not in scheduled:
            notes.append(f"{STAGED}/{slug}/index.html has no entry in {SCHEDULE}, so it will not be released")
    return problems, notes


# --------------------------------------------------------------------------
# Writing files: all of them or none


def apply_changes(root, changes):
    """Write every change, or none of them.

    `changes` maps repository-relative paths to new bytes, or to None to delete
    the file. New contents go to temporary files beside their targets, which
    then replace the targets. If anything fails, every touched file is put back
    and any directory created here is removed. Returns the changed paths.
    """
    root = Path(root)
    plan = []
    for rel, data in changes.items():
        path = root / rel
        before = path.read_bytes() if path.is_file() else None
        if before != data:
            plan.append((path, before, data))
    temps, created, touched = [], [], []
    try:
        staged = []
        for path, _before, data in plan:
            if data is None:
                continue
            missing, parent = [], path.parent
            while not parent.exists():
                missing.append(parent)
                parent = parent.parent
            path.parent.mkdir(parents=True, exist_ok=True)
            created += reversed(missing)
            temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
            temps.append(temp)
            with open(temp, "wb") as handle:
                handle.write(data)
                handle.flush()
                os.fsync(handle.fileno())
            staged.append((temp, path))
        for temp, path in staged:
            touched.append(path)
            os.replace(temp, path)
        for path, _before, data in plan:
            if data is None:
                touched.append(path)
                path.unlink()
    except BaseException:
        for path, before, _data in plan:
            if path in touched:
                if before is None:
                    path.unlink(missing_ok=True)
                else:
                    path.write_bytes(before)
        for temp in temps:
            temp.unlink(missing_ok=True)
        for directory in reversed(created):
            try:
                directory.rmdir()
            except OSError:
                pass
        raise
    return [path.relative_to(root).as_posix() for path, _before, _data in plan]


def show_diff(rel, before, after, limit=60):
    diff = list(difflib.unified_diff((before or "").splitlines(), after.splitlines(), f"{rel} (committed)", f"{rel} (from {POSTS})", lineterm=""))
    for line in diff[:limit]:
        print(f"    {line}")
    if len(diff) > limit:
        print(f"    … {len(diff) - limit} more diff lines")


def report(error):
    for problem in error.problems:
        print(f"error: {problem}", file=sys.stderr)


def main(argv=None, root=ROOT):
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true", help="change nothing; exit 1 if a generated file is stale or anything is inconsistent")
    parser.add_argument("--as-of", type=day_argument, metavar="YYYY-MM-DD", help="treat this date as today in New York (for rehearsals on a copy)")
    args = parser.parse_args(argv)
    today = args.as_of or today_in_new_york()
    try:
        posts = load_posts(root, today)
        schedule = load_schedule(root)
        tree = Tree(root)
        if args.check:
            problems, notes = site_problems(tree, posts, schedule, today)
            for note in notes:
                print(f"note: {note}")
            if problems:
                for rel, expected in render_site(tree, posts).items():
                    current = tree.read_text(rel)
                    if current != expected:
                        print(f"{rel} differs from what {POSTS} produces:")
                        show_diff(rel, current, expected)
                raise ContentError(problems)
            print(
                f"Writing is consistent: {len(posts)} published posts in {POSTS}; the homepage lists "
                f"{min(HOME_POSTS, len(posts))}, /blog/ lists {len(posts)}, and feed.xml and sitemap.xml match."
            )
            return 0
        rendered = render_site(tree, posts)
        changes = {rel: text.encode("utf-8") for rel, text in rendered.items()}
        problems, notes = site_problems(Tree(root, changes), posts, schedule, today)
        for note in notes:
            print(f"note: {note}")
        if problems:
            raise ContentError(problems)
        changed = apply_changes(root, changes)
        print(f"Updated {', '.join(changed)}." if changed else f"Writing is up to date with {POSTS}.")
        return 0
    except ContentError as error:
        report(error)
        print("Nothing was written." if not args.check else f"Writing is not consistent with {POSTS}.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
