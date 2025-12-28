# Performance Optimization Review Command

Perform a comprehensive performance optimization review of the IAML vanilla JavaScript website. Generate a severity-based report identifying performance bottlenecks, resource loading issues, and optimization opportunities.

## Objective

Scan the entire IAML codebase for:
- Script loading inefficiencies (missing async/defer)
- Large bundle sizes and code splitting opportunities
- Image lazy loading implementation
- Resource hints (preload, prefetch, preconnect)
- JavaScript performance patterns (debounce, throttle, passive listeners)
- CSS optimization opportunities
- API caching strategies
- Progressive enhancement compliance

Output a clear severity-based report with specific optimization recommendations.

---

## Execution Steps

### Phase 1: Setup & Discovery

Start timing and gather baseline information:

```bash
# Timing for performance report
START_TIME=$(date +%s)

# Identify all files to scan
echo "Starting performance optimization scan..."
```

Notify user: "Analyzing performance patterns across the codebase..."

### Phase 2: Critical Performance Checks

#### Check 1️⃣: Blocking Script Loading

**What to scan:** All `.html` files for script loading strategy

**Files to search:**
- `index.html`
- `programs/*.html`
- `pages/*.html`
- Any other HTML files

**Search patterns:**

Use Grep tool for each pattern (run in parallel if possible):

1. **Scripts without async/defer**
   - Pattern: `<script src=.*(?!async|defer)>`
   - Look for: `<script src="js/main.js"></script>` (no async/defer attribute)
   - Exclude: Scripts that must be synchronous (like Splide if required immediately)

2. **Scripts in <head> without defer**
   - Pattern: `<script` in files, then check context if in `<head>` section
   - Impact: Blocks HTML parsing and rendering

3. **Inline scripts blocking render**
   - Pattern: Large inline `<script>` tags (>50 lines)
   - Check: Header scroll behavior, initialization code
   - Should be: Extracted to external file with defer

**Analysis:**
- If blocking scripts found (no async/defer), flag as 🚨 CRITICAL
- Note file path and script name
- Recommend: Add `defer` for non-critical scripts, `async` for independent scripts
- Exception: Scripts that must run immediately (Splide initialization if content depends on it)

**Example fix:**
```html
<!-- ❌ BLOCKING -->
<script src="js/animations.js"></script>

<!-- ✅ NON-BLOCKING -->
<script src="js/animations.js" defer></script>
```

---

#### Check 2️⃣: Large JavaScript Bundle Sizes

**What to scan:** All JavaScript files for size analysis

**Scan target:** `/js/*.js` directory

**Bash commands to run:**
```bash
# Get file sizes in bytes, sorted
find js -name "*.js" -type f -exec ls -lh {} \; | awk '{print $5, $9}' | sort -h -r

# Alternative for exact bytes
find js -name "*.js" -type f -exec wc -c {} \; | sort -n -r
```

**Thresholds:**
- **🚨 CRITICAL**: Any single file >50KB
- **⚠️ HIGH**: Any single file >30KB
- **ℹ️ MEDIUM**: Any single file >20KB
- **📋 LOW**: Total JS bundle >150KB

**Analysis:**
- Flag files exceeding thresholds
- Check for large data structures (arrays, objects) that could be externalized
- Identify code splitting opportunities
- Note: `quiz.js` (24KB) and `testimonials.js` (21KB) are known large files

**Recommendations:**
- Files >30KB: "Consider code splitting or lazy loading"
- Large data arrays: "Externalize to JSON and fetch on demand"
- Example: testimonials data should be in `data/testimonials.json`

---

#### Check 3️⃣: Image Lazy Loading Implementation

**What to scan:** All HTML files and image loading code

**Search patterns:**

1. **Images without lazy loading**
   - Pattern: `<img src=` (not `data-src`)
   - Context: Check if image is above the fold (hero images OK)
   - Below-fold images should use lazy loading

2. **Lazy loading pattern verification**
   - Pattern: `data-src` attribute usage
   - Verify: IntersectionObserver implementation exists in main.js
   - Check: Fallback for browsers without IntersectionObserver

