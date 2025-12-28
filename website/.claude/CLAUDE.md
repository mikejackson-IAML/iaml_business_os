# IAML Website Development Guide

This file provides guidance to Claude Code when working on the IAML website. It ensures all code follows our vanilla HTML/CSS/JS architecture and zero-build philosophy.

---

## Project Overview

**IAML (Institute for Applied Management & Law)** is an HR training company website with a static architecture focused on performance, simplicity, and maintainability.

**Key Principles:**
- Vanilla HTML5/CSS3/JavaScript (ES6+) - NO frameworks
- Zero build process - direct file editing
- Progressive enhancement - must work without JavaScript
- Minimal external dependencies
- Mobile-first responsive design

---

## Tech Stack (Non-Negotiable)

### Frontend
- **Pure vanilla JavaScript (ES6+)** - arrow functions, template literals, destructuring, const/let
- **Semantic HTML5** - nav, main, section, article, etc.
- **Pure CSS3** - CSS Grid, Flexbox, custom properties, media queries

### Only Allowed External Library
- **Splide.js v4.1.4** - for carousels/sliders ONLY
- No other JavaScript libraries allowed

### CSS Architecture (5-File System)
All styles are organized into 5 specific files:

1. **`1-variables.css`** - Design tokens, CSS custom properties (--color-*, --spacing-*, --font-*)
2. **`2-base.css`** - CSS reset, base element styles, typography defaults
3. **`3-components.css`** - Reusable component styles (buttons, cards, modals, forms)
4. **`4-layout.css`** - Layout utilities, grid systems, spacing helpers, containers
5. **`5-pages.css`** - Page-specific styles that don't fit elsewhere

**CSS Rules:**
- Use existing CSS custom properties from `1-variables.css`
- Mobile-first approach (base styles for mobile, media queries for larger)
- CSS Grid and Flexbox for layouts
- No inline styles
- No !important unless absolutely necessary

### JavaScript Structure
- **Modular approach** - separate .js files for different features
- **ES6+ syntax required**
- **Progressive enhancement** - graceful degradation without JS
- **Event delegation** where appropriate
- **Native Fetch API** for HTTP requests
- **IntersectionObserver** for lazy loading

### Backend/APIs
- **Airtable API** - form submissions, quiz responses, registrations
- **GoHighLevel Webhooks** - CRM integration, contact management
- **Google Cloud Storage** - image hosting
- **Google Analytics 4 (GA4)** - analytics tracking
- **Google Tag Manager (GTM)** - event tracking

### Hosting & Deployment
- **GitHub repository** with GitHub Pages
- **Git-based deployment**
- **No build process** - files served directly

### What We NEVER Use
- ❌ React, Vue, Angular, or any framework
- ❌ npm, package.json, node_modules
- ❌ Build tools (Webpack, Vite, Parcel, Rollup)
- ❌ TypeScript
- ❌ CSS preprocessors (Sass, Less, PostCSS)
- ❌ JavaScript bundlers or compilers
- ❌ Testing frameworks (for now)

---

## Development Workflow

### Starting a New Feature

**Always start in PLAN MODE:**
```
claude --plan "Add [feature description]"
```

**Mike's workflow:**
- Commits after each working phase


### File Organization

**HTML Files:**
- Root level for main pages (index.html, about.html, etc.)
- Keep structure semantic and accessible

**CSS Files:**
- Place styles in the correct numbered file (1-5)
- Reference existing custom properties before creating new ones
- Check `1-variables.css` first for available tokens

**JavaScript Files:**
- Create separate modules for distinct features
- Name descriptively (e.g., `quizModal.js`, `formHandler.js`)
- Keep functions small and focused
- Comment complex logic

### Required Scripts for All Pages

**UTM Tracking Script (REQUIRED on every page):**
The `utm-tracking.js` script must be included on ALL pages to capture marketing attribution data.

```html
<!-- Dynamic Component Loading -->
<script src="js/components.js" defer></script>
<script src="js/utm-tracking.js" defer></script>  <!-- REQUIRED -->
<script src="js/headerBehavior.js" defer></script>
<script src="js/mobileMenu.js" defer></script>
```

- Placement: Immediately after `components.js`, before other feature scripts
- For pages in subdirectories (e.g., `/pages/`, `/programs/`), use `../js/utm-tracking.js`
- This script captures UTM parameters, landing page, and referring URL for registration attribution

### Progressive Enhancement Requirements

