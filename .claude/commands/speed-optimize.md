# Speed Optimizer Employee

A comprehensive website performance optimization agent that leverages multiple MCP servers to analyze, optimize, and validate website speed.

## Usage

```
/speed-optimize [target] [mode]
```

**Targets:**
- `all` - Full site audit (default)
- `homepage` - Just index.html
- `programs` - All program pages
- `[file-path]` - Specific file (e.g., `website/programs/employee-relations-law.html`)

**Modes:**
- `audit` - Analysis only, no changes (default)
- `fix` - Apply automated fixes
- `validate` - Run validation checks only

**Examples:**
- `/speed-optimize` - Full site audit
- `/speed-optimize homepage fix` - Audit and fix homepage
- `/speed-optimize programs audit` - Audit all program pages

---

## Architecture

```
                    SPEED OPTIMIZER EMPLOYEE
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐ │
    │  │  ANALYZE        │  │  OPTIMIZE    │  │  VALIDATE  │ │
    │  ├─────────────────┤  ├──────────────┤  ├────────────┤ │
    │  │ PageSpeed API   │  │ Images       │  │ Lighthouse │ │
    │  │ Lighthouse      │  │ JS/CSS       │  │ Playwright │ │
    │  │ Code Analysis   │  │ Caching      │  │ Visual     │ │
    │  │ GSC (CrUX)      │  │ Loading      │  │ Regression │ │
    │  └─────────────────┘  └──────────────┘  └────────────┘ │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

---

## MCP Servers Used

| Server | Purpose | Required |
|--------|---------|----------|
| **lighthouse** | Performance audits, Core Web Vitals | Yes |
| **pagespeed-insights** | Google PageSpeed API, network analysis | Yes |
| **playwright** | Visual regression, browser testing | Yes |
| **cloudinary** | Image optimization, format conversion | Optional |
| **google-search-console** | Real user data (CrUX), field metrics | Optional |
| **sentry** | Error tracking, performance monitoring | Optional |
| **vercel** | Edge caching, deployment insights | Optional |

---

## PHASE 1: Discovery & Baseline

### Step 1.1: Identify Target Files

Based on the target parameter:

**If `all` or no target:**
```bash
# Get all HTML files
find website -name "*.html" -type f | head -50
```

**If `homepage`:**
- Target: `website/index.html`

**If `programs`:**
```bash
ls website/programs/*.html | head -30
```

**If specific file:**
- Verify file exists
- Use provided path

### Step 1.2: Gather File Size Baseline

Run these commands in parallel:

```bash
# JavaScript bundle sizes
find website/js -name "*.js" -type f -exec wc -c {} \; | sort -n -r

# CSS bundle sizes
find website/css -name "*.css" -type f -exec wc -c {} \; | sort -n -r

# Image inventory (if applicable)
find website -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" -o -name "*.gif" \) -exec ls -lh {} \; 2>/dev/null | head -20
```

### Step 1.3: Report Baseline

```
=== Speed Optimizer Employee ===
Target: [target]
Mode: [audit/fix/validate]

📊 BASELINE METRICS
─────────────────────
JavaScript: [X] files, [Y] KB total
  - Largest: [file] ([Z] KB)
CSS: [X] files, [Y] KB total
  - Largest: [file] ([Z] KB)
HTML: [X] files
Images: [X] files (if scanned)

>>> Starting analysis...
```

---

## PHASE 2: MCP-Powered Analysis

### Step 2.1: PageSpeed Insights Analysis

**Use pagespeed-insights MCP** (if available):

For each target URL (prioritize homepage, then top program pages):

1. **Get performance summary**
   - Overall score (mobile & desktop)
   - Core Web Vitals: LCP, CLS, INP
   - Speed Index, Time to Interactive

2. **Get visual analysis**
   - Screenshot of render timeline
   - Filmstrip view of loading

3. **Get network analysis**
   - Request waterfall
   - Resource loading order
   - Third-party impact

4. **Get recommendations**
   - Prioritized improvements
   - Estimated savings per fix

**If MCP not available:**
- Note: "PageSpeed MCP not configured. Using code analysis only."
- Continue with local analysis

### Step 2.2: Lighthouse Audit

**Use lighthouse MCP** (if available):

Run Lighthouse for categories:
- Performance
- Accessibility (for WCAG compliance)
- Best Practices
- SEO

**Extract key metrics:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Speed Index

**If MCP not available:**
- Provide manual Lighthouse command:
```bash
npx lighthouse https://iaml.com --output=json --quiet
```

### Step 2.3: Google Search Console (Field Data)

**Use google-search-console MCP** (if available):

Query Core Web Vitals report:
- Real user LCP, CLS, INP
- URL-level performance data
- Mobile vs Desktop comparison

This provides **field data** (real users) vs **lab data** (simulated).

**If MCP not available:**
- Note: "GSC MCP not configured. Skipping field data analysis."

### Step 2.4: Cloudinary Image Analysis

**Use cloudinary MCP** (if available):

For images found in target:
- Current format and size
- Potential savings with WebP/AVIF
- Recommended dimensions
- Quality optimization opportunities

**If MCP not available:**
- Note: "Cloudinary MCP not configured. Manual image optimization recommended."

---

## PHASE 3: Code Analysis

### Step 3.1: Script Loading Analysis

Search for blocking scripts:

```bash
# Find scripts without async/defer
grep -rn "<script src" website/*.html website/programs/*.html 2>/dev/null | grep -v "async\|defer"
```

**Classify each script:**
- 🔴 BLOCKING: No async/defer (must fix)
- 🟡 ASYNC: Loads independently (OK)
- 🟢 DEFER: Executes after DOM parse (best)

### Step 3.2: Resource Hints Check

Search for resource hints:

```bash
# Check for preconnect, preload, dns-prefetch
grep -rn "preconnect\|preload\|dns-prefetch" website/*.html | head -20
```

**Expected hints:**
- `preconnect` for: fonts.googleapis.com, fonts.gstatic.com, cdn.jsdelivr.net
- `dns-prefetch` for: google-analytics.com, googletagmanager.com
- `preload` for: critical CSS, main.js, hero images

### Step 3.3: Lazy Loading Verification

```bash
# Find all images
grep -rn "<img" website/*.html website/programs/*.html 2>/dev/null | wc -l

# Find lazy-loaded images
grep -rn 'loading="lazy"\|data-src' website/*.html website/programs/*.html 2>/dev/null | wc -l
```

**Analysis:**
- Calculate % of images with lazy loading
- Identify above-fold images (should NOT be lazy)
- Flag below-fold images without lazy loading

### Step 3.4: Event Listener Efficiency

```bash
# Find scroll/resize without optimization
grep -rn "addEventListener.*scroll\|addEventListener.*resize" website/js/*.js
```

**Check for:**
- Debounce/throttle usage
- Passive event listeners
- RequestAnimationFrame for animations

### Step 3.5: Caching Strategy Review

```bash
# Check fetch calls
grep -rn "fetch(" website/js/*.js | head -20

# Look for caching patterns
grep -rn "sessionStorage\|localStorage" website/js/*.js | head -10
```

**Analyze:**
- Are API responses cached?
- Is there cache invalidation?
- Static data that could be cached?

---

## PHASE 4: Analysis Report

Generate comprehensive report:

```
═══════════════════════════════════════════════════════════════
                    SPEED OPTIMIZATION REPORT
═══════════════════════════════════════════════════════════════

📅 Date: [timestamp]
🎯 Target: [target]
⚙️ Mode: [audit/fix/validate]

───────────────────────────────────────────────────────────────
                       CORE WEB VITALS
───────────────────────────────────────────────────────────────

Metric          Target    Current   Status
─────────────────────────────────────────
LCP             <2.5s     [X.Xs]    [🟢/🟡/🔴]
CLS             <0.1      [X.XX]    [🟢/🟡/🔴]
INP             <200ms    [Xms]     [🟢/🟡/🔴]
FCP             <1.8s     [X.Xs]    [🟢/🟡/🔴]
Speed Index     <3.4s     [X.Xs]    [🟢/🟡/🔴]

───────────────────────────────────────────────────────────────
                      PERFORMANCE SCORE
───────────────────────────────────────────────────────────────

PageSpeed Score: [XX]/100 [Mobile] | [XX]/100 [Desktop]
Lighthouse:      [XX]/100

───────────────────────────────────────────────────────────────
                        ISSUES FOUND
───────────────────────────────────────────────────────────────

🔴 CRITICAL ([X] issues)
────────────────────────
1. [Issue description]
   File: [path]
   Impact: [estimated improvement]
   Fix: [specific action]

2. [Next issue...]

🟡 HIGH PRIORITY ([X] issues)
─────────────────────────────
1. [Issue description]
   ...

🟢 MEDIUM PRIORITY ([X] issues)
───────────────────────────────
1. [Issue description]
   ...

📋 LOW PRIORITY ([X] issues)
─────────────────────────────
1. [Issue description]
   ...

───────────────────────────────────────────────────────────────
                      BUNDLE ANALYSIS
───────────────────────────────────────────────────────────────

JavaScript Budget: 150 KB | Current: [X] KB | [✅/⚠️/❌]
CSS Budget:        100 KB | Current: [X] KB | [✅/⚠️/❌]

Largest Files:
• [file.js] - [X] KB [needs splitting?]
• [file.css] - [X] KB [needs splitting?]

───────────────────────────────────────────────────────────────
                      QUICK WINS
───────────────────────────────────────────────────────────────

These fixes provide the highest impact with lowest effort:

1. [Quick win #1]
   Estimated impact: [X]ms faster
   Effort: [Low/Medium]

2. [Quick win #2]
   ...

3. [Quick win #3]
   ...

───────────────────────────────────────────────────────────────
                      RECOMMENDATIONS
───────────────────────────────────────────────────────────────

Immediate (do now):
• [Action item 1]
• [Action item 2]

Short-term (this week):
• [Action item 3]
• [Action item 4]

Long-term (consider):
• [Action item 5]
• [Action item 6]

═══════════════════════════════════════════════════════════════
```

---

## PHASE 5: Automated Fixes (if mode=fix)

### Step 5.1: Script Loading Fixes

For each blocking script, add `defer` attribute:

```html
<!-- Before -->
<script src="js/animations.js"></script>

<!-- After -->
<script src="js/animations.js" defer></script>
```

**Files to modify:**
- All `.html` files in target scope
- Exclude scripts that must be synchronous (document.write, etc.)

### Step 5.2: Add Resource Hints

Insert into `<head>` of each HTML file:

```html
<!-- Preconnect for external domains -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net">

<!-- DNS prefetch for analytics -->
<link rel="dns-prefetch" href="https://www.google-analytics.com">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
```

### Step 5.3: Add Lazy Loading

For images that should be lazy-loaded:

```html
<!-- Before -->
<img src="image.jpg" alt="...">

<!-- After -->
<img src="image.jpg" alt="..." loading="lazy">
```

**Rules:**
- Skip hero/above-fold images
- Skip images with `fetchpriority="high"`
- Add to all other images

### Step 5.4: Add Passive Listeners

For scroll/resize listeners, ensure passive option:

```javascript
// Before
window.addEventListener('scroll', handler);

// After
window.addEventListener('scroll', handler, { passive: true });
```

### Step 5.5: Fix Report

```
=== FIXES APPLIED ===

Script Loading:
✓ Added defer to [X] scripts across [Y] files

Resource Hints:
✓ Added preconnect for Google Fonts
✓ Added dns-prefetch for analytics

Lazy Loading:
✓ Added loading="lazy" to [X] images

Event Listeners:
✓ Added passive option to [X] listeners

Files Modified:
• [file1.html]
• [file2.html]
• [file3.js]
...

>>> Run `/speed-optimize validate` to verify improvements
```

---

## PHASE 6: Validation (if mode=validate or after fix)

### Step 6.1: Re-run Lighthouse

Compare before/after metrics if available.

### Step 6.2: Visual Regression Test

**Use playwright MCP:**

```
Take screenshots of key pages:
- Homepage (desktop & mobile)
- A program page (desktop & mobile)
- Compare against baseline (if exists)
```

### Step 6.3: Smoke Test

Verify no functionality broken:
- Navigation works
- Modals open
- Forms submit
- Images load

### Step 6.4: Validation Report

```
=== VALIDATION RESULTS ===

Performance:
• PageSpeed Score: [before] → [after] ([+/-X])
• LCP: [before] → [after]
• CLS: [before] → [after]

Visual Regression:
• Homepage: [✅ No changes / ⚠️ Minor changes / ❌ Significant changes]
• Programs: [✅/⚠️/❌]

Functionality:
• Navigation: ✅
• Modals: ✅
• Forms: ✅
• Images: ✅

>>> Optimization complete!
```

---

## MCP Setup Requirements

To use all features, configure these MCP servers:

### Required API Keys

Add to your environment or `.env` file:

```bash
# PageSpeed Insights (required for analysis)
# Get from: https://console.cloud.google.com/apis/credentials
# Enable: PageSpeed Insights API
export PAGESPEED_API_KEY="your-api-key"

# Cloudinary (optional, for image optimization)
# Get from: https://console.cloudinary.com/settings/api-keys
export CLOUDINARY_CLOUD_NAME="your-cloud-name"
export CLOUDINARY_API_KEY="your-api-key"
export CLOUDINARY_API_SECRET="your-api-secret"

# Sentry (optional, for error tracking)
# Get from: https://sentry.io/settings/account/api/auth-tokens/
export SENTRY_AUTH_TOKEN="your-auth-token"
export SENTRY_ORG="your-org-slug"
```

### Lighthouse MCP

Already configured in `.mcp.json.backup`:
```json
"lighthouse": {
  "command": "npx",
  "args": ["-y", "@danielsogl/lighthouse-mcp"]
}
```

### Playwright MCP

Already configured:
```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest"]
}
```

---

## Quick Reference

### Common Optimization Patterns

| Issue | Fix | Impact |
|-------|-----|--------|
| Blocking scripts | Add `defer` attribute | High |
| No preconnect | Add `<link rel="preconnect">` | Medium |
| Large images | Convert to WebP, resize | High |
| No lazy loading | Add `loading="lazy"` | Medium |
| Scroll jank | Add `passive: true` | Low |
| No caching | Add sessionStorage cache | Medium |

### Performance Budgets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| LCP | <2.5s | 2.5-4s | >4s |
| CLS | <0.1 | 0.1-0.25 | >0.25 |
| INP | <200ms | 200-500ms | >500ms |
| JS Total | <150KB | 150-250KB | >250KB |
| CSS Total | <100KB | 100-150KB | >150KB |

### When to Run

- **Before deployment**: Full audit
- **After new features**: Validate mode
- **Weekly**: Quick audit to catch regressions
- **After adding libraries**: Bundle size check

---

## Integration with Other Commands

This command works well with:

- `/seo-optimize` - Run SEO audit after performance fixes
- `/smoke` - Verify functionality after fixes
- `/deploy` - Deploy optimized code to production

**Suggested workflow:**
```
1. /speed-optimize all audit      # Identify issues
2. /speed-optimize all fix        # Apply fixes
3. /speed-optimize all validate   # Verify improvements
4. /smoke                         # Test functionality
5. /deploy                        # Ship it!
```

---

## Troubleshooting

### PageSpeed MCP not responding
- Verify API key is set: `echo $PAGESPEED_API_KEY`
- Check API quota: https://console.cloud.google.com/apis/api/pagespeedonline.googleapis.com

### Lighthouse timeout
- Run on fewer pages
- Increase timeout in MCP config

### Cloudinary connection failed
- Verify credentials: `echo $CLOUDINARY_CLOUD_NAME`
- Check API status: https://status.cloudinary.com

### Visual regression false positives
- Dynamic content may cause differences
- Check for date/time elements
- Verify scroll position is consistent
