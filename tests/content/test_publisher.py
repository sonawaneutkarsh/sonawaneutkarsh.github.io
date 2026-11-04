"""Scheduled publication, duplicate prevention, unpublished-content exclusion
and failure handling.

Synthetic drafts dated in 2030 are staged in a scratch copy of the site, so
these tests never depend on the real schedule and never touch this checkout.
"""
from __future__ import annotations

import contextlib
import io
import os
import unittest
from datetime import date, datetime, timezone
from unittest import mock

from support import (
    DRAFT,
    RealRepoGuard,
    ScratchTestCase,
    archive_rows,
    changed_paths,
    entry,
    expected_row,
    feed_items,
    homepage_rows,
    load_json,
    publish,
    publisher,
    read,
    run_script,
    sitemap_lines,
    snapshot,
    stage,
    strip_year,
    write_json,
    writing,
)

FIRST = entry("first-synthetic-essay", "2030-01-06")
SECOND = entry("second-synthetic-essay", "2030-01-13")


def tearDownModule():
    RealRepoGuard.verify()


def record(item):
    return {
        "slug": item["slug"],
        "title": item["title"],
        "date": item["date"],
        "pubDate": f"{item['date']}T17:00:00Z",  # noon in New York in January (EST)
        "description": item["description"],
    }


class PublisherTestCase(ScratchTestCase):
    def setUp(self):
        super().setUp()
        stage(self.root, FIRST, SECOND)
        self.original = self.posts()
        self.sitemap = sitemap_lines(read(self.root, "sitemap.xml"))
        self.feed = feed_items(read(self.root, "feed.xml"))
        self.before = snapshot(self.root)

    def release(self, *args, ok=True):
        result = publish(self.root, *args)
        if ok:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout)
            self.assertIn("Nothing was published.", result.stderr)
        return result

    def refreeze(self):
        self.before = snapshot(self.root)

    def assert_unchanged(self):
        self.assertEqual(changed_paths(self.before, snapshot(self.root)), [])

    def assert_lists_match(self, posts):
        """The homepage, /blog/, the feed and the sitemap all agree with posts.json."""
        self.assertEqual(strip_year(homepage_rows(read(self.root, "index.html"))), [expected_row(p, description=False) for p in posts[:3]])
        self.assertEqual(strip_year(archive_rows(read(self.root, "blog/index.html"))), [expected_row(p) for p in posts])
        feed = read(self.root, "feed.xml")
        self.assertEqual([item.split("<link>")[1].split("</link>")[0] for item in feed_items(feed)], [writing.post_url(p) for p in posts])
        sitemap = read(self.root, "sitemap.xml")
        for post in posts:
            self.assertEqual(sitemap.count(f"<loc>{writing.post_url(post)}</loc>"), 1)

    def assert_not_public(self, item):
        slug = item["slug"]
        self.assertNotIn(slug, [post["slug"] for post in self.posts()])
        self.assertFalse((self.root / "blog" / slug).exists())
        for rel in writing.GENERATED:
            text = read(self.root, rel)
            self.assertNotIn(slug, text, rel)
            self.assertNotIn(item["title"], text, rel)
        self.assertTrue((self.root / writing.STAGED / slug / "index.html").is_file())


# --------------------------------------------------------------------------
# 6. Scheduled publication


