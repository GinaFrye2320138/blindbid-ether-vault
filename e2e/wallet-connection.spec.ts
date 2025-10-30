/**
 * E2E Test: Wallet Connection
 * Tests wallet connection flow and modal interaction
 */

import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open wallet connection modal', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i }).first();
    await connectButton.click();

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Modal should show wallet options
    await expect(page.locator('text=/metamask|walletconnect/i')).toBeVisible();
  });

  test('should close modal when clicking outside', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i }).first();
    await connectButton.click();

    // Wait for modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click escape or outside
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test('should display wallet options in modal', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i }).first();
    await connectButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check for MetaMask option
    const metamaskOption = modal.locator('text=/metamask/i');
    await expect(metamaskOption).toBeVisible();

    // Check for network requirement info
    await expect(modal.locator('text=/sepolia/i')).toBeVisible();
  });

  test('should show faucet link in modal', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i }).first();
    await connectButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check for faucet link
    const faucetLink = modal.locator('a[href*="faucet"]');
    await expect(faucetLink).toBeVisible();
  });

  test('should handle wallet not installed state', async ({ page }) => {
    const connectButton = page.getByRole('button', { name: /connect wallet/i }).first();
    await connectButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // In test environment, wallet might not be available
    // Check for "Not installed" text if MetaMask is not present
    const notInstalledText = modal.locator('text=/not installed|available/i');

    // Either wallet is ready or shows not installed
    const hasNotInstalled = await notInstalledText.isVisible().catch(() => false);
    const hasAvailable = await modal.locator('text=/available/i').isVisible().catch(() => false);

    expect(hasNotInstalled || hasAvailable).toBe(true);
  });
});
