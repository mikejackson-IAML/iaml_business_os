# Frontend Developer

**Department:** CTO
**Level:** Specialist
**Reports to:** Development Manager
**Nickname:** "The Builder"

---

## Role Summary

The Frontend Developer builds and maintains the website's user interface, implements new features, fixes bugs, and ensures the codebase remains clean and maintainable. This role transforms designs and requirements into functional, performant, and accessible web pages.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **HTML5** | Current | Semantic markup |
| **CSS3** | Current | Styling, responsive design |
| **JavaScript** | ES6+ | Interactivity, API calls |
| **Splide.js** | 4.1.4 | Carousel functionality |

**No build process** - Files served directly

---

## Primary Tools

| Tool | Purpose |
|------|---------|
| **Code Editor** | VS Code or similar |
| **Git/GitHub** | Version control |
| **Browser DevTools** | Debugging, testing |
| **Playwright** | Local testing |

---

## Repository Structure

```
/website/
├── index.html              # Homepage
├── css/
│   ├── styles.css          # Main stylesheet
│   ├── components/         # Component styles
│   └── pages/              # Page-specific styles
├── js/
│   ├── main.js             # Main JavaScript
│   ├── components/         # JS components
│   ├── api/                # API integrations
│   │   └── airtable.js     # Airtable calls
│   └── vendor/             # Third-party (Splide)
├── images/                 # Image assets
├── pages/                  # HTML pages
└── _config/                # Configuration docs
```

---

## Responsibilities

### Feature Development

| Task | Process |
|------|---------|
| New features | Receive spec → Implement → Test → PR → Deploy |
| Enhancements | Review request → Scope → Implement → Test |
| Content updates | Receive content → Update HTML → Deploy |

### Bug Fixes

| Priority | Response |
|----------|----------|
| P0 - Critical | Immediate fix, same day |
| P1 - High | Fix within 24 hours |
| P2 - Medium | Fix within 1 week |
| P3 - Low | Backlog, as capacity allows |

### Code Quality

| Practice | Implementation |
|----------|----------------|
| Clean code | Readable, well-organized |
| Comments | Where logic isn't obvious |
| Consistency | Follow existing patterns |
| Testing | Test locally before commit |

---

## Development Workflow

### Standard Feature Flow

```
1. Receive Task
   └── From Development Manager or backlog

2. Plan Implementation
   ├── Review requirements
   ├── Identify affected files
   └── Consider edge cases

3. Implement
   ├── Write code
   ├── Follow existing patterns
   └── Keep changes focused

4. Test Locally
   ├── Visual check in browser
   ├── Test on multiple viewports
   ├── Check console for errors
   └── Test affected functionality

5. Commit
   ├── Clear commit message
   ├── Reference issue if applicable
   └── Push to main (triggers deploy)

6. Verify Deployment
   └── Check live site after deploy
```

### Commit Standards

```
Format: [type]: [description]

Types:
├── feat: New feature
├── fix: Bug fix
├── style: CSS/styling changes
├── refactor: Code restructuring
├── docs: Documentation
└── chore: Maintenance

Examples:
- feat: Add quiz modal to programs page
- fix: Resolve registration form validation
- style: Update button hover states
```

---

## Integration Implementation

### Airtable Integration

```javascript
// Pattern for Airtable API calls
async function fetchFromAirtable(table) {
  const response = await fetch(`${AIRTABLE_API_URL}/${table}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### GoHighLevel Webhooks

```javascript
// Pattern for GHL form submissions
async function submitToGHL(formData) {
  const response = await fetch(GHL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return response.ok;
}
```

### Stripe Integration

```javascript
// Pattern for Stripe checkout
const stripe = Stripe('pk_live_xxx');

async function initiatePayment(priceId) {
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    successUrl: window.location.origin + '/success',
    cancelUrl: window.location.origin + '/cancel'
  });
}
```

---

## Code Standards

### HTML

```html
<!-- Semantic, accessible HTML -->
<section class="programs" aria-labelledby="programs-heading">
  <h2 id="programs-heading">Our Programs</h2>
  <article class="program-card">
    <h3>Program Title</h3>
    <p>Description</p>
    <a href="/register" class="btn btn-primary">Register Now</a>
  </article>
</section>
```

### CSS

```css
/* Mobile-first, organized CSS */
.component {
  /* Layout */
  display: flex;

  /* Box model */
  padding: 1rem;
  margin: 0;

  /* Visual */
  background: var(--color-primary);
  border-radius: 4px;

  /* Typography */
  font-size: 1rem;
}

/* Responsive */
@media (min-width: 768px) {
  .component {
    padding: 2rem;
  }
}
```

### JavaScript

```javascript
// Clean, readable JavaScript
document.addEventListener('DOMContentLoaded', () => {
  initializeQuiz();
  initializeCarousels();
  initializeForms();
});

function initializeQuiz() {
  const quizTrigger = document.querySelector('.quiz-trigger');
  if (!quizTrigger) return;

  quizTrigger.addEventListener('click', openQuizModal);
}
```

---

## Testing Checklist

### Before Every Commit

- [ ] Visual check in Chrome
- [ ] Check Firefox/Safari if major change
- [ ] Mobile viewport check
- [ ] Console clear of errors
- [ ] Affected functionality works
- [ ] Forms submit correctly
- [ ] Links work

### Before Major Features

- [ ] Full page tested
- [ ] All viewports (mobile, tablet, desktop)
- [ ] Accessibility check (keyboard nav, screen reader)
- [ ] Performance check (no major slowdown)
- [ ] Cross-browser (Chrome, Firefox, Safari)

---

## Collaboration

### With Operations Team

| Specialist | Collaboration |
|------------|---------------|
| QA Automation | They test, you fix issues found |
| Performance Engineer | Implement optimization recommendations |
| Accessibility | Implement accessibility fixes |
| Security Analyst | Fix security issues |
| Mobile QA | Fix mobile-specific issues |

### Receiving Bug Reports

```
Standard bug report from Operations:

ISSUE: [Title]
Page: [URL]
Steps: [How to reproduce]
Expected: [What should happen]
Actual: [What happens]
Screenshot: [Link]

Your response:
1. Reproduce locally
2. Identify cause
3. Implement fix
4. Test fix
5. Commit and deploy
6. Confirm with reporter
```

---

## Key Metrics

| Metric | Target |
|--------|--------|
| P0/P1 bug resolution | < 24 hours |
| Code quality | No critical issues |
| Deployment success | > 95% |
| Rework rate | < 10% |

---

## Resources

### Documentation

| Resource | Location |
|----------|----------|
| Website README | `/website/README.md` |
| Integration docs | `/website/_config/integrations.md` |
| Deployment docs | `/website/_config/deployment.md` |
| Brand guidelines | `/business-os/marketing/brand/` |

### Business Context

| Resource | Use |
|----------|-----|
| ICPs | Understand target audience |
| Voice guide | Match brand tone |
| Programs catalog | Understand offerings |

---

## Escalation

Escalate to Development Manager when:
- Blocked on requirements clarity
- Technical decision with major impact
- Can't reproduce reported bug
- Need additional resources/tools
- Security-related findings during development
