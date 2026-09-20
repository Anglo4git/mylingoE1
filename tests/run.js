#!/usr/bin/env node
/*
 * Minimal regression harness for Mylingo's pure-logic modules.
 *
 * Why this exists (Agent 157): the placement -> level-lock audit found a
 * real bug (Agent 156's fix #1) that a `node --check` syntax pass can never
 * catch, because it's a *behavioral* regression, not a parse error. Every
 * agent since has re-verified fixes with one-off scripts in /tmp that don't
 * survive the session. This file is the permanent home Agent 156's handoff
 * asked the next agent to create. Run with: node tests/run.js
 *
 * Scope: level-lock.js, recommendations.js, placement.js, skill-mastery.js
 * and review-scheduler.js (Agent 158), learner-state.js, gamification.js
 * (XP/streak + backup/restore), quiz-packer.js and offline-packs.js
 * (Agent 159, the last one against fake Cache Storage), safe-url.js
 * (Agent 160), course-progress.js (Agent 161), canonical-metadata.js and its
 * runtime-v2-adapter.js interaction, offline core-precache reconciliation
 * (manifest == packs.json == core.zip == source; every script/css/nav target
 * of a precached page is precached; sw.js serves .js/.css offline) (Agent 162),
 * runtime-v2-adapter.js question/quiz/hierarchy/manifest normalization plus a
 * every-shipped-quiz invariant scan, and runtime-content-loader.js (Agent 163),
 * and quiz.html's own inline logic (Agent 164) — lifted out of the real file by name
 * and run in a vm sandbox (typing, validate(), grading of every question type,
 * session shards/migration, save(), result-screen tier/redirect helpers), so a
 * renamed or restructured function fails loudly instead of silently untested,
 * placement.js's full decision engine (bands, verification path, confidence, evidence
 * merging, 120-question ladder, storage) plus quiz.html's saveAssessmentResult run
 * for real against it (Agent 165),
 * recommendations.js (rules, ranking, catalog availability, quiz picks incl. the real
 * manifests and a real placement profile) plus quiz.html's renderPlacementRecommendations
 * run for real against it (Agent 166),
 * quiz.html's placement results screen (placementContinue, renderPlacementResult, renderSuggestions)
 * and the primary -> verification pending record, run for real through the runtime adapter and
 * saveAssessmentResult against the shipped placement banks (Agent 167),
 * a cross-module "stored data must pass the backup validators" check, plus
 * static page-wiring scans (quiz.html id bindings; level-lock script presence
 * / offline precache),
 * quiz.html's render() dispatcher (Agent 172), lesson gate (Agent 173) and keyboard layer
 * (onOptionKeydown, moveFocus, the document digit-key handler) (Agent 174), and load() itself
 * (lock / gate / placement-vs-loader routing / error states / start screen) (Agent 175), and renderRanking's
 * inline keyboard-reorder / drag-and-drop listeners and splash.js (Agent 176), and
 * orientation.js (scoring, level bands, recommendation, placementUrl, storage) and app-shell.js
 * (bottom-nav mount, root derivation, active-tab routing, setVisible, press feedback) (Agent 177), and
 * authoring-draft-autosave.js (chunked save/load, legacy fallback, debounce/flush/clear, storage
 * failure handling) (Agent 178), and offline-packs-ui.js (the Offline learning panel: rows, escaping, ordering,
 * install/remove flows, online/offline handling; run against a parsing fake DOM and a hand-settled fake pack API)
 * plus its static page wiring (Agent 179), and mastery-review-ui.js (the dashboard "Today\u2019s Review" panel: empty / due /
 * nothing-due states, KPIs, rounding, escaping, module-capture order; run against the REAL skill-mastery.js +
 * review-scheduler.js in a vm sandbox and the hoisted fake DOM) plus its static page wiring (Agent 180), and authoring-validation.js
 * (per-row rules, per-quiz rules, config fallbacks and the incremental validation engine, incl. an incremental-equals-full-recompute
 * property sweep and a read-count proof of the hot path; run in a `window`-only vm sandbox) plus a "nothing ships it" static scan (Agent 181)., and courses/lesson.html's inline script (the top-level helpers lifted by name, plus the WHOLE script run for real against the real level-lock / course-progress / safe-url modules, a fake fetch and a purpose-built mini DOM: fetch chain, sequential + level gates, slide deck, navigation, completion gate, offline listener, every shipped lesson) and the duplicated esc / readProgress / fetchJson / statusFor / renderError helpers of course.html + journey.html (Agent 182), and the page-level rendering of course.html and journey.html (fetch chain, level lock, header / stats / chips, CTA, unit open state, unlock rules, lesson rows, continue card, unit sections; both pages cross-checked against each other, against the lesson.html gate order, and against every shipped level) on the hoisted PN mini DOM (Agent 183), and courses/index.html's inline script (fetch chain across the six per-level lessons files + fallback, published/order filtering, MASTERY-gated per-course %, CTA label, stats scoped to a course's own units, escaping, and — extending PN with appendChild/classList/dataset/style and an `[attr]` selector — level-lock.js's decorateLevelLinks actually exercised end to end: locked-card class + overlay + neutralized link, and its try/catch swallowing a missing module) via a `makeRunPage` helper hoisted out of Agent 183's page-runner so later pages can reuse it (Agent 184), and main/progress.html's inline script (top stats, recent-activity feed, per-level breakdown cards — all derived straight from localStorage plus a best-effort per-level quizzes.json fetch, no shared/js module dependency and no level-lock check at all) run for real via the same hoisted makeRunPage (Agent 185), and main/placement.html's two inline scripts (the orientation quiz: fresh / resume / finished / garbage state, answer + Back flow, result + level-lock ceiling + assessment link, Change answers, skip / manual chooser + level-link decoration, header stats; and the theme toggle) run for real against the real gamification / orientation / placement / level-lock modules, with `makeRunPage` extended by `namedGlobals`, `setup`, `document.querySelector`, `documentElement` and PN `focus()` / `:last-child` (Agent 186), and the identical <level>/index.html and <level>/dashboard.html scripts (six-copy byte identity; level from the URL path; list, filters, pagination, load failures, lock; dashboard stats, rows, not-started list, reset, backup panel, offline / mastery mounts) run for real via `makeRunPage` extended with `pathname` / `confirm` / `badjson` / `fetchOpts` (Agent 187)., and the "Continue learning" card script of the root index.html + main/index.html (in-progress / fallback / ordering / escaping / failure paths, every shipped lesson, fetches stay inside the app folder for both page depths) plus the main/practice.html redirect, and the dashboards' always-reachable Backup & restore panel (Agent 188).
 * Add new tests to this file rather than starting a new one.
 *
 * Agent 199: course-progress.js's readProgress() now collapses a stored non-object (JSON null / number / string / boolean) to {} instead of returning
 * null (which made lessonCompletionRecord / lessonPercent throw); new direct-unit section (own vm sandbox) covers readProgress shapes, esc, exports,
 * the 90% / 60% boundaries, gate ids, sessionRatio and resolveHomepageState's base / fallback / ordering / filtering; sw.js CACHE_VERSION v20 -> v21.
 *
 * Agent 200: gamification.js hardened against corrupted stored state (a primitive ledger entry no longer throws; non-finite / negative counters and
 * ledger fields read as 0 - "Infinity" used to be written back as null and wipe the XP total); new gamification untrusted-state section; level-lock.js and
 * course-progress.js gaps found by a CORRECTED mutation sweep (the core.zip identity test kills every core-pack mutant, so it must be excluded from kill
 * counts); sw.js CACHE_VERSION v21 -> v22.
 *
 * Agent 201: skill-mastery.js + review-scheduler.js hardened (counters given as "Infinity" no longer become Infinity -> null on write; a null / blank / false / []
 * `timestamp` or `now` no longer means 1970; a non-numeric review-card last_accuracy is null, not NaN, so validateStore() stops rejecting the whole section);
 * new direct-unit section for both modules; corrected-criterion mutation sweeps (94 + 138 mutants); sw.js CACHE_VERSION v22 -> v23.
 *
 * Agent 202: recommendations.js (a skill_counts value of "Infinity" no longer yields question_count: Infinity) and mastery-review-ui.js (`now: null | '' | false | []` no
 * longer means the epoch so nothing was ever due - the Agent 180 pin was flipped; the "Priority skill" KPI is now HTML-escaped) hardened; new direct-unit sections;
 * corrected-criterion sweeps (116 + 106 mutants); sw.js CACHE_VERSION v23 -> v24.
 */
'use strict';
const assert = require('assert');
const path = require('path');

// ---- minimal localStorage + window shim, shared across modules ----
function makeFakeStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}
const fakeWindow = { localStorage: makeFakeStorage(), dispatchEvent: () => {}, CustomEvent: function (t, d) { this.type = t; this.detail = d && d.detail; } };

function loadModule(relPath) {
  const fs = require('fs');
  const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const fn = new Function('global', 'window', code);
  fn(fakeWindow, fakeWindow);
}

// Agent 166: hoisted from the Agent 164 and 165 sections (they held byte-different but
// equivalent copies). Lifts one top-level function out of quiz.html by name (brace-matched,
// string/comment/regex-literal aware) so tests can run the REAL code in a vm sandbox.
function extractFn(src, name) {
  const m = new RegExp('^(async )?function ' + name + '\\(', 'm').exec(src);
  if (!m) throw new Error('quiz.html: function ' + name + ' not found');
  let i = src.indexOf('{', src.indexOf(')', m.index)), depth = 0;
  for (; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '/') { // regex literal (a `/` right after an operator/opening token): skip it whole, honouring [...] and \\ escapes
      let j = i - 1; while (j >= 0 && /\s/.test(src[j])) j--;
      if (j < 0 || '(,=:[!&|?{};'.indexOf(src[j]) >= 0) {
        let inClass = false;
        for (i++; i < src.length; i++) { const d = src[i]; if (d === '\\') { i++; continue; } if (d === '[') inClass = true; else if (d === ']') inClass = false; else if (d === '/' && !inClass) break; }
        continue;
      }
    }
    if (c === "'" || c === '"' || c === '`') { for (i++; i < src.length && src[i] !== c; i++) { if (src[i] === '\\') i++; } continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(m.index, i + 1);
  }
  throw new Error('quiz.html: unbalanced braces in ' + name);
}

// Agent 180: hoisted from the Agent 179 section (second user: mastery-review-ui.js). A tiny fake DOM whose
// innerHTML setter really parses the markup a module writes (nested tags, quoted attributes, entity decoding),
// with querySelector(All) for `.class` / `tag` selectors, textContent, dataset and click().
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ENT[m]);
class El {
  constructor(tag) { this.tagName = String(tag).toLowerCase(); this.attrs = {}; this.children = []; this.parent = null; this.listeners = {}; this.dataset = {}; this.disabled = false; this.title = ''; this.id = ''; this.className = ''; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); if (k === 'class') this.className = String(v); }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  click() { (this.listeners.click || []).slice().forEach((f) => f.call(this, { type: 'click' })); }
  get textContent() { return this.children.map((c) => (c.text !== undefined ? c.text : c.textContent)).join(''); }
  set textContent(v) { this.children = v === '' ? [] : [{ text: String(v) }]; }
  set innerHTML(html) {
    this.children = [];
    const stack = [this];
    const re = /<\/([a-z0-9]+)>|<([a-z0-9]+)((?:\s+[a-z-]+="[^"]*")*)\s*>|([^<]+)/gi;
    let m;
    while ((m = re.exec(html))) {
      if (m[1]) { stack.pop(); continue; }
      if (m[4] !== undefined) { const top = stack[stack.length - 1]; top.children.push({ text: decode(m[4]), parent: top }); continue; }
      const el = new El(m[2]);
      const ar = /([a-z-]+)="([^"]*)"/gi; let a;
      while ((a = ar.exec(m[3] || ''))) el.setAttribute(a[1], decode(a[2]));
      stack[stack.length - 1].appendChild(el);
      stack.push(el);
    }
    if (stack.length !== 1) throw new Error('fake DOM: unbalanced markup: ' + html);
  }
  matches(sel) { return sel[0] === '.' ? this.className.split(/\s+/).indexOf(sel.slice(1)) >= 0 : this.tagName === sel.toLowerCase(); }
  querySelectorAll(sel) {
    const parts = String(sel).trim().split(/\s+/); // Agent 180: descendant combinator ("a b"); no other combinators
    let scope = [this];
    parts.forEach((part) => {
      const next = [];
      scope.forEach((rootEl) => { const walk = (n) => n.children.forEach((c) => { if (c.tagName) { if (c.matches(part) && next.indexOf(c) < 0) next.push(c); walk(c); } }); walk(rootEl); });
      scope = next;
    });
    return scope;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

// Agent 183: hoisted from the Agent 182 lesson.html section (second user: course.html / journey.html page tests).
// Purpose-built mini DOM: tolerant HTML tokenizer (void / raw-text / comment / boolean attributes), serialisation, remove(),
// outerHTML, attributes, textContent / href setters, and a DOMParser that mirrors the real "<div>..</div>" first-child behaviour.
// It is NOT a browser: parser-quirk (mXSS) behaviour is out of scope.
// ---- mini DOM ----
const VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
const RAW = { script: 1, style: 1 };
const dec = (s) => s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: '\u00a0' }[k]));
const escT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escA = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
class PN {
  constructor(type, tag) { this.nodeType = type; this.childNodes = []; this.parentNode = null; this.listeners = {}; if (type === 1) { this.tagName = String(tag).toUpperCase(); this._a = []; } }
  get attributes() { return this._a.map((x) => ({ name: x.name, value: x.value })); }
  getAttribute(k) { const a = this._a.find((x) => x.name === k); return a ? a.value : null; }
  setAttribute(k, v) { const a = this._a.find((x) => x.name === k); if (a) a.value = String(v); else this._a.push({ name: k, value: String(v) }); }
  removeAttribute(k) { this._a = this._a.filter((x) => x.name !== k); }
  get id() { return this.getAttribute('id') || ''; }
  set id(v) { this.setAttribute('id', v); } // Agent 187 (gamification.js installBackupUi sets box.id)
  get className() { return this.getAttribute('class') || ''; }
  set className(v) { this.setAttribute('class', v); }
  // Agent 184: added for courses/index.html's use of level-lock.js's decorateLevelLinks
  // (appendChild for the lock overlay, classList/dataset/style for its class + guard-flag +
  // inline-style manipulation). Proxies so arbitrary property names (style.position,
  // dataset.mylingoLocked, delete dataset.x) work without enumerating them up front.
  appendChild(c) { c.parentNode = this; this.childNodes.push(c); return c; }
  get classList() {
    const self = this;
    const set = () => new Set(self.className.split(/\s+/).filter(Boolean));
    return {
      add: (...cs) => { const s = set(); cs.forEach((c) => s.add(c)); self.className = [...s].join(' '); },
      remove: (...cs) => { const s = set(); cs.forEach((c) => s.delete(c)); self.className = [...s].join(' '); },
      contains: (c) => set().has(c),
      has: (c) => set().has(c),
      toggle: (c) => { const s = set(); if (s.has(c)) s.delete(c); else s.add(c); self.className = [...s].join(' '); },
    };
  }
  get dataset() {
    const self = this;
    const toAttr = (k) => 'data-' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    return new Proxy({}, {
      get: (t, k) => (typeof k === 'string' ? (self.getAttribute(toAttr(k)) === null ? undefined : self.getAttribute(toAttr(k))) : undefined),
      set: (t, k, v) => { self.setAttribute(toAttr(k), v); return true; },
      deleteProperty: (t, k) => { self.removeAttribute(toAttr(k)); return true; },
      has: (t, k) => self.getAttribute(toAttr(k)) !== null,
    });
  }
  get style() {
    if (!this._style) {
      const props = {};
      this._style = new Proxy({}, {
        get: (t, k) => (k === 'cssText' ? Object.keys(props).map((p) => p + ':' + props[p] + ';').join('') : props[k] || ''),
        set: (t, k, v) => {
          if (k === 'cssText') { Object.keys(props).forEach((p) => delete props[p]); String(v).split(';').forEach((part) => { const i = part.indexOf(':'); if (i < 0) return; const kk = part.slice(0, i).trim().replace(/-([a-z])/g, (m, c) => c.toUpperCase()); const val = part.slice(i + 1).trim(); if (kk) props[kk] = val; }); }
          else { props[k] = v; }
          return true;
        },
      });
    }
    return this._style;
  }
  remove() { if (this.parentNode) this.parentNode.childNodes = this.parentNode.childNodes.filter((c) => c !== this); this.parentNode = null; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  click() { (this.listeners.click || []).slice().forEach((f) => f.call(this, { type: 'click' })); }
  get firstChild() { return this.childNodes[0] || null; }
  focus() { this.focusCount = (this.focusCount || 0) + 1; } // Agent 186
  get textContent() { return this.childNodes.map((c) => (c.nodeType === 3 ? c.data : c.nodeType === 1 ? c.textContent : '')).join(''); }
  set textContent(v) { this.childNodes.forEach((c) => { c.parentNode = null; }); this.childNodes = []; if (v !== '' && v != null) { const t = new PN(3); t.data = String(v); t.parentNode = this; this.childNodes.push(t); } }
  get href() { return this.getAttribute('href'); }
  set href(v) { this.setAttribute('href', v); }
  get innerHTML() { return this.childNodes.map(ser).join(''); }
  set innerHTML(h) { this.childNodes.forEach((c) => { c.parentNode = null; }); this.childNodes = []; parseInto(this, String(h)); }
  set outerHTML(h) {
    const p = this.parentNode, i = p.childNodes.indexOf(this), tmp = new PN(11); parseInto(tmp, String(h));
    tmp.childNodes.forEach((c) => { c.parentNode = p; });
    p.childNodes.splice(i, 1, ...tmp.childNodes); this.parentNode = null;
  }
  matches(sel) { if (/:last-child$/.test(sel)) { const els = this.parentNode ? this.parentNode.childNodes.filter((c) => c.nodeType === 1) : []; return els[els.length - 1] === this && this.matches(sel.replace(/:last-child$/, '')); } /* Agent 186: :last-child */ if (sel[0] === '.') return this.className.split(/\s+/).indexOf(sel.slice(1)) >= 0; if (sel[0] === '#') return this.id === sel.slice(1); if (sel[0] === '[') return this.getAttribute(sel.slice(1, -1)) !== null; return this.tagName === sel.toUpperCase(); }
  querySelectorAll(sel) { const out = []; (function w(n) { n.childNodes.forEach((c) => { if (c.nodeType === 1) { if (c.matches(sel)) out.push(c); w(c); } }); })(this); return out; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
function ser(n) {
  if (n.nodeType === 3) return n.parentNode && RAW[n.parentNode.tagName.toLowerCase()] ? n.data : escT(n.data);
  if (n.nodeType === 8) return '<!--' + n.data + '-->';
  const t = n.tagName.toLowerCase();
  return '<' + t + n._a.map((a) => ' ' + a.name + '="' + escA(a.value) + '"').join('') + '>' + (VOID[t] ? '' : n.childNodes.map(ser).join('') + '</' + t + '>');
}
function parseInto(parent, html) {
  const stack = [parent];
  const top = () => stack[stack.length - 1];
  const add = (n) => { n.parentNode = top(); top().childNodes.push(n); return n; };
  const re = /<!--([\s\S]*?)-->|<\/([a-zA-Z][^\s>]*)\s*>|<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)|(<)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) { const c = add(new PN(8)); c.data = m[1]; }
    else if (m[2]) { const t = m[2].toLowerCase(); for (let i = stack.length - 1; i > 0; i--) if (stack[i].tagName.toLowerCase() === t) { stack.length = i; break; } }
    else if (m[3]) {
      const t = m[3].toLowerCase(), el = add(new PN(1, t));
      const ar = /([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g; let a;
      while ((a = ar.exec(m[4] || ''))) { const v = a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : ''; if (!el._a.some((x) => x.name === a[1].toLowerCase())) el._a.push({ name: a[1].toLowerCase(), value: dec(v) }); }
      if (RAW[t]) { const end = html.toLowerCase().indexOf('</' + t, re.lastIndex); const stop = end < 0 ? html.length : end; const tx = new PN(3); tx.data = html.slice(re.lastIndex, stop); tx.parentNode = el; el.childNodes.push(tx); re.lastIndex = stop; }
      else if (!VOID[t] && !m[5]) stack.push(el);
    } else { const tx = add(new PN(3)); tx.data = dec(m[6] !== undefined ? m[6] : m[7]); }
  }
}
class FakeDOMParser {
  parseFromString(h) { const frag = new PN(11); parseInto(frag, String(h)); return { body: { firstChild: frag.childNodes[0] || null } }; }
}

// Agent 184: hoisted from the Agent 183 course.html/journey.html run() per its own handoff note
// ("copy run() into a hoisted helper first — it is generic apart from the page name"). Runs a
// page's WHOLE inline script for real in a vm sandbox against real shared/js/*.js modules, a fake
// fetch, fake localStorage and the PN mini DOM, keyed off the page's own id="…" markup.
const RUN_FS = require('fs'), RUN_VM = require('vm');
const RUN_ROOT = path.join(__dirname, '..');
const RUN_READ = (...p) => RUN_FS.readFileSync(path.join(RUN_ROOT, ...p), 'utf8');
// Agent 186: + or (orientation.js), pl (placement.js), ga (gamification.js) for main/placement.html.
const RUN_MOD = { ll: RUN_READ('shared', 'js', 'level-lock.js'), cp: RUN_READ('shared', 'js', 'course-progress.js'), or: RUN_READ('shared', 'js', 'orientation.js'), pl: RUN_READ('shared', 'js', 'placement.js'), ga: RUN_READ('shared', 'js', 'gamification.js') };
const runSettle = async () => { for (let i = 0; i < 25; i++) await new Promise((r) => setImmediate(r)); };
function makeRunPage(html, script, contentId) {
  contentId = contentId || 'content';
  return async function run(o) {
    o = o || {};
    const store = makeFakeStorage();
    Object.keys(o.storage || {}).forEach((k) => store.setItem(k, o.storage[k]));
    const els = {};
    [...html.matchAll(/\bid="([^"]+)"/g)].forEach((m) => { if (!els[m[1]]) { els[m[1]] = new PN(1, 'div'); els[m[1]].setAttribute('id', m[1]); } });
    const fetches = [], fetchOpts = [], files = o.files;
    const sb = {
      URLSearchParams, URL, localStorage: store, console, navigator: { onLine: true },
      location: { search: o.search === undefined ? '?level=a1' : o.search, pathname: o.pathname }, // Agent 187: pathname (level index/dashboard pages derive the level from it)
      confirm: o.confirm || (() => true),
      // Agent 186: + documentElement, and a querySelector that resolves "#id [simple selector]" against the id map.
      document: { title: '', documentElement: new PN(1, 'html'), getElementById: (id) => els[id] || Object.keys(els).reduce((f, k) => f || els[k].querySelector('#' + id), null), /* Agent 187: also finds ids created inside an element's innerHTML */ createElement: (tag) => new PN(1, tag), querySelector: (sel) => { const parts = String(sel).trim().split(/\s+/); const root = parts[0][0] === '#' ? els[parts[0].slice(1)] : null; if (!root) return null; return parts.length === 1 ? root : root.querySelector(parts.slice(1).join(' ')); } },
      getComputedStyle: () => ({ position: 'static' }),
      dispatchEvent: () => {}, CustomEvent: function (t, d) { this.type = t; this.detail = d && d.detail; },
      fetch: (url, opts) => {
        fetches.push(url); fetchOpts.push(opts); const v = files[url]; // Agent 187: fetchOpts
        if (v === 'throw') return Promise.reject(new Error('net'));
        if (v === 'badjson') return Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) }); // Agent 187
        if (v === undefined) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(v))) });
      },
    };
    sb.window = sb;
    // Agent 186: o.namedGlobals = ids exposed as window globals (browser named-element access, which
    // main/placement.html relies on for its undeclared `back`); o.setup(els, sb, store) runs before the modules.
    (o.namedGlobals || []).forEach((id) => { sb[id] = els[id]; });
    if (o.setup) o.setup(els, sb, store);
    RUN_VM.createContext(sb);
    (o.modules || ['ll', 'cp']).forEach((m) => RUN_VM.runInContext(RUN_MOD[m], sb));
    RUN_VM.runInContext(script, sb);
    await runSettle();
    const c = els[contentId];
    return {
      sb, els, store, fetches, fetchOpts, c,
      get html() { return c.innerHTML; },
      err: () => (c.querySelector('.err') ? c.querySelector('.err').textContent : null),
      text: () => c.textContent,
    };
  };
}

let pass = 0, fail = 0;
// Agent 162: tests that need to await (e.g. a service-worker respondWith promise) queue
// here and run at the end, just before the summary; `test()` above stays synchronous.
const queuedAsync = [];
function testAsync(name, body) { queuedAsync.push([name, body]); }
function test(name, body) {
  try { body(); pass++; console.log('  ok - ' + name); }
  catch (e) { fail++; console.log('  FAIL - ' + name); console.log('    ' + (e && e.message)); }
}

// ============================================================
console.log('level-lock.js');
// ============================================================
(function () {
  fakeWindow.localStorage.clear();
  delete fakeWindow.MylingoLevelLock;
  loadModule('shared/js/level-lock.js');
  const LL = fakeWindow.MylingoLevelLock;

  test('nothing chosen yet -> nothing locked', () => {
    assert.strictEqual(LL.isLocked('c2'), false);
  });

  test('setAssigned moves the ceiling and locks levels above it', () => {
    LL.setAssigned('a2');
    assert.strictEqual(LL.isLocked('b1'), true);
    assert.strictEqual(LL.isLocked('a2'), false);
    assert.strictEqual(LL.isLocked('a1'), false);
  });

  test('setAssigned can move the ceiling back down (authoritative)', () => {
    LL.setAssigned('b2');
    assert.strictEqual(LL.isLocked('b2'), false);
    LL.setAssigned('a1');
    assert.strictEqual(LL.isLocked('b2'), true);
  });

  test('setManualIfUnset does not override an existing assignment', () => {
    LL.setAssigned('b1');
    LL.setManualIfUnset('a1');
    assert.strictEqual(LL.isLocked('b1'), false, 'manual pick after assessment must not re-lock the assessed level');
  });
})();

// ============================================================
console.log('level-lock.js: direct unit coverage (Agent 198)');
// ============================================================
(function () {
  // The Agent 156-159 section above (and every later page test) only exercises level-lock.js
  // THROUGH a page's inline script or via loadModule()'s bare fakeWindow, which has no `document` /
  // `getComputedStyle`, so decorateLevelLinks() and renderLockedState() have so far only ever been
  // exercised indirectly (courses/index.html, placement.html, course.html page tests). This section
  // runs the REAL file in its own `vm` sandbox (not the shared fakeWindow, to avoid leaking a fake
  // `document` into unrelated sections) with a purpose-built `document.createElement` / `getComputedStyle`,
  // so every exported member gets at least one direct test.
  function makeLL() {
    const store = makeFakeStorage();
    const events = [];
    const sb = {
      localStorage: store,
      dispatchEvent: (e) => events.push(e),
      CustomEvent: function (t, d) { this.type = t; this.detail = d && d.detail; },
      document: { createElement: (tag) => new PN(1, tag) },
      getComputedStyle: (node) => ({ position: (node && node.style && node.style.position) || 'static' }),
    };
    sb.window = sb;
    RUN_VM.createContext(sb);
    RUN_VM.runInContext(RUN_MOD.ll, sb);
    return { sb, store, events, LL: sb.MylingoLevelLock };
  }

  test('normalize(): case-insensitive, rejects unknown/whitespace/falsy input, exported unchanged', () => {
    const { LL } = makeLL();
    assert.strictEqual(LL.normalize('B1'), 'b1');
    assert.strictEqual(LL.normalize('a1'), 'a1');
    assert.strictEqual(LL.normalize('a1 '), null, 'not trimmed - trailing whitespace is rejected, not just lower-cased');
    assert.strictEqual(LL.normalize('xx'), null);
    assert.strictEqual(LL.normalize(''), null);
    assert.strictEqual(LL.normalize(null), null);
    assert.strictEqual(LL.normalize(undefined), null);
    assert.strictEqual(LL.normalize(0), null, '0 is falsy - String(0||\'\') is \'\', not \'0\'');
  });

  test('LEVELS / LEVEL_LABEL exported as defensive copies: mutating the returned array/object does not affect later calls', () => {
    const { LL } = makeLL();
    const lv = LL.LEVELS;
    lv.push('zz'); lv[0] = 'bogus';
    assert.strictEqual(LL.normalize('a1'), 'a1', 'internal LEVELS untouched by mutating the exported copy');
    assert.strictEqual(LL.isLocked('zz'), false, 'the pushed bogus level was never actually added internally');
    LL.LEVEL_LABEL.a1 = 'Hacked';
    assert.strictEqual(LL.LEVEL_LABEL.a1, 'Hacked', 'unlike LEVELS, LEVEL_LABEL is exported BY REFERENCE (not copied) - pinned, latent: nothing shipped mutates it');
  });

  test('read(): no key -> null; malformed JSON -> null; a getItem that throws -> null (caught)', () => {
    const { LL, store } = makeLL();
    assert.strictEqual(LL.read(), null);
    store.setItem(LL.STORAGE_KEY, '{not json');
    assert.strictEqual(LL.read(), null);
    const { LL: LL2 } = makeLL();
    LL2.sb = undefined; // no-op, just documents intent
    const sb3 = (function () {
      const s = { getItem: () => { throw new Error('storage blocked'); }, setItem: () => {}, removeItem: () => {} };
      const ctx = { localStorage: s, dispatchEvent: () => {}, CustomEvent: function () {}, document: { createElement: (t) => new PN(1, t) }, getComputedStyle: () => ({ position: 'static' }) };
      ctx.window = ctx; RUN_VM.createContext(ctx); RUN_VM.runInContext(RUN_MOD.ll, ctx); return ctx;
    })();
    assert.strictEqual(sb3.MylingoLevelLock.read(), null, 'a throwing localStorage.getItem is caught, not propagated');
  });

  test('read(): an invalid stored level discards the WHOLE record (source/timestamp too), not just the level', () => {
    const { LL, store } = makeLL();
    store.setItem(LL.STORAGE_KEY, JSON.stringify({ level: 'not-a-level', source: 'assessment', timestamp: 123 }));
    assert.strictEqual(LL.read(), null);
  });

  test('read(): non-object JSON (array/number/string/null) never throws and yields null', () => {
    const { LL, store } = makeLL();
    ['[1,2,3]', '42', '"hello"', 'null'].forEach((raw) => { store.setItem(LL.STORAGE_KEY, raw); assert.strictEqual(LL.read(), null, raw); });
  });

  test('read(): missing source/timestamp default to \'manual\'/null; present values pass through', () => {
    const { LL, store } = makeLL();
    store.setItem(LL.STORAGE_KEY, JSON.stringify({ level: 'B2' }));
    let r = LL.read();
    assert.strictEqual(r.level, 'b2'); assert.strictEqual(r.source, 'manual'); assert.strictEqual(r.timestamp, null);
    store.setItem(LL.STORAGE_KEY, JSON.stringify({ level: 'b2', source: 'assessment', timestamp: 555 }));
    r = LL.read();
    assert.strictEqual(r.level, 'b2'); assert.strictEqual(r.source, 'assessment'); assert.strictEqual(r.timestamp, 555);
  });

  test('write(): an invalid level is a no-op - returns null, storage untouched, no event dispatched', () => {
    const { LL, store, events } = makeLL();
    store.setItem(LL.STORAGE_KEY, 'sentinel');
    const r = LL.setAssigned('not-a-level');
    assert.strictEqual(r, null);
    assert.strictEqual(store.getItem(LL.STORAGE_KEY), 'sentinel', 'untouched');
    assert.strictEqual(events.length, 0);
  });

  test('write(): a valid level stores {level,source,timestamp}, dispatches mylingo:levellock with the same record, and returns it', () => {
    const { LL, store, events } = makeLL();
    const before = Date.now();
    const r = LL.setAssigned('C1');
    assert.strictEqual(r.level, 'c1');
    assert.strictEqual(r.source, 'assessment');
    assert.ok(r.timestamp >= before);
    assert.deepStrictEqual(JSON.parse(store.getItem(LL.STORAGE_KEY)), JSON.parse(JSON.stringify(r)));
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].type, 'mylingo:levellock');
    assert.strictEqual(events[0].detail, r, 'same object, not just equal - write() passes rec straight through');
  });

  test('write(): storage.setItem throwing, or dispatchEvent throwing, is swallowed either way - the record is still returned (best-effort, matches the module\'s own comment)', () => {
    const sbBadStore = (function () {
      const ctx = { localStorage: { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} }, dispatchEvent: () => {}, CustomEvent: function (t, d) { this.type = t; this.detail = d && d.detail; }, document: { createElement: (t) => new PN(1, t) }, getComputedStyle: () => ({ position: 'static' }) };
      ctx.window = ctx; RUN_VM.createContext(ctx); RUN_VM.runInContext(RUN_MOD.ll, ctx); return ctx;
    })();
    const r1 = sbBadStore.MylingoLevelLock.setAssigned('a1');
    assert.strictEqual(r1 && r1.level, 'a1', 'setItem threw but write() still returns the record');

    const sbBadDispatch = (function () {
      const ctx = { localStorage: makeFakeStorage(), dispatchEvent: () => { throw new Error('nope'); }, CustomEvent: function (t, d) { this.type = t; this.detail = d && d.detail; }, document: { createElement: (t) => new PN(1, t) }, getComputedStyle: () => ({ position: 'static' }) };
      ctx.window = ctx; RUN_VM.createContext(ctx); RUN_VM.runInContext(RUN_MOD.ll, ctx); return ctx;
    })();
    const r2 = sbBadDispatch.MylingoLevelLock.setAssigned('a1');
    assert.strictEqual(r2 && r2.level, 'a1', 'dispatchEvent threw but write() still returns the record');
  });

  test('setManualIfUnset(): writes with source \'manual\' when nothing is set; returns the existing record unchanged (same source) when something already is', () => {
    const { LL } = makeLL();
    const r1 = LL.setManualIfUnset('a2');
    assert.strictEqual(r1.source, 'manual');
    assert.strictEqual(LL.isLocked('b1'), true);
    const r2 = LL.setManualIfUnset('c2');
    assert.strictEqual(r2.level, 'a2', 'second call is a no-op: still a2, not c2');
    assert.strictEqual(LL.isLocked('b1'), true, 'ceiling did not move');
  });

  test('clear(): removes the stored record (ceiling resets to -1, nothing is locked); a throwing removeItem is swallowed', () => {
    const { LL, store } = makeLL();
    LL.setAssigned('c1');
    assert.strictEqual(LL.ceilingIndex(), 4);
    LL.clear();
    assert.strictEqual(store.getItem(LL.STORAGE_KEY), null);
    assert.strictEqual(LL.ceilingIndex(), -1);
    assert.strictEqual(LL.isLocked('c2'), false);

    const ctx = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => { throw new Error('nope'); } }, dispatchEvent: () => {}, CustomEvent: function () {}, document: { createElement: (t) => new PN(1, t) }, getComputedStyle: () => ({ position: 'static' }) };
    ctx.window = ctx; RUN_VM.createContext(ctx); RUN_VM.runInContext(RUN_MOD.ll, ctx);
    assert.doesNotThrow(() => ctx.MylingoLevelLock.clear());
  });

  test('ceilingIndex() / isLocked(): boundary is inclusive at the ceiling; invalid input is never locked regardless of ceiling', () => {
    const { LL } = makeLL();
    LL.setAssigned('b1');
    assert.strictEqual(LL.ceilingIndex(), 2);
    assert.strictEqual(LL.isLocked('a1'), false);
    assert.strictEqual(LL.isLocked('a2'), false);
    assert.strictEqual(LL.isLocked('b1'), false, 'the ceiling level itself is open');
    assert.strictEqual(LL.isLocked('b2'), true);
    assert.strictEqual(LL.isLocked('not-a-level'), false, 'unrecognized input is never reported locked');
  });

  test('label(): uppercases a valid level; empty string for anything invalid', () => {
    const { LL } = makeLL();
    assert.strictEqual(LL.label('b2'), 'B2');
    assert.strictEqual(LL.label('B2'), 'B2');
    assert.strictEqual(LL.label('xx'), '');
    assert.strictEqual(LL.label(null), '');
  });

  test('renderLockedState(): a null container is a no-op (no throw)', () => {
    const { LL } = makeLL();
    assert.doesNotThrow(() => LL.renderLockedState(null, 'b1'));
  });

  test('renderLockedState(): nothing chosen yet - generic copy, default backHref, heading names the locked level', () => {
    const { LL } = makeLL();
    const c = new PN(1, 'div');
    LL.renderLockedState(c, 'b2');
    assert.ok(/B2 is locked/.test(c.innerHTML));
    assert.ok(/Choose or take the level test first/.test(c.innerHTML));
    assert.ok(!/You.{1,2}re currently set to/.test(c.innerHTML));
    assert.ok(/href="\.\.\/main\/index\.html"/.test(c.innerHTML));
  });

  test('renderLockedState(): with a chosen level - names the current level, names the target, honors a custom backHref, replaces prior content', () => {
    const { LL } = makeLL();
    LL.setAssigned('a2');
    const c = new PN(1, 'div');
    c.innerHTML = '<p>stale content</p>';
    LL.renderLockedState(c, 'b1', { backHref: '../a2/dashboard.html' });
    assert.ok(/You.{1,2}re currently set to Elementary/.test(c.innerHTML) === false, 'currentLabel comes from label(), i.e. the CEFR code, not LEVEL_LABEL');
    assert.ok(/You.{1,2}re currently set to A2/.test(c.innerHTML));
    assert.ok(/B1 is locked/.test(c.innerHTML));
    assert.ok(/href="\.\.\/a2\/dashboard\.html"/.test(c.innerHTML));
    assert.ok(!/stale content/.test(c.innerHTML), 'old content is fully replaced');
  });

  function mkCard(level, opts) {
    opts = opts || {};
    const c = new PN(1, opts.wrapperIsAnchor ? 'a' : 'div');
    c.setAttribute('data-level', level);
    c.className = opts.className || 'course-card';
    if (!opts.wrapperIsAnchor) {
      const a = c.appendChild(new PN(1, 'a'));
      a.setAttribute('href', '#');
      a.className = 'course-card';
    }
    return c;
  }

  test('decorateLevelLinks(): a null container is a no-op; a node with an invalid/missing data-level is skipped untouched', () => {
    const { LL } = makeLL();
    assert.doesNotThrow(() => LL.decorateLevelLinks(null));
    const container = new PN(1, 'div');
    const bad = mkCard('not-a-level');
    container.appendChild(bad);
    LL.decorateLevelLinks(container);
    assert.strictEqual(bad.classList.contains('is-level-locked'), false);
    assert.strictEqual(bad.querySelector('.level-lock-overlay'), null);
  });

  test('decorateLevelLinks(): an unlocked card is untouched, and clicking its inner link commits that level as the manual choice (only when nothing was chosen yet)', () => {
    const { LL } = makeLL();
    const container = new PN(1, 'div');
    const card = mkCard('a1');
    container.appendChild(card);
    LL.decorateLevelLinks(container);
    assert.strictEqual(card.classList.contains('is-level-locked'), false);
    const a = card.querySelector('a');
    assert.strictEqual(a.getAttribute('aria-disabled'), null);
    a.click();
    assert.strictEqual(LL.read().level, 'a1');
    assert.strictEqual(LL.read().source, 'manual');
  });

  test('decorateLevelLinks(): a locked card gets the class + a single overlay, its inner link is neutralized (aria-disabled, preventDefault, no manual commit)', () => {
    const { LL } = makeLL();
    LL.setAssigned('a1');
    const container = new PN(1, 'div');
    const card = mkCard('b1');
    container.appendChild(card);
    LL.decorateLevelLinks(container);
    assert.strictEqual(card.classList.contains('is-level-locked'), true);
    const overlays = card.querySelectorAll('.level-lock-overlay');
    assert.strictEqual(overlays.length, 1);
    assert.strictEqual(overlays[0].getAttribute('aria-hidden'), 'true');
    const a = card.querySelector('a');
    assert.strictEqual(a.getAttribute('aria-disabled'), 'true');
    let prevented = false;
    const listeners = a.listeners.click; // PN's click() sends a bare {type:'click'} with no preventDefault, so invoke directly
    listeners.forEach((f) => f.call(a, { preventDefault: () => { prevented = true; } }));
    assert.strictEqual(prevented, true, 'a locked link calls e.preventDefault()');
    assert.strictEqual(LL.read().level, 'a1', 'clicking a locked link never commits a manual choice');
  });

  test('decorateLevelLinks(): the container element ITSELF can be the anchor (node.tagName===\'A\' branch), not just a wrapper', () => {
    const { LL } = makeLL();
    LL.setAssigned('a1');
    const container = new PN(1, 'div');
    const anchorCard = mkCard('c1', { wrapperIsAnchor: true });
    container.appendChild(anchorCard);
    LL.decorateLevelLinks(container);
    assert.strictEqual(anchorCard.getAttribute('aria-disabled'), 'true', 'the anchor IS the decorated node');
    assert.strictEqual(anchorCard.classList.contains('is-level-locked'), true);
  });

  test('decorateLevelLinks(): re-decorating while still locked does not duplicate the overlay or re-bind the click listener', () => {
    const { LL } = makeLL();
    LL.setAssigned('a1');
    const container = new PN(1, 'div');
    const card = mkCard('b2');
    container.appendChild(card);
    LL.decorateLevelLinks(container);
    LL.decorateLevelLinks(container);
    LL.decorateLevelLinks(container);
    assert.strictEqual(card.querySelectorAll('.level-lock-overlay').length, 1);
    assert.strictEqual(card.querySelector('a').listeners.click.length, 1, 'dataset.mylingoLockBound guards against re-binding');
  });

  test('decorateLevelLinks(): a level that UNLOCKS between two calls (ceiling advances) removes the class, the overlay, and the neutralizing attributes', () => {
    const { LL } = makeLL();
    LL.setAssigned('a1');
    const container = new PN(1, 'div');
    const card = mkCard('b1');
    container.appendChild(card);
    LL.decorateLevelLinks(container);
    assert.strictEqual(card.classList.contains('is-level-locked'), true);
    LL.setAssigned('b1'); // ceiling advances - b1 is now at/below it
    LL.decorateLevelLinks(container);
    assert.strictEqual(card.classList.contains('is-level-locked'), false);
    assert.strictEqual(card.querySelector('.level-lock-overlay'), null);
    const a = card.querySelector('a');
    assert.strictEqual(a.getAttribute('aria-disabled'), null);
    assert.strictEqual(a.dataset.mylingoLocked, undefined);
    a.click();
    assert.strictEqual(LL.read().level, 'b1', 'now-unlocked link works normally again (no residual neutralization)');
  });

  test('decorateLevelLinks(): getComputedStyle().position is only forced to \'relative\' when it was \'static\' - an already-positioned ancestor is left alone', () => {
    const { LL } = makeLL();
    LL.setAssigned('a1');
    const container = new PN(1, 'div');
    const card = mkCard('c2');
    card.style.position = 'absolute';
    container.appendChild(card);
    LL.decorateLevelLinks(container);
    assert.strictEqual(card.style.position, 'absolute', 'left untouched - only \'static\' is upgraded');
  });

  test('level-lock.js (Agent 200 sweep): exact LEVEL_LABEL text, a pre-existing global is never replaced, exact locked-state copy, an invalid data-level node is skipped entirely (no listener bound), a static locked card becomes position:relative', () => {
    const { LL } = makeLL();
    assert.deepStrictEqual(JSON.parse(JSON.stringify(LL.LEVEL_LABEL)), { a1: 'Beginner', a2: 'Elementary', b1: 'Intermediate', b2: 'Upper-intermediate', c1: 'Advanced', c2: 'Proficiency' });
    const sentinel = { sentinel: true };
    const sb2 = { localStorage: makeFakeStorage(), dispatchEvent() {}, CustomEvent: function () {}, MylingoLevelLock: sentinel };
    sb2.window = sb2;
    RUN_VM.createContext(sb2);
    RUN_VM.runInContext(RUN_MOD.ll, sb2);
    assert.strictEqual(sb2.MylingoLevelLock, sentinel, 'the load guard keeps an already-installed instance');
    LL.setAssigned('a2');
    const c = new PN(1, 'div');
    LL.renderLockedState(c, 'b1');
    assert.ok(c.innerHTML.indexOf('B1 unlocks once you reach it.') !== -1, 'copy: ' + c.innerHTML);
    assert.ok(c.innerHTML.indexOf('Keep going from there') !== -1);
    const container = new PN(1, 'div');
    const bad = mkCard('zz');
    const locked = mkCard('c2');
    container.appendChild(bad);
    container.appendChild(locked);
    LL.decorateLevelLinks(container);
    assert.strictEqual(bad.querySelector('a').dataset.mylingoLockBound, undefined, 'invalid level -> node skipped, its link is not touched or bound');
    assert.strictEqual(bad.classList.contains('is-level-locked'), false);
    assert.strictEqual(locked.style.position, 'relative');
  });
})();

// ============================================================
console.log('course-progress.js: untrusted-progress guard + direct unit coverage (Agent 199)');
// ============================================================
(function () {
  // Agent 199: readProgress() returned a stored JSON `null` as-is and lessonCompletionRecord()/lessonPercent() then threw on p[id]
  // (courses/lesson.html calls the module's readProgress() three times). Fixed in course-progress.js's progress(). Own vm sandbox
  // (not the shared fakeWindow) so localStorage/fetch globals never leak; cross-realm values are compared by field / JSON.
  function makeCP(seed, opts) {
    opts = opts || {};
    const store = makeFakeStorage();
    Object.keys(seed || {}).forEach((k) => store.setItem(k, seed[k]));
    const fetched = [];
    const sb = { localStorage: opts.storage || store, fetch: opts.fetch || ((u) => { fetched.push(u); return Promise.reject(new Error('no net')); }) };
    sb.window = sb;
    RUN_VM.createContext(sb);
    RUN_VM.runInContext(RUN_MOD.cp, sb);
    return { CP: sb.MylingoCourseProgress, store, fetched };
  }
  const J = (x) => JSON.parse(JSON.stringify(x));
  const PK = 'mylingo.progress.v1';

  test('readProgress: stored JSON null / number / string / boolean collapse to {} (was: null, which made lessonCompletionRecord throw)', () => {
    ['null', '5', '0', '"s"', 'true', 'false'].forEach((v) => {
      const { CP } = makeCP({ [PK]: v });
      assert.deepStrictEqual(J(CP.readProgress()), {}, 'shape ' + v);
      assert.doesNotThrow(() => CP.lessonCompletionRecord({ exercise_quiz_ids: ['q1'] }, CP.readProgress()), 'shape ' + v);
      assert.strictEqual(CP.lessonPercent({ exercise_quiz_ids: ['q1'] }, CP.readProgress()), 0, 'shape ' + v);
      assert.strictEqual(CP.lessonIsComplete({ exercise_quiz_ids: ['q1'] }, CP.readProgress()), false, 'shape ' + v);
    });
  });

  test('readProgress: missing key, empty string, malformed JSON and a throwing getItem all give {}; a valid object round-trips', () => {
    assert.deepStrictEqual(J(makeCP({}).CP.readProgress()), {});
    assert.deepStrictEqual(J(makeCP({ [PK]: '' }).CP.readProgress()), {});
    assert.deepStrictEqual(J(makeCP({ [PK]: '{nope' }).CP.readProgress()), {});
    const boom = { getItem() { throw new Error('denied'); }, setItem() {}, removeItem() {}, clear() {} };
    assert.deepStrictEqual(J(makeCP({}, { storage: boom }).CP.readProgress()), {});
    const rec = { q1: { status: 'completed', best: 75 } };
    assert.deepStrictEqual(J(makeCP({ [PK]: JSON.stringify(rec) }).CP.readProgress()), rec);
  });

  test('readProgress: PINNED - a stored array is still returned as-is (the Agent 181 pin); a per-quiz null/number/string record is harmless', () => {
    assert.deepStrictEqual(J(makeCP({ [PK]: '[1,2]' }).CP.readProgress()), [1, 2]);
    const { CP } = makeCP({ [PK]: JSON.stringify({ q1: null, q2: 5, q3: 'x' }) });
    const r = CP.lessonCompletionRecord({ exercise_quiz_ids: ['q1', 'q2', 'q3'] }, CP.readProgress());
    assert.deepStrictEqual(J(r), { completed: false, progress: 0, gateId: null });
  });

  test('esc: escapes all five characters, handles null/undefined/numbers, leaves plain text alone, and is idempotent-unsafe by design (double-escapes &)', () => {
    const { CP } = makeCP();
    assert.strictEqual(CP.esc('<a href="x" title=\'y\'>&</a>'), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    assert.strictEqual(CP.esc(null), '');
    assert.strictEqual(CP.esc(undefined), '');
    assert.strictEqual(CP.esc(0), '0');
    assert.strictEqual(CP.esc(12.5), '12.5');
    assert.strictEqual(CP.esc('plain text'), 'plain text');
    assert.strictEqual(CP.esc('&amp;'), '&amp;amp;');
  });

  test('exports: thresholds are 60 / 90 and every documented member is present with the right type', () => {
    const { CP } = makeCP();
    assert.strictEqual(CP.MASTERY_THRESHOLD, 60);
    assert.strictEqual(CP.LESSON_COMPLETION_THRESHOLD, 90);
    ['readProgress', 'lessonPercent', 'lessonCompletionRecord', 'lessonIsComplete', 'resolveHomepageState', 'esc', 'isMastered'].forEach((k) => assert.strictEqual(typeof CP[k], 'function', k));
    assert.deepStrictEqual(Object.keys(CP).sort(), ['LESSON_COMPLETION_THRESHOLD', 'MASTERY_THRESHOLD', 'esc', 'isMastered', 'lessonCompletionRecord', 'lessonIsComplete', 'lessonPercent', 'readProgress', 'resolveHomepageState']);
  });

  test('lessonCompletionRecord: the 90% boundary - 9 of 10 mastered completes, 8 of 10 does not; a sub-threshold score never counts toward it', () => {
    const { CP } = makeCP();
    const ids = Array.from({ length: 10 }, (_, i) => 'q' + i);
    const mk = (n, best) => { const p = {}; ids.forEach((id, i) => { if (i < n) p[id] = { status: 'completed', best }; }); return p; };
    assert.strictEqual(CP.lessonCompletionRecord({ exercise_quiz_ids: ids }, mk(9, 60)).completed, true);
    const eight = CP.lessonCompletionRecord({ exercise_quiz_ids: ids }, mk(8, 60));
    assert.strictEqual(eight.completed, false);
    assert.strictEqual(eight.progress, 80);
    assert.strictEqual(CP.lessonCompletionRecord({ exercise_quiz_ids: ids }, mk(10, 59)).progress, 0, '59 < MASTERY_THRESHOLD');
    assert.strictEqual(CP.lessonCompletionRecord({ exercise_quiz_ids: ids }, mk(10, 59)).completed, false);
  });

  test('lessonCompletionRecord: gate is the LAST id when complete and the (first) in-progress id otherwise; exercise_quiz_ids wins over lesson_quiz_id', () => {
    const { CP } = makeCP();
    const done = CP.lessonCompletionRecord({ exercise_quiz_ids: ['a', 'b'], lesson_quiz_id: 'z' }, { a: { status: 'completed', best: 90 }, b: { status: 'completed', best: 90 } });
    assert.strictEqual(done.gateId, 'b');
    const two = CP.lessonCompletionRecord({ exercise_quiz_ids: ['a', 'b', 'c'] }, { a: { status: 'in-progress' }, b: { status: 'in-progress' } });
    assert.strictEqual(two.gateId, 'a');
    assert.strictEqual(CP.lessonCompletionRecord({ exercise_quiz_ids: ['a'], lesson_quiz_id: 'z' }, { z: { status: 'completed', best: 99 } }).completed, false, 'lesson_quiz_id is ignored when exercise ids exist');
    assert.strictEqual(CP.lessonCompletionRecord(null, {}).completed, false);
    assert.strictEqual(CP.lessonCompletionRecord(undefined, {}).gateId, null);
  });

  test('sessionRatio (via lessonCompletionRecord): reads the per-quiz session under an encodeURIComponent key; ignores non-in-progress, non-integer and zero-total sessions; caps at 99', () => {
    const sess = (id, v) => ({ ['mylingo.sessions.v3.' + encodeURIComponent(id)]: JSON.stringify(v) });
    const inprog = { q: { status: 'in-progress', totalQuestions: 4 } };
    const run = (seed, p) => { const { CP } = makeCP(seed); return CP.lessonCompletionRecord({ exercise_quiz_ids: ['q'] }, p || inprog).progress; };
    assert.strictEqual(run(sess('q', { status: 'in-progress', questionIndex: 2 })), 50);
    assert.strictEqual(run(sess('q/1 x', { status: 'in-progress', questionIndex: 2 }), { 'q/1 x': { status: 'in-progress', totalQuestions: 4 } }), 0, 'a raw-id key must NOT be used - the module re-derives the encoded key, so a matching record under the encoded key is the one read');
    const enc = makeCP(sess('q/1 x', { status: 'in-progress', questionIndex: 2 }));
    assert.strictEqual(enc.CP.lessonCompletionRecord({ exercise_quiz_ids: ['q/1 x'] }, { 'q/1 x': { status: 'in-progress', totalQuestions: 4 } }).progress, 50);
    assert.strictEqual(run(sess('q', { status: 'completed', questionIndex: 2 })), 0);
    assert.strictEqual(run(sess('q', { status: 'in-progress', questionIndex: 1.5 })), 0);
    assert.strictEqual(run(sess('q', { status: 'in-progress', questionIndex: '2' })), 0);
    assert.strictEqual(run(sess('q', { status: 'in-progress', questionIndex: 2 }), { q: { status: 'in-progress' } }), 0, 'totalQuestions missing -> 0');
    assert.strictEqual(run(sess('q', { status: 'in-progress', questionIndex: 4 })), 99, 'capped below 100');
    assert.strictEqual(run(sess('q', { status: 'in-progress', questionIndex: 0 })), 0);
    assert.strictEqual(run({ ['mylingo.sessions.v3.q']: '{bad' }), 0, 'corrupt session JSON -> 0');
    assert.strictEqual(run({ ['mylingo.sessions.v3.q']: 'null' }), 0, 'null session -> 0');
  });

  test('lessonCompletionRecord: percentages ROUND (not floor) - 2 of 3 mastered = 67; a 2/3-through partial quiz adds 67; a huge lesson shows 1% only when the rounded ratio is 100 not 99; 179 of 200 (89.5%) rounds up to complete', () => {
    const { CP } = makeCP({ ['mylingo.sessions.v3.q']: JSON.stringify({ status: 'in-progress', questionIndex: 2 }) });
    assert.strictEqual(CP.lessonCompletionRecord({ exercise_quiz_ids: ['a', 'b', 'c'] }, { a: { status: 'completed', best: 80 }, b: { status: 'completed', best: 80 } }).progress, 67);
    assert.strictEqual(CP.lessonCompletionRecord({ exercise_quiz_ids: ['q'] }, { q: { status: 'in-progress', totalQuestions: 3 } }).progress, 67);
    const ids = Array.from({ length: 200 }, (_, i) => 'x' + i);
    const p = { x0: { status: 'in-progress', totalQuestions: 3 } };
    const both = makeCP({ ['mylingo.sessions.v3.x0']: JSON.stringify({ status: 'in-progress', questionIndex: 3 }) }).CP;
    assert.strictEqual(both.lessonCompletionRecord({ exercise_quiz_ids: ids }, p).progress, 0, 'a finished-looking session is capped at 99% of one quiz: (0.99/200)*100 = 0.495 -> 0');
    const mastered = {}; ids.slice(0, 179).forEach((id) => { mastered[id] = { status: 'completed', best: 70 }; });
    const r = CP.lessonCompletionRecord({ exercise_quiz_ids: ids }, mastered);
    assert.strictEqual(r.completed, true, '89.5 rounds to 90');
    assert.strictEqual(r.progress, 100);
    const r2 = CP.lessonCompletionRecord({ exercise_quiz_ids: ids }, (() => { const m = {}; ids.slice(0, 178).forEach((id) => { m[id] = { status: 'completed', best: 70 }; }); return m; })());
    assert.strictEqual(r2.completed, false);
    assert.strictEqual(r2.progress, 89);
  });

  testAsync('resolveHomepageState (direct): default base is ../ ; an explicit base is used verbatim per level file + courses.json + units.json; ids that were attempted but never finished still surface', async () => {
    const routes = { 'courses.json': [{ course_id: 'c1', status: 'published' }], 'units.json': [{ unit_id: 'u1', course_id: 'c1' }] };
    const lesson = { lesson_id: 'lA', unit_id: 'u1', status: 'published', order: 1, exercise_quiz_ids: ['q1', 'q2'] };
    const mkFetch = (log, over) => (u, o) => {
      log.push([u, o && o.cache]);
      const hit = Object.keys(over).find((k) => u.indexOf(k) !== -1);
      if (hit === undefined) return Promise.resolve({ ok: true, json: async () => [] });
      const v = over[hit];
      return v instanceof Error ? Promise.reject(v) : Promise.resolve({ ok: true, json: async () => v });
    };
    const log1 = [];
    const a = makeCP({ [PK]: JSON.stringify({ q2: { status: 'completed', best: 10 } }) }, { fetch: mkFetch(log1, Object.assign({}, routes, { 'lessons/a1.json': [lesson] })) });
    const st = await a.CP.resolveHomepageState();
    assert.strictEqual(st.lesson.lesson_id, 'lA', 'a failed (<60) attempt on a linked quiz still counts as "started"');
    assert.strictEqual(st.percent, 0);
    assert.deepStrictEqual(log1.map((x) => x[0]).sort(), ['../course_content/courses.json', '../course_content/lessons/a1.json', '../course_content/lessons/a2.json', '../course_content/lessons/b1.json', '../course_content/lessons/b2.json', '../course_content/lessons/c1.json', '../course_content/lessons/c2.json', '../course_content/units.json']);
    assert.ok(log1.every((x) => x[1] === 'no-store'), 'every fetch is cache:no-store');
    const log2 = [];
    const b = makeCP({ [PK]: JSON.stringify({ q1: { status: 'completed', best: 80 } }) }, { fetch: mkFetch(log2, Object.assign({}, routes, { 'lessons/a1.json': [lesson] })) });
    assert.strictEqual((await b.CP.resolveHomepageState('./')).percent, 50);
    assert.ok(log2.every((x) => x[0].indexOf('./course_content/') === 0), 'base "./" used for every fetch');
    const log3 = [];
    const c = makeCP({ [PK]: JSON.stringify({ q1: { status: 'completed', best: 80 } }) }, { fetch: mkFetch(log3, Object.assign({}, routes, { 'lessons/b2.json': new Error('x'), 'lessons.json': [lesson] })) });
    assert.strictEqual((await c.CP.resolveHomepageState('/app/')).lesson.lesson_id, 'lA');
    assert.ok(log3.some((x) => x[0] === '/app/course_content/lessons.json'), 'monolith fallback keeps the caller base');
  });

  testAsync('resolveHomepageState (direct): only status "published" courses count (archived / missing status are skipped); a lesson with no exercise_quiz_ids does not throw', async () => {
    const okJson = (v) => Promise.resolve({ ok: true, json: async () => v });
    const fx = (courses, lessons) => (u) => okJson(u.indexOf('courses.json') !== -1 ? courses : u.indexOf('units.json') !== -1 ? [{ unit_id: 'u1', course_id: 'c1' }] : u.indexOf('lessons/a1.json') !== -1 ? lessons : []);
    const started = JSON.stringify({ q1: { status: 'completed', best: 10 } });
    const L = { lesson_id: 'lA', unit_id: 'u1', status: 'published', order: 1, exercise_quiz_ids: ['q1'] };
    for (const status of ['archived', 'review', undefined]) {
      const h = makeCP({ [PK]: started }, { fetch: fx([{ course_id: 'c1', status }], [L]) });
      assert.strictEqual(await h.CP.resolveHomepageState(), null, 'course status ' + status);
    }
    const ok = makeCP({ [PK]: started }, { fetch: fx([{ course_id: 'c1', status: 'published' }], [L]) });
    assert.strictEqual((await ok.CP.resolveHomepageState()).lesson.lesson_id, 'lA');
    const bare = makeCP({ [PK]: started }, { fetch: fx([{ course_id: 'c1', status: 'published' }], [{ lesson_id: 'lB', unit_id: 'u1', status: 'published', order: 1 }]) });
    assert.strictEqual(await bare.CP.resolveHomepageState(), null, 'no linked quizzes -> nothing to continue, and no TypeError');
  });

  testAsync('resolveHomepageState (direct): fetch not-ok rejects (falls back), courses/units failure rejects, null progress no longer throws, lessons sort by order, first started lesson wins, a lesson in another unit/course is skipped', async () => {
    const okJson = (v) => Promise.resolve({ ok: true, json: async () => v });
    const L = (id, unit, order, ids, status) => ({ lesson_id: id, unit_id: unit, status: status || 'published', order, exercise_quiz_ids: ids });
    const courses = [{ course_id: 'c1', status: 'published' }, { course_id: 'c2', status: 'published' }];
    const units = [{ unit_id: 'u1', course_id: 'c1' }, { unit_id: 'u2', course_id: 'c2' }];
    const lessons = [L('late', 'u1', 2, ['q3']), L('early', 'u1', 1, ['q1']), L('other', 'u2', 1, ['q9']), L('draft', 'u1', 0, ['q1'], 'draft'), L('orphan', 'uX', 1, ['q1'])];
    const fetchWith = (per) => (u) => { const k = Object.keys(per).find((x) => u.indexOf(x) !== -1); return k === undefined ? okJson([]) : per[k](); };
    const base = { 'courses.json': () => okJson(courses), 'units.json': () => okJson(units), 'lessons/a1.json': () => okJson(lessons) };
    // both early (q1) and late (q3) started; sorted by order -> early wins; the draft (order 0) and the orphan are never picked
    const s1 = makeCP({ [PK]: JSON.stringify({ q1: { status: 'completed', best: 10 }, q3: { status: 'completed', best: 10 } }) }, { fetch: fetchWith(base) });
    assert.strictEqual((await s1.CP.resolveHomepageState()).lesson.lesson_id, 'early');
    // only the other course's quiz started -> found under c2/u2, not attributed to c1
    const s2 = makeCP({ [PK]: JSON.stringify({ q9: { status: 'completed', best: 10 } }) }, { fetch: fetchWith(base) });
    const r2 = await s2.CP.resolveHomepageState();
    assert.strictEqual(r2.lesson.lesson_id, 'other');
    assert.strictEqual(r2.course.course_id, 'c2');
    assert.strictEqual(r2.unit.unit_id, 'u2');
    // an in-progress percent (0<p<100) beats an earlier merely-attempted lesson
    const s3 = makeCP({ [PK]: JSON.stringify({ q1: { status: 'completed', best: 10 } }) }, { fetch: fetchWith(Object.assign({}, base, { 'lessons/a1.json': () => okJson([L('early', 'u1', 1, ['q1', 'q2']), L('late', 'u1', 2, ['q3', 'q4'])]) })) });
    assert.strictEqual((await s3.CP.resolveHomepageState()).lesson.lesson_id, 'early', 'a failed attempt (0%) is the fallback; nothing has 0<p<100 here');
    const s4 = makeCP({ [PK]: JSON.stringify({ q3: { status: 'completed', best: 90 } }) }, { fetch: fetchWith(Object.assign({}, base, { 'lessons/a1.json': () => okJson([L('early', 'u1', 1, ['q1', 'q2']), L('late', 'u1', 2, ['q3', 'q4'])]) })) });
    assert.strictEqual((await s4.CP.resolveHomepageState()).lesson.lesson_id, 'late', 'the 50% lesson wins over an untouched earlier one');
    // fully complete lessons are not surfaced
    const s5 = makeCP({ [PK]: JSON.stringify({ q1: { status: 'completed', best: 100 } }) }, { fetch: fetchWith(Object.assign({}, base, { 'lessons/a1.json': () => okJson([L('early', 'u1', 1, ['q1'])]) })) });
    assert.strictEqual(await s5.CP.resolveHomepageState(), null);
    // stored null progress: resolves (to null) instead of rejecting with a TypeError
    const s6 = makeCP({ [PK]: 'null' }, { fetch: fetchWith(base) });
    assert.strictEqual(await s6.CP.resolveHomepageState(), null);
    // HTTP error on courses.json rejects; HTTP error on ONE per-level file falls back to the monolith
    const bad = () => Promise.resolve({ ok: false, status: 503, json: async () => [] });
    const s7 = makeCP({}, { fetch: fetchWith(Object.assign({}, base, { 'courses.json': bad })) });
    await assert.rejects(() => s7.CP.resolveHomepageState(), /503/);
    const s8 = makeCP({ [PK]: JSON.stringify({ q1: { status: 'completed', best: 10 } }) }, { fetch: fetchWith(Object.assign({}, base, { 'lessons/c1.json': bad, 'lessons.json': () => okJson([L('mono', 'u1', 1, ['q1'])]) })) });
    assert.strictEqual((await s8.CP.resolveHomepageState()).lesson.lesson_id, 'mono');
  });
})();

// ============================================================
console.log('recommendations.js + level-lock.js interaction (Agent 156 fix #1)');
// ============================================================
(function () {
  fakeWindow.localStorage.clear();
  delete fakeWindow.MylingoLevelLock;
  delete fakeWindow.MylingoRecommendations;
  loadModule('shared/js/level-lock.js');
  loadModule('shared/js/recommendations.js');
  const LL = fakeWindow.MylingoLevelLock;
  const REC = fakeWindow.MylingoRecommendations;

  test('audit scenario: a2 overall + grammar 95% -> stretch recommendation targets b1', () => {
    const profile = {
      recommended_level: 'a2',
      skills: { grammar: 95 },
      skill_counts: { grammar: 10 },
    };
    LL.setAssigned(profile.recommended_level);
    const recs = REC.recommendSkillLevels(profile);
    const grammarRec = recs.find((r) => r.skill === 'grammar');
    assert.ok(grammarRec, 'expected a grammar recommendation');
    assert.strictEqual(grammarRec.level, 'b1', 'a 95% skill score should produce a one-level stretch recommendation');
  });

  test('the stretch level IS locked by plain isLocked (this is exactly the trap fix #1 closes)', () => {
    assert.strictEqual(LL.isLocked('b1'), true, 'b1 must be above the a2 ceiling for this scenario to be meaningful');
  });

  test('quiz.html\'s actual guard (fix #1): directRecommended bypasses the lock, a bare link does not', () => {
    // Mirrors shared/quiz.html line ~722 exactly -- if this ever drifts out
    // of sync with the real guard, update both sides together.
    function guardBlocks(mode, directRecommended, level) {
      return mode !== 'placement' && !directRecommended && LL.isLocked(level);
    }
    assert.strictEqual(guardBlocks('', true, 'b1'), false, 'recommended=1 link must NOT be blocked (this was the bug)');
    assert.strictEqual(guardBlocks('', false, 'b1'), true, 'a manually-typed URL to the same locked level must still be blocked (no regression)');
  });
})();

// ============================================================
console.log('placement.js (Agent 156 fix #2)');
// ============================================================
(function () {
  delete fakeWindow.MylingoPlacement;
  loadModule('shared/js/placement.js');
  const P = fakeWindow.MylingoPlacement;
  assert.ok(P && typeof P.calculate120Placement === 'function', 'expected MylingoPlacement.calculate120Placement to be exported');

  // Builds `count` questions split evenly across a1/a2/b1 (placement_level),
  // all answered correctly, then hands them to calculate120Placement exactly
  // as the real 120-question assessment does.
  function confidenceFor(count) {
    const questions = [];
    const correctMap = {};
    const tiers = ['a1', 'a2', 'b1'];
    for (let i = 0; i < count; i++) {
      questions.push({ placement_level: tiers[i % 3] });
      correctMap[i] = true;
    }
    return P.calculate120Placement(questions, correctMap).confidence;
  }

  test('120/120 -> high confidence', () => {
    assert.strictEqual(confidenceFor(120), 'high');
  });
  test('80/120 (two-thirds, the fix\'s derived medium threshold) -> medium confidence', () => {
    assert.strictEqual(confidenceFor(80), 'medium');
  });
  test('50/120 (partial completion) -> low confidence', () => {
    assert.strictEqual(confidenceFor(50), 'low');
  });
  test('confidence threshold tracks ASSESSMENT_120.question_count, not a hardcoded 120 (the actual fix)', () => {
    // This is what fix #2 was actually about: before the fix, this constant
    // was a bare literal disconnected from ASSESSMENT_120.question_count.
    // We can't reach ASSESSMENT_120 directly (module-private), so the
    // regression this guards against is: someone reintroduces a hardcoded
    // 120 here and a future bank-size change silently desyncs confidence.
    // The three tests above already pin the exact 120/80/50 boundaries that
    // a hardcoded-120 regression would still pass, so this test instead
    // pins the exact medium/low boundary math (2/3 of 120 = 80, rounded).
    assert.strictEqual(confidenceFor(79), 'low', '79 is just under the two-thirds medium boundary');
    assert.strictEqual(confidenceFor(80), 'medium', '80 is exactly the two-thirds medium boundary');
    assert.strictEqual(confidenceFor(119), 'medium', '119 is just under the high boundary');
  });
})();

// ============================================================
console.log('shared/quiz.html static id-binding check (Agent 157 regression guard)');
// ============================================================
(function () {
  // Agent 157 found this exact bug class live: `$('endHome').onclick=...`
  // referenced an element that no longer existed in the HTML (removed by
  // some agent between 152 and 156, binding never cleaned up). Because
  // quiz.html's setup code is one synchronous top-level block ending in
  // load(), that single null-property throw silently aborted every
  // statement after it -- including load() itself -- breaking every quiz
  // on the site. `node --check` cannot catch this (it's valid JS syntax);
  // this static scan can, cheaply, without a browser. It is not a
  // substitute for the real-browser click-through in the handoff, but it
  // stops this exact regression from shipping silently again.
  const fs = require('fs');
  const html = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');
  const existingIds = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g)).map((m) => m[1]));

  // Agent 158: broadened from `.onclick=` only to ANY unguarded property
  // access on `$('id')` (`.addEventListener`, `.textContent=`, `.style...`,
  // `.onchange=` ...). A `$('id')?.x` optional-chain is safe and ignored.
  // Ids created at runtime via `.id='...'` are treated as existing.
  const dynamicIds = new Set(Array.from(html.matchAll(/\.id\s*=\s*['"]([^'"]+)['"]/g)).map((m) => m[1]));
  const accessRe = /\$\('([^']+)'\)(\?)?\./g;
  const unguarded = [];
  let m;
  while ((m = accessRe.exec(html))) {
    const id = m[1];
    if (m[2]) continue; // optional chain: safe on null
    if (!existingIds.has(id) && !dynamicIds.has(id)) unguarded.push(id);
  }

  test('every unguarded $(id).<prop> access points at an id that exists in the HTML', () => {
    assert.deepStrictEqual(unguarded, [], 'dangling access for: ' + unguarded.join(', ') + ' -- this crashes page init, see comment above');
  });

  test('the endHome binding itself is present and null-guarded (this session\'s fix)', () => {
    assert.ok(/const endHomeBtn=\$\('endHome'\);if\(endHomeBtn\)endHomeBtn\.onclick=/.test(html), 'expected the null-guarded endHome binding from this session\'s fix -- if this fails, the guard was reverted');
  });
})();

// ============================================================
console.log('skill-mastery.js (Agent 158)');
// ============================================================
(function () {
  fakeWindow.localStorage.clear();
  delete fakeWindow.MylingoSkillMastery;
  loadModule('shared/js/skill-mastery.js');
  const SM = fakeWindow.MylingoSkillMastery;
  assert.ok(SM && typeof SM.recordAttempt === 'function', 'expected MylingoSkillMastery to be exported');

  test('masteryBand boundaries: 59.99 / 60 / 80 / 90 and out-of-range clamping', () => {
    assert.strictEqual(SM.masteryBand(59.99).key, 'needs_support');
    assert.strictEqual(SM.masteryBand(60).key, 'developing');
    assert.strictEqual(SM.masteryBand(79.99).key, 'developing');
    assert.strictEqual(SM.masteryBand(80).key, 'secure');
    assert.strictEqual(SM.masteryBand(90).key, 'mastered');
    assert.strictEqual(SM.masteryBand(-5).key, 'needs_support');
    assert.strictEqual(SM.masteryBand(500).key, 'mastered');
    assert.strictEqual(SM.masteryBand('junk').key, 'needs_support');
  });

  test('confidenceFor thresholds: low <5q or <2 attempts, medium <10q or <5 attempts, else high', () => {
    assert.strictEqual(SM.confidenceFor(4, 5), 'low');
    assert.strictEqual(SM.confidenceFor(5, 1), 'low');
    assert.strictEqual(SM.confidenceFor(5, 2), 'medium');
    assert.strictEqual(SM.confidenceFor(9, 9), 'medium');
    assert.strictEqual(SM.confidenceFor(10, 4), 'medium');
    assert.strictEqual(SM.confidenceFor(10, 5), 'high');
  });

  const questions = [
    { skill: 'grammar' }, { skill: 'grammar' }, { skill: 'vocabulary' },
    { skill: 'not-a-skill' }, { skill: 'grammar', question_type: 'banner' }, {},
  ];

  test('recordAttempt counts only tagged, non-banner questions with boolean results', () => {
    const store = SM.recordAttempt({
      questions, correctMap: { 0: true, 1: false, 2: true, 3: true, 4: true, 5: true },
      quiz_id: 'q1', level: 'A2', timestamp: 1000,
    }, null);
    assert.deepStrictEqual(Object.keys(store.skills).sort(), ['grammar', 'vocabulary']);
    const g = store.skills.grammar;
    assert.strictEqual(g.question_count, 2);
    assert.strictEqual(g.correct_count, 1);
    assert.strictEqual(g.attempt_count, 1);
    assert.strictEqual(g.accuracy, 50);
    assert.strictEqual(g.mastery_band, 'needs_support');
    assert.strictEqual(g.last_level, 'a2', 'level must be normalised to lower case');
    assert.deepStrictEqual(g.level_counts, { a2: 2 });
    assert.strictEqual(g.last_quiz_id, 'q1');
    assert.strictEqual(store.updated_at, 1000);
  });

  test('non-boolean correctness ("true" string) is ignored -- no invented evidence', () => {
    const store = SM.recordAttempt({ questions: [{ skill: 'grammar' }], correctMap: { 0: 'true' } }, null);
    assert.deepStrictEqual(store.skills, {});
  });

  test('attempts accumulate across calls and confidence grows with evidence', () => {
    let store = null;
    for (let i = 0; i < 5; i++) {
      store = SM.recordAttempt({
        questions: [{ skill: 'reading' }, { skill: 'reading' }],
        correctMap: { 0: true, 1: true }, timestamp: 2000 + i,
      }, store);
    }
    const r = store.skills.reading;
    assert.strictEqual(r.question_count, 10);
    assert.strictEqual(r.attempt_count, 5);
    assert.strictEqual(r.accuracy, 100);
    assert.strictEqual(r.confidence, 'high');
  });

  test('sanitising untrusted stored data: wrong version -> empty; junk values clamped', () => {
    assert.deepStrictEqual(SM.recordAttempt({}, { version: 99, skills: { grammar: { question_count: 5 } } }).skills, {});
    const dirty = { version: 1, skills: {
      grammar: { question_count: 4, correct_count: 999, attempt_count: -3, level_counts: { a1: 2, zz: 9, b1: -1 }, last_level: 'ZZ' },
      bogus: { question_count: 1 },
    } };
    const clean = SM.recordAttempt({}, dirty);
    assert.ok(!('bogus' in clean.skills), 'unknown skills must be dropped');
    assert.strictEqual(clean.skills.grammar.correct_count, 4, 'correct_count clamped to question_count');
    assert.strictEqual(clean.skills.grammar.attempt_count, 0);
    assert.deepStrictEqual(clean.skills.grammar.level_counts, { a1: 2 });
    assert.strictEqual(clean.skills.grammar.last_level, null);
    assert.strictEqual(SM.validateStore(clean), true);
    assert.strictEqual(SM.validateStore({ version: 2 }), false);
    assert.strictEqual(SM.validateStore(null), false);
  });

  test('recordAndPersist round-trips through storage; corrupt JSON falls back to empty', () => {
    fakeWindow.localStorage.clear();
    SM.recordAndPersist({ questions: [{ skill: 'usage' }], correctMap: { 0: true }, timestamp: 5 });
    assert.strictEqual(SM.readStored().skills.usage.question_count, 1);
    fakeWindow.localStorage.setItem(SM.STORAGE_KEY, '{not json');
    assert.deepStrictEqual(SM.readStored().skills, {});
  });

  test('null timestamps stay null through sanitising (were coerced to 0 / 1970 before Agent 158)', () => {
    const store = SM.recordAttempt({}, { version: 1, updated_at: null, skills: { grammar: { question_count: 1, last_attempt_at: null } } });
    assert.strictEqual(store.updated_at, null);
    assert.strictEqual(store.skills.grammar.last_attempt_at, null);
    assert.strictEqual(SM.recordAttempt({}, { version: 1, updated_at: 'abc', skills: {} }).updated_at, null);
  });

  test('getSkill: unknown skill -> null; missing evidence -> blank card, never undefined', () => {
    assert.strictEqual(SM.getSkill({}, 'nope'), null);
    const blank = SM.getSkill({ version: 1, skills: {} }, 'grammar');
    assert.strictEqual(blank.question_count, 0);
    assert.strictEqual(blank.accuracy, null);
  });
})();

// ============================================================
console.log('review-scheduler.js (Agent 158)');
// ============================================================
(function () {
  fakeWindow.localStorage.clear();
  delete fakeWindow.MylingoReviewScheduler;
  loadModule('shared/js/review-scheduler.js');
  const RS = fakeWindow.MylingoReviewScheduler;
  assert.ok(RS && typeof RS.recordAttempt === 'function', 'expected MylingoReviewScheduler to be exported');
  const H = 3600000;

  test('accuracy -> base interval bands (hours) for a brand-new skill', () => {
    const expected = { 0: 6, 39: 6, 40: 24, 59: 24, 60: 72, 79: 72, 80: 168, 89: 168, 90: 336, 100: 336 };
    Object.keys(expected).forEach((a) => {
      assert.strictEqual(RS.calculateNextIntervalHours({}, Number(a)), expected[a], 'accuracy ' + a);
    });
  });

  test('strong result on an existing streak doubles the interval, capped at 30 days', () => {
    assert.strictEqual(RS.calculateNextIntervalHours({ interval_hours: 168, consecutive_successes: 2 }, 85), 336);
    assert.strictEqual(RS.calculateNextIntervalHours({ interval_hours: 600, consecutive_successes: 2 }, 95), 720);
  });

  test('a bad result after history resets to 1 day, not the 6h same-day loop (documented rule)', () => {
    assert.strictEqual(RS.calculateNextIntervalHours({ interval_hours: 168, consecutive_successes: 2 }, 20), 24);
    assert.strictEqual(RS.calculateNextIntervalHours({}, 20), 6, 'brand-new weak skill still gets same-day reinforcement');
    assert.strictEqual(RS.calculateNextIntervalHours({}, 50), 24);
  });

  const qs = (n) => Array.from({ length: n }, () => ({ skill: 'grammar' }));
  const allRight = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, true]));

  test('recordAttempt schedules due_at = now + interval and tracks the success streak', () => {
    let store = RS.recordAttempt({ questions: qs(2), correctMap: allRight(2), timestamp: 0, quiz_id: 'q9', level: 'B1' }, null);
    let c = store.skills.grammar;
    assert.strictEqual(c.interval_hours, 336);
    assert.strictEqual(c.due_at, 336 * H);
    assert.strictEqual(c.consecutive_successes, 1);
    assert.strictEqual(c.last_level, 'b1');
    store = RS.recordAttempt({ questions: qs(2), correctMap: allRight(2), timestamp: 336 * H }, store);
    c = store.skills.grammar;
    assert.strictEqual(c.consecutive_successes, 2);
    assert.strictEqual(c.interval_hours, 672, 'strong streak doubles 336h -> 672h');
    assert.strictEqual(c.last_quiz_id, 'q9', 'missing quiz id keeps the previous one');
    store = RS.recordAttempt({ questions: qs(2), correctMap: { 0: false, 1: false }, timestamp: 1e9 }, store);
    assert.strictEqual(store.skills.grammar.consecutive_successes, 0, 'a failure breaks the streak');
    assert.strictEqual(store.skills.grammar.interval_hours, 24);
  });

  test('untagged / banner / non-boolean questions never create a review card', () => {
    const store = RS.recordAttempt({
      questions: [{}, { skill: 'grammar', question_type: 'banner' }, { skill: 'grammar' }],
      correctMap: { 0: true, 1: true, 2: 'yes' },
    }, null);
    assert.deepStrictEqual(store.skills, {});
    assert.strictEqual(store.updated_at, null);
  });

  test('isDue / getDueSkills / getNextReview order by due_at and respect "now"', () => {
    const store = { version: 1, skills: {
      grammar: { interval_hours: 24, due_at: 3000 },
      reading: { interval_hours: 24, due_at: 1000 },
      writing: { interval_hours: 24, due_at: 9000 },
      usage: { interval_hours: 0 },
    } };
    assert.strictEqual(RS.isDue({ due_at: 10 }, 10), true);
    assert.strictEqual(RS.isDue({ due_at: 11 }, 10), false);
    assert.strictEqual(RS.isDue({ due_at: null }, 10), false);
    assert.strictEqual(RS.isDue(null, 10), false);
    assert.deepStrictEqual(RS.getDueSkills(store, 5000).map((x) => x.skill), ['reading', 'grammar']);
    assert.deepStrictEqual(RS.getDueSkills(store, 500), []);
    const next = RS.getNextReview(store);
    assert.strictEqual(next.skill, 'reading');
    assert.strictEqual(next.due_at, 1000);
    assert.strictEqual(RS.getNextReview({ version: 1, skills: {} }), null);
  });

  test('sanitising untrusted stored cards: wrong version -> empty; interval capped; legacy days migrate', () => {
    assert.deepStrictEqual(RS.getDueSkills({ version: 7, skills: { grammar: { due_at: 1 } } }, 10), []);
    const legacy = RS.getSkill({ version: 1, skills: { grammar: { interval_days: 3 } } }, 'grammar');
    assert.strictEqual(legacy.interval_hours, 72, 'legacy interval_days migrates to hours');
    const huge = RS.getSkill({ version: 1, skills: { grammar: { interval_hours: 99999, last_accuracy: 500 } } }, 'grammar');
    assert.strictEqual(huge.interval_hours, 720, 'capped at MAX_INTERVAL_DAYS * 24');
    assert.strictEqual(huge.last_accuracy, 100);
    assert.strictEqual(RS.getSkill({}, 'nope'), null);
    assert.strictEqual(RS.validateStore({ version: 1, skills: { grammar: { interval_hours: 24 } } }), true);
    assert.strictEqual(RS.validateStore({ version: 2 }), false);
  });

  test('a stored card with due_at:null is NOT due (was coerced to 0 = "due since 1970" before Agent 158)', () => {
    const store = { version: 1, updated_at: null, skills: { grammar: { interval_hours: 24, due_at: null, last_review_at: null } } };
    const card = RS.getSkill(store, 'grammar');
    assert.strictEqual(card.due_at, null);
    assert.strictEqual(card.last_review_at, null);
    assert.deepStrictEqual(RS.getDueSkills(store, 5), []);
    assert.strictEqual(RS.getNextReview(store), null);
    assert.strictEqual(RS.recordAttempt({}, store).updated_at, null);
  });

  test('recordAndPersist round-trips through storage; corrupt JSON falls back to empty', () => {
    fakeWindow.localStorage.clear();
    RS.recordAndPersist({ questions: qs(1), correctMap: { 0: true }, timestamp: 1 });
    assert.ok(RS.readStored().skills.grammar, 'card persisted');
    fakeWindow.localStorage.setItem(RS.STORAGE_KEY, '{oops');
    assert.deepStrictEqual(RS.readStored().skills, {});
  });
})();

// ============================================================
console.log('static wiring: level-lock fail-open guard (Agent 158)');
// ============================================================
(function () {
  // Level-lock guards are written `window.MylingoLevelLock && ...`, so they
  // fail OPEN if level-lock.js never loads (Agent 156/157 open item). Whether
  // fail-open is the desired product behaviour is still an open decision; what
  // we CAN enforce without deciding it is that no page can silently lose the
  // module by omission: every page whose code references MylingoLevelLock must
  // load it with a <script src> that resolves to a real file, and the offline
  // core manifest must precache it (otherwise an offline load fails open too).
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const files = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      if (e.name === 'node_modules' || e.name === 'tests' || e.name.startsWith('.')) return;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.html')) files.push(full);
    });
  })(root);

  const users = files.filter((f) => /MylingoLevelLock/.test(fs.readFileSync(f, 'utf8')));

  test('sanity: the scan found the known level-lock consumers (a1..c2 index/dashboard, quiz, courses)', () => {
    assert.ok(users.length >= 17, 'expected at least 17 pages to reference MylingoLevelLock, found ' + users.length);
  });

  test('every page that uses MylingoLevelLock loads level-lock.js via a resolvable <script src>', () => {
    const bad = [];
    users.forEach((f) => {
      const html = fs.readFileSync(f, 'utf8');
      const m = html.match(/<script[^>]+src="([^"]*level-lock\.js)"/);
      if (!m) { bad.push(path.relative(root, f) + ' (no script tag)'); return; }
      const target = path.resolve(path.dirname(f), m[1]);
      if (!fs.existsSync(target)) bad.push(path.relative(root, f) + ' (missing ' + m[1] + ')');
    });
    assert.deepStrictEqual(bad, [], 'these pages would silently fail open: ' + bad.join('; '));
  });

  test('level-lock.js is script-tagged BEFORE the code that calls it (quiz.html)', () => {
    const html = fs.readFileSync(path.join(root, 'shared', 'quiz.html'), 'utf8');
    const tag = html.indexOf('js/level-lock.js');
    const use = html.indexOf('window.MylingoLevelLock.isLocked');
    assert.ok(tag > -1 && use > -1 && tag < use, 'script tag must precede first use');
  });

  test('offline core manifest precaches level-lock.js, skill-mastery.js and review-scheduler.js', () => {
    const manifest = fs.readFileSync(path.join(root, 'offline', 'core-manifest.json'), 'utf8');
    ['shared/js/level-lock.js', 'shared/js/skill-mastery.js', 'shared/js/review-scheduler.js'].forEach((f) => {
      assert.ok(manifest.indexOf(f) > -1, f + ' missing from offline/core-manifest.json');
    });
  });
})();

// ============================================================
console.log('learner-state.js (Agent 159)');
// ============================================================
(function () {
  const fs = require('fs');
  const code = fs.readFileSync(path.join(__dirname, '..', 'shared/js/learner-state.js'), 'utf8');
  const fakeSelf = { localStorage: makeFakeStorage() };
  // `module` shadowed to undefined so the UMD wrapper takes the browser branch.
  new Function('self', 'module', code)(fakeSelf, undefined);
  const LS = fakeSelf.MylingoLearnerState;
  assert.ok(LS && typeof LS.validateState === 'function', 'expected MylingoLearnerState export');

  test('validateProgress: accepts a normal entry, rejects id mismatch / bad level / bad status / out-of-range', () => {
    const ok = { q1: { id: 'q1', level: 'a2', status: 'completed', best: 80, latest: 60, attempts: 3, current: 0, totalQuestions: 5, lastAccess: 1 } };
    assert.strictEqual(LS.validateProgress(ok), true);
    assert.strictEqual(LS.validateProgress({ q1: { id: 'other' } }), false);
    assert.strictEqual(LS.validateProgress({ q1: { level: 'z9' } }), false);
    assert.strictEqual(LS.validateProgress({ q1: { status: 'done' } }), false);
    assert.strictEqual(LS.validateProgress({ q1: { best: 101 } }), false);
    assert.strictEqual(LS.validateProgress({ q1: { attempts: -1 } }), false);
    assert.strictEqual(LS.validateProgress({ q1: 'nope' }), false);
    assert.strictEqual(LS.validateProgress([]), false);
  });

  test('validateProgress: refuses more than MAX_KEYS entries', () => {
    const big = {};
    for (let i = 0; i <= LS.MAX_KEYS; i++) big['q' + i] = {};
    assert.strictEqual(LS.validateProgress(big), false);
  });

  test('validateGamification bounds', () => {
    assert.strictEqual(LS.validateGamification({ xpTotal: 10, streak: 2, longestStreak: 3, lastActiveDate: '2026-01-01', rewardedSessions: [] }), true);
    assert.strictEqual(LS.validateGamification({ xpTotal: -1 }), false);
    assert.strictEqual(LS.validateGamification({ streak: 1.5 }), false);
    assert.strictEqual(LS.validateGamification({ rewardedSessions: new Array(21).fill('x') }), false);
    assert.strictEqual(LS.validateGamification(null), false);
  });

  test('validateSkillMastery / validateReviewScheduling reject impossible values', () => {
    const sm = (e) => ({ version: 1, skills: { grammar: e } });
    assert.strictEqual(LS.validateSkillMastery(sm({ question_count: 5, correct_count: 3, attempt_count: 1 })), true);
    assert.strictEqual(LS.validateSkillMastery(sm({ question_count: 2, correct_count: 3, attempt_count: 1 })), false);
    assert.strictEqual(LS.validateSkillMastery({ version: 1, skills: { bogus: { question_count: 0, correct_count: 0, attempt_count: 0 } } }), false);
    assert.strictEqual(LS.validateSkillMastery({ version: 2, skills: {} }), false);
    const rs = (e) => ({ version: 1, skills: { grammar: e } });
    assert.strictEqual(LS.validateReviewScheduling(rs({ interval_days: 14, interval_hours: 336 })), true);
    assert.strictEqual(LS.validateReviewScheduling(rs({ interval_days: 31 })), false);
    assert.strictEqual(LS.validateReviewScheduling(rs({ interval_days: 1, interval_hours: 721 })), false);
    assert.strictEqual(LS.validateReviewScheduling(rs({})), false, 'interval_days is required');
  });

  test('validatePlacement: null is fine; needs both CEFR levels and a 0-100 score', () => {
    assert.strictEqual(LS.validatePlacement(null), true);
    assert.strictEqual(LS.validatePlacement({ recommended_level: 'a2', assessed_level: 'b1', score: 55 }), true);
    assert.strictEqual(LS.validatePlacement({ recommended_level: 'a2', score: 55 }), false);
    assert.strictEqual(LS.validatePlacement({ recommended_level: 'a2', assessed_level: 'b1', score: 101 }), false);
  });

  test('parse + readLocal fall back on oversize / bad JSON / invalid shape / throwing storage', () => {
    assert.deepStrictEqual(LS.parse('{bad', 'fb'), 'fb');
    assert.deepStrictEqual(LS.parse(5, 'fb'), 'fb');
    assert.deepStrictEqual(LS.parse('x'.repeat(250001), 'fb'), 'fb');
    fakeSelf.localStorage.setItem('k', JSON.stringify({ xpTotal: 5 }));
    assert.deepStrictEqual(LS.readLocal('k', 'gamification', null), { xpTotal: 5 });
    fakeSelf.localStorage.setItem('k', JSON.stringify({ xpTotal: -5 }));
    assert.strictEqual(LS.readLocal('k', 'gamification', 'fb'), 'fb', 'invalid shape -> fallback');
    fakeSelf.localStorage = { getItem() { throw new Error('denied'); } };
    assert.strictEqual(LS.readLocal('k', 'gamification', 'fb'), 'fb', 'storage that throws -> fallback');
  });
})();

// ============================================================
console.log('gamification.js: XP / streak (Agent 159)');
// ============================================================
let GAM = null, gamStore = null;
(function () {
  const fs = require('fs');
  const code = fs.readFileSync(path.join(__dirname, '..', 'shared/js/gamification.js'), 'utf8');
  gamStore = makeFakeStorage();
  const fakeSelf = {};
  new Function('self', 'module', 'localStorage', code)(fakeSelf, undefined, gamStore);
  GAM = fakeSelf.MylingoGamification;
  assert.ok(GAM && typeof GAM.recordSession === 'function', 'expected MylingoGamification export');
  const day = (d) => new Date(d + 'T12:00:00');

  test('calculateXp: 10/correct, +20 perfect bonus, 0 for empty/garbage', () => {
    assert.strictEqual(GAM.calculateXp(3, 5), 30);
    assert.strictEqual(GAM.calculateXp(5, 5), 70);
    assert.strictEqual(GAM.calculateXp(0, 0), 0);
    assert.strictEqual(GAM.calculateXp(-4, 5), 0);
    assert.strictEqual(GAM.calculateXp('x', 'y'), 0);
  });

  test('updateStreak: same day keeps, next day +1, gap or first-ever resets to 1; month boundary works', () => {
    assert.strictEqual(GAM.updateStreak('2026-03-10', '2026-03-10', 4), 4);
    assert.strictEqual(GAM.updateStreak('2026-03-10', '2026-03-11', 4), 5);
    assert.strictEqual(GAM.updateStreak('2026-03-10', '2026-03-13', 4), 1);
    assert.strictEqual(GAM.updateStreak(null, '2026-03-10', 0), 1);
    assert.strictEqual(GAM.updateStreak('2026-02-28', '2026-03-01', 2), 3, '2026 is not a leap year');
    assert.strictEqual(GAM.daysBetween('2025-12-31', '2026-01-01'), 1);
  });

  test('todayStr honours an explicit timeZone and falls back on a bad one', () => {
    const d = new Date('2026-01-01T02:00:00Z');
    assert.strictEqual(GAM.todayStr(d, 'America/Los_Angeles'), '2025-12-31');
    assert.strictEqual(GAM.todayStr(d, 'Asia/Tokyo'), '2026-01-01');
    assert.match(GAM.todayStr(d, 'Not/AZone'), /^\d{4}-\d{2}-\d{2}$/);
  });

  test('recordSession: first completion pays XP; identical repeat pays nothing', () => {
    GAM.reset();
    const a = GAM.recordSession(4, 5, day('2026-05-01'), { quizId: 'q1' });
    assert.strictEqual(a.xpEarned, 40);
    assert.strictEqual(a.rewardType, 'completion');
    assert.strictEqual(a.streak, 1);
    const b = GAM.recordSession(4, 5, day('2026-05-01'), { quizId: 'q1' });
    assert.strictEqual(b.xpEarned, 0);
    assert.strictEqual(b.isRepeat, true);
    assert.strictEqual(b.xpTotal, 40);
  });

  test('recordSession: improvement pays 5 XP per extra correct, capped at 20 total', () => {
    GAM.reset();
    GAM.recordSession(1, 10, day('2026-05-01'), { quizId: 'q2' }); // 10 XP
    const up = GAM.recordSession(3, 10, day('2026-05-01'), { quizId: 'q2' });
    assert.strictEqual(up.rewardType, 'improvement');
    assert.strictEqual(up.xpEarned, 10);
    const big = GAM.recordSession(10, 10, day('2026-05-01'), { quizId: 'q2' });
    assert.strictEqual(big.xpEarned, 10, 'only 10 of the 20 improvement allowance was left');
    const capped = GAM.recordSession(10, 10, day('2026-05-01'), { quizId: 'q2' });
    assert.strictEqual(capped.xpEarned, 0);
  });

  test('recordSession: placement mode and id-less sessions never earn XP or touch the streak', () => {
    GAM.reset();
    const p = GAM.recordSession(5, 5, day('2026-05-01'), { quizId: 'placement-120', mode: 'placement' });
    assert.strictEqual(p.xpEarned, 0);
    assert.strictEqual(p.isPlacement, true);
    assert.strictEqual(p.streak, 0);
    const n = GAM.recordSession(5, 5, day('2026-05-01'), {});
    assert.strictEqual(n.xpEarned, 0, 'no quiz identity -> not rewardable (anti-farming rule)');
    assert.strictEqual(n.isRepeat, true);
  });

  test('recordSession: streak runs across consecutive days, resets after a gap, longestStreak is kept', () => {
    GAM.reset();
    GAM.recordSession(1, 1, day('2026-05-01'), { quizId: 'a' });
    GAM.recordSession(1, 1, day('2026-05-02'), { quizId: 'b' });
    const third = GAM.recordSession(1, 1, day('2026-05-03'), { quizId: 'c' });
    assert.strictEqual(third.streak, 3);
    assert.strictEqual(third.isNewStreakDay, true);
    const gap = GAM.recordSession(1, 1, day('2026-05-09'), { quizId: 'd' });
    assert.strictEqual(gap.streak, 1);
    assert.strictEqual(gap.longestStreak, 3);
  });

  test('legacy rewardedSessions ("quiz|score|date") migrate into the ledger and still block repeats', () => {
    gamStore.setItem(GAM.KEY, JSON.stringify({ xpTotal: 50, streak: 1, longestStreak: 1, lastActiveDate: '2026-05-01', rewardedSessions: ['old1|4|2026-05-01'] }));
    const st = GAM.getState();
    assert.deepStrictEqual(st.rewardLedger['old1|1'], { bestScore: 4, fullRewarded: true, improvementBonusXp: 0 });
    const again = GAM.recordSession(4, 5, day('2026-05-02'), { quizId: 'old1' });
    assert.strictEqual(again.xpEarned, 0);
  });
})();

// ============================================================
console.log('recommendations.js: direct unit coverage from a corrected mutation sweep (Agent 202)');
// ============================================================
(function () {
  // Agent 202: recommendSkillLevels() let a skill_counts value of "Infinity" through `Number(x) || 0` and returned question_count: Infinity
  // (null once serialised). A non-finite count is now 0 (the skill is skipped). The rest of this section pins behaviour the corrected-criterion
  // sweep showed was unasserted: labels, category map, candidate-level order, manifest grouping / dedupe rules and export copies.
  const fsr = require('fs');
  const REC_SRC = fsr.readFileSync(path.join(__dirname, '..', 'shared/js/recommendations.js'), 'utf8');
  function loadRec() {
    const sb = {};
    sb.window = sb;
    RUN_VM.createContext(sb);
    RUN_VM.runInContext(REC_SRC, sb);
    return sb.MylingoRecommendations;
  }
  const J = (x) => JSON.parse(JSON.stringify(x));

  test('recommendSkillLevels: a non-finite / non-numeric question count skips the skill (was: question_count Infinity); a count of exactly 2 is enough; numeric strings count', () => {
    const R = loadRec();
    const prof = (c) => ({ skills: { grammar: 50 }, skill_counts: { grammar: c }, recommended_level: 'b1' });
    ['Infinity', '-Infinity', 'abc', null, {}, [], 1, '1', 0].forEach((c) => assert.deepStrictEqual(J(R.recommendSkillLevels(prof(c))), [], 'count ' + JSON.stringify(c)));
    const two = R.recommendSkillLevels(prof(2));
    assert.strictEqual(two.length, 1);
    assert.strictEqual(two[0].question_count, 2);
    assert.strictEqual(R.recommendSkillLevels(prof('7'))[0].question_count, 7);
    assert.strictEqual(R.validateProfile(prof('Infinity')), true);
  });

  test('exports and labels: exact CATEGORY_BY_SKILL, score-band labels, RULES; exported LEVELS / SKILLS / CATEGORY_BY_SKILL / RULES are copies', () => {
    const R = loadRec();
    assert.deepStrictEqual(J(R.CATEGORY_BY_SKILL), { grammar: 'Grammar', vocabulary: 'Vocabulary', reading: 'Reading', listening: 'Listening', writing: 'Writing', usage: 'Grammar' });
    assert.deepStrictEqual([0, 60, 80, 90].map((n) => R.scoreBand(n).label), ['Needs support', 'Developing', 'Secure', 'Strong']);
    assert.deepStrictEqual([59.9, 79.9, 89.9].map((n) => R.scoreBand(n).key), ['needs_support', 'developing', 'secure']);
    assert.deepStrictEqual(J(R.RULES), { min_reported_questions: 2, max_recommendations: 3, support_below: 60, stretch_at_or_above: 90, developing_from: 60, secure_from: 80 });
    R.LEVELS.push('zz'); R.CATEGORY_BY_SKILL.grammar = 'X'; R.RULES.support_below = 99; R.SKILLS.push('zz');
    assert.strictEqual(R.normalizeLevel('zz'), 'a1');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1').category, 'Grammar');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1').reason, 'practice', 'RULES is a copy');
    assert.strictEqual(R.recommendationForSkill('zz', 70, 'b1'), null, 'SKILLS is a copy');
    assert.strictEqual(R.recommendationForSkill('listening', 70, 'b1').category, 'Listening');
    assert.strictEqual(R.recommendationForSkill('usage', 70, 'b1').category, 'Grammar');
  });

  test('recommendationForSkill: when the target level is missing from the catalog, the LOWER neighbour is tried before the higher one; neither available -> null', () => {
    const R = loadRec();
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', ['a2', 'b2']).level, 'a2');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', ['b2', 'c1']).level, 'b2');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', ['a2']).level, 'a2');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', ['c2']), null);
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', ['A2', 'junk', null]).level, 'a2');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', ['junk']), null, 'junk levels never make A1 (or anything) available');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', []).level, 'b1', 'an empty catalog list means "no filter"');
    assert.strictEqual(R.recommendationForSkill('grammar', 70, 'b1', 'b1').level, 'b1', 'a non-array catalog means "no filter"');
    assert.strictEqual(R.recommendationForSkill('GRAMMAR', 70, 'b1').skill, 'grammar');
  });

  test('resolveQuizPicks: a "null"-named junk level key is ignored, keys differing only in case are merged (concatenated, not overwritten), a non-array list is ignored, level match is case-insensitive, dedupe by identity and by string id (5 vs "5"), blank ids never dedupe, every recommendation field is carried', () => {
    const R = loadRec();
    const rec = (skill, level, category) => ({ skill, score: 41.5, score_band: 'needs_support', level, reason: 'support', label: 'Build foundations', category });
    assert.deepStrictEqual(J(R.resolveQuizPicks([rec('grammar', 'null', 'Grammar')], { junk: [{ id: 'j', category: 'Grammar' }] })), []);
    const q1 = { id: 'q1', category: 'Grammar' }, q2 = { id: 'q2', category: 'Vocabulary' };
    const merged = R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar'), rec('vocabulary', 'a1', 'Vocabulary')], { A1: [q1], a1: [q2] });
    assert.deepStrictEqual(J(merged.map((m) => m.quiz.id)), ['q1', 'q2']);
    assert.deepStrictEqual(J(R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar')], { a1: { id: 'o', category: 'Grammar' } })), [], 'an object (non-array) list is not treated as one quiz');
    assert.strictEqual(R.resolveQuizPicks([rec('grammar', 'A1', 'grammar')], { a1: [q1] }).length, 1, 'level and category compare case-insensitively');
    const dupA = { id: 5, category: 'Grammar' }, dupB = { id: '5', category: 'Grammar' };
    const byId = R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar'), rec('usage', 'a2', 'Grammar')], { a1: [dupA], a2: [dupB] });
    assert.strictEqual(byId.length, 1, 'same id (5 vs "5") on different objects is offered once');
    const noId1 = { id: '', category: 'Grammar' }, noId2 = { id: '', category: 'Grammar' };
    assert.strictEqual(R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar'), rec('usage', 'a2', 'Grammar')], { a1: [noId1], a2: [noId2] }).length, 2, 'blank ids are not a dedupe key');
    const noProp1 = { category: 'Grammar' }, noProp2 = { category: 'Grammar' };
    assert.strictEqual(R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar'), rec('usage', 'a2', 'Grammar')], { a1: [noProp1], a2: [noProp2] }).length, 2);
    const one = R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar')], { a1: [q1] })[0];
    assert.deepStrictEqual(J(one), { skill: 'grammar', score: 41.5, score_band: 'needs_support', level: 'a1', reason: 'support', label: 'Build foundations', quiz: { id: 'q1', category: 'Grammar' } });
    assert.strictEqual(one.quiz, q1, 'the manifest object itself is returned');
    const same = R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar'), rec('usage', 'a1', 'Grammar')], { a1: [q1] });
    assert.strictEqual(same.length, 1, 'grammar + usage never offer the same quiz twice');
    assert.deepStrictEqual(J(R.resolveQuizPicks(null, {})), []);
    assert.deepStrictEqual(J(R.resolveQuizPicks([null, 'x', 5, rec('grammar', 'a1', 'Nope')], { a1: [q1, null] })), []);
    assert.deepStrictEqual(J(R.resolveQuizPicks([rec('grammar', 'a1', 'Grammar')], null)), []);
  });
})();

// ============================================================
console.log('skill-mastery.js + review-scheduler.js: untrusted counters / timestamps + direct unit coverage (Agent 201)');
// ============================================================
(function () {
  // Agent 201: probing both modules with hand-corrupted stored data and odd inputs found (a) counters given as the string "Infinity" survived
  // `Math.floor(Number(x) || 0)` as Infinity and JSON.stringify wrote them back as null (skill-mastery question/attempt/level counts,
  // review-scheduler consecutive_successes); (b) `recordAttempt({timestamp: null | '' | false | []})` stamped the attempt at 1970 because
  // Number() of those is 0 (a review card then "due since 1970"; isDue/getDueSkills had the same flaw for their `now` argument);
  // (c) a non-numeric review card last_accuracy became NaN, which made validateStore() reject the whole review-scheduling section (and with it
  // the learner backup). All fixed via countOrZero / timeOrNow / a NaN guard. Own vm sandbox per module (they only need window.localStorage).
  const fsx = require('fs');
  const SM_SRC = fsx.readFileSync(path.join(__dirname, '..', 'shared/js/skill-mastery.js'), 'utf8');
  const RS_SRC = fsx.readFileSync(path.join(__dirname, '..', 'shared/js/review-scheduler.js'), 'utf8');
  function load(src, name, storage) {
    const sb = { localStorage: storage || makeFakeStorage() };
    sb.window = sb;
    RUN_VM.createContext(sb);
    RUN_VM.runInContext(src, sb);
    return { M: sb[name], ls: sb.localStorage };
  }
  const SM = () => load(SM_SRC, 'MylingoSkillMastery');
  const RS = () => load(RS_SRC, 'MylingoReviewScheduler');
  const J = (x) => JSON.parse(JSON.stringify(x));
  const Q = [{ skill: 'grammar' }];
  const CM = { 0: true };
  const nowish = (v, before, after) => v >= before && v <= after;

  test('skill-mastery: counters that are "Infinity" / negative / non-numeric / fractional are sanitised to finite non-negative integers and survive a JSON round trip (were: Infinity -> null)', () => {
    const { M } = SM();
    const raw = { version: 1, skills: { grammar: { question_count: 'Infinity', correct_count: 5, attempt_count: 'Infinity', level_counts: { a1: 'Infinity', a2: 3.9, b1: -2, zz: 4, B2: 2 } } } };
    const g = M.getSkill(raw, 'grammar');
    assert.strictEqual(g.question_count, 0);
    assert.strictEqual(g.correct_count, 0);
    assert.strictEqual(g.attempt_count, 0);
    assert.strictEqual(g.accuracy, null);
    assert.deepStrictEqual(J(g.level_counts), { a2: 3, b2: 2 });
    ['-5', '"abc"', 'null', '[]', '{}'].forEach((v) => {
      const s = M.getSkill({ version: 1, skills: { grammar: JSON.parse('{"question_count":' + v + ',"attempt_count":' + v + '}') } }, 'grammar');
      assert.strictEqual(s.question_count, 0, v);
      assert.strictEqual(s.attempt_count, 0, v);
    });
    const frac = M.getSkill({ skills: { grammar: { question_count: 7.9, correct_count: 3.9, attempt_count: 2.5 } } }, 'grammar');
    assert.deepStrictEqual([frac.question_count, frac.correct_count, frac.attempt_count], [7, 3, 2]);
    assert.strictEqual(M.getSkill({ skills: { grammar: { question_count: 4, correct_count: 9 } } }, 'grammar').correct_count, 4, 'correct is capped at question_count');
    const h = SM();
    h.M.writeStored({ version: 1, skills: { grammar: { question_count: 'Infinity', attempt_count: 'Infinity', level_counts: { a1: 'Infinity' } } } });
    assert.strictEqual(JSON.parse(h.ls.getItem('mylingo.skill-mastery.v1')).skills.grammar.attempt_count, 0);
  });

  test('skill-mastery recordAttempt: timestamp null / "" / "  " / false / true / [] / "abc" / NaN / undefined mean "now"; 0, 1234 and "5" are honoured', () => {
    const { M } = SM();
    [null, '', '  ', false, true, [], 'abc', NaN, undefined, {}].forEach((ts) => {
      const b = Date.now();
      const r = M.recordAttempt({ questions: Q, correctMap: CM, timestamp: ts }, { version: 1, skills: {} });
      assert.ok(nowish(r.updated_at, b, Date.now()), 'ts ' + JSON.stringify(ts) + ' -> ' + r.updated_at);
      assert.strictEqual(r.skills.grammar.last_attempt_at, r.updated_at);
    });
    assert.strictEqual(M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 0 }, { version: 1, skills: {} }).updated_at, 0);
    assert.strictEqual(M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 1234 }, { version: 1, skills: {} }).updated_at, 1234);
    assert.strictEqual(M.recordAttempt({ questions: Q, correctMap: CM, timestamp: '5' }, { version: 1, skills: {} }).updated_at, 5);
    assert.strictEqual(M.recordAttempt({ questions: [{ skill: 'x' }], correctMap: CM, timestamp: 9 }, { version: 1, skills: {}, updated_at: 3 }).updated_at, 3, 'no contributing question -> updated_at untouched');
  });

  test('skill-mastery recordAttempt: only tagged, non-banner questions with a boolean result count; attempts count once per skill per call; level / quiz id are normalised and kept when absent', () => {
    const { M } = SM();
    const qs = [{ skill: 'Grammar' }, { skill: 'grammar', question_type: 'Banner' }, { skill: 'nope' }, {}, null, { skill: 'grammar', question_type: 'Fill In' }, { skill: 'reading' }, { skill: 'grammar' }];
    const cm = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: 'yes', 7: true };
    const r = M.recordAttempt({ questions: qs, correctMap: cm, level: 'B1', quiz_id: 77, timestamp: 10 }, { version: 1, skills: {} });
    assert.deepStrictEqual(J(Object.keys(r.skills)), ['grammar']);
    const g = r.skills.grammar;
    assert.deepStrictEqual([g.question_count, g.correct_count, g.attempt_count, g.accuracy, g.mastery_band, g.confidence], [3, 2, 1, 66.67, 'developing', 'low']);
    assert.deepStrictEqual(J(g.level_counts), { b1: 3 });
    assert.strictEqual(g.last_level, 'b1');
    assert.strictEqual(g.last_quiz_id, '77');
    const r2 = M.recordAttempt({ questions: [{ skill: 'grammar' }], correctMap: { 0: false }, level: 'zz', timestamp: 20 }, r);
    assert.strictEqual(r2.skills.grammar.last_level, 'b1', 'invalid level keeps the previous one');
    assert.strictEqual(r2.skills.grammar.last_quiz_id, '77');
    assert.strictEqual(r2.skills.grammar.attempt_count, 2);
    assert.strictEqual(r2.skills.grammar.last_attempt_at, 20);
    assert.deepStrictEqual(J(r2.skills.grammar.level_counts), { b1: 3 }, 'no level -> level_counts untouched');
    const r3 = M.recordAttempt(null, null && r);
    assert.strictEqual(r3.skills.grammar === undefined || typeof r3.skills === 'object', true);
    assert.strictEqual(M.recordAttempt({ questions: 'no', correctMap: 'no' }, { version: 1, skills: {} }).updated_at, null);
  });

  test('skill-mastery: mastery bands and confidence thresholds (59.99/60/79.99/80/89.99/90, clamp, NaN; q<5||a<2 low, q<10||a<5 medium, else high)', () => {
    const { M } = SM();
    const band = (n) => M.masteryBand(n).key;
    assert.deepStrictEqual(J([0, 59.99, 60, 79.99, 80, 89.99, 90, 100, 150, -10, NaN, 'x'].map(band)), ['needs_support', 'needs_support', 'developing', 'developing', 'secure', 'secure', 'mastered', 'mastered', 'mastered', 'needs_support', 'needs_support', 'needs_support']);
    assert.strictEqual(M.masteryBand(60).label, 'Developing');
    assert.deepStrictEqual([[4, 9], [9, 1], [5, 2], [9, 9], [10, 4], [10, 5], [100, 100], [NaN, 5], ['10', '5']].map((a) => M.confidenceFor(a[0], a[1])), ['low', 'low', 'medium', 'medium', 'medium', 'high', 'high', 'low', 'high']);
    assert.deepStrictEqual(J(M.LEVELS), ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
    assert.deepStrictEqual(J(M.SKILLS), ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage']);
    assert.deepStrictEqual(J(M.MASTERY_BANDS).map((b) => b.min), [0, 60, 80, 90]);
    M.LEVELS.push('zz'); M.SKILLS.push('zz'); M.MASTERY_BANDS[1].min = 99;
    assert.strictEqual(M.normalizeLevel('zz'), null, 'LEVELS is a copy (pushing to the export does not extend the module list)');
    assert.strictEqual(M.masteryBand(65).key, 'developing', 'MASTERY_BANDS is a deep copy');
    assert.strictEqual(M.normalizeSkill('zz'), null, 'SKILLS is a copy');
    assert.strictEqual(M.normalizeSkill(' grammar'), null);
    assert.strictEqual(M.normalizeSkill('USAGE'), 'usage');
    assert.strictEqual(M.normalizeLevel('C2'), 'c2');
    assert.strictEqual(M.normalizeLevel(0), null);
  });

  test('skill-mastery: store boundary - wrong/missing version, non-object, malformed JSON, throwing storage; validateStore; last_attempt_at null stays null; recordAndPersist round-trips', () => {
    const h = SM();
    const M = h.M;
    assert.deepStrictEqual(J(M.readStored()), { version: 1, updated_at: null, skills: {} });
    ['{"version":2,"skills":{"grammar":{"question_count":5}}}', '{"skills":{}}', 'null', '[1]', '"x"', '{bad'].forEach((raw) => {
      h.ls.setItem('mylingo.skill-mastery.v1', raw);
      assert.deepStrictEqual(J(M.readStored()), { version: 1, updated_at: null, skills: {} }, raw);
    });
    assert.strictEqual(M.validateStore(null), false);
    assert.strictEqual(M.validateStore({ version: 2 }), false);
    assert.strictEqual(M.validateStore({ version: '1', skills: {} }), true, 'numeric-string version accepted like the sanitiser does');
    assert.strictEqual(M.validateStore({ version: 1, skills: { grammar: { question_count: 3, correct_count: 9 } } }), true, 'sanitiser clamps, so validate passes');
    const s = { version: 1, updated_at: null, skills: { grammar: { last_attempt_at: null, last_quiz_id: null, last_level: 'A1' } } };
    const g = M.getSkill(s, 'grammar');
    assert.strictEqual(g.last_attempt_at, null);
    assert.strictEqual(g.last_level, 'a1');
    assert.strictEqual(M.getSkill(s, 'zzz'), null);
    assert.strictEqual(M.getSkill(null, 'grammar').question_count, 0);
    const p = M.recordAndPersist({ questions: Q, correctMap: CM, timestamp: 5, quiz_id: 'q' });
    assert.strictEqual(JSON.parse(h.ls.getItem('mylingo.skill-mastery.v1')).skills.grammar.last_quiz_id, 'q');
    assert.strictEqual(M.readStored().skills.grammar.question_count, p.skills.grammar.question_count);
    const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); }, removeItem() {}, clear() {} };
    const b = load(SM_SRC, 'MylingoSkillMastery', boom).M;
    assert.strictEqual(b.writeStored({ version: 1, skills: {} }), false);
    assert.strictEqual(M.writeStored({ version: 1, skills: {} }), true, 'a successful write reports true');
    assert.strictEqual(b.readStored().updated_at, null);
    assert.doesNotThrow(() => b.recordAndPersist({ questions: Q, correctMap: CM }));
    const orig = { a: [1, { b: 2 }] };
    const c = M.clone(orig);
    assert.deepStrictEqual(J(c), { a: [1, { b: 2 }] });
    c.a[1].b = 9;
    assert.strictEqual(orig.a[1].b, 2, 'clone is a deep copy');
  });

  test('skill-mastery (Agent 201 sweep): empty-skill shape, sanitiser field rules (2dp accuracy, string quiz id, null quiz id, ts 0 / blank), numeric-string version, unknown skill keys dropped, recordAttempt/recordAndPersist read persisted state', () => {
    const h = SM();
    const M = h.M;
    assert.deepStrictEqual(J(M.getSkill(null, 'grammar')), { question_count: 0, correct_count: 0, attempt_count: 0, accuracy: null, mastery_band: null, confidence: 'low', level_counts: {}, last_level: null, last_quiz_id: null, last_attempt_at: null });
    const g = M.getSkill({ skills: { grammar: { question_count: 3, correct_count: 2, last_quiz_id: 12, last_attempt_at: 0 } } }, 'grammar');
    assert.strictEqual(g.accuracy, 66.67);
    assert.strictEqual(g.mastery_band, 'developing');
    assert.strictEqual(g.last_quiz_id, '12');
    assert.strictEqual(g.last_attempt_at, 0, 'a stored 0 is a real timestamp, not "missing"');
    assert.strictEqual(M.getSkill({ skills: { grammar: { last_quiz_id: null } } }, 'grammar').last_quiz_id, null);
    ['', null, 'abc'].forEach((v) => assert.strictEqual(M.getSkill({ skills: { grammar: { last_attempt_at: v } } }, 'grammar').last_attempt_at, null, JSON.stringify(v)));
    const rv = M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 1 }, { version: '1', updated_at: '', skills: { grammar: { question_count: 3 }, foo: { question_count: 9 } } });
    assert.strictEqual(rv.skills.grammar.question_count, 4, 'a numeric-string version is accepted');
    assert.strictEqual(rv.skills.foo, undefined);
    assert.strictEqual(rv.skills['null'], undefined);
    assert.deepStrictEqual(J(Object.keys(rv.skills)), ['grammar']);
    assert.strictEqual(M.recordAttempt({ questions: [{ skill: 'x' }], correctMap: CM }, { version: 1, updated_at: '', skills: {} }).updated_at, null, 'a blank stored updated_at is null, not 0');
    M.recordAndPersist({ questions: Q, correctMap: CM, timestamp: 1 });
    M.recordAndPersist({ questions: Q, correctMap: { 0: false }, timestamp: 2 });
    const st = M.readStored().skills.grammar;
    assert.deepStrictEqual([st.question_count, st.correct_count, st.attempt_count], [2, 1, 2], 'recordAndPersist accumulates onto the stored state');
    const viaStorage = M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 3 });
    assert.strictEqual(viaStorage.skills.grammar.question_count, 3, 'no store argument -> the persisted store is the base');
    assert.strictEqual(M.readStored().skills.grammar.question_count, 2, 'recordAttempt itself does not write');
  });

  test('review-scheduler recordAttempt: timestamp null / "" / false / [] / "abc" mean now (was 1970), so due_at is in the future; 0 and numeric strings are honoured', () => {
    const { M } = RS();
    [null, '', '  ', false, [], 'abc', NaN, undefined].forEach((ts) => {
      const b = Date.now();
      const r = M.recordAttempt({ questions: Q, correctMap: CM, timestamp: ts }, { version: 1, skills: {} });
      const c = r.skills.grammar;
      assert.ok(nowish(c.last_review_at, b, Date.now()), 'ts ' + JSON.stringify(ts));
      assert.ok(c.due_at > b, 'due in the future, not 1970: ' + c.due_at);
      assert.strictEqual(r.updated_at, c.last_review_at);
    });
    const z = M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 0 }, { version: 1, skills: {} }).skills.grammar;
    assert.strictEqual(z.last_review_at, 0);
    assert.strictEqual(z.due_at, 336 * 3600000);
    assert.strictEqual(M.recordAttempt({ questions: Q, correctMap: CM, timestamp: '1000' }, { version: 1, skills: {} }).skills.grammar.last_review_at, 1000);
  });

  test('review-scheduler isDue / getDueSkills: a null / blank / non-numeric `now` means the real clock (was 1970 -> nothing ever due); explicit 0 is honoured; null due_at is never due; results sorted by due_at', () => {
    const { M } = RS();
    const past = Date.now() - 5000;
    const store = { version: 1, skills: { grammar: { due_at: past }, reading: { due_at: past - 100 }, writing: { due_at: Date.now() + 3600000 }, usage: { due_at: null }, listening: {} } };
    [null, '', false, 'abc', undefined, NaN].forEach((n) => {
      assert.strictEqual(M.isDue({ due_at: past }, n), true, 'isDue now=' + JSON.stringify(n));
      assert.deepStrictEqual(J(M.getDueSkills(store, n).map((x) => x.skill)), ['reading', 'grammar'], 'getDueSkills now=' + JSON.stringify(n));
    });
    assert.strictEqual(M.isDue({ due_at: past }, 0), false);
    assert.strictEqual(M.isDue({ due_at: 0 }, 0), true, 'due_at === now is due');
    assert.strictEqual(M.isDue({ due_at: 1 }, 0), false);
    assert.strictEqual(M.isDue(null, 5), false);
    assert.strictEqual(M.isDue({}, 5), false);
    assert.strictEqual(M.isDue({ due_at: null }, 5), false);
    assert.deepStrictEqual(J(M.getDueSkills(store, '9999999999999').map((x) => x.skill)), ['reading', 'grammar', 'writing']);
    const next = M.getNextReview(store);
    assert.strictEqual(next.skill, 'reading');
    assert.strictEqual(next.due_at, past - 100);
    assert.strictEqual(M.getNextReview({ version: 1, skills: { usage: { due_at: null } } }), null);
    assert.strictEqual(M.getNextReview({ version: 1, skills: {} }), null);
  });

  test('review-scheduler cards: non-numeric last_accuracy is null (was NaN, which made validateStore reject the whole section); "Infinity" success streaks are 0; accuracy clamps to 0-100 and rounds to 2dp; legacy interval_days upgrades to hours', () => {
    const { M } = RS();
    ['"abc"', '{}', 'true'].forEach((v) => {
      const st = { version: 1, skills: { grammar: JSON.parse('{"last_accuracy":' + v + '}') } };
      const card = M.getSkill(st, 'grammar');
      if (v === 'true') assert.strictEqual(card.last_accuracy, 1); else assert.strictEqual(card.last_accuracy, null, v);
      assert.strictEqual(M.validateStore(st), true, 'validateStore ' + v);
    });
    const g = (o) => M.getSkill({ skills: { grammar: o } }, 'grammar');
    assert.strictEqual(g({ last_accuracy: 'Infinity' }).last_accuracy, 100);
    assert.strictEqual(g({ last_accuracy: -5 }).last_accuracy, 0);
    assert.strictEqual(g({ last_accuracy: 66.666 }).last_accuracy, 66.67);
    assert.strictEqual(g({ last_accuracy: 0 }).last_accuracy, 0);
    assert.strictEqual(g({ consecutive_successes: 'Infinity' }).consecutive_successes, 0);
    assert.strictEqual(g({ consecutive_successes: -3 }).consecutive_successes, 0);
    assert.strictEqual(g({ consecutive_successes: 4.9 }).consecutive_successes, 4);
    assert.deepStrictEqual([g({ interval_days: 3 }).interval_hours, g({ interval_days: 3 }).interval_days], [72, 3]);
    assert.strictEqual(g({ interval_days: 99 }).interval_hours, 720, 'legacy days are capped at 30');
    assert.strictEqual(g({ interval_hours: 9999 }).interval_hours, 720);
    assert.strictEqual(g({ interval_hours: 10.9 }).interval_hours, 10);
    assert.strictEqual(g({ interval_hours: -4 }).interval_hours, 0);
    assert.strictEqual(g({ interval_hours: 0, interval_days: 2 }).interval_hours, 48, 'a 0 hours value falls back to the legacy days');
    assert.strictEqual(g({ due_at: null }).due_at, null);
    assert.strictEqual(g({ due_at: '' }).due_at, null);
    assert.strictEqual(g({ due_at: '77' }).due_at, 77);
    assert.strictEqual(g({ last_level: 'C1' }).last_level, 'c1');
    assert.strictEqual(g({ last_level: 'zz' }).last_level, null);
    assert.strictEqual(g({ last_quiz_id: 12 }).last_quiz_id, '12');
    assert.strictEqual(M.validateStore({ version: 2, skills: {} }), false);
    assert.strictEqual(M.validateStore(null), false);
  });

  test('review-scheduler intervals: accuracy bands (39/40/59/60/79/80/89/90/100), poor result resets to 24h for a skill with history but 6h for a brand-new one, strong repeats double up to the 30-day cap, streak bookkeeping', () => {
    const { M } = RS();
    assert.deepStrictEqual(J([0, 39, 39.5, 40, 59, 60, 79, 80, 89, 90, 100, 150, -5, NaN].map(M.accuracyBandHours)), [6, 6, 24, 24, 24, 72, 72, 168, 168, 336, 336, 336, 6, 6]);
    const c = M.calculateNextIntervalHours;
    assert.strictEqual(c(null, 20), 6);
    assert.strictEqual(c({ interval_hours: 72 }, 20), 24);
    assert.strictEqual(c({ consecutive_successes: 2 }, 20), 24, 'a success streak alone counts as history');
    assert.strictEqual(c({}, 45), 24);
    assert.strictEqual(c({}, 70), 72);
    assert.strictEqual(c({}, 85), 168);
    assert.strictEqual(c({ interval_hours: 168, consecutive_successes: 1 }, 85), 336, 'strong + streak doubles');
    assert.strictEqual(c({ interval_hours: 168, consecutive_successes: 0 }, 85), 168, 'no streak -> no doubling');
    assert.strictEqual(c({ interval_hours: 168, consecutive_successes: 1 }, 79), 72, 'not strong -> band only');
    assert.strictEqual(c({ interval_hours: 500, consecutive_successes: 3 }, 95), 720, 'capped at 30 days');
    assert.strictEqual(c({ interval_hours: 100, consecutive_successes: 1 }, 80), 200);
    assert.strictEqual(c({ interval_days: 4, consecutive_successes: 1 }, 85), 192, 'legacy interval_days is honoured when interval_hours is missing');
    assert.strictEqual(c({ interval_hours: 'x', interval_days: 2, consecutive_successes: 1 }, 85), 168);
    const r1 = M.recordAttempt({ questions: [Q[0], Q[0]], correctMap: { 0: true, 1: true }, timestamp: 1000, level: 'A2', quiz_id: 'q1' }, { version: 1, skills: {} });
    let card = r1.skills.grammar;
    assert.deepStrictEqual([card.interval_hours, card.interval_days, card.consecutive_successes, card.last_accuracy, card.last_level, card.last_quiz_id], [336, 14, 1, 100, 'a2', 'q1']);
    assert.strictEqual(card.due_at, 1000 + 336 * 3600000);
    const r2 = M.recordAttempt({ questions: Q, correctMap: { 0: true }, timestamp: 2000 }, r1);
    assert.deepStrictEqual([r2.skills.grammar.interval_hours, r2.skills.grammar.consecutive_successes, r2.skills.grammar.last_level, r2.skills.grammar.last_quiz_id], [672, 2, 'a2', 'q1']);
    const r3 = M.recordAttempt({ questions: Q, correctMap: { 0: false }, timestamp: 3000, quiz_id: 'q9' }, r2);
    assert.deepStrictEqual([r3.skills.grammar.interval_hours, r3.skills.grammar.consecutive_successes, r3.skills.grammar.last_quiz_id, r3.updated_at], [24, 0, 'q9', 3000]);
    const other = M.recordAttempt({ questions: [{ skill: 'reading' }], correctMap: { 0: true }, timestamp: 4000 }, r3);
    assert.deepStrictEqual(J(Object.keys(other.skills).sort()), ['grammar', 'reading']);
    assert.strictEqual(other.skills.grammar.last_review_at, 3000, 'other skills are untouched');
    assert.strictEqual(M.recordAttempt({ questions: [{ skill: 'x' }], correctMap: CM, timestamp: 1 }, { version: 1, skills: {}, updated_at: 8 }).updated_at, 8);
    const banner = M.recordAttempt({ questions: [{ skill: 'grammar', question_type: 'banner' }], correctMap: CM, timestamp: 1 }, { version: 1, skills: {} });
    assert.deepStrictEqual(J(Object.keys(banner.skills)), []);
    assert.deepStrictEqual(M.DAY_MS, 86400000);
    assert.strictEqual(M.MAX_INTERVAL_DAYS, 30);
    assert.deepStrictEqual(J(M.SKILLS), ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage']);
  });

  test('review-scheduler (Agent 201 sweep): empty-card shape, case-insensitive skills / all six levels, blank-vs-zero timestamps, numeric-string version, unknown skills dropped, writeStored sanitises, mixed-accuracy rounding + the exact-80% streak, robust recordAttempt inputs, persisted accumulation', () => {
    const h = RS();
    const M = h.M;
    assert.deepStrictEqual(J(M.getSkill(null, 'grammar')), { interval_hours: 0, interval_days: 0, consecutive_successes: 0, last_accuracy: null, last_review_at: null, due_at: null, last_quiz_id: null, last_level: null });
    assert.notStrictEqual(M.getSkill({ skills: { grammar: { due_at: 5 } } }, 'GRAMMAR'), null, 'skill lookup is case-insensitive');
    assert.strictEqual(M.getSkill({ skills: { GRAMMAR: { due_at: 5 } } }, 'grammar').due_at, null, 'stored keys must already be lowercase');
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'C2', 'A1'].forEach((lv) => assert.strictEqual(M.getSkill({ skills: { grammar: { last_level: lv } } }, 'grammar').last_level, lv.toLowerCase(), lv));
    assert.strictEqual(M.getSkill({ skills: { grammar: { last_level: null } } }, 'grammar').last_level, null);
    const g = (o) => M.getSkill({ skills: { grammar: o } }, 'grammar');
    ['abc', 'NaN', {}].forEach((v) => { assert.strictEqual(g({ due_at: v }).due_at, null); assert.strictEqual(g({ last_review_at: v }).last_review_at, null); });
    assert.strictEqual(g({ due_at: 0 }).due_at, 0);
    assert.strictEqual(g({ last_review_at: 0 }).last_review_at, 0);
    assert.strictEqual(g({ last_accuracy: null }).last_accuracy, null);
    assert.strictEqual(g({ last_quiz_id: null }).last_quiz_id, null);
    const rv = M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 1 }, { version: '1', updated_at: '', skills: { grammar: { consecutive_successes: 2, interval_hours: 24 }, foo: { due_at: 5 } } });
    assert.strictEqual(rv.skills.grammar.consecutive_successes, 3, 'numeric-string version accepted');
    assert.deepStrictEqual(J(Object.keys(rv.skills)), ['grammar']);
    assert.strictEqual(M.recordAttempt({ questions: [{ skill: 'x' }], correctMap: CM }, { version: 1, updated_at: '', skills: {} }).updated_at, null, 'blank updated_at -> null');
    assert.strictEqual(M.writeStored({ version: 1, skills: { foo: { due_at: 5 }, grammar: { consecutive_successes: 'Infinity', last_accuracy: 'abc', due_at: 'abc' } } }), true);
    const raw = JSON.parse(h.ls.getItem('mylingo.review-scheduling.v1'));
    assert.deepStrictEqual(Object.keys(raw.skills), ['grammar'], 'unknown skills are not persisted');
    assert.strictEqual(raw.skills.grammar.consecutive_successes, 0);
    assert.strictEqual(raw.skills.grammar.last_accuracy, null);
    assert.strictEqual(raw.skills.grammar.due_at, null);
    const orig = { a: [1, { b: 2 }] };
    const c = M.clone(orig);
    c.a[1].b = 9;
    assert.strictEqual(orig.a[1].b, 2, 'clone is a deep copy');
    assert.strictEqual(M.calculateNextIntervalHours({ interval_hours: 0, interval_days: 4, consecutive_successes: 1 }, 85), 192, 'a zero hours value falls back to legacy days');
    const mixed = M.recordAttempt({ questions: [Q[0], Q[0]], correctMap: { 0: true, 1: false }, timestamp: 1 }, { version: 1, skills: {} }).skills.grammar;
    assert.deepStrictEqual([mixed.last_accuracy, mixed.interval_hours, mixed.consecutive_successes], [50, 24, 0]);
    const two3 = M.recordAttempt({ questions: [Q[0], Q[0], Q[0]], correctMap: { 0: true, 1: true, 2: false }, timestamp: 1 }, { version: 1, skills: {} }).skills.grammar;
    assert.strictEqual(two3.last_accuracy, 66.67);
    const eighty = M.recordAttempt({ questions: Array(5).fill(Q[0]), correctMap: { 0: true, 1: true, 2: true, 3: true, 4: false }, timestamp: 1 }, { version: 1, skills: {} }).skills.grammar;
    assert.deepStrictEqual([eighty.last_accuracy, eighty.consecutive_successes, eighty.interval_hours], [80, 1, 168], 'exactly 80% is a success');
    const upper = M.recordAttempt({ questions: [{ skill: 'Grammar' }, { skill: 'READING', question_type: 'Fill-In' }, { skill: 'writing', question_type: 'BANNER' }, null], correctMap: { 0: true, 1: true, 2: true, 3: true }, timestamp: 1, quiz_id: 42, level: 'zz' }, { version: 1, skills: {} });
    assert.deepStrictEqual(J(Object.keys(upper.skills).sort()), ['grammar', 'reading']);
    assert.strictEqual(upper.skills.grammar.last_quiz_id, '42');
    assert.strictEqual(upper.skills.grammar.last_level, null);
    const keep = M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 2 }, upper);
    assert.strictEqual(keep.skills.grammar.last_quiz_id, '42', 'no quiz id -> the previous one is kept');
    assert.doesNotThrow(() => M.recordAttempt(null, { version: 1, skills: {} }));
    assert.doesNotThrow(() => M.recordAttempt(undefined));
    assert.doesNotThrow(() => M.recordAttempt({ questions: 'no', correctMap: 'no' }, { version: 1, skills: {} }));
    assert.doesNotThrow(() => M.recordAttempt({ questions: {}, correctMap: null }, { version: 1, skills: {} }));
    M.recordAndPersist({ questions: Q, correctMap: CM, timestamp: 10 });
    M.recordAndPersist({ questions: Q, correctMap: CM, timestamp: 20 });
    assert.strictEqual(M.readStored().skills.grammar.consecutive_successes, 2, 'recordAndPersist builds on the stored card');
    assert.strictEqual(M.recordAttempt({ questions: Q, correctMap: CM, timestamp: 30 }).skills.grammar.consecutive_successes, 3, 'no store argument -> the persisted store is the base');
    M.SKILLS.push('zz');
    assert.strictEqual(M.getSkill({ skills: { zz: { due_at: 1 } } }, 'zz'), null, 'SKILLS is a copy');
    assert.strictEqual(M.MAX_INTERVAL_DAYS, 30);
  });

  test('review-scheduler store boundary: bad version / shape / JSON / throwing storage give the empty store; recordAndPersist round-trips; getSkill guards', () => {
    const h = RS();
    const M = h.M;
    assert.deepStrictEqual(J(M.readStored()), { version: 1, updated_at: null, skills: {} });
    ['{"version":3,"skills":{"grammar":{}}}', '{"skills":{}}', 'null', '[1]', '{bad'].forEach((raw) => {
      h.ls.setItem('mylingo.review-scheduling.v1', raw);
      assert.deepStrictEqual(J(M.readStored()), { version: 1, updated_at: null, skills: {} }, raw);
    });
    const p = M.recordAndPersist({ questions: Q, correctMap: CM, timestamp: 50 });
    assert.strictEqual(JSON.parse(h.ls.getItem('mylingo.review-scheduling.v1')).skills.grammar.last_review_at, 50);
    assert.strictEqual(M.readStored().skills.grammar.due_at, p.skills.grammar.due_at);
    assert.strictEqual(M.getSkill(p, 'nope'), null);
    assert.strictEqual(M.getSkill(null, 'grammar').interval_hours, 0);
    assert.strictEqual(M.getDueSkills(null, 1e15)[0].skill, 'grammar', 'a null store reads from storage');
    assert.strictEqual(M.getNextReview(null).skill, 'grammar');
    const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); }, removeItem() {}, clear() {} };
    const b = load(RS_SRC, 'MylingoReviewScheduler', boom).M;
    assert.strictEqual(b.writeStored({ version: 1, skills: {} }), false);
    assert.doesNotThrow(() => b.recordAndPersist({ questions: Q, correctMap: CM }));
    assert.deepStrictEqual(J(M.clone({ x: [1] })), { x: [1] });
  });
})();

// ============================================================
console.log('gamification.js: untrusted stored state + direct unit coverage (Agent 200)');
// ============================================================
(function () {
  // Agent 200: probing recordSession()/getState() with hand-corrupted `mylingo.gamification.v1` found (a) a ledger entry that is a
  // primitive (5 / "abc" / true) made recordSession() throw a strict-mode TypeError on `entry.bestScore = ...`, (b) a string counter
  // such as "Infinity" survived Number() as Infinity, JSON.stringify then wrote it back as null and silently wiped the XP total, and
  // (c) negative counters / negative ledger fields were carried into the UI and into the improvement-XP arithmetic (a negative
  // improvementBonusXp lifts the 20-XP cap). All three are fixed in gamification.js (nonNegFinite + isPlainObject entry guard).
  const fs = require('fs');
  const code = fs.readFileSync(path.join(__dirname, '..', 'shared/js/gamification.js'), 'utf8');
  const K = 'mylingo.gamification.v1';
  const day = (d) => new Date(d + 'T12:00:00');
  function make(seed, storage) {
    const store = storage || makeFakeStorage();
    if (seed !== undefined && !storage) store.setItem(K, typeof seed === 'string' ? seed : JSON.stringify(seed));
    const fakeSelf = {};
    new Function('self', 'module', 'localStorage', code)(fakeSelf, undefined, store);
    return { G: fakeSelf.MylingoGamification, store };
  }
  const saved = (h) => JSON.parse(h.store.getItem(K));

  test('getState: non-finite / negative / non-numeric counters read as 0; numeric strings and valid numbers pass through', () => {
    const cases = [['"Infinity"', 0], ['"-Infinity"', 0], ['-50', 0], ['"abc"', 0], ['null', 0], ['[]', 0], ['{}', 0], ['"9"', 9], ['12', 12], ['0.5', 0.5]];
    cases.forEach(([raw, want]) => {
      const h = make('{"xpTotal":' + raw + ',"streak":' + raw + ',"longestStreak":' + raw + '}');
      const st = h.G.getState();
      assert.strictEqual(st.xpTotal, want, 'xpTotal ' + raw);
      assert.strictEqual(st.streak, want, 'streak ' + raw);
      assert.strictEqual(st.longestStreak, want, 'longestStreak ' + raw);
    });
  });

  test('getState: null / array / string / garbage JSON / missing / throwing storage all give the empty state; lastActiveDate falsy -> null', () => {
    const empty = { xpTotal: 0, streak: 0, longestStreak: 0, lastActiveDate: null, rewardedSessions: [], rewardLedger: {} };
    ['null', '[1,2]', '"x"', '5', '{bad', ''].forEach((raw) => assert.deepStrictEqual(JSON.parse(JSON.stringify(make(raw).G.getState())), empty, 'raw ' + JSON.stringify(raw)));
    assert.deepStrictEqual(JSON.parse(JSON.stringify(make().G.getState())), empty);
    const boom = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() {}, clear() {} };
    assert.deepStrictEqual(JSON.parse(JSON.stringify(make(undefined, boom).G.getState())), empty);
    assert.strictEqual(make({ lastActiveDate: '' }).G.getState().lastActiveDate, null);
    assert.strictEqual(make({ lastActiveDate: '2026-05-01' }).G.getState().lastActiveDate, '2026-05-01');
  });

  test('getState: rewardedSessions keeps only the last 20; a non-array becomes []; a non-object ledger is rebuilt from the legacy list, a real one is kept', () => {
    const many = Array.from({ length: 25 }, (_, i) => 'q' + i + '|1|2026-05-01');
    const st = make({ rewardedSessions: many }).G.getState();
    assert.strictEqual(st.rewardedSessions.length, 20);
    assert.strictEqual(st.rewardedSessions[0], 'q5|1|2026-05-01');
    assert.deepStrictEqual(make({ rewardedSessions: 'abc' }).G.getState().rewardedSessions, []);
    const rebuilt = make({ rewardLedger: [1], rewardedSessions: ['a|3|d', 'a|5|d', 'b|2|d', 'bad', '|4|d', 'c|x|d|extra'] }).G.getState().rewardLedger;
    assert.deepStrictEqual(Object.keys(rebuilt).sort(), ['a|1', 'b|1'], 'wrong part count / empty id are skipped; the best score per quiz wins');
    assert.strictEqual(rebuilt['a|1'].bestScore, 5);
    assert.strictEqual(rebuilt['a|1'].fullRewarded, true);
    assert.strictEqual(rebuilt['a|1'].improvementBonusXp, 0);
    const kept = make({ rewardLedger: { 'z|1': { bestScore: 1 } }, rewardedSessions: ['a|3|d'] }).G.getState().rewardLedger;
    assert.deepStrictEqual(Object.keys(kept), ['z|1']);
  });

  test('recordSession: a ledger entry that is a primitive / array / null no longer throws - it is replaced by a fresh completion record and pays once', () => {
    [5, 'abc', true, [1], null].forEach((bad) => {
      const h = make({ xpTotal: 7, rewardLedger: { 'q|1': bad } });
      let r;
      assert.doesNotThrow(() => { r = h.G.recordSession(3, 3, day('2026-09-20'), { quizId: 'q' }); }, 'entry ' + JSON.stringify(bad));
      assert.strictEqual(r.rewardType, 'completion');
      assert.strictEqual(r.xpEarned, 50);
      assert.strictEqual(r.xpTotal, 57);
      const s = saved(h);
      assert.deepStrictEqual(s.rewardLedger['q|1'], { bestScore: 3, fullRewarded: true, improvementBonusXp: 0 });
      assert.strictEqual(h.G.recordSession(3, 3, day('2026-09-20'), { quizId: 'q' }).xpEarned, 0, 'the repaired entry blocks a second payout');
    });
  });

  test('recordSession: a stored "Infinity" total is not written back as null (the XP total used to be wiped); the new total is finite', () => {
    const h = make('{"xpTotal":"Infinity","streak":"Infinity","longestStreak":"Infinity"}');
    const r = h.G.recordSession(3, 3, day('2026-09-20'), { quizId: 'q' });
    assert.strictEqual(r.xpTotal, 50);
    assert.strictEqual(r.streak, 1);
    assert.strictEqual(r.longestStreak, 1);
    const s = saved(h);
    assert.strictEqual(s.xpTotal, 50);
    assert.strictEqual(s.streak, 1);
    assert.strictEqual(s.longestStreak, 1);
  });

  test('recordSession: negative stored counters start from 0; a negative stored bestScore / improvementBonusXp cannot inflate the improvement payout or lift the 20-XP cap', () => {
    const a = make({ xpTotal: -50, streak: -3, longestStreak: -9, lastActiveDate: '2026-09-19' });
    const ra = a.G.recordSession(3, 3, day('2026-09-20'), { quizId: 'q' });
    assert.strictEqual(ra.xpTotal, 50, 'not 0');
    assert.strictEqual(ra.streak, 1);
    assert.strictEqual(ra.longestStreak, 1);
    const b = make({ rewardLedger: { 'q|1': { bestScore: -5, fullRewarded: true, improvementBonusXp: 0 } } });
    assert.strictEqual(b.G.recordSession(3, 10, day('2026-09-20'), { quizId: 'q' }).xpEarned, 15, 'gain is 3 (from 0), not 8');
    const c = make({ rewardLedger: { 'q|1': { bestScore: 1, fullRewarded: true, improvementBonusXp: -100 } } });
    const rc = c.G.recordSession(10, 10, day('2026-09-20'), { quizId: 'q' });
    assert.strictEqual(rc.xpEarned, 20, 'capped at the 20-XP allowance, not 45');
    assert.strictEqual(saved(c).rewardLedger['q|1'].improvementBonusXp, 20);
  });

  test('recordSession: improvement branch - string bestScore is numeric, equal / lower scores are repeats, an exhausted allowance reports improvement-capped and pays 0 but still raises bestScore', () => {
    const h = make({ rewardLedger: { 'q|1': { bestScore: '2', fullRewarded: true, improvementBonusXp: 0 } } });
    assert.strictEqual(h.G.recordSession(2, 5, day('2026-09-20'), { quizId: 'q' }).isRepeat, true, 'equal score');
    assert.strictEqual(h.G.recordSession(1, 5, day('2026-09-20'), { quizId: 'q' }).isRepeat, true, 'lower score');
    const up = h.G.recordSession(3, 5, day('2026-09-20'), { quizId: 'q' });
    assert.strictEqual(up.rewardType, 'improvement');
    assert.strictEqual(up.xpEarned, 5);
    const full = make({ rewardLedger: { 'q|1': { bestScore: 1, fullRewarded: true, improvementBonusXp: 20 } } });
    const cap = full.G.recordSession(4, 5, day('2026-09-20'), { quizId: 'q' });
    assert.strictEqual(cap.rewardType, 'improvement-capped');
    assert.strictEqual(cap.xpEarned, 0);
    assert.strictEqual(cap.isRepeat, false);
    assert.strictEqual(cap.isNewStreakDay, false);
    assert.strictEqual(saved(full).rewardLedger['q|1'].bestScore, 4);
    assert.strictEqual(saved(full).lastActiveDate, null, 'no XP -> the streak day is not consumed');
  });

  test('recordSession: reward identity - quizId is trimmed, quizVersion defaults to "1" and is trimmed, a different version pays again, blank/missing id or zero total is never rewarded', () => {
    const h = make();
    assert.strictEqual(h.G.recordSession(2, 2, day('2026-09-20'), { quizId: '  q  ' }).xpEarned, 40);
    assert.ok(saved(h).rewardLedger['q|1'], 'trimmed id, default version 1');
    assert.strictEqual(h.G.recordSession(2, 2, day('2026-09-20'), { quizId: 'q', quizVersion: ' 1 ' }).isRepeat, true);
    assert.strictEqual(h.G.recordSession(2, 2, day('2026-09-20'), { quizId: 'q', quizVersion: '' }).isRepeat, true, 'blank version falls back to 1');
    assert.strictEqual(h.G.recordSession(2, 2, day('2026-09-20'), { quizId: 'q', quizVersion: 2 }).xpEarned, 40, 'new version, new reward');
    assert.ok(saved(h).rewardLedger['q|2']);
    const blank = h.G.recordSession(2, 2, day('2026-09-20'), { quizId: '   ' });
    assert.strictEqual(blank.xpEarned, 0);
    assert.strictEqual(blank.isRepeat, true);
    const zero = h.G.recordSession(0, 0, day('2026-09-20'), { quizId: 'z' });
    assert.strictEqual(zero.xpEarned, 0);
    assert.strictEqual(zero.isRepeat, false, 'an empty quiz is neither rewarded nor a "repeat"');
    assert.strictEqual(zero.rewardType, 'none');
    assert.strictEqual(h.G.recordSession(2, 2, day('2026-09-20'), null).isRepeat, true, 'a non-object meta is treated as {}');
    assert.strictEqual(h.G.recordSession(2, 2, day('2026-09-20'), 'quiz').isRepeat, true);
  });

  test('recordSession: placement mode (any case) leaves XP, streak and lastActiveDate alone even with a quizId; a zero-score first completion is recorded and pays 0', () => {
    const h = make({ xpTotal: 10, streak: 2, longestStreak: 4, lastActiveDate: '2026-09-19' });
    const p = h.G.recordSession(5, 5, day('2026-09-20'), { quizId: 'p', mode: 'PLACEMENT' });
    assert.strictEqual(p.isPlacement, true);
    assert.strictEqual(p.isRepeat, false, 'placement is never reported as a repeat');
    assert.strictEqual(p.xpEarned, 0);
    assert.strictEqual(p.streak, 2);
    assert.strictEqual(p.isNewStreakDay, false);
    assert.strictEqual(saved(h).lastActiveDate, '2026-09-19');
    assert.strictEqual(saved(h).xpTotal, 10);
    assert.strictEqual(Object.keys(saved(h).rewardLedger).length, 0, 'placement never writes the ledger');
    const z = h.G.recordSession(0, 4, day('2026-09-20'), { quizId: 'zero' });
    assert.strictEqual(z.rewardType, 'completion');
    assert.strictEqual(z.xpEarned, 0);
    assert.strictEqual(z.streak, 2, 'no XP -> streak untouched');
    assert.strictEqual(saved(h).rewardLedger['zero|1'].bestScore, 0);
  });

  test('recordSession: streak day flags - same-day second reward keeps the streak and is not a new day; next day +1; garbage lastActiveDate resets to 1; longestStreak only grows', () => {
    const h = make();
    const a = h.G.recordSession(1, 1, day('2026-09-20'), { quizId: 'a' });
    assert.strictEqual(a.isNewStreakDay, true);
    const b = h.G.recordSession(1, 1, day('2026-09-20'), { quizId: 'b' });
    assert.strictEqual(b.isNewStreakDay, false);
    assert.strictEqual(b.streak, 1);
    const c = h.G.recordSession(1, 1, day('2026-09-21'), { quizId: 'c' });
    assert.strictEqual(c.streak, 2);
    assert.strictEqual(c.longestStreak, 2);
    const bad = make({ streak: 8, longestStreak: 8, lastActiveDate: 'garbage' });
    const r = bad.G.recordSession(1, 1, day('2026-09-20'), { quizId: 'a' });
    assert.strictEqual(r.streak, 1);
    assert.strictEqual(r.longestStreak, 8);
    assert.strictEqual(saved(bad).longestStreak, 8);
  });

  test('recordSession: the reward history keeps the newest 20 ids, records only paid rewards, and improvements are listed too', () => {
    const h = make();
    for (let i = 0; i < 23; i++) h.G.recordSession(1, 1, day('2026-09-20'), { quizId: 'q' + i });
    assert.strictEqual(saved(h).rewardedSessions.length, 20, 'the persisted list is capped right after the write that would make it 21');
    h.G.recordSession(1, 1, day('2026-09-20'), { quizId: 'q0' }); // repeat: not listed
    h.G.recordSession(0, 3, day('2026-09-20'), { quizId: 'zero' }); // pays 0: not listed
    let hist = saved(h).rewardedSessions;
    assert.strictEqual(hist.length, 20);
    assert.strictEqual(hist[0], 'q3|1');
    assert.strictEqual(hist[19], 'q22|1');
    const g = make({ rewardLedger: { 'q|1': { bestScore: 1, fullRewarded: true, improvementBonusXp: 0 } } });
    g.G.recordSession(2, 3, day('2026-09-20'), { quizId: 'q' });
    assert.deepStrictEqual(saved(g).rewardedSessions, ['q|1']);
  });

  test('recordSession / reset: a throwing setItem or getItem never throws to the caller; reset() writes the canonical empty record; the summary has exactly the documented fields', () => {
    const boom = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() {}, clear() {} };
    const h = make(undefined, boom);
    let r;
    assert.doesNotThrow(() => { r = h.G.recordSession(2, 2, day('2026-09-20'), { quizId: 'q' }); });
    assert.deepStrictEqual(Object.keys(r).sort(), ['isNewStreakDay', 'isPlacement', 'isRepeat', 'longestStreak', 'rewardType', 'streak', 'xpEarned', 'xpTotal']);
    assert.doesNotThrow(() => h.G.reset());
    const k = make({ xpTotal: 99, streak: 4 });
    k.G.reset();
    assert.deepStrictEqual(saved(k), { xpTotal: 0, streak: 0, longestStreak: 0, lastActiveDate: null, rewardedSessions: [], rewardLedger: {} });
  });

  test('recordSession: blank quizVersion on a NEW quiz falls back to "1" and pays; a negative score is stored as 0; a stored bonus above the cap pays 0 (never negative XP); improvements accumulate against the 20-XP allowance', () => {
    const h = make();
    const r = h.G.recordSession(2, 2, day('2026-09-20'), { quizId: 'fresh', quizVersion: '   ' });
    assert.strictEqual(r.xpEarned, 40);
    assert.ok(saved(h).rewardLedger['fresh|1'], 'stored under version 1');
    const n = make();
    const rn = n.G.recordSession(-3, 3, day('2026-09-20'), { quizId: 'neg' });
    assert.strictEqual(rn.rewardType, 'completion');
    assert.strictEqual(rn.xpEarned, 0);
    assert.strictEqual(saved(n).rewardLedger['neg|1'].bestScore, 0);
    const over = make({ rewardLedger: { 'q|1': { bestScore: 1, fullRewarded: true, improvementBonusXp: 25 } } });
    const ro = over.G.recordSession(2, 5, day('2026-09-20'), { quizId: 'q' });
    assert.strictEqual(ro.xpEarned, 0, 'not -5');
    assert.strictEqual(ro.rewardType, 'improvement-capped');
    assert.ok(ro.xpTotal >= 0);
    const acc = make();
    acc.G.recordSession(1, 10, day('2026-09-20'), { quizId: 'a' });
    const paid = [2, 3, 4, 5, 6, 7].map((sc) => acc.G.recordSession(sc, 10, day('2026-09-20'), { quizId: 'a' }).xpEarned);
    assert.deepStrictEqual(paid, [5, 5, 5, 5, 0, 0], 'four +5 steps exhaust the 20-XP allowance, then nothing more');
    assert.strictEqual(saved(acc).rewardLedger['a|1'].improvementBonusXp, 20);
    assert.strictEqual(saved(acc).rewardLedger['a|1'].bestScore, 7);
  });

  test('daysBetween: exact over centuries (a 1000ms/day constant), and identical in a non-UTC zone (dates parse as UTC midnight, not local) - checked in a child node with TZ set', () => {
    const { G } = make();
    assert.strictEqual(G.daysBetween('1900-01-01', '2026-01-01'), 46021);
    assert.strictEqual(G.daysBetween('2026-01-01', '2026-01-01'), 0);
    const cp = require('child_process');
    ['Pacific/Auckland', 'America/Los_Angeles', 'Pacific/Kiritimati'].forEach((tz) => {
      const out = cp.execFileSync(process.execPath, ['-e', "const G=require(process.argv[1]);console.log(JSON.stringify([G.daysBetween('2026-03-10','2026-03-11'),G.daysBetween('2026-03-28','2026-03-30'),G.daysBetween('2026-11-01','2026-11-02'),G.daysBetween('2026-04-04','2026-04-05'),G.updateStreak('2026-03-10','2026-03-11',4)]))", path.join(__dirname, '..', 'shared/js/gamification.js')], { env: Object.assign({}, process.env, { TZ: tz }), encoding: 'utf8' });
      assert.deepStrictEqual(JSON.parse(out), [1, 2, 1, 1, 5], tz);
    });
  });

  test('migrateRewardLedger (via getState): a negative legacy score is stored as 0', () => {
    const led = make({ rewardedSessions: ['n|-3|2026-05-01'] }).G.getState().rewardLedger;
    assert.strictEqual(led['n|1'].bestScore, 0);
  });

  test('pure helpers: calculateXp (NaN / negative / string inputs, perfect bonus only when correct === total > 0), daysBetween sign + DST-safe rounding, updateStreak with garbage streak, todayStr local default', () => {
    const { G } = make();
    assert.strictEqual(G.calculateXp('3', '4'), 30);
    assert.strictEqual(G.calculateXp(NaN, 5), 0);
    assert.strictEqual(G.calculateXp(5, 3), 50, 'correct above total is still not "perfect"');
    assert.strictEqual(G.calculateXp(3, 3), 50);
    assert.strictEqual(G.calculateXp(1, 1), 30);
    assert.strictEqual(G.calculateXp(3, -1), 0);
    assert.strictEqual(G.daysBetween('2026-03-11', '2026-03-10'), -1);
    assert.strictEqual(G.daysBetween('2026-03-28', '2026-03-30'), 2, 'spans a DST change in many zones; UTC math keeps it whole');
    assert.strictEqual(G.updateStreak('2026-03-10', '2026-03-10', 'abc'), 1, 'same day never reports a streak below 1');
    assert.strictEqual(G.updateStreak('2026-03-10', '2026-03-11', -4), 1);
    assert.strictEqual(G.updateStreak('2026-03-10', '2026-03-09', 5), 1, 'a date in the past (clock moved back) resets');
    assert.strictEqual(G.updateStreak('', '2026-03-10', 7), 1);
    assert.strictEqual(G.todayStr(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
    assert.strictEqual(G.todayStr(new Date(2026, 10, 9, 0, 5), ''), '2026-11-09');
    assert.match(G.todayStr(), /^\d{4}-\d{2}-\d{2}$/);
  });
})();

// ============================================================
console.log('gamification.js: backup / restore (Agent 159)');
// ============================================================
(function () {
  const seed = (extra) => JSON.stringify(Object.assign({ xpTotal: 40, streak: 1, longestStreak: 1, lastActiveDate: '2026-05-01', rewardedSessions: [] }, extra || {}));
  const v2 = (sections) => ({ schema: 'mylingo.backup.v2', version: 2, exportedAt: '2026-05-01T00:00:00.000Z', sections });

  test('validateBackup rejects malformed envelopes with a reason', () => {
    assert.strictEqual(GAM.validateBackup(null).ok, false);
    assert.strictEqual(GAM.validateBackup({ schema: 'nope' }).ok, false);
    assert.strictEqual(GAM.validateBackup({ schema: 'mylingo.backup.v2', version: 2, sections: {} }).ok, false, 'no timestamp');
    assert.strictEqual(GAM.validateBackup(v2({})).ok, false, 'no recognised sections');
    assert.strictEqual(GAM.validateBackup(v2({ mystery: 1 })).ok, false);
  });

  test('validateBackup: invalid sections are reported, valid ones kept', () => {
    const r = GAM.validateBackup(v2({ gamification: { xpTotal: 5 }, progress: { q: { best: 500 } } }));
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.valid_sections, ['gamification']);
    assert.deepStrictEqual(r.invalid_sections, ['progress']);
  });

  test('v1 legacy backup is accepted; a missing section shows up as invalid rather than being restored', () => {
    const legacy = { schema: 'mylingo.backup.v1', exportedAt: 'x', progress: {}, session: null, gamification: { xpTotal: 1 } };
    const r = GAM.validateBackup(legacy);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.legacy, true);
    assert.deepStrictEqual(r.invalid_sections, []);
    const partial = GAM.validateBackup({ schema: 'mylingo.backup.v1', exportedAt: 'x', progress: {} });
    assert.strictEqual(partial.ok, true);
    assert.ok(partial.invalid_sections.indexOf('gamification') >= 0, 'the absent gamification section must at least be flagged invalid');
    assert.strictEqual(GAM.validateBackup({ schema: 'mylingo.backup.v1', progress: {} }).ok, false, 'no timestamp');
  });

  test('buildBackup -> restoreBackup round-trips learner data through storage', () => {
    gamStore.clear();
    gamStore.setItem(GAM.KEY, seed());
    gamStore.setItem(GAM.PROGRESS_KEY, JSON.stringify({ q1: { id: 'q1', level: 'a1', best: 90 } }));
    const pkg = JSON.parse(JSON.stringify(GAM.buildBackup()));
    assert.strictEqual(pkg.schema, 'mylingo.backup.v2');
    gamStore.clear();
    const res = GAM.restoreBackup(pkg);
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.partial, false);
    assert.strictEqual(JSON.parse(gamStore.getItem(GAM.KEY)).xpTotal, 40);
    assert.strictEqual(JSON.parse(gamStore.getItem(GAM.PROGRESS_KEY)).q1.best, 90);
  });

  test('restoreBackup with a bad section skips it (partial) and leaves the live value alone', () => {
    gamStore.clear();
    gamStore.setItem(GAM.PROGRESS_KEY, JSON.stringify({ keep: { best: 10 } }));
    const res = GAM.restoreBackup(v2({ gamification: { xpTotal: 7 }, progress: { q: { best: 999 } } }));
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.partial, true);
    assert.deepStrictEqual(res.rejected_sections, ['progress']);
    assert.strictEqual(JSON.parse(gamStore.getItem(GAM.PROGRESS_KEY)).keep.best, 10);
    assert.strictEqual(JSON.parse(gamStore.getItem(GAM.KEY)).xpTotal, 7);
  });

  test('restoreBackup with only invalid sections reports failure and writes nothing', () => {
    gamStore.clear();
    const res = GAM.restoreBackup(v2({ progress: { q: { best: 999 } } }));
    assert.strictEqual(res.ok, false);
    assert.strictEqual(gamStore.getItem(GAM.PROGRESS_KEY), null);
  });

  test('session restore MERGES by quizId: sessions outside the backup survive', () => {
    gamStore.clear();
    const sess = (id) => ({ version: 1, status: 'in-progress', quizId: id, quizVersion: '1', questionIndex: 0, answers: [null], score: 0, startedAt: 1, updatedAt: 2 });
    // live store already has quiz "live"
    gamStore.setItem(GAM.SESSION_KEY, JSON.stringify({ version: 2, sessions: { live: sess('live') } }));
    const res = GAM.restoreBackup(v2({ session: { version: 2, sessions: { fromBackup: sess('fromBackup') } } }));
    assert.strictEqual(res.ok, true);
    const idx = JSON.parse(gamStore.getItem('mylingo.sessions.v3.index'));
    assert.deepStrictEqual(idx.quizIds.sort(), ['fromBackup', 'live']);
    assert.ok(gamStore.getItem('mylingo.sessions.v3.live'), 'pre-existing session must be re-sharded, not lost');
    assert.strictEqual(gamStore.getItem(GAM.SESSION_KEY), null, 'legacy v2 blob is removed after migration');
  });

  test('null placement/orientation in a backup clears the live key', () => {
    gamStore.clear();
    gamStore.setItem(GAM.PLACEMENT_KEY, JSON.stringify({ recommended_level: 'a1', assessed_level: 'a1', score: 10 }));
    const res = GAM.restoreBackup(v2({ placement: null, gamification: { xpTotal: 1 } }));
    assert.strictEqual(res.ok, true);
    assert.strictEqual(gamStore.getItem(GAM.PLACEMENT_KEY), null);
  });
})();

// ============================================================
console.log('cross-module: stored data passes BOTH validators (Agent 159)');
// ============================================================
(function () {
  // Agent 159 found that review-scheduler stored any string as last_level, which
  // gamification's backup validator rejects -- silently dropping ALL review cards
  // from backups. This pins the contract: whatever the runtime modules persist,
  // the backup and learner-state validators must accept.
  const fs = require('fs');
  const w = { localStorage: makeFakeStorage() };
  const st = w.localStorage;
  ['skill-mastery', 'review-scheduler'].forEach((f) => new Function('global', 'window', fs.readFileSync(path.join(__dirname, '..', 'shared/js', f + '.js'), 'utf8'))(w, w));
  const lsSelf = {};
  new Function('self', 'module', fs.readFileSync(path.join(__dirname, '..', 'shared/js/learner-state.js'), 'utf8'))(lsSelf, undefined);
  const LSV = lsSelf.MylingoLearnerState;
  const qs = [{ skill: 'grammar' }, { skill: 'grammar' }, { skill: 'reading' }, { skill: 'usage' }];
  const cm = { 0: true, 1: false, 2: true, 3: false };

  [['b1'], ['B2'], ['placement'], ['A1-B1'], [''], [undefined], [null]].forEach((entry) => {
    test('level input ' + JSON.stringify(entry[0]) + ': persisted mastery + review stores validate everywhere', () => {
      st.clear();
      w.MylingoSkillMastery.recordAndPersist({ questions: qs, correctMap: cm, quiz_id: 'q1', level: entry[0] });
      w.MylingoReviewScheduler.recordAndPersist({ questions: qs, correctMap: cm, quiz_id: 'q1', level: entry[0] });
      const sm = JSON.parse(st.getItem('mylingo.skill-mastery.v1'));
      const rs = JSON.parse(st.getItem('mylingo.review-scheduling.v1'));
      GAM_VALID(sm, rs);
      assert.strictEqual(LSV.validateSkillMastery(sm), true, 'learner-state rejects skill mastery');
      assert.strictEqual(LSV.validateReviewScheduling(rs), true, 'learner-state rejects review scheduling');
    });
  });

  function GAM_VALID(sm, rs) {
    // route through the real backup validator by seeding gamification's own storage
    gamStore.clear();
    gamStore.setItem(GAM.SKILL_MASTERY_KEY, JSON.stringify(sm));
    gamStore.setItem(GAM.REVIEW_KEY, JSON.stringify(rs));
    const r = GAM.validateBackup(GAM.buildBackup());
    assert.deepStrictEqual(r.invalid_sections, [], 'backup validator rejects: ' + r.invalid_sections.join(','));
  }

  test('review-scheduler: a legacy card with a junk last_level self-heals to null on the next write', () => {
    st.clear();
    st.setItem('mylingo.review-scheduling.v1', JSON.stringify({ version: 1, skills: { grammar: { interval_days: 1, last_level: 'placement' } } }));
    assert.strictEqual(w.MylingoReviewScheduler.readStored().skills.grammar.last_level, null);
  });
})();

// ============================================================
console.log('quiz-packer.js (Agent 159)');
// ============================================================
(function () {
  delete fakeWindow.MylingoQuizPacker;
  loadModule('shared/js/quiz-packer.js');
  const QP = fakeWindow.MylingoQuizPacker;
  assert.ok(QP && typeof QP.packRows === 'function', 'expected MylingoQuizPacker export');
  const rows = (n, level, cat, extra) => Array.from({ length: n }, (_, i) => Object.assign({ level, quiz_category: cat, question: 'q' + i }, extra || {}));

  test('assigns sequential quiz ids, numbers questions 1..n, and merges a tiny tail into the previous quiz', () => {
    const input = rows(12, 'B1', 'Grammar');
    const res = QP.packRows(input, { targetSize: 5 });
    assert.strictEqual(res.packedQuizCount, 2, '12 rows @5 -> [5,2] -> tail<5 merged -> [5,7]');
    assert.strictEqual(res.packedRowCount, 12);
    const ids = Array.from(new Set(input.map((r) => r.quiz_id)));
    assert.deepStrictEqual(ids, ['b1-001', 'b1-002']);
    assert.deepStrictEqual(input.filter((r) => r.quiz_id === 'b1-002').map((r) => r.question_number), [1, 2, 3, 4, 5, 6, 7]);
    assert.strictEqual(input[0].title, 'Mixed Grammar Practice');
    assert.strictEqual(input[0].quiz_tags, 'Grammar,B1');
  });

  test('never reuses an id already present in the input; already-identified rows are untouched', () => {
    const input = rows(5, 'A2', 'Vocabulary').concat([{ level: 'A2', quiz_category: 'Vocabulary', quiz_id: 'a2-007', question_number: 1, title: 'Keep me' }]);
    const res = QP.packRows(input, { targetSize: 5 });
    assert.strictEqual(res.packedQuizCount, 1);
    assert.strictEqual(input[0].quiz_id, 'a2-008');
    const kept = input[input.length - 1];
    assert.strictEqual(kept.quiz_id, 'a2-007');
    assert.strictEqual(kept.title, 'Keep me');
  });

  test('fewer than minSize rows: no quiz is manufactured (rows left unidentified)', () => {
    const input = rows(3, 'C1', 'Reading');
    const res = QP.packRows(input, {});
    assert.strictEqual(res.packedQuizCount, 0);
    assert.ok(input.every((r) => !r.quiz_id));
  });

  test('levels and categories are packed independently', () => {
    const input = rows(5, 'A1', 'Grammar').concat(rows(5, 'A1', 'Vocabulary'), rows(5, 'B1', 'Grammar'));
    const res = QP.packRows(input, { targetSize: 5 });
    assert.strictEqual(res.packedQuizCount, 3);
    assert.deepStrictEqual(Array.from(new Set(input.map((r) => r.quiz_id))).sort(), ['a1-001', 'a1-002', 'b1-001']);
  });

  test('selectedIds limits packing to the chosen rows; repackExisting re-packs identified rows', () => {
    const input = rows(10, 'B2', 'Usage');
    input.forEach((r, i) => { r.__internalId = 'r' + i; });
    const res = QP.packRows(input, { targetSize: 5, selectedIds: ['r0', 'r1', 'r2', 'r3', 'r4'] });
    assert.strictEqual(res.packedRowCount, 5);
    assert.ok(input.slice(5).every((r) => !r.quiz_id));
    const again = QP.packRows(input.slice(0, 5), { targetSize: 5, repackExisting: true });
    assert.strictEqual(again.packedRowCount, 5);
  });

  test('a profile overrides sizes and supplies title/description templates', () => {
    const input = rows(6, 'B1', 'Grammar');
    const res = QP.packRows(input, { profiles: [{ id: 'p1', level: 'B1', quiz_category: 'Grammar', min_size: 3, target_size: 3, max_size: 3, title_template: '${level} ${category} Drill', description_template: 'Drill for ${category}' }] });
    assert.strictEqual(res.packedQuizCount, 2);
    assert.deepStrictEqual(res.profilesApplied, ['p1']);
    assert.strictEqual(input[0].title, 'B1 Grammar Drill');
    assert.strictEqual(input[0].description, 'Drill for Grammar');
  });

  test('housekeeping: no __packOrder left behind, non-array input is harmless, API is frozen', () => {
    const input = rows(5, 'A1', 'Grammar');
    QP.packRows(input, { targetSize: 5 });
    assert.ok(input.every((r) => !('__packOrder' in r)));
    assert.strictEqual(QP.packRows(null).packedRowCount, 0);
    assert.strictEqual(Object.isFrozen(QP), true);
  });
})();

// ============================================================
console.log('safe-url.js (Agent 160)');
// ============================================================
(function () {
  const fs = require('fs');
  const code = fs.readFileSync(path.join(__dirname, '..', 'shared/js/safe-url.js'), 'utf8');
  const fakeSelf = {};
  // `module` shadowed to undefined so the UMD wrapper takes the browser branch
  // (same trick as the learner-state.js loader above).
  new Function('self', 'module', code)(fakeSelf, undefined);
  const SU = fakeSelf.MylingoSafeUrl;
  assert.ok(SU && typeof SU.isSafeMediaUrl === 'function', 'expected MylingoSafeUrl export');

  test('dangerous schemes rejected (any case, with leading whitespace)', () => {
    assert.strictEqual(SU.isSafeMediaUrl('javascript:alert(1)'), false);
    assert.strictEqual(SU.isSafeMediaUrl('JavaScript:alert(1)'), false);
    assert.strictEqual(SU.isSafeMediaUrl('data:text/html;base64,abc'), false);
    assert.strictEqual(SU.isSafeMediaUrl('vbscript:x'), false);
    assert.strictEqual(SU.isSafeMediaUrl('file:///etc/passwd'), false);
    assert.strictEqual(SU.isSafeMediaUrl('  javascript:alert(1)'), false);
  });

  test('protocol-relative //host rejected', () => {
    assert.strictEqual(SU.isSafeMediaUrl('//evil.com/x.mp3'), false);
  });

  test('backslash variants of protocol-relative URLs rejected (Agent 160 fix)', () => {
    // WHATWG URL resolution treats \ the same as / for http(s) bases, so
    // these are equivalent to '//evil.com' and must be rejected exactly
    // like it is, even though they don't match a literal '//' prefix.
    assert.strictEqual(SU.isSafeMediaUrl('/\\evil.com/x.mp3'), false);
    assert.strictEqual(SU.isSafeMediaUrl('\\\\evil.com/x.mp3'), false);
    assert.strictEqual(SU.isSafeMediaUrl('\\/evil.com/x.mp3'), false);
  });

  test('a single leading backslash is just a same-host path, not a bypass', () => {
    // '\evil.com' resolves to https://mylingo.invalid/evil.com (same host),
    // so it must stay allowed — only the two-separator forms above resolve
    // off-host and need blocking.
    assert.strictEqual(SU.isSafeMediaUrl('\\evil.com'), true);
  });

  test('relative and root-relative asset paths accepted', () => {
    assert.strictEqual(SU.isSafeMediaUrl('images/a.png'), true);
    assert.strictEqual(SU.isSafeMediaUrl('/images/a.png'), true);
    assert.strictEqual(SU.isSafeMediaUrl('./images/a.png'), true);
  });

  test('explicit http/https URLs accepted regardless of host', () => {
    assert.strictEqual(SU.isSafeMediaUrl('https://good.com/a.png'), true);
    assert.strictEqual(SU.isSafeMediaUrl('http://good.com/a.png'), true);
    assert.strictEqual(SU.isSafeMediaUrl('HTTPS://Good.com/A.PNG'), true);
  });

  test('other schemes (mailto, ftp, tel) rejected', () => {
    assert.strictEqual(SU.isSafeMediaUrl('mailto:a@b.com'), false);
    assert.strictEqual(SU.isSafeMediaUrl('ftp://x.com/a'), false);
    assert.strictEqual(SU.isSafeMediaUrl('tel:12345'), false);
  });

  test('non-strings, empty and blank values rejected', () => {
    assert.strictEqual(SU.isSafeMediaUrl(''), false);
    assert.strictEqual(SU.isSafeMediaUrl('   '), false);
    assert.strictEqual(SU.isSafeMediaUrl(null), false);
    assert.strictEqual(SU.isSafeMediaUrl(undefined), false);
    assert.strictEqual(SU.isSafeMediaUrl(42), false);
  });

  test('isSafeRedirect only accepts same-app relative paths', () => {
    assert.strictEqual(SU.isSafeRedirect('./a1/dashboard.html'), true);
    assert.strictEqual(SU.isSafeRedirect('../b1/index.html'), true);
    assert.strictEqual(SU.isSafeRedirect('a1/dashboard.html'), false, 'must start with ./ or ../');
    assert.strictEqual(SU.isSafeRedirect('//evil.com/x'), false);
    assert.strictEqual(SU.isSafeRedirect('https://evil.com'), false);
    assert.strictEqual(SU.isSafeRedirect('javascript:alert(1)'), false);
    assert.strictEqual(SU.isSafeRedirect(''), false);
    assert.strictEqual(SU.isSafeRedirect(null), false);
  });

  test('isSafeRedirect backslash variants also rejected (already safe, pinning it)', () => {
    assert.strictEqual(SU.isSafeRedirect('\\\\evil.com'), false);
    assert.strictEqual(SU.isSafeRedirect('/\\evil.com'), false);
  });
})();

// ============================================================
console.log('canonical-metadata.js (Agent 162)');
// ============================================================
(function () {
  delete fakeWindow.MylingoCanonicalMetadata;
  loadModule('shared/js/canonical-metadata.js');
  const CM = fakeWindow.MylingoCanonicalMetadata;

  test('normalizeSkill: trims, lower-cases, accepts only the six known skills', () => {
    assert.strictEqual(CM.normalizeSkill('  GrAmMaR '), 'grammar');
    ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage'].forEach((s) => assert.strictEqual(CM.normalizeSkill(s), s));
    assert.strictEqual(CM.normalizeSkill('academic english'), null, 'a category label is not a skill');
    assert.strictEqual(CM.normalizeSkill('foo'), null);
    assert.strictEqual(CM.normalizeSkill(''), null);
    assert.strictEqual(CM.normalizeSkill(null), null);
    assert.strictEqual(CM.normalizeSkill(undefined), null);
    assert.strictEqual(CM.normalizeSkill(0), null);
  });

  test('skillForCategory: maps categories, "Academic English" -> usage, unknown -> null', () => {
    assert.strictEqual(CM.skillForCategory('Vocabulary'), 'vocabulary');
    assert.strictEqual(CM.skillForCategory('  academic english '), 'usage');
    assert.strictEqual(CM.skillForCategory('Pronunciation'), null);
    assert.strictEqual(CM.skillForCategory(null), null);
    // must not resolve inherited Object.prototype keys as if they were categories
    assert.strictEqual(CM.skillForCategory('constructor'), null, 'prototype key leaked through the category map');
    assert.strictEqual(CM.skillForCategory('toString'), null);
    assert.strictEqual(CM.skillForCategory('__proto__'), null);
  });

  test('normalizeObjective: objective wins, learning_objective is the fallback, whitespace collapsed', () => {
    assert.strictEqual(CM.normalizeObjective({ objective: '  Use   the\n past  simple ' }), 'Use the past simple');
    assert.strictEqual(CM.normalizeObjective({ learning_objective: 'Order food' }), 'Order food');
    assert.strictEqual(CM.normalizeObjective({ objective: '   ', learning_objective: 'Fallback' }), 'Fallback');
    assert.strictEqual(CM.normalizeObjective({ objective: 'Primary', learning_objective: 'Ignored' }), 'Primary');
    assert.strictEqual(CM.normalizeObjective({ objective: '   ' }), null);
    assert.strictEqual(CM.normalizeObjective({}), null);
    assert.strictEqual(CM.normalizeObjective(null), null);
    assert.strictEqual(CM.normalizeObjective('a string'), null);
  });

  test('normalize: skill from explicit field beats category; category (or fallback) fills in', () => {
    assert.strictEqual(CM.normalize({ skill: 'Reading', category: 'Grammar' }).skill, 'reading');
    assert.strictEqual(CM.normalize({ category: 'Vocabulary' }).skill, 'vocabulary');
    assert.strictEqual(CM.normalize({}, 'Writing').skill, 'writing');
    assert.strictEqual(CM.normalize({ skill: 'foo', category: 'Listening' }).skill, 'listening', 'an unknown skill falls back to the category');
    assert.ok(!('skill' in CM.normalize({ skill: 'foo', category: 'Pronunciation' })), 'nothing resolvable -> no skill key at all');
  });

  test('normalize: numeric fields coerce from strings, junk is dropped, 0 is kept', () => {
    const out = CM.normalize({ difficulty: '3', estimated_time_seconds: '45' });
    assert.strictEqual(out.difficulty, 3);
    assert.strictEqual(out.estimated_time_seconds, 45);
    assert.strictEqual(CM.normalize({ difficulty: 0 }).difficulty, 0, 'a real 0 must survive');
    assert.ok(!('difficulty' in CM.normalize({ difficulty: 'hard' })));
    assert.ok(!('difficulty' in CM.normalize({ difficulty: null })));
    assert.ok(!('estimated_time_seconds' in CM.normalize({ estimated_time_seconds: NaN })));
    assert.ok(!('estimated_time_seconds' in CM.normalize({ estimated_time_seconds: Infinity })));
  });

  test('normalize: cefr upper-cased+trimmed, subskill trimmed, blanks omitted', () => {
    const out = CM.normalize({ cefr: ' b1 ', subskill: '  past tense ' });
    assert.strictEqual(out.cefr, 'B1');
    assert.strictEqual(out.subskill, 'past tense');
    const blank = CM.normalize({ cefr: '  ', subskill: '', objective: '' });
    assert.deepStrictEqual(blank, {});
  });

  test('normalize: non-object input never throws and yields {}; does not mutate its input', () => {
    [null, undefined, 'x', 42, []].forEach((v) => assert.deepStrictEqual(CM.normalize(v), {}));
    const input = { skill: ' Grammar ', cefr: 'a2', difficulty: '2', objective: '  x  y ' };
    const copy = JSON.parse(JSON.stringify(input));
    CM.normalize(input);
    assert.deepStrictEqual(input, copy);
  });

  test('public constants are defensive copies (mutating them cannot corrupt the module)', () => {
    CM.SKILLS.push('bogus');
    CM.CATEGORY_TO_SKILL.bogus = 'bogus';
    assert.strictEqual(CM.normalizeSkill('bogus'), null);
    assert.strictEqual(CM.skillForCategory('bogus'), null);
    assert.strictEqual(CM.SKILLS.length, 7, 'sanity: the pushed copy is the mutated one');
    // a fresh read of the SKILLS getter-less property is still the mutated copy, so reload to prove isolation
    delete fakeWindow.MylingoCanonicalMetadata;
    loadModule('shared/js/canonical-metadata.js');
    assert.deepStrictEqual(fakeWindow.MylingoCanonicalMetadata.SKILLS, ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage']);
  });

  test('module SKILLS list matches skill-mastery.js and recommendations.js (no silent drift)', () => {
    const fs = require('fs');
    const list = (f) => {
      const m = fs.readFileSync(path.join(__dirname, '..', f), 'utf8').match(/var SKILLS = \[([^\]]*)\]/);
      assert.ok(m, f + ': SKILLS list not found');
      return m[1].split(',').map((s) => s.replace(/['"\s]/g, '')).filter(Boolean);
    };
    const canon = ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage'];
    assert.deepStrictEqual(list('shared/js/canonical-metadata.js'), canon);
    assert.deepStrictEqual(list('shared/js/skill-mastery.js'), canon);
    assert.deepStrictEqual(list('shared/js/recommendations.js'), canon);
  });
})();

// ============================================================
console.log('runtime-v2-adapter.js x canonical-metadata.js (Agent 162 fix)');
// ============================================================
(function () {
  function fresh(withCanonical) {
    const w = { localStorage: makeFakeStorage() };
    const fs = require('fs');
    const files = (withCanonical ? ['canonical-metadata'] : []).concat(['runtime-v2-adapter']);
    files.forEach((f) => new Function('global', 'window', fs.readFileSync(path.join(__dirname, '..', 'shared/js', f + '.js'), 'utf8'))(w, w));
    return w.MylingoRuntimeV2;
  }
  const base = { question: 'q', answers: ['a', 'b'], correctIndex: 0 };

  test('padded / mixed-case skill reaches the quiz runtime normalized (was left raw)', () => {
    const q = fresh(true).normalizeQuestion(Object.assign({}, base, { category: 'Grammar', skill: ' Grammar ' }));
    assert.strictEqual(q.skill, 'grammar');
  });

  test('unknown skill falls back to the category instead of being copied through', () => {
    const q = fresh(true).normalizeQuestion(Object.assign({}, base, { category: 'Vocabulary', skill: 'foo' }));
    assert.strictEqual(q.skill, 'vocabulary');
  });

  test('cefr / difficulty / estimated_time_seconds / subskill come out canonical', () => {
    const q = fresh(true).normalizeQuestion(Object.assign({}, base, { cefr: 'b1', difficulty: '3', estimated_time_seconds: '45', subskill: '  tense ' }));
    assert.strictEqual(q.cefr, 'B1');
    assert.strictEqual(q.difficulty, 3);
    assert.strictEqual(q.estimated_time_seconds, 45);
    assert.strictEqual(q.subskill, 'tense');
  });

  test('the normalized skill is one skill-mastery.js will actually count', () => {
    const w = { localStorage: makeFakeStorage() };
    const fs = require('fs');
    ['canonical-metadata', 'runtime-v2-adapter', 'skill-mastery'].forEach((f) => new Function('global', 'window', fs.readFileSync(path.join(__dirname, '..', 'shared/js', f + '.js'), 'utf8'))(w, w));
    const q = w.MylingoRuntimeV2.normalizeQuestion(Object.assign({}, base, { category: 'Grammar', skill: ' Grammar ' }));
    const SM = w.MylingoSkillMastery;
    assert.ok(SM, 'skill-mastery module global not found');
    const store = SM.recordAttempt({ quiz_id: 'qz', level: 'a1', questions: [q], correctMap: { 0: true }, timestamp: 1 }, null);
    const blob = JSON.stringify(store);
    assert.ok(store.skills.grammar && store.skills.grammar.question_count === 1, 'grammar question was not counted: ' + blob);
  });

  test('canonical module absent -> adapter still passes the raw metadata through (documented fallback)', () => {
    const q = fresh(false).normalizeQuestion(Object.assign({}, base, { skill: 'grammar', cefr: 'B1', difficulty: 2 }));
    assert.strictEqual(q.skill, 'grammar');
    assert.strictEqual(q.cefr, 'B1');
    assert.strictEqual(q.difficulty, 2);
  });

  test('already-canonical shipped data is unchanged by the fix (no content regression)', () => {
    const q = fresh(true).normalizeQuestion(Object.assign({}, base, { category: 'Grammar', skill: 'grammar', cefr: 'A2', difficulty: 3, estimated_time_seconds: 180 }));
    assert.strictEqual(q.skill, 'grammar');
    assert.strictEqual(q.cefr, 'A2');
    assert.strictEqual(q.difficulty, 3);
    assert.strictEqual(q.estimated_time_seconds, 180);
  });
})();

// ============================================================
console.log('runtime-v2-adapter.js: question / quiz / hierarchy / manifest (Agent 163)');
// ============================================================
(function () {
  const fs = require('fs');
  const w = { localStorage: makeFakeStorage() };
  ['canonical-metadata', 'runtime-v2-adapter'].forEach((f) => new Function('global', 'window', fs.readFileSync(path.join(__dirname, '..', 'shared/js', f + '.js'), 'utf8'))(w, w));
  const A = w.MylingoRuntimeV2;

  test('module global is frozen and exposes the documented API', () => {
    assert.ok(Object.isFrozen(A));
    ['normalizeQuiz', 'normalizeQuestion', 'normalizeHierarchy', 'flattenActivityToQuiz', 'normalizeManifest'].forEach((k) => assert.strictEqual(typeof A[k], 'function', k));
    assert.deepStrictEqual(A.LEVELS, ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
  });

  test('question text aliases (question / question_text / prompt / content) and trimming', () => {
    ['question', 'question_text', 'prompt', 'content'].forEach((k) => {
      assert.strictEqual(A.normalizeQuestion({ [k]: '  Hi  ', answers: ['a'], correctIndex: 1 }).question, 'Hi', k);
    });
  });

  test('answers: answers[] / options[] / answer_1..N, object options use text|label|value', () => {
    assert.deepStrictEqual(A.normalizeQuestion({ question: 'q', answers: [' a ', 'b'], correctIndex: 1 }).answers, ['a', 'b']);
    assert.deepStrictEqual(A.normalizeQuestion({ question: 'q', options: [{ label: 'x' }, { value: 'y' }, { text: 'z' }], correctIndex: 1 }).answers, ['x', 'y', 'z']);
    assert.deepStrictEqual(A.normalizeQuestion({ question: 'q', answer_1: 'a', answer_2: 'b', answer_3: 'c', correct_index: 3 }).answers, ['a', 'b', 'c']);
  });

  test('correct index: camel/snake aliases, numeric strings, is_correct flags -> 1-based', () => {
    assert.strictEqual(A.normalizeQuestion({ question: 'q', answers: ['a', 'b'], correctIndex: 2 }).correctIndex, 2);
    assert.strictEqual(A.normalizeQuestion({ question: 'q', answers: ['a', 'b'], correct_index: '2' }).correctIndex, 2);
    assert.strictEqual(A.normalizeQuestion({ question: 'q', answers: ['a', 'b'], correctAnswerIndex: 1 }).correctIndex, 1);
    assert.strictEqual(A.normalizeQuestion({ question: 'q', answers: [{ text: 'a' }, { text: 'b', isCorrect: true }] }).correctIndex, 2);
    assert.strictEqual(A.normalizeQuestion({ question: 'q', answers: [{ text: 'a', is_correct: true }, { text: 'b' }] }).correctIndex, 1);
    assert.strictEqual(A.normalizeQuestion({ question: 'q', answers: ['a', 'b'], correct_index: 1.5 }).correctIndex, null, 'a non-integer index is not silently rounded');
  });

  test('legacy option_0 export: zero-based correct_index gets the +1 offset, ordinary one does not', () => {
    assert.strictEqual(A.normalizeQuestion({ question: 'q', options: ['a', 'b', 'c'], option_0: 'a', correct_index: 2 }).correctIndex, 3);
    assert.strictEqual(A.normalizeQuestion({ question: 'q', options: ['a', 'b', 'c'], correct_index: 2 }).correctIndex, 2);
  });

  test('radio questions never leak their option list as acceptedAnswers (Agent 163 fix)', () => {
    ['correct_index', 'correctIndex', 'correctAnswerIndex'].forEach((k) => {
      const q = A.normalizeQuestion({ question: 'q', answers: ['a', 'b', 'c'], [k]: 2 });
      assert.ok(!('acceptedAnswers' in q), k + ' radio question got acceptedAnswers: ' + JSON.stringify(q.acceptedAnswers));
    });
    const flagged = A.normalizeQuestion({ question: 'q', answers: [{ text: 'a' }, { text: 'b', is_correct: true }] });
    assert.ok(!('acceptedAnswers' in flagged), 'is_correct-flagged radio leaked raw answer objects');
  });

  test('text-style questions keep acceptedAnswers: explicit, aliases, scalar wrapped, answers[] fallback', () => {
    assert.deepStrictEqual(A.normalizeQuestion({ question: 'q', question_type: 'fill_in_the_blank', accepted_answers: ['go', 'went'] }).acceptedAnswers, ['go', 'went']);
    assert.deepStrictEqual(A.normalizeQuestion({ question: 'q', question_type: 'fill_in_the_blank', correct_answer: 'go' }).acceptedAnswers, ['go']);
    assert.deepStrictEqual(A.normalizeQuestion({ question: 'q', question_type: 'fill_in_the_blank', answers: ['go', 'went'] }).acceptedAnswers, ['go', 'went'], 'no index at all -> the answers ARE the accepted set');
  });

  test('acceptedAnswers is copied, not aliased (mutating output cannot touch the source)', () => {
    const src = { question: 'q', question_type: 'fill_in_the_blank', acceptedAnswers: ['go'] };
    const q = A.normalizeQuestion(src);
    q.acceptedAnswers.push('x');
    assert.deepStrictEqual(src.acceptedAnswers, ['go']);
  });

  test('question_type: aliases resolved, radio omitted, unknown passed through lower-snake', () => {
    const t = (type) => A.normalizeQuestion({ question: 'q', answers: ['a', 'b'], correctIndex: 1, question_type: type }).question_type;
    assert.strictEqual(t('radio'), undefined);
    assert.strictEqual(t(undefined), undefined);
    assert.strictEqual(t('Comparison'), 'matching');
    assert.strictEqual(t('reorganizer-task'), 'ranking');
    assert.strictEqual(t('complete-question'), 'fill_in_the_blank');
    assert.strictEqual(t('Fill In'), 'fill_in');
  });

  test('media: legacy imageUrl/audioUrl, string form, url/label aliases, src-less entries dropped', () => {
    const m1 = A.normalizeQuestion({ question: 'q', answers: ['a'], correctIndex: 1, imageUrl: 'i.png', imageAlt: 'An apple', audioUrl: 'a.mp3', audioLabel: 'Listen' }).media;
    assert.deepStrictEqual(m1, { image: { src: 'i.png', alt: 'An apple', label: '' }, audio: { src: 'a.mp3', alt: 'Listen', label: 'Listen' } });
    const m2 = A.normalizeQuestion({ question: 'q', answers: ['a'], correctIndex: 1, media: { image: 'i.png' } }).media;
    assert.deepStrictEqual(m2, { image: { src: 'i.png' } });
    const m3 = A.normalizeQuestion({ question: 'q', answers: ['a'], correctIndex: 1, media: { image: { url: 'u.png', label: 'L' } } }).media;
    assert.deepStrictEqual(m3, { image: { src: 'u.png', alt: 'L', label: 'L' } });
    assert.ok(!('media' in A.normalizeQuestion({ question: 'q', answers: ['a'], correctIndex: 1, media: { image: { alt: 'no src' } } })));
  });

  test('questions with structured payloads (pairs, correctIndices, correctOrder, subprompt) pass through', () => {
    const q = A.normalizeQuestion({ question: 'q', question_type: 'matching', pairs: [['a', '1']], subprompt: 'sp', correctOrder: [2, 1] });
    assert.deepStrictEqual(q.pairs, [['a', '1']]);
    assert.strictEqual(q.subprompt, 'sp');
    assert.deepStrictEqual(q.correctOrder, [2, 1]);
    const c = A.normalizeQuestion({ question: 'q', question_type: 'checkbox', answers: ['a', 'b', 'c'], correctIndices: [1, 3] });
    assert.deepStrictEqual(c.correctIndices, [1, 3]);
    assert.ok(!('correctIndex' in c), 'a multi-answer question must not carry a null single correctIndex');
  });

  test('normalizeQuestion rejects non-objects with a clear error', () => {
    [null, undefined, 'x', 5].forEach((v) => assert.throws(() => A.normalizeQuestion(v), /Question must be an object/));
  });

  test('normalizeQuiz: id/title/description aliases, defaults, brand fallback, version coercion', () => {
    const q = A.normalizeQuiz({ quiz_id: ' q1 ', name: ' T ', summary: 'S', version: '3', questions: [] });
    assert.strictEqual(q.id, 'q1'); assert.strictEqual(q.title, 'T'); assert.strictEqual(q.description, 'S');
    assert.strictEqual(q.brand, 'Mylingo'); assert.strictEqual(q.version, 3);
    assert.strictEqual(A.normalizeQuiz({ brand: '   ', questions: [] }).brand, 'Mylingo');
    assert.strictEqual(A.normalizeQuiz({ version: 'x', questions: [] }).version, 1);
  });

  test('normalizeQuiz: question source precedence questions > items > data; none -> []', () => {
    const one = [{ question: 'q', answers: ['a'], correctIndex: 1 }];
    assert.strictEqual(A.normalizeQuiz({ items: one }).questions.length, 1);
    assert.strictEqual(A.normalizeQuiz({ data: one }).questions.length, 1);
    assert.strictEqual(A.normalizeQuiz({ questions: [], items: one }).questions.length, 0, 'an (empty) questions[] still wins');
    assert.deepStrictEqual(A.normalizeQuiz({}).questions, []);
    assert.throws(() => A.normalizeQuiz(null), /Quiz payload must be an object/);
    assert.throws(() => A.normalizeQuiz([]), /Quiz payload must be an object/);
  });

  test('normalizeQuiz: level from payload (case-insensitive), invalid level falls back to options.level then ""', () => {
    assert.strictEqual(A.normalizeQuiz({ level: 'B1', questions: [] }).level, 'b1');
    assert.strictEqual(A.normalizeQuiz({ cefr_level: 'a2', questions: [] }).level, 'a2');
    assert.strictEqual(A.normalizeQuiz({ level: 'z9', questions: [] }, { level: 'c1' }).level, 'c1');
    assert.strictEqual(A.normalizeQuiz({ level: 'z9', questions: [] }).level, '');
    assert.strictEqual(A.normalizeQuiz({ questions: [] }, { level: 'A1' }).level, 'a1');
  });

  test('normalizeQuiz: date metadata passes through only when present', () => {
    const q = A.normalizeQuiz({ dateAdded: '2026-01-01', date_updated: '2026-02-02', questions: [] });
    assert.strictEqual(q.dateAdded, '2026-01-01'); assert.strictEqual(q.date_updated, '2026-02-02');
    assert.ok(!('date_added' in q));
  });

  test('normalizeQuiz does not mutate its input', () => {
    const input = { id: ' x ', level: 'B1', questions: [{ question: ' q ', answers: [' a '], correct_index: 1, skill: ' Grammar ' }] };
    const copy = JSON.parse(JSON.stringify(input));
    A.normalizeQuiz(input);
    assert.deepStrictEqual(input, copy);
  });

  const course = () => ({ course: { id: 'c1', title: 'Course', units: [{ id: 'u1', title: 'U', lessons: [{ id: 'l1', title: 'L', activities: [{ id: 'a1', title: 'A', activity_type: 'quiz', questions: [{ question: 'q', answers: ['x', 'y'], correctIndex: 2 }] }] }] }] } });

  test('normalizeHierarchy: ids/parent links filled, explicit radio type kept visible, activity_type aliased', () => {
    const h = A.normalizeHierarchy(course());
    const unit = h.course.units[0], lesson = unit.lessons[0], act = lesson.activities[0];
    assert.strictEqual(unit.course_id, 'c1'); assert.strictEqual(lesson.unit_id, 'u1'); assert.strictEqual(act.lesson_id, 'l1');
    assert.strictEqual(act.questions[0].question_type, 'radio');
    const noIds = A.normalizeHierarchy({ course: { units: [{ lessons: [{ activities: [{ type: 'comparison', questions: [] }] }] }] } });
    const u = noIds.course.units[0];
    assert.strictEqual(u.id, 'unit-1'); assert.strictEqual(u.lessons[0].id, 'unit-1-lesson-1');
    assert.strictEqual(u.lessons[0].activities[0].id, 'unit-1-lesson-1-activity-1');
    assert.strictEqual(u.lessons[0].activities[0].activity_type, 'matching');
  });

  test('normalizeHierarchy: accepts a bare course object, tolerates junk nodes, rejects non-objects', () => {
    const bare = A.normalizeHierarchy({ id: 'c9', units: [null, { lessons: [7] }] });
    assert.strictEqual(bare.course.id, 'c9');
    assert.strictEqual(bare.course.units.length, 2);
    assert.strictEqual(bare.course.units[1].lessons[0].id, 'unit-2-lesson-1');
    assert.throws(() => A.normalizeHierarchy(null), /Content hierarchy must be an object/);
  });

  test('flattenActivityToQuiz: exactly one activity -> legacy quiz (radio type omitted again)', () => {
    const src = course(); src.level = 'B1'; src.category = 'Grammar';
    const quiz = A.flattenActivityToQuiz(src);
    assert.strictEqual(quiz.id, 'a1'); assert.strictEqual(quiz.title, 'A'); assert.strictEqual(quiz.level, 'b1'); assert.strictEqual(quiz.category, 'Grammar');
    assert.strictEqual(quiz.questions.length, 1);
    assert.ok(!('question_type' in quiz.questions[0]));
    assert.strictEqual(quiz.questions[0].correctIndex, 2);
  });

  test('flattenActivityToQuiz: zero or several activities and missing course are errors', () => {
    const two = course(); two.course.units[0].lessons[0].activities.push({ id: 'a2', questions: [] });
    assert.throws(() => A.flattenActivityToQuiz(two), /exactly one activity/);
    assert.throws(() => A.flattenActivityToQuiz({ course: { units: [] } }), /exactly one activity/);
    assert.throws(() => A.flattenActivityToQuiz({}), /requires a course object/);
    assert.throws(() => A.flattenActivityToQuiz(null), /requires a course object/);
  });

  test('normalizeManifest: non-array -> [], junk entries dropped, coercions and date fields', () => {
    assert.deepStrictEqual(A.normalizeManifest(null), []);
    assert.deepStrictEqual(A.normalizeManifest({}), []);
    const out = A.normalizeManifest([null, 'x', { path: ' f.json ', quiz_id: 'q', name: 'N', level: 'B2', questions: '12', version: 'v', date_added: '2026-01-01' }]);
    assert.strictEqual(out.length, 1);
    assert.deepStrictEqual(out[0], { file: 'f.json', id: 'q', title: 'N', topic: '', description: '', category: '', tags: '', level: 'b2', questions: 12, version: 1, date_added: '2026-01-01' });
    assert.strictEqual(A.normalizeManifest([{ level: 'nope' }])[0].level, '');
    assert.strictEqual(A.normalizeManifest([{ questions: 'x' }])[0].questions, 0);
  });

  test('every shipped quiz payload normalizes without throwing and satisfies the radio invariants', () => {
    const root = path.join(__dirname, '..');
    const problems = []; let quizzes = 0, questions = 0;
    (function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        if (['node_modules', 'tests', 'offline'].includes(e.name) || e.name.startsWith('.')) return;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return walk(full);
        if (!e.name.endsWith('.json')) return;
        let json; try { json = JSON.parse(fs.readFileSync(full, 'utf8')); } catch (err) { return; }
        (function find(o) {
          if (Array.isArray(o)) return o.forEach(find);
          if (!o || typeof o !== 'object') return;
          const qs = o.questions;
          if (Array.isArray(qs) && qs.length && qs[0] && typeof qs[0] === 'object' && ('question' in qs[0] || 'question_text' in qs[0] || 'answers' in qs[0])) {
            quizzes++;
            let n;
            try { n = A.normalizeQuiz(o); } catch (err) { problems.push(path.relative(root, full) + ': ' + err.message); return; }
            n.questions.forEach((q, i) => {
              questions++;
              const type = q.question_type || 'radio';
              if (type !== 'radio') return;
              const where = path.relative(root, full) + ' q' + (i + 1);
              if (!q.answers.length) problems.push(where + ': radio question without answers');
              else if (!Number.isInteger(q.correctIndex) || q.correctIndex < 1 || q.correctIndex > q.answers.length) problems.push(where + ': correctIndex ' + q.correctIndex + ' outside 1..' + q.answers.length);
              if ('acceptedAnswers' in q) problems.push(where + ': radio question carries acceptedAnswers');
            });
          } else Object.values(o).forEach(find);
        })(json);
      });
    })(root);
    assert.ok(quizzes >= 100 && questions >= 500, 'sanity: scan found ' + quizzes + ' quizzes / ' + questions + ' questions');
    assert.deepStrictEqual(problems, [], problems.slice(0, 5).join('; '));
  });
})();

// ============================================================
console.log('runtime-content-loader.js (Agent 163)');
// ============================================================
(function () {
  // The loader memoizes per module instance, so every test loads a fresh copy.
  function fresh(routes) {
    const calls = [];
    const fakeFetch = (url) => {
      calls.push(url);
      const r = typeof routes === 'function' ? routes(url, calls.length) : routes[url];
      if (r === undefined) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('no body')) });
      if (r instanceof Error) return Promise.reject(r);
      return Promise.resolve({ ok: r.status === undefined || (r.status >= 200 && r.status < 300), status: r.status || 200, json: () => Promise.resolve(r.body) });
    };
    delete fakeWindow.MylingoRuntimeContentLoader;
    const saved = globalThis.fetch;
    globalThis.fetch = fakeFetch;
    loadModule('shared/js/runtime-content-loader.js');
    return { L: fakeWindow.MylingoRuntimeContentLoader, calls, restore: () => { globalThis.fetch = saved; if (saved === undefined) delete globalThis.fetch; } };
  }
  async function withLoader(routes, body) {
    const env = fresh(routes);
    try { await body(env.L, env.calls, (r) => { globalThis.fetch = (u) => { env.calls.push(u); const x = r(u, env.calls.length); return x instanceof Error ? Promise.reject(x) : Promise.resolve({ ok: (x.status || 200) < 300, status: x.status || 200, json: () => Promise.resolve(x.body) }); }; }); }
    finally { env.restore(); }
  }
  const rejects = async (p, check) => { let err; try { await p; } catch (e) { err = e; } assert.ok(err, 'expected a rejection'); if (check) check(err); return err; };

  testAsync('loader: grammar route fetches ../grammar/<level>/<id>.json directly (no manifest)', () =>
    withLoader({ '../grammar/b1/q-1.json': { body: { id: 'q-1' } } }, async (L, calls) => {
      assert.deepStrictEqual(await L.load('B1', 'q-1'), { id: 'q-1' });
      assert.deepStrictEqual(calls, ['../grammar/b1/q-1.json']);
    }));

  testAsync('loader: id is URL-encoded; invalid level falls back to a1', () =>
    withLoader({ '../grammar/a1/a%2Fb%20c.json': { body: { ok: 1 } } }, async (L, calls) => {
      assert.deepStrictEqual(await L.load('nonsense', 'a/b c'), { ok: 1 });
      assert.strictEqual(calls[0], '../grammar/a1/a%2Fb%20c.json');
    }));

  testAsync('loader: grammar 404 falls back to the level manifest entry file', () =>
    withLoader({
      '../b1/quizzes.json': { body: [{ id: 'v-1', file: './vocabulary/b1/v-1.json' }] },
      '../vocabulary/b1/v-1.json': { body: { id: 'v-1', kind: 'vocab' } },
    }, async (L, calls) => {
      assert.deepStrictEqual(await L.load('b1', 'v-1'), { id: 'v-1', kind: 'vocab' });
      assert.deepStrictEqual(calls, ['../grammar/b1/v-1.json', '../b1/quizzes.json', '../vocabulary/b1/v-1.json']);
    }));

  testAsync('loader: not in grammar and not in manifest -> Error with status 404', () =>
    withLoader({ '../a1/quizzes.json': { body: [{ id: 'other', file: 'x.json' }, null] } }, async (L) => {
      await rejects(L.load('a1', 'ghost'), (e) => { assert.strictEqual(e.status, 404); assert.match(e.message, /Quiz not found: ghost/); });
    }));

  testAsync('loader: a non-404 grammar failure (500) is reported as-is and does NOT fall through to the manifest', () =>
    withLoader({ '../grammar/a1/q.json': { status: 500 } }, async (L, calls) => {
      await rejects(L.load('a1', 'q'), (e) => assert.strictEqual(e.status, 500));
      assert.deepStrictEqual(calls, ['../grammar/a1/q.json']);
    }));

  testAsync('loader: explicit file bypasses both lookups and strips a leading ./', () =>
    withLoader({ '../vocabulary/a1/x.json': { body: { x: 1 } } }, async (L, calls) => {
      assert.deepStrictEqual(await L.load('a1', 'ignored', './vocabulary/a1/x.json'), { x: 1 });
      assert.deepStrictEqual(calls, ['../vocabulary/a1/x.json']);
    }));

  testAsync('loader: successful loads are memoized (one fetch for repeated calls)', () =>
    withLoader({ '../grammar/a1/q.json': { body: { q: 1 } } }, async (L, calls) => {
      await L.load('a1', 'q'); await L.load('a1', 'q');
      assert.strictEqual(calls.length, 1);
    }));

  testAsync('loader: non-array manifest body is treated as an empty list', () =>
    withLoader({ '../a1/quizzes.json': { body: { not: 'an array' } } }, async (L) => {
      assert.deepStrictEqual(await L.loadManifest('a1'), []);
    }));

  testAsync('loader: a FAILED load is retried on the next call (Agent 163 fix — quiz.html "Try again")', () =>
    withLoader((url, n) => (n === 1 ? new TypeError('Failed to fetch') : { body: { id: 'q' } }), async (L, calls) => {
      await rejects(L.load('a1', 'q'));
      assert.deepStrictEqual(await L.load('a1', 'q'), { id: 'q' }, 'retry must hit the network again, not replay the cached rejection');
      assert.strictEqual(calls.length, 2);
    }));

  testAsync('loader: a FAILED manifest fetch is retried too', () =>
    withLoader((url, n) => (n === 1 ? { status: 503 } : { body: [{ id: 'a' }] }), async (L, calls) => {
      await rejects(L.loadManifest('c1'), (e) => assert.match(e.message, /Quiz manifest unavailable \(503\)/));
      assert.deepStrictEqual(await L.loadManifest('c1'), [{ id: 'a' }]);
      assert.strictEqual(calls.length, 2);
    }));

  testAsync('loader: concurrent callers share one in-flight request; eviction only happens on failure', () =>
    withLoader({ '../grammar/a1/q.json': { body: { q: 1 } } }, async (L, calls) => {
      const [a, b] = await Promise.all([L.load('a1', 'q'), L.load('a1', 'q')]);
      assert.strictEqual(a, b); assert.strictEqual(calls.length, 1);
      await new Promise((r) => setTimeout(r, 0));
      await L.load('a1', 'q');
      assert.strictEqual(calls.length, 1, 'a success must stay cached after the eviction handler has run');
    }));

  testAsync('loader: global is frozen and exposes load/loadManifest', () =>
    withLoader({}, async (L) => { assert.ok(Object.isFrozen(L)); assert.strictEqual(typeof L.load, 'function'); assert.strictEqual(typeof L.loadManifest, 'function'); }));
})();

// ============================================================
console.log('quiz.html inline logic: type/validate/grading/session (Agent 164)');
// ============================================================
(function () {
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  // quiz.html's logic lives in one big inline <script>, so these tests lift the named
  // top-level functions out of the real file (brace-matched, string/comment aware) and run
  // them in a vm sandbox with a fake localStorage. A missing/renamed function fails loudly.
  const html = fs.readFileSync(path.join(root, 'shared', 'quiz.html'), 'utf8');
  const NAMES = ['gp', 'sessionShardKey', 'readSessionIndex', 'writeSessionIndex', 'migrateSessionShards', 'readSessionStore', 'sanitizeSession', 'readSession', 'sessionForCurrentQuiz', 'writeSession', 'clearSession', 'saveSession', 'updateSessionAnswer', 'save', 'questionText', 'rawType', 'normalizeText', 'answerList', 'correctIndexes', 'acceptedAnswers', 'validate', 'gradedTotal', 'submitAnswer'];
  const consts = ['KEY', 'SESSION_KEY', 'LEGACY_SESSION_KEY', 'SESSION_SHARD_PREFIX', 'SESSION_INDEX_KEY'].map((k) => {
    const m = new RegExp('^const ' + k + '=.*;$', 'm').exec(html);
    if (!m) throw new Error('quiz.html: const ' + k + ' not found');
    return m[0];
  }).join('\n');
  const source = consts + '\nlet data,i=0,score=0,locked=false,sessionStartedAt=0,restoringSessionAnswer=false,qGlobalTolerance=0;\n' +
    'const captured=[];function finishAnswer(ok,correctText,input){captured.push({ok:ok,correctText:correctText,input:input});}\n' +
    NAMES.map((n) => extractFn(html, n)).join('\n') +
    '\n({F:{' + NAMES.join(',') + '},captured:captured,K:{KEY:KEY,SESSION_KEY:SESSION_KEY,LEGACY_SESSION_KEY:LEGACY_SESSION_KEY,SESSION_INDEX_KEY:SESSION_INDEX_KEY},' +
    'set:function(k,v){if(k==="data")data=v;else if(k==="i")i=v;else if(k==="score")score=v;else if(k==="locked")locked=v;else if(k==="sessionStartedAt")sessionStartedAt=v;else if(k==="restoringSessionAnswer")restoringSessionAnswer=v;else throw new Error("bad key "+k)}})';
  function sandbox() {
    const ls = makeFakeStorage();
    const env = vm.runInContext(source, vm.createContext({ localStorage: ls, Date, JSON, Math, Number, String, Array, Object, Set, parseInt }));
    // Values built inside the vm context carry that realm's Array/Object prototypes, which
    // deepStrictEqual (correctly) refuses to equate with this realm's literals. Return plain,
    // outer-realm clones from every extracted function so assertions compare data only.
    const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
    const F = {};
    Object.keys(env.F).forEach((k) => { F[k] = (...a) => clone(env.F[k](...a)); });
    return { ls, F, K: env.K, captured: env.captured, set: env.set };
  }
  const S = sandbox();
  const F = S.F;

  // ---------- question typing / answer keys ----------
  test('rawType: default radio, aliases, comparison inferred from its payload', () => {
    assert.strictEqual(F.rawType({}), 'radio');
    assert.strictEqual(F.rawType({ question_type: 'Fill-In' }), 'fill_in');
    assert.strictEqual(F.rawType({ question_type: 'complete-question' }), 'fill_in_the_blank');
    assert.strictEqual(F.rawType({ question_type: 'reorganizer' }), 'ranking');
    assert.strictEqual(F.rawType({ question_type: 'comparison', pairs: [] }), 'matching');
    assert.strictEqual(F.rawType({ question_type: 'comparison', correctIndices: [1] }), 'checkbox');
    assert.strictEqual(F.rawType({ question_type: 'comparison', answer: 'x' }), 'text');
    assert.strictEqual(F.rawType({ question_type: 'comparison' }), 'radio');
  });

  test('correctIndexes: correctIndices filtered to range and sorted; object flags; integer; none', () => {
    assert.deepStrictEqual(F.correctIndexes({ correctIndices: ['3', 1, 9, 0, 'x', 1.5] }, ['a', 'b', 'c']), [1, 3]);
    assert.deepStrictEqual(F.correctIndexes({ answers: [{ text: 'a' }, { text: 'b', is_correct: true }, { text: 'c', isCorrect: true }] }, ['a', 'b', 'c']), [2, 3]);
    assert.deepStrictEqual(F.correctIndexes({ correctIndex: 2 }, ['a', 'b']), [2]);
    assert.deepStrictEqual(F.correctIndexes({ correctIndex: '2' }, ['a', 'b']), [], 'a numeric STRING is not an index here — the adapter must have coerced it');
    assert.deepStrictEqual(F.correctIndexes({}, ['a']), []);
  });

  test('acceptedAnswers: explicit > snake alias > correctAnswer > correct_answer > answer > answers[] (only without an index)', () => {
    assert.deepStrictEqual(F.acceptedAnswers({ acceptedAnswers: ['a'], accepted_answers: ['b'] }), ['a']);
    assert.deepStrictEqual(F.acceptedAnswers({ accepted_answers: ['b'], correctAnswer: 'c' }), ['b']);
    assert.deepStrictEqual(F.acceptedAnswers({ correctAnswer: 'c', correct_answer: 'd' }), ['c']);
    assert.deepStrictEqual(F.acceptedAnswers({ correct_answer: 'd', answer: 'e' }), ['d']);
    assert.deepStrictEqual(F.acceptedAnswers({ answer: 'e' }), ['e']);
    assert.deepStrictEqual(F.acceptedAnswers({ answers: ['x', 'y'] }), ['x', 'y']);
    assert.deepStrictEqual(F.acceptedAnswers({ answers: ['x', 'y'], correctIndex: 1 }), []);
    assert.deepStrictEqual(F.acceptedAnswers({ acceptedAnswers: 'solo' }), ['solo']);
  });

  // ---------- validate ----------
  const radio = (o) => Object.assign({ question: 'q', answers: ['a', 'b'], correctIndex: 1 }, o);
  const v = (...qs) => F.validate({ questions: qs });

  test('validate: envelope errors', () => {
    assert.match(F.validate(null), /not a valid object/);
    assert.match(F.validate({}), /no questions/);
    assert.match(F.validate({ questions: [] }), /no questions/);
    assert.match(v(null), /A question is invalid/);
    assert.match(v(radio({ question: '  ' })), /missing its text/);
  });

  test('validate: choice questions need 2-9 answers and exactly one in-range correct answer', () => {
    assert.strictEqual(v(radio()), null);
    assert.match(v(radio({ answers: ['a'] })), /2–9 answers/);
    assert.match(v(radio({ answers: Array(10).fill('x') })), /2–9 answers/);
    assert.match(v(radio({ correctIndex: 3 })), /invalid correct answer/);
    assert.match(v(radio({ correctIndex: 0 })), /invalid correct answer/);
    assert.match(v(radio({ correctIndex: undefined })), /invalid correct answer/);
    assert.match(v(radio({ correctIndices: [1, 2] })), /invalid correct answer/, 'two correct answers on a radio is invalid');
    assert.strictEqual(v(radio({ question_type: 'dropdown' })), null);
  });

  test('validate: checkbox / text-like / matching / ranking / banner / unknown', () => {
    assert.match(v({ question: 'q', question_type: 'checkbox', answers: ['a', 'b'] }), /at least one correct/);
    assert.strictEqual(v({ question: 'q', question_type: 'checkbox', answers: ['a', 'b'], correctIndices: [1, 2] }), null);
    assert.match(v({ question: 'q', question_type: 'fill_in_the_blank' }), /fill in the blank question is missing its accepted answer/);
    assert.strictEqual(v({ question: 'q', question_type: 'number', acceptedAnswers: [3] }), null);
    assert.match(v({ question: 'q', question_type: 'matching', pairs: [{ left: 'a', right: '1' }] }), /at least 2 pairs/);
    assert.match(v({ question: 'q', question_type: 'matching', pairs: [{ left: 'a', right: '1' }, { left: 'b' }] }), /invalid pair/);
    assert.strictEqual(v({ question: 'q', question_type: 'matching', matches: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] }), null);
    assert.match(v({ question: 'q', question_type: 'ranking', items: ['a'] }), /needs items/);
    assert.strictEqual(v({ question: 'q', question_type: 'ranking', items: ['a', 'b'] }), null, 'no correctOrder -> the authored order is the answer');
    assert.strictEqual(v({ question_type: 'banner' }), null, 'a banner needs no text');
    assert.match(v({ question: 'q', question_type: 'hologram' }), /Unsupported question type: hologram/);
  });

  test('EVERY shipped quiz, after the adapter, passes quiz.html validate() (no learner can hit "Quiz data error")', () => {
    const w = { localStorage: makeFakeStorage() };
    ['canonical-metadata', 'runtime-v2-adapter'].forEach((f) => new Function('global', 'window', fs.readFileSync(path.join(root, 'shared/js', f + '.js'), 'utf8'))(w, w));
    const bad = []; let n = 0;
    (function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        if (['node_modules', 'tests', 'offline'].includes(e.name) || e.name.startsWith('.')) return;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return walk(full);
        if (!e.name.endsWith('.json')) return;
        let json; try { json = JSON.parse(fs.readFileSync(full, 'utf8')); } catch (err) { return; }
        (function find(o) {
          if (Array.isArray(o)) return o.forEach(find);
          if (!o || typeof o !== 'object') return;
          const qs = o.questions;
          if (Array.isArray(qs) && qs.length && qs[0] && typeof qs[0] === 'object' && ('question' in qs[0] || 'question_text' in qs[0] || 'answers' in qs[0])) {
            n++;
            const r = F.validate(w.MylingoRuntimeV2.normalizeQuiz(o));
            if (r) bad.push(path.relative(root, full) + ': ' + r);
          } else Object.values(o).forEach(find);
        })(json);
      });
    })(root);
    assert.ok(n >= 100, 'sanity: validated ' + n + ' quizzes');
    assert.deepStrictEqual(bad, [], bad.slice(0, 5).join('; '));
  });

  // ---------- grading ----------
  function grade(q, input) {
    S.captured.length = 0;
    S.set('data', { questions: [q] }); S.set('i', 0); S.set('locked', false);
    F.submitAnswer(input);
    return S.captured[0];
  }

  test('grading radio/dropdown: right, wrong, and "nothing chosen" is ignored (no grade recorded)', () => {
    const q = radio({ answers: ['a', 'b', 'c'], correctIndex: 2 });
    assert.deepStrictEqual([grade(q, { index: 2 }).ok, grade(q, { index: 2 }).correctText], [true, 'b']);
    assert.strictEqual(grade(q, { index: 1 }).ok, false);
    assert.strictEqual(grade(q, {}), undefined);
    assert.strictEqual(grade(radio({ question_type: 'dropdown', correctIndex: 1 }), { index: 1 }).ok, true);
  });

  test('grading is a no-op while locked (an already-graded question cannot be re-scored)', () => {
    S.captured.length = 0; S.set('data', { questions: [radio()] }); S.set('i', 0); S.set('locked', true);
    F.submitAnswer({ index: 1 });
    assert.strictEqual(S.captured.length, 0);
  });

  test('grading checkbox: exact set, order-insensitive; missing, extra and empty are wrong', () => {
    const q = { question: 'q', question_type: 'checkbox', answers: ['a', 'b', 'c'], correctIndices: [1, 3] };
    assert.strictEqual(grade(q, { indices: [3, 1] }).ok, true);
    assert.strictEqual(grade(q, { indices: ['1', '3'] }).ok, true);
    assert.strictEqual(grade(q, { indices: [1] }).ok, false);
    assert.strictEqual(grade(q, { indices: [1, 2, 3] }).ok, false);
    assert.strictEqual(grade(q, {}).ok, false);
    assert.strictEqual(grade(q, { indices: [1, 3] }).correctText, 'a, c');
  });

  test('grading text/fill-in: case, spacing and trimming ignored; any accepted answer wins; blank is wrong', () => {
    const q = { question: 'q', question_type: 'fill_in_the_blank', acceptedAnswers: ['Went', 'has gone'] };
    assert.strictEqual(grade(q, { value: '  WENT ' }).ok, true);
    assert.strictEqual(grade(q, { value: 'has   gone' }).ok, true);
    assert.strictEqual(grade(q, { value: 'go' }).ok, false);
    assert.strictEqual(grade(q, { value: '' }).ok, false);
    assert.strictEqual(grade(q, { value: 'go' }).correctText, 'Went');
  });

  test('grading number: tolerance honoured, non-numeric wrong, BLANK / whitespace wrong (Agent 164 fix)', () => {
    const q = { question: 'q', question_type: 'number', acceptedAnswers: [0], tolerance: 0.5 };
    assert.strictEqual(grade(q, { value: '0.4' }).ok, true);
    assert.strictEqual(grade(q, { value: '0.6' }).ok, false);
    assert.strictEqual(grade(q, { value: 'abc' }).ok, false);
    assert.strictEqual(grade(q, { value: '' }).ok, false, 'an empty box is not the answer 0');
    assert.strictEqual(grade(q, { value: '   ' }).ok, false);
    assert.strictEqual(grade({ question: 'q', question_type: 'number', acceptedAnswers: [3] }, { value: '3' }).ok, true);
  });

  test('grading date: exact string match', () => {
    const q = { question: 'q', question_type: 'date', acceptedAnswers: ['2026-01-02'] };
    assert.strictEqual(grade(q, { value: '2026-01-02' }).ok, true);
    assert.strictEqual(grade(q, { value: '2026-01-03' }).ok, false);
  });

  test('grading matching: order-insensitive, all pairs needed, extra/short answers wrong', () => {
    const q = { question: 'q', question_type: 'matching', pairs: [{ left: 'cat', right: 'gato' }, { left: 'dog', right: 'perro' }] };
    assert.strictEqual(grade(q, { matching: [{ left: 'Dog', right: 'Perro' }, { left: 'cat', right: 'gato' }] }).ok, true);
    assert.strictEqual(grade(q, { matching: [{ left: 'cat', right: 'gato' }] }).ok, false);
    assert.strictEqual(grade(q, { matching: [{ left: 'cat', right: 'perro' }, { left: 'dog', right: 'gato' }] }).ok, false);
    assert.strictEqual(grade(q, {}).ok, false);
  });

  test('grading ranking: order matters, correctOrder > items > answers, normalized text', () => {
    assert.strictEqual(grade({ question: 'q', question_type: 'ranking', items: ['a', 'b', 'c'] }, { ranking: ['a', 'b', 'c'] }).ok, true);
    assert.strictEqual(grade({ question: 'q', question_type: 'ranking', items: ['a', 'b', 'c'] }, { ranking: ['b', 'a', 'c'] }).ok, false);
    assert.strictEqual(grade({ question: 'q', question_type: 'ranking', items: ['x', 'y'], correctOrder: ['y', 'x'] }, { ranking: ['Y', ' x'] }).ok, true);
    assert.strictEqual(grade({ question: 'q', question_type: 'ranking', answers: ['a', 'b'] }, { ranking: ['a', 'b'] }).ok, true);
    assert.strictEqual(grade({ question: 'q', question_type: 'ranking', items: ['a', 'b'] }, {}).ok, false);
  });

  test('grading banner: always ok', () => { assert.strictEqual(grade({ question_type: 'banner' }, {}).ok, true); });

  test('gradedTotal excludes banners and tolerates missing data', () => {
    S.set('data', { questions: [radio(), { question_type: 'banner' }, radio()] });
    assert.strictEqual(F.gradedTotal(), 2);
    S.set('data', undefined);
    assert.strictEqual(F.gradedTotal(), 0);
  });

  // ---------- sessions ----------
  function freshSession() { const s = sandbox(); return s; }
  const goodSession = (over) => Object.assign({ version: 1, quizId: 'q1', quizVersion: '1', questionIndex: 1, answers: [null, null, null], score: 1, status: 'in-progress', startedAt: 1, updatedAt: 2 }, over);

  test('session: write -> read round-trips through a per-quiz shard and the index; delete removes both', () => {
    const s = freshSession();
    assert.strictEqual(s.F.writeSession('q1', goodSession()), true);
    assert.deepStrictEqual(s.F.readSession('q1'), goodSession());
    assert.deepStrictEqual(JSON.parse(s.ls.getItem(s.K.SESSION_INDEX_KEY)).quizIds, ['q1']);
    s.F.writeSession('q1', goodSession({ score: 2 }));
    assert.deepStrictEqual(JSON.parse(s.ls.getItem(s.K.SESSION_INDEX_KEY)).quizIds, ['q1'], 'index must not duplicate ids');
    s.F.writeSession('q1', null);
    assert.strictEqual(s.F.readSession('q1'), null);
    assert.deepStrictEqual(JSON.parse(s.ls.getItem(s.K.SESSION_INDEX_KEY)).quizIds, []);
  });

  test('session: quiz ids with odd characters get distinct, encoded shard keys', () => {
    const s = freshSession();
    s.F.writeSession('a/b', goodSession({ quizId: 'a/b' })); s.F.writeSession('a b', goodSession({ quizId: 'a b', score: 0 }));
    assert.strictEqual(s.F.readSession('a/b').quizId, 'a/b');
    assert.strictEqual(s.F.readSession('a b').score, 0);
    assert.strictEqual(s.F.writeSession('', goodSession()), false);
    assert.strictEqual(s.F.readSession(''), null);
  });

  test('sanitizeSession rejects every malformed shape', () => {
    const ok = goodSession();
    assert.ok(s0().sanitizeSession(ok));
    [null, 'x', { ...ok, version: 2 }, { ...ok, status: 'done' }, { ...ok, quizId: 5 }, { ...ok, quizVersion: 1 }, { ...ok, questionIndex: 1.5 }, { ...ok, answers: 'no' }, { ...ok, score: NaN }, { ...ok, startedAt: 'now' }, { ...ok, updatedAt: null }]
      .forEach((bad) => assert.strictEqual(s0().sanitizeSession(bad), null, JSON.stringify(bad)));
    function s0() { return S.F; }
  });

  test('session: corrupt shard JSON reads as no session instead of throwing', () => {
    const s = freshSession();
    s.ls.setItem(s.K.SESSION_INDEX_KEY, JSON.stringify({ version: 1, quizIds: ['q1'] }));
    s.ls.setItem('mylingo.sessions.v3.q1', '{not json');
    assert.strictEqual(s.F.readSession('q1'), null);
    assert.deepStrictEqual(s.F.readSessionStore().sessions, {});
    s.ls.setItem(s.K.SESSION_INDEX_KEY, '{also not json');
    assert.deepStrictEqual(s.F.readSessionStore().sessions, {});
  });

  test('session migration: v2 blob and legacy v1 session move into shards, old keys removed', () => {
    const v2 = freshSession();
    v2.ls.setItem(v2.K.SESSION_KEY, JSON.stringify({ version: 2, sessions: { qa: goodSession({ quizId: 'qa' }), qb: goodSession({ quizId: 'qb' }) } }));
    assert.deepStrictEqual(v2.F.migrateSessionShards().quizIds, ['qa', 'qb']);
    assert.strictEqual(v2.ls.getItem(v2.K.SESSION_KEY), null);
    assert.strictEqual(v2.F.readSession('qb').quizId, 'qb');
    const v1 = freshSession();
    v1.ls.setItem(v1.K.LEGACY_SESSION_KEY, JSON.stringify(goodSession({ quizId: 'old' })));
    assert.deepStrictEqual(v1.F.migrateSessionShards().quizIds, ['old']);
    assert.strictEqual(v1.ls.getItem(v1.K.LEGACY_SESSION_KEY), null);
    assert.strictEqual(v1.F.readSession('old').quizId, 'old');
  });

  test('sessionForCurrentQuiz: valid resumes; version / length / index / score mismatches clear it', () => {
    const mk = () => { const s = freshSession(); s.set('data', { id: 'q1', version: 1, questions: [radio(), radio(), radio()] }); return s; };
    let s = mk(); s.F.writeSession('q1', goodSession());
    assert.ok(s.F.sessionForCurrentQuiz(), 'a matching session resumes');
    [{ quizVersion: '2' }, { answers: [null] }, { questionIndex: 3 }, { questionIndex: -1 }, { score: 4 }, { score: -1 }].forEach((over) => {
      s = mk(); s.F.writeSession('q1', goodSession(over));
      assert.strictEqual(s.F.sessionForCurrentQuiz(), null, JSON.stringify(over));
      assert.strictEqual(s.F.readSession('q1'), null, 'a stale session must be deleted, not left to be re-tried: ' + JSON.stringify(over));
    });
  });

  test('saveSession / updateSessionAnswer persist position, score and per-question answers', () => {
    const s = freshSession();
    s.set('data', { id: 'q1', version: 2, questions: [radio(), radio(), radio()] });
    s.set('sessionStartedAt', 100); s.set('i', 0); s.set('score', 0);
    s.F.updateSessionAnswer({ index: 1 }, true, 'a');
    let cur = s.F.readSession('q1');
    assert.strictEqual(cur.quizVersion, '2');
    assert.strictEqual(cur.answers.length, 3);
    assert.deepStrictEqual([cur.answers[0].correct, cur.answers[0].correctText, cur.answers[1]], [true, 'a', null]);
    s.set('i', 1); s.set('score', 1);
    s.F.saveSession();
    cur = s.F.readSession('q1');
    assert.strictEqual(cur.questionIndex, 1); assert.strictEqual(cur.score, 1);
    assert.strictEqual(cur.answers[0].correct, true, 'saving the next position must keep earlier answers');
    assert.strictEqual(cur.startedAt, 100);
    s.set('restoringSessionAnswer', true);
    s.F.updateSessionAnswer({ index: 2 }, false, 'b');
    assert.strictEqual(s.F.readSession('q1').answers[1], null, 'replaying a restored answer must not rewrite the session');
  });

  test('saveSession does nothing before a run has started or without data', () => {
    const s = freshSession();
    s.F.saveSession();
    s.set('data', { id: 'q1', questions: [radio()] });
    s.F.saveSession();
    assert.strictEqual(s.F.readSession('q1'), null);
  });

  test('save(): in-progress keeps best/latest, completion records pct/best/attempts, retakes never lower best', () => {
    const s = freshSession();
    const q = (n) => Array.from({ length: n }, () => radio());
    s.set('data', { id: 'q1', title: 'T', level: 'a1', version: 1, questions: q(4).concat([{ question_type: 'banner' }]) });
    s.set('i', 2); s.set('score', 1);
    s.F.save(false);
    let rec = JSON.parse(s.ls.getItem(s.K.KEY)).q1;
    assert.deepStrictEqual([rec.status, rec.current, rec.latest, rec.best, rec.attempts, rec.totalQuestions], ['in-progress', 2, null, null, 0, 5]);
    s.set('score', 3); s.F.save(true);
    rec = JSON.parse(s.ls.getItem(s.K.KEY)).q1;
    assert.deepStrictEqual([rec.status, rec.current, rec.latest, rec.best, rec.attempts], ['completed', 5, 75, 75, 1], 'banner is not graded: 3/4 = 75');
    s.set('score', 1); s.F.save(true);
    rec = JSON.parse(s.ls.getItem(s.K.KEY)).q1;
    assert.deepStrictEqual([rec.latest, rec.best, rec.attempts], [25, 75, 2]);
    s.set('i', 0); s.F.save(false);
    rec = JSON.parse(s.ls.getItem(s.K.KEY)).q1;
    assert.deepStrictEqual([rec.latest, rec.best, rec.attempts], [25, 75, 2], 'restarting must not wipe the recorded scores');
  });

  test('save(): a quiz with no graded questions completes at 100%; corrupt progress JSON is survived', () => {
    const s = freshSession();
    s.set('data', { id: 'b', title: 'B', level: 'a1', questions: [{ question_type: 'banner' }] });
    s.F.save(true);
    assert.strictEqual(JSON.parse(s.ls.getItem(s.K.KEY)).b.latest, 100);
    s.ls.setItem(s.K.KEY, '{corrupt');
    assert.deepStrictEqual(s.F.gp(), {});
    s.F.save(true);
    assert.strictEqual(JSON.parse(s.ls.getItem(s.K.KEY)).b.attempts, 1);
  });

  test('progress records written by save() satisfy course-progress isMastered thresholds', () => {
    const s = freshSession();
    s.set('data', { id: 'q1', title: 'T', level: 'a1', version: 1, questions: [radio(), radio()] });
    s.set('score', 2); s.F.save(true);
    const rec = JSON.parse(s.ls.getItem(s.K.KEY)).q1;
    assert.ok(rec.status === 'completed' && rec.best >= 60, 'a perfect run must count as mastered (status completed, best >= 60)');
  });

  // ---------- result screen: level recommendation, titles, redirect safety ----------
  const clone2 = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  function levelSandbox(level, redirect, storage) {
    const names = ['isSafeRedirect', 'homeUrl', 'backTarget', 'recommendation', 'congratsTitle', 'orientationEstimate'];
    const src = 'const level=' + JSON.stringify(level) + ',redirect=' + JSON.stringify(redirect) + ";const LEVELS=['a1','a2','b1','b2','c1','c2'];\n" +
      names.map((n) => extractFn(html, n)).join('\n') + '\n({' + names.join(',') + '})';
    const env = vm.runInContext(src, vm.createContext({ window: {}, localStorage: storage || makeFakeStorage(), JSON, String, RegExp }));
    const out = {};
    Object.keys(env).forEach((k) => { out[k] = (...a) => clone2(env[k](...a)); });
    return out;
  }

  test('recommendation: >=85 suggests the next level, <50 the previous, otherwise stay; edges of the ladder never point off it', () => {
    const b1 = levelSandbox('b1', '');
    assert.strictEqual(b1.recommendation(85).label, 'Go to B2');
    assert.strictEqual(b1.recommendation(84).label, 'Continue');
    assert.strictEqual(b1.recommendation(50).label, 'Continue');
    assert.strictEqual(b1.recommendation(49).label, 'Go to A2');
    assert.strictEqual(b1.recommendation(49).cls, 'down');
    assert.strictEqual(b1.recommendation(100).href, '../b2/index.html');
    assert.strictEqual(levelSandbox('c2', '').recommendation(100).label, 'Continue', 'nothing above C2');
    assert.strictEqual(levelSandbox('a1', '').recommendation(0).label, 'Continue', 'nothing below A1');
  });

  test('congratsTitle tier boundaries', () => {
    const f = levelSandbox('a1', '').congratsTitle;
    assert.deepStrictEqual([100, 99, 80, 79, 60, 59, 0].map(f), ['Perfect score!', 'Excellent!', 'Excellent!', 'Good work!', 'Good work!', 'Keep practicing!', 'Keep practicing!']);
  });

  test('backTarget: a safe ../ redirect is honoured; absolute, protocol-relative and missing fall back to the level home', () => {
    assert.strictEqual(levelSandbox('b1', '../courses/course.html?level=b1').backTarget(), '../courses/course.html?level=b1');
    ['https://evil.example/', '//evil.example', 'javascript:alert(1)', '/abs/path', '', null].forEach((r) => {
      assert.strictEqual(levelSandbox('b1', r).backTarget(), './../b1/index.html', String(r));
    });
  });

  test('orientationEstimate: stored estimate/recommended/level in that order, corrupt JSON and empty fall back to the quiz level', () => {
    const mk = (v) => { const ls = makeFakeStorage(); if (v !== undefined) ls.setItem('mylingo.orientation.v1', v); return levelSandbox('a2', '', ls).orientationEstimate(); };
    assert.strictEqual(mk(JSON.stringify({ estimated_level: 'b1', recommendedLevel: 'c1' })), 'b1');
    assert.strictEqual(mk(JSON.stringify({ recommendedLevel: 'c1', level: 'b2' })), 'c1');
    assert.strictEqual(mk(JSON.stringify({ level: 'b2' })), 'b2');
    assert.strictEqual(mk('{oops'), 'a2');
    assert.strictEqual(mk(undefined), 'a2');
    assert.strictEqual(mk('null'), 'a2');
  });
})();

// ============================================================
console.log('placement.js decision engine + quiz.html saveAssessmentResult (Agent 165)');
// ============================================================
(function () {
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const placementSrc = fs.readFileSync(path.join(root, 'shared/js/placement.js'), 'utf8');
  function freshPlacement(storage) {
    const w = { localStorage: storage === undefined ? makeFakeStorage() : storage };
    new Function('global', 'window', placementSrc)(w, w);
    return { P: w.MylingoPlacement, w };
  }
  const { P } = freshPlacement();
  const cid = (n, correct, extra) => Object.assign({ question_id: 'q' + n, quiz_id: 'z', skill: 'grammar', correct, stage: 'primary' }, extra);

  test('scoreBand: exact boundaries, and NO gaps between bands (Agent 165 fix: 89.9995 was "Very weak")', () => {
    const key = (s) => P.scoreBand(s).key;
    assert.deepStrictEqual([100, 90, 89.999, 89.9995, 80, 79.9995, 60, 59.9995, 40, 39.9995, 0].map(key),
      ['strong', 'strong', 'secure', 'secure', 'secure', 'developing', 'developing', 'weak', 'weak', 'very_weak', 'very_weak']);
    assert.deepStrictEqual([-5, 250, NaN, undefined, 'abc', null].map(key), ['very_weak', 'strong', 'very_weak', 'very_weak', 'very_weak', 'very_weak'], 'out-of-range clamps; junk is 0');
    for (let s = 0; s <= 100; s += 0.05) {
      const exp = s >= 90 ? 'strong' : s >= 80 ? 'secure' : s >= 60 ? 'developing' : s >= 40 ? 'weak' : 'very_weak';
      assert.strictEqual(key(s), exp, 'score ' + s);
    }
  });

  test('normalizeLevel / adjacentLevel: case-insensitive, junk -> a1, clamped at both ends', () => {
    assert.deepStrictEqual(['B1', ' b1', 'z9', '', null, undefined].map(P.normalizeLevel), ['b1', 'a1', 'a1', 'a1', 'a1', 'a1']);
    assert.strictEqual(P.adjacentLevel('b1', 1), 'b2'); assert.strictEqual(P.adjacentLevel('b1', -1), 'a2');
    assert.strictEqual(P.adjacentLevel('c2', 1), 'c2'); assert.strictEqual(P.adjacentLevel('a1', -1), 'a1');
  });

  test('decideAssessmentPath: high confidence = single direct level; otherwise a boundary check with one adjacent level', () => {
    assert.deepStrictEqual(P.decideAssessmentPath({ estimated_level: 'b1', confidence: 'high' }), { primary_level: 'b1', secondary_level: null, reason: 'direct_measurement' });
    assert.deepStrictEqual(P.decideAssessmentPath({ estimated_level: 'b1' }), { primary_level: 'b1', secondary_level: 'b2', reason: 'boundary_check' });
    assert.strictEqual(P.decideAssessmentPath({ estimated_level: 'b1', estimate_confidence: 'HIGH' }).secondary_level, null, 'estimate_confidence alias, case-insensitive');
    assert.strictEqual(P.decideAssessmentPath({ estimated_level: 'c2', confidence: 'low' }).secondary_level, 'c1', 'no level above C2 -> check downward');
    assert.deepStrictEqual(P.decideAssessmentPath(null), { primary_level: 'a1', secondary_level: 'a2', reason: 'boundary_check' });
  });

  test('decideVerificationPath: 85+ upper, <50 lower, 50-84 none; never past the ends of the ladder', () => {
    const d = (a, s) => P.decideVerificationPath({ assessed_level: a, score: s });
    assert.deepStrictEqual(d('b1', 85), { level: 'b2', direction: 'upper', reason: 'upper_boundary' });
    assert.strictEqual(d('b1', 84.99).direction, 'none');
    assert.strictEqual(d('b1', 50).direction, 'none');
    assert.deepStrictEqual(d('b1', 49.99), { level: 'a2', direction: 'lower', reason: 'lower_boundary' });
    assert.strictEqual(d('c2', 100).direction, 'none'); assert.strictEqual(d('a1', 0).direction, 'none');
    assert.strictEqual(d('b1', 100).level, 'b2');
  });

  test('decideFromPerformance: needs complete + >=5 graded; boundaries move one level; ladder ends hold; boundary_check flag', () => {
    const d = (o) => P.decideFromPerformance(Object.assign({ assessed_level: 'b1', score: 70, graded_questions: 10 }, o));
    assert.deepStrictEqual(d({}), { recommended_level: 'b1', reason: 'score_in_band', boundary_check: false });
    assert.deepStrictEqual(d({ graded_questions: 4 }), { recommended_level: 'b1', reason: 'insufficient_evidence', boundary_check: false });
    assert.strictEqual(d({ complete: false, score: 100 }).reason, 'insufficient_evidence');
    assert.deepStrictEqual(d({ score: 85 }), { recommended_level: 'b2', reason: 'upper_boundary', boundary_check: true });
    assert.deepStrictEqual(d({ score: 49 }), { recommended_level: 'a2', reason: 'lower_boundary', boundary_check: true });
    assert.strictEqual(d({ assessed_level: 'c2', score: 100 }).recommended_level, 'c2');
    assert.strictEqual(d({ assessed_level: 'a1', score: 0 }).recommended_level, 'a1');
    assert.strictEqual(d({ score: 84 }).boundary_check, false);
  });

  test('finalizeVerification: decides from the VERIFICATION level/score, relabels score_in_band, clamps scores', () => {
    const r = P.finalizeVerification({ primary_level: 'b1', primary_score: 90, verification_level: 'b2', verification_score: 70, graded_questions: 10, complete: true });
    assert.deepStrictEqual(r, { recommended_level: 'b2', reason: 'verified_boundary', confidence: 'high', primary_level: 'b1', primary_score: 90, verification_level: 'b2', verification_score: 70 });
    assert.strictEqual(P.finalizeVerification({ verification_level: 'b2', verification_score: 20, graded_questions: 10, primary_score: 500 }).recommended_level, 'b1', 'low verification score steps down from the verified level');
    assert.strictEqual(P.finalizeVerification({ verification_level: 'b2', verification_score: 20, graded_questions: 10, primary_score: 500 }).primary_score, 100);
    assert.strictEqual(P.finalizeVerification({ verification_level: 'b2', verification_score: 70, graded_questions: 2 }).reason, 'insufficient_evidence');
  });

  test('confidenceFor: low (incomplete / <5 graded / conflicting), medium (5-7 graded or within 5 of a boundary), high otherwise', () => {
    const c = (o) => P.confidenceFor(Object.assign({ graded_questions: 10, score: 70 }, o));
    assert.strictEqual(c({}), 'high');
    assert.strictEqual(c({ complete: false }), 'low'); assert.strictEqual(c({ graded_questions: 4 }), 'low'); assert.strictEqual(c({ conflicting_signals: true }), 'low');
    assert.strictEqual(c({ graded_questions: 5 }), 'medium'); assert.strictEqual(c({ graded_questions: 7 }), 'medium'); assert.strictEqual(c({ graded_questions: 8 }), 'high');
    assert.deepStrictEqual([79.99, 80, 85, 100].map((s) => c({ score: s })), ['high', 'medium', 'medium', 'medium'], 'upper caution zone starts 5 below the 85 line');
    assert.deepStrictEqual([55, 54.99, 50, 0].map((s) => c({ score: s })), ['high', 'medium', 'medium', 'medium'], 'lower caution zone ends 5 above the 50 line');
  });

  test('buildEvidence: graded boolean answers only, banners skipped, id fallback, skill/stage normalized', () => {
    const qs = [{ id: 'A', skill: 'Grammar' }, { question_type: 'banner' }, { skill: 'nonsense' }, { question_type: 'Multiple-Choice' }, { id: '  ' }];
    const ev = P.buildEvidence(qs, { 0: true, 1: true, 2: false, 3: 'yes', 4: true }, ' quiz-1 ', 'Verification');
    assert.deepStrictEqual(ev, [
      { question_id: 'A', quiz_id: 'quiz-1', skill: 'grammar', correct: true, stage: 'verification' },
      { question_id: 'quiz-1:2', quiz_id: 'quiz-1', skill: null, correct: false, stage: 'verification' },
      { question_id: 'quiz-1:4', quiz_id: 'quiz-1', skill: null, correct: true, stage: 'verification' },
    ]);
    assert.strictEqual(P.calculateResult({ score: 65 }).score_band, 'Developing', 'calculateResult reports the display LABEL (resolvePlacement reports the key)');
    assert.deepStrictEqual(P.buildEvidence('nope', {}, 'q'), []);
    assert.strictEqual(P.buildEvidence([{}], null, '', undefined).length, 0, 'no map = nothing graded');
    assert.strictEqual(P.buildEvidence([{}], { 0: true }, '', undefined)[0].stage, 'primary');
    assert.strictEqual(P.buildEvidence([{}], { 0: true }, '', undefined)[0].quiz_id, null);
  });

  test('mergePlacementEvidence: duplicate ids never inflate totals, first correctness wins, quiz ids / stages / skill are unioned', () => {
    const merged = P.mergePlacementEvidence(
      [cid(1, true, { skill: null }), cid(2, false)],
      [cid(1, false, { skill: 'vocabulary', quiz_id: 'v', stage: 'verification' }), cid(3, true, { stage: 'verification', quiz_id: 'v' }), null, 'x', { question_id: '  ' }]);
    assert.strictEqual(merged.length, 3);
    const q1 = merged[0];
    assert.strictEqual(q1.correct, true, 'the original correctness stands for a repeated question');
    assert.deepStrictEqual(q1.quiz_ids, ['z', 'v']); assert.deepStrictEqual(q1.stages, ['primary', 'verification']); assert.strictEqual(q1.skill, 'vocabulary', 'a missing skill is filled from the duplicate');
    assert.deepStrictEqual(P.mergePlacementEvidence(null, undefined), []);
    const legacy = P.mergePlacementEvidence([{ question_id: 'a', stages: ['Primary'], quiz_ids: [7], correct: 1 }], []);
    assert.deepStrictEqual([legacy[0].stages, legacy[0].quiz_ids, legacy[0].correct], [['primary'], ['7'], true]);
  });

  test('skill profiles: a skill needs >=2 items to be reported, unknown skills ignored, percentages rounded', () => {
    const ev = [cid(1, true), cid(2, false), cid(3, true), cid(4, true, { skill: 'reading' }), cid(5, true, { skill: 'bogus' })];
    const prof = P.calculateEvidenceSkillProfile(ev);
    assert.strictEqual(prof.skills.grammar, 67); assert.strictEqual(prof.skills.reading, null); assert.deepStrictEqual(prof.counts, { grammar: 3, reading: 1 });
    assert.strictEqual(P.calculateEvidenceSkillProfile(null).skills.grammar, null);
    const old = P.calculateSkillProfile([{ skill: 'Writing' }, { skill: 'writing' }, { skill: 'x' }, null], { 0: true, 1: false });
    assert.deepStrictEqual([old.skills.writing, old.counts], [50, { writing: 2 }]);
  });

  test('coverageReport: counts real skills (banners excluded), lists what the blueprint still needs', () => {
    const many = (skill, n) => Array.from({ length: n }, () => ({ skill }));
    const ok = P.coverageReport([].concat(many('grammar', 4), many('vocabulary', 1), many('reading', 1), many('writing', 1), [{ skill: 'usage', question_type: 'banner' }]));
    assert.strictEqual(ok.meets_blueprint, true); assert.strictEqual(ok.skill_counts.usage, 0, 'banner not counted'); assert.strictEqual(ok.total_questions, 7);
    assert.ok(!P.coverageReport([].concat(many('grammar', 3), many('vocabulary', 1), many('reading', 1), many('writing', 1))).meets_blueprint, 'grammar needs 4');
    const none = P.coverageReport([]);
    assert.deepStrictEqual(none.missing.slice().sort(), ['grammar', 'reading', 'vocabulary', 'writing_or_usage']);
    assert.strictEqual(none.claimable_cefr_evidence, false);
    assert.strictEqual(P.coverageReport(many('usage', 1).concat(many('grammar', 4), many('vocabulary', 1), many('reading', 1))).meets_blueprint, true, 'usage satisfies the writing_or_usage compound rule');
    assert.ok(P.coverageReport([]).unavailable_skills.listening, 'listening is reported as unavailable, not silently missing');
  });

  test('calculate120Placement: mastery ladder A1 -> A2 -> B1 at 70%, ceiling B1, unknown levels ignored', () => {
    const build = (a1, a2, b1) => { const qs = [], map = {}; let n = 0; [['a1', a1], ['a2', a2], ['b1', b1]].forEach(([lv, correct]) => { for (let k = 0; k < 10; k++) { qs.push({ placement_level: lv }); map[n++] = k < correct; } }); qs.push({ placement_level: 'c1' }); map[n++] = true; return P.calculate120Placement(qs, map); };
    assert.strictEqual(build(6, 10, 10).recommended_level, 'a1', 'a1 below 70 stops the ladder however well higher bands went');
    assert.strictEqual(build(7, 6, 10).recommended_level, 'a2');
    assert.strictEqual(build(7, 7, 6).recommended_level, 'a2');
    assert.strictEqual(build(7, 7, 7).recommended_level, 'b1'); assert.strictEqual(build(10, 10, 10).recommended_level, 'b1', 'never above the B1 ceiling');
    const r = build(7, 7, 7); assert.deepStrictEqual([r.scores, r.question_count, r.correct_count], [{ a1: 70, a2: 70, b1: 70 }, 30, 21]);
    const cefr = P.calculate120Placement([{ cefr: 'A1' }], { 0: true }); assert.strictEqual(cefr.bands.a1.total, 1, 'cefr is the fallback for placement_level');
    const empty = P.calculate120Placement(undefined, undefined); assert.deepStrictEqual([empty.recommended_level, empty.scores, empty.confidence], ['a1', { a1: 0, a2: 0, b1: 0 }, 'low']);
  });

  test('calculateResult: normalizes, merges supplied evidence, defaults graded count, clamps and rounds the score', () => {
    const qs = [{ skill: 'grammar' }, { skill: 'grammar' }, { question_type: 'banner' }, { skill: 'reading' }];
    const r = P.calculateResult({ estimated_level: 'B1', assessed_level: 'b1', score: 72.456, questions: qs, correctMap: { 0: true, 1: false, 3: true }, quiz_id: 'qz', timestamp: 42 });
    assert.deepStrictEqual([r.estimated_level, r.assessed_level, r.recommended_level, r.score, r.score_band, r.graded_questions, r.timestamp, r.complete], ['b1', 'b1', 'b1', 72.46, 'Developing', 3, 42, true]);
    assert.strictEqual(r.evidence_question_count, 3); assert.strictEqual(r.evidence_correct_count, 2); assert.deepStrictEqual(r.evidence_quiz_ids, ['qz']); assert.deepStrictEqual(r.evidence_stages, ['primary']);
    assert.strictEqual(r.skills.grammar, 50); assert.strictEqual(r.skills.reading, null);
    const fromEv = P.calculateResult({ assessed_level: 'a2', score: 999, graded_questions: 10, evidence: [cid(1, true), cid(1, false)], questions: [] });
    assert.deepStrictEqual([fromEv.score, fromEv.evidence_question_count, fromEv.recommended_level, fromEv.boundary_reason], [100, 1, 'b1', 'upper_boundary']);
    const partial = P.calculateResult({ assessed_level: 'a2', score: 100, graded_questions: 10, complete: false });
    assert.deepStrictEqual([partial.complete, partial.confidence, partial.boundary_reason, partial.recommended_level], [false, 'low', 'insufficient_evidence', 'a2']);
    assert.ok(Math.abs(P.calculateResult({}).timestamp - Date.now()) < 5000, 'timestamp defaults to now');
  });

  test('resolvePlacement primary stage: insufficient evidence is provisional, boundaries ask for ONE verification, mid-scores are final', () => {
    const r = (o) => P.resolvePlacement(Object.assign({ estimated_level: 'b1', assessed_level: 'b1', score: 70, graded_questions: 10, stage: 'primary' }, o));
    assert.deepStrictEqual([r({}).action, r({}).finality, r({}).recommended_level, r({}).verification_level], ['complete', 'final', 'b1', null]);
    assert.deepStrictEqual([r({ graded_questions: 4 }).action, r({ graded_questions: 4 }).reason, r({ graded_questions: 4 }).finality], ['complete_more_questions', 'insufficient_evidence', 'provisional']);
    assert.strictEqual(r({ complete: false }).action, 'complete_more_questions');
    const up = r({ score: 90 }); assert.deepStrictEqual([up.action, up.reason, up.verification_level, up.recommended_level, up.finality], ['verify_boundary', 'upper_boundary', 'b2', 'b1', 'provisional']);
    const down = r({ score: 40 }); assert.deepStrictEqual([down.action, down.reason, down.verification_level], ['verify_boundary', 'lower_boundary', 'a2']);
    assert.strictEqual(r({ assessed_level: 'c2', score: 100 }).action, 'complete', 'nothing above C2 to verify');
    assert.strictEqual(r({ assessed_level: undefined }).assessed_level, 'b1', 'assessed defaults to the estimate');
    assert.strictEqual(r({}).blueprint_version, 2);
  });

  test('resolvePlacement verification stage: never chains a second verification; edge scores stay at the verified level with a signal', () => {
    const r = (o) => P.resolvePlacement(Object.assign({ estimated_level: 'b1', assessed_level: 'b2', score: 70, graded_questions: 10, stage: 'verification' }, o));
    assert.deepStrictEqual([r({}).action, r({}).finality, r({}).recommended_level], ['complete', 'final', 'b2']);
    const hi = r({ score: 95 }); assert.deepStrictEqual([hi.action, hi.reason, hi.recommended_level, hi.finality, hi.verification_level], ['continue_at_verified_level', 'verification_upper_edge', 'b2', 'final_with_edge_signal', null]);
    assert.strictEqual(r({ score: 30 }).reason, 'verification_lower_edge');
    const thin = r({ graded_questions: 3 }); assert.deepStrictEqual([thin.action, thin.finality], ['repeat_verification_or_choose_level', 'provisional']);
  });

  test('readStored / writeStored: round-trip; rejects corrupt, wrong-shape, unknown-level and non-numeric-score records; write failures reported', () => {
    const st = makeFakeStorage(); const { P: Q } = freshPlacement(st);
    assert.strictEqual(Q.readStored(), null);
    assert.strictEqual(Q.writeStored({ recommended_level: 'b1', score: 70 }), true);
    assert.deepStrictEqual(Q.readStored(), { recommended_level: 'b1', score: 70 });
    assert.strictEqual(JSON.parse(st.getItem('mylingo.assessment.v1')).score, 70);
    assert.strictEqual(Q.readStored.length, 0);
    [ '{nope', '"str"', 'null', JSON.stringify({ recommended_level: 'z9', score: 5 }), JSON.stringify({ recommended_level: 'a1', score: 'x' }), JSON.stringify({ score: 5 }) ].forEach((raw) => { st.setItem('mylingo.assessment.v1', raw); assert.strictEqual(Q.readStored(), null, raw); });
    st.setItem('mylingo.assessment.v1', JSON.stringify({ assessed_level: 'A2', score: 10 })); assert.ok(Q.readStored(), 'assessed_level is an accepted fallback and levels are case-insensitive');
    const boom = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } }; const { P: B } = freshPlacement(boom);
    assert.strictEqual(B.readStored(), null); assert.strictEqual(B.writeStored({}), false);
    const { P: N } = freshPlacement(null); assert.strictEqual(N.readStored(), null); assert.strictEqual(N.writeStored({}), false);
  });

  test('validateQuestionMetadata: skill / difficulty 1-5 integer / positive time / cefr level', () => {
    const v = P.validateQuestionMetadata;
    assert.strictEqual(v({}), true); assert.strictEqual(v({ skill: 'Grammar', difficulty: 5, estimated_time_seconds: 30, cefr: 'B1' }), true);
    [null, 'x', { skill: 'foo' }, { difficulty: 0 }, { difficulty: 6 }, { difficulty: 2.5 }, { estimated_time_seconds: 0 }, { estimated_time_seconds: 'x' }, { cefr: 'd1' }].forEach((bad) => assert.strictEqual(v(bad), false, JSON.stringify(bad)));
  });

  test('blueprint: self-validates and the exported copies are isolated from the module', () => {
    assert.strictEqual(P.validatePlacementBlueprint(), true);
    P.PLACEMENT_BLUEPRINT_V2.version = 99; P.ASSESSMENT_120.mastery_threshold = 1; P.SCORE_BANDS[0].min = 0; P.LEVELS.push('zz');
    const { P: fresh } = freshPlacement();
    assert.strictEqual(P.validatePlacementBlueprint(), true, 'mutating an exported copy must not break the engine');
    assert.strictEqual(P.scoreBand(89).key, 'secure'); assert.strictEqual(P.calculate120Placement([{ placement_level: 'a1' }], { 0: true }).mastery_threshold, 70);
    assert.deepStrictEqual(fresh.LEVELS, ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
  });

  test('every shipped placement bank: valid question metadata; the six 10-question banks meet the coverage blueprint', () => {
    const w = { localStorage: makeFakeStorage() };
    ['canonical-metadata', 'runtime-v2-adapter'].forEach((f) => new Function('global', 'window', fs.readFileSync(path.join(root, 'shared/js', f + '.js'), 'utf8'))(w, w));
    const problems = []; let banks = 0;
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'assessment'].forEach((dir) => {
      const d = path.join(root, 'placement', dir);
      fs.readdirSync(d).filter((f) => f.endsWith('.json')).forEach((f) => {
        banks++;
        const quiz = w.MylingoRuntimeV2.normalizeQuiz(JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')));
        quiz.questions.forEach((q, i) => { if ((q.question_type || 'radio') !== 'banner' && !P.validateQuestionMetadata(q)) problems.push(dir + '/' + f + ' q' + (i + 1) + ' bad metadata'); });
        if (dir !== 'assessment' && quiz.questions.length === 10 && !P.coverageReport(quiz.questions).meets_blueprint) problems.push(dir + '/' + f + ' misses the coverage blueprint');
      });
    });
    assert.ok(banks >= 7, 'sanity: found ' + banks + ' banks');
    assert.deepStrictEqual(problems, []);
  });

  // ---------- quiz.html: saveAssessmentResult, run for real against placement.js ----------
  const html = fs.readFileSync(path.join(root, 'shared', 'quiz.html'), 'utf8');
  const NAMES = ['rawType', 'gradedTotal', 'orientationEstimate', 'saveAssessmentResult'];
  function assessSandbox(opts) {
    const st = makeFakeStorage();
    const w = { localStorage: st }; new Function('global', 'window', placementSrc)(w, w);
    const src = 'const mode=' + JSON.stringify(opts.mode) + ',anchorLevel=' + JSON.stringify(opts.anchor || null) + ',stage=' + JSON.stringify(opts.stage || 'primary') + ',level=' + JSON.stringify(opts.level) + ';\n' +
      'let data=null,answerCorrect={};\n' + NAMES.map((n) => extractFn(html, n)).join('\n') + '\n({save:saveAssessmentResult,set:function(d,a){data=d;answerCorrect=a}})';
    const env = vm.runInContext(src, vm.createContext({ window: opts.noPlacement ? {} : w, localStorage: st, JSON, String, Object, Array, Number }));
    return { st, run: (d, a, pct) => { env.set(d, a); const r = env.save(pct); return r === null || r === undefined ? r : JSON.parse(JSON.stringify(r)); } };
  }
  const bank = (n, id, extra) => ({ id: id || 'placement-b1', questions: Array.from({ length: n }, (_, k) => Object.assign({ id: (id || 'pb1') + '-' + k, skill: k % 2 ? 'vocabulary' : 'grammar' }, extra)) });
  const answers = (n, correct) => { const m = {}; for (let k = 0; k < n; k++) m[k] = k < correct; return m; };

  test('saveAssessmentResult: only acts in placement mode with placement.js loaded and data present', () => {
    assert.strictEqual(assessSandbox({ mode: '', level: 'b1' }).run(bank(10), answers(10, 7), 70), null);
    assert.strictEqual(assessSandbox({ mode: 'placement', level: 'b1', noPlacement: true }).run(bank(10), answers(10, 7), 70), null);
    assert.strictEqual(assessSandbox({ mode: 'placement', level: 'b1' }).run(null, {}, 70), null);
  });

  test('saveAssessmentResult primary: a mid score is final; nothing pending, result persisted under mylingo.assessment.v1', () => {
    const s = assessSandbox({ mode: 'placement', level: 'b1', anchor: 'b1' });
    const p = s.run(bank(10), answers(10, 7), 70);
    assert.deepStrictEqual([p.recommended_level, p.verification_level, p.estimated_level, p.assessed_level, p.score, p.evidence_question_count, p.boundary_reason], ['b1', null, 'b1', 'b1', 70, 10, 'score_in_band']);
    assert.deepStrictEqual(JSON.parse(s.st.getItem('mylingo.assessment.v1')).recommended_level, 'b1');
  });

  test('saveAssessmentResult primary: a boundary score asks for one adjacent verification and keeps the assessed level meanwhile', () => {
    const hi = assessSandbox({ mode: 'placement', level: 'b1', anchor: 'b1' }).run(bank(10), answers(10, 9), 90);
    assert.deepStrictEqual([hi.verification_level, hi.recommended_level, hi.boundary_reason], ['b2', 'b1', 'upper_boundary']);
    const lo = assessSandbox({ mode: 'placement', level: 'b1', anchor: 'b1' }).run(bank(10), answers(10, 3), 30);
    assert.deepStrictEqual([lo.verification_level, lo.boundary_reason], ['a2', 'lower_boundary']);
  });

  test('saveAssessmentResult: estimate comes from the anchor param first, then stored orientation, then the quiz level', () => {
    const noAnchor = assessSandbox({ mode: 'placement', level: 'a2' });
    noAnchor.st.setItem('mylingo.orientation.v1', JSON.stringify({ estimated_level: 'b1' }));
    assert.strictEqual(noAnchor.run(bank(10), answers(10, 7), 70).estimated_level, 'b1');
    assert.strictEqual(assessSandbox({ mode: 'placement', level: 'a2' }).run(bank(10), answers(10, 7), 70).estimated_level, 'a2');
    assert.strictEqual(assessSandbox({ mode: 'placement', level: 'a2', anchor: 'c1' }).run(bank(10), answers(10, 7), 70).estimated_level, 'c1');
  });

  test('saveAssessmentResult verification: merges pending primary evidence WITHOUT double counting, resolves once, clears the pending record', () => {
    const s = assessSandbox({ mode: 'placement', level: 'b2', stage: 'verification', anchor: 'b1' });
    const primaryEv = Array.from({ length: 10 }, (_, k) => ({ question_id: 'pb1-' + k, quiz_id: 'placement-b1', skill: k % 2 ? 'vocabulary' : 'grammar', correct: k < 9, stage: 'primary' }));
    s.st.setItem('mylingo.assessment.pending.v1', JSON.stringify({ estimated_level: 'b1', primary_quiz_id: 'placement-b1', primary_score: 90, primary_evidence: primaryEv }));
    const p = s.run(bank(10, 'placement-b2'), answers(10, 7), 70);
    assert.deepStrictEqual([p.recommended_level, p.boundary_reason, p.primary_score, p.verification_score, p.estimated_level], ['b2', 'score_in_band', 90, 70, 'b1']);
    assert.strictEqual(p.evidence_question_count, 20, 'ten primary + ten verification items, each once');
    assert.deepStrictEqual(p.assessment_quiz_ids, ['placement-b1', 'placement-b2']); assert.deepStrictEqual(p.evidence_stages, ['primary', 'verification']);
    assert.strictEqual(s.st.getItem('mylingo.assessment.pending.v1'), null, 'pending primary record must be consumed');
    const edge = assessSandbox({ mode: 'placement', level: 'b2', stage: 'verification', anchor: 'b1' }).run(bank(10, 'placement-b2'), answers(10, 10), 100);
    assert.strictEqual(edge.recommended_level, 'b2'); assert.strictEqual(edge.boundary_reason, 'verification_upper_edge', 'a second boundary is surfaced, never chained');
  });

  test('saveAssessmentResult verification with no / corrupt pending record still yields a result', () => {
    const s = assessSandbox({ mode: 'placement', level: 'b2', stage: 'verification', anchor: 'b1' });
    s.st.setItem('mylingo.assessment.pending.v1', '{corrupt');
    const p = s.run(bank(10, 'placement-b2'), answers(10, 7), 70);
    assert.deepStrictEqual([p.recommended_level, p.evidence_question_count, p.primary_score], ['b2', 10, null]);
    assert.strictEqual(assessSandbox({ mode: 'placement', level: 'b2', stage: 'verification', anchor: 'b1' }).run(bank(10, 'placement-b2'), answers(10, 7), 70).recommended_level, 'b2');
  });

  test('saveAssessmentResult placement-120: recommendation comes from the 120 mastery ladder, not the score band', () => {
    const qs = []; const map = {}; let n = 0;
    [['a1', 40, 40], ['a2', 40, 40], ['b1', 40, 10]].forEach(([lv, total, correct]) => { for (let k = 0; k < total; k++) { qs.push({ id: 'p120-' + n, skill: 'grammar', placement_level: lv }); map[n] = k < correct; n++; } });
    const p = assessSandbox({ mode: 'placement', level: 'a1', anchor: 'a1' }).run({ id: 'Placement-120', questions: qs }, map, 80);
    assert.deepStrictEqual([p.recommended_level, p.assessed_level, p.boundary_reason, p.confidence, p.assessment_120.question_count, p.assessment_120.scores], ['a2', 'a2', '120_question_mastery', 'high', 120, { a1: 100, a2: 100, b1: 25 }]);
  });
})();

// ============================================================
console.log('placement.js: untrusted shapes + direct unit coverage from a corrected mutation sweep (Agent 203)');
// ============================================================
(function () {
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const src = fs.readFileSync(path.join(root, 'shared/js/placement.js'), 'utf8');
  // A fresh vm context per module load: cross-realm values are compared through JSON, and the
  // prototype-pollution checks look at THAT realm's Object.prototype, never the harness's own.
  function load(storage) {
    const w = { localStorage: storage === undefined ? makeFakeStorage() : storage };
    const ctx = vm.createContext({ window: w });
    vm.runInContext(src, ctx);
    return { P: w.MylingoPlacement, ctx };
  }
  const { P, ctx } = load();
  const J = (x) => JSON.parse(JSON.stringify(x));
  const ev = (id, correct, extra) => Object.assign({ question_id: id, quiz_id: 'z', skill: 'grammar', correct, stage: 'primary' }, extra);
  const ten = (o) => Object.assign({ estimated_level: 'b1', assessed_level: 'b1', score: 70, graded_questions: 10 }, o);

  test('adjacentLevel: only a finite number moves (whole steps); a numeric string works; junk stays put — never undefined, never the concatenated "b1"+"1" = C2 (Agent 203 fix)', () => {
    assert.strictEqual(P.adjacentLevel('b1', '1'), 'b2', 'the string "1" used to concatenate to idx "21" -> C2');
    assert.strictEqual(P.adjacentLevel('b1', '-1'), 'a2');
    assert.strictEqual(P.adjacentLevel('b1', ' 1 '), 'b2');
    [undefined, null, NaN, 'x', '', '  ', {}, [], true, false, Infinity, -Infinity].forEach((d) => assert.strictEqual(P.adjacentLevel('b1', d), 'b1', 'direction ' + String(d)));
    assert.strictEqual(P.adjacentLevel('a1', 1.5), 'a2', 'fractional steps truncate toward zero (used to index LEVELS[1.5] = undefined)');
    assert.strictEqual(P.adjacentLevel('b2', -1.9), 'b1');
    assert.strictEqual(P.adjacentLevel('a1', 2), 'b1'); assert.strictEqual(P.adjacentLevel('c2', -2), 'b2');
    assert.strictEqual(P.adjacentLevel('a1', 99), 'c2'); assert.strictEqual(P.adjacentLevel('c2', -99), 'a1');
    assert.strictEqual(P.adjacentLevel('zz', 1), 'a2', 'junk level is A1 first');
    assert.strictEqual(P.adjacentLevel('b1', 0), 'b1');
  });

  test('percentages (score / primary_score / verification_score): a real number or non-blank numeric string; junk is 0; out-of-range and Infinity clamp', () => {
    const band = (s) => P.scoreBand(s).key;
    assert.deepStrictEqual(['95', ' 95 ', Infinity, 'Infinity', 1e9].map(band), ['strong', 'strong', 'strong', 'strong', 'strong']);
    assert.deepStrictEqual([true, [95], '', '  ', {}, -Infinity, '-Infinity', -1e9].map(band), Array(8).fill('very_weak'), 'true / [95] / blank are NOT numbers (Number() took them as 1 / 95 / 0)');
    const fin = (o) => P.finalizeVerification(Object.assign({ verification_level: 'b2', graded_questions: 10 }, o));
    assert.deepStrictEqual([fin({ primary_score: '90', verification_score: '70' }).primary_score, fin({ primary_score: '90', verification_score: '70' }).verification_score], [90, 70]);
    assert.deepStrictEqual([fin({ primary_score: [90], verification_score: true }).primary_score, fin({ primary_score: [90], verification_score: true }).verification_score], [0, 0]);
    assert.strictEqual(fin({ verification_score: Infinity }).verification_score, 100); assert.strictEqual(fin({ verification_score: -Infinity }).verification_score, 0);
    assert.strictEqual(P.decideVerificationPath({ assessed_level: 'b1', score: [90] }).direction, 'lower', '[90] is junk = 0, below 50');
    assert.strictEqual(P.decideVerificationPath({ assessed_level: 'b1', score: '90' }).direction, 'upper');
    assert.strictEqual(P.resolvePlacement(ten({ score: true })).score, 0);
    assert.strictEqual(P.calculateResult({ score: [80] }).score, 0); assert.strictEqual(P.calculateResult({ score: '80' }).score, 80);
    assert.strictEqual(P.confidenceFor({ graded_questions: 10, score: [70] }), 'medium', 'junk score = 0 = inside the lower caution zone');
  });

  test('graded_questions: only a finite number > 0 counts — Infinity / "Infinity" / negatives / NaN / junk are 0 (never Infinity in the result, never "high" confidence) (Agent 203 fix)', () => {
    [Infinity, 'Infinity', -3, NaN, 'abc', true, [10], {}, null, '', '  '].forEach((g) => {
      const r = P.resolvePlacement(ten({ graded_questions: g }));
      assert.deepStrictEqual([r.graded_questions, r.confidence, r.reason, r.action, r.finality], [0, 'low', 'insufficient_evidence', 'complete_more_questions', 'provisional'], 'graded ' + String(g));
      assert.strictEqual(P.confidenceFor({ graded_questions: g, score: 70 }), 'low', 'confidenceFor ' + String(g));
      assert.deepStrictEqual(J(P.decideFromPerformance({ assessed_level: 'b1', score: 99, graded_questions: g })), { recommended_level: 'b1', reason: 'insufficient_evidence', boundary_check: false }, 'decideFromPerformance ' + String(g));
    });
    assert.strictEqual(P.resolvePlacement(ten({ graded_questions: '10' })).graded_questions, 10); assert.strictEqual(P.resolvePlacement(ten({ graded_questions: ' 8 ' })).confidence, 'high');
    assert.strictEqual(P.resolvePlacement(ten({ graded_questions: 5 })).confidence, 'medium'); assert.strictEqual(P.resolvePlacement(ten({ graded_questions: 4.5 })).reason, 'insufficient_evidence');
    const qs = [{ skill: 'grammar' }, { question_type: 'banner' }, { skill: 'reading' }];
    assert.deepStrictEqual([Infinity, -3, 0, 'x', null, undefined].map((g) => P.calculateResult({ questions: qs, graded_questions: g }).graded_questions), Array(6).fill(2), 'a bad count falls back to the non-banner question count');
    assert.deepStrictEqual([P.calculateResult({ questions: qs, graded_questions: '7' }).graded_questions, P.calculateResult({ questions: qs, graded_questions: 7 }).graded_questions], [7, 7]);
    assert.strictEqual(J(P.calculateResult({ graded_questions: Infinity, questions: qs })).graded_questions, 2, 'and it survives a JSON round trip (Infinity used to serialise as null)');
  });

  test('calculateResult: graded fallback / evidence / coverage all treat "banner" the same way, whatever its case or separators; the type is normalised once (Agent 203 fix)', () => {
    const qs = [{ question_type: 'BANNER', skill: 'grammar' }, { question_type: ' Banner'.trim(), skill: 'grammar' }, { question_type: 'Multiple-Choice', skill: 'grammar' }, { skill: 'grammar' }];
    const r = P.calculateResult({ questions: qs, correctMap: { 0: true, 1: true, 2: true, 3: false }, quiz_id: 'q' });
    assert.strictEqual(r.graded_questions, 2, 'the old fallback compared the RAW type to "banner" and counted "BANNER"');
    assert.deepStrictEqual([r.evidence_question_count, r.coverage.skill_counts.grammar, r.skills.grammar], [2, 2, 50]);
    assert.strictEqual(P.calculateResult({ questions: [{ question_type: 'banner' }, { question_type: 'multiple-choice' }, { question_type: 'true false' }] }).graded_questions, 2);
    assert.strictEqual(P.calculateResult({ questions: [null, undefined, 5, 'x'] }).graded_questions, 4, 'a junk entry is an ordinary (radio) question, exactly as buildEvidence sees it');
    assert.strictEqual(P.calculateResult({ questions: 'nope' }).graded_questions, 0); assert.strictEqual(P.calculateResult({ questions: { length: 3 } }).graded_questions, 0);
  });

  test('calculateResult(): a missing / null input still gives a complete, JSON-safe record — complete is a real boolean (false), confidence low, timestamp a number (Agent 203)', () => {
    [null, undefined, 0, ''].forEach((input) => {
      const r = P.calculateResult(input);
      assert.strictEqual(r.complete, false, JSON.stringify(input)); assert.strictEqual(r.confidence, 'low'); assert.strictEqual(r.boundary_reason, 'insufficient_evidence');
      assert.deepStrictEqual(J([r.estimated_level, r.assessed_level, r.recommended_level, r.score, r.graded_questions, r.evidence]), ['a1', 'a1', 'a1', 0, 0, []]);
      assert.ok('complete' in J(r), 'complete must survive serialisation (undefined used to drop the key)');
    });
    assert.strictEqual(P.calculateResult({}).complete, true); assert.strictEqual(P.calculateResult({ complete: false }).complete, false); assert.strictEqual(P.calculateResult({ complete: 0 }).complete, true, 'only an explicit false is incomplete');
    assert.deepStrictEqual(J(P.calculateResult({ assessment_quiz_ids: 'x' }).assessment_quiz_ids), []);
    assert.deepStrictEqual(J(P.calculateResult({ assessment_quiz_ids: [null, 'a', 7, {}, '', ' b ', NaN, undefined, false] }).assessment_quiz_ids), ['a', '7', 'b'], 'ids are strings / numbers only, trimmed, blanks dropped');
  });

  test('calculateResult timestamp: a finite number > 0 (or numeric string) is honoured; Infinity / negatives / 0 / junk mean now (Agent 203 fix)', () => {
    const now = Date.now();
    assert.deepStrictEqual([42, '1000', ' 7 ', 1.5].map((t) => P.calculateResult({ timestamp: t }).timestamp), [42, 1000, 7, 1.5]);
    [Infinity, -Infinity, 'Infinity', -5, '-5', 0, '0', NaN, null, undefined, '', '  ', 'x', true, [5], {}].forEach((t) => {
      const got = P.calculateResult({ timestamp: t }).timestamp;
      assert.ok(Number.isFinite(got) && got >= now && got < now + 5000, 'timestamp ' + String(t) + ' -> ' + got);
    });
  });

  test('stage: only "verification" (any case) is the verification stage — a junk / missing / non-string stage is PRIMARY in resolvePlacement and buildEvidence (Agent 203 fix)', () => {
    ['banana', '', {}, [], 5, null, undefined, 'primary', 'PRIMARY', 'Primary', ' verification', 'verification '].forEach((stage) => {
      const r = P.resolvePlacement(ten({ score: 90, stage }));
      assert.deepStrictEqual([r.stage, r.action, r.reason, r.verification_level, r.finality], ['primary', 'verify_boundary', 'upper_boundary', 'b2', 'provisional'], 'stage ' + JSON.stringify(stage) + ' used to skip the boundary check and finish as a verification edge');
      assert.strictEqual(P.buildEvidence([{}], { 0: true }, 'q', stage)[0].stage, 'primary', 'buildEvidence stage ' + JSON.stringify(stage));
    });
    ['verification', 'VERIFICATION', 'Verification'].forEach((stage) => {
      const r = P.resolvePlacement(ten({ assessed_level: 'b2', score: 90, stage }));
      assert.deepStrictEqual([r.stage, r.action, r.reason], ['verification', 'continue_at_verified_level', 'verification_upper_edge']);
      assert.strictEqual(P.buildEvidence([{}], { 0: true }, 'q', stage)[0].stage, 'verification');
    });
    assert.strictEqual(P.resolvePlacement(ten({ graded_questions: 2, stage: 'banana' })).action, 'complete_more_questions', 'insufficient evidence in a junk stage is the PRIMARY message, not repeat_verification');
    assert.strictEqual(P.calculateResult({ stage: 'banana', questions: [{}], correctMap: { 0: true } }).evidence_stages[0], 'primary');
  });

  test('mergePlacementEvidence: ids named like Object.prototype members are ordinary ids — no throw, no prototype rewiring, duplicates still collapse (Agent 203 fix)', () => {
    ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf', 'isPrototypeOf', '__defineGetter__'].forEach((id) => {
      const once = P.mergePlacementEvidence([ev(id, true)], []);
      assert.deepStrictEqual(J(once).map((e) => [e.question_id, e.correct]), [[id, true]], id);
      const twice = J(P.mergePlacementEvidence([ev(id, true, { quiz_id: 'a' })], [ev(id, false, { quiz_id: 'b', stage: 'verification' })]));
      assert.strictEqual(twice.length, 1, id + ' twice = one item'); assert.deepStrictEqual([twice[0].correct, twice[0].quiz_ids, twice[0].stages], [true, ['a', 'b'], ['primary', 'verification']]);
      assert.strictEqual(P.calculateResult({ evidence: [ev(id, true), ev(id, true)] }).evidence_question_count, 1, 'calculateResult with ' + id);
    });
    const proto = P.mergePlacementEvidence([ev('__proto__', true), ev('after', false)], []);
    assert.deepStrictEqual(J(proto).map((e) => e.question_id), ['__proto__', 'after'], 'later entries are still processed');
    assert.strictEqual(vm.runInContext('({}).question_id === undefined && ({}).quiz_ids === undefined', ctx), true, 'nothing leaked onto Object.prototype');
  });

  test('mergePlacementEvidence: question ids are trimmed strings or finite numbers (0 is an id); quiz ids / stages / skills are cleaned — no "null" / "undefined" strings (Agent 203 fix)', () => {
    const m = (e) => J(P.mergePlacementEvidence([e], []));
    assert.deepStrictEqual(m({ question_id: 0, correct: true }).map((e) => e.question_id), ['0'], 'the old `||` dropped id 0');
    assert.deepStrictEqual(m({ question_id: ' a ', correct: true }).map((e) => e.question_id), ['a']); assert.deepStrictEqual(m({ question_id: 7 }).map((e) => e.question_id), ['7']);
    [undefined, null, '', '  ', {}, [], true, false, NaN, Infinity].forEach((id) => assert.deepStrictEqual(m({ question_id: id, correct: true }), [], 'id ' + String(id)));
    const q = m({ question_id: 'a', quiz_ids: [null, undefined, {}, '', ' ', 'x', 7, NaN, Infinity, ' y '], stages: [null, 5, 'Verification', 'nope', 'PRIMARY', 'verification'] })[0];
    assert.deepStrictEqual([q.quiz_ids, q.quiz_id, q.stages], [['x', '7', 'y'], 'x', ['verification', 'primary']]);
    assert.deepStrictEqual(m({ question_id: 'a', quiz_id: ' z ' })[0].quiz_ids, ['z'], 'a lone quiz_id becomes quiz_ids'); assert.strictEqual(m({ question_id: 'a', quiz_id: ' z ' })[0].quiz_id, 'z');
    assert.deepStrictEqual([m({ question_id: 'a', quiz_id: 5 })[0].quiz_id, m({ question_id: 'a', quiz_id: {} })[0].quiz_id, m({ question_id: 'a', quiz_id: true })[0].quiz_id], ['5', null, null]);
    assert.strictEqual(m({ question_id: 'a', quiz_id: 'p', quiz_ids: ['r'] })[0].quiz_id, 'p', 'quiz_id wins as the headline id'); assert.strictEqual(m({ question_id: 'a', quiz_ids: ['r'] })[0].quiz_id, 'r');
    assert.deepStrictEqual(m({ question_id: 'a', stages: [null, 'x'], stage: 'Verification' })[0].stages, ['verification'], 'no usable stages -> the single stage field');
    assert.deepStrictEqual(m({ question_id: 'a', stages: [] })[0].stages, ['primary']); assert.deepStrictEqual(m({ question_id: 'a', stages: 'verification' })[0].stages, ['primary'], 'a non-array stages is ignored');
    assert.deepStrictEqual(m({ question_id: 'a', quiz_ids: 'x' })[0].quiz_ids, [], 'a non-array quiz_ids is ignored');
    assert.deepStrictEqual(['GRAMMAR', 'Vocabulary', 'bogus', {}, 5, null, ['grammar']].map((skill) => m({ question_id: 'a', skill })[0].skill), ['grammar', 'vocabulary', null, null, null, null, null]);
    const dup = J(P.mergePlacementEvidence([ev('a', true, { skill: null })], [ev('a', true, { skill: 'bogus' }), ev('a', true, { skill: 'READING' }), ev('a', true, { skill: 'writing' })]));
    assert.strictEqual(dup[0].skill, 'reading', 'a duplicate fills a missing skill only with a REAL skill, and only once');
    assert.strictEqual(J(P.mergePlacementEvidence([ev('a', true, { skill: 'usage' })], [ev('a', true, { skill: 'writing' })]))[0].skill, 'usage', 'an existing skill is never replaced');
    assert.deepStrictEqual(J(P.mergePlacementEvidence('x', 5)), []); assert.deepStrictEqual(J(P.mergePlacementEvidence({ length: 1, 0: ev('a', true) }, [])), []);
    assert.strictEqual(m({ question_id: 'a', correct: 'yes' })[0].correct, true); assert.strictEqual(m({ question_id: 'a' })[0].correct, false);
  });

  test('buildEvidence: ids are trimmed strings / finite numbers (0 is an id) else quizId:index; skills must be real strings; the quiz id is trimmed; arrays / junk questions and maps tolerated (Agent 203)', () => {
    const b = (qs, map, quiz, stage) => J(P.buildEvidence(qs, map, quiz, stage));
    assert.deepStrictEqual(b([{ id: 0 }, { id: 5 }, { id: ' a ' }, { id: true }, { id: {} }, { id: NaN }, { id: Infinity }, { id: null }], { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true }, ' Q ').map((e) => e.question_id),
      ['0', '5', 'a', 'Q:3', 'Q:4', 'Q:5', 'Q:6', 'Q:7']);
    assert.deepStrictEqual(b([{ skill: { toString() { return 'grammar'; } } }, { skill: ['grammar'] }, { skill: 'READING' }, { skill: 5 }], { 0: true, 1: true, 2: true, 3: true }, 'q').map((e) => e.skill), [null, null, 'reading', null]);
    assert.deepStrictEqual(b([{}, {}], [true, 'x'], 'q').map((e) => e.question_id), ['q:0'], 'an array map works positionally; a non-boolean is not graded');
    assert.deepStrictEqual(b([{}], 'str', 'q'), []); assert.deepStrictEqual(b([{}], 5, 'q'), []); assert.deepStrictEqual(b([null, undefined, 3], { 0: true, 1: false, 2: true }, 'q').map((e) => [e.question_id, e.correct]), [['q:0', true], ['q:1', false], ['q:2', true]]);
    assert.deepStrictEqual(b([{}], { 0: true }, undefined).map((e) => e.quiz_id), [null]); assert.deepStrictEqual(b([{}], { 0: true }, '  ').map((e) => [e.quiz_id, e.question_id]), [[null, ':0']]);
    assert.strictEqual(b([{ question_type: 'radio' }, { question_type: 'BANNER' }, { question_type: 'Multiple Choice' }], { 0: true, 1: true, 2: false }, 'q').length, 2);
  });

  test('calculateSkillProfile: a missing / non-object map never throws; only a real true is correct ("false", "no", 1 are not); banners and non-arrays are skipped (Agent 203 fix)', () => {
    const qs = [{ skill: 'grammar' }, { skill: 'grammar' }, { skill: 'grammar' }, { skill: 'grammar' }];
    [null, undefined, 'x', 5, true].forEach((map) => assert.deepStrictEqual(J(P.calculateSkillProfile(qs, map)).skills.grammar, 0, 'map ' + String(map)));
    assert.strictEqual(P.calculateSkillProfile(qs, { 0: 'true', 1: 1, 2: 'false', 3: {} }).skills.grammar, 0, 'truthy non-booleans used to count as correct');
    assert.strictEqual(P.calculateSkillProfile(qs, { 0: true, 1: true, 2: false, 3: false }).skills.grammar, 50);
    assert.strictEqual(P.calculateSkillProfile(qs, [true, true, true, false]).skills.grammar, 75, 'an array map works positionally');
    const withBanner = P.calculateSkillProfile([{ skill: 'reading', question_type: 'banner' }, { skill: 'reading' }, { skill: 'reading', question_type: 'Banner' }], { 0: true, 1: true, 2: true });
    assert.deepStrictEqual([withBanner.skills.reading, J(withBanner.counts)], [null, { reading: 1 }], 'banners are not questions');
    assert.deepStrictEqual(J(P.calculateSkillProfile('nope', {}).counts), {}); assert.deepStrictEqual(J(P.calculateSkillProfile({ length: 2, 0: { skill: 'grammar' } }, {}).counts), {});
    assert.deepStrictEqual(J(P.calculateSkillProfile([{ skill: ['grammar'] }, { skill: { toString() { return 'grammar'; } } }, { skill: 'Grammar' }], {}).counts), { grammar: 1 });
    const r = P.calculateResult({ questions: [{ skill: 'grammar' }, { skill: 'grammar' }], correctMap: { 0: 'false', 1: 'no' } });
    assert.deepStrictEqual([r.evidence_question_count, r.skills.grammar], [0, 0], 'no boolean answers -> no evidence; the legacy profile no longer scores "false" / "no" as correct');
  });

  test('calculate120Placement: only the three real bands exist — "__proto__" / "constructor" / "toString" levels change nothing and never touch Object.prototype; banners are not graded; only a real true is correct (Agent 203 fix)', () => {
    const c = load(); const Q = c.P;
    const bad = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'c1', 'B2', '', 'a1 ', 5, null, {}, ['a1']].map((lv) => ({ placement_level: lv }));
    const r = J(Q.calculate120Placement(bad, bad.map(() => true)));
    assert.deepStrictEqual([r.question_count, r.correct_count, r.scores, r.recommended_level, r.confidence], [0, 0, { a1: 0, a2: 0, b1: 0 }, 'a1', 'low']);
    assert.deepStrictEqual(Object.keys(r.bands), ['a1', 'a2', 'b1']);
    assert.strictEqual(vm.runInContext('({}).total === undefined && ({}).correct === undefined && Object.total === undefined && Object.correct === undefined', c.ctx), true, 'no NaN written onto Object.prototype / Object');
    const cefr = J(Q.calculate120Placement([{ cefr: 'A2' }, { placement_level: 'B1', cefr: 'a1' }, { placement_level: '', cefr: 'a1' }], { 0: true, 1: true, 2: true }));
    assert.deepStrictEqual([cefr.bands.a1, cefr.bands.a2, cefr.bands.b1], [{ total: 1, correct: 1 }, { total: 1, correct: 1 }, { total: 1, correct: 1 }], 'placement_level wins over cefr; an empty one falls back; case folds');
    const mixed = J(Q.calculate120Placement([{ placement_level: 'a1', question_type: 'banner' }, { placement_level: 'a1', question_type: 'BANNER' }, { placement_level: 'a1' }, { placement_level: 'a1', question_type: 'Multiple-Choice' }], { 0: true, 1: true, 2: true, 3: false }));
    assert.deepStrictEqual([mixed.bands.a1, mixed.question_count, mixed.correct_count, mixed.scores.a1], [{ total: 2, correct: 1 }, 2, 1, 50]);
    const truthy = J(Q.calculate120Placement([{ placement_level: 'a1' }, { placement_level: 'a1' }, { placement_level: 'a1' }, { placement_level: 'a1' }], { 0: 'true', 1: 1, 2: 'false', 3: {} }));
    assert.deepStrictEqual([truthy.bands.a1, truthy.scores.a1], [{ total: 4, correct: 0 }, 0]);
    assert.strictEqual(J(Q.calculate120Placement([{ placement_level: 'a1' }, { placement_level: 'a1' }], [true, false])).scores.a1, 50, 'an array map works positionally');
    ['nope', {}, 5, null, undefined, { length: 2, 0: { placement_level: 'a1' } }].forEach((qs) => assert.strictEqual(J(Q.calculate120Placement(qs, { 0: true })).question_count, 0, 'questions ' + JSON.stringify(qs)));
    [null, undefined, 'x', 5].forEach((map) => assert.deepStrictEqual(J(Q.calculate120Placement([{ placement_level: 'a1' }], map)).bands.a1, { total: 1, correct: 0 }, 'map ' + String(map)));
    assert.strictEqual(Object.getOwnPropertyNames(P.calculate120Placement([], {}).bands).join(), 'a1,a2,b1');
  });

  test('readStored: the score must be a real number or a non-blank numeric string — null / "" / true / false / [] / {} used to read back as a valid (0-ish) result (Agent 203 fix)', () => {
    const st = makeFakeStorage(); const Q = load(st).P;
    const put = (rec) => { st.setItem('mylingo.assessment.v1', JSON.stringify(rec)); return Q.readStored(); };
    [null, '', '  ', true, false, [], {}, [50], 'x', 'Infinity', '-Infinity'].forEach((score) => assert.strictEqual(put({ recommended_level: 'a2', score }), null, 'score ' + JSON.stringify(score)));
    assert.strictEqual(put({ recommended_level: 'a2' }), null, 'a missing score');
    [0, '0', 50, ' 50 ', '72.5', 100].forEach((score) => assert.deepStrictEqual(J(put({ recommended_level: 'a2', score })), { recommended_level: 'a2', score }, 'score ' + JSON.stringify(score)));
    st.setItem('mylingo.assessment.v1', '{"recommended_level":"a2","score":1e999}'); assert.strictEqual(Q.readStored(), null, '1e999 parses to Infinity');
    assert.strictEqual(put({ recommended_level: 'B1', score: 10 }).recommended_level, 'B1', 'the record is returned untouched');
    assert.strictEqual(put({ assessed_level: 'c2', score: 10 }).assessed_level, 'c2'); assert.strictEqual(put({ recommended_level: 5, score: 10 }), null);
    assert.strictEqual(put({ recommended_level: '', assessed_level: 'a2', score: 10 }).assessed_level, 'a2', 'a blank recommended_level falls back to assessed_level');
    assert.strictEqual(put([{ recommended_level: 'a2', score: 5 }]), null);
    P.LEVELS.forEach((lv) => assert.strictEqual(put({ recommended_level: lv, score: 10 }).recommended_level, lv, 'every real level (a1 included) is accepted: ' + lv));
    assert.strictEqual(put({ recommended_level: 'a1', score: 10 }).score, 10);
    st.removeItem('mylingo.assessment.v1'); assert.strictEqual(Q.readStored(), null); st.setItem('mylingo.assessment.v1', ''); assert.strictEqual(Q.readStored(), null);
  });

  test('validateQuestionMetadata: skill / cefr must be strings, difficulty and time real numbers (or numeric strings) — true, [30], ["grammar"] no longer pass (Agent 203 fix)', () => {
    const v = P.validateQuestionMetadata;
    [{ skill: ['grammar'] }, { skill: 5 }, { skill: true }, { skill: {} }, { skill: '' }, { cefr: ['a1'] }, { cefr: 5 }, { cefr: true }, { cefr: '' }, { cefr: {} },
      { difficulty: true }, { difficulty: [3] }, { difficulty: '' }, { difficulty: '  ' }, { difficulty: {} }, { difficulty: NaN }, { difficulty: Infinity }, { difficulty: 'x' },
      { estimated_time_seconds: true }, { estimated_time_seconds: [30] }, { estimated_time_seconds: '' }, { estimated_time_seconds: '  ' }, { estimated_time_seconds: -1 }, { estimated_time_seconds: Infinity }, { estimated_time_seconds: NaN }, { estimated_time_seconds: {} }].forEach((bad) => assert.strictEqual(v(bad), false, JSON.stringify(bad)));
    [{ skill: 'GRAMMAR' }, { cefr: 'A1' }, { cefr: 'c2' }, { difficulty: '3' }, { difficulty: 3 }, { difficulty: 1 }, { difficulty: 5 }, { difficulty: ' 4 ' }, { estimated_time_seconds: '30' }, { estimated_time_seconds: 0.5 }, { skill: null, difficulty: null, estimated_time_seconds: null, cefr: null }].forEach((ok) => assert.strictEqual(v(ok), true, JSON.stringify(ok)));
    assert.deepStrictEqual([undefined, 5, 'x', true, false, 0].map(v), Array(6).fill(false)); assert.strictEqual(v([]), true, 'an array is an object with no metadata (pinned)');
    P.SKILLS.forEach((skill) => assert.strictEqual(v({ skill }), true, skill)); P.LEVELS.forEach((cefr) => assert.strictEqual(v({ cefr }), true, cefr));
  });

  test('decision thresholds are exact: evidence 5, boundaries 85 / 50, scores round to 2 decimals (Agent 203 sweep)', () => {
    const dfp = (o) => J(P.decideFromPerformance(Object.assign({ assessed_level: 'b1', score: 70, graded_questions: 10 }, o)));
    assert.deepStrictEqual(dfp({ graded_questions: 5 }), { recommended_level: 'b1', reason: 'score_in_band', boundary_check: false }, '5 graded is enough, 4 is not');
    assert.deepStrictEqual(dfp({ graded_questions: 4.99 }).reason, 'insufficient_evidence');
    assert.deepStrictEqual(dfp({ score: 84.99 }), { recommended_level: 'b1', reason: 'score_in_band', boundary_check: false }, 'just under 85 is in band');
    assert.deepStrictEqual(dfp({ score: 84.5 }).recommended_level, 'b1'); assert.strictEqual(dfp({ score: 85 }).recommended_level, 'b2');
    assert.deepStrictEqual(dfp({ score: 50 }), { recommended_level: 'b1', reason: 'score_in_band', boundary_check: false }, 'exactly 50 is in band (the lower boundary is exclusive)');
    assert.deepStrictEqual(dfp({ score: 49.99 }), { recommended_level: 'a2', reason: 'lower_boundary', boundary_check: true });
    assert.deepStrictEqual(J(P.decideVerificationPath({ assessed_level: 'b1', score: 60 })), { level: 'b1', direction: 'none', reason: 'no_boundary_check' });
    assert.deepStrictEqual([P.decideVerificationPath({ assessed_level: 'b1', score: 84.99 }).direction, P.decideVerificationPath({ assessed_level: 'b1', score: 50 }).direction, P.decideVerificationPath({ assessed_level: 'b1', score: 85 }).direction, P.decideVerificationPath({ assessed_level: 'b1', score: 49.99 }).direction], ['none', 'none', 'upper', 'lower']);
    const prim = (o) => P.resolvePlacement(ten(o));
    assert.deepStrictEqual([prim({ graded_questions: 5 }).action, prim({ graded_questions: 5 }).confidence, prim({ graded_questions: 5 }).graded_questions], ['complete', 'medium', 5], 'resolvePlacement: 5 graded is enough');
    assert.deepStrictEqual([prim({ graded_questions: 1 }).graded_questions, prim({ graded_questions: 0.5 }).graded_questions, prim({ graded_questions: 0 }).graded_questions], [1, 0.5, 0]);
    assert.deepStrictEqual([P.calculateResult({ graded_questions: 1, questions: [{}, {}, {}] }).graded_questions, P.calculateResult({ graded_questions: 0.5, questions: [{}, {}, {}] }).graded_questions], [1, 0.5], 'a small positive count is kept, not replaced by the question count');
    assert.deepStrictEqual([84.99, 85, 50, 49.99].map((score) => P.resolvePlacement(ten({ score, stage: 'primary' })).action), ['complete', 'verify_boundary', 'complete', 'verify_boundary']);
    const ver = (score) => P.resolvePlacement(ten({ assessed_level: 'b2', score, stage: 'verification' }));
    assert.deepStrictEqual([84.99, 50].map((score) => [ver(score).action, ver(score).reason, ver(score).finality]), [['complete', 'score_in_band', 'final'], ['complete', 'score_in_band', 'final']], 'inside the band the verification is final');
    assert.deepStrictEqual([ver(85).action, ver(85).reason, ver(85).recommended_level, ver(85).finality], ['continue_at_verified_level', 'verification_upper_edge', 'b2', 'final_with_edge_signal']);
    assert.deepStrictEqual([ver(49.99).action, ver(49.99).reason, ver(49.99).recommended_level], ['continue_at_verified_level', 'verification_lower_edge', 'b2']);
    assert.strictEqual(ver(85.01).reason, 'verification_upper_edge'); assert.strictEqual(ver(49).reason, 'verification_lower_edge');
    assert.deepStrictEqual([72.456, 72.454, 100, 0, 33.333, 99.995].map((score) => P.resolvePlacement(ten({ score })).score), [72.46, 72.45, 100, 0, 33.33, 100]);
    assert.deepStrictEqual([72.456, 0.004, 100].map((score) => P.calculateResult({ score }).score), [72.46, 0, 100]);
    assert.strictEqual(P.calculateResult({ timestamp: 1 }).timestamp, 1);
    assert.strictEqual(P.decideAssessmentPath({ estimated_level: 'b1', confidence: 'HIGH' }).reason, 'direct_measurement');
    assert.deepStrictEqual(J(P.decideAssessmentPath({ estimated_level: 'a1', confidence: 'medium' })), { primary_level: 'a1', secondary_level: 'a2', reason: 'boundary_check' });
    assert.deepStrictEqual(J(P.decideAssessmentPath({ estimated_level: 'c2', confidence: 'high' })), { primary_level: 'c2', secondary_level: null, reason: 'direct_measurement' });
  });

  test('finalizeVerification: an incomplete verification is insufficient with low confidence; missing input is safe (Agent 203 sweep)', () => {
    const f = (o) => J(P.finalizeVerification(Object.assign({ primary_level: 'b1', primary_score: 90, verification_level: 'b2', verification_score: 70, graded_questions: 10 }, o)));
    const inc = f({ complete: false });
    assert.deepStrictEqual([inc.reason, inc.confidence, inc.recommended_level], ['insufficient_evidence', 'low', 'b2']);
    assert.deepStrictEqual([f({}).reason, f({}).confidence], ['verified_boundary', 'high']);
    assert.deepStrictEqual([f({ complete: undefined }).confidence, f({ complete: null }).confidence, f({ complete: 0 }).confidence], ['high', 'high', 'high'], 'only an explicit false is incomplete');
    assert.deepStrictEqual([f({ verification_score: 90 }).reason, f({ verification_score: 90 }).recommended_level, f({ verification_score: 20 }).reason, f({ verification_score: 20 }).recommended_level], ['upper_boundary', 'c1', 'lower_boundary', 'b1']);
    assert.strictEqual(f({ graded_questions: 5 }).confidence, 'medium', '5 graded is medium confidence, 8 is high');
    [null, undefined, 5, 'x'].forEach((input) => assert.deepStrictEqual(J(P.finalizeVerification(input)), { recommended_level: 'a1', reason: 'insufficient_evidence', confidence: 'low', primary_level: 'a1', primary_score: 0, verification_level: 'a1', verification_score: 0 }, String(input)));
    assert.deepStrictEqual([P.confidenceFor(null), P.confidenceFor(undefined), P.confidenceFor({}), P.confidenceFor({ graded_questions: 10, score: 70, complete: null })], ['low', 'low', 'low', 'high'], 'no input at all = incomplete; an input without the flag is complete');
    assert.deepStrictEqual(J(P.decideFromPerformance(null)), { recommended_level: 'a1', reason: 'insufficient_evidence', boundary_check: false });
  });

  test('coverageReport: claimable_cefr_evidence is exactly "nothing missing"; one missing skill is enough to fail (Agent 203 sweep)', () => {
    const many = (skill, n) => Array.from({ length: n }, () => ({ skill }));
    const full = [].concat(many('grammar', 4), many('vocabulary', 1), many('reading', 1), many('writing', 1));
    const ok = J(P.coverageReport(full));
    assert.deepStrictEqual([ok.meets_blueprint, ok.claimable_cefr_evidence, ok.missing, ok.total_questions], [true, true, [], 7]);
    const one = J(P.coverageReport([].concat(many('grammar', 3), many('vocabulary', 1), many('reading', 1), many('writing', 1))));
    assert.deepStrictEqual([one.meets_blueprint, one.claimable_cefr_evidence, one.missing], [false, false, ['grammar']], 'exactly one missing skill still fails');
    const noCompound = J(P.coverageReport([].concat(many('grammar', 4), many('vocabulary', 1), many('reading', 1))));
    assert.deepStrictEqual([noCompound.missing, noCompound.claimable_cefr_evidence, noCompound.compound_requirements], [['writing_or_usage'], false, [{ key: 'writing_or_usage', minimum: 1, count: 0, meets: false, skills: ['writing', 'usage'] }]]);
    assert.deepStrictEqual(J(P.coverageReport(full).minimums), { grammar: 4, vocabulary: 1, reading: 1, listening: 0, writing: 0, usage: 0 });
    assert.deepStrictEqual(J(P.coverageReport([{ skill: 'listening' }]).skill_counts), { grammar: 0, vocabulary: 0, reading: 0, listening: 1, writing: 0, usage: 0 }, 'listening needs no minimum but is still counted');
    assert.deepStrictEqual(J(P.coverageReport(full).unavailable_skills), { listening: 'No language-audio placement items are shipped in the current runtime banks.' });
    const copy = P.coverageReport(full); copy.minimums.grammar = 99; copy.unavailable_skills.listening = 'x'; assert.strictEqual(P.coverageReport(full).minimums.grammar, 4, 'each report carries fresh copies');
    assert.deepStrictEqual(J(P.coverageReport('nope').skill_counts.grammar), 0); assert.strictEqual(P.coverageReport(null).total_questions, 0);
  });

  test('mergePlacementEvidence: quiz ids and stages are unioned WITHOUT duplicates, in first-seen order (Agent 203 sweep)', () => {
    const merged = J(P.mergePlacementEvidence([ev('a', true, { quiz_id: 'z', stage: 'primary' })], [ev('a', false, { quiz_id: 'z', stage: 'primary' }), ev('a', false, { quiz_id: 'y', stage: 'verification' }), ev('a', false, { quiz_id: 'z', stage: 'verification' }), ev('a', false, { quiz_id: 'y', stage: 'primary' })]));
    assert.deepStrictEqual([merged.length, merged[0].quiz_ids, merged[0].stages], [1, ['z', 'y'], ['primary', 'verification']]);
    const first = J(P.mergePlacementEvidence([{ question_id: 'a', quiz_ids: ['x', 'y', 'x'], stages: ['primary', 'primary', 'verification'] }], []));
    assert.deepStrictEqual([first[0].quiz_ids, first[0].stages], [['x', 'y'], ['primary', 'verification']], 'a first sighting is de-duplicated too');
    const three = J(P.mergePlacementEvidence([ev('a', true, { quiz_id: 'p' })], [ev('a', true, { quiz_id: 'q' }), ev('a', true, { quiz_id: 'p' }), ev('a', true, { quiz_id: 'q' })]));
    assert.deepStrictEqual(three[0].quiz_ids, ['p', 'q']);
  });

  test('exported constants: level / skill / band tables, storage key, blueprint and 120-ladder numbers (pinned)', () => {
    assert.deepStrictEqual(J(P.LEVELS), ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']); assert.deepStrictEqual(J(P.SKILLS), ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage']);
    assert.deepStrictEqual(J(P.DIFFICULTY), { min: 1, max: 5 }); assert.strictEqual(P.STORAGE_KEY, 'mylingo.assessment.v1');
    assert.deepStrictEqual(J(P.SCORE_BANDS), [{ min: 90, max: 100, key: 'strong', label: 'Strong' }, { min: 80, max: 89.999, key: 'secure', label: 'Secure' }, { min: 60, max: 79.999, key: 'developing', label: 'Developing' }, { min: 40, max: 59.999, key: 'weak', label: 'Weak' }, { min: 0, max: 39.999, key: 'very_weak', label: 'Very weak' }]);
    assert.deepStrictEqual(J(P.ASSESSMENT_120), { question_count: 120, questions_per_level: 40, mastery_threshold: 70, ceiling: 'b1' });
    const b = J(P.PLACEMENT_BLUEPRINT_V2);
    assert.deepStrictEqual([b.version, b.levels, b.orientation, b.assessment_120], [2, ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'], { question_count: 10, output: 'estimated_level', confidence_field: 'estimate_confidence', not_final_placement: true }, { question_count: 120, distribution: { a1: 40, a2: 40, b1: 40 }, mastery_threshold: 70, ceiling: 'b1' }]);
    assert.deepStrictEqual(b.primary_assessment, { target_questions: 10, min_graded_questions: 5, score_method: 'graded_item_percentage', upper_boundary: 85, lower_boundary_exclusive: 50 });
    assert.deepStrictEqual(b.verification, { max_adjacent_hops: 1, one_pass_only: true, unresolved_upper_recommendation: 'verification_level', unresolved_lower_recommendation: 'verification_level' });
    assert.deepStrictEqual(b.confidence, { high_min_graded: 8, medium_min_graded: 5, near_boundary_margin: 5, boundary_is_medium: true, incomplete_or_conflicting_is_low: true });
    assert.deepStrictEqual(b.skill_reporting, { min_questions_per_skill: 2, sparse_skill_value: null });
    assert.deepStrictEqual(b.coverage.minimums, { grammar: 4, vocabulary: 1, reading: 1, listening: 0, writing: 0, usage: 0 }); assert.strictEqual(b.coverage.claim_basis, 'explicit_skill_coverage');
    assert.deepStrictEqual(b.coverage.required_compound_skills, [{ key: 'writing_or_usage', minimum: 1, skills: ['writing', 'usage'] }]); assert.deepStrictEqual(b.coverage.unavailable_skills, { listening: 'No language-audio placement items are shipped in the current runtime banks.' });
    assert.deepStrictEqual(b.persistence, { result_key: 'mylingo.assessment.v1', pending_key: 'mylingo.assessment.pending.v1' });
    assert.deepStrictEqual(Object.keys(P).sort(), ['ASSESSMENT_120', 'DIFFICULTY', 'LEVELS', 'PLACEMENT_BLUEPRINT_V2', 'SCORE_BANDS', 'SKILLS', 'STORAGE_KEY', 'adjacentLevel', 'buildEvidence', 'calculate120Placement', 'calculateEvidenceSkillProfile', 'calculateResult', 'calculateSkillProfile', 'confidenceFor', 'coverageReport', 'decideAssessmentPath', 'decideFromPerformance', 'decideVerificationPath', 'finalizeVerification', 'mergePlacementEvidence', 'normalizeLevel', 'readStored', 'resolvePlacement', 'scoreBand', 'validatePlacementBlueprint', 'validateQuestionMetadata', 'writeStored']);
  });
})();

// ============================================================
console.log('safe-url.js + orientation.js: untrusted shapes (Agent 203)');
// ============================================================
(function () {
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const J = (x) => JSON.parse(JSON.stringify(x));
  const suFake = {}; new Function('self', 'module', fs.readFileSync(path.join(root, 'shared/js/safe-url.js'), 'utf8'))(suFake, undefined);
  const SU = suFake.MylingoSafeUrl;

  test('isSafeMediaUrl: the URL parser drops tab / CR / LF anywhere and strips leading + trailing C0 controls and spaces — protocol-relative forms hidden that way are rejected like "//" (Agent 203 fix)', () => {
    ['/\t/evil.com/x.mp3', '/\n/evil.com', '/\r/evil.com', '/\t\n\r/evil.com', '\u0001//evil.com', '\u0000//evil.com', '\u001f//evil.com', '\u0001 \u0002//evil.com', '/\t\\evil.com', '\u001f/\\evil.com', '\\\t\\evil.com', '/\\\n/evil.com', '\t\u0001//evil.com'].forEach((u) => {
      assert.strictEqual(SU.isSafeMediaUrl(u), false, JSON.stringify(u));
      assert.strictEqual(new URL(u, 'https://mylingo.invalid/').host, 'evil.com', 'sanity: the parser really does send ' + JSON.stringify(u) + ' off-host');
    });
    ['java\tscript:alert(1)', 'JAVA\nSCRIPT:alert(1)', '\u0001javascript:alert(1)', 'da\tta:text/html,x', '\u0001data:text/html,x', 'vb\rscript:x', 'fi\nle:///etc/passwd', ' \u0001 javascript:x'].forEach((u) => assert.strictEqual(SU.isSafeMediaUrl(u), false, JSON.stringify(u)));
    ['\u0001/ok/a.png', '/ok/a.png\u0001', '/o\tk/a.png', 'im\nages/a.png', '\\evil.com', '/\u200b/evil.com', '\u0001https://good.com/a.png', 'https://go\tod.com/a.png', '\u0001./a.png'].forEach((u) => assert.strictEqual(SU.isSafeMediaUrl(u), true, JSON.stringify(u) + ' stays on the allowed side'));
    assert.strictEqual(SU.isSafeMediaUrl('\u0001\u0002'), true, 'controls only: parses as the base itself (pinned, blank after parsing)');
  });

  test('isSafeMediaUrl: a value the URL parser cannot parse is rejected (caught, never thrown); the UMD wrapper also exports through CommonJS (Agent 203 sweep)', () => {
    ['http:', 'https://', 'http://[', 'https://exa mple.com', 'http://a:b:c@'].forEach((u) => assert.strictEqual(SU.isSafeMediaUrl(u), false, u));
    const mod = { exports: {} }; new Function('self', 'module', fs.readFileSync(path.join(root, 'shared/js/safe-url.js'), 'utf8'))({}, mod);
    assert.deepStrictEqual(Object.keys(mod.exports).sort(), ['isSafeMediaUrl', 'isSafeRedirect']); assert.strictEqual(mod.exports.isSafeMediaUrl('https://a.b/c'), true);
    const selfOnly = {}; new Function('self', 'module', fs.readFileSync(path.join(root, 'shared/js/safe-url.js'), 'utf8'))(selfOnly, {});
    assert.ok(selfOnly.MylingoSafeUrl && typeof selfOnly.MylingoSafeUrl.isSafeRedirect === 'function', 'a module object without exports falls back to the browser global');
  });

  test('isSafeMediaUrl / isSafeRedirect: non-string values are rejected; only "./" and "../" prefixes redirect (pinned)', () => {
    [{}, [], ['./a'], true, false, 0, NaN, () => 1].forEach((v) => { assert.strictEqual(SU.isSafeMediaUrl(v), false); assert.strictEqual(SU.isSafeRedirect(v), false); });
    ['./a', '../a', './', '../', '../../a/b.html', './a1/dashboard.html', './/x'].forEach((v) => assert.strictEqual(SU.isSafeRedirect(v), true, v));
    ['', '.', '..', '.a/b', '/a', '//a', 'a/b', ' ./a', '.\\a', '..\\a', '.\t/a', 'http://x', 'javascript:x', '.:/x'].forEach((v) => assert.strictEqual(SU.isSafeRedirect(v), false, JSON.stringify(v)));
    assert.deepStrictEqual(Object.keys(SU).sort(), ['isSafeMediaUrl', 'isSafeRedirect']);
  });

  const oSrc = fs.readFileSync(path.join(root, 'shared/js/orientation.js'), 'utf8');
  function loadO(storage) {
    const w = {}; const ctx = vm.createContext({ window: w, localStorage: storage });
    vm.runInContext(oSrc, ctx); return w.MylingoOrientation;
  }
  const O = loadO(makeFakeStorage());

  test('orientation answers: only a real number or a non-blank numeric string is an answer — true / false / [] / [2] / {} are unanswered (Agent 203 fix)', () => {
    const rec = (a) => J(O.recommendation(a));
    const base = J(O.recommendation([]));
    [true, false, [], [2], {}, null, undefined, '', '  ', 'x', NaN, Infinity, -Infinity, 'Infinity'].forEach((junk) => {
      const a = Array(10).fill(junk);
      assert.strictEqual(O.scoreAnswers(a), 0, 'answers all ' + JSON.stringify(junk));
      assert.deepStrictEqual(rec(a), base, 'recommendation for ' + JSON.stringify(junk));
    });
    assert.deepStrictEqual(rec(Array(10).fill(true)).signals, { listening: null, speaking: null, reading: null, writing: null, grammar: null });
    assert.strictEqual(O.scoreAnswers(['4', ' 4 ']), 4 * 1 + 4 * 1.25, 'numeric strings count'); assert.strictEqual(O.scoreAnswers([0]), 0);
    assert.strictEqual(O.scoreAnswers([9, -3]), 4 * 1 + 0, 'out-of-range clamps per answer');
    assert.deepStrictEqual(rec([4, 4, 4, 4, 4, 4, 4, 4, 4, 4]).level, 'b1');
    assert.strictEqual(O.scoreAnswers({ 0: 4, 1: 4 }), 4 + 5, 'an index-keyed object is read positionally'); assert.strictEqual(O.scoreAnswers(null), 0);
  });

  test('levelFromScore: a real number or numeric string; junk / NaN / missing is 0 = A1, never undefined; ends clamp (Agent 203 fix)', () => {
    [undefined, null, NaN, 'x', '', '  ', {}, [], true, false, -1, -Infinity, '-5'].forEach((v) => assert.strictEqual(O.levelFromScore(v), 'a1', String(v)));
    assert.strictEqual(O.levelFromScore('7'), 'a2'); assert.strictEqual(O.levelFromScore(' 14 '), 'b1');
    assert.deepStrictEqual([Infinity, 1e9, 'Infinity'].map(O.levelFromScore), ['c2', 'c2', 'c2']);
    assert.strictEqual(O.levelFromScore([7]), 'a1', '[7] is not a number');
    assert.strictEqual(O.levelFromScore(O.MAX_SCORE), 'c2'); assert.strictEqual(O.levelFromScore(O.MAX_SCORE / 2), 'b2');
  });

  test('QUESTIONS content is pinned: ten questions of five answers, exact ids in order, and a SHA-256 of the whole text so any copy edit is a deliberate, reviewed change (Agent 203 sweep)', () => {
    assert.deepStrictEqual(J(O.QUESTIONS).map((q) => q.id), ['confidence', 'listening', 'speaking', 'reading', 'writing', 'grammar', 'vocabulary', 'exposure', 'goal', 'selfEstimate']);
    assert.ok(O.QUESTIONS.every((q) => q.text && q.answers.length === 5 && q.answers.every((a) => typeof a === 'string' && a)));
    assert.strictEqual(require('crypto').createHash('sha256').update(JSON.stringify(J(O.QUESTIONS))).digest('hex'), '72e18f3b1129833977ce836f91259acd6ebfa918261cb5678dce81b505b69fbe', 'question / answer wording changed: update this hash together with the copy');
    assert.strictEqual(O.MAX_SCORE, 42); assert.strictEqual(O.STORAGE_KEY, 'mylingo.orientation.v1'); assert.deepStrictEqual(J(O.LEVELS), ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
  });

  test('writeState: only a JSON-serialisable value is written — undefined / a function used to store the string "undefined" and report success (Agent 203 fix)', () => {
    const st = makeFakeStorage(); const Q = loadO(st);
    [undefined, () => 1, Symbol('x')].forEach((v) => { assert.strictEqual(Q.writeState(v), false); assert.strictEqual(st.getItem('mylingo.orientation.v1'), null, 'nothing written'); });
    assert.strictEqual(Q.writeState({ a: 1 }), true); assert.deepStrictEqual(J(Q.readState()), { a: 1 });
    assert.strictEqual(Q.writeState(null), true); assert.strictEqual(st.getItem('mylingo.orientation.v1'), 'null'); assert.strictEqual(Q.readState(), null);
    const cyc = {}; cyc.self = cyc; assert.strictEqual(Q.writeState(cyc), false, 'a circular value is a caught failure');
    assert.strictEqual(loadO({ getItem() { return null; }, setItem() { throw new Error('quota'); } }).writeState({}), false);
    ['[1]', '"s"', '5', '{bad', ''].forEach((raw) => { st.setItem('mylingo.orientation.v1', raw); assert.strictEqual(Q.readState(), null, raw); });
  });
})();

// ============================================================
console.log('recommendations.js + quiz.html renderPlacementRecommendations (Agent 166)');
// ============================================================
(function () {
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const recSrc = fs.readFileSync(path.join(root, 'shared/js/recommendations.js'), 'utf8');
  const placementSrc = fs.readFileSync(path.join(root, 'shared/js/placement.js'), 'utf8');
  function freshRec() {
    const w = { localStorage: makeFakeStorage() };
    new Function('global', 'window', recSrc)(w, w);
    return w.MylingoRecommendations;
  }
  const REC = freshRec();
  const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
  const profile = (skills, counts, level) => ({ recommended_level: level || 'b1', skills, skill_counts: counts });
  const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  const manifests = {};
  LEVELS.forEach((lv) => { manifests[lv] = JSON.parse(fs.readFileSync(path.join(root, lv, 'quizzes.json'), 'utf8')); });

  // ---------- module surface ----------
  test('exports are copies: mutating them cannot change the rules the module applies', () => {
    const R = freshRec();
    R.LEVELS.push('zz'); R.SKILLS.length = 0; R.RULES.support_below = 0; R.RULES.max_recommendations = 99; R.CATEGORY_BY_SKILL.grammar = 'Nope';
    const recs = R.recommendSkillLevels(profile({ grammar: 50, vocabulary: 40, reading: 30, writing: 20 }, { grammar: 5, vocabulary: 5, reading: 5, writing: 5 }));
    assert.strictEqual(recs.length, 3, 'limit is still the built-in 3');
    assert.strictEqual(recs[2].reason, 'support');
    assert.strictEqual(REC.CATEGORY_BY_SKILL.grammar, 'Grammar');
    assert.deepStrictEqual(REC.LEVELS, LEVELS);
    assert.deepStrictEqual(REC.RULES, { min_reported_questions: 2, max_recommendations: 3, support_below: 60, stretch_at_or_above: 90, developing_from: 60, secure_from: 80 });
  });

  test('usage shares the Grammar category; every skill has a category', () => {
    assert.strictEqual(REC.CATEGORY_BY_SKILL.usage, 'Grammar');
    REC.SKILLS.forEach((s) => assert.ok(REC.CATEGORY_BY_SKILL[s], s + ' has no category'));
  });

  // ---------- levels ----------
  test('normalizeLevel: case-insensitive, junk and empty fall back to a1', () => {
    assert.deepStrictEqual(['B1', 'c2', 'a1'].map(REC.normalizeLevel), ['b1', 'c2', 'a1']);
    assert.deepStrictEqual([null, undefined, '', 'x', 7].map(REC.normalizeLevel), ['a1', 'a1', 'a1', 'a1', 'a1']);
  });

  test('levelAt: moves along the ladder, clamps at both ends, never returns undefined (Agent 166 fix)', () => {
    assert.deepStrictEqual([REC.levelAt('b1', 1), REC.levelAt('b1', -1), REC.levelAt('b1', 0)], ['b2', 'a2', 'b1']);
    assert.deepStrictEqual([REC.levelAt('c2', 1), REC.levelAt('a1', -1), REC.levelAt('b1', 99), REC.levelAt('b1', -99), REC.levelAt('b1', Infinity), REC.levelAt('b1', -Infinity)], ['c2', 'a1', 'c2', 'a1', 'c2', 'a1']);
    // these three returned undefined before the fix (LEVELS[NaN], LEVELS[2.5])
    assert.strictEqual(REC.levelAt('b1', 'x'), 'b1', 'a non-numeric offset means stay');
    assert.strictEqual(REC.levelAt('b1', 0.5), 'b1');
    assert.strictEqual(REC.levelAt('b1', 1.9), 'b2', 'fractions truncate');
    assert.strictEqual(REC.levelAt('b1', '1'), 'b2');
    assert.strictEqual(REC.levelAt('nonsense', 1), 'a2', 'junk base is a1');
  });

  // ---------- score bands ----------
  test('scoreBand: 0-59 needs_support, 60-79 developing, 80-89 secure, 90+ strong; clamps and tolerates junk', () => {
    const key = (n) => REC.scoreBand(n).key;
    assert.deepStrictEqual([0, 59.99, 60, 79.99, 80, 89.99, 90, 100].map(key), ['needs_support', 'needs_support', 'developing', 'developing', 'secure', 'secure', 'strong', 'strong']);
    assert.deepStrictEqual([-5, 250, NaN, null, undefined, 'abc', '85'].map(key), ['needs_support', 'strong', 'needs_support', 'needs_support', 'needs_support', 'needs_support', 'secure']);
    assert.deepStrictEqual(REC.scoreBand(85), { min: 80, key: 'secure', label: 'Secure' });
  });

  test('scoreBand: a 0-100 sweep in 0.0005 steps matches an independent reference (no holes between bands)', () => {
    const ref = (n) => (n >= 90 ? 'strong' : n >= 80 ? 'secure' : n >= 60 ? 'developing' : 'needs_support');
    const bad = [];
    for (let i = 0; i <= 200000; i++) { const n = i * 0.0005; if (REC.scoreBand(n).key !== ref(n)) bad.push(n); }
    assert.deepStrictEqual(bad.slice(0, 5), []);
  });

  test('RULES thresholds and SCORE_BANDS cannot drift: for every whole score the rule and the band agree', () => {
    const want = (n) => (n < 60 ? ['support', 'needs_support'] : n >= 90 ? ['stretch', 'strong'] : n >= 80 ? ['reinforce', 'secure'] : ['practice', 'developing']);
    for (let n = 0; n <= 100; n++) {
      const r = REC.recommendationForSkill('grammar', n, 'b1');
      assert.deepStrictEqual([r.reason, r.score_band], want(n), 'score ' + n);
    }
  });

  // ---------- one skill -> one recommendation ----------
  test('recommendationForSkill: level shift and label per rule (support -1, practice/reinforce 0, stretch +1)', () => {
    const at = (n) => { const r = REC.recommendationForSkill('vocabulary', n, 'b1'); return [r.level, r.reason, r.label]; };
    assert.deepStrictEqual(at(59), ['a2', 'support', 'Build foundations']);
    assert.deepStrictEqual(at(60), ['b1', 'practice', 'Targeted practice']);
    assert.deepStrictEqual(at(79), ['b1', 'practice', 'Targeted practice']);
    assert.deepStrictEqual(at(80), ['b1', 'reinforce', 'Reinforce your skills']);
    assert.deepStrictEqual(at(89), ['b1', 'reinforce', 'Reinforce your skills']);
    assert.deepStrictEqual(at(90), ['b2', 'stretch', 'Stretch your skills']);
  });

  test('recommendationForSkill: the ladder ends hold (support at a1 stays a1, stretch at c2 stays c2)', () => {
    assert.strictEqual(REC.recommendationForSkill('grammar', 10, 'a1').level, 'a1');
    assert.strictEqual(REC.recommendationForSkill('grammar', 100, 'c2').level, 'c2');
  });

  test('recommendationForSkill: result shape, category, rounding, clamping, skill case', () => {
    const r = REC.recommendationForSkill('Usage', 66.666, 'B2');
    assert.deepStrictEqual(r, { skill: 'usage', category: 'Grammar', score: 66.67, score_band: 'developing', level: 'b2', reason: 'practice', label: 'Targeted practice' });
    assert.strictEqual(REC.recommendationForSkill('grammar', 140, 'b1').score, 100);
    assert.strictEqual(REC.recommendationForSkill('grammar', -20, 'b1').score, 0);
    assert.strictEqual(REC.recommendationForSkill('grammar', ' 75 ', 'b1').score, 75, 'numeric strings are accepted');
    assert.strictEqual(REC.recommendationForSkill('grammar', 50, 'junk').level, 'a1', 'junk base level is a1');
  });

  test('recommendationForSkill: unknown skills and non-scores give null — a blank/boolean is NOT a 0% result (Agent 166 fix)', () => {
    ['', 'speaking', null, undefined, 7].forEach((s) => assert.strictEqual(REC.recommendationForSkill(s, 80, 'b1'), null, 'skill ' + s));
    // '' and false used to become Number(...) === 0 -> "Build foundations", a level down
    [null, undefined, '', '   ', true, false, NaN, Infinity, 'abc', {}, []].forEach((v) => assert.strictEqual(REC.recommendationForSkill('grammar', v, 'b1'), null, 'score ' + JSON.stringify(v)));
    assert.strictEqual(REC.recommendationForSkill('grammar', 0, 'b1').reason, 'support', 'a real 0 still counts');
  });

  // ---------- catalog availability ----------
  test('availableLevels: an available target is kept; a missing one falls back to a neighbour, lower first', () => {
    assert.strictEqual(REC.recommendationForSkill('grammar', 95, 'b1', ['b1', 'b2']).level, 'b2');
    assert.strictEqual(REC.recommendationForSkill('grammar', 95, 'b1', ['b1']).level, 'b1', 'stretch target b2 absent -> b1');
    assert.strictEqual(REC.recommendationForSkill('grammar', 95, 'b1', ['B1']).level, 'b1', 'entries are case-insensitive');
    assert.strictEqual(REC.recommendationForSkill('grammar', 30, 'b1', ['b1', 'b2']).level, 'b1', 'support target a2 absent -> its upper neighbour');
    assert.strictEqual(REC.recommendationForSkill('grammar', 95, 'b1', ['a1']), null, 'nothing within one step -> null');
  });

  test('availableLevels: junk entries do not count as A1 (Agent 166 fix); empty/non-array means unconstrained', () => {
    assert.strictEqual(REC.recommendationForSkill('grammar', 10, 'a1', ['zz']), null, 'junk-only catalog has no A1');
    assert.strictEqual(REC.recommendationForSkill('grammar', 10, 'a2', ['zz', null, 42, 'c1']), null);
    assert.strictEqual(REC.recommendationForSkill('grammar', 10, 'a2', ['zz', 'a1']).level, 'a1', 'the real entry still counts');
    assert.strictEqual(REC.recommendationForSkill('grammar', 95, 'b1', []).level, 'b2');
    assert.strictEqual(REC.recommendationForSkill('grammar', 95, 'b1', 'b2').level, 'b2');
  });

  // ---------- a whole profile ----------
  test('recommendSkillLevels: weakest first, ties by skill order, default cap of 3, items carry question_count', () => {
    const recs = REC.recommendSkillLevels(profile(
      { grammar: 70, vocabulary: 40, reading: 40, writing: 95, listening: 50, usage: 10 },
      { grammar: 5, vocabulary: 4, reading: 3, writing: 2, listening: 6, usage: 2 }));
    assert.deepStrictEqual(recs.map((r) => [r.skill, r.score, r.question_count]), [['usage', 10, 2], ['vocabulary', 40, 4], ['reading', 40, 3]]);
  });

  test('recommendSkillLevels: a skill needs >= 2 questions and a real score to be reported', () => {
    const recs = REC.recommendSkillLevels(profile(
      { grammar: 50, vocabulary: 50, reading: null, writing: '', listening: 50, usage: 50 },
      { grammar: 1, vocabulary: '3', reading: 9, writing: 9, usage: 0 }));
    assert.deepStrictEqual(recs.map((r) => r.skill), ['vocabulary'], 'grammar has 1, listening has no count, usage has 0, reading/writing have no score');
  });

  test('recommendSkillLevels: base level precedence is options.base_level > recommended_level > assessed_level > a1', () => {
    const p = (extra) => Object.assign({ skills: { grammar: 95 }, skill_counts: { grammar: 4 } }, extra);
    const lv = (prof, opts) => REC.recommendSkillLevels(prof, opts)[0].level;
    assert.strictEqual(lv(p({ recommended_level: 'a2', assessed_level: 'c1' }), { base_level: 'b2' }), 'c1');
    assert.strictEqual(lv(p({ recommended_level: 'a2', assessed_level: 'c1' })), 'b1');
    assert.strictEqual(lv(p({ assessed_level: 'c1' })), 'c2');
    assert.strictEqual(lv(p({})), 'a2');
  });

  test('recommendSkillLevels: max_recommendations — an explicit 0 returns nothing, junk falls back to 3 (Agent 166 fix)', () => {
    const p = profile({ grammar: 10, vocabulary: 20, reading: 30, writing: 40, usage: 50 }, { grammar: 2, vocabulary: 2, reading: 2, writing: 2, usage: 2 });
    const n = (v) => REC.recommendSkillLevels(p, { max_recommendations: v }).length;
    assert.deepStrictEqual([n(0), n(1), n(2), n(5), n(99), n(2.5), n('2')], [0, 1, 2, 5, 5, 2, 2]);
    assert.deepStrictEqual([n(-1), n(-0.5)], [0, 0], 'negative means none');
    assert.deepStrictEqual([n(undefined), n(null), n(''), n('x'), n(NaN), n(Infinity)], [3, 3, 3, 3, 3, 3], 'not a usable number -> the default of 3');
  });

  test('recommendSkillLevels: empty, missing and malformed profiles give [] and never throw; the input is not mutated', () => {
    [undefined, null, {}, [], 'x', 7, { skills: null }, { skills: [], skill_counts: [] }, { skills: { grammar: 50 } }, { skills: 'x', skill_counts: 'y' }, { skill_counts: { grammar: 9 } }]
      .forEach((p) => assert.deepStrictEqual(REC.recommendSkillLevels(p), [], JSON.stringify(p)));
    assert.deepStrictEqual(REC.recommendSkillLevels(profile({ grammar: 50 }, { grammar: 2 }), null).map((r) => r.skill), ['grammar'], 'null options');
    const frozen = deepFreeze(profile({ grammar: 95, vocabulary: 30 }, { grammar: 4, vocabulary: 4 }, 'b1'));
    assert.strictEqual(REC.recommendSkillLevels(frozen, deepFreeze({ available_levels: ['a1', 'b1', 'b2'] })).length, 2);
  });

  test('recommendSkillLevels: options.available_levels steers targets and drops unrepresentable ones', () => {
    const p = profile({ grammar: 95, vocabulary: 30 }, { grammar: 4, vocabulary: 4 }, 'b1');
    assert.deepStrictEqual(REC.recommendSkillLevels(p, { available_levels: ['b1'] }).map((r) => [r.skill, r.level]), [['vocabulary', 'b1'], ['grammar', 'b1']]);
    assert.deepStrictEqual(REC.recommendSkillLevels(p, { available_levels: ['c2'] }), []);
  });

  test('validateProfile: is true for every input (it only re-checks recommendSkillLevels output) and never throws', () => {
    [undefined, null, {}, 'x', profile({ grammar: 50 }, { grammar: 9 }), { skills: { grammar: 'junk' }, skill_counts: { grammar: 9 } }].forEach((p) => assert.strictEqual(REC.validateProfile(p), true));
  });

  // ---------- recommendations -> quizzes ----------
  const recOf = (skill, level, extra) => Object.assign({ skill, category: REC.CATEGORY_BY_SKILL[skill], level, score: 50, score_band: 'needs_support', reason: 'support', label: 'Build foundations' }, extra);
  const mk = (id, category) => ({ id, title: 'T ' + id, category });

  test('resolveQuizPicks: first quiz of the recommended category at the recommended level, matched case-insensitively', () => {
    const picks = REC.resolveQuizPicks([recOf('grammar', 'b1'), recOf('vocabulary', 'b1')], { b1: [mk('x1', 'Writing'), mk('g2', 'GRAMMAR'), mk('g3', 'Grammar'), mk('v1', 'vocabulary')] });
    assert.deepStrictEqual(picks.map((p) => [p.skill, p.quiz.id]), [['grammar', 'g2'], ['vocabulary', 'v1']]);
    assert.deepStrictEqual(Object.keys(picks[0]).sort(), ['label', 'level', 'quiz', 'reason', 'score', 'score_band', 'skill']);
  });

  test('resolveQuizPicks: a recommendation with no quiz at that level/category is dropped, not moved to another level', () => {
    const picks = REC.resolveQuizPicks([recOf('reading', 'b1'), recOf('grammar', 'c2'), recOf('grammar', 'b1')], { b1: [mk('g1', 'Grammar')], c1: [mk('gc', 'Grammar')] });
    assert.deepStrictEqual(picks.map((p) => p.quiz.id), ['g1']);
  });

  test('resolveQuizPicks: grammar and usage both target Grammar — the same quiz is offered once, to the weaker skill (Agent 166 fix)', () => {
    const picks = REC.resolveQuizPicks([recOf('usage', 'b2', { score: 30 }), recOf('grammar', 'b2', { score: 40 }), recOf('vocabulary', 'b2')], { b2: [mk('g1', 'Grammar'), mk('g2', 'Grammar'), mk('v1', 'Vocabulary')] });
    assert.deepStrictEqual(picks.map((p) => [p.skill, p.quiz.id]), [['usage', 'g1'], ['vocabulary', 'v1']]);
    const apart = REC.resolveQuizPicks([recOf('usage', 'a2'), recOf('grammar', 'b2')], { a2: [mk('g-a', 'Grammar')], b2: [mk('g-b', 'Grammar')] });
    assert.deepStrictEqual(apart.map((p) => p.quiz.id), ['g-a', 'g-b'], 'different levels are different quizzes');
    const noIds = { category: 'Grammar' };
    assert.strictEqual(REC.resolveQuizPicks([recOf('usage', 'b2'), recOf('grammar', 'b2')], { b2: [noIds] }).length, 1, 'id-less quizzes dedupe by identity');
  });

  test('resolveQuizPicks: junk manifest keys cannot overwrite A1; upper-case keys fold in; same-level lists concatenate (Agent 166 fix)', () => {
    const p = [recOf('grammar', 'a1')];
    assert.deepStrictEqual(REC.resolveQuizPicks(p, { a1: [mk('real', 'Grammar')], junk: [mk('fake', 'Grammar')], '': [mk('fake2', 'Grammar')] }).map((x) => x.quiz.id), ['real']);
    assert.deepStrictEqual(REC.resolveQuizPicks(p, { junk: [mk('fake', 'Grammar')], a1: [mk('real', 'Grammar')] }).map((x) => x.quiz.id), ['real'], 'key order does not matter');
    assert.deepStrictEqual(REC.resolveQuizPicks(p, { A1: [mk('up', 'Grammar')] }).map((x) => x.quiz.id), ['up']);
    assert.deepStrictEqual(REC.resolveQuizPicks(p, { A1: [mk('w', 'Writing')], a1: [mk('g', 'Grammar')] }).map((x) => x.quiz.id), ['g'], 'nothing is lost when two keys share a level');
  });

  test('resolveQuizPicks: tolerates junk — null/non-array inputs, null recommendations, null quizzes, non-array lists (Agent 166 fix for null entries)', () => {
    [undefined, null, {}, 'x', 5].forEach((r) => assert.deepStrictEqual(REC.resolveQuizPicks(r, manifests), []));
    [undefined, null, 'x', 5, []].forEach((m) => assert.deepStrictEqual(REC.resolveQuizPicks([recOf('grammar', 'a1')], m), []));
    assert.deepStrictEqual(REC.resolveQuizPicks([null, undefined, 'x', 3, recOf('grammar', 'a1')], { a1: [null, undefined, 7, mk('g', 'Grammar')] }).map((p) => p.quiz.id), ['g']);
    assert.deepStrictEqual(REC.resolveQuizPicks([recOf('grammar', 'a1')], { a1: 'not a list' }), []);
    assert.deepStrictEqual(REC.resolveQuizPicks([{ skill: 'grammar' }], { a1: [mk('g', 'Grammar')] }), [], 'a recommendation with no level/category matches nothing');
  });

  test('resolveQuizPicks: does not modify the manifests or the recommendations it is given', () => {
    const recs = deepFreeze([recOf('grammar', 'b1')]);
    const m = deepFreeze({ b1: [mk('g', 'Grammar')] });
    assert.strictEqual(REC.resolveQuizPicks(recs, m)[0].quiz, m.b1[0], 'the manifest entry itself is returned (same reference)');
  });

  // ---------- against the real shipped manifests ----------
  test('every level ships a Grammar and a Vocabulary quiz, so those recommendations always resolve, with a usable id and title', () => {
    LEVELS.forEach((lv) => {
      ['grammar', 'vocabulary'].forEach((skill) => {
        const picks = REC.resolveQuizPicks([recOf(skill, lv)], manifests);
        assert.strictEqual(picks.length, 1, skill + ' ' + lv);
        assert.ok(picks[0].quiz.id && picks[0].quiz.title, skill + ' ' + lv + ' quiz needs an id and a title for the link');
        assert.strictEqual(picks[0].level, lv);
      });
    });
  });

  test('every recommendation over every score/skill/level/catalog combination resolves to a shipped quiz of the right category or to nothing', () => {
    const bad = [];
    REC.SKILLS.forEach((skill) => LEVELS.forEach((lv) => [0, 59, 60, 85, 90, 100].forEach((score) => {
      const rec = REC.recommendationForSkill(skill, score, lv, LEVELS);
      const pick = REC.resolveQuizPicks([rec], manifests)[0];
      if (pick && (String(pick.quiz.category).toLowerCase() !== rec.category.toLowerCase() || !manifests[rec.level].includes(pick.quiz))) bad.push([skill, lv, score]);
    })));
    assert.deepStrictEqual(bad, []);
  });

  // ---------- real placement profile -> recommendations -> picks ----------
  function realProfile(level, correctBySkill) {
    const w = { localStorage: makeFakeStorage() };
    new Function('global', 'window', placementSrc)(w, w);
    const bank = JSON.parse(fs.readFileSync(path.join(root, 'placement', level, 'placement-001.json'), 'utf8'));
    const qs = bank.questions.filter((q) => (q.question_type || 'radio') !== 'banner');
    const seen = {}; const correctMap = {};
    qs.forEach((q, i) => { seen[q.skill] = seen[q.skill] || 0; correctMap[i] = seen[q.skill] < (correctBySkill[q.skill] || 0); seen[q.skill]++; });
    return w.MylingoPlacement.calculateResult({ questions: qs, correctMap, quiz_id: 'placement-001', stage: 'primary', estimated_level: level, assessed_level: level, score: 60, graded_questions: qs.length, complete: true, assessment_quiz_ids: ['placement-001'] });
  }

  test('real C1 placement profile: grammar and usage both weak -> both recommended at B2, but only ONE B2 Grammar quiz is offered (Agent 166 fix)', () => {
    const p = realProfile('c1', { grammar: 2, usage: 1, vocabulary: 2 });
    assert.deepStrictEqual([p.skills.grammar, p.skills.usage, p.skills.vocabulary, p.skill_counts.usage], [50, 50, 100, 2], 'the shipped C1 bank has 2 usage items, enough to be reported');
    const recs = REC.recommendSkillLevels(p);
    assert.deepStrictEqual(recs.map((r) => [r.skill, r.level, r.reason]), [['grammar', 'b2', 'support'], ['usage', 'b2', 'support'], ['vocabulary', 'c2', 'stretch']]);
    const picks = REC.resolveQuizPicks(recs, manifests);
    assert.deepStrictEqual(picks.map((x) => [x.skill, x.quiz.id]), [['grammar', 'b2-001'], ['vocabulary', 'c2-005']]);
    assert.strictEqual(new Set(picks.map((x) => x.quiz.id)).size, picks.length, 'no quiz twice');
  });

  test('real A1 placement profile: a strong learner is stretched to A2, a weak skill stays at A1 (the ladder floor)', () => {
    const p = realProfile('a1', { grammar: 7, vocabulary: 0 });
    const recs = REC.recommendSkillLevels(p);
    assert.deepStrictEqual(recs.map((r) => [r.skill, r.score, r.level]), [['grammar', 100, 'a2']], 'vocabulary/reading/writing have <2 items in the A1 bank so they are not reported');
    assert.deepStrictEqual(REC.recommendSkillLevels(realProfile('a1', { grammar: 0 })).map((r) => [r.skill, r.level, r.reason]), [['grammar', 'a1', 'support']]);
  });

  // ---------- quiz.html renderPlacementRecommendations, run for real ----------
  const quizHtml = fs.readFileSync(path.join(root, 'shared', 'quiz.html'), 'utf8');
  function renderSandbox(opts) {
    const w = { localStorage: makeFakeStorage() };
    new Function('global', 'window', recSrc)(w, w);
    if (opts.noRec) delete w.MylingoRecommendations;
    const box = { innerHTML: '<div>PROFILE</div>' };
    const calls = [];
    const fakeFetch = (url, init) => {
      calls.push([url, init && init.cache]);
      const r = opts.serve(url);
      if (r instanceof Error) return Promise.reject(r);
      if (r === 'not-ok') return Promise.resolve({ ok: false, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(r) });
    };
    const src = 'const $=function(){return box};\n' + extractFn(quizHtml, 'esc') + '\n' + extractFn(quizHtml, 'renderPlacementRecommendations') + '\n({run:renderPlacementRecommendations})';
    const env = vm.runInContext(src, vm.createContext({ window: w, box, fetch: fakeFetch }));
    return { box, calls, run: async (p) => { env.run(p); await new Promise((r) => setImmediate(r)); } };
  }
  const serveReal = (url) => { const m = /\.\.\/([a-c][12])\/quizzes\.json$/.exec(url); return m ? manifests[m[1]] : new Error('404 ' + url); };

  testAsync('renderPlacementRecommendations: appends one link per distinct quiz, fetching each needed level once with no-store', async () => {
    const s = renderSandbox({ serve: serveReal });
    await s.run(realProfile('c1', { grammar: 2, usage: 1, vocabulary: 2 }));
    assert.deepStrictEqual(s.calls.slice().sort(), [['../b2/quizzes.json', 'no-store'], ['../c2/quizzes.json', 'no-store']]);
    assert.ok(s.box.innerHTML.startsWith('<div>PROFILE</div>'), 'appends; the profile panel is kept');
    assert.ok(s.box.innerHTML.includes('<strong>Skill-level recommendations</strong>'));
    const hrefs = [...s.box.innerHTML.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepStrictEqual(hrefs, ['./quiz.html?quiz=b2-001&level=b2&recommended=1', './quiz.html?quiz=c2-005&level=c2&recommended=1']);
    assert.ok(s.box.innerHTML.includes('(GRAMMAR · 50% · B2)') && s.box.innerHTML.includes('(VOCABULARY · 100% · C2)'));
  });

  testAsync('renderPlacementRecommendations: every link points at a quiz that exists in the manifest of the level in its URL', async () => {
    for (const lv of LEVELS) {
      const s = renderSandbox({ serve: serveReal });
      await s.run(profile({ grammar: 65, vocabulary: 65 }, { grammar: 5, vocabulary: 5 }, lv));
      const links = [...s.box.innerHTML.matchAll(/quiz=([^&"]+)&level=([^&"]+)&recommended=1/g)];
      assert.ok(links.length >= 1, lv + ': expected at least one link');
      links.forEach((m) => assert.ok(manifests[m[2]].some((q) => q.id === decodeURIComponent(m[1])), lv + ': ' + m[1] + ' not in ' + m[2] + ' manifest'));
    }
  });

  testAsync('renderPlacementRecommendations: titles are HTML-escaped and ids URL-encoded in the generated link', async () => {
    const s = renderSandbox({ serve: () => [{ id: 'a&b"c<d>', title: '<img src=x onerror=alert(1)> & "q"', category: 'Grammar' }] });
    await s.run(profile({ grammar: 65 }, { grammar: 5 }, 'a1'));
    assert.ok(!s.box.innerHTML.includes('<img'), 'no raw tag from a title');
    assert.ok(s.box.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot;'));
    assert.ok(s.box.innerHTML.includes('quiz=a%26b%22c%3Cd%3E&level=a1&recommended=1'));
  });

  testAsync('renderPlacementRecommendations: nothing to recommend, no module, no picks or failing fetches leave the panel untouched and never throw', async () => {
    const untouched = '<div>PROFILE</div>';
    let s = renderSandbox({ serve: serveReal });
    await s.run(profile({ grammar: 65 }, { grammar: 1 })); // < 2 questions -> no recs -> no network at all
    assert.deepStrictEqual([s.box.innerHTML, s.calls.length], [untouched, 0]);
    for (const bad of [null, undefined, {}]) { s = renderSandbox({ serve: serveReal }); await s.run(bad); assert.deepStrictEqual([s.box.innerHTML, s.calls.length], [untouched, 0]); }
    s = renderSandbox({ serve: serveReal, noRec: true });
    await s.run(profile({ grammar: 65 }, { grammar: 5 })); assert.deepStrictEqual([s.box.innerHTML, s.calls.length], [untouched, 0]);
    s = renderSandbox({ serve: () => new Error('offline') });
    await s.run(profile({ grammar: 65 }, { grammar: 5 })); assert.strictEqual(s.box.innerHTML, untouched, 'network failure');
    s = renderSandbox({ serve: () => 'not-ok' });
    await s.run(profile({ grammar: 65 }, { grammar: 5 })); assert.strictEqual(s.box.innerHTML, untouched, 'HTTP error');
    s = renderSandbox({ serve: () => ({ not: 'an array' }) });
    await s.run(profile({ grammar: 65 }, { grammar: 5 })); assert.strictEqual(s.box.innerHTML, untouched, 'non-array manifest');
    s = renderSandbox({ serve: () => [] });
    await s.run(profile({ grammar: 65 }, { grammar: 5 })); assert.strictEqual(s.box.innerHTML, untouched, 'empty manifest -> no picks');
  });

  testAsync('renderPlacementRecommendations: one level failing to load still shows the links for the levels that loaded', async () => {
    const s = renderSandbox({ serve: (url) => (url.includes('/c2/') ? new Error('offline') : serveReal(url)) });
    await s.run(realProfile('c1', { grammar: 2, usage: 1, vocabulary: 2 }));
    const hrefs = [...s.box.innerHTML.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepStrictEqual(hrefs, ['./quiz.html?quiz=b2-001&level=b2&recommended=1']);
  });
})();

// ============================================================
console.log('quiz.html placement results screen: placementContinue / renderPlacementResult / renderSuggestions + pending record (Agent 167)');
// ============================================================
(function () {
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
  const html = read('shared/quiz.html');
  const srcOf = { placement: read('shared/js/placement.js'), canonical: read('shared/js/canonical-metadata.js'), adapter: read('shared/js/runtime-v2-adapter.js') };
  const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  const load = (files, w) => { files.forEach((f) => new Function('global', 'window', srcOf[f])(w, w)); return w; };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------- the real page pipeline: bank JSON -> real runtime adapter -> real saveAssessmentResult ----------
  // Faithful to the browser: the adapter drops question ids, and every placement bank is "placement-001".
  function pipeline(level, nCorrect, opts) {
    opts = opts || {};
    const st = opts.st || makeFakeStorage();
    const w = load(['placement', 'canonical', 'adapter'], { localStorage: st });
    const quiz = w.MylingoRuntimeV2.normalizeQuiz(JSON.parse(read('placement/' + level + '/placement-001.json')), { level });
    const answerCorrect = {}; quiz.questions.forEach((q, k) => { answerCorrect[k] = k < nCorrect; });
    const src = 'const mode="placement",anchorLevel=' + JSON.stringify(opts.anchor || null) + ',stage=' + JSON.stringify(opts.stage || 'primary') + ',level=' + JSON.stringify(level) + ';\n' +
      'let data=null,answerCorrect={};\n' + ['rawType', 'gradedTotal', 'orientationEstimate', 'saveAssessmentResult'].map((n) => extractFn(html, n)).join('\n') + '\n({save:saveAssessmentResult,set:function(d,a){data=d;answerCorrect=a}})';
    const env = vm.runInContext(src, vm.createContext({ window: w, localStorage: st }));
    env.set(quiz, answerCorrect);
    return { st, graded: quiz.questions.length, profile: clone(env.save(Math.round(nCorrect / quiz.questions.length * 100))) };
  }

  // ---------- placementContinue + renderPlacementResult, run for real against a stubbed DOM ----------
  function resultSandbox(o) {
    const box = { style: {}, innerHTML: '' };
    const cb = { style: { display: 'none' }, textContent: '', onclick: null };
    const loc = { href: '' };
    let stopped = 0;
    const src = 'var score=' + (o.score || 0) + ',stage=' + JSON.stringify(o.stage || 'primary') + ',level=' + JSON.stringify(o.level || 'a1') + ',G=' + (o.graded == null ? 10 : o.graded) + ';\n' +
      'function $(id){return id==="continueBtn"?cb:box}\nfunction gradedTotal(){return G}\nfunction stopAllSounds(){stopped()}\n' +
      extractFn(html, 'renderPlacementResult') + '\n' + extractFn(html, 'placementContinue') + '\n({renderPlacementResult:renderPlacementResult,placementContinue:placementContinue})';
    const env = vm.runInContext(src, vm.createContext({ box, cb, location: loc, stopped: () => { stopped++; } }));
    return {
      panel: () => box.innerHTML, panelText: () => box.innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      shown: () => box.style.display === 'block',
      btn: () => ({ visible: cb.style.display === 'inline-flex', text: cb.textContent }),
      click: () => { cb.onclick(); return { href: loc.href, stopped }; },
      render: (p) => env.renderPlacementResult(p), cont: (p) => env.placementContinue(p),
    };
  }

  test('placementContinue: a recommended boundary check is ALWAYS startable — every lower-boundary check (score < 50%) used to be hidden by the 60% gate (Agent 167 fix)', () => {
    const lower = [];
    LEVELS.slice(1).forEach((lv) => { for (let n = 0; n <= 4; n++) { // A2..C2, 0-40%
      const { profile } = pipeline(lv, n);
      const s = resultSandbox({ score: n, level: lv }); s.render(profile); s.cont(profile);
      lower.push([lv, n * 10, profile.verification_level, s.btn().visible, s.btn().text]);
    } });
    assert.strictEqual(lower.length, 25);
    lower.forEach(([lv, pct, vl, visible, text]) => {
      assert.strictEqual(vl, LEVELS[LEVELS.indexOf(lv) - 1], lv + ' ' + pct + '%: the check is one level down');
      assert.ok(visible, lv + ' ' + pct + '%: the panel says a check is recommended, so the button that starts it must be there');
      assert.strictEqual(text, 'Continue to ' + vl.toUpperCase() + ' check');
    });
  });

  test('placement results screen, every level x every score of the real 10-question banks: the panel text, the button and the target quiz always agree', () => {
    let checks = 0, plain = 0, hidden = 0;
    LEVELS.forEach((lv) => { for (let n = 0; n <= 10; n++) {
      const { profile } = pipeline(lv, n);
      const s = resultSandbox({ score: n, level: lv }); s.render(profile); s.cont(profile);
      const needsCheck = !!profile.verification_level && profile.verification_level !== profile.assessed_level;
      const tag = lv + ' ' + n * 10 + '%';
      assert.strictEqual(s.btn().visible, needsCheck || n * 10 >= 60, tag + ': visible iff a check is pending or the 60% Continue gate is met');
      assert.strictEqual(/Boundary check recommended at/.test(s.panelText()), needsCheck, tag + ': panel announces a check iff one is pending');
      if (needsCheck) {
        checks++;
        const v = profile.verification_level.toUpperCase();
        assert.ok(s.panelText().includes('Boundary check recommended at ' + v + '.'), tag);
        assert.strictEqual(s.btn().text, 'Continue to ' + v + ' check', tag);
        const go = s.click();
        assert.strictEqual(go.href, '../shared/quiz.html?quiz=placement-001&level=' + profile.verification_level + '&mode=placement&stage=verification&anchor=' + profile.assessed_level, tag);
        assert.ok(fs.existsSync(path.join(root, 'placement', profile.verification_level, 'placement-001.json')), tag + ': the verification bank exists');
        assert.strictEqual(go.stopped, 1, tag + ': sounds stopped on navigation');
      } else if (s.btn().visible) {
        plain++;
        assert.strictEqual(s.btn().text, 'Continue to ' + profile.recommended_level.toUpperCase(), tag);
        assert.strictEqual(s.click().href, '../' + profile.recommended_level + '/index.html', tag);
        assert.ok(s.panelText().includes('Recommended level: ' + profile.recommended_level.toUpperCase()), tag);
      } else hidden++;
    } });
    assert.ok(checks > 0 && plain > 0 && hidden > 0, 'sanity: all three outcomes were exercised (' + [checks, plain, hidden] + ')');
  });

  test('placementContinue: with no boundary check the plain Continue keeps its 60% pass gate (product decision carried forward, pinned as current behaviour)', () => {
    const p = { recommended_level: 'a1', assessed_level: 'a1', verification_level: null, confidence: 'medium', skills: {} };
    let s = resultSandbox({ score: 5, level: 'a1' }); s.cont(p); assert.strictEqual(s.btn().visible, false, '50% -> hidden');
    s = resultSandbox({ score: 6, level: 'a1' }); s.cont(p); assert.deepStrictEqual(s.btn(), { visible: true, text: 'Continue to A1' }, '60% -> shown');
    s = resultSandbox({ score: 0, level: 'a1', graded: 0 }); s.cont(p); assert.strictEqual(s.btn().visible, true, 'nothing graded counts as 100%');
  });

  test('placementContinue: verification stage never starts another check, and null / partial profiles fall back to the quiz level', () => {
    const p = { recommended_level: 'b1', assessed_level: 'b1', verification_level: 'b2' };
    let s = resultSandbox({ score: 7, level: 'b1', stage: 'verification' }); s.cont(p);
    assert.deepStrictEqual(s.btn(), { visible: true, text: 'Continue to B1' }); assert.strictEqual(s.click().href, '../b1/index.html');
    s = resultSandbox({ score: 3, level: 'b1', stage: 'verification' }); s.cont(p); assert.strictEqual(s.btn().visible, false, 'a failed verification still hides Continue (product decision)');
    s = resultSandbox({ score: 8, level: 'c1' }); s.cont(null); assert.deepStrictEqual(s.btn(), { visible: true, text: 'Continue to C1' });
    s = resultSandbox({ score: 8, level: 'c1' }); s.cont({ assessed_level: 'c1' }); assert.strictEqual(s.btn().text, 'Continue to C1', 'no recommended_level -> quiz level');
    s = resultSandbox({ score: 3, level: 'c1' }); s.cont(null); assert.strictEqual(s.btn().visible, false);
  });

  test('placementContinue: the verification link uses exactly the URL parameters quiz.html reads back (quiz, level, mode, stage, anchor)', () => {
    ['quiz', 'level', 'mode', 'stage', 'anchor'].forEach((k) => assert.ok(html.includes("p.get('" + k + "')"), 'quiz.html no longer reads ?' + k));
    const { profile } = pipeline('b1', 9);
    const s = resultSandbox({ score: 9, level: 'b1' }); s.cont(profile);
    const q = new URLSearchParams(s.click().href.split('?')[1]);
    assert.deepStrictEqual([q.get('quiz'), q.get('level'), q.get('mode'), q.get('stage'), q.get('anchor')], ['placement-001', 'b2', 'placement', 'verification', 'b1']);
  });

  test('renderPlacementResult: real profiles render cleanly (no undefined/NaN/null), with the level, confidence and evidence count in the copy', () => {
    LEVELS.forEach((lv) => [0, 5, 7, 10].forEach((n) => {
      const { profile } = pipeline(lv, n);
      const s = resultSandbox({ score: n, level: lv }); s.render(profile);
      const t = s.panelText(), tag = lv + ' ' + n * 10 + '%';
      assert.ok(s.shown(), tag + ': the panel is displayed');
      assert.ok(!/undefined|NaN|null|\[object/.test(t), tag + ': ' + t);
      assert.ok(t.includes('Best starting level: ' + profile.recommended_level.toUpperCase() + ' · Confidence: ' + profile.confidence[0].toUpperCase() + profile.confidence.slice(1)), tag);
      assert.ok(t.includes('Evidence basis: ' + profile.evidence_question_count + ' graded questions'), tag);
    }));
  });

  test('renderPlacementResult: strong (>=80) and practice (<70) lists; a 70-79% skill appears in NEITHER list; unreported skills are skipped', () => {
    const s = resultSandbox({});
    s.render({ recommended_level: 'b1', assessed_level: 'b1', confidence: 'high', evidence_question_count: 10, skills: { grammar: 80, vocabulary: 79, reading: 70, usage: 69, writing: null, listening: null } });
    const t = s.panelText();
    assert.ok(t.includes('Strong areas Grammar') && !/Strong areas[^P]*Vocabulary/.test(t), 'only grammar is strong');
    assert.ok(t.includes('Practice next • Usage') && !t.includes('Reading') && !t.includes('Vocabulary'), '69 -> practice; 70 and 79 -> neither list (a UI gap: the recommendations engine calls 60-79 "developing")');
    s.render({ recommended_level: 'a1', assessed_level: 'a1', confidence: 'low', skills: { grammar: null } });
    assert.ok(!/Strong areas|Practice next/.test(s.panelText()) && s.panelText().includes('0 graded questions'), 'no skills -> neither section; missing evidence count -> 0');
    s.render({ recommended_level: 'a1', assessed_level: 'a1', confidence: 'low' });
    assert.ok(!/Strong areas|Practice next/.test(s.panelText()), 'no skills object at all');
  });

  test('renderPlacementResult: null profile is a no-op; a pending check shows the boundary copy, a settled one shows the recommended level', () => {
    const s = resultSandbox({});
    s.render(null); assert.deepStrictEqual([s.shown(), s.panel()], [false, '']);
    const base = { recommended_level: 'b1', assessed_level: 'b1', confidence: 'medium', skills: {} };
    s.render(Object.assign({}, base, { verification_level: 'b2' })); assert.ok(s.panelText().includes('Boundary check recommended at B2.') && !s.panelText().includes('Recommended level:'));
    s.render(Object.assign({}, base, { verification_level: 'b1' })); assert.ok(s.panelText().includes('Recommended level: B1'), 'verification_level equal to the assessed level is not a pending check');
    s.render(Object.assign({}, base, { verification_level: null })); assert.ok(s.panelText().includes('Recommended level: B1'));
  });

  test('renderPlacementResult: the 120-question result shows its band scores and mastery bar (real calculate120Placement output), not the 10-question copy', () => {
    const w = load(['placement'], { localStorage: makeFakeStorage() });
    const qs = [], map = {}; let n = 0;
    [['a1', 40, 30], ['a2', 40, 20], ['b1', 40, 10]].forEach(([lv, total, correct]) => { for (let k = 0; k < total; k++) { qs.push({ id: 'p' + n, skill: 'grammar', placement_level: lv }); map[n] = k < correct; n++; } });
    const r = clone(w.MylingoPlacement.calculate120Placement(qs, map));
    const s = resultSandbox({});
    s.render({ recommended_level: r.recommended_level, assessed_level: r.recommended_level, confidence: r.confidence, evidence_question_count: 120, skills: { grammar: 50 }, assessment_120: r });
    const t = s.panelText();
    assert.ok(t.includes('Your placement result') && !t.includes('Final placement'));
    assert.ok(t.includes('A1 ' + r.scores.a1 + '% · A2 ' + r.scores.a2 + '% · B1 ' + r.scores.b1 + '% · ' + r.mastery_threshold + '% mastery required to move up.'), t);
    assert.ok(t.includes('120 graded questions from the 120-question A1–B1 assessment.'));
    s.render({ recommended_level: 'a2', assessed_level: 'a2', confidence: 'low', evidence_question_count: 10, skills: {}, assessment_120: { question_count: 40, scores: { a1: 1, a2: 1, b1: 1 }, mastery_threshold: 70 } });
    assert.ok(s.panelText().includes('Final placement'), 'an assessment_120 block that is not 120 questions is treated as a normal result');
  });

  // ---------- saveAssessmentResult: pending boundary-check record + evidence ids (real chain) ----------
  test('saveAssessmentResult primary: a recommended boundary check writes the pending record the verification stage and the backup validator expect (Agent 167 fix — nothing wrote it before)', () => {
    [['a2', 2, 'a1'], ['a2', 9, 'b1'], ['c2', 3, 'c1'], ['b1', 10, 'b2']].forEach(([lv, n, vl]) => {
      const { st, profile } = pipeline(lv, n);
      assert.strictEqual(profile.verification_level, vl);
      const pending = JSON.parse(st.getItem('mylingo.assessment.pending.v1'));
      assert.deepStrictEqual([pending.version, pending.estimated_level, pending.primary_level, pending.verification_level, pending.primary_score, pending.primary_quiz_id], [1, lv, lv, vl, n * 10, 'placement-001'], lv + ' ' + n);
      const key = (e) => [e.question_id, e.skill, e.correct]; // calculateResult re-shapes entries (stages[]/quiz_ids[]); the answers must be the same
      assert.deepStrictEqual(pending.primary_evidence.map(key), profile.evidence.map(key), 'the pending record carries the same primary answers as the stored result');
      assert.ok(Number.isFinite(pending.timestamp));
      const check = GAM.validateBackup({ schema: 'mylingo.backup.v2', version: 2, exportedAt: '2026-05-01T00:00:00.000Z', sections: { placementPending: pending } });
      assert.deepStrictEqual([check.ok, check.valid_sections, check.invalid_sections], [true, ['placementPending'], []], 'must pass the backup validator');
    });
  });

  test('saveAssessmentResult primary: a result that needs no check writes no pending record and clears a stale one left by an abandoned check', () => {
    const { st } = pipeline('b1', 7);
    assert.strictEqual(st.getItem('mylingo.assessment.pending.v1'), null);
    const stale = makeFakeStorage(); stale.setItem('mylingo.assessment.pending.v1', '{"stale":true}');
    pipeline('b1', 7, { st: stale });
    assert.strictEqual(stale.getItem('mylingo.assessment.pending.v1'), null, 'stale record cleared');
    const failing = makeFakeStorage(); failing.setItem = () => { throw new Error('quota'); };
    assert.doesNotThrow(() => pipeline('a2', 2, { st: failing }), 'a storage failure must not break the results screen');
  });

  test('two-stage placement, real banks: the verification answers COUNT next to the primary ones (evidence ids are scoped by bank; they collided as placement-001:<i> before — Agent 167 fix)', () => {
    [['a2', 2, 4, 'a1'], ['a2', 9, 9, 'b1'], ['c2', 3, 6, 'c1']].forEach(([lv, n1, n2, vl]) => {
      const first = pipeline(lv, n1);
      const pending = JSON.parse(first.st.getItem('mylingo.assessment.pending.v1'));
      const second = pipeline(vl, n2, { st: first.st, stage: 'verification', anchor: lv });
      const p = second.profile, tag = lv + ' ' + n1 + '/' + vl + ' ' + n2;
      assert.strictEqual(p.evidence_question_count, 20, tag + ': ten primary + ten verification items');
      assert.strictEqual(p.evidence_correct_count, n1 + n2, tag + ': correct answers from BOTH stages (verification answers were replaced by the primary ones before)');
      assert.deepStrictEqual([p.primary_score, p.verification_score, p.estimated_level, p.assessed_level], [n1 * 10, n2 * 10, lv, vl], tag);
      assert.deepStrictEqual(p.evidence_stages, ['primary', 'verification']);
      const ids = p.evidence.map((e) => e.question_id);
      assert.strictEqual(new Set(ids).size, 20, tag + ': 20 distinct evidence ids');
      assert.ok(pending.primary_evidence.every((e) => e.question_id.startsWith(lv + ':')) && ids.filter((i) => i.startsWith(vl + ':')).length === 10, tag + ': ids scoped by the bank level');
      assert.strictEqual(second.st.getItem('mylingo.assessment.pending.v1'), null, tag + ': pending consumed');
      assert.strictEqual(JSON.parse(second.st.getItem('mylingo.assessment.v1')).evidence_question_count, 20, 'the stored result is the merged one');
    });
  });

  // ---------- renderSuggestions, run for real ----------
  function suggestSandbox(o) {
    const els = { suggest: { style: {} }, suggestGrid: { innerHTML: '' }, suggestCat: { textContent: '' } };
    const calls = { load: 0 };
    const src = 'var suggestPool=' + JSON.stringify(o.pool || []) + ',suggestAttempted=' + !!o.attempted + ',data=' + JSON.stringify(o.data === undefined ? { category: 'Grammar' } : o.data) + ',level=' + JSON.stringify(o.level || 'b1') + ';\n' +
      'function $(id){return els[id]}\n' + extractFn(html, 'esc') + '\n' +
      'function loadSuggestions(){calls.load++;if(LOAD_FAILS)return Promise.reject(new Error("x"));return Promise.resolve().then(function(){suggestPool=LOAD_POOL;return suggestPool})}\n' +
      extractFn(html, 'renderSuggestions') + '\n({run:renderSuggestions,attempted:function(){return suggestAttempted}})';
    const ctx = vm.createContext({ els, calls, LOAD_POOL: o.loads || [], LOAD_FAILS: !!o.loadFails });
    const env = vm.runInContext(src, ctx);
    return { els, calls, attempted: env.attempted, run: async () => { env.run(); for (let k = 0; k < 4; k++) await new Promise((r) => setImmediate(r)); } };
  }
  const items = (n) => Array.from({ length: n }, (_, k) => ({ id: 'q-' + k, title: 'Quiz ' + k, category: 'Grammar' }));
  const hrefsOf = (els) => [...els.suggestGrid.innerHTML.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  testAsync('renderSuggestions: at most three distinct picks from the pool, each linking to ./quiz.html?quiz=<id>&level=<level>&recommended=1, under the category heading', async () => {
    for (let round = 0; round < 8; round++) {
      const s = suggestSandbox({ pool: items(7), level: 'b2' }); await s.run();
      const hrefs = hrefsOf(s.els);
      assert.strictEqual(hrefs.length, 3); assert.strictEqual(new Set(hrefs).size, 3, 'no pick twice');
      hrefs.forEach((h) => assert.ok(/^\.\/quiz\.html\?quiz=q-[0-6]&level=b2&recommended=1$/.test(h), h));
      assert.deepStrictEqual([s.els.suggest.style.display, s.els.suggestCat.textContent], ['block', 'Grammar']);
      assert.strictEqual(s.calls.load, 0, 'a non-empty pool never re-fetches');
    }
    for (const n of [1, 2, 3]) { const s = suggestSandbox({ pool: items(n) }); await s.run(); assert.strictEqual(hrefsOf(s.els).length, n, 'a pool of ' + n + ' shows all of it'); }
  });

  testAsync('renderSuggestions: titles are HTML-escaped and ids URL-encoded', async () => {
    const s = suggestSandbox({ pool: [{ id: 'a&b"c<d>', title: '<img src=x onerror=alert(1)> & "q"' }] }); await s.run();
    assert.ok(!s.els.suggestGrid.innerHTML.includes('<img'));
    assert.ok(s.els.suggestGrid.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot;'));
    assert.ok(s.els.suggestGrid.innerHTML.includes('quiz=a%26b%22c%3Cd%3E&level=b1&recommended=1'));
  });

  testAsync('renderSuggestions: an empty pool is fetched exactly ONCE per quiz load (loop guard), then rendered; still empty stays hidden', async () => {
    let s = suggestSandbox({ pool: [], loads: items(4) }); await s.run();
    assert.deepStrictEqual([s.calls.load, s.attempted(), hrefsOf(s.els).length, s.els.suggest.style.display], [1, true, 3, 'block'], 'loaded then re-rendered');
    s = suggestSandbox({ pool: [], loads: [] }); await s.run(); await s.run(); await s.run();
    assert.deepStrictEqual([s.calls.load, s.els.suggest.style.display, s.els.suggestGrid.innerHTML], [1, 'none', ''], 'three renders, one fetch');
    s = suggestSandbox({ pool: [], attempted: true, loads: items(2) }); await s.run();
    assert.deepStrictEqual([s.calls.load, s.els.suggest.style.display], [0, 'none'], 'already attempted -> not again');
  });

  testAsync('renderSuggestions: no category, no data, or a failing load hides the box without throwing or an unhandled rejection', async () => {
    let s = suggestSandbox({ pool: [], data: {}, loads: items(3) }); await s.run(); assert.deepStrictEqual([s.calls.load, s.els.suggest.style.display], [0, 'none']);
    s = suggestSandbox({ pool: [], data: null, loads: items(3) }); await s.run(); assert.deepStrictEqual([s.calls.load, s.els.suggest.style.display], [0, 'none']);
    const seen = []; const onRej = (e) => seen.push(e); process.on('unhandledRejection', onRej);
    s = suggestSandbox({ pool: [], loadFails: true }); await s.run(); await new Promise((r) => setTimeout(r, 5));
    process.removeListener('unhandledRejection', onRej);
    assert.deepStrictEqual([s.calls.load, s.els.suggest.style.display, seen.length], [1, 'none', 0]);
  });

  testAsync('renderSuggestions: with each level\'s real manifest, every offered link is a quiz that exists in that level (never the current quiz)', async () => {
    for (const lv of LEVELS) {
      const manifest = JSON.parse(read(lv + '/quizzes.json'));
      const cats = [...new Set(manifest.map((m) => m.category))];
      for (const cat of cats) {
        const pool = manifest.filter((m) => m.category === cat && m.id !== manifest[0].id);
        if (!pool.length) continue;
        const s = suggestSandbox({ pool, level: lv, data: { category: cat } }); await s.run();
        const ids = hrefsOf(s.els).map((h) => decodeURIComponent(/quiz=([^&]+)/.exec(h)[1]));
        assert.ok(ids.length >= 1 && ids.length <= 3, lv + '/' + cat);
        ids.forEach((id) => assert.ok(manifest.some((m) => m.id === id && m.category === cat) && id !== manifest[0].id, lv + ': ' + id));
        assert.strictEqual(s.els.suggestCat.textContent, cat);
      }
    }
  });
})();

// ============================================================
console.log('offline core precache reconciliation (Agent 162)');
// ============================================================
(function () {
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'offline', 'core-manifest.json'), 'utf8')).files;
  const packs = JSON.parse(fs.readFileSync(path.join(root, 'offline', 'packs.json'), 'utf8'));
  const corePack = packs.packs.find((p) => p.id === 'core');
  const inManifest = new Set(manifest);

  test('every core-manifest file exists on disk', () => {
    const missing = manifest.filter((f) => !fs.existsSync(path.join(root, f)));
    assert.deepStrictEqual(missing, []);
  });

  test('packs.json core pack lists exactly the core-manifest files', () => {
    assert.deepStrictEqual(corePack.files.slice().sort(), manifest.slice().sort());
  });

  test('every local <script src> / stylesheet of a precached page is itself precached', () => {
    const missing = [];
    manifest.filter((f) => f.endsWith('.html')).forEach((f) => {
      const html = fs.readFileSync(path.join(root, f), 'utf8');
      const refs = [];
      html.replace(/<script[^>]+src="([^"#?]+)"/g, (_, s) => refs.push(s));
      html.replace(/<link[^>]+rel="stylesheet"[^>]*href="([^"#?]+)"/g, (_, s) => refs.push(s));
      html.replace(/<link[^>]+href="([^"#?]+\.css)"/g, (_, s) => refs.push(s));
      refs.forEach((s) => {
        if (/^(https?:)?\/\//.test(s)) return;
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(f), s));
        if (!inManifest.has(target)) missing.push(f + ' -> ' + target);
      });
    });
    assert.deepStrictEqual(Array.from(new Set(missing)), [], 'offline these would fail to load: ' + missing.join('; '));
  });

  test('every bottom-nav tab target (app-shell.js TABS) is precached', () => {
    const src = fs.readFileSync(path.join(root, 'shared/js/app-shell.js'), 'utf8');
    const targets = [];
    src.replace(/href:ROOT\+'([^']+)'/g, (_, t) => targets.push(t));
    assert.ok(targets.length >= 3, 'sanity: found the tab hrefs');
    assert.deepStrictEqual(targets.filter((t) => !inManifest.has(t)), []);
  });

  testAsync('sw.js serves precached .js/.css offline (fetch handler has a branch for shell code)', async () => {
    // Behavioural: load sw.js against a fake ServiceWorkerGlobalScope, fire fetch events.
    const handlers = {};
    const cached = { sentinel: true };
    const fakeSelf = {
      location: { origin: 'https://app.test' },
      addEventListener: (type, fn) => { handlers[type] = fn; },
      skipWaiting: () => Promise.resolve(), clients: { claim: () => Promise.resolve() },
    };
    const fakeCaches = { match: () => Promise.resolve(cached), open: () => Promise.resolve({ put() {}, addAll: () => Promise.resolve() }), keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) };
    const code = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    new Function('self', 'caches', 'fetch', 'Response', 'URL', code)(fakeSelf, fakeCaches, () => Promise.reject(new TypeError('offline')), function Response(b, o) { this.body = b; this.status = o && o.status; }, URL);
    const fire = (url) => new Promise((resolve) => {
      let responded = null;
      handlers.fetch({ request: { method: 'GET', url, mode: 'no-cors', destination: 'script' }, respondWith: (p) => { responded = Promise.resolve(p); } });
      resolve(responded);
    });
    for (const u of ['https://app.test/shared/js/app-shell.js', 'https://app.test/shared/css/theme.css']) {
      const p = await fire(u);
      assert.ok(p, u + ' was passed through to the bare network (no respondWith)');
      assert.strictEqual(await p, cached, u + ' did not fall back to the precached copy while offline');
    }
    assert.strictEqual(await fire('https://app.test/fonts/x.woff2'), null, 'unrelated assets should still pass through');
    assert.strictEqual(await fire('https://cdn.other.test/lib.js'), null, 'cross-origin must never be intercepted');
  });

  test('offline/packs/core.zip contains exactly the manifest files, byte-identical to source', () => {
    // read the zip central directory by hand (no dependencies): name + crc32 + sizes
    const buf = fs.readFileSync(path.join(root, 'offline', 'packs', 'core.zip'));
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0; i--) { if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; } }
    assert.ok(eocd >= 0, 'not a zip');
    const count = buf.readUInt16LE(eocd + 10);
    let off = buf.readUInt32LE(eocd + 16);
    const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const names = [], stale = [];
    for (let i = 0; i < count; i++) {
      const crc = buf.readUInt32LE(off + 16), size = buf.readUInt32LE(off + 24);
      const nlen = buf.readUInt16LE(off + 28), xlen = buf.readUInt16LE(off + 30), clen = buf.readUInt16LE(off + 32);
      const name = buf.slice(off + 46, off + 46 + nlen).toString('utf8');
      names.push(name);
      const file = path.join(root, name);
      if (!fs.existsSync(file)) stale.push(name + ' (missing on disk)');
      else { const src = fs.readFileSync(file); if (src.length !== size || crc32(src) !== crc) stale.push(name); }
      off += 46 + nlen + xlen + clen;
    }
    assert.deepStrictEqual(names.slice().sort(), manifest.slice().sort(), 'zip member list != core-manifest');
    assert.deepStrictEqual(stale, [], 'core.zip holds outdated copies of: ' + stale.join(', ') + ' (rebuild it from offline/core-manifest.json)');
  });
})();

// ============================================================
console.log('quiz.html end(): results-screen orchestration, isolated with stubbed collaborators (Agent 169)');
// ============================================================
(function () {
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'shared', 'quiz.html'), 'utf8');

  // Every function end() calls by name in quiz.html's shared scope, replaced with a spy so
  // this section tests end()'s OWN orchestration (order of calls, additive-safety try/catches,
  // the outer try/finally) rather than re-testing those functions' own logic (covered elsewhere).
  function makeEl() {
    const cls = new Set();
    const el = {
      style: { setProperty(k, v) { this[k] = v; } },
      textContent: '', innerHTML: '',
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), has: (c) => cls.has(c) },
      focused: false,
      focus() { this.focused = true; },
    };
    Object.defineProperty(el, 'offsetWidth', { get() { return 0; } }); // reflow trick target; value is irrelevant
    return el;
  }

  // opts: { pct-driving fields, mode, lessonParam, placementProfile, throwIn: name of a spy to make throw,
  //         modules: {gamification,skillMastery,reviewScheduler,levelLock} -> true/false/'throw',
  //         lessons: array for getLevelLessons(), lessonParam }
  function endSandbox(opts) {
    opts = opts || {};
    const els = { bar: makeEl(), progressWrap: makeEl(), finalPct: makeEl(), result: makeEl(), message: makeEl(),
      gamifyBadges: makeEl(), reco: makeEl(), continueBtn: makeEl(), end: makeEl() };
    const ring = makeEl();
    els.end.querySelector = (sel) => (sel === '.result-ring' ? ring : null);
    const calls = [];
    const spy = (name, impl) => (...a) => { calls.push([name, a]); if (opts.throwIn === name) throw new Error('boom:' + name); return impl && impl(...a); };

    const window = { MylingoGamification: undefined, MylingoSkillMastery: undefined, MylingoReviewScheduler: undefined, MylingoLevelLock: undefined };
    const mods = opts.modules || {};
    if (mods.gamification) window.MylingoGamification = { recordSession: spy('gam.recordSession', () => (mods.gamification === 'throw' ? (() => { throw new Error('gam boom'); })() : { xpEarned: 12, streak: 3 })) };
    if (mods.skillMastery) window.MylingoSkillMastery = { recordAndPersist: spy('sm.recordAndPersist', () => { if (mods.skillMastery === 'throw') throw new Error('sm boom'); }) };
    if (mods.reviewScheduler) window.MylingoReviewScheduler = { recordAndPersist: spy('rs.recordAndPersist', () => { if (mods.reviewScheduler === 'throw') throw new Error('rs boom'); }) };
    if (mods.levelLock) window.MylingoLevelLock = { setAssigned: spy('levelLock.setAssigned', () => { if (mods.levelLock === 'throw') throw new Error('lock boom'); }) };

    const profile = opts.placementProfile === undefined ? { recommended_level: 'b1' } : opts.placementProfile;
    const lessons = opts.lessons || [];
    let ended = false;
    const ctx = {
      window, ended,
      score: opts.score != null ? opts.score : 7,
      data: opts.data || { id: 'q1', version: 2, level: 'a2', questions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      mode: opts.mode || 'quiz',
      answerCorrect: opts.answerCorrect || {},
      lessonParam: opts.lessonParam || null,
      level: opts.level || 'a2',
      $: (id) => els[id],
      gradedTotal: spy('gradedTotal', () => (opts.graded != null ? opts.graded : 10)),
      congratsTitle: spy('congratsTitle', (pct) => 'Title:' + pct),
      save: spy('save'),
      clearSession: spy('clearSession'),
      soundResult: spy('soundResult'),
      show: spy('show'),
      getLevelLessons: spy('getLevelLessons', () => Promise.resolve(lessons)),
      backTarget: spy('backTarget', () => '/back'),
      saveAssessmentResult: spy('saveAssessmentResult', () => profile),
      renderPlacementResult: spy('renderPlacementResult'),
      renderPlacementRecommendations: spy('renderPlacementRecommendations'),
      placementContinue: spy('placementContinue'),
      renderSuggestions: spy('renderSuggestions'),
      stopAllSounds: spy('stopAllSounds'),
      location: { href: '' },
    };
    vm.createContext(ctx);
    vm.runInContext(extractFn(html, 'end') + '\nthis.__end = end; this.__getEnded = () => ended;', ctx);
    return {
      els, ring, calls,
      call: (name) => calls.filter((c) => c[0] === name),
      run: () => ctx.__end(),
      getEnded: () => ctx.__getEnded(),
      ctx,
    };
  }

  test('happy path (non-placement, non-lesson): DOM writes, save/clearSession/soundResult, reco hidden, renderSuggestions called, show(end) last', () => {
    const s = endSandbox({ score: 6, graded: 10, mode: 'quiz' });
    s.run();
    assert.strictEqual(s.els.bar.style.width, '100%');
    assert.strictEqual(s.els.progressWrap.attrs['aria-valuenow'], '100');
    assert.strictEqual(s.els.finalPct.textContent, '60%');
    assert.strictEqual(s.ring.style['--score-angle'], '216deg', 'round(60*3.6)');
    assert.ok(s.ring.classList.has('score-reveal'), 'reveal class re-added after reflow trick');
    assert.strictEqual(s.els.result.textContent, 'Title:60');
    assert.strictEqual(s.els.message.textContent, 'You scored 6 out of 10 (60%).');
    assert.deepStrictEqual(s.call('save')[0][1], [true]);
    assert.deepStrictEqual(s.call('clearSession')[0][1], ['q1']);
    assert.deepStrictEqual(s.call('soundResult')[0][1], [60]);
    assert.strictEqual(s.els.reco.style.display, 'none');
    assert.strictEqual(s.els.continueBtn.style.display, 'none');
    assert.strictEqual(s.call('renderSuggestions').length, 1);
    assert.strictEqual(s.call('saveAssessmentResult').length, 0, 'placement path must not run');
    assert.deepStrictEqual(s.calls[s.calls.length - 1], ['show', ['end']], 'show(\"end\") is the last thing end() does');
    assert.ok(s.els.result.focused, 'result heading is focused for a11y after the overlay is shown');
  });

  test('graded=0 (a banner-only quiz): pct falls back to 100, no divide-by-zero', () => {
    const s = endSandbox({ score: 0, graded: 0 });
    s.run();
    assert.strictEqual(s.els.finalPct.textContent, '100%');
    assert.strictEqual(s.els.message.textContent, 'You scored 0 out of 0 (100%).');
  });

  test('double call is a no-op: ended guard prevents a second run', () => {
    const s = endSandbox({});
    s.run();
    const firstCallCount = s.calls.length;
    s.run();
    assert.strictEqual(s.calls.length, firstCallCount, 'nothing new happened on the second call');
  });

  test('additive modules run with the right args when present, and are simply absent (never called) when not', () => {
    const s = endSandbox({ score: 8, graded: 10, mode: 'quiz', level: 'b2', data: { id: 'q9', version: 3, level: 'b2', questions: [1, 2] },
      modules: { gamification: true, skillMastery: true, reviewScheduler: true } });
    s.run();
    assert.deepStrictEqual(s.call('gam.recordSession')[0][1].slice(0, 2), [8, 10]);
    // Agent 167's remembered rule: the extra arg object is a literal CREATED inside the vm-sandboxed
    // end() code, so it carries that context's own Object.prototype -- JSON round-trip before a deep
    // compare against a literal built in this file's (different) realm.
    assert.deepStrictEqual(JSON.parse(JSON.stringify(s.call('gam.recordSession')[0][1][3])), { quizId: 'q9', quizVersion: '3', mode: 'quiz' });
    assert.ok(s.els.gamifyBadges.innerHTML.includes('+12 XP') && s.els.gamifyBadges.innerHTML.includes('3 days'));
    assert.strictEqual(s.els.gamifyBadges.style.display, 'flex');
    assert.strictEqual(s.call('sm.recordAndPersist').length, 1);
    assert.strictEqual(s.call('rs.recordAndPersist').length, 1);
    const s2 = endSandbox({ modules: {} });
    s2.run();
    assert.deepStrictEqual(s2.els.gamifyBadges.innerHTML, '', 'no gamification module -> badges box untouched');
  });

  test('review scheduling is skipped in placement mode even when the module is present (product rule, unchanged)', () => {
    const s = endSandbox({ mode: 'placement', modules: { reviewScheduler: true, skillMastery: true } });
    s.run();
    assert.strictEqual(s.call('rs.recordAndPersist').length, 0);
    assert.strictEqual(s.call('sm.recordAndPersist').length, 1, 'skill mastery is NOT placement-gated');
  });

  test('a throw inside ANY additive module (gamification / skill mastery / review scheduler) never reaches the caller: caught locally, results screen still completes', () => {
    ['gamification', 'skillMastery', 'reviewScheduler'].forEach((which) => {
      const mods = { gamification: true, skillMastery: true, reviewScheduler: true };
      mods[which] = 'throw';
      const s = endSandbox({ mode: 'quiz', modules: mods });
      s.run(); // must not throw
      assert.deepStrictEqual(s.calls[s.calls.length - 1], ['show', ['end']], which + ': results screen still finished');
      assert.strictEqual(s.getEnded(), true);
    });
  });

  test('placement mode: saveAssessmentResult -> level-lock.setAssigned -> the three placement renderers, in order; renderSuggestions is NOT called', () => {
    const profile = { recommended_level: 'b1', assessed_level: 'a2' };
    const s = endSandbox({ mode: 'placement', placementProfile: profile, modules: { levelLock: true } });
    s.run();
    const order = s.calls.map((c) => c[0]).filter((n) => ['saveAssessmentResult', 'levelLock.setAssigned', 'renderPlacementResult', 'renderPlacementRecommendations', 'placementContinue', 'renderSuggestions'].includes(n));
    assert.deepStrictEqual(order, ['saveAssessmentResult', 'levelLock.setAssigned', 'renderPlacementResult', 'renderPlacementRecommendations', 'placementContinue']);
    assert.deepStrictEqual(s.call('levelLock.setAssigned')[0][1], ['b1']);
    assert.deepStrictEqual(s.call('renderPlacementResult')[0][1], [profile]);
    assert.deepStrictEqual(s.call('placementContinue')[0][1], [profile]);
  });

  test('placement mode: a null/no-recommendation profile skips level-lock.setAssigned but still renders the results panels', () => {
    const s = endSandbox({ mode: 'placement', placementProfile: null, modules: { levelLock: true } });
    s.run();
    assert.strictEqual(s.call('levelLock.setAssigned').length, 0);
    assert.strictEqual(s.call('renderPlacementResult').length, 1);
  });

  test('placement mode: level-lock.setAssigned throwing never breaks the results screen (Agent 152\'s ceiling update is best-effort)', () => {
    const s = endSandbox({ mode: 'placement', placementProfile: { recommended_level: 'c1' }, modules: { levelLock: 'throw' } });
    s.run();
    assert.deepStrictEqual(s.calls[s.calls.length - 1], ['show', ['end']]);
    assert.strictEqual(s.call('renderPlacementResult').length, 1, 'rendering still proceeds after the swallowed throw');
  });

  testAsync('lesson-continue branch: only offered for a passed (>=60%) NON-placement quiz tied to a lessonParam; next lesson -> "Continue", none left -> "Back to lesson practice"', async () => {
    const lessons = [
      { lesson_id: 'l1', unit_id: 'u1', status: 'published', order: 1 },
      { lesson_id: 'l2', unit_id: 'u1', status: 'published', order: 2 },
      { lesson_id: 'l3', unit_id: 'u1', status: 'draft', order: 3 },
    ];
    const s = endSandbox({ mode: 'quiz', lessonParam: 'l1', score: 8, graded: 10, level: 'a2', lessons });
    s.run();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    assert.strictEqual(s.els.continueBtn.style.display, 'inline-flex');
    assert.strictEqual(s.els.continueBtn.textContent, 'Continue', 'l2 is the next published lesson after l1');

    const s2 = endSandbox({ mode: 'quiz', lessonParam: 'l2', score: 8, graded: 10, level: 'a2', lessons });
    s2.run();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    assert.strictEqual(s2.els.continueBtn.textContent, 'Back to lesson practice', 'l3 is unpublished, so there is no next lesson');
  });

  test('lesson-continue branch does NOT fire on a failed attempt (<60%) or in placement mode, even with a lessonParam', () => {
    const lessons = [{ lesson_id: 'l1', unit_id: 'u1', status: 'published', order: 1 }, { lesson_id: 'l2', unit_id: 'u1', status: 'published', order: 2 }];
    const failed = endSandbox({ mode: 'quiz', lessonParam: 'l1', score: 3, graded: 10, lessons });
    failed.run();
    assert.strictEqual(failed.call('getLevelLessons').length, 0, 'no lesson lookup at all below 60%');
    const placement = endSandbox({ mode: 'placement', lessonParam: 'l1', score: 8, graded: 10, lessons });
    placement.run();
    assert.strictEqual(placement.call('getLevelLessons').length, 0, 'lesson-continue is a non-placement-only path');
  });

  test('outer try/finally: an uncaught throw from a non-additive step (e.g. congratsTitle) still runs the finally — show("end") fires and the heading is focused — before end() re-throws (Agent 102\'s original bug class)', () => {
    const s = endSandbox({ throwIn: 'congratsTitle' });
    assert.throws(() => s.run(), /boom:congratsTitle/);
    assert.deepStrictEqual(s.calls[s.calls.length - 1], ['show', ['end']], 'finally still ran show(\"end\") despite the throw');
    assert.ok(s.els.result.focused);
    assert.strictEqual(s.getEnded(), true, 'the ended guard was already set before the throw, so a retry would no-op too');
  });
})();

// ============================================================
console.log('quiz.html finishAnswer()/next(): the grading loop\'s own effects, isolated with stubbed collaborators (Agent 170)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_169.md item 1: submitAnswer()'s own decision logic (ok/correctText per
  // type) is already covered end-to-end by the Agent 164 section above, via a captured finishAnswer
  // stub -- so that stub deliberately never exercises finishAnswer()'s OWN body (DOM disabling/marking,
  // score/answerCorrect mutation, sound routing, session write, feedback text, next-button reveal) or
  // next()'s advance-vs-end branch. That's the actual gap. Same extractFn + vm + spy pattern as
  // Agent 169's end() section, one level down the call chain: end() depends on the score/answerCorrect
  // that finishAnswer() produces, and finishAnswer()/next() had zero direct tests before this turn.
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'shared', 'quiz.html'), 'utf8');

  // A tiny selector-matcher covering only the literal selectors finishAnswer()/next() actually use
  // (.option, .option[data-index="N"], .rank-item, input/select/button, #question .blank) -- not a
  // general CSS engine, on purpose: matching Agent 169's makeEl() philosophy of a fake just real
  // enough to run the real code, not a reimplementation of the DOM.
  function makeNode(type, extra) {
    const cls = new Set();
    return Object.assign({
      type, dataset: {}, attrs: {}, disabled: false, tabIndex: 0, textContent: '',
      classList: { add: (...c) => c.forEach((x) => cls.add(x)), remove: (c) => cls.delete(c), has: (c) => cls.has(c) },
      setAttribute(k, v) { this.attrs[k] = v; },
      focused: false, focus() { this.focused = true; },
    }, extra || {});
  }
  function selMatch(el, token) {
    token = token.trim();
    if (token === '.option') return el.type === 'option';
    if (token === '.rank-item') return el.type === 'rankitem';
    const m = /^\.option\[data-index="(\d+)"\]$/.exec(token);
    if (m) return el.type === 'option' && el.dataset.index === m[1];
    return ['input', 'select', 'button'].includes(token) && el.type === token;
  }
  function queryAll(list, sel) {
    const tokens = sel.split(',');
    return list.filter((el) => tokens.some((t) => selMatch(el, t)));
  }
  function makeOptionsEl(children) {
    return {
      _children: children,
      querySelectorAll(sel) { return queryAll(this._children, sel); },
      querySelector(sel) { return queryAll(this._children, sel)[0] || null; },
    };
  }
  function makeEl() {
    const cls = new Set();
    return {
      style: {}, textContent: '', innerHTML: '', className: '', attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      classList: { add: (...c) => c.forEach((x) => cls.add(x)), remove: (c) => cls.delete(c), has: (c) => cls.has(c) },
      focused: false, focus() { this.focused = true; },
    };
  }

  // opts: { q, ok, correctText, input, score, restoring, blanks:[textContent...] }
  function finishAnswerSandbox(opts) {
    opts = opts || {};
    const els = { options: makeOptionsEl(opts.optionChildren || []), score: makeEl(), feedback: makeEl(), next: makeEl() };
    const blanks = (opts.blanks || []).map(() => makeEl());
    const calls = [];
    const spy = (name) => (...a) => { calls.push([name, a]); };
    const ctx = {
      window: {},
      data: { questions: [opts.q] }, i: 0,
      score: opts.score != null ? opts.score : 5,
      answerCorrect: opts.answerCorrect || {},
      restoringSessionAnswer: !!opts.restoring,
      locked: false,
      $: (id) => els[id],
      document: { querySelectorAll: (sel) => (sel === '#question .blank' ? blanks : []) },
      requestAnimationFrame: (fn) => fn(),
      soundCorrect: spy('soundCorrect'),
      soundWrong: spy('soundWrong'),
      updateSessionAnswer: spy('updateSessionAnswer'),
      save: spy('save'),
    };
    vm.createContext(ctx);
    vm.runInContext(
      ['rawType', 'answerList', 'correctIndexes', 'esc', 'setTextSmooth'].map((n) => extractFn(html, n)).join('\n') +
      '\n' + extractFn(html, 'finishAnswer') +
      '\nthis.__finishAnswer = finishAnswer; this.__getLocked = () => locked;',
      ctx,
    );
    return {
      els, blanks, calls, ctx,
      call: (name) => calls.filter((c) => c[0] === name),
      run: () => ctx.__finishAnswer(opts.ok, opts.correctText, opts.input),
      getLocked: () => ctx.__getLocked(),
    };
  }

  const radioQ = (over) => Object.assign({ question: 'q', question_type: 'radio', answers: ['a', 'b', 'c'], correctIndex: 2 }, over);

  test('correct radio answer: locked, score++, soundCorrect fires, correct option marked (correct+grow, aria-checked), all options disabled/untabbable, next button revealed and focused, save(false) called', () => {
    const opt1 = makeNode('option', { dataset: { index: '1' } });
    const opt2 = makeNode('option', { dataset: { index: '2' } });
    const opt3 = makeNode('option', { dataset: { index: '3' } });
    const s = finishAnswerSandbox({ q: radioQ(), ok: true, correctText: 'b', input: { index: 2 }, score: 5, optionChildren: [opt1, opt2, opt3] });
    s.run();
    assert.strictEqual(s.getLocked(), true);
    assert.strictEqual(s.ctx.score, 6);
    assert.strictEqual(s.ctx.answerCorrect[0], true);
    assert.strictEqual(s.call('soundCorrect').length, 1);
    assert.strictEqual(s.call('soundWrong').length, 0);
    assert.ok(opt2.classList.has('correct') && opt2.classList.has('grow'));
    assert.strictEqual(opt2.attrs['aria-checked'], 'true');
    [opt1, opt2, opt3].forEach((o) => { assert.strictEqual(o.disabled, true); assert.strictEqual(o.tabIndex, -1); });
    assert.ok(!opt1.classList.has('wrong') && !opt3.classList.has('wrong'));
    assert.strictEqual(s.els.next.style.display, 'inline-block');
    assert.ok(s.els.next.classList.has('show'), 'the (stubbed-synchronous) double rAF ran');
    assert.ok(s.els.next.focused);
    assert.strictEqual(s.call('save')[0][1][0], false);
    assert.strictEqual(s.call('updateSessionAnswer').length, 1);
  });

  test('wrong radio answer: score unchanged, soundWrong fires, the chosen wrong option gets wrong+shake, the actually-correct option still gets correct+grow', () => {
    const opt1 = makeNode('option', { dataset: { index: '1' } });
    const opt2 = makeNode('option', { dataset: { index: '2' } });
    const s = finishAnswerSandbox({ q: radioQ(), ok: false, correctText: 'b', input: { index: 1 }, score: 5, optionChildren: [opt1, opt2] });
    s.run();
    assert.strictEqual(s.ctx.score, 5, 'score does not increment on a wrong answer');
    assert.strictEqual(s.ctx.answerCorrect[0], false);
    assert.strictEqual(s.call('soundWrong').length, 1);
    assert.strictEqual(s.call('soundCorrect').length, 0);
    assert.ok(opt1.classList.has('wrong') && opt1.classList.has('shake'));
    assert.strictEqual(opt1.attrs['aria-checked'], 'true');
    assert.ok(opt2.classList.has('correct') && opt2.classList.has('grow'), 'the right answer is still revealed even though the learner missed it');
  });

  test('wrong radio answer with no usable input (undefined, or index 0): the wrong-marking guard is skipped, nothing throws', () => {
    const opt1 = makeNode('option', { dataset: { index: '1' } });
    assert.doesNotThrow(() => finishAnswerSandbox({ q: radioQ(), ok: false, correctText: 'b', input: undefined, optionChildren: [opt1] }).run());
    const opt1b = makeNode('option', { dataset: { index: '1' } });
    const s = finishAnswerSandbox({ q: radioQ(), ok: false, correctText: 'b', input: { index: 0 }, optionChildren: [opt1b] });
    s.run();
    assert.ok(!opt1b.classList.has('wrong'), 'a falsy input.index (0) is treated as "nothing to mark", matching submitAnswer\'s own "no selection" guard');
  });

  test('checkbox: every correct index marked correct; every WRONGLY-selected index (selected but not wanted) marked wrong; a correctly-omitted index gets neither', () => {
    const opt1 = makeNode('option', { dataset: { index: '1' } });
    const opt2 = makeNode('option', { dataset: { index: '2' } });
    const opt3 = makeNode('option', { dataset: { index: '3' } });
    const q = { question: 'q', question_type: 'checkbox', answers: ['a', 'b', 'c'], correctIndices: [1, 3] };
    const s = finishAnswerSandbox({ q, ok: false, correctText: 'a, c', input: { indices: [1, 2] }, optionChildren: [opt1, opt2, opt3] });
    s.run();
    assert.ok(opt1.classList.has('correct') && !opt1.classList.has('wrong'), 'selected AND correct');
    assert.ok(opt2.classList.has('wrong') && !opt2.classList.has('correct'), 'selected but not wanted');
    assert.ok(opt3.classList.has('correct') && !opt3.classList.has('wrong'), 'correct but left unselected -- still revealed, not penalized in the UI');
    [opt1, opt2, opt3].forEach((o) => assert.strictEqual(o.disabled, true));
  });

  test('matching/ranking (the "else" branch): rank-item elements get aria-disabled + draggable=false; a non-rank type here gets neither (nothing to mark) but is still fully locked by the type-agnostic pass', () => {
    const item1 = makeNode('rankitem'), item2 = makeNode('rankitem');
    const q = { question: 'q', question_type: 'ranking', items: ['x', 'y'] };
    const s = finishAnswerSandbox({ q, ok: true, correctText: 'x → y', input: { ranking: ['x', 'y'] }, optionChildren: [item1, item2] });
    s.run();
    [item1, item2].forEach((el) => { assert.strictEqual(el.attrs['aria-disabled'], 'true'); assert.strictEqual(el.draggable, false); });
  });

  test('final type-agnostic disable pass: every input/select/button left in #options is disabled, even ones the type-specific branch above never touched (e.g. a dropdown\'s <select>)', () => {
    const opt1 = makeNode('option', { dataset: { index: '1' } });
    const stray = makeNode('select'), btn = makeNode('button'), inp = makeNode('input');
    const s = finishAnswerSandbox({ q: radioQ(), ok: true, correctText: 'b', input: { index: 2 }, optionChildren: [opt1, stray, btn, inp] });
    s.run();
    [stray, btn, inp].forEach((el) => assert.strictEqual(el.disabled, true, el.type + ' must end up inert, or a resubmit is only blocked by the invisible `locked` flag'));
  });

  test('banner questions never touch answerCorrect, score, or the sound effects, correct or not', () => {
    const s = finishAnswerSandbox({ q: { question_type: 'banner' }, ok: true, correctText: '', input: { banner: true }, score: 5 });
    s.run();
    assert.strictEqual(s.ctx.score, 5);
    assert.deepStrictEqual(s.ctx.answerCorrect, {});
    assert.strictEqual(s.call('soundCorrect').length, 0);
    assert.strictEqual(s.call('soundWrong').length, 0);
  });

  test('restoringSessionAnswer=true (session-resume replay): answerCorrect is still recorded for the results screen, but score is not re-incremented, no sound plays, and the session is not re-written', () => {
    const s = finishAnswerSandbox({ q: radioQ(), ok: true, correctText: 'b', input: { index: 2 }, score: 5, restoring: true });
    s.run();
    assert.strictEqual(s.ctx.score, 5, 'replaying a past answer must not double-count it');
    assert.strictEqual(s.ctx.answerCorrect[0], true);
    assert.strictEqual(s.call('soundCorrect').length, 0);
    assert.strictEqual(s.call('updateSessionAnswer').length, 0, 'restoring must not overwrite the session it is itself being read from');
    assert.strictEqual(s.call('save')[0][1][0], false, 'the results-list localStorage write still happens on replay');
  });

  test('blanks: every #question .blank element is filled with the correct text and marked .filled, regardless of question type or outcome', () => {
    const b1 = makeEl(), b2 = makeEl();
    const s = finishAnswerSandbox({ q: { question: 'The cat ___.', question_type: 'fill_in_the_blank', acceptedAnswers: ['sat'] }, ok: false, correctText: 'sat', input: { value: 'ran' } });
    s.blanks.length = 0; s.blanks.push(b1, b2);
    s.run();
    [b1, b2].forEach((b) => { assert.strictEqual(b.textContent, 'sat'); assert.ok(b.classList.has('filled')); });
  });

  test('feedback panel: correct answer shows the "Correct!" status and only the (escaped) explanation, no "correct answer is" prefix', () => {
    const s = finishAnswerSandbox({ q: { question_type: 'text', explanation: 'Because <reasons>.' }, ok: true, correctText: 'x', input: { value: 'x' } });
    s.run();
    assert.strictEqual(s.els.feedback.className, 'feedback show good');
    assert.ok(s.els.feedback.innerHTML.includes('Correct!'));
    assert.ok(!s.els.feedback.innerHTML.includes('correct answer is'));
    assert.ok(s.els.feedback.innerHTML.includes('Because &lt;reasons&gt;.'), 'explanation HTML-escaped, not injected raw');
  });

  test('feedback panel: wrong answer shows "Not quite", the escaped correct answer in quotes, then the explanation', () => {
    const s = finishAnswerSandbox({ q: { question_type: 'text', explanation: 'Tip.' }, ok: false, correctText: '<b>gone</b>', input: { value: 'go' } });
    s.run();
    assert.strictEqual(s.els.feedback.className, 'feedback show bad');
    assert.ok(s.els.feedback.innerHTML.includes('Not quite.'));
    assert.ok(s.els.feedback.innerHTML.includes('The correct answer is "&lt;b&gt;gone&lt;/b&gt;". '), 'correctText is HTML-escaped (tags neutralized) though the surrounding literal quote marks are not, since only esc(correctText) passes through esc()');
    assert.ok(s.els.feedback.innerHTML.trim().endsWith('Tip.'));
  });

  test('explanation field priority is fixed (explanation > right_explanation > wrong_explanation) regardless of ok/not-ok -- documents the current behavior so a future "make it outcome-aware" change is a deliberate edit, not an accidental one', () => {
    const q = { question_type: 'text', right_explanation: 'R', wrong_explanation: 'W' };
    const wrong = finishAnswerSandbox({ q, ok: false, correctText: 'x', input: { value: 'y' } });
    wrong.run();
    assert.ok(wrong.els.feedback.innerHTML.includes('R') && !wrong.els.feedback.innerHTML.includes('W'), 'right_explanation wins even when the learner got it WRONG, since there is no `explanation` field to prefer instead');
  });

  test('score/next elements are updated via setTextSmooth (real function): text set even from a fresh "0" element, next-button made visible unconditionally', () => {
    const s = finishAnswerSandbox({ q: radioQ(), ok: true, correctText: 'b', input: { index: 2 }, score: 0 });
    s.run();
    assert.strictEqual(s.els.score.textContent, 1, 'setTextSmooth assigns the raw value (a number here), not a stringified one');
  });

  // ---------------- next() ----------------
  function nextSandbox(opts) {
    opts = opts || {};
    const calls = [];
    const spy = (name) => (...a) => { calls.push([name, a]); };
    const ctx = {
      window: {},
      data: { questions: opts.questions || [1, 2, 3] },
      i: opts.i != null ? opts.i : 0,
      render: spy('render'),
      saveSession: spy('saveSession'),
      end: spy('end'),
    };
    vm.createContext(ctx);
    vm.runInContext(extractFn(html, 'next') + '\nthis.__next = next;', ctx);
    return { ctx, calls, call: (name) => calls.filter((c) => c[0] === name), run: () => ctx.__next() };
  }

  test('next(): mid-quiz advances i, renders the new question and persists the session; end() is NOT called', () => {
    const s = nextSandbox({ questions: [1, 2, 3, 4], i: 1 });
    s.run();
    assert.strictEqual(s.ctx.i, 2);
    assert.strictEqual(s.call('render').length, 1);
    assert.strictEqual(s.call('saveSession').length, 1);
    assert.strictEqual(s.call('end').length, 0);
    assert.deepStrictEqual(s.calls.map((c) => c[0]), ['render', 'saveSession'], 'render happens before the session is persisted, so a crash mid-render cannot save a session pointed at a half-drawn question');
  });

  test('next(): on the LAST question, calls end() instead -- render()/saveSession() are NOT called and i does not advance past the last index', () => {
    const s = nextSandbox({ questions: [1, 2, 3], i: 2 });
    s.run();
    assert.strictEqual(s.ctx.i, 2, 'i is left pointing at the last question, not walked off the end of the array');
    assert.strictEqual(s.call('end').length, 1);
    assert.strictEqual(s.call('render').length, 0);
    assert.strictEqual(s.call('saveSession').length, 0);
  });

  test('next(): a single-question quiz (banner-only or otherwise) goes straight to end() on its first next()', () => {
    const s = nextSandbox({ questions: [1], i: 0 });
    s.run();
    assert.strictEqual(s.call('end').length, 1);
    assert.strictEqual(s.call('render').length, 0);
  });
})();

// ============================================================
console.log('quiz.html question-rendering: renderChoice/renderTextLike/renderMatching/renderRanking/renderMedia/clearQuestionUI (Agent 171)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_170.md item 1: the render* functions build the actual DOM that
  // submitAnswer()/finishAnswer() (covered by Agent 164/170) operate on, and had zero direct
  // coverage. Unlike prior sections' flat fake elements, these functions call real DOM methods
  // (createElement, appendChild, querySelector/All, classList.toggle, dataset), so this section
  // adds a minimal-but-real element/selector shim rather than record-shaped stand-ins -- just
  // enough of the DOM contract to run the real code, per the project's established "fake just
  // real enough" philosophy (Agent 169's makeEl(), Agent 170's makeNode()/selMatch()).
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'shared', 'quiz.html'), 'utf8');

  function matchSimple(el, token) {
    token = token.trim();
    let m;
    if ((m = /^\[([\w-]+)="([^"]*)"\]$/.exec(token))) return el.getAttribute(m[1]) === m[2];
    if ((m = /^\.([\w-]+)$/.exec(token))) return el.classList.contains(m[1]);
    if (/^[a-z]+$/.test(token)) return el.tagName === token.toUpperCase();
    return false;
  }
  function queryAll(root, sel) {
    const tokens = sel.split(',');
    const out = [];
    (function walk(el) {
      (el._children || []).forEach((c) => {
        if (tokens.some((t) => matchSimple(c, t))) out.push(c);
        walk(c);
      });
    })(root);
    return out;
  }
  // A tiny, non-recursive HTML-fragment parser for the flat `<tag attr="v">text</tag>` sequences
  // quiz.html builds via innerHTML (option lists, the key-number + label spans on each choice
  // button, the rank-number span). Real .innerHTML assignment materializes child elements that
  // later code queries (e.g. updateRanks()'s `.querySelector('.rank-num')`); a plain string-store
  // would silently break every one of those lookups, so this parses just enough to make them real.
  function parseFragment(html) {
    const out = [];
    const re = /<(\w+)((?:\s+[\w-]+="[^"]*")*)\s*>([^<]*)<\/\1>/g;
    let m;
    while ((m = re.exec(html))) {
      const el = new FakeElement(m[1]);
      const attrRe = /([\w-]+)="([^"]*)"/g;
      let am;
      while ((am = attrRe.exec(m[2]))) { if (am[1] === 'class') el._className = am[2]; else el._attrs[am[1]] = am[2]; }
      el.textContent = m[3];
      out.push(el);
    }
    return out;
  }
  class FakeElement {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this._className = ''; this._html = ''; this._children = []; this._attrs = {};
      this._listeners = {};
      this.dataset = {}; this.style = {}; this.textContent = '';
      this.id = ''; this.type = ''; this.value = ''; this.disabled = false;
      this.draggable = false; this.focused = false; this.tabIndex = undefined;
      this.src = undefined; this.alt = undefined; this.maxLength = undefined; this.autocomplete = '';
      this.onclick = null; this.onerror = null; this.onstart = null; this.onend = null;
    }
    get className() { return this._className; }
    set className(v) { this._className = v; }
    get classList() {
      const self = this;
      const set = () => new Set(self._className.split(/\s+/).filter(Boolean));
      return {
        add: (...cls) => { const s = set(); cls.forEach((c) => s.add(c)); self._className = [...s].join(' '); },
        remove: (...cls) => { const s = set(); cls.forEach((c) => s.delete(c)); self._className = [...s].join(' '); },
        toggle: (c, force) => { const s = set(); const has = s.has(c); const want = force === undefined ? !has : !!force; if (want) s.add(c); else s.delete(c); self._className = [...s].join(' '); return want; },
        contains: (c) => set().has(c), has: (c) => set().has(c),
      };
    }
    setAttribute(k, v) { this._attrs[k] = String(v); }
    getAttribute(k) { return k in this._attrs ? this._attrs[k] : null; }
    removeAttribute(k) { delete this._attrs[k]; }
    get innerHTML() { return this._html; }
    set innerHTML(v) { this._html = String(v); this._children = parseFragment(String(v)); }
    // Agent 176: real-DOM move semantics, needed by renderRanking's keyboard reorder and drag-and-drop
    // (insertBefore/nextSibling). appendChild now detaches from a previous parent, as the DOM does.
    _detach(c) { const k = this._children.indexOf(c); if (k >= 0) this._children.splice(k, 1); }
    appendChild(c) { if (c._parent) c._parent._detach(c); c._parent = this; this._children.push(c); return c; }
    insertBefore(node, ref) {
      if (ref === node) return node; // DOM: inserting a node before itself is a no-op
      if (ref != null && this._children.indexOf(ref) < 0) throw new Error('NotFoundError: insertBefore reference is not a child');
      if (node._parent) node._parent._detach(node);
      node._parent = this;
      const k = ref == null ? -1 : this._children.indexOf(ref); // undefined/null ref -> append, as in browsers
      if (k < 0) this._children.push(node); else this._children.splice(k, 0, node);
      return node;
    }
    get nextSibling() { if (!this._parent) return null; const sib = this._parent._children; return sib[sib.indexOf(this) + 1] || null; }
    append(...cs) { cs.forEach((c) => this.appendChild(c)); }
    get children() { return this._children; }
    addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
    dispatch(type, evt) { (this._listeners[type] || []).forEach((fn) => fn(evt || {})); }
    click() { this.dispatch('click', { target: this, preventDefault() {} }); }
    focus() { this.focused = true; }
    load() {}
    querySelectorAll(sel) { return queryAll(this, sel); }
    querySelector(sel) { return queryAll(this, sel)[0] || null; }
  }

  // Agent 167's remembered rule: values built inside the vm sandbox (submitAnswer's call-arg
  // objects/arrays here) carry that realm's Object/Array.prototype, so deepStrictEqual against an
  // outer-realm literal must go through a JSON round-trip first.
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

  function makeIds() {
    const ids = {};
    ['options', 'kbHint', 'qimgWrap', 'qimg', 'qaudioWrap', 'qaudio', 'qaudioLabel', 'qttsBtn', 'feedback', 'next'].forEach((id) => { ids[id] = new FakeElement(id === 'options' ? 'div' : (id === 'qimg' || id === 'qaudio' ? id.slice(1) : 'div')); });
    return ids;
  }

  function renderSandbox() {
    const els = makeIds();
    const calls = [];
    const spy = (name) => (...a) => { calls.push([name, a]); };    const ctx = {
      window: {},
      $: (id) => els[id],
      document: { createElement: (tag) => new FakeElement(tag) },
      submitAnswer: spy('submitAnswer'),
      onOptionKeydown: spy('onOptionKeydown'),
      speakTts: spy('speakTts'),
    };
    vm.createContext(ctx);
    vm.runInContext(
      ['esc', 'mediaValue', 'answerList', 'makeCheckButton', 'clearQuestionUI', 'renderMedia', 'renderChoice', 'renderTextLike', 'renderMatching', 'renderRanking', 'updateRanks']
        .map((n) => extractFn(html, n)).join('\n'),
      ctx,
    );
    return { els, calls, call: (name) => calls.filter((c) => c[0] === name), ctx };
  }

  // ---------------- renderChoice ----------------
  test('renderChoice radio: one button per answer with number key + escaped label, correct role/tabIndex/dataset, kbHint says "Press 1–N", first button focused', () => {
    const s = renderSandbox();
    vm.runInContext('renderChoice({answers:["a<b>","c"]}, "radio")', s.ctx);
    const box = s.els.options;
    assert.strictEqual(box.getAttribute('role'), 'radiogroup');
    const opts = box.children;
    assert.strictEqual(opts.length, 2);
    assert.strictEqual(opts[0].dataset.index, '1');
    assert.strictEqual(opts[0].tabIndex, 0, 'first option is the only initially-tabbable one');
    assert.strictEqual(opts[1].tabIndex, -1);
    assert.ok(opts[0].innerHTML.includes('a&lt;b&gt;'), 'answer label is HTML-escaped');
    assert.ok(opts[0].innerHTML.includes('>1<'), 'the 1-based key hint is shown');
    assert.strictEqual(s.els.kbHint.textContent, 'Press 1–2 to answer, arrow keys to move, Enter to select.');
    assert.ok(opts[0].focused, 'first option is focused for keyboard users');
  });

  test('renderChoice radio: clicking an option button calls submitAnswer({index, button}) directly (no intermediate select-then-check step)', () => {
    const s = renderSandbox();
    vm.runInContext('renderChoice({answers:["a","b","c"]}, "radio")', s.ctx);
    s.els.options.children[2].click();
    assert.strictEqual(s.call('submitAnswer').length, 1);
    assert.deepStrictEqual(s.call('submitAnswer')[0][1][0].index, 3);
    assert.strictEqual(s.call('submitAnswer')[0][1][0].button, s.els.options.children[2]);
  });

  test('renderChoice checkbox: role="group", clicking a button TOGGLES aria-checked/selected instead of submitting; the appended Check button collects every currently-checked index', () => {
    const s = renderSandbox();
    vm.runInContext('renderChoice({answers:["a","b","c"]}, "checkbox")', s.ctx);
    const box = s.els.options;
    assert.strictEqual(box.getAttribute('role'), 'group');
    assert.strictEqual(s.els.kbHint.textContent, 'Select all that apply, then press Check answer.');
    box.children[0].click(); box.children[2].click();
    assert.strictEqual(box.children[0].getAttribute('aria-checked'), 'true');
    assert.ok(box.children[0].classList.has('selected'));
    assert.strictEqual(box.children[1].getAttribute('aria-checked'), 'false');
    assert.strictEqual(s.call('submitAnswer').length, 0, 'a single option click never submits on its own for checkbox');
    box.children[0].click(); // toggling again un-checks it
    assert.strictEqual(box.children[0].getAttribute('aria-checked'), 'false');
    assert.ok(!box.children[0].classList.has('selected'));
    box.children[0].click(); // re-check option 1 (option 3 is already checked from earlier)
    const checkBtnWrap = box.children[3];
    checkBtnWrap.querySelector('button').click();
    assert.deepStrictEqual(clone(s.call('submitAnswer')[0][1][0].indices), [1, 3]);
  });

  test('renderChoice dropdown: builds a <select> with a blank placeholder + one option per answer (1-based value, escaped text), appends a Check button reading Number(select.value); early-returns before touching role/kbHint', () => {
    const s = renderSandbox();
    vm.runInContext('renderChoice({answers:["uno","dos"]}, "dropdown")', s.ctx);
    const box = s.els.options;
    assert.strictEqual(box.children.length, 1, 'one wrapping card, not individual option buttons');
    const card = box.children[0];
    const select = card.children[0];
    assert.strictEqual(select.id, 'choiceSelect');
    assert.ok(select.innerHTML.includes('<option value="">Choose an answer…</option>'));
    assert.ok(select.innerHTML.includes('<option value="1">uno</option>') && select.innerHTML.includes('<option value="2">dos</option>'));
    select.value = '2';
    card.children[1].querySelector('button').click();
    assert.deepStrictEqual(clone(s.call('submitAnswer')[0][1][0]), { index: 2 });
    assert.strictEqual(box.getAttribute('role'), null, 'dropdown never sets role/aria-label -- it returns before that code runs');
    assert.strictEqual(s.els.kbHint.textContent, '', 'dropdown never sets a kbHint either, for the same reason');
    assert.ok(select.focused);
  });

  // ---------------- renderTextLike ----------------
  ['text', 'short_text', 'number', 'date', 'fill_in_the_blank'].forEach((type) => {
    test('renderTextLike (' + type + '): input type mapping, id="answerInput", focused, Enter key and Check button both submit {value}', () => {
      const s = renderSandbox();
      vm.runInContext('renderTextLike({}, "' + type + '")', s.ctx);
      const input = s.els.options.children[0].children[0];
      const expectedType = type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
      assert.strictEqual(input.type, expectedType);
      assert.strictEqual(input.id, 'answerInput');
      assert.ok(input.focused);
      assert.strictEqual(input.maxLength, type === 'short_text' ? 120 : undefined);
      input.value = 'my answer';
      input.dispatch('keydown', { key: 'Enter', preventDefault() {} });
      assert.deepStrictEqual(clone(s.call('submitAnswer')[0][1][0]), { value: 'my answer' });
      const s2 = renderSandbox();
      vm.runInContext('renderTextLike({}, "' + type + '")', s2.ctx);
      s2.els.options.children[0].children[0].value = 'via button';
      s2.els.options.children[0].children[1].querySelector('button').click();
      assert.deepStrictEqual(clone(s2.call('submitAnswer')[0][1][0]), { value: 'via button' });
    });
  });

  test('renderTextLike: a non-Enter keydown does not submit', () => {
    const s = renderSandbox();
    vm.runInContext('renderTextLike({}, "text")', s.ctx);
    s.els.options.children[0].children[0].dispatch('keydown', { key: 'a', preventDefault() {} });
    assert.strictEqual(s.call('submitAnswer').length, 0);
  });

  // ---------------- renderMatching ----------------
  test('renderMatching: one row per pair (q.pairs), each a <select> with a blank placeholder plus every right-hand value (shuffled order, same set, escaped); Check button reads the CURRENT select values by dataset.left', () => {
    const s = renderSandbox();
    vm.runInContext('renderMatching({pairs:[{left:"cat",right:"gato & co"},{left:"dog",right:"perro"}]})', s.ctx);
    const grid = s.els.options.children[0].children[0];
    const selects = grid.querySelectorAll('select');
    assert.strictEqual(selects.length, 2);
    const lefts = selects.map((sel) => sel.dataset.left).sort();
    assert.deepStrictEqual(lefts, ['cat', 'dog']);
    selects.forEach((sel) => {
      assert.ok(sel.innerHTML.includes('<option value="">Choose…</option>'));
      assert.ok(sel.innerHTML.includes('gato &amp; co') && sel.innerHTML.includes('perro'), 'both right-hand values present regardless of shuffle, and HTML-escaped');
    });
    selects.find((sel) => sel.dataset.left === 'cat').value = 'gato & co';
    selects.find((sel) => sel.dataset.left === 'dog').value = 'perro';
    s.els.options.children[0].children[1].querySelector('button').click();
    const submitted = clone(s.call('submitAnswer')[0][1][0].matching).sort((a, b) => a.left < b.left ? -1 : 1);
    assert.deepStrictEqual(submitted, [{ left: 'cat', right: 'gato & co' }, { left: 'dog', right: 'perro' }]);
  });

  test('renderMatching: falls back to q.matches when q.pairs is absent (same alias submitAnswer\'s own grading honors)', () => {
    const s = renderSandbox();
    vm.runInContext('renderMatching({matches:[{left:"x",right:"1"},{left:"y",right:"2"}]})', s.ctx);
    assert.strictEqual(s.els.options.children[0].children[0].querySelectorAll('select').length, 2);
  });

  // ---------------- renderRanking ----------------
  test('renderRanking: one row per item (q.items, shuffled order but the full set), each draggable+tabbable with dataset.value; updateRanks numbers them 1..N in DOM order; Check-order button reads CURRENT DOM order', () => {
    const s = renderSandbox();
    vm.runInContext('renderRanking({items:["first","second","third"]})', s.ctx);
    const list = s.els.options.children[0].children[0];
    const rows = list.children;
    assert.strictEqual(rows.length, 3);
    assert.deepStrictEqual(rows.map((r) => r.dataset.value).slice().sort(), ['first', 'second', 'third']);
    rows.forEach((r) => { assert.strictEqual(r.draggable, true); assert.strictEqual(r.tabIndex, 0); });
    rows.forEach((r, n) => assert.strictEqual(r.querySelector('.rank-num').textContent, String(n + 1)), 'updateRanks() numbered every row by its current DOM position');
    s.els.options.children[0].children[1].querySelector('button').click();
    assert.deepStrictEqual(clone(s.call('submitAnswer')[0][1][0].ranking), rows.map((r) => r.dataset.value), 'submits in whatever order the rows are CURRENTLY in, not the original item order');
  });

  test('renderRanking: falls back to answerList(q) when q.items is absent', () => {
    const s = renderSandbox();
    vm.runInContext('renderRanking({answers:["p","q"]})', s.ctx);
    assert.strictEqual(s.els.options.children[0].children[0].children.length, 2);
  });

  // ---------------- renderRanking: keyboard reorder + drag and drop (Agent 176) ----------------
  // Picked up HANDOFF_AGENT_175.md item 1. The per-row keydown / dragstart / dragend / dragover / drop
  // listeners are inline in renderRanking and were untested (Agent 171 only covered the static render).
  // (renderTextLike's Enter-to-submit was ALREADY covered above by Agent 171 — HANDOFF_AGENT_175's claim
  // that it was untested was wrong.) Math.random is pinned to 0.5 in the sandbox so the shuffle
  // (`sort(() => Math.random() - .5)` -> comparator 0) is stable and rows come out in item order.
  function rankingSandbox(items) {
    const s = renderSandbox();
    vm.runInContext('Math.random=()=>0.5', s.ctx);
    vm.runInContext('renderRanking({items:' + JSON.stringify(items) + '})', s.ctx);
    const card = s.els.options.children[0], list = card.children[0];
    const row = (v) => list.children.find((r) => r.dataset.value === v);
    let dragged = null;
    return {
      s, list, row,
      order: () => list.children.map((r) => r.dataset.value),
      nums: () => list.children.map((r) => r.querySelector('.rank-num').textContent),
      press(v, key) { let prevented = 0; row(v).dispatch('keydown', { key, preventDefault() { prevented++; } }); return prevented; },
      drag(v) { const set = []; dragged = v; row(v).dispatch('dragstart', { dataTransfer: { setData: (k, val) => set.push([k, val]) } }); return set; },
      // browsers fire dragend on the SOURCE row after a drop, so the helper does too (which clears .dragging)
      drop(v) { let prevented = 0; row(v).dispatch('drop', { preventDefault() { prevented++; } }); if (dragged) { row(dragged).dispatch('dragend', {}); dragged = null; } return prevented; },
      submit() { card.children[1].querySelector('button').click(); const c = s.call('submitAnswer'); return clone(c[c.length - 1][1][0].ranking); },
    };
  }
  const ITEMS = ['a', 'b', 'c', 'd'];

  test('renderRanking: starts with the first row focused, the "Up/Down arrows to reorder, or drag" hint, and rows numbered 1..N in DOM order', () => {
    const r = rankingSandbox(ITEMS);
    assert.deepStrictEqual(r.order(), ITEMS, 'pinned Math.random keeps item order');
    assert.deepStrictEqual(r.nums(), ['1', '2', '3', '4']);
    assert.ok(r.list.children[0].focused, 'first row focused');
    assert.strictEqual(r.s.els.kbHint.textContent, 'Use Up/Down arrows to reorder, or drag items, then press Check order.');
  });

  test('ranking keydown: ArrowUp swaps a row with its upper neighbour only — everything else keeps its order — renumbers the ranks, re-focuses the moved row and preventDefault()s', () => {
    const r = rankingSandbox(ITEMS);
    r.row('c').focused = false;
    assert.strictEqual(r.press('c', 'ArrowUp'), 1);
    assert.deepStrictEqual(r.order(), ['a', 'c', 'b', 'd']);
    assert.strictEqual(r.row('c').querySelector('.rank-num').textContent, '2', 'moved row renumbered');
    assert.strictEqual(r.row('b').querySelector('.rank-num').textContent, '3', 'displaced row renumbered');
    assert.deepStrictEqual(r.nums(), ['1', '2', '3', '4']);
    assert.ok(r.row('c').focused, 'focus follows the moved row');
  });

  test('ranking keydown: ArrowDown swaps a row with its lower neighbour only, renumbers, re-focuses and preventDefault()s', () => {
    const r = rankingSandbox(ITEMS);
    r.row('b').focused = false;
    assert.strictEqual(r.press('b', 'ArrowDown'), 1);
    assert.deepStrictEqual(r.order(), ['a', 'c', 'b', 'd']);
    assert.strictEqual(r.row('b').querySelector('.rank-num').textContent, '3');
    assert.strictEqual(r.row('c').querySelector('.rank-num').textContent, '2');
    assert.ok(r.row('b').focused);
  });

  test('ranking keydown: ArrowUp on the FIRST row and ArrowDown on the LAST row are no-ops — order unchanged, no re-focus, and NOT preventDefault()ed (the page may scroll)', () => {
    const r = rankingSandbox(ITEMS);
    r.row('a').focused = false; r.row('d').focused = false;
    assert.strictEqual(r.press('a', 'ArrowUp'), 0);
    assert.strictEqual(r.press('d', 'ArrowDown'), 0);
    assert.deepStrictEqual(r.order(), ITEMS);
    assert.deepStrictEqual(r.nums(), ['1', '2', '3', '4']);
    assert.ok(!r.row('a').focused && !r.row('d').focused);
    // the opposite direction at the same edges still works
    assert.strictEqual(r.press('a', 'ArrowDown'), 1);
    assert.strictEqual(r.press('d', 'ArrowUp'), 1);
    assert.deepStrictEqual(r.order(), ['b', 'a', 'd', 'c']);
  });

  test('ranking keydown: any other key (Enter, Space, Tab, ArrowLeft/Right, Home/End) does nothing — no reorder, no preventDefault', () => {
    const r = rankingSandbox(ITEMS);
    for (const key of ['Enter', ' ', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'a']) assert.strictEqual(r.press('b', key), 0, key);
    assert.deepStrictEqual(r.order(), ITEMS);
  });

  test('ranking keydown: repeated presses each work from the CURRENT position (walk the last item to the top and back), and Check order submits the keyboard-built order', () => {
    const r = rankingSandbox(ITEMS);
    for (let n = 0; n < 3; n++) r.press('d', 'ArrowUp');
    assert.deepStrictEqual(r.order(), ['d', 'a', 'b', 'c']);
    assert.deepStrictEqual(r.nums(), ['1', '2', '3', '4']);
    assert.deepStrictEqual(r.submit(), ['d', 'a', 'b', 'c']);
    for (let n = 0; n < 3; n++) r.press('d', 'ArrowDown');
    assert.deepStrictEqual(r.order(), ITEMS);
    assert.deepStrictEqual(r.submit(), ITEMS);
  });

  test('ranking drag: dragstart stores the item value as text/plain and marks ONLY the dragged row .dragging; dragend clears it; dragover is preventDefault()ed so a drop is allowed', () => {
    const r = rankingSandbox(ITEMS);
    assert.deepStrictEqual(clone(r.drag('b')), [['text/plain', 'b']]);
    assert.deepStrictEqual(r.list.children.map((x) => x.classList.contains('dragging')), [false, true, false, false]);
    r.row('b').dispatch('dragend', {});
    assert.ok(r.list.children.every((x) => !x.classList.contains('dragging')));
    let prevented = 0;
    r.row('c').dispatch('dragover', { preventDefault() { prevented++; } });
    assert.strictEqual(prevented, 1);
  });

  test('ranking drop: dropping a row onto a LATER row places it AFTER that row (incl. the last row); onto an EARLIER row places it BEFORE; ranks renumbered; the drop is preventDefault()ed', () => {
    const r = rankingSandbox(ITEMS);
    r.drag('a');
    assert.strictEqual(r.drop('c'), 1);
    assert.deepStrictEqual(r.order(), ['b', 'c', 'a', 'd']);
    assert.deepStrictEqual(r.nums(), ['1', '2', '3', '4']);
    assert.strictEqual(r.row('a').querySelector('.rank-num').textContent, '3');
    r.drag('b');
    r.drop('d'); // b is above d -> lands after the LAST row (nextSibling is null -> append)
    assert.deepStrictEqual(r.order(), ['c', 'a', 'd', 'b']);
    const u = rankingSandbox(ITEMS);
    u.drag('d');
    assert.strictEqual(u.drop('b'), 1);
    assert.deepStrictEqual(u.order(), ['a', 'd', 'b', 'c'], 'dragged UP: inserted before the target');
    assert.deepStrictEqual(u.nums(), ['1', '2', '3', '4']);
    u.drag('c'); u.drop('a'); // onto the FIRST row
    assert.deepStrictEqual(u.order(), ['c', 'a', 'd', 'b']);
  });

  test('ranking drop: dropping a row on itself, or a drop when nothing is being dragged, changes nothing (but is still preventDefault()ed); a drop after dragend also does nothing', () => {
    const r = rankingSandbox(ITEMS);
    r.drag('b');
    assert.strictEqual(r.drop('b'), 1);
    assert.deepStrictEqual(r.order(), ITEMS);
    assert.ok(r.list.children.every((x) => !x.classList.contains('dragging')), 'the drop helper fired dragend on the source');
    assert.strictEqual(r.drop('c'), 1, 'no .dragging row any more');
    assert.deepStrictEqual(r.order(), ITEMS);
    const fresh = rankingSandbox(ITEMS);
    assert.strictEqual(fresh.drop('c'), 1);
    assert.deepStrictEqual(fresh.order(), ITEMS);
    assert.deepStrictEqual(fresh.nums(), ['1', '2', '3', '4']);
  });

  test('ranking: keyboard moves and drag-drops compose, and Check order submits the CURRENT DOM order (dataset.value of each row)', () => {
    const r = rankingSandbox(ITEMS);
    r.drag('a'); r.drop('d');
    assert.deepStrictEqual(r.order(), ['b', 'c', 'd', 'a']);
    r.press('a', 'ArrowUp');
    assert.deepStrictEqual(r.order(), ['b', 'c', 'a', 'd']);
    assert.deepStrictEqual(r.submit(), ['b', 'c', 'a', 'd']);
  });

  // ---------------- clearQuestionUI ----------------
  test('clearQuestionUI: empties #options, resets its role/label to neutral "group" (Agent-comment fix: a leftover radiogroup role must not survive onto the next question), clears feedback/kbHint, hides+unshows the next button', () => {
    const s = renderSandbox();
    s.els.options.appendChild(s.ctx.document.createElement('button'));
    s.els.options.setAttribute('role', 'radiogroup');
    s.els.feedback.className = 'feedback show good'; s.els.feedback.textContent = 'Correct!';
    s.els.next.style.display = 'inline-block'; s.els.next.classList.add('show');
    s.els.kbHint.textContent = 'old hint';
    vm.runInContext('clearQuestionUI()', s.ctx);
    assert.strictEqual(s.els.options.children.length, 0);
    assert.strictEqual(s.els.options.getAttribute('role'), 'group');
    assert.strictEqual(s.els.options.getAttribute('aria-label'), 'Answer options');
    assert.strictEqual(s.els.feedback.className, 'feedback');
    assert.strictEqual(s.els.feedback.textContent, '');
    assert.strictEqual(s.els.next.style.display, 'none');
    assert.ok(!s.els.next.classList.has('show'));
    assert.strictEqual(s.els.kbHint.textContent, '');
  });

  // ---------------- renderMedia ----------------
  test('renderMedia: an image shows the wrap and sets src/alt; onerror hides the wrap again (a broken image link never leaves a visible blank frame)', () => {
    const s = renderSandbox();
    vm.runInContext('renderMedia({media:{image:{src:"pic.png",alt:"a cat"}}})', s.ctx);
    assert.strictEqual(s.els.qimg.src, 'pic.png');
    assert.strictEqual(s.els.qimg.alt, 'a cat');
    assert.strictEqual(s.els.qimgWrap.style.display, 'block');
    s.els.qimg.onerror();
    assert.strictEqual(s.els.qimgWrap.style.display, 'none');
  });

  test('renderMedia: no image hides the wrap and removes any stale src attribute', () => {
    const s = renderSandbox();
    s.els.qimg.setAttribute('src', 'stale.png');
    vm.runInContext('renderMedia({})', s.ctx);
    assert.strictEqual(s.els.qimgWrap.style.display, 'none');
    assert.strictEqual(s.els.qimg.getAttribute('src'), null);
  });

  test('renderMedia: a real audio file shows the audio player, hides the TTS button, and sets its aria-label/caption from media.audio.label (default "Listen")', () => {
    const s = renderSandbox();
    vm.runInContext('renderMedia({media:{audio:{src:"clip.mp3",label:"Hear it"}}})', s.ctx);
    assert.strictEqual(s.els.qaudio.style.display, 'block');
    assert.strictEqual(s.els.qaudio.src, 'clip.mp3');
    assert.strictEqual(s.els.qaudio.getAttribute('aria-label'), 'Hear it');
    assert.strictEqual(s.els.qaudioLabel.textContent, 'Hear it');
    assert.strictEqual(s.els.qaudioWrap.style.display, 'block');
    assert.strictEqual(s.els.qttsBtn.style.display, 'none');
  });

  test('renderMedia: TTS-only audio (no file) shows the TTS button instead of the player, and clicking it invokes speakTts with the tts text', () => {
    const s = renderSandbox();
    vm.runInContext('renderMedia({media:{audio:{tts:"Hello there"}}})', s.ctx);
    assert.strictEqual(s.els.qaudio.style.display, 'none');
    assert.strictEqual(s.els.qttsBtn.style.display, 'flex');
    assert.strictEqual(s.els.qttsBtn.getAttribute('aria-pressed'), 'false');
    s.els.qttsBtn.onclick();
    assert.deepStrictEqual(s.call('speakTts')[0][1], ['Hello there']);
  });

  test('renderMedia: no audio at all hides both the player wrap and the TTS button, and .load()s the (now-stale) audio element', () => {
    const s = renderSandbox();
    let loaded = false;
    s.els.qaudio.load = () => { loaded = true; };
    vm.runInContext('renderMedia({})', s.ctx);
    assert.strictEqual(s.els.qaudioWrap.style.display, 'none');
    assert.strictEqual(s.els.qttsBtn.style.display, 'none');
    assert.ok(loaded, 'the stale <audio> element is explicitly reset via .load(), not just hidden');
  });
})();

// ============================================================
console.log('quiz.html render(): the per-question dispatcher (Agent 172)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_171.md item 1: render() is the one function that ties together every
  // render* function Agent 171 covered (rawType dispatch, counter/progress-bar text, subprompt map,
  // the .anim-in reflow trick, renderMedia/clearQuestionUI ordering, the banner branch). Here the
  // collaborators (renderMedia/clearQuestionUI/renderChoice/renderTextLike/renderMatching/
  // renderRanking/submitAnswer) are recording spies so ONLY render()'s own dispatch logic is
  // exercised; the real esc/questionText/rawType/questionHTML/setTextSmooth/makeCheckButton run.
  // Deliberately reuses Agent 171's FakeElement (this section sits in its own IIFE, so a minimal
  // copy of the shape is redeclared rather than leaked between sections).
  const fs = require('fs'), vm = require('vm');
  const html = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');

  function makeEl(tag) {
    const el = {
      tagName: String(tag).toUpperCase(), _cls: new Set(), _attrs: {}, _children: [], _l: {},
      style: {}, textContent: '', innerHTML: '', focused: false, type: '', className: '',
      get classList() {
        const s = el._cls;
        return { add: (c) => s.add(c), remove: (c) => s.delete(c), contains: (c) => s.has(c) };
      },
      setAttribute(k, v) { el._attrs[k] = String(v); },
      getAttribute(k) { return k in el._attrs ? el._attrs[k] : null; },
      appendChild(c) { el._children.push(c); return c; },
      get children() { return el._children; },
      addEventListener(t, fn) { (el._l[t] = el._l[t] || []).push(fn); },
      click() { (el._l.click || []).forEach((fn) => fn({})); },
      focus() { el.focused = true; },
      querySelector(sel) {
        const tag = sel.toLowerCase();
        const walk = (n) => { for (const c of n._children) { if (c.tagName.toLowerCase() === tag) return c; const r = walk(c); if (r) return r; } return null; };
        return walk(el);
      },
      offsetWidth: 0,
    };
    Object.defineProperty(el, 'className', { get() { return [...el._cls].join(' '); }, set(v) { el._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
    return el;
  }

  function sandbox(questions, idx) {
    const ids = {};
    ['counter', 'bar', 'progressWrap', 'question', 'subprompt', 'options'].forEach((id) => { ids[id] = makeEl('div'); });
    const card = makeEl('div');
    card._cls.add('anim-in');
    const log = [];
    const spy = (name) => (...a) => { log.push([name, a]); };
    const ctx = {
      $: (id) => ids[id],
      document: { querySelector: (s) => (s === '.card' ? card : null), createElement: (t) => makeEl(t) },
      renderMedia: spy('renderMedia'), clearQuestionUI: spy('clearQuestionUI'),
      renderChoice: spy('renderChoice'), renderTextLike: spy('renderTextLike'),
      renderMatching: spy('renderMatching'), renderRanking: spy('renderRanking'),
      submitAnswer: spy('submitAnswer'),
      data: { questions }, i: idx || 0, locked: true, focusIdx: 5,
    };
    vm.createContext(ctx);
    vm.runInContext(
      ['esc', 'questionText', 'rawType', 'questionHTML', 'setTextSmooth', 'makeCheckButton', 'render'].map((n) => extractFn(html, n)).join('\n'),
      ctx,
    );
    const run = () => vm.runInContext('render()', ctx);
    const names = () => log.map((c) => c[0]);
    return { ids, card, log, ctx, run, names };
  }

  test('render(): counter shows "(i+1) / total" and the progress bar/aria-valuenow reflect the number of questions ALREADY completed (i/total, rounded)', () => {
    const s = sandbox([{ question: 'a' }, { question: 'b' }, { question: 'c' }], 1);
    s.run();
    assert.strictEqual(s.ids.counter.textContent, '2 / 3');
    assert.strictEqual(s.ids.bar.style.width, '33%');
    assert.strictEqual(s.ids.progressWrap.getAttribute('aria-valuenow'), '33');
    const s0 = sandbox([{ question: 'a' }, { question: 'b' }], 0);
    s0.run();
    assert.strictEqual(s0.ids.bar.style.width, '0%', 'the first question starts at 0%, not 50%');
  });

  test('render(): question text is HTML-escaped, falls back question_text -> question, and a run of 3+ underscores becomes the blank span', () => {
    const s = sandbox([{ question_text: 'x<b> ___ y', question: 'ignored' }]);
    s.run();
    assert.strictEqual(s.ids.question.innerHTML, 'x&lt;b&gt; <span class="blank">______</span> y');
    const s2 = sandbox([{ question: 'plain' }]);
    s2.run();
    assert.strictEqual(s2.ids.question.innerHTML, 'plain');
  });

  test('render(): subprompt — q.subprompt wins; otherwise the per-type default (checkbox/matching/ranking/text-likes); radio, dropdown and unknown types fall back to "Choose the best answer."', () => {
    const want = {
      checkbox: 'Select all that apply.', matching: 'Match each item.', ranking: 'Put the items in the correct order.',
      text: 'Type your answer.', short_text: 'Type your answer.', number: 'Enter a number.', date: 'Choose a date.',
      fill_in_the_blank: 'Complete the sentence.', radio: 'Choose the best answer.', dropdown: 'Choose the best answer.',
      mystery: 'Choose the best answer.',
    };
    Object.keys(want).forEach((t) => {
      const s = sandbox([{ question_type: t, question: 'q' }]);
      s.run();
      assert.strictEqual(s.ids.subprompt.textContent, want[t], t);
    });
    const s = sandbox([{ question_type: 'checkbox', subprompt: 'Pick two.' }]);
    s.run();
    assert.strictEqual(s.ids.subprompt.textContent, 'Pick two.');
  });

  test('render(): dispatches each type to exactly ONE render function with (q, type) — choice types, text-like types, matching, ranking', () => {
    const cases = [
      ['radio', 'renderChoice'], ['checkbox', 'renderChoice'], ['dropdown', 'renderChoice'],
      ['text', 'renderTextLike'], ['short_text', 'renderTextLike'], ['number', 'renderTextLike'],
      ['date', 'renderTextLike'], ['fill_in_the_blank', 'renderTextLike'],
      ['matching', 'renderMatching'], ['ranking', 'renderRanking'],
    ];
    cases.forEach(([t, fn]) => {
      const q = { question_type: t, question: 'q' };
      const s = sandbox([q]);
      s.run();
      const called = s.log.filter((c) => /^render(Choice|TextLike|Matching|Ranking)$/.test(c[0]));
      assert.strictEqual(called.length, 1, t + ' calls exactly one type renderer');
      assert.strictEqual(called[0][0], fn, t);
      assert.strictEqual(called[0][1][0], q, t + ': receives the question object');
      if (fn === 'renderChoice' || fn === 'renderTextLike') assert.strictEqual(called[0][1][1], t, t + ': receives the type');
    });
  });

  test('render(): rawType aliases route through — "reorganizer" -> ranking, "complete-question" -> text-like fill_in_the_blank, "comparison" with pairs -> matching; a missing question_type is radio', () => {
    const run = (q) => { const s = sandbox([q]); s.run(); return s.log.filter((c) => /^render(Choice|TextLike|Matching|Ranking)$/.test(c[0])).map((c) => c[0].concat(':', c[1][1] || '')); };
    assert.deepStrictEqual(run({ question_type: 'reorganizer', question: 'q' }), ['renderRanking:']);
    assert.deepStrictEqual(run({ question_type: 'complete-question', question: 'q' }), ['renderTextLike:fill_in_the_blank']);
    assert.deepStrictEqual(run({ question_type: 'comparison', pairs: [], question: 'q' }), ['renderMatching:']);
    assert.deepStrictEqual(run({ question: 'q' }), ['renderChoice:radio']);
  });

  test('render(): an unrecognised question type renders no answer UI at all (no type renderer is called) but still clears the previous question\'s UI', () => {
    const s = sandbox([{ question_type: 'mystery', question: 'q' }]);
    s.run();
    assert.deepStrictEqual(s.names(), ['renderMedia', 'clearQuestionUI']);
  });

  test('render(): order is renderMedia -> clearQuestionUI -> type renderer (clearing must come BEFORE the renderer fills #options), and it resets locked=false / focusIdx=0', () => {
    const s = sandbox([{ question_type: 'radio', question: 'q' }]);
    s.run();
    assert.deepStrictEqual(s.names(), ['renderMedia', 'clearQuestionUI', 'renderChoice']);
    assert.strictEqual(s.ctx.locked, false, 'a question locked by the previous answer becomes answerable again');
    assert.strictEqual(s.ctx.focusIdx, 0);
  });

  test('render(): the .anim-in reflow trick — the class is REMOVED, offsetWidth is read (forcing reflow), then the class is re-ADDED so the animation restarts', () => {
    const s = sandbox([{ question: 'q' }]);
    let presentAtRead = null;
    Object.defineProperty(s.card, 'offsetWidth', { get() { presentAtRead = s.card.classList.contains('anim-in'); return 0; } });
    assert.ok(s.card.classList.contains('anim-in'), 'precondition: previous question left the class on');
    s.run();
    assert.strictEqual(presentAtRead, false, 'class must be absent when the layout is read, or the browser never restarts the animation');
    assert.ok(s.card.classList.contains('anim-in'), 'class is back on afterwards');
  });

  test('render(): a banner question renders NO type renderer — question falls back to q.content, and a "Continue" button (focused) submits {banner:true}', () => {
    const s = sandbox([{ question_type: 'banner', content: 'Read <this>' }]);
    s.run();
    assert.strictEqual(s.ids.question.innerHTML, 'Read &lt;this&gt;');
    assert.ok(!s.names().some((n) => /^render(Choice|TextLike|Matching|Ranking)$/.test(n)));
    const wrap = s.ids.options.children[0];
    const btn = wrap.children[0];
    assert.strictEqual(btn.textContent, 'Continue');
    assert.ok(btn.focused, 'the Continue button is focused for keyboard users');
    btn.click();
    assert.deepStrictEqual(JSON.parse(JSON.stringify(s.log.filter((c) => c[0] === 'submitAnswer')[0][1])), [{ banner: true }]);
  });

  test('render(): a banner with its own question text prefers it over q.content', () => {
    const s = sandbox([{ question_type: 'banner', question: 'Heading', content: 'Body' }]);
    s.run();
    assert.strictEqual(s.ids.question.innerHTML, 'Heading');
  });

  test('render(): a banner shows NO subprompt (empty string, not the generic "Choose the best answer."); an explicit q.subprompt on a banner still wins (Agent 195 fixed carried item 11; was pinned as the opposite by Agent 172)', () => {
    const s = sandbox([{ question_type: 'banner', content: 'x' }]);
    s.run();
    assert.strictEqual(s.ids.subprompt.textContent, '');
    const t = sandbox([{ question_type: 'banner', content: 'x', subprompt: 'Read this first.' }]);
    t.run();
    assert.strictEqual(t.ids.subprompt.textContent, 'Read this first.');
  });

  test('render(): re-rendering the same index reuses the counter without error and reflects a changed index (i is read fresh on every call)', () => {
    const s = sandbox([{ question: 'a' }, { question: 'b' }, { question: 'c' }, { question: 'd' }], 0);
    s.run();
    assert.strictEqual(s.ids.counter.textContent, '1 / 4');
    s.ctx.i = 3;
    s.run();
    assert.strictEqual(s.ids.counter.textContent, '4 / 4');
    assert.strictEqual(s.ids.bar.style.width, '75%');
    assert.strictEqual(s.ids.question.innerHTML, 'd');
  });
})();

// ============================================================
console.log('quiz.html lesson gate: getLevelLessons/findOwningLesson/enforceLessonGate (Agent 173)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_172.md item 1. enforceLessonGate() guards real navigation
  // (location.replace) and the shared lesson-list fetch that the suggestion tiering also reuses,
  // and had no test. The REAL three functions run in a vm sandbox against a stub fetch (routing
  // by URL, counting calls) and a recording location.replace.
  const fs = require('fs'), vm = require('vm');
  const html = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');
  const LESSONS = [
    { lesson_id: 'L1', exercise_quiz_ids: ['q-one', 'q-two'] },
    { lesson_id: 'L2' },
    { lesson_id: 'L3', exercise_quiz_ids: 'q-three' },
    { lesson_id: 'L4', exercise_quiz_ids: ['q-four'] },
  ];
  // routes: { url: value | (() => response) }; a value is served as ok JSON; 'HTTP500' -> !ok; 'REJECT' -> network error
  function gate(routes, over) {
    const fetched = [], replaced = [];
    const ctx = Object.assign({
      level: 'b1', id: 'q-one', lessonParam: null, redirect: null,
      fetch: (url, opts) => {
        fetched.push([url, opts]);
        const r = routes[url];
        if (r === undefined || r === 'REJECT') return Promise.reject(new Error('network'));
        if (r === 'HTTP500') return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve([]) });
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(r) });
      },
      location: { replace: (u) => replaced.push(u) },
    }, over || {});
    vm.createContext(ctx);
    vm.runInContext(
      'let _levelLessonsPromise=null;\n' + ['getLevelLessons', 'findOwningLesson', 'enforceLessonGate'].map((n) => extractFn(html, n)).join('\n'),
      ctx,
    );
    const ev = (code) => vm.runInContext(code, ctx);
    return { ctx, fetched, replaced, ev };
  }
  const PER = '../course_content/lessons/b1.json', FALL = '../course_content/lessons.json';

  testAsync('findOwningLesson: a falsy id, or any placement-* id (case-insensitive), is never lesson-owned and never even fetches', async () => {
    const g = gate({ [PER]: LESSONS });
    for (const q of [undefined, null, '', 'placement-a1', 'PLACEMENT-b2']) {
      assert.strictEqual(await g.ev('findOwningLesson')(q), null, String(q));
    }
    assert.strictEqual(g.fetched.length, 0);
  });

  testAsync('findOwningLesson: returns the lesson whose exercise_quiz_ids array contains the quiz; skips lessons lacking an array (missing or string); unknown quiz -> null', async () => {
    const g = gate({ [PER]: LESSONS });
    assert.strictEqual((await g.ev('findOwningLesson')('q-two')).lesson_id, 'L1');
    assert.strictEqual((await g.ev('findOwningLesson')('q-four')).lesson_id, 'L4');
    assert.strictEqual(await g.ev('findOwningLesson')('q-three'), null, 'a string exercise_quiz_ids is not an array — never matched, even by substring');
    assert.strictEqual(await g.ev('findOwningLesson')('nope'), null);
  });

  testAsync('getLevelLessons: fetches the per-level file with cache:no-store and shares ONE in-flight/cached promise across callers (a single network request)', async () => {
    const g = gate({ [PER]: LESSONS });
    const a = g.ev('getLevelLessons()'), b = g.ev('getLevelLessons()');
    assert.strictEqual(a, b, 'same promise object');
    assert.strictEqual((await a).length, 4);
    await g.ev('findOwningLesson')('q-one');
    assert.strictEqual(g.fetched.length, 1);
    assert.strictEqual(g.fetched[0][0], PER);
    assert.deepStrictEqual(clone2(g.fetched[0][1]), { cache: 'no-store' });
  });
  function clone2(x) { return JSON.parse(JSON.stringify(x)); }

  testAsync('getLevelLessons: per-level file HTTP error OR network failure falls back to the combined lessons.json', async () => {
    for (const bad of ['HTTP500', 'REJECT']) {
      const g = gate({ [PER]: bad, [FALL]: LESSONS });
      const list = await g.ev('getLevelLessons()');
      assert.strictEqual(list.length, 4, bad);
      assert.deepStrictEqual(g.fetched.map((f) => f[0]), [PER, FALL], bad);
    }
  });

  testAsync('getLevelLessons: both sources failing, or a non-array payload, resolves to [] (never rejects) — and findOwningLesson then finds nothing', async () => {
    const g = gate({ [PER]: 'REJECT', [FALL]: 'REJECT' });
    assert.deepStrictEqual(clone2(await g.ev('getLevelLessons()')), []);
    assert.strictEqual(await g.ev('findOwningLesson')('q-one'), null);
    const g2 = gate({ [PER]: { not: 'an array' } });
    assert.deepStrictEqual(clone2(await g2.ev('getLevelLessons()')), []);
  });

  testAsync('getLevelLessons: a FAILED load (both sources) is NOT cached — the next call retries and, once the network is back, gets the real list; a successful load stays cached (Agent 195 fixed carried item 12; was pinned as "cached as [] forever" by Agent 173)', async () => {
    const routes = { [PER]: 'REJECT', [FALL]: 'REJECT' };
    const g = gate(routes);
    assert.deepStrictEqual(clone2(await g.ev('getLevelLessons()')), [], 'a failed load still resolves to [] (never rejects)');
    assert.strictEqual(g.fetched.length, 2, 'per-level then combined');
    routes[PER] = LESSONS; // network recovered
    assert.strictEqual((await g.ev('getLevelLessons()')).length, 4, 'second call retried and succeeded');
    assert.strictEqual(g.fetched.length, 3, 'exactly one more request (the per-level file)');
    await g.ev('getLevelLessons()');
    assert.strictEqual(g.fetched.length, 3, 'the successful load is cached');
    assert.strictEqual((await g.ev('findOwningLesson')('q-one')).lesson_id, 'L1');
  });

  testAsync('getLevelLessons: concurrent callers during a failing load still share ONE in-flight promise; an HTTP error from the combined-file fallback counts as a failure (evicted, retried) while a non-array payload is a successful (cached) empty list (Agent 195, item 12)', async () => {
    const g = gate({ [PER]: 'REJECT', [FALL]: 'REJECT' });
    const a = g.ev('getLevelLessons()'), b = g.ev('getLevelLessons()');
    assert.strictEqual(a, b);
    await a;
    assert.strictEqual(g.fetched.length, 2);
    const h = gate({ [PER]: 'HTTP500', [FALL]: 'HTTP500' });
    await h.ev('getLevelLessons()');
    await h.ev('getLevelLessons()');
    assert.strictEqual(h.fetched.length, 4, 'HTTP 500 from both sources is a failure, so the second call retries both');
    const n = gate({ [PER]: { not: 'an array' } });
    await n.ev('getLevelLessons()');
    await n.ev('getLevelLessons()');
    assert.strictEqual(n.fetched.length, 1, 'a well-formed but non-array payload is cached, not retried');
  });

  testAsync('enforceLessonGate: a quiz no lesson owns is not gated — returns false and never redirects', async () => {
    const g = gate({ [PER]: LESSONS }, { id: 'standalone-quiz' });
    assert.strictEqual(await g.ev('enforceLessonGate()'), false);
    assert.deepStrictEqual(g.replaced, []);
  });

  testAsync('enforceLessonGate: a placement quiz is never gated, even if a lesson lists it', async () => {
    const g = gate({ [PER]: [{ lesson_id: 'LP', exercise_quiz_ids: ['placement-b1'] }] }, { id: 'placement-b1' });
    assert.strictEqual(await g.ev('enforceLessonGate()'), false);
    assert.deepStrictEqual(g.replaced, []);
  });

  testAsync('enforceLessonGate: arriving with ?lesson= equal to the OWNING lesson passes through (false, no redirect)', async () => {
    const g = gate({ [PER]: LESSONS }, { id: 'q-two', lessonParam: 'L1' });
    assert.strictEqual(await g.ev('enforceLessonGate()'), false);
    assert.deepStrictEqual(g.replaced, []);
  });

  testAsync('enforceLessonGate: no lesson param, or a param for a DIFFERENT lesson, redirects to the owning lesson\'s player and returns true', async () => {
    for (const lp of [null, '', 'L4']) {
      const g = gate({ [PER]: LESSONS }, { id: 'q-two', lessonParam: lp });
      assert.strictEqual(await g.ev('enforceLessonGate()'), true, String(lp));
      assert.strictEqual(g.replaced.length, 1);
      assert.ok(g.replaced[0].startsWith('../courses/lesson.html?lesson=L1&level=b1&redirect='), g.replaced[0]);
    }
  });

  testAsync('enforceLessonGate: redirect target — default back-link is the level\'s course page; an explicit ?redirect= wins; all three params are URL-encoded', async () => {
    const g = gate({ [PER]: LESSONS }, { id: 'q-two' });
    await g.ev('enforceLessonGate()');
    assert.strictEqual(g.replaced[0], '../courses/lesson.html?lesson=L1&level=b1&redirect=' + encodeURIComponent('../courses/course.html?level=b1'));
    const g2 = gate({ [PER]: [{ lesson_id: 'A B&c', exercise_quiz_ids: ['q-two'] }] }, { id: 'q-two', redirect: '../x.html?a=1&b=2' });
    await g2.ev('enforceLessonGate()');
    assert.strictEqual(g2.replaced[0], '../courses/lesson.html?lesson=' + encodeURIComponent('A B&c') + '&level=b1&redirect=' + encodeURIComponent('../x.html?a=1&b=2'));
  });

  testAsync('enforceLessonGate: when the lesson list cannot be loaded at all it FAILS OPEN (false, no redirect) — a network outage must not lock learners out of their quiz', async () => {
    const g = gate({ [PER]: 'REJECT', [FALL]: 'REJECT' }, { id: 'q-one' });
    assert.strictEqual(await g.ev('enforceLessonGate()'), false);
    assert.deepStrictEqual(g.replaced, []);
  });
})();

// ============================================================
console.log('quiz.html keyboard layer: onOptionKeydown/moveFocus/document digit-key handler (Agent 174)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_173.md item 1. The REAL onOptionKeydown + moveFocus (extractFn) and the
  // REAL inline `document.addEventListener('keydown', ...)` digit-key handler (sliced out of the file
  // by source text, then registered against a stub document that captures the listener) run in a vm
  // sandbox with simple fake option buttons. locked/data/i are sandbox lexical globals, as in the page.
  const fs = require('fs'), vm = require('vm');
  const html = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');
  const HANDLER_OPEN = "document.addEventListener('keydown',e=>{";
  function digitHandlerSrc() {
    const s = html.indexOf(HANDLER_OPEN);
    if (s < 0) throw new Error("quiz.html: document keydown handler not found");
    const e = html.indexOf('\n});', s);
    if (e < 0) throw new Error('quiz.html: document keydown handler end not found');
    return html.slice(s, e + 4);
  }
  const clone3 = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

  // n fake #options > .option buttons; screens start/end/error default to display:none.
  function kb(over) {
    over = over || {};
    const n = over.n === undefined ? 3 : over.n;
    const log = { clicks: [], focuses: [], prevented: 0, selectors: [] };
    const options = Array.from({ length: n }, (_, k) => ({
      tabIndex: k === 0 ? 0 : -1, disabled: false,
      click() { log.clicks.push(k + 1); },
      focus() { log.focuses.push(k + 1); },
    }));
    const screens = { start: { style: { display: 'none' } }, end: { style: { display: 'none' } }, error: { style: { display: 'none' } } };
    const box = { querySelectorAll: (sel) => { log.selectors.push('$options:' + sel); return options; } };
    const handlers = [];
    const ctx = {
      $: (id) => (id === 'options' ? box : screens[id]),
      document: {
        querySelectorAll: (sel) => { log.selectors.push(sel); return sel === '#options > .option' ? options : []; },
        addEventListener: (t, fn) => handlers.push([t, fn]),
      },
    };
    vm.createContext(ctx);
    vm.runInContext(
      'let locked=false,data=null,i=0;\n' + ['rawType', 'answerList', 'onOptionKeydown', 'moveFocus'].map((f) => extractFn(html, f)).join('\n') + '\n' + digitHandlerSrc(),
      ctx,
    );
    const ev = (code) => vm.runInContext(code, ctx);
    const setData = (questions, idx) => ev('data=' + JSON.stringify({ questions }) + ';i=' + (idx || 0));
    if (over.data !== false) setData([{ answers: options.map((_, k) => 'opt' + (k + 1)) }]);
    const mkEvt = (key, target, extra) => Object.assign({ key, target, preventDefault() { log.prevented++; } }, extra || {});
    return {
      ctx, ev, log, options, screens, handlers, setData,
      optKey: (key, target, extra) => ctx.onOptionKeydown(mkEvt(key, target, extra)),
      docKey: (key, extra) => handlers[0][1](mkEvt(key, undefined, extra)),
      tabbable: () => options.map((o, k) => (o.tabIndex === 0 ? k + 1 : null)).filter(Boolean),
    };
  }

  test('wiring: exactly one document keydown listener is registered by the page, and renderChoice attaches onOptionKeydown to every choice button', () => {
    assert.strictEqual((html.match(/document\.addEventListener\('keydown'/g) || []).length, 1, 'one document-level keydown listener in quiz.html');
    const k = kb();
    assert.strictEqual(k.handlers.length, 1);
    assert.strictEqual(k.handlers[0][0], 'keydown');
    assert.ok(/addEventListener\('keydown',onOptionKeydown\)/.test(extractFn(html, 'renderChoice')), 'renderChoice wires onOptionKeydown onto each option');
  });

  test('onOptionKeydown: ArrowRight/ArrowDown focus the NEXT option and ArrowLeft/ArrowUp the PREVIOUS one, each preventDefault()ed; the roving tabIndex follows focus', () => {
    const k = kb();
    k.optKey('ArrowRight', k.options[0]);
    assert.deepStrictEqual(k.log.focuses, [2]);
    assert.deepStrictEqual(k.tabbable(), [2]);
    k.optKey('ArrowDown', k.options[1]);
    assert.deepStrictEqual(k.log.focuses, [2, 3]);
    assert.deepStrictEqual(k.tabbable(), [3]);
    k.optKey('ArrowLeft', k.options[2]);
    k.optKey('ArrowUp', k.options[1]);
    assert.deepStrictEqual(k.log.focuses, [2, 3, 2, 1]);
    assert.deepStrictEqual(k.tabbable(), [1]);
    assert.strictEqual(k.log.prevented, 4, 'every arrow press is preventDefault()ed (no page scroll)');
    assert.deepStrictEqual(k.log.clicks, [], 'moving focus never selects an answer');
  });

  test('moveFocus: wraps around at both ends, and exactly ONE option is ever tabbable (the roving tabIndex) however many moves are made', () => {
    const k = kb({ n: 3 });
    k.optKey('ArrowRight', k.options[0]); k.optKey('ArrowRight', k.options[1]); // now on 3
    k.optKey('ArrowRight', k.options[2]); // wrap -> 1
    assert.deepStrictEqual(k.log.focuses, [2, 3, 1]);
    assert.deepStrictEqual(k.tabbable(), [1]);
    k.optKey('ArrowLeft', k.options[0]); // wrap backwards -> 3
    assert.deepStrictEqual(k.log.focuses, [2, 3, 1, 3]);
    assert.deepStrictEqual(k.tabbable(), [3]);
    const one = kb({ n: 1 });
    one.optKey('ArrowDown', one.options[0]);
    assert.deepStrictEqual(one.log.focuses, [1], 'a single option wraps onto itself');
    assert.deepStrictEqual(one.tabbable(), [1]);
  });

  test('moveFocus: a no-op when locked (no focus move, tabIndex untouched) or when the list is empty; arrow keys are still preventDefault()ed when locked', () => {
    const k = kb();
    k.ev('locked=true');
    k.optKey('ArrowRight', k.options[0]);
    assert.deepStrictEqual(k.log.focuses, []);
    assert.deepStrictEqual(k.tabbable(), [1]);
    assert.strictEqual(k.log.prevented, 1);
    const empty = kb({ n: 0 });
    assert.doesNotThrow(() => empty.ctx.moveFocus([], 0, 1));
    assert.deepStrictEqual(empty.log.focuses, []);
  });

  test('onOptionKeydown: Enter and Space click the focused option and are preventDefault()ed; while locked they are still preventDefault()ed (Space cannot scroll) but click nothing', () => {
    const k = kb();
    k.optKey('Enter', k.options[1]);
    k.optKey(' ', k.options[2]);
    assert.deepStrictEqual(k.log.clicks, [2, 3]);
    assert.strictEqual(k.log.prevented, 2);
    k.ev('locked=true');
    k.optKey('Enter', k.options[0]);
    k.optKey(' ', k.options[0]);
    assert.deepStrictEqual(k.log.clicks, [2, 3], 'no new clicks while locked');
    assert.strictEqual(k.log.prevented, 4);
  });

  test('onOptionKeydown: any other key (Tab, Escape, letters, digits, Home/End) is left alone — no click, no focus move, no preventDefault', () => {
    const k = kb();
    for (const key of ['Tab', 'Escape', 'a', 'Home', 'End', '1', 'PageDown']) k.optKey(key, k.options[0]);
    assert.deepStrictEqual(k.log.clicks, []);
    assert.deepStrictEqual(k.log.focuses, []);
    assert.strictEqual(k.log.prevented, 0);
  });

  test('onOptionKeydown: only acts on direct-child #options > .option targets — a Check button, <select>, matching row or unknown element is ignored (Enter keeps its native behaviour, nothing is preventDefault()ed)', () => {
    const k = kb();
    for (const target of [{ click() { k.log.clicks.push('X'); } }, {}, null, undefined]) {
      for (const key of ['Enter', ' ', 'ArrowDown', 'ArrowUp']) k.optKey(key, target);
    }
    assert.deepStrictEqual(k.log.clicks, []);
    assert.deepStrictEqual(k.log.focuses, []);
    assert.strictEqual(k.log.prevented, 0);
    assert.ok(k.log.selectors.length > 0 && k.log.selectors.every((s) => s === '#options > .option'), 'the option list is re-queried at event time with the direct-child selector: ' + k.log.selectors[0]);
  });

  test('document handler: a digit key clicks the Nth option for a radio question (uses the CURRENT question index); out-of-range digits, 0 and non-digit keys do nothing', () => {
    const k = kb({ n: 3 });
    k.docKey('1'); k.docKey('3'); k.docKey('2');
    assert.deepStrictEqual(k.log.clicks, [1, 3, 2]);
    k.docKey('4'); k.docKey('0'); k.docKey('9');
    for (const key of ['a', 'Enter', ' ', 'ArrowDown', 'Tab', 'F1', 'Escape']) k.docKey(key);
    assert.deepStrictEqual(k.log.clicks, [1, 3, 2], 'no new clicks');
    // i selects which question decides the number of valid digits
    k.setData([{ answers: ['a', 'b', 'c'] }, { answers: ['x'] }], 1);
    k.docKey('2');
    assert.deepStrictEqual(k.log.clicks, [1, 3, 2], 'question 2 has one answer, so digit 2 is out of range');
    k.docKey('1');
    assert.deepStrictEqual(k.log.clicks, [1, 3, 2, 1]);
  });

  test('document handler: ignored while locked, before any data has loaded, or while the start / end / error screen is display:grid; other display values do not block it', () => {
    const k = kb();
    k.ev('locked=true'); k.docKey('1');
    k.ev('locked=false');
    k.ev('data=null'); k.docKey('1');
    k.setData([{ answers: ['a', 'b', 'c'] }]);
    for (const s of ['start', 'end', 'error']) {
      k.screens[s].style.display = 'grid'; k.docKey('1');
      k.screens[s].style.display = 'none';
    }
    assert.deepStrictEqual(k.log.clicks, [], 'every guarded case swallowed the key');
    for (const d of ['none', 'flex', 'block', '']) { k.screens.start.style.display = d; k.docKey('1'); }
    assert.deepStrictEqual(k.log.clicks, [1, 1, 1, 1], 'only display:grid blocks');
  });

  test('document handler: digit shortcuts are radio-only — checkbox, dropdown, text-like, matching, ranking and banner questions ignore them; radio aliases (missing type, "Radio", comparison without pairs) still work', () => {
    const k = kb({ n: 3 });
    for (const t of ['checkbox', 'dropdown', 'text', 'number', 'fill_in_the_blank', 'matching', 'ranking', 'banner']) {
      k.setData([{ question_type: t, answers: ['a', 'b', 'c'] }]);
      k.docKey('1');
    }
    assert.deepStrictEqual(k.log.clicks, [], 'no shortcut click for any non-radio type');
    for (const q of [{ answers: ['a', 'b', 'c'] }, { question_type: 'Radio', answers: ['a', 'b', 'c'] }, { question_type: 'comparison', answers: ['a', 'b', 'c'] }]) {
      k.setData([q]);
      k.docKey('2');
    }
    assert.deepStrictEqual(k.log.clicks, [2, 2, 2]);
  });

  test('document handler: options may be given as objects ({text}) and the digit range follows answerList(q); a disabled Nth button is skipped and a missing Nth button does not throw', () => {
    const k = kb({ n: 3 });
    k.setData([{ answers: [{ text: 'a' }, { text: 'b' }, { text: 'c' }] }]);
    k.docKey('3');
    assert.deepStrictEqual(k.log.clicks, [3]);
    k.options[1].disabled = true; k.docKey('2');
    assert.deepStrictEqual(k.log.clicks, [3], 'disabled button is not clicked');
    k.setData([{ answers: ['a', 'b', 'c', 'd', 'e'] }]); // 5 answers, only 3 rendered buttons
    assert.doesNotThrow(() => k.docKey('5'));
    assert.deepStrictEqual(k.log.clicks, [3]);
  });

  test('document handler: digit keys are modifier-aware — Ctrl/Cmd/Alt+digit (browser tab-switch shortcuts) do NOT click an option and are not preventDefault()ed; a plain digit afterwards still works (Agent 194 fixed carried item 14; was pinned as the opposite by Agent 174)', () => {
    const k = kb();
    k.docKey('2', { ctrlKey: true });
    k.docKey('1', { metaKey: true });
    k.docKey('3', { altKey: true });
    k.docKey('1', { ctrlKey: true, altKey: true });
    assert.deepStrictEqual(k.log.clicks, []);
    assert.strictEqual(k.log.prevented, 0);
    k.docKey('2', { shiftKey: true });
    k.docKey('3');
    assert.deepStrictEqual(k.log.clicks, [2, 3], 'Shift+digit and plain digit still answer');
  });
})();

// ============================================================
console.log('quiz.html load(): the page bootstrap / orchestration (Agent 175)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_174.md item 1. The REAL load() + resolveQuizPath() + validate() (and validate's
  // helpers) run in a vm sandbox. Everything load() talks to is a recording stub: show/errorState/
  // configureStart, the `$` element lookup, document.title, fetch (routed by URL), window.MylingoLevelLock /
  // MylingoRuntimeContentLoader / MylingoRuntimeV2, and enforceLessonGate (stubbed by default so the
  // orchestration is isolated; one test swaps in the REAL Agent 173 gate functions). URL-derived page
  // constants (id, level, mode, directRecommended, lessonParam, redirect) are sandbox globals, as in the page.
  const fs = require('fs'), vm = require('vm');
  const html = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');
  const GOOD = () => ({
    id: 'quiz-x', title: 'My Quiz', description: 'A description', level: 'B2', category: 'Grammar',
    questions: [
      { question: 'Q1', answers: ['a', 'b'], correctIndex: 1 },
      { question: 'Q2', answers: ['a', 'b', 'c'], correctIndex: 3 },
    ],
  });
  const PH120 = '../placement/assessment/placement-120.json';
  const jsonRes = (v) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(v) });
  const clone4 = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

  // over.routes: { url: value | 'HTTP404' | 'HTTP500' | 'REJECT' } (unrouted URLs serve GOOD())
  // over.lock: undefined -> unlocked | true/false -> isLocked result | null -> level-lock.js absent
  // over.gate: false (default) | true | 'REAL' (use the real Agent 173 gate functions and routes)
  // over.loader: (level,id) => Promise (default resolves GOOD()); over.normalize: (json,opts) => value
  function env(over) {
    over = over || {};
    const calls = [], els = {};
    const $el = (name) => els[name] || (els[name] = { name, textContent: '', style: {}, focus() { calls.push(['focus', name]); } });
    const routes = over.routes || {};
    const win = {
      MylingoRuntimeContentLoader: { load: (l, i) => { calls.push(['loader', l, i]); return over.loader ? over.loader(l, i) : Promise.resolve(GOOD()); } },
      MylingoRuntimeV2: { normalizeQuiz: (j, o) => { calls.push(['normalize', j, o]); return over.normalize ? over.normalize(j, o) : j; } },
    };
    if (over.lock !== null) win.MylingoLevelLock = { isLocked: (l) => { calls.push(['isLocked', l]); return !!over.lock; } };
    const ctx = Object.assign({
      id: 'quiz-x', level: 'b1', mode: '', directRecommended: false, lessonParam: null, redirect: null,
      window: win,
      console: { warn: (m) => calls.push(['warn', m]) },
      document: { title: '' },
      location: { replace: (u) => calls.push(['replace', u]) },
      $: $el,
      show: (s) => calls.push(['show', s]),
      errorState: (t, m, r) => calls.push(['error', t, m, r]),
      configureStart: () => calls.push(['configureStart']),
      fetch: (url, opts) => {
        calls.push(['fetch', url, opts]);
        const r = routes[url];
        if (r === 'REJECT') return Promise.reject(new Error('network'));
        if (r === 'HTTP404' || r === 'HTTP500') return Promise.resolve({ ok: false, status: r === 'HTTP404' ? 404 : 500, json: () => Promise.resolve({}) });
        return jsonRes(r === undefined ? GOOD() : r);
      },
    }, over.ctx || {});
    if (over.gate !== 'REAL') ctx.enforceLessonGate = () => { calls.push(['gate']); return Promise.resolve(!!over.gate); };
    vm.createContext(ctx);
    const names = ['rawType', 'answerList', 'correctIndexes', 'acceptedAnswers', 'questionText', 'normalizeText', 'validate', 'resolveQuizPath', 'appFilesError', 'load'];
    const gateNames = over.gate === 'REAL' ? ['getLevelLessons', 'findOwningLesson', 'enforceLessonGate'] : [];
    vm.runInContext('let data,_levelLessonsPromise=null;\n' + names.concat(gateNames).map((n) => extractFn(html, n)).join('\n'), ctx);
    const ev = (code) => vm.runInContext(code, ctx);
    const kinds = (k) => calls.filter((c) => c[0] === k);
    return { ctx, ev, calls, els, kinds, run: () => ctx.load() };
  }
  const errs = (e) => e.kinds('error').map((c) => [c[1], c[3]]);

  test('wiring: load() is invoked once at page bootstrap, and the error screen\'s Retry button re-runs it', () => {
    assert.ok(/^load\(\);$/m.test(html), 'bare load(); bootstrap call');
    assert.ok(/\$\('retryBtn'\)\.onclick=\(\)=>\{stopAllSounds\(\);load\(\)\}/.test(html), 'retryBtn.onclick -> stopAllSounds(); load()');
  });

  testAsync('load: always starts by showing the loading screen; no quiz id -> "No quiz to load" (not retryable) and NOTHING else runs (no lock check, gate, fetch or loader)', async () => {
    const e = env({ ctx: { id: null } });
    await e.run();
    assert.deepStrictEqual(clone4(e.calls[0]), ['show', 'loading']);
    assert.deepStrictEqual(errs(e), [['No quiz to load', false]]);
    assert.ok(/link/.test(e.kinds('error')[0][2]));
    assert.strictEqual(e.calls.length, 2, JSON.stringify(e.calls));
    for (const id of ['', undefined]) { const e2 = env({ ctx: { id } }); await e2.run(); assert.deepStrictEqual(errs(e2), [['No quiz to load', false]], String(id)); }
  });

  testAsync('load: a LOCKED level (normal mode) -> "Level locked" (not retryable); the lock is asked about the page level and blocks the gate, the fetch and the loader', async () => {
    const e = env({ lock: true, ctx: { level: 'c1' } });
    await e.run();
    assert.deepStrictEqual(errs(e), [['Level locked', false]]);
    assert.deepStrictEqual(clone4(e.kinds('isLocked')), [['isLocked', 'c1']]);
    assert.strictEqual(e.kinds('gate').length + e.kinds('loader').length + e.kinds('fetch').length + e.kinds('normalize').length, 0);
    assert.strictEqual(e.kinds('show').filter((c) => c[1] === 'start').length, 0);
  });

  testAsync('load: an UNLOCKED level runs lock check -> lesson gate -> loader, in that order, then reaches the start screen', async () => {
    const e = env({ lock: false });
    await e.run();
    assert.deepStrictEqual(errs(e), []);
    const order = e.calls.map((c) => c[0] + (c[0] === 'show' ? ':' + c[1] : ''));
    assert.deepStrictEqual(order.slice(0, 4), ['show:loading', 'isLocked', 'gate', 'loader']);
    assert.deepStrictEqual(clone4(e.kinds('loader')), [['loader', 'b1', 'quiz-x']]);
  });

  testAsync('load: recommended=1 (directRecommended) bypasses BOTH the level lock and the lesson gate — even for a locked level — and still loads the quiz', async () => {
    const e = env({ lock: true, ctx: { directRecommended: true } });
    await e.run();
    assert.strictEqual(e.kinds('isLocked').length, 0, 'lock never consulted');
    assert.strictEqual(e.kinds('gate').length, 0, 'gate never consulted');
    assert.strictEqual(e.kinds('warn').length, 0);
    assert.deepStrictEqual(errs(e), []);
    assert.strictEqual(e.kinds('loader').length, 1);
    assert.deepStrictEqual(clone4(e.kinds('show').pop()), ['show', 'start']);
  });

  testAsync('load: mode=placement bypasses the lock and the lesson gate too', async () => {
    const e = env({ lock: true, ctx: { mode: 'placement', id: 'placement-001' } });
    await e.run();
    assert.strictEqual(e.kinds('isLocked').length + e.kinds('gate').length, 0);
    assert.deepStrictEqual(errs(e), []);
    assert.deepStrictEqual(clone4(e.kinds('show').pop()), ['show', 'start']);
  });

  testAsync('load: level-lock.js missing -> level gating is OFF (fail-open): a console.warn naming the level, then it proceeds; no warn when the lock is bypassed (placement / recommended)', async () => {
    const e = env({ lock: null, ctx: { level: 'b2' } });
    await e.run();
    const w = e.kinds('warn');
    assert.strictEqual(w.length, 1);
    assert.ok(/level-lock\.js did not load/.test(w[0][1]) && /b2/.test(w[0][1]), w[0][1]);
    assert.deepStrictEqual(errs(e), []);
    assert.deepStrictEqual(clone4(e.kinds('show').pop()), ['show', 'start']);
    for (const c of [{ mode: 'placement', id: 'placement-001' }, { directRecommended: true }]) {
      const e2 = env({ lock: null, ctx: c }); await e2.run();
      assert.strictEqual(e2.kinds('warn').length, 0, JSON.stringify(c));
    }
    const e3 = env({ lock: null, ctx: { console: { warn() { throw new Error('console broke'); } } } });
    await e3.run();
    assert.deepStrictEqual(errs(e3), [], 'a throwing console.warn is swallowed');
  });

  testAsync('load: when the lesson gate redirects (true) load() STOPS before any data fetch — no loader, no fetch, no error, no start screen', async () => {
    const e = env({ gate: true });
    await e.run();
    assert.strictEqual(e.kinds('gate').length, 1);
    assert.strictEqual(e.kinds('loader').length + e.kinds('fetch').length + e.kinds('normalize').length, 0);
    assert.deepStrictEqual(errs(e), []);
    assert.deepStrictEqual(e.kinds('show').map((c) => c[1]), ['loading']);
    assert.strictEqual(e.ev('data'), undefined);
  });

  testAsync('load + REAL lesson gate: an un-launched lesson-backed quiz is redirected to lesson.html (location.replace) and nothing is loaded; arriving via ?lesson=<owner> loads normally', async () => {
    const LESSONS = [{ lesson_id: 'L9', exercise_quiz_ids: ['quiz-x'] }];
    const routes = { '../course_content/lessons/b1.json': LESSONS };
    const e = env({ gate: 'REAL', routes });
    await e.run();
    assert.strictEqual(e.kinds('replace').length, 1);
    assert.ok(e.kinds('replace')[0][1].startsWith('../courses/lesson.html?lesson=L9&level=b1&redirect='), e.kinds('replace')[0][1]);
    assert.strictEqual(e.kinds('loader').length, 0);
    assert.deepStrictEqual(e.kinds('show').map((c) => c[1]), ['loading']);
    const e2 = env({ gate: 'REAL', routes, ctx: { lessonParam: 'L9' } });
    await e2.run();
    assert.strictEqual(e2.kinds('replace').length, 0);
    assert.strictEqual(e2.kinds('loader').length, 1);
    assert.deepStrictEqual(clone4(e2.kinds('show').pop()), ['show', 'start']);
  });

  testAsync('resolveQuizPath: placement-120 (any case) -> the assessment file; other placement-* ids -> ../placement/<level>/<id>.json (URL-encoded); everything else, incl. malformed placement ids -> null', async () => {
    const e = env({ ctx: { level: 'b1' } });
    const r = (q) => e.ev('resolveQuizPath')(q);
    assert.strictEqual(await r('placement-120'), PH120);
    assert.strictEqual(await r('PLACEMENT-120'), PH120);
    assert.strictEqual(await r('placement-001'), '../placement/b1/placement-001.json');
    assert.strictEqual(await r('Placement-B2_x'), '../placement/b1/Placement-B2_x.json');
    for (const q of ['placement-', 'placement-a/b', 'placement-a b', 'xplacement-001', 'quiz-x', '', null, undefined]) assert.strictEqual(await r(q), null, String(q));
  });

  testAsync('load: a placement id is fetched directly (cache:no-store) from its placement file and the RuntimeContentLoader is NOT used; placement-120 and per-level placement files map to the right URLs', async () => {
    const a = env({ ctx: { id: 'placement-120', mode: 'placement', level: 'a1' } });
    await a.run();
    assert.deepStrictEqual(clone4(a.kinds('fetch')), [['fetch', PH120, { cache: 'no-store' }]]);
    assert.strictEqual(a.kinds('loader').length, 0);
    const b = env({ ctx: { id: 'placement-002', mode: 'placement', level: 'b1' } });
    await b.run();
    assert.strictEqual(b.kinds('fetch')[0][1], '../placement/b1/placement-002.json');
    assert.strictEqual(b.kinds('loader').length, 0);
  });

  testAsync('load: a non-placement id goes through MylingoRuntimeContentLoader.load(level, id) and never fetch()es directly', async () => {
    const e = env({ ctx: { id: 'some-quiz', level: 'c2' } });
    await e.run();
    assert.deepStrictEqual(clone4(e.kinds('loader')), [['loader', 'c2', 'some-quiz']]);
    assert.strictEqual(e.kinds('fetch').length, 0);
  });

  testAsync('load: the loaded JSON is handed to normalizeQuiz(json, {level}) and the NORMALIZED result becomes `data`', async () => {
    const raw = GOOD(), normalized = Object.assign(GOOD(), { title: 'Normalized title' });
    const e = env({ loader: () => Promise.resolve(raw), normalize: (j) => { assert.strictEqual(j, raw); return normalized; }, ctx: { level: 'a2' } });
    await e.run();
    const n = e.kinds('normalize');
    assert.strictEqual(n.length, 1);
    assert.strictEqual(n[0][1], raw);
    assert.strictEqual(n[0][2].level, 'a2');
    assert.strictEqual(e.ev('data'), normalized);
    assert.strictEqual(e.ev('data.title'), 'Normalized title');
  });

  testAsync('load: a 404 (placement fetch !ok with status 404, or a loader rejection carrying status 404) -> "Quiz not found", NOT retryable; data is never set', async () => {
    const a = env({ ctx: { id: 'placement-001', mode: 'placement' }, routes: { '../placement/b1/placement-001.json': 'HTTP404' } });
    await a.run();
    assert.deepStrictEqual(errs(a), [['Quiz not found', false]]);
    const b = env({ loader: () => Promise.reject(Object.assign(new Error('nf'), { status: 404 })) });
    await b.run();
    assert.deepStrictEqual(errs(b), [['Quiz not found', false]]);
    for (const x of [a, b]) { assert.strictEqual(x.ev('data'), undefined); assert.strictEqual(x.kinds('normalize').length, 0); assert.strictEqual(x.kinds('show').filter((c) => c[1] === 'start').length, 0); }
  });

  testAsync('load: any other fetch/loader failure (HTTP 500, network error, non-404 status, a bare null rejection, a body that will not parse) -> "Connection problem", RETRYABLE', async () => {
    const cases = [
      env({ ctx: { id: 'placement-001', mode: 'placement' }, routes: { '../placement/b1/placement-001.json': 'HTTP500' } }),
      env({ ctx: { id: 'placement-001', mode: 'placement' }, routes: { '../placement/b1/placement-001.json': 'REJECT' } }),
      env({ loader: () => Promise.reject(new Error('offline')) }),
      env({ loader: () => Promise.reject(Object.assign(new Error('x'), { status: 503 })) }),
      env({ loader: () => Promise.reject(null) }),
      env({ ctx: { id: 'placement-001', mode: 'placement', fetch: () => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('bad json')) }) } }),
    ];
    for (const [n, e] of cases.entries()) {
      await e.run();
      assert.deepStrictEqual(errs(e), [['Connection problem', true]], 'case ' + n);
      assert.strictEqual(e.ev('data'), undefined, 'case ' + n);
    }
  });

  testAsync('load: normalizeQuiz throwing -> "Quiz data error" / "corrupted" (not retryable), data unset', async () => {
    const e = env({ normalize: () => { throw new Error('boom'); } });
    await e.run();
    assert.deepStrictEqual(errs(e), [['Quiz data error', false]]);
    assert.ok(/corrupted/.test(e.kinds('error')[0][2]));
    assert.strictEqual(e.ev('data'), undefined);
  });

  testAsync('load: a normalized quiz that fails validate() -> "Quiz data error" carrying validate()\'s own message (not retryable), data unset', async () => {
    const bads = [
      [{ id: 'x', title: 'T', questions: [] }, 'This quiz has no questions.'],
      [{ id: 'x', title: 'T', questions: [{ question: 'Q', answers: ['only one'], correctIndex: 1 }] }, 'A choice question needs 2–9 answers.'],
      [{ id: 'x', title: 'T', questions: [{ answers: ['a', 'b'], correctIndex: 1 }] }, 'A question is missing its text.'],
    ];
    for (const [quiz, msg] of bads) {
      const e = env({ normalize: () => quiz });
      await e.run();
      assert.deepStrictEqual(errs(e), [['Quiz data error', false]], msg);
      assert.strictEqual(e.kinds('error')[0][2], msg);
      assert.strictEqual(e.ev('data'), undefined);
      assert.strictEqual(e.ev('validate')(quiz), msg, 'the message really is validate()\'s');
    }
  });

  testAsync('load happy path: sets data, document.title, top/start titles and the "N questions · description" line, the level badge, then show(start) -> configureStart() -> startBtn.focus() in that order', async () => {
    const e = env();
    await e.run();
    assert.deepStrictEqual(errs(e), []);
    assert.strictEqual(e.ctx.document.title, 'Mylingo · My Quiz');
    assert.strictEqual(e.els.titleTop.textContent, 'My Quiz');
    assert.strictEqual(e.els.startTitle.textContent, 'My Quiz');
    assert.strictEqual(e.els.desc.textContent, '2 questions · A description');
    assert.strictEqual(e.els.level.textContent, 'B2', 'the quiz\'s own level wins over the URL level (b1)');
    const tail = e.calls.slice(-3).map((c) => c[0] + (c[0] === 'show' || c[0] === 'focus' ? ':' + c[1] : ''));
    assert.deepStrictEqual(tail, ['show:start', 'configureStart', 'focus:startBtn']);
    assert.strictEqual(e.ev('data.questions.length'), 2);
  });

  testAsync('load happy path: description falls back to "Practice and improve your English."; the level badge falls back to the URL level upper-cased; the category badge is shown ONLY when the quiz has a category', async () => {
    const q = GOOD(); delete q.description; delete q.level; delete q.category;
    const e = env({ normalize: () => q, ctx: { level: 'c1' } });
    await e.run();
    assert.strictEqual(e.els.desc.textContent, '2 questions · Practice and improve your English.');
    assert.strictEqual(e.els.level.textContent, 'C1');
    assert.strictEqual(e.els.categoryBadge, undefined, 'no category -> the badge element is never touched');
    const e2 = env();
    await e2.run();
    assert.strictEqual(e2.els.categoryBadge.textContent, 'Grammar');
    assert.strictEqual(e2.els.categoryBadge.style.display, 'inline-block');
  });

  testAsync('load happy path: only placement-120 (any case of data.id) gets the 120-question start note and "Start level assessment" button label; other quizzes leave both untouched', async () => {
    for (const pid of ['placement-120', 'PLACEMENT-120']) {
      const q = GOOD(); q.id = pid;
      const e = env({ normalize: () => q, ctx: { id: 'placement-120', mode: 'placement' } });
      await e.run();
      assert.strictEqual(e.els.startNote.textContent, '120 questions · A1 to B1 · final result capped at B1', pid);
      assert.strictEqual(e.els.startBtn.textContent, 'Start level assessment', pid);
    }
    const e2 = env();
    await e2.run();
    assert.strictEqual(e2.els.startNote, undefined);
    assert.strictEqual(e2.els.startBtn.textContent, '', 'only configureStart() (stubbed here) labels the button for ordinary quizzes');
  });

  testAsync('load: a placement-* id WITHOUT mode=placement is still lock-checked (and gate-exempt because findOwningLesson never owns placement ids), yet is still routed to its placement file', async () => {
    const locked = env({ lock: true, ctx: { id: 'placement-001', mode: '' } });
    await locked.run();
    assert.deepStrictEqual(errs(locked), [['Level locked', false]]);
    const open = env({ lock: false, gate: 'REAL', routes: { '../course_content/lessons/b1.json': [{ lesson_id: 'LP', exercise_quiz_ids: ['placement-001'] }] }, ctx: { id: 'placement-001', mode: '' } });
    await open.run();
    assert.strictEqual(open.kinds('replace').length, 0, 'placement quizzes are never gated');
    assert.strictEqual(open.kinds('fetch').filter((c) => c[1] === '../placement/b1/placement-001.json').length, 1);
    assert.strictEqual(open.kinds('loader').length, 0);
    assert.deepStrictEqual(clone4(open.kinds('show').pop()), ['show', 'start']);
  });

  testAsync('load: a runtime script that never loaded (window.MylingoRuntimeContentLoader / MylingoRuntimeV2 missing, or lacking its function) is a distinct NON-retryable "App files missing" screen that says to reload — not a retryable "Connection problem" / "corrupted" quiz (Agent 196 fixed carried item 15; was pinned as the misleading opposite by Agent 175)', async () => {
    const a = env();
    delete a.ctx.window.MylingoRuntimeContentLoader;
    await a.run();
    assert.deepStrictEqual(errs(a), [['App files missing', false]]);
    assert.ok(/reload/i.test(a.kinds('error')[0][2]));
    assert.strictEqual(a.ev('data'), undefined);
    const b = env();
    delete b.ctx.window.MylingoRuntimeV2;
    await b.run();
    assert.deepStrictEqual(errs(b), [['App files missing', false]]);
    assert.ok(!/corrupted/.test(b.kinds('error')[0][2]));
    assert.strictEqual(b.ev('data'), undefined);
    const c = env();
    c.ctx.window.MylingoRuntimeContentLoader = {};
    await c.run();
    assert.deepStrictEqual(errs(c), [['App files missing', false]], 'a loader without load()');
    const d = env();
    d.ctx.window.MylingoRuntimeV2 = {};
    await d.run();
    assert.deepStrictEqual(errs(d), [['App files missing', false]], 'a V2 adapter without normalizeQuiz()');
  });

  testAsync('load: a loader that is PRESENT but rejects is still the retryable "Connection problem"; a V2 adapter that is present but THROWS is still the non-retryable "Quiz data error" (the app-files check does not swallow real failures) (Agent 196, item 15)', async () => {
    const a = env({ loader: () => Promise.reject(new Error('offline')) });
    await a.run();
    assert.deepStrictEqual(errs(a), [['Connection problem', true]]);
    const b = env({ normalize: () => { throw new Error('bad shape'); } });
    await b.run();
    assert.deepStrictEqual(errs(b), [['Quiz data error', false]]);
    assert.ok(/corrupted/.test(b.kinds('error')[0][2]));
    const c = env({ ctx: { id: 'placement-120' }, routes: { '../placement/assessment/placement-120.json': { id: 'placement-120' } } });
    delete c.ctx.window.MylingoRuntimeContentLoader;
    await c.run();
    assert.ok(!errs(c).some((e) => e[0] === 'App files missing'), 'the placement path does not need the content loader, so a missing loader must not block it');
  });

  testAsync('load: is re-runnable (the error screen\'s Retry): a failed run followed by a successful one ends on the start screen with data set', async () => {
    let attempt = 0;
    const e = env({ loader: () => (attempt++ === 0 ? Promise.reject(new Error('offline')) : Promise.resolve(GOOD())) });
    await e.run();
    assert.deepStrictEqual(errs(e), [['Connection problem', true]]);
    assert.strictEqual(e.ev('data'), undefined);
    await e.run();
    assert.strictEqual(errs(e).length, 1, 'no second error');
    assert.strictEqual(e.ev('data.title'), 'My Quiz');
    assert.deepStrictEqual(clone4(e.kinds('show').pop()), ['show', 'start']);
    assert.deepStrictEqual(e.kinds('show').map((c) => c[1]), ['loading', 'loading', 'start']);
  });
})();

// ============================================================
console.log('splash.js: once-per-session launch splash (Agent 176)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_175.md item 2 (small standalone module). splash.js is a self-executing
  // IIFE, so it is run for real in a vm sandbox against a fake window / sessionStorage / document /
  // location and MANUALLY-driven timers (setTimeout records [fn, ms]; the test runs them).
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const SRC = fs.readFileSync(path.join(root, 'shared', 'js', 'splash.js'), 'utf8');
  const KEY = 'mylingo.splash.v1';

  function splash(over) {
    over = over || {};
    const timers = [], body = [], head = [], docListeners = [], store = new Map();
    if (over.seen) store.set(KEY, '1');
    const makeEl = (tag) => {
      const cls = new Set();
      const el = {
        tagName: String(tag).toUpperCase(), attrs: {}, id: '', innerHTML: '', textContent: '', removed: false,
        setAttribute(k, v) { this.attrs[k] = v; },
        classList: { add: (c) => cls.add(c), contains: (c) => cls.has(c) },
        remove() { this.removed = true; [body, head].forEach((a) => { const k = a.indexOf(this); if (k >= 0) a.splice(k, 1); }); },
      };
      return el;
    };
    const sessionStorage = over.sessionStorage || {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
    };
    const window = over.window || {};
    const ctx = {
      window, sessionStorage,
      location: { pathname: over.pathname === undefined ? '/index.html' : over.pathname },
      document: {
        readyState: over.readyState || 'complete',
        head: { appendChild: (e) => head.push(e) }, body: { appendChild: (e) => body.push(e) },
        createElement: makeEl,
        currentScript: over.currentScript,
        getElementById: (id) => body.find((e) => e.id === id) || null,
        addEventListener: (t, f, o) => docListeners.push([t, f, o]),
      },
      setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; },
    };
    if (over.URL) ctx.URL = over.URL;
    vm.createContext(ctx);
    return {
      window, store, timers, body, head, docListeners, ctx, makeEl,
      run: () => vm.runInContext(SRC, ctx),
      el: () => body.find((e) => e.id === 'mylingoSplash'),
    };
  }

  test('first load in a session (document already parsed): sets the once-per-page flag and the sessionStorage marker, and mounts ONE #mylingoSplash (role=status, aria-label) plus its <style>', () => {
    const s = splash();
    s.run();
    assert.strictEqual(s.window.__mylingoSplashLoaded, true);
    assert.strictEqual(s.store.get(KEY), '1');
    assert.strictEqual(s.body.length, 1);
    assert.strictEqual(s.head.length, 1);
    const el = s.el();
    assert.strictEqual(el.tagName, 'DIV');
    assert.strictEqual(el.attrs.role, 'status');
    assert.strictEqual(el.attrs['aria-label'], 'Loading Mylingo');
    assert.ok(el.innerHTML.includes('<strong>Mylingo</strong>') && el.innerHTML.includes('Learn English your way.'));
    assert.strictEqual(s.head[0].tagName, 'STYLE');
    assert.ok(s.head[0].textContent.startsWith('#mylingoSplash{position:fixed;inset:0;z-index:9999'), 'full-screen overlay above everything');
  });

  test('a second execution on the same window (__mylingoSplashLoaded already true) does nothing at all — no storage write, no mount, no timers', () => {
    const w = { __mylingoSplashLoaded: true };
    const s = splash({ window: w });
    s.run();
    assert.strictEqual(s.store.size, 0);
    assert.strictEqual(s.body.length + s.head.length + s.timers.length + s.docListeners.length, 0);
  });

  test('already shown this session (sessionStorage marker "1"): no splash and no timers, but the page-level flag is still set', () => {
    const s = splash({ seen: true });
    s.run();
    assert.strictEqual(s.window.__mylingoSplashLoaded, true);
    assert.strictEqual(s.body.length + s.head.length + s.timers.length, 0);
    assert.strictEqual(s.store.get(KEY), '1', 'marker untouched');
  });

  test('a marker with any value other than "1" does not suppress the splash (it is then rewritten to "1")', () => {
    const s = splash();
    s.store.set(KEY, '0');
    s.run();
    assert.strictEqual(s.body.length, 1);
    assert.strictEqual(s.store.get(KEY), '1');
  });

  test('sessionStorage unavailable (getItem OR setItem throws, e.g. Safari private mode / blocked storage): the splash is still shown, nothing throws', () => {
    const boom = () => { throw new Error('SecurityError'); };
    const a = splash({ sessionStorage: { getItem: boom, setItem: boom } });
    assert.doesNotThrow(() => a.run());
    assert.strictEqual(a.body.length, 1, 'getItem throws');
    const b = splash({ sessionStorage: { getItem: () => null, setItem: boom } });
    assert.doesNotThrow(() => b.run());
    assert.strictEqual(b.body.length, 1, 'setItem throws');
  });

  test('document still loading: mounting is deferred to a one-shot DOMContentLoaded listener; interactive/complete mount immediately with no listener', () => {
    const s = splash({ readyState: 'loading' });
    s.run();
    assert.strictEqual(s.body.length, 0, 'nothing yet');
    assert.strictEqual(s.docListeners.length, 1);
    assert.strictEqual(s.docListeners[0][0], 'DOMContentLoaded');
    assert.deepStrictEqual(clone5(s.docListeners[0][2]), { once: true });
    s.docListeners[0][1]();
    assert.strictEqual(s.body.length, 1);
    for (const rs of ['interactive', 'complete']) {
      const t = splash({ readyState: rs });
      t.run();
      assert.strictEqual(t.body.length, 1, rs);
      assert.strictEqual(t.docListeners.length, 0, rs);
    }
  });
  function clone5(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  test('mount never duplicates: if a #mylingoSplash is already in the document, nothing more is added (no second element, style or timers)', () => {
    const s = splash();
    const existing = s.makeEl('div'); existing.id = 'mylingoSplash';
    s.body.push(existing);
    s.run();
    assert.strictEqual(s.body.length, 1);
    assert.strictEqual(s.head.length, 0);
    assert.strictEqual(s.timers.length, 0);
  });

  test('timing: visible for a fixed 1660 ms from mount, then gets .hide; 280 ms later the element AND its style are removed from the DOM', () => {
    const s = splash();
    s.run();
    assert.strictEqual(s.timers.length, 1);
    assert.strictEqual(s.timers[0].ms, 1660);
    const el = s.el(), style = s.head[0];
    assert.ok(!el.classList.contains('hide'), 'still fully visible before the first timer');
    s.timers[0].f();
    assert.ok(el.classList.contains('hide'));
    assert.strictEqual(s.timers.length, 2);
    assert.strictEqual(s.timers[1].ms, 280);
    assert.ok(!el.removed && !style.removed, 'fading, not yet removed');
    s.timers[1].f();
    assert.ok(el.removed && style.removed);
    assert.strictEqual(s.body.length + s.head.length, 0, 'leaves nothing behind');
  });

  test('CSS contract: .hide fades to opacity 0 / visibility hidden / pointer-events none (the page underneath is usable while it fades); the transition length matches the 280 ms removal delay; a reduced-motion rule disables it; dark-mode colours exist', () => {
    const s = splash();
    s.run();
    const css = s.head[0].textContent;
    assert.ok(css.includes('#mylingoSplash.hide{opacity:0;visibility:hidden;pointer-events:none}'));
    assert.ok(css.includes('transition:opacity .28s ease,visibility .28s ease'), 'FADE_MS (280) must equal the .28s transition');
    assert.ok(/FADE_MS=280/.test(SRC) && /SPLASH_MS=1660/.test(SRC));
    assert.ok(css.includes('@media(prefers-reduced-motion:reduce){#mylingoSplash{transition:none}}'));
    assert.ok(css.includes('@media(prefers-color-scheme:dark){#mylingoSplash{'));
  });

  test('icon path FALLBACK (no document.currentScript / no URL): "./" for root-level pages, "../" for one folder deep (a1/…, courses/…, shared/…) — the domain-root pathname guess; under a sub-path the guess is wrong, which is why the primary path now resolves from the script URL (Agent 195, item 16)', () => {
    const src = (pathname) => { const s = splash({ pathname }); s.run(); return /<img src="([^"]*)"/.exec(s.el().innerHTML)[1]; };
    assert.strictEqual(src('/'), './shared/brand/icon.svg');
    assert.strictEqual(src('/index.html'), './shared/brand/icon.svg');
    assert.strictEqual(src(''), './shared/brand/icon.svg');
    assert.strictEqual(src('/a1/index.html'), '../shared/brand/icon.svg');
    assert.strictEqual(src('/courses/course.html'), '../shared/brand/icon.svg');
    // FALLBACK ONLY: under /mylingo/ the pathname guess still picks "../" for the root page (wrong) — never reached in browsers, where currentScript.src is set
    assert.strictEqual(src('/mylingo/index.html'), '../shared/brand/icon.svg');
    assert.strictEqual(src('/mylingo/'), '../shared/brand/icon.svg');
    assert.ok(fs.existsSync(path.join(root, 'shared', 'brand', 'icon.svg')), 'the icon file exists');
  });

  test('icon path PRIMARY (Agent 195, item 16): resolved from the splash.js script URL, so it is right for a root page under a sub-path, at the domain root, one folder deep, and with a query string on the script', () => {
    const icon = (srcUrl, pathname) => {
      const s = splash({ pathname, URL, currentScript: { src: srcUrl } }); s.run();
      return /<img src="([^"]*)"/.exec(s.el().innerHTML)[1];
    };
    assert.strictEqual(icon('https://x.test/mylingo/shared/js/splash.js', '/mylingo/index.html'), 'https://x.test/mylingo/shared/brand/icon.svg', 'root page under /mylingo/ (the reported bug)');
    assert.strictEqual(icon('https://x.test/mylingo/shared/js/splash.js', '/mylingo/a1/index.html'), 'https://x.test/mylingo/shared/brand/icon.svg');
    assert.strictEqual(icon('https://x.test/shared/js/splash.js', '/index.html'), 'https://x.test/shared/brand/icon.svg');
    assert.strictEqual(icon('https://x.test/shared/js/splash.js', '/courses/course.html'), 'https://x.test/shared/brand/icon.svg');
    assert.strictEqual(icon('https://x.test/shared/js/splash.js?v=3#h', '/'), 'https://x.test/shared/brand/icon.svg');
  });

  test('icon path falls back to the pathname guess when the script URL is unusable: currentScript null/undefined, empty src, or a src the URL parser rejects (Agent 195, item 16)', () => {
    const icon = (over) => { const s = splash(Object.assign({ pathname: '/a1/index.html', URL }, over)); s.run(); return /<img src="([^"]*)"/.exec(s.el().innerHTML)[1]; };
    assert.strictEqual(icon({ currentScript: null }), '../shared/brand/icon.svg');
    assert.strictEqual(icon({ currentScript: undefined }), '../shared/brand/icon.svg');
    assert.strictEqual(icon({ currentScript: { src: '' } }), '../shared/brand/icon.svg');
    assert.strictEqual(icon({ currentScript: { src: 'http://[bad' } }), '../shared/brand/icon.svg');
  });

  test('static guard for the domain-root assumption: every shipped page that loads splash.js is at most ONE folder deep (the icon path logic only knows "./" and "../")', () => {
    const hits = [];
    (function walk(dir, depth) {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name === 'node_modules' || ent.name === 'tests' || ent.name.startsWith('.')) continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full, depth + 1);
        else if (ent.name.endsWith('.html') && /splash\.js/.test(fs.readFileSync(full, 'utf8'))) hits.push([path.relative(root, full), depth]);
      }
    })(root, 0);
    assert.ok(hits.length >= 10, 'found the pages that load splash.js: ' + hits.length);
    const tooDeep = hits.filter((h) => h[1] > 1);
    assert.deepStrictEqual(tooDeep, [], 'pages deeper than one folder would get a wrong icon path');
  });
})();

// ============================================================
console.log('orientation.js: the quick English self-assessment (Agent 177)');
// ============================================================
(function () {
  // Picked up HANDOFF_AGENT_176.md "Next agent - start here" item 1. orientation.js is a self-executing IIFE
  // that reads the free globals `window` and `localStorage`, so it runs for real in a vm sandbox with a
  // fake window and a controllable localStorage (per-test, so nothing leaks into the shared fakeWindow).
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const SRC = fs.readFileSync(path.join(root, 'shared', 'js', 'orientation.js'), 'utf8');
  const KEY = 'mylingo.orientation.v1';

  function orient(over) {
    over = over || {};
    const store = new Map();
    if (over.raw !== undefined) store.set(KEY, over.raw);
    const calls = { get: [], set: [] };
    const localStorage = over.localStorage || {
      getItem: (k) => { calls.get.push(k); return store.has(k) ? store.get(k) : null; },
      setItem: (k, v) => { calls.set.push([k, v]); store.set(k, String(v)); },
    };
    const window = {};
    const ctx = { window };
    if (!over.noStorage) ctx.localStorage = localStorage;
    vm.createContext(ctx);
    vm.runInContext(SRC, ctx);
    return { O: window.MylingoOrientation, store, calls, window };
  }
  const O = orient().O;
  const ans = (n) => Array(10).fill(n);
  // answer sets whose weighted score sits either side of a threshold (weights: 1, 1.25 x6, .5, .5, 1; MAX 42)
  const S = {
    6.75: [1, 0, 1, 0, 1, 0, 1, 2, 2, 0], 7: [1, 1, 0, 1, 0, 2, 0, 0, 0, 1],
    8.25: [0, 2, 0, 1, 0, 1, 1, 1, 3, 0], 8.5: [0, 0, 1, 2, 1, 2, 0, 1, 1, 0],
    13.75: [2, 3, 1, 0, 0, 1, 0, 0, 3, 4], 14: [1, 1, 2, 2, 1, 1, 1, 4, 0, 1],
    27.75: [2, 2, 4, 3, 3, 3, 2, 0, 3, 3], 28: [1, 0, 4, 3, 4, 3, 4, 0, 1, 4],
    35.5: [4, 4, 4, 3, 4, 4, 1, 4, 3, 3], 35.75: [4, 3, 4, 3, 1, 4, 4, 4, 4, 4],
  };
  const plain = (x) => JSON.parse(JSON.stringify(x)); // vm-realm arrays/objects never deepStrictEqual host ones
  const scoreOf = (a) => O.scoreAnswers(a);

  test('exports the documented public API and storage key', () => {
    assert.deepStrictEqual(plain(Object.keys(O).sort()), ['LEVELS', 'MAX_SCORE', 'QUESTIONS', 'STORAGE_KEY', 'levelFromScore', 'placementUrl', 'readState', 'recommendation', 'scoreAnswers', 'writeState']);
    assert.strictEqual(O.STORAGE_KEY, KEY);
    assert.deepStrictEqual(plain(O.LEVELS), ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
  });

  test('QUESTIONS: 10 questions in the fixed order, each with text and exactly 5 answers (scored 0-4 by index)', () => {
    assert.deepStrictEqual(plain(O.QUESTIONS.map((q) => q.id)), ['confidence', 'listening', 'speaking', 'reading', 'writing', 'grammar', 'vocabulary', 'exposure', 'goal', 'selfEstimate']);
    O.QUESTIONS.forEach((q) => {
      assert.ok(typeof q.text === 'string' && q.text.length > 10, q.id + ' has text');
      assert.strictEqual(q.answers.length, 5, q.id + ' has 5 answers');
      q.answers.forEach((a) => assert.ok(typeof a === 'string' && a.length > 0));
      assert.strictEqual(new Set(q.answers).size, 5, q.id + ' answers are distinct');
    });
  });

  test('MAX_SCORE is 42 (4 x the weight sum 10.5); an all-4 answer set scores exactly MAX_SCORE and all-0 scores 0', () => {
    assert.strictEqual(O.MAX_SCORE, 42);
    assert.strictEqual(scoreOf(ans(4)), 42);
    assert.strictEqual(scoreOf(ans(0)), 0);
  });

  test('scoreAnswers weights: core skills 1.25, confidence/selfEstimate 1, exposure/goal 0.5 (one answer of 4 at a time)', () => {
    const one = (i) => { const a = ans(0); a[i] = 4; return scoreOf(a); };
    assert.deepStrictEqual(plain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(one)), [4, 5, 5, 5, 5, 5, 5, 2, 2, 4]);
  });

  test('scoreAnswers: values are clamped to 0..4, numeric strings count, non-numeric/missing entries are skipped', () => {
    assert.strictEqual(scoreOf([99, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 4, 'above 4 clamps to 4 (x weight 1)');
    assert.strictEqual(scoreOf([-7, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 0, 'below 0 clamps to 0');
    assert.strictEqual(scoreOf(['3', 0, 0, 0, 0, 0, 0, 0, 0, 0]), 3);
    assert.strictEqual(scoreOf(['x', undefined, NaN, {}, Infinity, 0, 0, 0, 0, 0]), 0, 'NaN-ish and non-finite entries add nothing');
    assert.strictEqual(scoreOf([2]), 2, 'a short array only scores what is there');
    assert.strictEqual(scoreOf(undefined), 0);
    assert.strictEqual(scoreOf(null), 0);
    assert.strictEqual(scoreOf([]), 0);
    assert.strictEqual(scoreOf([1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 1.5, 'fractions are kept');
  });

  test('scoreAnswers: null / empty / whitespace-only entries (e.g. a JSON hole) are UNANSWERED and add nothing — score is unchanged vs. counting them as 0, but they are no longer mistaken for real answers (Agent 196, item 18)', () => {
    assert.strictEqual(scoreOf([null, '', 4, 0, 0, 0, 0, 0, 0, 0]), 5);
    assert.strictEqual(scoreOf(['   ', '\t', 4, 0, 0, 0, 0, 0, 0, 0]), 5);
    assert.strictEqual(scoreOf([' 3 ', 0, 0, 0, 0, 0, 0, 0, 0, 0]), 3, 'a padded numeric string is still a number');
  });

  test('levelFromScore: six even bands of 7 points over 0..MAX_SCORE, clamped at both ends', () => {
    assert.strictEqual(O.levelFromScore(0), 'a1');
    assert.strictEqual(O.levelFromScore(6.75), 'a1');
    assert.strictEqual(O.levelFromScore(7), 'a2');
    assert.strictEqual(O.levelFromScore(13.75), 'a2');
    assert.strictEqual(O.levelFromScore(14), 'b1');
    assert.strictEqual(O.levelFromScore(21), 'b2');
    assert.strictEqual(O.levelFromScore(28), 'c1');
    assert.strictEqual(O.levelFromScore(35), 'c2');
    assert.strictEqual(O.levelFromScore(42), 'c2', 'the maximum lands in the last band, not past it');
    assert.strictEqual(O.levelFromScore(1000), 'c2');
    assert.strictEqual(O.levelFromScore(-50), 'a1');
  });

  test('recommendation: all-0 -> a1 / 0% / medium confidence; all-4 -> b1 (placement caps at b1) / 100% / medium', () => {
    const lo = O.recommendation(ans(0)), hi = O.recommendation(ans(4));
    assert.strictEqual(lo.level, 'a1'); assert.strictEqual(lo.estimate_score, 0); assert.strictEqual(lo.estimate_confidence, 'medium'); assert.strictEqual(lo.score, 0);
    assert.strictEqual(hi.level, 'b1'); assert.strictEqual(hi.estimate_score, 100); assert.strictEqual(hi.estimate_confidence, 'medium'); assert.strictEqual(hi.score, 42);
    assert.strictEqual(hi.maxScore, 42);
  });

  test('recommendation: level is level === estimated_level and always one of a1/a2/b1 (never b2+, even for a top score)', () => {
    for (let n = 0; n <= 4; n++) {
      const r = O.recommendation(ans(n));
      assert.strictEqual(r.level, r.estimated_level);
      assert.ok(['a1', 'a2', 'b1'].includes(r.level), r.level);
    }
    assert.deepStrictEqual(plain([0, 1, 2, 3, 4].map((n) => O.recommendation(ans(n)).level)), ['a1', 'a1', 'a2', 'b1', 'b1']);
  });

  test('recommendation: placement level splits MAX_SCORE into thirds (14 and 28); scores either side of each', () => {
    Object.keys(S).forEach((k) => assert.strictEqual(scoreOf(S[k]), Number(k), 'fixture ' + k));
    assert.strictEqual(O.recommendation(S[13.75]).level, 'a1');
    assert.strictEqual(O.recommendation(S[14]).level, 'a2');
    assert.strictEqual(O.recommendation(S[27.75]).level, 'a2');
    assert.strictEqual(O.recommendation(S[28]).level, 'b1');
  });

  test('recommendation: confidence is medium below 20% and above 85%, high in between', () => {
    assert.strictEqual(O.recommendation(S[8.25]).estimate_confidence, 'medium', '19.6% < 20%');
    assert.strictEqual(O.recommendation(S[8.5]).estimate_confidence, 'high', '20.2%');
    assert.strictEqual(O.recommendation(S[35.5]).estimate_confidence, 'high', '84.5%');
    assert.strictEqual(O.recommendation(S[35.75]).estimate_confidence, 'medium', '85.1% > 85%');
    assert.strictEqual(O.recommendation(ans(2)).estimate_confidence, 'high');
  });

  test('recommendation: estimate_score is the rounded percentage, score is rounded to 2 dp', () => {
    assert.strictEqual(O.recommendation(ans(2)).estimate_score, 50);
    assert.strictEqual(O.recommendation(ans(2)).score, 21);
    assert.strictEqual(O.recommendation(S[35.75]).estimate_score, 85);
    assert.strictEqual(O.recommendation(S[8.25]).estimate_score, 20);
    assert.strictEqual(O.recommendation([0.333, 0, 0, 0, 0, 0, 0, 0, 0, 0]).score, 0.33);
  });

  test('recommendation: signals hold the RAW answer for reading/writing/grammar/listening/speaking only; missing -> null', () => {
    const r = O.recommendation([4, 3, 2, 1, 0, 4, 1, 4, 4, 4]);
    assert.deepStrictEqual(plain(r.signals), { listening: 3, speaking: 2, reading: 1, writing: 0, grammar: 4 });
    const blank = O.recommendation([]);
    assert.deepStrictEqual(plain(blank.signals), { listening: null, speaking: null, reading: null, writing: null, grammar: null });
    const none = O.recommendation(undefined);
    assert.deepStrictEqual(plain(none.signals), { listening: null, speaking: null, reading: null, writing: null, grammar: null });
    assert.strictEqual(none.level, 'a1');
    assert.strictEqual(none.score, 0);
  });

  test('recommendation: signals are clamped to 0..4 exactly like the score (Agent 196 fixed carried item 18; was pinned as unclamped by Agent 177)', () => {
    const r = O.recommendation([0, 9, -3, 0, 0, 0, 0, 0, 0, 0]);
    assert.strictEqual(r.signals.listening, 4);
    assert.strictEqual(r.signals.speaking, 0);
    assert.strictEqual(r.score, 5);
    assert.strictEqual(O.recommendation([0, '2', 0, 0, 0, 0, 0, 0, 0, 0]).signals.listening, 2, 'numeric strings become numbers');
  });

  test('recommendation: an unanswered core skill (null, empty or whitespace string, junk, Infinity) has a null signal, not 0 (Agent 196, item 18)', () => {
    const r = O.recommendation([0, null, '', '  ', 'x', Infinity, 0, 0, 0, 0]);
    assert.deepStrictEqual(plain(r.signals), { listening: null, speaking: null, reading: null, writing: null, grammar: null });
    assert.strictEqual(O.recommendation([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).signals.listening, 0, 'a real 0 stays 0');
  });

  test('placementUrl: only a1/a2/b1 pass through; anything else falls back to a1; the redirect is URL-encoded', () => {
    const base = '../shared/quiz.html?quiz=placement-120&level=b1&mode=placement&redirect=../';
    assert.strictEqual(O.placementUrl('a1'), base + 'a1/dashboard.html');
    assert.strictEqual(O.placementUrl('a2'), base + 'a2/dashboard.html');
    assert.strictEqual(O.placementUrl('b1'), base + 'b1/dashboard.html');
    ['b2', 'c2', 'A2', '', undefined, null, 'a1/../../x', '..'].forEach((bad) => assert.strictEqual(O.placementUrl(bad), base + 'a1/dashboard.html', String(bad)));
  });

  test('placementUrl: every level it can emit is a real level folder with a dashboard.html (contract with the shipped tree)', () => {
    ['a1', 'a2', 'b1'].forEach((l) => assert.ok(fs.existsSync(path.join(root, l, 'dashboard.html')), l + '/dashboard.html'));
    assert.ok(fs.existsSync(path.join(root, 'shared', 'quiz.html')));
  });

  test('readState: nothing stored -> null; reads the documented key only', () => {
    const t = orient();
    assert.strictEqual(t.O.readState(), null);
    assert.deepStrictEqual(plain(t.calls.get), [KEY]);
  });

  test('readState: returns a stored object', () => {
    const st = { version: 1, completedAt: null, answers: [1, 2], score: 3, maxScore: 42, recommendedLevel: null };
    assert.deepStrictEqual(plain(orient({ raw: JSON.stringify(st) }).O.readState()), st);
  });

  test('readState: corrupt JSON, JSON null and non-object JSON values all give null (never throw)', () => {
    ['{not json', '', 'null', '5', '"text"', 'true', 'false', '0'].forEach((raw) => assert.strictEqual(orient({ raw }).O.readState(), null, JSON.stringify(raw)));
  });

  test('readState: a stored JSON array is rejected (null) — the state is an object (Agent 196 fixed carried item 18; was pinned as returned-as-is by Agent 177)', () => {
    assert.strictEqual(orient({ raw: '[1,2]' }).O.readState(), null);
    assert.strictEqual(orient({ raw: '[]' }).O.readState(), null);
  });

  test('readState: localStorage.getItem throwing, or localStorage missing entirely, gives null', () => {
    assert.strictEqual(orient({ localStorage: { getItem() { throw new Error('denied'); }, setItem() {} } }).O.readState(), null);
    assert.strictEqual(orient({ noStorage: true }).O.readState(), null);
  });

  test('writeState: stores JSON under the key and returns true; readState round-trips it', () => {
    const t = orient();
    const st = { version: 1, completedAt: '2026-01-01T00:00:00.000Z', answers: [0, 1, 2, 3, 4, 0, 1, 2, 3, 4], score: 21, maxScore: 42, recommendedLevel: 'a2' };
    assert.strictEqual(t.O.writeState(st), true);
    assert.strictEqual(t.calls.set.length, 1);
    assert.strictEqual(t.calls.set[0][0], KEY);
    assert.strictEqual(t.store.get(KEY), JSON.stringify(st));
    assert.deepStrictEqual(plain(t.O.readState()), st);
  });

  test('writeState: a later write replaces the earlier one', () => {
    const t = orient();
    t.O.writeState({ answers: [1] }); t.O.writeState({ answers: [1, 2] });
    assert.deepStrictEqual(plain(t.O.readState()), { answers: [1, 2] });
  });

  test('writeState: setItem throwing (quota / private mode), missing localStorage, or an unserialisable value all return false without throwing', () => {
    assert.strictEqual(orient({ localStorage: { getItem: () => null, setItem() { throw new Error('quota'); } } }).O.writeState({ a: 1 }), false);
    assert.strictEqual(orient({ noStorage: true }).O.writeState({ a: 1 }), false);
    const cyc = {}; cyc.self = cyc;
    const t = orient();
    assert.strictEqual(t.O.writeState(cyc), false);
    assert.strictEqual(t.calls.set.length, 0, 'nothing was written');
  });

  test('the exported QUESTIONS / LEVELS are copies: mutating them cannot change scoring or level mapping', () => {
    const t = orient();
    t.O.QUESTIONS[0].answers.length = 0; t.O.QUESTIONS.length = 0; t.O.LEVELS.length = 0;
    assert.strictEqual(t.O.levelFromScore(42), 'c2');
    assert.strictEqual(t.O.scoreAnswers(ans(4)), 42);
    assert.strictEqual(t.O.MAX_SCORE, 42);
    assert.strictEqual(orient().O.QUESTIONS.length, 10, 'and a fresh load is unaffected');
  });

  test('main/placement.html: every O.<member> the page calls is exported, the answer count it expects (10) matches, and orientation.js loads before the page script', () => {
    const html = fs.readFileSync(path.join(root, 'main', 'placement.html'), 'utf8');
    const used = new Set(); let m; const re = /\bO\.([A-Za-z_]+)/g;
    while ((m = re.exec(html))) used.add(m[1]);
    assert.ok(used.size >= 5, 'found the members placement.html uses: ' + [...used]);
    used.forEach((name) => assert.ok(name in O, 'MylingoOrientation.' + name + ' is used by placement.html but not exported'));
    assert.ok(html.indexOf('orientation.js') > -1 && html.indexOf('orientation.js') < html.indexOf('var O=window.MylingoOrientation'), 'loaded before use');
    assert.strictEqual(O.QUESTIONS.length, 10);
  });

  test('the state shape placement.html writes (recommendedLevel) is what quiz.html-side readers get from a real recommendation()', () => {
    const t = orient();
    const r = t.O.recommendation([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]);
    t.O.writeState({ version: 1, completedAt: 'x', answers: ans(3), score: r.score, maxScore: r.maxScore, recommendedLevel: r.level });
    const back = t.O.readState();
    assert.strictEqual(back.recommendedLevel, 'b1');
    assert.strictEqual(back.score, 31.5);
    assert.strictEqual(back.maxScore, 42);
  });
})();

// ============================================================
console.log('app-shell.js: shared bottom navigation (Agent 177)');
// ============================================================
(function () {
  // HANDOFF_AGENT_176.md "Next agent - start here" item 2. app-shell.js is a self-executing IIFE that reads
  // the free globals `window`, `document` and `location` (and `document.currentScript` at run time), so it is
  // run for real in a vm sandbox with a fake document / body / nav element and MANUALLY-driven timers.
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const SRC = fs.readFileSync(path.join(root, 'shared', 'js', 'app-shell.js'), 'utf8');
  const plain = (x) => JSON.parse(JSON.stringify(x)); // vm-realm objects never deepStrictEqual host ones

  function shell(over) {
    over = over || {};
    const timers = [], kids = [], docListeners = [];
    const mkClassList = (cls) => ({ add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c) });
    const makeEl = (tag) => {
      const cls = new Set(), attrs = {};
      return {
        tagName: String(tag).toUpperCase(), id: '', className: '', innerHTML: '', attrs, cls, listeners: {},
        setAttribute(k, v) { attrs[k] = String(v); },
        removeAttribute(k) { delete attrs[k]; },
        addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
        classList: mkClassList(cls),
      };
    };
    const bodyCls = new Set();
    const body = over.noBody ? null : { appendChild: (e) => { kids.push(e); return e; }, classList: mkClassList(bodyCls) };
    const pathname = over.pathname === undefined ? '/main/index.html' : over.pathname;
    const window = over.window || {};
    window.setTimeout = (f, ms) => { timers.push({ f, ms }); return timers.length; };
    const ctx = {
      window, URL,
      location: { pathname, href: over.href || ('https://app.test' + pathname) },
      document: {
        readyState: over.readyState || 'complete', body,
        currentScript: over.script === undefined ? { src: 'https://app.test/shared/js/app-shell.js' } : over.script,
        createElement: makeEl,
        getElementById: (id) => kids.find((e) => e.id === id) || (over.existing && over.existing.id === id ? over.existing : null),
        addEventListener: (t, f, o) => docListeners.push([t, f, o]),
      },
    };
    vm.createContext(ctx);
    return {
      window, ctx, timers, kids, docListeners, bodyCls, makeEl,
      run: () => vm.runInContext(SRC, ctx),
      nav: () => kids.find((e) => e.id === 'mylingoAppShell'),
      set path(p) { ctx.location.pathname = p; },
    };
  }
  // parse the tab markup the shell builds
  function tabs(nav) {
    const out = []; const re = /<a class="([^"]*)" href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g; let m;
    while ((m = re.exec(nav.innerHTML))) out.push({ cls: m[1], href: m[2], extra: m[3], icon: /<span class="as-icon"><svg[^>]*aria-hidden="true"/.test(m[4]), label: (/<span class="as-label">([^<]*)<\/span>/.exec(m[4]) || [])[1] });
    return out;
  }
  const mounted = (over) => { const s = shell(over); s.run(); return s; };
  const activeAt = (p, script) => mounted({ pathname: p, script }).window.MylingoAppShell.activeKey();

  test('mounts once on a parsed document: nav#mylingoAppShell is appended to <body> with role/aria-label/data-hidden, and the body gets has-mylingo-appshell', () => {
    const s = mounted();
    assert.strictEqual(s.kids.length, 1);
    const n = s.nav();
    assert.strictEqual(n.tagName, 'NAV');
    assert.strictEqual(n.className, 'mylingo-appshell');
    assert.strictEqual(n.attrs.role, 'navigation');
    assert.strictEqual(n.attrs['aria-label'], 'Primary');
    assert.strictEqual(n.attrs['data-hidden'], 'false');
    assert.ok(s.bodyCls.has('has-mylingo-appshell'));
    assert.deepStrictEqual(plain(Object.keys(s.window.MylingoAppShell).sort()), ['activeKey', 'mount', 'setVisible']);
  });

  test('the bar has exactly Home / Courses / Progress, in that order, each with an aria-hidden icon and a label', () => {
    const t = tabs(mounted().nav());
    assert.deepStrictEqual(plain(t.map((x) => x.label)), ['Home', 'Courses', 'Progress']);
    assert.ok(t.every((x) => x.icon), 'every tab has an aria-hidden svg icon');
    assert.ok(t.every((x) => /^as-tab( active)?$/.test(x.cls)));
  });

  test('tab hrefs are ROOT + main/index.html, courses/index.html, main/progress.html — and those files exist in the shipped tree', () => {
    const t = tabs(mounted().nav());
    assert.deepStrictEqual(plain(t.map((x) => x.href)), ['/main/index.html', '/courses/index.html', '/main/progress.html']);
    t.forEach((x) => assert.ok(fs.existsSync(path.join(root, x.href.slice(1))), x.href + ' exists'));
  });

  test('ROOT comes from the script URL: domain root, GitHub-Pages sub-path, absolute URL with a query, and a relative src resolved against the page', () => {
    const hrefs = (script, extra) => plain(tabs(mounted(Object.assign({ script }, extra)).nav()).map((x) => x.href));
    assert.deepStrictEqual(hrefs({ src: 'https://app.test/shared/js/app-shell.js' }), ['/main/index.html', '/courses/index.html', '/main/progress.html']);
    assert.deepStrictEqual(hrefs({ src: 'https://app.test/mylingo/shared/js/app-shell.js' }), ['/mylingo/main/index.html', '/mylingo/courses/index.html', '/mylingo/main/progress.html']);
    assert.deepStrictEqual(hrefs({ src: 'https://app.test/proj/shared/js/app-shell.js?v=12#x' }), ['/proj/main/index.html', '/proj/courses/index.html', '/proj/main/progress.html']);
    assert.deepStrictEqual(hrefs({ src: '../shared/js/app-shell.js' }, { pathname: '/proj/main/index.html' }), ['/proj/main/index.html', '/proj/courses/index.html', '/proj/main/progress.html']);
  });

  test('ROOT falls back to "/" when there is no currentScript, no src, a src that does not end in shared/js/app-shell.js, or an unparsable src', () => {
    const first = (script) => tabs(mounted({ script }).nav())[0].href;
    assert.strictEqual(first(null), '/main/index.html');
    assert.strictEqual(first({}), '/main/index.html');
    assert.strictEqual(first({ src: 'https://app.test/deep/other.js' }), '/main/index.html');
    assert.strictEqual(first({ src: 'https://app.test/deep/js/app-shell.js' }), '/main/index.html');
    assert.strictEqual(first({ src: 'http://' }), '/main/index.html', 'new URL() throwing is swallowed');
    assert.strictEqual(first({ src: 'https://app.test/proj/shared/js/app-shell.js.map' }), '/main/index.html', 'the file name must END the path');
    assert.strictEqual(first({ src: 'https://app.test/proj/shared/js/app-shell.js/extra' }), '/main/index.html');
  });

  test('activeKey (domain root): progress = main/progress.html and every level dashboard; courses = anything under /courses/; home = main/index.html and "/"', () => {
    assert.strictEqual(activeAt('/main/progress.html'), 'progress');
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => assert.strictEqual(activeAt('/' + l + '/dashboard.html'), 'progress', l));
    ['/courses/index.html', '/courses/course.html', '/courses/lesson.html', '/courses/journey.html'].forEach((p) => assert.strictEqual(activeAt(p), 'courses', p));
    assert.strictEqual(activeAt('/main/index.html'), 'home');
    assert.strictEqual(activeAt('/'), 'home');
    assert.strictEqual(activeAt('/site/'), 'home');
    assert.strictEqual(activeAt('/site'), 'home');
  });

  test('activeKey: pages that are not a tab (quiz, placement, level index, root index.html, unknown level dashboard, empty path) highlight nothing', () => {
    ['/shared/quiz.html', '/main/placement.html', '/main/practice.html', '/a1/index.html', '/index.html', '/a7/dashboard.html', '/main/progress.htmlx', '/a1/dashboard.htmlx', ''].forEach((p) => assert.strictEqual(activeAt(p), null, JSON.stringify(p)));
    assert.strictEqual(activeAt(null), null, 'a missing pathname is treated as empty, not a crash');
  });

  test('activeKey: Windows-style backslash paths are normalised', () => {
    assert.strictEqual(activeAt('\\main\\progress.html'), 'progress');
    assert.strictEqual(activeAt('\\courses\\index.html'), 'courses');
    assert.strictEqual(activeAt('\\a2\\dashboard.html'), 'progress');
  });

  test('activeKey: route order — progress wins over courses/home when a path matches several', () => {
    assert.strictEqual(activeAt('/courses/main/progress.html'), 'progress');
    assert.strictEqual(activeAt('/courses/a1/dashboard.html'), 'progress');
    assert.strictEqual(activeAt('/courses/main/index.html'), 'courses');
  });

  test('activeKey: under a sub-path host the bare sub-path root ("/mylingo" and "/mylingo/") is home, and the tab routes still match', () => {
    const at = (p) => activeAt(p, { src: 'https://app.test/mylingo/shared/js/app-shell.js' });
    assert.strictEqual(at('/mylingo'), 'home');
    assert.strictEqual(at('/mylingo/'), 'home');
    assert.strictEqual(at('/mylingo/main/progress.html'), 'progress');
    assert.strictEqual(at('/mylingo/courses/index.html'), 'courses');
    assert.strictEqual(at('/mylingo/main/index.html'), 'home');
    assert.strictEqual(at('/mylingo/shared/quiz.html'), null);
  });

  test('activeKey: any URL ending in "/" other than a tab route falls through to home (pinned: "/a1/" highlights Home)', () => {
    assert.strictEqual(activeAt('/a1/'), 'home');
    assert.strictEqual(activeAt('/main/'), 'home');
  });

  test('the active tab gets class "active" and aria-current="page"; the others get neither; a non-tab page marks none', () => {
    const t = tabs(mounted({ pathname: '/courses/lesson.html' }).nav());
    assert.deepStrictEqual(plain(t.map((x) => x.cls)), ['as-tab', 'as-tab active', 'as-tab']);
    assert.deepStrictEqual(plain(t.map((x) => x.extra.trim())), ['', 'aria-current="page"', '']);
    const none = tabs(mounted({ pathname: '/shared/quiz.html' }).nav());
    assert.ok(none.every((x) => x.cls === 'as-tab' && x.extra.trim() === ''));
    assert.deepStrictEqual(plain(tabs(mounted({ pathname: '/main/progress.html' }).nav()).map((x) => x.cls)), ['as-tab', 'as-tab', 'as-tab active']);
    assert.deepStrictEqual(plain(tabs(mounted({ pathname: '/main/index.html' }).nav()).map((x) => x.cls)), ['as-tab active', 'as-tab', 'as-tab']);
  });

  test('mount() is idempotent: calling it again, or an existing #mylingoAppShell already in the page, adds nothing', () => {
    const s = mounted();
    s.window.MylingoAppShell.mount(); s.window.MylingoAppShell.mount();
    assert.strictEqual(s.kids.length, 1);
    const pre = shell({ existing: { id: 'mylingoAppShell' } });
    pre.run();
    assert.strictEqual(pre.kids.length, 0, 'an already-present nav is left alone');
  });

  test('mount() with no <body> does nothing and does not throw', () => {
    const s = shell({ noBody: true });
    assert.doesNotThrow(() => s.run());
    assert.strictEqual(s.kids.length, 0);
    assert.strictEqual(s.bodyCls.size, 0);
  });

  test('document.readyState "loading": mount is deferred to DOMContentLoaded (nothing mounted yet); "interactive"/"complete" mount immediately without a listener', () => {
    const s = shell({ readyState: 'loading' });
    s.run();
    assert.strictEqual(s.kids.length, 0);
    assert.strictEqual(s.docListeners.length, 1);
    assert.strictEqual(s.docListeners[0][0], 'DOMContentLoaded');
    s.docListeners[0][1]();
    assert.strictEqual(s.kids.length, 1);
    ['interactive', 'complete'].forEach((rs) => {
      const t = shell({ readyState: rs }); t.run();
      assert.strictEqual(t.kids.length, 1, rs);
      assert.strictEqual(t.docListeners.length, 0, rs);
    });
  });

  test('a second execution on a window that already has MylingoAppShell does nothing (no mount, the first instance is kept)', () => {
    const first = { keep: true };
    const s = shell({ window: { MylingoAppShell: first } });
    s.run();
    assert.strictEqual(s.window.MylingoAppShell, first);
    assert.strictEqual(s.kids.length, 0);
    assert.strictEqual(s.docListeners.length, 0);
  });

  test('setVisible(false) hides (data-hidden/aria-hidden true, inert set); setVisible(true) shows again (inert removed); truthiness decides; no nav -> no throw', () => {
    const s = mounted(), n = s.nav(), A = s.window.MylingoAppShell;
    A.setVisible(false);
    assert.strictEqual(n.attrs['data-hidden'], 'true'); assert.strictEqual(n.attrs['aria-hidden'], 'true'); assert.strictEqual(n.attrs.inert, '');
    A.setVisible(true);
    assert.strictEqual(n.attrs['data-hidden'], 'false'); assert.strictEqual(n.attrs['aria-hidden'], 'false'); assert.ok(!('inert' in n.attrs));
    A.setVisible(0);
    assert.strictEqual(n.attrs['data-hidden'], 'true');
    A.setVisible('yes');
    assert.strictEqual(n.attrs['data-hidden'], 'false');
    const none = shell({ noBody: true }); none.run();
    assert.doesNotThrow(() => none.window.MylingoAppShell.setVisible(false));
  });

  function press() {
    const s = mounted(), nav = s.nav();
    const mkTab = () => { const cls = new Set(); return { cls, classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c) } }; };
    const inside = (tab) => ({ closest: (sel) => (sel === '.as-tab' ? tab : null) });
    const outside = { closest: () => null };
    const fire = (type, target) => (nav.listeners[type] || []).forEach((f) => f({ target }));
    return { s, nav, mkTab, inside, outside, fire };
  }

  test('press feedback: listens for pointerdown/up/cancel/leave on the nav; pointerdown adds as-press (and clears as-release); a pointerdown outside any tab does nothing', () => {
    const p = press();
    ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave'].forEach((t) => assert.strictEqual(p.nav.listeners[t].length, 1, t));
    assert.doesNotThrow(() => p.fire('pointerdown', p.outside), 'a press outside any tab with nothing pressed yet is ignored');
    const a = p.mkTab(); a.cls.add('as-release');
    p.fire('pointerdown', p.inside(a));
    assert.ok(a.cls.has('as-press') && !a.cls.has('as-release'));
    const b = p.mkTab();
    p.fire('pointerdown', p.outside);
    assert.strictEqual(b.cls.size, 0);
    assert.ok(a.cls.has('as-press'), 'an outside press does not release the current tab');
  });

  test('press feedback: release swaps as-press for as-release, and a 400 ms timer removes as-release; pointerup / pointercancel / pointerleave all release', () => {
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
      const p = press(), a = p.mkTab();
      p.fire('pointerdown', p.inside(a));
      p.fire(type, p.inside(a));
      assert.ok(!a.cls.has('as-press') && a.cls.has('as-release'), type);
      assert.strictEqual(p.s.timers.length, 1, type);
      assert.strictEqual(p.s.timers[0].ms, 400, type);
      p.s.timers[0].f();
      assert.ok(!a.cls.has('as-release'), type + ': spring-back class is cleared after the timer');
    });
  });

  test('press feedback: pressing a second tab first releases the first; releasing with the pointer outside any tab falls back to the CURRENT tab; a release with nothing pressed is a no-op', () => {
    const p = press(), a = p.mkTab(), b = p.mkTab();
    p.fire('pointerdown', p.inside(a));
    p.fire('pointerdown', p.inside(b));
    assert.ok(!a.cls.has('as-press') && a.cls.has('as-release'), 'first tab released');
    assert.ok(b.cls.has('as-press'));
    p.fire('pointerleave', p.outside);
    assert.ok(!b.cls.has('as-press') && b.cls.has('as-release'), 'fell back to the current tab');
    const before = p.s.timers.length;
    assert.doesNotThrow(() => p.fire('pointerup', p.outside));
    assert.strictEqual(p.s.timers.length, before, 'nothing pressed -> nothing released');
    p.fire('pointerdown', p.inside(a));
    p.fire('pointerup', p.inside(a));
    p.fire('pointerup', p.outside);
    assert.strictEqual(p.s.timers.length, before + 1, 'after a release the current tab is cleared, so a stray pointerup does not re-release it');
  });

  test('every shipped page that loads app-shell.js also links shared/css/app-shell.css, and both files exist (≥20 pages)', () => {
    const hits = [];
    (function walk(dir, depth) {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(full, depth + 1);
        else if (ent.name.endsWith('.html')) { const h = fs.readFileSync(full, 'utf8'); if (/app-shell\.js/.test(h)) hits.push([path.relative(root, full), /app-shell\.css/.test(h)]); }
      }
    })(root, 0);
    assert.ok(hits.length >= 20, 'found ' + hits.length);
    assert.deepStrictEqual(hits.filter((h) => !h[1]).map((h) => h[0]), [], 'pages loading the script without its stylesheet');
    assert.ok(fs.existsSync(path.join(root, 'shared', 'css', 'app-shell.css')));
  });
})();

// ============================================================
console.log('authoring-draft-autosave.js: chunked draft save/restore for the authoring tool (Agent 178)');
// ============================================================
(function () {
  // HANDOFF_AGENT_177.md "Next agent - start here" item 1 (smallest untested module, ~5 KB). It is a
  // self-executing IIFE, `(function(global){...})(window)`, whose factory `create()` reads `setTimeout`/
  // `clearTimeout` as bare free globals (not `window.setTimeout`), so both live directly on the vm context
  // and are manually driven here — nothing is a real timer, so debounce/flush timing is deterministic.
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const SRC = fs.readFileSync(path.join(root, 'shared', 'js', 'authoring-draft-autosave.js'), 'utf8');
  const plain = (x) => JSON.parse(JSON.stringify(x)); // vm-realm objects never deepStrictEqual host ones

  const STORAGE_KEY = 'mylingo.authoring-draft.v1';
  const MANIFEST_KEY = 'mylingo.authoring-draft.v2.manifest';
  const CHUNK_PREFIX = 'mylingo.authoring-draft.v2.chunk.';
  const chunkKey = (i) => CHUNK_PREFIX + i;

  function fakeStore(initial, overrides) {
    const map = new Map(Object.entries(initial || {}));
    const calls = { get: [], set: [], remove: [] };
    return Object.assign({
      getItem: (k) => { calls.get.push(k); return map.has(k) ? map.get(k) : null; },
      setItem: (k, v) => { calls.set.push([k, String(v)]); map.set(k, String(v)); },
      removeItem: (k) => { calls.remove.push(k); map.delete(k); },
      map, calls,
    }, overrides);
  }

  // Boots a fresh vm sandbox: bare setTimeout/clearTimeout backed by a manually-driven timer map, plus a
  // controllable `window` (for the localStorage-fallback tests).
  function boot(over) {
    over = over || {};
    const timers = new Map(); let nextId = 1;
    const window = over.window || {};
    const ctx = {
      window,
      setTimeout: (f, ms) => { const id = nextId++; timers.set(id, { f, ms }); return id; },
      clearTimeout: (id) => { timers.delete(id); },
    };
    vm.createContext(ctx);
    vm.runInContext(SRC, ctx);
    return {
      window, ctx, timers,
      M: window.MylingoAuthoringDraftAutosave,
      pending: () => timers.size,
      lastMs: () => { const list = [...timers.values()]; return list.length ? list[list.length - 1].ms : undefined; },
      fireAll: () => { const list = [...timers.values()]; timers.clear(); list.forEach((t) => t.f()); },
    };
  }
  // One instance per test by default: create() closes over its own `timer` variable, and each test wants
  // its own isolated pending-timer view.
  function inst(over) {
    over = over || {};
    const b = boot({ window: over.window });
    const api = b.M.create(over.storage, over.options);
    return Object.assign({ api }, b);
  }

  const M = boot().M;

  test('module exports STORAGE_KEY / MANIFEST_KEY / SCHEMA_VERSION / create, matching the documented constants', () => {
    assert.deepStrictEqual(plain(Object.keys(M).sort()), ['MANIFEST_KEY', 'SCHEMA_VERSION', 'STORAGE_KEY', 'create']);
    assert.strictEqual(M.STORAGE_KEY, STORAGE_KEY);
    assert.strictEqual(M.MANIFEST_KEY, MANIFEST_KEY);
    assert.strictEqual(M.SCHEMA_VERSION, 2);
    assert.strictEqual(typeof M.create, 'function');
  });

  test('create(): the instance exposes exactly the documented API surface, carrying the same key constants plus the resolved chunkSize', () => {
    const t = inst({ storage: fakeStore() });
    assert.deepStrictEqual(plain(Object.keys(t.api).sort()), ['MANIFEST_KEY', 'SCHEMA_VERSION', 'STORAGE_KEY', 'chunkSize', 'clear', 'flush', 'formatSavedAt', 'hasDraft', 'load', 'save', 'schedule'].sort());
    assert.strictEqual(t.api.chunkSize, 200, 'default chunk size');
    assert.strictEqual(t.api.STORAGE_KEY, STORAGE_KEY);
    assert.strictEqual(t.api.MANIFEST_KEY, MANIFEST_KEY);
    assert.strictEqual(t.api.SCHEMA_VERSION, 2);
  });

  test('chunkSize option: valid finite numbers floor and clamp to a minimum of 1; non-finite/omitted falls back to 200', () => {
    assert.strictEqual(inst({ options: { chunkSize: 3.9 } }).api.chunkSize, 3, 'floors');
    assert.strictEqual(inst({ options: { chunkSize: 0 } }).api.chunkSize, 1, 'floor(0) clamped up to 1');
    assert.strictEqual(inst({ options: { chunkSize: -5 } }).api.chunkSize, 1, 'negative clamped up to 1');
    assert.strictEqual(inst({ options: { chunkSize: NaN } }).api.chunkSize, 200);
    assert.strictEqual(inst({ options: { chunkSize: 'x' } }).api.chunkSize, 200);
    assert.strictEqual(inst({ options: {} }).api.chunkSize, 200);
  });

  test('debounceMs option: resolved value is what schedule() hands to setTimeout; negative clamps to 0, non-finite/omitted falls back to 650', () => {
    const ms = (options) => { const t = inst({ storage: fakeStore(), options }); t.api.schedule([], {}); return t.lastMs(); };
    assert.strictEqual(ms({ debounceMs: 200 }), 200);
    assert.strictEqual(ms({ debounceMs: -50 }), 0);
    assert.strictEqual(ms({ debounceMs: NaN }), 650);
    assert.strictEqual(ms({ debounceMs: 'x' }), 650);
    assert.strictEqual(ms(undefined), 650);
  });

  test('save(): a single chunk is written and cleaned (drops __internalId); the returned result reports ok/savedAt/rowCount/chunkCount', () => {
    const store = fakeStore();
    const t = inst({ storage: store });
    const r = t.api.save([{ a: 1, __internalId: 'x' }, { b: 2 }], { activeLevel: 'a1' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.rowCount, 2);
    assert.strictEqual(r.chunkCount, 1);
    assert.ok(Number.isFinite(Date.parse(r.savedAt)), 'savedAt is a real ISO timestamp');
    assert.deepStrictEqual(plain(JSON.parse(store.map.get(chunkKey(0)))), [{ a: 1 }, { b: 2 }], '__internalId stripped, everything else kept');
    const manifest = JSON.parse(store.map.get(MANIFEST_KEY));
    assert.strictEqual(manifest.schemaVersion, 2);
    assert.strictEqual(manifest.activeLevel, 'a1');
    assert.strictEqual(manifest.chunkSize, 200);
    assert.deepStrictEqual(plain(manifest.chunks), [{ index: 0, rowCount: 2 }]);
  });

  test('save(): non-array rows are treated as empty; ok:true with rowCount 0 and chunkCount 0, no chunk written', () => {
    const store = fakeStore();
    const t = inst({ storage: store });
    const r = t.api.save('not-an-array', {});
    assert.deepStrictEqual(plain(r), { ok: true, savedAt: r.savedAt, rowCount: 0, chunkCount: 0 });
    assert.strictEqual(store.map.has(chunkKey(0)), false);
  });

  test('save(): rows that are null/arrays/primitives are silently dropped from the stored chunk (cleanRow) and rowCount (return value AND manifest) reports the rows actually STORED, matching the chunks and what load() returns (Agent 196 fixed carried item 20; was pinned as the raw length by Agent 178)', () => {
    const store = fakeStore();
    const t = inst({ storage: store });
    const r = t.api.save([{ a: 1 }, null, [1, 2], 'x', 42, { b: 2 }], {});
    assert.strictEqual(r.rowCount, 2, 'stored rows only');
    assert.deepStrictEqual(plain(JSON.parse(store.map.get(chunkKey(0)))), [{ a: 1 }, { b: 2 }], 'only the 2 real rows are actually stored');
    const manifest = JSON.parse(store.map.get(MANIFEST_KEY));
    assert.strictEqual(manifest.rowCount, 2);
    assert.strictEqual(manifest.chunks[0].rowCount, 2);
    const loaded = t.api.load();
    assert.strictEqual(loaded.rows.length, manifest.rowCount, 'manifest rowCount === rows.length on load');
  });

  test('save(): rowCount sums the stored rows across chunks when holes are spread over several chunks (Agent 196, item 20)', () => {
    const store = fakeStore();
    const t = inst({ storage: store, options: { chunkSize: 2 } });
    const r = t.api.save([{ a: 1 }, null, null, { a: 2 }, { a: 3 }, 7], {});
    assert.strictEqual(r.rowCount, 3);
    assert.strictEqual(r.chunkCount, 3);
    assert.strictEqual(JSON.parse(store.map.get(MANIFEST_KEY)).rowCount, 3);
    assert.strictEqual(t.api.load().rows.length, 3);
  });

  test('save(): chunks the rows by chunkSize (index/rowCount per chunk), and a smaller re-save removes the now-unused higher-index chunk keys', () => {
    const store = fakeStore();
    const t = inst({ storage: store, options: { chunkSize: 2 } });
    const r1 = t.api.save([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }], { activeLevel: 'b1' });
    assert.strictEqual(r1.chunkCount, 3);
    assert.deepStrictEqual(plain(JSON.parse(store.map.get(MANIFEST_KEY)).chunks), [{ index: 0, rowCount: 2 }, { index: 1, rowCount: 2 }, { index: 2, rowCount: 1 }]);
    assert.ok(store.map.has(chunkKey(2)), 'third chunk exists after the first save');
    const r2 = t.api.save([{ a: 9 }, { a: 10 }], { activeLevel: 'c1' });
    assert.strictEqual(r2.chunkCount, 1);
    assert.strictEqual(store.map.has(chunkKey(1)), false, 'leftover chunk 1 removed');
    assert.strictEqual(store.map.has(chunkKey(2)), false, 'leftover chunk 2 removed');
    assert.deepStrictEqual(plain(t.api.load().rows), [{ a: 9 }, { a: 10 }]);
  });

  test('save(): storage without setItem -> {ok:false, reason:"storage-unavailable"}, never throws', () => {
    const r = inst({ storage: { getItem: () => null } }).api.save([{ a: 1 }], {});
    assert.deepStrictEqual(plain(r), { ok: false, reason: 'storage-unavailable' });
  });

  test('save(): setItem throwing QuotaExceededError -> reason "quota"; any other throw -> reason "write-failed"; the error is attached, never thrown out', () => {
    const quota = { getItem: () => null, setItem: () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } };
    const r1 = inst({ storage: quota }).api.save([{ a: 1 }], {});
    assert.strictEqual(r1.ok, false); assert.strictEqual(r1.reason, 'quota'); assert.ok(r1.error instanceof Error);
    const boom = { getItem: () => null, setItem: () => { throw new Error('boom'); } };
    const r2 = inst({ storage: boom }).api.save([{ a: 1 }], {});
    assert.strictEqual(r2.ok, false); assert.strictEqual(r2.reason, 'write-failed'); assert.ok(r2.error instanceof Error);
  });

  test('resolveStorage: an explicit storage argument is used as-is; omitting it falls back to window.localStorage; a throwing accessor degrades to no storage rather than throwing', () => {
    const explicit = fakeStore();
    const winStore = fakeStore();
    const t1 = inst({ storage: explicit, window: { localStorage: winStore } });
    t1.api.save([{ a: 1 }], {});
    assert.ok(explicit.map.has(MANIFEST_KEY), 'explicit storage was written to');
    assert.strictEqual(winStore.map.has(MANIFEST_KEY), false, 'window.localStorage untouched when storage is explicit');

    const t2 = inst({ window: { localStorage: winStore } }); // no explicit storage -> falls back
    t2.api.save([{ a: 2 }], {});
    assert.ok(winStore.map.has(MANIFEST_KEY), 'fell back to window.localStorage');

    const t3 = boot({ window: {} });
    Object.defineProperty(t3.window, 'localStorage', { get() { throw new Error('denied'); } });
    const api3 = t3.M.create();
    assert.deepStrictEqual(plain(api3.save([{ a: 1 }], {})), { ok: false, reason: 'storage-unavailable' }, 'a throwing accessor is swallowed, never crashes save()');
  });

  test('load()/readManifest: a missing, corrupt, non-object, wrong-schemaVersion, or savedAt-less manifest all give null (never throw)', () => {
    const bad = (manifest) => inst({ storage: fakeStore(manifest === undefined ? {} : { [MANIFEST_KEY]: manifest }) }).api.load();
    assert.strictEqual(bad(undefined), null, 'nothing stored');
    assert.strictEqual(bad('{not json'), null, 'corrupt JSON');
    assert.strictEqual(bad('null'), null, 'JSON null');
    assert.strictEqual(bad('5'), null, 'JSON primitive');
    assert.strictEqual(bad(JSON.stringify({ schemaVersion: 1, chunks: [], savedAt: '2020-01-01T00:00:00.000Z' })), null, 'wrong schemaVersion');
    assert.strictEqual(bad(JSON.stringify({ schemaVersion: 2, chunks: 'nope', savedAt: '2020-01-01T00:00:00.000Z' })), null, 'chunks not an array');
    assert.strictEqual(bad(JSON.stringify({ schemaVersion: 2, chunks: [], savedAt: 0 })), null, 'falsy savedAt (0) fails the timestamp check');
    assert.strictEqual(bad(JSON.stringify({ schemaVersion: 2, chunks: [], savedAt: 'not-a-date' })), null, 'unparseable savedAt');
  });

  test('load()/loadV2: a chunk whose stored length mismatches its manifest rowCount, holds a non-object row, or is corrupt JSON invalidates the WHOLE load (returns null, not a partial result)', () => {
    const manifestFor = (chunks) => JSON.stringify({ schemaVersion: 2, savedAt: '2020-01-01T00:00:00.000Z', activeLevel: 'a1', rowCount: 1, chunkSize: 200, chunks });
    const mismatch = fakeStore({ [MANIFEST_KEY]: manifestFor([{ index: 0, rowCount: 2 }]), [chunkKey(0)]: JSON.stringify([{ a: 1 }]) });
    assert.strictEqual(inst({ storage: mismatch }).api.load(), null, 'chunk length 1 != manifest rowCount 2');
    const badRow = fakeStore({ [MANIFEST_KEY]: manifestFor([{ index: 0, rowCount: 1 }]), [chunkKey(0)]: JSON.stringify(['not-an-object']) });
    assert.strictEqual(inst({ storage: badRow }).api.load(), null, 'a primitive in the row slot');
    const missingChunk = fakeStore({ [MANIFEST_KEY]: manifestFor([{ index: 0, rowCount: 1 }]) }); // chunk key never written
    assert.strictEqual(inst({ storage: missingChunk }).api.load(), null, 'referenced chunk never stored');
    const corruptChunk = fakeStore({ [MANIFEST_KEY]: manifestFor([{ index: 0, rowCount: 1 }]), [chunkKey(0)]: 'not json{{' });
    assert.strictEqual(inst({ storage: corruptChunk }).api.load(), null, 'corrupt chunk JSON');
  });

  test('load()/loadV2: a valid manifest across multiple chunks concatenates rows in order and normalizes savedAt to ISO', () => {
    const store = fakeStore();
    const t = inst({ storage: store, options: { chunkSize: 2 } });
    t.api.save([{ a: 1 }, { a: 2 }, { a: 3 }], { activeLevel: 'b2' });
    const loaded = t.api.load();
    assert.deepStrictEqual(plain(loaded.rows), [{ a: 1 }, { a: 2 }, { a: 3 }]);
    assert.strictEqual(loaded.activeLevel, 'b2');
    assert.strictEqual(loaded.schemaVersion, 2);
    assert.ok(Number.isFinite(Date.parse(loaded.savedAt)));
  });

  test('load()/loadLegacy: a valid v1 record is normalized (activeLevel defaults to "ALL"); invalid schemaVersion/rows/savedAt, or a getItem-less store, all give null', () => {
    const legacy = (obj) => JSON.stringify(obj);
    const t1 = inst({ storage: fakeStore({ [STORAGE_KEY]: legacy({ schemaVersion: 1, savedAt: '2020-01-01T00:00:00.000Z', rows: [{ x: 1 }] }) }) });
    assert.deepStrictEqual(plain(t1.api.load()), { schemaVersion: 1, savedAt: '2020-01-01T00:00:00.000Z', activeLevel: 'ALL', rows: [{ x: 1 }] });
    const t2 = inst({ storage: fakeStore({ [STORAGE_KEY]: legacy({ schemaVersion: 2, savedAt: '2020-01-01T00:00:00.000Z', rows: [] }) }) });
    assert.strictEqual(t2.api.load(), null, 'wrong schemaVersion');
    const t3 = inst({ storage: fakeStore({ [STORAGE_KEY]: legacy({ schemaVersion: 1, savedAt: '2020-01-01T00:00:00.000Z', rows: 'nope' }) }) });
    assert.strictEqual(t3.api.load(), null, 'rows not an array');
    const t4 = inst({ storage: fakeStore({ [STORAGE_KEY]: legacy({ schemaVersion: 1, savedAt: 0, rows: [] }) }) });
    assert.strictEqual(t4.api.load(), null, 'falsy savedAt');
    const t5 = inst({ storage: { getItem: undefined } });
    assert.strictEqual(t5.api.load(), null, 'store with no getItem at all — no throw');
  });

  test('load(): a valid v2 draft always wins over a present legacy draft', () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, savedAt: '2020-01-01T00:00:00.000Z', rows: [{ legacy: true }] }) });
    const t = inst({ storage: store });
    t.api.save([{ fresh: true }], { activeLevel: 'z' });
    assert.deepStrictEqual(plain(t.api.load().rows), [{ fresh: true }]);
  });

  test('schedule(): debounces repeated calls into one pending timer at the resolved debounceMs; firing it saves the LATEST args and calls onSaved with the result', () => {
    const store = fakeStore();
    const t = inst({ storage: store, options: { debounceMs: 300 } });
    const calls = [];
    t.api.schedule([{ a: 1 }], {}, (r) => calls.push(['first', r]));
    assert.strictEqual(t.pending(), 1);
    assert.strictEqual(t.lastMs(), 300);
    t.api.schedule([{ a: 2 }], {}, (r) => calls.push(['second', r]));
    assert.strictEqual(t.pending(), 1, 'the first pending timer was cancelled, not left running alongside a second');
    t.fireAll();
    assert.deepStrictEqual(plain(calls.map((c) => c[0])), ['second'], 'only the latest scheduled save actually ran');
    assert.strictEqual(calls[0][1].ok, true);
    assert.deepStrictEqual(plain(JSON.parse(store.map.get(chunkKey(0)))), [{ a: 2 }]);
  });

  test('schedule(): onSaved is optional — firing with none provided never throws', () => {
    const t = inst({ storage: fakeStore() });
    t.api.schedule([{ a: 1 }], {});
    assert.doesNotThrow(() => t.fireAll());
  });

  test('flush(): cancels a pending scheduled timer and saves synchronously with its own args, returning the save() result directly', () => {
    const store = fakeStore();
    const t = inst({ storage: store });
    t.api.schedule([{ a: 'scheduled' }], {});
    assert.strictEqual(t.pending(), 1);
    const r = t.api.flush([{ a: 'flushed' }], { activeLevel: 'q' });
    assert.strictEqual(t.pending(), 0, 'the pending debounce timer is cancelled');
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(plain(JSON.parse(store.map.get(chunkKey(0)))), [{ a: 'flushed' }], 'flush wrote its own rows, not the scheduled ones');
  });

  test('flush(): with nothing pending it is just an immediate save()', () => {
    const store = fakeStore();
    const t = inst({ storage: store });
    const r = t.api.flush([{ a: 1 }], {});
    assert.strictEqual(r.ok, true);
    assert.strictEqual(t.pending(), 0);
  });

  test('clear(): removes the manifest, the legacy key, and every chunk key the manifest listed; also cancels a pending schedule(); returns true', () => {
    const store = fakeStore();
    const t = inst({ storage: store, options: { chunkSize: 2 } });
    t.api.save([{ a: 1 }, { a: 2 }, { a: 3 }], {});
    t.api.schedule([{ a: 99 }], {});
    assert.strictEqual(t.pending(), 1);
    const keysBefore = [...store.map.keys()].sort();
    assert.deepStrictEqual(keysBefore, [MANIFEST_KEY, chunkKey(0), chunkKey(1)].sort());
    assert.strictEqual(t.api.clear(), true);
    assert.strictEqual(store.map.size, 0, 'manifest and all chunk keys gone');
    assert.strictEqual(t.pending(), 0, 'the pending debounce timer was also cancelled');
    assert.strictEqual(t.api.hasDraft(), false);
  });

  test('clear(): a store with no removeItem, or one whose removeItem throws, returns false without throwing', () => {
    assert.strictEqual(inst({ storage: { getItem: () => null } }).api.clear(), false);
    const throwing = fakeStore(); throwing.removeItem = () => { throw new Error('denied'); };
    assert.strictEqual(inst({ storage: throwing }).api.clear(), false);
  });

  test('hasDraft(): true for a valid v2 manifest, true for a legacy-only draft, false when neither is present or valid', () => {
    const t = inst({ storage: fakeStore() });
    assert.strictEqual(t.api.hasDraft(), false);
    t.api.save([{ a: 1 }], {});
    assert.strictEqual(t.api.hasDraft(), true);
    const legacyOnly = inst({ storage: fakeStore({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, savedAt: '2020-01-01T00:00:00.000Z', rows: [] }) }) });
    assert.strictEqual(legacyOnly.api.hasDraft(), true);
    const corruptOnly = inst({ storage: fakeStore({ [MANIFEST_KEY]: 'garbage' }) });
    assert.strictEqual(corruptOnly.api.hasDraft(), false);
  });

  test('formatSavedAt(): a parseable timestamp formats to a non-empty string; falsy or unparseable input gives ""', () => {
    const t = inst({ storage: fakeStore() });
    const formatted = t.api.formatSavedAt('2020-06-15T12:00:00.000Z');
    assert.ok(typeof formatted === 'string' && formatted.length > 0);
    ['', undefined, null, 0, 'not-a-date'].forEach((bad) => assert.strictEqual(t.api.formatSavedAt(bad), '', JSON.stringify(bad)));
  });

  test('static note: no shipped HTML page wires up authoring-draft-autosave.js yet (an authoring tool this ships for, not yet built into the site)', () => {
    const glob = (dir, out) => { for (const name of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, name.name); if (name.isDirectory()) glob(p, out); else if (name.name.endsWith('.html')) out.push(p); } return out; };
    const pages = glob(root, []);
    const wired = pages.filter((p) => fs.readFileSync(p, 'utf8').includes('authoring-draft-autosave'));
    assert.deepStrictEqual(wired, [], 'if this now fails, a page wires it up — add the matching static-contract test the other modules have');
  });
})();

// ============================================================
console.log('offline-packs-ui.js: the "Offline learning" install/remove panel (Agent 179)');
// ============================================================
(function () {
  // HANDOFF_AGENT_178.md "Next agent - start here" item 1. offline-packs-ui.js is a self-executing IIFE that reads the
  // free globals `window`, `document` and `navigator`, and returns silently unless window.MylingoOfflinePacks exists.
  // It is run for real in a vm sandbox against (a) a tiny fake DOM whose innerHTML setter really parses the markup
  // the module writes (so querySelector / textContent / entity-decoding behave like a browser for this subset) and
  // (b) a fake MylingoOfflinePacks API whose promises the tests settle by hand.
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const SRC = fs.readFileSync(path.join(root, 'shared', 'js', 'offline-packs-ui.js'), 'utf8');
  const plain = (x) => JSON.parse(JSON.stringify(x));
  const settle = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setImmediate(r)); };
  const defer = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

  function makeUi(over) {
    over = over || {};
    const head = new El('head'), body = new El('body');
    const winListeners = {};
    const findById = (n, id) => { if (n.id === id) return n; for (const c of n.children) { if (c.tagName) { const f = findById(c, id); if (f) return f; } } return null; };
    const document = { head, body, createElement: (t) => new El(t), getElementById: (id) => findById(head, id) || findById(body, id) };
    const calls = { getIndex: 0, isInstalled: [], install: [], remove: [] };
    const installedSet = new Set(over.installed || []);
    const api = over.noApi ? undefined : {
      getIndex: () => { calls.getIndex++; return over.getIndex ? over.getIndex() : Promise.resolve({ packs: over.packs || [] }); },
      isInstalled: (id) => { calls.isInstalled.push(id); return over.isInstalled ? over.isInstalled(id) : Promise.resolve(installedSet.has(id)); },
      installPack: (id, cb) => { calls.install.push({ id, cb }); return over.installPack ? over.installPack(id, cb) : Promise.resolve(); },
      removePack: (id) => { calls.remove.push(id); return over.removePack ? over.removePack(id) : Promise.resolve(); },
    };
    const window = { MylingoOfflinePacks: api, addEventListener: (t, f) => { (winListeners[t] = winListeners[t] || []).push(f); } };
    const navigator = { onLine: over.onLine };
    const ctx = { window, document, navigator };
    vm.createContext(ctx);
    vm.runInContext(SRC, ctx);
    const ui = { window, document, navigator, calls, winListeners, head, body };
    ui.fire = (t) => (winListeners[t] || []).slice().forEach((f) => f({ type: t }));
    ui.mount = (opts) => { const target = new El('div'); body.appendChild(target); const section = window.MylingoOfflinePacksUI.mount(target, opts); return { target, section }; };
    return ui;
  }
  // mount and let the (already-resolved) fake API settle
  async function mounted(over, opts) {
    const ui = makeUi(over); const m = ui.mount(opts); await settle();
    const rows = () => m.section.querySelectorAll('.offline-pack');
    return Object.assign(ui, m, {
      rows,
      btn: (i) => rows()[i].querySelector('button'),
      status: (i) => rows()[i].querySelector('.offline-status').textContent,
      badge: () => m.section.querySelector('.offline-network'),
      list: () => m.section.querySelector('.offline-list'),
      ids: () => rows().map((r) => r.querySelector('b').textContent),
    });
  }
  const P = (id, extra) => Object.assign({ id, label: id.toUpperCase(), files: ['a', 'b'] }, extra || {});

  test('exports exactly { VERSION: 1, mount } — and does nothing at all (no throw, no export) when window.MylingoOfflinePacks is missing', () => {
    const ui = makeUi({ packs: [] });
    assert.deepStrictEqual(plain(Object.keys(ui.window.MylingoOfflinePacksUI).sort()), ['VERSION', 'mount']);
    assert.strictEqual(ui.window.MylingoOfflinePacksUI.VERSION, 1);
    assert.strictEqual(typeof ui.window.MylingoOfflinePacksUI.mount, 'function');
    const bare = makeUi({ noApi: true });
    assert.strictEqual(bare.window.MylingoOfflinePacksUI, undefined);
    assert.strictEqual(bare.head.children.length, 0, 'no <style> injected either');
  });

  testAsync('mount() builds the section synchronously (heading wired by aria-labelledby, loading placeholder, footer note), appends it to the target and returns it', async () => {
    const gate = defer();
    const ui = makeUi({ getIndex: () => gate.promise });
    const { target, section } = ui.mount();
    assert.strictEqual(section.tagName, 'section');
    assert.strictEqual(section.className, 'offline-section');
    assert.strictEqual(target.children[0], section);
    const h2 = section.querySelector('h2');
    assert.strictEqual(h2.textContent, 'Offline learning');
    assert.ok(/^offline-title-/.test(h2.id));
    assert.strictEqual(section.getAttribute('aria-labelledby'), h2.id);
    assert.strictEqual(section.querySelector('.offline-list').textContent, 'Loading available packs…');
    assert.ok(/^Core keeps the Mylingo shell/.test(section.querySelectorAll('.offline-note').pop().textContent));
    assert.strictEqual(ui.calls.getIndex, 1);
    assert.strictEqual(section.querySelectorAll('.offline-pack').length, 0);
    gate.resolve({ packs: [] }); await settle();
  });

  testAsync('the stylesheet is injected once (style#mylingo-offline-style in <head>), also across two mounts, and not at all when an element with that id already exists', async () => {
    const ui = makeUi({ packs: [P('core')] });
    ui.mount(); ui.mount(); await settle();
    const styles = ui.head.children.filter((c) => c.tagName === 'style');
    assert.strictEqual(styles.length, 1);
    assert.strictEqual(styles[0].id, 'mylingo-offline-style');
    assert.ok(styles[0].textContent.indexOf('.offline-section{') >= 0 && styles[0].textContent.indexOf('.offline-btn.primary{') >= 0);
    const pre = makeUi({ packs: [] });
    const existing = new El('style'); existing.id = 'mylingo-offline-style'; pre.head.appendChild(existing);
    pre.mount(); await settle();
    assert.strictEqual(pre.head.children.length, 1, 'the pre-existing style is left alone');
  });

  testAsync('connection badge: online -> "Online" + .online class; navigator.onLine === false -> "Offline" without it; an undefined onLine counts as online', async () => {
    const on = await mounted({ packs: [], onLine: true });
    assert.strictEqual(on.badge().textContent, 'Online'); assert.strictEqual(on.badge().className, 'offline-network online');
    const off = await mounted({ packs: [], onLine: false });
    assert.strictEqual(off.badge().textContent, 'Offline'); assert.strictEqual(off.badge().className, 'offline-network');
    const unk = await mounted({ packs: [], onLine: undefined });
    assert.strictEqual(unk.badge().textContent, 'Online');
  });

  testAsync('each pack becomes a row: label (falls back to id), "N asset(s)" with correct plural, optional " · level", status + button by installed state', async () => {
    const t = await mounted({
      packs: [P('core', { label: 'Core', files: ['x', 'y', 'z'] }), P('a1', { label: 'A1 pack', files: ['x'], level: 'A1' }), { id: 'b1' }, { id: 'c1', label: '', files: 'nope' }, P('z', { files: [] })],
      installed: ['core'], onLine: true,
    });
    assert.strictEqual(t.rows().length, 5);
    assert.deepStrictEqual(plain(t.rows().map((r) => r.querySelector('b').textContent)), ['Core', 'A1 pack', 'b1', 'c1', 'Z'], 'label, else id');
    assert.deepStrictEqual(plain(t.rows().map((r) => r.querySelector('small').textContent)), ['3 assets', '1 asset · A1', '0 assets', '0 assets', '0 assets']);
    assert.strictEqual(t.btn(0).textContent, 'Remove'); assert.strictEqual(t.btn(0).className, 'offline-btn'); assert.strictEqual(t.status(0), 'Installed'); assert.strictEqual(t.rows()[0].dataset.installed, '1');
    assert.strictEqual(t.btn(1).textContent, 'Install'); assert.strictEqual(t.btn(1).className, 'offline-btn primary'); assert.strictEqual(t.status(1), 'Not installed'); assert.strictEqual(t.rows()[1].dataset.installed, '0');
    assert.ok(t.rows().every((r) => r.querySelector('button').getAttribute('type') === 'button'));
    assert.deepStrictEqual(plain(t.calls.isInstalled), ['core', 'a1', 'b1', 'c1', 'z'], 'isInstalled asked once per pack, in index order');
  });

  testAsync('pack label / id / level are HTML-escaped: markup in them shows as literal text and never becomes an element', async () => {
    const t = await mounted({ packs: [P('x', { label: '<img src=x onerror=alert(1)>', level: '<b>L</b> & "q\'s"' })], onLine: true });
    assert.strictEqual(t.section.querySelector('img'), null);
    assert.strictEqual(t.rows()[0].querySelectorAll('b').length, 1, 'only the one real <b>');
    assert.strictEqual(t.rows()[0].querySelector('b').textContent, '<img src=x onerror=alert(1)>');
    assert.strictEqual(t.rows()[0].querySelector('small').textContent, '2 assets · <b>L</b> & "q\'s"');
    const id = await mounted({ packs: [{ id: '<i>k</i>' }] });
    assert.strictEqual(id.rows()[0].querySelector('b').textContent, '<i>k</i>');
    assert.strictEqual(id.section.querySelector('i'), null);
  });

  testAsync('ordering: without options.level the index order is kept; with it the matching pack (case-insensitive) is moved first and core precedes a non-matching level pack', async () => {
    const plainOrder = await mounted({ packs: [P('a1'), P('core'), P('b1')] });
    assert.deepStrictEqual(plain(plainOrder.ids()), ['A1', 'CORE', 'B1']);
    const boosted = await mounted({ packs: [P('a1'), P('core'), P('b1')] }, { level: 'b1' });
    assert.strictEqual(boosted.ids()[0], 'B1');
    const upper = await mounted({ packs: [P('a1'), P('core'), P('b1')] }, { level: 'B1' });
    assert.strictEqual(upper.ids()[0], 'B1', 'options.level is compared case-insensitively');
    const noMatch = await mounted({ packs: [P('a1'), P('core')] }, { level: 'zz' });
    assert.deepStrictEqual(plain(noMatch.ids()), ['CORE', 'A1'], 'no level pack matches: core is promoted');
    const noMatch2 = await mounted({ packs: [P('core'), P('a1')] }, { level: 'zz' });
    assert.deepStrictEqual(plain(noMatch2.ids()), ['CORE', 'A1']);
  });

  testAsync('no packs (empty list, missing or non-array `packs`) -> "No content packs are available in this build."', async () => {
    for (const idx of [{ packs: [] }, {}, { packs: 'x' }, { packs: null }]) {
      const t = await mounted({ getIndex: () => Promise.resolve(idx) });
      assert.strictEqual(t.list().textContent, 'No content packs are available in this build.', JSON.stringify(idx));
      assert.strictEqual(t.rows().length, 0);
    }
  });

  testAsync('getIndex() failing -> the list is replaced by a calm "could not be loaded" note whose tooltip carries the error message ("" for a message-less rejection)', async () => {
    const msg = 'Offline packs could not be loaded. The rest of Mylingo is still available.';
    const a = await mounted({ getIndex: () => Promise.reject(new Error('boom')) });
    assert.strictEqual(a.list().textContent, msg);
    assert.strictEqual(a.list().querySelector('.offline-note').title, 'boom');
    const stray = []; const onStray = (e) => stray.push(e); process.on('unhandledRejection', onStray);
    const b = await mounted({ getIndex: () => Promise.reject(undefined) });
    assert.strictEqual(b.list().textContent, msg); assert.strictEqual(b.list().querySelector('.offline-note').title, '');
    await settle(); process.removeListener('unhandledRejection', onStray);
    assert.deepStrictEqual(plain(stray.map(String)), [], 'a message-less rejection must not throw inside the error handler itself');
    const c = await mounted({ getIndex: () => Promise.resolve(undefined) }); // index.packs on undefined throws inside the then
    assert.strictEqual(c.list().textContent, msg);
    assert.strictEqual(c.section.querySelector('h2').textContent, 'Offline learning', 'the panel itself survives');
  });

  testAsync('the list is empty (no placeholder) while isInstalled() is pending, rows appear only once ALL packs are resolved, and ONE failing isInstalled() replaces the whole list with the error note (pinned)', async () => {
    const gate = defer();
    const t = await mounted({ packs: [P('core'), P('a1')], isInstalled: (id) => (id === 'a1' ? gate.promise : Promise.resolve(true)) });
    assert.strictEqual(t.list().textContent, ''); assert.strictEqual(t.rows().length, 0);
    gate.resolve(false); await settle();
    assert.strictEqual(t.rows().length, 2);
    const failing = await mounted({ packs: [P('core'), P('a1')], isInstalled: (id) => (id === 'a1' ? Promise.reject(new Error('cache down')) : Promise.resolve(true)) });
    assert.strictEqual(failing.rows().length, 0, 'the healthy pack is not shown either');
    assert.strictEqual(failing.list().querySelector('.offline-note').title, 'cache down');
  });

  testAsync('Install: click -> "Starting…" + disabled; progress -> "Caching done/total"; success -> installed state (Remove / Installed / not primary) and the button is usable again; a second click while busy is ignored', async () => {
    const gate = defer();
    const t = await mounted({ packs: [P('a1', { files: ['1', '2', '3'] })], installPack: () => gate.promise, onLine: true });
    t.btn(0).click();
    assert.strictEqual(t.status(0), 'Starting…'); assert.strictEqual(t.btn(0).disabled, true);
    assert.strictEqual(t.calls.install.length, 1); assert.strictEqual(t.calls.install[0].id, 'a1');
    t.btn(0).click(); assert.strictEqual(t.calls.install.length, 1, 'busy: second click ignored');
    const cb = t.calls.install[0].cb;
    cb({ done: 2, total: 5 }); assert.strictEqual(t.status(0), 'Caching 2/5');
    cb({ done: 1 }); assert.strictEqual(t.status(0), 'Caching 1/3', 'no progress.total -> pack.files.length');
    cb({ done: 1, total: 0 }); assert.strictEqual(t.status(0), 'Caching 1/3', 'total 0 is falsy -> pack.files.length');
    gate.resolve(); await settle();
    assert.strictEqual(t.status(0), 'Installed'); assert.strictEqual(t.btn(0).textContent, 'Remove'); assert.strictEqual(t.btn(0).className, 'offline-btn');
    assert.strictEqual(t.rows()[0].dataset.installed, '1'); assert.strictEqual(t.btn(0).disabled, false);
  });

  testAsync('progress total falls back to 1 when neither progress.total nor pack.files.length is usable — and throws (pinned) when the pack has no `files` array at all', async () => {
    const empty = await mounted({ packs: [P('a1', { files: [] })], installPack: () => new Promise(() => {}) });
    empty.btn(0).click(); empty.calls.install[0].cb({ done: 0 });
    assert.strictEqual(empty.status(0), 'Caching 0/1');
    const nofiles = await mounted({ packs: [{ id: 'q' }], installPack: () => new Promise(() => {}) });
    nofiles.btn(0).click();
    assert.throws(() => nofiles.calls.install[0].cb({ done: 1 }), (e) => e.name === 'TypeError', 'row rendering guards `files`, the progress callback does not');
    nofiles.calls.install[0].cb({ done: 1, total: 4 }); assert.strictEqual(nofiles.status(0), 'Caching 1/4', 'a real progress.total short-circuits before .files is touched');
  });

  testAsync('Install failure: "Install failed", tooltip = error message (or a default), still "Install"/"Not installed", button re-enabled, retry can succeed', async () => {
    let n = 0;
    const t = await mounted({ packs: [P('a1')], onLine: true, installPack: () => { n++; return n === 1 ? Promise.reject(new Error('quota exceeded')) : n === 2 ? Promise.reject(null) : Promise.resolve(); } });
    t.btn(0).click(); await settle();
    assert.strictEqual(t.status(0), 'Install failed'); assert.strictEqual(t.btn(0).title, 'quota exceeded');
    assert.strictEqual(t.btn(0).textContent, 'Install'); assert.strictEqual(t.rows()[0].dataset.installed, '0'); assert.strictEqual(t.btn(0).disabled, false);
    t.btn(0).click(); await settle();
    assert.strictEqual(t.status(0), 'Install failed'); assert.strictEqual(t.btn(0).title, 'Please try again while online.');
    t.btn(0).click(); await settle();
    assert.strictEqual(t.status(0), 'Installed'); assert.strictEqual(t.rows()[0].dataset.installed, '1');
    assert.strictEqual(n, 3);
  });

  testAsync('Remove: click -> "Removing…" + disabled + removePack(id); success -> not installed again; a second click while busy is ignored', async () => {
    const gate = defer();
    const t = await mounted({ packs: [P('core')], installed: ['core'], removePack: () => gate.promise, onLine: true });
    t.btn(0).click();
    assert.strictEqual(t.status(0), 'Removing…'); assert.strictEqual(t.btn(0).disabled, true);
    t.btn(0).click(); assert.deepStrictEqual(plain(t.calls.remove), ['core']);
    gate.resolve(); await settle();
    assert.strictEqual(t.status(0), 'Not installed'); assert.strictEqual(t.btn(0).textContent, 'Install'); assert.strictEqual(t.btn(0).className, 'offline-btn primary');
    assert.strictEqual(t.rows()[0].dataset.installed, '0'); assert.strictEqual(t.btn(0).disabled, false);
    assert.strictEqual(t.calls.install.length, 0, 'the first click removed, it did not also install');
  });

  testAsync('Remove failure (e.g. "installed packs depend on it"): "Remove failed", the pack stays installed with a "Remove" button, re-enabled', async () => {
    const t = await mounted({ packs: [P('core')], installed: ['core'], removePack: () => Promise.reject(new Error('Cannot remove offline pack core: installed packs depend on it')), onLine: true });
    t.btn(0).click(); await settle();
    assert.strictEqual(t.status(0), 'Remove failed'); assert.strictEqual(t.btn(0).textContent, 'Remove');
    assert.strictEqual(t.rows()[0].dataset.installed, '1'); assert.strictEqual(t.btn(0).disabled, false);
    assert.strictEqual(t.btn(0).title, '', 'unlike Install, the reason is not surfaced anywhere (pinned)');
  });

  testAsync('a failed-install tooltip is never cleared: after a later successful install the Remove button still carries the old error text (pinned quirk)', async () => {
    let n = 0;
    const t = await mounted({ packs: [P('a1')], onLine: true, installPack: () => (++n === 1 ? Promise.reject(new Error('flaky')) : Promise.resolve()) });
    t.btn(0).click(); await settle(); t.btn(0).click(); await settle();
    assert.strictEqual(t.btn(0).textContent, 'Remove');
    assert.strictEqual(t.btn(0).title, 'flaky');
  });

  testAsync('offline at click time: an uninstalled pack cannot be installed (installPack never called), but an installed pack can still be removed', async () => {
    const t = await mounted({ packs: [P('a1'), P('core')], installed: ['core'], onLine: true });
    t.navigator.onLine = false;
    t.btn(0).click(); await settle();
    assert.strictEqual(t.calls.install.length, 0); assert.strictEqual(t.status(0), 'Not installed');
    t.btn(1).click(); await settle();
    assert.deepStrictEqual(plain(t.calls.remove), ['core']);
    assert.strictEqual(t.status(1), 'Not installed');
    assert.strictEqual(t.btn(1).textContent, 'Connect to install', 'a pack removed while offline shows the offline label');
    assert.strictEqual(t.btn(1).disabled, true, 'and cannot be clicked');
  });

  testAsync('window online/offline events re-label and (dis)able ONLY uninstalled rows, and flip the badge; installed rows keep their Remove button', async () => {
    const t = await mounted({ packs: [P('a1'), P('core')], installed: ['core'], onLine: true });
    assert.strictEqual(t.btn(0).disabled, false);
    t.navigator.onLine = false; t.fire('offline');
    assert.strictEqual(t.badge().textContent, 'Offline'); assert.strictEqual(t.badge().className, 'offline-network');
    assert.strictEqual(t.btn(0).textContent, 'Connect to install'); assert.strictEqual(t.btn(0).disabled, true);
    assert.strictEqual(t.btn(1).textContent, 'Remove'); assert.strictEqual(t.btn(1).disabled, false);
    t.navigator.onLine = true; t.fire('online');
    assert.strictEqual(t.badge().textContent, 'Online'); assert.strictEqual(t.badge().className, 'offline-network online');
    assert.strictEqual(t.btn(0).textContent, 'Install');
    assert.strictEqual(t.btn(0).disabled, false, 'coming back online must re-enable Install (a button disabled BY the offline state must not be mistaken for a busy one)');
    assert.strictEqual(t.btn(1).textContent, 'Remove');
  });

  testAsync('a page that loads while offline shows "Connect to install" (disabled) and Install works after the connection returns', async () => {
    const t = await mounted({ packs: [P('a1'), P('core')], installed: ['core'], onLine: false });
    assert.strictEqual(t.btn(0).textContent, 'Connect to install'); assert.strictEqual(t.btn(0).disabled, true);
    assert.strictEqual(t.btn(1).disabled, false);
    t.navigator.onLine = true; t.fire('online');
    assert.strictEqual(t.btn(0).textContent, 'Install'); assert.strictEqual(t.btn(0).disabled, false);
    t.btn(0).click(); await settle();
    assert.strictEqual(t.calls.install.length, 1); assert.strictEqual(t.status(0), 'Installed');
  });

  testAsync('a connection change while a row is busy leaves that row alone (no relabel, still disabled) until its operation ends', async () => {
    const gate = defer();
    const t = await mounted({ packs: [P('a1'), P('b1')], onLine: true, installPack: (id) => (id === 'a1' ? gate.promise : Promise.resolve()) });
    t.btn(0).click();
    t.navigator.onLine = false; t.fire('offline');
    assert.strictEqual(t.btn(0).textContent, 'Install', 'busy row untouched'); assert.strictEqual(t.status(0), 'Starting…'); assert.strictEqual(t.btn(0).disabled, true);
    assert.strictEqual(t.btn(1).textContent, 'Connect to install', 'the idle row follows the connection');
    gate.resolve(); await settle();
    assert.strictEqual(t.status(0), 'Installed');
  });

  testAsync('when an operation ends, the button is re-enabled unless the pack is uninstalled AND offline: a pack that is (still) installed stays clickable offline, and an unknown connection (onLine undefined) counts as online', async () => {
    const rm = await mounted({ packs: [P('core')], installed: ['core'], onLine: true, removePack: () => Promise.reject(new Error('dep')) });
    rm.navigator.onLine = false; rm.btn(0).click(); await settle();
    assert.strictEqual(rm.status(0), 'Remove failed'); assert.strictEqual(rm.btn(0).disabled, false, 'still installed -> Remove stays usable offline');
    const inst = await mounted({ packs: [P('a1')], onLine: true });
    inst.btn(0).click(); inst.navigator.onLine = false; await settle();
    assert.strictEqual(inst.status(0), 'Installed'); assert.strictEqual(inst.btn(0).disabled, false, 'just installed -> Remove is usable offline');
    const unk = await mounted({ packs: [P('a1')], onLine: undefined, installPack: () => Promise.reject(new Error('x')) });
    unk.btn(0).click(); await settle();
    assert.strictEqual(unk.btn(0).disabled, false, 'undefined onLine is not "offline"');
    const unk2 = await mounted({ packs: [P('core')], installed: ['core'], onLine: undefined });
    unk2.btn(0).click(); await settle();
    assert.strictEqual(unk2.btn(0).textContent, 'Install', 'removed with onLine undefined -> normal Install label'); assert.strictEqual(unk2.btn(0).disabled, false);
  });

  testAsync('a failed install that ends while offline leaves the button disabled with the offline label, not clickable-but-dead', async () => {
    const gate = defer();
    const t = await mounted({ packs: [P('a1')], onLine: true, installPack: () => gate.promise });
    t.btn(0).click();
    t.navigator.onLine = false; t.fire('offline');
    gate.reject(new Error('network lost')); await settle();
    assert.strictEqual(t.status(0), 'Install failed');
    assert.strictEqual(t.btn(0).disabled, true);
    t.navigator.onLine = true; t.fire('online');
    assert.strictEqual(t.btn(0).disabled, false); assert.strictEqual(t.btn(0).textContent, 'Install');
  });

  testAsync('every mount() registers its own window "online" and "offline" listeners, and each panel is independent (two mounts, two sections, both update)', async () => {
    const ui = makeUi({ packs: [P('a1')], onLine: true });
    const a = ui.mount(), b = ui.mount(); await settle();
    assert.strictEqual(ui.winListeners.online.length, 2); assert.strictEqual(ui.winListeners.offline.length, 2);
    assert.notStrictEqual(a.section.querySelector('h2').id, b.section.querySelector('h2').id);
    ui.navigator.onLine = false; ui.fire('offline');
    assert.strictEqual(a.section.querySelector('.offline-network').textContent, 'Offline');
    assert.strictEqual(b.section.querySelector('.offline-network').textContent, 'Offline');
  });

  test('mount() with no options object at all works (options default to {})', () => {
    const ui = makeUi({ packs: [P('core')] });
    assert.doesNotThrow(() => ui.mount());
    assert.doesNotThrow(() => ui.mount(undefined));
  });

  test('static contract: the UI calls only methods the real offline-packs.js exports, and reads the {done,total} progress shape the real installPack emits', () => {
    const packs = fs.readFileSync(path.join(root, 'shared', 'js', 'offline-packs.js'), 'utf8');
    const exportsBlock = /global\.MylingoOfflinePacks\s*=\s*\{([\s\S]*?)\};/.exec(packs);
    assert.ok(exportsBlock, 'offline-packs.js export block found');
    const used = new Set(); SRC.replace(/API\.([A-Za-z]+)\(/g, (_, n) => { used.add(n); return _; });
    assert.deepStrictEqual(plain([...used].sort()), ['getIndex', 'installPack', 'isInstalled', 'removePack']);
    used.forEach((n) => assert.ok(new RegExp('\\b' + n + '\\s*:').test(exportsBlock[1]), 'offline-packs.js exports ' + n));
    assert.ok(/onProgress\(\{[^}]*done:[^}]*total:/.test(packs), 'installPack reports {done, total}');
  });

  test('static contract: the twelve level pages that load offline-packs-ui.js each load offline-packs.js FIRST, have exactly one #offlinePacksMount, and mount with { level } inside a try/catch', () => {
    const pages = [];
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => ['index', 'dashboard'].forEach((p) => pages.push(l + '/' + p + '.html')));
    const glob = (dir, out) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') glob(f, out); } else if (e.name.endsWith('.html')) out.push(path.relative(root, f).split(path.sep).join('/')); } return out; };
    const loading = glob(root, []).filter((f) => fs.readFileSync(path.join(root, f), 'utf8').indexOf('offline-packs-ui.js') >= 0).sort();
    assert.deepStrictEqual(plain(loading), pages.slice().sort(), 'exactly these pages load the UI');
    pages.forEach((f) => {
      const html = fs.readFileSync(path.join(root, f), 'utf8');
      const core = html.indexOf('shared/js/offline-packs.js'), ui = html.indexOf('shared/js/offline-packs-ui.js');
      assert.ok(core >= 0 && core < ui, f + ': offline-packs.js is loaded before the UI (which bails out silently without it)');
      assert.strictEqual((html.match(/id="offlinePacksMount"/g) || []).length, 1, f + ': one mount point');
      assert.ok(/try\s*\{[^}]*MylingoOfflinePacksUI\.mount\(document\.getElementById\('offlinePacksMount'\),\s*\{\s*level:\s*level\s*\}\)/.test(html), f + ': mounted with { level } inside try');
    });
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => assert.ok(/MylingoLevelLock\.isLocked\(level\)/.test(fs.readFileSync(path.join(root, l, 'dashboard.html'), 'utf8')), l + '/dashboard.html does not offer offline install on a locked level'));
  });
})();

// ============================================================
console.log('mastery-review-ui.js: the "Today\u2019s Review" mastery + review dashboard panel (Agent 180)');
// ============================================================
(function () {
  // HANDOFF_AGENT_179.md "Next agent - start here" item 1. mastery-review-ui.js is a self-executing IIFE that captures
  // window.MylingoSkillMastery / window.MylingoReviewScheduler ONCE at load, and renders through target.innerHTML.
  // It is run for real in a vm sandbox, mostly against the REAL skill-mastery.js + review-scheduler.js (stores seeded
  // in a fake localStorage, so the sanitizers, bands and due-sorting are the shipped ones), against the hoisted
  // parsing fake DOM (`El`), and against small hand-made fakes where a shape the real modules can never produce
  // is needed (escaping, missing modules, raw un-sanitised stores).
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
  const UI_SRC = read('shared', 'js', 'mastery-review-ui.js');
  const SM_SRC = read('shared', 'js', 'skill-mastery.js');
  const RS_SRC = read('shared', 'js', 'review-scheduler.js');
  const plain = (x) => JSON.parse(JSON.stringify(x));
  const NOW = 1800000000000, H = 3600000, D = 86400000;
  const fmt = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const MK = 'mylingo.skill-mastery.v1', RK = 'mylingo.review-scheduling.v1';
  const mstore = (skills) => ({ version: 1, updated_at: null, skills });
  const sk = (q, c, a) => ({ question_count: q, correct_count: c, attempt_count: a });
  const cd = (due) => ({ interval_hours: 24, consecutive_successes: 1, last_accuracy: 50, due_at: due });

  function makeMr(over) {
    over = over || {};
    const head = new El('head');
    const findById = (n, id) => { if (n.id === id) return n; for (const c of n.children) { if (c.tagName) { const f = findById(c, id); if (f) return f; } } return null; };
    const kv = new Map();
    const localStorage = { getItem: (k) => (kv.has(k) ? kv.get(k) : null), setItem: (k, v) => kv.set(k, String(v)), removeItem: (k) => kv.delete(k) };
    const window = { localStorage };
    const ctx = { window };
    if (!over.noDocument) ctx.document = window.document = { head, createElement: (t) => new El(t), getElementById: (id) => findById(head, id) };
    vm.createContext(ctx);
    const run = (src) => vm.runInContext(src, ctx);
    if (over.mastery) window.MylingoSkillMastery = over.mastery; else if (!over.noMastery) run(SM_SRC);
    if (over.scheduler) window.MylingoReviewScheduler = over.scheduler; else if (!over.noScheduler) run(RS_SRC);
    Object.keys(over.storage || {}).forEach((k) => kv.set(k, typeof over.storage[k] === 'string' ? over.storage[k] : JSON.stringify(over.storage[k])));
    if (!over.deferUi) run(UI_SRC);
    const mr = { window, head, kv, run, UI: () => window.MylingoMasteryReviewUI };
    const wrap = (target, out) => Object.assign({ target, out, section: target.querySelector('section') }, {
      all: (sel) => target.querySelectorAll(sel), one: (sel) => target.querySelector(sel),
      texts: (sel) => target.querySelectorAll(sel).map((e) => e.textContent),
      kpis: () => target.querySelectorAll('.mr-kpi').map((k) => [k.querySelector('.n').textContent, k.querySelector('.l').textContent]),
    });
    mr.mount = (opts) => { const target = new El('div'); return wrap(target, mr.UI().mount(target, opts)); };
    mr.render = (model) => { const target = new El('div'); return wrap(target, mr.UI().render(target, model)); };
    return mr;
  }
  // the standard seeded learner: reading weak + long overdue, grammar developing + due, vocabulary mastered + not due
  const seeded = () => makeMr({ storage: {
    [MK]: mstore({ grammar: sk(10, 6, 3), vocabulary: sk(20, 19, 6), reading: sk(5, 1, 2) }),
    [RK]: mstore({ grammar: cd(NOW - H), vocabulary: cd(NOW + 3 * D), reading: cd(NOW - 2 * D) }),
  } });

  test('exports exactly { VERSION: 1, buildSummary, compute, render, mount }; loads and renders even when neither MylingoSkillMastery nor MylingoReviewScheduler exists', () => {
    const mr = makeMr({});
    assert.deepStrictEqual(plain(Object.keys(mr.UI()).sort()), ['VERSION', 'buildSummary', 'compute', 'mount', 'render']);
    assert.strictEqual(mr.UI().VERSION, 1);
    const bare = makeMr({ noMastery: true, noScheduler: true });
    const m = bare.mount({ level: 'a1' });
    assert.strictEqual(m.section.tagName, 'section');
    assert.strictEqual(m.one('.mr-count').textContent, 'Nothing due');
  });

  test('render() without a target returns null and touches nothing (no <style> either); mount(null) likewise', () => {
    const mr = makeMr({});
    assert.strictEqual(mr.UI().render(null, {}), null);
    assert.strictEqual(mr.UI().render(undefined), null);
    assert.strictEqual(mr.UI().mount(null, { level: 'a1' }), null);
    assert.strictEqual(mr.head.children.length, 0);
  });

  test('the stylesheet is injected once (style#mylingo-mastery-review-style in <head>) across renders, left alone when that id already exists, and skipped when there is no document at all', () => {
    const mr = makeMr({});
    mr.mount(); mr.mount(); mr.render({});
    const styles = mr.head.children.filter((c) => c.tagName === 'style');
    assert.strictEqual(styles.length, 1);
    assert.strictEqual(styles[0].id, 'mylingo-mastery-review-style');
    assert.ok(styles[0].textContent.indexOf('.mr-section{') >= 0 && styles[0].textContent.indexOf('.mr-chip.needs-support{') >= 0 && styles[0].textContent.indexOf('@media(max-width:560px)') >= 0);
    const pre = makeMr({});
    const existing = new El('style'); existing.id = 'mylingo-mastery-review-style'; pre.head.appendChild(existing);
    pre.mount();
    assert.strictEqual(pre.head.children.length, 1);
    const noDoc = makeMr({ noDocument: true });
    const t = new El('div');
    assert.doesNotThrow(() => noDoc.UI().render(t, { level: 'a1' }));
    assert.strictEqual(t.querySelectorAll('section').length, 1);
  });

  test('empty state (no stored evidence at all): heading wired by aria-labelledby, "Nothing due", explanation, "Start your first review" block with a "Practice A1" link to ./index.html — and nothing else', () => {
    const m = makeMr({}).mount({ level: 'a1' });
    assert.strictEqual(m.section.className, 'mr-section');
    const h2 = m.one('h2');
    assert.strictEqual(h2.textContent, 'Today\u2019s Review');
    assert.ok(/^mastery-review-title-/.test(h2.id));
    assert.strictEqual(m.section.getAttribute('aria-labelledby'), h2.id);
    assert.strictEqual(m.one('.mr-count').textContent, 'Nothing due');
    assert.ok(/^Your mastery profile will appear after you complete a graded quiz\./.test(m.one('.mr-empty').textContent));
    assert.strictEqual(m.one('.mr-next b').textContent, 'Start your first review');
    const a = m.one('.mr-action');
    assert.strictEqual(a.textContent, 'Practice A1'); assert.strictEqual(a.getAttribute('href'), './index.html');
    assert.strictEqual(m.all('.mr-kpi').length, 0); assert.strictEqual(m.all('.mr-row').length, 0); assert.strictEqual(m.all('.mr-note').length, 0);
    const out = m.out;
    assert.strictEqual(out.nextAction, null); assert.deepStrictEqual(plain(out.rows), []); assert.strictEqual(out.summary.skillCount, 0);
  });

  test('empty-state link label: level is upper-cased (\"b2\" -> \"Practice B2\"), a missing level reads \"Practice level\", and markup in the level is escaped', () => {
    const mr = makeMr({});
    assert.strictEqual(mr.mount({ level: 'b2' }).one('.mr-action').textContent, 'Practice B2');
    assert.strictEqual(mr.mount({}).one('.mr-action').textContent, 'Practice level');
    assert.strictEqual(mr.mount().one('.mr-action').textContent, 'Practice level');
    const x = mr.mount({ level: '<i>z</i>' });
    assert.strictEqual(x.one('.mr-action').textContent, 'Practice <I>Z</I>');
    assert.strictEqual(x.all('i').length, 0);
  });

  test('a skill entry with question_count 0 is not \"tracked\": the learner still sees the empty state', () => {
    const m = makeMr({ storage: { [MK]: mstore({ grammar: sk(0, 0, 0) }) } }).mount({ level: 'a1' });
    assert.strictEqual(m.one('.mr-next b').textContent, 'Start your first review');
    assert.strictEqual(m.out.summary.skillCount, 0);
  });

  test('seeded learner: count chip, the four KPIs (due, tracked, overall accuracy = total correct / total questions rounded, priority skill = lowest accuracy)', () => {
    const m = seeded().mount({ level: 'a1', now: NOW });
    assert.strictEqual(m.one('.mr-count').textContent, '2 due now');
    assert.deepStrictEqual(plain(m.kpis()), [['2', 'Due today'], ['3', 'Tracked skills'], ['74%', 'Overall accuracy'], ['reading', 'Priority skill']]);
  });

  test('due list: earliest-due first, each row \"Due now\" chip + \"N% accuracy \u00b7 review due <date>\" + meter width = accuracy + a \"Review <skill>\" link to ./index.html', () => {
    const m = seeded().mount({ level: 'a1', now: NOW });
    const due = m.all('.mr-list')[0].querySelectorAll('.mr-row');
    assert.strictEqual(due.length, 2);
    assert.deepStrictEqual(plain(due.map((r) => r.querySelector('.mr-title span').textContent)), ['reading', 'grammar']);
    assert.deepStrictEqual(plain(due.map((r) => r.querySelector('.mr-chip').textContent)), ['Due now', 'Due now']);
    assert.strictEqual(due[0].querySelector('.mr-chip').className, 'mr-chip due');
    assert.deepStrictEqual(plain(due.map((r) => r.querySelector('.mr-sub').textContent)), ['20% accuracy \u00b7 review due ' + fmt(NOW - 2 * D), '60% accuracy \u00b7 review due ' + fmt(NOW - H)]);
    assert.deepStrictEqual(plain(due.map((r) => r.querySelector('i').getAttribute('style'))), ['width:20%', 'width:60%']);
    assert.deepStrictEqual(plain(due.map((r) => r.querySelector('.mr-action').textContent)), ['Review reading', 'Review grammar']);
    assert.ok(due.every((r) => r.querySelector('.mr-action').getAttribute('href') === './index.html'));
    assert.ok(due.every((r) => r.querySelector('.mr-meter').getAttribute('aria-hidden') === 'true'));
  });

  test('mastery list: lowest accuracy first (due skills are listed here too); band chip label + class per band, \"N% accuracy \u00b7 N graded questions\", confidence chip', () => {
    const m = seeded().mount({ level: 'a1', now: NOW });
    assert.strictEqual(m.one('.section-title').textContent, 'Mastery');
    const rows = m.all('.mr-list')[1].querySelectorAll('.mr-row');
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-title span').textContent)), ['reading', 'grammar', 'vocabulary']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-title .mr-chip').textContent)), ['Needs support', 'Developing', 'Mastered']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-title .mr-chip').className)), ['mr-chip needs-support', 'mr-chip developing', 'mr-chip mastered']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-sub').textContent)), ['20% accuracy \u00b7 5 graded questions', '60% accuracy \u00b7 10 graded questions', '95% accuracy \u00b7 20 graded questions']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('i').getAttribute('style'))), ['width:20%', 'width:60%', 'width:95%']);
    assert.deepStrictEqual(plain(rows.map((r) => r.children[r.children.length - 1].textContent)), ['medium confidence', 'medium confidence', 'high confidence']);
  });

  test('next recommended action = the most overdue skill (reason repeats its due line), \"Practice now\" -> ./index.html, and the closing note', () => {
    const m = seeded().mount({ level: 'a1', now: NOW });
    assert.strictEqual(m.one('.mr-next b').textContent, 'Next recommended action: review reading');
    assert.strictEqual(m.one('.mr-next span').textContent, '20% accuracy \u00b7 review due ' + fmt(NOW - 2 * D));
    const a = m.one('.mr-next .mr-action');
    assert.strictEqual(a.textContent, 'Practice now'); assert.strictEqual(a.getAttribute('href'), './index.html');
    assert.strictEqual(m.one('.mr-note').textContent, 'Mastery is calculated from graded skill evidence; review dates come directly from the saved review scheduler.');
    assert.deepStrictEqual(plain(m.out.nextAction), { skill: 'reading', reason: '20% accuracy \u00b7 review due ' + fmt(NOW - 2 * D), url: './index.html' });
  });

  test('singular/plural (\"1 graded question\"), \"1 due now\", and accuracy rounding (2 of 3 -> 67%)', () => {
    const m = makeMr({ storage: { [MK]: mstore({ grammar: sk(1, 1, 1), usage: sk(3, 2, 1) }), [RK]: mstore({ usage: cd(NOW - 1) }) } }).mount({ now: NOW });
    assert.strictEqual(m.one('.mr-count').textContent, '1 due now');
    assert.deepStrictEqual(plain(m.texts('.mr-list .mr-row .mr-sub').filter((s) => /graded/.test(s))), ['67% accuracy \u00b7 3 graded questions', '100% accuracy \u00b7 1 graded question']);
    assert.strictEqual(m.kpis()[2][0], '75%');
    const third = makeMr({ storage: { [MK]: mstore({ grammar: sk(3, 2, 1) }) } }).mount({ now: NOW });
    assert.strictEqual(third.kpis()[2][0], '67%', 'overall accuracy is rounded, not floored');
  });

  test('nothing due but evidence exists: \"Nothing due\" chip, calm \"Nothing is due right now\" line, no due rows, and the action falls back to the weakest skill', () => {
    const mr = makeMr({ storage: { [MK]: mstore({ grammar: sk(10, 9, 3), writing: sk(10, 5, 3) }), [RK]: mstore({ grammar: cd(NOW + D) }) } });
    const m = mr.mount({ level: 'c1', now: NOW });
    assert.strictEqual(m.one('.mr-count').textContent, 'Nothing due');
    assert.ok(/^Nothing is due right now\./.test(m.one('.mr-empty').textContent));
    assert.strictEqual(m.all('.mr-list').length, 1, 'only the mastery list');
    assert.strictEqual(m.all('.mr-row').length, 2);
    assert.deepStrictEqual(plain(m.kpis().map((k) => k[0])), ['0', '2', '70%', 'writing']);
    assert.strictEqual(m.one('.mr-next b').textContent, 'Next recommended action: review writing');
    assert.strictEqual(m.one('.mr-next span').textContent, 'Lowest current mastery \u00b7 50% accuracy');
  });

  test('PINNED: even a fully mastered learner with nothing due is told to \"review\" their weakest skill (\"Lowest current mastery \u00b7 100% accuracy\")', () => {
    const m = makeMr({ storage: { [MK]: mstore({ grammar: sk(20, 20, 6) }) } }).mount({ now: NOW });
    assert.strictEqual(m.one('.mr-next b').textContent, 'Next recommended action: review grammar');
    assert.strictEqual(m.one('.mr-next span').textContent, 'Lowest current mastery \u00b7 100% accuracy');
    const frac = makeMr({ storage: { [MK]: mstore({ grammar: sk(3, 1, 1) }) } }).mount({ now: NOW });
    assert.strictEqual(frac.one('.mr-next span').textContent, 'Lowest current mastery \u00b7 33% accuracy', 'the reason rounds the stored 33.33');
  });

  test('a review is due but no mastery evidence exists: KPIs show 0 tracked / \u2014 / \u2014, the due row says \"limited evidence\" with an empty meter, no Mastery heading, and the action is that review', () => {
    const m = makeMr({ storage: { [RK]: mstore({ writing: cd(NOW - D) }) } }).mount({ level: 'a2', now: NOW });
    assert.strictEqual(m.one('.mr-count').textContent, '1 due now');
    assert.deepStrictEqual(plain(m.kpis().map((k) => k[0])), ['1', '0', '\u2014', '\u2014']);
    assert.strictEqual(m.one('.mr-sub').textContent, 'limited evidence \u00b7 review due ' + fmt(NOW - D));
    assert.strictEqual(m.one('i').getAttribute('style'), 'width:0%');
    assert.strictEqual(m.all('.section-title').length, 0);
    assert.strictEqual(m.one('.mr-next b').textContent, 'Next recommended action: review writing');
    assert.strictEqual(m.one('.mr-next span').textContent, 'limited evidence \u00b7 review due ' + fmt(NOW - D));
  });

  test('options.now decides what is due (>= due_at); a missing / non-numeric / null / blank now means Date.now() (Agent 202 flipped the old pin that took null and \"\" as the epoch, so nothing was ever due)', () => {
    const mr = makeMr({ storage: { [MK]: mstore({ grammar: sk(10, 5, 3) }), [RK]: mstore({ grammar: cd(NOW) }) } });
    assert.strictEqual(mr.mount({ now: NOW }).one('.mr-count').textContent, '1 due now');
    assert.strictEqual(mr.mount({ now: NOW - 1 }).one('.mr-count').textContent, 'Nothing due');
    const past = makeMr({ storage: { [MK]: mstore({ grammar: sk(10, 5, 3) }), [RK]: mstore({ grammar: cd(1000) }) } });
    assert.strictEqual(past.mount({}).one('.mr-count').textContent, '1 due now', 'no now -> the real clock');
    assert.strictEqual(past.mount({ now: 'abc' }).one('.mr-count').textContent, '1 due now', 'non-numeric now -> the real clock');
    assert.strictEqual(past.mount({ now: null }).one('.mr-count').textContent, '1 due now', 'now:null -> the real clock (was: epoch 0, nothing due)');
    assert.strictEqual(past.mount({ now: false }).one('.mr-count').textContent, '1 due now');
    assert.strictEqual(past.mount({ now: [] }).one('.mr-count').textContent, '1 due now');
    assert.strictEqual(past.mount({ now: '  ' }).one('.mr-count').textContent, '1 due now');
    assert.strictEqual(past.mount({ now: 0 }).one('.mr-count').textContent, 'Nothing due', 'an explicit 0 is honoured');
    assert.strictEqual(past.mount({ now: '1000' }).one('.mr-count').textContent, '1 due now', 'numeric strings are honoured');
    assert.strictEqual(past.mount({ now: '999' }).one('.mr-count').textContent, 'Nothing due');
    assert.strictEqual(past.mount({ now: '' }).one('.mr-count').textContent, '1 due now');
    assert.strictEqual(past.mount({ now: undefined }).one('.mr-count').textContent, '1 due now');
  });

  test('mount() reads both stores fresh from localStorage each time and survives corrupt / wrong-version stored JSON (falls back to the empty state)', () => {
    const mr = makeMr({});
    assert.strictEqual(mr.mount({ now: NOW }).one('.mr-next b').textContent, 'Start your first review');
    mr.kv.set(MK, JSON.stringify(mstore({ reading: sk(4, 2, 1) })));
    assert.strictEqual(mr.mount({ now: NOW }).kpis()[1][0], '1', 'a later mount sees data written after load');
    mr.kv.set(MK, '{not json'); mr.kv.set(RK, JSON.stringify({ version: 99, skills: { grammar: cd(1) } }));
    assert.strictEqual(mr.mount({ now: NOW }).one('.mr-next b').textContent, 'Start your first review');
  });

  test('PINNED: the two data modules are captured once when the UI script loads — a module defined afterwards is ignored (script order matters), and a missing one degrades quietly', () => {
    const late = makeMr({ noMastery: true, noScheduler: true, deferUi: true, storage: { [MK]: mstore({ grammar: sk(10, 5, 3) }), [RK]: mstore({ grammar: cd(1) }) } });
    late.run(UI_SRC); late.run(SM_SRC); late.run(RS_SRC);
    assert.ok(late.window.MylingoSkillMastery && late.window.MylingoReviewScheduler);
    assert.strictEqual(late.mount({ now: NOW }).one('.mr-next b').textContent, 'Start your first review', 'stored data present, modules present now, still the empty state');
    const noSched = makeMr({ noScheduler: true, storage: { [MK]: mstore({ grammar: sk(10, 5, 3) }), [RK]: mstore({ grammar: cd(1) }) } }).mount({ now: NOW });
    assert.strictEqual(noSched.one('.mr-count').textContent, 'Nothing due'); assert.strictEqual(noSched.kpis()[1][0], '1');
    const noMastery = makeMr({ noMastery: true, storage: { [MK]: mstore({ grammar: sk(10, 5, 3) }) } }).mount({ now: NOW });
    assert.strictEqual(noMastery.one('.mr-next b').textContent, 'Start your first review');
  });

  test('every render() rewrites the target (one section, fresh random title id, returns the same object compute() would)', () => {
    const mr = seeded();
    const t = new El('div');
    const a = mr.UI().mount(t, { level: 'a1', now: NOW });
    const id1 = t.querySelector('h2').id;
    mr.UI().mount(t, { level: 'a1', now: NOW });
    assert.strictEqual(t.querySelectorAll('section').length, 1);
    assert.notStrictEqual(t.querySelector('h2').id, id1);
    assert.deepStrictEqual(plain(a), plain(mr.UI().compute({ level: 'a1', now: NOW, masteryStore: mr.window.MylingoSkillMastery.readStored(), reviewStore: mr.window.MylingoReviewScheduler.readStored() })));
  });

  test('compute(): due rows first (kind \"due\"), then the not-due tracked skills by accuracy (kind \"mastery\", the scheduler\u2019s earliest card attached only to its own skill); compute() with nothing -> no rows / no action', () => {
    const mr = seeded();
    const c = mr.UI().compute({ level: 'zz', now: NOW, masteryStore: mr.window.MylingoSkillMastery.readStored(), reviewStore: mr.window.MylingoReviewScheduler.readStored() });
    assert.deepStrictEqual(plain(c.rows.map((r) => [r.kind, r.skill])), [['due', 'reading'], ['due', 'grammar'], ['mastery', 'vocabulary']]);
    assert.strictEqual(c.rows[0].reason, '20% accuracy \u00b7 review due ' + fmt(NOW - 2 * D));
    assert.strictEqual(c.rows[2].reason, 'Mastered \u00b7 95% accuracy');
    assert.strictEqual(c.rows[2].mastery_band, 'mastered'); assert.strictEqual(c.rows[2].accuracy, 95);
    assert.strictEqual(c.rows[2].card, null, 'getNextReview() is the earliest stored due (reading), so the not-due vocabulary row carries no card');
    const calm = mr.UI().compute({ now: NOW - 10 * D, masteryStore: mr.window.MylingoSkillMastery.readStored(), reviewStore: mr.window.MylingoReviewScheduler.readStored() });
    assert.deepStrictEqual(plain(calm.rows.map((r) => [r.kind, r.skill, r.card ? r.card.due_at : null])), [['mastery', 'reading', NOW - 2 * D], ['mastery', 'grammar', null], ['mastery', 'vocabulary', null]], 'nothing due: the earliest upcoming card is attached to its own skill only');
    assert.strictEqual(c.nextAction.url, './index.html', 'PINNED: the level argument is ignored by actionUrl()');
    const empty = mr.UI().compute();
    assert.deepStrictEqual(plain(empty.rows), []); assert.strictEqual(empty.nextAction, null); assert.strictEqual(empty.summary.dueCount, 0);
  });

  test('buildSummary(): defaults for missing stores, average null with no evidence, weakest = lowest accuracy (a null accuracy sorts last, ties keep store order), null skill entries and 0-question skills ignored', () => {
    const mr = makeMr({});
    const b0 = mr.UI().buildSummary();
    assert.deepStrictEqual(plain([b0.dueCount, b0.skillCount, b0.average, b0.weakest, b0.next]), [0, 0, null, null, null]);
    const raw = mstore({ a: { question_count: 2, correct_count: 1, accuracy: null }, b: { question_count: 4, correct_count: 2, accuracy: 50 }, c: { question_count: 2, correct_count: 1, accuracy: 50 }, d: null, e: sk(0, 0, 0) });
    const b1 = mr.UI().buildSummary(raw, undefined, NOW);
    assert.deepStrictEqual(plain(b1.tracked), ['a', 'b', 'c']);
    assert.strictEqual(b1.weakest, 'b', 'null accuracy = 101, b and c tie -> first in store order');
    assert.strictEqual(b1.average, 50);
    const rs = { version: 1, skills: { grammar: cd(NOW - 5), reading: cd(NOW + 5) } };
    const b2 = mr.UI().buildSummary(undefined, rs, NOW);
    assert.deepStrictEqual(plain(b2.due.map((d) => d.skill)), ['grammar']);
    assert.strictEqual(b2.next.skill, 'grammar');
    assert.strictEqual(mr.UI().buildSummary(undefined, rs, NOW - 10).dueCount, 0);
  });

  test('all skill names, band keys, reasons and levels are HTML-escaped: hostile values from a fake scheduler / raw store never become elements or break out of an attribute', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const sched = { getDueSkills: () => [{ skill: evil, card: { due_at: NOW - 1 } }], getNextReview: () => null, readStored: () => ({}) };
    const mr = makeMr({ noMastery: true, scheduler: sched, deferUi: false });
    const m = mr.render({ level: '"><b>', now: NOW, masteryStore: mstore({ '<b>x</b>': { question_count: 4, correct_count: 2, accuracy: 50, mastery_band: 'a"b_c', confidence: '<u>hi</u>' } }), reviewStore: {} });
    assert.strictEqual(m.all('img').length, 0); assert.strictEqual(m.all('u').length, 0);
    assert.ok(m.texts('.mr-title span').indexOf(evil) >= 0, 'literal text');
    assert.ok(m.texts('.mr-title span').indexOf('<b>x</b>') >= 0);
    const chip = m.all('.mr-title .mr-chip').filter((c) => c.className.indexOf('mr-chip a') === 0)[0];
    assert.strictEqual(chip.className, 'mr-chip a\"b-c', 'quote survives as data, underscore -> hyphen, no attribute breakout');
    assert.strictEqual(chip.textContent, 'a\"b c');
    assert.ok(m.texts('.mr-chip').indexOf('<u>hi</u> confidence') >= 0);
    assert.strictEqual(m.all('.mr-row').length, 2);
    assert.ok(m.all('.mr-action').every((a) => a.getAttribute('href') === './index.html'));
  });

  test('band label / class fallbacks without the mastery module: known key -> \"needs support\" (underscores to spaces), missing key -> \"Tracked\" with no modifier class, missing confidence -> \"low confidence\"; accuracy is clamped to a 0..100 meter', () => {
    const mr = makeMr({ noMastery: true, noScheduler: true });
    const m = mr.render({ level: 'a1', masteryStore: mstore({
      grammar: { question_count: 4, correct_count: 2, accuracy: 150, mastery_band: 'needs_support' },
      reading: { question_count: 4, correct_count: 2, accuracy: -5 },
    }), reviewStore: {} });
    const rows = m.all('.mr-list')[0].querySelectorAll('.mr-row');
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-title span').textContent)), ['reading', 'grammar']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-title .mr-chip').textContent)), ['Tracked', 'needs support']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-title .mr-chip').className.trim())), ['mr-chip', 'mr-chip needs-support']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('i').getAttribute('style'))), ['width:0%', 'width:100%']);
    assert.deepStrictEqual(plain(rows.map((r) => r.children[r.children.length - 1].textContent)), ['low confidence', 'low confidence']);
    const notStarted = mr.render({ level: 'a1', masteryStore: mstore({ grammar: { question_count: 3, correct_count: 0, accuracy: null } }), reviewStore: {} });
    assert.strictEqual(notStarted.one('.mr-title .mr-chip').textContent, 'Not started', 'raw store: evidence without an accuracy reads \"Not started\"');
  });

  test('a fake scheduler card without a usable due_at reads \"review due now\" (missing, non-date, or invalid date)', () => {
    for (const card of [{}, { due_at: 'not a date' }, { due_at: NaN }]) {
      const sched = { getDueSkills: () => [{ skill: 'grammar', card }], getNextReview: () => null, readStored: () => ({}) };
      const m = makeMr({ scheduler: sched }).render({ level: 'a1', masteryStore: mstore({ grammar: { question_count: 4, correct_count: 2, accuracy: 50 } }), reviewStore: {} });
      assert.strictEqual(m.one('.mr-sub').textContent, '50% accuracy \u00b7 review due now', JSON.stringify(card));
    }
  });

  test('due-row numbers: fractional accuracy rounds (2 of 3 -> \"67%\", not 66), an accuracy of 0 is \"0% accuracy\" (not \"limited evidence\"), and the meter is clamped to 0..100 in the due list too', () => {
    const due = (skill) => ({ skill, card: { due_at: NOW - 1 } });
    const sched = { getDueSkills: () => ['grammar', 'reading', 'writing', 'usage', 'listening'].map(due), getNextReview: () => null, readStored: () => ({}) };
    const m = makeMr({ scheduler: sched }).render({ level: 'a1', now: NOW, reviewStore: {}, masteryStore: mstore({
      grammar: { question_count: 3, correct_count: 2, accuracy: 66.67, mastery_band: 'developing' },
      reading: { question_count: 4, correct_count: 0, accuracy: 0, mastery_band: 'needs_support' },
      writing: { question_count: 4, correct_count: 4, accuracy: 150, mastery_band: 'mastered' },
      usage: { question_count: 4, correct_count: 4, accuracy: -5, mastery_band: 'mastered' },
      listening: { question_count: 3, correct_count: 1, accuracy: 33.33, mastery_band: 'needs_support' },
    }) });
    const rows = m.all('.mr-list')[0].querySelectorAll('.mr-row');
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('.mr-sub').textContent.split(' \u00b7 ')[0])), ['67% accuracy', '0% accuracy', '150% accuracy', '-5% accuracy', '33% accuracy']);
    assert.deepStrictEqual(plain(rows.map((r) => r.querySelector('i').getAttribute('style'))), ['width:66.67%', 'width:0%', 'width:100%', 'width:0%', 'width:33.33%']);
    const exact = makeMr({ scheduler: { getDueSkills: () => [due('grammar')], getNextReview: () => null, readStored: () => ({}) } }).render({ now: NOW, reviewStore: {}, masteryStore: mstore({ grammar: { question_count: 4, correct_count: 4, accuracy: 100, mastery_band: 'mastered' } }) });
    assert.strictEqual(exact.one('.mr-list .mr-row i').getAttribute('style'), 'width:100%');
  });

  test('a due_at of 0 is a real date (1 Jan 1970), not \"now\"; and the `now` handed to the scheduler is always a finite number (Date.now() when the caller gave nothing usable)', () => {
    const seen = [];
    const sched = { getDueSkills: (st, now) => { seen.push(now); return [{ skill: 'grammar', card: { due_at: 0 } }]; }, getNextReview: () => null, readStored: () => ({}) };
    const mr = makeMr({ scheduler: sched });
    const raw = mstore({ grammar: { question_count: 4, correct_count: 2, accuracy: 50, mastery_band: 'developing' } });
    assert.strictEqual(mr.render({ now: NOW, reviewStore: {}, masteryStore: raw }).one('.mr-sub').textContent, '50% accuracy \u00b7 review due ' + fmt(0));
    const before = Date.now();
    mr.render({ reviewStore: {}, masteryStore: raw }); mr.render({ now: 'abc', reviewStore: {}, masteryStore: raw });
    assert.strictEqual(seen[0], NOW);
    assert.ok(seen.slice(1).every((n) => Number.isFinite(n) && n >= before && n <= Date.now()), JSON.stringify(seen));
  });

  test('skill names with underscores read with spaces everywhere (due row, mastery row, priority KPI, action); compute() mastery rows round the accuracy in their reason (2 of 3 -> \"Developing \u00b7 67% accuracy\"); buildSummary(undefined, undefined) ignores whatever is in localStorage', () => {
    const mr = makeMr({ noMastery: true, scheduler: { getDueSkills: () => [], getNextReview: () => null, readStored: () => ({}) } });
    const m = mr.render({ level: 'a1', reviewStore: {}, masteryStore: mstore({ reading_aloud: { question_count: 3, correct_count: 2, accuracy: 66.67, mastery_band: 'developing', confidence: 'low' } }) });
    assert.strictEqual(m.kpis()[3][0], 'reading aloud');
    assert.strictEqual(m.one('.mr-list .mr-row .mr-title span').textContent, 'reading aloud');
    assert.strictEqual(m.one('.mr-next b').textContent, 'Next recommended action: review reading aloud');
    const c = mr.UI().compute({ masteryStore: mstore({ grammar: { question_count: 3, correct_count: 2, accuracy: 66.67, mastery_band: 'developing' } }), reviewStore: {}, now: NOW });
    assert.strictEqual(c.rows[0].reason, 'developing \u00b7 67% accuracy');
    const real = seeded();
    assert.strictEqual(real.UI().buildSummary(undefined, undefined, NOW).dueCount, 0, 'no fallback to the stored review data');
    assert.strictEqual(real.UI().buildSummary(undefined, undefined, NOW).skillCount, 0);
  });

  test('static contract: the UI only calls the methods / members the real skill-mastery.js and review-scheduler.js export, and consumes the {skill, card.due_at} and {key, label} shapes they emit', () => {
    const mr = makeMr({});
    const SM = mr.window.MylingoSkillMastery, RS = mr.window.MylingoReviewScheduler;
    const used = (name) => Array.from(new Set((UI_SRC.match(new RegExp('\\b' + name + '\\.([A-Za-z_]+)', 'g')) || []).map((s) => s.split('.')[1])));
    assert.deepStrictEqual(plain(used('mastery').sort()), ['MASTERY_BANDS', 'SKILLS', 'readStored']);
    assert.deepStrictEqual(plain(used('scheduler').sort()), ['getDueSkills', 'getNextReview', 'readStored']);
    used('mastery').forEach((k) => assert.ok(k in SM, 'MylingoSkillMastery.' + k));
    used('scheduler').forEach((k) => assert.strictEqual(typeof RS[k], 'function', 'MylingoReviewScheduler.' + k));
    SM.MASTERY_BANDS.forEach((b) => { assert.strictEqual(typeof b.key, 'string'); assert.strictEqual(typeof b.label, 'string'); });
    const due = RS.getDueSkills({ version: 1, skills: { reading: cd(5) } }, 10);
    assert.deepStrictEqual(plain(due.map((d) => [d.skill, d.card.due_at])), [['reading', 5]]);
    // every band the real module can produce has a label the UI shows and a chip class the stylesheet styles
    const css = UI_SRC.slice(UI_SRC.indexOf('var STYLE'), UI_SRC.indexOf('function ensureStyle'));
    SM.MASTERY_BANDS.forEach((b) => assert.ok(css.indexOf('.mr-chip.' + b.key.replace(/_/g, '-') + '{') >= 0, 'stylesheet lacks .mr-chip.' + b.key));
  });

  test('static page wiring: exactly the six level dashboards load the UI, after skill-mastery.js and review-scheduler.js, with one #masteryReviewMount, an ungated try/catch mount({level}), and the .section-title style the UI\u2019s markup relies on; the three scripts are in the offline core', () => {
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const hits = [];
    (function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        if (e.name === 'node_modules' || e.name === '.git') return;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return walk(full);
        if (/\.html?$/.test(e.name) && read(path.relative(root, full)).indexOf('mastery-review-ui.js') >= 0) hits.push(path.relative(root, full).split(path.sep).join('/'));
      });
    })(root);
    assert.deepStrictEqual(plain(hits.sort()), levels.map((l) => l + '/dashboard.html'));
    hits.forEach((h) => {
      const html = read(...h.split('/'));
      const at = (n) => html.indexOf('../shared/js/' + n + '.js');
      assert.ok(at('skill-mastery') > 0 && at('skill-mastery') < at('review-scheduler') && at('review-scheduler') < at('mastery-review-ui'), h + ': script order');
      assert.strictEqual(html.split('id="masteryReviewMount"').length - 1, 1, h);
      assert.strictEqual(html.split("mastery-review-ui.js").length - 1, 1, h + ': loaded once');
      assert.ok(html.indexOf('id="masteryReviewMount"') < at('mastery-review-ui'), h + ': mount point precedes the script');
      assert.ok(/try\{if\(window\.MylingoMasteryReviewUI\)\{window\.MylingoMasteryReviewUI\.mount\(document\.getElementById\('masteryReviewMount'\),\{level:level\}\);\}\}catch\(e\)\{\}/.test(html), h + ': guarded mount call');
      assert.ok(/\.section-title\{/.test(html), h + ': .section-title style');
    });
    const core = JSON.parse(read('offline', 'core-manifest.json')).files;
    ['shared/js/skill-mastery.js', 'shared/js/review-scheduler.js', 'shared/js/mastery-review-ui.js'].forEach((f) => assert.ok(core.indexOf(f) >= 0, f + ' in core-manifest'));
  });

  test('Agent 202 sweep: HTML-escaping of all five characters in skill / band text, empty {} stores, null-accuracy handling, missing due date, due-row card, null-accuracy sort order, default confidence, title text', () => {
    const mr = makeMr({});
    const hostile = "a&b>'c\"<";
    const m = mr.render({ level: 'a1', now: NOW, masteryStore: { skills: { [hostile]: { question_count: 2, correct_count: 1, accuracy: 50, mastery_band: 'x&y' } } }, reviewStore: { skills: {} } });
    const rawTarget = {};
    mr.UI().render(rawTarget, { level: 'a1', now: NOW, masteryStore: { skills: { [hostile]: { question_count: 2, correct_count: 1, accuracy: 50, mastery_band: 'x&y' } } }, reviewStore: { skills: {} } });
    const html = rawTarget.innerHTML; // a plain object target keeps the raw markup string
    assert.ok(html.indexOf('a&amp;b&gt;&#39;c&quot;&lt;') !== -1, 'skill name is escaped: ' + html.slice(0, 400));
    assert.ok(html.indexOf('a&b') === -1 && html.indexOf(">'c") === -1);
    assert.ok(html.indexOf('x&amp;y') !== -1, 'band text / class is escaped');
    assert.strictEqual(m.one('.mr-head h2').textContent, 'Today\u2019s Review');
    assert.strictEqual(m.texts('.mr-list .mr-row .mr-chip').filter((t) => /confidence$/.test(t))[0], 'low confidence', 'missing confidence reads as low');
    const S = mr.UI();
    let sum;
    assert.doesNotThrow(() => { sum = S.buildSummary({}, {}, NOW); });
    assert.strictEqual(sum.weakest, null);
    assert.strictEqual(sum.average, null);
    assert.deepStrictEqual(plain(sum.tracked), []);
    assert.doesNotThrow(() => S.compute({ masteryStore: {}, reviewStore: {} }));
    assert.doesNotThrow(() => S.compute());
    assert.doesNotThrow(() => S.compute(null));
    const order = S.compute({ now: NOW, masteryStore: { skills: { a: { question_count: 2, correct_count: 1, accuracy: null }, b: { question_count: 2, correct_count: 1, accuracy: 50 } } }, reviewStore: { skills: {} } });
    assert.deepStrictEqual(plain(order.rows.map((r) => r.skill)), ['b', 'a'], 'a skill without an accuracy sorts LAST');
    assert.strictEqual(order.summary.weakest, 'b');
    const lim = makeMr({ storage: { [MK]: mstore({ grammar: sk(0, 0, 0) }), [RK]: mstore({ grammar: cd(NOW - H) }) } }).mount({ now: NOW });
    assert.strictEqual(lim.one('.mr-list .mr-row .mr-sub').textContent.split(' \u00b7 ')[0], 'limited evidence', 'accuracy null -> limited evidence (not 0%)');
    const noDue = makeMr({ scheduler: { getDueSkills: () => [{ skill: 'grammar', card: { due_at: null } }], getNextReview: () => null, readStored: () => ({}) } }).render({ now: NOW, reviewStore: {}, masteryStore: mstore({ grammar: { question_count: 4, correct_count: 2, accuracy: 50, mastery_band: 'needs_support' } }) });
    assert.ok(/review due now$/.test(noDue.one('.mr-list .mr-row .mr-sub').textContent), 'a due card without due_at reads "now"');
    const sd = seeded().mount({ level: 'a1', now: NOW });
    assert.strictEqual(sd.out.rows[0].card.due_at, NOW - 2 * D, 'due rows carry the scheduler card');
    assert.strictEqual(sd.out.rows[0].kind, 'due');
    const fut = makeMr({ storage: { [MK]: mstore({ vocabulary: sk(20, 19, 6), grammar: sk(10, 6, 3) }), [RK]: mstore({ vocabulary: cd(NOW + 3 * D), grammar: cd(NOW + 5 * D) }) } }).mount({ level: 'a1', now: NOW });
    const byS = (k) => fut.out.rows.find((r) => r.skill === k);
    assert.strictEqual(byS('vocabulary').card.due_at, NOW + 3 * D, 'the skill with the next review carries its card');
    assert.strictEqual(byS('grammar').card, null, 'other mastery rows carry none');
  });
})();

// ============================================================
console.log('authoring-validation.js: per-row rules, per-quiz rules and the incremental validation engine (Agent 181)');
// ============================================================
(function () {
  // HANDOFF_AGENT_180.md "Next agent - start here" item 1. authoring-validation.js is a self-executing IIFE
  // (`(function (global) {...})(window)`) with no DOM / storage / network access: pure logic, so it is run for real in a
  // vm sandbox that has nothing but `window`. Three exports: getRowIssues (one row), computeQuizGroupIssues (one quiz's
  // rows) and createEngine (the incremental engine that keeps both up to date, with running summary counters).
  // NOTE: no shipped page loads this module (Agent 178 item 21); the last test pins that.
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const AV_SRC = fs.readFileSync(path.join(root, 'shared', 'js', 'authoring-validation.js'), 'utf8');
  const makeAv = () => { const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(AV_SRC, ctx); return ctx.window.MylingoAuthoringValidation; };
  const AV = makeAv();
  const plain = (x) => JSON.parse(JSON.stringify(x));
  const good = (o) => Object.assign({
    quiz_id: 'q1', level: 'A1', title: 'T', description: 'D', quiz_category: 'grammar', quiz_tags: 'a', version: '1', status: 'draft',
    question_number: '1', question_text: 'Q1?', question_category: 'c', question_tags: 't', explanation: 'A long enough explanation',
    correct_index: '1', answer_1: 'a', answer_2: 'b',
  }, o || {});
  let nid = 0;
  const row = (qid, n, o) => good(Object.assign({ __internalId: 'r' + (++nid), quiz_id: qid, question_number: String(n), question_text: 'Question ' + qid + '-' + n }, o || {}));
  const quiz = (qid, n, f) => Array.from({ length: n }, (_, i) => row(qid, i + 1, f && f(i)));
  const grp = (n, f) => Array.from({ length: n }, (_, i) => good(Object.assign({ question_number: String(i + 1), question_text: 'Q' + (i + 1) }, f ? f(i) : {})));
  const REQUIRED = ['quiz_id', 'level', 'title', 'description', 'quiz_category', 'quiz_tags', 'version', 'status', 'question_number', 'question_text', 'question_category', 'question_tags', 'explanation', 'correct_index'];
  const RI = (o, cfg) => plain(AV.getRowIssues(good(o), cfg));
  const GI = (rows, cfg) => plain(AV.computeQuizGroupIssues(rows, cfg));

  test('exports exactly { getRowIssues, computeQuizGroupIssues, createEngine } on window.MylingoAuthoringValidation, and the file touches no document / storage / network (it loads with only `window` in scope)', () => {
    assert.deepStrictEqual(plain(Object.keys(AV).sort()), ['computeQuizGroupIssues', 'createEngine', 'getRowIssues']);
    Object.keys(AV).forEach((k) => assert.strictEqual(typeof AV[k], 'function', k));
    const code = AV_SRC.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/\b(document|localStorage|sessionStorage|fetch|XMLHttpRequest|indexedDB|require)\b/.test(code));
    assert.ok(/\}\)\(window\);\s*$/.test(AV_SRC));
  });

  // ---------------- getRowIssues ----------------
  test('getRowIssues: a fully valid row has no issues; an empty row reports every check in the shipped order with the shipped wording', () => {
    assert.deepStrictEqual(RI(), []);
    assert.deepStrictEqual(plain(AV.getRowIssues({})), [
      'Missing quiz_id', 'Missing level', 'Missing title', 'Missing description', 'Missing quiz_category', 'Missing quiz_tags', 'Missing version',
      'Missing status', 'Missing question_number', 'Missing question_text', 'Missing question_category', 'Missing question_tags', 'Missing explanation',
      'Missing correct_index', 'version must be a positive integer', 'Unrecognized status "undefined"', 'question_number must be a positive integer',
      'At least 2 answer options are required', 'correct_index must be 1-2 and 1-based', 'Explanation should be at least 10 characters',
    ]);
  });

  test('getRowIssues: each of the 14 required fields is "Missing <field>" when empty, whitespace-only, null or undefined - and only the knock-on checks that field feeds also fire', () => {
    const side = { version: ['version must be a positive integer'], status: ['Unrecognized status ""'], question_number: ['question_number must be a positive integer'], explanation: ['Explanation should be at least 10 characters'], correct_index: ['correct_index must be 1-2 and 1-based'] };
    REQUIRED.forEach((f) => {
      const empty = RI({ [f]: '' });
      assert.strictEqual(empty[0], 'Missing ' + f, f);
      assert.deepStrictEqual(empty.slice(1), side[f] || [], f + ': knock-on issues');
      ['   ', null, undefined].forEach((blank) => {
        const got = RI({ [f]: blank });
        assert.strictEqual(got[0], 'Missing ' + f, f + ' = ' + String(blank));
        assert.strictEqual(got.filter((m) => m.indexOf('Missing ') === 0).length, 1, f);
      });
    });
    assert.deepStrictEqual(RI({ level: '  ' }), ['Missing level']);
  });

  test('getRowIssues: level is trimmed and case-insensitive against LEVELS; an unrecognised level is reported quoting the raw value', () => {
    ['A1', 'a2', ' b1 ', 'B2', 'c1', ' C2'].forEach((l) => assert.deepStrictEqual(RI({ level: l }), [], l));
    assert.deepStrictEqual(RI({ level: 'z9' }), ['Unrecognized level "z9"']);
    assert.deepStrictEqual(RI({ level: ' D1 ' }), ['Unrecognized level " D1 "']);
    assert.deepStrictEqual(RI({ level: 'A 1' }), ['Unrecognized level "A 1"']);
  });

  test('getRowIssues: version and question_number must be positive integers (Number() coercion: "1.5", "0", "-2", "abc" fail; " 2 " and "1e0" pass)', () => {
    ['1', '12', ' 2 ', '1e0'].forEach((v) => { assert.deepStrictEqual(RI({ version: v }), [], 'version ' + v); assert.deepStrictEqual(RI({ question_number: v }), [], 'qn ' + v); });
    ['0', '-1', '1.5', 'abc', '1,2'].forEach((v) => {
      assert.deepStrictEqual(RI({ version: v }), ['version must be a positive integer'], 'version ' + v);
      assert.deepStrictEqual(RI({ question_number: v }), ['question_number must be a positive integer'], 'qn ' + v);
    });
    assert.deepStrictEqual(RI({ version: 0 }), ['version must be a positive integer']);
    assert.deepStrictEqual(RI({ version: 3 }), []);
  });

  test('getRowIssues: status is trimmed and case-insensitive against the five valid statuses; an unrecognised one is quoted raw; a missing one also reports the literal "undefined"/"null"', () => {
    ['draft', 'in_review', 'approved', 'published', 'retired', ' Published ', 'IN_REVIEW'].forEach((s) => assert.deepStrictEqual(RI({ status: s }), [], s));
    assert.deepStrictEqual(RI({ status: ' Maybe ' }), ['Unrecognized status " Maybe "']);
    assert.deepStrictEqual(RI({ status: 'in review' }), ['Unrecognized status "in review"']);
    assert.deepStrictEqual(RI({ status: null }), ['Missing status', 'Unrecognized status "null"']);
    assert.deepStrictEqual(RI({ status: undefined }), ['Missing status', 'Unrecognized status "undefined"']);
  });

  test('getRowIssues: answers - blank/whitespace answers are gaps; every filled answer after a gap reports its own "Gap before answer_N"; fewer than 2 filled answers is reported', () => {
    assert.deepStrictEqual(RI({ answer_3: 'c', answer_4: 'd', answer_5: 'e', answer_6: 'f', answer_7: 'g', answer_8: 'h', answer_9: 'i', correct_index: '9' }), []);
    assert.deepStrictEqual(RI({ answer_3: '', answer_4: 'z' }), ['Gap before answer_4']);
    assert.deepStrictEqual(RI({ answer_3: '   ', answer_4: 'd', answer_5: '', answer_6: 'f', answer_7: 'g' }), ['Gap before answer_4', 'Gap before answer_6', 'Gap before answer_7']);
    assert.deepStrictEqual(RI({ answer_1: '', answer_2: '', answer_3: 'x' }), ['Gap before answer_3', 'At least 2 answer options are required']);
    assert.deepStrictEqual(RI({ answer_2: '' }), ['At least 2 answer options are required']);
    assert.deepStrictEqual(RI({ answer_9: 'x' }), ['Gap before answer_9']);
    assert.deepStrictEqual(RI({ answer_1: '', answer_2: '' }), ['At least 2 answer options are required', 'correct_index must be 1-2 and 1-based']);
  });

  test('getRowIssues: correct_index must be an integer within 1..(filled answers), and the message range is max(filled answers, 2)', () => {
    assert.deepStrictEqual(RI({ correct_index: '2' }), []);
    ['0', '3', '-1', '1.5', 'abc', 0].forEach((c) => assert.deepStrictEqual(RI({ correct_index: c }), ['correct_index must be 1-2 and 1-based'], String(c)));
    assert.deepStrictEqual(RI({ answer_3: 'c', correct_index: '3' }), []);
    assert.deepStrictEqual(RI({ answer_3: 'c', correct_index: '4' }), ['correct_index must be 1-3 and 1-based']);
    // it counts FILLED answers, not the highest slot used: a gapped answer_4 makes 3 answers, so 4 is out of range
    assert.deepStrictEqual(RI({ answer_3: '', answer_4: 'd', correct_index: '3' }), ['Gap before answer_4']);
    assert.deepStrictEqual(RI({ answer_3: '', answer_4: 'd', correct_index: '4' }), ['Gap before answer_4', 'correct_index must be 1-3 and 1-based']);
    assert.deepStrictEqual(RI({ answer_1: '', answer_2: 'b', correct_index: '1' }), ['Gap before answer_2', 'At least 2 answer options are required']);
  });

  test('getRowIssues: duplicate answers are detected trimmed and case-insensitively; explanation needs 10+ characters after trimming', () => {
    assert.deepStrictEqual(RI({ answer_2: ' A ' }), ['Duplicate answer options within one question']);
    assert.deepStrictEqual(RI({ answer_2: 'a' }), ['Duplicate answer options within one question']);
    assert.deepStrictEqual(RI({ answer_3: 'B' }), ['Duplicate answer options within one question']);
    assert.deepStrictEqual(RI({ answer_3: 'c' }), []);
    assert.deepStrictEqual(RI({ explanation: '1234567890' }), []);
    assert.deepStrictEqual(RI({ explanation: '123456789' }), ['Explanation should be at least 10 characters']);
    assert.deepStrictEqual(RI({ explanation: '  123456789  ' }), ['Explanation should be at least 10 characters']);
    assert.deepStrictEqual(RI({ explanation: 12345678901 }), [], 'a numeric explanation is stringified');
  });

  test('getRowIssues: every check fires in one fixed order (version, status, question_number, gaps, answer count, correct_index, duplicates, explanation), and level comes after the Missing block', () => {
    assert.deepStrictEqual(RI({ level: 'q', version: '0', status: 'x', question_number: '0', answer_2: '', answer_3: 'A', correct_index: '5', explanation: 'short' }), [
      'Unrecognized level "q"', 'version must be a positive integer', 'Unrecognized status "x"', 'question_number must be a positive integer',
      'Gap before answer_3', 'correct_index must be 1-2 and 1-based', 'Duplicate answer options within one question', 'Explanation should be at least 10 characters',
    ]);
  });

  test('getRowIssues: pure - never mutates the row and returns a fresh array each call', () => {
    const r = good({ answer_2: '', version: '0' });
    const before = JSON.stringify(r);
    const a = AV.getRowIssues(r), b = AV.getRowIssues(r);
    assert.strictEqual(JSON.stringify(r), before);
    assert.notStrictEqual(a, b);
    assert.deepStrictEqual(plain(a), plain(b));
    a.push('x');
    assert.strictEqual(b.length, a.length - 1);
  });

  test('config: LEVELS / VALID_STATUSES / ANSWER_FIELDS overrides are honoured; empty or non-array overrides fall back to the defaults; the "Gap before answer_N" wording is hard-coded even for custom answer fields', () => {
    const cfg = { LEVELS: ['X'], VALID_STATUSES: ['ok'], ANSWER_FIELDS: ['a', 'b', 'c'] };
    const r = good({ level: 'x', status: 'OK', a: '1', b: '2', c: '', correct_index: '2' });
    assert.deepStrictEqual(plain(AV.getRowIssues(r, cfg)), []);
    assert.deepStrictEqual(RI({ level: 'A1', status: 'draft', a: '1', b: '2', correct_index: '2' }, cfg), ['Unrecognized level "A1"', 'Unrecognized status "draft"']);
    assert.deepStrictEqual(RI({ a: '1', b: '', c: '3', correct_index: '1' }, cfg).filter((m) => m.indexOf('Gap') === 0), ['Gap before answer_3']);
    // fallbacks
    [{ LEVELS: [] }, { LEVELS: 'A1' }, { VALID_STATUSES: [] }, { ANSWER_FIELDS: [] }, { ANSWER_FIELDS: 'x' }, null, undefined, {}].forEach((c) => {
      assert.deepStrictEqual(RI({}, c), [], JSON.stringify(c));
      assert.deepStrictEqual(RI({ level: 'C2', status: 'retired', answer_9: '', answer_3: 'c', correct_index: '3' }, c), [], JSON.stringify(c));
    });
  });

  test('config: MIN/MAX_QUESTIONS_PER_QUIZ accept any finite number (0 included) and fall back to 5 / 150 for strings, NaN, Infinity, null or undefined; the engine exposes the resolved config', () => {
    assert.strictEqual(AV.createEngine().config.MIN_QUESTIONS_PER_QUIZ, 5);
    assert.strictEqual(AV.createEngine().config.MAX_QUESTIONS_PER_QUIZ, 150);
    assert.deepStrictEqual(plain(AV.createEngine().config.LEVELS), ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
    assert.deepStrictEqual(plain(AV.createEngine().config.VALID_STATUSES), ['draft', 'in_review', 'approved', 'published', 'retired']);
    assert.deepStrictEqual(plain(AV.createEngine().config.ANSWER_FIELDS), ['answer_1', 'answer_2', 'answer_3', 'answer_4', 'answer_5', 'answer_6', 'answer_7', 'answer_8', 'answer_9']);
    const c = (o) => AV.createEngine(o).config;
    assert.strictEqual(c(null).MIN_QUESTIONS_PER_QUIZ, 5);
    assert.strictEqual(c({ MIN_QUESTIONS_PER_QUIZ: 0, MAX_QUESTIONS_PER_QUIZ: 0 }).MIN_QUESTIONS_PER_QUIZ, 0);
    assert.strictEqual(c({ MIN_QUESTIONS_PER_QUIZ: 0, MAX_QUESTIONS_PER_QUIZ: 0 }).MAX_QUESTIONS_PER_QUIZ, 0);
    assert.strictEqual(c({ MIN_QUESTIONS_PER_QUIZ: 2, MAX_QUESTIONS_PER_QUIZ: 9 }).MAX_QUESTIONS_PER_QUIZ, 9);
    [{ MIN_QUESTIONS_PER_QUIZ: '3', MAX_QUESTIONS_PER_QUIZ: '3' }, { MIN_QUESTIONS_PER_QUIZ: NaN, MAX_QUESTIONS_PER_QUIZ: NaN }, { MIN_QUESTIONS_PER_QUIZ: Infinity, MAX_QUESTIONS_PER_QUIZ: Infinity }, { MIN_QUESTIONS_PER_QUIZ: null, MAX_QUESTIONS_PER_QUIZ: null }].forEach((o) => {
      assert.strictEqual(c(o).MIN_QUESTIONS_PER_QUIZ, 5, JSON.stringify(o));
      assert.strictEqual(c(o).MAX_QUESTIONS_PER_QUIZ, 150, JSON.stringify(o));
    });
  });

  // ---------------- computeQuizGroupIssues ----------------
  test('computeQuizGroupIssues: a consistent 5-row quiz has no issues and returns { issues, level, title, category, count }', () => {
    assert.deepStrictEqual(GI(grp(5)), { issues: [], level: 'A1', title: 'T', category: 'grammar', count: 5 });
    assert.deepStrictEqual(plain(Object.keys(AV.computeQuizGroupIssues(grp(5)))), ['issues', 'level', 'title', 'category', 'count']);
  });

  test('computeQuizGroupIssues: question-count bounds (default 5..150 and custom) with the shipped wording, both boundaries inclusive', () => {
    assert.deepStrictEqual(GI(grp(4)).issues, ['Only 4 question(s) \u2014 needs at least 5']);
    assert.deepStrictEqual(GI(grp(1)).issues, ['Only 1 question(s) \u2014 needs at least 5']);
    assert.deepStrictEqual(GI(grp(5)).issues, []);
    assert.deepStrictEqual(GI(grp(150)).issues, []);
    assert.deepStrictEqual(GI(grp(151)).issues, ['151 questions \u2014 maximum is 150']);
    assert.strictEqual(GI(grp(151)).count, 151);
    assert.deepStrictEqual(GI(grp(3), { MIN_QUESTIONS_PER_QUIZ: 1, MAX_QUESTIONS_PER_QUIZ: 2 }).issues, ['3 questions \u2014 maximum is 2']);
    assert.deepStrictEqual(GI(grp(2), { MIN_QUESTIONS_PER_QUIZ: 3 }).issues, ['Only 2 question(s) \u2014 needs at least 3']);
    assert.deepStrictEqual(GI(grp(1), { MIN_QUESTIONS_PER_QUIZ: 1 }).issues, []);
  });

  test('computeQuizGroupIssues: each of the seven quiz-level fields differing in one row is "Inconsistent <field> within quiz_id \\"<id>\\"" (trimmed comparison, case-sensitive)', () => {
    const diff = { level: 'B1', title: 'Other', description: 'DD', quiz_category: 'vocab', quiz_tags: 'zz', version: '2', status: 'published' };
    Object.keys(diff).forEach((f) => {
      const got = GI(grp(5, (i) => (i === 2 ? { [f]: diff[f] } : {}))).issues;
      assert.ok(got.indexOf('Inconsistent ' + f + ' within quiz_id "q1"') >= 0, f);
      assert.strictEqual(got.filter((m) => m.indexOf('within quiz_id') > 0).length, 1, f + ': only that field');
    });
    // whitespace-only differences are not differences; a case difference IS one (within-quiz check compares raw trimmed text)
    ['description', 'title', 'quiz_tags', 'status'].forEach((f) => assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 ? { [f]: '  ' + good()[f] + '  ' } : {}))).issues, [], f));
    ['description', 'title', 'quiz_tags', 'status', 'quiz_category'].forEach((f) => assert.deepStrictEqual(GI(grp(5, (i) => (i === 0 ? { [f]: '  ' + good()[f] + '  ' } : {}))).issues, [], f + ': padded FIRST row'));
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 0 ? { level: 'a1' } : {}))).issues, ['Inconsistent level within quiz_id "q1"']);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 3 ? { status: 'Draft' } : {}))).issues, ['Inconsistent status within quiz_id "q1"']);
  });

  test('computeQuizGroupIssues: the quiz_id in messages is the FIRST row\u2019s, trimmed; a null quiz_id shows as an empty string', () => {
    assert.deepStrictEqual(GI(grp(5, (i) => ({ quiz_id: '  qq ', title: i === 1 ? 'x' : 'T' }))).issues.slice(0, 1), ['Inconsistent title within quiz_id "qq"']);
    assert.deepStrictEqual(GI(grp(5, (i) => ({ quiz_id: i === 0 ? '  first ' : 'later', title: i === 1 ? 'x' : 'T' }))).issues[0], 'Inconsistent title within quiz_id "first"');
    assert.deepStrictEqual(GI(grp(5, (i) => ({ quiz_id: null, title: i === 1 ? 'x' : 'T' }))).issues[0], 'Inconsistent title within quiz_id ""');
  });

  test('computeQuizGroupIssues: duplicate question_text (trimmed, case-insensitive, blanks ignored) reports once per EXTRA occurrence', () => {
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 3 ? { question_text: ' q2 ' } : {}))).issues, ['Duplicate question_text in quiz_id "q1"']);
    assert.deepStrictEqual(GI(grp(5, (i) => (i < 3 ? { question_text: 'same' } : {}))).issues, ['Duplicate question_text in quiz_id "q1"', 'Duplicate question_text in quiz_id "q1"']);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 || i === 2 ? { question_text: '' } : {}))).issues, []);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 || i === 2 ? { question_text: '   ' } : {}))).issues, []);
  });

  test('computeQuizGroupIssues: duplicate question_number reports "(Nx)" per repeated value; blank numbers are ignored; "1" and "01" are different keys (so not duplicates)', () => {
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 || i === 3 ? { question_number: '1' } : {}))).issues, ['Duplicate question_number "1" (3x)']);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 ? { question_number: '1' } : i === 3 ? { question_number: '5' } : {}))).issues, ['Duplicate question_number "1" (2x)', 'Duplicate question_number "5" (2x)']);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 ? { question_number: '' } : i === 2 ? { question_number: '  ' } : {}))).issues, []);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 ? { question_number: '01' } : {}))).issues, [], '"01" vs "1": not detected as a duplicate (pinned)');
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 1 ? { question_number: ' 1 ' } : {}))).issues, ['Duplicate question_number "1" (2x)'], 'the key is trimmed');
  });

  test('computeQuizGroupIssues: the "across this quiz\u2019s rows" checks compare NORMALISED levels (so "a1" vs "A1" does not trip them) but RAW trimmed category/title', () => {
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 0 ? { level: 'B1' } : {}))).issues, ['Inconsistent level within quiz_id "q1"', "Inconsistent level across this quiz's rows"]);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 0 ? { level: ' a1 ' } : {}))).issues, ['Inconsistent level within quiz_id "q1"']);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 0 ? { level: '' } : {}))).issues, ['Inconsistent level within quiz_id "q1"'], 'a blank level normalises to A1');
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 2 ? { quiz_category: 'vocab' } : {}))).issues, ['Inconsistent quiz_category within quiz_id "q1"', "Inconsistent quiz_category across this quiz's rows"]);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 2 ? { title: 'Other' } : {}))).issues, ['Inconsistent title within quiz_id "q1"', "Inconsistent title across this quiz's rows"]);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 2 ? { title: ' T ' } : {}))).issues, []);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 2 ? { quiz_category: ' grammar ' } : {}))).issues, []);
    assert.deepStrictEqual(GI(grp(5, (i) => (i === 0 ? { quiz_category: ' grammar ' } : {}))).issues, []);
  });

  test('computeQuizGroupIssues: issues come out in one fixed order (min, max, within-quiz fields, duplicate text, duplicate number, across level / category / title)', () => {
    const rows = grp(3, (i) => [{ level: 'B1', title: 'Other', question_text: 'dup', question_number: '7' }, { question_text: 'dup', question_number: '7' }, {}][i]);
    assert.deepStrictEqual(GI(rows, { MIN_QUESTIONS_PER_QUIZ: 4, MAX_QUESTIONS_PER_QUIZ: 2 }).issues, [
      'Only 3 question(s) \u2014 needs at least 4', '3 questions \u2014 maximum is 2',
      'Inconsistent level within quiz_id "q1"', 'Inconsistent title within quiz_id "q1"',
      'Duplicate question_text in quiz_id "q1"', 'Duplicate question_number "7" (2x)',
      "Inconsistent level across this quiz's rows", "Inconsistent title across this quiz's rows",
    ]);
  });

  test('computeQuizGroupIssues: the returned level is normalised from the first row (blank -> A1, unknown -> upper-cased); title and category are the first row\u2019s raw values or ""', () => {
    assert.strictEqual(GI([good({ level: 'b2' })], { MIN_QUESTIONS_PER_QUIZ: 1 }).level, 'B2');
    assert.strictEqual(GI([good({ level: '' })], { MIN_QUESTIONS_PER_QUIZ: 1 }).level, 'A1');
    assert.strictEqual(GI([good({ level: null })], { MIN_QUESTIONS_PER_QUIZ: 1 }).level, 'A1');
    assert.strictEqual(GI([good({ level: ' zz ' })], { MIN_QUESTIONS_PER_QUIZ: 1 }).level, 'ZZ');
    assert.strictEqual(GI([good({ level: 'zz' })], { MIN_QUESTIONS_PER_QUIZ: 1, LEVELS: ['ZZ'] }).level, 'ZZ');
    const e = GI([good({ title: null, quiz_category: undefined })], { MIN_QUESTIONS_PER_QUIZ: 1 });
    assert.strictEqual(e.title, '');
    assert.strictEqual(e.category, '');
    assert.strictEqual(GI([good({ title: ' Raw Title ', quiz_category: ' Raw ' })], { MIN_QUESTIONS_PER_QUIZ: 1 }).title, ' Raw Title ');
    assert.strictEqual(GI([good({ title: ' Raw Title ', quiz_category: ' Raw ' })], { MIN_QUESTIONS_PER_QUIZ: 1 }).category, ' Raw ');
  });

  test('computeQuizGroupIssues: pure (no mutation, fresh result) - and an empty row list throws a TypeError (the engine never calls it that way)', () => {
    const rows = grp(5, (i) => (i === 1 ? { title: 'x' } : {}));
    const before = JSON.stringify(rows);
    const a = AV.computeQuizGroupIssues(rows), b = AV.computeQuizGroupIssues(rows);
    assert.strictEqual(JSON.stringify(rows), before);
    assert.notStrictEqual(a, b);
    assert.notStrictEqual(a.issues, b.issues);
    assert.throws(() => AV.computeQuizGroupIssues([]), (e) => e && e.name === 'TypeError');
  });

  // ---------------- createEngine ----------------
  const sum = (E) => plain(E.getSummary());
  const Z = { totalRows: 0, rowsWithIssues: 0, totalQuizzes: 0, quizzesFailing: 0, orphanRows: 0 };

  test('createEngine: a new engine starts empty (all-zero summary, empty maps and index), two engines share no state, and the default arrays are exposed through config', () => {
    const E = AV.createEngine();
    assert.deepStrictEqual(sum(E), Z);
    assert.strictEqual(E.getRowIssuesMap().size, 0);
    assert.strictEqual(E.getQuizIssuesMap().size, 0);
    assert.strictEqual(E.getQuizIndexSnapshot().size, 0);
    assert.deepStrictEqual(plain(Object.keys(E).sort()), ['config', 'fullRecompute', 'getQuizIndexSnapshot', 'getQuizIssuesMap', 'getRowIssuesMap', 'getSummary', 'isRowValid', 'onFieldChanged', 'onRowAdded', 'onRowRemoved']);
    const E1 = AV.createEngine(), E2 = AV.createEngine();
    E1.fullRecompute(quiz('a', 5));
    assert.strictEqual(E2.getSummary().totalRows, 0);
    assert.strictEqual(E2.getQuizIssuesMap().size, 0);
  });

  test('fullRecompute: rows are validated and grouped; rows without an __internalId (undefined / null) are skipped, id 0 is accepted, a non-array clears everything; a second call replaces the first', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 2 });
    const a = row('q1', 1), b = row('q1', 2), c = row('q2', 1, { title: '' });
    E.fullRecompute([a, b, c]);
    assert.deepStrictEqual(sum(E), { totalRows: 3, rowsWithIssues: 1, totalQuizzes: 2, quizzesFailing: 1, orphanRows: 0 });
    assert.deepStrictEqual(plain(E.getRowIssuesMap().get(c.__internalId)), ['Missing title']);
    assert.deepStrictEqual(plain(E.getQuizIssuesMap().get('q2').issues), ['Only 1 question(s) \u2014 needs at least 2']);
    assert.deepStrictEqual(plain(E.getQuizIssuesMap().get('q1')), { issues: [], level: 'A1', title: 'T', category: 'grammar', count: 2 });
    E.fullRecompute([{ quiz_id: 'x' }, { __internalId: null, quiz_id: 'y' }, good({ __internalId: 0 })]);
    assert.deepStrictEqual(sum(E), { totalRows: 1, rowsWithIssues: 0, totalQuizzes: 1, quizzesFailing: 1, orphanRows: 0 });
    assert.strictEqual(E.isRowValid(0), true);
    assert.deepStrictEqual(plain(Array.from(E.getQuizIssuesMap().keys())), ['q1']);
    ['nope', null, undefined, {}, 5].forEach((v) => { E.fullRecompute(v); assert.deepStrictEqual(sum(E), Z); assert.strictEqual(E.getRowIssuesMap().size, 0); });
  });

  test('the row/quiz issue Maps are the SAME objects for the engine\u2019s whole lifetime (fullRecompute, edits, removals only mutate them), so a caller can grab them once', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const rm = E.getRowIssuesMap(), qm = E.getQuizIssuesMap();
    const r = row('q1', 1);
    E.fullRecompute([r]);
    assert.strictEqual(E.getRowIssuesMap(), rm);
    assert.strictEqual(E.getQuizIssuesMap(), qm);
    assert.strictEqual(rm.size, 1);
    r.title = '';
    E.onFieldChanged(r.__internalId);
    assert.strictEqual(E.getRowIssuesMap(), rm);
    assert.deepStrictEqual(plain(rm.get(r.__internalId)), ['Missing title']);
    E.onRowRemoved(r.__internalId);
    assert.strictEqual(E.getQuizIssuesMap(), qm);
    assert.strictEqual(rm.size, 0);
    assert.strictEqual(qm.size, 0);
    E.fullRecompute([]);
    assert.strictEqual(E.getRowIssuesMap(), rm);
  });

  test('orphan rows (blank / whitespace-only / missing quiz_id): counted as orphanRows, still row-validated ("Missing quiz_id"), never grouped and never counted as a quiz', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const o1 = row('', 1), o2 = row('   ', 2), o3 = row(null, 3), r = row('q1', 4);
    E.fullRecompute([o1, o2, o3, r]);
    assert.deepStrictEqual(sum(E), { totalRows: 4, rowsWithIssues: 3, totalQuizzes: 1, quizzesFailing: 0, orphanRows: 3 });
    assert.deepStrictEqual(plain(E.getRowIssuesMap().get(o2.__internalId)), ['Missing quiz_id']);
    assert.deepStrictEqual(plain(Array.from(E.getQuizIssuesMap().keys())), ['q1']);
    assert.deepStrictEqual(plain(Array.from(E.getQuizIndexSnapshot().keys())), ['q1']);
    // only a missing / blank id is an orphan: a numeric 0 is the quiz "0"
    const Z0 = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    Z0.fullRecompute([row(0, 1)]);
    assert.deepStrictEqual(sum(Z0), { totalRows: 1, rowsWithIssues: 0, totalQuizzes: 1, quizzesFailing: 0, orphanRows: 0 });
    assert.deepStrictEqual(plain(Array.from(Z0.getQuizIssuesMap().keys())), ['0']);
  });

  test('onRowAdded: validates the row and its quiz group, ignores rows with no __internalId (null, undefined, {}), and accepts internalId 0', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 2 });
    E.onRowAdded(null); E.onRowAdded(undefined); E.onRowAdded({}); E.onRowAdded({ __internalId: null, quiz_id: 'q' });
    assert.deepStrictEqual(sum(E), Z);
    const a = row('q1', 1);
    E.onRowAdded(a);
    assert.deepStrictEqual(sum(E), { totalRows: 1, rowsWithIssues: 0, totalQuizzes: 1, quizzesFailing: 1, orphanRows: 0 });
    E.onRowAdded(row('q1', 2));
    assert.deepStrictEqual(sum(E), { totalRows: 2, rowsWithIssues: 0, totalQuizzes: 1, quizzesFailing: 0, orphanRows: 0 });
    E.onRowAdded(good({ __internalId: 0, quiz_id: 'zero' }));
    assert.strictEqual(E.isRowValid(0), true);
    assert.strictEqual(E.getSummary().totalQuizzes, 2);
    E.onRowAdded(row('q3', 1, { explanation: 'short' }));
    assert.strictEqual(E.getSummary().rowsWithIssues, 1);
    assert.strictEqual(E.isRowValid('r' + nid), false);
  });

  test('onRowRemoved: re-checks only its former quiz (a quiz can start failing), deletes the quiz entry when its last row goes, decrements orphans (never below 0), and ignores unknown ids', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 2 });
    const a = row('q1', 1), b = row('q1', 2), c = row('q2', 1, { title: '' }), o = row('', 1);
    E.fullRecompute([a, b, c, o]);
    assert.deepStrictEqual(sum(E), { totalRows: 4, rowsWithIssues: 2, totalQuizzes: 2, quizzesFailing: 1, orphanRows: 1 });
    E.onRowRemoved(b.__internalId);
    assert.deepStrictEqual(sum(E), { totalRows: 3, rowsWithIssues: 2, totalQuizzes: 2, quizzesFailing: 2, orphanRows: 1 });
    assert.deepStrictEqual(plain(E.getQuizIssuesMap().get('q1').issues), ['Only 1 question(s) \u2014 needs at least 2']);
    E.onRowRemoved(c.__internalId);
    assert.deepStrictEqual(sum(E), { totalRows: 2, rowsWithIssues: 1, totalQuizzes: 1, quizzesFailing: 1, orphanRows: 1 });
    assert.strictEqual(E.getQuizIssuesMap().has('q2'), false);
    assert.strictEqual(E.getRowIssuesMap().has(c.__internalId), false);
    E.onRowRemoved(o.__internalId);
    assert.deepStrictEqual(sum(E), { totalRows: 1, rowsWithIssues: 0, totalQuizzes: 1, quizzesFailing: 1, orphanRows: 0 });
    const before = sum(E);
    E.onRowRemoved('nope'); E.onRowRemoved(o.__internalId); E.onRowRemoved(undefined);
    assert.deepStrictEqual(sum(E), before);
    // an unknown id must not decrement the orphan counter while a REAL orphan is present
    const o2 = row('', 2);
    E.onRowAdded(o2);
    assert.strictEqual(E.getSummary().orphanRows, 1);
    E.onRowRemoved('nope'); E.onRowRemoved(undefined); E.onRowRemoved(null);
    assert.strictEqual(E.getSummary().orphanRows, 1);
    assert.strictEqual(E.getSummary().totalRows, 2);
    E.onRowRemoved(o2.__internalId);
    assert.strictEqual(E.getSummary().orphanRows, 0);
    E.onRowRemoved(a.__internalId);
    assert.deepStrictEqual(sum(E), Z);
  });

  test('onFieldChanged: returns [] for an unknown id, [quiz_id] for an ordinary edit, [old, new] for a quiz_id move, only one of them when a row becomes / stops being an orphan; a whitespace-only quiz_id edit is not a move', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const a = row('q1', 1), b = row('q2', 1);
    E.fullRecompute([a, b]);
    assert.deepStrictEqual(plain(E.onFieldChanged('nope')), []);
    a.question_text = 'edited';
    assert.deepStrictEqual(plain(E.onFieldChanged(a.__internalId)), ['q1']);
    a.quiz_id = ' q1 ';
    assert.deepStrictEqual(plain(E.onFieldChanged(a.__internalId)), ['q1']);
    assert.deepStrictEqual(plain(E.getQuizIndexSnapshot().get('q1')), [a.__internalId]);
    a.quiz_id = 'q2';
    assert.deepStrictEqual(plain(E.onFieldChanged(a.__internalId)), ['q1', 'q2']);
    a.quiz_id = '';
    assert.deepStrictEqual(plain(E.onFieldChanged(a.__internalId)), ['q2']);
    a.quiz_id = 'q9';
    assert.deepStrictEqual(plain(E.onFieldChanged(a.__internalId)), ['q9']);
    a.quiz_id = '   ';
    E.onFieldChanged(a.__internalId);
    assert.strictEqual(E.getSummary().orphanRows, 1);
    a.title = 'still an orphan';
    assert.deepStrictEqual(plain(E.onFieldChanged(a.__internalId)), [], 'editing an orphan row touches no quiz group');
    assert.strictEqual(E.getSummary().orphanRows, 1);
    a.quiz_id = 'q2';
    assert.deepStrictEqual(plain(E.onFieldChanged(a.__internalId)), ['q2']);
    assert.strictEqual(E.getSummary().orphanRows, 0);
  });

  test('onFieldChanged: moving a row between quizzes re-checks BOTH groups (counts, consistency, the emptied group\u2019s entry is deleted) and the running counters follow', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 2 });
    const a = row('q1', 1), b = row('q1', 2), c = row('q2', 1);
    E.fullRecompute([a, b, c]);
    assert.deepStrictEqual(sum(E), { totalRows: 3, rowsWithIssues: 0, totalQuizzes: 2, quizzesFailing: 1, orphanRows: 0 });
    c.quiz_id = 'q1';                       // q2 disappears, q1 now has a duplicate question_number
    E.onFieldChanged(c.__internalId);
    assert.deepStrictEqual(sum(E), { totalRows: 3, rowsWithIssues: 0, totalQuizzes: 1, quizzesFailing: 1, orphanRows: 0 });
    assert.strictEqual(E.getQuizIssuesMap().has('q2'), false);
    assert.deepStrictEqual(plain(E.getQuizIssuesMap().get('q1').issues), ['Duplicate question_number "1" (2x)']);
    assert.strictEqual(E.getQuizIssuesMap().get('q1').count, 3);
    c.question_number = '3';
    E.onFieldChanged(c.__internalId);
    assert.deepStrictEqual(sum(E), { totalRows: 3, rowsWithIssues: 0, totalQuizzes: 1, quizzesFailing: 0, orphanRows: 0 });
    c.quiz_id = 'q7';                       // q1 keeps 2 rows (ok), q7 has 1 (too few)
    E.onFieldChanged(c.__internalId);
    assert.deepStrictEqual(sum(E), { totalRows: 3, rowsWithIssues: 0, totalQuizzes: 2, quizzesFailing: 1, orphanRows: 0 });
    assert.deepStrictEqual(plain(E.getQuizIssuesMap().get('q1').issues), []);
  });

  test('running counters do not drift: a row going valid -> invalid -> valid -> invalid -> removed moves rowsWithIssues 0,1,0,1,0 and never double-counts a row that stays invalid', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const r = row('q1', 1);
    E.onRowAdded(r);
    const seen = [E.getSummary().rowsWithIssues];
    r.title = ''; E.onFieldChanged(r.__internalId); seen.push(E.getSummary().rowsWithIssues);
    r.title = 'T'; E.onFieldChanged(r.__internalId); seen.push(E.getSummary().rowsWithIssues);
    r.title = ''; E.onFieldChanged(r.__internalId); r.description = ''; E.onFieldChanged(r.__internalId); r.status = 'x'; E.onFieldChanged(r.__internalId);
    seen.push(E.getSummary().rowsWithIssues);
    E.onRowRemoved(r.__internalId); seen.push(E.getSummary().rowsWithIssues);
    assert.deepStrictEqual(seen, [0, 1, 0, 1, 0]);
    // quizzesFailing likewise: fail -> still failing (another issue added) -> fixed
    const q = grp(5).map((g, i) => row('qq', i + 1));
    const F = AV.createEngine();
    F.fullRecompute(q);
    const failing = [F.getSummary().quizzesFailing];
    q[0].title = 'other'; F.onFieldChanged(q[0].__internalId); failing.push(F.getSummary().quizzesFailing);
    q[1].description = 'other'; F.onFieldChanged(q[1].__internalId); failing.push(F.getSummary().quizzesFailing);
    q[0].title = 'T'; F.onFieldChanged(q[0].__internalId); q[1].description = 'D'; F.onFieldChanged(q[1].__internalId); failing.push(F.getSummary().quizzesFailing);
    assert.deepStrictEqual(failing, [0, 1, 1, 0]);
  });

  test('isRowValid: true for a valid row, false for one with issues, and true for an id the engine has never seen (pinned)', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const ok = row('q1', 1), bad = row('q1', 2, { explanation: '' });
    E.fullRecompute([ok, bad]);
    assert.strictEqual(E.isRowValid(ok.__internalId), true);
    assert.strictEqual(E.isRowValid(bad.__internalId), false);
    assert.strictEqual(E.isRowValid('never-seen'), true);
  });

  test('getQuizIndexSnapshot: a Map of quiz_id -> array of internal ids in insertion order; it is a copy (mutating it does not touch the engine)', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const a = row('q1', 1), b = row('q2', 1), c = row('q1', 2);
    E.fullRecompute([a, b, c]);
    const snap = E.getQuizIndexSnapshot();
    assert.deepStrictEqual(plain(Array.from(snap)), [['q1', [a.__internalId, c.__internalId]], ['q2', [b.__internalId]]]);
    snap.get('q1').push('x'); snap.delete('q2');
    assert.deepStrictEqual(plain(Array.from(E.getQuizIndexSnapshot())), [['q1', [a.__internalId, c.__internalId]], ['q2', [b.__internalId]]]);
    assert.notStrictEqual(E.getQuizIndexSnapshot(), snap);
  });

  test('the hot path really is incremental: after one field edit only the edited row\u2019s quiz group is read; after a quiz_id move only the old and new groups; getSummary reads no row at all', () => {
    const reads = new Map();
    const watch = (r) => { let t = r.title; Object.defineProperty(r, 'title', { get() { reads.set(r.__internalId, (reads.get(r.__internalId) || 0) + 1); return t; }, set(v) { t = v; }, enumerable: true, configurable: true }); return r; };
    const all = [];
    for (let q = 0; q < 20; q++) for (let n = 1; n <= 5; n++) all.push(watch(row('hq' + q, n)));
    const idsOf = (qid) => all.filter((r) => r.quiz_id === qid).map((r) => r.__internalId).sort();
    const E = AV.createEngine();
    E.fullRecompute(all);
    assert.strictEqual(reads.size, 100, 'a full recompute reads every row');
    reads.clear();
    const target = all.find((r) => r.quiz_id === 'hq1' && r.question_number === '3');
    target.question_text = 'edited';
    E.onFieldChanged(target.__internalId);
    assert.deepStrictEqual(Array.from(reads.keys()).sort(), idsOf('hq1'));
    reads.clear();
    const oldIds = idsOf('hq1');
    target.quiz_id = 'hq5';
    E.onFieldChanged(target.__internalId);
    assert.deepStrictEqual(Array.from(reads.keys()).sort(), oldIds.concat(idsOf('hq5')).filter((v, i, a2) => a2.indexOf(v) === i).sort());
    assert.strictEqual(reads.size, 10, '4 left in hq1 + 6 in hq5');
    reads.clear();
    E.getSummary(); E.isRowValid(target.__internalId); E.getQuizIndexSnapshot();
    assert.strictEqual(reads.size, 0);
    reads.clear();
    E.onRowRemoved(target.__internalId);
    assert.deepStrictEqual(Array.from(reads.keys()).sort(), idsOf('hq5').filter((id) => id !== target.__internalId).sort(), 'removal re-checks just the former group');
  });

  test('incremental == full: after every step of 300 seeded random add / remove / edit / quiz_id-move sequences, the engine\u2019s summary, per-row issues, per-quiz issues (as sets) and quiz index equal a fresh fullRecompute of the same rows', () => {
    const prng = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const norm = (e) => JSON.stringify({
      s: plain(e.getSummary()),
      r: Array.from(e.getRowIssuesMap()).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
      q: Array.from(e.getQuizIssuesMap()).map(([k, v]) => [k, Array.from(v.issues).sort(), v.count]).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
      i: Array.from(e.getQuizIndexSnapshot()).map(([k, v]) => [k, Array.from(v).sort()]).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    });
    const fields = [['quiz_id', ['q1', 'q2', 'q3', '', ' q1 ']], ['question_number', ['1', '2', '3', '', '0']], ['question_text', ['a', 'b', 'c', '']], ['title', ['T', 'U', '']], ['level', ['A1', 'B1', 'zz', '']], ['answer_2', ['b', 'a', '']], ['status', ['draft', 'x']]];
    let steps = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const rnd = prng(seed), pick = (a) => a[Math.floor(rnd() * a.length)];
      const cfg = { MIN_QUESTIONS_PER_QUIZ: 3, MAX_QUESTIONS_PER_QUIZ: 5 };
      const E = AV.createEngine(cfg);
      const rows = [];
      let n = 0;
      const mk = () => good({ __internalId: 's' + seed + '-' + (++n), quiz_id: pick(['q1', 'q2', 'q3', '', ' q1 ']), question_number: String(1 + Math.floor(rnd() * 4)), question_text: pick(['a', 'b', 'c', 'd', 'A']), title: pick(['T', 'T', 'U']), level: pick(['A1', 'a1', 'B1']), answer_2: pick(['b', 'a', '']), explanation: pick(['long enough text', 'x']) });
      for (let step = 0; step < 60; step++) {
        const op = rnd();
        if (op < 0.35 || !rows.length) { const r = mk(); rows.push(r); E.onRowAdded(r); }
        else if (op < 0.5) { const r = rows.splice(Math.floor(rnd() * rows.length), 1)[0]; E.onRowRemoved(r.__internalId); }
        else { const r = pick(rows); const f = pick(fields); r[f[0]] = pick(f[1]); E.onFieldChanged(r.__internalId); }
        const F = AV.createEngine(cfg); F.fullRecompute(rows);
        assert.strictEqual(norm(E), norm(F), 'seed ' + seed + ' step ' + step);
        steps++;
      }
    }
    assert.strictEqual(steps, 300 * 60);
  });

  test('PINNED (latent): the engine\u2019s contract is "onRowAdded once per row, then onFieldChanged" - re-adding a known row double-counts an orphan and, after a quiz_id change, leaves a stale index entry so the row sits in two quiz groups', () => {
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const o = row('', 1);
    E.onRowAdded(o); E.onRowAdded(o);
    assert.deepStrictEqual(sum(E), { totalRows: 1, rowsWithIssues: 1, totalQuizzes: 0, quizzesFailing: 0, orphanRows: 2 });
    const F = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    const r = row('q1', 1);
    F.onRowAdded(r); r.quiz_id = 'q2'; F.onRowAdded(r);
    assert.deepStrictEqual(plain(Array.from(F.getQuizIndexSnapshot())), [['q1', [r.__internalId]], ['q2', [r.__internalId]]]);
    assert.strictEqual(F.getSummary().totalQuizzes, 2);
    assert.strictEqual(F.getSummary().totalRows, 1);
    // fullRecompute with two rows sharing one __internalId behaves the same way (the ids must be unique)
    const G = AV.createEngine();
    G.fullRecompute([good({ __internalId: 1, quiz_id: '' }), good({ __internalId: 1, quiz_id: '' })]);
    assert.deepStrictEqual(sum(G), { totalRows: 1, rowsWithIssues: 1, totalQuizzes: 0, quizzesFailing: 0, orphanRows: 2 });
  });

  test('PINNED (cosmetic): a quiz entry\u2019s title / level / category come from the FIRST row in the engine\u2019s index (insertion order), so after remove + re-add they can differ from what fullRecompute reports; the issues themselves are identical', () => {
    const A = good({ __internalId: 'A', title: 'X', question_number: '1', question_text: 'a' }), B = good({ __internalId: 'B', title: 'Y', question_number: '2', question_text: 'b' });
    const E = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    E.fullRecompute([A, B]);
    assert.strictEqual(E.getQuizIssuesMap().get('q1').title, 'X');
    E.onRowRemoved('A'); E.onRowAdded(A);
    assert.strictEqual(E.getQuizIssuesMap().get('q1').title, 'Y');
    const F = AV.createEngine({ MIN_QUESTIONS_PER_QUIZ: 1 });
    F.fullRecompute([A, B]);
    assert.strictEqual(F.getQuizIssuesMap().get('q1').title, 'X');
    assert.deepStrictEqual(plain(E.getQuizIssuesMap().get('q1').issues), plain(F.getQuizIssuesMap().get('q1').issues));
  });

  test('PINNED (latent): the default LEVELS / VALID_STATUSES / ANSWER_FIELDS arrays are module-level constants handed out by reference, so mutating one engine\u2019s config.LEVELS changes every later engine and validator (checked in a private sandbox)', () => {
    const P = makeAv();
    P.createEngine().config.LEVELS.push('Z9');
    assert.ok(P.createEngine().config.LEVELS.indexOf('Z9') >= 0);
    assert.deepStrictEqual(plain(P.getRowIssues(good({ level: 'z9' }))), []);
    assert.deepStrictEqual(plain(AV.getRowIssues(good({ level: 'z9' }))), ['Unrecognized level "z9"'], 'the main sandbox is untouched');
  });

  test('PINNED (quirks): a numeric level 0 slips past both level checks; blank/whitespace checks use String(x ?? "") so 0 counts as present', () => {
    assert.deepStrictEqual(RI({ level: 0 }), []);
    assert.deepStrictEqual(RI({ level: '0' }), ['Unrecognized level "0"']);
    assert.deepStrictEqual(RI({ correct_index: 0 }), ['correct_index must be 1-2 and 1-based']);
  });

  test('static: no shipped page, script, manifest or service worker loads authoring-validation.js (Agent 178 item 21) and it is not in the offline core manifest - wiring it up should be a deliberate decision (precache + CACHE_VERSION)', () => {
    const hits = [];
    (function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'tests') return;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return walk(full);
        if (!/\.(html?|js|json|webmanifest)$/.test(e.name) || e.name === 'authoring-validation.js') return;
        if (fs.readFileSync(full, 'utf8').indexOf('authoring-validation') >= 0) hits.push(path.relative(root, full).split(path.sep).join('/'));
      });
    })(root);
    assert.deepStrictEqual(plain(hits), []);
    const core = JSON.parse(fs.readFileSync(path.join(root, 'offline', 'core-manifest.json'), 'utf8')).files;
    assert.strictEqual(core.indexOf('shared/js/authoring-validation.js'), -1);
  });
})();

// ============================================================
console.log('courses/lesson.html: the lesson player inline script (Agent 182)');
// ============================================================
(function () {
  // HANDOFF_AGENT_181.md "Next agent - start here" item 1. courses/lesson.html carries ~13 KB of inline script wrapped in one IIFE.
  // Two layers: (a) the top-level helpers (esc, sanitizeHtml, youtubeId, youtubeEmbedSrc, estimateMinutes, mediaEntries,
  // renderMediaItem, quizUrl, levelFromLessonId, renderError) are lifted out by name with extractFn and run in a vm sandbox;
  // (b) the WHOLE inline script is run for real (fetch chain -> gates -> slide deck -> nav -> completion gate -> offline listener)
  // against the REAL level-lock.js / course-progress.js / safe-url.js, a fake fetch and a purpose-built mini DOM (PN below: tolerant HTML
  // tokenizer with void / raw-text / comment / boolean-attribute handling, serialisation, remove()/outerHTML/attributes, a DOMParser that
  // mirrors the real "<div>..</div>" first-child behaviour). The mini parser is NOT a browser: parser-quirk (mXSS) behaviour is out of scope.
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
  const HTML = read('courses', 'lesson.html');
  const plain = (x) => JSON.parse(JSON.stringify(x));

  // ---- the page's inline script (the last <script> without src) ----
  const SCRIPT = (() => {
    const all = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    return all[all.length - 1][1];
  })();

  // (mini DOM PN / parseInto / FakeDOMParser: hoisted to the top of the file in Agent 183)
  // ---- sandbox for the lifted helpers ----
  const SU_SRC = read('shared', 'js', 'safe-url.js');
  function makeHelpers(over) {
    over = over || {};
    const els = { content: new PN(1, 'div'), chapterTrail: new PN(1, 'nav') };
    els.content.setAttribute('id', 'content'); els.chapterTrail.setAttribute('id', 'chapterTrail');
    const sb = { URL, DOMParser: FakeDOMParser, document: { getElementById: (id) => els[id] || null } };
    sb.window = sb;
    vm.createContext(sb);
    if (!over.noSafeUrl) vm.runInContext(SU_SRC, sb);
    const names = ['esc', 'sanitizeHtml', 'renderError', 'estimateMinutes', 'youtubeId', 'youtubeEmbedSrc', 'mediaEntries', 'renderMediaItem', 'quizUrl', 'levelFromLessonId'];
    const vars = (HTML.match(/^var (\$|ALLOWED_TAGS|ALLOWED_ATTRS)=.*$/gm) || []).join('\n');
    const api = vm.runInContext(vars + '\n' + names.map((n) => extractFn(HTML, n)).join('\n') + '\n({' + names.join(',') + '})', sb);
    api.els = els;
    return api;
  }
  const H = makeHelpers();

  // ---- sandbox for the whole page ----
  const MOD = { ll: read('shared', 'js', 'level-lock.js'), cp: read('shared', 'js', 'course-progress.js'), su: SU_SRC };
  const LV = 'a1';
  const U1 = 'course-a1-unit-01', U2 = 'course-a1-unit-02';
  const mkLesson = (n, over) => Object.assign({
    lesson_id: 'course-a1-unit-01-lesson-0' + n, unit_id: U1, title: 'Lesson ' + n, category: 'Grammar', order: n,
    revision: { summary: 'Summary ' + n, examples: ['ex ' + n], key_terms: ['term ' + n], estimated_minutes: 5 },
    exercise_quiz_ids: ['q' + n + 'a', 'q' + n + 'b'], lesson_quiz_id: 'lq' + n, status: 'published',
  }, over || {});
  const mkFiles = (over) => {
    const lessons = [mkLesson(1), mkLesson(2), mkLesson(3)];
    const quizzes = []; lessons.forEach((l) => l.exercise_quiz_ids.forEach((id) => quizzes.push({ id, title: 'Quiz ' + id, questions: 4 })));
    return Object.assign({
      '../course_content/lessons/a1.json': lessons,
      '../course_content/courses.json': [{ course_id: 'course-a1', title: 'Course A1', level: 'A1', status: 'published' }],
      '../course_content/units.json': [{ unit_id: U1, course_id: 'course-a1', title: 'Unit One' }, { unit_id: U2, course_id: 'course-a1', title: 'Unit Two' }],
      '../a1/quizzes.json': quizzes,
    }, over || {});
  };
  const passed = (ids) => { const p = {}; ids.forEach((id) => { p[id] = { status: 'completed', best: 100 }; }); return JSON.stringify(p); };
  const settle = async () => { for (let i = 0; i < 25; i++) await new Promise((r) => setImmediate(r)); };

  async function runPage(o) {
    o = o || {};
    const store = makeFakeStorage();
    Object.keys(o.storage || {}).forEach((k) => store.setItem(k, o.storage[k]));
    const els = {};
    ['content', 'chapterTrail', 'playerNav'].forEach((id) => { els[id] = new PN(1, 'div'); els[id].setAttribute('id', id); });
    const byId = (id) => { let hit = null; Object.keys(els).forEach((k) => { if (els[k].id === id) hit = els[k]; else if (!hit) hit = els[k].querySelectorAll('#' + id)[0] || hit; }); return hit; };
    const listeners = {}, fetches = [], scrolls = [];
    const files = o.files || mkFiles();
    const sb = {
      URLSearchParams, URL, DOMParser: FakeDOMParser, localStorage: store, console,
      location: { search: o.search === undefined ? '?lesson=course-a1-unit-01-lesson-01' : o.search },
      navigator: o.onLine === undefined ? { onLine: true } : (o.onLine === 'absent' ? {} : { onLine: o.onLine }),
      document: { title: '', getElementById: byId, querySelector: (s) => els.content.querySelector(s) },
      fetch: (url, opts) => {
        fetches.push(url);
        const v = files[url];
        if (v === 'throw') return Promise.reject(new Error('net'));
        if (v === undefined) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(v))) });
      },
      addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
      scrollTo: (a) => { scrolls.push(a); },
    };
    sb.window = sb;
    vm.createContext(sb);
    (o.modules || ['ll', 'cp', 'su']).forEach((m) => vm.runInContext(MOD[m], sb));
    vm.runInContext(SCRIPT, sb);
    await settle();
    const page = {
      sb, els, store, fetches, scrolls, listeners,
      get content() { return els.content.innerHTML; }, get nav() { return els.playerNav.innerHTML; }, get trail() { return els.chapterTrail.innerHTML; },
      err: () => (els.content.querySelector('.err') ? els.content.querySelector('.err').textContent : null),
      btn: (id) => byId(id), items: () => els.chapterTrail.querySelectorAll('.trail-item'),
      next: async () => { byId('navNext').click(); await settle(); }, back: async () => { byId('navBack').click(); await settle(); },
      fire: async (t) => { (listeners[t] || []).forEach((f) => f({})); await settle(); },
      slideText: () => (els.content.querySelector('.slide') ? els.content.querySelector('.slide').textContent : ''),
    };
    return page;
  }
  const ERR_UNAVAILABLE = 'This lesson isn\u2019t available yet.';

  // ================= helpers =================
  test('lesson.html: every helper this section lifts exists once as a top-level function; the inline script is one strict IIFE', () => {
    ['esc', 'sanitizeHtml', 'fetchJson', 'renderError', 'estimateMinutes', 'youtubeId', 'youtubeEmbedSrc', 'mediaEntries', 'renderMediaItem', 'quizUrl', 'levelFromLessonId'].forEach((n) => {
      assert.strictEqual((SCRIPT.match(new RegExp('^function ' + n + '\\(', 'gm')) || []).length, 1, n);
    });
    assert.ok(/^\(function\(\)\{\n'use strict';/.test(SCRIPT.trimStart()));
    assert.ok(/\}\)\(\);\s*$/.test(SCRIPT));
  });

  test('esc: null / undefined -> "", the five HTML-significant characters, numbers, no shortcut for already-escaped text', () => {
    assert.strictEqual(H.esc(null), ''); assert.strictEqual(H.esc(undefined), '');
    assert.strictEqual(H.esc(0), '0'); assert.strictEqual(H.esc(false), 'false');
    assert.strictEqual(H.esc('<a href="x" title=\'y\'>&</a>'), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    assert.strictEqual(H.esc('&amp;'), '&amp;amp;');
  });

  test('levelFromLessonId: only the course-<level>- prefix, lower-case, with the trailing dash', () => {
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => assert.strictEqual(H.levelFromLessonId('course-' + l + '-unit-01-lesson-01'), l));
    assert.strictEqual(H.levelFromLessonId('course-a1'), null);
    assert.strictEqual(H.levelFromLessonId('COURSE-A1-x'), null);
    assert.strictEqual(H.levelFromLessonId('xcourse-a1-x'), null);
    assert.strictEqual(H.levelFromLessonId('course-d1-x'), null);
    assert.strictEqual(H.levelFromLessonId(null), null);
    assert.strictEqual(H.levelFromLessonId(undefined), null);
    assert.strictEqual(H.levelFromLessonId(''), null);
  });

  test('youtubeId: watch / embed / shorts / youtu.be, min 6 id chars, junk and non-strings -> null', () => {
    assert.strictEqual(H.youtubeId('https://www.youtube.com/watch?v=abcDEF123_-'), 'abcDEF123_-');
    assert.strictEqual(H.youtubeId('https://youtube.com/embed/abcdef'), 'abcdef');
    assert.strictEqual(H.youtubeId('https://www.youtube.com/shorts/abcdef1'), 'abcdef1');
    assert.strictEqual(H.youtubeId('https://youtu.be/abcdef1?t=5'), 'abcdef1');
    assert.strictEqual(H.youtubeId('https://www.youtube.com/watch?v=abcdef&list=xyz'), 'abcdef');
    assert.strictEqual(H.youtubeId('https://youtu.be/abcde'), null, '5 chars is too short');
    assert.strictEqual(H.youtubeId('https://vimeo.com/123456789'), null);
    assert.strictEqual(H.youtubeId(''), null); assert.strictEqual(H.youtubeId(null), null); assert.strictEqual(H.youtubeId(12345678), null); assert.strictEqual(H.youtubeId({}), null);
  });

  test('youtubeId: PINNED - the regex is unanchored, so a non-YouTube URL that merely contains "youtube.com/watch?v=<id>" yields an id (harmless: the embed host is fixed)', () => {
    assert.strictEqual(H.youtubeId('https://evil.example/?u=youtube.com/watch?v=abcdef1'), 'abcdef1');
    assert.ok(H.youtubeEmbedSrc('abcdef1').startsWith('https://www.youtube.com/embed/'));
  });

  test('youtubeEmbedSrc: falsy -> "", fixed host + player params, the id is URI-encoded', () => {
    assert.strictEqual(H.youtubeEmbedSrc(''), ''); assert.strictEqual(H.youtubeEmbedSrc(null), ''); assert.strictEqual(H.youtubeEmbedSrc(undefined), '');
    assert.strictEqual(H.youtubeEmbedSrc('abcdef1'), 'https://www.youtube.com/embed/abcdef1?rel=0&modestbranding=1&playsinline=1');
    assert.strictEqual(H.youtubeEmbedSrc('a/b?c"d'), 'https://www.youtube.com/embed/a%2Fb%3Fc%22d?rel=0&modestbranding=1&playsinline=1');
  });

  test('estimateMinutes: estimated_minutes wins (rounded, floored at 1, numeric strings ok); otherwise words/200 rounded up, min 1', () => {
    assert.strictEqual(H.estimateMinutes({ estimated_minutes: 8 }), 8);
    assert.strictEqual(H.estimateMinutes({ estimated_minutes: '7.4' }), 7);
    assert.strictEqual(H.estimateMinutes({ estimated_minutes: 7.5 }), 8);
    assert.strictEqual(H.estimateMinutes({ estimated_minutes: 0 }), 1);
    assert.strictEqual(H.estimateMinutes({ estimated_minutes: -3 }), 1);
    assert.strictEqual(H.estimateMinutes({ estimated_minutes: 4, summary: 'x '.repeat(900) }), 4, 'explicit value beats the word count');
    assert.strictEqual(H.estimateMinutes({ summary: 'x '.repeat(200).trim() }), 1);
    assert.strictEqual(H.estimateMinutes({ summary: 'x '.repeat(201).trim() }), 2);
    assert.strictEqual(H.estimateMinutes({ summary: 'a b', examples: ['c d', '', null], key_terms: ['e'] }), 1);
    assert.strictEqual(H.estimateMinutes({ summary: 'w '.repeat(150).trim(), examples: ['w '.repeat(150).trim()], key_terms: ['w '.repeat(150).trim()] }), 3, 'summary + examples + key_terms are all counted');
  });

  test('estimateMinutes: missing / junk revision -> 1; null, NaN, Infinity and "abc" estimates fall back to the word count', () => {
    assert.strictEqual(H.estimateMinutes(undefined), 1); assert.strictEqual(H.estimateMinutes(null), 1); assert.strictEqual(H.estimateMinutes({}), 1);
    ['abc', NaN, Infinity, null, undefined].forEach((v) => assert.strictEqual(H.estimateMinutes({ estimated_minutes: v, summary: 'x '.repeat(401).trim() }), 3, String(v)));
  });

  test('mediaEntries: strings / objects (url|src, title|label), fallbacks (youtube_url, audio_url), aliases, junk dropped, non-arrays ignored', () => {
    assert.deepStrictEqual(plain(H.mediaEntries({})), { videos: [], audios: [] });
    assert.deepStrictEqual(plain(H.mediaEntries({ video_urls: ['https://a/v1', { url: 'https://a/v2', title: 'T2' }, { src: 'https://a/v3', label: 'L3' }, null, 7, '', { title: 'no url' }] }).videos),
      [{ url: 'https://a/v1', title: '' }, { url: 'https://a/v2', title: 'T2' }, { url: 'https://a/v3', title: 'L3' }]);
    assert.deepStrictEqual(plain(H.mediaEntries({ youtube_url: 'https://youtu.be/abcdef1' }).videos), [{ url: 'https://youtu.be/abcdef1', title: '' }]);
    assert.deepStrictEqual(plain(H.mediaEntries({ audio_url: 'https://a/a.mp3' }).audios), [{ url: 'https://a/a.mp3', title: '' }]);
    assert.deepStrictEqual(plain(H.mediaEntries({ videos: ['https://a/x'] }).videos), [{ url: 'https://a/x', title: '' }]);
    assert.deepStrictEqual(plain(H.mediaEntries({ audios: ['https://a/y'] }).audios), [{ url: 'https://a/y', title: '' }]);
    assert.deepStrictEqual(plain(H.mediaEntries({ video_urls: ['https://a/1'], videos: ['https://a/2'], youtube_url: 'https://a/3' }).videos), [{ url: 'https://a/1', title: '' }], 'video_urls beats videos beats youtube_url');
    assert.deepStrictEqual(plain(H.mediaEntries({ video_urls: ['https://a/1'], youtube_url: 'https://a/3' }).videos), [{ url: 'https://a/1', title: '' }], 'the fallback is only used when the list is empty');
    assert.deepStrictEqual(plain(H.mediaEntries({ video_urls: 'https://a/str' }).videos), [], 'a bare string is not a list');
    assert.deepStrictEqual(plain(H.mediaEntries({ video_urls: 'https://a/str', youtube_url: 'https://a/yt' }).videos), [{ url: 'https://a/yt', title: '' }]);
  });

  test('mediaEntries: PINNED - an EMPTY video_urls array is truthy, so it shadows a populated videos alias (and audio likewise)', () => {
    assert.deepStrictEqual(plain(H.mediaEntries({ video_urls: [], videos: ['https://a/x'] }).videos), []);
    assert.deepStrictEqual(plain(H.mediaEntries({ audio_urls: [], audios: ['https://a/x'] }).audios), []);
    assert.deepStrictEqual(plain(H.mediaEntries({ video_urls: [], youtube_url: 'https://a/yt' }).videos), [{ url: 'https://a/yt', title: '' }], 'the single-url fallback still works');
  });

  test('renderMediaItem: unsafe / missing url -> "not available"; offline -> offline notice; YouTube -> escaped iframe; other video -> <video>; audio -> <audio>', () => {
    const ent = (url, title) => ({ url, title: title || '' });
    const NA = 'This media link is not available.', OFF = 'Media unavailable offline. Continue with the lesson text.';
    ['javascript:alert(1)', 'data:text/html,x', '//evil.example/v', '', 'vbscript:x'].forEach((u) => {
      assert.ok(H.renderMediaItem(ent(u), 'video', 'L', true).includes(NA), u);
      assert.ok(!/<iframe|<video|<audio/.test(H.renderMediaItem(ent(u), 'video', 'L', true)), u);
    });
    assert.ok(H.renderMediaItem(ent('https://a/v'), 'video', 'L', false).includes(OFF));
    assert.ok(H.renderMediaItem(ent('https://a/v.mp3'), 'audio', 'L', false).includes(OFF));
    assert.ok(H.renderMediaItem(ent('javascript:x'), 'audio', 'L', false).includes(NA), 'unsafe wins over offline');
    const yt = H.renderMediaItem(ent('https://youtu.be/abcdef1', 'Intro <b>'), 'video', 'Lesson "1"', true);
    assert.ok(yt.includes('<iframe src="https://www.youtube.com/embed/abcdef1?rel=0&amp;modestbranding=1&amp;playsinline=1"'), yt);
    assert.ok(yt.includes('<h2>Intro &lt;b&gt;</h2>') && yt.includes('title="Intro &lt;b&gt; video"') && yt.includes('loading="lazy"') && yt.includes('allowfullscreen'));
    assert.ok(H.renderMediaItem(ent('https://youtu.be/abcdef1'), 'video', 'Lesson "1"', true).includes('title="Lesson &quot;1&quot; video"'), 'falls back to the lesson title');
    assert.ok(H.renderMediaItem(ent('https://youtu.be/abcdef1'), 'video', 'L', true).includes('<h2>Video</h2>'));
    const v = H.renderMediaItem(ent('https://cdn.example/a.mp4?x=1&y="2"'), 'video', 'L', true);
    assert.ok(v.includes('<video controls') && v.includes('src="https://cdn.example/a.mp4?x=1&amp;y=&quot;2&quot;"'), v);
    const a = H.renderMediaItem(ent('https://cdn.example/a.mp3', 'Listen'), 'audio', 'L', true);
    assert.ok(a.includes('<audio controls') && a.includes('<h2>Listen</h2>') && a.includes('src="https://cdn.example/a.mp3"'));
    assert.ok(H.renderMediaItem(ent('https://cdn.example/a.mp3'), 'audio', 'L', true).includes('<h2>Audio lesson</h2>'));
    assert.ok(H.renderMediaItem(ent('javascript:x'), 'audio', 'L', true).includes('<h2>Audio</h2>'));
    assert.ok(H.renderMediaItem(ent('javascript:x'), 'video', 'L', true).includes('<h2>Video</h2>'));
  });

  test('renderMediaItem: without safe-url.js every media item fails closed', () => {
    const h = makeHelpers({ noSafeUrl: true });
    assert.ok(h.renderMediaItem({ url: 'https://youtu.be/abcdef1', title: '' }, 'video', 'L', true).includes('This media link is not available.'));
  });

  test('quizUrl: required parts always encoded; redirect / course / unit_title / lesson only when given', () => {
    assert.strictEqual(H.quizUrl('a1-001', 'a1'), '../shared/quiz.html?quiz=a1-001&level=a1');
    assert.strictEqual(H.quizUrl('a b&c', 'a1', '../courses/lesson.html?lesson=x&slide=practice', 'Course & Co', 'Unit "1"', 'course-a1-unit-01-lesson-01'),
      '../shared/quiz.html?quiz=a%20b%26c&level=a1&redirect=..%2Fcourses%2Flesson.html%3Flesson%3Dx%26slide%3Dpractice&course=Course%20%26%20Co&unit_title=Unit%20%221%22&lesson=course-a1-unit-01-lesson-01');
    assert.strictEqual(H.quizUrl('q', 'a1', '', '', '', ''), '../shared/quiz.html?quiz=q&level=a1');
    assert.strictEqual(H.quizUrl('q', 'a1', null, 'C', null, null), '../shared/quiz.html?quiz=q&level=a1&course=C');
    assert.strictEqual(H.quizUrl('q', 'a1', null, null, 'U', null), '../shared/quiz.html?quiz=q&level=a1&unit_title=U');
    assert.strictEqual(H.quizUrl('q', 'a1', null, null, null, 'L'), '../shared/quiz.html?quiz=q&level=a1&lesson=L');
  });

  test('quizUrl: the shipped quiz.html understands every parameter the lesson page sends', () => {
    const quiz = read('shared', 'quiz.html');
    ['quiz', 'level', 'redirect', 'course', 'unit_title', 'lesson'].forEach((k) => assert.ok(new RegExp("get\\(['\"]" + k + "['\"]\\)").test(quiz), 'quiz.html never reads ?' + k));
  });

  test('renderError: clears the chapter trail, escapes the message, always offers both escape links', () => {
    H.els.chapterTrail.innerHTML = '<button>x</button>';
    H.renderError('Nope <script>alert(1)</script> & "co"');
    assert.strictEqual(H.els.chapterTrail.innerHTML, '');
    const c = H.els.content.innerHTML;
    assert.strictEqual(H.els.content.querySelector('p').textContent, 'Nope <script>alert(1)</script> & "co"');
    assert.ok(c.includes('Nope &lt;script&gt;alert(1)&lt;/script&gt; &amp;'), c);
    assert.ok(c.includes('<a href="./index.html">Back to all courses</a>') && c.includes('<a href="../main/index.html">find my level</a>'));
    assert.strictEqual(H.els.content.querySelectorAll('script').length, 0);
  });

  // ================= sanitizeHtml =================
  const san = (h) => H.sanitizeHtml(h);
  test('sanitizeHtml: empty / non-string -> ""; allowed formatting passes through unchanged', () => {
    assert.strictEqual(san(''), ''); assert.strictEqual(san(null), ''); assert.strictEqual(san(undefined), ''); assert.strictEqual(san(42), ''); assert.strictEqual(san({}), '');
    const ok = '<h2>T</h2><p>a <strong>b</strong> <em>c</em> <b>d</b> <i>e</i><br></p><ul><li>x</li></ul><ol><li>y</li></ol><blockquote>q</blockquote><pre><code>c</code></pre><h3>h3</h3><h4>h4</h4>';
    assert.strictEqual(san(ok), ok);
    assert.strictEqual(san('plain &amp; text'), 'plain &amp; text');
  });

  test('sanitizeHtml: script / style / iframe / form / svg / table / object are dropped WITH their content', () => {
    assert.strictEqual(san('a<script>alert(1)</script>b'), 'ab');
    assert.strictEqual(san('a<style>p{}</style>b'), 'ab');
    assert.strictEqual(san('a<iframe src="https://x"></iframe>b'), 'ab');
    assert.strictEqual(san('a<form action="/x"><input name="q"></form>b'), 'ab');
    assert.strictEqual(san('a<svg onload="x()"><circle/></svg>b'), 'ab');
    assert.strictEqual(san('a<object data="x"></object><embed src="x">b'), 'ab');
    assert.strictEqual(san('<p>one<script>x</script>two</p>'), '<p>onetwo</p>');
    assert.strictEqual(san('a<!-- hidden -->b'), 'ab', 'comments are dropped');
    assert.strictEqual(san('<table><tr><td>cell text</td></tr></table>'), '', 'PINNED (cosmetic): table markup is not allow-listed and its text is lost, not unwrapped');
  });

  test('sanitizeHtml: event handlers, style, id, target and other attributes are stripped; class survives only on div / span', () => {
    assert.strictEqual(san('<p onclick="x()" style="color:red" id="i" class="c" data-x="1">t</p>'), '<p>t</p>');
    assert.strictEqual(san('<div class="box" onmouseover="x()">t</div>'), '<div class="box">t</div>');
    assert.strictEqual(san('<span class="k" style="x">t</span>'), '<span class="k">t</span>');
    assert.strictEqual(san('<img src="/i.png" alt="pic" onerror="x()" width="9">'), '<img src="/i.png" alt="pic">');
    assert.strictEqual(san('<a href="https://ok.example" title="tt" target="_blank" rel="x" onclick="x()">l</a>'), '<a href="https://ok.example" title="tt">l</a>');
    assert.strictEqual(san('<b OnClick="x()">t</b>'), '<b>t</b>');
  });

  test('sanitizeHtml: href / src must start with http(s):, mailto: or "/" - javascript:, data:, vbscript:, relative and blank-led values are removed (the tag itself stays)', () => {
    assert.strictEqual(san('<a href="javascript:alert(1)">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<a href="JaVaScRiPt:alert(1)">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<a href=" javascript:alert(1)">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<a href="data:text/html,x">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<a href="vbscript:x">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<a href="../x.html">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<a href="page.html">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<a href="#frag">l</a>'), '<a>l</a>');
    assert.strictEqual(san('<img src="data:image/png;base64,AAAA" alt="x">'), '<img alt="x">');
    assert.strictEqual(san('<img src="javascript:x">'), '<img>');
    assert.strictEqual(san('<a href="http://a.example/p?q=1&r=2">l</a>'), '<a href="http://a.example/p?q=1&amp;r=2">l</a>');
    assert.strictEqual(san('<a href="HTTPS://A.EXAMPLE">l</a>'), '<a href="HTTPS://A.EXAMPLE">l</a>');
    assert.strictEqual(san('<a href="mailto:me@x.example">l</a>'), '<a href="mailto:me@x.example">l</a>');
    assert.strictEqual(san('<a href="/local/page">l</a>'), '<a href="/local/page">l</a>');
    assert.strictEqual(san('<a href>l</a>'), '<a>l</a>', 'an empty href is dropped');
  });

  test('sanitizeHtml: PINNED - protocol-relative and backslash-led URLs pass the "starts with /" test (href and img src); content is first-party, so latent', () => {
    assert.strictEqual(san('<a href="//evil.example/x">l</a>'), '<a href="//evil.example/x">l</a>');
    assert.strictEqual(san('<a href="/\\evil.example">l</a>'), '<a href="/\\evil.example">l</a>');
    assert.strictEqual(san('<img src="//tracker.example/p.png" alt="">'), '<img src="//tracker.example/p.png" alt="">');
  });

  test('sanitizeHtml: an early </div> ends the wrapper, so everything after it is dropped (same in browsers); nesting and text are otherwise preserved', () => {
    assert.strictEqual(san('before</div><p>after</p>'), 'before');
    assert.strictEqual(san('<div><p>ok</p></div>'), '<div><p>ok</p></div>');
    assert.strictEqual(san('<p>a &lt;script&gt; b</p>'), '<p>a &lt;script&gt; b</p>', 'escaped text stays text');
    assert.strictEqual(san('<p><a href="https://x.example"><strong>deep <script>x</script>link</strong></a></p>'), '<p><a href="https://x.example"><strong>deep link</strong></a></p>');
  });

  test('sanitizeHtml: every shipped lesson body / chapter comes out free of script, handler and javascript: content, and formatting is not lost', () => {
    let n = 0;
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => JSON.parse(read('course_content', 'lessons', l + '.json')).forEach((lesson) => {
      [lesson.body_content].concat((lesson.chapters || []).map((c) => c.body_content || c.html || c.body)).filter(Boolean).forEach((body) => {
        const out = san(String(body)); n++;
        assert.ok(!/<(script|style|iframe|form|svg|object|embed)/i.test(out) && !/\son[a-z]+\s*=/i.test(out) && !/javascript:/i.test(out), lesson.lesson_id);
        assert.ok(out.length > 0, lesson.lesson_id + ' sanitised to nothing');
      });
    }));
    assert.ok(n >= 1, 'expected at least one shipped rich body');
  });

  // ================= the page, run for real =================
  testAsync('page: no ?lesson= -> "No lesson was specified." and nothing is fetched', async () => {
    const p = await runPage({ search: '' });
    assert.strictEqual(p.err(), 'No lesson was specified.Back to all courses or find my level.');
    assert.deepStrictEqual(p.fetches, []);
    const p2 = await runPage({ search: '?lesson=' });
    assert.ok(p2.err().startsWith('No lesson was specified.'));
  });

  testAsync('page: a convention lesson id goes straight to its own level file (never the monolith), then courses, units and that level\'s quizzes', async () => {
    const p = await runPage();
    assert.deepStrictEqual(p.fetches.slice(0, 1), ['../course_content/lessons/a1.json']);
    assert.deepStrictEqual(p.fetches.slice().sort(), ['../a1/quizzes.json', '../course_content/courses.json', '../course_content/lessons/a1.json', '../course_content/units.json']);
    assert.strictEqual(p.err(), null);
    assert.ok(p.content.includes('<h1>Lesson 1</h1>'));
    assert.strictEqual(p.sb.document.title, 'Mylingo \u00b7 Lesson 1');
  });

  testAsync('page: an id that breaks the naming convention uses ?level=; an invalid ?level= is ignored; with no hint every level file is scanned in order until one hits', async () => {
    const odd = mkLesson(1, { lesson_id: 'legacy-lesson-x' });
    const lessonsB1 = [odd];
    const files = mkFiles({ '../course_content/lessons/b1.json': lessonsB1, '../b1/quizzes.json': [], '../course_content/units.json': [{ unit_id: U1, course_id: 'course-a1', title: 'Unit One' }] });
    const p = await runPage({ search: '?lesson=legacy-lesson-x&level=b1', files });
    assert.strictEqual(p.fetches[0], '../course_content/lessons/b1.json');
    assert.ok(p.content.includes('<h1>Lesson 1</h1>'), p.err());
    const p2 = await runPage({ search: '?lesson=legacy-lesson-x&level=zz', files });
    assert.deepStrictEqual(p2.fetches.slice(0, 4), ['../course_content/lessons/a1.json', '../course_content/lessons/a2.json', '../course_content/lessons/b1.json', '../course_content/lessons/b1.json'.replace('b1', 'b1')].slice(0, 3).concat([p2.fetches[3]]));
    assert.ok(p2.content.includes('<h1>Lesson 1</h1>'), 'found by scanning: ' + p2.err());
    const p3 = await runPage({ search: '?lesson=legacy-lesson-x', files: mkFiles() });
    assert.strictEqual(p3.err().indexOf(ERR_UNAVAILABLE), 0);
    assert.strictEqual(p3.fetches.filter((u) => /lessons\/(a1|a2|b1|b2|c1|c2)\.json$/.test(u)).length, 6, 'all six level files were tried');
  });

  testAsync('page: a convention id whose level file is missing falls back to scanning the other levels', async () => {
    const lesson = mkLesson(1, { lesson_id: 'course-c2-unit-01-lesson-01' });
    const files = mkFiles({ '../course_content/lessons/a1.json': undefined, '../course_content/lessons/c2.json': 'throw', '../course_content/lessons/b2.json': [lesson], '../b2/quizzes.json': [] });
    const p = await runPage({ search: '?lesson=course-c2-unit-01-lesson-01', files });
    assert.ok(p.content.includes('<h1>Lesson 1</h1>'), p.err());
    assert.ok(p.fetches.indexOf('../course_content/lessons/b2.json') >= 0);
  });

  testAsync('page: unpublished lesson, missing unit, unpublished / missing course -> "isn\u2019t available yet"', async () => {
    const mk = (mut) => { const f = mkFiles(); mut(f); return f; };
    const cases = {
      unpublished: mk((f) => { f['../course_content/lessons/a1.json'][0].status = 'draft'; }),
      noUnit: mk((f) => { f['../course_content/units.json'] = []; }),
      courseDraft: mk((f) => { f['../course_content/courses.json'][0].status = 'draft'; }),
      noCourse: mk((f) => { f['../course_content/courses.json'] = []; }),
      wrongUnitCourse: mk((f) => { f['../course_content/units.json'][0].course_id = 'other'; }),
      notInFile: mk((f) => { f['../course_content/lessons/a1.json'] = [mkLesson(2)]; }),
    };
    for (const k of Object.keys(cases)) {
      const p = await runPage({ files: cases[k] });
      assert.strictEqual(p.err().indexOf(ERR_UNAVAILABLE), 0, k + ': ' + p.err());
      assert.strictEqual(p.els.playerNav.innerHTML, '', k + ': no nav bar on an error page');
    }
  });

  testAsync('page: any fetch failure of courses.json / units.json, or malformed data, ends in the generic "isn\u2019t available right now"', async () => {
    const NOW = 'This lesson isn\u2019t available right now.';
    for (const u of ['../course_content/courses.json', '../course_content/units.json']) {
      const p = await runPage({ files: mkFiles({ [u]: 'throw' }) });
      assert.strictEqual(p.err().indexOf(NOW), 0, u);
      const p2 = await runPage({ files: mkFiles({ [u]: undefined }) });
      assert.strictEqual(p2.err().indexOf(NOW), 0, u + ' 404');
    }
    const bad = mkFiles(); bad['../course_content/lessons/a1.json'][0].revision = { examples: 5 };
    const p3 = await runPage({ files: bad });
    assert.strictEqual(p3.err().indexOf(NOW), 0, 'a render-time TypeError is caught by the outer chain: ' + p3.err());
  });

  testAsync('page: sequential gate - the first lesson is open, a later one needs the PREVIOUS lesson\'s quizzes mastered (90% of them), and says which lesson to finish', async () => {
    const id2 = 'course-a1-unit-01-lesson-02';
    const locked = await runPage({ search: '?lesson=' + id2 });
    assert.ok(locked.err().startsWith('Finish the previous lesson first. Complete and pass \u201cLesson 1\u201d to unlock this lesson.'), locked.err());
    assert.strictEqual(locked.els.playerNav.innerHTML, '');
    assert.ok(!locked.fetches.includes('../a1/quizzes.json'), 'no quiz fetch behind the gate');
    const half = await runPage({ search: '?lesson=' + id2, storage: { 'mylingo.progress.v1': passed(['q1a']) } });
    assert.ok(half.err() && half.err().startsWith('Finish the previous lesson first'), '1 of 2 = 50% < 90%');
    const weak = await runPage({ search: '?lesson=' + id2, storage: { 'mylingo.progress.v1': JSON.stringify({ q1a: { status: 'completed', best: 59 }, q1b: { status: 'completed', best: 100 } }) } });
    assert.ok(weak.err(), 'best 59 is below the 60% mastery bar');
    const ok = await runPage({ search: '?lesson=' + id2, storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b']) } });
    assert.strictEqual(ok.err(), null); assert.ok(ok.content.includes('<h1>Lesson 2</h1>'));
    const third = await runPage({ search: '?lesson=course-a1-unit-01-lesson-03', storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b']) } });
    assert.ok(third.err().includes('\u201cLesson 2\u201d'), 'lesson 3 needs lesson 2, not lesson 1');
  });

  testAsync('page: the gate order is unit_id (string compare) then order, and a lesson only ever needs its predecessor in ITS OWN level file', async () => {
    const files = mkFiles();
    const l = files['../course_content/lessons/a1.json'];
    l.push(mkLesson(1, { lesson_id: 'course-a1-unit-02-lesson-01', unit_id: U2, title: 'Unit2 First', order: 1, exercise_quiz_ids: ['u2q'] }));
    l.unshift(mkLesson(9, { lesson_id: 'course-a1-unit-01-lesson-09', title: 'Ninth', order: 9 }));
    const first = await runPage({ files, search: '?lesson=course-a1-unit-01-lesson-01' });
    assert.strictEqual(first.err(), null, 'order 1 in unit 01 is the first');
    const u2 = await runPage({ files, search: '?lesson=course-a1-unit-02-lesson-01', storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b', 'q2a', 'q2b', 'q3a', 'q3b']) } });
    assert.ok(u2.err().includes('\u201cNinth\u201d'), 'unit 02 needs the LAST lesson of unit 01 (order 9): ' + u2.err());
    const u2ok = await runPage({ files, search: '?lesson=course-a1-unit-02-lesson-01', storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b', 'q2a', 'q2b', 'q3a', 'q3b', 'q9a', 'q9b']) } });
    assert.strictEqual(u2ok.err(), null);
    const draft = mkFiles(); draft['../course_content/lessons/a1.json'][0].status = 'draft';
    const skip = await runPage({ files: draft, search: '?lesson=course-a1-unit-01-lesson-02' });
    assert.strictEqual(skip.err(), null, 'unpublished lessons are not part of the chain, so lesson 2 becomes the first');
  });

  testAsync('page: level lock - a locked level shows the lock message; unlocked / unset levels pass', async () => {
    const lockedA = await runPage({ storage: { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) } });
    assert.strictEqual(lockedA.err(), null, 'a1 is at/below an a1 ceiling');
    const files = mkFiles();
    const b1 = mkLesson(1, { lesson_id: 'course-b1-unit-01-lesson-01' });
    files['../course_content/lessons/b1.json'] = [b1]; files['../b1/quizzes.json'] = [];
    const s = { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) };
    const locked = await runPage({ files, search: '?lesson=course-b1-unit-01-lesson-01', storage: s });
    assert.ok(locked.err().startsWith('This level is locked. Reach it from your current level to unlock it, or find your level first.'), locked.err());
    assert.ok(!locked.fetches.includes('../b1/quizzes.json'));
    const open = await runPage({ files, search: '?lesson=course-b1-unit-01-lesson-01' });
    assert.strictEqual(open.err(), null, 'no chosen level -> nothing locked');
    const noLock = await runPage({ files, search: '?lesson=course-b1-unit-01-lesson-01', storage: s, modules: ['cp', 'su'] });
    assert.strictEqual(noLock.err(), null, 'PINNED (carry-forward item 1): without level-lock.js the page fails OPEN');
  });

  testAsync('page: PINNED - ?level= overrides the level read from the lesson id, so the lock check runs against the URL\'s level (a hand-edited ?level=a1 opens a locked b1 lesson)', async () => {
    const files = mkFiles();
    files['../course_content/lessons/b1.json'] = [mkLesson(1, { lesson_id: 'course-b1-unit-01-lesson-01' })]; files['../b1/quizzes.json'] = []; files['../a1/quizzes.json'] = [];
    const s = { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) };
    const p = await runPage({ files, search: '?lesson=course-b1-unit-01-lesson-01&level=a1', storage: s });
    assert.strictEqual(p.err(), null);
    assert.ok(p.fetches.includes('../a1/quizzes.json') && !p.fetches.includes('../b1/quizzes.json'), 'quiz metadata is also read from the URL level');
    assert.ok(p.content.includes('<h1>Lesson 1</h1>'));
    assert.ok(p.content.indexOf('level=a1') >= 0, 'quiz links inherit the URL level');
  });

  testAsync('page: PINNED - the previous-lesson gate is checked BEFORE the level lock, so a locked-level learner deep in a level sees the "finish previous" message', async () => {
    const files = mkFiles();
    files['../course_content/lessons/b1.json'] = [mkLesson(1, { lesson_id: 'course-b1-unit-01-lesson-01' }), mkLesson(2, { lesson_id: 'course-b1-unit-01-lesson-02' })]; files['../b1/quizzes.json'] = [];
    const s = { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) };
    const p = await runPage({ files, search: '?lesson=course-b1-unit-01-lesson-02', storage: s });
    assert.ok(p.err().startsWith('Finish the previous lesson first'));
  });

  testAsync('page: without course-progress.js every NON-first lesson is locked (fails closed) while the first still opens', async () => {
    const p2 = await runPage({ search: '?lesson=course-a1-unit-01-lesson-02', modules: ['ll', 'su'] });
    assert.ok(p2.err().startsWith('Finish the previous lesson first'));
    const p1 = await runPage({ modules: ['ll', 'su'] });
    assert.strictEqual(p1.err(), null);
    assert.ok(p1.nav.includes('Continue'));
  });

  testAsync('page: the quiz-list fetch failing is not fatal - the deck renders with quiz ids as titles and no question counts', async () => {
    const p = await runPage({ files: mkFiles({ '../a1/quizzes.json': 'throw' }), search: '?lesson=course-a1-unit-01-lesson-01&slide=practice' });
    assert.strictEqual(p.err(), null);
    assert.ok(p.content.includes('<h3>q1a</h3>') && p.content.includes('<h3>q1b</h3>'));
    assert.ok(!/<small>/.test(p.content));
  });

  testAsync('page: header - level badge, course, unit, category chip (hidden when it equals the unit title, case/space-insensitively), reading time, Skip-revision link', async () => {
    const p = await runPage();
    const c = p.content;
    assert.ok(c.includes('<span class="lvl-badge">A1</span><span>Course A1</span><span class="sep">\u00b7</span><span class="unit-name">Unit One</span>'), c);
    assert.ok(c.includes('<span class="chip">Grammar</span>'));
    assert.ok(/~5 min read/.test(c));
    const skip = p.els.content.querySelector('.skipbtn');
    assert.strictEqual(skip.getAttribute('href'), '../shared/quiz.html?quiz=q1a&level=a1&redirect=..%2Fcourses%2Flesson.html%3Flesson%3Dcourse-a1-unit-01-lesson-01%26level%3Da1%26slide%3Dpractice&course=Course%20A1&unit_title=Unit%20One&lesson=course-a1-unit-01-lesson-01');
    const same = mkFiles(); same['../course_content/lessons/a1.json'][0].category = '  UNIT one ';
    assert.ok(!/class="chip"/.test((await runPage({ files: same })).content), 'category == unit title (trim + case) -> no chip');
    const none = mkFiles(); delete none['../course_content/lessons/a1.json'][0].category;
    assert.ok(!/class="chip"/.test((await runPage({ files: none })).content), 'no category -> no chip');
    const noEx = mkFiles(); noEx['../course_content/lessons/a1.json'][0].exercise_quiz_ids = []; delete noEx['../course_content/lessons/a1.json'][0].category;
    const pe = await runPage({ files: noEx });
    assert.strictEqual(pe.els.content.querySelector('.skipbtn'), null, 'no exercises -> no Skip revision link');
    assert.ok(pe.content.includes('<span></span>'));
  });

  testAsync('page: every dynamic header / body value is HTML-escaped (course, unit, title, category, summary, examples, key terms)', async () => {
    const files = mkFiles();
    const X = '<img src=x onerror=alert(1)>';
    files['../course_content/courses.json'][0].title = 'C ' + X;
    files['../course_content/units.json'][0].title = 'U ' + X;
    const L = files['../course_content/lessons/a1.json'][0];
    Object.assign(L, { title: 'T ' + X, category: 'K ' + X, revision: { summary: 'S ' + X, examples: ['E ' + X], key_terms: ['KT ' + X] } });
    const p = await runPage({ files });
    assert.strictEqual(p.err(), null);
    assert.strictEqual(p.els.content.querySelectorAll('img').length, 0, 'no element was injected');
    assert.ok(!/onerror=alert/.test(p.content.replace(/&lt;img src=x onerror=alert\(1\)&gt;/g, '')), 'the payload only appears escaped');
    assert.ok(p.content.includes('Summary') === false && p.content.includes('S &lt;img'));
    assert.ok(p.content.includes('<li>E &lt;img') && p.content.includes('<span class="term">KT &lt;img'));
    assert.strictEqual(p.sb.document.title, 'Mylingo \u00b7 T ' + X, 'document.title is text, not markup');
  });

  testAsync('page: revision-only lesson - "Quick revision" summary, Examples and Key terms cards; blanks filtered; empty summary shows the placeholder', async () => {
    const p = await runPage();
    assert.ok(p.content.includes('<h2>Quick revision</h2><p class="summary">Summary 1</p>'));
    assert.ok(p.content.includes('<h2>Examples</h2><ul class="examples"><li>ex 1</li></ul>'));
    assert.ok(p.content.includes('<h2>Key terms</h2><div class="terms"><span class="term">term 1</span></div>'));
    const f = mkFiles(); f['../course_content/lessons/a1.json'][0].revision = { summary: '   ', examples: ['', null, 'kept'], key_terms: [] };
    const p2 = await runPage({ files: f });
    assert.ok(p2.content.includes('No revision notes yet for this lesson'));
    assert.ok(p2.content.includes('<li>kept</li>') && !p2.content.includes('<li></li>') && !p2.content.includes('Key terms'));
    const f3 = mkFiles(); delete f3['../course_content/lessons/a1.json'][0].revision;
    const p3 = await runPage({ files: f3 });
    assert.ok(p3.content.includes('No revision notes yet') && p3.content.includes('~1 min read') && !p3.content.includes('Examples'));
  });

  testAsync('page: body_content lesson - one text slide, sanitised, revision cards NOT shown; blank body falls back to the revision cards', async () => {
    const f = mkFiles();
    f['../course_content/lessons/a1.json'][0].body_content = '<h2>Rich</h2><p onclick="x()">Hello <script>bad()</script><a href="javascript:x">l</a></p>';
    const p = await runPage({ files: f });
    assert.ok(p.content.includes('<div class="lesson-content"><h2>Rich</h2><p>Hello <a>l</a></p></div>'), p.content);
    assert.ok(!p.content.includes('Quick revision'));
    assert.strictEqual(p.items().length, 2, 'Lesson + Practice');
    const f2 = mkFiles(); f2['../course_content/lessons/a1.json'][0].body_content = '   ';
    assert.ok((await runPage({ files: f2 })).content.includes('Quick revision'));
  });

  testAsync('page: chapters[] - one slide per non-empty chapter (body_content | html | body), titles or "Chapter N", each sanitised; chapters win over body_content', async () => {
    const f = mkFiles();
    Object.assign(f['../course_content/lessons/a1.json'][0], {
      body_content: '<p>IGNORED</p>',
      chapters: [{ title: 'One <b>', body_content: '<p>c1</p>' }, { html: '<p>c2<script>x</script></p>' }, { body: '<p>c3</p>' }, { title: 'Empty', body_content: '  ' }, null, { title: 'NoBody' }],
    });
    const p = await runPage({ files: f });
    const labels = p.items().map((b) => b.querySelectorAll('span')[2].textContent);
    assert.deepStrictEqual(labels, ['One <b>', 'Chapter 2', 'Chapter 3', 'Practice']);
    assert.ok(p.content.includes('<p>c1</p>') && !p.content.includes('IGNORED'));
    await p.next(); assert.ok(p.content.includes('<p>c2</p>') && !p.content.includes('<script'));
    assert.strictEqual(p.items()[0].getAttribute('aria-label'), 'Slide 1 of 4: One <b>', 'the label is escaped in markup and decoded back to plain text');
  });

  testAsync('page: deck order is text -> videos -> audios -> practice, kinds drive the trail icons, media labels default to "Video N" / "Audio N"', async () => {
    const f = mkFiles();
    Object.assign(f['../course_content/lessons/a1.json'][0], { video_urls: ['https://youtu.be/abcdef1', { url: 'https://cdn.example/v.mp4', title: 'Clip' }], audio_urls: ['https://cdn.example/a.mp3'] });
    const p = await runPage({ files: f });
    const its = p.items();
    assert.deepStrictEqual(its.map((b) => b.querySelectorAll('span')[1].textContent), ['T', '\u25b6', '\u25b6', '\u25d6', '\u2713']);
    assert.deepStrictEqual(its.map((b) => b.querySelectorAll('span')[2].textContent), ['Lesson', 'Video 1', 'Clip', 'Audio 1', 'Practice']);
    await p.next();
    assert.ok(p.content.includes('<iframe src="https://www.youtube.com/embed/abcdef1'), p.content);
    await p.next(); assert.ok(p.content.includes('<video controls') && p.content.includes('<h2>Clip</h2>'));
    await p.next(); assert.ok(p.content.includes('<audio controls'));
  });

  testAsync('page: media offline (navigator.onLine === false) shows the offline notice; missing navigator.onLine counts as online; unsafe urls never embed', async () => {
    const f = mkFiles(); Object.assign(f['../course_content/lessons/a1.json'][0], { video_urls: ['https://youtu.be/abcdef1'] });
    const off = await runPage({ files: f, onLine: false }); await off.next();
    assert.ok(off.content.includes('Media unavailable offline.') && !off.content.includes('<iframe'));
    const unk = await runPage({ files: f, onLine: 'absent' }); await unk.next();
    assert.ok(unk.content.includes('<iframe'));
    const g = mkFiles(); Object.assign(g['../course_content/lessons/a1.json'][0], { video_urls: ['javascript:alert(1)'] });
    const bad = await runPage({ files: g }); await bad.next();
    assert.ok(bad.content.includes('This media link is not available.') && !/<iframe|<video/.test(bad.content));
    const noSu = await runPage({ files: f, modules: ['ll', 'cp'] }); await noSu.next();
    assert.ok(noSu.content.includes('This media link is not available.'), 'no safe-url.js -> fail closed');
  });

  testAsync('page: the window "offline" event swaps a rendered video wrapper for the offline notice, and does nothing when none is on screen', async () => {
    const f = mkFiles(); Object.assign(f['../course_content/lessons/a1.json'][0], { video_urls: ['https://youtu.be/abcdef1'] });
    const p = await runPage({ files: f }); await p.next();
    assert.ok(p.els.content.querySelector('.video-wrap'));
    assert.strictEqual(p.listeners.offline.length, 1);
    await p.fire('offline');
    assert.strictEqual(p.els.content.querySelector('.video-wrap'), null);
    assert.ok(p.content.includes('<div class="video-fallback">Video unavailable offline. Read the quick revision instead.</div>'));
    const q = await runPage(); const before = q.content; await q.fire('offline'); assert.strictEqual(q.content, before);
  });

  testAsync('page: practice slide - one card per exercise with title / question count (pluralised), passed state from stored progress, and a quiz link that returns to the practice slide', async () => {
    const f = mkFiles(); f['../a1/quizzes.json'] = [{ id: 'q1a', title: 'Quiz <A>', questions: 1 }, { id: 'q1b', title: 'Quiz B', questions: 12 }];
    const p = await runPage({ files: f, search: '?lesson=course-a1-unit-01-lesson-01&slide=practice', storage: { 'mylingo.progress.v1': passed(['q1a']) } });
    const cards = p.els.content.querySelectorAll('.exercise-card');
    assert.strictEqual(cards.length, 2);
    assert.ok(cards[0].className.split(/\s+/).includes('passed') && !cards[1].className.split(/\s+/).includes('passed'));
    assert.strictEqual(cards[0].querySelector('h3').textContent, 'Quiz <A>');
    assert.strictEqual(cards[0].querySelector('small').textContent, '1 question');
    assert.strictEqual(cards[1].querySelector('small').textContent, '12 questions');
    assert.ok(cards[0].querySelectorAll('span')[0].getAttribute('aria-label') === 'Passed' && cards[1].querySelectorAll('span')[0].getAttribute('aria-label') === 'Not passed');
    assert.ok(cards[0].textContent.includes('\u2713') && cards[1].textContent.includes('\u25cb'));
    assert.strictEqual(cards[0].getAttribute('href'), '../shared/quiz.html?quiz=q1a&level=a1&redirect=..%2Fcourses%2Flesson.html%3Flesson%3Dcourse-a1-unit-01-lesson-01%26level%3Da1%26slide%3Dpractice&course=Course%20A1&unit_title=Unit%20One&lesson=course-a1-unit-01-lesson-01');
    assert.ok(p.content.includes('Pass 90% of these quizzes to unlock the next lesson.'));
  });

  testAsync('page: a lesson with no exercises shows the placeholder card and its last slide can never be passed', async () => {
    const f = mkFiles(); f['../course_content/lessons/a1.json'][0].exercise_quiz_ids = [];
    const p = await runPage({ files: f, search: '?lesson=course-a1-unit-01-lesson-01&slide=practice' });
    assert.ok(p.content.includes('No exercises are linked to this lesson yet.'));
    const n = p.btn('navNext');
    assert.strictEqual(n.tagName, 'BUTTON'); assert.strictEqual(n.getAttribute('disabled'), '');
  });

  testAsync('page: ?slide=practice opens on the practice slide; any other / unknown value opens slide 1', async () => {
    assert.ok((await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=practice' })).content.includes('Practice in this lesson'));
    assert.ok((await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=lesson' })).content.includes('Quick revision'));
    assert.ok((await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=video-0' })).content.includes('Quick revision'));
    assert.ok((await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=PRACTICE' })).content.includes('Quick revision'), 'case-sensitive');
  });

  testAsync('page: navigation - Continue / Back move one slide, the trail marks active + done, aria-selected follows, every move scrolls to top', async () => {
    const f = mkFiles(); Object.assign(f['../course_content/lessons/a1.json'][0], { audio_urls: ['https://cdn.example/a.mp3'] });
    const p = await runPage({ files: f });
    assert.strictEqual(p.btn('navBack'), null); assert.strictEqual(p.btn('navNext').textContent, 'Continue');
    assert.strictEqual(p.items().length, 3);
    const st = () => p.items().map((b) => (b.className.includes('active') ? 'A' : b.className.includes('done') ? 'D' : '-') + b.getAttribute('aria-selected')).join(' ');
    assert.strictEqual(st(), 'Atrue -false -false');
    await p.next(); assert.strictEqual(st(), 'Dfalse Atrue -false'); assert.ok(p.btn('navBack'));
    await p.next(); assert.strictEqual(st(), 'Dfalse Dfalse Atrue');
    await p.back(); assert.strictEqual(st(), 'Dfalse Atrue -false', 'going back un-marks the slide you left');
    assert.ok(p.scrolls.length >= 4 && p.scrolls.every((s) => s.top === 0 && s.behavior === 'smooth'));
    await p.back(); assert.strictEqual(p.btn('navBack'), null, 'no Back on the first slide');
  });

  testAsync('page: chapter-trail clicks only reach slides already visited (idx <= furthest reached)', async () => {
    const f = mkFiles(); Object.assign(f['../course_content/lessons/a1.json'][0], { audio_urls: ['https://cdn.example/a.mp3'] });
    const p = await runPage({ files: f });
    p.items()[2].click(); await settle();
    assert.ok(p.content.includes('Quick revision'), 'jumping ahead is ignored');
    await p.next(); await p.next();
    assert.ok(p.content.includes('Practice in this lesson'));
    p.items()[0].click(); await settle();
    assert.ok(p.content.includes('Quick revision'), 'jumping back is allowed');
    p.items()[2].click(); await settle();
    assert.ok(p.content.includes('Practice in this lesson'), 'and forward again to anything already reached');
  });

  testAsync('page: opening straight on ?slide=practice counts practice as reached, so every earlier slide is reachable from the trail', async () => {
    const p = await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=practice' });
    p.items()[0].click(); await settle();
    assert.ok(p.content.includes('Quick revision'));
    p.items()[1].click(); await settle();
    assert.ok(p.content.includes('Practice in this lesson'));
  });

  testAsync('page: last slide - Continue is a DISABLED "Pass lesson & continue" button until the lesson is complete; nothing else can advance', async () => {
    const p = await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=practice' });
    const n = p.btn('navNext');
    assert.strictEqual(n.tagName, 'BUTTON'); assert.strictEqual(n.getAttribute('disabled'), '');
    assert.strictEqual(n.textContent, 'Pass lesson & continue');
    assert.strictEqual(n.getAttribute('title'), 'Pass 90% of lesson quizzes first');
    assert.ok(p.btn('navBack'));
    const before = p.content; n.click(); await settle(); assert.strictEqual(p.content, before, 'a click on the disabled control does nothing');
  });

  testAsync('page: completed lesson -> the last slide becomes a link to the NEXT lesson ("Pass lesson & continue"), with the level and slide=lesson', async () => {
    const p = await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=practice', storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b']) } });
    const n = p.btn('navNext');
    assert.strictEqual(n.tagName, 'A');
    assert.strictEqual(n.getAttribute('href'), '../courses/lesson.html?lesson=course-a1-unit-01-lesson-02&level=a1&slide=lesson');
    assert.strictEqual(n.textContent, 'Pass lesson & continue');
    assert.ok(p.fetches.filter((u) => u === '../course_content/lessons/a1.json').length >= 2, 'the level list is re-read by refreshCompletionGate');
  });

  testAsync('page: completed FINAL lesson -> "Finish lesson" links back to the course unit page', async () => {
    const p = await runPage({ search: '?lesson=course-a1-unit-01-lesson-03&slide=practice', storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b', 'q2a', 'q2b', 'q3a', 'q3b']) } });
    const n = p.btn('navNext');
    assert.strictEqual(n.tagName, 'A'); assert.strictEqual(n.textContent, 'Finish lesson');
    assert.strictEqual(n.getAttribute('href'), '../courses/course.html?level=a1&unit=course-a1-unit-01');
  });

  testAsync('page: PINNED - the completion gate is computed ONCE at load (refreshCompletionGate is not re-run on navigation), so progress changed elsewhere is only seen after a reload', async () => {
    const p = await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=practice' });
    assert.strictEqual(p.btn('navNext').tagName, 'BUTTON');
    p.store.setItem('mylingo.progress.v1', passed(['q1a', 'q1b']));
    await p.back(); await p.next();
    assert.strictEqual(p.btn('navNext').tagName, 'BUTTON', 'still locked without a reload');
    assert.strictEqual((SCRIPT.match(/refreshCompletionGate\(\);/g) || []).length, 1, 'one call site');
    const q = await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=practice', storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b']) } });
    q.store.setItem('mylingo.progress.v1', '{}');
    await q.back(); await q.next();
    assert.strictEqual(q.btn('navNext').tagName, 'A', 'and a stale unlock likewise survives cleared progress until reload');
  });

  testAsync('page: completion gate - a failing list re-fetch falls back to "Finish lesson" -> the course page', async () => {
    const files = mkFiles();
    let calls = 0; const orig = files['../course_content/lessons/a1.json'];
    Object.defineProperty(files, '../course_content/lessons/a1.json', { get() { calls++; return calls <= 1 ? orig : 'throw'; }, enumerable: true });
    const p = await runPage({ files, search: '?lesson=course-a1-unit-01-lesson-01&slide=practice', storage: { 'mylingo.progress.v1': passed(['q1a', 'q1b']) } });
    const n = p.btn('navNext');
    assert.strictEqual(n.tagName, 'A'); assert.strictEqual(n.textContent, 'Finish lesson');
    assert.strictEqual(n.getAttribute('href'), '../courses/course.html?level=a1&unit=course-a1-unit-01');
  });

  testAsync('page: PINNED - the disabled-button tooltip hard-codes 90% while the on-page hint reads course-progress\'s constant (they agree today; both must change together)', async () => {
    const CP = read('shared', 'js', 'course-progress.js');
    assert.ok(/LESSON_COMPLETION_THRESHOLD=90/.test(CP));
    assert.ok(/title="Pass 90% of lesson quizzes first"/.test(SCRIPT));
    assert.ok(/LESSON_COMPLETION_THRESHOLD\|\|90/.test(SCRIPT));
  });

  testAsync('page: two tabs of the same lesson each register their own offline listener (one per page load)', async () => {
    const a = await runPage(), b = await runPage();
    assert.strictEqual(a.listeners.offline.length, 1); assert.strictEqual(b.listeners.offline.length, 1);
  });

  testAsync('page: dead code - lessonStartUrl is built but never used, so lesson_quiz_id is not linked from the player when exercises exist (INFO)', async () => {
    assert.strictEqual((SCRIPT.match(/lessonStartUrl/g) || []).length, 1, 'declared + assigned in one statement, never read');
    const p = await runPage({ search: '?lesson=course-a1-unit-01-lesson-01&slide=practice' });
    assert.ok(!p.content.includes('quiz=lq1'));
  });

  testAsync('page: EVERY shipped lesson renders (all six levels): heading, escaped title, practice cards that resolve to real quizzes, correct gate + completion link', async () => {
    let seen = 0;
    const lv = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const courses = JSON.parse(read('course_content', 'courses.json')), units = JSON.parse(read('course_content', 'units.json'));
    for (const l of lv) {
      const lessons = JSON.parse(read('course_content', 'lessons', l + '.json'));
      const quizzes = JSON.parse(read(l, 'quizzes.json')), qids = new Set(quizzes.map((q) => q.id));
      const files = { ['../course_content/lessons/' + l + '.json']: lessons, '../course_content/courses.json': courses, '../course_content/units.json': units, ['../' + l + '/quizzes.json']: quizzes };
      const ordered = lessons.filter((x) => x.status === 'published').sort((a, b) => { const au = String(a.unit_id), bu = String(b.unit_id); return au === bu ? (a.order || 0) - (b.order || 0) : au.localeCompare(bu); });
      for (let i = 0; i < ordered.length; i++) {
        const lesson = ordered[i], prev = ordered[i - 1];
        const s = { 'mylingo.progress.v1': passed(prev ? (prev.exercise_quiz_ids && prev.exercise_quiz_ids.length ? prev.exercise_quiz_ids : [prev.lesson_quiz_id]) : []) };
        const p = await runPage({ files, storage: s, search: '?lesson=' + encodeURIComponent(lesson.lesson_id) + '&slide=practice' });
        assert.strictEqual(p.err(), null, lesson.lesson_id + ': ' + p.err());
        const cards = p.els.content.querySelectorAll('.exercise-card');
        assert.strictEqual(cards.length, (lesson.exercise_quiz_ids || []).length, lesson.lesson_id);
        (lesson.exercise_quiz_ids || []).forEach((id) => assert.ok(qids.has(id), lesson.lesson_id + ' links to unknown quiz ' + id));
        cards.forEach((c) => assert.ok(/^\.\.\/shared\/quiz\.html\?quiz=[^&]+&level=/.test(c.getAttribute('href'))));
        await p.back();
        assert.ok(p.els.content.querySelector('h1') && p.els.content.querySelector('h1').textContent === lesson.title, lesson.lesson_id);
        assert.ok(p.sb.document.title.endsWith(lesson.title));
        assert.ok(p.els.content.querySelector('.lesson-content') || /Quick revision/.test(p.content), lesson.lesson_id + ' shows neither body nor revision');
        seen++;
      }
    }
    assert.ok(seen >= 62, 'expected the 62 shipped lessons, saw ' + seen);
  });

  test('lesson.html: static wiring - modules load before the inline script, in the order the script assumes; no shipped lesson id is broken by the naming convention', () => {
    const iLL = HTML.indexOf('shared/js/level-lock.js'), iCP = HTML.indexOf('shared/js/course-progress.js'), iSU = HTML.indexOf('shared/js/safe-url.js'), iInline = HTML.lastIndexOf('<script>');
    assert.ok(iLL > 0 && iCP > 0 && iSU > 0 && iLL < iInline && iCP < iInline && iSU < iInline);
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => JSON.parse(read('course_content', 'lessons', l + '.json')).forEach((x) => {
      assert.strictEqual(H.levelFromLessonId(x.lesson_id), l, x.lesson_id + ' sits in the wrong level file or breaks the naming convention');
    }));
    ['chapterTrail', 'content', 'playerNav'].forEach((id) => assert.ok(new RegExp('id="' + id + '"').test(HTML), 'missing #' + id));
  });
})();

// ============================================================
console.log('courses/course.html + courses/journey.html: duplicated helpers stay consistent (Agent 182)');
// ============================================================
(function () {
  // HANDOFF_AGENT_181.md item 2: course.html and journey.html each carry their own copy of esc / readProgress / fetchJson /
  // statusFor / renderError (and lesson.html a third esc). The copies are lifted out by name and run side by side in vm sandboxes
  // against the REAL course-progress.js, so any drift between them (or from the module's own esc) fails loudly.
  const fs = require('fs'), vm = require('vm');
  const root = path.join(__dirname, '..');
  const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
  const plain = (x) => JSON.parse(JSON.stringify(x));
  const PAGES = { course: read('courses', 'course.html'), journey: read('courses', 'journey.html'), lesson: read('courses', 'lesson.html') };
  const CP_SRC = read('shared', 'js', 'course-progress.js');
  const inline = (h) => { const all = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)]; return all[all.length - 1][1]; };
  const FN = ['esc', 'readProgress', 'fetchJson', 'statusFor', 'renderError'];

  // Lifts the helpers of one page. `cp`: load the real course-progress.js (true), nothing (false) or a stub object.
  function lift(page, cp, storage, fetchImpl) {
    const sb = { localStorage: storage || makeFakeStorage(), fetch: fetchImpl || (() => Promise.reject(new Error('no net'))) };
    const content = new El('div'); sb.document = { getElementById: () => content };
    sb.window = sb; vm.createContext(sb);
    if (cp === true) vm.runInContext(CP_SRC, sb); else if (cp) sb.MylingoCourseProgress = cp;
    const src = inline(PAGES[page]);
    const names = FN.filter((n) => new RegExp('^function ' + n + '\\(', 'm').test(src));
    const pre = page === 'journey' ? "var $=function(x){return document.getElementById(x)},PROGRESS_KEY='mylingo.progress.v1';" : "var $=function(x){return document.getElementById(x)};var PROGRESS_KEY='mylingo.progress.v1';";
    const api = vm.runInContext(pre + '\n' + names.map((n) => extractFn(src, n)).join('\n') + '\n({' + names.join(',') + '})', sb);
    api.content = content; api.sb = sb;
    return api;
  }

  test('all three pages define the helpers this section lifts', () => {
    ['course', 'journey'].forEach((p) => FN.forEach((n) => assert.ok(new RegExp('^function ' + n + '\\(', 'm').test(inline(PAGES[p])), p + ' lacks ' + n)));
    assert.ok(/^function esc\(/m.test(inline(PAGES.lesson)));
    assert.ok(/PROGRESS_KEY='mylingo\.progress\.v1'/.test(inline(PAGES.course)) && /PROGRESS_KEY='mylingo\.progress\.v1'/.test(inline(PAGES.journey)));
    assert.ok(/var PROGRESS_KEY='mylingo\.progress\.v1'/.test(CP_SRC));
  });

  test('esc: the copies in lesson.html, course.html, journey.html and course-progress.js are the same function', () => {
    const cases = [null, undefined, 0, false, '', 'plain', '<a href="x" title=\'y\'>&amp;</a>', 'a & b', "it's", '"q"', 12.5, { toString() { return '<x>'; } }];
    const impls = { lesson: lift('lesson', true).esc, course: lift('course', true).esc, journey: lift('journey', true).esc, module: lift('course', true).sb.MylingoCourseProgress.esc };
    cases.forEach((c) => {
      const want = impls.course(c);
      ['lesson', 'journey', 'module'].forEach((k) => assert.strictEqual(impls[k](c), want, k + ' differs for ' + JSON.stringify(c)));
    });
    assert.strictEqual(impls.course('<>&"\''), '&lt;&gt;&amp;&quot;&#39;');
  });

  test('readProgress: course.html and journey.html agree on every stored shape (missing, invalid JSON, non-objects, arrays)', () => {
    const shapes = { missing: null, empty: '', invalid: '{oops', nul: 'null', num: '42', str: '"s"', bool: 'true', obj: '{"a":{"status":"completed","best":90}}', arr: '[1,2]' };
    Object.keys(shapes).forEach((k) => {
      const out = {};
      ['course', 'journey'].forEach((p) => { const st = makeFakeStorage(); if (shapes[k] !== null) st.setItem('mylingo.progress.v1', shapes[k]); out[p] = plain(lift(p, true, st).readProgress()); });
      assert.deepStrictEqual(out.course, out.journey, k);
    });
    const st = makeFakeStorage(); st.getItem = () => { throw new Error('denied'); };
    ['course', 'journey'].forEach((p) => assert.deepStrictEqual(plain(lift(p, true, st).readProgress()), {}, p + ' must survive a throwing storage'));
    const nonObj = makeFakeStorage(); nonObj.setItem('mylingo.progress.v1', '42');
    assert.deepStrictEqual(plain(lift('course', true, nonObj).readProgress()), {});
  });

  test('readProgress: PINNED - a stored ARRAY is returned as-is (typeof [] === "object"); the module\'s own reader does the same', () => {
    const st = makeFakeStorage(); st.setItem('mylingo.progress.v1', '[1,2]');
    assert.deepStrictEqual(plain(lift('course', true, st).readProgress()), [1, 2]);
    assert.deepStrictEqual(plain(lift('course', true, st).sb.MylingoCourseProgress.readProgress()), [1, 2]);
  });

  testAsync('fetchJson: identical in both pages - cache:no-store, non-2xx throws "http <status>", body parsed on success', async () => {
    const calls = [];
    const mk = (status) => (url, opts) => { calls.push([url, opts]); return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve({ ok: status }) }); };
    const results = [];
    for (const p of ['course', 'journey']) {
      const a = lift(p, true, null, mk(200)), b = lift(p, true, null, mk(503));
      results.push(await a.fetchJson('../x.json'));
      let msg = null; try { await b.fetchJson('../y.json'); } catch (e) { msg = e.message; }
      assert.strictEqual(msg, 'http 503', p);
    }
    assert.deepStrictEqual(results, [{ ok: 200 }, { ok: 200 }]);
    assert.ok(calls.every((c) => c[1] && c[1].cache === 'no-store'));
  });

  // ---- statusFor ----
  const P = (o) => JSON.parse(JSON.stringify(o));
  const lessonOf = (ids, lq) => { const l = { exercise_quiz_ids: ids }; if (lq) l.lesson_quiz_id = lq; return l; };
  const pass = { status: 'completed', best: 100 }, weak = { status: 'completed', best: 30 }, prog = { status: 'in-progress' }, legacy = { status: 'completed' };
  const TABLE = [
    ['all exercises mastered', lessonOf(['a', 'b']), { a: pass, b: pass }, 'completed', 'completed'],
    ['90% needed: 1 of 2 mastered', lessonOf(['a', 'b']), { a: pass }, 'in-progress', 'in-progress'],
    ['nothing touched', lessonOf(['a', 'b']), {}, 'not-started', 'not-started'],
    ['attempted below the mastery bar', lessonOf(['a']), { a: weak }, 'in-progress', 'completed'],
    ['session in progress only', lessonOf(['a', 'b']), { b: prog }, 'in-progress', 'in-progress'],
    ['legacy record without a score counts as mastered', lessonOf(['a']), { a: legacy }, 'completed', 'completed'],
    ['only the lesson quiz touched', lessonOf(['a'], 'lq'), { lq: weak }, 'in-progress', 'not-started'],
    ['no exercises, lesson quiz mastered', lessonOf([], 'lq'), { lq: pass }, 'completed', 'not-started'],
    ['no exercises, no lesson quiz', lessonOf([]), {}, 'not-started', 'not-started'],
    ['no exercise array at all', {}, {}, 'not-started', 'not-started'],
    ['9 of 10 mastered rounds to 90%', lessonOf('abcdefghij'.split('')), Object.fromEntries('abcdefghi'.split('').map((k) => [k, pass])), 'completed', 'in-progress'],
  ];
  test('statusFor: course.html and journey.html return the same status as each other for every case, with and without course-progress.js', () => {
    const states = { real: true, none: false };
    TABLE.forEach(([name, lesson, progress]) => {
      Object.keys(states).forEach((s) => {
        const a = lift('course', states[s]).statusFor(P(lesson), P(progress)), b = lift('journey', states[s]).statusFor(P(lesson), P(progress));
        assert.strictEqual(a, b, name + ' [' + s + ']');
      });
    });
  });

  test('statusFor (real course-progress.js): completed needs 90% of exercises mastered; any stored record for any linked quiz is in-progress; else not-started', () => {
    TABLE.forEach(([name, lesson, progress, want]) => {
      assert.strictEqual(lift('course', true).statusFor(P(lesson), P(progress)), want, name);
    });
  });

  test('statusFor (course-progress.js absent): legacy path - every exercise "completed" (any score) or in-progress; PINNED: a weak score counts as completed only here', () => {
    TABLE.forEach(([name, lesson, progress, , want]) => {
      assert.strictEqual(lift('course', false).statusFor(P(lesson), P(progress)), want, name);
    });
  });

  test('statusFor: PINNED - a course-progress stub WITHOUT lessonCompletionRecord uses its isMastered (or the legacy default) in both pages', () => {
    const stub = { isMastered: (r) => !!r && r.best >= 50 };
    ['course', 'journey'].forEach((p) => {
      const f = lift(p, stub).statusFor;
      assert.strictEqual(f(lessonOf(['a', 'b']), { a: { best: 60 }, b: { best: 99 } }), 'completed', p);
      assert.strictEqual(f(lessonOf(['a', 'b']), { a: { best: 60 }, b: { best: 10 } }), 'in-progress', p);
      assert.strictEqual(f(lessonOf(['a']), {}), 'not-started', p);
    });
  });

  test('renderError: both pages escape the message and link home; journey says "Back to courses", course says "Back to all courses" (cosmetic difference, pinned)', () => {
    const c = lift('course', true), j = lift('journey', true);
    c.renderError('<b>x</b> & "y"'); j.renderError('<b>x</b> & "y"');
    [c, j].forEach((x) => { assert.strictEqual(x.content.querySelectorAll('b').length, 0); assert.ok(x.content.textContent.includes('<b>x</b> & "y"')); assert.ok(x.content.querySelectorAll('a').length === 2); });
    assert.ok(c.content.textContent.includes('Back to all courses'));
    assert.ok(j.content.textContent.includes('Back to courses') && !j.content.textContent.includes('Back to all courses'));
  });

  test('page wiring: course.html gates on level-lock.js; PINNED (LOW) journey.html loads no level-lock.js and never checks it, so a locked level\'s journey overview is viewable (its lesson links are still gated by lesson.html)', () => {
    assert.ok(/MylingoLevelLock\.isLocked\(level\)/.test(inline(PAGES.course)) && /shared\/js\/level-lock\.js/.test(PAGES.course));
    assert.ok(!/level-lock/.test(PAGES.journey) && !/isLocked/.test(PAGES.journey));
    assert.ok(/MylingoLevelLock\.isLocked\(level\)/.test(inline(PAGES.lesson)));
  });

  test('page wiring: course.html and journey.html fall back to the monolithic lessons.json when the per-level file fails (lesson.html scans the level files instead)', () => {
    ['course', 'journey'].forEach((p) => {
      const flat = inline(PAGES[p]).replace(/\s+/g, ' ');
      assert.ok(/fetchJson\('\.\.\/course_content\/lessons\/'\+level\+'\.json'\)\.catch\(function\(\) ?\{ ?return fetchJson\('\.\.\/course_content\/lessons\.json'\)/.test(flat), p);
    });
    assert.ok(!/lessons\.json'/.test(inline(PAGES.lesson).replace(/lessons\/'/g, '')), 'lesson.html never fetches the monolith');
  });
})();

// ============================================================
console.log('courses/course.html + courses/journey.html: page rendering (Agent 183)');
// ============================================================
(function () {
  // HANDOFF_AGENT_182.md "Next agent - start here" item 1. Both pages' WHOLE inline scripts are run for real (hoisted PN mini DOM, fake fetch,
  // fake localStorage) against the REAL level-lock.js + course-progress.js, on hand-made fixtures AND on every shipped level.
  const read = RUN_READ;
  const HTMLS = { course: RUN_READ('courses', 'course.html'), journey: RUN_READ('courses', 'journey.html') };
  const SCRIPTS = {}; Object.keys(HTMLS).forEach((k) => { const all = [...HTMLS[k].matchAll(/<script>([\s\S]*?)<\/script>/g)]; SCRIPTS[k] = all[all.length - 1][1]; });
  const RUNNERS = {}; Object.keys(HTMLS).forEach((k) => { RUNNERS[k] = makeRunPage(HTMLS[k], SCRIPTS[k], 'content'); });

  // Agent 184: now a thin wrapper over the hoisted makeRunPage (see above the test summary vars).
  async function run(page, o) { return RUNNERS[page](o); }

  // ---- fixtures ----
  const passed = (ids) => { const p = {}; ids.forEach((id) => { p[id] = { status: 'completed', best: 100 }; }); return JSON.stringify(p); };
  const PK = 'mylingo.progress.v1';
  const U = (n, over) => Object.assign({ unit_id: 'course-a1-unit-0' + n, course_id: 'course-a1', title: 'Unit ' + n, order: n }, over || {});
  const L = (unit, n, over) => Object.assign({
    lesson_id: 'course-a1-unit-0' + unit + '-lesson-0' + n, unit_id: 'course-a1-unit-0' + unit, title: 'Lesson ' + unit + '.' + n, category: 'Grammar', order: n,
    exercise_quiz_ids: ['q' + unit + n + 'a', 'q' + unit + n + 'b'], status: 'published',
  }, over || {});
  const fx = (over) => {
    const lessons = [L(1, 1), L(1, 2), L(2, 1)];
    const quizzes = []; lessons.forEach((l) => l.exercise_quiz_ids.forEach((id) => quizzes.push({ id, questions: 5 })));
    return Object.assign({
      '../course_content/courses.json': [{ course_id: 'course-a1', level: 'A1', title: 'Course A1', description: 'About A1', status: 'published' }],
      '../course_content/units.json': [U(1), U(2)],
      '../course_content/lessons/a1.json': lessons,
      '../a1/quizzes.json': quizzes,
    }, over || {});
  };
  const LESSONS = '../course_content/lessons/a1.json';
  const ids = (n) => [1, 2].map((k) => n + ['a', 'b'][k - 1]);
  const ALL = ['q11a', 'q11b', 'q12a', 'q12b', 'q21a', 'q21b'];
  const cls = (el) => el.className.split(/\s+/);
  const P_ERR_LOCK = 'This level is locked. Reach it from your current level to unlock it, or find your level first.';

  // course.html rows: [{title, small, status, statusClass, href, locked, icon}]
  const courseRows = (p) => p.c.querySelectorAll('li').map((li) => {
    const link = li.querySelector('.lesson-link');
    return { title: li.querySelector('b').textContent, small: li.querySelector('small').textContent, status: li.querySelector('.status').textContent, statusClass: li.querySelector('.status').className, href: link.tagName === 'A' ? link.getAttribute('href') : null, locked: cls(li).includes('locked'), icon: li.querySelector('.type-icon').textContent };
  });
  const jRows = (p) => p.c.querySelectorAll('li').map((li) => {
    const a = li.querySelector('.lesson-actions').querySelector('a');
    return { title: li.querySelector('b').textContent, small: li.querySelector('small').textContent, state: li.querySelector('.state').textContent, cls: li.className, node: li.querySelector('.node').textContent, href: a ? a.getAttribute('href') : null, action: li.querySelector('.lesson-actions').textContent, icon: li.querySelector('.type-icon').textContent };
  });
  const flatOrder = (units, lessons, courseId) => units.filter((u) => u.course_id === courseId).sort((a, b) => a.order - b.order).flatMap((u) => lessons.filter((l) => l.unit_id === u.unit_id && l.status === 'published').sort((a, b) => a.order - b.order).map((l) => l.lesson_id));

  // ================= course.html =================
  testAsync('course.html: no / invalid level -> "No course level was specified." and nothing is fetched; the level is case-insensitive', async () => {
    for (const s of ['', '?level=', '?level=zz', '?level=a3', '?unit=x']) {
      const p = await run('course', { files: fx(), search: s });
      assert.ok(p.err().startsWith('No course level was specified.'), s);
      assert.deepStrictEqual(p.fetches, [], s);
    }
    const ok = await run('course', { files: fx(), search: '?level=A1' });
    assert.strictEqual(ok.err(), null); assert.ok(ok.html.includes('<h1>Course A1</h1>'));
  });

  testAsync('course.html: a locked level is refused BEFORE any fetch; unlocked / unset pass; without level-lock.js it fails OPEN', async () => {
    const s = { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) };
    const files = fx({ '../course_content/lessons/b1.json': [], '../b1/quizzes.json': [] });
    files['../course_content/courses.json'].push({ course_id: 'course-b1', level: 'B1', title: 'B1', status: 'published' });
    const locked = await run('course', { files, search: '?level=b1', storage: s });
    assert.ok(locked.err().startsWith(P_ERR_LOCK)); assert.deepStrictEqual(locked.fetches, []);
    assert.strictEqual((await run('course', { files, search: '?level=a1', storage: s })).err(), null);
    assert.strictEqual((await run('course', { files, search: '?level=b1' })).err(), null);
    assert.strictEqual((await run('course', { files, search: '?level=b1', storage: s, modules: ['cp'] })).err(), null, 'PINNED (carry-forward item 1): fail-open');
  });

  testAsync('course.html: fetches courses / units / per-level lessons / per-level quizzes; a missing per-level lessons file falls back to lessons.json; a failing quizzes file is ignored', async () => {
    const p = await run('course', { files: fx() });
    assert.deepStrictEqual(p.fetches.slice().sort(), ['../a1/quizzes.json', '../course_content/courses.json', LESSONS, '../course_content/units.json']);
    const f = fx({ [LESSONS]: undefined, '../course_content/lessons.json': [L(1, 1)] });
    const q = await run('course', { files: f });
    assert.ok(q.fetches.includes('../course_content/lessons.json')); assert.strictEqual(q.err(), null); assert.strictEqual(courseRows(q).length, 1);
    const r = await run('course', { files: fx({ '../a1/quizzes.json': 'throw' }) });
    assert.strictEqual(r.err(), null); assert.ok(!/question/.test(r.html.replace(/exercise/g, '')), 'no question counts without quiz metadata');
  });

  testAsync('course.html: errors - no published course for the level = "isn\u2019t available yet"; courses / units / lessons all failing = "isn\u2019t available right now"', async () => {
    const draft = fx(); draft['../course_content/courses.json'][0].status = 'draft';
    assert.ok((await run('course', { files: draft })).err().startsWith('This course isn\u2019t available yet.'));
    assert.ok((await run('course', { files: fx({ '../course_content/courses.json': [] }) })).err().startsWith('This course isn\u2019t available yet.'));
    assert.ok((await run('course', { files: fx({ '../course_content/courses.json': [{ course_id: 'c', level: 'B1', status: 'published' }] }) })).err().startsWith('This course isn\u2019t available yet.'), 'other level only');
    for (const u of ['../course_content/courses.json', '../course_content/units.json']) assert.ok((await run('course', { files: fx({ [u]: 'throw' }) })).err().startsWith('This course isn\u2019t available right now.'), u);
    assert.ok((await run('course', { files: fx({ [LESSONS]: 'throw', '../course_content/lessons.json': undefined }) })).err().startsWith('This course isn\u2019t available right now.'));
  });

  testAsync('course.html: header - level badge + label, escaped title / description, document title, journey link; unknown-level label blank', async () => {
    const f = fx(); Object.assign(f['../course_content/courses.json'][0], { title: 'T <i>x</i>', description: 'D & "q"' });
    const p = await run('course', { files: f });
    assert.strictEqual(p.c.querySelector('.lvl').textContent, 'A1 \u00b7 Beginner');
    assert.strictEqual(p.c.querySelector('h1').textContent, 'T <i>x</i>'); assert.strictEqual(p.c.querySelector('h1').querySelectorAll('i').length, 0, 'no injected <i> in the heading');
    assert.strictEqual(p.c.querySelector('.desc').textContent, 'D & "q"');
    assert.strictEqual(p.sb.document.title, 'Mylingo \u00b7 T <i>x</i>');
    assert.strictEqual(p.els.journeyLink.getAttribute('href'), './journey.html?level=a1');
    const nod = fx(); delete nod['../course_content/courses.json'][0].description;
    assert.strictEqual((await run('course', { files: nod })).c.querySelector('.desc').textContent, '', 'a missing description is blank, never "undefined"');
  });

  testAsync('course.html: stats and chips - units, PUBLISHED lessons, exercise ids; unit titles as distinct chips; other courses\' units ignored; units sorted by order, lessons by order', async () => {
    const f = fx();
    f['../course_content/units.json'] = [U(2), U(1), U(3, { course_id: 'other', title: 'Foreign' }), U(4, { title: 'Unit 1' })];
    f[LESSONS] = [L(2, 1), L(1, 2), L(1, 1), L(1, 3, { status: 'draft' }), L(4, 1)];
    const p = await run('course', { files: f });
    const nums = p.c.querySelectorAll('.n').map((e) => e.textContent);
    assert.deepStrictEqual(nums, ['3', '4', '8'], 'units (own course, incl. the duplicate-titled one), published lessons, exercises');
    assert.deepStrictEqual(p.c.querySelectorAll('.chip').map((e) => e.textContent), ['Unit 1', 'Unit 2'], 'duplicate titles collapse, foreign unit absent');
    assert.deepStrictEqual(courseRows(p).map((r) => r.title), ['Lesson 1.1', 'Lesson 1.2', 'Lesson 2.1', 'Lesson 4.1'], 'unit 4 (order 4) last; drafts hidden');
    assert.strictEqual(p.c.querySelectorAll('details').length, 3);
  });

  testAsync('course.html: progress bar + CTA - fresh learner: "Start course" to the first lesson (redirect back to that unit); partway: "Continue: <next>"; all done: "Course complete"; no lessons: no CTA and no bar', async () => {
    const start = await run('course', { files: fx() });
    const a = start.c.querySelector('.actions').querySelector('a');
    assert.strictEqual(a.textContent, 'Start course');
    assert.strictEqual(a.getAttribute('href'), './lesson.html?lesson=course-a1-unit-01-lesson-01&level=a1&redirect=' + encodeURIComponent('../courses/course.html?level=a1&unit=course-a1-unit-01'));
    assert.ok(start.text().includes('0% complete') && start.text().includes('0 / 3 lessons'));
    const mid = await run('course', { files: fx(), storage: { [PK]: passed(ids('q11')) } });
    const b = mid.c.querySelector('.actions').querySelector('a');
    assert.strictEqual(b.textContent, 'Continue: Lesson 1.2'); assert.ok(b.getAttribute('href').startsWith('./lesson.html?lesson=course-a1-unit-01-lesson-02&level=a1'));
    assert.ok(mid.text().includes('33% complete') && mid.text().includes('1 / 3 lessons'));
    const esc = fx(); esc[LESSONS][1].title = 'B <b>';
    assert.strictEqual((await run('course', { files: esc, storage: { [PK]: passed(ids('q11')) } })).c.querySelector('.actions').querySelector('a').textContent, 'Continue: B <b>');
    const done = await run('course', { files: fx(), storage: { [PK]: passed(ALL) } });
    assert.strictEqual(done.c.querySelector('.actions').querySelector('a').textContent, 'Course complete \u2014 back to courses');
    assert.strictEqual(done.c.querySelector('.actions').querySelector('a').getAttribute('href'), './index.html');
    assert.ok(done.text().includes('100% complete'));
    const empty = await run('course', { files: fx({ [LESSONS]: [] }) });
    assert.strictEqual(empty.c.querySelector('.actions').childNodes.length, 0); assert.strictEqual(empty.c.querySelector('.bar'), null);
    assert.ok(empty.text().includes('0Units') === false && empty.c.querySelectorAll('.n')[1].textContent === '0');
  });

  testAsync('course.html: PINNED - when the next unfinished lesson has NO exercises the CTA says "Course complete" even though lessons remain', async () => {
    const f = fx(); f[LESSONS][0].exercise_quiz_ids = [];
    const p = await run('course', { files: f });
    assert.strictEqual(p.c.querySelector('.actions').querySelector('a').textContent, 'Course complete \u2014 back to courses');
    assert.ok(p.text().includes('0% complete'));
  });

  testAsync('course.html: which unit is open - ?unit= wins, else the unit holding the next lesson, else none; an unknown ?unit= opens nothing', async () => {
    const open = (p) => p.c.querySelectorAll('details').map((d) => d.getAttribute('open') !== null);
    assert.deepStrictEqual(open(await run('course', { files: fx() })), [true, false]);
    assert.deepStrictEqual(open(await run('course', { files: fx(), storage: { [PK]: passed(['q11a', 'q11b', 'q12a', 'q12b']) } })), [false, true]);
    assert.deepStrictEqual(open(await run('course', { files: fx(), search: '?level=a1&unit=course-a1-unit-02' })), [false, true]);
    assert.deepStrictEqual(open(await run('course', { files: fx(), search: '?level=a1&unit=nope' })), [false, false], 'an explicit but unknown unit suppresses the default');
    assert.deepStrictEqual(open(await run('course', { files: fx(), storage: { [PK]: passed(ALL) } })), [false, false]);
  });

  testAsync('course.html: unit header - lesson count pluralised, per-unit % bar, "unit-completed" only for a non-empty fully-completed unit', async () => {
    const p = await run('course', { files: fx(), storage: { [PK]: passed(ids('q11')) } });
    const ds = p.c.querySelectorAll('details');
    assert.deepStrictEqual(ds.map((d) => d.querySelector('.count').textContent), ['2 lessons', '1 lesson']);
    assert.deepStrictEqual(ds.map((d) => d.querySelector('.ubar').querySelector('i').getAttribute('style')), ['width:50%', 'width:0%']);
    assert.ok(!cls(ds[0]).includes('unit-completed'));
    const all = await run('course', { files: fx(), storage: { [PK]: passed(ALL) } });
    assert.ok(all.c.querySelectorAll('details').every((d) => cls(d).includes('unit-completed')));
    const e = fx(); e['../course_content/units.json'].push(U(3));
    const pe = await run('course', { files: e });
    const last = pe.c.querySelectorAll('details')[2];
    assert.strictEqual(last.querySelector('.count').textContent, '0 lessons'); assert.ok(!cls(last).includes('unit-completed'));
  });

  testAsync('course.html: lesson rows - the first lesson is open, every other needs the GLOBAL previous lesson completed (across units); locked rows have no link and say why', async () => {
    const r0 = courseRows(await run('course', { files: fx() }));
    assert.deepStrictEqual(r0.map((r) => [r.locked, r.status, !!r.href]), [[false, 'Ready', true], [true, 'Locked', false], [true, 'Locked', false]]);
    assert.ok(r0[1].small.endsWith(' \u00b7 Finish the previous lesson to unlock'));
    assert.ok(!r0[0].small.includes('Finish the previous'));
    const r1 = courseRows(await run('course', { files: fx(), storage: { [PK]: passed(['q11a', 'q11b', 'q12a', 'q12b']) } }));
    assert.deepStrictEqual(r1.map((r) => r.status), ['Completed', 'Completed', 'Ready']);
    assert.ok(r1[2].href.startsWith('./lesson.html?lesson=course-a1-unit-02-lesson-01&level=a1&redirect='), 'lesson 2.1 unlocks off 1.2 in the previous unit');
    assert.ok(r1[0].statusClass.split(/\s+/).includes('completed') && r1[2].statusClass.split(/\s+/).includes('not-started'));
    const half = await run('course', { files: fx(), storage: { [PK]: passed(['q11a']) } });
    assert.deepStrictEqual(courseRows(half).map((r) => r.status), ['Ready', 'Locked', 'Locked']);
    assert.ok(courseRows(half)[0].statusClass.split(/\s+/).includes('in-progress'));
  });

  testAsync('course.html: lesson link = lesson.html?lesson&level&redirect, where redirect is the course page re-opened on that lesson\'s own unit', async () => {
    const p = await run('course', { files: fx(), storage: { [PK]: passed(['q11a', 'q11b', 'q12a', 'q12b']) } });
    const rows = courseRows(p);
    assert.strictEqual(rows[2].href, './lesson.html?lesson=course-a1-unit-02-lesson-01&level=a1&redirect=' + encodeURIComponent('../courses/course.html?level=a1&unit=course-a1-unit-02'));
    assert.strictEqual(rows[0].href, './lesson.html?lesson=course-a1-unit-01-lesson-01&level=a1&redirect=' + encodeURIComponent('../courses/course.html?level=a1&unit=course-a1-unit-01'));
  });

  testAsync('course.html: PINNED - an unlocked lesson with NO exercises has no link and is rendered as a locked row (with the "Finish the previous lesson" hint) while its status says "Ready"', async () => {
    const f = fx(); f[LESSONS][0].exercise_quiz_ids = [];
    const rows = courseRows(await run('course', { files: f }));
    assert.strictEqual(rows[0].href, null); assert.strictEqual(rows[0].status, 'Ready'); assert.ok(rows[0].small.includes('Finish the previous lesson'));
    assert.ok(rows[0].small.startsWith('Grammar \u00b7 0 exercises'));
  });

  testAsync('course.html: row details - exercise / question counts pluralised, type icon from media (video > audio > text), escaped titles and categories', async () => {
    const f = fx(); const l = f[LESSONS];
    l[0].exercise_quiz_ids = ['q11a']; l[0].youtube_url = 'https://youtu.be/abcdef1'; l[0].title = '<b>bold</b>'; l[0].category = 'C & D';
    l[1].audio_urls = ['https://a/x.mp3']; l[1].video_urls = [];
    l[2].videos = ['https://a/v']; l[2].audios = ['https://a/a'];
    f['../a1/quizzes.json'] = [{ id: 'q11a', questions: 1 }, { id: 'q12a', questions: 3 }, { id: 'q12b', questions: 4 }];
    const rows = courseRows(await run('course', { files: f }));
    assert.strictEqual(rows[0].small, 'C & D \u00b7 1 exercise \u00b7 1 question'); assert.strictEqual(rows[0].title, '<b>bold</b>');
    assert.ok(rows[1].small.startsWith('Grammar \u00b7 2 exercises \u00b7 7 questions'), rows[1].small);
    assert.deepStrictEqual(rows.map((r) => r.icon), ['\u25b6', '\u25d6', '\u25b6']);
    const p = await run('course', { files: f }); assert.strictEqual(p.c.querySelectorAll('b').length, 3, 'no injected <b>');
    const g = fx(); g['../a1/quizzes.json'] = [];
    assert.ok(!/question/.test(courseRows(await run('course', { files: g }))[0].small), 'no metadata -> no question count');
  });

  // ================= journey.html =================
  testAsync('journey.html: invalid level -> message, nothing fetched; NO lock check (PINNED LOW: a locked level\'s journey renders)', async () => {
    const bad = await run('journey', { files: fx(), search: '?level=q' });
    assert.ok(bad.err().startsWith('No course level was specified.')); assert.deepStrictEqual(bad.fetches, []);
    const s = { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) };
    const files = fx({ '../course_content/lessons/b1.json': [L(1, 1)], '../course_content/units.json': [U(1)] });
    files['../course_content/courses.json'].push({ course_id: 'course-a1', level: 'B1', title: 'B1', status: 'published' });
    files['../course_content/courses.json'][1].course_id = 'course-a1';
    const p = await run('journey', { files, search: '?level=b1', storage: s });
    assert.strictEqual(p.err(), null); assert.ok(p.html.includes('B1 Journey'));
  });

  testAsync('journey.html: fetches courses / units / lessons only (never quizzes), falls back to lessons.json; errors: unpublished -> "isn\u2019t available yet", failures -> the journey-specific retry message', async () => {
    const p = await run('journey', { files: fx() });
    assert.deepStrictEqual(p.fetches.slice().sort(), ['../course_content/courses.json', LESSONS, '../course_content/units.json']);
    const q = await run('journey', { files: fx({ [LESSONS]: undefined, '../course_content/lessons.json': [L(1, 1)] }) });
    assert.strictEqual(q.err(), null); assert.strictEqual(jRows(q).length, 1);
    const d = fx(); d['../course_content/courses.json'][0].status = 'draft';
    assert.ok((await run('journey', { files: d })).err().startsWith('This course isn\u2019t available yet.'));
    assert.ok((await run('journey', { files: fx({ '../course_content/units.json': 'throw' }) })).err().startsWith('Your journey is unavailable right now. Please try again or open the course directly.'));
  });

  testAsync('journey.html: chrome - document title, breadcrumb level, course link, hero, progress block (aria values), "Explore course" link', async () => {
    const f = fx(); f['../course_content/courses.json'][0].title = 'T <b>';
    const p = await run('journey', { files: f, storage: { [PK]: passed(ids('q11')) } });
    assert.strictEqual(p.sb.document.title, 'Mylingo \u00b7 T <b> Journey');
    assert.strictEqual(p.els.crumbLevel.textContent, 'T <b>'); assert.strictEqual(p.els.courseLink.getAttribute('href'), './course.html?level=a1');
    assert.strictEqual(p.c.querySelector('h1').textContent, 'T <b> Journey'); assert.strictEqual(p.c.querySelector('.lvl').textContent, 'A1 \u00b7 Beginner');
    const bar = p.c.querySelector('.bar');
    assert.strictEqual(bar.getAttribute('aria-valuenow'), '33'); assert.strictEqual(bar.getAttribute('role'), 'progressbar');
    assert.ok(p.text().includes('1 of 3 published lessons completed.'));
    assert.strictEqual(p.c.querySelector('.actions').querySelector('a').getAttribute('href'), './course.html?level=a1');
    assert.ok(cls(p.c.querySelector('.actions').querySelector('a')).includes('secondary'));
    assert.strictEqual(p.c.querySelectorAll('b').length, 3, 'no injected <b> (only the three lesson titles)');
  });

  testAsync('journey.html: continue card - first unfinished lesson, "n of N lessons", link to the lesson with a redirect back to ITS unit; complete journey -> "Review course"; empty -> placeholder', async () => {
    const p = await run('journey', { files: fx(), storage: { [PK]: passed(ids('q11')) } });
    const card = p.c.querySelector('.continue');
    assert.strictEqual(card.querySelector('h2').textContent, 'Lesson 1.2');
    assert.strictEqual(card.querySelector('p').textContent, 'Unit 1 \u00b7 Grammar \u00b7 2 of 3 lessons');
    assert.strictEqual(card.querySelector('.btn').getAttribute('href'), './lesson.html?lesson=course-a1-unit-01-lesson-02&level=a1&redirect=' + encodeURIComponent('./journey.html?level=a1&unit=course-a1-unit-01'));
    const nocat = fx(); delete nocat[LESSONS][0].category;
    assert.ok((await run('journey', { files: nocat })).c.querySelector('.continue').querySelector('p').textContent.includes('\u00b7 Lesson \u00b7 1 of 3'), 'missing category -> "Lesson"');
    const done = await run('journey', { files: fx(), storage: { [PK]: passed(ALL) } });
    assert.strictEqual(done.c.querySelector('.eyebrow').textContent, 'Journey complete');
    assert.strictEqual(done.c.querySelector('.continue').querySelector('h2').textContent, 'You finished Course A1');
    assert.strictEqual(done.c.querySelector('.continue').querySelector('.btn').getAttribute('href'), './course.html?level=a1');
    const empty = await run('journey', { files: fx({ [LESSONS]: [] }) });
    assert.ok(empty.text().includes('This journey has no published lessons yet.'));
    assert.ok(empty.text().includes('0 of 0 published lessons completed.') && empty.c.querySelector('.bar').getAttribute('aria-valuenow') === '0');
  });

  testAsync('journey.html: unit sections - "Unit N \u2014 title", done-of-total, %; class completed / current / none; icon \u2713 / \u2022 / number; unit bar aria-label', async () => {
    const p = await run('journey', { files: fx(), storage: { [PK]: passed(['q11a', 'q11b', 'q12a', 'q12b']) } });
    const secs = p.c.querySelectorAll('section').filter((s) => cls(s).includes('unit'));
    assert.strictEqual(secs.length, 2);
    assert.strictEqual(secs[0].querySelector('h2').textContent, 'Unit 1 \u2014 Unit 1'); assert.ok(cls(secs[0]).includes('completed'));
    assert.strictEqual(secs[0].querySelector('.unit-icon').textContent, '\u2713'); assert.strictEqual(secs[0].querySelector('.unit-pct').textContent, '100%');
    assert.strictEqual(secs[0].querySelector('.unit-copy').querySelector('p').textContent, '2 of 2 lessons complete');
    assert.ok(cls(secs[1]).includes('current')); assert.strictEqual(secs[1].querySelector('.unit-icon').textContent, '\u2022');
    assert.strictEqual(secs[1].querySelector('.unit-bar').getAttribute('aria-label'), 'Unit 2 progress');
    const fresh = await run('journey', { files: fx() });
    const s2 = fresh.c.querySelectorAll('section').filter((s) => cls(s).includes('unit'));
    assert.strictEqual(s2[1].querySelector('.unit-icon').textContent, '2'); assert.ok(!cls(s2[1]).includes('current') && !cls(s2[1]).includes('completed'));
    const noOrder = fx(); delete noOrder['../course_content/units.json'][0].order;
    assert.ok((await run('journey', { files: noOrder })).c.querySelector('.path-title') !== null);
  });

  testAsync('journey.html: lesson rows - node / state / class / action per state (completed = Review, ready = Start lesson, locked = Locked span), previous-lesson unlock across units', async () => {
    const p = await run('journey', { files: fx(), storage: { [PK]: passed(['q11a', 'q11b']) } });
    const r = jRows(p);
    assert.deepStrictEqual(r.map((x) => [x.state, x.node, x.action]), [['Completed', '\u2713', 'Review'], ['Ready', '2', 'Start lesson'], ['Locked', '\ud83d\udd12', 'Locked']]);
    assert.ok(r[0].cls.includes('completed') && r[1].cls.includes('current') && r[2].cls.includes('upcoming'));
    assert.ok(r[2].href === null && r[1].href.startsWith('./lesson.html?lesson=course-a1-unit-01-lesson-02&level=a1&redirect='));
    assert.ok(r[0].small === 'Grammar \u00b7 2 exercises');
    const all = jRows(await run('journey', { files: fx(), storage: { [PK]: passed(['q11a', 'q11b', 'q12a', 'q12b']) } }));
    assert.strictEqual(all[2].state, 'Ready', 'unit 2 opens once unit 1 is done');
  });

  testAsync('journey.html: PINNED divergence - an unlocked lesson with NO exercises still gets a "Start lesson" link here (course.html renders it as locked, no link)', async () => {
    const f = fx(); f[LESSONS][0].exercise_quiz_ids = [];
    const j = jRows(await run('journey', { files: f }))[0];
    assert.ok(j.href && j.action === 'Start lesson' && j.small === 'Grammar');
    assert.strictEqual(courseRows(await run('course', { files: f }))[0].href, null);
  });

  testAsync('journey.html: type icons and escaping (titles / categories / unit + course titles) match course.html', async () => {
    const f = fx(); f[LESSONS][0].youtube_url = 'https://youtu.be/abcdef1'; f[LESSONS][0].title = '<u>t</u>'; f[LESSONS][1].audios = ['https://a/a'];
    const r = jRows(await run('journey', { files: f }));
    assert.deepStrictEqual(r.map((x) => x.icon), ['\u25b6', '\u25d6', 'T']); assert.strictEqual(r[0].title, '<u>t</u>');
    assert.strictEqual((await run('journey', { files: f })).c.querySelectorAll('u').length, 0);
  });

  // ================= cross-page + shipped data =================
  testAsync('course.html vs journey.html: for every progress prefix the two pages agree on each lesson\'s state (fixture with drafts and unit gaps)', async () => {
    const f = fx();
    f['../course_content/units.json'] = [U(3), U(1), U(2)];
    f[LESSONS] = [L(3, 1), L(1, 2), L(1, 1), L(2, 1), L(2, 2, { status: 'draft' }), L(2, 3)];
    const order = flatOrder(f['../course_content/units.json'], f[LESSONS], 'course-a1');
    const idsOf = (lid) => f[LESSONS].find((l) => l.lesson_id === lid).exercise_quiz_ids;
    for (let k = 0; k <= order.length; k++) {
      const st = { [PK]: passed(order.slice(0, k).flatMap(idsOf)) };
      const c = courseRows(await run('course', { files: f, storage: st })), j = jRows(await run('journey', { files: f, storage: st }));
      assert.deepStrictEqual(c.map((r) => r.title), j.map((r) => r.title), 'k=' + k);
      assert.deepStrictEqual(c.map((r) => r.status), j.map((r) => r.state), 'k=' + k);
      assert.deepStrictEqual(c.map((r) => !!r.href), j.map((r) => !!r.href), 'k=' + k);
    }
  });

  test('shipped data: the course / journey order (unit.order, lesson.order) equals the lesson-gate order in lesson.html (unit_id string sort, lesson.order) for every level', () => {
    const units = JSON.parse(read('course_content', 'units.json')), courses = JSON.parse(read('course_content', 'courses.json'));
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => {
      const lessons = JSON.parse(read('course_content', 'lessons', l + '.json'));
      const course = courses.find((c) => c.level.toLowerCase() === l && c.status === 'published');
      assert.ok(course, l);
      const pageOrder = flatOrder(units, lessons, course.course_id);
      const gateOrder = lessons.filter((x) => x.status === 'published').sort((a, b) => { const au = String(a.unit_id), bu = String(b.unit_id); return au === bu ? (a.order || 0) - (b.order || 0) : au.localeCompare(bu); }).map((x) => x.lesson_id);
      assert.deepStrictEqual(pageOrder, gateOrder, l + ': the pages would show a different "previous lesson" than the lesson.html gate enforces');
      assert.strictEqual(pageOrder.length, lessons.filter((x) => x.status === 'published').length, l + ' has published lessons whose unit is not in the course');
    });
  });

  testAsync('shipped data: EVERY level renders on both pages; a fresh learner sees only the first lesson open, a finished one sees everything completed, and every link resolves to a real lesson', async () => {
    const courses = JSON.parse(read('course_content', 'courses.json')), units = JSON.parse(read('course_content', 'units.json'));
    for (const l of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
      const lessons = JSON.parse(read('course_content', 'lessons', l + '.json')), quizzes = JSON.parse(read(l, 'quizzes.json'));
      const files = { '../course_content/courses.json': courses, '../course_content/units.json': units, ['../course_content/lessons/' + l + '.json']: lessons, ['../' + l + '/quizzes.json']: quizzes };
      const course = courses.find((c) => c.level.toLowerCase() === l && c.status === 'published');
      const order = flatOrder(units, lessons, course.course_id);
      const byId = Object.fromEntries(lessons.map((x) => [x.lesson_id, x]));
      const search = '?level=' + l;
      const c = await run('course', { files, search }), j = await run('journey', { files, search });
      assert.strictEqual(c.err(), null, l); assert.strictEqual(j.err(), null, l);
      const cr = courseRows(c), jr = jRows(j);
      assert.deepStrictEqual(cr.map((r) => r.title), order.map((id) => byId[id].title), l);
      assert.deepStrictEqual(jr.map((r) => r.title), cr.map((r) => r.title), l);
      assert.deepStrictEqual(cr.map((r) => !!r.href), order.map((_, i) => i === 0), l + ': only the first lesson opens for a fresh learner');
      assert.deepStrictEqual(jr.map((r) => !!r.href), cr.map((r) => !!r.href), l);
      assert.strictEqual(c.c.querySelector('.actions').querySelector('a').textContent, 'Start course', l);
      const n = c.c.querySelectorAll('.n').map((e) => Number(e.textContent));
      assert.deepStrictEqual(n, [units.filter((u) => u.course_id === course.course_id).length, order.length, order.reduce((s, id) => s + (byId[id].exercise_quiz_ids || []).length, 0)], l);
      const every = order.flatMap((id) => byId[id].exercise_quiz_ids && byId[id].exercise_quiz_ids.length ? byId[id].exercise_quiz_ids : [byId[id].lesson_quiz_id]);
      const done = { [PK]: passed(every) };
      const c2 = await run('course', { files, search, storage: done }), j2 = await run('journey', { files, search, storage: done });
      assert.ok(courseRows(c2).every((r) => r.status === 'Completed' && r.href), l);
      assert.ok(jRows(j2).every((r) => r.state === 'Completed' && r.action === 'Review'), l);
      assert.strictEqual(c2.c.querySelector('.actions').querySelector('a').textContent, 'Course complete \u2014 back to courses', l);
      assert.strictEqual(j2.c.querySelector('.eyebrow').textContent, 'Journey complete', l);
      cr.concat(courseRows(c2)).filter((r) => r.href).forEach((r) => {
        const id = decodeURIComponent(/lesson=([^&]+)/.exec(r.href)[1]);
        assert.ok(byId[id], l + ': link to unknown lesson ' + id);
      });
    }
  });

  test('static wiring: both pages load course-progress.js before their inline script; only course.html loads level-lock.js; both expose #content and their link ids', () => {
    ['course', 'journey'].forEach((k) => { assert.ok(HTMLS[k].indexOf('shared/js/course-progress.js') > 0 && HTMLS[k].indexOf('shared/js/course-progress.js') < HTMLS[k].lastIndexOf('<script>'), k); assert.ok(/id="content"/.test(HTMLS[k]), k); });
    assert.ok(HTMLS.course.indexOf('shared/js/level-lock.js') > 0 && HTMLS.course.indexOf('shared/js/level-lock.js') < HTMLS.course.lastIndexOf('<script>'));
    assert.ok(/id="journeyLink"/.test(HTMLS.course) && /id="courseLink"/.test(HTMLS.journey) && /id="crumbLevel"/.test(HTMLS.journey));
  });
})();

// ============================================================
console.log('courses/index.html: page rendering (Agent 184)');
// ============================================================
(function () {
  // HANDOFF_AGENT_183.md "Next agent - start here" item 1. The WHOLE inline script is run for real
  // (hoisted makeRunPage: fake fetch, fake localStorage, PN mini DOM built from the page's own
  // id="…" markup) against the REAL level-lock.js + course-progress.js, on hand-made fixtures and
  // on every shipped level. Content container here is #grid, not #content, so makeRunPage's
  // contentId param (added for this page) is used.
  const HTML = RUN_READ('courses', 'index.html');
  const SCRIPT = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
  const runRaw = makeRunPage(HTML, SCRIPT, 'grid');
  const run = (o) => runRaw(o);

  const passed = (ids) => { const p = {}; ids.forEach((id) => { p[id] = { status: 'completed', best: 100 }; }); return JSON.stringify(p); };
  const PK = 'mylingo.progress.v1';
  const U = (lvl, n, over) => Object.assign({ unit_id: 'course-' + lvl + '-unit-0' + n, course_id: 'course-' + lvl, title: 'Unit ' + n, order: n }, over || {});
  const L = (lvl, unit, n, over) => Object.assign({
    lesson_id: 'course-' + lvl + '-unit-0' + unit + '-lesson-0' + n, unit_id: 'course-' + lvl + '-unit-0' + unit, title: 'Lesson ' + unit + '.' + n, category: 'Grammar', order: n,
    exercise_quiz_ids: ['q' + lvl + unit + n + 'a', 'q' + lvl + unit + n + 'b'], status: 'published',
  }, over || {});
  const CRS = (lvl, over) => Object.assign({ course_id: 'course-' + lvl, level: lvl.toUpperCase(), title: 'Course ' + lvl.toUpperCase(), description: 'About ' + lvl.toUpperCase(), status: 'published' }, over || {});
  const fx = (over) => {
    const lessonsA1 = [L('a1', 1, 1), L('a1', 1, 2)], lessonsA2 = [L('a2', 1, 1)];
    return Object.assign({
      '../course_content/courses.json': [CRS('a1'), CRS('a2')],
      '../course_content/units.json': [U('a1', 1), U('a2', 1)],
      '../course_content/lessons/a1.json': lessonsA1,
      '../course_content/lessons/a2.json': lessonsA2,
      '../course_content/lessons/b1.json': [], '../course_content/lessons/b2.json': [],
      '../course_content/lessons/c1.json': [], '../course_content/lessons/c2.json': [],
    }, over || {});
  };
  const cards = (p) => p.c.querySelectorAll('li').filter((li) => li.getAttribute('data-level'));
  const cardsOf = (p) => cards(p).map((li) => {
    const a = li.querySelector('.course-card');
    const nums = li.querySelectorAll('b').map((e) => e.textContent);
    const bar = li.querySelector('.bar');
    return {
      level: li.getAttribute('data-level'), href: a.getAttribute('href'), ariaLabel: a.getAttribute('aria-label'),
      lvl: li.querySelector('.lvl').textContent, title: li.querySelector('h2').textContent, desc: li.querySelector('p').textContent,
      units: nums[0], lessons: nums[1], exercises: nums[2],
      pct: bar ? li.querySelector('.pctrow').querySelectorAll('span')[0].textContent : null,
      cta: bar ? li.querySelector('.pctrow').querySelectorAll('span')[1].textContent : null,
      hasBar: !!bar, locked: li.querySelectorAll('.is-level-locked').concat(li.matches('.is-level-locked') ? [li] : []).length > 0 || (a.getAttribute('class') || '').indexOf('is-level-locked') >= 0,
    };
  });

  testAsync('courses/index.html: fetches courses / units / the six per-level lessons files in parallel; a missing per-level file falls back to lessons.json', async () => {
    const p = await run({ files: fx() });
    assert.deepStrictEqual(p.fetches.slice().sort(), [
      '../course_content/courses.json', '../course_content/lessons/a1.json', '../course_content/lessons/a2.json',
      '../course_content/lessons/b1.json', '../course_content/lessons/b2.json', '../course_content/lessons/c1.json',
      '../course_content/lessons/c2.json', '../course_content/units.json',
    ]);
    const f = fx({ '../course_content/lessons/b1.json': undefined, '../course_content/lessons.json': [L('a1', 1, 1)] });
    const q = await run({ files: f });
    assert.ok(q.fetches.includes('../course_content/lessons.json'));
    assert.strictEqual(q.err(), null);
  });

  testAsync('courses/index.html: errors - no published course at all = renderError with a link back to levels; empty grid otherwise unaffected', async () => {
    const draft = fx(); draft['../course_content/courses.json'].forEach((c) => { c.status = 'draft'; });
    const p = await run({ files: draft });
    assert.ok(p.err().startsWith('Courses aren\u2019t available right now.'));
    assert.ok(p.c.querySelector('a').getAttribute('href') === '../main/index.html');
    const failed = await run({ files: fx({ '../course_content/courses.json': 'throw' }) });
    assert.ok(failed.err().startsWith('Courses aren\u2019t available right now.'));
  });

  testAsync('courses/index.html: only published courses render, ordered A1..C2 regardless of input order', async () => {
    const f = fx({ '../course_content/courses.json': [CRS('c1'), CRS('a2'), CRS('a1', { status: 'draft' }), CRS('b1')] });
    const p = await run({ files: f });
    assert.deepStrictEqual(cardsOf(p).map((c) => c.level), ['a2', 'b1', 'c1'], 'draft a1 excluded, rest sorted by CEFR order');
  });

  testAsync('courses/index.html: card content - level badge + label, escaped title/description, href, aria-label; a missing description is blank not "undefined"', async () => {
    const f = fx(); Object.assign(f['../course_content/courses.json'][0], { title: 'T <i>x</i>', description: 'D & "q"' });
    const p = await run({ files: f });
    const a1 = cardsOf(p).find((c) => c.level === 'a1');
    assert.strictEqual(a1.lvl, 'A1 \u00b7 Beginner');
    assert.strictEqual(a1.title, 'T <i>x</i>'); assert.strictEqual(cards(p)[0].querySelector('h2').querySelectorAll('i').length, 0, 'no injected <i> in the heading');
    assert.strictEqual(a1.desc, 'D & "q"');
    assert.strictEqual(a1.href, './course.html?level=a1');
    assert.strictEqual(a1.ariaLabel, 'Open T <i>x</i> course');
    const nod = fx(); delete nod['../course_content/courses.json'][0].description;
    assert.strictEqual(cardsOf(await run({ files: nod })).find((c) => c.level === 'a1').desc, '', 'a missing description is blank, never "undefined"');
  });

  testAsync('courses/index.html: stats - units and PUBLISHED lessons scoped to the course\'s own units; exercises summed across those lessons; other courses\' units/lessons never leak in', async () => {
    const f = fx();
    f['../course_content/units.json'] = [U('a1', 1), U('a1', 2), U('a2', 1, { course_id: 'course-a1', title: 'Borrowed' })];
    f['../course_content/lessons/a1.json'] = [L('a1', 1, 1), L('a1', 2, 1), L('a1', 1, 2, { status: 'draft' })];
    f['../course_content/lessons/a2.json'] = [];
    const p = await run({ files: f });
    const a1 = cardsOf(p).find((c) => c.level === 'a1');
    assert.strictEqual(a1.units, '3', 'two real a1 units + the relabelled a2 unit reassigned to course-a1');
    assert.strictEqual(a1.lessons, '2', 'published only, draft excluded');
    assert.strictEqual(a1.exercises, '4');
  });

  testAsync('courses/index.html: progress % and CTA - MASTERY-gated (best>=60, not just completed), 0 lessons -> 0% + "Start course"; some attempted -> "Continue"; all lessons mastered -> "Review course"; a course with no published lessons has no bar/CTA', async () => {
    const start = cardsOf(await run({ files: fx() })).find((c) => c.level === 'a1');
    assert.strictEqual(start.pct, '0% complete'); assert.strictEqual(start.cta, 'Start course');
    const attempted = cardsOf(await run({ files: fx(), storage: { [PK]: JSON.stringify({ qa111a: { status: 'in-progress' } }) } })).find((c) => c.level === 'a1');
    assert.strictEqual(attempted.cta, 'Continue', 'an attempted-but-not-mastered quiz still counts as started');
    const lowScore = cardsOf(await run({ files: fx(), storage: { [PK]: JSON.stringify({ qa111a: { status: 'completed', best: 40 }, qa111b: { status: 'completed', best: 40 } }) } })).find((c) => c.level === 'a1');
    assert.strictEqual(lowScore.pct, '0% complete', 'completed but scored below the mastery threshold does not count');
    const mastered = cardsOf(await run({ files: fx(), storage: { [PK]: passed(['qa111a', 'qa111b']) } })).find((c) => c.level === 'a1');
    assert.strictEqual(mastered.pct, '50% complete');
    const all = cardsOf(await run({ files: fx(), storage: { [PK]: passed(['qa111a', 'qa111b', 'qa112a', 'qa112b']) } })).find((c) => c.level === 'a1');
    assert.strictEqual(all.pct, '100% complete'); assert.strictEqual(all.cta, 'Review course');
    const empty = fx(); empty['../course_content/lessons/a1.json'] = [];
    const noLessons = cardsOf(await run({ files: empty })).find((c) => c.level === 'a1');
    assert.strictEqual(noLessons.hasBar, false, 'no lessons -> no bar and no CTA row');
  });

  testAsync('courses/index.html: PINNED without course-progress.js - falls back to raw status===\'completed\' (any score counts as mastered)', async () => {
    const lowScore = { [PK]: JSON.stringify({ qa111a: { status: 'completed', best: 1 }, qa111b: { status: 'completed', best: 1 } }) };
    const withModule = cardsOf(await run({ files: fx(), storage: lowScore })).find((c) => c.level === 'a1');
    assert.strictEqual(withModule.pct, '0% complete');
    const withoutModule = cardsOf(await run({ files: fx(), storage: lowScore, modules: ['ll'] })).find((c) => c.level === 'a1');
    assert.strictEqual(withoutModule.pct, '50% complete', 'PINNED: without course-progress.js, isMastered falls back to any completed status, ignoring score (lesson 1.1 now counts; the untouched lesson 1.2 still does not)');
  });

  testAsync('courses/index.html: level-lock decoration - a locked level card gets is-level-locked + a lock overlay and its link is neutralized; unlocked levels are untouched; without level-lock.js the try/catch swallows it and nothing is decorated', async () => {
    const s = { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) };
    const p = await run({ files: fx(), storage: s });
    const a1card = cards(p).find((li) => li.getAttribute('data-level') === 'a1'), a2card = cards(p).find((li) => li.getAttribute('data-level') === 'a2');
    assert.ok(!a1card.classList.contains('is-level-locked'), 'a1 is at/below the ceiling: unlocked');
    assert.ok(a2card.classList.contains('is-level-locked'), 'a2 is above the ceiling: locked');
    assert.ok(a2card.querySelector('.level-lock-overlay'), 'lock overlay appended');
    const link = a2card.querySelector('.course-card');
    assert.strictEqual(link.getAttribute('aria-disabled'), 'true');
    assert.strictEqual(a1card.querySelector('.course-card').getAttribute('aria-disabled'), null);
    const noModule = await run({ files: fx(), storage: s, modules: [] });
    assert.strictEqual(noModule.err(), null, 'decorateLevelLinks is wrapped in try/catch: a missing level-lock.js never breaks the page');
    assert.ok(!cards(noModule).some((li) => li.classList.contains('is-level-locked')), 'and without the module nothing gets decorated');
  });

  testAsync('courses/index.html: every shipped level renders as a card with the right stats; a fresh learner sees 0%/"Start course" and every card links to its own course.html', async () => {
    const courses = JSON.parse(RUN_READ('course_content', 'courses.json')), units = JSON.parse(RUN_READ('course_content', 'units.json'));
    const files = { '../course_content/courses.json': courses, '../course_content/units.json': units };
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => { files['../course_content/lessons/' + l + '.json'] = JSON.parse(RUN_READ('course_content', 'lessons', l + '.json')); });
    const p = await run({ files });
    assert.strictEqual(p.err(), null);
    const published = courses.filter((c) => c.status === 'published');
    const cs = cardsOf(p);
    assert.strictEqual(cs.length, published.length, 'one card per published course');
    cs.forEach((c) => {
      assert.strictEqual(c.href, './course.html?level=' + c.level);
      assert.strictEqual(c.pct, '0% complete'); assert.strictEqual(c.cta, 'Start course');
      const course = published.find((x) => x.level.toLowerCase() === c.level);
      const ownUnits = units.filter((u) => u.course_id === course.course_id);
      assert.strictEqual(c.units, String(ownUnits.length));
    });
  });

  test('static wiring: loads course-progress.js (not level-lock.js is also fine — it is loaded too) before the inline script; exposes #grid', () => {
    assert.ok(HTML.indexOf('shared/js/course-progress.js') > 0 && HTML.indexOf('shared/js/course-progress.js') < HTML.lastIndexOf('<script>'));
    assert.ok(HTML.indexOf('shared/js/level-lock.js') > 0 && HTML.indexOf('shared/js/level-lock.js') < HTML.lastIndexOf('<script>'));
    assert.ok(/id="grid"/.test(HTML));
  });
})();

// ============================================================
console.log('main/progress.html: page rendering (Agent 185)');
// ============================================================
(function () {
  // HANDOFF_AGENT_184.md "Next agent - start here" item 1. The WHOLE inline script is run for real
  // via the hoisted makeRunPage against a fake fetch (per-level quizzes.json manifests only — this
  // page has no course_content dependency, it derives everything else from localStorage) and fake
  // localStorage. No shared/js module is loaded: the page reads mylingo.progress.v1 and
  // mylingo.gamification.v1 directly and has no level-lock check at all.
  const HTML = RUN_READ('main', 'progress.html');
  const SCRIPT = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
  const run = (o) => { o = o || {}; return makeRunPage(HTML, SCRIPT, 'stats')(Object.assign({ modules: [] }, o)); };

  const PK = 'mylingo.progress.v1', GK = 'mylingo.gamification.v1';
  const E = (id, over) => Object.assign({ id, level: 'a1', status: 'completed', best: 80, attempts: 1, lastAccess: 1000, title: 'Q ' + id }, over || {});
  const manifestFiles = (lens) => {
    const f = {};
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l, i) => { f['../' + l + '/quizzes.json'] = Array.from({ length: lens[i] || 0 }, (_, k) => ({ id: l + '-' + k })); });
    return f;
  };
  const stats = (p) => p.els.stats.querySelectorAll('.n').map((e) => e.textContent);
  const rows = (p) => p.els.recent.querySelectorAll('.row').map((r) => ({
    href: r.getAttribute('href'), badge: r.querySelector('.badge').textContent, title: r.querySelector('.meta').querySelector('b').textContent,
    small: r.querySelector('.meta').querySelector('small').textContent, pct: r.querySelector('.pct').textContent,
  }));
  const levelCards = (p) => p.els.levels.querySelectorAll('.level').map((a) => ({
    href: a.getAttribute('href'), label: a.querySelector('b').textContent,
    pct: a.querySelector('.lv-pct').textContent, barWidth: a.querySelector('.lv-bar').querySelector('i').getAttribute('style'), meta: a.querySelector('.lv-meta').textContent,
  }));

  testAsync('main/progress.html: top stats - attempted / completed / avg best (of entries WITH a score) / XP; entries missing an id are dropped entirely; no gamification data -> XP 0', async () => {
    const p1 = { [E('a1-1').id]: E('a1-1', { best: 80 }), [E('a1-2').id]: E('a1-2', { status: 'in-progress', best: null }), noId: { level: 'a1', status: 'completed', best: 100 } };
    const p = await run({ files: manifestFiles([]), storage: { [PK]: JSON.stringify(p1) } });
    assert.deepStrictEqual(stats(p), ['2', '1', '80%', '0'], 'the id-less record is invisible everywhere; avg only over the one scored entry');
    const withGam = await run({ files: manifestFiles([]), storage: { [PK]: JSON.stringify(p1), [GK]: JSON.stringify({ xpTotal: 340, streak: 5 }) } });
    assert.strictEqual(stats(withGam)[3], '340');
    const junkGam = await run({ files: manifestFiles([]), storage: { [GK]: JSON.stringify({ xpTotal: 'nope' }) } });
    assert.strictEqual(stats(junkGam)[3], '0', 'a non-number xpTotal falls back to 0');
    const empty = await run({ files: manifestFiles([]) });
    assert.deepStrictEqual(stats(empty), ['0', '0', '\u2014', '0'], 'no entries at all -> em dash for average, not 0%');
  });

  testAsync('main/progress.html: recent activity - most-recent-first by lastAccess, capped at 8, badge/title/attempts-pluralised/time-ago, pct falls back best -> latest -> 0; empty state when nothing attempted', async () => {
    const p = {};
    for (let i = 0; i < 10; i++) p['q' + i] = E('q' + i, { lastAccess: i, attempts: i === 3 ? 1 : 2 });
    const r = await run({ files: manifestFiles([]), storage: { [PK]: JSON.stringify(p) } });
    const rs = rows(r);
    assert.strictEqual(rs.length, 8, 'capped at 8');
    assert.deepStrictEqual(rs.map((x) => x.href.split('quiz=')[1].split('&')[0]), ['q9', 'q8', 'q7', 'q6', 'q5', 'q4', 'q3', 'q2'], 'newest lastAccess first');
    assert.strictEqual(rs[6].small.split(' \u00b7 ')[0], '1 attempt', 'q3 has attempts:1 -> singular');
    assert.strictEqual(rs[0].small.split(' \u00b7 ')[0], '2 attempts');
    assert.ok(rs[0].href.startsWith('../shared/quiz.html?quiz=q9&level=a1'));
    assert.strictEqual(rs[0].badge, 'A1');
    const noTitle = await run({ files: manifestFiles([]), storage: { [PK]: JSON.stringify({ x1: E('x1', { title: undefined }) }) } });
    assert.strictEqual(rows(noTitle)[0].title, 'x1', 'missing title falls back to the id');
    const fallbackPct = await run({ files: manifestFiles([]), storage: { [PK]: JSON.stringify({ x1: E('x1', { best: null, latest: 45 }) }) } });
    assert.strictEqual(rows(fallbackPct)[0].pct, '45%');
    const noBoth = await run({ files: manifestFiles([]), storage: { [PK]: JSON.stringify({ x1: E('x1', { best: null, latest: null }) }) } });
    assert.strictEqual(rows(noBoth)[0].pct, '0%');
    const nothing = await run({ files: manifestFiles([]) });
    assert.ok(nothing.els.recent.querySelector('.empty'), 'no attempts at all -> the empty-state card');
    assert.strictEqual(nothing.els.recent.querySelectorAll('.row').length, 0);
  });

  testAsync('main/progress.html: escaping - a quiz title with markup is escaped in the recent-activity row (never injects real tags)', async () => {
    const p = await run({ files: manifestFiles([]), storage: { [PK]: JSON.stringify({ x1: E('x1', { title: 'T <b>x</b> & "q"' }) }) } });
    assert.strictEqual(rows(p)[0].title, 'T <b>x</b> & "q"');
    assert.strictEqual(p.els.recent.querySelector('b').querySelectorAll('b').length, 0, 'no injected <b> from the title');
  });

  testAsync('main/progress.html: per-level cards - % and meta text use the REAL quizzes.json total (completed/total) when the manifest loads; falls back to completed/attempted when a level\u2019s manifest is empty/missing; level is matched case-insensitively', async () => {
    const p = { x1: E('x1', { level: 'A1', status: 'completed' }), x2: E('x2', { level: 'a1', status: 'in-progress' }) };
    const r = await run({ files: manifestFiles([4, 0, 0, 0, 0, 0]), storage: { [PK]: JSON.stringify(p) } });
    const cards = levelCards(r);
    const a1 = cards[0], a2 = cards[1];
    assert.strictEqual(a1.pct, '25%', '1 of 4 manifest entries completed (case-insensitive level match)');
    assert.strictEqual(a1.meta, '1 / 4 completed');
    assert.strictEqual(a1.barWidth, 'width:25%');
    assert.strictEqual(a1.href, '../a1/dashboard.html');
    assert.strictEqual(a2.pct, '0%'); assert.strictEqual(a2.meta, 'Not started', 'a2 has no attempts and an empty manifest');
    const p2 = { y1: E('y1', { level: 'b1', status: 'completed' }), y2: E('y2', { level: 'b1', status: 'in-progress' }) };
    const r2 = await run({ files: manifestFiles([0, 0, 0, 0, 0, 0]), storage: { [PK]: JSON.stringify(p2) } });
    const b1 = levelCards(r2)[2];
    assert.strictEqual(b1.pct, '50%', 'no manifest total -> falls back to completed/attempted (1 of 2)');
    assert.strictEqual(b1.meta, '1 completed');
  });

  testAsync('main/progress.html: PINNED - even when every quizzes.json fetch fails outright, the page still renders a full per-level breakdown (the top-level .catch() after Promise.all is effectively unreachable: every per-item fetch already has its own .catch(()=>[]))', async () => {
    const p = { z1: E('z1', { level: 'c2', status: 'completed' }) };
    const thrown = {}; ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => { thrown['../' + l + '/quizzes.json'] = 'throw'; });
    const r = await run({ files: thrown, storage: { [PK]: JSON.stringify(p) } });
    const c2 = levelCards(r)[5];
    assert.strictEqual(c2.pct, '100%'); assert.strictEqual(c2.meta, '1 completed');
    assert.strictEqual(r.els.levels.querySelectorAll('.level').length, 6, 'all six level cards still render despite every manifest fetch failing');
  });

  testAsync('main/progress.html: PINNED - no level-lock check at all; a level the learner has not reached still shows its real completion card (unlike course.html/index.html which gate or decorate)', async () => {
    const s = { 'mylingo.chosenLevel.v1': JSON.stringify({ level: 'a1', source: 'assessment', timestamp: 1 }) };
    const p = { z1: E('z1', { level: 'c2', status: 'completed' }) };
    const r = await run({ files: manifestFiles([1, 0, 0, 0, 0, 1]), storage: Object.assign({ [PK]: JSON.stringify(p) }, s) });
    const c2 = levelCards(r)[5];
    assert.strictEqual(c2.pct, '100%', 'c2 is locked by the chosen level, but progress.html has no lock check and shows it anyway');
    assert.ok(!r.els.levels.innerHTML.includes('is-level-locked'));
  });

  test('static wiring: no level-lock.js reference anywhere on the page (PINNED, same class as journey.html); #stats/#levels/#recent all present; app-shell.js loads after the content containers', () => {
    assert.ok(HTML.indexOf('level-lock') < 0, 'progress.html never references level-lock.js');
    assert.ok(/id="stats"/.test(HTML) && /id="levels"/.test(HTML) && /id="recent"/.test(HTML));
    assert.ok(HTML.indexOf('shared/js/app-shell.js') < HTML.lastIndexOf('<script>'));
  });
})();

// ============================================================
console.log('main/placement.html: page rendering (Agent 186)');
// ============================================================
(function () {
  // HANDOFF_AGENT_185.md "Next agent - start here" item 1. The page has TWO inline scripts (the manual
  // theme toggle and the orientation quiz); both are run for real via the hoisted makeRunPage against the
  // REAL gamification / orientation / placement / level-lock modules. Two harness extensions (Agent 186):
  // `namedGlobals` (the page uses an undeclared `back`, which only works through browser named-element
  // access) and `setup` (seeds the parts of the markup the harness does not parse: the progress bar's <i>
  // and the six manual level links, taken verbatim from the page).
  const HTML = RUN_READ('main', 'placement.html');
  const SCRIPTS = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const THEME = SCRIPTS.find((s) => s.indexOf('mylingo.theme.manual') >= 0);
  const SCRIPT = SCRIPTS.find((s) => s.indexOf("'use strict';var O=") >= 0);
  const LEVELS_HTML = HTML.match(/<div class="levels">([\s\S]*?)<\/div><\/section>/)[1];
  assert.ok(THEME && SCRIPT && LEVELS_HTML);
  const OSB = { localStorage: makeFakeStorage() }; OSB.window = OSB; RUN_VM.createContext(OSB); RUN_VM.runInContext(RUN_MOD.or, OSB);
  const OR = OSB.MylingoOrientation, NQ = OR.QUESTIONS.length;
  const OK = 'mylingo.orientation.v1', LK = 'mylingo.chosenLevel.v1', GK = 'mylingo.gamification.v1';
  const run = (o) => {
    o = o || {}; const setup = o.setup;
    return makeRunPage(HTML, SCRIPT, 'question')(Object.assign({ modules: ['ga', 'or', 'pl', 'll'], namedGlobals: ['back'], files: {} }, o, {
      setup: (els, sb, store) => { els.progress.innerHTML = '<i></i>'; els.manual.innerHTML = LEVELS_HTML; els.stats.hidden = true; if (setup) setup(els, sb, store); },
    }));
  };
  const press = (el) => { if (typeof el.onclick === 'function') el.onclick(); else el.click(); };
  const btns = (p) => p.els.options.querySelectorAll('button');
  const pick = (p, n) => btns(p)[n].click();
  const answerAll = (p, arr) => arr.forEach((n) => pick(p, n));
  const st = (p) => JSON.parse(p.store.getItem(OK));
  const lk = (p) => JSON.parse(p.store.getItem(LK));
  const hid = (el) => el.classList.contains('hidden');
  const fullState = (answers, level) => JSON.stringify({ version: 1, completedAt: '2026-01-01T00:00:00.000Z', answers, score: 1, maxScore: OR.MAX_SCORE, recommendedLevel: level });
  const links = (p) => p.els.manual.querySelectorAll('a');

  testAsync('main/placement.html: fresh load - intro shown, first question with five numbered answers, progress 1/10, Back hidden, result + manual hidden', async () => {
    const p = await run();
    assert.strictEqual(hid(p.els.intro), false);
    assert.strictEqual(p.els.orientation.hidden, false);
    assert.strictEqual(hid(p.els.resultCard), true);
    assert.strictEqual(hid(p.els.manual), true);
    assert.strictEqual(p.els.question.textContent, OR.QUESTIONS[0].text);
    assert.strictEqual(p.els.progressLabel.textContent, 'Question 1 of ' + NQ);
    assert.strictEqual(p.els.progress.querySelector('i').style.width, '10%');
    assert.strictEqual(p.els.progress.getAttribute('aria-valuenow'), '10');
    assert.strictEqual(p.els.back.style.display, 'none');
    assert.strictEqual(p.els.question.focusCount, 1, 'the question heading takes focus on render');
    const b = btns(p);
    assert.strictEqual(b.length, 5);
    b.forEach((x, n) => {
      assert.strictEqual(x.type, 'button');
      assert.strictEqual(x.className, 'answer');
      assert.strictEqual(x.querySelector('.num').textContent, String(n + 1));
      assert.strictEqual(x.querySelector('span:last-child').textContent, OR.QUESTIONS[0].answers[n]);
    });
    assert.strictEqual(p.store.getItem(OK), null, 'nothing is persisted until the first answer');
  });

  testAsync('main/placement.html: answering advances, persists an in-progress state (no completedAt / level), Back reappears and returns with the earlier choice highlighted', async () => {
    const p = await run();
    pick(p, 3);
    assert.strictEqual(p.els.question.textContent, OR.QUESTIONS[1].text);
    assert.strictEqual(p.els.progressLabel.textContent, 'Question 2 of ' + NQ);
    assert.strictEqual(p.els.progress.querySelector('i').style.width, '20%');
    assert.strictEqual(p.els.back.style.display, 'inline-flex');
    const s = st(p);
    assert.deepStrictEqual([s.version, s.completedAt, s.recommendedLevel, s.maxScore], [1, null, null, OR.MAX_SCORE]);
    assert.deepStrictEqual(s.answers, [3]);
    assert.strictEqual(s.score, OR.scoreAnswers([3]));
    pick(p, 1);
    assert.deepStrictEqual(st(p).answers, [3, 1]);
    press(p.els.back);
    assert.strictEqual(p.els.progressLabel.textContent, 'Question 2 of ' + NQ, 'Back from Q3 lands on Q2');
    assert.ok(btns(p)[1].className.split(' ').includes('selected') && btns(p).filter((x) => x.className.indexOf('selected') >= 0).length === 1, 'the earlier answer is pre-selected');
    press(p.els.back);
    assert.strictEqual(p.els.question.textContent, OR.QUESTIONS[0].text);
    assert.strictEqual(p.els.back.style.display, 'none');
    press(p.els.back);
    assert.strictEqual(p.els.question.textContent, OR.QUESTIONS[0].text, 'Back on Q1 is a no-op');
  });

  testAsync('main/placement.html: answering all ten shows the result - chip, copy, plan, level-lock ceiling set as an assessment, state completed, Start assessment link', async () => {
    const cases = [[4, 'B1'], [0, 'A1'], [2, 'A2']];
    for (const [v, lvl] of cases) {
      const p = await run();
      answerAll(p, new Array(NQ).fill(v));
      assert.strictEqual(p.els.orientation.hidden, true);
      assert.strictEqual(hid(p.els.resultCard), false);
      assert.strictEqual(hid(p.els.intro), true);
      assert.strictEqual(hid(p.els.manual), true);
      assert.strictEqual(p.els.levelChip.textContent, lvl);
      assert.ok(p.els.resultCopy.textContent.indexOf('Based on your quick answers, ' + lvl + ' looks like a useful starting point.') === 0);
      assert.ok(p.els.resultCopy.textContent.indexOf('the 120-question assessment will set your level') > 0);
      assert.ok(p.els.assessmentPlan.textContent.indexOf('120-question') >= 0);
      assert.strictEqual(p.els.resultTitle.focusCount, 1);
      const l = lk(p);
      assert.deepStrictEqual([l.level, l.source], [lvl.toLowerCase(), 'assessment']);
      const s = st(p);
      assert.strictEqual(s.recommendedLevel, lvl.toLowerCase());
      assert.ok(!isNaN(Date.parse(s.completedAt)));
      assert.strictEqual(s.answers.length, NQ);
      assert.strictEqual(s.score, OR.recommendation(new Array(NQ).fill(v)).score);
      press(p.els.startAssessment);
      assert.strictEqual(p.sb.location.href, OR.placementUrl(lvl.toLowerCase()) + '&stage=primary');
      assert.ok(p.sb.location.href.indexOf('mode=placement') > 0 && p.sb.location.href.indexOf('/' + lvl.toLowerCase() + '/dashboard.html') > 0);
    }
    const noPl = await run({ modules: ['ga', 'or', 'll'] });
    answerAll(noPl, new Array(NQ).fill(4));
    assert.strictEqual(noPl.els.assessmentPlan.textContent, '', 'without placement.js the plan line is left empty');
  });

  testAsync('main/placement.html: resume - partial answers resume at the next question with earlier ones kept; extra answers are sliced; ten answers without completion resume on the LAST question', async () => {
    const p = await run({ storage: { [OK]: JSON.stringify({ version: 1, completedAt: null, answers: [1, 2, 3, 4], recommendedLevel: null }) } });
    assert.strictEqual(p.els.progressLabel.textContent, 'Question 5 of ' + NQ);
    assert.strictEqual(p.els.question.textContent, OR.QUESTIONS[4].text);
    assert.strictEqual(btns(p).filter((x) => x.className.indexOf('selected') >= 0).length, 0);
    assert.strictEqual(p.els.back.style.display, 'inline-flex');
    press(p.els.back);
    assert.ok(btns(p)[4].className.indexOf('selected') >= 0, 'the stored Q4 answer (index 4) is kept');
    pick(p, 0);
    assert.deepStrictEqual(st(p).answers, [1, 2, 3, 0], 'writing continues from the resumed answers');
    const ten = await run({ storage: { [OK]: JSON.stringify({ version: 1, completedAt: null, answers: [0, 1, 2, 3, 4, 0, 1, 2, 3, 4] }) } });
    assert.strictEqual(ten.els.progressLabel.textContent, 'Question 10 of ' + NQ);
    assert.ok(btns(ten)[4].className.indexOf('selected') >= 0, 'Q10 shows its stored answer');
    const many = await run({ storage: { [OK]: JSON.stringify({ version: 1, completedAt: null, answers: new Array(15).fill(2) }) } });
    assert.strictEqual(many.els.progressLabel.textContent, 'Question 10 of ' + NQ);
    pick(many, 1);
    assert.strictEqual(st(many).answers.length, NQ, 'answers beyond the ten questions are dropped');
  });

  testAsync('main/placement.html: garbage stored state (invalid JSON / array / string / non-array answers) is a fresh start, never a crash', async () => {
    for (const raw of ['{nope', '"x"', 'null', '[]', JSON.stringify({ answers: 'abc' }), JSON.stringify({ answers: { 0: 1 } })]) {
      const p = await run({ storage: { [OK]: raw } });
      assert.strictEqual(p.els.progressLabel.textContent, 'Question 1 of ' + NQ, raw);
      assert.strictEqual(hid(p.els.resultCard), true, raw);
    }
    const noLevel = await run({ storage: { [OK]: JSON.stringify({ answers: new Array(NQ).fill(1), completedAt: 'x' }) } });
    assert.strictEqual(hid(noLevel.els.resultCard), true, 'complete answers + completedAt but no recommendedLevel is not a finished state');
    assert.strictEqual(noLevel.els.progressLabel.textContent, 'Question 10 of ' + NQ);
    const short = await run({ storage: { [OK]: JSON.stringify({ answers: [1, 2], completedAt: 'x', recommendedLevel: 'b1' }) } });
    assert.strictEqual(hid(short.els.resultCard), true, 'a stored result with fewer than ten answers is not trusted');
    assert.strictEqual(short.els.progressLabel.textContent, 'Question 3 of ' + NQ);
  });

  testAsync('main/placement.html: a finished orientation goes straight to the result on load (no questions), using the stored level', async () => {
    const p = await run({ storage: { [OK]: fullState(new Array(NQ).fill(3), 'a2') } });
    assert.strictEqual(hid(p.els.resultCard), false);
    assert.strictEqual(p.els.levelChip.textContent, 'A2');
    assert.strictEqual(hid(p.els.intro), true);
    assert.strictEqual(hid(p.els.manual), true);
    assert.strictEqual(p.els.question.textContent, '', 'no question is rendered');
    assert.strictEqual(btns(p).length, 0);
    press(p.els.startAssessment);
    assert.strictEqual(p.sb.location.href, OR.placementUrl('a2') + '&stage=primary');
  });

  testAsync('main/placement.html: PINNED - merely OPENING the page with a finished quick estimate re-writes the level-lock ceiling from that estimate, even over a higher ceiling earned by the real assessment', async () => {
    const p = await run({ storage: { [OK]: fullState(new Array(NQ).fill(0), 'a1'), [LK]: JSON.stringify({ level: 'b1', source: 'assessment', timestamp: 1 }) } });
    assert.strictEqual(lk(p).level, 'a1', 'the ceiling dropped from b1 to a1 just by visiting the page');
    const ll = p.sb.MylingoLevelLock;
    assert.strictEqual(ll.isLocked('b1'), true, 'b1, earned via the assessment, is locked again');
    assert.strictEqual(ll.isLocked('a2'), true);
  });

  testAsync('main/placement.html: Change answers really reopens the quiz from Q1 with the previous answers pre-selected (Agent 186 fix - it used to re-run start() and bounce straight back to the same result)', async () => {
    const p = await run();
    answerAll(p, [4, 4, 3, 3, 2, 2, 1, 1, 0, 0]);
    assert.strictEqual(hid(p.els.resultCard), false);
    press(p.els.editAnswers);
    assert.strictEqual(hid(p.els.resultCard), true, 'result hidden');
    assert.strictEqual(p.els.orientation.hidden, false);
    assert.strictEqual(hid(p.els.intro), false);
    assert.strictEqual(hid(p.els.manual), true);
    assert.strictEqual(p.els.question.textContent, OR.QUESTIONS[0].text);
    assert.strictEqual(p.els.progressLabel.textContent, 'Question 1 of ' + NQ);
    assert.strictEqual(p.els.back.style.display, 'none');
    assert.ok(btns(p)[4].className.indexOf('selected') >= 0, 'Q1 shows the previous answer');
    const s = st(p);
    assert.deepStrictEqual([s.completedAt, s.recommendedLevel], [null, null], 'the quiz is no longer recorded as finished');
    assert.deepStrictEqual(s.answers, [4, 4, 3, 3, 2, 2, 1, 1, 0, 0], 'previous answers are kept');
    for (let n = 0; n < NQ; n++) pick(p, 0);
    assert.strictEqual(p.els.levelChip.textContent, 'A1', 'a new set of answers produces a new result');
    assert.strictEqual(lk(p).level, 'a1');
    // also from a page load that went straight to the stored result (the closure has no answers yet)
    const q = await run({ storage: { [OK]: fullState([1, 2, 3, 4, 0, 1, 2, 3, 4, 0], 'a2') } });
    press(q.els.editAnswers);
    assert.strictEqual(q.els.progressLabel.textContent, 'Question 1 of ' + NQ);
    assert.deepStrictEqual(st(q).answers, [1, 2, 3, 4, 0, 1, 2, 3, 4, 0]);
    assert.ok(btns(q)[1].className.indexOf('selected') >= 0);
  });

  testAsync('main/placement.html: Skip orientation opens the manual level chooser (focus on the first link, #manual anchor); Choose a level yourself does the same from the result and keeps the intro', async () => {
    const p = await run();
    press(p.els.skip);
    assert.strictEqual(hid(p.els.manual), false);
    assert.strictEqual(p.els.orientation.hidden, true);
    assert.strictEqual(hid(p.els.intro), true);
    assert.strictEqual(p.sb.location.href, '#manual');
    assert.strictEqual(links(p)[0].focusCount, 1);
    const q = await run();
    answerAll(q, new Array(NQ).fill(2));
    press(q.els.chooseLevel);
    assert.strictEqual(hid(q.els.manual), false);
    assert.strictEqual(hid(q.els.resultCard), true);
    assert.strictEqual(hid(q.els.intro), false);
    assert.strictEqual(q.sb.location.href, '#manual');
    assert.strictEqual(links(q)[0].focusCount, 1);
    assert.strictEqual(lk(q).level, 'a2', 'choosing to pick manually leaves the estimated ceiling in place');
  });

  testAsync('main/placement.html: manual level links - six, A1..C2, to course.html?level=; levels above the ceiling are decorated locked (and neutralised), levels at/below stay open; nothing chosen = nothing locked', async () => {
    const lv = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const none = await run();
    assert.deepStrictEqual(links(none).map((a) => a.getAttribute('data-level')), lv);
    assert.deepStrictEqual(links(none).map((a) => a.getAttribute('href')), lv.map((l) => '../courses/course.html?level=' + l));
    assert.strictEqual(links(none).filter((a) => a.classList.contains('is-level-locked')).length, 0);
    const p = await run({ storage: { [LK]: JSON.stringify({ level: 'a2', source: 'assessment' }) } });
    assert.deepStrictEqual(links(p).map((a) => a.classList.contains('is-level-locked')), [false, false, true, true, true, true]);
    assert.strictEqual(links(p)[2].getAttribute('aria-disabled'), 'true');
    assert.strictEqual(links(p)[1].getAttribute('aria-disabled'), null);
    // the ceiling changes through the quiz itself, and the chooser is re-decorated when opened
    const q = await run();
    answerAll(q, new Array(NQ).fill(0));
    press(q.els.chooseLevel);
    assert.deepStrictEqual(links(q).map((a) => a.classList.contains('is-level-locked')), [false, true, true, true, true, true]);
    // opening the chooser re-decorates against the CURRENT ceiling, and a throwing decorator is swallowed
    const late = await run();
    late.store.setItem(LK, JSON.stringify({ level: 'a1', source: 'assessment' }));
    press(late.els.skip);
    assert.deepStrictEqual(links(late).map((a) => a.classList.contains('is-level-locked')), [false, true, true, true, true, true]);
    const boom = await run();
    boom.sb.MylingoLevelLock.decorateLevelLinks = () => { throw new Error('boom'); };
    press(boom.els.skip);
    assert.strictEqual(hid(boom.els.manual), false, 'a failing decorator does not stop the chooser opening');
    assert.strictEqual(links(boom)[0].focusCount, 1);
    // without level-lock.js decoration is skipped silently, everything stays open
    const nl = await run({ modules: ['ga', 'or', 'pl'] });
    press(nl.els.skip);
    assert.strictEqual(links(nl).filter((a) => a.classList.contains('is-level-locked')).length, 0);
    assert.strictEqual(hid(nl.els.manual), false);
  });

  testAsync('main/placement.html: header stats - shown only when XP or the streak is above zero; values come from the real gamification state; missing / broken data leaves them hidden', async () => {
    const g = (o) => ({ [GK]: JSON.stringify(o) });
    const a = await run({ storage: g({ xpTotal: 120, streak: 3 }) });
    assert.strictEqual(a.els.stats.hidden, false);
    assert.strictEqual(a.els.xp.textContent, '120');
    assert.strictEqual(a.els.streak.textContent, '3');
    const onlyStreak = await run({ storage: g({ streak: 2 }) });
    assert.strictEqual(onlyStreak.els.stats.hidden, false);
    assert.strictEqual(onlyStreak.els.xp.textContent, '0');
    const onlyXp = await run({ storage: g({ xpTotal: 5 }) });
    assert.strictEqual(onlyXp.els.stats.hidden, false);
    assert.strictEqual(onlyXp.els.streak.textContent, '0');
    for (const s of [{}, { xpTotal: 0, streak: 0 }, { xpTotal: 'abc', streak: -1 }]) assert.strictEqual((await run({ storage: g(s) })).els.stats.hidden, true, JSON.stringify(s));
    assert.strictEqual((await run({ storage: { [GK]: '{bad' } })).els.stats.hidden, true);
    assert.strictEqual((await run({ modules: ['or', 'pl', 'll'], storage: g({ xpTotal: 9 }) })).els.stats.hidden, true, 'no gamification.js -> stats stay hidden, no crash');
  });

  testAsync('main/placement.html: no orientation.js -> the script exits at once (nothing rendered, nothing written) and the manual chooser in the markup stays available; a throwing localStorage never blocks the flow', async () => {
    const p = await run({ modules: ['ga', 'pl', 'll'] });
    assert.strictEqual(p.els.question.textContent, '');
    assert.strictEqual(hid(p.els.manual), false, 'never hidden by the script');
    assert.ok(!/id="manual"[^>]*class="[^"]*hidden/.test(HTML) && !/<section class="manual hidden/.test(HTML), 'the chooser is visible in the raw markup');
    assert.ok(/id="orientation"[^>]*\bhidden\b/.test(HTML), 'the quiz card is hidden in the raw markup until the script shows it');
    const f = await run({ setup: (els, sb, store) => { store.setItem = () => { throw new Error('quota'); }; } });
    answerAll(f, new Array(NQ).fill(4));
    assert.strictEqual(hid(f.els.resultCard), false, 'the result still shows when nothing can be saved');
    assert.strictEqual(f.els.levelChip.textContent, 'B1');
    assert.strictEqual(f.store.getItem(OK), null);
  });

  testAsync('main/placement.html: PINNED - the script uses an undeclared `back` that only works through browser named-element access (id="back"); without it the whole quiz fails to start', async () => {
    let threw = null;
    try { await run({ namedGlobals: [] }); } catch (e) { threw = e; }
    assert.ok(threw && /back is not defined/.test(threw.message), 'expected a ReferenceError for `back`, got: ' + (threw && threw.message));
    assert.ok(/id="back"/.test(HTML) && !/\b(?:var|let|const)\s+back\b/.test(SCRIPT), 'the only definition of `back` is the element id');
  });

  test('main/placement.html: theme toggle script - default light; saved dark restored; junk saved value = light; click toggles, persists and updates icon + aria-label + title', () => {
    const go = (saved) => {
      const store = makeFakeStorage(); if (saved !== undefined) store.setItem('mylingo.theme.manual', saved);
      const button = new PN(1, 'button'), root = new PN(1, 'html');
      const sb = { localStorage: store, document: { documentElement: root, getElementById: (id) => (id === 'themeToggle' ? button : null) } };
      RUN_VM.createContext(sb); RUN_VM.runInContext(THEME, sb);
      return { store, button, root };
    };
    let t = go();
    assert.strictEqual(t.root.getAttribute('data-theme'), 'light');
    assert.strictEqual(t.button.textContent, '\u263E');
    assert.strictEqual(t.button.getAttribute('aria-label'), 'Switch to dark mode');
    assert.strictEqual(t.button.title, 'Switch to dark mode');
    t.button.click();
    assert.strictEqual(t.root.getAttribute('data-theme'), 'dark');
    assert.strictEqual(t.store.getItem('mylingo.theme.manual'), 'dark');
    assert.strictEqual(t.button.textContent, '\u2600\uFE0E');
    assert.strictEqual(t.button.getAttribute('aria-label'), 'Switch to light mode');
    assert.strictEqual(t.button.title, 'Switch to light mode');
    t.button.click();
    assert.strictEqual(t.root.getAttribute('data-theme'), 'light');
    assert.strictEqual(t.store.getItem('mylingo.theme.manual'), 'light');
    t = go('dark');
    assert.strictEqual(t.root.getAttribute('data-theme'), 'dark');
    assert.strictEqual(t.button.getAttribute('aria-label'), 'Switch to light mode');
    assert.strictEqual(go('blue').root.getAttribute('data-theme'), 'light');
    assert.strictEqual(go('').root.getAttribute('data-theme'), 'light');
  });

  test('main/placement.html: static wiring - every getElementById id exists, module order (gamification, orientation, placement, level-lock) before the page script, app-shell last, chooser present without JS', () => {
    const ids = new Set([...HTML.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    const used = [...SCRIPT.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
    assert.ok(used.length >= 15, 'found ' + used.length);
    used.forEach((id) => assert.ok(ids.has(id), 'getElementById(' + id + ') has no element'));
    const pos = (s) => HTML.indexOf(s);
    ['gamification.js', 'orientation.js', 'placement.js', 'level-lock.js'].forEach((m, i, a) => { assert.ok(pos('shared/js/' + m) > 0, m); if (i) assert.ok(pos('shared/js/' + a[i - 1]) < pos('shared/js/' + m), m + ' order'); });
    assert.ok(pos('shared/js/level-lock.js') < HTML.indexOf(SCRIPT), 'modules load before the page script');
    assert.ok(HTML.lastIndexOf('shared/js/app-shell.js') > HTML.indexOf(SCRIPT), 'app-shell loads last');
    assert.strictEqual((HTML.match(/data-level="/g) || []).length, 6);
    assert.ok(/id="editAnswers"/.test(HTML) && /getElementById\('editAnswers'\)\.onclick=edit\b/.test(SCRIPT), 'Change answers is bound to edit(), not start()');
    assert.ok(!/getElementById\('editAnswers'\)\.onclick=start\b/.test(SCRIPT));
  });
})();

// ============================================================
console.log('<level>/index.html + <level>/dashboard.html: page rendering (Agent 187)');
// ============================================================
(function () {
  // HANDOFF_AGENT_186.md "Next agent - start here" items 1-2. One script per page type is shared by all six
  // levels, so the six copies are asserted byte-identical, one copy is run for real (hoisted makeRunPage, real
  // level-lock.js, real gamification.js for the dashboard, a stubbed offline-packs / mastery-review UI to see the
  // mount calls), and the level itself is driven through location.pathname (makeRunPage gained `pathname`).
  const LV = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  const PK = 'mylingo.progress.v1', LK = 'mylingo.chosenLevel.v1', GK = 'mylingo.gamification.v1';
  const scriptOf = (html) => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.indexOf("'use strict'") >= 0);
  const IDX = RUN_READ('a1', 'index.html'), DASH = RUN_READ('a1', 'dashboard.html');
  const IDX_S = scriptOf(IDX), DASH_S = scriptOf(DASH);
  assert.ok(IDX_S && DASH_S);
  const fire = (el, t) => (el.listeners[t] || []).forEach((f) => f({ type: t }));
  const cfg = (mounts, o) => (els, sb) => {
    if (els.q) { els.q.value = ''; els.cat.value = ''; }
    if (mounts) {
      sb.MylingoOfflinePacksUI = { mount: (el, opts) => { mounts.push(['packs', el && el.id, opts && opts.level]); if (o && o.throwPacks) throw new Error('boom'); } };
      sb.MylingoMasteryReviewUI = { mount: (el, opts) => { mounts.push(['mastery', el && el.id, opts && opts.level]); } };
    }
  };
  const runIdx = (level, o) => { o = o || {}; const mounts = o.mounts === false ? null : []; return makeRunPage(IDX, IDX_S, 'grid')(Object.assign({ modules: ['ll'], pathname: '/' + level + '/index.html', files: {} }, o, { setup: (els, sb, st) => { if (o.mounts !== false) cfg(mounts, o)(els, sb); if (o.setup) o.setup(els, sb, st); } })).then((p) => { p.mounts = mounts; return p; }); };
  const runDash = (level, o) => { o = o || {}; const mounts = []; return makeRunPage(DASH, DASH_S, 'body')(Object.assign({ modules: ['ll', 'ga'], pathname: '/' + level + '/dashboard.html', files: {} }, o, { setup: (els, sb, st) => { cfg(mounts, o)(els, sb); if (o.setup) o.setup(els, sb, st); } })).then((p) => { p.mounts = mounts; return p; }); };
  const Q = (id, over) => Object.assign({ id, title: 'Quiz ' + id, topic: 'Topic ' + id, category: 'Grammar', description: '', tags: '' }, over || {});
  const E = (id, over) => Object.assign({ id, level: 'a1', status: 'completed', best: 80, attempts: 1, lastAccess: Date.now() - 60000, title: 'T ' + id }, over || {});
  const prog = (list) => JSON.stringify(list.reduce((m, e) => { m[e.id] = e; return m; }, {}));
  const cards = (p) => p.els.grid.querySelectorAll('.card');
  const groups = (p) => p.els.grid.querySelectorAll('.topic-group').map((g) => ({ topic: g.querySelector('h2').textContent, n: g.querySelectorAll('.card').length }));

  test('<level>/index.html + dashboard.html: the six copies of each page are byte-identical (the level comes only from the URL) and every shipped level has both', () => {
    LV.forEach((l) => { assert.strictEqual(RUN_READ(l, 'index.html'), IDX, l + '/index.html differs'); assert.strictEqual(RUN_READ(l, 'dashboard.html'), DASH, l + '/dashboard.html differs'); });
  });

  // ---------------- index.html ----------------
  testAsync('<level>/index.html: the level is taken from the URL path - all six levels, upper case, a sub-path host, the folder URL (no index.html; Agent 187 fix) and the default', async () => {
    for (const l of LV) {
      const p = await runIdx(l, { files: { './quizzes.json': [Q(1)] } });
      assert.strictEqual(p.els.pageTitle.textContent, l.toUpperCase() + ' Practice');
      assert.strictEqual(p.sb.document.title, 'Mylingo ' + l.toUpperCase());
      assert.ok(p.els.pageSub.textContent.indexOf('at ' + l.toUpperCase() + '.') > 0);
      assert.ok(cards(p)[0].getAttribute('href').endsWith('&level=' + l));
    }
    const at = async (pathname) => (await runIdx('a1', { pathname, files: { './quizzes.json': [] } })).els.pageTitle.textContent;
    assert.strictEqual(await at('/B2/index.html'), 'B2 Practice');
    const up = await runIdx('a1', { pathname: '/B2/index.html', files: { './quizzes.json': [Q(1)] } });
    assert.ok(cards(up)[0].getAttribute('href').endsWith('&level=b2'), 'the level in links is lower case even for an upper-case URL');
    assert.deepStrictEqual(up.fetchOpts.map((x) => x && x.cache), ['no-store'], 'the quiz list is never served from the HTTP cache');
    assert.strictEqual(await at('/mylingo/c1/index.html'), 'C1 Practice');
    assert.strictEqual(await at('/b1/'), 'B1 Practice', 'the folder URL used to be read as the app root and fall back to A1');
    assert.strictEqual(await at('/mylingo/b2/'), 'B2 Practice', 'and, on a sub-path host, as the app folder name');
    assert.strictEqual(await at('/b1'), 'B1 Practice');
    assert.strictEqual(await at('/'), 'A1 Practice');
    assert.strictEqual(await at('/index.html'), 'A1 Practice');
  });

  testAsync('<level>/index.html: cards - grouped by topic (topic, else title, else "Other"), href / aria-label / status / best pill from stored progress, count + subtitle text', async () => {
    const files = { './quizzes.json': [Q('g1', { topic: 'Tenses', title: 'Present' }), Q('g2', { topic: 'Tenses', title: 'Past' }), Q('v1', { topic: '', title: 'Solo title', category: 'Vocabulary' }), { id: 'x', category: '' }, Q('sp ace&1', { topic: 'Odd' })] };
    const storage = { [PK]: prog([E('g1', { best: 90 }), E('g2', { status: 'in-progress', best: null, latest: 40 }), E('v1', { best: 0 })]) };
    const p = await runIdx('b1', { files, storage });
    assert.deepStrictEqual(groups(p), [{ topic: 'Tenses', n: 2 }, { topic: 'Solo title', n: 1 }, { topic: 'Other', n: 1 }, { topic: 'Odd', n: 1 }]);
    const cs = cards(p);
    assert.strictEqual(cs[0].getAttribute('href'), '../shared/quiz.html?quiz=g1&level=b1');
    assert.strictEqual(cs[0].getAttribute('aria-label'), 'Present, Completed');
    assert.strictEqual(cs[0].querySelector('.best').textContent, 'Best 90%');
    assert.strictEqual(cs[0].querySelector('.qstatus').textContent, 'Completed');
    assert.strictEqual(cs[1].querySelector('.qstatus').textContent, 'In progress');
    assert.strictEqual(cs[1].querySelector('.best'), null, 'an attempt with best = null has no best pill');
    assert.strictEqual(cs[2].querySelector('.best').textContent, 'Best 0%', 'a stored best of 0 still shows (null check, not truthiness)');
    assert.strictEqual(cs[3].querySelector('.qstatus').textContent, 'Not started');
    assert.strictEqual(cs[3].querySelector('b').textContent, '', 'a manifest entry without a title renders an empty heading');
    assert.strictEqual(cs[3].getAttribute('aria-label'), ', Not started', 'PINNED: ...and a card whose accessible name is just ", Not started"');
    assert.strictEqual(cs[4].getAttribute('href'), '../shared/quiz.html?quiz=sp%20ace%261&level=b1', 'the id is URL-encoded');
    assert.strictEqual(p.els.count.textContent, '5 quizzes');
    assert.strictEqual(p.els.pageSub.textContent, '5 quizzes at B1. Data-driven, one runtime.');
    const one = await runIdx('a1', { files: { './quizzes.json': [Q(1)] } });
    assert.strictEqual(one.els.count.textContent, '1 quiz');
    assert.ok(one.els.pageSub.textContent.indexOf('1 quiz at A1') === 0);
  });

  testAsync('<level>/index.html: escaping (title / topic / category / description / tags), at most three tag chips, no description paragraph when empty; category dropdown = sorted unique categories', async () => {
    const files = { './quizzes.json': [Q(1, { title: '<i>T</i> & "q"', topic: '<b>Tp</b>', category: 'Zed <x>', description: 'D <u>', tags: ' a<s> , b,, c , d ' }), Q(2, { category: 'Alpha' }), Q(3, { category: 'Alpha' }), { id: 4 }] };
    const p = await runIdx('a1', { files });
    const c = cards(p)[0];
    assert.strictEqual(c.querySelector('b').textContent, '<i>T</i> & "q"');
    assert.strictEqual(c.getAttribute('aria-label'), '<i>T</i> & "q", Not started', 'a quote in the title cannot break out of the aria-label attribute');
    assert.strictEqual(p.els.grid.querySelectorAll('i').length, 0, 'no injected <i>');
    assert.strictEqual(p.els.grid.querySelector('h2').textContent, '<b>Tp</b>');
    assert.strictEqual(c.querySelector('small').textContent, 'Zed <x>');
    assert.strictEqual(c.querySelector('.qdesc').textContent, 'D <u>');
    assert.deepStrictEqual(c.querySelectorAll('.chip').map((x) => x.textContent), ['a<s>', 'b', 'c'], 'trimmed, blanks dropped, capped at three');
    assert.strictEqual(cards(p)[1].querySelector('.qdesc'), null);
    assert.strictEqual(cards(p)[1].querySelector('.tagrow'), null);
    assert.deepStrictEqual(p.els.cat.querySelectorAll('option').map((o) => o.getAttribute('value')), ['', 'Alpha', 'Zed <x>']);
    assert.strictEqual(p.els.cat.querySelectorAll('option')[0].textContent, 'All categories');
  });

  testAsync('<level>/index.html: pagination - 24 per page, "Show more" appears and reveals the next page, hidden when everything is shown', async () => {
    const files = { './quizzes.json': Array.from({ length: 30 }, (_, i) => Q('q' + i)) };
    const p = await runIdx('a1', { files });
    assert.strictEqual(cards(p).length, 24);
    assert.strictEqual(p.els.more.style.display, 'block');
    assert.strictEqual(p.els.count.textContent, '30 quizzes');
    p.els.more.onclick(); await runSettle();
    assert.strictEqual(cards(p).length, 30);
    assert.strictEqual(p.els.more.style.display, 'none');
    const exact = await runIdx('a1', { files: { './quizzes.json': Array.from({ length: 24 }, (_, i) => Q('q' + i)) } });
    assert.strictEqual(exact.els.more.style.display, 'none', 'exactly one page = no Show more');
  });

  testAsync('<level>/index.html: search + category filter - case-insensitive over title / topic / category / tags, combined, reset to the first page, empty result message, "(filtered from N)"', async () => {
    const files = { './quizzes.json': [
      Q(1, { title: 'Present Simple', topic: 'Tenses', category: 'Grammar', tags: 'verbs,time' }),
      Q(2, { title: 'Colours', topic: 'Words', category: 'Vocabulary', tags: 'basic' }),
      Q(3, { title: 'Past Simple', topic: 'Tenses', category: 'Grammar', tags: 'verbs' }),
    ].concat(Array.from({ length: 30 }, (_, i) => Q('f' + i, { title: 'Filler ' + i, category: 'Filler' })))};
    const p = await runIdx('a1', { files });
    const ids = () => cards(p).map((c) => c.querySelector('b').textContent);
    p.els.q.value = '  SIMPLE '; fire(p.els.q, 'input');
    assert.deepStrictEqual(ids(), ['Present Simple', 'Past Simple']);
    assert.strictEqual(p.els.count.textContent, '2 quizzes (filtered from 33)');
    p.els.q.value = 'tenses'; fire(p.els.q, 'input'); assert.strictEqual(ids().length, 2, 'topic is searched');
    p.els.q.value = 'vocab'; fire(p.els.q, 'input'); assert.deepStrictEqual(ids(), ['Colours'], 'category is searched');
    p.els.q.value = 'BASIC'; fire(p.els.q, 'input'); assert.deepStrictEqual(ids(), ['Colours'], 'tags are searched');
    p.els.q.value = ''; p.els.cat.value = 'Grammar'; fire(p.els.cat, 'change');
    assert.deepStrictEqual(ids(), ['Present Simple', 'Past Simple']);
    p.els.q.value = 'past'; fire(p.els.q, 'input'); assert.deepStrictEqual(ids(), ['Past Simple'], 'search + category combine');
    assert.strictEqual(p.els.count.textContent, '1 quiz (filtered from 33)');
    p.els.q.value = 'zzz'; fire(p.els.q, 'input');
    assert.strictEqual(p.els.grid.querySelector('.empty').textContent, 'No quizzes match your search.');
    assert.strictEqual(p.els.count.textContent, '0 results');
    assert.strictEqual(p.els.more.style.display, 'none');
    p.els.q.value = ''; p.els.cat.value = 'Filler'; fire(p.els.cat, 'change');
    assert.strictEqual(cards(p).length, 24, 'filtering resets to one page');
    p.els.more.onclick(); p.els.cat.value = ''; fire(p.els.cat, 'change');
    assert.strictEqual(cards(p).length, 24, 'a new filter resets the page size again');
  });

  testAsync('<level>/index.html: load failures - network error, HTTP error, corrupt JSON, wrong shape each show their own message; nothing else is rendered', async () => {
    const msg = async (v) => { const p = await runIdx('a1', { files: v === undefined ? {} : { './quizzes.json': v } }); return p.els.grid.querySelector('.err') ? p.els.grid.querySelector('.err').textContent : null; };
    assert.strictEqual(await msg('throw'), 'Couldn\u0027t load the quiz list. Check your connection and refresh.');
    assert.strictEqual(await msg(undefined), 'Couldn\u0027t load the quiz list (error 404).');
    assert.strictEqual(await msg('badjson'), 'The quiz list file is corrupted.');
    assert.strictEqual(await msg({ a: 1 }), 'The quiz list has an unexpected format.');
    const p = await runIdx('a1', { files: { './quizzes.json': 'throw' } });
    assert.strictEqual(p.els.pageSub.textContent, '');
    const ok = await runIdx('a1', { files: { './quizzes.json': [] } });
    assert.strictEqual(ok.els.count.textContent, '0 results', 'an empty list is a valid list');
    assert.strictEqual(ok.els.grid.querySelector('.empty').textContent, 'No quizzes match your search.', 'PINNED: an empty level shows the "no match" text, not a level-specific empty state');
  });

  testAsync('<level>/index.html: corrupt / missing progress storage = every card "Not started", never a crash', async () => {
    for (const raw of ['{bad', 'null', '[]']) {
      const p = await runIdx('a1', { files: { './quizzes.json': [Q(1)] }, storage: { [PK]: raw } });
      assert.strictEqual(cards(p)[0].querySelector('.qstatus').textContent, 'Not started', raw);
    }
  });

  testAsync('<level>/index.html: level lock - a level above the ceiling renders the locked state INSTEAD of the page (no fetch, no offline mount); at/below the ceiling or with nothing chosen it loads; without level-lock.js it fails open', async () => {
    const files = { './quizzes.json': [Q(1)] };
    const ceil = (l) => ({ [LK]: JSON.stringify({ level: l, source: 'assessment' }) });
    const locked = await runIdx('b1', { files, storage: ceil('a2') });
    assert.ok(locked.els['main-content'].innerHTML.indexOf('B1 is locked') > 0);
    assert.ok(locked.els['main-content'].innerHTML.indexOf('You\u2019re currently set to A2') > 0);
    assert.ok(locked.els['main-content'].querySelector('a').getAttribute('href') === '../main/index.html');
    assert.deepStrictEqual(locked.fetches, []);
    assert.deepStrictEqual(locked.mounts, []);
    assert.strictEqual(locked.els.pageTitle.textContent, '', 'the title is not even set');
    for (const [l, c] of [['a2', 'a2'], ['a1', 'b1'], ['c2', 'c2']]) assert.deepStrictEqual((await runIdx(l, { files, storage: ceil(c) })).fetches, ['./quizzes.json'], l + ' under ' + c);
    assert.deepStrictEqual((await runIdx('c2', { files })).fetches, ['./quizzes.json'], 'nothing chosen = nothing locked');
    const noLL = await runIdx('c2', { files, modules: [], storage: ceil('a1') });
    assert.deepStrictEqual(noLL.fetches, ['./quizzes.json'], 'PINNED: without level-lock.js the gate is OFF (fail-open) - same decision as every other page');
  });

  testAsync('<level>/index.html: the offline-packs panel is mounted once with {level} on #offlinePacksMount, a throwing mount is swallowed, a missing UI module is fine', async () => {
    const files = { './quizzes.json': [Q(1)] };
    const p = await runIdx('b2', { files });
    assert.deepStrictEqual(p.mounts, [['packs', 'offlinePacksMount', 'b2']]);
    const t = await runIdx('b2', { files, throwPacks: true });
    assert.strictEqual(cards(t).length, 1, 'the list still rendered');
    const none = await runIdx('b2', { files, mounts: false });
    assert.strictEqual(cards(none).length, 1);
  });

  test('<level>/index.html: static wiring - every $(id) exists, level-lock loads before the page script, offline-packs before its UI, app-shell last', () => {
    const ids = new Set([...IDX.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    [...IDX_S.matchAll(/\$\('([^']+)'\)/g), ...IDX_S.matchAll(/getElementById\('([^']+)'\)/g)].forEach((m) => assert.ok(ids.has(m[1]), '#' + m[1]));
    const pos = (s) => IDX.indexOf(s);
    assert.ok(pos('shared/js/level-lock.js') < IDX.indexOf(IDX_S));
    assert.ok(pos('shared/js/offline-packs.js') < pos('shared/js/offline-packs-ui.js') && pos('shared/js/offline-packs-ui.js') < IDX.indexOf(IDX_S));
    assert.ok(IDX.lastIndexOf('shared/js/app-shell.js') > IDX.indexOf(IDX_S));
    assert.ok(/const lastSeg=parts\[parts\.length-1\]/.test(IDX_S), 'the folder-URL level fix is present');
  });

  // ---------------- dashboard.html ----------------
  testAsync('<level>/dashboard.html: the level is taken from the URL path exactly like index.html (all six, folder URL, sub-path, default)', async () => {
    for (const l of LV) { const p = await runDash(l); assert.strictEqual(p.els.title.textContent, l.toUpperCase() + ' progress'); assert.strictEqual(p.sb.document.title, 'Mylingo ' + l.toUpperCase() + ' \u00b7 Dashboard'); }
    const at = async (pathname) => (await runDash('a1', { pathname })).els.title.textContent;
    assert.strictEqual(await at('/mylingo/b2/dashboard.html'), 'B2 progress');
    assert.strictEqual(await at('/c1/'), 'C1 progress');
    assert.strictEqual(await at('/mylingo/c2/'), 'C2 progress');
    assert.strictEqual(await at('/'), 'A1 progress');
  });

  const rows = (p) => p.els.body.querySelectorAll('a').filter((a) => a.className === 'row');
  const tiles = (p) => p.els.stats.querySelectorAll('.stat').map((s) => [s.querySelector('.l').textContent, s.querySelector('.n').textContent]);

  testAsync('<level>/dashboard.html: stat tiles - only this level\'s entries (case-insensitive level match), average over stored bests, not-started = manifest minus attempted, XP / streak from the real gamification state', async () => {
    const storage = {
      [PK]: prog([E('a', { level: 'B1', best: 90 }), E('b', { level: 'b1', status: 'in-progress', best: 50 }), E('c', { level: 'b1', best: null, latest: 30, status: 'in-progress' }), E('other', { level: 'a1' }), { id: 'nolevel', status: 'completed', best: 100 }]),
      [GK]: JSON.stringify({ xpTotal: 250, streak: 4 }),
    };
    const p = await runDash('b1', { storage, files: { './quizzes.json': [Q('a'), Q('b'), Q('c'), Q('n1'), Q('n2')] } });
    assert.deepStrictEqual(tiles(p).slice(0, 4), [['Attempted', '3'], ['Completed', '1'], ['Avg. best score', '70%'], ['Not started', '2']]);
    assert.deepStrictEqual(tiles(p)[4], ['XP earned', '250']);
    assert.ok(tiles(p)[5][0] === 'Day streak' && tiles(p)[5][1].indexOf('4 ') === 0 && p.els.stats.querySelectorAll('svg').length === 1);
    const zero = await runDash('b1', { storage: { [PK]: prog([E('a', { level: 'b1', best: null, latest: 10 })]) }, files: { './quizzes.json': [] } });
    assert.strictEqual(tiles(zero)[2][1], '\u2014', 'no stored best = an em dash, not 0%');
    assert.deepStrictEqual(tiles(zero)[4], ['XP earned', '0']);
    assert.strictEqual(tiles(zero)[5][1], '0', 'a zero streak has no flame icon');
    const withZero = await runDash('b1', { storage: { [PK]: prog([E('a', { level: 'b1', best: 0 })]) }, files: { './quizzes.json': [] } });
    assert.strictEqual(tiles(withZero)[2][1], '0%', 'a best of 0 counts (null check)');
    const brokenGa = await runDash('b1', { modules: ['ll'], storage, files: { './quizzes.json': [] }, setup: (els, sb) => { sb.MylingoGamification = { getState: () => { throw new Error('ga'); } }; } });
    assert.strictEqual(tiles(brokenGa).length, 4, 'a throwing gamification module drops only its two tiles');
    assert.strictEqual(rows(brokenGa).length, 3, 'and the rest of the dashboard still renders');
    const noGa = await runDash('b1', { modules: ['ll'], storage, files: { './quizzes.json': [] } });
    assert.strictEqual(tiles(noGa).length, 4, 'no gamification.js = four tiles');
  });

  testAsync('<level>/dashboard.html: empty states - nothing attempted and nothing in the manifest, or nothing attempted with a manifest (Browse link); the reset button stays hidden in both', async () => {
    const none = await runDash('a2', { files: { './quizzes.json': [] } });
    assert.strictEqual(none.els.body.querySelector('.empty').textContent, 'No quizzes found for this level yet.');
    assert.strictEqual(none.els.resetBtn.style.display, 'none');
    const fresh = await runDash('a2', { files: { './quizzes.json': [Q(1)] }, storage: { [PK]: prog([E('z', { level: 'a1' })]) } });
    assert.ok(fresh.els.body.querySelector('.empty').textContent.indexOf('You haven\u0027t started any A2 quizzes yet.') === 0);
    assert.strictEqual(fresh.els.body.querySelector('.empty').querySelector('a').getAttribute('href'), './index.html');
    assert.strictEqual(fresh.els.body.querySelector('.empty').querySelector('a').textContent, 'Browse quizzes \u2192');
    assert.strictEqual(fresh.els.resetBtn.style.display, 'none');
    assert.strictEqual(tiles(fresh)[3][1], '1');
  });


  testAsync('<level>/dashboard.html: attempted rows - newest first, pct = best, else latest, else 0, status class + label, attempts pluralised, title falls back to the id, href, escaping', async () => {
    const now = Date.now();
    const list = [
      E('old', { level: 'a1', lastAccess: now - 3 * 86400000, best: 100, attempts: 2, title: 'Old' }),
      E('new', { level: 'a1', lastAccess: now - 30000, best: null, latest: 45, status: 'in-progress', attempts: 1, title: '<b>New</b> & co' }),
      E('mid', { level: 'a1', lastAccess: now - 3 * 3600000, best: null, latest: null, status: 'in-progress', attempts: undefined, title: undefined }),
      E('min', { level: 'a1', lastAccess: now - 5 * 60000, best: 0, latest: 40, attempts: 0, title: 'Zero best' }),
      E('sec', { level: 'a1', lastAccess: now - 60000, best: 5, title: 'One minute' }),
      E('sec2', { level: 'a1', lastAccess: now - 59000, best: 5, title: 'Fifty nine' }),
      E('nots', { level: 'a1', lastAccess: undefined, best: 10, title: 'No time' }),
    ];
    const p = await runDash('a1', { storage: { [PK]: prog(list) }, files: { './quizzes.json': [] } });
    const rs = rows(p);
    const t = (r, s) => r.querySelector(s).textContent;
    assert.deepStrictEqual(rs.map((r) => t(r, 'b')), ['<b>New</b> & co', 'Fifty nine', 'One minute', 'Zero best', 'mid', 'Old', 'No time'], 'newest first; a missing lastAccess sorts last; a missing title shows the id');
    assert.strictEqual(p.els.body.querySelectorAll('b').filter((b) => b.textContent === 'New').length, 0, 'no injected <b>');
    assert.deepStrictEqual(rs.map((r) => t(r, '.pct')), ['45%', '5%', '5%', '0%', '0%', '100%', '10%'], 'best, else latest, else 0 (a best of 0 stays 0 even with a latest score)');
    assert.ok(rs[0].querySelector('.bar').innerHTML.indexOf('width:45%') > 0 && rs[5].querySelector('.bar').innerHTML.indexOf('width:100%') > 0, 'the bar width follows the percentage');
    assert.deepStrictEqual(rs.map((r) => t(r, '.status')), ['In progress', 'Completed', 'Completed', 'Completed', 'In progress', 'Completed', 'Completed']);
    assert.ok(rs[0].querySelector('.status').className.split(' ').includes('in-progress') && rs[1].querySelector('.status').className.split(' ').includes('completed'));
    assert.strictEqual(p.fetchOpts[0].cache, 'no-store');
    assert.deepStrictEqual(rs.map((r) => t(r, 'small')), ['1 attempt \u00b7 30s ago', '1 attempt \u00b7 59s ago', '1 attempt \u00b7 1m ago', '0 attempts \u00b7 5m ago', '0 attempts \u00b7 3h ago', '2 attempts \u00b7 3d ago', '1 attempt \u00b7 ']);
    assert.strictEqual(rs[5].getAttribute('href'), '../shared/quiz.html?quiz=old&level=a1');
    assert.strictEqual(p.els.body.querySelector('.section-title').textContent, 'In progress');
    assert.strictEqual(p.els.resetBtn.style.display, 'inline-block');
  });

  testAsync('<level>/dashboard.html: attempted and not-started row links URL-encode the quiz id', async () => {
    const p = await runDash('a1', { storage: { [PK]: prog([E('sp ace&1', { level: 'a1' })]) }, files: { './quizzes.json': [Q('n o&2')] } });
    assert.deepStrictEqual(rows(p).map((r) => r.getAttribute('href')), ['../shared/quiz.html?quiz=sp%20ace%261&level=a1', '../shared/quiz.html?quiz=n%20o%262&level=a1']);
  });

  testAsync('<level>/dashboard.html: "Not started" list - capped at ten with a "+N more" browse link, escaped title / category, links to the quiz; a manifest that is missing, corrupt or not an array leaves the page working from progress alone', async () => {
    const man = Array.from({ length: 13 }, (_, i) => Q('n' + i, { title: i === 0 ? '<i>x</i>' : 'N' + i, category: i === 0 ? 'C&D <u>c</u>' : 'Cat' }));
    const p = await runDash('a1', { storage: { [PK]: prog([E('a', { level: 'a1' })]) }, files: { './quizzes.json': man } });
    const titles = p.els.body.querySelectorAll('.section-title').map((x) => x.textContent);
    assert.deepStrictEqual(titles, ['In progress', 'Not started (13)']);
    const ns = rows(p).slice(1);
    assert.strictEqual(ns.length, 10);
    assert.strictEqual(ns[0].querySelector('b').textContent, '<i>x</i>');
    assert.strictEqual(ns[0].querySelector('small').textContent, 'C&D <u>c</u>');
    assert.strictEqual(p.els.body.querySelectorAll('u').length, 0, 'the category is escaped too');
    assert.strictEqual(p.els.body.querySelectorAll('i').filter((x) => x.textContent === 'x').length, 0, 'no injected <i>');
    assert.strictEqual(ns[1].getAttribute('href'), '../shared/quiz.html?quiz=n1&level=a1');
    assert.ok(p.els.body.innerHTML.indexOf('+3 more') > 0 && p.els.body.innerHTML.indexOf('browse all') > 0);
    const exact = await runDash('a1', { storage: { [PK]: prog([E('a', { level: 'a1' })]) }, files: { './quizzes.json': man.slice(0, 10) } });
    assert.ok(exact.els.body.innerHTML.indexOf('more \u2014') < 0, 'exactly ten = no "more" link');
    for (const f of ['throw', 'badjson', undefined, { not: 'array' }]) {
      const q = await runDash('a1', { storage: { [PK]: prog([E('a', { level: 'a1' })]) }, files: f === undefined ? {} : { './quizzes.json': f } });
      assert.strictEqual(rows(q).length, 1, 'progress-only rendering for ' + JSON.stringify(f));
      assert.strictEqual(tiles(q)[3][1], '0');
    }
  });

  testAsync('<level>/dashboard.html: Reset - cancelled confirm changes nothing; confirmed removes only THIS level\'s entries (matched case-insensitively), keeps the rest of storage, and re-renders the empty state; a failing write is swallowed', async () => {
    const list = [E('a', { level: 'b1' }), E('b', { level: 'B1' }), E('c', { level: 'a1' }), { id: 'd', status: 'completed', best: 1 }];
    const asked = [];
    const no = await runDash('b1', { storage: { [PK]: prog(list) }, files: { './quizzes.json': [] }, confirm: (m) => { asked.push(m); return false; } });
    no.els.resetBtn.onclick(); await runSettle();
    assert.strictEqual(Object.keys(JSON.parse(no.store.getItem(PK))).length, 4);
    assert.strictEqual(asked[0], 'Reset all saved progress for B1? This can\u0027t be undone.');
    const yes = await runDash('b1', { storage: { [PK]: prog(list) }, files: { './quizzes.json': [Q('m1')] } });
    assert.strictEqual(rows(yes).length, 3, 'two attempted + one not started');
    yes.els.resetBtn.onclick(); await runSettle();
    assert.deepStrictEqual(Object.keys(JSON.parse(yes.store.getItem(PK))).sort(), ['c', 'd']);
    assert.ok(yes.els.body.querySelector('.empty').textContent.indexOf('You haven\u0027t started any B1 quizzes yet.') === 0);
    assert.strictEqual(yes.els.resetBtn.style.display, 'none');
    const fail = await runDash('b1', { storage: { [PK]: prog(list) }, files: { './quizzes.json': [] }, setup: (els, sb, store) => { store.setItem = () => { throw new Error('quota'); }; } });
    fail.els.resetBtn.onclick(); await runSettle();
    assert.strictEqual(Object.keys(JSON.parse(fail.store.getItem(PK))).length, 4, 'nothing was written');
    assert.strictEqual(rows(fail).length, 2, 'the page re-rendered from the unchanged storage without throwing');
  });

  testAsync('<level>/dashboard.html: the Backup & restore panel (installed by gamification.js INSIDE #resetWrap) is reachable on a fresh dashboard too (Agent 188 fix - only #resetBtn is hidden until there is progress to reset, #resetWrap itself is never hidden)', async () => {
    const list = [E('a', { level: 'a1' })];
    const withData = await runDash('a1', { storage: { [PK]: prog(list) }, files: { './quizzes.json': [] } });
    const panel = withData.els.resetWrap.querySelector('#progressBackupWrap');
    assert.ok(panel, 'backup panel present in #resetWrap');
    assert.ok(panel.querySelector('#exportProgressBtn') && panel.querySelector('#importProgressBtn') && panel.querySelector('#progressBackupInput'));
    assert.strictEqual(withData.els.resetBtn.style.display, 'inline-block');
    for (const o of [{ files: { './quizzes.json': [] } }, { files: { './quizzes.json': [Q(1)] } }, { files: { './quizzes.json': 'throw' } }, { files: {} }]) {
      const fresh = await runDash('a1', o);
      assert.ok(fresh.els.resetWrap.querySelector('#progressBackupWrap'), 'the panel exists...');
      assert.ok(fresh.els.resetWrap.querySelector('#importProgressBtn'));
      assert.notStrictEqual(fresh.els.resetWrap.style.display, 'none', '...and its container is never hidden, so "Import learner backup" is reachable before any progress exists');
      assert.ok(fresh.els.resetBtn.style.display !== 'inline-block', 'the destructive reset button is not shown without progress');
    }
    const html = RUN_READ('b2', 'dashboard.html');
    assert.ok(/<div class="reset" id="resetWrap"><button id="resetBtn" style="display:none">/.test(html), 'static markup: wrapper visible, reset button initially hidden (no flash of a reset button on a fresh device)');
  });

  testAsync('<level>/dashboard.html: corrupt progress storage renders as "nothing attempted" (an array is tolerated too)', async () => {
    for (const raw of ['{bad', 'null', '"x"']) {
      const p = await runDash('a1', { storage: { [PK]: raw }, files: { './quizzes.json': [Q(1)] } });
      assert.deepStrictEqual(tiles(p)[0], ['Attempted', '0'], raw);
    }
  });

  testAsync('<level>/dashboard.html: level lock - a locked level renders the locked state instead of the page (no fetch, no stats, no mounts); an unlocked or unchosen level loads', async () => {
    const ceil = (l) => ({ [LK]: JSON.stringify({ level: l, source: 'assessment' }) });
    const p = await runDash('c1', { storage: ceil('b2'), files: { './quizzes.json': [Q(1)] } });
    assert.ok(p.els['main-content'].innerHTML.indexOf('C1 is locked') > 0);
    assert.deepStrictEqual(p.fetches, []);
    assert.strictEqual(p.els.stats.innerHTML, '');
    assert.deepStrictEqual(p.mounts, [], 'no offline-packs / mastery panel on a locked level');
    assert.deepStrictEqual((await runDash('b2', { storage: ceil('b2'), files: { './quizzes.json': [] } })).fetches, ['./quizzes.json']);
    assert.deepStrictEqual((await runDash('c1', { files: { './quizzes.json': [] } })).fetches, ['./quizzes.json']);
  });

  testAsync('<level>/dashboard.html: the offline-packs panel IS mounted (Agent 187 fix - the mount used to sit OUTSIDE the IIFE, read the IIFE-private `level` and died in its own try/catch on every load, so no dashboard ever showed it) and so is the mastery panel, both with {level}', async () => {
    const p = await runDash('b2', { files: { './quizzes.json': [] } });
    assert.deepStrictEqual(p.mounts.slice().sort((a, b) => (a[0] < b[0] ? -1 : 1)), [['mastery', 'masteryReviewMount', 'b2'], ['packs', 'offlinePacksMount', 'b2']]);
    const t = await runDash('b2', { files: { './quizzes.json': [Q(1)] }, throwPacks: true });
    assert.strictEqual(tiles(t)[3][1], '1', 'a throwing packs mount does not stop the dashboard');
    const noUi = await runDash('b2', { files: { './quizzes.json': [] }, setup: (els, sb) => { delete sb.MylingoOfflinePacksUI; delete sb.MylingoMasteryReviewUI; } });
    assert.ok(noUi.els.body.querySelector('.empty'), 'missing UI modules are fine');
  });

  test('<level>/dashboard.html: static wiring - every $(id) exists, module order (level-lock first; skill-mastery + review-scheduler before the mastery UI; offline-packs before its UI), no statement after the IIFE, app-shell last', () => {
    const ids = new Set([...DASH.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    [...DASH_S.matchAll(/\$\('([^']+)'\)/g), ...DASH_S.matchAll(/getElementById\('([^']+)'\)/g)].forEach((m) => assert.ok(ids.has(m[1]), '#' + m[1]));
    const pos = (s) => DASH.indexOf('shared/js/' + s);
    assert.ok(pos('level-lock.js') < DASH.indexOf(DASH_S));
    assert.ok(pos('skill-mastery.js') < pos('mastery-review-ui.js') && pos('review-scheduler.js') < pos('mastery-review-ui.js') && pos('offline-packs.js') < pos('offline-packs-ui.js'));
    assert.strictEqual(DASH_S.trim().slice(-5), '})();', 'the script ends with the IIFE - anything after it cannot see `level`');
    assert.ok(DASH.lastIndexOf('shared/js/app-shell.js') > DASH.indexOf(DASH_S));
  });
})();

// ============================================================
console.log('index.html + main/index.html (+ main/practice.html): the "Continue learning" card (Agent 188)');
// ============================================================
[{ dir: 'main', base: '../', name: 'main/index.html', home: '../main/index.html', place: './placement.html', courses: '../courses/', enc: '..%2Fmain%2Findex.html' },
 { dir: '', base: './', name: 'index.html (root)', home: './index.html', place: './main/placement.html', courses: './courses/', enc: '.%2Findex.html' }].forEach(function (S) {
  // HANDOFF_AGENT_187.md "Next agent - start here" item 1. main/index.html's last inline script (the "Continue learning"
  // card) is run for real via makeRunPage against the real course-progress.js (resolveHomepageState + esc), a fake fetch of
  // the course_content files and a fake localStorage. main/practice.html only redirects; it is pinned statically.
  const HTML = S.dir ? RUN_READ(S.dir, 'index.html') : RUN_READ('index.html');
  const CD = (f) => S.base + 'course_content/' + f, FILE = (p) => path.join(__dirname, '..', S.dir, p);
  const SCRIPT = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()[1];
  assert.ok(SCRIPT.indexOf('resolveHomepageState') >= 0);
  const PK = 'mylingo.progress.v1';
  const plain = (x) => JSON.parse(JSON.stringify(x));
  const fs = RUN_FS;
  const EMPTY = (() => { const m = HTML.match(/<div class="section-card" id="continueCard">([\s\S]*?)<\/div><\/section>/); return m[1]; })();
  const C = (id, over) => Object.assign({ course_id: id, level: 'a1', status: 'published' }, over || {});
  const U = (id, course, over) => Object.assign({ unit_id: id, course_id: course, title: 'Unit ' + id }, over || {});
  const L = (id, unit, over) => Object.assign({ lesson_id: id, unit_id: unit, status: 'published', order: 1, title: 'Lesson ' + id, category: 'Grammar', exercise_quiz_ids: ['q-' + id + '-1', 'q-' + id + '-2'] }, over || {});
  const content = (courses, units, lessons, byLevel) => {
    const f = { [CD('courses.json')]: courses, [CD('units.json')]: units };
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => { f[CD('lessons/' + l + '.json')] = (byLevel && byLevel[l]) || (l === 'a1' && !byLevel ? lessons : []); });
    return f;
  };
  const prog = (o) => ({ [PK]: JSON.stringify(o) });
  const run = (files, storage, o) => makeRunPage(HTML, SCRIPT, 'continueCard')(Object.assign({ modules: ['cp'], files, storage: storage || {} }, o || {}));
  const half = (id) => ({ ['q-' + id + '-1']: { id: 'q-' + id + '-1', status: 'completed', best: 80 } });
  const basic = () => content([C('c1')], [U('u1', 'c1')], [L('l1', 'u1')]);
  const card = (p) => ({
    level: p.c.querySelector('.level').textContent, title: p.c.querySelector('h3').textContent, meta: p.c.querySelector('.meta').querySelector('p').textContent,
    bar: p.c.querySelector('.bar').querySelector('i').getAttribute('style'), href: p.c.querySelector('a').getAttribute('href'), btn: p.c.querySelector('a').textContent,
  });

  test(S.name + ': static wiring - script order, ids, primary links exist, service worker registration, practice.html redirect target', () => {
    const pos = (s) => HTML.indexOf(s);
    assert.ok(pos('shared/js/course-progress.js') < pos(SCRIPT) && pos('shared/js/gamification.js') < pos(SCRIPT));
    assert.ok(HTML.lastIndexOf('shared/js/app-shell.js') > pos(SCRIPT), 'app-shell.js loads after the inline script');
    assert.ok(HTML.includes('id="continueCard"') && HTML.includes('id="continueSub"') && HTML.includes('id="main"') && HTML.includes('href="#main"'));
    assert.ok(SCRIPT.trim().startsWith('(function(){') && SCRIPT.trim().endsWith('})();'));
    assert.ok(HTML.includes("register('" + S.base + "sw.js')") && fs.existsSync(path.join(__dirname, '..', 'sw.js')));
    [...HTML.matchAll(/(?:href|src)="(\.\.?\/[^"#?]+)"/g)].forEach((m) => assert.ok(fs.existsSync(FILE(m[1])), m[1]));
    assert.ok(EMPTY.includes('Your learning path starts here.') && EMPTY.includes('href="' + S.place + '"') && fs.existsSync(FILE(S.place)));
    assert.ok(SCRIPT.includes(S.dir ? 'resolveHomepageState()' : "resolveHomepageState('./')"), 'the root page must tell course-progress.js it sits at the site root');
    if (!S.dir) return;
    const P = RUN_READ('main', 'practice.html');
    const target = (P.match(/http-equiv="refresh" content="0;url=([^"]+)"/) || [])[1];
    assert.strictEqual(target, '../courses/index.html');
    assert.ok(P.includes("location.replace('../courses/index.html')") && fs.existsSync(path.join(__dirname, '..', 'courses', 'index.html')));
    assert.ok((P.match(/href="\.\.\/courses\/index\.html"/g) || []).length === 1, 'manual fallback link');
  });

  testAsync(S.name + ': an in-progress lesson fills the card - level upper-cased, unit + lesson title, "Lesson N · category · p% complete", bar width, Continue link (ids URL-encoded, level lower-cased, redirect back to main/index.html) and the sub line changes', async () => {
    const p = await run(basic(), prog(half('l1')));
    assert.deepStrictEqual(plain(card(p)), {
      level: 'A1 · Unit u1', title: 'Lesson l1', meta: 'Lesson 1 · Grammar · 50% complete', bar: 'width:50%',
      href: S.courses + 'lesson.html?lesson=l1&level=a1&redirect=' + S.enc, btn: 'Continue',
    });
    assert.strictEqual(p.els.continueSub.textContent, 'A saved lesson is ready when you are.');
    assert.ok(!p.html.includes('Your learning path starts here.'));
    assert.deepStrictEqual(plain(p.fetches.slice(0, 2)), [CD('courses.json'), CD('units.json')]);
    plain(p.fetchOpts).forEach((o) => assert.deepStrictEqual(o, { cache: 'no-store' }));
  });

  testAsync(S.name + ': every fetch stays inside the app folder relative to THIS page (root page: ./course_content/..., one folder deep: ../course_content/...) - the root page used to ask for ../course_content/... which is outside the app under /<project>/ (Agent 188 fix)', async () => {
    const p = await run(basic(), prog(half('l1')));
    assert.ok(p.fetches.length >= 8 && p.fetches.every((u) => u.indexOf(S.base + 'course_content/') === 0), JSON.stringify(p.fetches));
    if (!S.dir) p.fetches.forEach((u) => assert.ok(u.indexOf('../') !== 0, u));
  });

  testAsync(S.name + ': no progress / everything complete / nothing published -> the empty "Your learning path starts here" card stays and the sub line is untouched', async () => {
    for (const [files, st] of [
      [basic(), {}], [basic(), prog({})],
      [basic(), prog({ 'q-l1-1': { status: 'completed', best: 90 }, 'q-l1-2': { status: 'completed', best: 90 } })],
      [content([C('c1', { status: 'draft' })], [U('u1', 'c1')], [L('l1', 'u1')]), prog(half('l1'))],
      [content([C('c1')], [U('u1', 'c1')], [L('l1', 'u1', { status: 'draft' })]), prog(half('l1'))],
      [content([], [], []), prog(half('l1'))],
    ]) {
      const p = await run(files, st);
      assert.strictEqual(p.html, '', 'the card is only rewritten when a lesson is found (initial markup lives in the HTML)');
      assert.strictEqual(p.els.continueSub.textContent, '');
    }
  });

  testAsync(S.name + ': a started-but-unmastered quiz (0% lesson) is still picked by the fallback branch; a lesson with no quiz ids or an unrelated progress entry is not', async () => {
    const p = await run(basic(), prog({ 'q-l1-2': { id: 'q-l1-2', status: 'in-progress' } }));
    assert.strictEqual(card(p).title, 'Lesson l1');
    assert.ok(/complete$/.test(card(p).meta));
    const none = await run(content([C('c1')], [U('u1', 'c1')], [L('l1', 'u1', { exercise_quiz_ids: [] })]), prog({ x: { status: 'in-progress' } }));
    assert.strictEqual(none.html, '');
    const other = await run(basic(), prog({ 'unrelated': { status: 'in-progress' } }));
    assert.strictEqual(other.html, '');
  });

  testAsync(S.name + ': picks the first in-progress lesson in course -> unit -> lesson order across levels (lessons sorted by `order`), preferring 1..99% over the fallback', async () => {
    const files = content([C('c1'), C('c2', { level: 'B2' })], [U('u1', 'c1'), U('u2', 'c2')], null, {
      a1: [L('la-2', 'u1', { order: 2 }), L('la-1', 'u1', { order: 1 })], b2: [L('lb', 'u2', { title: 'B two', order: 3, category: 'Reading' })],
    });
    const st = prog(Object.assign({}, half('la-2'), half('lb')));
    const p = await run(files, st);
    assert.strictEqual(card(p).title, 'Lesson la-2');
    const p2 = await run(files, prog(half('lb')));
    const c = card(p2);
    assert.strictEqual(c.level, 'B2 · Unit u2');
    assert.strictEqual(c.meta, 'Lesson 3 · Reading · 50% complete');
    assert.ok(c.href.includes('level=b2') && c.href.includes('lesson=lb'));
    // a 1..99 lesson beats an earlier fallback-only (0%) one
    const files2 = content([C('c1')], [U('u1', 'c1')], [L('first', 'u1', { order: 1 }), L('second', 'u1', { order: 2 })]);
    const p3 = await run(files2, prog(Object.assign({ 'q-first-1': { status: 'in-progress' } }, half('second'))));
    assert.strictEqual(card(p3).title, 'Lesson second');
  });

  testAsync(S.name + ': every interpolated string is escaped (level, unit, lesson, category) and the lesson id / level are URL-encoded; missing order / category / percent fall back', async () => {
    const evil = '<img src=x onerror=alert(1)>"\'&';
    const files = content([C('c1', { level: evil })], [U('u1', 'c1', { title: evil })], [L('l&1 x', 'u1', { title: evil, category: evil, order: evil })]);
    const p = await run(files, prog(half('l&1 x')));
    assert.ok(!p.html.includes('<img'), p.html);
    assert.strictEqual(p.c.querySelector('h3').textContent, evil);
    assert.ok(card(p).level.includes(evil.toUpperCase()) && card(p).meta.startsWith('Lesson ' + evil + ' · ' + evil));
    assert.ok(card(p).href.includes('lesson=l%261%20x'));
    assert.ok(card(p).href.includes('level=' + encodeURIComponent(evil.toLowerCase())));
    const q = await run(content([C('c1', { level: undefined })], [U('u1', 'c1')], [L('l1', 'u1', { order: undefined, category: undefined })]), prog(half('l1')));
    assert.strictEqual(card(q).level, ' · Unit u1');
    assert.strictEqual(card(q).meta, 'Lesson  · Lesson · 50% complete');
    assert.ok(card(q).href.includes('&level=&'));
  });

  testAsync(S.name + ': failures are swallowed and leave the empty card - both fetch paths failing, bad JSON, a lessons-per-level failure falling back to lessons.json, a missing module, a missing #continueCard', async () => {
    assert.strictEqual((await run({}, prog(half('l1')))).html, '');
    assert.strictEqual((await run({ [CD('courses.json')]: 'throw' }, prog(half('l1')))).html, '');
    assert.strictEqual((await run({ [CD('courses.json')]: 'badjson' }, prog(half('l1')))).html, '');
    const fb = basic(); delete fb[CD('lessons/b2.json')]; fb[CD('lessons.json')] = [L('mono', 'u1', { title: 'From monolith' })];
    const p = await run(fb, prog(half('mono')));
    assert.strictEqual(card(p).title, 'From monolith');
    assert.ok(p.fetches.includes(CD('lessons.json')));
    const none = await run(basic(), prog(half('l1')), { modules: [] });
    assert.strictEqual(none.fetches.length, 0, 'without course-progress.js nothing is fetched and nothing throws');
    assert.strictEqual(none.html, '');
    const noMount = await makeRunPage(HTML.replace('id="continueCard"', 'id="other"'), SCRIPT, 'other')({ modules: ['cp'], files: basic(), storage: prog(half('l1')) });
    assert.strictEqual(noMount.html, '', 'a missing mount is swallowed by the promise catch');
  });

  testAsync(S.name + ': garbage progress storage is ignored (empty card) and a 100% lesson is never offered', async () => {
    assert.strictEqual((await run(basic(), { [PK]: '{not json' })).html, '');
    assert.strictEqual((await run(basic(), { [PK]: 'null' })).html, '');
  });

  testAsync(S.name + ': runs against every shipped course + lesson - one in-progress quiz of each published lesson yields a card whose lesson link resolves', async () => {
    const rd = (f) => JSON.parse(RUN_READ(...f.split('/')));
    const files = { [CD('courses.json')]: rd('course_content/courses.json'), [CD('units.json')]: rd('course_content/units.json') };
    const all = [];
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((l) => { const d = rd('course_content/lessons/' + l + '.json'); files[CD('lessons/' + l + '.json')] = d; all.push(...d); });
    const pub = all.filter((l) => l.status === 'published' && (l.exercise_quiz_ids || []).length);
    assert.ok(pub.length > 0);
    const l0 = pub[0];
    const p = await run(files, prog({ [l0.exercise_quiz_ids[0]]: { id: l0.exercise_quiz_ids[0], status: 'in-progress' } }));
    assert.ok(p.c.querySelector('a'), 'a shipped in-progress lesson yields a card');
    const href = card(p).href;
    assert.ok(href.startsWith(S.courses + 'lesson.html?lesson='));
    const id = decodeURIComponent(href.match(/lesson=([^&]+)/)[1]);
    assert.ok(all.some((l) => l.lesson_id === id));
  });
});

// ============================================================
console.log('offline-packs.js against fake Cache Storage (Agent 159)');
// ============================================================
(function () {
  const H = { index: { packs: [] }, cachesMap: new Map(), failUrl: null, inflight: 0, maxInflight: 0 };
  const fakeCaches = {
    open: async (name) => {
      if (!H.cachesMap.has(name)) H.cachesMap.set(name, new Map());
      const m = H.cachesMap.get(name);
      return {
        add: async (url) => {
          H.inflight++; H.maxInflight = Math.max(H.maxInflight, H.inflight);
          await new Promise((r) => setImmediate(r));
          H.inflight--;
          if (H.failUrl && url.indexOf(H.failUrl) >= 0) throw new Error('network');
          m.set(url, true);
        },
        match: async (url) => (m.has(url) ? true : undefined),
      };
    },
    keys: async () => Array.from(H.cachesMap.keys()),
    delete: async (name) => H.cachesMap.delete(name),
    has: async (name) => H.cachesMap.has(name),
  };
  const saved = { document: globalThis.document, caches: globalThis.caches, fetch: globalThis.fetch };
  globalThis.document = { currentScript: { src: 'https://example.test/shared/js/offline-packs.js' } };
  globalThis.caches = fakeCaches;
  globalThis.fetch = async () => ({ ok: true, json: async () => H.index });
  fakeWindow.caches = fakeCaches;
  fakeWindow.localStorage.clear();
  delete fakeWindow.MylingoOfflinePacks;
  loadModule('shared/js/offline-packs.js');
  const OP = fakeWindow.MylingoOfflinePacks;
  assert.ok(OP && typeof OP.installPack === 'function', 'expected MylingoOfflinePacks export');

  const reset = (packs) => { H.index = { packs }; H.cachesMap.clear(); H.failUrl = null; H.maxInflight = 0; fakeWindow.localStorage.clear(); };
  const files = (id, n) => Array.from({ length: n || 2 }, (_, i) => 'content/' + id + '-' + i + '.json');
  const pack = (id, deps, n) => ({ id, files: files(id, n), dependencies: deps || [] });
  let clock = 1000;
  const realNow = Date.now;
  Date.now = () => ++clock;

  const tests = [];
  const t = (name, body) => tests.push([name, body]);

  t('assetUrl resolves against the script location, stripping a leading ./', () => {
    assert.strictEqual(OP.assetUrl('./offline/packs.json'), 'https://example.test/offline/packs.json');
    assert.strictEqual(OP.assetUrl('shared/js/x.js'), 'https://example.test/shared/js/x.js');
  });

  t('installPack installs dependencies first, then the pack; isInstalled agrees', async () => {
    reset([pack('core', [], 2), pack('a1', ['core'], 3)]);
    const progress = [];
    const res = await OP.installPack('a1', (p) => progress.push(p));
    assert.strictEqual(res.total, 3);
    assert.deepStrictEqual(res.dependencies, ['core']);
    assert.strictEqual(await OP.isInstalled('a1'), true);
    assert.strictEqual(await OP.isInstalled('core'), true);
    assert.strictEqual(progress[0].done, 0);
    assert.strictEqual(progress[progress.length - 1].done, 3);
  });

  t('isInstalled is false when a dependency is missing or a file is absent', async () => {
    reset([pack('core', [], 2), pack('a1', ['core'], 2)]);
    await OP.installPack('a1');
    H.cachesMap.delete('mylingo-offline-pack-v1-core');
    assert.strictEqual(await OP.isInstalled('a1'), false, 'dependency gone');
    assert.strictEqual(await OP.isInstalled('nope'), false, 'unknown pack');
  });

  t('unknown pack and dependency cycles reject', async () => {
    reset([pack('x', ['y']), pack('y', ['x'])]);
    await assert.rejects(OP.installPack('ghost'), /Unknown offline pack/);
    await assert.rejects(OP.installPack('x'), /dependency cycle/);
  });

  t('a failing download rolls back the half-installed cache and rethrows', async () => {
    reset([pack('a1', [], 4)]);
    H.failUrl = 'a1-2.json';
    await assert.rejects(OP.installPack('a1'), /network/);
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(H.cachesMap.has('mylingo-offline-pack-v1-a1'), false, 'partial cache must be deleted');
    assert.strictEqual(await OP.isInstalled('a1'), false);
  });

  t('after one download fails, sibling workers stop instead of downloading into the dead cache', async () => {
    reset([pack('a1', [], 40)]);
    let adds = 0;
    const realOpen = fakeCaches.open;
    fakeCaches.open = async (n) => { const c = await realOpen(n); const add = c.add; c.add = async (u) => { adds++; return add(u); }; return c; };
    H.failUrl = 'a1-1.json';
    await assert.rejects(OP.installPack('a1'), /network/);
    await new Promise((r) => setTimeout(r, 50));
    fakeCaches.open = realOpen;
    assert.ok(adds < 40, 'expected the install to abort early, but ' + adds + '/40 files were still fetched');
  });

  t('isInstalled on a never-installed pack must not create a phantom empty cache', async () => {
    reset([pack('a1'), pack('a2')]);
    assert.strictEqual(await OP.isInstalled('a1'), false);
    assert.strictEqual(await OP.isInstalled('a2'), false);
    assert.strictEqual(H.cachesMap.size, 0, 'asking must not create caches: ' + Array.from(H.cachesMap.keys()).join(','));
  });

  t('downloads never exceed INSTALL_CONCURRENCY in flight', async () => {
    reset([pack('big', [], 20)]);
    await OP.installPack('big');
    assert.ok(H.maxInflight <= OP.INSTALL_CONCURRENCY, 'max in flight was ' + H.maxInflight);
    assert.ok(H.maxInflight > 1, 'expected some parallelism');
  });

  t('installing a 5th pack evicts the least-recently-used one, but never a dependency of the new pack', async () => {
    reset([pack('core'), pack('p1'), pack('p2'), pack('p3'), pack('p4', ['core'])]);
    await OP.installPack('core');
    await OP.installPack('p1');
    await OP.installPack('p2');
    await OP.installPack('p3');
    assert.strictEqual(OP.MAX_INSTALLED_PACKS, 4);
    await OP.installPack('p4');
    const names = Array.from(H.cachesMap.keys()).map((k) => k.replace('mylingo-offline-pack-v1-', '')).sort();
    assert.strictEqual(names.length, 4);
    assert.ok(names.indexOf('core') >= 0, 'dependency of the new pack survives');
    assert.ok(names.indexOf('p4') >= 0);
    assert.ok(names.indexOf('p1') < 0, 'oldest non-protected pack is the one evicted');
  });

  t('removePack refuses while an installed pack depends on it, then succeeds', async () => {
    reset([pack('core'), pack('a1', ['core'])]);
    await OP.installPack('a1');
    await assert.rejects(OP.removePack('core'), /depend on it/);
    assert.strictEqual(await OP.removePack('a1'), true);
    assert.strictEqual(await OP.removePack('core'), true);
    assert.strictEqual(H.cachesMap.size, 0);
  });

  t('caches from an older pack-format version are cleaned up', async () => {
    reset([pack('a1')]);
    H.cachesMap.set('mylingo-offline-pack-v0-a1', new Map());
    await OP.isInstalled('a1');
    assert.strictEqual(H.cachesMap.has('mylingo-offline-pack-v0-a1'), false);
  });

  t('findPack tolerates junk indexes', () => {
    assert.strictEqual(OP.findPack(null, 'a'), null);
    assert.strictEqual(OP.findPack({ packs: [null, { id: 7 }] }, '7').id, 7);
  });

  // run sequentially; the async tests share one fake environment
  let chain = Promise.resolve();
  tests.forEach(([name, body]) => {
    chain = chain.then(async () => {
      try { await body(); pass++; console.log('  ok - ' + name); }
      catch (e) { fail++; console.log('  FAIL - ' + name); console.log('    ' + (e && e.message)); }
    });
  });
  chain.then(() => {
    Date.now = realNow;
    globalThis.document = saved.document; globalThis.caches = saved.caches; globalThis.fetch = saved.fetch;
    if (saved.document === undefined) delete globalThis.document;
    if (saved.caches === undefined) delete globalThis.caches;
    runCourseProgressTests().then(finish);
  });
})();

// ============================================================
// course-progress.js (Agent 161)
// ============================================================
function runCourseProgressTests() {
  console.log('course-progress.js (Agent 161)');
  const savedFetch = globalThis.fetch;
  const savedLocalStorage = globalThis.localStorage;
  globalThis.localStorage = fakeWindow.localStorage;
  fakeWindow.localStorage.clear();
  delete fakeWindow.MylingoCourseProgress;
  // Bare `fetch`/`localStorage` references in the module resolve through the
  // Function's outer (global) scope, not the `window` parameter — same
  // reason offline-packs.js's loader sets globalThis.fetch above — so set
  // both as real globals for this module too.
  globalThis.fetch = async () => { throw new Error('unstubbed fetch in course-progress test'); };
  loadModule('shared/js/course-progress.js');
  const CP = fakeWindow.MylingoCourseProgress;

  test('isMastered: false without a completed record; true only at/above threshold, null best grandfathered', () => {
    assert.strictEqual(CP.isMastered(null), false);
    assert.strictEqual(CP.isMastered({ status: 'in-progress', best: 90 }), false);
    assert.strictEqual(CP.isMastered({ status: 'completed', best: null }), true, 'legacy record with no score is grandfathered as passing');
    assert.strictEqual(CP.isMastered({ status: 'completed', best: 59 }), false);
    assert.strictEqual(CP.isMastered({ status: 'completed', best: 60 }), true, 'boundary: exactly MASTERY_THRESHOLD counts');
    assert.strictEqual(CP.isMastered({ status: 'completed', best: 0 }), false, 'a genuine zero score is not grandfathered');
  });

  test('lessonCompletionRecord: no linked quizzes -> not completed, 0 progress, no gate', () => {
    assert.deepStrictEqual(CP.lessonCompletionRecord({ exercise_quiz_ids: [] }, {}), { completed: false, progress: 0, gateId: null });
    assert.deepStrictEqual(CP.lessonCompletionRecord({}, {}), { completed: false, progress: 0, gateId: null });
  });

  test('lessonCompletionRecord: falls back to lesson_quiz_id when exercise_quiz_ids is empty', () => {
    const p = { q1: { status: 'completed', best: 80 } };
    const rec = CP.lessonCompletionRecord({ exercise_quiz_ids: [], lesson_quiz_id: 'q1' }, p);
    assert.strictEqual(rec.completed, true);
    assert.strictEqual(rec.gateId, 'q1');
  });

  test('lessonCompletionRecord: >=90% mastered counts as complete, even if under 100%', () => {
    const p = { q1: { status: 'completed', best: 80 }, q2: { status: 'completed', best: 70 }, q3: { status: 'completed', best: 90 }, q4: { status: 'completed', best: 65 }, q5: { status: 'completed', best: 95 }, q6: { status: 'completed', best: 61 }, q7: { status: 'completed', best: 66 }, q8: { status: 'completed', best: 72 }, q9: { status: 'completed', best: 88 }, q10: { status: 'in-progress' } };
    const ids = Object.keys(p);
    const rec = CP.lessonCompletionRecord({ exercise_quiz_ids: ids }, p);
    assert.strictEqual(rec.completed, true, '9 of 10 mastered = 90%, meets LESSON_COMPLETION_THRESHOLD');
    assert.strictEqual(rec.progress, 100);
    assert.strictEqual(rec.gateId, ids[ids.length - 1]);
  });

  test('lessonCompletionRecord: none mastered and none in-progress -> plain mastered percentage, not complete', () => {
    const p = { q1: { status: 'completed', best: 10 }, q2: {} };
    const rec = CP.lessonCompletionRecord({ exercise_quiz_ids: ['q1', 'q2'] }, p);
    assert.strictEqual(rec.completed, false);
    assert.strictEqual(rec.progress, 0);
    assert.strictEqual(rec.gateId, null);
  });

  test('lessonCompletionRecord: partial in-progress quiz folds its ratio into progress and gates on it', () => {
    const p = { q1: { status: 'in-progress', questionIndex: 3, totalQuestions: 10 } };
    fakeWindow.localStorage.setItem('mylingo.sessions.v3.q1', JSON.stringify({ status: 'in-progress', questionIndex: 3 }));
    const rec = CP.lessonCompletionRecord({ exercise_quiz_ids: ['q1', 'q2'] }, p);
    // done=0, ratio=round(3/10*100)=30 -> (0+0.30)/2*100 = 15
    assert.strictEqual(rec.completed, false);
    assert.strictEqual(rec.progress, 15);
    assert.strictEqual(rec.gateId, 'q1');
  });

  test('lessonCompletionRecord: rounding never reports 100% while completed is false (Agent 161 fix)', () => {
    // 1 of 2 quizzes mastered (50%, under the 90% threshold so we reach the
    // partial branch) + the other quiz 99% through its questions:
    // (1 + 0.99) / 2 * 100 = 99.5, which Math.round takes to 100. Before the
    // fix this returned {completed:false, progress:100} — a contradiction
    // that also made resolveHomepageState() below drop the lesson entirely.
    const p = {
      q1: { status: 'completed', best: 100 },
      q2: { status: 'in-progress', questionIndex: 99, totalQuestions: 100 },
    };
    fakeWindow.localStorage.clear();
    fakeWindow.localStorage.setItem('mylingo.sessions.v3.q2', JSON.stringify({ status: 'in-progress', questionIndex: 99 }));
    const rec = CP.lessonCompletionRecord({ exercise_quiz_ids: ['q1', 'q2'] }, p);
    assert.strictEqual(rec.completed, false);
    assert.ok(rec.progress < 100, 'progress must stay under 100 while completed is false, got ' + rec.progress);
    assert.strictEqual(rec.progress, 99);
  });

  test('lessonIsComplete / lessonPercent are thin wrappers over lessonCompletionRecord', () => {
    const p = { q1: { status: 'completed', best: 100 } };
    const lesson = { exercise_quiz_ids: ['q1'] };
    assert.strictEqual(CP.lessonIsComplete(lesson, p), true);
    assert.strictEqual(CP.lessonPercent(lesson, p), 100);
  });

  test('readProgress: corrupt localStorage JSON falls back to {} instead of throwing', () => {
    fakeWindow.localStorage.setItem('mylingo.progress.v1', '{not json');
    assert.deepStrictEqual(CP.readProgress(), {});
    fakeWindow.localStorage.removeItem('mylingo.progress.v1');
  });

  const course = { course_id: 'c1', level: 'a1', status: 'published' };
  const unit = { unit_id: 'u1', course_id: 'c1' };
  function lessons(list) { return list; }

  function withFetch(routes, body) {
    globalThis.fetch = async (url) => {
      for (const key of Object.keys(routes)) {
        if (url.indexOf(key) !== -1) {
          const val = routes[key];
          if (val instanceof Error) throw val;
          return { ok: true, json: async () => val };
        }
      }
      throw new Error('unstubbed fetch: ' + url);
    };
    return body();
  }

  const t2 = [];
  function test2(name, body) { t2.push([name, body]); }

  test2('resolveHomepageState: surfaces the first published lesson that is started but not complete', async () => {
    fakeWindow.localStorage.clear();
    fakeWindow.localStorage.setItem('mylingo.progress.v1', JSON.stringify({ q1: { status: 'completed', best: 80 } }));
    const lessonA = { lesson_id: 'lA', unit_id: 'u1', status: 'published', order: 1, exercise_quiz_ids: ['q1', 'q2'] };
    await withFetch({
      'courses.json': [course],
      'units.json': [unit],
      'lessons/a1.json': lessons([lessonA]),
      'lessons/a2.json': [], 'lessons/b1.json': [], 'lessons/b2.json': [], 'lessons/c1.json': [], 'lessons/c2.json': [],
    }, async () => {
      const state = await CP.resolveHomepageState();
      assert.ok(state, 'expected an active lesson');
      assert.strictEqual(state.lesson.lesson_id, 'lA');
      assert.strictEqual(state.percent, 50);
    });
  });

  test2('resolveHomepageState: unpublished courses/lessons are never surfaced', async () => {
    fakeWindow.localStorage.clear();
    fakeWindow.localStorage.setItem('mylingo.progress.v1', JSON.stringify({ q1: { status: 'completed', best: 80 } }));
    const draftCourse = { course_id: 'c1', level: 'a1', status: 'draft' };
    const lessonA = { lesson_id: 'lA', unit_id: 'u1', status: 'published', order: 1, exercise_quiz_ids: ['q1', 'q2'] };
    await withFetch({
      'courses.json': [draftCourse],
      'units.json': [unit],
      'lessons/a1.json': [lessonA],
      'lessons/a2.json': [], 'lessons/b1.json': [], 'lessons/b2.json': [], 'lessons/c1.json': [], 'lessons/c2.json': [],
    }, async () => {
      const state = await CP.resolveHomepageState();
      assert.strictEqual(state, null, 'a lesson under a draft course must not be surfaced');
    });
  });

  test2('resolveHomepageState: falls back to the lessons.json monolith if a per-level file fails', async () => {
    fakeWindow.localStorage.clear();
    fakeWindow.localStorage.setItem('mylingo.progress.v1', JSON.stringify({ q1: { status: 'completed', best: 80 } }));
    const lessonA = { lesson_id: 'lA', unit_id: 'u1', status: 'published', order: 1, exercise_quiz_ids: ['q1', 'q2'] };
    await withFetch({
      'courses.json': [course],
      'units.json': [unit],
      'lessons/a1.json': new Error('network down'),
      'lessons.json': [lessonA],
    }, async () => {
      const state = await CP.resolveHomepageState();
      assert.ok(state, 'expected the monolith fallback to still find the lesson');
      assert.strictEqual(state.lesson.lesson_id, 'lA');
    });
  });

  test2('resolveHomepageState: a rounding-inflated 100%-but-incomplete lesson is still found via the partial branch (Agent 161 fix)', async () => {
    // Regression guard at the integration level for the fix above: before
    // it, this lesson's percent was 100 with completed:false, which matched
    // neither of resolveHomepageState's two find() predicates and the
    // learner's in-progress lesson vanished from the "continue" card.
    fakeWindow.localStorage.clear();
    fakeWindow.localStorage.setItem('mylingo.progress.v1', JSON.stringify({
      q1: { status: 'completed', best: 100 },
      q2: { status: 'in-progress', questionIndex: 99, totalQuestions: 100 },
    }));
    fakeWindow.localStorage.setItem('mylingo.sessions.v3.q2', JSON.stringify({ status: 'in-progress', questionIndex: 99 }));
    const lessonA = { lesson_id: 'lA', unit_id: 'u1', status: 'published', order: 1, exercise_quiz_ids: ['q1', 'q2'] };
    await withFetch({
      'courses.json': [course],
      'units.json': [unit],
      'lessons/a1.json': [lessonA],
      'lessons/a2.json': [], 'lessons/b1.json': [], 'lessons/b2.json': [], 'lessons/c1.json': [], 'lessons/c2.json': [],
    }, async () => {
      const state = await CP.resolveHomepageState();
      assert.ok(state, 'the nearly-finished lesson must still surface as the thing to continue');
      assert.strictEqual(state.lesson.lesson_id, 'lA');
      assert.ok(state.percent < 100);
    });
  });

  test2('resolveHomepageState: nothing in progress and nothing attempted -> null', async () => {
    fakeWindow.localStorage.clear();
    const lessonA = { lesson_id: 'lA', unit_id: 'u1', status: 'published', order: 1, exercise_quiz_ids: ['q1'] };
    await withFetch({
      'courses.json': [course],
      'units.json': [unit],
      'lessons/a1.json': [lessonA],
      'lessons/a2.json': [], 'lessons/b1.json': [], 'lessons/b2.json': [], 'lessons/c1.json': [], 'lessons/c2.json': [],
    }, async () => {
      const state = await CP.resolveHomepageState();
      assert.strictEqual(state, null);
    });
  });

  return t2.reduce((chain, [name, body]) => chain.then(async () => {
    try { await body(); pass++; console.log('  ok - ' + name); }
    catch (e) { fail++; console.log('  FAIL - ' + name); console.log('    ' + (e && e.message)); }
  }), Promise.resolve()).then(() => {
    globalThis.fetch = savedFetch;
    if (savedFetch === undefined) delete globalThis.fetch;
    globalThis.localStorage = savedLocalStorage;
    if (savedLocalStorage === undefined) delete globalThis.localStorage;
  });
}

// ============================================================
console.log('quiz.html: sound/overlay UI helpers, course strip, the start/resume/replay flow, and the suggestion-pool chain (Agent 189)');
// ============================================================
(function () {
  // HANDOFF_AGENT_188.md item 1: shared/quiz.html's inline script had 14 top-level functions with
  // zero test coverage. valuesEqual was genuine dead code (removed in Agent 191 along with its only reader,
  // qGlobalTolerance; submitAnswer inlines its own per-type comparison instead), so it is not
  // tested here. The other 13 are covered below by lifting the REAL functions out of quiz.html
  // (brace-matched, by name) into a vm sandbox, same technique as the Agent 164/175 sections above,
  // with a small local DOM-ish element (QEl) supporting classList/dataset/style/querySelector(All)
  // for the handful of compound selectors these functions use (".option[data-index=\"n\"]",
  // "select[data-left]", ".rank-list"). Collaborators that already have their own dedicated
  // coverage elsewhere (render(), finishAnswer()/submitAnswer(), stopAllSounds()) are stubbed as
  // call-recorders so these tests isolate the orchestration logic that was actually uncovered;
  // everything else (session read/write, sessionForCurrentQuiz, gradedTotal, rawType,
  // normalizeText, updateRanks, setTextSmooth) is the real code, since configureStart/startFresh/
  // resumeSession genuinely depend on it.
  const fs = require('fs'), vm = require('vm');
  const html = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');

  class QEl {
    constructor() { this.style = { display: '', width: '' }; this._cls = new Set(); this.textContent = ''; this._children = []; this._attrs = {}; this.dataset = {}; this.focusCount = 0; this.value = ''; this.innerHTML = ''; }
    get classList() { const self = this; return { add: (...c) => c.forEach((x) => self._cls.add(x)), remove: (...c) => c.forEach((x) => self._cls.delete(x)), contains: (c) => self._cls.has(c), toggle: (c) => { if (self._cls.has(c)) self._cls.delete(c); else self._cls.add(c); } }; }
    setAttribute(k, v) { this._attrs[k] = String(v); }
    getAttribute(k) { return this._attrs[k] === undefined ? null : this._attrs[k]; }
    removeAttribute(k) { delete this._attrs[k]; }
    focus() { this.focusCount++; }
    get offsetWidth() { return 100; }
    appendChild(c) {
      if (c.parent && c.parent._children) { const i = c.parent._children.indexOf(c); if (i >= 0) c.parent._children.splice(i, 1); }
      c.parent = this; this._children.push(c); return c;
    }
    _attrVal(name) { if (name === 'data-index') return this.dataset.index; if (name === 'data-left') return this.dataset.left; return this._attrs[name]; }
    _matches(sel) {
      let m = /^([.\w-]*)\[([\w-]+)="([^"]*)"\]$/.exec(sel);
      if (m) { if (m[1] && m[1][0] === '.' && !this._cls.has(m[1].slice(1))) return false; return String(this._attrVal(m[2])) === m[3]; }
      m = /^([.\w-]*)\[([\w-]+)\]$/.exec(sel); // presence-only, e.g. 'select[data-left]'
      if (m) { if (m[1] && m[1][0] === '.' && !this._cls.has(m[1].slice(1))) return false; return this._attrVal(m[2]) !== undefined && this._attrVal(m[2]) !== null; }
      if (sel[0] === '.') return this._cls.has(sel.slice(1));
      if (sel[0] === '#') return this._attrs.id === sel.slice(1);
      return false;
    }
    _walk(out, sel) { this._children.forEach((c) => { if (c._matches && c._matches(sel)) out.push(c); if (c._walk) c._walk(out, sel); }); }
    querySelectorAll(sel) { const out = []; this._walk(out, sel); return out; }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    get children() { return this._children; }
  }

  const consts189 = ['KEY', 'SESSION_KEY', 'LEGACY_SESSION_KEY', 'SESSION_SHARD_PREFIX', 'SESSION_INDEX_KEY', 'SOUND_ICON_ON', 'SOUND_ICON_OFF'].map((k) => {
    const m = new RegExp('^const ' + k + '=.*;$', 'm').exec(html);
    if (!m) throw new Error('quiz.html: const ' + k + ' not found');
    return m[0];
  }).join('\n');
  const NAMES189 = ['gp', 'sessionShardKey', 'readSessionIndex', 'writeSessionIndex', 'migrateSessionShards', 'readSessionStore', 'sanitizeSession', 'readSession', 'sessionForCurrentQuiz', 'writeSession', 'clearSession', 'saveSession', 'gradedTotal', 'rawType', 'normalizeText', 'updateRanks',
    'setTextSmooth', 'updateSpeedBtn', 'updateSoundIcon', 'setBackgroundInert', 'escStrip', 'renderCourseStrip', 'show', 'configureStart', 'startFresh', 'resumeSession', 'applyResponseToUI',
    'getManifest', 'lessonSuggestionIds', 'loadSuggestions', 'categorySuggestions', 'getLevelLessons'];
  const source189 = consts189 + '\n' +
    'let data,i=0,score=0,locked=false,sessionStartedAt=0,restoringSessionAnswer=false,answerCorrect={},suggestPool=[],qGlobalTolerance=0,soundOn=true,audioSpeed=1,_levelLessonsPromise=null;\n' +
    NAMES189.map((n) => extractFn(html, n)).join('\n');

  // over.win: extra window.* properties (MylingoRuntimeContentLoader / MylingoRuntimeV2 for the
  // suggestion chain). over.fetch: routes getLevelLessons()'s fetch. over.appShell===false omits
  // window.MylingoAppShell entirely (show() must tolerate that - it's optional everywhere else).
  function env189(over) {
    over = over || {};
    const calls = [];
    const ls = makeFakeStorage();
    const els = {};
    ['loading', 'start', 'error', 'end', 'courseStrip', 'soundIcon', 'soundBtn', 'speedBtn', 'resumeBtn', 'startBtn', 'score', 'options', 'choiceSelect', 'answerInput'].forEach((id) => { els[id] = new QEl(); });
    const $el = (id) => { if (!els[id]) throw new Error('no el ' + id); return els[id]; };
    const headerEl = new QEl(), mainEl = new QEl();
    const overlayEls = [els.loading, els.start, els.error, els.end];
    const doc = {
      querySelector: (sel) => (sel === '.header' ? headerEl : sel === 'main' ? mainEl : null),
      querySelectorAll: (sel) => (sel === '.overlay' ? overlayEls : []),
    };
    const appShellCalls = [];
    const win = { MylingoAppShell: over.appShell === false ? undefined : { setVisible: (v) => appShellCalls.push(v) } };
    if (over.win) Object.assign(win, over.win);
    const ctx = Object.assign({
      level: over.level || 'b1', redirect: over.redirect || null, lessonParam: over.lessonParam || null,
      courseTitleParam: over.courseTitleParam, unitTitleParam: over.unitTitleParam,
      window: win, document: doc, localStorage: ls, $: $el,
      render: (...a) => calls.push(['render', ...a]),
      finishAnswer: (...a) => calls.push(['finishAnswer', ...a]),
      stopAllSounds: (...a) => calls.push(['stopAllSounds', ...a]),
      fetch: over.fetch || ((url) => Promise.reject(new Error('no fetch: ' + url))),
      Date, JSON, Math, String, Array, Object, Set, Map, RegExp, Number, encodeURIComponent, console, Promise,
    }, over.ctx || {});
    vm.createContext(ctx);
    vm.runInContext(source189, ctx);
    return { ctx, els, headerEl, mainEl, overlayEls, calls, appShellCalls, ev: (code) => vm.runInContext(code, ctx) };
  }

  // Agent 172-era pattern: an object/array built entirely inside the vm sandbox (e.g. a fresh
  // `{}` or `[]` literal the function itself creates) belongs to the sandbox's own realm, so
  // assert.deepStrictEqual sees a structurally-identical-but-different-prototype value and fails
  // with "same structure but are not reference-equal". Round-tripping through JSON (which both
  // realms share, since JSON was injected into the context) produces a plain outer-realm value.
  const clone189 = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));


  test('updateSoundIcon: icon + aria-pressed/aria-label reflect soundOn, both states', () => {
    const e = env189();
    e.ev('soundOn=true'); e.ev('updateSoundIcon()');
    assert.strictEqual(e.els.soundIcon.getAttribute('aria-pressed'), null, 'the icon itself has no aria-pressed - that is on soundBtn');
    assert.deepStrictEqual([e.els.soundBtn.getAttribute('aria-pressed'), e.els.soundBtn.getAttribute('aria-label')], ['false', 'Mute sound effects']);
    e.ev('soundOn=false'); e.ev('updateSoundIcon()');
    assert.deepStrictEqual([e.els.soundBtn.getAttribute('aria-pressed'), e.els.soundBtn.getAttribute('aria-label')], ['true', 'Unmute sound effects']);
  });

  test('updateSpeedBtn: label and aria-label flip between 1x and 0.75x', () => {
    const e = env189();
    e.ev('audioSpeed=1'); e.ev('updateSpeedBtn()');
    assert.deepStrictEqual([e.els.speedBtn.textContent, e.els.speedBtn.getAttribute('aria-label')], ['1x', 'Sound effect speed: normal (1x). Tap to change.']);
    e.ev('audioSpeed=0.75'); e.ev('updateSpeedBtn()');
    assert.deepStrictEqual([e.els.speedBtn.textContent, e.els.speedBtn.getAttribute('aria-label')], ['0.75x', 'Sound effect speed: slow (0.75x). Tap to change.']);
  });

  // ---------- escStrip / course strip ----------
  test('escStrip escapes the five HTML-sensitive characters', () => {
    const e = env189();
    assert.strictEqual(e.ev('escStrip(\'<a>&"\\\'\')'), '&lt;a&gt;&amp;&quot;&#39;');
    assert.strictEqual(e.ev('escStrip(null)'), '', 'null/undefined become empty string, not "null"');
  });

  test('renderCourseStrip: writes course + unit (escaped, separated by a middle dot) and adds the visible class; missing courseTitleParam is a no-op; a course with no unit omits the separator', () => {
    const e = env189({ courseTitleParam: 'A1 <Basics>', unitTitleParam: 'Unit "1"' });
    e.ev('renderCourseStrip()');
    assert.strictEqual(e.els.courseStrip.innerHTML, '<span>A1 &lt;Basics&gt;</span><span class="sep">\u00b7</span><span>Unit &quot;1&quot;</span>');
    assert.ok(e.els.courseStrip.classList.contains('visible'));
    const e2 = env189({ courseTitleParam: null });
    e2.ev('renderCourseStrip()');
    assert.strictEqual(e2.els.courseStrip.innerHTML, '', 'no course param -> untouched');
    assert.strictEqual(e2.els.courseStrip.classList.contains('visible'), false);
    const e3 = env189({ courseTitleParam: 'Solo Course', unitTitleParam: null });
    e3.ev('renderCourseStrip()');
    assert.strictEqual(e3.els.courseStrip.innerHTML, '<span>Solo Course</span>', 'no unit -> no separator span');
    assert.ok(e3.els.courseStrip.classList.contains('visible'));
  });

  // ---------- show() / setBackgroundInert() ----------
  test('show(section): only the named overlay is display:grid (others display:none), and setBackgroundInert follows it', () => {
    const e = env189();
    e.ev('show("start")');
    assert.deepStrictEqual(['loading', 'start', 'error', 'end'].map((s) => e.els[s].style.display), ['none', 'grid', 'none', 'none']);
    assert.strictEqual(e.headerEl.getAttribute('inert'), '', 'background is inert while an overlay is up');
    assert.strictEqual(e.mainEl.getAttribute('inert'), '');
    assert.deepStrictEqual(e.appShellCalls, [true]);
  });

  test('show(null): every overlay hides, background is no longer inert, bottom nav is told setVisible(false)', () => {
    const e = env189();
    e.ev('show("error")'); // put an overlay up first
    e.ev('show(null)');
    assert.deepStrictEqual(['loading', 'start', 'error', 'end'].map((s) => e.els[s].style.display), ['none', 'none', 'none', 'none']);
    assert.strictEqual(e.headerEl.getAttribute('inert'), null);
    assert.strictEqual(e.mainEl.getAttribute('inert'), null);
    assert.deepStrictEqual(e.appShellCalls, [true, false]);
  });

  test('show(): a missing window.MylingoAppShell does not throw (guarded call)', () => {
    const e = env189({ appShell: false });
    assert.doesNotThrow(() => e.ev('show("start")'));
  });

  // ---------- configureStart ----------
  test('configureStart: no saved session -> resume button hidden, "Start quiz"; a saved session -> resume button shown, "Start over"; placement-120 relabels the start button', () => {
    const e = env189();
    e.ev('data={id:"q1",version:1,questions:[{question:"a",answers:["x","y"],correctIndex:1}]}');
    e.ev('configureStart()');
    assert.deepStrictEqual([e.els.resumeBtn.style.display, e.els.startBtn.textContent], ['none', 'Start quiz']);
    e.ev('writeSession("q1",{version:1,quizId:"q1",quizVersion:"1",questionIndex:0,answers:[null],score:0,status:"in-progress",startedAt:1,updatedAt:2})');
    e.ev('configureStart()');
    assert.deepStrictEqual([e.els.resumeBtn.style.display, e.els.startBtn.textContent], ['inline-flex', 'Start over']);
    const e2 = env189();
    e2.ev('data={id:"placement-120",version:1,questions:[{question:"a",answers:["x","y"],correctIndex:1}]}');
    e2.ev('configureStart()');
    assert.strictEqual(e2.els.startBtn.textContent, 'Start level assessment', 'placement-120 keeps its special label when there is no session to resume');
  });

  // ---------- startFresh ----------
  test('startFresh: resets index/score/answerCorrect, clears any prior session, stops sounds, hides all overlays, calls render() and writes a fresh in-progress session', () => {
    const e = env189();
    e.ev('data={id:"q1",version:1,title:"T",questions:[{question:"a",answers:["x","y"],correctIndex:1},{question:"b",answers:["x","y"],correctIndex:1}]}');
    e.ev('writeSession("q1",{version:1,quizId:"q1",quizVersion:"1",questionIndex:1,answers:[null,null],score:1,status:"in-progress",startedAt:1,updatedAt:2})');
    e.ev('i=1;score=1;answerCorrect={0:true}');
    e.ev('startFresh()');
    assert.deepStrictEqual([e.ev('i'), e.ev('score'), clone189(e.ev('answerCorrect'))], [0, 0, {}]);
    assert.strictEqual(e.els.score.textContent, 0);
    assert.deepStrictEqual(e.calls, [['stopAllSounds'], ['render']], 'render() is called fresh; finishAnswer is not');
    assert.deepStrictEqual(['loading', 'start', 'error', 'end'].map((s) => e.els[s].style.display), ['none', 'none', 'none', 'none']);
    const fresh = e.ev('readSession("q1")');
    assert.deepStrictEqual([fresh.questionIndex, fresh.score, fresh.status], [0, 0, 'in-progress'], 'the old session was overwritten by a brand-new one, not left in place');
  });

  // ---------- resumeSession ----------
  test('resumeSession: no saved session falls through to configureStart() + startFresh() (button relabeled AND a fresh run started)', () => {
    const e = env189();
    e.ev('data={id:"q1",version:1,questions:[{question:"a",answers:["x","y"],correctIndex:1}]}');
    e.ev('resumeSession()');
    assert.deepStrictEqual([e.els.resumeBtn.style.display, e.els.startBtn.textContent], ['none', 'Start quiz'], 'configureStart() ran first');
    assert.deepStrictEqual(e.calls, [['stopAllSounds'], ['render']], 'then startFresh() ran');
  });

  test('resumeSession: restores position/score/answerCorrect from the saved session and calls render(); no answer recorded yet at the resume point -> no replay', () => {
    const e = env189();
    e.ev('data={id:"q1",version:1,questions:[{question:"a",answers:["x","y"],correctIndex:1},{question:"b",answers:["x","y"],correctIndex:1}]}');
    e.ev('writeSession("q1",{version:1,quizId:"q1",quizVersion:"1",questionIndex:1,answers:[{response:{index:1},correct:true,correctText:"x"},null],score:1,status:"in-progress",startedAt:10,updatedAt:20})');
    e.ev('resumeSession()');
    assert.deepStrictEqual([e.ev('i'), e.ev('score')], [1, 1]);
    assert.strictEqual(e.els.score.textContent, 1);
    assert.deepStrictEqual(e.calls, [['stopAllSounds'], ['render']], 'the CURRENT question (index 1) has no recorded answer, so no finishAnswer replay');
  });

  test('resumeSession: an answer already recorded AT the resume index is replayed - applyResponseToUI paints it, finishAnswer re-grades it, and restoringSessionAnswer is true only during the replay', () => {
    const e = env189();
    e.ev('data={id:"q1",version:1,questions:[{question:"a",answers:["x","y","z"],correctIndex:2},{question:"b",answers:["x","y"],correctIndex:1}]}');
    e.ev('writeSession("q1",{version:1,quizId:"q1",quizVersion:"1",questionIndex:0,answers:[{response:{index:2},correct:true,correctText:"y"},null],score:1,status:"in-progress",startedAt:10,updatedAt:20})');
    const opt2 = new QEl(); opt2.dataset.index = '2'; opt2.classList.add('option');
    e.els.options.appendChild(opt2);
    e.ev('resumeSession()');
    assert.ok(opt2.classList.contains('selected'), 'applyResponseToUI ran for real and painted the saved choice');
    assert.deepStrictEqual(e.calls, [['stopAllSounds'], ['render'], ['finishAnswer', true, 'y', { index: 2 }]]);
    assert.strictEqual(e.ev('restoringSessionAnswer'), false, 'the flag is reset (in a finally) once the replay is done, even though finishAnswer is a stub here');
  });

  // ---------- applyResponseToUI: every question type it paints ----------
  test('applyResponseToUI: radio selects only the matching option', () => {
    const e = env189();
    e.ev('data={id:"q1",questions:[{question:"a",answers:["x","y","z"],correctIndex:2}]};i=0;');
    const o1 = new QEl(); o1.dataset.index = '1'; o1.classList.add('option');
    const o2 = new QEl(); o2.dataset.index = '2'; o2.classList.add('option');
    e.els.options.appendChild(o1); e.els.options.appendChild(o2);
    e.ev('applyResponseToUI({index:2})');
    assert.deepStrictEqual([o1.classList.contains('selected'), o2.classList.contains('selected'), o2.getAttribute('aria-checked')], [false, true, 'true']);
  });

  test('applyResponseToUI: checkbox selects every index in the saved set and none of the others', () => {
    const e = env189();
    e.ev('data={id:"q1",questions:[{question:"a",question_type:"checkbox",answers:["x","y","z"],correctIndices:[1,3]}]};i=0;');
    const o1 = new QEl(); o1.dataset.index = '1'; o1.classList.add('option');
    const o2 = new QEl(); o2.dataset.index = '2'; o2.classList.add('option');
    const o3 = new QEl(); o3.dataset.index = '3'; o3.classList.add('option');
    [o1, o2, o3].forEach((o) => e.els.options.appendChild(o));
    e.ev('applyResponseToUI({indices:[1,3]})');
    assert.deepStrictEqual([o1, o2, o3].map((o) => o.classList.contains('selected')), [true, false, true]);
  });

  test('applyResponseToUI: dropdown sets the select value; text/short_text/number/date/fill_in_the_blank set the input value (null becomes "")', () => {
    const e = env189();
    e.ev('data={id:"q1",questions:[{question:"a",question_type:"dropdown",answers:["x","y"],correctIndex:1}]};i=0;');
    e.ev('applyResponseToUI({index:2})');
    assert.strictEqual(e.els.choiceSelect.value, '2');
    const e2 = env189();
    e2.ev('data={id:"q1",questions:[{question:"a",question_type:"short_text",acceptedAnswers:["hi"]}]};i=0;');
    e2.ev('applyResponseToUI({value:"hello"})');
    assert.strictEqual(e2.els.answerInput.value, 'hello');
    e2.ev('applyResponseToUI({value:null})');
    assert.strictEqual(e2.els.answerInput.value, '', 'a null saved value must not become the string "null"');
  });

  test('applyResponseToUI: matching fills each select[data-left] with its saved right-hand value, matched case/whitespace-insensitively', () => {
    const e = env189();
    e.ev('data={id:"q1",questions:[{question:"a",question_type:"matching",pairs:[{left:"cat",right:"gato"},{left:"dog",right:"perro"}]}]};i=0;');
    const s1 = new QEl(); s1.dataset.left = 'cat'; s1._attrs['data-left'] = 'cat';
    const s2 = new QEl(); s2.dataset.left = 'Dog'; s2._attrs['data-left'] = 'Dog'; // authoring-case mismatch on purpose
    e.els.options.appendChild(s1); e.els.options.appendChild(s2);
    e.ev('applyResponseToUI({matching:[{left:"cat",right:"gato"},{left:" dog ",right:"perro"}]})');
    assert.deepStrictEqual([s1.value, s2.value], ['gato', 'perro']);
  });

  test('applyResponseToUI: ranking reorders the .rank-list to match the saved order and renumbers it', () => {
    const e = env189();
    e.ev('data={id:"q1",questions:[{question:"a",question_type:"ranking",items:["a","b","c"]}]};i=0;');
    const list = new QEl(); list.classList.add('rank-list');
    const mk = (v) => { const r = new QEl(); r.dataset.value = v; const num = new QEl(); num.classList.add('rank-num'); r.appendChild(num); return r; };
    const [ra, rb, rc] = ['a', 'b', 'c'].map(mk);
    [ra, rb, rc].forEach((r) => list.appendChild(r));
    e.els.options.appendChild(list);
    e.ev('applyResponseToUI({ranking:["c","a","b"]})');
    assert.deepStrictEqual(list.children.map((c) => c.dataset.value), ['c', 'a', 'b']);
    assert.deepStrictEqual(list.children.map((c) => c.querySelector('.rank-num').textContent), ['1', '2', '3'], 'updateRanks() renumbered after the reorder');
  });

  // ---------- suggestion pool chain: getManifest / lessonSuggestionIds / categorySuggestions / loadSuggestions ----------
  testAsync('getManifest: no MylingoRuntimeContentLoader -> null; present -> normalizes the loaded list; a rejected load -> null (caught)', async () => {
    const e = env189();
    assert.strictEqual(await e.ev('getManifest()'), null);
    const e2 = env189({ win: {
      MylingoRuntimeContentLoader: { loadManifest: (lvl) => Promise.resolve([{ id: 'q1', category: 'Grammar' }]) },
      MylingoRuntimeV2: { normalizeManifest: (list) => list.map((x) => Object.assign({ norm: true }, x)) },
    } });
    assert.deepStrictEqual(clone189(await e2.ev('getManifest()')), [{ norm: true, id: 'q1', category: 'Grammar' }]);
    const e3 = env189({ win: { MylingoRuntimeContentLoader: { loadManifest: () => Promise.reject(new Error('x')) }, MylingoRuntimeV2: { normalizeManifest: (l) => l } } });
    assert.strictEqual(await e3.ev('getManifest()'), null);
  });

  testAsync('lessonSuggestionIds: no lessonParam -> null (standalone quiz, old behavior); an owner not found for lessonParam -> null', async () => {
    const e = env189({ lessonParam: null });
    assert.strictEqual(await e.ev('lessonSuggestionIds()'), null);
    const lessons = [{ lesson_id: 'lX', unit_id: 'u1', exercise_quiz_ids: ['q9'] }];
    const e2 = env189({ lessonParam: 'lA', fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(lessons) }) });
    e2.ev('data={id:"q1",questions:[]}');
    assert.strictEqual(await e2.ev('lessonSuggestionIds()'), null);
  });

  testAsync('lessonSuggestionIds: tier 1 is the owning lesson\'s own exercise ids (excluding the current quiz); tier 2 falls back to unit-mates\' ids only when tier 1 is empty', async () => {
    const tier1lessons = [{ lesson_id: 'lA', unit_id: 'u1', exercise_quiz_ids: ['q1', 'q2', 'q3'] }];
    const e = env189({ lessonParam: 'lA', fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(tier1lessons) }) });
    e.ev('data={id:"q2",questions:[]}');
    assert.deepStrictEqual(clone189(await e.ev('lessonSuggestionIds()')), ['q1', 'q3']);
    const tier2lessons = [
      { lesson_id: 'lA', unit_id: 'u1', exercise_quiz_ids: ['q1'] },
      { lesson_id: 'lB', unit_id: 'u1', exercise_quiz_ids: ['q2', 'q3'] },
    ];
    const e2 = env189({ lessonParam: 'lA', fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(tier2lessons) }) });
    e2.ev('data={id:"q1",questions:[]}');
    assert.deepStrictEqual(clone189(await e2.ev('lessonSuggestionIds()')), ['q2', 'q3'], 'tier 1 was empty after excluding the current quiz, so tier 2 (same unit, other lessons) is used');
    const noUnit = [{ lesson_id: 'lA', unit_id: null, exercise_quiz_ids: ['q1'] }];
    const e3 = env189({ lessonParam: 'lA', fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(noUnit) }) });
    e3.ev('data={id:"q1",questions:[]}');
    assert.strictEqual(await e3.ev('lessonSuggestionIds()'), null, 'no unit_id to fall back to -> null, not an empty array');
  });

  testAsync('categorySuggestions: filters the manifest to the current category, excludes the current quiz itself, and sets suggestPool as a side effect; no category on the quiz -> empty array', async () => {
    const manifest = [{ id: 'q1', category: 'Grammar' }, { id: 'q2', category: 'Grammar' }, { id: 'q3', category: 'Vocab' }];
    const e = env189({ win: { MylingoRuntimeContentLoader: { loadManifest: () => Promise.resolve(manifest) }, MylingoRuntimeV2: { normalizeManifest: (l) => l } } });
    e.ev('data={id:"q1",category:"Grammar",questions:[]}');
    const r = await e.ev('categorySuggestions()');
    assert.deepStrictEqual(clone189(r), [{ id: 'q2', category: 'Grammar' }]);
    assert.deepStrictEqual(clone189(await e.ev('suggestPool')), [{ id: 'q2', category: 'Grammar' }]);
    const e2 = env189();
    e2.ev('data={id:"q1",questions:[]}'); // no category
    assert.deepStrictEqual(clone189(await e2.ev('categorySuggestions()')), []);
  });

  testAsync('loadSuggestions: no data -> no-op (undefined, no throw); lesson-tier ids that resolve in the manifest win; ids that DON\'T resolve fall back to categorySuggestions; a standalone quiz (no lesson) goes straight to categorySuggestions', async () => {
    const e = env189();
    assert.strictEqual(await e.ev('loadSuggestions()'), undefined);

    const lessons = [{ lesson_id: 'lA', unit_id: 'u1', exercise_quiz_ids: ['q1', 'q2'] }];
    const manifest = [{ id: 'q2', category: 'Grammar' }, { id: 'q9', category: 'Vocab' }];
    const e2 = env189({
      lessonParam: 'lA', fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(lessons) }),
      win: { MylingoRuntimeContentLoader: { loadManifest: () => Promise.resolve(manifest) }, MylingoRuntimeV2: { normalizeManifest: (l) => l } },
    });
    e2.ev('data={id:"q1",category:"Grammar",questions:[]}');
    assert.deepStrictEqual(clone189(await e2.ev('loadSuggestions()')), [{ id: 'q2', category: 'Grammar' }]);

    const lessonsMissing = [{ lesson_id: 'lA', unit_id: 'u1', exercise_quiz_ids: ['q1', 'qMISSING'] }];
    const manifest2 = [{ id: 'q1', category: 'Grammar' }, { id: 'q5', category: 'Grammar' }];
    const e3 = env189({
      lessonParam: 'lA', fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(lessonsMissing) }),
      win: { MylingoRuntimeContentLoader: { loadManifest: () => Promise.resolve(manifest2) }, MylingoRuntimeV2: { normalizeManifest: (l) => l } },
    });
    e3.ev('data={id:"q1",category:"Grammar",questions:[]}');
    assert.deepStrictEqual(clone189(await e3.ev('loadSuggestions()')), [{ id: 'q5', category: 'Grammar' }], 'qMISSING did not resolve in the manifest, so it fell back to category matching (and still excludes q1 itself)');

    const e4 = env189({ win: { MylingoRuntimeContentLoader: { loadManifest: () => Promise.resolve([{ id: 'q9', category: 'Grammar' }]) }, MylingoRuntimeV2: { normalizeManifest: (l) => l } } });
    e4.ev('data={id:"q1",category:"Grammar",questions:[]}'); // no lessonParam at all
    assert.deepStrictEqual(clone189(await e4.ev('loadSuggestions()')), [{ id: 'q9', category: 'Grammar' }]);
  });
})();

// ============================================================
console.log('index.html vs main/index.html: normalised-diff drift guard (Agent 190, HANDOFF_AGENT_188 item 32/188:2)');
// ============================================================
(function () {
  // The root index.html and main/index.html are near-duplicates that differ ONLY by their
  // path-depth (root uses "./", main uses "../" plus its own-folder-relative variants) and by
  // two call-sites that are genuinely written differently at each depth (resolveHomepageState's
  // explicit vs default base arg, and each page's own-URL self-reference in the Continue link's
  // redirect param). HANDOFF_AGENT_188 flagged this as [INFO] - "easy to drift" - since nothing
  // enforces the two files stay in sync. This test normalises BOTH known-different depth idioms to
  // shared markers via exact, count-checked substring replacements and then asserts the two
  // results are byte-identical. If a future edit touches one file but not the other, or changes
  // one of these depth patterns without updating its counterpart, either the exact-count check
  // below throws (naming exactly which literal moved) or the final equality assertion does
  // (pinpointing exactly where the two pages now disagree) - instead of the drift going unnoticed
  // the way Agent 188's actual bug (root asking for the wrong course_content path) did.
  const fs = require('fs');
  const rootHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const mainHtml = fs.readFileSync(path.join(__dirname, '..', 'main', 'index.html'), 'utf8');

  // [literal substring in this file, marker to normalise it to, expected occurrence count]
  function normalise(html, rules) {
    let s = html;
    for (const [old, marker, expectedCount] of rules) {
      const actualCount = s.split(old).length - 1;
      if (actualCount !== expectedCount) {
        throw new Error('normalise: expected ' + expectedCount + ' occurrence(s) of ' + JSON.stringify(old) + ' but found ' + actualCount + ' - the two files\' depth-relative paths have drifted apart (or a new occurrence was added/removed) and the normalised-diff comparison needs updating');
      }
      s = s.split(old).join(marker);
    }
    return s;
  }

  const rootRules = [
    ['href="./shared/brand/favicon.ico"', 'href="{{SHARED}}/brand/favicon.ico"', 1],
    ['href="./manifest.json"', 'href="{{ROOT}}/manifest.json"', 1],
    ['src="./shared/js/course-progress.js"', 'src="{{SHARED}}/js/course-progress.js"', 1],
    ['src="./shared/js/gamification.js"', 'src="{{SHARED}}/js/gamification.js"', 1],
    ["register('./sw.js')", "register('{{ROOT}}/sw.js')", 1],
    ['href="./shared/css/app-shell.css"', 'href="{{SHARED}}/css/app-shell.css"', 1],
    ['href="./shared/css/theme.css"', 'href="{{SHARED}}/css/theme.css"', 1],
    ['src="./shared/js/splash.js"', 'src="{{SHARED}}/js/splash.js"', 1],
    ['src="./shared/brand/logo-horizontal.svg"', 'src="{{SHARED}}/brand/logo-horizontal.svg"', 1],
    ['href="./main/placement.html"', 'href="{{PLACEMENT}}"', 3], // nav link + hero CTA + empty-state CTA
    ['href="./courses/index.html">Explore courses</a>', 'href="{{COURSES}}/index.html">Explore courses</a>', 1],
    ['href="./courses/lesson.html?lesson=\'', 'href="{{COURSES}}/lesson.html?lesson=\'', 1],
    ["resolveHomepageState('./')", 'resolveHomepageState({{BASE}})', 1], // root passes its base explicitly (Agent 188 fix)
    ["redirect='+encodeURIComponent('./index.html')", "redirect='+encodeURIComponent({{SELF}})", 1],
    ['src="./shared/js/app-shell.js"', 'src="{{SHARED}}/js/app-shell.js"', 1],
  ];
  const mainRules = [
    ['href="../shared/brand/favicon.ico"', 'href="{{SHARED}}/brand/favicon.ico"', 1],
    ['href="../manifest.json"', 'href="{{ROOT}}/manifest.json"', 1],
    ['src="../shared/js/course-progress.js"', 'src="{{SHARED}}/js/course-progress.js"', 1],
    ['src="../shared/js/gamification.js"', 'src="{{SHARED}}/js/gamification.js"', 1],
    ["register('../sw.js')", "register('{{ROOT}}/sw.js')", 1],
    ['href="../shared/css/app-shell.css"', 'href="{{SHARED}}/css/app-shell.css"', 1],
    ['href="../shared/css/theme.css"', 'href="{{SHARED}}/css/theme.css"', 1],
    ['src="../shared/js/splash.js"', 'src="{{SHARED}}/js/splash.js"', 1],
    ['src="../shared/brand/logo-horizontal.svg"', 'src="{{SHARED}}/brand/logo-horizontal.svg"', 1],
    ['href="./placement.html"', 'href="{{PLACEMENT}}"', 3],
    ['href="../courses/index.html">Explore courses</a>', 'href="{{COURSES}}/index.html">Explore courses</a>', 1],
    ['href="../courses/lesson.html?lesson=\'', 'href="{{COURSES}}/lesson.html?lesson=\'', 1],
    ['resolveHomepageState()', 'resolveHomepageState({{BASE}})', 1], // main relies on the '../' default (see HANDOFF_AGENT_188 item 1)
    ["redirect='+encodeURIComponent('../main/index.html')", "redirect='+encodeURIComponent({{SELF}})", 1],
    ['src="../shared/js/app-shell.js"', 'src="{{SHARED}}/js/app-shell.js"', 1],
  ];

  test('index.html and main/index.html are identical once each file\'s own path-depth idioms are normalised to shared markers', () => {
    const normRoot = normalise(rootHtml, rootRules);
    const normMain = normalise(mainHtml, mainRules);
    assert.strictEqual(normRoot, normMain, 'root and main/index.html have diverged beyond the known depth-relative path differences - review the diff between the two files and either fix the drift or extend the normalisation rules above if the new difference is an intentional, depth-only one');
  });

  test('the home-link nav anchor ("./index.html") is - by design - identical, self-relative text in both files (each level folder treats its own index as "home")', () => {
    assert.ok(rootHtml.includes('<a href="./index.html" aria-label="Mylingo home">'));
    assert.ok(mainHtml.includes('<a href="./index.html" aria-label="Mylingo home">'));
  });
})();

// ============================================================
console.log('quiz.html dead-code removal pin + cache bump (Agent 191, HANDOFF_AGENT_190 item 33)');
// ============================================================
(function () {
  const fs = require('fs');
  const quizSrc = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  test('shared/quiz.html no longer defines the dead valuesEqual helper or its only reader qGlobalTolerance (Agent 191, item 33) - submitAnswer inlines each per-type comparison', () => {
    assert.ok(!/function\s+valuesEqual\b/.test(quizSrc), 'valuesEqual is back in quiz.html');
    assert.ok(!/\bqGlobalTolerance\b/.test(quizSrc), 'qGlobalTolerance is back in quiz.html');
    assert.ok(/function submitAnswer\(input\)/.test(quizSrc), 'submitAnswer must still exist');
  });
  test('sw.js CACHE_VERSION is mylingo-v25 (v24 -> v25 Agent 203: placement.js, safe-url.js, orientation.js; v16 -> v17 Agent 191, v17 -> v18 Agent 194, v18 -> v19 Agent 195, v19 -> v20 Agent 196, v20 -> v21 Agent 199: course-progress.js; v21 -> v22 Agent 200: gamification.js; v22 -> v23 Agent 201: skill-mastery.js + review-scheduler.js; v23 -> v24 Agent 202: recommendations.js + mastery-review-ui.js; core-pack files changed)', () => {
    assert.ok(/var CACHE_VERSION = 'mylingo-v25';/.test(swSrc));
  });
})();

// ============================================================
console.log('lesson.html redirect param is inert + quiz return URLs resolve from /shared/ (Agent 192, HANDOFF_AGENT_190 item 34)');
// ============================================================
(function () {
  // Item 34 asked whether the homepage Continue link's self-referential redirect literal
  // ('./index.html' on root, '../main/index.html' on main) ever misfires on the way
  // lesson -> quiz -> back. Agent 192 verified in a real Chromium run that it never reaches
  // the quiz: courses/lesson.html reads ?redirect into `redirectParam` but never uses it, and
  // always hands quiz.html its own '../courses/lesson.html?...&slide=practice' return URL,
  // which resolves correctly from /shared/. These tests pin that, so if a future edit starts
  // consuming redirectParam it must consciously deal with the /courses/ vs /shared/ base.
  const fs = require('fs');
  const lessonSrc = fs.readFileSync(path.join(__dirname, '..', 'courses', 'lesson.html'), 'utf8');
  test('courses/lesson.html declares redirectParam but never reads it (the homepage redirect literal is inert; consuming it needs a deliberate base-URL decision) (Agent 192, item 34)', () => {
    assert.strictEqual((lessonSrc.match(/\bredirectParam\b/g) || []).length, 1);
  });
  test('courses/lesson.html builds its quiz return URL as ../courses/lesson.html?... (resolves from /shared/quiz.html) (Agent 192, item 34)', () => {
    assert.ok(lessonSrc.includes("var practiceReturnUrl='../courses/lesson.html?lesson='"));
  });
})();

function finish() {
  return queuedAsync.reduce((chain, [name, body]) => chain.then(async () => {
    try { await body(); pass++; console.log('  ok - ' + name); }
    catch (e) { fail++; console.log('  FAIL - ' + name); console.log('    ' + (e && e.message)); }
  }), Promise.resolve()).then(report);
}

function report() {


  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}

// ============================================================
console.log('quiz.html digit shortcut ignores modifier chords (Agent 194, HANDOFF_AGENT_174 carried item 14)');
// ============================================================
(function () {
  // Ctrl/Cmd+1..9 is the browser's tab-switch shortcut, Alt+digit is used by other browser/OS chords.
  // The document keydown handler used to answer (and lock) a radio question from those chords.
  // The behavioural test lives in the Agent 174 keyboard-layer section; this pins the guard's source.
  const fs = require('fs');
  const quizSrc = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');
  test('shared/quiz.html: the document keydown handler opens with the ctrl/meta/alt guard, before any state check (Agent 194, item 14)', () => {
    const at = quizSrc.indexOf("document.addEventListener('keydown',e=>{");
    assert.ok(at > -1, 'document keydown handler missing');
    const body = quizSrc.slice(at, quizSrc.indexOf('\n});', at));
    const lines = body.split('\n').map((l) => l.trim());
    assert.strictEqual(lines[1], 'if(e.ctrlKey||e.metaKey||e.altKey)return;');
    assert.ok(lines[2].startsWith('if(locked||!data)return;'));
  });
})();

// ============================================================
console.log('quiz.html banner subprompt / lesson-list retry + splash icon URL — source pins (Agent 195, carried items 11, 12, 16)');
// ============================================================
(function () {
  const fs = require('fs');
  const quiz = fs.readFileSync(path.join(__dirname, '..', 'shared', 'quiz.html'), 'utf8');
  const splash = fs.readFileSync(path.join(__dirname, '..', 'shared', 'js', 'splash.js'), 'utf8');
  test('shared/quiz.html: the subprompt expression special-cases banner to "" (item 11) and getLevelLessons evicts its cached promise on failure (item 12)', () => {
    assert.ok(quiz.includes("q.subprompt||(type==='banner'?'':{checkbox:"));
    assert.ok(!quiz.includes("{banner:'',checkbox:"), "the dead banner:'' map entry is gone");
    assert.ok(quiz.includes('.catch(()=>{ _levelLessonsPromise=null; return []; })'));
  });
  test('shared/js/splash.js: the icon URL is derived from document.currentScript.src via new URL("../brand/icon.svg", src) (item 16)', () => {
    assert.ok(splash.includes('document.currentScript'));
    assert.ok(splash.includes("new URL('../brand/icon.svg',scriptSrc)"));
  });
})();

// ============================================================
console.log('quiz.html app-files error, orientation.js unanswered/clamp/readState, autosave rowCount — source pins (Agent 196, carried items 15, 18, 20)');
// ============================================================
(function () {
  const fs = require('fs');
  const rd = (...a) => fs.readFileSync(path.join(__dirname, '..', ...a), 'utf8');
  const quiz = rd('shared', 'quiz.html'), ori = rd('shared', 'js', 'orientation.js'), auto = rd('shared', 'js', 'authoring-draft-autosave.js');
  test('shared/quiz.html: load() checks the runtime loader and the V2 adapter before use and routes both to appFilesError() (non-retryable)', () => {
    assert.ok(quiz.includes("function appFilesError(){errorState('App files missing',"));
    assert.ok(/appFilesError\(\)\{errorState\('App files missing'[^\n]*,false\)\}/.test(quiz), 'appFilesError is not retryable');
    assert.ok(quiz.includes("if(e&&e.appFiles){appFilesError();return}"));
    assert.ok(quiz.includes("typeof window.MylingoRuntimeV2.normalizeQuiz!=='function'){appFilesError();return}"));
  });
  test('shared/js/orientation.js: answerValue() treats null/blank as unanswered, signals are clamped, readState rejects arrays', () => {
    assert.ok(ori.includes('function answerValue(a)'));
    assert.ok(ori.includes('clamp(v, 0, 4)'));
    assert.ok(ori.includes("Array.isArray(value)) return null;"));
  });
  test('shared/js/authoring-draft-autosave.js: rowCount is the count of stored rows (storedRows), not rows.length', () => {
    assert.ok(auto.includes('storedRows += part.length'));
    assert.strictEqual((auto.match(/rowCount: storedRows/g) || []).length, 2);
    assert.ok(!/rowCount: rows\.length/.test(auto));
  });
})();
