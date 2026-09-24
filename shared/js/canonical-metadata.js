/* Mylingo Agent 64 — canonical skill/objective metadata normalization. */
(function (global) {
  'use strict';

  var SKILLS = ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage'];
  var CATEGORY_TO_SKILL = {
    grammar: 'grammar', vocabulary: 'vocabulary', reading: 'reading',
    listening: 'listening', writing: 'writing', usage: 'usage',
    'academic english': 'usage'
  };

  // Agent 204: authored / fetched JSON is untrusted. String(x) turned an object
  // into "[object Object]", an array into "a,b", `true` into "true" and THREW for
  // an object carrying its own non-function `toString`. Text fields are strings
  // only now (a bare number is not a skill / category / objective either).
  function textOf(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  // Number(true) / Number('') / Number(' ') / Number([3]) are 1 / 0 / 0 / 3: only a
  // real finite number or a non-blank numeric string is a number.
  function numberOf(value) {
    var n;
    if (typeof value === 'number') n = value;
    else if (typeof value === 'string' && value.trim() !== '') n = Number(value);
    else return null;
    return Number.isFinite(n) ? n : null;
  }

  function normalizeSkill(value) {
    var key = textOf(value).toLowerCase();
    return SKILLS.indexOf(key) >= 0 ? key : null;
  }

  function skillForCategory(value) {
    var key = textOf(value).toLowerCase();
    // Agent 162: own-property check only. A bare `CATEGORY_TO_SKILL[key]` also
    // resolves inherited Object.prototype names, so a category of "constructor"
    // (or "toString", "__proto__") returned a function/object instead of null and
    // normalize() then stored that as `skill`.
    return Object.prototype.hasOwnProperty.call(CATEGORY_TO_SKILL, key) ? CATEGORY_TO_SKILL[key] : null;
  }

  function normalizeObjective(input) {
    if (!input || typeof input !== 'object') return null;
    var value = textOf(input.objective) ? input.objective : input.learning_objective;
    value = textOf(value).replace(/\s+/g, ' ');
    return value || null;
  }

  function normalize(input, fallbackCategory) {
    input = input && typeof input === 'object' ? input : {};
    var skill = normalizeSkill(input.skill) || skillForCategory(textOf(input.category) ? input.category : fallbackCategory);
    var objective = normalizeObjective(input);
    var subskill = textOf(input.subskill);
    var difficulty = numberOf(input.difficulty);
    var cefr = textOf(input.cefr);
    var seconds = numberOf(input.estimated_time_seconds);
    var out = {};
    if (skill) out.skill = skill;
    if (subskill) out.subskill = subskill;
    if (objective) out.objective = objective;
    if (difficulty !== null) out.difficulty = difficulty;
    if (cefr) out.cefr = cefr.toUpperCase();
    if (seconds !== null) out.estimated_time_seconds = seconds;
    return out;
  }

  global.MylingoCanonicalMetadata = {
    VERSION: 1,
    SKILLS: SKILLS.slice(),
    CATEGORY_TO_SKILL: Object.assign({}, CATEGORY_TO_SKILL),
    normalizeSkill: normalizeSkill,
    skillForCategory: skillForCategory,
    normalizeObjective: normalizeObjective,
    normalize: normalize
  };
})(window);
