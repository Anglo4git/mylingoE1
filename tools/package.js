#!/usr/bin/env node
/* tools/package.js (Agent 23) — build the deliverable zip the SAFE way and prove it from a clean unzip.
 * Fixes the Agent 21 defect class: `zip -r out.zip *` silently drops dotfiles (.github/, .gitignore).
 * Steps: zip -r -X (dotfiles included; excludes .git, dist, node_modules) -> list must contain the required dotfiles ->
 *        unzip into a FRESH temp dir -> run `node tools/verify-all.js --quick` THERE. Exit 1 on any failure. Not shipped in dist.
 * Usage: NODE_PATH=$(npm root -g) node tools/package.js <out.zip>
 */
'use strict';
const cp = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || 'app-production.zip');
const REQUIRED = ['.github/workflows/deploy.yml', '.gitignore', 'netlify.toml', 'sw.js', 'STATE.md'];
function sh(cmd, args, cwd) { const r = cp.spawnSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 64 << 20, env: process.env }); return r; }
function fail(m) { console.log('FAIL ' + m); process.exit(1); }
if (fs.existsSync(out)) fs.unlinkSync(out);
let r = sh('zip', ['-r', '-X', '-q', out, '.', '-x', '.git/*', 'dist/*', 'node_modules/*'], root);
if (r.status !== 0) fail('zip: ' + (r.stderr || r.stdout));
const names = sh('unzip', ['-Z1', out], root).stdout.split('\n').filter(Boolean);
const missing = REQUIRED.filter((f) => names.indexOf(f) < 0);
if (missing.length) fail('archive is missing: ' + missing.join(', '));
console.log('PASS archive lists ' + names.length + ' entries incl. all required dotfiles');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-verify-'));
r = sh('unzip', ['-q', out, '-d', tmp], root);
if (r.status !== 0) fail('unzip: ' + (r.stderr || r.stdout));
r = sh(process.execPath, ['tools/verify-all.js', '--quick'], tmp);
const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-1)[0];
fs.rmSync(tmp, { recursive: true, force: true });
if (r.status !== 0) fail('verify-all --quick on the CLEAN UNZIP: ' + tail);
console.log('PASS clean-unzip verify-all --quick — ' + tail);
console.log('PACKAGED ' + out + ' (' + fs.statSync(out).size + ' bytes)');
