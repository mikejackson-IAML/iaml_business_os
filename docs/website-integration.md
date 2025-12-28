# Website Integration Guide

> How the website integrates with the Business OS for unified digital asset management.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IAML BUSINESS OS REPOSITORY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐         ┌─────────────────────────────────┐   │
│  │      business-os/       │         │           website/               │   │
│  │                         │         │                                  │   │
│  │  ┌─────────────────┐   │         │  ┌──────────────────────────┐   │   │
│  │  │    marketing/    │◄──┼─────────┼──│   Content & Messaging    │   │   │
│  │  │   brand/voice    │   │ informs │  │                          │   │   │
│  │  │   brand/icps     │   │         │  └──────────────────────────┘   │   │
│  │  └─────────────────┘   │         │                                  │   │
│  │                         │         │  ┌──────────────────────────┐   │   │
│  │  ┌─────────────────┐   │         │  │     Program Pages         │   │   │
│  │  │    programs/     │◄──┼─────────┼──│   (via Airtable API)      │   │   │
│  │  │    catalog/      │   │ source  │  └──────────────────────────┘   │   │
│  │  └─────────────────┘   │ of truth │                                 │   │
│  │                         │         │  ┌──────────────────────────┐   │   │
│  │  ┌─────────────────┐   │         │  │        Forms              │   │   │
│  │  │    clients/      │◄──┼─────────┼──│   (submit to CRM)         │   │   │
│  │  │    _template/    │   │ creates │  └──────────────────────────┘   │   │
│  │  └─────────────────┘   │         │                                  │   │
│  │                         │         └─────────────────────────────────┘   │
│  └─────────────────────────┘                                               │
│                                                                             │
│  ┌─────────────────────────┐                                               │
│  │     .claude/skills/     │                                               │
│  │      site-health/       │──────────────────► Monitors website code      │
│  └─────────────────────────┘                    & external performance     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. Brand Voice → Website Copy

| Business OS | Website | Sync Method |
|-------------|---------|-------------|
| `marketing/brand/voice-guide.md` | All page copy | Manual reference |
| `marketing/brand/personal-voice-guide.md` | About, Contact pages | Manual reference |
| `marketing/brand/icps/*.md` | Audience-specific messaging | Manual reference |

**Workflow:**
1. AI (Claude) reads brand voice guidelines
2. When writing/reviewing website copy, apply voice principles
3. Ensure messaging aligns with ICP profiles

### 2. Program Catalog → Website Pages

| Business OS | Website | Sync Method |
|-------------|---------|-------------|
| `programs/catalog/` | Program pages | Airtable API |

**Architecture:**
- Business OS documents program strategy and requirements
- Airtable stores program operational data
- Website pulls from Airtable API for display
- Single source of truth: Airtable (synced from Business OS decisions)

**Data Flow:**
```
Business OS (strategy) → Airtable (data) → Website (display)
```

### 3. Form Submissions → CRM → Clients

| Website | Integration | Business OS |
|---------|-------------|-------------|
| Contact forms | GoHighLevel webhook | `clients/` folder for relationship management |
| Program registrations | Airtable + GHL | Programs tracked in catalog |
| Quiz completions | Airtable + GHL | Lead scoring data |

**Workflow:**
1. User submits form on website
2. Data sent to GoHighLevel (CRM)
3. Also stored in Airtable (for analysis)
4. New clients get folder in `business-os/clients/`

---

## Site-Health Skills Integration

The `.claude/skills/site-health/` skills now have dual capability:

### External Monitoring (Original)
- Lighthouse audits (performance, accessibility, SEO)
- Google Search Console data
- Core Web Vitals

### Code-Level Audits (New)
With website in same repo, skills can now:
- Review actual HTML for SEO issues
- Check CSS for performance problems
- Audit JavaScript for errors
- Cross-reference with brand guidelines

### Enhanced Skill Example

```markdown
# Technical SEO Audit (Enhanced)

## Step 1: Code Review
Read and analyze:
- `/website/index.html` - Meta tags, structured data, semantic HTML
- `/website/pages/**/*.html` - All page meta tags
- `/website/robots.txt` - Crawl directives
- `/website/sitemap.xml` - Page discovery

## Step 2: External Audit
Run Lighthouse SEO audit on live URL...

## Step 3: Cross-Reference
Compare findings with:
- `/business-os/marketing/brand/` - Brand consistency
- `/business-os/programs/catalog/` - Program information accuracy
```

