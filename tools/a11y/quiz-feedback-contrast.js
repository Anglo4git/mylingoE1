// tools/a11y/quiz-feedback-contrast.js (Agent 259)
// Checks the FIRST-QUESTION "feedback" state (.feedback.show.good / .show.bad — the banner
// shown right after Check, before Next) on shared/quiz.html — the one on-page state
// quiz-result-contrast.js (result screen) and pages-contrast.js (pre-answer question screen)
// don't cover. Tries two option picks per quiz (first option, last option) across a small
// quiz sample x light/dark, to land on both the "good" and "bad" feedback variant.
// Usage: python3 -m http.server 8765 & then NODE_PATH=$(npm root -g) node tools/a11y/quiz-feedback-contrast.js
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const BASE = process.env.BASE || 'http://localhost:8765/';
const contrastFn = require('./contrast-fn.js');

const targets = [];
for (const L of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
  const q = JSON.parse(fs.readFileSync(path.join(ROOT, L, 'quizzes.json'), 'utf8'));
  if (q[0]) targets.push({ L, id: q[0].id });
}

(async () => {
  const b = await chromium.launch();
  const res = [];
  for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ colorScheme: scheme, viewport: { width: 390, height: 844 } });
    for (const t of targets) {
      for (const pick of ['first', 'last']) {
        const pg = await ctx.newPage();
        const errs = [];
        pg.on('pageerror', (e) => errs.push(e.message));
        await pg.goto(`${BASE}shared/quiz.html?quiz=${t.id}&level=${t.L}&recommended=1`, { waitUntil: 'networkidle' }).catch(() => {});
        await pg.click('#startBtn').catch(() => {});
        await pg.waitForTimeout(150);
        const answered = await pg.evaluate((which) => {
          let did = false;
          const opts = [...document.querySelectorAll('#options .option')];
          if (opts.length) { (which === 'first' ? opts[0] : opts[opts.length - 1]).click(); did = true; }
          document.querySelectorAll('#options input[type=text],#options input:not([type])').forEach((i) => { i.value = 'x'; i.dispatchEvent(new Event('input', { bubbles: true })); did = true; });
          document.querySelectorAll('#options select').forEach((s) => { if (s.options.length > 1) { s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); did = true; } });
          const c = document.querySelector('.check-answer,#check,#checkBtn');
          if (c && !c.disabled) { c.click(); }
          return did;
        }, pick);
        if (!answered) { await pg.close(); continue; }
        await pg.waitForTimeout(250);
        const shown = await pg.evaluate(() => { const f = document.getElementById('feedback'); return f ? f.className : ''; });
        if (!/show/.test(shown)) { res.push({ t, scheme, pick, shown, skip: 'feedback never shown' }); await pg.close(); continue; }
        const c = await pg.evaluate(contrastFn);
        const ov = await pg.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        res.push({ t, scheme, pick, shown, contrast: c.filter((x) => x.sel !== 'span.sep'), ov, errs });
        await pg.close();
      }
    }
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(process.env.OUT || '/tmp/quiz_feedback_audit.json', JSON.stringify(res, null, 1));
  const variants = [...new Set(res.filter((r) => r.shown).map((r) => r.shown))];
  console.log('runs', res.length, 'variants seen:', variants.join(' | '));
  const issues = res.filter((r) => (r.contrast && r.contrast.length) || r.ov || (r.errs && r.errs.length));
  console.log('issues', issues.length);
  issues.forEach((r) => console.log(r.t.id, r.scheme, r.pick, JSON.stringify(r.contrast).slice(0, 200), r.ov, r.errs));
})();
