import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = ROOT / 'site'

ALL_PAGES = [
    SITE / 'index.html',
    SITE / 'main/index.html',
    SITE / 'main/practice.html',
    SITE / 'main/progress.html',
    SITE / 'main/placement.html',
    SITE / 'courses/index.html',
    SITE / 'courses/course.html',
    SITE / 'courses/journey.html',
    SITE / 'courses/lesson.html',
    SITE / 'a1/index.html', SITE / 'a1/dashboard.html',
    SITE / 'a2/index.html', SITE / 'a2/dashboard.html',
    SITE / 'b1/index.html', SITE / 'b1/dashboard.html',
    SITE / 'b2/index.html', SITE / 'b2/dashboard.html',
    SITE / 'c1/index.html', SITE / 'c1/dashboard.html',
    SITE / 'c2/index.html', SITE / 'c2/dashboard.html',
    SITE / 'shared/quiz.html',
]


class Agent115AccessibilityMobileQA(unittest.TestCase):
    """Regression guards for the real-browser accessibility/mobile QA pass
    (Agent 115). These lock in findings verified with Playwright/Chromium
    against a live local server, so a future edit that reintroduces a
    findable regression fails fast in CI rather than requiring another
    manual browser pass to notice.
    """

    def test_every_page_has_non_blocking_viewport_meta(self):
        # A page must not disable pinch-zoom / text scaling
        # (WCAG 1.4.4 Resize Text).
        for page in ALL_PAGES:
            source = page.read_text(encoding='utf-8')
            m = re.search(r'<meta\s+name="viewport"\s+content="([^"]+)"', source)
            self.assertIsNotNone(m, f'{page} is missing a viewport meta tag')
            content = m.group(1)
            self.assertNotIn('user-scalable=no', content, f'{page} blocks pinch-zoom')
            self.assertNotRegex(content, r'maximum-scale=\s*1(\.0*)?\b',
                                 f'{page} caps maximum-scale, blocking text zoom')

    def test_no_outline_none_focus_traps(self):
        # A bare `outline:none`/`outline:0` with nothing replacing it removes
        # the only default focus indicator for keyboard users.
        for page in ALL_PAGES:
            source = page.read_text(encoding='utf-8')
            self.assertNotRegex(
                source, r'outline\s*:\s*(none|0)\b',
                f'{page} sets outline:none/0 with no visible replacement found nearby')

    def test_no_orientation_lock_in_markup(self):
        for page in ALL_PAGES:
            source = page.read_text(encoding='utf-8')
            self.assertNotRegex(source, r'orientation\s*:\s*(portrait|landscape)',
                                 f'{page} locks layout to a single orientation')

    def test_no_unsemantic_clickable_divs_or_spans(self):
        # A div/span with a raw onclick and no role/tabindex is invisible to
        # keyboard and screen-reader users; buttons/links must be used instead.
        pattern = re.compile(r'<(div|span)\b[^>]*\bonclick=', re.I)
        for page in ALL_PAGES:
            source = page.read_text(encoding='utf-8')
            self.assertNotRegex(source, pattern,
                                 f'{page} has a non-semantic clickable div/span')
        for js_file in (ROOT / 'site/shared/js').glob('*.js'):
            source = js_file.read_text(encoding='utf-8')
            self.assertNotRegex(source, r'<(div|span)[^>]*onclick=',
                                 f'{js_file} generates a non-semantic clickable div/span')

    def test_no_external_links_without_review(self):
        # This app currently ships with zero external (http/https) links.
        # If one is ever added it must carry rel=noopener and an explicit
        # "opens in new tab"-style label; this test forces that review to
        # happen rather than letting an unlabeled external link ship silently.
        ext_re = re.compile(r'<a\b[^>]*href="https?://[^"]+"[^>]*>', re.I)
        for page in ALL_PAGES:
            source = page.read_text(encoding='utf-8')
            for tag in ext_re.findall(source):
                self.assertIn('rel=', tag, f'{page} has an external link missing rel=noopener: {tag}')
                self.assertTrue('noopener' in tag, f'{page} external link missing noopener: {tag}')

    def test_quiz_screen_background_is_inert_during_overlays(self):
        # Real-browser check (Agent 115): without this, a screen-reader
        # user's virtual cursor can reach the hidden #main-content behind
        # a full-screen overlay (start/error/end). Confirmed already present.
        source = (SITE / 'shared/quiz.html').read_text(encoding='utf-8')
        self.assertIn('setBackgroundInert', source)
        self.assertRegex(source, r"setAttribute\('inert'")

    def test_quiz_dynamic_controls_carry_accessible_names(self):
        # Every dynamically created form control across the non-radio
        # renderers (dropdown, matching, free-text) must set aria-label.
        source = (SITE / 'shared/quiz.html').read_text(encoding='utf-8')
        for marker in [
            "select.setAttribute('aria-label','Choose an answer')",
            "select.setAttribute('aria-label','Match '",
            "input.setAttribute('aria-label',type==='fill_in_the_blank'",
        ]:
            self.assertIn(marker, source, f'missing accessible-name wiring: {marker}')

    def test_reduced_motion_media_query_present(self):
        css = (SITE / 'shared/css/app-shell.css').read_text(encoding='utf-8')
        self.assertIn('prefers-reduced-motion', css)
        quiz = (SITE / 'shared/quiz.html').read_text(encoding='utf-8')
        self.assertIn('prefers-reduced-motion', quiz)

    def test_skip_link_present_on_every_app_shell_page(self):
        # main/*, level apps, courses/*, and quiz.html are the pages with a
        # persistent header+nav shell, so each needs a "skip to content" link.
        shell_pages = [p for p in ALL_PAGES if p.name != 'index.html' or 'main' in str(p) or 'a1' in str(p)]
        for page in shell_pages:
            source = page.read_text(encoding='utf-8')
            if '<nav' not in source:
                continue
            self.assertRegex(
                source, r'class="skip(-link)?"',
                f'{page} has a nav shell but no skip link')


if __name__ == '__main__':
    unittest.main()
