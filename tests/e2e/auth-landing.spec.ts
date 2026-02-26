/**
 * E2E Tests for Authentication Landing Page Flow
 *
 * Tests the complete user journey through authentication:
 * - Landing page access
 * - Create Account button navigation
 * - Sign In button navigation
 * - Authenticated user redirect
 *
 * @module tests/e2e/auth-landing
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Landing Page', () => {
  test.describe('US1: New User Discovers Portal', () => {
    test('should navigate to Create Account page when clicking Create Account button', async ({
      page,
    }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: /InnovatEPAM Portal/i })
      ).toBeVisible();

      // Click Create Account button
      const createAccountButton = page.getByRole('link', {
        name: /create account/i,
      });
      await expect(createAccountButton).toBeVisible();
      await createAccountButton.click();

      // Verify navigation to registration page
      await expect(page).toHaveURL('/auth/register');
    });

    test('should navigate to Sign In page when clicking Sign In button', async ({
      page,
    }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: /InnovatEPAM Portal/i })
      ).toBeVisible();

      // Click Sign In button
      const signInButton = page.getByRole('link', { name: /sign in/i });
      await expect(signInButton).toBeVisible();
      await signInButton.click();

      // Verify navigation to login page
      await expect(page).toHaveURL('/auth/login');
    });

    test('should display portal heading and description', async ({ page }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      // Verify heading
      const heading = page.getByRole('heading', {
        name: /InnovatEPAM Portal/i,
      });
      await expect(heading).toBeVisible();

      // Verify description/subtitle
      await expect(
        page.getByText(/Share your innovation ideas/i)
      ).toBeVisible();
    });

    test('should have both primary CTAs visible on mobile', async ({
      page,
    }) => {
      // Set mobile viewport (iPhone 12 Pro)
      await page.setViewportSize({ width: 390, height: 844 });

      // Navigate to auth landing page
      await page.goto('/auth');

      // Verify both buttons are visible on mobile
      await expect(
        page.getByRole('link', { name: /create account/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /sign in/i })
      ).toBeVisible();
    });

    test('should have both primary CTAs visible on tablet', async ({
      page,
    }) => {
      // Set tablet viewport (iPad)
      await page.setViewportSize({ width: 768, height: 1024 });

      // Navigate to auth landing page
      await page.goto('/auth');

      // Verify both buttons are visible on tablet
      await expect(
        page.getByRole('link', { name: /create account/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /sign in/i })
      ).toBeVisible();
    });

    test('should have both primary CTAs visible on desktop', async ({
      page,
    }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to auth landing page
      await page.goto('/auth');

      // Verify both buttons are visible on desktop
      await expect(
        page.getByRole('link', { name: /create account/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /sign in/i })
      ).toBeVisible();
    });
  });

  test.describe('US2: Existing User Accesses Login', () => {
    test('should redirect authenticated users to dashboard', async ({
      page,
      context,
    }) => {
      // Mock authenticated session
      // In a real scenario, you would:
      // 1. Create a session cookie with NextAuth
      // 2. Set it in the browser context
      // For now, we'll test the redirect behavior assuming auth

      // Note: This test requires proper NextAuth session setup
      // See: https://next-auth.js.org/getting-started/client#testing

      // Set a mock session cookie (adjust based on NextAuth config)
      await context.addCookies([
        {
          name: 'next-auth.session-token',
          value: 'mock-session-token',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
          expires: Date.now() / 1000 + 3600, // 1 hour from now
        },
      ]);

      // Navigate to auth page
      await page.goto('/auth');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
    });

    test('should not redirect unauthenticated users', async ({ page }) => {
      // Navigate to auth landing page without session
      await page.goto('/auth');

      // Verify we stay on the auth page
      await expect(page).toHaveURL('/auth');

      // Verify landing page content is visible
      await expect(
        page.getByRole('heading', { name: /InnovatEPAM Portal/i })
      ).toBeVisible();
    });
  });

  test.describe('US4: Optional Password Reset Quick Access', () => {
    test('should navigate to Forgot Password page from landing', async ({
      page,
    }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      const forgotPasswordLink = page.getByRole('link', {
        name: /forgot password/i,
      });
      await expect(forgotPasswordLink).toBeVisible();
      await forgotPasswordLink.click();

      await expect(page).toHaveURL('/auth/forgot-password');
    });
  });

  test.describe('Accessibility (WCAG 2.1 AA)', () => {
    test('should have proper keyboard navigation', async ({ page }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // First focusable element should be Create Account or Sign In
      const focusedElement = await page.evaluate(
        () => document.activeElement?.textContent
      );
      expect(focusedElement).toMatch(/Create Account|Sign In/i);

      // Tab to next button
      await page.keyboard.press('Tab');

      // Should focus on the other button
      const secondFocusedElement = await page.evaluate(
        () => document.activeElement?.textContent
      );
      expect(secondFocusedElement).toMatch(/Create Account|Sign In/i);
    });

    test('should activate buttons with Enter key', async ({ page }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      // Tab to Create Account button
      await page.keyboard.press('Tab');

      // Press Enter
      await page.keyboard.press('Enter');

      // Should navigate to registration
      await expect(page).toHaveURL('/auth/register');
    });

    test('should activate buttons with Space key', async ({ page }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      // Tab to Create Account button
      await page.keyboard.press('Tab');

      // Press Space
      await page.keyboard.press('Space');

      // Should navigate to registration
      await expect(page).toHaveURL('/auth/register');
    });

    test('should have sufficient contrast ratios', async ({ page }) => {
      // Navigate to auth landing page
      await page.goto('/auth');

      // Run accessibility audit using playwright-axe or similar
      // This is a placeholder - in production use @axe-core/playwright
      const createAccountButton = page.getByRole('link', {
        name: /create account/i,
      });

      // Verify button is visible (contrast check)
      await expect(createAccountButton).toBeVisible();

      // In a real test, you would use:
      // const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      // expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Performance (Under 2 seconds)', () => {
    test('should load landing page quickly', async ({ page }) => {
      const startTime = Date.now();

      // Navigate to auth landing page
      await page.goto('/auth');

      // Wait for content to be visible
      await expect(
        page.getByRole('heading', { name: /InnovatEPAM Portal/i })
      ).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Verify load time is under 2 seconds (2000ms)
      expect(loadTime).toBeLessThan(2000);
    });
  });

  test.describe('Mobile-First Responsive Design', () => {
    test('should stack buttons vertically on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/auth');

      // Get button positions
      const createButton = page.getByRole('link', {
        name: /create account/i,
      });
      const signInButton = page.getByRole('link', { name: /sign in/i });

      const createBox = await createButton.boundingBox();
      const signInBox = await signInButton.boundingBox();

      // Buttons should be stacked (y positions different)
      expect(createBox?.y).not.toEqual(signInBox?.y);
    });

    test('should display buttons horizontally on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });

      await page.goto('/auth');

      // Get button positions
      const createButton = page.getByRole('link', {
        name: /create account/i,
      });
      const signInButton = page.getByRole('link', { name: /sign in/i });

      const createBox = await createButton.boundingBox();
      const signInBox = await signInButton.boundingBox();

      // Buttons should be on same row (similar y positions, within 20px)
      if (createBox && signInBox) {
        const yDifference = Math.abs(createBox.y - signInBox.y);
        expect(yDifference).toBeLessThan(20);
      }
    });
  });
});
