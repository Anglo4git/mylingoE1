import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/review-scheduler.js', 'utf8');
  const storage = {};
  const context = { window: {}, localStorage: {
    getItem: key => Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null,
    setItem: (key, value) => { storage[key] = String(value); }
  }, Date };
  context.window.localStorage = context.localStorage;
  vm.runInNewContext(source, context);
  return { r: context.window.MylingoReviewScheduler, storage };
}

const questions = [
  { skill: 'grammar', question_type: 'radio' },
  { skill: 'grammar', question_type: 'radio' },
  { skill: 'vocabulary', question_type: 'radio' },
  { skill: 'reading', question_type: 'banner' },
  { question_type: 'radio' }
];

describe('review scheduling MVP', () => {
  it('maps accuracy to deterministic base intervals', () => {
    const { r } = load();
    expect(r.accuracyBand(30)).toBe(0.25);
    expect(r.accuracyBand(40)).toBe(1);
    expect(r.accuracyBand(70)).toBe(3);
    expect(r.accuracyBand(85)).toBe(7);
    expect(r.accuracyBand(95)).toBe(14);
  });

  it('records only tagged graded evidence and creates due dates', () => {
    const { r } = load();
    const s = r.recordAttempt({ questions, correctMap: { 0: true, 1: false, 2: true, 3: true }, quiz_id: 'b1-001', level: 'b1', timestamp: 1000 });
    expect(s.skills.grammar.interval_days).toBe(1);
    expect(s.skills.grammar.interval_hours).toBe(24);
    expect(s.skills.grammar.last_accuracy).toBe(50);
    expect(s.skills.grammar.due_at).toBe(1000 + 24 * 3600000);
    expect(s.skills.vocabulary.interval_days).toBe(14);
    expect(s.skills.reading).toBeUndefined();
  });

  it('doubles a successful prior interval and caps at 30 days', () => {
    const { r } = load();
    const prior = { version: 1, updated_at: 1, skills: { grammar: { interval_days: 14, consecutive_successes: 2, last_accuracy: 90, last_review_at: 1, due_at: 2 } } };
    expect(r.calculateNextInterval(prior.skills.grammar, 95)).toBe(28);
    prior.skills.grammar.interval_days = 28;
    expect(r.calculateNextInterval(prior.skills.grammar, 95)).toBe(30);
  });

  it('supports a six-hour review for very weak performance', () => {
    const { r } = load();
    const s = r.recordAttempt({ questions: [{ skill: 'grammar' }], correctMap: { 0: false }, timestamp: 1000 }, { version: 1, skills: {} });
    expect(s.skills.grammar.interval_hours).toBe(6);
    expect(s.skills.grammar.due_at).toBe(1000 + 6 * 3600000);
  });

  it('resets weak performance to a one-day review', () => {
    const { r } = load();
    const prior = { interval_days: 28, consecutive_successes: 5 };
    expect(r.calculateNextInterval(prior, 55)).toBe(1);
    const s = r.recordAttempt({ questions: [{ skill: 'grammar' }], correctMap: { 0: false }, timestamp: 1000 }, { version: 1, skills: { grammar: prior } });
    expect(s.skills.grammar.consecutive_successes).toBe(0);
    expect(s.skills.grammar.interval_days).toBe(1);
    expect(s.skills.grammar.interval_hours).toBe(24);
  });

  it('finds due skills ordered by due time', () => {
    const { r } = load();
    const store = { version: 1, updated_at: 1, skills: {
      vocabulary: { interval_days: 3, consecutive_successes: 1, last_accuracy: 80, due_at: 300, last_review_at: 0 },
      grammar: { interval_days: 1, consecutive_successes: 0, last_accuracy: 40, due_at: 100, last_review_at: 0 }
    } };
    expect(r.getDueSkills(store, 250).map(x => x.skill)).toEqual(['grammar']);
    expect(r.getNextReview(store).skill).toBe('grammar');
  });

  it('persists versioned scheduling data', () => {
    const { r, storage } = load();
    r.recordAndPersist({ questions: [{ skill: 'writing' }], correctMap: { 0: true }, quiz_id: 'c1-001', level: 'c1', timestamp: 9 });
    const raw = JSON.parse(storage[r.STORAGE_KEY]);
    expect(raw.version).toBe(1);
    expect(raw.skills.writing.due_at).toBe(9 + r.DAY_MS * 14);
    expect(r.validateStore(raw)).toBe(true);
  });

  it('safely rejects malformed or incompatible storage', () => {
    const { r, storage } = load();
    storage[r.STORAGE_KEY] = '{bad-json';
    expect(r.readStored()).toEqual({ version: 1, updated_at: null, skills: {} });
    expect(r.validateStore({ version: 2, skills: {} })).toBe(false);
  });
});
