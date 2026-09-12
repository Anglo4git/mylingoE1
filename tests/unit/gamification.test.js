import { describe, it, expect, beforeEach } from 'vitest';

// site/shared/js/gamification.js is UMD: under Node (no `window`), it
// exports itself via module.exports, so a plain require/import works here
// without any bundler config.
import Gamification from '../../site/shared/js/gamification.js';

describe('calculateXp', () => {
  it('gives 0 xp for an empty quiz', () => {
    expect(Gamification.calculateXp(0, 0)).toBe(0);
  });

  it('gives 10 xp per correct answer', () => {
    expect(Gamification.calculateXp(3, 5)).toBe(30);
  });

  it('adds a perfect-score bonus when every answer is correct', () => {
    expect(Gamification.calculateXp(5, 5)).toBe(5 * 10 + 20);
  });

  it('never goes negative on bad input', () => {
    expect(Gamification.calculateXp(-2, 5)).toBe(0);
    expect(Gamification.calculateXp(2, -5)).toBe(0);
  });
});

describe('daysBetween', () => {
  it('is 0 for the same date', () => {
    expect(Gamification.daysBetween('2026-09-06', '2026-09-06')).toBe(0);
  });
  it('is 1 for consecutive days', () => {
    expect(Gamification.daysBetween('2026-09-06', '2026-09-07')).toBe(1);
  });
  it('handles month boundaries', () => {
    expect(Gamification.daysBetween('2026-08-31', '2026-09-01')).toBe(1);
  });
});

describe('updateStreak', () => {
  it('starts a new streak at 1 when there is no prior activity', () => {
    expect(Gamification.updateStreak(null, '2026-09-06', 0)).toBe(1);
  });

  it('keeps the streak unchanged for a second session on the same day', () => {
    expect(Gamification.updateStreak('2026-09-06', '2026-09-06', 4)).toBe(4);
  });

  it('increments the streak for the very next day', () => {
    expect(Gamification.updateStreak('2026-09-05', '2026-09-06', 4)).toBe(5);
  });

  it('resets the streak to 1 after a gap of more than one day', () => {
    expect(Gamification.updateStreak('2026-09-01', '2026-09-06', 12)).toBe(1);
  });
});

describe('recordSession (storage-backed)', () => {
  // jsdom provides `localStorage` under Vitest's default environment; if the
  // project ever switches to the 'node' environment, these three tests are
  // the ones that would need a localStorage shim.
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists xp and starts a 1-day streak on first use', () => {
    const result = Gamification.recordSession(4, 5, new Date('2026-09-06T10:00:00Z'), { quizId: 'legacy-001', quizVersion: '1', mode: 'normal' });
    expect(result.xpEarned).toBe(40);
    expect(result.xpTotal).toBe(40);
    expect(result.streak).toBe(1);
  });

  it('accumulates xp and extends the streak across consecutive days', () => {
    Gamification.recordSession(5, 5, new Date('2026-09-06T10:00:00Z'), { quizId: 'legacy-002', quizVersion: '1', mode: 'normal' }); // +70 xp (perfect), streak 1
    const second = Gamification.recordSession(2, 5, new Date('2026-09-07T10:00:00Z'), { quizId: 'legacy-003', quizVersion: '1', mode: 'normal' }); // +20 xp, streak 2
    expect(second.xpTotal).toBe(90);
    expect(second.streak).toBe(2);
    expect(second.longestStreak).toBe(2);
  });

  it('resets the streak, but keeps total xp, after a missed day', () => {
    Gamification.recordSession(5, 5, new Date('2026-09-01T10:00:00Z'), { quizId: 'legacy-004', quizVersion: '1', mode: 'normal' });
    const later = Gamification.recordSession(1, 5, new Date('2026-09-10T10:00:00Z'), { quizId: 'legacy-005', quizVersion: '1', mode: 'normal' });
    expect(later.streak).toBe(1);
    expect(later.xpTotal).toBe(70 + 10);
  });
});

