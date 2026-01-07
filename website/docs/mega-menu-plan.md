# IAML Mega Menu - Implementation Plan

**Status:** BUILT - Ready to Launch
**Created:** January 2026
**Last Updated:** January 5, 2026

---

## BUILD COMPLETE

All mega menu files have been created and are ready for testing:

| File | Location | Description |
|------|----------|-------------|
| HTML | `website/components/header-mega-menu.html` | Complete header with 3 mega menu panels + mobile accordion |
| CSS | `website/css/mega-menu.css` | All styling (desktop + mobile) |
| JavaScript | `website/js/megaMenu.js` | Interactions, keyboard nav, Airtable spotlight |

### To Launch
Change one line in `website/js/components.js`:
```javascript
// Change from:
const headerResponse = await fetch('/components/header.html');
// To:
const headerResponse = await fetch('/components/header-mega-menu.html');
```

### To Test Locally
Add the CSS and JS to any page:
```html
<link rel="stylesheet" href="/css/mega-menu.css">
<script src="/js/megaMenu.js"></script>
```

---

## Overview

A comprehensive mega menu system for the IAML website navigation, replacing the current flat 3-item navigation with rich, content-filled dropdown panels. The mega menu will be built as a separate component file that can be swapped in when ready to launch.

---

## Navigation Structure

### Current Navigation (3 items)
1. Featured Programs
2. Corporate Training
3. Why IAML

### New Mega Menu (same 3 items, with rich dropdowns)
1. **Featured Programs** → Mega menu with certificates, formats, spotlight
2. **Corporate Training** → Mega menu with services, case study, CTA
3. **Why IAML** → Mega menu with about sections, social proof

---

## 1. Featured Programs Mega Menu

### Layout (3 columns + spotlight)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CERTIFICATE PROGRAMS    │  FORMATS         │  PROGRAM TYPES    │ SPOTLIGHT │
│  ─────────────────────   │  ───────         │  ─────────────    │ ───────── │
│  • Employee Relations    │  • In-Person     │  • Employment     │ [IMAGE]   │
│    Law                   │  • Virtual       │    Law            │           │
│  • Advanced Employment   │  • On-Demand     │  • Benefits Law   │ Next:     │
│    Law                   │                  │  • HR Management  │ Employee  │
│  • Workplace             │  EXPLORE MORE    │                   │ Relations │
│    Investigations        │  ───────────     │  ADDED BENEFITS   │ Law       │
│  • Strategic HR          │  • Program       │  ─────────────    │           │
│    Leadership            │    Blocks →      │  • HRCI Credits   │ Feb 24-28 │
│  • Employee Benefits     │  • All Programs  │  • SHRM Credits   │ Chicago   │
│    Law                   │                  │  • CLE Credits    │ $4,295    │
│  • Advanced Benefits     │                  │  • Certificate    │           │
│    Law                   │                  │                   │ [Register]│
│                          │                  │                   │           │
│                          │                  │                   │ [Toggle:  │
│                          │                  │                   │ In-Person │
│                          │                  │                   │ Virtual]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Content Details

**Column 1: Certificate Programs (6 items)**
| Program | Link |
|---------|------|
| Certificate in Employee Relations Law | `/programs/employee-relations-law` |
| Advanced Certificate in Employment Law | `/programs/advanced-employment-law` |
| Certificate in Workplace Investigations | `/programs/workplace-investigations` |
| Certificate in Strategic HR Leadership | `/programs/strategic-hr-leadership` |
| Certificate in Employee Benefits Law | `/programs/employee-benefits-law` |
| Advanced Certificate in Employee Benefits Law | `/programs/advanced-employee-benefits-law` |

**Column 2: Formats**
| Format | Description | Link |
|--------|-------------|------|
| In-Person | Multi-day immersive programs in major cities | `/featured-programs?format=in-person` |
| Virtual | Live online programs with interactive sessions | `/featured-programs?format=virtual` |
| On-Demand | Self-paced learning available anytime | `/featured-programs?format=on-demand` |

**Column 2: Explore More**
| Link | Destination |
|------|-------------|
| Program Blocks | `/program-blocks` (page to create) |
| All Programs | `/featured-programs` |

**Column 3: Program Types**
| Type | Programs Included |
|------|-------------------|
| Employment Law | ERL, AEL, Workplace Investigations, Discrimination, Special Issues |
| Benefits Law | Benefits Law, Advanced Benefits, Claims & Appeals, Welfare, Retirement |
| HR Management | Strategic HR Leadership, Strategic HR Management, Labor Relations |

**Column 3: Added Benefits**
- HRCI Credits
- SHRM Credits
- CLE Credits
- Certificate of Completion

**Spotlight Section (Right)**
- **Image:** Program-specific hero image
- **Next Program Badge:** "NEXT IN-PERSON" or "NEXT VIRTUAL"
- **Program Name:** Certificate in Employee Relations Law
- **Date:** February 24-28, 2026
- **Location:** Chicago, IL (or "Virtual" for online)
- **Price:** $4,295
- **CTA Button:** "Register Now"
- **Toggle:** Switch between "In-Person" and "Virtual" next programs

