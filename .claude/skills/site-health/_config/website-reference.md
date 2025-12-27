# Website Code Reference

> Reference file for site-health skills to access website source code.

---

## Website Location

The IAML website is now integrated into this repository at:

```
/website/
```

---

## Directory Structure

```
website/
├── index.html              # Homepage
├── css/
│   ├── styles.css          # Main stylesheet
│   ├── components/         # Component styles
│   └── pages/              # Page-specific styles
├── js/
│   ├── main.js             # Main JavaScript
│   ├── components/         # JS components
│   ├── api/                # API integrations
│   │   └── airtable.js     # Airtable API
│   └── vendor/             # Third-party (Splide.js)
├── images/
│   ├── brand/              # Brand assets
│   ├── programs/           # Program images
│   └── team/               # Team photos
├── pages/                  # Static HTML pages
│   ├── programs/
│   ├── about/
│   └── contact/
└── _config/
    ├── integrations.md     # API reference
    └── deployment.md       # Deployment config
```

---

## Key Files for Audits

### SEO Audits
| Purpose | File Path |
|---------|-----------|
| Homepage meta tags | `/website/index.html` |
| All page meta tags | `/website/pages/**/*.html` |
| Robots directives | `/website/robots.txt` |
| Sitemap | `/website/sitemap.xml` |

### Performance Audits
| Purpose | File Path |
|---------|-----------|
| Main CSS | `/website/css/styles.css` |
| Main JS | `/website/js/main.js` |
| Vendor scripts | `/website/js/vendor/` |
| Image assets | `/website/images/` |

### Accessibility Audits
| Purpose | File Path |
|---------|-----------|
| HTML structure | `/website/**/*.html` |
| CSS for color contrast | `/website/css/styles.css` |
| JS for keyboard navigation | `/website/js/main.js` |

### Security Audits
| Purpose | File Path |
|---------|-----------|
| API integrations | `/website/js/api/` |
| External scripts | `/website/js/vendor/` |
| Integration config | `/website/_config/integrations.md` |

---

## Related Business OS Files

These files inform website content and should be cross-referenced:

| Purpose | Path |
|---------|------|
| Brand voice | `/business-os/marketing/brand/voice-guide.md` |
| ICPs | `/business-os/marketing/brand/icps/` |
| Program info | `/business-os/programs/catalog/` |

---

## Usage in Skills

When performing audits, skills should:

1. **First** read relevant website source files
2. **Then** run external audits (Lighthouse, GSC)
3. **Compare** code to audit findings
4. **Cross-reference** with Business OS guidelines

### Example Skill Enhancement

```markdown
## Pre-Audit: Code Review

Before running external audits, review source code:

1. Read `/website/index.html`
   - Check meta tags present and properly formatted
   - Verify structured data in place
   - Confirm semantic HTML structure

2. Read `/website/css/styles.css`
   - Check for render-blocking potential
   - Verify no excessive unused CSS
   - Check media query organization

3. Read `/website/js/main.js`
   - Check for defer/async usage
   - Verify no console errors in code
   - Check for event listener efficiency
```

---

## Live Site URL

For external audits, use:
- **Production:** [Configure after deployment]
- **Staging:** [Configure if applicable]

---

## Last Updated

**Date:** 2025-12-27
**Changes:** Initial reference file created for website integration
