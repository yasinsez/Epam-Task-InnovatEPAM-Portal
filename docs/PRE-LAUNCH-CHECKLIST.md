# Mobile-First Responsive Auth Design - Pre-Launch Checklist

**Project**: InnovatEPAM Portal - Authentication Landing Page  
**Date**: February 25, 2026  
**Feature Branch**: 008-auth-landing-page  

---

## 🎯 Design & Layout Validation

### 320px Mobile Viewport
- [ ] No horizontal scrolling required
- [ ] All text is readable without zooming
- [ ] Buttons are full-width (280-304px)
- [ ] Button height ≥ 44px
- [ ] Button padding 12px-28px vertical
- [ ] Container padding 16px on each side
- [ ] Hero section centered and readable
- [ ] No element extends beyond viewport
- [ ] Subtitle fits 2-3 lines max

### 414px Mobile (iPhone 12/13)
- [ ] Layout matches 320px approach
- [ ] Extra space utilized appropriately
- [ ] No layout shift from 320px
- [ ] Buttons still full-width

### 768px Tablet Viewport
- [ ] Buttons are side-by-side (flex-direction: row)
- [ ] Buttons have equal width
- [ ] Button spacing is 12-16px between
- [ ] Hero section is wider (max-width appropriate)
- [ ] Two-column layout adapts well
- [ ] No unnecessary white space

### 1024px+ Desktop
- [ ] Card has max-width ≤ 480px
- [ ] Card is centered on screen
- [ ] Adequate padding from edges (20px+)
- [ ] Buttons layout adapts to larger screen
- [ ] Hero text is properly sized (28px+ heading)
- [ ] Overall layout looks balanced

---

## 🔘 Button & CTA Validation

### Touch Target Sizing
- [ ] **Create Account button**: ≥ 44px height, ≥ 44px width
- [ ] **Sign In button**: ≥ 44px height, ≥ 44px width
- [ ] **Forgot Password link**: ≥ 44px touch target (with padding)
- [ ] All buttons measured in px (exact pixel verification)
- [ ] Touch targets don't overlap
- [ ] Minimum 8px spacing between interactive elements

### Button Properties
- [ ] Button font size ≥ 16px on mobile (prevents iOS zoom)
- [ ] Button font weight is 600 (bold)
- [ ] Button text is vertically/horizontally centered
- [ ] Button padding: 12px-14px vertical, 24-28px horizontal
- [ ] Button border-radius: 8px
- [ ] No text truncation in buttons

### Button Interactive States
- [ ] **Hover/Active**: Visual feedback (color change, shadow, scale)
- [ ] **Focus**: 3px solid outline with 2px offset
- [ ] **Disabled**: Opacity 0.6, cursor: not-allowed
- [ ] **Touch feedback**: Slight scale down on active (0.98)
- [ ] Smooth transitions (200ms cubic-bezier)

### Color & Contrast
- [ ] Primary button: #0066cc on white (>7:1 contrast) ✓
- [ ] Secondary button: #212121 on #f0f0f0 (>4.5:1 contrast) ✓
- [ ] All text meets 4.5:1 WCAG AA minimum
- [ ] Focus outline visible in high contrast mode

---

## ♿ Accessibility Compliance

### WCAG 2.1 Level AA
- [ ] All interactive elements keyboard accessible (Tab key)
- [ ] Focus order is logical (top to bottom)
- [ ] Focus indicators visible for keyboard users
- [ ] No focus traps (can always tab out)
- [ ] All buttons have accessible labels (text or aria-label)
- [ ] Links have descriptive text ("Sign In" not "Click Here")
- [ ] Color contrast ≥ 4.5:1 for normal text
- [ ] Color contrast ≥ 3:1 for large/bold text

