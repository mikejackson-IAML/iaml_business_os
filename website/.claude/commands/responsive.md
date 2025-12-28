# Responsive Screenshot Command

Capture screenshots at multiple viewport sizes and identify layout issues.

## Objective

Test responsive layouts at three key breakpoints:
- **Mobile**: 390x844 (iPhone 14 Pro)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1440x900 (Standard laptop)

## Configuration

- **Base URL**: http://localhost:3000 (vercel dev)
- **Hard Reload**: Clear cache before each capture

---

## Execution Steps

### Phase 1: Define Test Pages

Test these pages (cover different layout types):
1. `/` (Homepage - hero, cards, carousels)
2. `/register.html` (Complex multi-step form)
3. `/featured-programs` (Card grid layout)
4. `/programs/employee-relations-law.html` (Program detail page)
5. `/about-us` (Content page)

### Phase 2: For Each Page x Viewport

Using Playwright MCP:

1. **Set viewport** to target size
2. **Navigate** with hard reload (bypass cache)
3. **Wait** for page load complete
4. **Scroll** top to bottom to trigger lazy-loaded content
5. **Check for horizontal overflow**:
   - `document.body.scrollWidth > window.innerWidth`
   - If overflow detected, identify offending elements
6. **Take full-page screenshot** (captures entire scrollable area)
7. **Take viewport screenshot** (captures visible area only)
8. **Check for common issues**:
   - Text overflow/clipping
   - Elements extending beyond viewport
   - Navigation menu behavior
   - Form field sizing

### Phase 3: Layout Issue Detection

Detect and report:

1. **Horizontal Overflow**
   - Page scrolls horizontally (bad for mobile UX)
   - Report which element(s) cause the overflow

2. **Text Clipping**
   - Text cut off or unreadable
   - Usually from fixed-width containers

3. **Overlapping Elements**
   - Elements stacking incorrectly
   - Z-index issues

4. **Broken Grid Layouts**
   - Cards not stacking properly on mobile
   - Uneven spacing

5. **Navigation Issues**
   - Mobile menu not working
   - Nav items overlapping

6. **Form Problems**
   - Input fields too small to tap
   - Labels cut off

### Phase 4: Report Generation

```
# Responsive Test Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Viewports Tested**: Mobile (390x844), Tablet (768x1024), Desktop (1440x900)
**Pages Tested**: 5

---

## Summary
| Page | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| / | PASS | PASS | PASS |
| /register.html | WARN (overflow) | PASS | PASS |
| /featured-programs | PASS | PASS | PASS |
| /programs/employee-relations-law.html | PASS | PASS | PASS |
| /about-us | PASS | PASS | PASS |

**Overall Status**: WARN - 1 issue found

---

## Page: / (Homepage)

### Mobile (390x844)
- **Status**: PASS
- **Horizontal Overflow**: None
- **Screenshot**: qa/screenshots/responsive/home-mobile-[ts].png

### Tablet (768x1024)
- **Status**: PASS
- **Horizontal Overflow**: None
- **Screenshot**: qa/screenshots/responsive/home-tablet-[ts].png

### Desktop (1440x900)
- **Status**: PASS
- **Horizontal Overflow**: None
- **Screenshot**: qa/screenshots/responsive/home-desktop-[ts].png

---

## Page: /register.html

### Mobile (390x844)
- **Status**: WARN
- **Horizontal Overflow**: Detected
  - Scroll width: 420px (30px overflow)
  - Offending element: `.stepper-container` (width: 420px)
  - Selector: `#stepperList`
- **Screenshot**: qa/screenshots/responsive/register-mobile-[ts].png

### Tablet (768x1024)
- **Status**: PASS
...

---

## Issues Found

### /register.html - Mobile Horizontal Overflow
- **Viewport**: 390x844
- **Element**: `.stepper-container`
- **Selector**: `#stepperList`
- **Issue**: Fixed width exceeds viewport
- **Suggested Fix**: Add `overflow-x: auto` or use `max-width: 100%`

---

## Screenshots Generated

Mobile:
- qa/screenshots/responsive/home-mobile-20251218-143022.png
- qa/screenshots/responsive/register-mobile-20251218-143022.png
...

Tablet:
- qa/screenshots/responsive/home-tablet-20251218-143022.png
...

Desktop:
- qa/screenshots/responsive/home-desktop-20251218-143022.png
...
```

---

## Output

Save screenshots to: `qa/screenshots/responsive/[page]-[viewport]-[timestamp].png`
Save report to: `qa/reports/responsive-YYYYMMDD-HHMMSS.md`

Display summary:
```
Responsive Test Complete
========================
Pages: 5 tested
Viewports: 3 per page
Screenshots: 15 captured

Issues Found:
- /register.html: Mobile horizontal overflow

Status: WARN

Full report: qa/reports/responsive-20251218-143022.md
```

---

## Guardrails

1. **Same-origin only**: Only test localhost:3000 pages
2. **Hard reload**: Clear cache before each viewport test
3. **No HTML dumps**: Only report selectors and CSS properties
4. **Screenshot naming**: Use consistent naming pattern
5. **Scroll behavior**: Scroll entire page to trigger lazy content before screenshot

---

## Success Criteria

- **PASS**: No horizontal overflow on any page at any viewport
- **WARN**: Minor issues (small overflow, cosmetic problems)
- **FAIL**: Major issues (completely broken layout, unusable on mobile)
