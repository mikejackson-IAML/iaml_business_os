# Website Deployment

> Configuration and documentation for deploying the IAML website via GitHub Pages.

---

## Deployment Overview

| Aspect | Configuration |
|--------|---------------|
| Hosting | GitHub Pages |
| Source | `/website/` directory |
| Branch | `main` |
| Method | GitHub Actions |
| Domain | (configure as needed) |

---

## GitHub Actions Workflow

The website is automatically deployed when changes are pushed to the `/website/` directory.

### Workflow File
Location: `/.github/workflows/deploy-website.yml`

```yaml
name: Deploy Website to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './website'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Manual Deployment

If GitHub Actions is not configured, deploy manually:

### Option 1: gh-pages branch
```bash
# From repository root
git subtree push --prefix website origin gh-pages
```

Then configure GitHub Pages to deploy from `gh-pages` branch.

### Option 2: Direct push
Copy `/website/` contents to a separate deployment repository.

---

## Custom Domain Setup

### Step 1: Add CNAME file
Create `/website/CNAME` with your domain:
```
www.yourdomain.com
```

### Step 2: DNS Configuration
Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | username.github.io |

### Step 3: Enable HTTPS
In GitHub repository settings → Pages → Enforce HTTPS

---

## Pre-Deployment Checklist

Before deploying to production:

### Content
- [ ] All placeholder content replaced
- [ ] No lorem ipsum text
- [ ] All images optimized and loading
- [ ] Contact information accurate

### Technical
- [ ] All links working (no 404s)
- [ ] Forms submitting correctly
- [ ] Payment flow tested with test cards
- [ ] Mobile responsive on all pages

### SEO
- [ ] Meta titles on all pages
- [ ] Meta descriptions on all pages
- [ ] Open Graph tags present
- [ ] Canonical URLs correct
- [ ] robots.txt in place
- [ ] sitemap.xml generated

### Analytics
- [ ] GTM container loading
- [ ] GA4 receiving data
- [ ] Conversion events firing

### Performance
- [ ] Page load < 3 seconds
- [ ] Images lazy loaded
- [ ] CSS/JS minified (if applicable)
- [ ] No console errors

### Security
- [ ] HTTPS enabled
- [ ] No exposed API secrets
- [ ] Content Security Policy headers (if applicable)

---

## Rollback Procedure

If deployment causes issues:

### Quick Rollback
```bash
# Find the last good commit
git log --oneline website/

# Revert to that commit
git revert HEAD

# Push to trigger new deployment
git push origin main
```

### Full Rollback
```bash
# Reset to specific commit
git checkout <commit-hash> -- website/

# Commit and push
git add website/
git commit -m "Rollback website to <commit-hash>"
git push origin main
```

---

## Environment-Specific Configuration

### Development
- Use test API keys
- Test webhooks to sandbox endpoints
- GA4 in debug mode

### Staging (if applicable)
- Production-like configuration
- Separate domain (staging.yourdomain.com)
- Test all integrations

### Production
- Live API keys
- Production webhooks
- Full analytics enabled

---

## Monitoring After Deployment

### Immediate (0-15 minutes)
1. Visit the live site
2. Check all pages load
3. Test key user flows (forms, payments)
4. Check browser console for errors

### Short-term (24 hours)
1. Review GA4 for traffic
2. Check for 404 errors in GSC
3. Monitor form submissions
4. Test payment flow end-to-end

### Ongoing
1. Weekly: Check Core Web Vitals
2. Monthly: Full site audit (use site-health skills)
3. Quarterly: Comprehensive review

---

## Related Documentation

- `/docs/website-merge-plan.md` - Overall merge strategy
- `/docs/website-integration.md` - Integration documentation
- `/.claude/skills/site-health/` - Site health monitoring skills
- `/business-os/_system/resources/inventory.md` - Tool inventory

---

## Last Updated

**Date:** 2025-12-27
**By:** Claude
**Changes:** Initial deployment documentation
