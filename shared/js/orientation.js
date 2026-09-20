(function (global) {
  'use strict';

  var STORAGE_KEY = 'mylingo.orientation.v1';
  var LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  var PLACEMENT_LEVELS = ['a1', 'a2', 'b1'];
  var QUESTIONS = [
    { id:'confidence', text:'How comfortable do you feel using English in everyday situations?', answers:['I’m just starting','I can handle simple situations','I can usually manage','I’m very comfortable','I can handle almost anything'] },
    { id:'listening', text:'When people speak English to you, how much can you usually understand?', answers:['Only a few words','Simple, slow conversations','Most everyday conversations','Most conversations, even when they’re faster','Almost everything'] },
    { id:'speaking', text:'Which sounds closest to you when you speak English?', answers:['I mostly use single words or very short phrases','I can make simple sentences','I can explain familiar things','I can discuss ideas and give reasons','I can express complex ideas naturally'] },
    { id:'reading', text:'What can you comfortably read in English?', answers:['Very short/simple texts','Simple messages and everyday information','Articles and general-interest texts','Detailed articles and professional material','Complex or specialized texts'] },
    { id:'writing', text:'What can you write comfortably in English?', answers:['Very short phrases','Simple messages','Clear paragraphs about familiar topics','Detailed explanations or arguments','Sophisticated, nuanced writing'] },
    { id:'grammar', text:'How do you feel about English grammar?', answers:['I know very little','I know basic patterns','I can usually use common grammar correctly','I understand and use more advanced structures','I can use grammar flexibly and accurately'] },
    { id:'vocabulary', text:'Which best describes your English vocabulary?', answers:['Mostly basic everyday words','Enough for simple everyday situations','Enough to discuss many familiar topics','Broad enough for work/study and abstract topics','Very broad, including nuanced and specialized language'] },
    { id:'exposure', text:'Where do you use or encounter English most often?', answers:['Almost never','Apps, games, or short online content','Social media, conversations, and everyday content','Work, study, travel, or longer media','English is a major part of my daily life'] },
    { id:'goal', text:'What would you most like to do with your English?', answers:['Build the basics','Handle everyday situations confidently','Communicate comfortably at work/travel','Study or work in English','Speak and write at an advanced level'] },
    { id:'selfEstimate', text:'If you had to choose today, where do you think your English is?', answers:['Beginner','Elementary','Intermediate','Upper-intermediate','Advanced'] }
  ];

  // Core skill answers carry more weight than exposure and goal. Each answer is
  // intentionally scored 0–4 so the routing remains transparent and testable.
  var WEIGHTS = { confidence:1, listening:1.25, speaking:1.25, reading:1.25, writing:1.25, grammar:1.25, vocabulary:1.25, exposure:.5, goal:.5, selfEstimate:1 };
  var MAX_SCORE = QUESTIONS.reduce(function (sum, q) { return sum + 4 * WEIGHTS[q.id]; }, 0);

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  // A usable answer is a finite number or a non-blank numeric string. null / '' / whitespace (e.g. a hole in a
  // JSON-serialised sparse array) mean "unanswered" — Number(null) and Number('') are 0, which would look like a real answer.
  // Agent 203: only a real number or a non-blank numeric string is an answer — true / false / [] / [2]
  // used to go through Number() as 1 / 0 / 0 / 2.
  function answerValue(a) {
    var n = typeof a === 'number' ? a : (typeof a === 'string' && a.trim() !== '' ? Number(a) : NaN);
    return Number.isFinite(n) ? n : null;
  }
  function scoreAnswers(answers) {
    return QUESTIONS.reduce(function (sum, q, i) {
      var raw = answerValue(answers && answers[i]);
      if (raw === null) return sum;
      return sum + clamp(raw, 0, 4) * WEIGHTS[q.id];
    }, 0);
  }

  function levelFromScore(score) {
    // Agent 203: a missing / NaN / junk score gave LEVELS[NaN] = undefined; it is 0 (A1) now.
    var n = typeof score === 'number' ? score : (typeof score === 'string' && score.trim() !== '' ? Number(score) : NaN);
    var ratio = clamp((isNaN(n) ? 0 : n) / MAX_SCORE, 0, 1);
    var index = Math.min(LEVELS.length - 1, Math.floor(ratio * LEVELS.length));
    return LEVELS[index];
  }

  function recommendation(answers) {
    var score = scoreAnswers(answers);
    var level = PLACEMENT_LEVELS[Math.min(PLACEMENT_LEVELS.length - 1, Math.floor(clamp(score / MAX_SCORE, 0, 1) * PLACEMENT_LEVELS.length))];
    var ratio = MAX_SCORE ? score / MAX_SCORE : 0;
    var estimateScore = Math.round(ratio * 100);
    var confidence = ratio < 0.2 || ratio > 0.85 ? 'medium' : 'high';
    var signals = {};
    QUESTIONS.forEach(function (q, i) {
      if (['reading','writing','grammar','listening','speaking'].indexOf(q.id) >= 0) { var v = answerValue(answers && answers[i]); signals[q.id] = v === null ? null : clamp(v, 0, 4); }
    });
    return {
      score: Math.round(score * 100) / 100, maxScore: MAX_SCORE, level: level,
      estimated_level: level, estimate_score: estimateScore, estimate_confidence: confidence, signals: signals
    };
  }

  function placementUrl(level) {
    level = PLACEMENT_LEVELS.indexOf(level) >= 0 ? level : 'a1';
    return '../shared/quiz.html?quiz=placement-120&level=b1&mode=placement&redirect=../' + encodeURIComponent(level) + '/dashboard.html';
  }

  function readState() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      return value;
    } catch (e) { return null; }
  }

  function writeState(state) {
    // Agent 203: JSON.stringify(undefined / a function) is undefined, which setItem stored as the string "undefined".
    try {
      var json = JSON.stringify(state);
      if (typeof json !== 'string') return false;
      localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (e) { return false; }
  }

  global.MylingoOrientation = {
    STORAGE_KEY: STORAGE_KEY,
    LEVELS: LEVELS.slice(),
    QUESTIONS: QUESTIONS.map(function (q) { return { id:q.id, text:q.text, answers:q.answers.slice() }; }),
    MAX_SCORE: MAX_SCORE,
    scoreAnswers: scoreAnswers,
    levelFromScore: levelFromScore,
    recommendation: recommendation,
    placementUrl: placementUrl,
    readState: readState,
    writeState: writeState
  };
})(window);
