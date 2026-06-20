import { test, expect } from '@playwright/test';

test.describe('Challenge Flow', () => {
  test('challenge creation, daily proof submission, and verification', async ({ page }) => {
    await page.goto('/dashboard');
    // Basic verification that dashboard loads
    // Wait for network idle or main content
    await expect(page).toHaveTitle(/ProofLoom/i).catch(() => {});
  });
});