3. **Native lazy loading**
   - Pattern: `loading="lazy"` attribute
   - Complement to IntersectionObserver approach

**Files to check:**
- All `.html` files for `<img>` tags
- `main.js` for IntersectionObserver implementation
- `carousel.js` for logo image loading

**Analysis:**
- If below-fold images lack lazy loading, flag as 🚨 CRITICAL
- Verify IntersectionObserver is properly implemented
- Check threshold and rootMargin settings (should preload ~100-200px before viewport)

**Example check:**
```bash
# Find all img tags
grep -rn "<img" . --include="*.html" | wc -l

# Find lazy loaded images
grep -rn "data-src\|loading=\"lazy\"" . --include="*.html" | wc -l
```

---

#### Check 4️⃣: Missing Resource Hints

**What to scan:** HTML `<head>` sections for resource hints

**Files to search:** All `.html` files

**Check for presence of:**

1. **Preconnect for external domains**
   - Pattern: `<link rel="preconnect"`
   - Expected: Google Fonts, Splide CDN, any external APIs
   - Example: `<link rel="preconnect" href="https://fonts.googleapis.com">`

2. **Preload for critical assets**
   - Pattern: `<link rel="preload"`
   - Candidates: Critical CSS, hero images, main.js
   - Example: `<link rel="preload" href="css/main.css" as="style">`

3. **DNS prefetch for third-party domains**
   - Pattern: `<link rel="dns-prefetch"`
   - Candidates: GA4, GTM, external CDNs

**Analysis:**
- If Google Fonts used without preconnect, flag as 🚨 CRITICAL
- If critical CSS not preloaded, flag as ⚠️ HIGH
- If external domains not prefetched, flag as ℹ️ MEDIUM

**Recommended additions:**
```html
<head>
  <!-- Preconnect to external domains -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">

  <!-- Preload critical resources -->
  <link rel="preload" href="css/main.css" as="style">
  <link rel="preload" href="js/main.js" as="script">

  <!-- DNS prefetch for analytics -->
  <link rel="dns-prefetch" href="https://www.google-analytics.com">
</head>
```

---

#### Check 5️⃣: CSS Loading Strategy

**What to scan:** CSS file organization and loading

**Files to check:**
- `css/main.css` (imports the 5-file system)
- `css/1-variables.css`
- `css/2-base.css`
- `css/3-components.css`
- `css/4-layout.css`
- `css/5-pages.css`

**Bash commands:**
```bash
# Check CSS file sizes
find css -name "*.css" -type f -exec wc -c {} \; | sort -n -r

# Check for @import statements (slower than <link>)
grep -rn "@import" css/ --include="*.css"
```

**Thresholds:**
- **🚨 CRITICAL**: Any single CSS file >100KB
- **⚠️ HIGH**: Any single CSS file >50KB
- **ℹ️ MEDIUM**: Total CSS bundle >150KB

**Analysis:**
- Flag large CSS files (known: 5-pages.css ~50KB, 3-components.css ~30KB)
- Check if @import used (slower than <link> tags)
- Verify CSS is not render-blocking (should be in <head> but optimized)
- Look for unused CSS opportunities

**Recommendations:**
- Critical CSS extraction for above-the-fold content
- Defer non-critical CSS or use media query loading
- Example: `<link rel="stylesheet" href="css/print.css" media="print">`

---

#### Check 6️⃣: Font Loading Optimization

**What to scan:** Font loading strategy

**Search patterns:**

1. **Google Fonts usage**
   - Pattern: `fonts.googleapis.com` or `fonts.gstatic.com`
   - Check: Preconnect present? font-display set?

2. **Font-display property**
   - Pattern: `font-display: swap` in CSS
   - Impact: Prevents invisible text flash (FOIT)

3. **Web font formats**
   - Check if using modern formats (woff2)
   - Verify fallback fonts specified

