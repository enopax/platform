import { test, expect } from '@playwright/test';
import { login, BASE_URL } from './helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('top nav bar shows hamburger menu, search, and user avatar', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible();
    await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();
    await expect(page.locator('text=Search or jump to...')).toBeVisible();
  });

  test('hamburger menu opens dropdown with Organisations link', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    await page.locator('button[aria-label="Menu"]').click();
    await expect(page.locator('[role="menuitem"]:has-text("Organisations")')).toBeVisible();
  });

  test('user avatar dropdown shows Settings and Sign Out', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    await page.locator('button[aria-label="User menu"]').click();
    await expect(page.locator('[role="menuitem"]:has-text("Settings")')).toBeVisible();
    await expect(page.locator('[role="menuitem"]:has-text("Sign Out")')).toBeVisible();
  });

  test('search button opens command palette', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    await page.locator('text=Search or jump to...').click();

    // Command palette should be visible
    await expect(page.locator('[role="dialog"], [data-radix-portal]').first()).toBeVisible({ timeout: 3000 });
  });

  test('cmd+K opens command palette', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[role="dialog"], [data-radix-portal]').first()).toBeVisible({ timeout: 3000 });
  });

  test('breadcrumb shows org name on org pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);

    const orgLink = page.locator('a[href^="/"]').filter({ hasText: /^(?!.*My Organisations)/ }).first();
    if (await orgLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const orgName = await orgLink.textContent();
      await orgLink.click();

      // Breadcrumb in top nav should show org name
      if (orgName) {
        await expect(page.locator(`header nav >> text=${orgName.trim()}`)).toBeVisible();
      }
    }
  });

  test('sidebar shows context-aware content', async ({ page }) => {
    await page.goto(`${BASE_URL}/orga`);

    const orgLink = page.locator('a[href^="/"]').filter({ hasText: /^(?!.*My Organisations)/ }).first();
    if (await orgLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orgLink.click();

      // On org overview, sidebar should show org nav items
      await expect(page.locator('aside >> text=Organisation')).toBeVisible();
      await expect(page.locator('aside >> text=Overview')).toBeVisible();
      await expect(page.locator('aside >> text=Members')).toBeVisible();
      await expect(page.locator('aside >> text=Teams')).toBeVisible();
    }
  });
});