class ScheduledPublicationTests(PublisherTestCase):
    def test_nothing_is_due_the_day_before(self):
        result = self.release("--as-of", "2030-01-05")
        self.assertIn("2030-01-05 America/New_York: 0 due", result.stdout)
        self.assert_unchanged()

    def test_the_new_york_date_decides_what_is_due(self):
        # 10 pm Saturday in New York is already Sunday in UTC: not due yet.
        self.assertEqual(writing.today_in_new_york(datetime(2030, 1, 6, 3, 0, tzinfo=timezone.utc)), date(2030, 1, 5))
        # The cron (17:17 UTC on Sundays) is Sunday in New York in winter and in summer.
        self.assertEqual(writing.today_in_new_york(datetime(2030, 1, 6, 17, 17, tzinfo=timezone.utc)), date(2030, 1, 6))
        self.assertEqual(writing.today_in_new_york(datetime(2030, 7, 7, 17, 17, tzinfo=timezone.utc)), date(2030, 7, 7))
        tree, schedule = writing.Tree(self.root), writing.load_schedule(self.root)
        self.assertEqual(publisher.due_entries(tree, self.original, schedule, date(2030, 1, 5))[0], [])
        due = publisher.due_entries(tree, self.original, schedule, date(2030, 1, 6))[0]
        self.assertEqual([item["slug"] for item in due], [FIRST["slug"]])

    def test_the_due_post_is_released_everywhere_and_nothing_else(self):
        draft = (self.root / writing.STAGED / FIRST["slug"] / "index.html").read_bytes()
        result = self.release("--as-of", "2030-01-06")
        self.assertIn("2030-01-06 America/New_York: 1 due", result.stdout)
        self.assertIn(f"Released: 2030-01-06 — {FIRST['title']}", result.stdout)
        posts = self.posts()
        self.assertEqual(posts, [record(FIRST)] + self.original)
        self.assertEqual((self.root / "blog" / FIRST["slug"] / "index.html").read_bytes(), draft)
        self.assertFalse((self.root / writing.STAGED / FIRST["slug"]).exists())
        self.assert_lists_match(posts)
        self.assertEqual(feed_items(read(self.root, "feed.xml"))[1:], self.feed)
        self.assertEqual(sitemap_lines(read(self.root, "sitemap.xml")), self.sitemap + [writing.sitemap_line(record(FIRST))])
        self.assert_not_public(SECOND)
        self.assertEqual(
            changed_paths(self.before, snapshot(self.root)),
            sorted([
                "blog/index.html", f"blog/{FIRST['slug']}/index.html", "content/posts.json", "feed.xml",
                "index.html", "sitemap.xml", f"{writing.STAGED}/{FIRST['slug']}/index.html",
            ]),
        )
        check = run_script(self.root, "build_writing.py", "--check", "--as-of", "2030-01-06")
        self.assertEqual(check.returncode, 0, check.stdout + check.stderr)
        feed_check = run_script(self.root, "check_feed.py")
        self.assertEqual(feed_check.returncode, 0, feed_check.stdout + feed_check.stderr)

    def test_two_successive_sundays_then_repeated_runs(self):
        self.release("--as-of", "2030-01-06")
        feed_after_first = feed_items(read(self.root, "feed.xml"))
        result = self.release("--as-of", "2030-01-13")
        self.assertIn("1 due", result.stdout)
        posts = self.posts()
        self.assertEqual(posts, [record(SECOND), record(FIRST)] + self.original)
        self.assert_lists_match(posts)
        self.assertEqual(feed_items(read(self.root, "feed.xml"))[1:], feed_after_first)
        self.assertEqual(
            sitemap_lines(read(self.root, "sitemap.xml")),
            self.sitemap + [writing.sitemap_line(record(FIRST)), writing.sitemap_line(record(SECOND))],
        )
        settled = snapshot(self.root)
        for day in ("2030-01-13", "2030-01-13", "2030-01-14", "2030-01-20"):
            with self.subTest(rerun=day):
                again = self.release("--as-of", day)
                self.assertIn("0 due", again.stdout)
                self.assertEqual(changed_paths(settled, snapshot(self.root)), [])

    def test_missed_sundays_are_caught_up_in_order(self):
        result = self.release("--as-of", "2030-01-20")
        self.assertIn("2 due", result.stdout)
        self.assertLess(result.stdout.index(f"Released: 2030-01-06"), result.stdout.index(f"Released: 2030-01-13"))
        posts = self.posts()
        self.assertEqual(posts, [record(SECOND), record(FIRST)] + self.original)
        self.assert_lists_match(posts)

    def test_dry_run_reports_and_changes_nothing(self):
        result = self.release("--as-of", "2030-01-13", "--dry-run")
        self.assertIn(f"Would publish 2030-01-06 — {FIRST['title']}", result.stdout)
        self.assertIn(f"Would publish 2030-01-13 — {SECOND['title']}", result.stdout)
        self.assert_unchanged()

    def test_the_schedule_is_kept_as_the_audit_trail(self):
        self.release("--as-of", "2030-01-20")
        self.assertEqual((self.root / writing.SCHEDULE).read_bytes(), self.before[writing.SCHEDULE])

    def test_a_post_released_on_the_same_day_as_another_is_listed_first(self):
        same_day = entry("same-day-essay", "2030-01-06")
        stage(self.root, same_day)
        write_json(self.root, writing.POSTS, [record(FIRST)] + self.original)
        page = self.root / "blog" / FIRST["slug"] / "index.html"
        page.parent.mkdir()
        page.write_text(DRAFT.format(**FIRST), encoding="utf-8")
        self.assertEqual(run_script(self.root, "build_writing.py", "--as-of", "2030-01-06").returncode, 0)
        self.release("--as-of", "2030-01-06")
        self.assertEqual([post["slug"] for post in self.posts()[:2]], [same_day["slug"], FIRST["slug"]])


