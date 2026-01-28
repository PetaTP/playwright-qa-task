import { test, expect } from '@playwright/test';
import testData from '../testData.json';

test.beforeEach(async ({ page }) => {
  await page.goto('https://animated-gingersnap-8cf7f2.netlify.app/', { waitUntil: 'domcontentloaded' });

  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Give the app time to render the board list after login
  await page.waitForLoadState('networkidle');
});

testData.forEach((data) => {
  test(data.name, async ({ page }) => {
    // 1) Click the board (don’t force exact:true everywhere — it makes things fragile)
    const board = page
      .getByRole('button', { name: data.board })
      .or(page.getByRole('link', { name: data.board }))
      .or(page.getByText(data.board));

    await expect(board.first()).toBeVisible({ timeout: 15000 });
    await board.first().click();

    // 2) Confirm task title is visible somewhere
    const taskTitle = page.getByText(data.task);
    await expect(taskTitle.first()).toBeVisible({ timeout: 15000 });

    // 3) Confirm task is in the correct column:
    // Find a container that has BOTH the column name and the task name.
    const columnContainer = page
      .locator('section,div')
      .filter({ has: page.getByText(data.column) })
      .filter({ has: page.getByText(data.task) })
      .first();

    await expect(columnContainer).toBeVisible({ timeout: 15000 });

    // 4) Confirm tags belong to THAT task:
    // Find a “card-like” container that has the task text, then assert tags inside it.
    let cardContainer = page
      .locator('article,li,div')
      .filter({ has: page.getByText(data.task) });

    for (const tag of data.tags) {
      cardContainer = cardContainer.filter({ has: page.getByText(tag) });
    }

    await expect(cardContainer.first()).toBeVisible({ timeout: 15000 });
  });
});