**Every feature must work without JavaScript:**
- Forms submit via standard HTTP POST
- Navigation works with regular links
- Content is accessible without JS
- JavaScript enhances, doesn't enable

**Test checklist:**
1. Disable JavaScript in browser
2. Verify basic functionality works
3. Re-enable JavaScript
4. Verify enhanced functionality

---

## Code Standards

### HTML
```html
<!-- Use semantic elements -->
<nav> <main> <section> <article> <aside> <footer>

<!-- Include ARIA attributes -->
<button aria-label="Close modal" aria-expanded="false">

<!-- No inline styles or JavaScript -->
<div class="card">Not this: <div style="color: red;">
```

### CSS
```css
/* Use CSS custom properties from 1-variables.css */
.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
  font-family: var(--font-body);
}

/* Mobile-first approach */
.container {
  width: 100%; /* Mobile default */
}

@media (min-width: 768px) {
  .container {
    width: 750px; /* Tablet and up */
  }
}

/* Use CSS Grid and Flexbox */
.layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}
```

### JavaScript
```javascript
// ES6+ syntax
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Progressive enhancement
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  
  // Enhanced functionality with JavaScript
  form.addEventListener('submit', handleSubmit);
});

// Template literals for HTML
const createCard = (title, content) => `
  <div class="card">
    <h3>${title}</h3>
    <p>${content}</p>
  </div>
`;
```

---

## API Integration Patterns

### Airtable API
```javascript
const submitToAirtable = async (formData) => {
  const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0/YOUR_BASE_ID';
  const AIRTABLE_TABLE = 'Table_Name';
  
  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}/${AIRTABLE_TABLE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: formData
      })
    });
    
    if (!response.ok) throw new Error('Airtable submission failed');
    return await response.json();
  } catch (error) {
    console.error('Airtable error:', error);
    // Show user-friendly error message
    throw error;
  }
};
```

### GoHighLevel Webhook
```javascript
const submitToGoHighLevel = async (contactData) => {
  const GHL_WEBHOOK_URL = 'YOUR_WEBHOOK_URL';
  
  try {
    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });
    
    if (!response.ok) throw new Error('GoHighLevel submission failed');
    return await response.json();
  } catch (error) {
    console.error('GoHighLevel error:', error);
    throw error;
  }
};
```

### GA4/GTM Event Tracking
```javascript
// Track custom events
const trackEvent = (eventName, parameters = {}) => {
  if (typeof gtag === 'function') {
    gtag('event', eventName, parameters);
  }
};

// Example usage
trackEvent('form_submission', {
  form_type: 'contact',
  form_location: 'homepage'
});
```

---

## Common Patterns

### Modal Component
```javascript
class Modal {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.closeBtn = this.modal?.querySelector('[data-modal-close]');
    this.init();
  }
  
  init() {
    if (!this.modal) return;
    
    this.closeBtn?.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });
  }
  
  open() {
    this.modal.classList.add('is-active');
    this.modal.setAttribute('aria-hidden', 'false');
    // Trap focus
    this.trapFocus();
  }
  
  close() {
    this.modal.classList.remove('is-active');
    this.modal.setAttribute('aria-hidden', 'true');
  }
  
  isOpen() {
    return this.modal.classList.contains('is-active');
  }
  
  trapFocus() {
    // Focus trapping logic
  }
}
```

### Form Handler
```javascript
const handleFormSubmit = async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Disable form during submission
  form.classList.add('is-submitting');
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  
  try {
    // Submit to APIs
    await Promise.all([
      submitToAirtable(data),
      submitToGoHighLevel(data)
    ]);
    
    // Track success
    trackEvent('form_submission_success', { form_id: form.id });
    
    // Show success message
    showSuccessMessage();
    form.reset();
    
  } catch (error) {
    // Track error
    trackEvent('form_submission_error', { 
      form_id: form.id,
      error: error.message 
    });
    
    // Show error message
    showErrorMessage('Something went wrong. Please try again.');
    
  } finally {
    // Re-enable form
    form.classList.remove('is-submitting');
    submitBtn.disabled = false;
  }
};
```

### Lazy Loading Images
```javascript
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', lazyLoadImages);
```

---

## Accessibility Requirements

**Always include:**
- ARIA labels for interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus indicators visible
- Color contrast WCAG AA minimum
- Screen reader support
- Focus trapping in modals
- Skip links for navigation

**Test with:**
- Keyboard only (no mouse)
- Screen reader (NVDA, JAWS, VoiceOver)
- Browser dev tools accessibility panel

---

## Testing Checklist

**Before committing:**

1. **Progressive Enhancement**
   - [ ] Test with JavaScript disabled
   - [ ] Verify fallback functionality works
   - [ ] Re-enable JavaScript and verify enhancements

2. **Responsive Design**
   - [ ] Test at 320px (small mobile)
   - [ ] Test at 768px (tablet)
   - [ ] Test at 1024px+ (desktop)
   - [ ] No horizontal scroll at any size

3. **Accessibility**
   - [ ] Tab through all interactive elements
   - [ ] Test Enter key on buttons/links
   - [ ] Test Escape key to close modals
   - [ ] Verify focus indicators visible
   - [ ] Check with screen reader

4. **Functionality**
   - [ ] All features work as expected
   - [ ] Forms submit correctly
   - [ ] API integrations successful
   - [ ] Error handling works
   - [ ] Loading states display

5. **Code Quality**
   - [ ] No console errors or warnings
   - [ ] Valid HTML (W3C validator)
   - [ ] Valid CSS (W3C CSS validator)
   - [ ] Code is commented where needed
   - [ ] Files in correct locations

6. **Performance**
   - [ ] Images lazy load correctly
   - [ ] No layout shift (CLS)
   - [ ] Page loads quickly
   - [ ] No janky animations

---

## CSS Safety & Visual Regression Testing

**CRITICAL: Preventing CSS Regressions**

CSS is global by default. Changes to one file can break other pages. We have two safeguards:

### 1. Pre-commit CSS Audit Hook

When you commit CSS changes, a hook automatically runs `qa/scripts/css-audit.js`:
- **HIGH RISK**: Modifying base HTML elements, universal selectors, global classes
- **MEDIUM RISK**: Unprefixed classes in `5-pages.css`, component class changes
- **LOW RISK**: Using `!important`, new media queries

**To bypass (use sparingly):** `git commit --no-verify`

### 2. Visual Regression Tests

Run before AND after CSS changes:

```bash
# Run visual tests (compares against baseline screenshots)
npx playwright test visual-regression

# Update baselines after intentional changes
npx playwright test visual-regression --update-snapshots
```

### CSS Naming Convention for Page-Specific Styles

**Always prefix page-specific classes in `5-pages.css`:**

| Page | Prefix |
|------|--------|
| Corporate Training | `.ct-` |
| About Us | `.about-` |
| Featured Programs | `.fp-` |
| Faculty | `.faculty-` |
| Program Schedule | `.ps-` |
| Program pages | `.erl-`, `.shr-`, etc. |

**Example:**
```css
/* GOOD - Scoped to corporate training */
.ct-hero-wrapper { ... }
.ct-benefit-card { ... }

/* BAD - Could affect other pages */
.hero-wrapper { ... }
.benefit-card { ... }
```

### CSS Change Workflow

1. **Before making CSS changes:**
   ```bash
   npx playwright test visual-regression
   ```

2. **Make your CSS changes** (use proper prefixes!)

3. **Run visual tests again:**
   ```bash
   npx playwright test visual-regression
   ```

4. **If tests fail:**
   - Review the diff images in `playwright-report/`
   - If changes are intentional: `--update-snapshots`
   - If changes are unintentional: fix your CSS

5. **Commit** (pre-commit hook will run CSS audit)

---

## QA Workflow

**Claude should automatically run the appropriate QA based on what was changed:**

| What Changed | Required QA |
|--------------|-------------|
| CSS (any file) | `npm run qa:visual` before AND after (mandatory) |
| Nav/paths/assets/HTML | `/smoke` + `/links` |
| Layout/spacing/responsive | `npm run qa:visual` + `/responsive` |
| JavaScript | `/smoke` + `/semgrep-quick` |
| Registration/payment flow | `/registration-payment-gate` + `/stripe-verify-latest-test-payment` + `/smoke` |

### Quick Chooser (for Claude)

When finishing work, run QA based on files touched:

- **Touched CSS?** → Visual regression is mandatory. Run `npm run qa:visual`. If tests fail, review diffs and either fix CSS or update baselines with `npm run qa:visual:update`.
- **Touched nav/paths/assets?** → Run `/smoke` + `/links`
- **Touched layout/spacing?** → Run `npm run qa:visual` + `/responsive`
- **Touched JS?** → Run `/smoke` + `/semgrep-quick`
- **Touched registration/payment?** → Run `/registration-payment-gate` + Stripe verify + `/smoke`

