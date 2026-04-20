import { test, expect } from '@playwright/test';
import { login, BASE_URL } from './helpers';

test.describe('Authentication', () => {
  test('unauthenticated user sees homepage with sign in', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('sign in redirects to organisations page', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/.*\/orga.*/);
  });

  test('authenticated user accessing / redirects to /orga', async ({ page }) => {
    await login(page);
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(/.*\/orga.*/);
  });
});
