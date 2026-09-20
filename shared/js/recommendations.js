// @ts-check
/**
 * Pure recommendation rules. Inputs are normalized before resolution.
 */
(function (global) {
  'use strict';

  var LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  var SKILLS = ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage'];
  var CATEGORY_BY_SKILL = {
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    reading: 'Reading',
    listening: 'Listening',
    writing: 'Writing',
    usage: 'Grammar'
  };
  var SCORE_BANDS = [
    { min: 0, key: 'needs_support', label: 'Needs support' },
    { min: 60, key: 'developing', label: 'Developing' },
    { min: 80, key: 'secure', label: 'Secure' },
    { min: 90, key: 'strong', label: 'Strong' }
  ];

  // Skill recommendations are deliberately separate from overall placement:
  // the learner can be placed at B1 while, for example, grammar practice is
  // targeted at A2 and vocabulary is stretched toward B2.
  var RULES = {
    min_reported_questions: 2,
    max_recommendations: 3,
    support_below: 60,
    stretch_at_or_above: 90,
    developing_from: 60,
    secure_from: 80
  };

  function normalizeLevel(level) {
    level = String(level || '').toLowerCase();
    return LEVELS.indexOf(level) >= 0 ? level : 'a1';
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function levelAt(level, offset) {
    // A non-numeric offset means "stay" and a fractional one is truncated: LEVELS[NaN] and
    // LEVELS[2.5] are undefined, which used to leak out of this exported helper.
    var step = Number(offset);
    step = Number.isNaN(step) ? 0 : Math.trunc(step);
    var idx = LEVELS.indexOf(normalizeLevel(level));
    return LEVELS[clamp(idx + step, 0, LEVELS.length - 1)];
  }
  // A score is a real number or a numeric string. Anything else (null, booleans, arrays,
  // objects, blank strings) is "no score": Number('') , Number(false) and Number([]) are all
  // 0, which would read as a 0% result and push the learner a level down.
  function numericScore(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && !value.trim()) return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  // Only real CEFR levels count. normalizeLevel() maps junk to 'a1', which is right for a
  // learner's base level but wrong for a catalog list (junk must not make A1 look available).
  function validLevel(level) {
    level = String(level == null ? '' : level).toLowerCase();
    return LEVELS.indexOf(level) >= 0 ? level : null;
  }
  function scoreBand(score) {
    var n = clamp(Number(score) || 0, 0, 100);
    var result = SCORE_BANDS[0];
    for (var i = 0; i < SCORE_BANDS.length; i++) {
      if (n >= SCORE_BANDS[i].min) result = SCORE_BANDS[i];
    }
    return result;
  }

  function recommendationForSkill(skill, score, baseLevel, availableLevels) {
    skill = String(skill || '').toLowerCase();
    var numeric = numericScore(score);
    if (SKILLS.indexOf(skill) < 0 || numeric === null) return null;
    var n = clamp(numeric, 0, 100);
    var level = normalizeLevel(baseLevel);
    var reason = 'practice';
    var label = 'Practice at your level';

    if (n < RULES.support_below) {
      level = levelAt(level, -1);
      reason = 'support';
      label = 'Build foundations';
    } else if (n >= RULES.stretch_at_or_above) {
      level = levelAt(level, 1);
      reason = 'stretch';
      label = 'Stretch your skills';
    } else if (n >= RULES.secure_from) {
      reason = 'reinforce';
      label = 'Reinforce your skills';
    } else if (n >= RULES.developing_from) {
      reason = 'practice';
      label = 'Targeted practice';
    }

    // Do not recommend a level that isn't represented by the supplied catalog.
    // `availableLevels` can be omitted when the caller only needs the target.
    if (availableLevels && Array.isArray(availableLevels) && availableLevels.length) {
      var normalized = availableLevels.map(validLevel).filter(Boolean);
      if (normalized.indexOf(level) < 0) {
        var candidates = [level, levelAt(level, -1), levelAt(level, 1)];
        for (var i = 0; i < candidates.length; i++) {
          if (normalized.indexOf(candidates[i]) >= 0) { level = candidates[i]; break; }
        }
        if (normalized.indexOf(level) < 0) return null;
      }
    }

    return {
      skill: skill,
      category: CATEGORY_BY_SKILL[skill],
      score: Math.round(n * 100) / 100,
      score_band: scoreBand(n).key,
      level: level,
      reason: reason,
      label: label
    };
  }

  function rank(a, b) {
    if (a.score !== b.score) return a.score - b.score;
    return SKILLS.indexOf(a.skill) - SKILLS.indexOf(b.skill);
  }

  function recommendSkillLevels(profile, options) {
    options = options || {};
    profile = profile || {};
    var skills = profile.skills && typeof profile.skills === 'object' ? profile.skills : {};
    var counts = profile.skill_counts && typeof profile.skill_counts === 'object' ? profile.skill_counts : {};
    var baseLevel = normalizeLevel(options.base_level || profile.recommended_level || profile.assessed_level);
    var availableLevels = options.available_levels;
    var items = [];

    SKILLS.forEach(function (skill) {
      var score = skills[skill];
      // Agent 202: a non-finite count (the string "Infinity") used to pass `|| 0` and surface as question_count: Infinity (null once serialised).
      var count = Number(counts[skill]);
      if (!Number.isFinite(count)) count = 0;
      if (score == null || count < RULES.min_reported_questions) return;
      var item = recommendationForSkill(skill, score, baseLevel, availableLevels);
      if (item) {
        item.question_count = count;
        items.push(item);
      }
    });

    items.sort(rank);
    var limit = RULES.max_recommendations;
    var requested = options.max_recommendations;
    if (requested != null && requested !== '' && Number.isFinite(Number(requested))) limit = Number(requested);
    return items.slice(0, Math.max(0, limit));
  }

  function groupManifestByLevel(manifestByLevel) {
    var result = {};
    Object.keys(manifestByLevel || {}).forEach(function (key) {
      var level = validLevel(key);
      if (!level) return; // a junk key must not be folded into (and overwrite) A1
      var list = manifestByLevel[key];
      result[level] = (result[level] || []).concat(Array.isArray(list) ? list : []);
    });
    return result;
  }

  function alreadyPicked(picked, quiz) {
    var id = quiz && quiz.id != null ? String(quiz.id) : '';
    return picked.some(function (other) {
      return other === quiz || (id !== '' && other && other.id != null && String(other.id) === id);
    });
  }

  function resolveQuizPicks(recommendations, manifestByLevel) {
    var manifests = groupManifestByLevel(manifestByLevel);
    var picked = [];
    return (Array.isArray(recommendations) ? recommendations : []).map(function (recommendation) {
      if (!recommendation || typeof recommendation !== 'object') return null;
      var list = manifests[String(recommendation.level || '').toLowerCase()] || [];
      var category = String(recommendation.category || '').toLowerCase();
      var item = list.find(function (quiz) {
        return String(quiz && quiz.category || '').toLowerCase() === category;
      });
      if (!item) return null;
      // grammar and usage both map to the Grammar category: never offer the same quiz twice
      // (recommendations arrive weakest-first, so the first skill keeps the quiz).
      if (alreadyPicked(picked, item)) return null;
      picked.push(item);
      return {
        skill: recommendation.skill,
        score: recommendation.score,
        score_band: recommendation.score_band,
        level: recommendation.level,
        reason: recommendation.reason,
        label: recommendation.label,
        quiz: item
      };
    }).filter(Boolean);
  }

  function validateProfile(profile) {
    var recommendations = recommendSkillLevels(profile, { max_recommendations: RULES.max_recommendations });
    return recommendations.every(function (item) {
      return SKILLS.indexOf(item.skill) >= 0 &&
        LEVELS.indexOf(item.level) >= 0 &&
        Number.isFinite(item.score) && item.question_count >= RULES.min_reported_questions;
    });
  }

  global.MylingoRecommendations = {
    LEVELS: LEVELS.slice(),
    SKILLS: SKILLS.slice(),
    CATEGORY_BY_SKILL: Object.assign({}, CATEGORY_BY_SKILL),
    RULES: Object.assign({}, RULES),
    normalizeLevel: normalizeLevel,
    levelAt: levelAt,
    scoreBand: scoreBand,
    recommendationForSkill: recommendationForSkill,
    recommendSkillLevels: recommendSkillLevels,
    resolveQuizPicks: resolveQuizPicks,
    validateProfile: validateProfile
  };
})(window);
