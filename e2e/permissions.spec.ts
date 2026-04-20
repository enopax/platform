import { test, expect } from '@playwright/test';
import { BASE_URL } from './helpers';

test.describe('Permissions (unauthenticated)', () => {
  test('unauthenticated user cannot access org pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    // Should redirect to signin
    await expect(page).toHaveURL(/.*signin.*/);
  });

  test('unauthenticated user cannot access admin pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    // Should redirect to signin or home
    await expect(page).toHaveURL(/.*signin.*|.*\//);
  });
});
