# Frontend Design Skill

| name | description | auto_invoke |
|------|-------------|-------------|
| frontend-design | Create distinctive, production-grade frontend interfaces with high design quality. Use when building web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics. | frontend work |

---

## Overview

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

---

## Design Thinking

Before coding, understand the context and commit to a **BOLD** aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility)
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

---

## IAML-Specific Guidelines

When working on IAML websites, also consider:

- **Brand alignment** - Premium executive education aesthetic
- **Target audience** - Business professionals, enterprise clients
- **Existing design system** - Reference `/website/css/` for established tokens
- **Performance** - Fast load times are critical for conversions

---

## Frontend Aesthetics Guidelines

### Typography

Choose fonts that are beautiful, unique, and interesting:
- **AVOID**: Generic fonts like Arial, Inter, Roboto, system fonts
- **PREFER**: Distinctive choices that elevate aesthetics
- **PAIR**: Display font (headlines) + refined body font (content)
- **IAML**: Playfair Display (headlines), Source Sans Pro (body)

### Color & Theme

- Commit to a cohesive aesthetic
- Use CSS variables for consistency
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes
- **IAML palette**: Navy (#1a365d), Gold (#d4af37), White backgrounds

### Motion & Animation

- Use animations for effects and micro-interactions
- Prioritize CSS-only solutions for HTML
- Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions
- Use scroll-triggering and hover states that surprise
- Keep animations subtle for professional contexts

### Spatial Composition

- Unexpected layouts when appropriate
- Asymmetry, overlap, diagonal flow
- Grid-breaking elements for emphasis
- Generous negative space OR controlled density
- For IAML: clean, organized layouts with strategic whitespace

### Backgrounds & Visual Details

Create atmosphere and depth rather than defaulting to solid colors:
- Gradient meshes (subtle)
- Noise textures (very subtle)
- Geometric patterns
- Layered transparencies
- Dramatic shadows
- Decorative borders

---

## What to AVOID

NEVER use generic AI-generated aesthetics:

| Bad Pattern | Why It's Bad |
|-------------|--------------|
| Inter, Roboto, Arial | Overused, looks like every AI output |
| Purple gradients on white | Cliched, screams "AI generated" |
| Predictable layouts | Cookie-cutter, lacks character |
| Too many animations | Overwhelming, unprofessional |
| Generic icons | Lazy, no thought |
| Centered everything | Boring, lacks hierarchy |

---

## Implementation Philosophy

**Match implementation complexity to the aesthetic vision:**

- **Maximalist designs** → Elaborate code, extensive animations, rich effects
- **Minimalist/refined designs** → Restraint, precision, careful spacing, subtle details

Elegance comes from executing the vision well.

---

## Output Format

When implementing frontend work:

1. **Clarify direction** - Confirm aesthetic approach if not specified
2. **Implement code** - Production-ready HTML/CSS/JS or framework code
3. **Document choices** - Brief notes on design decisions
4. **Test responsiveness** - Ensure mobile-first approach

---

## Reference

Adapted from [Anthropic's Frontend Design Skill](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design)

For detailed guidance, see the [Frontend Aesthetics Cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb)
