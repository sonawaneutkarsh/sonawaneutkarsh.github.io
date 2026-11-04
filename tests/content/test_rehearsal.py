"""Rehearse Sunday releases on a full copy of the site, then run every CI check.

RealDraftRehearsal releases the drafts that are still pending in
.publishing/schedule.json, one Sunday at a time, and runs the publisher again
on the last Sunday. SyntheticRehearsal does the same with two invented drafts,
so the path stays covered after the real drafts are published. Both work on a
scratch git clone that shares this repository's objects (check_preservation.py
reads its baseline from history). Neither touches this checkout.

The deployment tests stage the Pages artifact exactly as the workflows'
cp -r allowlist does and look for unpublished content in it.
"""
from __future__ import annotations

import tempfile
import unittest
from datetime import date
from pathlib import Path

from support import (
    REPO,
    RealRepoGuard,
    ScratchTestCase,
    archive_rows,
    changed_paths,
    entry,
    expected_row,
    feed_items,
    git_add_paths,
    homepage_rows,
    load_json,
    publish,
    read,
    require_html_validate,
    scratch_site,
    site_checks,
    sitemap_lines,
    snapshot,
    stage,
    stage_site,
    staged_site_files,
    strip_year,
    workflow,
    writing,
)

TEXT_SUFFIXES = {".html", ".xml", ".txt", ".js", ".mjs", ".css", ".json", ".svg", ".md"}


def tearDownModule():
    RealRepoGuard.verify()


def pending_real_drafts():
    """Unpublished entries of the real schedule, oldest first."""
    published = {post["slug"] for post in writing.load_posts(REPO, writing.today_in_new_york())}
    schedule = writing.load_schedule(REPO)
    return [item for item in sorted(schedule, key=lambda item: item["date"]) if item["slug"] not in published]


def public_text(site):
    """Every deployable text file under `site`, by relative path."""
    return {
        path.relative_to(site).as_posix(): path.read_text(encoding="utf-8", errors="replace")
        for path in sorted(Path(site).rglob("*"))
        if path.is_file() and path.suffix in TEXT_SUFFIXES
    }


class Rehearsal:
    """Release `releases` one Sunday at a time on self.root and check everything after each."""

    def rehearse(self, releases):
        root = self.root
        original = load_json(root, writing.POSTS)
        add_paths = git_add_paths(workflow("publish_scheduled.yml"))
        released = []
        for index, item in enumerate(releases):
            with self.subTest(sunday=item["date"], slug=item["slug"]):
                before = snapshot(root)
                feed_before = feed_items(read(root, "feed.xml"))
                sitemap_before = sitemap_lines(read(root, "sitemap.xml"))
                draft = before[f"{writing.STAGED}/{item['slug']}/index.html"]

                result = publish(root, "--as-of", item["date"])
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn(f"{item['date']} America/New_York: 1 due", result.stdout)
                self.assertIn(f"Released: {item['date']} — {item['title']}", result.stdout)
                released.insert(0, item)

                posts = load_json(root, writing.POSTS)
                self.assertEqual([post["slug"] for post in posts[: len(released)]], [entry["slug"] for entry in released])
                self.assertEqual(posts[len(released):], original)
                self.assertEqual(posts[0]["pubDate"], writing.release_pub_date(date.fromisoformat(item["date"])))
                self.assertEqual((root / "blog" / item["slug"] / "index.html").read_bytes(), draft)

                # The homepage shows the newest three, /blog/ shows everything.
                self.assertEqual(strip_year(homepage_rows(read(root, "index.html"))), [expected_row(p, description=False) for p in posts[:3]])
                self.assertEqual(strip_year(archive_rows(read(root, "blog/index.html"))), [expected_row(p) for p in posts])
                # One new feed item on top; every earlier item, GUID included, is byte-identical.
                feed_after = feed_items(read(root, "feed.xml"))
                self.assertEqual(feed_after[1:], feed_before)
                self.assertIn(f'<guid isPermaLink="true">{writing.post_url(posts[0])}</guid>', feed_after[0])
                # One new sitemap line at the end; every earlier line unchanged.
                self.assertEqual(sitemap_lines(read(root, "sitemap.xml")), sitemap_before + [writing.sitemap_line(posts[0])])

                # The release commit stages every file the publisher changed.
                changed = changed_paths(before, snapshot(root))
                self.assertEqual(
                    changed,
                    sorted([
                        "blog/index.html", f"blog/{item['slug']}/index.html", writing.POSTS, "feed.xml",
                        "index.html", "sitemap.xml", f"{writing.STAGED}/{item['slug']}/index.html",
                    ]),
                )
                for path in changed:
                    self.assertTrue(any(path == add or path.startswith(add.rstrip("/") + "/") for add in add_paths), path)

                # Later drafts stay staged and invisible.
                for later in releases[index + 1:]:
                    self.assertTrue((root / writing.STAGED / later["slug"] / "index.html").is_file())
                    self.assertFalse((root / "blog" / later["slug"]).exists())
                    for rel in writing.GENERATED:
                        self.assertNotIn(f"/blog/{later['slug']}/", read(root, rel), rel)

                # Every check CI runs before it commits and deploys.
                checks = site_checks(root, item["date"])
                for name, check in checks.items():
                    self.assertEqual(check.returncode, 0, f"{name} failed:\n{check.stdout}\n{check.stderr}")
                if "html-validate" not in checks and require_html_validate(self):
                    self.fail("html-validate was found but did not run")

        # The same Sunday again: nothing is due and no byte changes.
        settled = snapshot(root)
        again = publish(root, "--as-of", releases[-1]["date"])
        self.assertEqual(again.returncode, 0, again.stdout + again.stderr)
        self.assertIn("0 due", again.stdout)
        self.assertEqual(changed_paths(settled, snapshot(root)), [])

        # The Pages artifact has every released post and no staging.
        with tempfile.TemporaryDirectory() as tmp:
            site = stage_site(root, Path(tmp) / "_site")
            for item in releases:
                self.assertTrue((site / "blog" / item["slug"] / "index.html").is_file())
            self.assertFalse((site / ".publishing").exists())
            self.assertFalse((site / "content").exists())