### ARIA & Semantic HTML
- [ ] Buttons use `<button>` element (not `<div>`)
- [ ] Links use `<a>` or `<Link>` with href
- [ ] Headings use semantic `<h1>`, `<h2>` tags
- [ ] Form elements properly labeled
- [ ] aria-label used where text not visible
- [ ] aria-labelledby connects related elements
- [ ] No dummy ARIA (only when necessary)

### Screen Reader Testing
- [ ] Page structure makes sense without CSS
- [ ] All buttons announced with text
- [ ] Focus order announced correctly
- [ ] No screen-reader-only text is visible
- [ ] Links are distinguishable from buttons
- [ ] Error messages clearly announced

### Vision & Motor Accessibility
- [ ] Text is resizable (no fixed font sizes)
- [ ] Works at 200% zoom level
- [ ] Works at 320px width (smallest viewport)
- [ ] No movement/animation that can't be paused
- [ ] Respects prefers-reduced-motion setting
- [ ] Works in high contrast mode
- [ ] Color not sole means of information

---

## 📱 Mobile-Specific Features

### Viewport Configuration
- [ ] Meta tag includes `width=device-width`
- [ ] Meta tag includes `initial-scale=1.0`
- [ ] Meta tag includes `viewport-fit=cover`
- [ ] Meta tag includes `maximum-scale=5.0`
- [ ] NO `user-scalable=no` (disables accessibility zoom)
- [ ] Tested with actual mobile devices

### Orientation & Device Features
- [ ] Portrait mode works (320-414px width)
- [ ] Landscape mode works (812-1024px width)
- [ ] No text cutoff on notched devices (iPhone X+ safe area)
- [ ] Handles device rotation gracefully
- [ ] Bottom navigation bar doesn't hide content
- [ ] Status bar doesn't overlap content

### Touch Optimization
- [ ] No :hover-only controls (mobile has no hover)
- [ ] Touch feedback visible (:active state)
- [ ] Links have adequate spacing for fat-finger tapping
- [ ] No small (< 3mm) tap targets
- [ ] Double-tap zoom disabled if needed
- [ ] Touch events properly handled

### Performance on Mobile
- [ ] First Contentful Paint < 1.5s on 3G
- [ ] Largest Contentful Paint < 2.5s on 3G
- [ ] Time to Interactive < 3.8s on 3G
- [ ] Cumulative Layout Shift < 0.1
- [ ] No JavaScript errors on load
- [ ] Page usable without JavaScript

---

## 🧪 Test Coverage Verification

### Unit Tests (Jest + React Testing Library)
```bash
npm test -- tests/unit/auth-responsive.test.tsx
```

- [ ] Touch target sizing tests passing
- [ ] Font size tests passing (≥16px on mobile)
- [ ] Mobile viewport tests passing (320px)
- [ ] Tablet viewport tests passing (768px)
- [ ] Desktop viewport tests passing (1200px)
- [ ] Accessibility/axe tests passing
- [ ] Focus indicator tests passing
- [ ] Button interaction tests passing
- [ ] Spacing/spacing token tests passing
- [ ] All 32+ tests passing

### E2E Tests (Playwright)
```bash
npx playwright test tests/e2e/auth-responsive-e2e.spec.ts
```

- [ ] 320px mobile tests passing
- [ ] 414px large mobile tests passing
- [ ] 768px tablet tests passing
- [ ] 1200px desktop tests passing
- [ ] 1920px wide desktop tests passing
- [ ] Orientation change tests passing
- [ ] Real device preset tests passing (iPhone, iPad, Android)
- [ ] Keyboard navigation tests passing
- [ ] Focus tests passing
- [ ] No horizontal scroll at any viewport

### Visual Regression Testing (Optional: Percy/Chromatic)
- [ ] Screenshots captured at 320px ✓
- [ ] Screenshots captured at 768px ✓
- [ ] Screenshots captured at 1200px ✓
- [ ] No unexpected visual changes ✓
- [ ] Dark mode screenshots (if supported) ✓

