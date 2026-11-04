"""content/posts.json and everything generated from it.

Covers single-source consistency, the homepage's latest three, the /blog/
archive, RSS, the sitemap, HTML output and links, and preservation of the
original posts. Run every content test with:

    python3 -m unittest discover -s tests/content -v
"""
from __future__ import annotations

import copy
import json
import re
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path

from support import (
    BASELINE,
    DRAFT,
    ORIGINAL_SLUGS,
    REPO,
    RealRepoGuard,
    ScratchTestCase,
    archive_rows,
    changed_paths,
    entry,
    expected_row,
    feed_items,
    git_ls,
    git_show,
    homepage_rows,
    html_validate,
    read,
    require_html_validate,
    run_script,
    sitemap_lines,
    snapshot,
    strip_year,
    write_json,
    writing,
)

TODAY = writing.today_in_new_york()


def tearDownModule():
    RealRepoGuard.verify()


def synthetic(slug, day, title=None, description=None, pub=None):
    return {
        "slug": slug,
        "title": title or f"post {slug}",
        "date": day,
        "pubDate": pub or f"{day}T00:00:00Z",
        "description": description or f"about {slug}",
    }


class Refs(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = Counter()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("href", "src") and value:
                self.refs[(tag, key, value)] += 1


def refs(html):
    parser = Refs()
    parser.feed(html)
    return parser.refs


# --------------------------------------------------------------------------
# 1. Single-source metadata consistency


class SingleSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.posts = writing.load_posts(REPO, TODAY)
        cls.schedule = writing.load_schedule(REPO)
        cls.tree = writing.Tree(REPO)

    def test_posts_json_is_valid_newest_first_and_nothing_is_future_dated(self):
        self.assertEqual(writing.validate_posts(self.posts, TODAY), [])
        days = [post["date"] for post in self.posts]
        self.assertEqual(days, sorted(days, reverse=True))

    def test_committed_files_are_exactly_what_posts_json_generates(self):
        for rel, text in writing.render_site(self.tree, self.posts).items():
            with self.subTest(file=rel):
                self.assertEqual(read(REPO, rel), text, f"{rel} is stale; run python3 scripts/build_writing.py")

    def test_the_whole_site_is_consistent(self):
        problems, _notes = writing.site_problems(self.tree, self.posts, self.schedule, TODAY)
        self.assertEqual(problems, [])

    def test_check_command_passes_on_this_checkout(self):
        result = run_script(REPO, "build_writing.py", "--check")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Writing is consistent", result.stdout)

    def test_every_record_matches_its_article_page(self):
        for post in self.posts:
            rel = f"blog/{post['slug']}/index.html"
            with self.subTest(slug=post["slug"]):
                self.assertEqual(writing.page_problems(read(REPO, rel), rel, post), [])

    def test_every_deployed_article_has_a_record(self):
        pages = set(self.tree.blog_pages())
        redirects = {slug for slug in pages if writing.page_meta(read(REPO, f"blog/{slug}/index.html")).redirect}
        self.assertEqual(redirects, {"hello-world"})
        self.assertEqual(pages - redirects, {post["slug"] for post in self.posts})

    def test_the_original_posts_keep_their_order(self):
        slugs = [post["slug"] for post in self.posts]
        self.assertEqual([slug for slug in slugs if slug in ORIGINAL_SLUGS], ORIGINAL_SLUGS)


class ValidationTests(unittest.TestCase):
    def setUp(self):
        self.posts = writing.load_posts(REPO, TODAY)

    def problems(self, mutate):
        records = copy.deepcopy(self.posts)
        mutate(records)
        return "\n".join(writing.validate_posts(records))

    def test_malformed_records_are_rejected(self):
        cases = {
            "missing description": lambda r: r[0].pop("description"),
            "unknown field(s) descripton": lambda r: r[0].update(descripton="typo"),
            "duplicate slug": lambda r: r[1].update(slug=r[0]["slug"]),
            "slug must be": lambda r: r[0].update(slug="Not A Slug"),
            "newest first": lambda r: r.reverse(),
            "falls on 2026-10-31 in UTC": lambda r: r[0].update(pubDate="2026-10-31T23:00:00Z"),
            "pubDate must be a UTC timestamp": lambda r: r[0].update(pubDate="Sun, 01 Nov 2026 17:00:00 GMT"),
            "date must be YYYY-MM-DD": lambda r: r[0].update(date="2026-11-1"),
            "title must be non-empty text on one line": lambda r: r[0].update(title="two\nlines"),
            "description must be non-empty": lambda r: r[0].update(description=" "),
            "updated 2026-10-01 is before its date": lambda r: r[-1].update(updated="2026-10-01"),
            "must be an object": lambda r: r.append("not a record"),
        }
        for expected, mutate in cases.items():
            with self.subTest(expected=expected):
                self.assertIn(expected, self.problems(mutate))

    def test_a_post_dated_after_today_is_rejected(self):
        newest = date.fromisoformat(self.posts[0]["date"])
        day_before = date.fromordinal(newest.toordinal() - 1)
        self.assertIn("after today", "\n".join(writing.validate_posts(self.posts, day_before)))
        self.assertEqual(writing.validate_posts(self.posts, newest), [])

    def test_the_schedule_is_validated(self):
        good = {"date": "2030-01-06", "slug": "a-post", "title": "a post.", "description": "about it."}
        cases = {
            "2030-01-07 is not a Sunday": [dict(good, date="2030-01-07")],
            "duplicate slug": [good, dict(good, date="2030-01-13")],
            "unknown field(s) when": [dict(good, when="noon")],
            "missing description": [{key: value for key, value in good.items() if key != "description"}],
        }
        for expected, entries in cases.items():
            with self.subTest(expected=expected), tempfile.TemporaryDirectory() as tmp:
                path = Path(tmp) / writing.SCHEDULE
                path.parent.mkdir(parents=True)
                path.write_text(json.dumps(entries), encoding="utf-8")
                with self.assertRaises(writing.ContentError) as raised:
                    writing.load_schedule(tmp)
                self.assertIn(expected, str(raised.exception))


# --------------------------------------------------------------------------
# 2. Homepage latest-three ordering


class LatestThreeTests(unittest.TestCase):
    def setUp(self):
        self.posts = writing.load_posts(REPO, TODAY)

    def test_the_homepage_lists_the_three_newest_posts_in_order(self):
        found = strip_year(homepage_rows(read(REPO, "index.html")))
        self.assertEqual(found, [expected_row(post, description=False) for post in self.posts[:3]])

    def test_any_number_of_posts_gives_the_first_three(self):
        for count in (0, 1, 2, 3, 4, 9):
            posts = [synthetic(f"post-{index}", f"2030-01-{28 - index:02d}") for index in range(count)]
            html = '<section id="blog">' + "\n".join(writing.render_latest(posts)) + "</section>"
            with self.subTest(count=count):
                self.assertEqual(strip_year(homepage_rows(html)), [expected_row(post, description=False) for post in posts[:3]])

    def test_a_new_post_pushes_the_oldest_of_the_three_off(self):
        new = synthetic("brand-new", "2030-01-06")
        page = writing.fill_region(read(REPO, "index.html"), "index.html", "writing:latest", writing.render_latest([new] + self.posts))
        expected = [writing.post_path(post) for post in ([new] + self.posts)[:3]]
        self.assertEqual([row["href"] for row in homepage_rows(page)], expected)

    def test_posts_from_the_same_day_keep_their_file_order(self):
        posts = [synthetic("later-listed-first", "2030-01-06"), synthetic("second", "2030-01-06"), synthetic("older", "2030-01-05")]
        self.assertEqual(writing.validate_posts(posts), [])
        html = '<section id="blog">' + "\n".join(writing.render_latest(posts)) + "</section>"
        self.assertEqual([row["href"] for row in homepage_rows(html)], [writing.post_path(post) for post in posts])

    def test_the_writing_section_keeps_its_links(self):
        html = read(REPO, "index.html")
        section = html[html.index('<section id="blog">'):]
        section = section[: section.index("</section>")]
        self.assertEqual(section.count('<li class="post-row">'), writing.HOME_POSTS)
        self.assertIn('<a href="/blog/">All posts →</a>', section)
        self.assertIn('<a href="/feed.xml">Subscribe via RSS →</a>', section)


# --------------------------------------------------------------------------
# 3. Blog archive completeness


class ArchiveTests(unittest.TestCase):
    def test_the_archive_lists_every_published_post_with_its_description(self):
        posts = writing.load_posts(REPO, TODAY)
        found = archive_rows(read(REPO, "blog/index.html"))
        self.assertEqual(strip_year(found), [expected_row(post) for post in posts])
        self.assertEqual([row["year"] for row in found], [post["date"][:4] for post in posts])

    def test_a_new_year_gets_its_own_heading_and_list(self):
        posts = [synthetic("new-year", "2027-01-03"), synthetic("late-one", "2026-12-27"), synthetic("early-one", "2026-01-04")]
        html = "<main>" + "\n".join(writing.render_archive(posts)) + "</main>"
        found = archive_rows(html)
        self.assertEqual(
            [(row["year"], row["href"]) for row in found],
            [("2027", "/blog/new-year/"), ("2026", "/blog/late-one/"), ("2026", "/blog/early-one/")],
        )
        self.assertEqual(html.count("<h2>"), 2)
        self.assertEqual(html.count('<ul class="post-list">'), 2)

    def test_text_is_escaped_and_reads_back_unchanged(self):
        post = synthetic("escaping", "2030-01-06", title='<b>bold</b> & "quoted" it\'s', description="a < b & c > d")
        html = "<main>" + "\n".join(writing.render_archive([post])) + "</main>"
        self.assertNotIn("<b>", html)
        row = archive_rows(html)[0]
        self.assertEqual((row["title"], row["description"]), (post["title"], post["description"]))


# --------------------------------------------------------------------------
# 4. RSS correctness and stable GUIDs


class FeedTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.posts = writing.load_posts(REPO, TODAY)
        cls.xml = read(REPO, "feed.xml")
        cls.baseline = git_show("feed.xml").decode("utf-8")

    def test_the_feed_is_rss_2_with_every_published_post(self):
        rss = ET.fromstring(self.xml.encode("utf-8"))
        self.assertEqual((rss.tag, rss.get("version")), ("rss", "2.0"))
        channel = rss.find("channel")
        self.assertEqual(channel.findtext("title"), "Utkarsh Sonawane — Writing")
        self.assertEqual(channel.findtext("link"), writing.ORIGIN + "/blog/")
        self.assertEqual(channel.find("{http://www.w3.org/2005/Atom}link").get("href"), writing.ORIGIN + "/feed.xml")
        items = channel.findall("item")
        self.assertEqual(len(items), len(self.posts))
        for item, post in zip(items, self.posts):
            with self.subTest(slug=post["slug"]):
                url = writing.post_url(post)
                self.assertEqual(item.findtext("title"), post["title"])
                self.assertEqual(item.findtext("link"), url)
                self.assertEqual(item.find("guid").text, url)
                self.assertEqual(item.find("guid").get("isPermaLink"), "true")
                self.assertEqual(item.findtext("description"), post["description"])
                stamp = parsedate_to_datetime(item.findtext("pubDate"))
                self.assertEqual(stamp, datetime.strptime(post["pubDate"], writing.UTC_STAMP).replace(tzinfo=timezone.utc))
                self.assertEqual(stamp.date().isoformat(), post["date"])

    def test_the_original_posts_render_byte_identical_to_the_baseline_feed(self):
        originals = [post for post in self.posts if post["slug"] in ORIGINAL_SLUGS]
        self.assertEqual(writing.render_feed(originals), self.baseline)

    def test_the_original_items_and_guids_are_unchanged_in_the_live_feed(self):
        baseline_items = feed_items(self.baseline)
        self.assertEqual(len(baseline_items), len(ORIGINAL_SLUGS))
        self.assertEqual(feed_items(self.xml)[-len(baseline_items):], baseline_items)

    def test_guids_are_unique_permalinks_in_post_order(self):
        guids = re.findall(r'<guid isPermaLink="true">([^<]+)</guid>', self.xml)
        self.assertEqual(guids, [writing.post_url(post) for post in self.posts])
        self.assertEqual(len(guids), len(set(guids)))

    def test_a_new_post_is_prepended_and_older_items_keep_their_bytes(self):
        new = synthetic("brand-new", "2030-01-06", pub=writing.release_pub_date(date(2030, 1, 6)))
        items = feed_items(writing.render_feed([new] + self.posts))
        self.assertIn("<guid isPermaLink=\"true\">https://sonawaneutkarsh.github.io/blog/brand-new/</guid>", items[0])
        self.assertIn("<pubDate>Sun, 06 Jan 2030 17:00:00 GMT</pubDate>", items[0])
        self.assertEqual(items[1:], feed_items(self.xml))

    def test_rss_times(self):
        self.assertEqual(writing.rss_date("2026-11-01T17:00:00Z"), "Sun, 01 Nov 2026 17:00:00 GMT")
        self.assertEqual(writing.rss_date("2026-10-03T00:00:00Z"), "Sat, 03 Oct 2026 00:00:00 GMT")
        # Noon in New York: EDT (UTC-4) until 1 November 2026, EST (UTC-5) after.
        self.assertEqual(writing.release_pub_date(date(2026, 10, 25)), "2026-10-25T16:00:00Z")
        self.assertEqual(writing.release_pub_date(date(2026, 11, 8)), "2026-11-08T17:00:00Z")

    def test_escaping_matches_the_existing_feed(self):
        self.assertIn("<title>we&#x27;re building agents to manage agents.", self.xml)
        post = synthetic("escaping", "2030-01-06", title="a < b & \"c\" 'd'")
        self.assertIn("<title>a &lt; b &amp; &quot;c&quot; &#x27;d&#x27;</title>", writing.render_feed([post]))

    def test_the_existing_check_feed_script_still_passes(self):
        result = run_script(REPO, "check_feed.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


# --------------------------------------------------------------------------
# 5. Sitemap correctness


class SitemapTests(unittest.TestCase):
    NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    @classmethod
    def setUpClass(cls):
        cls.posts = writing.load_posts(REPO, TODAY)
        cls.xml = read(REPO, "sitemap.xml")

    def test_every_post_is_listed_once_with_its_lastmod(self):
        urls = ET.fromstring(self.xml.encode("utf-8")).findall("s:url", self.NS)
        locs = [url.findtext("s:loc", namespaces=self.NS) for url in urls]
        self.assertEqual(len(locs), len(set(locs)))
        lastmod = {url.findtext("s:loc", namespaces=self.NS): url.findtext("s:lastmod", namespaces=self.NS) for url in urls}
        for post in self.posts:
            with self.subTest(slug=post["slug"]):
                self.assertEqual(lastmod.get(writing.post_url(post)), post.get("updated", post["date"]))
        post_locs = {loc for loc in locs if writing.POST_LOC.fullmatch(loc)}
        self.assertEqual(post_locs, {writing.post_url(post) for post in self.posts})

    def test_every_baseline_entry_is_kept_unchanged_and_in_order(self):
        baseline = sitemap_lines(git_show("sitemap.xml").decode("utf-8"))
        current = sitemap_lines(self.xml)
        self.assertEqual([line for line in current if line in baseline], baseline)

    def test_a_new_post_is_appended_and_nothing_else_moves(self):
        updated = writing.render_sitemap(self.xml, [synthetic("brand-new", "2030-01-06")] + self.posts)
        line = f"  <url><loc>{writing.ORIGIN}/blog/brand-new/</loc><lastmod>2030-01-06</lastmod></url>\n"
        self.assertEqual(updated, self.xml.replace("</urlset>", line + "</urlset>"))

    def test_unpublished_and_duplicated_post_urls_are_removed(self):
        stray = f"  <url><loc>{writing.ORIGIN}/blog/not-published/</loc><lastmod>2030-01-06</lastmod></url>\n"
        duplicate = writing.sitemap_line(self.posts[0]) + "\n"
        polluted = self.xml.replace("</urlset>", stray + duplicate + "</urlset>")
        self.assertEqual(writing.render_sitemap(polluted, self.posts), self.xml)

    def test_removing_a_record_removes_only_its_url(self):
        gone = writing.post_url(self.posts[0])
        updated = writing.render_sitemap(self.xml, self.posts[1:])
        self.assertNotIn(gone, updated)
        self.assertEqual(sitemap_lines(updated), [line for line in sitemap_lines(self.xml) if gone not in line])

    def test_pages_that_are_not_posts_are_left_alone(self):
        others = [line for line in sitemap_lines(self.xml) if not writing.POST_LOC.fullmatch(writing.SITEMAP_LINE.fullmatch(line).group(1))]
        self.assertEqual(sitemap_lines(writing.render_sitemap(self.xml, [])), others)
        self.assertTrue(any(f"<loc>{writing.ORIGIN}/blog/</loc>" in line for line in others))

    def test_an_unexpected_format_is_refused_rather_than_rewritten(self):
        broken = self.xml.replace("<url><loc>", "<url>\n<loc>", 1)
        with self.assertRaises(writing.ContentError):
            writing.render_sitemap(broken, self.posts)

    def test_robots_txt_points_crawlers_at_the_sitemap(self):
        self.assertIn(f"Sitemap: {writing.ORIGIN}/sitemap.xml", read(REPO, "robots.txt"))


# --------------------------------------------------------------------------
# 9. HTML output and existing links


class HtmlOutputTests(unittest.TestCase):
    def test_generated_regions_are_well_formed(self):
        for rel, (name, _render) in writing.REGIONS.items():
            html = read(REPO, rel)
            with self.subTest(file=rel):
                self.assertEqual(html.count(f"<!-- BEGIN {name} "), 1)
                self.assertEqual(html.count(f"<!-- END {name} -->"), 1)
                start = html.rindex("\n", 0, html.index(f"<!-- BEGIN {name} ")) + 1
                block = html[start: html.index("\n", html.index(f"<!-- END {name} -->")) + 1]
                for line in block.splitlines():
                    self.assertEqual(line, line.rstrip(), "trailing whitespace fails html-validate")
                for tag in ("ul", "li", "div", "p", "h2"):
                    self.assertEqual(block.count(f"<{tag}>") + block.count(f"<{tag} "), block.count(f"</{tag}>"), tag)

    def test_generation_never_touches_anything_outside_the_markers(self):
        for rel, (name, render) in writing.REGIONS.items():
            html = read(REPO, rel)
            changed = writing.fill_region(html, rel, name, render([synthetic("other", "2030-01-06")]))
            begin, end = f"<!-- BEGIN {name} ", f"<!-- END {name} -->"
            with self.subTest(file=rel):
                self.assertNotEqual(changed, html)
                self.assertEqual(changed[: changed.index(begin)], html[: html.index(begin)])
                self.assertEqual(changed[changed.index(end):], html[html.index(end):])

    def test_the_archive_keeps_every_baseline_link(self):
        missing = refs(git_show("blog/index.html").decode("utf-8")) - refs(read(REPO, "blog/index.html"))
        self.assertEqual(missing, Counter())

    def test_homepage_rows_read_exactly_as_the_baseline_rows(self):
        baseline = {row["href"]: row for row in strip_year(homepage_rows(git_show("index.html").decode("utf-8")))}
        current = strip_year(homepage_rows(read(REPO, "index.html")))
        shared = [row for row in current if row["href"] in baseline]
        self.assertTrue(shared)
        for row in shared:
            self.assertEqual(row, baseline[row["href"]])

    def test_internal_links_and_assets_resolve(self):
        result = run_script(REPO, "check_links.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_the_writing_pages_pass_html_validate(self):
        if not require_html_validate(self):
            self.skipTest("html-validate is not installed (CI installs it before this suite)")
        result = subprocess.run([html_validate(), "index.html", "blog/index.html"], cwd=REPO, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


# --------------------------------------------------------------------------
# 10. Preservation of original articles and protected assets


class PreservationTests(unittest.TestCase):
    def test_original_articles_and_drafts_are_byte_identical(self):
        """Every article BASELINE had, published or staged, still has the same bytes."""
        originals = [
            rel for rel in git_ls("blog") + git_ls(writing.STAGED)
            if rel.endswith("/index.html") and rel != "blog/index.html"
        ]
        self.assertEqual(len(originals), len(ORIGINAL_SLUGS) + 1 + 2)  # five posts, hello-world, two drafts
        for rel in originals:
            slug = rel.split("/")[-2]
            published, staged = REPO / "blog" / slug / "index.html", REPO / writing.STAGED / slug / "index.html"
            current = published if published.exists() else staged
            with self.subTest(article=slug):
                self.assertTrue(current.exists(), f"{slug} is missing")
                self.assertEqual(current.read_bytes(), git_show(rel))

    def test_the_preservation_check_passes(self):
        result = run_script(REPO, "check_preservation.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Preservation passed", result.stdout)

    def test_the_pipeline_only_writes_text_files_it_owns(self):
        self.assertEqual(set(writing.GENERATED), {"index.html", "blog/index.html", "feed.xml", "sitemap.xml"})
        protected = json.loads(read(REPO, "docs/portfolio-v2/preservation-baseline.json"))
        hashed = {item["path"] for item in protected["files"] if item["path"].endswith((".jpg", ".png", ".mp4", ".pdf"))}
        self.assertFalse(hashed & {*writing.GENERATED, writing.POSTS})


class GeneratorCommandTests(ScratchTestCase):
    """The generator on a scratch copy: what it writes, and what it refuses."""

    def add_article(self, item, record_day=None):
        page = self.root / "blog" / item["slug"] / "index.html"
        page.parent.mkdir(parents=True)
        page.write_text(DRAFT.format(**item), encoding="utf-8")
        posts = self.posts()
        posts.insert(0, {
            "slug": item["slug"], "title": item["title"], "date": record_day or item["date"],
            "pubDate": writing.release_pub_date(date.fromisoformat(record_day or item["date"])),
            "description": item["description"],
        })
        write_json(self.root, writing.POSTS, posts)

    def test_a_manual_post_changes_exactly_the_four_generated_files(self):
        item = entry("manual-post", "2030-01-06")
        self.add_article(item)
        before = snapshot(self.root)
        result = run_script(self.root, "build_writing.py", "--as-of", "2030-01-06")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(changed_paths(before, snapshot(self.root)), sorted(writing.GENERATED))
        self.assertEqual(homepage_rows(read(self.root, "index.html"))[0]["href"], "/blog/manual-post/")
        self.assertEqual(run_script(self.root, "build_writing.py", "--check", "--as-of", "2030-01-06").returncode, 0)

    def test_running_it_again_changes_nothing(self):
        before = snapshot(self.root)
        result = run_script(self.root, "build_writing.py")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("up to date", result.stdout)
        self.assertEqual(changed_paths(before, snapshot(self.root)), [])

    def test_check_reports_a_hand_edited_list_and_the_generator_repairs_it(self):
        index = self.root / "index.html"
        index.write_text(index.read_text(encoding="utf-8").replace(">80% sleep?<", ">80% sleep!<"), encoding="utf-8")
        result = run_script(self.root, "build_writing.py", "--check")
        self.assertEqual(result.returncode, 1)
        self.assertIn("index.html is out of date", result.stderr)
        diff = [text[0] + text[1:].strip() for text in (line.strip() for line in result.stdout.splitlines()) if text]
        self.assertIn('-<a class="post-title" href="/blog/80-percent-sleep/">80% sleep!</a>', diff)
        self.assertIn('+<a class="post-title" href="/blog/80-percent-sleep/">80% sleep?</a>', diff)
        repaired = run_script(self.root, "build_writing.py")
        self.assertEqual(repaired.returncode, 0, repaired.stderr)
        self.assertEqual(read(self.root, "index.html"), read(REPO, "index.html"))

    def test_a_record_that_disagrees_with_its_article_is_refused(self):
        posts = self.posts()
        posts[1]["title"] = "80% sleep, revised"
        write_json(self.root, writing.POSTS, posts)
        before = snapshot(self.root)
        result = run_script(self.root, "build_writing.py")
        self.assertEqual(result.returncode, 1)
        self.assertIn("<h1> is '80% sleep?'", result.stderr)
        self.assertIn("Nothing was written", result.stderr)
        self.assertEqual(changed_paths(before, snapshot(self.root)), [])

    def test_a_post_dated_in_the_future_is_refused(self):
        self.add_article(entry("too-early", "2030-01-06"))
        before = snapshot(self.root)
        result = run_script(self.root, "build_writing.py", "--as-of", "2030-01-05")
        self.assertEqual(result.returncode, 1)
        self.assertIn("after today (2030-01-05 in New York)", result.stderr)
        self.assertEqual(changed_paths(before, snapshot(self.root)), [])

    def test_a_record_without_an_article_is_refused(self):
        posts = self.posts()
        posts.insert(0, {"slug": "ghost", "title": "ghost.", "date": "2030-01-06", "pubDate": "2030-01-06T17:00:00Z", "description": "no page."})
        write_json(self.root, writing.POSTS, posts)
        before = snapshot(self.root)
        result = run_script(self.root, "build_writing.py", "--as-of", "2030-01-06")
        self.assertEqual(result.returncode, 1)
        self.assertIn("blog/ghost/index.html is missing", result.stderr)
        self.assertEqual(changed_paths(before, snapshot(self.root)), [])

    def test_an_article_without_a_record_is_reported(self):
        page = self.root / "blog" / "orphan" / "index.html"
        page.parent.mkdir()
        page.write_text(DRAFT.format(**entry("orphan", "2026-10-04")), encoding="utf-8")
        result = run_script(self.root, "build_writing.py", "--check")
        self.assertEqual(result.returncode, 1)
        self.assertIn("blog/orphan/index.html would be deployed but is not in content/posts.json", result.stderr)

    def test_missing_markers_stop_the_generator(self):
        index = self.root / "index.html"
        index.write_text(index.read_text(encoding="utf-8").replace("<!-- END writing:latest -->\n", ""), encoding="utf-8")
        before = snapshot(self.root)
        result = run_script(self.root, "build_writing.py")
        self.assertEqual(result.returncode, 1)
        self.assertIn("index.html needs exactly one", result.stderr)
        self.assertEqual(changed_paths(before, snapshot(self.root)), [])


if __name__ == "__main__":
    unittest.main()
