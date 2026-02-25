# Mobile-First Responsive Design Patterns for Authentication Flows

**Research Date**: February 25, 2026  
**Focus**: 320px–1200px+ responsive authentication UX  
**Standards**: WCAG 2.1 AA, ARIA, Mobile Web Best Practices

---

## 1. Viewport Meta Tag Configuration

### Optimal Viewport Meta Tag Setup

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=5.0">
```

**Configuration Breakdown**:

| Property | Value | Purpose |
|----------|-------|---------|
| `width=device-width` | Responsive | Tells browser to use device's actual width, not desktop viewport |
| `initial-scale=1.0` | 1:1 ratio | Prevents zoomed-in defaults on older devices |
| `viewport-fit=cover` | Safe area | Respects notches on iPhone/Android devices |
| `maximum-scale=5.0` | User zoom | Allows accessibility zoom while preventing excessive pinch |
| **Avoid** | `user-scalable=no` | ⚠️ Disables accessibility zoom - never use this |

### Next.js Implementation

In `src/app/layout.tsx`:

```tsx
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover',
  maximumScale: 5.0,
};

export const metadata: Metadata = {
  title: 'InnovatEPAM Portal',
  description: 'Innovation management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Optional: Prevent zoom on input focus for iOS */}
        <style>{`
          @supports (padding: max(0px)) {
            body {
              padding-left: max(0px, env(safe-area-inset-left));
              padding-right: max(0px, env(safe-area-inset-right));
              padding-bottom: max(0px, env(safe-area-inset-bottom));
            }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Safe Area Handling for Notched Devices

```css
/* For devices with notches (iPhone X+, Android) */
.auth-container {
  padding-top: max(1rem, env(safe-area-inset-top));
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}
```

---

## 2. Touch Target Sizing (Mobile 44x44px Minimum)

### WCAG 2.5.5 Target Size Standards

| Viewport | Minimum Touch Target | Spacing Between | Industry Standard |
|----------|---------------------|------------------|------------------|
| **Mobile (320-620px)** | 44x44px | 8px | Apple HIG, Android Material |
| **Tablet (621-1024px)** | 48x48px | 10px | Enhanced for larger screens |
| **Desktop (1025px+)** | 40x40px | 6px | Can be smaller due to precision |

### CSS Implementation Pattern

```css
/* Base button token - 44x44px minimum for mobile */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
  font-size: 16px; /* Prevents iOS zoom on input focus */
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 200ms ease;

  /* Ensure adequate spacing */
  margin: 12px; /* Provides 24px gap between buttons */
}

/* Touch-friendly spacing for mobile */
@media (max-width: 620px) {
  .button {
    min-height: 44px;
    min-width: 44px;
    padding: 14px 28px;
    font-size: 16px; /* Critical: prevents iOS auto-zoom */
    width: 100%; /* Full width on mobile for easier tapping */
    text-align: center;
  }

  .button + .button {
    margin-top: 8px; /* Vertical spacing between stacked buttons */
  }
}

/* Tablet optimization */
@media (min-width: 621px) and (max-width: 1024px) {
  .button {
    min-height: 48px;
    min-width: 48px;
    padding: 16px 32px;
    margin: 14px;
  }
}

/* Desktop - can be smaller due to mouse precision */
@media (min-width: 1025px) {
  .button {
    min-height: 40px;
    min-width: 100px;
    padding: 10px 20px;
    font-size: 15px;
    width: auto;
    margin: 8px;
  }
}
```

### Hover/Active State for Touch Feedback

```css
.button {
  /* Active/pressed state for touch feedback */
  &:active {
    transform: scale(0.98);
    background-color: var(--button-active-bg);
  }

  /* Focus state for keyboard navigation */
  &:focus-visible {
    outline: 3px solid var(--focus-color);
    outline-offset: 2px;
  }

  /* Hover state for devices that support it */
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      opacity: 0.9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  /* Disable hover on touch devices */
  @media (hover: none) and (pointer: coarse) {
    &:hover {
      opacity: 1;
      box-shadow: none;
    }
  }
}
```

---

## 3. Button Layout and Spacing for 320px Mobile Viewports

### 320px Constraint Challenges and Solutions

**Physical constraints**: 
- 320px width = 288px available with 16px padding on sides
- Most buttons need 44px height
- Maximum 1 button per row

### Mobile-First Layout Pattern

```css
/* === MOBILE-FIRST APPROACH (320px) === */
.auth-form-container {
  width: 100%;
  max-width: 100%;
  padding: 0 16px;
  margin: 0;
}

.button-group {
  display: flex;
  flex-direction: column; /* Stack vertically on mobile */
  gap: 12px; /* 12px gap between buttons */
  width: 100%;
}

.button {
  width: 100%; /* Full width on mobile */
  min-height: 44px;
  padding: 12px 16px;
  font-size: 16px;
}

.button.primary {
  background-color: #0066cc;
  color: white;
  font-weight: 600;
}

.button.secondary {
  background-color: #f0f0f0;
  color: #212121;
  border: 1px solid #e0e0e0;
  font-weight: 600;
}

/* === LANDSCAPE MODE (Mobile): Adjust for taller aspect ratio === */
@media (max-height: 500px) and (orientation: landscape) {
  .button {
    min-height: 40px; /* Slightly reduced on landscape */
    padding: 10px 16px;
    font-size: 14px;
  }

  .button-group {
    gap: 8px; /* Tighter spacing */
  }
}

/* === TABLET (768px+): Side-by-side buttons === */
@media (min-width: 768px) {
  .button-group {
    flex-direction: row; /* Buttons in a row */
    gap: 16px;
  }

  .button {
    flex: 1; /* Equal width buttons */
    width: auto;
  }
}

/* === DESKTOP (1024px+): Centered, fixed width === */
@media (min-width: 1024px) {
  .auth-form-container {
    max-width: 480px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .button-group {
    gap: 20px;
  }
}
```

### Real-World 320px Layout Example

```tsx
// src/app/auth/page.tsx
export default function AuthLandingPage() {
  return (
    <div className="auth-page">
      {/* Hero Section */}
      <section className="auth-hero">
        <h1 className="auth-title">InnovatEPAM</h1>
        <p className="auth-subtitle">
          Innovation management platform for enterprise collaboration
        </p>
      </section>

      {/* CTA Buttons */}
      <div className="button-group">
        <button className="button primary" onClick={() => router.push('/auth/register')}>
          Create Account
        </button>
        <button className="button secondary" onClick={() => router.push('/auth/login')}>
          Sign In
        </button>
        <Link href="/auth/forgot-password" className="button-link">
          Forgot Password?
        </Link>
      </div>
    </div>
  );
}
```

### Spacing Values for 320px Constraint

```css
/* Spacing scale optimized for 320px */
:root {
  --spacing-xs: 4px;      /* 1/4 rem */
  --spacing-sm: 8px;      /* 0.5 rem */
  --spacing-md: 12px;     /* 0.75 rem - default button gap */
  --spacing-lg: 16px;     /* 1 rem - container padding */
  --spacing-xl: 24px;     /* 1.5 rem - section spacing */
  --spacing-2xl: 32px;    /* 2 rem - large sections */

  /* 320px mobile: use smaller spacing */
  @media (max-width: 620px) {
    --spacing-section-vertical: var(--spacing-xl);  /* 24px top/bottom */
    --spacing-button-gap: var(--spacing-md);        /* 12px between buttons */
    --spacing-container-padding: var(--spacing-lg); /* 16px sides */
  }

  /* Tablet: medium spacing */
  @media (min-width: 621px) and (max-width: 1024px) {
    --spacing-section-vertical: var(--spacing-2xl); /* 32px */
    --spacing-button-gap: var(--spacing-lg);        /* 16px */
    --spacing-container-padding: var(--spacing-lg);
  }

  /* Desktop: can use more spacing */
  @media (min-width: 1025px) {
    --spacing-section-vertical: 48px;
    --spacing-button-gap: 20px;
    --spacing-container-padding: 20px;
  }
}

.auth-container {
  padding: 0 var(--spacing-container-padding);
  margin-bottom: var(--spacing-section-vertical);
}

.button-group {
  gap: var(--spacing-button-gap);
}
```

---

## 4. CSS Grid/Flexbox Patterns for Responsive CTA Layouts

### Pattern 1: Vertical Stack (Mobile) to Horizontal (Desktop)

```css
/* Mobile-first: Flexbox for simplicity */
.cta-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

@media (min-width: 768px) {
  .cta-buttons {
    flex-direction: row;
    gap: 16px;
    justify-content: space-between;
  }

  .cta-buttons > button {
    flex: 1;
  }
}
```

### Pattern 2: Grid-Based CTA Layout (Advanced)

```css
/* CSS Grid alternative - better for multi-action layouts */
.auth-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
}

/* Two columns on tablet+ */
@media (min-width: 768px) {
  .auth-layout {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

/* Three columns on desktop */
@media (min-width: 1024px) {
  .auth-layout {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

/* Make certain buttons span multiple columns if needed */
.auth-layout > .primary-button {
  grid-column: 1 / -1; /* Full width on mobile */
}

@media (min-width: 768px) {
  .auth-layout > .primary-button {
    grid-column: 1 / 2; /* Normal width on tablet+ */
  }
}
```

### Pattern 3: Centered Container with Max Width

```css
/* Recommended for auth pages - clean, centered layout */
.auth-page {
  display: flex;
  min-height: 100svh; /* 100% of viewport height, accounting for address bar */
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  padding: var(--spacing-lg);
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 620px) {
  .auth-page {
    padding: 0; /* Full bleed on very small screens */
  }

  .auth-card {
    border-radius: 0;
    min-height: 100svh;
  }
}
```

### Pattern 4: Flexbox with Wrapping

```css
/* For layouts with multiple CTAs that may wrap */
.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center; /* Center on mobile */
  align-items: center;
}

.button-container > button {
  min-width: 160px; /* Minimum button width */
  flex-grow: 1; /* Grow equally */
  max-width: calc(50% - 4px); /* Max 2 buttons per row */
}

@media (min-width: 768px) {
  .button-container {
    justify-content: flex-start; /* Left-align on desktop */
    gap: 12px;
  }

  .button-container > button {
    flex-grow: 0; /* Don't grow on desktop */
    max-width: none;
  }
}
```

### Complete Responsive Auth Component

```tsx
// src/app/auth/page.tsx
import styles from './auth.module.css';

export default function AuthPage() {
  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <h1 className={styles.title}>InnovatEPAM Portal</h1>
          <p className={styles.subtitle}>
            Enterprise innovation management platform
          </p>
        </section>

        {/* Primary CTA */}
        <div className={styles.ctaButtons}>
          <button className={`${styles.button} ${styles.primary}`}>
            Create Account
          </button>
          <button className={`${styles.button} ${styles.secondary}`}>
            Sign In
          </button>
        </div>

        {/* Secondary Links */}
        <div className={styles.secondaryLinks}>
          <a href="/auth/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}
```

```css
/* src/app/auth/auth.module.css */
.authPage {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
}

.authCard {
  width: 100%;
  max-width: 480px;
  padding: 2rem 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 620px) {
  .authCard {
    padding: 1.5rem 1rem;
    border-radius: 0;
    max-width: 100%;
  }
}

.heroSection {
  margin-bottom: 2rem;
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #212121;
}

@media (max-width: 620px) {
  .title {
    font-size: 24px;
  }
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* CTA Button Group */
.ctaButtons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1.5rem;
}

@media (min-width: 621px) {
  .ctaButtons {
    flex-direction: row;
    gap: 12px;
  }

  .ctaButtons > button {
    flex: 1;
  }
}

/* Button Styles */
.button {
  min-height: 44px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
  width: 100%;
}

@media (min-width: 621px) {
  .button {
    width: auto;
  }
}

.button.primary {
  background-color: #0066cc;
  color: white;
}

.button.primary:active {
  transform: scale(0.98);
  background-color: #0052a3;
}

.button.primary:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

.button.secondary {
  background-color: #f0f0f0;
  color: #212121;
  border: 1px solid #e0e0e0;
}

.button.secondary:active {
  background-color: #e8e8e8;
}

.button.secondary:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

.secondaryLinks {
  text-align: center;
}

.secondaryLinks a {
  color: #0066cc;
  text-decoration: none;
  font-size: 14px;
  padding: 8px;
  display: inline-block;
}

.secondaryLinks a:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

---

## 5. Testing Frameworks for Responsive Design Validation

### 5.1 Unit/Component Testing (Jest + React Testing Library)

```typescript
// tests/unit/AuthLandingPage.test.tsx
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AuthLandingPage from '@/app/auth/page';

jest.mock('next/navigation');

describe('AuthLandingPage - Responsive Design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile (320px) Viewport', () => {
    beforeEach(() => {
      // Set viewport to 320px
      global.innerWidth = 320;
      global.innerHeight = 568;
      window.dispatchEvent(new Event('resize'));
    });

    test('buttons should be full width on mobile', () => {
      render(<AuthLandingPage />);
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        expect(styles.width).toBe('100%');
      });
    });

    test('buttons should stack vertically on mobile', () => {
      const { container } = render(<AuthLandingPage />);
      const buttonGroup = container.querySelector('[data-testid="button-group"]');
      const styles = window.getComputedStyle(buttonGroup);
      
      expect(styles.flexDirection).toBe('column');
    });

    test('button touch target should be minimum 44x44px', () => {
      render(<AuthLandingPage />);
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Tablet (768px) Viewport', () => {
    beforeEach(() => {
      global.innerWidth = 768;
      global.innerHeight = 1024;
      window.dispatchEvent(new Event('resize'));
    });

    test('buttons should be side-by-side on tablet', () => {
      const { container } = render(<AuthLandingPage />);
      const buttonGroup = container.querySelector('[data-testid="button-group"]');
      const styles = window.getComputedStyle(buttonGroup);
      
      expect(styles.flexDirection).toBe('row');
    });
  });

  describe('Desktop (1024px+) Viewport', () => {
    beforeEach(() => {
      global.innerWidth = 1200;
      global.innerHeight = 800;
      window.dispatchEvent(new Event('resize'));
    });

    test('auth card should have max-width constraint', () => {
      const { container } = render(<AuthLandingPage />);
      const card = container.querySelector('[data-testid="auth-card"]');
      const styles = window.getComputedStyle(card);
      
      expect(parseFloat(styles.maxWidth)).toBeLessThanOrEqual(480);
    });
  });

  describe('Touch Target Accessibility', () => {
    test('all interactive elements should have minimum 44x44px touch target', () => {
      render(<AuthLandingPage />);
      const interactiveElements = screen.getAllByRole('button').concat(
        screen.getAllByRole('link')
      );

      interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const hasMinimumSize = rect.height >= 44 && rect.width >= 44;
        const parentPadding = parseInt(
          window.getComputedStyle(element.parentElement!).padding
        );

        expect(hasMinimumSize || parentPadding >= 8).toBeTruthy();
      });
    });

    test('buttons should have proper spacing between them', () => {
      const { container } = render(<AuthLandingPage />);
      const buttons = container.querySelectorAll('button');
      
      for (let i = 0; i < buttons.length - 1; i++) {
        const current = buttons[i].getBoundingClientRect();
        const next = buttons[i + 1].getBoundingClientRect();
        const gap = next.top - current.bottom;
        
        expect(gap).toBeGreaterThanOrEqual(8); // Minimum 8px gap
      }
    });
  });

  describe('Font Size Accessibility', () => {
    test('buttons should have minimum 16px font size on mobile', () => {
      global.innerWidth = 320;
      render(<AuthLandingPage />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        const fontSize = parseFloat(window.getComputedStyle(button).fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(16);
      });
    });
  });
});
```

### 5.2 E2E Testing (Playwright/Cypress)

```typescript
// tests/e2e/auth-responsive.spec.ts
import { test, expect, devices } from '@playwright/test';

test.describe('Auth Landing Page - Responsive Design', () => {
  const baseURL = 'http://localhost:3000/auth';

  test('320px mobile viewport - buttons are stacked and full width', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 },
      userAgent: 'Mobile Safari',
    });
    const page = await context.newPage();
    await page.goto(baseURL);

    // Verify buttons are full width
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const boundingBox = await button.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(305); // 320 - padding
    }

    // Verify no horizontal scrolling needed
    const viewportSize = page.viewportSize();
    const pageWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(pageWidth).toBeLessThanOrEqual(viewportSize?.width || 320);

    await context.close();
  });

  test('320px - touch targets are minimum 44x44px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 },
    });
    const page = await context.newPage();
    await page.goto(baseURL);

    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }

    await context.close();
  });

  test('768px tablet - buttons should be in a row', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await page.goto(baseURL);

    const buttonGroup = page.locator('[data-testid="button-group"]');
    const buttons = await page.locator('button').all();

    // Verify buttons are horizontally aligned (same Y position)
    const positions = [];
    for (const button of buttons) {
      const box = await button.boundingBox();
      positions.push(box?.y);
    }

    // All buttons should have approximately the same Y position on tablet
    const firstY = positions[0];
    const allSameRow = positions.every((y) => Math.abs((y || 0) - (firstY || 0)) < 10);
    expect(allSameRow).toBeTruthy();

    await context.close();
  });

  test('supports multiple device presets', async ({ page }) => {
    const devices = [
      { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
      { name: 'iPad', viewport: { width: 768, height: 1024 } },
      { name: 'Samsung Galaxy S21', viewport: { width: 360, height: 800 } },
    ];

    for (const device of devices) {
      await page.setViewportSize(device.viewport);
      await page.goto(baseURL);

      // No horizontal scrolling on any device
      const pageWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(pageWidth).toBeLessThanOrEqual(device.viewport.width);

      // Buttons are accessible
      const buttons = await page.locator('button');
      await expect(buttons.first()).toBeVisible();
    }
  });

  test('orientation change (portrait to landscape)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 }, // Portrait
    });
    const page = await context.newPage();
    await page.goto(baseURL);

    // Portrait: buttons should be stacked
    let buttonPositions = await page.locator('button').evaluateAll((buttons) =>
      buttons.map((b) => b.getBoundingClientRect().y)
    );
    expect(new Set(buttonPositions).size).toBeGreaterThan(1); // Multiple rows

    // Change to landscape
    await page.setViewportSize({ width: 568, height: 320 });

    // May adjust layout based on height constraint
    const contnetHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(contentHeight).toBeLessThanOrEqual(400); // Should fit better
  });

  test('font sizes prevent auto-zoom on input focus', async ({ page }) => {
    await page.goto(baseURL);

    // Find any input fields
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const fontSize = await input.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      // Should be 16px or larger to prevent iOS zoom
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
    }
  });
});
```

### 5.3 Visual Regression Testing (Percy/Chromatic)

```typescript
// tests/e2e/auth-visual.spec.ts
import { test, expect, devices } from '@playwright/test';
import percyHealthCheck from '@percy/script';

const viewports = [
  { name: '320px Mobile', width: 320, height: 568 },
  { name: '768px Tablet', width: 768, height: 1024 },
  { name: '1024px Desktop', width: 1024, height: 768 },
];

test.describe('Auth Landing Page - Visual Regression', () => {
  test.beforeAll(() => {
    // Check Percy connection
    percyHealthCheck();
  });

  viewports.forEach((viewport) => {
    test(`responsive design at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      
      await page.goto('http://localhost:3000/auth');
      
      // Wait for any animations to complete
      await page.waitForLoadState('networkidle');
      
      // Capture visual snapshot with Percy
      await page.percySnapshot(`Auth Landing - ${viewport.name}`);
    });
  });

  test('button hover states across devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/auth');

    const button = page.locator('button[class*="primary"]');
    
    // Take snapshot before hover
    await page.percySnapshot('Button - Default State');
    
    // Hover and snapshot
    await button.hover();
    await page.percySnapshot('Button - Hover State');
    
    // Focus and snapshot
    await button.focus();
    await page.percySnapshot('Button - Focus State');
  });
});
```

### 5.4 Accessibility Testing (Jest-Axe)

```typescript
// tests/unit/auth-a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AuthLandingPage from '@/app/auth/page';

