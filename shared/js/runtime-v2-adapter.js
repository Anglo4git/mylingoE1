/* Mylingo Runtime v2 Adapter
 *
 * A compatibility boundary between authored/legacy quiz payloads and the
 * production quiz runtime. The adapter is intentionally dependency-free and
 * does not mutate its input. Existing v1 payloads remain valid; v2/legacy
 * aliases are normalized into the fields consumed by quiz.html.
 */
(function (global) {
  'use strict';

  var LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  var QUESTION_TYPE_ALIASES = {
    comparison: 'matching',
    reorganizer: 'ranking',
    reorganizer_task: 'ranking',
    complete_question: 'fill_in_the_blank'
  };

  function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function firstDefined(obj, keys, fallback) {
    for (var i = 0; i < keys.length; i += 1) {
      if (obj && obj[keys[i]] !== undefined && obj[keys[i]] !== null) return obj[keys[i]];
    }
    return fallback;
  }

  // Agent 204: authored / fetched JSON is untrusted. String(x) turned an object
  // into the learner-visible text "[object Object]", an array into "a,b", `true`
  // into "true", and THREW ("Cannot convert object to primitive value") for an
  // object carrying its own non-function `toString`. Only strings and finite
  // numbers are text now; everything else is ''.
  function stringValue(value) {
    if (typeof value === 'string') return value.trim();
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  }

  // Agent 204: only a real number or a non-blank numeric string is a number.
  // Number(true) / Number(false) / Number([]) / Number([5]) / Number(' ') are
  // 1 / 0 / 0 / 5 / 0, so `version: true`, `correct_index: false` (0) or
  // `questions: [3]` used to be read as valid numbers.
  function numberValue(value, fallback) {
    var n;
    if (typeof value === 'number') n = value;
    else if (typeof value === 'string' && value.trim() !== '') n = Number(value);
    else return fallback;
    return Number.isFinite(n) ? n : fallback;
  }

  function validLevel(value) {
    var level = stringValue(value).toLowerCase();
    return LEVELS.indexOf(level) >= 0 ? level : '';
  }

  // The fallback (options.level, which the page takes from the URL) used to be
  // returned RAW, so a junk value became the quiz's level unchecked.
  function normalizedLevel(value, fallback) {
    return validLevel(value) || validLevel(fallback);
  }

  // Own-property lookup only: a bare QUESTION_TYPE_ALIASES[type] also resolves
  // inherited names, so question_type "__proto__" / "constructor" came back as
  // Object.prototype / the Object function instead of a string.
  // A type is a string; a junk / blank one is the caller's default (a question is
  // `radio`, an activity is `quiz`).
  function normalizedType(value, fallback) {
    var type = typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
    if (Object.prototype.hasOwnProperty.call(QUESTION_TYPE_ALIASES, type)) return QUESTION_TYPE_ALIASES[type];
    return type || fallback;
  }

  // First non-blank id among the keys (id 0 is a real id; an object / blank is not).
  function idOf(obj, keys, fallback) {
    for (var i = 0; i < keys.length; i += 1) {
      var id = stringValue(obj[keys[i]]);
      if (id) return id;
    }
    return stringValue(fallback);
  }

  // `tags` are a comma-separated string; an authored array of strings is joined
  // the same way, anything else is not a tag list.
  function tagsValue(value) {
    if (Array.isArray(value)) {
      return value.map(stringValue).filter(Boolean).join(',');
    }
    return stringValue(value);
  }

  function normalizeAnswer(value) {
    if (isObject(value)) {
      return stringValue(firstDefined(value, ['text', 'label', 'value'], ''));
    }
    // A True / False question may legitimately be authored with real booleans.
    return typeof value === 'boolean' ? String(value) : stringValue(value);
  }

  function answerList(question) {
    var source = Array.isArray(question.answers)
      ? question.answers
      : Array.isArray(question.options)
        ? question.options
        : null;

    if (!source) {
      source = [];
      for (var i = 1; i <= 9; i += 1) {
        if (question['answer_' + i] !== undefined && question['answer_' + i] !== null) {
          source.push(question['answer_' + i]);
        }
      }
    }
    return source.map(normalizeAnswer);
  }

  function normalizeCorrectIndex(question, answers) {
    // Legacy authoring exports used option_0..option_3 with a zero-based
    // correct_index. Apply the offset only when that explicit legacy shape is
    // present; ordinary `correct_index` remains canonical 1-based.
    if (Array.isArray(question.options) && question.correct_index != null &&
        question.answer_1 === undefined && question.option_0 !== undefined) {
      var legacy = numberValue(question.correct_index, null);
      if (Number.isInteger(legacy)) return legacy + 1;
    }

    // Agent 204: the first alias holding a real integer wins; a junk value under
    // an earlier alias (`correctIndex: "x"`) no longer hides a valid later one.
    var aliases = ['correctIndex', 'correct_index', 'correctAnswerIndex', 'correct_answer_index'];
    for (var a = 0; a < aliases.length; a += 1) {
      var n = numberValue(question[aliases[a]], null);
      if (Number.isInteger(n)) return n;
    }

    if (Array.isArray(question.answers)) {
      for (var i = 0; i < question.answers.length; i += 1) {
        var item = question.answers[i];
        if (isObject(item) && (item.is_correct === true || item.isCorrect === true)) return i + 1;
      }
    }

    return null;
  }

  function normalizeAcceptedAnswers(question, correctIndex) {
    var value = firstDefined(question,
      ['acceptedAnswers', 'accepted_answers', 'correctAnswer', 'correct_answer', 'answer'],
      null);
    // Agent 162: "does this question already have a correct option?" must be asked
    // of the NORMALIZED index. It used to read the raw camelCase `correctIndex`
    // only, so a radio question authored with `correct_index` or `is_correct`
    // flags looked index-less and had its whole option list (raw objects, for the
    // flag form) copied out as `acceptedAnswers`.
    if (value == null && Array.isArray(question.answers) && !Number.isInteger(correctIndex)) {
      value = question.answers;
    }
    if (value == null) return undefined;
    // Agent 204: the consumer compares String(accepted), so a raw object item
    // (an option-object answers[] fallback, or a junk accepted entry) would
    // accept the text "[object Object]" and a null item the text "null". Strings,
    // numbers and booleans are kept as authored; an object contributes its
    // text / label / value; anything else is dropped.
    return (Array.isArray(value) ? value : [value]).map(function (item) {
      if (typeof item === 'string' || typeof item === 'boolean') return item;
      if (typeof item === 'number') return Number.isFinite(item) ? item : undefined;
      // An object contributes its text; null / arrays / functions come back '' and drop out.
      return normalizeAnswer(item) || undefined;
    }).filter(function (item) { return item !== undefined; });
  }

  function normalizeMedia(question) {
    var media = isObject(question.media) ? question.media : null;
    if (!media && (question.imageUrl != null || question.audioUrl != null)) {
      media = {};
      media.image = { src: question.imageUrl, alt: question.imageAlt };
      media.audio = { src: question.audioUrl, label: question.audioLabel };
    }
    if (!media) return undefined;

    // A media source is a string: a number / object / array is not a URL, and a
    // blank string is not a source. The first non-blank string of src / url wins.
    function sourceOf(value, keys) {
      for (var i = 0; i < keys.length; i += 1) {
        if (typeof value[keys[i]] === 'string' && value[keys[i]].trim()) return value[keys[i]].trim();
      }
      return '';
    }

    function one(key) {
      var value = media[key];
      if (typeof value === 'string') return { src: value.trim() };
      if (isObject(value)) {
        return {
          src: sourceOf(value, ['src', 'url']),
          alt: stringValue(firstDefined(value, ['alt', 'label'], '')),
          label: stringValue(value.label || '')
        };
      }
      return undefined;
    }

    var out = {};
    var image = one('image');
    var audio = one('audio');
    if (image && image.src) out.image = image;
    if (audio && audio.src) out.audio = audio;
    return Object.keys(out).length ? out : undefined;
  }

  function copyOptional(target, source, key) {
    if (source[key] !== undefined) target[key] = source[key];
  }

  function normalizeQuestion(input) {
    if (!isObject(input)) throw new Error('Question must be an object.');

    var answers = answerList(input);
    var out = {
      question: stringValue(firstDefined(input, ['question', 'question_text', 'prompt', 'content'], '')),
      category: stringValue(firstDefined(input, ['category', 'question_category'], '')),
      tags: tagsValue(firstDefined(input, ['tags', 'question_tags'], '')),
      explanation: stringValue(firstDefined(input, ['explanation', 'question_explanation'], '')),
      correctIndex: normalizeCorrectIndex(input, answers),
      answers: answers
    };

    var canonical = global.MylingoCanonicalMetadata;
    if (canonical) {
      var metadata = canonical.normalize(input, out.category);
      Object.keys(metadata).forEach(function (key) { out[key] = metadata[key]; });
    }

    var type = normalizedType(firstDefined(input, ['question_type', 'questionType', 'type'], 'radio'), 'radio');
    if (type !== 'radio') out.question_type = type;

    var media = normalizeMedia(input);
    if (media) out.media = media;

    var accepted = normalizeAcceptedAnswers(input, out.correctIndex);
    if (accepted !== undefined) out.acceptedAnswers = accepted;

    // Agent 162: skill/subskill/difficulty/cefr/estimated_time_seconds are the
    // canonical metadata keys. When MylingoCanonicalMetadata is loaded it has
    // already produced the normalized value above (trimmed skill, category
    // fallback, numeric difficulty, upper-cased CEFR), so copying the RAW input
    // over it here silently undid that normalization: `skill:" Grammar "` or an
    // unknown `skill:"foo"` (which should fall back to the category) reached
    // skill-mastery.js unnormalized and the question was dropped from mastery.
    // The raw copy is now only the fallback for when the module isn't loaded.
    var passthrough = ['subprompt', 'correctIndices', 'pairs', 'matches', 'items', 'correctOrder'];
    if (!canonical) passthrough = passthrough.concat(['skill', 'subskill', 'difficulty', 'cefr', 'estimated_time_seconds']);
    passthrough.forEach(function (key) {
      copyOptional(out, input, key);
    });

    if (out.correctIndex == null && input.correctIndices !== undefined) delete out.correctIndex;
    return out;
  }

  function normalizeQuiz(input, options) {
    if (!isObject(input)) throw new Error('Quiz payload must be an object.');
    options = options || {};

    var questionSource = Array.isArray(input.questions)
      ? input.questions
      : Array.isArray(input.items)
        ? input.items
        : Array.isArray(input.data)
          ? input.data
          : [];

    var out = {
      id: stringValue(firstDefined(input, ['id', 'quiz_id', 'quizId'], '')),
      title: stringValue(firstDefined(input, ['title', 'name'], '')),
      description: stringValue(firstDefined(input, ['description', 'summary'], '')),
      brand: stringValue(firstDefined(input, ['brand'], 'Mylingo')) || 'Mylingo',
      category: stringValue(firstDefined(input, ['category', 'quiz_category'], '')),
      tags: tagsValue(firstDefined(input, ['tags', 'quiz_tags'], '')),
      level: normalizedLevel(input.level, '') || normalizedLevel(input.cefr_level, options.level),
      version: numberValue(firstDefined(input, ['version'], 1), 1),
      questions: questionSource.map(normalizeQuestion)
    };

    // Runtime metadata is intentionally additive: it may be supplied by a v2
    // producer without becoming part of the learner-visible v1 contract.
    ['date_added', 'date_updated', 'dateAdded', 'dateUpdated'].forEach(function (key) {
      copyOptional(out, input, key);
    });
    return out;
  }

  function normalizeHierarchy(input) {
    if (!isObject(input)) throw new Error('Content hierarchy must be an object.');

    var course = isObject(input.course) ? input.course : input;
    var units = Array.isArray(input.units) ? input.units : (Array.isArray(course.units) ? course.units : []);
    var courseId = idOf(course, ['id', 'course_id'], '');
    var normalizedUnits = units.map(function (unit, unitIndex) {
      unit = isObject(unit) ? unit : {};
      var unitId = idOf(unit, ['id', 'unit_id'], 'unit-' + (unitIndex + 1));
      var lessons = Array.isArray(unit.lessons) ? unit.lessons : [];

      return {
        id: unitId,
        title: stringValue(firstDefined(unit, ['title', 'name'], '')),
        course_id: idOf(unit, ['course_id', 'courseId'], courseId),
        lessons: lessons.map(function (lesson, lessonIndex) {
          lesson = isObject(lesson) ? lesson : {};
          var lessonId = idOf(lesson, ['id', 'lesson_id'], unitId + '-lesson-' + (lessonIndex + 1));
          var activities = Array.isArray(lesson.activities) ? lesson.activities : [];

          return {
            id: lessonId,
            title: stringValue(firstDefined(lesson, ['title', 'name'], '')),
            unit_id: unitId,
            activities: activities.map(function (activity, activityIndex) {
              activity = isObject(activity) ? activity : {};
              var activityId = idOf(activity, ['id', 'activity_id'], lessonId + '-activity-' + (activityIndex + 1));
              var rawQuestions = Array.isArray(activity.questions) ? activity.questions : [];
              var questions = rawQuestions.map(function (question) {
                var normalized = normalizeQuestion(question);
                // Hierarchy is a source-side contract, so keep an explicitly
                // authored type (including `radio`) visible here. The legacy
                // quiz runtime still omits `radio` when flattened below.
                normalized.question_type = normalizedType(firstDefined(question, ['question_type', 'questionType', 'type'], 'radio'), 'radio');
                return normalized;
              });
              return {
                id: activityId,
                title: stringValue(firstDefined(activity, ['title', 'name'], '')),
                lesson_id: lessonId,
                activity_type: normalizedType(firstDefined(activity, ['activity_type', 'activityType', 'type'], 'quiz'), 'quiz'),
                questions: questions
              };
            })
          };
        })
      };
    });

    return {
      course: {
        id: courseId,
        title: stringValue(firstDefined(course, ['title', 'name'], '')),
        units: normalizedUnits
      }
    };
  }

  function flattenActivityToQuiz(input) {
    if (!isObject(input) || !isObject(input.course)) throw new Error('Activity bridge requires a course object.');
    var hierarchy = normalizeHierarchy(input);
    var course = hierarchy.course;
    var matches = [];
    course.units.forEach(function (unit) {
      unit.lessons.forEach(function (lesson) {
        lesson.activities.forEach(function (activity) {
          matches.push({ unit: unit, lesson: lesson, activity: activity });
        });
      });
    });
    if (matches.length !== 1) throw new Error('Activity bridge requires exactly one activity.');

    var match = matches[0];
    var activity = match.activity;
    return normalizeQuiz({
      id: activity.id,
      title: activity.title || match.lesson.title || course.title,
      category: firstDefined(input, ['category'], ''),
      level: firstDefined(input, ['level'], ''),
      version: firstDefined(input, ['version'], 1),
      questions: activity.questions
    });
  }

  function normalizeManifest(input) {
    if (!Array.isArray(input)) return [];
    return input.filter(isObject).map(function (entry) {
      var out = {
        file: stringValue(firstDefined(entry, ['file', 'path'], '')),
        id: stringValue(firstDefined(entry, ['id', 'quiz_id', 'quizId'], '')),
        title: stringValue(firstDefined(entry, ['title', 'name'], '')),
        topic: stringValue(firstDefined(entry, ['topic'], '')),
        description: stringValue(firstDefined(entry, ['description', 'summary'], '')),
        category: stringValue(firstDefined(entry, ['category', 'quiz_category'], '')),
        tags: tagsValue(firstDefined(entry, ['tags', 'quiz_tags'], '')),
        level: normalizedLevel(entry.level),
        questions: Math.max(0, Math.trunc(numberValue(entry.questions, 0))),
        version: numberValue(entry.version, 1)
      };
      if (entry.date !== undefined) out.date = entry.date;
      if (entry.date_added !== undefined) out.date_added = entry.date_added;
      if (entry.date_updated !== undefined) out.date_updated = entry.date_updated;
      return out;
    });
  }

  global.MylingoRuntimeV2 = Object.freeze({
    VERSION: '2.0',
    LEVELS: LEVELS.slice(),
    normalizeQuiz: normalizeQuiz,
    normalizeQuestion: normalizeQuestion,
    normalizeHierarchy: normalizeHierarchy,
    flattenActivityToQuiz: flattenActivityToQuiz,
    normalizeManifest: normalizeManifest
  });
}(window));
