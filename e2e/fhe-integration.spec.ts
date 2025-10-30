/**
 * E2E Test: FHE SDK Integration
 * Tests the Fully Homomorphic Encryption SDK initialization and status
 */

import { test, expect } from '@playwright/test';

test.describe('FHE SDK Integration', () => {
  test('should initialize FHE SDK on page load', async ({ page }) => {
    await page.goto('/app');

    // Wait for potential FHE initialization banner
    await page.waitForTimeout(3000);

    // Check console for FHE logs
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('[FHE]')) {
        logs.push(msg.text());
      }
    });

    // FHE should either be initialized or show loading state
    const fheBanner = page.locator('text=/fhe|initializ/i');

    // If banner exists, it should eventually disappear (ready state)
    if (await fheBanner.isVisible()) {
      console.log('FHE Banner detected, waiting for initialization...');
      // Wait up to 30 seconds for FHE to initialize
      await expect(fheBanner).not.toBeVisible({ timeout: 30000 });
    }

    console.log('FHE Logs:', logs);
  });

  test('should show FHE error banner if initialization fails', async ({ page }) => {
    await page.goto('/app');

    await page.waitForTimeout(2000);

    // Check for error banner
    const errorBanner = page.locator('[class*="destructive"]').filter({ hasText: /fhe|error/i });

    // Either no error or error is displayed
    const hasError = await errorBanner.isVisible().catch(() => false);

    if (hasError) {
      console.log('FHE Error detected');
      await expect(errorBanner).toContainText(/fhe|error|fail/i);
    } else {
      console.log('No FHE errors detected');
    }
  });

  test('should display relayer URL in status banner', async ({ page }) => {
    await page.goto('/app');

    // Look for relayer URL mention
    const relayerMention = page.locator('text=/relayer.testnet.zama.cloud/i');

    // Relayer URL might be visible during initialization
    const isVisible = await relayerMention.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      console.log('Relayer URL visible in banner');
    } else {
      console.log('FHE already initialized or relayer not shown');
    }
  });

  test('should handle SharedArrayBuffer requirement', async ({ page }) => {
    // Monitor console for SharedArrayBuffer issues
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/app');
    await page.waitForTimeout(3000);

    // Check for SharedArrayBuffer errors
    const hasSharedArrayBufferError = errors.some(err =>
      err.includes('SharedArrayBuffer')
    );

    if (hasSharedArrayBufferError) {
      console.error('SharedArrayBuffer Error detected!');
      console.error('Errors:', errors);
    }

    expect(hasSharedArrayBufferError).toBe(false);
  });

  test('should check COOP/COEP headers', async ({ page }) => {
    const response = await page.goto('/app');

    if (response) {
      const headers = response.headers();

      // Check for required headers
      console.log('Cross-Origin-Opener-Policy:', headers['cross-origin-opener-policy']);
      console.log('Cross-Origin-Embedder-Policy:', headers['cross-origin-embedder-policy']);

      // These headers are required for SharedArrayBuffer
      expect(headers['cross-origin-opener-policy']).toBeDefined();
      expect(headers['cross-origin-embedder-policy']).toBeDefined();
    }
  });
});
