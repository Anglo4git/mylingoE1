// Agent 316: serves dist/ with the REAL netlify.toml CSP + security headers (and Range support like Netlify) and checks the
// audio slide of embedded/skill lessons plus the SW-served Range path under that CSP: no securitypolicyviolation, audio loads, 0 console CSP errors.
// Usage: node tools/build-dist.js && NODE_PATH=$(npm root -g) node tools/a11y/csp-audio-probe.js   (ONLY=lesson ids)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..'), DIST = path.join(ROOT, 'dist');
const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
const csp = /Content-Security-Policy = "([^"]+)"/.exec(toml)[1];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.zip': 'application/zip' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, p); if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  const buf = fs.readFileSync(f); const h = { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m) { const s = m[1] === '' ? Math.max(0, buf.length - +m[2]) : +m[1], e = m[1] === '' || m[2] === '' ? buf.length - 1 : Math.min(+m[2], buf.length - 1); res.writeHead(206, Object.assign(h, { 'Content-Range': `bytes ${s}-${e}/${buf.length}`, 'Content-Length': e - s + 1 })); return res.end(buf.slice(s, e + 1)); }
  res.writeHead(200, Object.assign(h, { 'Content-Length': buf.length })); res.end(buf);
});
(async () => {
  await new Promise((r) => srv.listen(0, r)); const base = `http://localhost:${srv.address().port}/`;
  const ids = (process.env.ONLY || 'course-a1-unit-01-lesson-01,course-b1-unit-01-lesson-01,course-c1-unit-01-lesson-01,course-a1-unit-04-lesson-03,course-c2-unit-05-lesson-01').split(',');
  const b = await chromium.launch(); const out = [];
  for (const id of ids) {
    const L = id.split('-')[1];
    const seed = {}; JSON.parse(fs.readFileSync(`${ROOT}/course_content/lessons/${L}.json`)).forEach((l) => (l.exercise_quiz_ids || []).concat(l.lesson_quiz_id ? [l.lesson_quiz_id] : []).forEach((q) => (seed[q] = { status: 'completed', best: 100, percent: 100, attempts: 1 })));
    for (const sw of ['block', 'allow']) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: sw });
      await ctx.route(/youtube|ytimg|googlevideo/, (r) => r.abort());
      await ctx.addInitScript(() => { window.YT = { Player: function (i, o) { setTimeout(() => o.events.onStateChange({ data: 0 }), 50); } }; window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
      await ctx.addInitScript((s) => { try { localStorage.setItem('mylingo.progress.v1', JSON.stringify(s)); } catch (e) {} }, seed);
      const pg = await ctx.newPage(); const errs = [];
      pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) errs.push(m.text().slice(0, 140)); });
      await pg.goto(`${base}courses/lesson.html?lesson=${id}&level=${L}`, { waitUntil: 'networkidle' }).catch((e) => errs.push(e.message));
      if (sw === 'allow') { await pg.evaluate(() => navigator.serviceWorker.ready).catch(() => {}); await pg.reload({ waitUntil: 'networkidle' }).catch(() => {}); }
      let audio = null; const n = (await pg.$$('.trail-item,[role=tab]')).length;
      for (let i = 0; i < n && !audio; i++) {
        if (i > 0) { await pg.locator('#navNext').click().catch(() => {}); } await pg.waitForTimeout(250);
        audio = await pg.evaluate(async () => { const a = document.querySelector('audio'); if (!a) return null; await new Promise((r) => { a.addEventListener('loadedmetadata', r, { once: true }); a.addEventListener('error', r, { once: true }); a.load(); setTimeout(r, 4000); }); return { dur: a.duration, err: a.error && a.error.code, ctl: navigator.serviceWorker && !!navigator.serviceWorker.controller }; });
      }
      const csps = await pg.evaluate(() => window.__csp || []);
      out.push({ id, sw, slides: n, audio, csp: csps, errs }); await ctx.close();
    }
  }
  await b.close(); srv.close();
  const bad = out.filter((r) => !r.audio || !(r.audio.dur > 3) || r.audio.err || r.csp.length || r.errs.length);
  out.forEach((r) => console.log(JSON.stringify({ id: r.id.slice(7), sw: r.sw, au: r.audio, csp: r.csp.length, er: r.errs.length })));
  console.log(bad.length ? 'FAIL ' + JSON.stringify(bad.slice(0, 3)) : 'PASS'); process.exit(bad.length ? 1 : 0);
})();
