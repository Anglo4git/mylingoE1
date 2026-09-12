import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = ROOT / 'site'

# Matches static href/src values, e.g. href="../shared/css/app-shell.css".
# Excludes template-built URLs (contain string concatenation `'+`), hash
# fragments, and query-only/data/mailto targets — those are covered
# separately by the level-whitelist and redirect-safety checks below.
STATIC_LINK_RE = re.compile(r'(?:href|src)="([^"]+)"')


def iter_html_files():
    return sorted(SITE.rglob('*.html'))


def is_checkable_static_path(value):
    if not value or value.startswith('#'):
        return False
    if "'+" in value or '+encodeURI' in value or value.startswith('${'):
        return False  # runtime-templated URL, not a static route
    if re.match(r'^[a-z][a-z0-9+.\-]*:', value, re.I):
        return False  # absolute scheme (http:, mailto:, data:, etc.)
    if value.startswith('//'):
        return False  # protocol-relative external
    return True


def strip_query_and_hash(value):
    return value.split('#', 1)[0].split('?', 1)[0]


class Agent114RouteRedirectNavigationAudit(unittest.TestCase):
    """Static route/redirect/navigation audit.

    Scope: every shipped HTML page's link/asset graph, the SPA-style
    query-driven routes (level/quiz/lesson), the client-side redirect
    guard in shared/quiz.html, and the manifest/offline-manifest route
    lists that must stay in sync with what's actually on disk.
    """

    def test_every_static_link_resolves_on_disk(self):
        broken = []
        for html_file in iter_html_files():
            source = html_file.read_text(encoding='utf-8')
            for value in STATIC_LINK_RE.findall(source):
                if not is_checkable_static_path(value):
                    continue
                target = strip_query_and_hash(value)
                if not target:
                    continue
                resolved = (html_file.parent / target).resolve()
                if not resolved.is_file():
                    broken.append(f'{html_file.relative_to(ROOT)} -> {value}')
        self.assertEqual(broken, [], 'Broken static link(s):\n' + '\n'.join(broken))

    def test_root_index_redirect_has_meta_refresh_and_noscript_fallback_link(self):
        source = (SITE / 'index.html').read_text(encoding='utf-8')
        self.assertIn('http-equiv="refresh"', source)
        self.assertIn('url=./main/index.html', source)
        # A real <a> fallback must exist for clients that don't honor the
        # meta refresh (e.g. some crawlers, some assistive tooling).
        self.assertIn('href="./main/index.html"', source)

    def test_quiz_redirect_param_is_validated_before_use(self):
        source = (SITE / 'shared/quiz.html').read_text(encoding='utf-8')
        self.assertIn('function isSafeRedirect(', source)
        # Guard must reject absolute/scheme URLs and protocol-relative
        # URLs, and only accept same-site relative (./ or ../) paths —
        # otherwise ?redirect= would be an open-redirect vector.
        guard_match = re.search(r'function isSafeRedirect\(url\)\{(.*?)\}', source)
        self.assertIsNotNone(guard_match, 'isSafeRedirect body not found')
        guard_body = guard_match.group(1)
        self.assertIn(r'/^\.\.?\//', guard_body)  # only ./ or ../ relative paths accepted
        self.assertIn("indexOf('//')", guard_body)
        # Every navigation triggered from quiz.html must route through the
        # guarded backTarget(), never raw `redirect`.
        nav_assignments = re.findall(r"location\.href\s*=\s*([^;]+);", source)
        raw_redirect_uses = [expr for expr in nav_assignments if expr.strip() == 'redirect']
        self.assertEqual(raw_redirect_uses, [], 'Unguarded use of raw redirect param in navigation')

    def test_level_whitelist_is_consistent_across_course_navigation_pages(self):
        expected = "['a1','a2','b1','b2','c1','c2']"
        for rel in ('courses/course.html', 'courses/journey.html', 'courses/lesson.html'):
            source = (SITE / rel).read_text(encoding='utf-8')
            self.assertIn(
                f'VALID_LEVELS={expected}', source.replace(' ', ''),
                f'{rel} level whitelist missing or diverged from {expected}',
            )

    def test_offline_core_manifest_routes_all_exist(self):
        manifest = json.loads((SITE / 'offline/core-manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(manifest.get('schema'), 'mylingo.offline-core.v1')
        missing = [f for f in manifest['files'] if not (SITE / f).is_file()]
        self.assertEqual(missing, [], 'offline core manifest lists missing file(s): ' + ', '.join(missing))

    def test_pwa_manifest_start_url_and_scope_resolve(self):
        manifest = json.loads((SITE / 'manifest.json').read_text(encoding='utf-8'))
        start_url = manifest['start_url']
        resolved = (SITE / start_url).resolve()
        self.assertTrue(resolved.is_file(), f'start_url does not resolve: {start_url}')
        for icon in manifest.get('icons', []):
            icon_path = (SITE / icon['src']).resolve()
            self.assertTrue(icon_path.is_file(), f'manifest icon missing: {icon["src"]}')

    def test_every_level_app_links_back_to_hub_and_dashboard(self):
        # Every a1..c2 index/dashboard pair must cross-link to each other
        # and back to the main hub, so no level app is a navigational
        # dead end.
        for level in ('a1', 'a2', 'b1', 'b2', 'c1', 'c2'):
            index_src = (SITE / level / 'index.html').read_text(encoding='utf-8')
            dash_src = (SITE / level / 'dashboard.html').read_text(encoding='utf-8')
            self.assertIn('href="./dashboard.html"', index_src, f'{level}/index.html missing dashboard link')
            self.assertIn('href="./index.html"', dash_src, f'{level}/dashboard.html missing index link')
            self.assertIn('href="../main/index.html"', index_src, f'{level}/index.html missing hub link')
            self.assertIn('href="../main/index.html"', dash_src, f'{level}/dashboard.html missing hub link')


if __name__ == '__main__':
    unittest.main()
