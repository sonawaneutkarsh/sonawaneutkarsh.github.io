#!/usr/bin/env python3
"""Check every internal link, asset, and in-page anchor in the site's HTML files.

External URLs are not fetched (no network flakiness in CI). Exit code 1 on any
broken reference.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parent.parent
SKIP_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        for key in ("href", "src", "poster"):
            if a.get(key):
                self.refs.append((tag, key, a[key]))
        if tag == "meta" and a.get("http-equiv", "").lower() == "refresh":
            content = a.get("content", "")
            if "url=" in content.lower():
                self.refs.append((tag, "refresh", content.split("=", 1)[1].strip()))


def parse(path):
    c = Collector()
    c.feed(path.read_text(encoding="utf-8"))
    return c


def resolve(page, url):
    parts = urlsplit(url)
    target = unquote(parts.path)
    if not target:
        return page, parts.fragment
    base = ROOT if target.startswith("/") else page.parent
    t = (base / target.lstrip("/")).resolve()
    if t.is_dir() or target.endswith("/"):
        t = t / "index.html"
    return t, parts.fragment


def main():
    pages = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "node_modules" not in p.parts)
    cache, errors, checked = {}, [], 0
    for page in pages:
        for tag, key, url in parse(page).refs:
            if urlsplit(url).scheme in SKIP_SCHEMES or url.startswith("//"):
                continue
            checked += 1
            target, frag = resolve(page, url)
            rel = page.relative_to(ROOT)
            if not target.exists():
                errors.append(f"{rel}: <{tag} {key}> -> {url} (missing file)")
                continue
            if frag and target.suffix == ".html":
                ids = cache.setdefault(target, parse(target).ids)
                if frag not in ids:
                    errors.append(f"{rel}: <{tag} {key}> -> {url} (missing #{frag})")
    print(f"Checked {checked} internal references in {len(pages)} pages.")
    for e in errors:
        print("BROKEN", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