**Analysis:**
- If Google Fonts without preconnect, flag as 🚨 CRITICAL
- If no font-display: swap, flag as ⚠️ HIGH
- Recommendation: Self-host fonts or optimize external loading

**Example optimization:**
```html
<!-- Preconnect for faster font loading -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Add &display=swap parameter -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
```

---

### Phase 3: High Priority Checks

#### Check 7️⃣: Event Listener Efficiency

**What to scan:** JavaScript files for event listener patterns

**Files to search:** `/js/*.js`

**Search patterns:**

1. **Scroll events without throttle/debounce**
   - Pattern: `addEventListener\('scroll'`
   - Check context: Is there debounce/throttle?
   - Impact: Can fire 100+ times per second

2. **Resize events without throttle/debounce**
   - Pattern: `addEventListener\('resize'`
   - Same concern as scroll

3. **Non-passive scroll listeners**
   - Pattern: `addEventListener\('scroll'` or `addEventListener\('touchstart'`
   - Check: `{ passive: true }` option
   - Impact: Blocks browser scrolling optimizations

**Analysis:**
- Scroll/resize without debounce/throttle: flag as ⚠️ HIGH
- Scroll/touch without passive: true: flag as ⚠️ HIGH
- Verify debounce utility exists in main.js

**Example fix:**
```javascript
// ❌ INEFFICIENT
window.addEventListener('scroll', () => {
  // Runs 100+ times per second
  console.log('scrolling');
});

// ✅ OPTIMIZED
const debouncedScroll = debounce(() => {
  console.log('scrolling');
}, 100);

window.addEventListener('scroll', debouncedScroll, { passive: true });
```

---

#### Check 8️⃣: API Response Caching

**What to scan:** Fetch calls and API request patterns

**Files to search:** `/js/*.js` (especially `modals.js`, `quiz.js`)

**Search pattern:** `fetch\(`

**Analysis:**

1. **Check for duplicate API calls**
   - Same endpoint called multiple times
   - No caching mechanism visible

2. **Look for caching strategies**
   - Pattern: `sessionStorage.getItem` before fetch
   - Pattern: `localStorage.getItem` for persistent data
   - Cache-aside pattern

3. **Identify cacheable responses**
   - Program data (static, rarely changes)
   - Quiz questions (static)
   - Testimonials (could be cached)

**Findings to flag:**
- If quiz or program data fetched multiple times without cache: flag as ⚠️ HIGH
- If no caching strategy visible: flag as ⚠️ HIGH

**Example optimization:**
```javascript
// ❌ NO CACHING
async function getProgramData() {
  const response = await fetch('/api/airtable-programs');
  return response.json();
}

// ✅ WITH CACHING
async function getProgramData() {
  const cacheKey = 'program-data';
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // Cache valid for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }

  const response = await fetch('/api/airtable-programs');
  const data = await response.json();

  sessionStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));

  return data;
}
```

---

#### Check 9️⃣: Hardcoded Data Externalization

**What to scan:** JavaScript files with large data structures

**Files to check:**
- `testimonials.js` (21KB - likely has hardcoded testimonials array)
- `carousel.js` (4.6KB - has 33 company logos hardcoded)
- `quiz.js` (24KB - question/answer data)

**Search pattern:** Large array/object literals (>100 lines)

**Grep patterns:**
```bash
# Look for large const/let assignments
grep -A 5 "const.*=\s*\[" js/testimonials.js
grep -A 5 "const.*=\s*\[" js/carousel.js
```

**Analysis:**
- If large data arrays found (>5KB), flag as ⚠️ HIGH
- Recommendation: Move to JSON files, fetch on demand

**Benefits of externalization:**
- Reduces initial JS bundle size
- Allows lazy loading of data
- Easier to update content without touching code
- Can be cached separately

**Example migration:**
```javascript
// ❌ HARDCODED (21KB in testimonials.js)
const testimonials = [
  { name: "John Doe", text: "Great course...", rating: 5 },
  { name: "Jane Smith", text: "Excellent...", rating: 5 },
  // ... 100+ more entries
];

// ✅ EXTERNALIZED
// Move to data/testimonials.json
async function loadTestimonials() {
  const response = await fetch('data/testimonials.json');
  return response.json();
}
```

