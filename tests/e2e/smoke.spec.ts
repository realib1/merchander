import { test, expect } from '@playwright/test';

const pages = ['/', '/login', '/signup', '/privacy', '/terms', '/forgot-password', '/reset-password'];

test.describe('smoke', () => {
  for (const path of pages) {
    test(`loads ${path}`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response).not.toBeNull();
      expect(response?.status()).toBeGreaterThanOrEqual(200);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
      await expect(page).toHaveTitle(/Tastea|Merchander|Next/i);
    });
  }
});
