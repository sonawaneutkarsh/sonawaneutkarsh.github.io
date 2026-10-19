#!/usr/bin/env python3
"""Validate the static RSS feed against the blog index, with no dependencies."""
from datetime import date
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "https://sonawaneutkarsh.github.io"

class Posts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self.current = None
        self.capture = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "li" and "post-row" in a.get("class", "").split():
            if self.current is not None:
                raise ValueError("Nested post rows")
            self.current = {"title": ""}
        elif self.current is not None and tag == "time":
            self.current["date"] = a.get("datetime")
        elif self.current is not None and tag == "a" and "post-title" in a.get("class", "").split():
            self.current["link"] = urljoin(ORIGIN, a.get("href", ""))
            self.capture = True

    def handle_data(self, data):
        if self.capture:
            self.current["title"] += data

    def handle_endtag(self, tag):
        if tag == "a":
            self.capture = False
        elif tag == "li" and self.current is not None:
            self.current["title"] = " ".join(self.current["title"].split())
            if not all(self.current.get(k) for k in ("title", "link", "date")):
                raise ValueError(f"Incomplete blog post: {self.current}")
            self.rows.append(self.current)
            self.current = None

def main():
    posts = Posts()
    posts.feed((ROOT / "blog/index.html").read_text(encoding="utf-8"))
    rss = ET.parse(ROOT / "feed.xml").getroot()
    assert rss.tag == "rss" and rss.get("version") == "2.0"
    channel = rss.find("channel")
    assert channel is not None and channel.findtext("title")
    assert channel.findtext("link") == ORIGIN + "/blog/"
    atom = channel.find("{http://www.w3.org/2005/Atom}link")
    assert atom is not None and atom.get("href") == ORIGIN + "/feed.xml"
    entries = channel.findall("item")
    assert len(entries) == len(posts.rows), "Feed doesn't match blog post count"
    assert len({p["link"] for p in posts.rows}) == len(posts.rows), "Duplicate blog link"
    for entry, post in zip(entries, posts.rows):
        assert entry.findtext("title") == post["title"], f"Wrong title: {post['link']}"
        assert entry.findtext("link") == post["link"], f"Wrong URL: {post['link']}"
        assert entry.findtext("guid") == post["link"], f"Wrong GUID: {post['link']}"
        assert entry.findtext("description"), f"Missing excerpt: {post['link']}"
        assert parsedate_to_datetime(entry.findtext("pubDate")).date() == date.fromisoformat(post["date"]), f"Wrong date: {post['link']}"
    dates = [date.fromisoformat(p["date"]) for p in posts.rows]
    assert dates == sorted(dates, reverse=True), "Feed order isn't newest-first"
    print(f"RSS validated: {len(entries)} published posts, links and dates match the blog index.")

if __name__ == "__main__":
    main()