---

## 2. Corporate Training Mega Menu

### Layout (2 columns + CTA panel)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRAINING SOLUTIONS      │  POPULAR PROGRAMS         │  GET STARTED        │
│  ───────────────────     │  ─────────────────        │  ───────────        │
│  • Custom Programs       │  • Employment Law         │                     │
│    Tailored curriculum   │    Fundamentals           │  Ready to bring     │
│    for your org          │  • Workplace              │  expert training    │
│                          │    Investigations         │  to your team?      │
│  • On-Site Delivery      │  • HR Compliance          │                     │
│    We come to you,       │    Essentials             │  [Schedule a        │
│    anywhere in the US    │  • Leadership             │   Consultation]     │
│                          │    Development            │                     │
│  • Virtual Programs      │                           │  ─────────────      │
│    Live online training  │  SUCCESS STORIES          │                     │
│    for distributed       │  ───────────────          │  "IAML transformed  │
│    teams                 │                           │  our HR team's      │
│                          │  → View Case Studies      │  capabilities..."   │
│  • Certification         │                           │                     │
│    Paths                 │                           │  — Fortune 500      │
│    Group certification   │                           │    HR Director      │
│    programs              │                           │                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Content Details

**Column 1: Training Solutions**
| Solution | Description |
|----------|-------------|
| Custom Programs | Tailored curriculum designed for your organization's specific needs |
| On-Site Delivery | We bring expert instruction to your location, anywhere in the US |
| Virtual Programs | Live online training for distributed and remote teams |
| Certification Paths | Group certification programs with volume pricing |

**Column 2: Popular Programs for Corporate**
- Employment Law Fundamentals
- Workplace Investigations
- HR Compliance Essentials
- Leadership Development

**Column 2: Success Stories**
- Link to Case Studies page (to be created)

**Column 3: CTA Panel**
- Headline: "Ready to bring expert training to your team?"
- Primary CTA: "Schedule a Consultation" → Opens connect modal or dedicated corporate contact form
- Testimonial snippet: Brief quote from corporate client
- Attribution: Company type (e.g., "Fortune 500 HR Director")

---

## 3. Why IAML Mega Menu

### Layout (3 columns + featured content)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ABOUT IAML              │  RESOURCES              │  SOCIAL PROOF         │
│  ──────────              │  ─────────              │  ────────────         │
│  • Why IAML              │  • FAQ                  │  TESTIMONIALS         │
│    Our mission and       │    Common questions     │  ────────────         │
│    what sets us apart    │    answered             │                       │
│                          │                         │  "The most practical  │
│  • Our Faculty           │  • Blog / Insights      │  employment law       │
│    Learn from leading    │    (future)             │  training I've ever   │
│    practitioners         │                         │  attended..."         │
│                          │                         │                       │
│  • Our History           │                         │  → Read Testimonials  │
│    50+ years of          │                         │                       │
│    excellence            │                         │  ─────────────────    │
│                          │                         │                       │
│                          │                         │  TRUSTED BY           │
│                          │                         │  ──────────           │
│                          │                         │  [Logo] [Logo] [Logo] │
│                          │                         │                       │
│                          │                         │  → View Organizations │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Content Details

**Column 1: About IAML**
| Page | Description | Link |
|------|-------------|------|
| Why IAML | Our mission, approach, and what sets us apart | `/about-us` |
| Our Faculty | Meet our expert practitioner instructors | `/faculty` |
| Our History | 50+ years of HR and employment law education | `/about-us#history` or dedicated page |

**Column 2: Resources**
| Resource | Description | Link |
|----------|-------------|------|
| FAQ | Common questions answered | `/faq` |
| Blog/Insights | (Future) Articles and thought leadership | `/blog` |

**Column 3: Social Proof**

**Testimonials Section:**
- Featured quote from alumnus
- Link to full testimonials page (to be created)

**Trusted By Section:**
- 3-4 organization logos (recognizable companies)
- Link to participating organizations page (to be created)

---

## Technical Specifications

### File Structure
```
website/
├── components/
│   ├── header.html              # Current header (keep as fallback)
│   ├── header-mega-menu.html    # NEW: Header with mega menu
│   └── mega-menu/
│       ├── featured-programs.html
│       ├── corporate-training.html
│       └── why-iaml.html
├── js/
│   ├── mobileMenu.js            # Update for accordion support
│   └── megaMenu.js              # NEW: Mega menu interactions
├── css/
│   └── mega-menu.css            # NEW: Mega menu styles
```

### Interaction Behavior

**Desktop (>1024px):**
- Hover to open mega menu (300ms delay to prevent accidental triggers)
- Click also opens (accessibility)
- Menu stays open while cursor is within menu area
- Close on: mouse leave, click outside, ESC key, click on link