expect.extend(toHaveNoViolations);

describe('AuthLandingPage - Accessibility', () => {
  test('no accessibility violations on mobile (320px)', async () => {
    // Mock mobile viewport
    global.innerWidth = 320;
    
    const { container } = render(<AuthLandingPage />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  test('no accessibility violations on tablet (768px)', async () => {
    global.innerWidth = 768;
    
    const { container } = render(<AuthLandingPage />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  test('buttons have accessible labels', () => {
    const { container } = render(<AuthLandingPage />);
    const buttons = container.querySelectorAll('button');
    
    buttons.forEach((button) => {
      expect(
        button.textContent || button.getAttribute('aria-label')
      ).toBeTruthy();
    });
  });

  test('color contrast meets WCAG AA on all viewports', async () => {
    [320, 768, 1024].forEach((width) => {
      global.innerWidth = width;
      
      const { container } = render(<AuthLandingPage />);
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: true } },
      });
      
      expect(results).toHaveNoViolations();
    });
  });
});
```

### 5.5 Responsive Testing Checklist

```typescript
// tests/responsive-checklist.test.ts
/**
 * Comprehensive Responsive Design Testing Checklist
 * Run these tests before deploying auth flows
 */

const RESPONSIVE_CHECKLIST = {
  'Viewport Configuration': {
    'Has viewport meta tag': () => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta !== null;
    },
    'Viewport width is device-width': () => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content')?.includes('device-width');
    },
    'Initial scale is 1.0': () => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content')?.includes('initial-scale=1');
    },
  },

  'Mobile Touch Targets (44x44px)': {
    'All buttons ≥44px height': () => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).every(
        (b) => b.getBoundingClientRect().height >= 44
      );
    },
    'All buttons ≥44px width': () => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).every(
        (b) => b.getBoundingClientRect().width >= 44
      );
    },
    'All links ≥44px height': () => {
      const links = document.querySelectorAll('a[role="button"], a.button');
      return Array.from(links).every(
        (l) => l.getBoundingClientRect().height >= 44
      );
    },
  },

  'Spacing and Layout (320px)': {
    'No horizontal scrolling at 320px': () => {
      return document.body.scrollWidth <= 320;
    },
    'Buttons have ≥8px spacing': () => {
      const buttons = document.querySelectorAll('button');
      const gap = window.getComputedStyle(
        document.querySelector('[data-testid="button-group"]') || buttons[0].parentElement!
      ).gap;
      return parseInt(gap) >= 8 || gap === 'auto';
    },
    'Container padding is adequate': () => {
      const container = document.querySelector('[data-testid="auth-card"]');
      const padding = parseInt(window.getComputedStyle(container!).padding);
      return padding >= 12;
    },
  },

  'Font Sizes': {
    'Body text is ≥14px': () => {
      const body = document.body;
      return parseInt(window.getComputedStyle(body).fontSize) >= 14;
    },
    'Button text is ≥16px on mobile': () => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).every(
        (b) => parseInt(window.getComputedStyle(b).fontSize) >= 16
      );
    },
    'Heading text is ≥24px': () => {
      const h1 = document.querySelector('h1');
      return h1 ? parseInt(window.getComputedStyle(h1).fontSize) >= 24 : true;
    },
  },

  'Accessibility': {
    'All buttons have text or aria-label': () => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).every(
        (b) => b.textContent?.trim() || b.getAttribute('aria-label')
      );
    },
    'Focus indicators visible': () => {
      const button = document.querySelector('button');
      if (!button) return true;
      const focused = window.getComputedStyle(button, ':focus-visible');
      return focused.outline !== 'none';
    },
    'Color contrast ≥4.5:1': () => {
      // Requires color contrast analysis library
      return true; // Replace with axe-core or similar
    },
  },

  'Responsive Layouts': {
    'Mobile: buttons stack vertically': (width = 320) => {
      if (width > 620) return true; // Only check on mobile
      const buttonGroup = document.querySelector('[data-testid="button-group"]');
      return (
        window.getComputedStyle(buttonGroup!).flexDirection === 'column'
      );
    },
    'Tablet: buttons are side-by-side': (width = 768) => {
      if (width < 621) return true; // Only check on tablet+
      const buttonGroup = document.querySelector('[data-testid="button-group"]');
      return (
        window.getComputedStyle(buttonGroup!).flexDirection === 'row'
      );
    },
    'Desktop: max-width constraint applied': (width = 1024) => {
      if (width < 1025) return true; // Only check on desktop
      const card = document.querySelector('[data-testid="auth-card"]');
      const maxWidth = parseInt(window.getComputedStyle(card!).maxWidth);
      return maxWidth <= 600;
    },
  },
};

