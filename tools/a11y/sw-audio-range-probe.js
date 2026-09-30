// Agent 315: real-Chromium check that the service worker answers audio Range requests with 206 (Safari needs it).
// Registers /sw.js, waits for control + core precache, then fetch()es shared/audio/sample.mp3 with Range headers and plays it via <audio>.
// Usage: python3 -m http.server 8765 & NODE_PATH=$(npm root -g) node tools/a11y/sw-audio-range-probe.js
'use strict';
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('http://localhost:8765/main/index.html', { waitUntil: 'networkidle' });
  const r = await pg.evaluate(async () => {
    const reg = await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((res) => { navigator.serviceWorker.addEventListener('controllerchange', res, { once: true }); setTimeout(res, 4000); });
    const out = { controlled: !!navigator.serviceWorker.controller };
    const u = '/shared/audio/sample.mp3';
    const full = await fetch(u); out.full = [full.status, (await full.arrayBuffer()).byteLength];
    const one = async (h) => { const x = await fetch(u, { headers: { Range: h } }); return [x.status, x.headers.get('Content-Range'), (await x.arrayBuffer()).byteLength]; };
    out.r1 = await one('bytes=0-99'); out.r2 = await one('bytes=100-'); out.r3 = await one('bytes=-50'); out.r4 = await one('bytes=999999-');
    const a = new Audio(u); await new Promise((res) => { a.addEventListener('loadedmetadata', res, { once: true }); a.addEventListener('error', res, { once: true }); setTimeout(res, 4000); });
    out.dur = a.duration; out.err = a.error && a.error.code; return out;
  });
  console.log(JSON.stringify(r), 'errs', errs.length);
  const ok = r.controlled && r.full[0] === 200 && r.r1[0] === 206 && r.r1[2] === 100 && r.r2[0] === 206 && r.r2[2] === r.full[1] - 100 && r.r3[2] === 50 && r.r4[0] === 416 && r.dur > 3 && !r.err && !errs.length;
  console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok ? 0 : 1);
})();
