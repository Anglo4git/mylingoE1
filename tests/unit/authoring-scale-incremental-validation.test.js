import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/authoring-validation.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.MylingoAuthoringValidation;
}

function makeRow(internalId, quizId, questionNumber, overrides) {
  return Object.assign(
    {
      __internalId: internalId,
      quiz_id: quizId,
      level: 'A1',
      title: 'Present Simple',
      description: 'Basics',
      quiz_category: 'Grammar',
      quiz_tags: 'Grammar,A1',
      version: 1,
      status: 'draft',
      question_number: questionNumber,
      question_text: `Question ${quizId}-${questionNumber}`,
      question_category: 'Grammar',
      question_tags: 'Grammar,A1',
      explanation: 'This is a sufficiently long explanation.',
      correct_index: 1,
      answer_1: 'a',
      answer_2: 'b',
      answer_3: '',
      answer_4: '',
      answer_5: '',
      answer_6: '',
      answer_7: '',
      answer_8: '',
      answer_9: ''
    },
    overrides || {}
  );
}

function buildQuiz(quizId, count, rowOverrides) {
  const rows = [];
  for (let i = 1; i <= count; i++) {
    rows.push(makeRow(`${quizId}-${i}`, quizId, i, rowOverrides));
  }
  return rows;
}

function summarySnapshot(engine) {
  const rowMap = {};
  engine.getRowIssuesMap().forEach((issues, id) => {
    rowMap[id] = issues.slice().sort();
  });
  const quizMap = {};
  engine.getQuizIssuesMap().forEach((entry, quizId) => {
    quizMap[quizId] = { issues: entry.issues.slice().sort(), count: entry.count };
  });
  return { rowMap, quizMap, summary: engine.getSummary() };
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value)
      .sort()
      .forEach(key => {
        out[key] = normalize(value[key]);
      });
    return out;
  }
  return value;
}

