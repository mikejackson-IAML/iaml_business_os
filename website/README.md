# IAML Website

> Static website for IAML Training - merged into the Business OS for unified digital asset management.

---

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling (no preprocessors)
- **JavaScript ES6+** - Vanilla JS (no frameworks)
- **Splide.js v4.1.4** - Carousel functionality
- **Hosting** - GitHub Pages

---

## Directory Structure

```
website/
├── index.html              # Homepage
├── css/
│   ├── styles.css          # Main stylesheet
│   ├── components/         # Reusable component styles
│   └── pages/              # Page-specific styles
├── js/
│   ├── main.js             # Main JavaScript
│   ├── components/         # Reusable JS components
│   ├── api/                # API integrations
│   │   └── airtable.js     # Airtable API calls
│   └── vendor/             # Third-party libraries
│       └── splide.min.js   # Carousel library
├── images/
│   ├── brand/              # Logo, icons, brand assets
│   ├── programs/           # Program-related images
│   └── team/               # Team photos
├── pages/
│   ├── programs/           # Program pages
│   ├── about/              # About pages
│   └── contact/            # Contact pages
└── _config/
    ├── integrations.md     # API & integration reference
    └── deployment.md       # Deployment configuration
```

---

## Integrations

| Service | Purpose | Documentation |
|---------|---------|---------------|
| Airtable | Form submissions, quiz responses, registrations | `_config/integrations.md` |
| GoHighLevel | CRM integration, contact management | `_config/integrations.md` |
| Stripe | Payment processing | `_config/integrations.md` |
| GA4/GTM | Analytics & event tracking | `_config/integrations.md` |

---

## Relationship to Business OS

This website is part of the larger IAML Business OS. Key connections:

| Business OS Source | Website Use |
|-------------------|-------------|
| `/business-os/marketing/brand/` | Brand voice, messaging guidelines |
| `/business-os/marketing/brand/icps/` | Target audience personas |
| `/business-os/programs/catalog/` | Program information (via Airtable) |

---

## Development Workflow

1. **Local Development**
   - Open `index.html` directly in browser
   - No build process required
   - Live Server extension recommended for hot reload

2. **Commit Standards**
   - Commit after each working phase
   - Clear, descriptive commit messages
   - Test in browser before committing

3. **Deployment**
   - Automatic via GitHub Actions on push to `main`
   - Only deploys when `/website/` files change
   - See `.github/workflows/deploy-website.yml`

---

## Site Health Monitoring

The Business OS includes site-health skills at `.claude/skills/site-health/` that monitor:

- Technical SEO
- Performance (Core Web Vitals)
- Accessibility (WCAG)
- Security
- UX quality

These skills now have direct access to website code for comprehensive audits.

---

## Quick Commands

```bash
# View website locally (from repo root)
open website/index.html

# Or use Python's built-in server
cd website && python -m http.server 8000
```

---

## Migration Notes

This website was merged from a standalone repository. Original architecture preserved:

- Zero build process
- Vanilla HTML/CSS/JS
- Splide.js as only external library
- All integrations via API calls (no server-side code)
