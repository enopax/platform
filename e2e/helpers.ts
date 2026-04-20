import { type Page } from '@playwright/test';

const DEX_URL = process.env.DEX_URL || 'http://localhost:5556';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@enopax.io';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'admin123';

export async function login(page: Page) {
  await page.goto(`${BASE_URL}/signin`);

  // NextAuth redirects to Dex, which shows a login form
  // Wait for the Dex login page to load
  await page.waitForURL(/.*\/auth\?.*|.*\/dex\/auth.*|.*5556.*/, { timeout: 10000 }).catch(() => {
    // If already logged in, we might be redirected to /orga directly
  });

  // Check if we're already authenticated
  const url = page.url();
  if (url.includes('/orga') || url.includes(BASE_URL)) {
    return;
  }

  // Fill Dex login form
  const emailInput = page.locator('input[name="login"]');
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Dex may show a grant/approval page
    const grantButton = page.locator('button:has-text("Grant Access"), button:has-text("Approve")');
    if (await grantButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await grantButton.click();
    }
  }

  // Wait for redirect back to the app
  await page.waitForURL(`${BASE_URL}/**`, { timeout: 15000 });
}

export { BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD };
