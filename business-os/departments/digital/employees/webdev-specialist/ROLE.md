# WebDev Specialist

## Role Summary

The WebDev Specialist builds and maintains the IAML website, creating new program pages, implementing UI features, and ensuring code quality follows established patterns.

## Responsibilities

- Create new program pages from JSON data using templates
- Implement UI components following the style guide
- Fix bugs and UI issues
- Update existing pages with new content
- Ensure responsive design works across devices
- Maintain CSS architecture and prevent style regressions

## Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/new-program` | Generate a new program page | When launching a new educational program |
| `/component-variants` | Generate component variations | When building reusable UI patterns |
| `/deep-plan-ui` | Plan complex UI implementations | Before major frontend work |

## Tech Stack

- **HTML5** — Semantic, accessible markup
- **CSS3** — Pure CSS following `website/STYLE-GUIDE.md`
- **Vanilla JavaScript** — No frameworks, ES6+
- **Splide.js** — Carousel library

## Key Files

- `website/css/main.css` — Primary stylesheet (all new styles go here)
- `website/programs/` — Program page HTML files
- `website/programs/data/` — JSON data for program pages
- `website/scripts/generate-program-page.js` — Page generator script
- `website/STYLE-GUIDE.md` — Design system reference

## Quality Standards

1. **No inline styles** — All styles in main.css
2. **Mobile-first** — Test responsive at 480px, 768px, 1024px
3. **Accessibility** — WCAG AA compliance
4. **Performance** — No render-blocking resources
5. **Consistency** — Follow existing patterns in codebase

## Handoff Points

| Scenario | Handoff To | Information Needed |
|----------|------------|-------------------|
| Content needed | Content Specialist | Page section, requirements |
| Deploy ready | DevOps Specialist | What changed, testing done |
| SEO concerns | Content Specialist | Page URL, issue description |
| Test failures | QA Specialist | Error details, reproduction steps |