describe('Agent 45 reward integrity and local-day behavior', () => {
  beforeEach(() => localStorage.clear());

  it('awards normal XP once for first completion of a quiz version', () => {
    const result = Gamification.recordSession(4, 5, new Date('2026-09-06T12:00:00Z'), {
      quizId: 'a1-001', quizVersion: '7', mode: 'normal'
    });
    expect(result.xpEarned).toBe(40);
    expect(result.rewardType).toBe('completion');
    expect(result.isRepeat).toBe(false);
  });

  it('gives no XP for a same-score replay regardless of score cycling', () => {
    Gamification.recordSession(4, 5, new Date('2026-09-06T12:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' });
    expect(Gamification.recordSession(3, 5, new Date('2026-09-06T13:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' }).xpEarned).toBe(0);
    expect(Gamification.recordSession(4, 5, new Date('2026-09-06T14:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' }).xpEarned).toBe(0);
    expect(Gamification.recordSession(3, 5, new Date('2026-09-06T15:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' }).xpEarned).toBe(0);
  });

  it('awards a bounded improvement bonus only when the best score increases', () => {
    Gamification.recordSession(4, 5, new Date('2026-09-06T12:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' });
    const improved = Gamification.recordSession(5, 5, new Date('2026-09-06T13:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' });
    expect(improved.xpEarned).toBe(5);
    expect(improved.rewardType).toBe('improvement');
    let total = improved.xpTotal;
    for (let i = 0; i < 10; i += 1) {
      total = Gamification.recordSession(5, 5, new Date('2026-09-06T14:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' }).xpTotal;
    }
    expect(total).toBe(40 + 5);
  });

  it('treats a version change as a distinct completion reward', () => {
    const first = Gamification.recordSession(4, 5, new Date('2026-09-06T12:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' });
    const nextVersion = Gamification.recordSession(4, 5, new Date('2026-09-07T12:00:00Z'), { quizId: 'a1-001', quizVersion: '8', mode: 'normal' });
    expect(first.xpEarned).toBe(40);
    expect(nextVersion.xpEarned).toBe(40);
    expect(nextVersion.xpTotal).toBe(80);
  });

  it('does not reward a completion when quiz identity/version is missing', () => {
    const result = Gamification.recordSession(5, 5, new Date('2026-09-06T12:00:00Z'));
    expect(result.xpEarned).toBe(0);
    expect(result.isRepeat).toBe(true);
    expect(result.streak).toBe(0);
  });

  it('does not award XP, streak activity, or improvement rewards for placement', () => {
    const learning = Gamification.recordSession(3, 5, new Date('2026-09-06T12:00:00Z'), { quizId: 'a1-001', quizVersion: '7', mode: 'normal' });
    const placement = Gamification.recordSession(5, 5, new Date('2026-09-07T12:00:00Z'), { quizId: 'placement-001', quizVersion: '1', mode: 'placement' });
    expect(learning.xpEarned).toBe(30);
    expect(placement.xpEarned).toBe(0);
    expect(placement.streak).toBe(learning.streak);
    expect(placement.isNewStreakDay).toBe(false);
    expect(placement.isPlacement).toBe(true);
    expect(Gamification.getState().lastActiveDate).toBe('2026-09-06');
  });

  it('uses learner-local calendar dates rather than UTC dates', () => {
    const lateUtc = new Date('2026-09-07T03:30:00Z');
    const earlyUtc = new Date('2026-09-07T04:15:00Z');
    expect(Gamification.todayStr(lateUtc, 'America/New_York')).toBe('2026-09-06');
    expect(Gamification.todayStr(earlyUtc, 'America/New_York')).toBe('2026-09-07');
    const sameLocalDay = new Date('2026-09-07T03:30:00Z');
    expect(Gamification.todayStr(sameLocalDay, 'America/Los_Angeles')).toBe('2026-09-06');
  });
});
