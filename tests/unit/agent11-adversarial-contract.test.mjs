import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import State from '../../site/shared/js/learner-state.js';

const quiz = fs.readFileSync(new URL('../../site/shared/quiz.html', import.meta.url), 'utf8');

test('Agent 11: quiz completion is idempotent against duplicate finish actions', () => {
  assert.match(quiz, /let data,[^;]*ended=false/);
  assert.match(quiz, /function end\(\)\{\s*if\(ended\)return;\s*ended=true;/);
  assert.equal((quiz.match(/function end\(\)/g) || []).length, 1);
});

test('Agent 11: malformed learner state is rejected instead of crashing consumers', () => {
  const malformed = [
    null,
    [],
    { q1: { id: 'other' } },
    { q1: { status: 'completed', best: -1 } },
    { q1: { status: 'completed', best: 101 } },
    { q1: { status: 'completed', attempts: -1 } },
    { q1: { status: 'completed', attempts: 100001 } },
  ];
  for (const value of malformed) assert.equal(State.validateProgress(value), false);
});

test('Agent 11: extreme state payloads remain bounded', () => {
  const tooMany = Object.fromEntries(Array.from({ length: State.MAX_KEYS + 1 }, (_, i) => [`q${i}`, {}]));
  assert.equal(State.validateProgress(tooMany), false);
  assert.deepEqual(State.parse('x'.repeat(250001), {}), {});
});
