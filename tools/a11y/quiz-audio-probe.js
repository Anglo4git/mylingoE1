// Agent 313: real-browser probe of quiz.html audio questions (the 6 *-media-01 quizzes: media.audio.tts / .src).
// Per quiz x width (390, 320) x speechSynthesis (present via stub / absent): walks every question, and on each audio question checks
// wrapper visible, TTS button >=44px + focusable + label, click works (stub records the utterance text), missing-API fallback text + disabled,
// <audio> path (src) when present, no h-scroll, no page errors.
// Usage: python3 -m http.server 8765 & NODE_PATH=$(npm root -g) node tools/a11y/quiz-audio-probe.js   (ONLY=a1-media-01,... OUT=file)
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8765/';
const ids = (process.env.ONLY || 'a1-media-01,a2-media-01,b1-media-01,b2-media-01,c1-media-01,c2-media-01').split(',');
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const id of ids) {
    const L = id.slice(0, 2);
    for (const w of [390, 320]) {
      for (const tts of ['stub', 'none']) {
        const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
        await ctx.addInitScript((mode) => {
          window.__spoken = [];
          if (mode === 'stub') {
            window.SpeechSynthesisUtterance = function (t) { this.text = t; };
            Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { cancel() {}, speak(u) { window.__spoken.push(u.text); setTimeout(() => { u.onstart && u.onstart(); setTimeout(() => u.onend && u.onend(), 30); }, 10); } } });
          } else {
            try { Object.defineProperty(window, 'speechSynthesis', { configurable: true, get() { return undefined; } }); delete window.speechSynthesis; } catch (e) {}
            try { Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined }); } catch (e) {}
          }
        }, tts);
        const pg = await ctx.newPage(); const errs = [];
        pg.on('pageerror', (e) => errs.push(e.message));
        pg.on('requestfailed', (r) => errs.push('reqfail ' + r.url()));
        await pg.goto(`${BASE}shared/quiz.html?quiz=${id}&level=${L}&recommended=1`, { waitUntil: 'networkidle' }).catch((e) => errs.push(e.message));
        await pg.click('#startBtn').catch(() => {});
        const rec = { id, w, tts, questions: 0, audioQs: [], overflow: false, errs };
        for (let step = 0; step < 14; step++) {
          await pg.waitForTimeout(150);
          const info = await pg.evaluate(async () => {
            const aw = document.getElementById('qaudioWrap'); const btn = document.getElementById('qttsBtn'); const au = document.getElementById('qaudio');
            const vis = (e) => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
            const r = { ov: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, wrap: vis(aw) };
            if (vis(aw)) {
              if (vis(btn)) {
                const bx = btn.getBoundingClientRect(); r.btnH = Math.round(bx.height); r.btnW = Math.round(bx.width);
                btn.focus(); r.focusable = document.activeElement === btn;
                const cs = getComputedStyle(btn); r.outline = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
                r.name = (btn.textContent || '').trim(); r.label = (document.getElementById('qaudioLabel') || {}).textContent;
                const before = (window.__spoken || []).length; btn.click(); await new Promise((s) => setTimeout(s, 120));
                r.spoken = (window.__spoken || []).length - before; r.after = (btn.textContent || '').trim(); r.disabled = btn.disabled; r.ariaDisabled = btn.getAttribute('aria-disabled');
              }
              if (vis(au)) { r.audioSrc = au.getAttribute('src'); r.audioLabel = au.getAttribute('aria-label'); r.audioH = Math.round(au.getBoundingClientRect().height); }
            }
            return r;
          });
          rec.questions++;
          if (info.ov) rec.overflow = true;
          if (info.wrap) rec.audioQs.push(info);
          // answer + advance
          const moved = await pg.evaluate(() => {
            const opts = [...document.querySelectorAll('#options .option')]; if (opts.length) opts[0].click();
            document.querySelectorAll('#options input[type=text],#options input:not([type])').forEach((i) => { i.value = 'x'; i.dispatchEvent(new Event('input', { bubbles: true })); });
            document.querySelectorAll('#options select').forEach((s) => { if (s.options.length > 1) { s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); } });
            const c = document.querySelector('.check-answer'); if (c && !c.disabled) c.click(); return true;
          });
          await pg.waitForTimeout(150);
          const nxVis = await pg.evaluate(() => { const e = document.getElementById('next'); return !!e && getComputedStyle(e).display !== 'none' && !e.disabled; });
          if (!nxVis) break; await pg.click('#next').catch(() => {});
          await pg.waitForTimeout(120);
          if (await pg.evaluate(() => { const e = document.getElementById('end'); return !!e && getComputedStyle(e).display !== 'none'; })) break;
        }
        out.push(rec); await ctx.close();
      }
    }
  }
  await b.close();
  fs.writeFileSync(process.env.OUT || '/tmp/quiz-audio-probe.json', JSON.stringify(out, null, 1));
  const bad = [];
  for (const r of out) {
    if (r.errs.length) bad.push([r.id, r.w, r.tts, 'errs', r.errs.slice(0, 2)]);
    if (r.overflow) bad.push([r.id, r.w, r.tts, 'overflow']);
    if (r.audioQs.length < 2) bad.push([r.id, r.w, r.tts, 'audioQs', r.audioQs.length, 'of questions', r.questions]);
    r.audioQs.forEach((a) => {
      if (a.btnH != null) {
        if (a.btnH < 44) bad.push([r.id, r.w, r.tts, 'btnH', a.btnH]);
        if (!a.focusable) bad.push([r.id, r.w, r.tts, 'notFocusable']);
        if (r.tts === 'stub' && a.spoken !== 1) bad.push([r.id, r.w, r.tts, 'spoken', a.spoken]);
        if (r.tts === 'none' && !(a.disabled && a.ariaDisabled === 'true')) bad.push([r.id, r.w, r.tts, 'no-fallback', a.after]);
      } else if (!a.audioSrc) bad.push([r.id, r.w, r.tts, 'no control']);
    });
  }
  console.log('runs', out.length, 'audioQs/run', [...new Set(out.map((r) => r.audioQs.length))].join(','), 'problems', bad.length);
  bad.slice(0, 20).forEach((x) => console.log(JSON.stringify(x)));
})();
