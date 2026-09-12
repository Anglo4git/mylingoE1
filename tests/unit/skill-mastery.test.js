import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/skill-mastery.js', 'utf8');
  const storage = {};
  const context = {
    window: {},
    localStorage: {
      getItem: key => Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null,
      setItem: (key, value) => { storage[key] = String(value); },
      removeItem: key => { delete storage[key]; }
    },
    Date
  };
  context.window.localStorage = context.localStorage;
  vm.runInNewContext(source, context);
  return { r: context.window.MylingoSkillMastery, storage };
}

const questions = [
  { question_type: 'radio', skill: 'grammar' },
  { question_type: 'radio', skill: 'grammar' },
  { question_type: 'radio', skill: 'vocabulary' },
  { question_type: 'banner', skill: 'reading' },
  { question_type: 'radio' },
];

describe('skill mastery data model', () => {
  it('records only explicitly tagged graded evidence', () => {
    const { r } = load();
    const s = r.recordAttempt({
      questions,
      correctMap: { 0: true, 1: false, 2: true, 3: true },
      quiz_id: 'b1-001', level: 'b1', timestamp: 123
    });
    expect(s.skills.grammar).toMatchObject({ question_count: 2, correct_count: 1, attempt_count: 1, accuracy: 50, mastery_band: 'needs_support' });
    expect(s.skills.vocabulary).toMatchObject({ question_count: 1, correct_count: 1, accuracy: 100, mastery_band: 'mastered' });
    expect(s.skills.reading).toBeUndefined();
  });

  it('accumulates later attempts and level counts', () => {
    const { r } = load();
    let s = r.recordAttempt({ questions, correctMap: { 0: true, 1: true, 2: false }, quiz_id: 'b1-001', level: 'b1', timestamp: 100 });
    s = r.recordAttempt({ questions, correctMap: { 0: true, 1: true, 2: true }, quiz_id: 'b2-002', level: 'b2', timestamp: 200 }, s);
    expect(s.skills.grammar).toMatchObject({ question_count: 4, correct_count: 4, attempt_count: 2, accuracy: 100, mastery_band: 'mastered', confidence: 'low' });
    expect(s.skills.grammar.level_counts).toEqual({ b1: 2, b2: 2 });
    expect(s.skills.grammar.last_level).toBe('b2');
    expect(s.skills.grammar.last_quiz_id).toBe('b2-002');
  });

  it('derives confidence from cumulative evidence', () => {
    const { r } = load();
    expect(r.confidenceFor(4, 10)).toBe('low');
    expect(r.confidenceFor(5, 2)).toBe('medium');
    expect(r.confidenceFor(10, 5)).toBe('high');
  });

  it('handles malformed stored data safely', () => {
    const { r, storage } = load();
    storage[r.STORAGE_KEY] = '{not-json';
    expect(r.readStored()).toEqual({ version: 1, updated_at: null, skills: {} });
    expect(r.validateStore({ version: 99, skills: {} })).toBe(false);
  });

  it('persists versioned data with recordAndPersist', () => {
    const { r, storage } = load();
    const out = r.recordAndPersist({ questions: [{ skill: 'writing', question_type: 'radio' }], correctMap: { 0: true }, quiz_id: 'x', level: 'c1', timestamp: 9 });
    const raw = JSON.parse(storage[r.STORAGE_KEY]);
    expect(raw.version).toBe(1);
    expect(raw.updated_at).toBe(9);
    expect(out.skills.writing.accuracy).toBe(100);
  });
});
