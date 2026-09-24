#!/usr/bin/env node
/* tools/csp-sweep.js (Agent 18)
 * Serves a freshly built dist/ with the EXACT Content-Security-Policy read from netlify.toml and loads every
 * page in a real Chromium, with the service worker ACTIVE (not blocked), online then offline.
 * Fails (exit 1) on any securitypolicyviolation event, CSP console error, page error, or non-200 offline page.
 * Needs Playwright (global): NODE_PATH=$(npm root -g) node tools/csp-sweep.js [--no-hashes]
 * --no-hashes = control run with script-src 'self' only; it MUST report violations (proves the harness works).
 * Not part of the shipped app (tools/ is not copied into dist/).
 */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const root = path.resolve(__dirname, '..');
const toml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
let csp = (toml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/) || [])[1];
if (!csp) { console.error('no CSP in netlify.toml'); process.exit(2); }
if (process.argv.includes('--no-hashes')) csp = csp.replace(/script-src [^;]+/, "script-src 'self'");
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cspdist-'));
require('./build-dist.js').build(root, out);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.zip': 'application/zip', '.png': 'image/png', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(out, p);
  if (!f.startsWith(out) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
});
const first = JSON.parse(fs.readFileSync(path.join(root, 'a1/quizzes.json'), 'utf8'))[0].id;
const PAGES = ['index.html', 'main/index.html', 'main/placement.html', 'main/progress.html', 'main/practice.html', 'courses/index.html',
  ...['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].flatMap(l => [`${l}/index.html`, `${l}/dashboard.html`, `courses/course.html?level=${l}`]),
  'courses/journey.html?level=a1', 'courses/lesson.html?lesson=a1-unit-01-lesson-01&level=a1',
  `shared/quiz.html?quiz=${first}&level=a1&recommended=1`];
(async () => {
  const { chromium } = require('playwright');
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const bad = [];
  let loads = 0, offline200 = 0;
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ colorScheme: scheme, serviceWorkers: 'allow' });
    await ctx.addInitScript(() => { window.__v = []; document.addEventListener('securitypolicyviolation', e => window.__v.push(e.violatedDirective + ' ' + (e.sample || '').slice(0, 60))); });
    const warm = await ctx.newPage();
    await warm.goto(base + 'index.html', { waitUntil: 'load' });
    await warm.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(r, 5000))])).catch(() => {});
    await warm.waitForTimeout(4000);
    for (const pass of ['online', 'offline']) {
      await ctx.setOffline(pass === 'offline');
      for (const u of PAGES) {
        const pg = await ctx.newPage(); const errs = [];
        pg.on('pageerror', e => errs.push('pageerror ' + e.message));
        pg.on('console', m => { if (m.type() === 'error' && /Content Security Policy|CSP/i.test(m.text())) errs.push('csp ' + m.text().slice(0, 120)); });
        let st = 0;
        try { const r = await pg.goto(base + u, { waitUntil: 'load', timeout: 15000 }); st = r ? r.status() : 0; } catch (e) { errs.push('nav ' + e.message.slice(0, 80)); }
        await pg.waitForTimeout(600);
        const v = await pg.evaluate(() => window.__v || []).catch(() => []);
        loads++;
        if (pass === 'offline' && st === 200) offline200++;
        if (v.length || errs.length || (pass === 'offline' && st !== 200)) bad.push({ scheme, pass, u, st, v, errs });
        await pg.close();
      }
    }
    await ctx.close();
  }
  await b.close(); srv.close();
  fs.rmSync(out, { recursive: true, force: true });
  console.log(`page loads: ${loads}; offline 200: ${offline200}; problem pages: ${bad.length}`);
  if (bad.length) console.log(JSON.stringify(bad.slice(0, 8), null, 1));
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
