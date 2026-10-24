#!/usr/bin/env python3
"""Live smoke test for text2me routes, internal links, assets, and HTML fragments.

Runs after GitHub Pages deployment. Uses only the Python standard library.
External hosts are deliberately not crawled.
"""
from collections import deque
from html.parser import HTMLParser
import os
import posixpath
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urldefrag, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.ids = set()
        self.duplicate_ids = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        element_id = values.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicate_ids.append(element_id)
            self.ids.add(element_id)
        for attribute in ("href", "src", "action"):
            value = values.get(attribute)
            if value:
                self.links.append((attribute, value))


def fetch_text(url, attempts=3):
    last_error = None
    for attempt in range(attempts):
        try:
            request = Request(url, headers={"User-Agent": "text2me-site-audit/1.0"})
            with urlopen(request, timeout=20) as response:
                status = response.status
                body = response.read()
                content_type = response.headers.get("Content-Type", "")
                return status, body.decode("utf-8", errors="replace"), content_type
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(2)
    raise RuntimeError(f"GET failed after {attempts} attempts: {url}: {last_error}")


def is_html_candidate(path):
    suffix = posixpath.splitext(path)[1].lower()
    return path.endswith("/") or not suffix or suffix in {".html", ".htm"}


def main():
    site_url = os.environ.get("SITE_URL", "").strip()
    if not site_url:
        print("ERROR: SITE_URL environment variable is required.", file=sys.stderr)
        return 2

    site_url = site_url.rstrip("/") + "/"
    base = urlsplit(site_url)
    prefix = unquote(base.path.rstrip("/"))
    origin = (base.scheme, base.netloc)
    if base.scheme not in {"http", "https"} or not base.netloc:
        print(f"ERROR: invalid SITE_URL: {site_url}", file=sys.stderr)
        return 2

    def normalize(url):
        parts = urlsplit(url)
        if parts.scheme not in {"http", "https"} or not parts.netloc:
            return None, None, "non-http"
        if (parts.scheme, parts.netloc) != origin:
            return None, None, "external"
        path = unquote(parts.path or "/")
        if prefix and path == prefix:
            path += "/"
        if prefix and not path.startswith(prefix + "/"):
            return None, path, "outside-project"
        if path.endswith("/index.html"):
            path = path[:-len("index.html")]
        elif not path.endswith("/") and not posixpath.splitext(path)[1]:
            path += "/"
        clean = urlunsplit((base.scheme, base.netloc, path, "", ""))
        return clean, path, "internal"

    sitemap_url = urljoin(site_url, "sitemap.xml")
    try:
        _, sitemap_text, _ = fetch_text(sitemap_url)
        root = ElementTree.fromstring(sitemap_text)
        sitemap_urls = [
            node.text.strip()
            for node in root.iter()
            if node.tag.endswith("loc") and node.text and node.text.strip()
        ]
    except Exception as exc:
        print(f"ERROR: cannot read sitemap {sitemap_url}: {exc}", file=sys.stderr)
        return 1

    if not sitemap_urls:
        print("ERROR: sitemap contains no loc URLs.", file=sys.stderr)
        return 1

    queue = deque(sitemap_urls)
    visited_paths = set()
    html_ids = {}
    html_paths = set()
    fragment_refs = []
    errors = []
    outside_links = set()
    link_count = 0

    while queue:
        raw_url = queue.popleft()
        clean_url, path, kind = normalize(raw_url)
        if kind == "external" or kind == "non-http":
            continue
        if kind == "outside-project":
            outside_links.add(raw_url)
            continue
        if path in visited_paths:
            continue
        visited_paths.add(path)

        try:
            status, body, content_type = fetch_text(clean_url)
            if status != 200:
                errors.append(f"HTTP {status}: {clean_url}")
                continue
        except Exception as exc:
            errors.append(str(exc))
            continue

        if not is_html_candidate(path) or "html" not in content_type.lower():
            continue

        parser = PageParser()
        try:
            parser.feed(body)
            parser.close()
        except Exception as exc:
            errors.append(f"HTML parse error {clean_url}: {exc}")
            continue

        html_ids[path] = parser.ids
        html_paths.add(path)
        for duplicate in parser.duplicate_ids:
            errors.append(f"Duplicate id={duplicate!r} in {clean_url}")

        for attribute, value in parser.links:
            if value.startswith(("mailto:", "tel:", "javascript:", "data:", "blob:")):
                continue
            target = urljoin(clean_url, value)
            target_parts = urlsplit(target)
            if target_parts.fragment:
                target_clean, target_path, target_kind = normalize(target)
                if target_kind == "internal" and target_path and is_html_candidate(target_path):
                    fragment_refs.append((target_path, unquote(target_parts.fragment), clean_url, value))
            target_clean, target_path, target_kind = normalize(target)
            if target_kind == "external" or target_kind == "non-http":
                continue
            if target_kind == "outside-project":
                outside_links.add(target)
                continue
            if target_clean:
                queue.append(target_clean)

    for target_path, fragment, source_url, raw_value in fragment_refs:
        if target_path not in html_ids:
            errors.append(f"Fragment target page was not parsed: {source_url} -> {raw_value}")
        elif fragment not in html_ids[target_path]:
            errors.append(f"Missing fragment #{fragment} in {target_path} (linked from {source_url})")

    if outside_links:
        for link in sorted(outside_links):
            errors.append(f"Same-host URL is outside the deployed project path: {link}")

    print("text2me published-site smoke test")
    print(f"Base URL: {site_url}")
    print(f"Sitemap URLs: {len(sitemap_urls)}")
    print(f"Unique internal paths checked: {len(visited_paths)}")
    print(f"HTML pages parsed: {len(html_paths)}")
    print(f"Cross-page and same-page fragments checked: {len(fragment_refs)}")
    print(f"Errors: {len(errors)}")
    for error in errors:
        print("ERROR:", error)
    if errors:
        return 1
    print("PASS: internal routes, assets, and HTML fragment targets are reachable.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
