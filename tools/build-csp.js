#!/usr/bin/env node
/* Keeps netlify.toml's Content-Security-Policy `script-src` free of 'unsafe-inline' by listing the SHA-256 hash of every
   inline <script> block in the shipped pages instead. (This app has no inline event-handler attributes — every `.onclick=` is a
   JS property assignment, which CSP does not restrict — so hashes are enough; no 'unsafe-hashes' needed.)
   style-src keeps 'unsafe-inline' (91 inline style="" attributes + <style> blocks).
   Usage:  node tools/build-csp.js           rewrites the CSP line in netlify.toml
           node tools/build-csp.js --check   exits 1 if netlify.toml is out of date (the test suite does the same)
   RE-RUN AFTER ANY EDIT TO AN INLINE <script> BLOCK — a stale hash means that page's script is blocked in production. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { plan } = require('./build-dist.js');

const RE = /<script(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/gi;

function inlineScriptHashes(root) {
  const set = new Set();
  const perFile = {};
  for (const f of plan(root).filter((x) => x.endsWith('.html'))) {
    const t = fs.readFileSync(path.join(root, f), 'utf8');
    let m; perFile[f] = 0;
    RE.lastIndex = 0;
    while ((m = RE.exec(t))) {
      if (!m[2].trim()) continue;
      set.add('sha256-' + crypto.createHash('sha256').update(m[2], 'utf8').digest('base64'));
      perFile[f]++;
    }
  }
  return { hashes: [...set].sort(), perFile };
}

function policy(hashes) {
  return "default-src 'self'; script-src 'self' " + hashes.map((h) => "'" + h + "'").join(' ') +
    "; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; media-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
}

const LINE = /^(\s*Content-Security-Policy = )"[^"\n]*"\s*$/m;

function current(root) {
  const m = LINE.exec(fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8'));
  return m ? m[0].slice(m[1].length).trim().slice(1, -1) : null;
}

function rewrite(root) {
  const p = path.join(root, 'netlify.toml');
  const s = fs.readFileSync(p, 'utf8');
  const { hashes } = inlineScriptHashes(root);
  const out = s.replace(LINE, (_, pre) => pre + '"' + policy(hashes) + '"');
  if (out !== s) fs.writeFileSync(p, out);
  return { changed: out !== s, hashes: hashes.length };
}

module.exports = { inlineScriptHashes, policy, current, rewrite };

if (require.main === module) {
  const root = path.join(__dirname, '..');
  if (process.argv.includes('--check')) {
    const want = policy(inlineScriptHashes(root).hashes);
    if (current(root) !== want) { console.error('netlify.toml CSP is stale: run node tools/build-csp.js'); process.exit(1); }
    console.log('CSP up to date');
  } else {
    const r = rewrite(root); console.log((r.changed ? 'updated' : 'unchanged') + ': ' + r.hashes + ' script hashes');
  }
}
