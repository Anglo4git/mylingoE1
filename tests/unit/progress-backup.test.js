import { describe, expect, it, beforeEach } from 'vitest';
import backup from '../../site/shared/js/gamification.js';

const keys = {
  progress: 'mylingo.progress.v1',
  session: 'mylingo.sessions.v2',
  sessionIndex: 'mylingo.sessions.v3.index',
  sessionPrefix: 'mylingo.sessions.v3.',
  legacySession: 'mylingo.session.v1',
  gamification: 'mylingo.gamification.v1',
  skillMastery: 'mylingo.skill-mastery.v1',
  reviewScheduling: 'mylingo.review-scheduling.v1',
  placement: 'mylingo.assessment.v1',
  placementPending: 'mylingo.assessment.pending.v1',
  orientation: 'mylingo.orientation.v1'
};

const fixture = {
  progress: { q1: { id: 'q1', level: 'a1', status: 'completed', best: 90, latest: 85, attempts: 2, current: 10, totalQuestions: 10, lastAccess: 1700000000000 } },
  session: { version: 2, sessions: { q2: { version: 1, quizId: 'q2', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 1, updatedAt: 2 } } },
  gamification: { xpTotal: 30, streak: 3, longestStreak: 5, lastActiveDate: '2026-09-07', rewardedSessions: ['q1|3|5'] },
  skillMastery: { version: 1, updated_at: 1700000000000, skills: { grammar: { question_count: 10, correct_count: 8, attempt_count: 2, accuracy: 80, mastery_band: 'secure', confidence: 'medium', level_counts: { a1: 10 }, last_level: 'a1', last_quiz_id: 'q1', last_attempt_at: 1700000000000 } } },
  reviewScheduling: { version: 1, updated_at: 1700000000000, skills: { grammar: { interval_days: 7, interval_hours: 168, consecutive_successes: 2, last_accuracy: 80, last_review_at: 1700000000000, due_at: 1700604800000, last_quiz_id: 'q1', last_level: 'a1' } } },
  placement: { blueprint_version: 2, estimated_level: 'a1', assessed_level: 'a2', recommended_level: 'a2', score: 72, confidence: 'high', evidence: [{ question_id: 'p1', quiz_id: 'placement-001', quiz_ids: ['placement-001'], skill: 'grammar', correct: true, stages: ['primary'] }], evidence_question_count: 1, evidence_correct_count: 1, assessment_quiz_ids: ['placement-001'] },
  placementPending: { version: 1, estimated_level: 'a2', primary_level: 'a2', primary_score: 86, primary_quiz_id: 'placement-001', verification_level: 'b1', primary_evidence: [{ question_id: 'p2', quiz_id: 'placement-001', quiz_ids: ['placement-001'], skill: 'vocabulary', correct: true, stages: ['primary'] }], timestamp: 1700000000000 },
  orientation: { version: 1, completedAt: '2026-09-07T00:00:00.000Z', answers: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], score: 25, maxScore: 50, recommendedLevel: 'a2' }
};

function seedFixture() {
  Object.entries(fixture).forEach(([name, value]) => localStorage.setItem(keys[name], JSON.stringify(value)));
}

function sessionShard(id) { return keys.sessionPrefix + encodeURIComponent(id); }

function clearAll() {
  Object.values(keys).forEach(key => localStorage.removeItem(key));
  ['q1','q2','live','other','stale'].forEach(id => localStorage.removeItem(sessionShard(id)));
}

