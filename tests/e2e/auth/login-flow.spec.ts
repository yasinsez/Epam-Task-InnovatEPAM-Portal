/**
 * E2E Tests for Login Flow
 *
 * Tests login with mock credentials (development only).
 */
import { test, expect } from '@playwright/test';

const MOCK_CREDENTIALS = {
  admin: { email: 'admin@epam.com', password: 'Admin@12345' },
  submitter: { email: 'submitter@epam.com', password: 'Submitter@12345' },
  evaluator: { email: 'evaluator@epam.com', password: 'Evaluator@12345' },
} as const;

test.describe('Login Flow', () => {
  test('should log in with admin credentials and reach dashboard', async ({
    page,
  }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

    await page.getByLabel(/email/i).fill(MOCK_CREDENTIALS.admin.email);
    await page.getByLabel(/password/i).fill(MOCK_CREDENTIALS.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should log in with submitter credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill(MOCK_CREDENTIALS.submitter.email);
    await page.getByLabel(/password/i).fill(MOCK_CREDENTIALS.submitter.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/submitter/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('WrongPass123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(
      page.getByText(/invalid email or password/i),
    ).toBeVisible({ timeout: 5000 });
  });
});