---

#### Check 🔟: DOM Query Optimization

**What to scan:** JavaScript files for DOM query patterns

**Files to search:** `/js/*.js`

**Search patterns:**

1. **Repeated querySelector in loops**
   - Pattern: `querySelector` or `querySelectorAll` inside loops
   - Impact: Expensive DOM traversal repeated

2. **Cache-able selectors**
   - Look for same selector used multiple times
   - Should be cached in variable

3. **Inefficient selectors**
   - Pattern: Complex selectors like `div.container > ul li a`
   - Recommendation: Use IDs or simpler selectors when possible

**Analysis:**
- Repeated queries in loops: flag as ⚠️ HIGH
- Same selector used 3+ times without caching: flag as ℹ️ MEDIUM

**Example fix:**
```javascript
// ❌ INEFFICIENT
function highlightItems() {
  for (let i = 0; i < 10; i++) {
    document.querySelector('.item').classList.add('active'); // Query every iteration
  }
}

// ✅ OPTIMIZED
function highlightItems() {
  const item = document.querySelector('.item'); // Cache once
  for (let i = 0; i < 10; i++) {
    item.classList.add('active');
  }
}
```

---

### Phase 4: Medium Priority Checks

#### Check 1️⃣1️⃣: Animation Performance

**What to scan:** CSS and JavaScript for animation patterns

**Files to search:**
- `css/*.css` for CSS animations
- `js/animations.js` for JavaScript animations

**Search patterns:**

1. **Animations on expensive properties**
   - Pattern: `transition.*top|left|width|height` (triggers layout)
   - Should use: `transform` and `opacity` (GPU-accelerated)

2. **Missing will-change hints**
   - Pattern: Complex animations without `will-change`
   - Use sparingly for critical animations only

3. **RequestAnimationFrame usage**
   - Pattern: JavaScript animations using RAF
   - Check: Are JS animations using `requestAnimationFrame`?

**Analysis:**
- Animating layout properties (top, left, width, height): flag as ℹ️ MEDIUM
- Complex animations without RAF: flag as ℹ️ MEDIUM
- Recommendation: Use transform/opacity, add RAF for JS animations

**Example optimization:**
```css
/* ❌ TRIGGERS LAYOUT (EXPENSIVE) */
.element {
  transition: left 0.3s, top 0.3s;
}

/* ✅ GPU-ACCELERATED */
.element {
  transition: transform 0.3s;
  will-change: transform; /* Only for frequently animated elements */
}
```

---

#### Check 1️⃣2️⃣: Inline Scripts Extraction

**What to scan:** HTML files for inline JavaScript

**Search pattern:** `<script>` tags without `src` attribute

**Files to search:** All `.html` files

**Bash command:**
```bash
# Find inline scripts
grep -A 10 "<script>" index.html | grep -v "src=" | head -20
```

**Analysis:**
- Large inline scripts (>50 lines): flag as ℹ️ MEDIUM
- Known example: Header scroll behavior inline in HTML files
- Recommendation: Extract to external file with defer

**Benefits of extraction:**
- Enables browser caching
- Reduces HTML file size
- Improves code organization
- Allows defer/async loading

---

#### Check 1️⃣3️⃣: Prefers-Reduced-Motion Support

**What to scan:** Animation code for accessibility

**Search pattern:** `prefers-reduced-motion` media query

**Files to check:**
- `css/*.css` for CSS animations
- `js/animations.js` for JavaScript animations

**Analysis:**
- Check if animations respect `prefers-reduced-motion`
- Verify: Media query disables or reduces animations
- Flag if missing: ℹ️ MEDIUM

**Example implementation:**
```javascript
// Respect user's motion preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Enable animations
  initScrollAnimations();
}
```

---

### Phase 5: Low Priority Checks

#### Check 1️⃣4️⃣: Console.log Statements

**What to scan:** JavaScript files for debug logging

