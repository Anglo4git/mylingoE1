/*! Mylingo — Learner State Integrity Contract (Agent 6) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MylingoLearnerState = factory();
})(typeof self !== 'undefined' ? self : this, function () {
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
      if (e.best != null && (!finite(Number(e.best)) || Number(e.best) < 0 || Number(e.best) > 100)) return false;
      if (e.latest != null && (!finite(Number(e.latest)) || Number(e.latest) < 0 || Number(e.latest) > 100)) return false;
      if (e.attempts != null && (!Number.isInteger(Number(e.attempts)) || Number(e.attempts) < 0 || Number(e.attempts) > 100000)) return false;
      if (e.current != null && (!Number.isInteger(Number(e.current)) || Number(e.current) < 0 || Number(e.current) > 100000)) return false;
      if (e.totalQuestions != null && (!Number.isInteger(Number(e.totalQuestions)) || Number(e.totalQuestions) < 0 || Number(e.totalQuestions) > 100000)) return false;
      return e.lastAccess == null || finite(Number(e.lastAccess));
    });
  }

  function validateGamification(value) {
    if (!isPlainObject(value)) return false;
    if (value.xpTotal != null && (!finite(Number(value.xpTotal)) || Number(value.xpTotal) < 0 || Number(value.xpTotal) > 1000000000)) return false;
    if (value.streak != null && (!Number.isInteger(Number(value.streak)) || Number(value.streak) < 0 || Number(value.streak) > 1000000)) return false;
    if (value.longestStreak != null && (!Number.isInteger(Number(value.longestStreak)) || Number(value.longestStreak) < 0 || Number(value.longestStreak) > 1000000)) return false;
    if (value.lastActiveDate != null && !boundedString(value.lastActiveDate, 32)) return false;
    return value.rewardedSessions == null || boundedArray(value.rewardedSessions, 20);
  }

  function validateSkillMastery(value) {
    if (!isPlainObject(value) || Number(value.version) !== 1 || !isPlainObject(value.skills)) return false;
    return Object.keys(value.skills).length <= SKILLS.length && Object.keys(value.skills).every(function (name) {
      var e = value.skills[name];
      return skill(name) && isPlainObject(e) && Number.isInteger(Number(e.question_count)) && Number(e.question_count) >= 0 &&
        Number.isInteger(Number(e.correct_count)) && Number(e.correct_count) >= 0 && Number(e.correct_count) <= Number(e.question_count) &&
        Number.isInteger(Number(e.attempt_count)) && Number(e.attempt_count) >= 0 &&
        (e.accuracy == null || (finite(Number(e.accuracy)) && Number(e.accuracy) >= 0 && Number(e.accuracy) <= 100));
    });
  }

  function validateReviewScheduling(value) {
    if (!isPlainObject(value) || Number(value.version) !== 1 || !isPlainObject(value.skills)) return false;
    return Object.keys(value.skills).length <= SKILLS.length && Object.keys(value.skills).every(function (name) {
      var e = value.skills[name];
      return skill(name) && isPlainObject(e) && finite(Number(e.interval_days)) && Number(e.interval_days) >= 0 && Number(e.interval_days) <= 30 &&
        (e.interval_hours == null || (finite(Number(e.interval_hours)) && Number(e.interval_hours) >= 0 && Number(e.interval_hours) <= 720));
    });
  }

  function validatePlacement(value) {
    if (value == null) return true;
    return isPlainObject(value) && level(value.recommended_level) && level(value.assessed_level) &&
      finite(Number(value.score)) && Number(value.score) >= 0 && Number(value.score) <= 100 &&
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
