# Website Merge Plan

> Strategic plan to consolidate the IAML website into the Business OS for unified digital asset management.

---

## Executive Summary

**Decision:** Merge the static website into the Business OS repository.

**Rationale:**
- Same tool ecosystem (Airtable, GoHighLevel, Stripe)
- Compatible architecture (simple, no build process)
- Unified version control and AI context
- Site-health skills already exist to monitor the website
- Single source of truth for all business digital assets

---

## Current State

### Business OS
- Location: `/business-os/`
- Type: Markdown-based documentation system
- Purpose: AI-augmented business operations
- Size: ~1.5MB, 196 markdown files

### Website (To Be Merged)
- Type: Static HTML/CSS/JavaScript
- Dependencies: Splide.js v4.1.4 only
- Hosting: GitHub Pages
- Integrations: Airtable API, GoHighLevel webhooks, Stripe

---

## Target Architecture

```
/iaml_business_os/
│
├── business-os/                    # Business operations (unchanged)
│   ├── _system/
│   ├── departments/
│   ├── marketing/
│   │   ├── brand/                  # Voice guides, ICPs (source of truth)
│   │   └── ...
│   ├── programs/                   # Program catalog (source of truth)
│   └── ...
│
├── website/                        # NEW: Static website
│   ├── index.html                  # Homepage
│   ├── css/
│   │   ├── styles.css
│   │   ├── components/
│   │   └── pages/
│   ├── js/
│   │   ├── main.js
│   │   ├── components/
│   │   └── vendor/
│   │       └── splide.min.js
│   ├── images/
│   │   ├── brand/
│   │   ├── programs/
│   │   └── team/
│   ├── pages/                      # Static HTML pages
│   │   ├── programs/
│   │   ├── about/
│   │   └── contact/
│   └── _config/                    # Website configuration
│       ├── integrations.md         # API keys, endpoints reference
│       └── deployment.md           # GitHub Pages config
│
├── .claude/
│   └── skills/
│       └── site-health/            # Already exists - will reference /website/
│
├── .github/
│   └── workflows/
│       └── deploy-website.yml      # GitHub Pages deployment
│
└── docs/
    ├── website-merge-plan.md       # This document
    └── website-integration.md      # Integration documentation
```

---

## Implementation Phases

### Phase 1: Structure Setup
**Status:** In Progress

1. Create `/website/` directory structure
2. Create placeholder files for organization
3. Create GitHub Actions workflow for deployment
4. Document the integration approach

### Phase 2: Website Migration
**Status:** Pending

1. Copy website files from source repository
2. Organize into the new structure
3. Update any relative paths if needed
4. Test locally

### Phase 3: Deployment Configuration
**Status:** Pending

1. Configure GitHub Pages to deploy from `/website/`
2. Set up GitHub Actions workflow
3. Test deployment pipeline
4. Update DNS if needed

### Phase 4: Integration Activation
**Status:** Pending

1. Update site-health skills to reference `/website/` paths
2. Create cross-references between business-os and website
3. Document content synchronization workflows

---

## GitHub Pages Deployment

### Option A: GitHub Actions (Recommended)

```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website
```

### Option B: Separate Branch

- Create `gh-pages` branch
- Use subtree push: `git subtree push --prefix website origin gh-pages`

**Recommendation:** Option A for automation and simplicity.

---

## Integration Points

### Content Synchronization

| Business OS Source | Website Destination | Sync Method |
|-------------------|---------------------|-------------|
| `marketing/brand/voice-guide.md` | Website copy/tone | Manual reference |
| `marketing/brand/icps/` | Target audience messaging | Manual reference |
| `programs/catalog/` | Program pages content | Airtable API |

### Shared Integrations

| Integration | Business OS Reference | Website Implementation |
|-------------|----------------------|------------------------|
| Airtable | `_system/resources/inventory.md` | `js/api/airtable.js` |
| GoHighLevel | `_system/resources/inventory.md` | Form webhooks |
| Stripe | To be documented | Payment flows |

---

## Site-Health Skills Update

The existing `.claude/skills/site-health/` skills will be updated to:

1. Reference actual website files in `/website/`
2. Perform code-level audits (not just external URL checks)
3. Cross-reference with brand guidelines in `business-os/marketing/`

### Example Skill Enhancement

```markdown
## Pre-Audit: Code Review
Before running external audits, review:
- `/website/index.html` - Check meta tags, structured data
- `/website/css/styles.css` - Check for performance issues
- `/website/js/main.js` - Check for console errors, accessibility
```

---

## Benefits After Merge

1. **Single Repository**
   - All digital assets versioned together
   - Unified commit history
   - Single clone for full business context

2. **AI Context**
   - Claude sees business strategy AND implementation
   - Can suggest content based on ICPs
   - Can audit code against brand guidelines

3. **Operational Efficiency**
   - Site-health skills have direct file access
   - No context switching between repos
   - Unified issue tracking

4. **Content Consistency**
   - Brand voice documented alongside implementation
   - ICPs inform website messaging directly
   - Program catalog is single source of truth

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Repository size increase | Website is static, minimal asset overhead |
| Deployment complexity | GitHub Actions automates deployment |
| Separation of concerns | Clear folder boundaries (`/business-os/` vs `/website/`) |
| Access control | GitHub branch protection rules |

---

## Success Criteria

- [ ] Website deployed successfully from new structure
- [ ] All pages load correctly
- [ ] Integrations (Airtable, GHL, Stripe) work
- [ ] Site-health skills reference website code
- [ ] No broken links or missing assets

---

## Timeline

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1 | Structure Setup | In Progress |
| Phase 2 | Website Migration | Pending (requires source files) |
| Phase 3 | Deployment Configuration | Pending |
| Phase 4 | Integration Activation | Pending |

---

## Next Steps

1. **Immediate:** Set up folder structure and documentation
2. **When Ready:** Migrate website files from source repository
3. **After Migration:** Configure and test deployment
4. **Ongoing:** Maintain integration between business-os and website

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-27 | Claude | Initial plan created |
