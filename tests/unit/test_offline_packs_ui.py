import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / 'site'
UI = SITE / 'shared/js/offline-packs-ui.js'
API = SITE / 'shared/js/offline-packs.js'

class OfflinePacksUITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ui = UI.read_text(encoding='utf-8')
        cls.api = API.read_text(encoding='utf-8')

    def test_ui_exposes_mount_and_uses_pack_api(self):
        self.assertIn('global.MylingoOfflinePacksUI', self.ui)
        self.assertIn('mount: mount', self.ui)
        for name in ('getIndex', 'isInstalled', 'installPack', 'removePack'):
            self.assertIn('API.' + name, self.ui)

    def test_ui_has_install_progress_and_safe_failure_state(self):
        self.assertIn('Caching ', self.ui)
        self.assertIn('Install failed', self.ui)
        self.assertIn('Removing…', self.ui)

    def test_ui_does_not_offer_install_action_while_offline(self):
        self.assertIn("navigator.onLine === false", self.ui)
        self.assertIn('Connect to install', self.ui)

    def test_api_performs_integrity_check_and_rolls_back_partial_install(self):
        self.assertIn('matches.every(Boolean)', self.api)
        self.assertRegex(self.api, r"caches\.delete\(CACHE_PREFIX \+ String\(id\)\)")
        self.assertIn('onProgress', self.api)

    def test_pages_load_ui_and_mount(self):
        pages = [SITE / 'main/index.html'] + [SITE / level / 'dashboard.html' for level in ('a1','a2','b1','b2','c1','c2')]
        for page in pages:
            text = page.read_text(encoding='utf-8')
            self.assertIn('offline-packs.js', text, page)
            self.assertIn('offline-packs-ui.js', text, page)
            self.assertIn('offlinePacksMount', text, page)
            self.assertIn('MylingoOfflinePacksUI.mount', text, page)

    def test_service_worker_precaches_ui_module(self):
        sw = (SITE / 'sw.js').read_text(encoding='utf-8')
        self.assertIn('./offline/core-manifest.json', sw)
        manifest = (SITE / 'offline/core-manifest.json').read_text(encoding='utf-8')
        self.assertIn('shared/js/offline-packs-ui.js', manifest)

if __name__ == '__main__':
    unittest.main(verbosity=2)

class OfflinePackScaleHardeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.api = API.read_text(encoding='utf-8')
    def test_cache_version_cleanup_and_bounded_pack_count_are_explicit(self):
        self.assertIn("CACHE_PREFIX_PATTERN = /^mylingo-offline-pack-v\\d+-/", self.api)
        self.assertIn('cleanupOldCacheVersions', self.api)
        self.assertIn('MAX_INSTALLED_PACKS = 4', self.api)
        self.assertIn('evictIfNeeded', self.api)
        self.assertIn('CACHE_META_KEY', self.api)

    def test_pack_dependencies_are_declared_and_install_is_recursive(self):
        self.assertIn('"dependencies": []', (SITE / 'offline/packs.json').read_text(encoding='utf-8'))
        self.assertIn('"dependencies": [\n        "core"', (SITE / 'offline/packs.json').read_text(encoding='utf-8'))
        self.assertIn('var deps = Array.isArray(pack.dependencies)', self.api)
        self.assertIn('return installPack(dep, null, dependencyStack);', self.api)
        self.assertIn('Offline pack dependency cycle', self.api)
        self.assertIn('installed packs depend on it', self.api)

    def test_pack_zip_manifest_carries_dependency_contract(self):
        helper = (ROOT / 'offline_packs.py').read_text(encoding='utf-8')
        self.assertIn('"dependencies": record.get("dependencies", [])', helper)
        self.assertIn('ZIP manifest does not match pack index', helper)
        self.assertIn('dependency graph contains a cycle', helper)