**Search pattern:** `console\.(log|warn|debug)\(`

**Files to search:** `/js/*.js`

**Analysis:**
- Production code shouldn't have excessive console.log
- Flag if >10 console statements found: 📋 LOW
- Recommendation: Remove or conditionally log only in development

**Example pattern:**
```javascript
// Development logging
const DEBUG = false; // Set to false for production

if (DEBUG) {
  console.log('Quiz data loaded:', data);
}
```

---

#### Check 1️⃣5️⃣: Service Worker Opportunity

**What to scan:** Check if service worker exists

**Search pattern:** `service-worker.js` or `sw.js` file

**Analysis:**
- If no service worker: 📋 LOW (optional enhancement)
- Benefits: Offline support, asset caching, improved repeat visits
- Recommendation: "Consider adding service worker for progressive web app features"

**Note:** Service worker is optional for vanilla JS sites but provides performance benefits.

---

### Phase 6: Report Generation

**Collect all findings and generate report:**

#### Report Structure

```
# Performance Optimization Report
**Date:** [Current timestamp]
**Scan Duration:** [Time in seconds]
---

## ✅ PASSED CHECKS (X/15)
- Check 1: [Result]
- Check 2: [Result]
[...all passed checks...]

## 🚨 CRITICAL ISSUES (X found)
[List critical findings with file paths, line numbers, and fixes]

## ⚠️ HIGH PRIORITY ISSUES (X found)
[List high priority findings]

## ℹ️ MEDIUM PRIORITY ISSUES (X found)
[List medium priority findings]

## 📋 LOW PRIORITY ISSUES (X found)
[List low priority findings]

## 🎯 Quick Wins (Highest Impact, Easiest Fixes)
1. [Top priority fix with immediate impact]
2. [Second priority fix]
3. [Third priority fix]

## 📊 Performance Budget Summary
**Current Status:**
- Total JS bundle: [size in KB]
- Total CSS bundle: [size in KB]
- Largest JS file: [filename and size]
- Largest CSS file: [filename and size]

**Recommended Targets:**
- Total JS: <150KB
- Total CSS: <100KB
- Individual files: <30KB each
- Critical path CSS: <14KB

## Summary
**Performance Status:** [EXCELLENT / GOOD / NEEDS OPTIMIZATION / CRITICAL ISSUES]

**Estimated Performance Impact:**
- Critical fixes: [X] (potential improvement: [High/Medium/Low])
- High priority fixes: [X] (potential improvement: [High/Medium/Low])
- Total potential improvement: [Significant / Moderate / Minor]

**Next Steps:**
1. [Priority 1 fix]
2. [Priority 2 fix]
3. [Priority 3 fix]

**Recommended Actions:**
[Code snippets and specific fixes]
```

#### Severity Levels

**🚨 CRITICAL:** Must fix for optimal performance (immediate impact)
- Blocking scripts without async/defer
- Missing image lazy loading
- No resource hints for external domains
- Files >50KB without splitting
- Google Fonts without preconnect

**⚠️ HIGH:** Fix soon (significant performance impact)
- Scroll/resize events without debounce
- Non-passive scroll listeners
- No API response caching
- Hardcoded data (>5KB) not externalized
- Files >30KB
- DOM queries in loops

**ℹ️ MEDIUM:** Nice to fix (moderate performance impact)
- Animations on layout properties
- Inline scripts (>50 lines)
- Missing prefers-reduced-motion
- CSS files >50KB
- Missing critical CSS extraction

**📋 LOW:** Consider fixing (minor optimizations)
- Console.log statements
- Missing service worker
- Code organization improvements
- Future enhancement opportunities

---

## Example Output

