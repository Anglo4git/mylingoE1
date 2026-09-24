#!/usr/bin/env node
/* tools/verify-all.js (Agent 19) — one-command local release gate.
 * Runs: unit suite, CSP staleness check, dist build + identity check vs source, and (unless --quick or Playwright is
 * missing) the CSP + service-worker + offline sweep. Exit 1 on the first failure. Not shipped in dist.
 * Usage: NODE_PATH=$(npm root -g) node tools/verify-all.js [--quick]
 */
'use strict';
const cp = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const root = path.resolve(__dirname, '..');
const quick = process.argv.includes('--quick');
const steps = [];
function run(name, args) {
  const r = cp.spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: process.env, maxBuffer: 64 << 20 });
  const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-1)[0];
  steps.push({ name, ok: r.status === 0, tail });
  console.log((r.status === 0 ? 'PASS ' : 'FAIL ') + name + ' — ' + tail);
  if (r.status !== 0) { process.exit(1); }
}
run('unit suite', ['tests/run.js']);
run('CSP up to date', ['tools/build-csp.js', '--check']);
const bd = require('./build-dist.js');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-dist-'));
bd.build(root, out);
let n = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else { n++; const s = path.join(root, path.relative(out, f)); if (!fs.existsSync(s) || !fs.readFileSync(s).equals(fs.readFileSync(f))) { console.log('FAIL dist byte-identity: ' + path.relative(out, f)); process.exit(1); } } } })(out);
fs.rmSync(out, { recursive: true, force: true });
console.log('PASS dist byte-identical to source — ' + n + ' files');
let hasPw = true; try { require('playwright'); } catch (e) { hasPw = false; }
if (quick || !hasPw) console.log('SKIP CSP/SW/offline sweep — ' + (quick ? '--quick' : 'Playwright not resolvable (set NODE_PATH=$(npm root -g))'));
else run('CSP + service worker + offline sweep', ['tools/csp-sweep.js']);
console.log('ALL GATES PASSED');
