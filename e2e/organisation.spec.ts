import { test, expect } from '@playwright/test';
import { login, BASE_URL } from './helpers';

test.describe('Organisation Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('organisations page loads and shows list', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    await expect(page.locator('text=My Organisations')).toBeVisible();
  });

  test('filter sidebar visible on desktop', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    await expect(page.locator('text=Filter')).toBeVisible();
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Admin")')).toBeVisible();
    await expect(page.locator('button:has-text("Public")')).toBeVisible();
    await expect(page.locator('button:has-text("Private")')).toBeVisible();
  });

  test('org overview page shows projects section', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);

    // Click first org card
    const orgLink = page.locator('a[href^="/"]').filter({ hasText: /^(?!.*My Organisations)/ }).first();
    if (await orgLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orgLink.click();
      await expect(page.locator('text=Projects')).toBeVisible();
    }
  });

  test('org settings page has visibility toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);

    const orgLink = page.locator('a[href^="/"]').filter({ hasText: /^(?!.*My Organisations)/ }).first();
    if (await orgLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await orgLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}/settings`);
        await expect(page.locator('select#visibility')).toBeVisible();

        // Change to Private
        await page.selectOption('select#visibility', 'PRIVATE');
        await page.locator('button:has-text("Update Organisation")').click();

        // Verify success message
        await expect(page.locator('text=Organisation updated successfully')).toBeVisible({ timeout: 5000 });

        // Reload and verify persistence
        await page.goto(`${BASE_URL}${href}/settings`);
        await expect(page.locator('select#visibility')).toHaveValue('PRIVATE');

        // Reset to Public
        await page.selectOption('select#visibility', 'PUBLIC');
        await page.locator('button:has-text("Update Organisation")').click();
        await expect(page.locator('text=Organisation updated successfully')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