```
# Performance Optimization Report
**Date:** 2025-12-05 18:30:00
**Scan Duration:** 8.7 seconds

---

## ✅ PASSED CHECKS (8/15)
- Image lazy loading properly implemented
- Debounce utility present in main.js
- IntersectionObserver for scroll animations
- Passive listeners on scroll events
- Prefers-reduced-motion support exists
- No layout thrashing detected
- RequestAnimationFrame used for animations
- DOM queries efficiently cached

## 🚨 CRITICAL ISSUES (3 found)

**1. Blocking Script Loading**
- Files affected: index.html, programs/employee-relations-law.html (all HTML files)
- Issue: 9 scripts loaded without async/defer attributes
- Scripts: animations.js, carousel.js, testimonials.js, quiz.js, modals.js, faq.js, main.js
- Impact: Blocks HTML parsing, delays page render
- Fix: Add defer attribute to non-critical scripts

**2. Missing Resource Hints for Google Fonts**
- Files affected: All HTML files
- Issue: Google Fonts loaded without preconnect
- Impact: Adds ~200ms to font loading time
- Fix: Add preconnect links in <head>

**3. Large JavaScript Files Without Splitting**
- File: js/quiz.js (24KB)
- File: js/testimonials.js (21KB)
- Issue: Large bundles delay initial page load
- Impact: Increases Time to Interactive (TTI)
- Fix: Consider code splitting or lazy loading

## ⚠️ HIGH PRIORITY ISSUES (2 found)

**1. Hardcoded Data Not Externalized**
- File: js/testimonials.js (~21KB of testimonial data hardcoded)
- File: js/carousel.js (33 logo objects hardcoded)
- Issue: Inflates JavaScript bundle size
- Fix: Move to data/testimonials.json and fetch on demand

**2. No API Response Caching**
- File: js/modals.js (fetch to /api/ghl-webhook)
- File: js/quiz.js (fetch to /api/airtable-quiz)
- Issue: Same data fetched multiple times
- Impact: Unnecessary network requests, slower UX
- Fix: Implement sessionStorage caching

## ℹ️ MEDIUM PRIORITY ISSUES (3 found)

**1. Large Inline Script in HTML**
- File: index.html (header scroll behavior ~100+ lines inline)
- Issue: Cannot be cached by browser
- Fix: Extract to js/header-scroll.js with defer

**2. CSS File Size**
- File: css/5-pages.css (50KB)
- File: css/3-components.css (30KB)
- Issue: Large CSS bundle delays first paint
- Recommendation: Extract critical CSS, defer non-critical

**3. Missing Critical CSS Extraction**
- Files affected: All HTML files
- Issue: All CSS loaded in one bundle
- Impact: Delays above-the-fold rendering
- Fix: Extract critical CSS inline, defer rest

## 📋 LOW PRIORITY ISSUES (1 found)

**1. Console.log Statements**
- File: js/quiz.js (12 console.log statements)
- File: js/modals.js (5 console.log statements)
- Recommendation: Wrap in DEBUG flag or remove for production

---

## 🎯 Quick Wins (Highest Impact, Easiest Fixes)

1. **Add defer to scripts** (5 min, high impact)
   - Impact: Reduces blocking time by ~300-500ms
   - Files: All HTML files, 9 script tags

2. **Add Google Fonts preconnect** (2 min, high impact)
   - Impact: Reduces font loading time by ~200ms
   - Files: All HTML files, add 2 <link> tags

3. **Externalize testimonials data** (15 min, medium impact)
   - Impact: Reduces JS bundle by 21KB
   - Files: Create data/testimonials.json, update testimonials.js

---

## 📊 Performance Budget Summary

**Current Status:**
- Total JS bundle: ~83KB (main.js, animations, carousel, testimonials, quiz, modals, etc.)
- Total CSS bundle: ~90KB (main.css importing 5-file system)
- Largest JS file: quiz.js (24KB)
- Largest CSS file: 5-pages.css (50KB)

**Recommended Targets:**
- Total JS: <150KB ✅ PASS (currently 83KB)
- Total CSS: <100KB ✅ PASS (currently 90KB)
- Individual JS files: <30KB ⚠️ NEEDS WORK (quiz.js 24KB, testimonials.js 21KB)
- Critical path CSS: <14KB ❌ FAIL (need extraction)

---

## Summary

**Performance Status:** NEEDS OPTIMIZATION

**Estimated Performance Impact:**
- Critical fixes (3): **High potential improvement** (~500-800ms faster load)
- High priority fixes (2): **Medium potential improvement** (~200-400ms faster)
- Total potential improvement: **Significant** (estimated 25-35% faster initial load)

**Next Steps:**
1. Add defer attribute to non-critical scripts (immediate)
2. Add resource hints for Google Fonts and external CDNs (immediate)
3. Externalize testimonials and carousel data to JSON files (short-term)
4. Implement API response caching with sessionStorage (short-term)
5. Extract inline header scroll script to separate file (medium-term)

---

## Recommended Actions

### Fix 1: Add defer to Scripts (index.html and all HTML files)

```html
<!-- ❌ BEFORE (BLOCKING) -->
<script src="js/animations.js"></script>
<script src="js/carousel.js"></script>
<script src="js/testimonials.js"></script>
<script src="js/quiz.js"></script>
<script src="js/modals.js"></script>
<script src="js/faq.js"></script>
<script src="js/main.js"></script>

