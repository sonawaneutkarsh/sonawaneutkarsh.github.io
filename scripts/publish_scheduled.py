#!/usr/bin/env python3
"""Release Sunday essays staged outside the deployed site.

Drafts wait in .publishing/posts/<slug>/index.html and are listed in
.publishing/schedule.json. Nothing under .publishing/ is deployed. When a
draft's Sunday has arrived in America/New_York, this script:

1. validates the schedule, content/posts.json and every due draft;
2. adds the post's record to content/posts.json, the single list of
   published posts (RSS time: noon in New York, as before);
3. moves the draft, byte for byte, to blog/<slug>/index.html;
4. regenerates the homepage's latest three, /blog/, feed.xml and the sitemap
   from content/posts.json (scripts/build_writing.py);
5. checks the complete result, then writes every file or none.

A post counts as published once it is in content/posts.json, so running this
again changes nothing. schedule.json is never modified; it stays as the audit
trail.

    python3 scripts/publish_scheduled.py                     # release what is due today
    python3 scripts/publish_scheduled.py --dry-run           # report only
    python3 scripts/publish_scheduled.py --as-of 2026-11-08  # rehearse a date (on a copy)
"""
from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_writing as writing  # noqa: E402

ROOT = writing.ROOT


def draft_path(slug):
    return f"{writing.STAGED}/{slug}/index.html"


def article_path(slug):
    return f"blog/{slug}/index.html"


def due_entries(tree, posts, schedule, today):
    """Schedule entries to release now, oldest first, plus notes and blocking problems."""
    published = {post["slug"] for post in posts}
    due, notes, problems = [], [], []
    for entry in sorted(schedule, key=lambda item: item["date"]):
        slug = entry["slug"]
        if date.fromisoformat(entry["date"]) > today:
            continue
        if slug in published:
            # Already released: never publish twice, never overwrite the live article.
            if tree.exists(draft_path(slug)):
                notes.append(f"{draft_path(slug)} is ignored: {slug!r} is already published")
            continue
        if tree.exists(article_path(slug)):
            problems.append(
                f"{article_path(slug)} already exists but {writing.POSTS} has no record for it. "
                f"Add its record (or remove the page) before {slug!r} can be released."
            )
            continue
        due.append(entry)
    return due, notes, problems


def record(entry):
    """The content/posts.json record for a released schedule entry."""
    return {
        "slug": entry["slug"],
        "title": entry["title"],
        "date": entry["date"],
        "pubDate": writing.release_pub_date(date.fromisoformat(entry["date"])),
        "description": entry["description"],
    }


def plan_release(root, posts, schedule, due, today):
    """Every file change a release makes, checked as a whole before anything is written."""
    tree = writing.Tree(root)
    problems = []
    for entry in due:
        rel = draft_path(entry["slug"])
        problems += writing.page_problems(tree.read_text(rel), rel, entry)
    if problems:
        raise writing.ContentError(problems)

    # Newest first; a released post goes above an older post from the same day.
    released = [record(entry) for entry in reversed(due)] + posts
    released.sort(key=lambda post: post["date"], reverse=True)
    problems = writing.validate_posts(released, today)
    if problems:
        raise writing.ContentError(problems)

    changes = {}
    for entry in due:
        changes[article_path(entry["slug"])] = tree.read_bytes(draft_path(entry["slug"]))
        changes[draft_path(entry["slug"])] = None
    changes[writing.POSTS] = writing.dump_posts(released).encode("utf-8")
    for rel, text in writing.render_site(writing.Tree(root, changes), released).items():
        changes[rel] = text.encode("utf-8")

    problems, _notes = writing.site_problems(writing.Tree(root, changes), released, schedule, today)
    if problems:
        raise writing.ContentError(problems)
    return changes


def main(argv=None, root=ROOT):
    parser = argparse.ArgumentParser(description="Release Sunday essays whose date has arrived in America/New_York.")
    parser.add_argument("--as-of", type=writing.day_argument, metavar="YYYY-MM-DD", help="treat this date as today in New York (rehearse on a copy)")
    parser.add_argument("--dry-run", action="store_true", help="report what is due and change nothing")
    args = parser.parse_args(argv)
    root = Path(root)
    today = args.as_of or writing.today_in_new_york()
    try:
        schedule = writing.load_schedule(root)
        posts = writing.load_posts(root, today)
        due, notes, problems = due_entries(writing.Tree(root), posts, schedule, today)
        print(f"Sunday publishing check for {today} America/New_York: {len(due)} due.")
        for note in notes:
            print(f"note: {note}")
        if problems:
            raise writing.ContentError(problems)
        if not due:
            return 0
        changes = plan_release(root, posts, schedule, due, today)
        if args.dry_run:
            for entry in due:
                print(f"Would publish {entry['date']} — {entry['title']}")
            return 0
        writing.apply_changes(root, changes)
    except writing.ContentError as error:
        writing.report(error)
        print("Nothing was published.", file=sys.stderr)
        return 1
    for entry in due:
        try:
            (root / writing.STAGED / entry["slug"]).rmdir()
        except OSError:
            pass
        print(f"Released: {entry['date']} — {entry['title']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
