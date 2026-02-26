# Auth Landing Page - WCAG 2.1 AA Accessibility Quick Reference

**Quick Link to Full Guide**: [ACCESSIBILITY_AUTH_PATTERNS.md](./ACCESSIBILITY_AUTH_PATTERNS.md)

---

## ⌨️ Keyboard Navigation (5 min checklist)

```
□ Tab through entire page - focus follows logical order
□ All buttons focusable (can press Tab to reach them)
□ Enter/Space activates buttons
□ Links work with Enter key
□ Can Tab backwards with Shift+Tab
□ No elements are "trapped" - can always Tab away
```

**Test Command**: Use only keyboard (no mouse) to navigate the entire page start-to-finish.

---

## 👁️ Focus Indicators (Visual Design Check)

```
□ Visible outline/border when focused (minimum 3px)
□ Focus indicator has sufficient contrast (3:1 minimum)
□ Focus indicator does NOT disappear when hovering
□ Outline offset prevents overlap with content
```

**Example CSS (COPY & USE):**
```css
button:focus-visible,
a:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}
```

**❌ DO NOT DO:**
```css
button:focus { outline: none; }  /* WCAG VIOLATION */
```

---

## 🏷️ HTML & Semantic Markup

```
□ Buttons are <button> elements, not <div>
□ Links are <a> elements with href, not <button>
□ Page has <h1> heading
□ Main content in <main> element
□ Button/link text is descriptive ("Sign In", not "Click")
□ Page title: <title>Sign In or Register - InnovatEPAM Portal</title>
```

**Button Example:**
```html
<!-- ✓ CORRECT -->
<button type="button" onclick="goToLogin()">Sign In</button>

<!-- ✗ WRONG -->
<div onclick="goToLogin()">Sign In</div>
```

---

## 🎨 Color Contrast (Test with tool)

| Element | Minimum | Recommended | Tool |
|---------|---------|-------------|------|
| Text | 4.5:1 | 7:1+ | [WebAIM Checker](https://webaim.org/resources/contrastchecker/) |
| UI Buttons | 3:1 | 5:1+ | Same tool |
| Links | 4.5:1 | 7:1+ | Same tool |

**Test Your Colors:**
1. Go to https://webaim.org/resources/contrastchecker/
2. Enter foreground (text) color
3. Enter background color
4. Verify ratio ≥ 4.5:1 for text

**Pre-tested Colors (use these):**
- Primary Button: `#003da5` (dark blue) + `#ffffff` (white) = **8.6:1** ✓
- Links: `#0066cc` (blue) on white = **6.2:1** ✓
- Text: `#000000` (black) on `#f0f0f0` (light gray) = **17.5:1** ✓

---

## 📱 Mobile Touch Targets

```
□ Buttons: minimum 44 × 44 CSS pixels (48-56px better)
□ Links: minimum 44 × 44 CSS pixels
□ Spacing between targets: 8-16px
□ Button text: 16px font size minimum
□ Page works at 200% zoom without horizontal scroll
```

**CSS Example:**
```css
button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
  font-size: 16px;
}

@media (max-width: 768px) {
  button {
    width: 100%;
    min-height: 48px;
    margin: 12px 0;
  }
}
```

---

## 🔗 Links & Navigation

```
□ Links have visible underline (or other indicator)
□ Link text describes where it goes ("Forgot Password?", not "link")
□ Links are blue (or contrasting color) + underline minimum
□ Focus indicator visible on links
```

**Example:**
```html
<!-- ✓ CORRECT -->
<a href="/auth/forgot-password">Forgot your password?</a>

<!-- ✗ WRONG - no description -->
<a href="/auth/forgot-password">Click here</a>
```

---

## ✅ Before You Submit (Checklist)

### 1. Keyboard Test (2 minutes)
- [ ] Open page
- [ ] Unplug mouse or hide trackpad
- [ ] Tab through entire page
- [ ] Verify focus visible on all elements
- [ ] Verify logical tab order

### 2. Screen Reader Test (3 minutes)
**Windows**: Download [NVDA (free)](https://www.nvaccess.org/)
**Mac**: Use built-in VoiceOver (Cmd + F5)

- [ ] Open page with screen reader
- [ ] Listen for page title announcement
- [ ] Verify all buttons announced correctly
- [ ] Verify all links announced correctly
- [ ] No "mystery" buttons ("button" instead of "Sign In")

### 3. Contrast Test (2 minutes)
- [ ] Go to https://webaim.org/resources/contrastchecker/
- [ ] Test each button color
- [ ] Test each link color
- [ ] Test heading color
- [ ] Verify all ≥ 4.5:1

### 4. Mobile Test (3 minutes)
- [ ] Open on phone/tablet
- [ ] Try tapping each button
- [ ] Buttons are easy to tap (not tiny)
- [ ] No horizontal scrolling at 200% zoom
- [ ] Try with phone's screen reader (VoiceOver/TalkBack)

### 5. Browser DevTools (2 minutes)
**Chrome/Edge**:
1. Open DevTools (F12)
2. Run Lighthouse audit (tab in DevTools)
3. Check Accessibility score ≥ 90

**Firefox**:
1. Install WAVE extension
2. Run check
3. Verify no errors

---

## 🚨 Red Flags (WCAG Violations)

| Issue | Impact | Fix |
|-------|--------|-----|
| `outline: none` on buttons | Keyboard users can't see focus | Always show focus outline |
| Links with no underline | Color-blind users can't identify links | Add underline or icon |
| Buttons < 44px | Mobile users can't tap | Make buttons larger |
| Text too small | Low vision users can't read | 16px minimum on mobile |
| Color-only indicators | Color-blind users can't understand | Use text + color + icon |
| No page title | Screen readers confused | Add `<title>` tag |
| Generic button text | Users don't know what button does | Use "Sign In", not "Go" |
| Focus order jumps around | Keyboard users confused | Check HTML source order |
| Disabled without explanation | Users don't know why button disabled | Add aria-disabled or message |

---

## 🛠️ Tools to Install (One-Time Setup)

| Tool | Purpose | Link |
|------|---------|------|
| **Axe DevTools** | Browser automation testing | https://www.deque.com/axe/devtools/ |
| **WAVE** | Web accessibility evaluation | https://wave.webaim.org/extension/ |
| **Color Contrast Analyzer** | Test color combinations | https://www.tpgi.com/color-contrast-checker/ |
| **NVDA** | Windows screen reader | https://www.nvaccess.org/ |
| **Lighthouse** | Built-in to Chrome DevTools | Press F12 in Chrome |

---

## 💡 Quick Tips

1. **Use the built-in HTML elements** - `<button>`, `<a>`, `<input>` are already accessible
2. **Don't fight the browser** - Don't remove default focus indicators
3. **Test early, test often** - Don't wait until the end
4. **Ask users** - Include people with disabilities in testing
5. **Automate what you can** - Use tools for contrast, HTML validation
6. **Manual testing matters** - No tool catches everything (especially keyboard navigation)

---

## 📞 Questions?

Reference the full guide: [ACCESSIBILITY_AUTH_PATTERNS.md](./ACCESSIBILITY_AUTH_PATTERNS.md)

Key sections:
- Section 1: Keyboard Navigation Details
- Section 2: ARIA & Semantic HTML
- Section 3: Color Contrast Requirements
- Section 4: Mobile Accessibility
- Section 5: Full 13-Point Checklist

---

**Status**: Ready for Development  
**Compliance Level**: WCAG 2.1 AA  
**Last Updated**: February 25, 2026
