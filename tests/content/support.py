"""Shared helpers for the content pipeline tests. Standard library only.

Every test that publishes or regenerates works on a scratch copy in a temporary
directory, never on this checkout. RealRepoGuard fails the run if a test
changes this checkout's content files anyway.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import unittest
from html.parser import HTMLParser
from pathlib import Path

sys.dont_write_bytecode = True
REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "scripts"))

import build_writing as writing  # noqa: E402
import publish_scheduled as publisher  # noqa: E402

# main when V3 branched from it (2026-11-01). It holds the five published posts,
# feed.xml and blog/index.html exactly as V3 inherited them, plus both staged
# drafts. It is on main, so it stays in history whatever happens to V3.
BASELINE = "17924666d1b39ea781ecaea76db1742cb9940eab"
ORIGINAL_SLUGS = [
    "were-building-agents-to-manage-agents-where-does-it-end",
    "80-percent-sleep",
    "why-i-stopped-working-on-nytr-problems-and-lessons",
    "code-is-cheap-execution-is-everything",
    "thoughts-on-slms-for-businesses",
]
# The html-validate invocation from .github/workflows/deploy.yml.
HTML_VALIDATE_GLOBS = [
    "index.html", "404.html", "projects/*/index.html", "blog/index.html", "blog/*/index.html",
    "notebook/index.html", "notebook/*/index.html", "explore/index.html",
]
SKIP = {".git", "node_modules", "_site", "__pycache__", "out", ".next"}
ENV = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}


def git(*args, cwd=REPO):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True).stdout


def git_show(path, rev=BASELINE):
    try:
        return git("show", f"{rev}:{path}")
    except subprocess.CalledProcessError as error:
        raise AssertionError(
            f"git show {rev[:7]}:{path} failed. These tests need the repository's full history "
            f"(actions/checkout with fetch-depth: 0). {error.stderr.decode().strip()}"
        ) from None


def git_ls(directory, rev=BASELINE):
    return git("ls-tree", "-r", "--name-only", rev, "--", directory).decode().split()


# --------------------------------------------------------------------------
# Scratch copies


def _ignore(directory, names):
    return [name for name in names if name in SKIP]


def scratch_site(dest, full=False):
    """Copy this checkout into `dest`.

    By default only what the pipeline reads and writes is copied. With
    full=True the whole site is copied into a git clone that shares this
    repository's objects, so check_preservation.py can read its baseline.
    """
    dest = Path(dest)
    if full:
        git("clone", "--quiet", "--shared", "--no-checkout", str(REPO), str(dest))
        for item in REPO.iterdir():
            if item.name in SKIP:
                continue
            target = dest / item.name
            if item.is_dir():
                shutil.copytree(item, target, ignore=_ignore, dirs_exist_ok=True)
            else:
                shutil.copy2(item, target)
        return dest
    dest.mkdir(parents=True, exist_ok=True)
    for rel in ("scripts", "blog", "content", ".publishing"):
        shutil.copytree(REPO / rel, dest / rel, ignore=_ignore)
    for rel in ("index.html", "feed.xml", "sitemap.xml"):
        shutil.copy2(REPO / rel, dest / rel)
    return dest


def snapshot(root):
    """Every file's bytes, keyed by repository-relative path (git internals excluded)."""
    root = Path(root)
    files = {}
    for directory, subdirs, names in os.walk(root):
        subdirs[:] = [name for name in subdirs if name not in SKIP]
        for name in names:
            path = Path(directory) / name
            files[path.relative_to(root).as_posix()] = path.read_bytes()
    return files


def changed_paths(before, after):
    return sorted(path for path in set(before) | set(after) if before.get(path) != after.get(path))


def run_script(root, script, *args):
    return subprocess.run(
        [sys.executable, str(Path(root) / "scripts" / script), *args],
        cwd=root, capture_output=True, text=True, env=ENV,
    )


def publish(root, *args):
    return run_script(root, "publish_scheduled.py", *args)


def read(root, rel):
    return (Path(root) / rel).read_text(encoding="utf-8")


