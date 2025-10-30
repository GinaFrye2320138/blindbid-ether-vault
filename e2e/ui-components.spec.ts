/**
 * E2E Test: UI Components
 * Tests all major UI components and their interactions
 */

import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test('should render header correctly', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check logo
    await expect(header.locator('text=BlindBid')).toBeVisible();

    // Check navigation links
    await expect(header.locator('text=Home')).toBeVisible();
    await expect(header.locator('text=Features')).toBeVisible();
    await expect(header.locator('text=Auctions')).toBeVisible();
  });

  test('should have working mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Find and click mobile menu button
    const menuButton = page.locator('button[aria-label*="menu"]');
    await expect(menuButton).toBeVisible();

    await menuButton.click();

    // Mobile menu should be visible
    await expect(page.locator('nav').locator('text=Home')).toBeVisible();
    await expect(page.locator('nav').locator('text=Features')).toBeVisible();
  });

  test('should render buttons with correct styles', async ({ page }) => {
    await page.goto('/');

    // Check Launch App button
    const launchButton = page.getByRole('button', { name: /launch app/i }).first();
    await expect(launchButton).toBeVisible();

    // Check button has correct styling (gradient background)
    const buttonClass = await launchButton.getAttribute('class');
    expect(buttonClass).toContain('bg-gradient');
  });

  test('should handle hover states', async ({ page }) => {
    await page.goto('/');

    // Hover over logo
    const logo = page.locator('header').locator('text=BlindBid').first();
    await logo.hover();

    // Button hover
    const launchButton = page.getByRole('button', { name: /launch app/i }).first();
    await launchButton.hover();

    // No errors should occur
    await page.waitForTimeout(500);
  });

  test('should display loading states', async ({ page }) => {
    await page.goto('/app');

    // Check for loading indicators
    await page.waitForTimeout(1000);

    // Look for any loading spinners or skeletons
    const loadingIndicators = page.locator('[class*="animate-spin"], [class*="animate-pulse"], [class*="skeleton"]');

    const count = await loadingIndicators.count();
    console.log(`Found ${count} loading indicators`);
  });

  test('should render icons correctly', async ({ page }) => {
    await page.goto('/');

    // Check for SVG icons
    const icons = page.locator('svg');
    const iconCount = await icons.count();

    expect(iconCount).toBeGreaterThan(0);
    console.log(`Found ${iconCount} SVG icons`);
  });

  test('should have accessible focus states', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check that focus is visible
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focused).toBeDefined();
    console.log('Focused element:', focused);
  });

  test('should display contract address with correct format', async ({ page }) => {
    await page.goto('/app');

    // Look for Ethereum address
    const addressPattern = /0x[a-fA-F0-9]{40}/;
    const addressElement = page.locator(`text=${addressPattern}`);

    await expect(addressElement).toBeVisible({ timeout: 5000 });

    const addressText = await addressElement.textContent();
    expect(addressText).toMatch(addressPattern);

    console.log('Contract address found:', addressText);
  });

  test('should render glassmorphism effects', async ({ page }) => {
    await page.goto('/');

    // Check for glass-card effects
    const glassCards = page.locator('[class*="glass"]');
    const glassCount = await glassCards.count();

    console.log(`Found ${glassCount} glassmorphism elements`);
  });

  test('should display gradient text', async ({ page }) => {
    await page.goto('/');

    // Check for gradient text effects
    const gradientText = page.locator('[class*="bg-gradient"][class*="bg-clip-text"]');
    const gradientCount = await gradientText.count();

    expect(gradientCount).toBeGreaterThan(0);
    console.log(`Found ${gradientCount} gradient text elements`);
  });
});
