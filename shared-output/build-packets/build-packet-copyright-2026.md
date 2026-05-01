# Build Packet: Update Footer Copyright Year to 2026

**Type:** Quick Fix  
**Priority:** HIGH  
**Created:** 2026-05-01  
**Source:** Content Review (worker c71527f4)  
**Estimated effort:** 5 minutes

---

## Problem

The footer shows "© 2025" but the current year is 2026. The footer is loaded on every page sitewide.

## File to Edit

**`/website/components/footer.html`** — line 156

### Current
```html
<div>© 2025 Institute for Applied Management &amp; Law, Inc. All rights reserved.</div>
```

### Required
```html
<div>© 2026 Institute for Applied Management &amp; Law, Inc. All rights reserved.</div>
```

## Acceptance Criteria

- [ ] Footer shows "© 2026" on all pages (index.html, program pages, about-us.html, etc.)
- [ ] No other changes made to footer

## Notes

Single character change. No JavaScript, no CSS — pure text update.