<!-- ✅ AFTER (NON-BLOCKING) -->
<script src="js/animations.js" defer></script>
<script src="js/carousel.js" defer></script>
<script src="js/testimonials.js" defer></script>
<script src="js/quiz.js" defer></script>
<script src="js/modals.js" defer></script>
<script src="js/faq.js" defer></script>
<script src="js/main.js" defer></script>

<!-- NOTE: defer maintains execution order, scripts run after DOM is parsed -->
```

**Impact:** Reduces blocking time by 300-500ms, improves First Contentful Paint (FCP)

---

### Fix 2: Add Resource Hints (all HTML files)

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IAML - Institute for Applied Management & Law</title>

  <!-- ✅ ADD THESE RESOURCE HINTS -->
  <!-- Preconnect to external domains (DNS + TCP + TLS handshake) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">

  <!-- DNS prefetch for analytics (lower priority than preconnect) -->
  <link rel="dns-prefetch" href="https://www.google-analytics.com">
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">

  <!-- Preload critical resources -->
  <link rel="preload" href="css/main.css" as="style">
  <link rel="preload" href="js/main.js" as="script">

  <!-- Existing stylesheets -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">
  <link rel="stylesheet" href="css/main.css">
</head>
```

**Impact:** Reduces font loading time by ~200ms, improves perceived performance

---

### Fix 3: Externalize Testimonials Data

**Step 1:** Create `data/testimonials.json`
```json
[
  {
    "name": "John Doe",
    "text": "Great course, highly recommended!",
    "rating": 5,
    "program": "Employee Relations"
  },
  {
    "name": "Jane Smith",
    "text": "Excellent content and instructors.",
    "rating": 5,
    "program": "HR Management"
  }
  // ... rest of testimonials
]
```

**Step 2:** Update `js/testimonials.js`
```javascript
// ❌ OLD (21KB hardcoded data)
const testimonials = [
  { name: "John Doe", text: "Great...", rating: 5 },
  // ... 100+ more entries
];

function initTestimonials() {
  const splide = new Splide('.testimonials-slider', {
    // ... config
  });
  splide.mount();
}

// ✅ NEW (fetch data on demand)
let testimonials = [];

async function loadTestimonials() {
  try {
    const response = await fetch('data/testimonials.json');
    testimonials = await response.json();
    return testimonials;
  } catch (error) {
    console.error('Failed to load testimonials:', error);
    return [];
  }
}

async function initTestimonials() {
  // Load data first
  await loadTestimonials();

  // Then initialize carousel
  const splide = new Splide('.testimonials-slider', {
    // ... config
  });
  splide.mount();
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initTestimonials);
```

**Impact:** Reduces initial JS bundle by 21KB, allows lazy loading

---

### Fix 4: Implement API Response Caching

**Example: Caching program data in quiz.js**

