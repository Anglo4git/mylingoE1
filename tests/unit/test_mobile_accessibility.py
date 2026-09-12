import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / 'site'
HTML_FILES = sorted(SITE.rglob('*.html'))

class MobileAccessibilityContract(unittest.TestCase):
    def test_all_html_pages_have_mobile_viewport(self):
        missing = []
        for path in HTML_FILES:
            text = path.read_text(errors='ignore')
            if path.relative_to(ROOT).as_posix() == 'site/index.html':
                continue
            if not re.search(r'<meta[^>]+name=["\']viewport["\'][^>]+content=', text, re.I):
                missing.append(str(path.relative_to(ROOT)))
        self.assertEqual(missing, [], f'Missing mobile viewport: {missing}')

    def test_all_html_pages_have_focus_visible_rule(self):
        missing = []
        for path in HTML_FILES:
            if path.relative_to(ROOT).as_posix() == 'site/index.html':
                continue
            text = path.read_text(errors='ignore')
            if not re.search(r':focus-visible\s*\{', text, re.I):
                # Pages using the shared shell inherit its focus-visible rule.
                if 'shared/css/app-shell.css' not in text:
                    missing.append(str(path.relative_to(ROOT)))
        self.assertEqual(missing, [], f'Pages without focus-visible styling or shared shell: {missing}')

    def test_shared_nav_meets_mobile_touch_and_visibility_contract(self):
        css = (SITE / 'shared/css/app-shell.css').read_text()
        js = (SITE / 'shared/js/app-shell.js').read_text()
        self.assertRegex(css, r'\.as-tab\s*\{[^}]*min-height:\s*(?:4[8-9]|5[0-9]|6[0-9])px', re.S)
        self.assertIn('data-hidden', js)
        self.assertIn('aria-hidden', js)
        self.assertIn("setAttribute('inert','')", js)

    def test_no_html_uses_fixed_mobile_page_widths(self):
        offenders = []
        fixed = re.compile(r'(?<![-\w])width\s*:\s*(\d{3,})px', re.I)
        for path in HTML_FILES:
            text = path.read_text(errors='ignore')
            for n in fixed.findall(text):
                if int(n) > 320:
                    offenders.append(f'{path.relative_to(ROOT)}:{n}px')
        # Large max-width containers are fine; fixed width >320px is the risky case.
        self.assertEqual(offenders, [], f'Potential mobile overflow fixed widths: {offenders[:20]}')

if __name__ == '__main__':
    unittest.main()