**Tablet/Mobile (≤1024px):**
- Current slide-out mobile menu retained
- Featured Programs, Corporate Training, Why IAML become accordion items
- Tap to expand/collapse accordion sections
- Nested links shown when accordion is open

### Visual Design

**Desktop Mega Menu:**
- **Background:** Solid white (`#FFFFFF`)
- **Shadow:** `0 8px 32px rgba(0, 0, 0, 0.12)`
- **Border:** None (clean edge)
- **Backdrop:** Semi-transparent dark overlay on page (`rgba(0, 0, 0, 0.3)`)
- **Animation:** Fade in + slide down (200ms ease-out)
- **Max-width:** 1200px, centered
- **Padding:** 48px horizontal, 40px vertical

**Typography:**
- **Section headers:** 12px, uppercase, letter-spacing 0.1em, `--gray-600`
- **Link items:** 15px, `--gray-900`, hover: `--blue-primary`
- **Descriptions:** 13px, `--gray-600`

**Spotlight Card:**
- **Border-radius:** 12px
- **Background:** `--gray-50`
- **Image:** 16:9 aspect ratio, rounded corners
- **Toggle:** Pill-style tabs for In-Person/Virtual

### Accessibility

- Full keyboard navigation (Tab, Arrow keys, Enter, ESC)
- `aria-expanded` on trigger buttons
- `aria-haspopup="true"` on navigation items with menus
- Focus trap within open menu
- Visible focus indicators
- `role="menu"` and `role="menuitem"` where appropriate

### Performance

- Mega menu HTML pre-loaded in header (no lazy loading needed)
- CSS in separate file, loaded with other stylesheets
- No additional HTTP requests when menu opens
- Images in spotlight section: lazy-loaded, WebP format

---

## Pages to Create

Before launching the mega menu, these pages need to be created:

| Page | Priority | Description |
|------|----------|-------------|
| `/program-blocks` | High | Explains modular block system, how blocks combine into certificates |
| `/testimonials` | High | Collection of alumni testimonials with photos/titles |
| `/participating-organizations` | Medium | Logos and list of companies that have sent employees to IAML |
| `/corporate-training/case-studies` | Medium | Success stories from corporate training engagements |
| `/faq` | Medium | Frequently asked questions (may already exist - verify) |

---

## Launch Checklist

### Pre-Launch (Build Complete)
- [x] Build mega menu component files
- [x] Create mega menu CSS
- [x] Create mega menu JavaScript
- [x] Build mobile accordion version
- [ ] Create Testimonials page
- [ ] Create Participating Organizations page
- [ ] Create Corporate Case Studies page
- [ ] Create FAQ page
- [ ] Create Credits page
- [ ] Create Legal Updates page
- [ ] Add placeholder images for spotlight and panels
- [ ] Populate spotlight with real "next program" data (Airtable API)
- [ ] Test on all breakpoints (desktop, tablet, mobile)
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)

### Launch
- [ ] Swap `header.html` reference to `header-mega-menu.html` in `components.js`
- [ ] Deploy to staging for final review
- [ ] Deploy to production
- [ ] Monitor analytics for navigation engagement

### Post-Launch
- [ ] Track mega menu interaction metrics
- [ ] A/B test spotlight content
- [ ] Gather user feedback
- [ ] Iterate based on data

---

## Open Questions / Decisions Needed

1. **Program Blocks page:** What content should this page include? Full list of blocks, or explanation of the modular system with links to relevant certificates?

2. **Participating Organizations:** How many logos to show? Need permission from organizations to display their logos?

3. **Corporate Case Studies:** Do we have 2-3 success stories we can document? Need client permission?

4. **FAQ page:** Does one exist already, or is this a new page to create?

5. **Blog/Insights:** Is this something to include in the menu now as "Coming Soon" or leave out until ready?

---

## Estimated Build Components

| Component | Complexity | Notes |
|-----------|------------|-------|
| Mega menu HTML structure | Medium | 3 panel templates |
| Mega menu CSS | Medium | Desktop + mobile styles |
| Mega menu JavaScript | Medium | Hover/click, keyboard nav, mobile accordion |
| Spotlight data integration | Low | Pull from existing program data |
| Mobile accordion update | Low | Extend existing mobile menu |
| New pages (4-5) | High | Content needed from Mike |

---

## Next Steps

1. **Review this plan** - Confirm structure and content decisions
2. **Gather content** - Testimonials, org logos, case study info
3. **Build Phase 1** - Featured Programs mega menu
4. **Build Phase 2** - Corporate Training mega menu
5. **Build Phase 3** - Why IAML mega menu
6. **Integration** - Mobile accordion, testing
7. **Content pages** - Create supporting pages
8. **Launch** - When all pieces are ready

---

*This document serves as the source of truth for the IAML mega menu project. Update as decisions are made and progress occurs.*
