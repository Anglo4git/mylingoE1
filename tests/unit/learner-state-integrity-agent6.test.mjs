import test from 'node:test';
import assert from 'node:assert/strict';
import State from '../../site/shared/js/learner-state.js';
import Gamification from '../../site/shared/js/gamification.js';

test('Agent 6: malformed JSON recovers safely', () => assert.deepEqual(State.parse('{not-json', {}), {}));
test('Agent 6: negative/oversized progress is rejected', () => {
  assert.equal(State.validateProgress({ q1: { id:'q1', best:-1 } }), false);
  assert.equal(State.validateProgress({ q1: { id:'q1', best:101 } }), false);
  assert.equal(State.validateProgress({ q1: { id:'q1', attempts:100001 } }), false);
});
test('Agent 6: tampered gamification/mastery is rejected', () => {
  assert.equal(State.validateGamification({ xpTotal:-5 }), false);
  assert.equal(State.validateGamification({ xpTotal:1000000001 }), false);
  assert.equal(State.validateSkillMastery({version:1,skills:{grammar:{question_count:2,correct_count:3,attempt_count:2}}}), false);
});
test('Agent 6: malformed placement is rejected', () => {
  assert.equal(State.validatePlacement({recommended_level:'javascript:bad',assessed_level:'a2',score:80}), false);
  assert.equal(State.validatePlacement({recommended_level:'a2',assessed_level:'a2',score:101}), false);
});
test('Agent 6: existing backup validator marks malformed progress invalid', () => {
  const pkg={schema:Gamification.BACKUP_SCHEMA,version:Gamification.BACKUP_VERSION,exportedAt:new Date().toISOString(),sections:{progress:{q1:{id:'q1',best:-50}}}};
  const result=Gamification.validateBackup(pkg);
  assert.equal(result.ok,true);
  assert.ok(result.invalid_sections.includes('progress'));
});