# --------------------------------------------------------------------------
# 7. Duplicate-publication prevention


class DuplicatePreventionTests(PublisherTestCase):
    def test_a_published_slug_is_never_released_again(self):
        live = "80-percent-sleep"
        article = (self.root / "blog" / live / "index.html").read_bytes()
        stage(self.root, entry(live, "2029-12-30", title="80% sleep?"), replace_schedule=False)
        self.refreeze()
        result = self.release("--as-of", "2029-12-30")
        self.assertIn("0 due", result.stdout)
        self.assertIn(f"{writing.STAGED}/{live}/index.html is ignored: '{live}' is already published", result.stdout)
        self.assert_unchanged()
        self.assertEqual((self.root / "blog" / live / "index.html").read_bytes(), article)
        self.assertEqual(read(self.root, "feed.xml").count(f"/blog/{live}/</guid>"), 1)

    def test_a_published_slug_is_skipped_while_other_posts_release(self):
        live = "80-percent-sleep"
        stage(self.root, entry(live, "2030-01-06", title="80% sleep?"), replace_schedule=False)
        self.release("--as-of", "2030-01-06")
        posts = self.posts()
        self.assertEqual([post["slug"] for post in posts].count(live), 1)
        self.assertEqual(posts[0], record(FIRST))
        self.assertEqual(read(self.root, "sitemap.xml").count(f"/blog/{live}/</loc>"), 1)
        self.assertEqual(strip_year(archive_rows(read(self.root, "blog/index.html"))), [expected_row(p) for p in posts])

    def test_duplicate_slugs_in_the_schedule_are_refused(self):
        schedule = load_json(self.root, writing.SCHEDULE)
        write_json(self.root, writing.SCHEDULE, schedule + [dict(schedule[0], date="2030-01-20")])
        self.refreeze()
        result = self.release("--as-of", "2030-01-20", ok=False)
        self.assertIn(f"'{FIRST['slug']}': duplicate slug", result.stderr)
        self.assert_unchanged()

    def test_a_record_without_its_article_blocks_the_release(self):
        (self.root / "blog" / "80-percent-sleep" / "index.html").unlink()
        self.refreeze()
        result = self.release("--as-of", "2030-01-06", ok=False)
        self.assertIn("blog/80-percent-sleep/index.html is missing", result.stderr)
        self.assert_unchanged()

    def test_an_article_without_a_record_blocks_its_release(self):
        page = self.root / "blog" / FIRST["slug"] / "index.html"
        page.parent.mkdir()
        page.write_text(DRAFT.format(**FIRST), encoding="utf-8")
        self.refreeze()
        result = self.release("--as-of", "2030-01-06", ok=False)
        self.assertIn(f"blog/{FIRST['slug']}/index.html already exists but content/posts.json has no record for it", result.stderr)
        self.assert_unchanged()


# --------------------------------------------------------------------------
# 8. Unpublished content exclusion


class UnpublishedExclusionTests(PublisherTestCase):
    def test_future_posts_stay_out_of_every_generated_file(self):
        self.assert_not_public(FIRST)
        self.assert_not_public(SECOND)
        self.release("--as-of", "2030-01-12")
        self.assert_not_public(SECOND)

    def test_a_future_post_added_to_posts_json_by_hand_is_refused(self):
        page = self.root / "blog" / SECOND["slug"] / "index.html"
        page.parent.mkdir()
        page.write_text(DRAFT.format(**SECOND), encoding="utf-8")
        write_json(self.root, writing.POSTS, [record(SECOND)] + self.original)
        for command in (("build_writing.py", "--check"), ("build_writing.py",), ("publish_scheduled.py",)):
            with self.subTest(command=command):
                result = run_script(self.root, *command, "--as-of", "2030-01-06")
                self.assertEqual(result.returncode, 1, result.stdout)
                self.assertIn("dated 2030-01-13, after today (2030-01-06 in New York)", result.stderr)

    def test_an_unreleased_page_or_link_is_reported(self):
        page = self.root / "blog" / SECOND["slug"] / "index.html"
        page.parent.mkdir()
        page.write_text(DRAFT.format(**SECOND), encoding="utf-8")
        sitemap = self.root / "sitemap.xml"
        sitemap.write_text(read(self.root, "sitemap.xml").replace("</urlset>", writing.sitemap_line(record(SECOND)) + "\n</urlset>"), encoding="utf-8")
        result = run_script(self.root, "build_writing.py", "--check", "--as-of", "2030-01-06")
        self.assertEqual(result.returncode, 1)
        for message in (
            f"'{SECOND['slug']}' is scheduled for 2030-01-13 but blog/{SECOND['slug']}/ already exists",
            f"blog/{SECOND['slug']}/index.html would be deployed but is not in content/posts.json",
            f"sitemap.xml links to '{SECOND['slug']}' before its release on 2030-01-13",
            "sitemap.xml is out of date",
        ):
            self.assertIn(message, result.stderr)

    def test_a_scheduled_post_without_a_draft_is_reported_before_its_sunday(self):
        (self.root / writing.STAGED / SECOND["slug"] / "index.html").unlink()
        result = run_script(self.root, "build_writing.py", "--check", "--as-of", "2030-01-06")
        self.assertEqual(result.returncode, 1)
        self.assertIn(f"'{SECOND['slug']}' is scheduled for 2030-01-13 but {writing.STAGED}/{SECOND['slug']}/index.html is missing", result.stderr)