---

## Content Synchronization Workflows

### New Program Launch

1. **Business OS:** Define program in `programs/catalog/[program-name]/`
2. **Airtable:** Add program record with all details
3. **Website:** Create page in `pages/programs/[program-name].html`
4. **Cross-Check:** Ensure messaging aligns with ICPs

### Brand Voice Update

1. **Business OS:** Update `marketing/brand/voice-guide.md`
2. **Website:** Review and update all page copy
3. **Skills:** Run content audit against new guidelines

### New ICP Definition

1. **Business OS:** Create new ICP in `marketing/brand/icps/`
2. **Website:** Create targeted landing pages
3. **Analytics:** Set up ICP-specific conversion tracking

---

## AI Context Benefits

With both systems in one repo, Claude can:

| Capability | Example Use Case |
|------------|------------------|
| Understand full context | "Update the HR Director landing page" → knows ICP profile, voice, programs |
| Ensure consistency | Audit website copy against brand voice guidelines |
| Suggest improvements | Recommend content based on program strategy |
| Debug issues | See both business logic and implementation |
| Generate content | Write copy that matches ICPs and voice |

### Example Prompt
```
"Write copy for the new FMLA training landing page"

Claude can now reference:
- ICP: HR Director profile → pain points, language
- Voice: Brand guidelines → tone, style
- Program: FMLA training details → features, benefits
- Existing pages: Similar program pages → consistent format
```

---

## Development Guidelines

### When Editing Website Code

1. **Check brand alignment**
   - Read `business-os/marketing/brand/voice-guide.md` first
   - Ensure copy matches defined voice

2. **Check ICP targeting**
   - Know which ICP the page targets
   - Use language from their profile

3. **Maintain consistency**
   - Follow existing patterns in codebase
   - Match structure of similar pages

### When Updating Business OS

1. **Consider website impact**
   - Will this change affect website content?
   - Note any website updates needed

2. **Update integration docs**
   - Keep `_config/integrations.md` current
   - Document new integration points

---

## File Reference

### Business OS Files Website Uses

| File | Purpose |
|------|---------|
| `marketing/brand/voice-guide.md` | Overall brand voice |
| `marketing/brand/personal-voice-guide.md` | Personal/about voice |
| `marketing/brand/icps/*.md` | Target audience profiles |
| `programs/catalog/` | Program information |
| `_system/resources/inventory.md` | Integration reference |

### Website Files Business OS References

| File | Purpose |
|------|---------|
| `website/_config/integrations.md` | Current integration setup |
| `website/_config/deployment.md` | Deployment configuration |
| `website/` | Actual implementation to audit |

---

## Troubleshooting

### Content Mismatch
**Issue:** Website content doesn't match Business OS strategy
**Solution:**
1. Check `business-os/marketing/brand/` for source of truth
2. Update website copy to align
3. Document in improvement log

### Integration Failure
**Issue:** Form submissions not appearing in CRM
**Solution:**
1. Check `website/_config/integrations.md` for webhook URLs
2. Verify GoHighLevel webhook is active
3. Test in browser network tab

### Deployment Issues
**Issue:** Changes not appearing on live site
**Solution:**
1. Verify push to `main` branch
2. Check GitHub Actions workflow status
3. Clear CDN cache if applicable

---

## Migration Checklist

When bringing in the actual website files:

### Pre-Migration
- [ ] Backup existing website repository
- [ ] Document current file structure
- [ ] List all integration endpoints

### During Migration
- [ ] Copy files to `/website/` directory
- [ ] Update any absolute paths
- [ ] Verify relative asset paths work
- [ ] Test all pages locally

### Post-Migration
- [ ] Configure GitHub Pages deployment
- [ ] Verify all integrations work
- [ ] Run full site-health audit
- [ ] Update DNS if needed

---

## Last Updated

**Date:** 2025-12-27
**By:** Claude
**Changes:** Initial integration documentation created