def load_json(root, rel):
    return json.loads(read(root, rel))


def write_json(root, rel, data):
    (Path(root) / rel).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


# --------------------------------------------------------------------------
# Synthetic drafts, shaped like the site's real article pages


DRAFT = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <title>{title} — Utkarsh Sonawane</title>
    <meta content="{description}" name="description">
    <meta content="Utkarsh Sonawane" name="author">
    <link href="https://sonawaneutkarsh.github.io/blog/{slug}/" rel="canonical">
    <meta content="{title} — Utkarsh Sonawane" property="og:title">
    <meta content="{description}" property="og:description">
    <meta content="https://sonawaneutkarsh.github.io/blog/{slug}/" property="og:url">
    <meta content="article" property="og:type">
    <link href="/styles.css" rel="stylesheet">
    <link href="/feed.xml" rel="alternate" title="Utkarsh Sonawane — Writing RSS" type="application/rss+xml">
  </head>
  <body class="blog-post-page">
    <a class="skip-link" href="#content">Skip to content</a>
    <main class="container" id="content">
      <article class="blog-post-article">
        <a class="back-link" href="/blog/">← All writing</a>
        <header class="post-header">
          <h1>{title}</h1>
          <time class="date" datetime="{date}">{date}</time>
        </header>
        <div class="prose">
          <p>Synthetic test essay {slug}. It exists only inside a temporary test copy.</p>
        </div>
      </article>
    </main>
    <script src="/script.js"></script>
  </body>
</html>
"""


def entry(slug, day, title=None, description=None):
    return {
        "date": day,
        "slug": slug,
        "title": title or f"synthetic essay {slug}.",
        "description": description or f"a synthetic description for {slug}.",
    }


def stage(root, *entries, replace_schedule=True):
    """Write drafts and schedule entries into a scratch copy."""
    root = Path(root)
    if replace_schedule:
        shutil.rmtree(root / writing.STAGED, ignore_errors=True)
        schedule = []
    else:
        schedule = load_json(root, writing.SCHEDULE)
    for item in entries:
        draft = root / writing.STAGED / item["slug"] / "index.html"
        draft.parent.mkdir(parents=True, exist_ok=True)
        draft.write_text(DRAFT.format(**item), encoding="utf-8")
        schedule.append(item)
    write_json(root, writing.SCHEDULE, schedule)


# --------------------------------------------------------------------------
# Reading the generated lists back


class Rows(HTMLParser):
    """Every li.post-row: datetime, date label, link, title, description and year heading."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows, self.row, self.field, self.heading = [], None, None, None
        self.in_h2 = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        if tag == "h2":
            self.in_h2, self.heading = True, ""
        elif tag == "li" and "post-row" in classes:
            self.row = {"date": None, "label": "", "href": None, "title": "", "description": None, "year": self.heading}
        elif self.row is not None and tag == "time":
            self.row["date"], self.field = a.get("datetime"), "label"
        elif self.row is not None and tag == "a" and "post-title" in classes:
            self.row["href"], self.field = a.get("href"), "title"
        elif self.row is not None and tag == "p":
            self.row["description"], self.field = "", "description"

    def handle_endtag(self, tag):
        if tag == "h2":
            self.in_h2 = False
        elif tag in ("time", "a", "p"):
            self.field = None
        elif tag == "li" and self.row is not None:
            for key in ("label", "title", "description"):
                if self.row[key] is not None:
                    self.row[key] = writing.normalize_space(self.row[key])
            self.rows.append(self.row)
            self.row = None

    def handle_data(self, data):
        if self.in_h2:
            self.heading = writing.normalize_space(self.heading + data)
        if self.row is not None and self.field:
            self.row[self.field] += data


def rows(html):
    parser = Rows()
    parser.feed(html)
    return parser.rows


def homepage_rows(html):
    section = html[html.index('<section id="blog">'):]
    return rows(section[: section.index("</section>")])


def archive_rows(html):
    return rows(html[html.index("<main"): html.index("</main>")])


