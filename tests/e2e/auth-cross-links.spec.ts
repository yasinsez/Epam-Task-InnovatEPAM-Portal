/**
 * E2E Tests for Auth Cross-Links
 *
 * Ensures users can navigate between login and registration
 * forms via cross-links.
 *
 * @module tests/e2e/auth-cross-links
 */

import { test, expect } from '@playwright/test';

test.describe('Auth Cross-Links', () => {
  test('navigates from login to register via cross-link', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.getByRole('link', { name: /register/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL('/auth/register');
  });

  test('navigates from register to login via cross-link', async ({ page }) => {
    await page.goto('/auth/register');

    const signInLink = page.getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    await expect(page).toHaveURL('/auth/login');
  });
});
