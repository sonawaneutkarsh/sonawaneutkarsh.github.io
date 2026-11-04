#!/usr/bin/env python3
"""Regression tests for the Sunday publisher (scripts/publish_scheduled.py).

Unit tests run the publisher on a scratch copy of the files it touches. The
end-to-end test publishes on a scratch copy of the whole repository, builds
the site with SvelteKit and checks the generated homepage, /blog/, feed and
sitemap (skipped when node_modules is missing).

    python3 -m unittest discover -s tests/publishing -v
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
NEXT = 'the-next-big-ai-company-might-be-incredibly-boring'
LATER = 'how-my-website-came-into-being'


def scratch_copy(dest, whole=False):
    if whole:
        ignore = shutil.ignore_patterns('node_modules', 'build', '.svelte-kit', 'test-results', 'playwright-report', '.git')
        shutil.copytree(REPO, dest, dirs_exist_ok=True, ignore=ignore)
        os.symlink(REPO / 'node_modules', dest / 'node_modules')
        return
    for rel in ('.publishing', 'static/blog', 'scripts'):
        shutil.copytree(REPO / rel, dest / rel)
    (dest / 'src/lib/content').mkdir(parents=True)
    shutil.copy(REPO / 'src/lib/content/posts.json', dest / 'src/lib/content/posts.json')
    shutil.copy(REPO / 'static/sitemap.xml', dest / 'static/sitemap.xml')


def publish(root, *args):
    return subprocess.run([sys.executable, str(root / 'scripts/publish_scheduled.py'), *args], cwd=root, capture_output=True, text=True)


def snapshot(root):
    files = {}
    for path in sorted(root.rglob('*')):
        if path.is_file() and 'node_modules' not in path.parts:
            files[path.relative_to(root).as_posix()] = path.read_bytes()
    return files


class Publisher(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        scratch_copy(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def posts(self):
        return json.loads((self.root / 'src/lib/content/posts.json').read_text(encoding='utf-8'))

    def test_nothing_due_before_the_sunday(self):
        before = snapshot(self.root)
        result = publish(self.root, '--as-of', '2026-11-07')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('0 due', result.stdout)
        self.assertEqual(snapshot(self.root), before)

    def test_publishes_the_due_post_only(self):
        result = publish(self.root, '--as-of', '2026-11-08')
        self.assertEqual(result.returncode, 0, result.stderr)
        posts = self.posts()
        self.assertEqual(posts[0]['slug'], NEXT)
        self.assertEqual(posts[0]['date'], '2026-11-08')
        # Noon in New York on Sunday 8 November (EST, UTC-5).
        self.assertEqual(posts[0]['pubDate'], '2026-11-08T17:00:00Z')
        self.assertNotIn(LATER, [p['slug'] for p in posts])
        self.assertTrue((self.root / f'static/blog/{NEXT}/index.html').is_file())
        self.assertFalse((self.root / f'.publishing/posts/{NEXT}/index.html').exists())
        self.assertTrue((self.root / f'.publishing/posts/{LATER}/index.html').is_file())
        sitemap = (self.root / 'static/sitemap.xml').read_text(encoding='utf-8')
        self.assertEqual(sitemap.count(f'/blog/{NEXT}/</loc>'), 1)
        self.assertNotIn(LATER, sitemap)
        # The staged bytes are the published bytes.
        original = (REPO / f'.publishing/posts/{NEXT}/index.html').read_bytes()
        self.assertEqual((self.root / f'static/blog/{NEXT}/index.html').read_bytes(), original)

    def test_rerun_is_idempotent(self):
        publish(self.root, '--as-of', '2026-11-08')
        once = snapshot(self.root)
        result = publish(self.root, '--as-of', '2026-11-08')
        self.assertIn('0 due', result.stdout)
        self.assertEqual(snapshot(self.root), once)

    def test_catches_up_on_missed_sundays_in_order(self):
        result = publish(self.root, '--as-of', '2026-11-16')
        self.assertEqual(result.returncode, 0, result.stderr)
        slugs = [p['slug'] for p in self.posts()]
        self.assertEqual(slugs[:2], [LATER, NEXT])
        self.assertEqual(len(slugs), len(set(slugs)))

    def test_dry_run_changes_nothing(self):
        before = snapshot(self.root)
        result = publish(self.root, '--as-of', '2026-11-15', '--dry-run')
        self.assertIn('Would publish 2026-11-08', result.stdout)
        self.assertIn('Would publish 2026-11-15', result.stdout)
        self.assertEqual(snapshot(self.root), before)

    def test_rejects_a_date_that_is_not_a_sunday(self):
        schedule = self.root / '.publishing/schedule.json'
        posts = json.loads(schedule.read_text())
        posts[1]['date'] = '2026-11-09'
        schedule.write_text(json.dumps(posts))
        result = publish(self.root, '--as-of', '2026-11-09')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Not a Sunday', result.stderr)

    def test_malformed_draft_stops_before_any_change(self):
        draft = self.root / f'.publishing/posts/{NEXT}/index.html'
        draft.write_text(draft.read_text().replace('datetime="2026-11-08"', 'datetime="2026-11-01"'))
        before = snapshot(self.root)
        result = publish(self.root, '--as-of', '2026-11-08')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Malformed staged article', result.stderr)
        self.assertEqual(snapshot(self.root), before)

    def test_daylight_saving_noon(self):
        sys.path.insert(0, str(REPO / 'scripts'))
        import publish_scheduled
        from datetime import date
        self.assertEqual(publish_scheduled.rss_time(date(2026, 10, 25)), '2026-10-25T16:00:00Z')
        self.assertEqual(publish_scheduled.rss_time(date(2026, 11, 8)), '2026-11-08T17:00:00Z')


@unittest.skipUnless((REPO / 'node_modules/.bin/vite').exists(), 'needs node_modules (npm ci)')
class PublishThenBuild(unittest.TestCase):
    """Publish the 8 November essay, build, and check everything it touches."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.tmp.name)
        scratch_copy(cls.root, whole=True)
        result = publish(cls.root, '--as-of', '2026-11-08')
        assert result.returncode == 0, result.stderr
        build = subprocess.run(['npx', 'vite', 'build'], cwd=cls.root, capture_output=True, text=True)
        assert build.returncode == 0, build.stdout[-2000:] + build.stderr[-2000:]
        cls.site = cls.root / 'build'

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def read(self, rel):
        return (self.site / rel).read_text(encoding='utf-8')

    def test_feed_leads_with_the_new_essay(self):
        feed = self.read('feed.xml')
        first = feed.index('<item>')
        self.assertIn(f'/blog/{NEXT}/</link>', feed[first:first + 400])
        self.assertIn('<pubDate>Sun, 08 Nov 2026 17:00:00 GMT</pubDate>', feed)
        self.assertEqual(feed.count('<item>'), 6)

    def test_homepage_lists_the_newest_three(self):
        html = self.read('index.html')
        writing = html[html.index('id="blog"'):]
        rows = re.findall(r'<li class="post-row">.*?href="([^"]+)"', writing, flags=re.S)
        self.assertEqual(rows, [f'/blog/{NEXT}/', '/blog/were-building-agents-to-manage-agents-where-does-it-end/', '/blog/80-percent-sleep/'])

    def test_writing_index_and_article(self):
        self.assertIn(f'href="/blog/{NEXT}/"', self.read('blog/index.html'))
        self.assertTrue((self.site / f'blog/{NEXT}/index.html').is_file())
        self.assertIn(f'<loc>https://sonawaneutkarsh.github.io/blog/{NEXT}/</loc>', self.read('sitemap.xml'))

    def test_future_draft_stays_out_of_the_site(self):
        self.assertFalse((self.site / f'blog/{LATER}').exists())
        title = 'how my website came into being'
        for page in self.site.rglob('*.html'):
            self.assertNotIn(title, page.read_text(encoding='utf-8'), page)
        self.assertNotIn(LATER, self.read('feed.xml'))
        self.assertFalse((self.site / '.publishing').exists())

    def test_site_checks_pass(self):
        for script in ('check_feed.py', 'check_links.py'):
            result = subprocess.run([sys.executable, str(self.root / 'scripts' / script), '--root', 'build'], cwd=self.root, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