### End-of-Session Closeout

Before committing, ensure:
1. Visual tests are clean OR baselines intentionally updated
2. If JS/HTML changed: Semgrep quick scan is clean
3. If registration/payment touched: registration gate + Stripe verify passed

### Deployed Checks (Vercel)

- **Preview validation:** `/vercel-latest-preview` → run tests against preview URL
- **Production health:** `/vercel-latest-prod` + `/deployed-smoke`
- **Stripe webhook health:** `/stripe-webhook-health`

---

## When Mike Asks for Features

**Your job is to:**

1. **Understand the request** - Ask clarifying questions if needed:
   - "Should this use existing component styles or create new ones?"
   - "What triggers this? (user action, page load, scroll, etc.)"
   - "Does this need to work without JavaScript?"
   - "Which pages should this appear on?"
   - "Should this integrate with Airtable/GoHighLevel/GA4?"

2. **Reference previous work** when similar features exist:
   - "This is similar to [previous feature]. Should we follow the same pattern?"
   - "We can reuse the existing [component]. Should I extend it?"

3. **Create a plan** that includes:
   - Which files will be created/modified
   - Where CSS goes (which of the 5 files)
   - Progressive enhancement strategy
   - API integrations needed
   - Testing requirements

4. **Write vanilla code** that:
   - Uses ES6+ JavaScript
   - Follows the CSS architecture
   - Works without JavaScript first
   - Includes accessibility features
   - Has proper error handling
   - Is well-commented

5. **Provide testing guidance:**
   - How to test the feature
   - What to check for
   - Common pitfalls to avoid

---

## Anti-Patterns to Prevent

**If Mike's request sounds like it needs a framework, translate to vanilla:**
- "Component state" → JavaScript variables + localStorage
- "React hooks" → Event listeners + functions
- "JSX" → Template literals or createElement
- "npm package" → Vanilla JS solution or Splide.js only

**Never suggest:**
- Installing packages via npm
- Using a build tool
- Adding a JavaScript framework
- Using a CSS preprocessor
- TypeScript (we use vanilla JS)

**If unsure where CSS goes:**
- New colors/spacing values → `1-variables.css`
- Body/heading/link defaults → `2-base.css`
- Reusable buttons/cards/modals → `3-components.css`
- Grid systems/containers → `4-layout.css`
- Homepage hero specific → `5-pages.css`

---

## Git Commit Messages

**Format:**
```
feat: [concise feature description]

- [Key change 1]
- [Key change 2]
- [Key change 3]

Tech: Vanilla JS/CSS, [integrations if applicable]
Tested: Mobile responsive, progressive enhancement, accessibility
```

**Examples:**
```
feat: add quiz results modal with Airtable integration

- Created modal component with accessibility features
- Integrated Airtable API for score storage
- Added GA4 event tracking
- Implemented keyboard navigation (Tab, Enter, Escape)

Tech: Vanilla JS/CSS, Airtable API, GA4
Tested: Mobile responsive, progressive enhancement, accessibility
```

---

## Mike's Development Style

**Preferences:**
- 60-minute coding sessions
- Uses Cursor IDE with Claude Code
- Prefers to build quality systems from the start
- Values evidence-based, systematic approaches
- Likes to avoid technical debt
- Commits after each working phase

**Communication style:**
- Direct and efficient
- Appreciates specificity
- Values practical solutions over theory
- Likes to understand the "why" behind decisions

---

## Important Notes

- **Progressive enhancement is non-negotiable** - always ask about no-JS fallback
- **CSS architecture matters** - styles must go in the correct file
- **Performance is critical** - minimize dependencies, optimize load times
- **Accessibility is required** - keyboard nav, ARIA, screen readers
- **Mobile-first always** - design for small screens first
- **Use existing patterns** - check what's already built before creating new

---

## Quick Reference

**Start a feature in plan mode:**
```bash
claude --plan "Add testimonial carousel using Splide"
```

**Common commands:**
```bash
# Clear context for new task
/clear

# Show available commands
/help

# Show project settings
/config
```

**File structure:**
```
/css
  1-variables.css
  2-base.css
  3-components.css
  4-layout.css
  5-pages.css
/js
  [feature-name].js
/images
  [images from Google Cloud Storage]
index.html
[other-pages].html
```

---

This guide ensures every feature you build for IAML follows our vanilla architecture, maintains code quality, and provides excellent user experience across all devices and capabilities.