class RealDraftRehearsal(unittest.TestCase, Rehearsal):
    """The staged essays, released on their own Sundays in a scratch clone."""

    @classmethod
    def setUpClass(cls):
        cls.pending = pending_real_drafts()
        if not cls.pending:
            raise unittest.SkipTest("no staged drafts are pending; SyntheticRehearsal covers the release path")
        cls._tmp = tempfile.TemporaryDirectory(prefix="rehearsal-real-")
        cls.root = scratch_site(Path(cls._tmp.name) / "site", full=True)

    @classmethod
    def tearDownClass(cls):
        cls._tmp.cleanup()

    def test_each_pending_sunday_releases_one_post_and_passes_every_check(self):
        self.rehearse(self.pending)


class SyntheticRehearsal(unittest.TestCase, Rehearsal):
    """Two invented Sundays in 2030 on a full scratch clone, with the real drafts removed."""

    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory(prefix="rehearsal-synthetic-")
        cls.root = scratch_site(Path(cls._tmp.name) / "site", full=True)
        cls.releases = [entry("first-rehearsal-essay", "2030-01-06"), entry("second-rehearsal-essay", "2030-01-13")]
        stage(cls.root, *cls.releases)

    @classmethod
    def tearDownClass(cls):
        cls._tmp.cleanup()

    def test_two_successive_sundays_and_a_repeat_pass_every_check(self):
        self.rehearse(self.releases)


# --------------------------------------------------------------------------
# 8. What GitHub Pages receives


class DeployedSiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory(prefix="pages-artifact-")
        cls.site = stage_site(REPO, Path(cls._tmp.name) / "_site")
        cls.files = public_text(cls.site)

    @classmethod
    def tearDownClass(cls):
        cls._tmp.cleanup()

    def test_staging_content_and_tooling_are_never_deployed(self):
        for private in (".publishing", "content", "scripts", "tests", "docs", ".github", "artifacts"):
            self.assertFalse((self.site / private).exists(), private)

    def test_no_pending_draft_reaches_the_artifact(self):
        for item in pending_real_drafts():
            if date.fromisoformat(item["date"]) <= writing.today_in_new_york():
                continue  # due, and released by the next scheduled run
            with self.subTest(slug=item["slug"]):
                self.assertFalse((self.site / "blog" / item["slug"]).exists())
                for rel, text in self.files.items():
                    self.assertNotIn(f"/blog/{item['slug']}/", text, rel)
                    self.assertNotIn(item["title"], text, rel)

    def test_every_published_post_is_deployed_and_listed(self):
        for post in writing.load_posts(REPO, writing.today_in_new_york()):
            with self.subTest(slug=post["slug"]):
                self.assertTrue((self.site / "blog" / post["slug"] / "index.html").is_file())
                self.assertIn(writing.post_url(post), self.files["feed.xml"])
                self.assertIn(writing.post_url(post), self.files["sitemap.xml"])


class WorkflowTests(ScratchTestCase):
    def test_both_pages_workflows_deploy_the_same_allowlist(self):
        deploy = staged_site_files(workflow("deploy.yml"))
        self.assertEqual(staged_site_files(workflow("publish_scheduled.yml")), deploy)
        for public in ("index.html", "blog", "feed.xml", "sitemap.xml", "robots.txt"):
            self.assertIn(public, deploy)
        for private in (".publishing", "content", "scripts", "tests", "docs", ".github"):
            self.assertNotIn(private, deploy)

    def test_the_release_commit_stages_every_file_a_release_writes(self):
        paths = git_add_paths(workflow("publish_scheduled.yml"))
        for required in ("index.html", "blog/", "feed.xml", "sitemap.xml", ".publishing/", "content/"):
            self.assertIn(required, paths)
        stage(self.root, entry("workflow-essay", "2030-01-06"))
        before = snapshot(self.root)
        result = publish(self.root, "--as-of", "2030-01-06")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        for path in changed_paths(before, snapshot(self.root)):
            self.assertTrue(any(path == add or path.startswith(add.rstrip("/") + "/") for add in paths), path)

    def test_the_scheduled_workflow_checks_everything_before_it_commits(self):
        text = workflow("publish_scheduled.yml")
        steps = [
            "python3 scripts/publish_scheduled.py",
            "python3 scripts/build_writing.py --check",
            "html-validate index.html",
            "python3 scripts/check_links.py",
            "python3 scripts/check_feed.py",
            "python3 scripts/check_preservation.py",
            "git add -A",
            "git push origin HEAD:main",
            "actions/deploy-pages",
        ]
        positions = [text.index(step) for step in steps]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("ref: main", text)
        self.assertIn("cron: '17 17 * * 0'", text)

    def test_pull_requests_run_the_pipeline_check_and_these_tests(self):
        text = workflow("deploy.yml")
        self.assertIn("python3 scripts/build_writing.py --check", text)
        self.assertIn("python3 -m unittest discover -s tests/content", text)
        self.assertIn("fetch-depth: 0", text)
        self.assertLess(text.index("npm install -g html-validate@10"), text.index("python3 -m unittest discover -s tests/content"))


if __name__ == "__main__":
    unittest.main()
