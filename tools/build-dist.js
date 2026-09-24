#!/usr/bin/env node
/* Builds the publish directory (default ./dist) from the repo root: ONLY the files the running app needs.
   Everything else (tests/, tools/, .github/, ~110 handoff *.md, LIGHTHOUSE_RESULTS_*.json, RELEASE_IDENTITY.json, netlify.toml,
   DEPLOY/SECURITY docs) stays out of the public site. Files are copied byte-for-byte (no minify/rewrite), so every byte-identity
   group, the service worker's precache manifest and the offline pack zips are unchanged. Dependency-free.
   Usage: node tools/build-dist.js [outDir]        (outDir must not be, or contain, the repo root)
   The same list is exported for tests: require('./tools/build-dist.js').plan(root) -> sorted relative paths. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT_FILES = ['index.html', 'manifest.json', 'sw.js', 'robots.txt', 'sitemap.xml'];
const DENY_DIRS = new Set(['tests', 'tools', '.github', '.git', 'node_modules', 'dist']);
const DENY_FILE = (name) => /\.md$/i.test(name) || name === '.DS_Store';

function walk(dir, rel, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name), rel + e.name + '/', out);
    else if (e.isFile() && !DENY_FILE(e.name)) out.push(rel + e.name);
  }
}

function plan(root) {
  const out = [];
  for (const f of ROOT_FILES) if (fs.existsSync(path.join(root, f))) out.push(f);
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (e.isDirectory() && !DENY_DIRS.has(e.name) && !e.name.startsWith('.')) walk(path.join(root, e.name), e.name + '/', out);
  }
  return out.sort();
}

function build(root, outDir) {
  root = path.resolve(root); outDir = path.resolve(outDir);
  if (outDir === root || root.startsWith(outDir + path.sep)) throw new Error('refusing to use ' + outDir + ' as the output directory (it is, or contains, the repo root)');
  fs.rmSync(outDir, { recursive: true, force: true });
  const files = plan(root);
  for (const f of files) {
    const dest = path.join(outDir, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, f), dest);
  }
  return files;
}

module.exports = { plan, build, ROOT_FILES, DENY_DIRS };

if (require.main === module) {
  const root = path.join(__dirname, '..');
  const out = process.argv[2] || path.join(root, 'dist');
  const files = build(root, out);
  console.log('dist: ' + files.length + ' files -> ' + path.relative(process.cwd(), out));
}