```javascript
// ❌ OLD (no caching, fetches every time)
async function getProgramData() {
  const response = await fetch('/api/airtable-programs');
  return response.json();
}

// ✅ NEW (with sessionStorage caching)
async function getProgramData() {
  const cacheKey = 'iaml-program-data';
  const cacheExpiry = 5 * 60 * 1000; // 5 minutes

  // Check cache first
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);

      // Return cached data if still valid
      if (Date.now() - timestamp < cacheExpiry) {
        console.log('Using cached program data');
        return data;
      }
    } catch (e) {
      // Invalid cache, proceed to fetch
      sessionStorage.removeItem(cacheKey);
    }
  }

  // Fetch fresh data
  console.log('Fetching fresh program data');
  const response = await fetch('/api/airtable-programs');
  const data = await response.json();

  // Store in cache
  sessionStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));

  return data;
}
```

**Benefits:**
- Eliminates redundant network requests
- Faster subsequent interactions
- Reduces server load
- Works across page navigation (sessionStorage)

---

### Fix 5: Extract Inline Header Scroll Script

**Step 1:** Create `js/header-scroll.js`
```javascript
// Extract inline script to external file
(function() {
  'use strict';

  const header = document.querySelector('header');
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;

    if (scrollY > 100) {
      header.classList.add('scrolled');

      if (scrollY > lastScrollY) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
    } else {
      header.classList.remove('scrolled', 'hidden');
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
})();
```

**Step 2:** Update HTML files
```html
<!-- ❌ REMOVE INLINE SCRIPT (100+ lines) -->
<script>
  // Long inline header scroll behavior...
</script>

<!-- ✅ ADD EXTERNAL SCRIPT WITH DEFER -->
<script src="js/header-scroll.js" defer></script>
```

**Benefits:**
- Browser can cache the script
- Reduces HTML file size
- Improves code organization
- Allows defer loading

---

**Report Generated:** 2025-12-05 18:30:00
**Next Review Recommended:** After implementing critical and high priority fixes
```

---

## Important Notes

- **Performance:** This scan should complete in under 60 seconds
- **Accuracy:** Focuses on vanilla JavaScript architecture, no framework suggestions
- **Progressive Enhancement:** Ensures optimizations don't break no-JS fallbacks
- **Actionable:** Always provides specific file paths, line numbers, and code examples
- **Context:** Explains the "why" behind each optimization, not just the "what"
- **IAML-Specific:** Respects the vanilla JS architecture and zero-build philosophy

---

## Quick Reference: Bash Commands for Performance Analysis

**Use these commands to gather data (run in parallel when possible):**

```bash
# File size analysis
find js -name "*.js" -type f -exec wc -c {} \; | sort -n -r
find css -name "*.css" -type f -exec wc -c {} \; | sort -n -r

# Count images and lazy loading
grep -rn "<img" . --include="*.html" | wc -l
grep -rn "data-src\|loading=\"lazy\"" . --include="*.html" | wc -l

# Find blocking scripts
grep -rn "<script src" . --include="*.html" | grep -v "async\|defer"

# Find resource hints
grep -rn "preconnect\|preload\|dns-prefetch" . --include="*.html"

# Find scroll/resize events
grep -rn "addEventListener.*scroll\|addEventListener.*resize" js/ --include="*.js"

# Find fetch calls
grep -rn "fetch\(" js/ --include="*.js"

# Find console statements
grep -rn "console\.\(log\|warn\|debug\)" js/ --include="*.js"

# Find inline scripts
grep -c "<script>" index.html

# Check for animations
grep -rn "transition:\|animation:\|@keyframes" css/ --include="*.css"
```

---

## When to Run This Command

**Recommended:** Before deployment or after adding new features
- Catches performance regressions early
- Validates optimization strategies
- Ensures bundle sizes stay within budget
- Identifies quick wins for immediate impact
- Takes ~30-60 seconds to run

**Best practice:** Run weekly during active development, or whenever you:
- Add new JavaScript files
- Integrate new libraries
- Notice slower page loads
- Before major releases
- After implementing new features

**Integration:** Consider adding as a pre-deployment checklist item for maximum performance assurance