function sameSnapshot(a, b) {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

describe('Milestone 23 — Authoring Scale + Incremental Validation', () => {
  it('flags a row with too few answers, a bad correct_index, and a short explanation', () => {
    const { getRowIssues } = load();
    const row = makeRow('r1', 'quiz-a', 1, {
      answer_2: '',
      correct_index: 9,
      explanation: 'short'
    });
    const issues = getRowIssues(row);
    expect(issues).toContain('At least 2 answer options are required');
    expect(issues.some(i => i.startsWith('correct_index must be'))).toBe(true);
    expect(issues).toContain('Explanation should be at least 10 characters');
  });

  it('flags a quiz group below MIN_QUESTIONS_PER_QUIZ and with inconsistent level', () => {
    const { computeQuizGroupIssues } = load();
    const rows = buildQuiz('quiz-b', 3);
    rows[1].level = 'B1';
    const entry = computeQuizGroupIssues(rows, {});
    expect(entry.issues.some(i => i.includes('needs at least 5'))).toBe(true);
    expect(entry.issues).toContain("Inconsistent level across this quiz's rows");
  });

  it('flags duplicate canonical question_number values within a quiz', () => {
    const { computeQuizGroupIssues } = load();
    const rows = buildQuiz('quiz-canonical-nums', 6);
    rows[5].question_number = 1;

    const entry = computeQuizGroupIssues(rows, {});

    expect(entry.issues).toContain('Duplicate question_number "1" (2x)');
  });

  it('flags inconsistent canonical quiz_category values while allowing per-question question_category', () => {
    const { computeQuizGroupIssues } = load();
    const rows = buildQuiz('quiz-canonical-category', 6);
    rows[2].question_category = 'Vocabulary';
    rows[4].quiz_category = 'Vocabulary';

    const entry = computeQuizGroupIssues(rows, {});

    expect(entry.issues).toContain("Inconsistent quiz_category across this quiz's rows");
    expect(entry.issues).not.toContain("Inconsistent category across this quiz's rows");
    expect(entry.issues.some(issue => issue.includes('question_category'))).toBe(false);
    expect(entry.category).toBe('Grammar');
  });

  it('accepts valid canonical question numbers and category fields without legacy aliases', () => {
    const { computeQuizGroupIssues } = load();
    const rows = buildQuiz('quiz-canonical-valid', 6);
    rows[0].question_category = 'Grammar';
    rows[1].question_category = 'Vocabulary';

    const entry = computeQuizGroupIssues(rows, {});

    expect(entry.issues).toEqual([]);
    expect(entry.category).toBe('Grammar');
  });

  it('respects a custom MAX_QUESTIONS_PER_QUIZ passed via config', () => {
    const { computeQuizGroupIssues } = load();
    const rows = buildQuiz('quiz-c', 6);
    const entry = computeQuizGroupIssues(rows, { MAX_QUESTIONS_PER_QUIZ: 5 });
    expect(entry.issues.some(i => i.includes('maximum is 5'))).toBe(true);
  });

  it('fullRecompute and building one row at a time via onRowAdded produce identical results', () => {
    const { createEngine } = load();
    const rows = [
      ...buildQuiz('quiz-1', 6),
      ...buildQuiz('quiz-2', 4), // below the 5-question minimum
      makeRow('orphan-1', '', 1) // no quiz_id
    ];

    const viaAdd = createEngine();
    rows.forEach(row => viaAdd.onRowAdded(Object.assign({}, row)));

    const viaFull = createEngine();
    viaFull.fullRecompute(rows.map(row => Object.assign({}, row)));

    expect(sameSnapshot(summarySnapshot(viaAdd), summarySnapshot(viaFull))).toBe(true);
  });

  it('a single field edit only touches its own row and quiz group — matches a full rescan', () => {
    const { createEngine } = load();
    const liveRows = [...buildQuiz('quiz-x', 6), ...buildQuiz('quiz-y', 6)];
    const engine = createEngine();
    liveRows.forEach(row => engine.onRowAdded(row));

    const target = liveRows.find(row => row.quiz_id === 'quiz-x' && row.question_number === 2);
    target.explanation = 'A brand new, sufficiently long explanation.';
    const touched = engine.onFieldChanged(target.__internalId);

    expect(touched).toEqual(['quiz-x']);

    const truth = createEngine();
    truth.fullRecompute(liveRows);
    expect(sameSnapshot(summarySnapshot(engine), summarySnapshot(truth))).toBe(true);
  });

  it('editing quiz_id moves the row between quiz groups and revalidates both', () => {
    const { createEngine } = load();
    const liveRows = [...buildQuiz('quiz-x', 6), ...buildQuiz('quiz-y', 6)];
    const engine = createEngine();
    liveRows.forEach(row => engine.onRowAdded(row));

    const mover = liveRows.find(row => row.quiz_id === 'quiz-x' && row.question_number === 1);
    mover.quiz_id = 'quiz-y';
    const touched = engine.onFieldChanged(mover.__internalId);

    expect(touched.sort()).toEqual(['quiz-x', 'quiz-y']);
    // quiz-x is now down to 5 rows (still >= minimum), quiz-y is up to 7.
    expect(engine.getQuizIssuesMap().get('quiz-x').count).toBe(5);
    expect(engine.getQuizIssuesMap().get('quiz-y').count).toBe(7);

    const truth = createEngine();
    truth.fullRecompute(liveRows);
    expect(sameSnapshot(summarySnapshot(engine), summarySnapshot(truth))).toBe(true);
  });

  it('mixed add/edit/move/delete sequence matches a from-scratch fullRecompute', () => {
    const { createEngine } = load();
    let liveRows = [];
    for (let q = 0; q < 15; q++) {
      liveRows.push(...buildQuiz(`quiz-${q}`, 6));
    }
    liveRows[0].correct_index = 99; // bad row, will be fixed below

    const engine2 = createEngine();
    const rows2 = liveRows.map(row => Object.assign({}, row));
    rows2.forEach(row => engine2.onRowAdded(row));

    // Fix the bad correct_index.
    rows2[0].correct_index = 1;
    engine2.onFieldChanged(rows2[0].__internalId);

    // Move a row from quiz-0 to quiz-1.
    const mover = rows2.find(row => row.quiz_id === 'quiz-0' && row.question_number === 2);
    mover.quiz_id = 'quiz-1';
    engine2.onFieldChanged(mover.__internalId);

    // Delete a row from quiz-2.
    const deleteTarget = rows2.find(row => row.quiz_id === 'quiz-2' && row.question_number === 1);
    engine2.onRowRemoved(deleteTarget.__internalId);
    const remaining = rows2.filter(row => row.__internalId !== deleteTarget.__internalId);

    // Add a brand new row in a brand new quiz.
    const added = makeRow('new-1', 'quiz-new', 1);
    remaining.push(added);
    engine2.onRowAdded(added);

    const truth = createEngine();
    truth.fullRecompute(remaining);

    expect(sameSnapshot(summarySnapshot(engine2), summarySnapshot(truth))).toBe(true);
    expect(engine2.getSummary().totalRows).toBe(remaining.length);
  });

  it('summary counters stay correct across transitions (row goes from failing to passing and back)', () => {
    const { createEngine } = load();
    const rows = buildQuiz('quiz-z', 6);
    const engine = createEngine();
    rows.forEach(row => engine.onRowAdded(row));
    expect(engine.getSummary().rowsWithIssues).toBe(0);

    rows[0].explanation = '';
    engine.onFieldChanged(rows[0].__internalId);
    expect(engine.getSummary().rowsWithIssues).toBe(1);

    rows[0].explanation = 'A sufficiently long explanation again.';
    engine.onFieldChanged(rows[0].__internalId);
    expect(engine.getSummary().rowsWithIssues).toBe(0);
  });

  it('an incremental single-row edit is far cheaper than a full rescan at scale', () => {
    const { createEngine } = load();
    let rows = [];
    for (let q = 0; q < 400; q++) {
      rows.push(...buildQuiz(`quiz-${q}`, 10));
    }
    const engine = createEngine();
    engine.fullRecompute(rows);

    const fullStart = process.hrtime.bigint();
    engine.fullRecompute(rows);
    const fullMs = Number(process.hrtime.bigint() - fullStart) / 1e6;

    const target = rows[Math.floor(rows.length / 2)];
    const incStart = process.hrtime.bigint();
    target.explanation = target.explanation + '!';
    engine.onFieldChanged(target.__internalId);
    const incMs = Number(process.hrtime.bigint() - incStart) / 1e6;

    // Not a strict timing assertion (would be flaky) — just confirms the
    // incremental path is not doing O(total rows) work: it should be at
    // least an order of magnitude cheaper than a full 4,000-row rescan.
    expect(incMs).toBeLessThan(fullMs / 5);
  });

  it('isRowValid reflects the current row issue state', () => {
    const { createEngine } = load();
    const rows = buildQuiz('quiz-v', 6);
    const engine = createEngine();
    rows.forEach(row => engine.onRowAdded(row));
    expect(engine.isRowValid(rows[0].__internalId)).toBe(true);

    rows[0].explanation = '';
    engine.onFieldChanged(rows[0].__internalId);
    expect(engine.isRowValid(rows[0].__internalId)).toBe(false);
  });
});
