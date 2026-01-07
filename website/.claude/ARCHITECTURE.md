# IAML Website Architecture

This document describes the codebase structure. For development guidelines, see [CLAUDE.md](./CLAUDE.md).

---

## Directory Overview

```
website/
├── *.html              # Root-level pages (index, about-us, faculty, etc.)
├── programs/           # Program detail pages (18 programs + template)
├── components/         # Reusable HTML fragments (header, footer, modals)
├── css/                # Stylesheets (5-file system + main.css)
├── js/                 # JavaScript modules
├── api/                # Vercel serverless functions
├── scripts/            # Build/utility scripts (not served)
├── data/               # Airtable-synced JSON data
├── qa/                 # Test files and QA automation
├── brochures/          # PDF generation system
├── images/             # Static images (logos, SVGs)
├── admin/              # Internal tools (url-builder)
└── .claude/            # Claude Code configuration
```

---

## CSS Architecture

### How It Works
HTML pages link to `main.css`, which imports the 5-file system plus mega-menu styles.

| File | Purpose | Size |
|------|---------|------|
| **main.css** | Entry point (linked in HTML) | 275 KB |
| **1-variables.css** | Design tokens (colors, fonts, spacing) | 2.5 KB |
| **2-base.css** | CSS reset, typography defaults | 2.9 KB |
| **3-components.css** | Buttons, cards, modals, forms | 50 KB |
| **4-layout.css** | Containers, grids, spacing utilities | 10 KB |
| **5-pages.css** | Page-specific styles | 222 KB |
| **mega-menu.css** | Navigation mega menu | 30 KB |

### Page Prefixes (in 5-pages.css)
| Page | Prefix |
|------|--------|
| Homepage | `.hp-` |
| Corporate Training | `.ct-` |
| About Us | `.about-` |
| Featured Programs | `.fp-` |
| Faculty | `.faculty-` |
| Program Schedule | `.ps-` |
| Program pages | `.erl-`, `.shr-`, `.ael-`, etc. |

---

## JavaScript Modules

### Core Infrastructure (load first)
| File | Purpose |
|------|---------|
| **components.js** | Injects header/footer from HTML components |
| **main.js** | Site coordination, global utilities |
| **utm-tracking.js** | Captures UTM params for attribution (REQUIRED on all pages) |
| **env-config.js** | API configuration loader |

### Major Features
| File | Purpose |
|------|---------|
| **register.js** | Registration flow, forms, Stripe integration (91 KB) |
| **megaMenu.js** | Navigation mega menu functionality |
| **quiz.js** | Quiz logic, scoring, Airtable integration |
| **modals.js** | Modal dialogs, accessibility |
| **testimonials.js** | Testimonial carousel (uses Splide.js) |

### Feature Modules
| File | Purpose |
|------|---------|
| **participating-organizations.js** | Partner org display |
| **headerBehavior.js** | Header scroll effects |
| **mobileMenu.js** | Mobile navigation |
| **carousel.js** | Generic carousel wrapper |
| **animations.js** | Scroll animations |
| **faculty.js** | Faculty profile rendering |
| **curriculum.js** | Course curriculum display |
| **upcomingPrograms.js** | Program listing with filters |
| **benefitSteps.js** | Benefit step animations |
| **supportContinuum.js** | Support options display |
| **faq.js** | FAQ accordion |
| **stripe-products.js** | Stripe product/price loading |

---

## API Endpoints (/api/)

Vercel serverless functions that proxy API calls (keeps keys secure).

### Airtable Proxies
| Endpoint | Purpose |
|----------|---------|
| **airtable-companies.js** | Company records |
| **airtable-contacts.js** | Contact records |
| **airtable-coupons.js** | Coupon validation |
| **airtable-programs.js** | Program data |
| **airtable-quiz.js** | Quiz submissions |
| **airtable-registrations.js** | Registration records |

### Payment & Webhooks
| Endpoint | Purpose |
|----------|---------|
| **create-checkout-session.js** | Stripe checkout sessions |
| **create-invoice.js** | Invoice generation |
| **create-payment-intent.js** | Payment intents |
| **verify-checkout-session.js** | Payment verification |
| **stripe-webhook.js** | Stripe webhook handler |
| **ghl-webhook.js** | GoHighLevel CRM webhook |

### Other
| Endpoint | Purpose |
|----------|---------|
| **content-insights.js** | Content analytics |
| **config.js** | Shared configuration |

---

## Utility Scripts (/scripts/)

Node.js scripts for data fetching and generation (not served to browser).

| Script | Purpose |
|--------|---------|
| **fetch-faculty.js** | Sync faculty from Airtable to /data/ |
| **fetch-sessions.js** | Sync sessions from Airtable to /data/ |
| **fetch-testimonials.js** | Sync testimonials from Airtable to /data/ |
| **fetch-organizations.js** | Sync partner orgs from Airtable to /data/ |
| **generate-program-page.js** | Create new program pages from template |
| **generate-brochure-pdf.js** | Generate PDF brochures |
| **aggregate-insights.js** | Aggregate content analytics |
| **setup-notion-brand-voice.js** | Brand voice configuration |

---

## HTML Components (/components/)

Reusable HTML fragments injected by components.js.

| Component | Purpose | Size |
|-----------|---------|------|
| **header.html** | Site header/navigation | 51 KB |
| **header-mega-menu.html** | Mega menu variant | 37 KB |
| **footer.html** | Site footer | 6 KB |
| **registration-modal.html** | Registration dialog | 184 KB |
| **quiz-section.html** | Quiz component | 71 KB |
| **testimonials-carousel.html** | Testimonial slider | 21 KB |
| **faculty-faq-section.html** | Faculty FAQ | 36 KB |
| **final-cta-section.html** | CTA section | 19 KB |
| **pop-up-modal.html** | Generic popup | 13 KB |
| **logo-carousel.html** | Partner logo slider | 0.2 KB |

---

## Data Directory (/data/)

JSON files synced from Airtable via scripts.

```
data/
├── faculty/          # Faculty member profiles
├── sessions/         # Program session schedules
├── testimonials/     # Customer testimonials
└── organizations/    # Partner organization data
```

---

## QA System (/qa/)

### Test Files
- **smoke.spec.js** - Core functionality tests
- **registration.spec.js** - Registration flow tests
- **visual-regression.spec.js** - Screenshot comparison tests

### Scripts
- **css-audit.js** - Pre-commit CSS safety check

### Directories
- **/screenshots/** - Baseline images for visual regression
- **/reports/** - Test result output

---

## Programs Directory (/programs/)

18 program pages + template:
- **_template.html** - Blueprint for new programs
- **advanced-employment-law.html**
- **employee-relations-law.html**
- **strategic-hr-leadership.html**
- *(and 15 more)*

Each program page follows the template structure with program-specific content.

---

## External Dependencies

| Dependency | Purpose | Usage |
|------------|---------|-------|
| **Splide.js v4.1.4** | Carousels/sliders | Only allowed JS library |
| **Airtable API** | Database | Forms, registrations, content |
| **Stripe** | Payments | Checkout, webhooks |
| **GoHighLevel** | CRM | Contact management |
| **Google Analytics 4** | Analytics | Event tracking |
| **Vercel** | Hosting | Serverless functions, deployment |
