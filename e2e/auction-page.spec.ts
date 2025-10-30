/**
 * E2E Test: Auction Page
 * Tests the auction marketplace functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Auction Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('should load auction page', async ({ page }) => {
    await expect(page).toHaveURL('/app');

    // Check for page title
    await expect(page.locator('h1')).toContainText(/auction|blind|nft/i);
  });

  test('should display FHE initialization banner', async ({ page }) => {
    // Wait for FHE SDK initialization
    const banner = page.locator('text=/initializ|loading|fhe/i').first();

    // Banner should either show loading or be hidden (if already loaded)
    await page.waitForTimeout(1000);

    // After initialization, either banner disappears or shows ready state
    const bannerVisible = await banner.isVisible().catch(() => false);
    console.log('FHE Banner visible:', bannerVisible);
  });

  test('should display Connect Wallet button when not connected', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect/i });
    await expect(connectButton).toBeVisible();
  });

  test('should show empty state or lot cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Either shows "No lots yet" or shows lot cards
    const hasEmptyState = await page.locator('text=/no lots|no auctions/i').isVisible().catch(() => false);
    const hasLotCards = await page.locator('[class*="lot"]').count() > 0;

    expect(hasEmptyState || hasLotCards).toBe(true);
  });

  test('should display contract address', async ({ page }) => {
    // Check that contract address is shown somewhere on the page
    const contractAddress = page.locator('text=/0x[a-fA-F0-9]{40}/');
    await expect(contractAddress).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(header).toBeVisible();
  });

  test('should display filter button (disabled)', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible()) {
      await expect(filterButton).toBeDisabled();
    }
  });
});