### Accessibility Automated Testing (jest-axe)
- [ ] No axe violations at 320px
- [ ] No axe violations at 768px
- [ ] No axe violations at 1200px
- [ ] Color contrast passing
- [ ] ARIA attributes valid
- [ ] Element hierarchy correct

---

## 🖥️ Manual Device Testing

### Desktop Browsers
- [ ] Chrome/Chromium latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] DevTools device emulation

### Smartphone Devices
- [ ] iPhone SE (375px × 667px)
- [ ] iPhone 12/13 (390px × 844px)
- [ ] iPhone 14 Pro Max (430px × 932px)
- [ ] Samsung Galaxy S21 (360px × 800px)
- [ ] Google Pixel 6 (412px × 915px)
- [ ] OnePlus (typical Android)

### Tablet Devices
- [ ] iPad (768px × 1024px)
- [ ] iPad Pro 11" (834px × 1194px)
- [ ] Samsung Galaxy Tab (768px × 1024px)
- [ ] Android tablet (various)

### Orientations
- [ ] Portrait orientation (all devices)
- [ ] Landscape orientation (all devices)
- [ ] Orientation change/rotation
- [ ] Notched displays (iPhone X+)
- [ ] Bottom navigation bar (Android)

---

## 🎨 Visual & UX Validation

### Hero Section
- [ ] Title is prominent and readable
- [ ] Subtitle explains portal purpose
- [ ] Text hierarchy is clear (H1 > subtitle)
- [ ] No text cutoff or overflow
- [ ] Adequate whitespace above/below
- [ ] Loading state looks good (if applicable)

### Button Area
- [ ] Buttons are the focal point
- [ ] Clear visual distinction (primary vs secondary)
- [ ] Color uses brand colors appropriately
- [ ] Icons (if any) are clear and meaningful
- [ ] Button labels are action-oriented
- [ ] Adequate spacing from hero section

### Secondary Links
- [ ] "Forgot Password?" is unobtrusive but visible
- [ ] Link styling distinguishes from buttons
- [ ] Link has proper color (blue usually)
- [ ] Link underlines on hover (if applicable)
- [ ] Maintains spacing from buttons

### Overall Layout
- [ ] White space is balanced
- [ ] No elements appear cramped
- [ ] Content hierarchy is clear
- [ ] Eye flow leads to primary buttons
- [ ] Symmetric or intentional asymmetry
- [ ] Matches brand/existing app design

---

## 📋 Responsive Typography

### Heading Sizes
- [ ] Mobile (320px): H1 ≥ 24px ✓
- [ ] Tablet (768px): H1 ≥ 28px ✓
- [ ] Desktop (1200px): H1 ≥ 28-32px ✓
- [ ] No text squish at any size
- [ ] Line-height ≥ 1.5 for readability

### Body Text
- [ ] Mobile: ≥ 14px ✓
- [ ] Tablet: ≥ 15px ✓
- [ ] Desktop: ≥ 14-16px ✓
- [ ] Line-height ≥ 1.6 for paragraphs
- [ ] Adequate letter-spacing (none or -0.5px max)

### Links & Labels
- [ ] Consistent font size across viewports
- [ ] Sufficient color contrast
- [ ] No decorative text uses color only
- [ ] Alt text provided for images (if any)

---

## 🔗 Navigation & Cross-Linking

### Landing Page CTA
- [ ] "Create Account" button links to `/auth/register` ✓
- [ ] "Sign In" button links to `/auth/login` ✓
- [ ] "Forgot Password?" link to `/auth/forgot-password` ✓
- [ ] All links navigate correctly
- [ ] No 404 errors

### Cross-Linking from Auth Forms
- [ ] Login page has "Don't have account?" → Register ✓
- [ ] Register page has "Already have account?" → Login ✓
- [ ] Forgot password page links back to login/register ✓
- [ ] All cross-links functional

### Redirects
- [ ] Authenticated users redirected away from landing page ✓
- [ ] Redirect to dashboard/home (configurable) ✓
- [ ] No redirect loops ✓