# --------------------------------------------------------------------------
# Failures leave no partial release behind


class FailureTests(PublisherTestCase):
    def break_draft(self, item, old, new):
        draft = self.root / writing.STAGED / item["slug"] / "index.html"
        draft.write_text(read(self.root, f"{writing.STAGED}/{item['slug']}/index.html").replace(old, new), encoding="utf-8")
        self.refreeze()

    def test_one_malformed_draft_stops_the_whole_release(self):
        self.break_draft(SECOND, 'datetime="2030-01-13"', 'datetime="2030-01-12"')
        result = self.release("--as-of", "2030-01-20", ok=False)
        self.assertIn("<time class=\"date\"> is '2030-01-12'", result.stderr)
        self.assert_unchanged()  # the valid first draft is not released either

    def test_a_draft_with_the_wrong_canonical_url_is_refused(self):
        self.break_draft(FIRST, f"/blog/{FIRST['slug']}/\" rel=\"canonical\"", "/blog/elsewhere/\" rel=\"canonical\"")
        result = self.release("--as-of", "2030-01-06", ok=False)
        self.assertIn("canonical URL is 'https://sonawaneutkarsh.github.io/blog/elsewhere/'", result.stderr)
        self.assert_unchanged()

    def test_a_draft_whose_heading_differs_from_the_schedule_is_refused(self):
        self.break_draft(FIRST, f"<h1>{FIRST['title']}</h1>", "<h1>a different heading</h1>")
        result = self.release("--as-of", "2030-01-06", ok=False)
        self.assertIn("<h1> is 'a different heading'", result.stderr)
        self.assert_unchanged()

    def test_a_missing_draft_is_refused(self):
        (self.root / writing.STAGED / FIRST["slug"] / "index.html").unlink()
        self.refreeze()
        result = self.release("--as-of", "2030-01-06", ok=False)
        self.assertIn(f"{writing.STAGED}/{FIRST['slug']}/index.html is missing", result.stderr)
        self.assert_unchanged()

    def test_a_missing_marker_changes_nothing(self):
        index = self.root / "index.html"
        index.write_text(read(self.root, "index.html").replace("        <!-- END writing:latest -->\n", ""), encoding="utf-8")
        self.refreeze()
        result = self.release("--as-of", "2030-01-06", ok=False)
        self.assertIn("index.html needs exactly one", result.stderr)
        self.assert_unchanged()

    def test_a_write_failure_restores_every_file(self):
        real_replace = os.replace
        calls = []

        def flaky_replace(source, target):
            calls.append(target)
            if len(calls) == 3:
                raise OSError("simulated disk failure")
            return real_replace(source, target)

        with mock.patch.object(writing.os, "replace", flaky_replace), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(OSError):
                publisher.main(["--as-of", "2030-01-13"], root=self.root)
        self.assertEqual(len(calls), 3)
        self.assert_unchanged()  # every file restored, no temporary files left behind
        self.assertFalse((self.root / "blog" / FIRST["slug"]).exists())
        self.assertFalse((self.root / "blog" / SECOND["slug"]).exists())
        # Nothing is half-published, so the next run releases both posts normally.
        self.release("--as-of", "2030-01-13")
        self.assertEqual(self.posts(), [record(SECOND), record(FIRST)] + self.original)
        self.assert_lists_match(self.posts())


if __name__ == "__main__":
    unittest.main()
