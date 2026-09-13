/*! Mylingo Level Lock — progressive level unlocking.
 *
 * A learner gets a level either assigned (placement orientation / assessment)
 * or picked manually. Once a level is set, every level above it (CEFR-wise)
 * is locked until the learner's assigned/chosen level advances. The current
 * level and everything below it always stay open for practice.
 *
 * Storage: localStorage key mylingo.chosenLevel.v1 -> {level, source, timestamp}
 *   source: 'assessment' (placement engine assigned/updated it — authoritative,
 *            always overwrites) or 'manual' (learner picked it themselves —
 *            only takes effect the first time, so practicing a lower level
 *            afterwards never re-locks levels above the original choice).
 */
(function (global) {
  'use strict';
  if (global.MylingoLevelLock) return;

  var LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  var LEVEL_LABEL = { a1: 'Beginner', a2: 'Elementary', b1: 'Intermediate', b2: 'Upper-intermediate', c1: 'Advanced', c2: 'Proficiency' };
  var KEY = 'mylingo.chosenLevel.v1';

  function normalize(level) {
    level = String(level || '').toLowerCase();
    return LEVELS.indexOf(level) >= 0 ? level : null;
  }

  function read() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      var lvl = normalize(v && v.level);
      return lvl ? { level: lvl, source: v.source || 'manual', timestamp: v.timestamp || null } : null;
    } catch (e) { return null; }
  }

  function write(level, source) {
    var lvl = normalize(level);
    if (!lvl) return null;
    var rec = { level: lvl, source: source || 'manual', timestamp: Date.now() };
    try { global.localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) { }
    try { global.dispatchEvent(new CustomEvent('mylingo:levellock', { detail: rec })); } catch (e) { }
    return rec;
  }

  // Authoritative: the placement/assessment engine assigning or updating a
  // recommended level always moves the lock ceiling, up or down.
  function setAssigned(level) {
    return write(level, 'assessment');
  }

  // Learner-driven: only takes effect the first time nothing is set yet.
  // Practicing a level the learner is already allowed to reach should never
  // change the ceiling.
  function setManualIfUnset(level) {
    var current = read();
    if (current) return current;
    return write(level, 'manual');
  }

  function clear() {
    try { global.localStorage.removeItem(KEY); } catch (e) { }
  }

  function ceilingIndex() {
    var current = read();
    return current ? LEVELS.indexOf(current.level) : -1;
  }

  // Nothing chosen yet -> nothing is locked (learner hasn't started).
  function isLocked(level) {
    var lvl = normalize(level);
    if (!lvl) return false;
    var ceiling = ceilingIndex();
    if (ceiling < 0) return false;
    return LEVELS.indexOf(lvl) > ceiling;
  }

  function label(level) {
    var lvl = normalize(level);
    return lvl ? lvl.toUpperCase() : '';
  }

  // Renders a full-page "locked" state into a container, replacing whatever
  // was there. Used by level pages (index/dashboard) to hard-block direct
  // navigation to a locked level, not just hide the link to it.
  function renderLockedState(container, level, opts) {
    if (!container) return;
    opts = opts || {};
    var current = read();
    var currentLabel = current ? label(current.level) : null;
    var backHref = opts.backHref || '../main/index.html';
    container.innerHTML =
      '<div class="level-locked-state" style="max-width:420px;margin:40px auto;text-align:center;padding:20px">' +
      '<div style="font-size:38px;line-height:1;margin-bottom:12px" aria-hidden="true">\uD83D\uDD12</div>' +
      '<h1 style="font-size:22px;margin:0 0 10px">' + label(level) + ' is locked</h1>' +
      '<p style="color:#687280;line-height:1.55;margin:0 0 22px">' +
      (currentLabel
        ? 'You\u2019re currently set to ' + currentLabel + '. Keep going from there \u2014 ' + label(level) + ' unlocks once you reach it.'
        : 'Choose or take the level test first to unlock levels in order.') +
      '</p>' +
      '<a href="' + backHref + '" style="display:inline-block;background:#1959d1;color:#fff;text-decoration:none;font-weight:800;padding:13px 24px;border-radius:999px">Back to my level</a>' +
      '</div>';
  }

  // Decorates a set of level links/cards inside `container`. Any element
  // (anchor or wrapper) with [data-level] is treated as pointing at that
  // CEFR level:
  //  - locked levels: interior <a> tags are neutralized (no navigation) and
  //    a small lock badge is shown.
  //  - unlocked levels: normal link behavior; if nothing is chosen yet,
  //    clicking commits that level as the learner's manual choice.
  function decorateLevelLinks(container) {
    if (!container) return;
    var nodes = container.querySelectorAll('[data-level]');
    nodes.forEach(function (node) {
      var lvl = normalize(node.getAttribute('data-level'));
      if (!lvl) return;
      var anchors = node.tagName === 'A' ? [node] : Array.prototype.slice.call(node.querySelectorAll('a'));
      var locked = isLocked(lvl);

      var overlay = node.querySelector('.level-lock-overlay');
      if (locked) {
        node.classList.add('is-level-locked');
        if (getComputedStyle(node).position === 'static') node.style.position = 'relative';
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'level-lock-overlay';
          overlay.setAttribute('aria-hidden', 'true');
          overlay.style.cssText = 'position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.62);backdrop-filter:blur(1px);border-radius:inherit;pointer-events:none';
          overlay.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>';
          node.appendChild(overlay);
        }
      } else {
        node.classList.remove('is-level-locked');
        if (overlay) overlay.remove();
      }

      anchors.forEach(function (a) {
        if (locked) {
          a.setAttribute('aria-disabled', 'true');
          a.dataset.mylingoLocked = '1';
        } else if (a.dataset.mylingoLocked) {
          a.removeAttribute('aria-disabled');
          delete a.dataset.mylingoLocked;
        }
        if (a.dataset.mylingoLockBound) return;
        a.dataset.mylingoLockBound = '1';
        a.addEventListener('click', function (e) {
          if (a.dataset.mylingoLocked) {
            e.preventDefault();
            return;
          }
          setManualIfUnset(lvl);
        });
      });
    });
  }

  global.MylingoLevelLock = {
    LEVELS: LEVELS.slice(),
    LEVEL_LABEL: LEVEL_LABEL,
    STORAGE_KEY: KEY,
    normalize: normalize,
    label: label,
    read: read,
    setAssigned: setAssigned,
    setManualIfUnset: setManualIfUnset,
    clear: clear,
    ceilingIndex: ceilingIndex,
    isLocked: isLocked,
    renderLockedState: renderLockedState,
    decorateLevelLinks: decorateLevelLinks
  };
})(window);
