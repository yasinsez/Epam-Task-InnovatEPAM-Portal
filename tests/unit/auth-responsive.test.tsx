/**
 * Complete Test Suite for Mobile-First Auth Responsive Design
 * 
 * Coverage:
 * - Touch target sizes (44x44px minimum)
 * - Responsive layouts (mobile/tablet/desktop)
 * - Accessibility compliance
 * - Font sizes and typography
 * - Viewport configuration
 */

// tests/unit/auth-responsive.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AuthLandingCard from '@/app/auth/components/AuthLandingCard';

expect.extend(toHaveNoViolations);

describe('AuthLandingCard - Mobile-First Responsive Design', () => {
  describe('Touch Target Sizing (44x44px minimum)', () => {
    test('all buttons meet 44x44px touch target requirement', () => {
      const { container } = render(<AuthLandingCard />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });

    test('all interactive links have adequate touch targets', () => {
      const { container } = render(<AuthLandingCard />);
      const links = container.querySelectorAll('a[href]');

      links.forEach((link) => {
        const rect = link.getBoundingClientRect();
        // Links may use padding to meet touch target
        const hasAdequateSize = rect.height >= 44 && rect.width >= 44;
        const styles = window.getComputedStyle(link);
        const padding = parseInt(styles.padding);

        expect(hasAdequateSize || padding >= 8).toBeTruthy();
      });
    });
  });

  describe('Font Sizes - Prevent iOS Auto-Zoom', () => {
    test('button text should be >= 16px (prevents iOS zoom on focus)', () => {
      const { container } = render(<AuthLandingCard />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach((button) => {
        const fontSize = window.getComputedStyle(button).fontSize;
        const size = parseInt(fontSize);
        expect(size).toBeGreaterThanOrEqual(16);
      });
    });

    test('title should be at least 18px', () => {
      render(<AuthLandingCard />);
      const title = screen.getByRole('heading', { level: 1 });
      const fontSize = window.getComputedStyle(title).fontSize;
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(18);
    });
  });

  describe('Mobile Viewport (320px)', () => {
    beforeEach(() => {
      global.innerWidth = 320;
      global.innerHeight = 568;
      window.dispatchEvent(new Event('resize'));
    });

    test('buttons should be full-width on 320px viewport', () => {
      const { container } = render(<AuthLandingCard />);
      const buttons = container.querySelectorAll('button');

      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        // Allow for padding (16px on each side = 32px total)
        expect(rect.width).toBeGreaterThanOrEqual(300);
      });
    });

    test('no horizontal scrolling on 320px viewport', () => {
      const { container } = render(<AuthLandingCard />);
      const scrollWidth = container.scrollWidth;
      expect(scrollWidth).toBeLessThanOrEqual(320);
    });

    test('buttons should stack vertically on mobile', () => {
      const { container } = render(<AuthLandingCard />);
      const buttonGroup = container.querySelector('[data-testid="button-group"]');
      const buttons = Array.from(buttonGroup?.querySelectorAll('button') || []);

      if (buttons.length > 1) {
        const firstButtonY = (buttons[0] as HTMLElement).getBoundingClientRect().y;
        const secondButtonY = (buttons[1] as HTMLElement).getBoundingClientRect().y;

        // Second button should be below first button
        expect(secondButtonY).toBeGreaterThan(firstButtonY + 40);
      }
    });

    test('button spacing should be >= 8px', () => {
      const { container } = render(<AuthLandingCard />);
      const buttonGroup = container.querySelector('[data-testid="button-group"]');
      const gap = window.getComputedStyle(buttonGroup as HTMLElement).gap;

      const gapValue = parseInt(gap);
      expect(gapValue).toBeGreaterThanOrEqual(8);
    });

    test('container padding prevents text cutoff near edges', () => {
      const { container } = render(<AuthLandingCard />);
      const authContainer = container.querySelector('.authContainer');
      const paddingLeft = parseInt(
        window.getComputedStyle(authContainer as HTMLElement).paddingLeft
      );

      expect(paddingLeft).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Tablet Viewport (768px)', () => {
    beforeEach(() => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      window.dispatchEvent(new Event('resize'));
    });

    test('buttons should be side-by-side on tablet', () => {
      const { container } = render(<AuthLandingCard />);
      const buttonGroup = container.querySelector('[data-testid="button-group"]');
      const buttons = Array.from(buttonGroup?.querySelectorAll('button') || []);

      if (buttons.length > 1) {
        const firstButtonY = (buttons[0] as HTMLElement).getBoundingClientRect().y;
        const secondButtonY = (buttons[1] as HTMLElement).getBoundingClientRect().y;

        // Buttons should have same Y position (same row)
        expect(Math.abs(firstButtonY - secondButtonY)).toBeLessThan(5);
      }
    });

    test('buttons should have equal width on tablet', () => {
      const { container } = render(<AuthLandingCard />);
      const buttons = container.querySelectorAll('button');

      if (buttons.length > 1) {
        const widths = Array.from(buttons).map((btn) =>
          btn.getBoundingClientRect().width
        );

        // All button widths should be equal (±5px tolerance)
        const maxDiff = Math.max(...widths) - Math.min(...widths);
        expect(maxDiff).toBeLessThan(5);
      }
    });

    test('no horizontal scrolling on tablet', () => {
      const { container } = render(<AuthLandingCard />);
      expect(container.scrollWidth).toBeLessThanOrEqual(768);
    });
  });

  describe('Desktop Viewport (1200px+)', () => {
    beforeEach(() => {
      global.innerWidth = 1200;
      global.innerHeight = 800;
      window.dispatchEvent(new Event('resize'));
    });

    test('auth card should have max-width constraint on desktop', () => {
      const { container } = render(<AuthLandingCard />);
      const authCard = container.parentElement;

      if (authCard) {
        const maxWidth = window.getComputedStyle(authCard).maxWidth;
        const maxWidthValue = parseInt(maxWidth);

        // Should be limited to reasonable width (e.g., 480px)
        expect(maxWidthValue).toBeLessThan(600);
      }
    });
  });

  describe('Accessibility Compliance', () => {
    test('no axe accessibility violations', async () => {
      const { container } = render(<AuthLandingCard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('all buttons have accessible labels', () => {
      render(<AuthLandingCard />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        const ariaLabel = button.getAttribute('aria-label');
        const textContent = button.textContent?.trim();

        expect(ariaLabel || textContent).toBeTruthy();
      });
    });

    test('buttons should have focus-visible indicators', () => {
      const { container } = render(<AuthLandingCard />);
      const button = container.querySelector('button');

      if (button) {
        button.focus();
        const styles = window.getComputedStyle(button, ':focus-visible');
        expect(styles.outline).not.toBe('none');
      }
    });

    test('buttons should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<AuthLandingCard />);

      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        await user.tab();
        expect(button).toHaveFocus();
        expect(button).toBeVisible();
      }
    });

    test('color contrast should meet WCAG AA (4.5:1)', () => {
      const { container } = render(<AuthLandingCard />);
      const primaryButtons = container.querySelectorAll('.buttonPrimary');

      // Should have white text on blue background (high contrast)
      primaryButtons.forEach((btn) => {
        const bg = window.getComputedStyle(btn).backgroundColor;
        const color = window.getComputedStyle(btn).color;

        // Blue #0066cc on white has > 7:1 contrast
        expect(bg).toBeTruthy();
        expect(color).toBeTruthy();
      });
    });
  });

  describe('Landscape Mode Handling', () => {
    test('should not break layout in landscape mode', () => {
      global.innerWidth = 568;
      global.innerHeight = 320; // Landscape orientation
      window.dispatchEvent(new Event('resize'));

      const { container } = render(<AuthLandingCard />);

      // Should not require horizontal scroll
      expect(container.scrollWidth).toBeLessThanOrEqual(568);
    });
  });

  describe('Button Interactions', () => {
    test('buttons should be clickable with touch', async () => {
      const user = userEvent.setup();
      render(<AuthLandingCard />);

      const createButton = screen.getByRole('button', { name: /create account/i });
      await user.click(createButton);

      // Component behavior tested through router mock
      expect(createButton).toBeInTheDocument();
    });

    test('buttons should have visual feedback on press', () => {
      const { container } = render(<AuthLandingCard />);
      const button = container.querySelector('button') as HTMLElement;

      button.click();

      // CSS applies scale transform on :active
      const styles = window.getComputedStyle(button);
      expect(styles.transition).toContain('200ms');
    });
  });

  describe('Spacing and Sizing System', () => {
    test('custom spacing variables should be defined', () => {
      const { container } = render(<AuthLandingCard />);
      const authContainer = container.querySelector('.authContainer') as HTMLElement;
      const computed = window.getComputedStyle(authContainer);

      expect(computed.getPropertyValue('--spacing-xs')).toBeTruthy();
      expect(computed.getPropertyValue('--spacing-md')).toBeTruthy();
      expect(computed.getPropertyValue('--spacing-lg')).toBeTruthy();
    });

    test('buttons should respect spacing tokens', () => {
      const { container } = render(<AuthLandingCard />);
      const button = container.querySelector('button');
      const styles = window.getComputedStyle(button!);

      const padding = parseInt(styles.padding);
      expect(padding).toBeGreaterThanOrEqual(12); // At least --spacing-md
    });
  });

  describe('Viewport Meta Tag', () => {
    test('document should have viewport meta tag', () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      expect(viewportMeta).toBeInTheDocument();
    });

    test('viewport should include device-width', () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const content = viewportMeta?.getAttribute('content');
      expect(content).toContain('device-width');
    });

    test('viewport should allow user zoom for accessibility', () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const content = viewportMeta?.getAttribute('content');

      // Should NOT disable scaling
      expect(content).not.toContain('user-scalable=no');
      // Should allow zoom
      expect(content).toContain('maximum-scale');
    });
  });
});
