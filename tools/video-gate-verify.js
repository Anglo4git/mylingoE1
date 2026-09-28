#!/usr/bin/env node
/* tools/video-gate-verify.js (Agent 254) — end-to-end check of the video "Continue" gate under the SHIPPED CSP.
 * Serves a fresh dist with netlify.toml's CSP header; stubs only the network (youtube.com/iframe_api + embed) via
 * Playwright routes, so the real page script, real CSP and real gate code run. Asserts: (1) no CSP violations,
 * (2) Continue is locked before playback, (3) unlocks after simulated forward playback, (4) a seek-jump does not unlock.
 * Usage: NODE_PATH=$(npm root -g) node tools/video-gate-verify.js   (exit 1 on failure) */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const root = path.resolve(__dirname, '..');
const csp = (fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8').match(/Content-Security-Policy\s*=\s*"([^"]+)"/) || [])[1];
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'vgate-'));
require('./build-dist.js').build(root, out);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(out, p);
  if (!f.startsWith(out) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Security-Policy': csp });
  fs.createReadStream(f).pipe(res);
});
// Fake YT API: duration 4s; "playing" advances currentTime in real time; window.__seek(n) jumps time.
const STUB = `(function(){var t=0,st=-1,d=4,tm=null;window.__seek=function(n){t=n};
window.YT={Player:function(id,o){var self=this;this.mute=function(){};this.destroy=function(){clearInterval(tm)};
this.getCurrentTime=function(){return t};this.getDuration=function(){return d};this.getPlayerState=function(){return st};
this.playVideo=function(){st=1;var last=Date.now();tm=setInterval(function(){var n=Date.now();t=Math.min(d,t+(n-last)/1000);last=n},100)};
setTimeout(function(){o.events.onReady({target:self})},50)}};
setTimeout(function(){window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady()},50)})();`;
let failed = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failed++; };
(async () => {
  const { chromium } = require('playwright');
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const b = await chromium.launch();
  for (const mode of ['play', 'seek']) {
    const ctx = await b.newContext();
    await ctx.addInitScript(() => { window.__v = []; document.addEventListener('securitypolicyviolation', (e) => window.__v.push(e.violatedDirective + ' ' + e.blockedURI)); });
    await ctx.route('https://www.youtube.com/iframe_api', (r) => r.fulfill({ contentType: 'text/javascript', body: STUB }));
    await ctx.route('https://www.youtube.com/embed/**', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }));
    const pg = await ctx.newPage();
    await pg.goto(base + 'courses/lesson.html?lesson=course-a1-unit-01-lesson-01&level=a1', { waitUntil: 'load' });
    await pg.waitForSelector('iframe', { timeout: 8000 });
    await pg.waitForTimeout(300);
    const locked = () => pg.evaluate(() => !document.querySelector('#playerNav button') && /Watch 90%/.test(document.getElementById('playerNav').textContent));
    ok(await locked(), `[${mode}] Continue locked before playback`);
    if (mode === 'seek') { await pg.evaluate(() => window.__seek(3.9)); await pg.waitForTimeout(1500); ok(await locked(), '[seek] jumping to the end does NOT unlock (only forward playback counts)'); }
    else {
      await pg.waitForSelector('#playerNav button', { timeout: 12000 }).catch(() => {});
      ok(!(await locked()), '[play] Continue unlocks after simulated forward playback');
    }
    const v = await pg.evaluate(() => window.__v);
    ok(v.length === 0, `[${mode}] zero CSP violations (${JSON.stringify(v)})`);
    await ctx.close();
  }
  await b.close(); srv.close(); fs.rmSync(out, { recursive: true, force: true });
  console.log(failed ? 'FAILED' : 'ALL PASSED'); process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('ERROR ' + e.message); process.exit(1); });
