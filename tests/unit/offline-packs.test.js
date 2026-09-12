import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const helper = fs.readFileSync(path.resolve(root, 'offline_packs.py'), 'utf8');
const sw = fs.readFileSync(path.resolve(root, 'site/sw.js'), 'utf8');
const runtime = fs.readFileSync(path.resolve(root, 'site/shared/js/offline-packs.js'), 'utf8');

describe('Agent 24 offline content packs', () => {
  it('defines a versioned pack schema and level pack records', () => {
    expect(helper).toContain('mylingo.offline-packs.v1');
    expect(helper).toContain('for level in LEVELS');
    expect(helper).toContain('PACK_MANIFEST.json');
  });

  it('fails verification for missing pack index/assets', () => {
    expect(helper).toContain('missing offline/packs.json');
    expect(helper).toContain('missing asset');
    expect(helper).toContain('missing ZIP artifact');
  });

  it('service worker precaches only the pack index, not every pack file', () => {
    expect(sw).toContain("./offline/core-manifest.json");
    expect(sw).toContain("mylingo.offline-core.v1");
    expect(sw).not.toContain('PRECACHE_URLS');
    // The core shell precache must NOT expand into each pack's `files`
    // list — that would defeat selective install (installing one pack
    // would silently download every pack) and defeat clean removal
    // (files would remain cached outside the pack's own cache).
    expect(sw).not.toMatch(/pack\.files\.forEach/);
  });

  it('exposes a browser API for installing/removing a selected pack', () => {
    expect(runtime).toContain('MylingoOfflinePacks');
    expect(runtime).toContain('installPack');
    expect(runtime).toContain('removePack');
  });

  it('bounds offline-pack installation concurrency', () => {
    expect(runtime).toContain('var INSTALL_CONCURRENCY = 4;');
    expect(runtime).toContain('var concurrency = Math.min(INSTALL_CONCURRENCY, total || 1);');
    expect(runtime).toContain('Array.from({ length: concurrency }, worker)');
    expect(runtime).not.toMatch(/Promise\.all\(files\.map\(function \(file\)/);
    expect(runtime).toContain('return worker();');
    expect(runtime).toContain('installed[index] = file;');
  });
});

describe('Agent 32 offline cache consistency + freshness', () => {
  it('keeps pack caches and the app-shell cache versioned and distinct', () => {
    expect(sw).toContain("var PACK_CACHE_PREFIX = 'mylingo-offline-pack-v1-';");
    expect(runtime).toContain("var CACHE_PREFIX = 'mylingo-offline-pack-v1-';");
  });

  it('never deletes installed offline packs when the app shell cache is cleaned up', () => {
    var activateMatch = sw.match(/activate['"][\s\S]*?self\.clients\.claim\(\);\s*\}\)\s*\);?\s*\}\);/);
    expect(activateMatch).not.toBeNull();
    var activateBlock = activateMatch[0];
    expect(activateBlock).toContain('PACK_CACHE_PREFIX');
    expect(activateBlock).toMatch(/if \(key\.indexOf\(PACK_CACHE_PREFIX\) === 0\) return false;/);
  });

  it('uses a network-first freshness policy for mutable content JSON', () => {
    expect(sw).toContain('function isMutableJson(url)');
    expect(sw).toMatch(/isMutableJson\(url\)\)\s*\{\s*event\.respondWith\(networkFirst\(request\)\);/);
  });

  it('keeps cache-first only for immutable binary assets', () => {
    expect(sw).toContain('function isImmutableAsset(url)');
    expect(sw).toMatch(/mp3\|png\|svg\|ico/);
  });
});

describe('Agents 60-61 offline cache lifecycle and dependency integrity', () => {
  it('cleans stale cache versions and bounds installed pack caches', () => {
    expect(runtime).toContain("var CACHE_PREFIX_PATTERN = /^mylingo-offline-pack-v\\d+-/");
    expect(runtime).toContain('cleanupOldCacheVersions');
    expect(runtime).toContain('MAX_INSTALLED_PACKS = 4');
    expect(runtime).toContain('evictIfNeeded');
    expect(runtime).toContain('CACHE_META_KEY');
  });

  it('installs declared dependencies and rejects dependency cycles', () => {
    expect(runtime).toContain('var deps = Array.isArray(pack.dependencies)');
    expect(runtime).toContain('return installPack(dep, null, dependencyStack);');
    expect(runtime).toContain('Offline pack dependency cycle');
    expect(runtime).toContain('installed packs depend on it');
  });

  it('verifies dependency metadata in both index and ZIP manifests', () => {
    expect(helper).toContain('"dependencies": record.get("dependencies", [])');
    expect(helper).toContain('ZIP manifest does not match pack index');
    expect(helper).toContain('dependency graph contains a cycle');
  });
});