---

## 🔐 Security & Best Practices

### HTML/Markup
- [ ] No inline styles (all CSS module)
- [ ] Proper semantic HTML structure
- [ ] No hardcoded credentials or API keys
- [ ] `lang="en"` attribute on html tag
- [ ] Proper charset: UTF-8

### CSS
- [ ] No !important overrides (unless necessary)
- [ ] CSS modules prevent specificity issues
- [ ] Custom properties for theming
- [ ] Mobile-first media queries
- [ ] Proper nesting/BEM naming

### JavaScript/React
- [ ] No console errors on page load
- [ ] No console warnings in production
- [ ] Proper error boundaries if using React
- [ ] No memory leaks in event listeners
- [ ] Proper cleanup in useEffect

### Accessibility Security
- [ ] No keyboard traps
- [ ] No infinite loops
- [ ] ARIA labels don't expose sensitive data
- [ ] Links open in same window (unless specified)
- [ ] Forms don't auto-submit

---

## 📊 Lighthouse & Tools

### Chrome DevTools Lighthouse
```
(Settings: Mobile, Slow 4G)
```
- [ ] Performance ≥ 90
- [ ] Accessibility ≥ 95
- [ ] Best Practices ≥ 90
- [ ] SEO ≥ 90

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] All metrics passing

### Google Mobile-Friendly Test
- [ ] Page is mobile-friendly ✓
- [ ] Text is readable without zoom ✓
- [ ] Clickable elements properly spaced ✓
- [ ] Viewport configured ✓

---

## 📝 Documentation & Code

### Code Quality
- [ ] TypeScript types are correct
- [ ] No `@ts-ignore` comments (unless documented)
- [ ] No loose `any` types
- [ ] Props properly typed in React components
- [ ] Comments explain complex logic

### Documentation
- [ ] Component has JSDoc comments
- [ ] CSS module has section comments
- [ ] Files have descriptive headers
- [ ] Complex selectors are explained
- [ ] README updated if needed

### Version Control
- [ ] Code committed to feature branch
- [ ] Commit messages are descriptive
- [ ] No debug/console.log left in code
- [ ] No console errors/warnings
- [ ] Tests pass before committing

---

## 🚀 Pre-Merge Checklist

Before submitting PR:

- [ ] All tests pass (unit + e2e)
- [ ] No lint errors (`npm run lint`)
- [ ] Code reviewed by team member
- [ ] Changes are minimal and focused
- [ ] Documentation is updated
- [ ] No breaking changes
- [ ] TypeScript compiles without errors
- [ ] Manual testing on real device completed
- [ ] Accessibility audit passed
- [ ] Lighthouse score acceptable

---

## 📥 Merge & Deploy

- [ ] PR approved by reviewers
- [ ] All CI/CD checks passing
- [ ] Merged to main/master branch
- [ ] Deployed to staging environment
- [ ] Final QA testing completed
- [ ] Monitored for errors in production
- [ ] Analytics tracking working (if applicable)

---

## ✨ Success Criteria Met

When ALL items above are checked:

✅ **Specification Requirements**: All user stories (P1-P3) satisfied  
✅ **Responsive Design**: Works 320px-1920px+ without issues  
✅ **Touch-Friendly**: 44x44px minimum targets, proper spacing  
✅ **Accessible**: WCAG 2.1 AA compliant, keyboard navigable  
✅ **Tested**: Unit + E2E + accessibility test coverage  
✅ **Performant**: Lighthouse green across all dimensions  
✅ **Production-Ready**: Code reviewed, documented, tested on real devices  

---

## 🎯 Final Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | _________________ | ________ | _________ |
| QA/Tester | _________________ | ________ | _________ |
| Designer | _________________ | ________ | _________ |
| Tech Lead | _________________ | ________ | _________ |

---

**Ready for production deployment** 🚀

_Document Last Updated: February 25, 2026_
_Checklist Version: 1.0_
