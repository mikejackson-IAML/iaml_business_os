# IAML Website Development Guide

This file provides guidance to Claude Code when working on the IAML website. For detailed codebase structure, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Claude Code Behavior

**Before answering or making changes:**
1. **Read first** - Never speculate about code you haven't opened. If a file is mentioned, read it before responding.
2. **Check in before major changes** - Get approval before significant modifications to the codebase.
3. **Keep it simple** - Every change should impact as little code as possible. Avoid complex or sweeping changes.
4. **Explain at high level** - When making changes, describe what changed concisely, not every detail.
5. **Use ARCHITECTURE.md** - Reference it for codebase structure questions instead of guessing.
6. **Think first** - Read relevant files and understand context before answering questions about the codebase.

---

## Project Overview

**IAML (Institute for Applied Management & Law)** is an HR training company website with a static architecture focused on performance, simplicity, and maintainability.

**Key Principles:**
- Vanilla HTML5/CSS3/JavaScript (ES6+) - NO frameworks
- Zero build process for frontend - direct file editing
- Progressive enhancement - must work without JavaScript
- Mobile-first responsive design
- Minimal external dependencies (only Splide.js for carousels)

---

## Tech Stack

### Frontend
- **Pure vanilla JavaScript (ES6+)** - arrow functions, template literals, const/let
- **Semantic HTML5** - nav, main, section, article, etc.
- **Pure CSS3** - Grid, Flexbox, custom properties, media queries
- **Splide.js v4.1.4** - carousels/sliders only (no other JS libraries)

### CSS Architecture
HTML pages link to `main.css`, which imports from the 5-file system:

| File | Purpose |
|------|---------|
| `1-variables.css` | Design tokens (--color-*, --spacing-*, --font-*) |
| `2-base.css` | CSS reset, typography defaults |
| `3-components.css` | Buttons, cards, modals, forms |
| `4-layout.css` | Containers, grids, spacing utilities |
| `5-pages.css` | Page-specific styles (use prefixes: `.ct-`, `.about-`, etc.) |
| `mega-menu.css` | Navigation mega menu styles |

### Backend/APIs
- **Airtable API** - via `/api/` serverless proxies
- **Stripe** - payments, webhooks
- **GoHighLevel** - CRM webhooks
- **Google Analytics 4** - event tracking
- **Vercel** - hosting, serverless functions

### What We Don't Use
- ❌ React, Vue, Angular, or any framework
- ❌ Build tools (Webpack, Vite, etc.)
- ❌ TypeScript or CSS preprocessors
- ❌ npm packages for frontend (package.json exists for QA/Playwright only)

---

## Development Workflow

### Starting a Feature
1. Start in PLAN MODE: `claude --plan "Add [feature]"`
2. Read relevant files first
3. Check in with Mike before major changes
4. Commit after each working phase

### File Organization
- **HTML**: Root level for main pages, `/programs/` for program pages
- **CSS**: Use correct numbered file (see CSS Architecture above)
- **JS**: Separate modules for distinct features, descriptive names

### Required on All Pages
```html
<script src="js/components.js" defer></script>
<script src="js/utm-tracking.js" defer></script>  <!-- REQUIRED -->
```

### Progressive Enhancement
Every feature must work without JavaScript:
- Forms submit via standard HTTP POST
- Navigation works with regular links
- Content is accessible without JS
- JavaScript enhances, doesn't enable

---

## Code Standards

### HTML
```html
<nav> <main> <section> <article>  <!-- Semantic elements -->
<button aria-label="Close" aria-expanded="false">  <!-- ARIA attributes -->
```

### CSS
```css
.button {
  background: var(--color-primary);  /* Use variables */
  padding: var(--spacing-md);
}

/* Mobile-first: base styles for mobile, media queries for larger */
@media (min-width: 768px) { ... }
```

### JavaScript
```javascript
// ES6+ syntax, progressive enhancement
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  if (!form) return;
  form.addEventListener('submit', handleSubmit);
});

// API pattern (use serverless proxy)
const response = await fetch('/api/airtable-registrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

---

## QA & Testing

### Before Committing
| What Changed | Required QA |
|--------------|-------------|
| CSS | Visual regression: `npm run qa:visual` before AND after |
| Nav/paths/HTML | `/smoke` + `/links` |
| Layout/spacing | `npm run qa:visual` + `/responsive` |
| JavaScript | `/smoke` + `/semgrep-quick` |
| Registration/payment | `/registration-payment-gate` + `/smoke` |

### CSS Safety
- Pre-commit hook runs `qa/scripts/css-audit.js`
- Always use page prefixes in `5-pages.css` (e.g., `.ct-`, `.about-`)
- Run visual tests before and after CSS changes

### Accessibility Checklist
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Color contrast WCAG AA minimum
- [ ] Test with screen reader

### Responsive Checklist
- [ ] Test at 320px, 768px, 1024px+
- [ ] No horizontal scroll at any size

---

## Anti-Patterns

### Never Use
- Left border accents on cards (dated look)
- Heavy drop shadows
- Bright/saturated accent colors for large areas
- Gradients on text (except hero headings with care)

### Framework Translation
If a request sounds like it needs a framework, translate to vanilla:
- "Component state" → JS variables + localStorage
- "React hooks" → Event listeners + functions
- "npm package" → Vanilla JS or Splide.js only

### CSS Placement
| Type | File |
|------|------|
| Colors/spacing tokens | `1-variables.css` |
| Element defaults | `2-base.css` |
| Reusable components | `3-components.css` |
| Grids/containers | `4-layout.css` |
| Page-specific | `5-pages.css` (with prefix) |

---

## Slash Commands

| Command | Purpose |
|---------|---------|
| `/smoke` | Run smoke tests |
| `/links` | Check for broken links |
| `/responsive` | Test responsive breakpoints |
| `/a11y` | Accessibility audit |
| `/semgrep-quick` | Quick security scan |
| `/semgrep-full` | Full security scan |
| `/registration-payment-gate` | Verify registration flow |
| `/stripe-webhook-health` | Check Stripe webhook |
| `/vercel-latest-preview` | Test preview deployment |
| `/vercel-latest-prod` | Test production deployment |
| `/deployed-smoke` | Smoke test deployed site |
| `/fullqa` | Run all QA checks |

---

## Working with Mike

**Communication style:**
- Direct and efficient
- Appreciates specificity
- Values practical solutions over theory
- Likes to understand the "why" behind decisions

**Workflow preferences:**
- Build quality systems from the start
- Evidence-based, systematic approaches
- Avoid technical debt
- Commit after each working phase

---

## Git Commit Messages

```
feat: [concise description]

- [Key change 1]
- [Key change 2]

Tech: Vanilla JS/CSS, [integrations]
Tested: Mobile, progressive enhancement, accessibility
```

---

## Quick Reference

**File structure:**
```
/css/main.css (entry) + 1-5 files + mega-menu.css
/js/[feature].js
/api/[endpoint].js (serverless)
/components/[name].html
/programs/[program].html
```

**Start a feature:**
```bash
claude --plan "Add [feature description]"
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete codebase documentation.
