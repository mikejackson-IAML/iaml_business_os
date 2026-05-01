# Build Packet: Add Missing OG Image

**Created by:** Site Monitor ea685308  
**Date:** 2026-05-01  
**Priority:** WARNING  
**Type:** Missing Asset

## Problem

`/images/og-image.jpg` returns **404** on www.iaml.com.

This image is referenced in meta tags on every page:
- `<meta property="og:image" content="https://iaml.com/images/og-image.jpg">`
- `<meta name="twitter:image" content="https://iaml.com/images/og-image.jpg">`
- Schema.org `primaryImageOfPage.url`

The file does not exist in `website/images/`. The repo only contains `iaml-logo.svg` and `name-underline.svg`.

## Impact

- Social media link previews (LinkedIn, Twitter/X, Slack) show no image or broken image
- Schema.org structured data is invalid (missing image property)
- SEO penalty possible from Google

## Fix Required

1. Create or source an OG image for IAML (recommended: 1200×630px JPEG)
   - Suggested content: IAML logo on branded background with tagline
   - Alternatively, a screenshot/photo of a program session
2. Save as `website/images/og-image.jpg`
3. Commit and deploy

## Files to Modify

- `website/images/og-image.jpg` — **CREATE** this file

## No Code Changes Required

The meta tags already correctly reference `/images/og-image.jpg`. Only the image asset needs to be added.

## Acceptance Criteria

- `https://www.iaml.com/images/og-image.jpg` returns **200**
- Image is at least 600×315px (1200×630px recommended)
- JPEG format, under 8MB (ideally under 1MB)