// Run checklist
const results = Object.entries(RESPONSIVE_CHECKLIST).reduce(
  (acc, [category, tests]) => {
    acc[category] = Object.entries(tests).reduce((catAcc, [test, fn]) => {
      catAcc[test] = fn();
      return catAcc;
    }, {} as Record<string, boolean>);
    return acc;
  },
  {} as Record<string, Record<string, boolean>>
);

console.table(results);
```

---

## 6. Recommended Testing Stack for Your Project

### Install Dependencies

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  jest-axe \
  @playwright/test \
  jest
```

### Jest Configuration (jest.config.cjs)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
```

### Playwright Configuration (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

---

## 7. Implementation Summary

### Core Principles

1. **Mobile-first**: Design for 320px first, enhance for larger screens
2. **Touch-friendly**: 44x44px minimum touch targets with 8px spacing
3. **Flexible layouts**: Use Flexbox for mobile, Grid for complex layouts
4. **Accessibility**: WCAG 2.1 AA standards, keyboard navigation, ARIA labels
5. **Testing**: Multi-layer testing (unit, e2e, accessibility, visual)

### Quick Implementation Checklist

- [ ] Add viewport meta tag with `viewport-fit=cover`
- [ ] Implement 44x44px minimum buttons with 16px+ font size
- [ ] Use CSS custom properties for responsive spacing
- [ ] Stack buttons vertically on mobile (320-620px)
- [ ] Side-by-side buttons on tablet+ (621px+)
- [ ] Add focus indicators for keyboard navigation
- [ ] Test on physical devices (not just browser emulation)
- [ ] Use Lighthouse or Percy for visual regression
- [ ] Run jest-axe for accessibility violations
- [ ] Test on landscape mode and notched devices

### References

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **Mobile Web Best Practices**: https://developers.google.com/web/fundamentals/design-and-ux/responsive#set-the-viewport
- **Apple HIG Touch Target**: 44pt minimum
- **Android Material Design**: 48dp minimum
- **Viewport Height**: Use `100svh` (small viewport height) instead of `100vh`