def expected_row(post, description=True):
    row = {
        "date": post["date"],
        "label": writing.date_label(post["date"]),
        "href": writing.post_path(post),
        "title": post["title"],
        "description": post["description"] if description else None,
    }
    return row


def strip_year(found):
    return [{key: value for key, value in row.items() if key != "year"} for row in found]


def feed_items(xml):
    """Each <item>…</item> block of a feed, verbatim."""
    return re.findall(r"    <item>\n.*?    </item>\n", xml, flags=re.S)


def sitemap_lines(xml):
    return [line for line in xml.splitlines() if line.startswith("  <url>")]


def html_validate():
    """Path of html-validate, or None. CI installs it before the tests run."""
    return shutil.which("html-validate")


def require_html_validate(test):
    if html_validate():
        return True
    if os.environ.get("CI"):
        test.fail("html-validate is not installed; the CI job must install it before these tests")
    return False


def html_validate_files(root):
    files = []
    for pattern in HTML_VALIDATE_GLOBS:
        files += sorted(path.relative_to(root).as_posix() for path in Path(root).glob(pattern))
    return files


def site_checks(root, as_of):
    """Run every site check CI runs on a scratch copy. Returns {name: CompletedProcess}."""
    results = {
        "build_writing --check": run_script(root, "build_writing.py", "--check", "--as-of", as_of),
        "check_feed": run_script(root, "check_feed.py"),
        "check_links": run_script(root, "check_links.py"),
        "check_preservation": run_script(root, "check_preservation.py"),
    }
    if html_validate():
        results["html-validate"] = subprocess.run(
            [html_validate(), *html_validate_files(root)], cwd=root, capture_output=True, text=True,
        )
    return results


# --------------------------------------------------------------------------
# The deployment allowlist, read from the workflows


def workflow(name):
    return (REPO / ".github" / "workflows" / name).read_text(encoding="utf-8")


def staged_site_files(text):
    """The `cp -r … _site/` allowlist from a workflow's "Stage site files" step."""
    block = text[text.index("name: Stage site files"):]
    command = block[block.index("cp -r"): block.index("_site/")]
    return command.replace("\\\n", " ").split()[2:]


def stage_site(root, dest):
    """Copy what the Pages workflows deploy into `dest`, as their cp -r step does."""
    dest = Path(dest)
    dest.mkdir(parents=True)
    for name in staged_site_files(workflow("deploy.yml")):
        source = Path(root) / name
        if source.is_dir():
            shutil.copytree(source, dest / name)
        else:
            shutil.copy2(source, dest / name)
    return dest


def git_add_paths(text):
    """Paths the scheduled workflow stages for its release commit."""
    line = next(line for line in text.splitlines() if "git add -A" in line)
    return line.split("git add -A", 1)[1].split()


# --------------------------------------------------------------------------
# Guard: tests must never change this checkout


def _guarded_files():
    files = {}
    for rel in (*writing.GENERATED, writing.POSTS, writing.SCHEDULE):
        path = REPO / rel
        files[rel] = hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None
    for directory in ("blog", writing.STAGED):
        for path in sorted((REPO / directory).rglob("*")):
            if path.is_file():
                files[path.relative_to(REPO).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return files


class RealRepoGuard:
    """Snapshot this checkout's content files at import; verify them after a module runs."""

    before = _guarded_files()

    @classmethod
    def verify(cls):
        after = _guarded_files()
        changed = changed_paths(cls.before, after)
        if changed:
            raise AssertionError(f"A test changed this checkout instead of a scratch copy: {changed}")


class ScratchTestCase(unittest.TestCase):
    """A fresh minimal scratch copy of the site for each test."""

    full = False

    def setUp(self):
        import tempfile

        self._tmp = tempfile.TemporaryDirectory(prefix="content-test-")
        self.addCleanup(self._tmp.cleanup)
        self.root = scratch_site(Path(self._tmp.name) / "site", full=self.full)

    def posts(self):
        return load_json(self.root, writing.POSTS)
