import { test, expect } from '@playwright/test';

// a1-001 is a single-question quiz with a known correct answer, which keeps
// this deterministic without needing to inspect JSON at runtime.
const QUIZ_URL = '/shared/quiz.html?quiz=a1-001&level=a1';
const CORRECT_ANSWER = 'goes';
const QUESTION_COUNT = 5;

test.describe('Mylingo — core user journey', () => {
  test('quiz taking: answering correctly shows feedback and a 100% result', async ({ page }) => {
    await page.goto(QUIZ_URL);
    await page.getByRole('button', { name: /Start quiz/i }).click();

    await expect(page.getByRole('radio', { name: new RegExp(CORRECT_ANSWER, 'i') })).toBeVisible();
    for (let i = 0; i < QUESTION_COUNT; i++) {
      await page.getByRole('radio', { name: new RegExp(`^${CORRECT_ANSWER}$`, 'i') }).click();
      await expect(page.locator('#feedback')).toContainText('Correct!');
      await page.locator('#next').click();
    }

    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#finalPct')).toHaveText('100%');
  });

  test('score saving: a completed quiz shows up on the level dashboard', async ({ page }) => {
    await page.goto(QUIZ_URL);
    await page.getByRole('button', { name: /Start quiz/i }).click();
    for (let i = 0; i < QUESTION_COUNT; i++) {
      await page.getByRole('radio', { name: new RegExp(`^${CORRECT_ANSWER}$`, 'i') }).click();
      await page.locator('#next').click();
    }
    await expect(page.locator('#result')).toBeVisible();

    await page.goto('/a1/dashboard.html');
    await expect(page.getByText('Present Simple')).toBeVisible();
    // "Completed" stat tile should read at least 1
    const completedTile = page.locator('.stat', { hasText: 'Completed' });
    await expect(completedTile.locator('.n')).not.toHaveText('0');
  });

  test('gamification: XP and streak appear after finishing a quiz', async ({ page }) => {
    await page.goto(QUIZ_URL);
    await page.getByRole('button', { name: /Start quiz/i }).click();
    for (let i = 0; i < QUESTION_COUNT; i++) {
      await page.getByRole('radio', { name: new RegExp(`^${CORRECT_ANSWER}$`, 'i') }).click();
      await page.locator('#next').click();
    }

    const badges = page.locator('#gamifyBadges');
    await expect(badges).toBeVisible();
    await expect(badges).toContainText('XP');
    await expect(badges).toContainText('day');

    await page.goto('/a1/dashboard.html');
    const xpTile = page.locator('.stat', { hasText: 'XP earned' });
    await expect(xpTile.locator('.n')).not.toHaveText('0');
  });

  test('audio controls: mute and speed toggles persist across reload', async ({ page }) => {
    await page.goto(QUIZ_URL);

    const soundBtn = page.locator('#soundBtn');
    await expect(soundBtn).toHaveAttribute('aria-pressed', 'false');
    await soundBtn.click();
    await expect(soundBtn).toHaveAttribute('aria-pressed', 'true');

    const speedBtn = page.locator('#speedBtn');
    await expect(speedBtn).toHaveText('1x');
    await speedBtn.click();
    await expect(speedBtn).toHaveText('0.75x');

    await page.reload();
    await expect(page.locator('#soundBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#speedBtn')).toHaveText('0.75x');
  });

  test('offline navigation: cached pages still load with the network disabled', async ({ page, context }) => {
    // First, an online visit so the service worker installs and precaches
    // the app shell (per site/sw.js's install handler).
    await page.goto('/main/index.html');
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, { timeout: 15000 })
      .catch(() => {}); // best-effort: some browsers/projects in CI may not activate in time

    await page.goto('/a1/index.html');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);
    await page.reload();
    // The shell should still render from cache even with no network.
    await expect(page.locator('h1, .grid')).toBeVisible();
    await context.setOffline(false);
  });
});
