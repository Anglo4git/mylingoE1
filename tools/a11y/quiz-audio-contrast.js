// Agent 318: colour contrast of the quiz audio (TTS) question in light/dark for the six *-media-01 quizzes, in three states:
// idle "Play audio", "Playing..." (stubbed speechSynthesis holds onstart), and after answering (feedback shown). Also checks the TTS button's focus indicator.
// Usage: python3 -m http.server 8765 & NODE_PATH=$(npm root -g) node tools/a11y/quiz-audio-contrast.js
'use strict';
const { chromium } = require('playwright');
const contrastFn = require('./contrast-fn.js');
const BASE = process.env.BASE || 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch(); const res = [];
  for (const scheme of ['light', 'dark']) {
    for (const L of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
      const ctx = await b.newContext({ colorScheme: scheme, viewport: { width: 390, height: 800 } });
      await ctx.addInitScript(() => { window.SpeechSynthesisUtterance = function (t) { this.text = t; }; Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, speak(u) { setTimeout(() => u.onstart && u.onstart(), 10); } } }); });
      const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
      await pg.goto(`${BASE}shared/quiz.html?quiz=${L}-media-01&level=${L}&recommended=1`, { waitUntil: 'networkidle' }).catch(() => {});
      await pg.click('#startBtn').catch(() => {});
      let found = false;
      for (let i = 0; i < 8 && !found; i++) {
        await pg.waitForTimeout(200);
        found = await pg.evaluate(() => getComputedStyle(document.getElementById('qttsBtn')).display !== 'none');
        if (found) break;
        await pg.evaluate(() => { const o = document.querySelector('#options .option'); o && o.click(); }); await pg.waitForTimeout(200);
        await pg.evaluate(() => { const n = document.getElementById('next'); if (getComputedStyle(n).display !== 'none') n.click(); });
      }
      const rec = { L, scheme, found, states: {}, errs };
      if (found) {
        rec.states.idle = await pg.evaluate(contrastFn);
        await pg.focus('#qttsBtn'); rec.focus = await pg.evaluate(() => { const cs = getComputedStyle(document.getElementById('qttsBtn')); return { outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow !== 'none' }; });
        await pg.click('#qttsBtn'); await pg.waitForTimeout(100); rec.playing = await pg.evaluate(() => document.getElementById('qttsBtn').textContent.trim());
        rec.states.playing = await pg.evaluate(contrastFn);
        await pg.evaluate(() => { const o = document.querySelector('#options .option'); o && o.click(); }); await pg.waitForTimeout(250);
        rec.states.feedback = await pg.evaluate(contrastFn);
        rec.ov = await pg.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      }
      res.push(rec); await ctx.close();
    }
  }
  await b.close();
  let bad = 0;
  res.forEach((r) => { const c = Object.values(r.states).reduce((a, x) => a.concat(x.filter((y) => y.sel !== 'span.sep')), []); const fo = r.focus && r.focus.outline.indexOf('none') !== 0 || (r.focus && r.focus.shadow); const p = !r.found || c.length || r.ov || r.errs.length || !fo || !/Playing/.test(r.playing || ''); if (p) { bad++; console.log('PROBLEM', r.L, r.scheme, r.found, JSON.stringify(c).slice(0, 300), r.ov, r.errs, JSON.stringify(r.focus), r.playing); } });
  console.log('runs', res.length, 'problems', bad); process.exit(bad ? 1 : 0);
})();