describe('Learner backup/restore', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: key => store.has(key) ? store.get(key) : null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: key => store.delete(key)
    };
  });

  it('exports the complete versioned learner state', () => {
    seedFixture();
    const pkg = backup.buildBackup();
    expect(pkg.schema).toBe('mylingo.backup.v2');
    expect(pkg.version).toBe(2);
    expect(Object.keys(pkg.sections)).toEqual(backup.BACKUP_SECTIONS);
    expect(pkg.sections.skillMastery.skills.grammar.correct_count).toBe(8);
    expect(pkg.sections.reviewScheduling.skills.grammar.due_at).toBe(1700604800000);
    expect(pkg.sections.placement.evidence_question_count).toBe(1);
    expect(pkg.sections.placementPending.verification_level).toBe('b1');
    expect(pkg.sections.orientation.recommendedLevel).toBe('a2');
  });

  it('round-trips mastery, review, placement, orientation, progress, session, and gamification', () => {
    seedFixture();
    const pkg = backup.buildBackup();
    clearAll();
    const result = backup.restoreBackup(pkg);
    expect(result.ok).toBe(true);
    expect(result.partial).toBe(false);
    expect(result.restored_sections).toEqual(backup.BACKUP_SECTIONS);
    Object.entries(fixture).forEach(([name, value]) => {
      if (name === 'session') return; // sharded storage: verified via buildBackup() below.
      expect(JSON.parse(localStorage.getItem(keys[name]))).toEqual(value);
    });
    // Session restore migrates into sharded mylingo.sessions.v3.* storage rather than
    // writing back the legacy v2 blob key (see restoreBackup's session branch), so the
    // round-trip is verified the same way production code reads it back: buildBackup().
    expect(backup.buildBackup().sections.session).toEqual({ version: 3, sessions: fixture.session.sessions });
    expect(localStorage.getItem(keys.session)).toBeNull();
  });

  it('backs up the live multi-session store, not the retired single-session key', () => {
    localStorage.setItem(keys.legacySession, JSON.stringify({ version: 1, quizId: 'stale', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 1, updatedAt: 2 }));
    localStorage.setItem(keys.session, JSON.stringify({ version: 2, sessions: { live: { version: 1, quizId: 'live', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 5, updatedAt: 6 } } }));
    const pkg = backup.buildBackup();
    expect(pkg.sections.session).toEqual({ version: 2, sessions: { live: { version: 1, quizId: 'live', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 5, updatedAt: 6 } } });
  });

  it('falls back to the legacy single-session key when the runtime has not migrated yet', () => {
    localStorage.setItem(keys.legacySession, JSON.stringify({ version: 1, quizId: 'stale', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 1, updatedAt: 2 }));
    const pkg = backup.buildBackup();
    expect(pkg.sections.session).toEqual({ version: 2, sessions: { stale: { version: 1, quizId: 'stale', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 1, updatedAt: 2 } } });
  });

  it('restores a session backup by merging quizIds instead of overwriting other in-progress sessions', () => {
    localStorage.setItem(keys.session, JSON.stringify({ version: 2, sessions: { other: { version: 1, quizId: 'other', quizVersion: '1', questionIndex: 2, answers: [null, null, null], score: 1, status: 'in-progress', startedAt: 10, updatedAt: 11 } } }));
    const pkg = { schema: 'mylingo.backup.v2', version: 2, exportedAt: new Date().toISOString(), sections: { session: { version: 2, sessions: { q2: fixture.session.sessions.q2 } } } };
    const result = backup.restoreBackup(pkg);
    expect(result.ok).toBe(true);
    expect(result.restored_sections).toEqual(['session']);
    expect(JSON.parse(localStorage.getItem(sessionShard('other'))).quizId).toBe('other');
    expect(JSON.parse(localStorage.getItem(sessionShard('q2')))).toEqual(fixture.session.sessions.q2);
  });

  it('restores supported legacy v1 backups', () => {
    const legacy = {
      schema: 'mylingo.backup.v1',
      exportedAt: new Date().toISOString(),
      progress: { q1: { id: 'q1', level: 'a1', status: 'completed', best: 91 } },
      session: null,
      gamification: { xpTotal: 40, streak: 2, longestStreak: 2, lastActiveDate: '2026-09-08' }
    };
    const result = backup.restoreBackup(legacy);
    expect(result.ok).toBe(true);
    expect(result.legacy).toBe(true);
    expect(JSON.parse(localStorage.getItem(keys.progress)).q1.best).toBe(91);
    expect(JSON.parse(localStorage.getItem(keys.gamification)).xpTotal).toBe(40);
    expect(localStorage.getItem(keys.session)).toBeNull();
    expect(localStorage.getItem(keys.sessionIndex)).toBeNull();
  });

  it('skips a malformed section without destroying valid unrelated state', () => {
    localStorage.setItem(keys.progress, JSON.stringify({ q1: { id: 'q1', best: 75 } }));
    localStorage.setItem(keys.skillMastery, JSON.stringify({ version: 1, updated_at: 1, skills: {} }));
    const pkg = {
      schema: 'mylingo.backup.v2', version: 2, exportedAt: new Date().toISOString(),
      sections: {
        progress: { q2: { id: 'q2', level: 'a2', status: 'completed', best: 95 } },
        skillMastery: { version: 1, updated_at: 1, skills: { grammar: { question_count: 4, correct_count: 8, attempt_count: 1 } } }
      }
    };
    const result = backup.restoreBackup(pkg);
    expect(result.ok).toBe(true);
    expect(result.partial).toBe(true);
    expect(result.restored_sections).toEqual(['progress']);
    expect(result.rejected_sections).toEqual(['skillMastery']);
    expect(JSON.parse(localStorage.getItem(keys.progress)).q2.best).toBe(95);
    expect(JSON.parse(localStorage.getItem(keys.skillMastery))).toEqual({ version: 1, updated_at: 1, skills: {} });
  });

  it('rejects a malformed envelope without changing current state', () => {
    localStorage.setItem(keys.progress, JSON.stringify({ q1: { id: 'q1', best: 75 } }));
    const current = localStorage.getItem(keys.progress);
    const result = backup.restoreBackup({ schema: 'mylingo.backup.v99', version: 99, sections: {} });
    expect(result.ok).toBe(false);
    expect(localStorage.getItem(keys.progress)).toBe(current);
  });

  it('accepts fractional review intervals and enforces hours/day consistency', () => {
    const value = { version: 1, updated_at: 1, skills: {
      grammar: { interval_days: 0.25, interval_hours: 6, consecutive_successes: 0, last_accuracy: 30, due_at: 2 }
    } };
    expect(backup.validateBackup({ schema: 'mylingo.backup.v2', version: 2, exportedAt: new Date().toISOString(), sections: { reviewScheduling: value } }).ok).toBe(true);
    value.skills.grammar.interval_hours = 12;
    expect(backup.validateBackup({ schema: 'mylingo.backup.v2', version: 2, exportedAt: new Date().toISOString(), sections: { reviewScheduling: value } }).invalid_sections).toEqual(['reviewScheduling']);
  });

  it('backs up and restores sharded multi-session storage', () => {
    const shard = sessionShard;
    localStorage.setItem(keys.sessionIndex, JSON.stringify({ version: 1, quizIds: ['q1', 'q2'] }));
    localStorage.setItem(shard('q1'), JSON.stringify({ version: 1, quizId: 'q1', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 1, updatedAt: 2 }));
    localStorage.setItem(shard('q2'), JSON.stringify({ version: 1, quizId: 'q2', quizVersion: '1', questionIndex: 1, answers: [null, null], score: 1, status: 'in-progress', startedAt: 3, updatedAt: 4 }));
    const pkg = backup.buildBackup();
    expect(pkg.sections.session.version).toBe(3);
    expect(Object.keys(pkg.sections.session.sessions)).toEqual(['q1', 'q2']);
    clearAll();
    localStorage.setItem(shard('other'), JSON.stringify({ version: 1, quizId: 'other', quizVersion: '1', questionIndex: 0, answers: [null], score: 0, status: 'in-progress', startedAt: 5, updatedAt: 6 }));
    localStorage.setItem(keys.sessionIndex, JSON.stringify({ version: 1, quizIds: ['other'] }));
    const result = backup.restoreBackup(pkg);
    expect(result.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem(shard('other'))).quizId).toBe('other');
    expect(JSON.parse(localStorage.getItem(shard('q1'))).quizId).toBe('q1');
  });

});
