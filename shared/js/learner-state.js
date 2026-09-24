/*! Mylingo — Learner State Integrity Contract (Agent 6) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.MylingoLearnerState = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  // Agent 159: `root` used to be referenced below without being a parameter of this
  // factory, so readLocal() threw a ReferenceError (swallowed by its try/catch) and
  // ALWAYS returned the fallback, in every environment.
  'use strict';

  var LEVELS = ['a1','a2','b1','b2','c1','c2'];
  var SKILLS = ['grammar','vocabulary','reading','listening','writing','usage'];
  var MAX_KEYS = 1000;
  var MAX_STRING = 512;
  var MAX_ARRAY = 100;

  function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
  function level(v) { return LEVELS.indexOf(String(v || '').toLowerCase()) >= 0; }
  function skill(v) { return SKILLS.indexOf(String(v || '').toLowerCase()) >= 0; }
  function boundedString(v, max) { return typeof v === 'string' && v.length <= (max || MAX_STRING); }
  function boundedArray(v, max) { return Array.isArray(v) && v.length <= (max || MAX_ARRAY); }

  // Agent 206: same bug class Agent 205 fixed in gamification.js's backup/restore
  // validators. These functions gated numeric fields on bare `Number(x)`, and
  // Number(true) / Number([5]) / Number([]) are 1 / 5 / 0, so a boolean or a
  // single-item/empty array in place of any numeric field (xpTotal, best,
  // question_count, interval_days, score, the skillMastery/reviewScheduling
  // `version` field, ...) passed validation. Unlike gamification.js's backup
  // path, this module validates state already sitting in localStorage (not a
  // direct file-upload boundary), but any code path that ever wrote a
  // non-plain-JSON value into one of these keys (or a future direct-write bug)
  // would have had its garbage rubber-stamped right back out through readLocal.
  // Only a real number or a non-blank numeric string is treated as a number now;
  // every other shape becomes NaN, which every existing finite(...) /
  // Number.isInteger(...) check downstream already rejects.
  function strictNum(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return Number(value);
    return NaN;
  }

  function parse(raw, fallback) {
    if (typeof raw !== 'string' || raw.length > 250000) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function validateProgress(value) {
    if (!isPlainObject(value) || Object.keys(value).length > MAX_KEYS) return false;
    return Object.keys(value).every(function (id) {
      var e = value[id];
      if (!boundedString(id) || !isPlainObject(e)) return false;
      if (e.id != null && String(e.id) !== id) return false;
      if (e.level != null && !level(e.level)) return false;
      if (e.status != null && e.status !== 'completed' && e.status !== 'in-progress') return false;
      if (e.best != null && (!finite(strictNum(e.best)) || strictNum(e.best) < 0 || strictNum(e.best) > 100)) return false;
      if (e.latest != null && (!finite(strictNum(e.latest)) || strictNum(e.latest) < 0 || strictNum(e.latest) > 100)) return false;
      if (e.attempts != null && (!Number.isInteger(strictNum(e.attempts)) || strictNum(e.attempts) < 0 || strictNum(e.attempts) > 100000)) return false;
      if (e.current != null && (!Number.isInteger(strictNum(e.current)) || strictNum(e.current) < 0 || strictNum(e.current) > 100000)) return false;
      if (e.totalQuestions != null && (!Number.isInteger(strictNum(e.totalQuestions)) || strictNum(e.totalQuestions) < 0 || strictNum(e.totalQuestions) > 100000)) return false;
      return e.lastAccess == null || finite(strictNum(e.lastAccess));
    });
  }

  function validateGamification(value) {
    if (!isPlainObject(value)) return false;
    if (value.xpTotal != null && (!finite(strictNum(value.xpTotal)) || strictNum(value.xpTotal) < 0 || strictNum(value.xpTotal) > 1000000000)) return false;
    if (value.streak != null && (!Number.isInteger(strictNum(value.streak)) || strictNum(value.streak) < 0 || strictNum(value.streak) > 1000000)) return false;
    if (value.longestStreak != null && (!Number.isInteger(strictNum(value.longestStreak)) || strictNum(value.longestStreak) < 0 || strictNum(value.longestStreak) > 1000000)) return false;
    if (value.lastActiveDate != null && !boundedString(value.lastActiveDate, 32)) return false;
    return value.rewardedSessions == null || boundedArray(value.rewardedSessions, 20);
  }

  function validateSkillMastery(value) {
    if (!isPlainObject(value) || strictNum(value.version) !== 1 || !isPlainObject(value.skills)) return false;
    return Object.keys(value.skills).length <= SKILLS.length && Object.keys(value.skills).every(function (name) {
      var e = value.skills[name];
      return skill(name) && isPlainObject(e) && Number.isInteger(strictNum(e.question_count)) && strictNum(e.question_count) >= 0 &&
        Number.isInteger(strictNum(e.correct_count)) && strictNum(e.correct_count) >= 0 && strictNum(e.correct_count) <= strictNum(e.question_count) &&
        Number.isInteger(strictNum(e.attempt_count)) && strictNum(e.attempt_count) >= 0 &&
        (e.accuracy == null || (finite(strictNum(e.accuracy)) && strictNum(e.accuracy) >= 0 && strictNum(e.accuracy) <= 100));
    });
  }

  function validateReviewScheduling(value) {
    if (!isPlainObject(value) || strictNum(value.version) !== 1 || !isPlainObject(value.skills)) return false;
    return Object.keys(value.skills).length <= SKILLS.length && Object.keys(value.skills).every(function (name) {
      var e = value.skills[name];
      return skill(name) && isPlainObject(e) && finite(strictNum(e.interval_days)) && strictNum(e.interval_days) >= 0 && strictNum(e.interval_days) <= 30 &&
        (e.interval_hours == null || (finite(strictNum(e.interval_hours)) && strictNum(e.interval_hours) >= 0 && strictNum(e.interval_hours) <= 720));
    });
  }

  function validatePlacement(value) {
    if (value == null) return true;
    return isPlainObject(value) && level(value.recommended_level) && level(value.assessed_level) &&
      finite(strictNum(value.score)) && strictNum(value.score) >= 0 && strictNum(value.score) <= 100 &&
      (value.evidence == null || boundedArray(value.evidence, 100));
  }

  function validateState(kind, value) {
    switch (kind) {
      case 'progress': return validateProgress(value);
      case 'gamification': return validateGamification(value);
      case 'skillMastery': return validateSkillMastery(value);
      case 'reviewScheduling': return validateReviewScheduling(value);
      case 'placement': return validatePlacement(value);
      default: return isPlainObject(value);
    }
  }

  function readLocal(key, kind, fallback) {
    var raw;
    try { raw = root.localStorage && root.localStorage.getItem(key); } catch (e) { return fallback; }
    var parsed = parse(raw, fallback);
    return validateState(kind, parsed) ? parsed : fallback;
  }

  return {
    LEVELS: LEVELS.slice(), SKILLS: SKILLS.slice(), MAX_KEYS: MAX_KEYS,
    parse: parse, validateProgress: validateProgress, validateGamification: validateGamification,
    validateSkillMastery: validateSkillMastery, validateReviewScheduling: validateReviewScheduling,
    validatePlacement: validatePlacement, validateState: validateState, readLocal: readLocal
  };
});
