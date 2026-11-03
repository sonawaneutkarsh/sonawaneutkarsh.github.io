#!/usr/bin/env python3
"""Check that the Svelte pages say exactly what Portfolio V3 said.

The V2 preservation check covers the articles and case studies. This one
covers the pages the SvelteKit migration rewrote as components: the homepage,
/explore/, /notebook/adr-extraction-demo/ and /blog/. Each prerendered page is
compared with the vanilla V3 page at the reference commit (36fe033):

- every text block inside <main> in V3 still appears in the Svelte page, and
  every text block the Svelte page adds is listed below with its reason;
- every link (resolved URL and its text), image and element id in V3's <main>
  is still there;
- the <title>, description, canonical URL and sharing metadata are identical.

Post lists are the exception: the Sunday publisher keeps adding posts, so the
homepage's Writing rows must be the newest three records in posts.json and
/blog/'s rows must be all of them, in order (check_feed.py ties the feed to
the same list).

Files copied from static/ must be byte-identical to V3 (sitemap.xml may only
gain entries, which the Sunday publisher appends). No dependencies.
"""
import argparse
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

REPO = Path(__file__).resolve().parent.parent
V3 = '36fe033'
ORIGIN = 'https://sonawaneutkarsh.github.io/'
PAGES = ['index.html', 'explore/index.html', 'notebook/adr-extraction-demo/index.html', 'blog/index.html']
BLOCKS = {'p', 'li', 'h1', 'h2', 'h3', 'h4', 'figcaption', 'summary', 'button', 'dt', 'dd', 'time', 'a', 'span', 'b', 'strong', 'mark', 'text'}
# Boundaries of these elements separate words, whatever whitespace the markup
# has between them (Svelte's renderer drops whitespace between blocks).
BLOCK_LEVEL = {'p', 'li', 'ul', 'ol', 'div', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'figure', 'figcaption',
               'h1', 'h2', 'h3', 'h4', 'details', 'summary', 'dl', 'dt', 'dd', 'table', 'tr', 'td', 'th', 'blockquote', 'pre',
               'br', 'button', 'svg', 'g', 'text'}

# Text that intentionally exists in only one version, and why.
REMOVED = {
    'explore/index.html': {
        'Drag to move around · Ctrl or Cmd + scroll, or the + and − buttons, zoom · Esc closes a project':
            'The input hint is interface for the workbench, so it is rendered only once the page is interactive '
            '(it is chosen by input type: phones are told about swipe and pinch).',
    },
}
ADDED = {
    'notebook/adr-extraction-demo/index.html': {
        'Reported together, not shown to be caused.':
            'V3 showed this sentence at step 6 through CSS generated content; it is now real text, so screen readers and find-in-page see it.',
    },
}
HEAD_META = ['description', 'author', 'og:title', 'og:description', 'og:url', 'og:type', 'og:site_name', 'og:image',
             'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card', 'robots']


def norm(text):
    return re.sub(r'\s+', ' ', text).strip()


class Page(HTMLParser):
    def __init__(self, url):
        super().__init__(convert_charrefs=True)
        self.url = url
        self.in_main = 0
        self.stack = []  # (tag, collected text parts)
        self.blocks, self.links, self.images, self.ids = [], set(), set(), set()
        self.main_text = []
        self.title = ''
        self.meta, self.canonical = {}, None
        self._title = False
        self._skip = 0
        self.rows = []  # post rows: [time datetime, href, title text]
        self._row = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        if tag == 'title':
            self._title = True
        if tag == 'meta' and (a.get('name') or a.get('property')):
            self.meta[a.get('name') or a.get('property')] = a.get('content')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')
        if tag in ('script', 'style'):
            self._skip += 1
        if tag == 'main':
            self.in_main += 1
        if not self.in_main:
            return
        if tag == 'li' and 'post-row' in (a.get('class') or '').split():
            self._row = {'date': None, 'href': None, 'title': [], 'depth': len(self.stack)}
        if self._row is not None:
            if tag == 'time':
                self._row['date'] = a.get('datetime')
            if tag == 'a' and 'post-title' in (a.get('class') or '').split():
                self._row['href'] = a.get('href')
                self._row['in_title'] = True
        if tag in BLOCK_LEVEL:
            self._gap()
        if tag == 'img' and a.get('src'):
            self.images.add(urljoin(self.url, a['src']))
        if tag in ('img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr'):
            return
        self.stack.append([tag, [], urljoin(self.url, a['href']) if tag == 'a' and a.get('href') else None])

    def handle_endtag(self, tag):
        if tag == 'title':
            self._title = False
        if tag in ('script', 'style'):
            self._skip -= 1
        if not self.in_main:
            return
        if tag == 'main':
            self.in_main -= 1
            return
        if tag in BLOCK_LEVEL:
            self._gap()
        if self._row is not None and tag == 'a':
            self._row['in_title'] = False
        # Pop to the matching element (tolerates implicit closes).
        while self.stack:
            name, parts, href = self.stack.pop()
            text = norm(''.join(parts))
            in_row = self._row is not None
            if name in BLOCKS and text and not in_row:
                self.blocks.append(text)
            if href and not in_row:
                self.links.add((href, text))
            if in_row and name == 'li' and len(self.stack) == self._row['depth']:
                self.rows.append((self._row['date'], self._row['href'], norm(''.join(self._row['title']))))
                self._row = None
            if self.stack:
                self.stack[-1][1].extend(parts)
            if name == tag:
                break

    def _gap(self):
        self.main_text.append(' ')
        for entry in self.stack:
            entry[1].append(' ')

    def handle_data(self, data):
        if self._skip:
            return
        if self._title:
            self.title += data
        if self.in_main:
            if self._row is not None:
                if self._row.get('in_title'):
                    self._row['title'].append(data)
                return
            self.main_text.append(data)
            if self.stack:
                self.stack[-1][1].append(data)


