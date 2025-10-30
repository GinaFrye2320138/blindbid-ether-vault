/**
 * E2E Test: Landing Page
 * Tests the main landing page of BlindBid DApp
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('BlindBid');
  });

  test('should have working navigation', async ({ page }) => {
    // Check header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check logo
    const logo = page.locator('header').locator('text=BlindBid');
    await expect(logo).toBeVisible();
  });

  test('should display Connect Wallet button', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();
  });

  test('should display Launch App button', async ({ page }) => {
    const launchButton = page.getByRole('button', { name: /launch app/i });
    await expect(launchButton).toBeVisible();
  });

  test('should navigate to auction page', async ({ page }) => {
    const launchButton = page.getByRole('button', { name: /launch app/i }).first();
    await launchButton.click();

    // Wait for navigation
    await page.waitForURL('/app');

    // Check we're on the auction page
    await expect(page.url()).toContain('/app');
  });

  test('should display features section', async ({ page }) => {
    // Scroll to features
    await page.evaluate(() => window.scrollTo(0, 500));

    // Check features are visible
    await expect(page.locator('text=Features')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Mobile menu button should be visible
    const menuButton = page.locator('button[aria-label*="menu"]');
    await expect(menuButton).toBeVisible();
  });
});
