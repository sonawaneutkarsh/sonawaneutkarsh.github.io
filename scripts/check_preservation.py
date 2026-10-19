#!/usr/bin/env python3
"""Compare Portfolio V2 with its immutable, pre-redesign Git baseline.

No network or third-party dependencies. Template/navigation changes are intentional;
article prose, evidence, dates, original targets and source assets must survive.
"""
import hashlib
import json
import re
import subprocess
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent.parent
BASELINE = json.loads((ROOT / 'docs/portfolio-v2/preservation-baseline.json').read_text())
BASE_REF = BASELINE['baseline_commit']

class Content(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.targets, self.dates = set(), [], []
        self.prose, self.title, self.h1 = [], [], []
        self.stack = []
        self.prose_depth = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        for key in ('href', 'src', 'poster'):
            if a.get(key):
                self.targets.append((tag, key, a[key]))
        if tag == 'time':
            self.dates.append(a.get('datetime'))
        if tag in ('meta','link','img','source','br','hr','input','wbr','area','base','embed','param','track','col'):
            return
        self.stack.append(tag)
        if 'prose' in a.get('class', '').split():
            self.prose_depth = len(self.stack)

    def handle_endtag(self, tag):
        if self.prose_depth == len(self.stack):
            self.prose_depth = None
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_data(self, text):
        if self.prose_depth:
            self.prose.append(text)
        if 'title' in self.stack:
            self.title.append(text)
        if 'h1' in self.stack:
            self.h1.append(text)


def parse(text):
    c = Content()
    c.feed(text)
    return c


def normalized(parts):
    return re.sub(r'\s+', ' ', ' '.join(parts)).strip()


def main():
    failures = []
    articles = assets = anchors = 0
    for item in BASELINE['files']:
        p = ROOT / item['path']
        if not p.exists():
            failures.append(f"Missing {item['path']}")
            continue
        if p.suffix == '.html':
            before = parse(subprocess.check_output(['git', 'show', f"{BASE_REF}:{item['path']}"], cwd=ROOT).decode())
            after = parse(p.read_text())
            missing = before.ids - after.ids
            anchors += len(before.ids)
            if missing:
                failures.append(f'{p.relative_to(ROOT)} missing IDs: {missing}')
            if item['path'].startswith(('blog/', 'projects/')) and before.prose:
                articles += 1
                for label in ('prose', 'title', 'h1'):
                    if normalized(getattr(before, label)) != normalized(getattr(after, label)):
                        failures.append(f'{p.relative_to(ROOT)} changed {label}')
                if before.dates != after.dates:
                    failures.append(f'{p.relative_to(ROOT)} changed dates')
                # All source/evidence links and media survive; only the old blog back-link changes.
                def resolved(targets):
                    base = 'https://sonawaneutkarsh.github.io/' + item['path']
                    return Counter((tag, key, urljoin(base, target)) for tag, key, target in targets)
                missing_targets = resolved(before.targets) - resolved(after.targets)
                for tag, key, target in missing_targets:
                    if target.endswith('favicon.ico') or target.endswith('favicon-32x32.png') or target.endswith('apple-touch-icon.png') or target == 'https://sonawaneutkarsh.github.io/#blog':
                        continue
                    failures.append(f'{p.relative_to(ROOT)} missing original target {target}')
        elif p.suffix in ('.jpg', '.png', '.mp4', '.pdf') and p.name not in ('favicon-32x32.png','apple-touch-icon.png'):
            assets += 1
            if hashlib.sha256(p.read_bytes()).hexdigest() != item['sha256']:
                failures.append(f'Changed immutable asset {p.relative_to(ROOT)}')
    master = BASELINE['wordmark']
    if hashlib.sha256((ROOT / master['saved_path']).read_bytes()).hexdigest() != master['sha256']:
        failures.append('Changed original wordmark master')
    print(f'Compared {articles} complete article/case-study bodies; {anchors} original IDs; {assets} immutable assets and wordmark master.')
    for failure in failures:
        print('FAIL:', failure)
    if not failures:
        print('Preservation passed: prose, titles, dates, evidence targets, anchors and immutable bytes match.')
    return bool(failures)

if __name__ == '__main__':
    raise SystemExit(main())