def parse(html, path):
    page = Page(urljoin(ORIGIN, path.replace('index.html', '')))
    page.feed(html)
    page.main_text = norm(''.join(page.main_text))
    return page


def compare(path, site):
    failures, notes = [], []
    before = parse(subprocess.check_output(['git', 'show', f'{V3}:{path}'], cwd=REPO).decode(), path)
    after = parse((site / path).read_text(encoding='utf-8'), path)
    removed, added = REMOVED.get(path, {}), ADDED.get(path, {})

    for block in sorted(set(before.blocks)):
        if block not in after.main_text and norm(block) not in after.main_text:
            if block in removed:
                notes.append(f'{path}: not prerendered by design: "{block[:60]}…" ({removed[block]})')
            else:
                failures.append(f'{path}: text from V3 is missing: "{block[:120]}"')
    seen_added = {}
    for block in sorted(set(after.blocks)):
        if block not in before.main_text:
            key = next((a for a in added if block == a or block.endswith(a) or block.endswith(a + block[-1:])), None)
            if key is None:
                key = next((a for a in added if a in block), None)
            if key is not None:
                seen_added[key] = seen_added.get(key, 0) + 1
            else:
                failures.append(f'{path}: text not in V3: "{block[:120]}"')
    for key, count in seen_added.items():
        notes.append(f'{path}: added by design ({count} blocks contain it): "{key}" ({added[key]})')
    for href, text in sorted(before.links - after.links):
        failures.append(f'{path}: link from V3 is missing: {href} "{text[:60]}"')
    for src in sorted(before.images - after.images):
        failures.append(f'{path}: image from V3 is missing: {src}')
    for missing in sorted(before.ids - after.ids):
        failures.append(f'{path}: id from V3 is missing: #{missing}')
    if norm(before.title) != norm(after.title):
        failures.append(f'{path}: <title> changed: "{norm(before.title)}" → "{norm(after.title)}"')
    if before.canonical != after.canonical:
        failures.append(f'{path}: canonical changed: {before.canonical} → {after.canonical}')
    for key in HEAD_META:
        if before.meta.get(key) != after.meta.get(key):
            failures.append(f'{path}: <meta {key}> changed: {before.meta.get(key)!r} → {after.meta.get(key)!r}')
    return failures, notes, len(set(before.blocks)), len(before.links), len(before.ids)


def post_rows(site):
    """Homepage rows = newest three posts; /blog/ rows = every post, newest first."""
    posts = json.loads((REPO / 'src/lib/content/posts.json').read_text(encoding='utf-8'))
    posts.sort(key=lambda p: p['date'], reverse=True)
    expected = [(p['date'], f"/blog/{p['slug']}/", p['title']) for p in posts]
    failures = []
    for path, want in (('index.html', expected[:3]), ('blog/index.html', expected)):
        got = parse((site / path).read_text(encoding='utf-8'), path).rows
        if got != want:
            failures.append(f'{path}: post rows {got} do not match posts.json {want}')
    v3 = parse(subprocess.check_output(['git', 'show', f'{V3}:blog/index.html'], cwd=REPO).decode(), 'blog/index.html').rows
    lost = [row for row in v3 if row not in expected]
    if lost:
        failures.append(f'posts listed in V3 are missing from posts.json: {lost}')
    return failures, len(expected)


def static_files_unchanged(site):
    """Every file served from static/ matches V3 byte for byte."""
    failures, checked = [], 0
    for file in sorted((REPO / 'static').rglob('*')):
        if not file.is_file():
            continue
        rel = file.relative_to(REPO / 'static').as_posix()
        built = site / rel
        if not built.is_file():
            failures.append(f'static/{rel} is not in the build')
            continue
        try:
            original = subprocess.check_output(['git', 'show', f'{V3}:{rel}'], cwd=REPO, stderr=subprocess.DEVNULL)
        except subprocess.CalledProcessError:
            continue  # new since V3 (e.g. a post published later)
        checked += 1
        data = built.read_bytes()
        if rel == 'sitemap.xml':
            old = set(re.findall(r'<loc>(.*?)</loc>', original.decode()))
            new = set(re.findall(r'<loc>(.*?)</loc>', data.decode()))
            if not old <= new:
                failures.append(f'sitemap.xml lost entries: {sorted(old - new)}')
        elif data != original:
            failures.append(f'{rel} differs from V3')
    return failures, checked


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='build', help='site directory to check (default: build)')
    site = (REPO / parser.parse_args().root).resolve()
    if not (site / 'index.html').is_file():
        print(f'No site at {site}: run `npm run build` first.')
        return 1
    failures, notes = [], []
    for path in PAGES:
        f, n, blocks, links, ids = compare(path, site)
        failures += f
        notes += n
        print(f'{path}: {blocks} text blocks, {links} links, {ids} ids compared with V3 ({V3}).')
    f, count = post_rows(site)
    failures += f
    print(f'Writing rows match posts.json ({count} posts; homepage shows the newest 3).')
    f, checked = static_files_unchanged(site)
    failures += f
    print(f'{checked} files copied from static/ compared byte for byte with V3.')
    for note in notes:
        print('note:', note)
    for failure in failures:
        print('FAIL:', failure)
    if not failures:
        print('Content parity passed.')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
