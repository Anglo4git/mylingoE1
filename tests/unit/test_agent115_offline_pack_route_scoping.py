import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = ROOT / 'site'
REPO_ROOT = ROOT

TRAVERSAL_SEGMENT_RE = re.compile(r'(^|/)\.\.(/|$)')


def scope_violations(paths):
    """Return entries that are absolute or contain a `..` path segment
    anywhere (not just a leading one) — either would let a manifest-driven
    fetch/cache-add escape the site/ scope."""
    bad = []
    for p in paths:
        if p.startswith('/'):
            bad.append(p)
        elif TRAVERSAL_SEGMENT_RE.search(p):
            bad.append(p)
    return bad


class Agent115OfflinePackRouteScopingAudit(unittest.TestCase):
    """Audit: every route a manifest hands to fetch()/cache.add() at
    runtime (offline pack files, core-manifest files) must stay inside
    site/. Also verifies the offline-packs.js <-> sw.js cache-prefix
    contract and the fixed relative include depth that BASE_URL math in
    offline-packs.js depends on.
    """

    def test_offline_packs_json_files_are_scope_contained(self):
        data = json.loads((SITE / 'offline/packs.json').read_text(encoding='utf-8'))
        for pack in data['packs']:
            violations = scope_violations(pack.get('files', []))
            self.assertEqual(
                violations, [],
                f"pack '{pack.get('id')}' has scope-escaping file path(s): {violations}",
            )

    def test_core_manifest_files_are_scope_contained(self):
        data = json.loads((SITE / 'offline/core-manifest.json').read_text(encoding='utf-8'))
        violations = scope_violations(data['files'])
        self.assertEqual(violations, [], f'core manifest has scope-escaping file path(s): {violations}')

    def test_pack_dependency_ids_are_known_packs(self):
        data = json.loads((SITE / 'offline/packs.json').read_text(encoding='utf-8'))
        ids = {p['id'] for p in data['packs']}
        for pack in data['packs']:
            for dep in pack.get('dependencies', []):
                self.assertIn(dep, ids, f"pack '{pack['id']}' depends on unknown pack id '{dep}'")

    def test_default_install_packs_exist_and_are_installable(self):
        data = json.loads((SITE / 'offline/packs.json').read_text(encoding='utf-8'))
        ids = {p['id'] for p in data['packs']}
        for default_id in data.get('default_install', []):
            self.assertIn(default_id, ids, f"default_install references unknown pack '{default_id}'")

    def test_cache_prefix_matches_between_service_worker_and_offline_packs_js(self):
        sw_source = (SITE / 'sw.js').read_text(encoding='utf-8')
        packs_source = (SITE / 'shared/js/offline-packs.js').read_text(encoding='utf-8')
        sw_prefix = re.search(r"PACK_CACHE_PREFIX\s*=\s*'([^']+)'", sw_source)
        js_prefix = re.search(r"CACHE_PREFIX\s*=\s*'([^']+)'", packs_source)
        self.assertIsNotNone(sw_prefix)
        self.assertIsNotNone(js_prefix)
        self.assertEqual(
            sw_prefix.group(1), js_prefix.group(1),
            'sw.js PACK_CACHE_PREFIX has drifted from offline-packs.js CACHE_PREFIX — '
            'activate() cache cleanup could delete or fail to protect learner-installed packs.',
        )

    def test_activate_handler_never_sweeps_pack_caches(self):
        sw_source = (SITE / 'sw.js').read_text(encoding='utf-8')
        activate_match = re.search(r"addEventListener\('activate'.*?\}\);", sw_source, re.S)
        self.assertIsNotNone(activate_match, 'activate handler not found in sw.js')
        activate_block = activate_match.group(0)
        self.assertIn('PACK_CACHE_PREFIX', activate_block)
        self.assertIn("indexOf(PACK_CACHE_PREFIX) === 0) return false", activate_block)

    def test_offline_packs_js_is_always_included_at_shared_js_depth(self):
        # BASE_URL in offline-packs.js is derived as new URL('../../', script.src),
        # which only resolves to the site root when the script is always loaded
        # from exactly <levelOrSection>/../shared/js/offline-packs.js (one
        # directory below site/). If any page ever includes it from a
        # different relative depth, BASE_URL — and therefore every pack
        # asset fetch — would point outside the intended site scope.
        offenders = []
        for html_file in sorted(SITE.rglob('*.html')):
            source = html_file.read_text(encoding='utf-8')
            for src in re.findall(r'<script src="([^"]*offline-packs\.js)"', source):
                if src != '../shared/js/offline-packs.js':
                    offenders.append(f'{html_file.relative_to(ROOT)} -> {src}')
        self.assertEqual(offenders, [], 'offline-packs.js included at unexpected relative depth:\n' + '\n'.join(offenders))


if __name__ == '__main__':
    unittest.main()
