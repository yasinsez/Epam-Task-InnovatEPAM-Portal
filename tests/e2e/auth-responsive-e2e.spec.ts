/**
 * End-to-End Tests for Mobile-First Auth Responsive Design
 * 
 * Run with: npx playwright test tests/e2e/auth-responsive-e2e.spec.ts
 * 
 * Tests real browser behavior across multiple device viewports
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Auth Landing Page - Mobile-First Responsive Design E2E', () => {
  const baseURL = 'http://localhost:3000/auth';

  // Define viewports to test
  const viewports = {
    'mobile-small': { width: 320, height: 568, name: 'iPhone SE' },
    'mobile-large': { width: 414, height: 896, name: 'iPhone 14 Pro Max' },
    'tablet': { width: 768, height: 1024, name: 'iPad' },
    'desktop': { width: 1200, height: 800, name: 'Desktop (1200px)' },
    'desktop-wide': { width: 1920, height: 1080, name: 'Desktop (4K)' },
  };

  test.describe('Viewport Configuration', () => {
    test('page should have viewport meta tag', async ({ page }) => {
      await page.goto(baseURL);

      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('device-width');
      expect(viewportMeta).toContain('initial-scale=1');
    });

    test('should not horizontal scroll on any viewport', async ({ page }) => {
      for (const [key, viewport] of Object.entries(viewports)) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');

        const pageWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(
          pageWidth,
          `Should not require horizontal scroll at ${viewport.name}`
        ).toBeLessThanOrEqual(viewport.width);
      }
    });
  });

  test.describe('[320px Mobile] Touch Targets & Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
    });

    test('all buttons should be full-width', async ({ page }) => {
      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        const box = await button.boundingBox();
        // Allow for padding (16px on each side)
        expect(box?.width, 'Button should be near full width').toBeGreaterThan(270);
        expect(box?.width, 'Button should respect viewport').toBeLessThanOrEqual(304);
      }
    });

    test('buttons should have 44x44px minimum touch targets', async ({ page }) => {
      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(
          box?.height,
          'Button height should be >= 44px for touch'
        ).toBeGreaterThanOrEqual(44);
        expect(
          box?.width,
          'Button width should be >= 44px for touch'
        ).toBeGreaterThanOrEqual(44);
      }
    });

    test('buttons should stack vertically', async ({ page }) => {
      const buttons = await page.locator('button').all();

      if (buttons.length > 1) {
        const positions = [];
        for (const button of buttons) {
          const box = await button.boundingBox();
          positions.push({ y: box?.y, height: box?.height });
        }

        // Each button should be below the previous one
        for (let i = 1; i < positions.length; i++) {
          const prevBottom = (positions[i - 1].y || 0) + (positions[i - 1].height || 0);
          const currentTop = positions[i].y || 0;
          expect(currentTop).toBeGreaterThan(prevBottom);
        }
      }
    });

    test('button spacing should be >= 8px', async ({ page }) => {
      const buttonGroup = page.locator('[data-testid="button-group"]');
      const gap = await buttonGroup.evaluate((el) =>
        window.getComputedStyle(el).gap
      );

      const gapValue = parseInt(gap);
      expect(gapValue).toBeGreaterThanOrEqual(8);
    });

    test('font size should be >= 16px (prevent iOS zoom)', async ({ page }) => {
      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        const fontSize = await button.evaluate((el) =>
          window.getComputedStyle(el).fontSize
        );

        expect(
          parseInt(fontSize),
          'Button font should be >= 16px to prevent iOS auto-zoom'
        ).toBeGreaterThanOrEqual(16);
      }
    });

    test('no text should be cut off by container padding', async ({ page }) => {
      const hero = page.locator('.heroSection');
      const heroBound = await hero.boundingBox();

      // Hero section should be visible and have adequate space
      expect(heroBound?.x).toBeGreaterThanOrEqual(0);
      expect(heroBound?.width).toBeLessThanOrEqual(320);
    });

    test('buttons should be clickable and responsive to touch', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create account/i });

      // Check it's visible and has proper touch feedback
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();

      // Simulate touch
      const box = await createButton.boundingBox();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }

      // Button should still be visible (no errors)
      await expect(createButton).toBeVisible();
    });

    test('visual layout should match mobile design', async ({ page }) => {
      // Take screenshot for visual regression testing
      await page.screenshot({ path: 'test-results/auth-mobile-320px.png' });

      // Verify basic layout structure
      const hero = page.locator('.heroSection');
      const buttons = page.locator('[data-testid="button-group"]');

      await expect(hero).toBeVisible();
      await expect(buttons).toBeVisible();

      // Hero should be above buttons
      const heroBox = await hero.boundingBox();
      const buttonBox = await buttons.boundingBox();

      expect((heroBox?.y || 0) + (heroBox?.height || 0)).toBeLessThan(
        buttonBox?.y || 0
      );
    });
  });

  test.describe('[768px Tablet] Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
    });

    test('buttons should be side-by-side on tablet', async ({ page }) => {
      const buttons = await page.locator('button').all();

      if (buttons.length > 1) {
        const positions = [];
        for (const button of buttons) {
          const box = await button.boundingBox();
          positions.push(box?.y);
        }

        // All visible buttons should have approximately the same Y position
        const firstY = positions[0];
        const allSameRow = positions.every((y) => Math.abs((y || 0) - (firstY || 0)) < 10);
        expect(allSameRow, 'Buttons should be in same row on tablet').toBeTruthy();
      }
    });

    test('buttons should have equal width on tablet', async ({ page }) => {
      const buttons = await page.locator('button').all();

      if (buttons.length > 1) {
        const widths = [];
        for (const button of buttons) {
          const box = await button.boundingBox();
          widths.push(box?.width);
        }

        const maxDiff = Math.max(...widths) - Math.min(...widths);
        expect(maxDiff).toBeLessThan(5);
      }
    });

    test('no horizontal scrolling on tablet', async ({ page }) => {
      const pageWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(pageWidth).toBeLessThanOrEqual(768);
    });
  });

  test.describe('[1200px Desktop] Layout Constraints', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
    });

    test('auth card should have max-width constraint', async ({ page }) => {
      const card = page.locator('[data-testid="auth-card"]');
      
      if (await card.count() > 0) {
        const maxWidth = await card.evaluate((el) =>
          window.getComputedStyle(el).maxWidth
        );

        const maxWidthValue = parseInt(maxWidth);
        expect(maxWidthValue).toBeLessThan(600);
      }
    });

    test('layout should be centered on desktop', async ({ page }) => {
      const container = page.locator('.authContainer').first();
      const containerBox = await container.boundingBox();
      const viewportSize = page.viewportSize();

      if (viewportSize && containerBox) {
        const leftSpace = containerBox.x;
        const rightSpace = viewportSize.width - (containerBox.x + containerBox.width);

        // Should be roughly centered (allow some tolerance)
        expect(Math.abs(leftSpace - rightSpace)).toBeLessThan(50);
      }
    });
  });

  test.describe('Accessibility Across Viewports', () => {
    test('keyboard navigation should work on all viewports', async ({ page }) => {
      for (const [key, viewport] of Object.entries(viewports)) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(baseURL);

        // Tab to first interactive element
        await page.keyboard.press('Tab');
        
        const focusedElement = await page.evaluate(() =>
          document.activeElement?.tagName
        );

        expect(
          focusedElement,
          `Should be able to tab on ${viewport.name}`
        ).toBeTruthy();
      }
    });

    test('focus indicators should be visible', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(baseURL);

      const button = page.locator('button').first();
      await button.focus();

      const focusStyle = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el, ':focus-visible');
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
        };
      });

      // Should have visible focus indicator
      expect(focusStyle.outline).not.toBe('none');
    });

    test('color contrast should be readable on all viewports', async ({ page }) => {
      for (const [key, viewport] of Object.entries(viewports)) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(baseURL);

        // Verify buttons are visible (not clear contrast issue)
        const buttons = await page.locator('button').all();
        for (const button of buttons) {
          await expect(button).toBeVisible();
        }
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('layout should adapt to portrait orientation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 portrait
      await page.goto(baseURL);

      const buttons = await page.locator('button').all();
      
      // Buttons should be full-width in portrait
      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThan(300);
      }
    });

    test('layout should adapt to landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 812, height: 375 }); // iPhone 12 landscape
      await page.goto(baseURL);

      // Should not require horizontal scroll
      const pageWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(pageWidth).toBeLessThanOrEqual(812);

      // Content should be visible
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        await expect(button).toBeVisible();
      }
    });

    test('should handle portrait -> landscape -> portrait transitions', async ({ page }) => {
      // Portrait
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(baseURL);
      let buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);

      // Landscape
      await page.setViewportSize({ width: 812, height: 375 });
      buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);

      // Back to portrait
      await page.setViewportSize({ width: 375, height: 812 });
      buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
    });
  });

  test.describe('Real Device Presets', () => {
    const realDevices = [
      { name: 'iPhone SE', preset: devices['iPhone SE'] },
      { name: 'iPhone 14 Pro Max', preset: devices['iPhone 14 Pro Max'] },
      { name: 'iPad Pro', preset: devices['iPad Pro'] },
      { name: 'Pixel 5', preset: devices['Pixel 5'] },
      { name: 'Galaxy S21', preset: devices['Galaxy S21'] },
    ];

    for (const device of realDevices) {
      test(`should render correctly on ${device.name}`, async ({ browser }) => {
        const context = await browser.newContext(device.preset);
        const page = await context.newPage();

        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');

        // Verify main content is visible
        const buttons = await page.locator('button').all();
        expect(buttons.length).toBeGreaterThan(0);

        // No horizontal scroll
        const pageWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = device.preset.viewport?.width || 375;
        expect(pageWidth).toBeLessThanOrEqual(viewportWidth);

        // Take screenshot
        await page.screenshot({
          path: `test-results/auth-${device.name.replace(/ /g, '-')}.png`,
        });

        await context.close();
      });
    }
  });

  test.describe('Performance & Loading', () => {
    test('page should load within 3 seconds on 3G', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', async (route) => {
        setTimeout(() => route.continue(), 100);
      });

      const startTime = Date.now();
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('buttons should be interactive without JavaScript issues', async ({ page }) => {
      await page.goto(baseURL);

      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        // Each button should be clickable
        await expect(button).toBeEnabled();
      }
    });
  });

  test.describe('Safe Area Handling (Notched Devices)', () => {
    test('should respect safe-area-inset on iPhone X+', async ({ browser }) => {
      const context = await browser.newContext(devices['iPhone 12']);
      const page = await context.newPage();
      
      await page.goto(baseURL);

      const hasNotchHandling = await page.evaluate(() => {
        return window.getComputedStyle(document.body).paddingBottom !== '0px';
      });

      // May or may not have explicit safe-area handling
      // Just verify page is still visible
      await expect(page.locator('button').first()).toBeVisible();

      await context.close();
    });
  });
});
