import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const fixture = JSON.parse(fs.readFileSync(
  path.resolve(process.cwd(), 'tests/fixtures/quiz-question-types.json'), 'utf8'
));

// Agent 113 browser coverage harness. The fixture is injected through the
// RuntimeContentLoader boundary so this test does not modify production quiz
// data or duplicate production questions.
const QUIZ_URL = '/shared/quiz.html?quiz=agent-110-question-type-coverage&level=a2';

async function installFixture(page) {
  // Intercept the deterministic grammar lookup used by the real runtime
  // loader. This keeps the test on the production quiz.html renderer while
  // avoiding any production-data mutation.
  await page.route('**/grammar/a2/agent-110-question-type-coverage.json', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture),
    });
  });
}


test.describe('Agent 113 — non-radio renderer coverage', () => {
  test('fixture contains every supported non-radio renderer', async () => {
    const types = new Set(fixture.questions.map(q => q.question_type));
    for (const type of ['dropdown','text','short_text','number','date','matching','ranking','fill_in_the_blank','banner']) {
      expect(types.has(type)).toBeTruthy();
    }
  });

  test('real browser can load the canonical renderer fixture', async ({ page }) => {
    await installFixture(page);
    await page.goto(QUIZ_URL);
    await expect(page.getByRole('button', { name: /Start quiz/i })).toBeVisible();
    await page.getByRole('button', { name: /Start quiz/i }).click();
    await expect(page.locator('#question')).toContainText('Choose one.');
  });

  test('renderer sequence exposes interactive controls and feedback', async ({ page }) => {
    await installFixture(page);
    await page.goto(QUIZ_URL);
    await page.getByRole('button', { name: /Start quiz/i }).click();

    // Radio first: intentionally answer incorrectly, then advance.
    await page.getByRole('radio').last().click();
    await expect(page.locator('#feedback')).toContainText('Not quite.');
    await page.locator('#next').click();

    // Checkbox.
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    await page.getByRole('checkbox').nth(0).click();
    await page.getByRole('checkbox').nth(2).click();
    await page.getByRole('button', { name: /Check answer/i }).click();
    await page.locator('#next').click();

    // Dropdown.
    await page.locator('#choiceSelect').selectOption('2');
    await page.getByRole('button', { name: /Check answer/i }).click();
    await page.locator('#next').click();

    // Text-like types share the same answer input contract.
    for (const value of ['hello', 'yes', '42', '2026-09-10']) {
      const input = page.locator('#answerInput');
      await input.fill(value);
      await page.getByRole('button', { name: /Check answer/i }).click();
      await page.locator('#next').click();
    }

    // Matching.
    await expect(page.locator('.match-card')).toBeVisible();
    const selects = page.locator('.match-card select');
    await selects.nth(0).selectOption({ label: '1' });
    await selects.nth(1).selectOption({ label: '2' });
    await page.getByRole('button', { name: /Check answer/i }).click();
    await page.locator('#next').click();

    // Ranking: fixture's canonical order is the expected order. Keyboard
    // interaction is covered by the renderer itself; here we verify the list
    // and completion action are actually reachable in the browser.
    await expect(page.locator('.rank-list')).toBeVisible();
    await page.getByRole('button', { name: /Check order/i }).click();
    await page.locator('#next').click();

    // Fill-in-the-blank and banner.
    await expect(page.locator('#answerInput')).toBeVisible();
    await page.locator('#answerInput').fill('am');
    await page.getByRole('button', { name: /Check answer/i }).click();
    await page.locator('#next').click();
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
    await page.getByRole('button', { name: /Continue/i }).click();
    await expect(page.locator('#result')).toBeVisible();
  });
});
