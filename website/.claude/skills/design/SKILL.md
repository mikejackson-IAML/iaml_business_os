---
name: design
description: Comprehensive design system for creating premium, non-generic UI. Use when creating layouts, styling components, choosing colors, typography, spacing, or any visual design work. This skill prevents AI-generated aesthetic and ensures refined, human-crafted design quality.
---

# IAML Design System & Anti-Generic Design Guidelines

This skill ensures every design decision produces refined, premium-quality UI that never looks AI-generated or template-based.

---

## Core Philosophy

**Great design is invisible.** Users notice bad design. They appreciate good design. They don't notice great design because it just works.

### The Three Laws

1. **Restraint over abundance** — Don't use every tool in the box
2. **Systems over individual decisions** — Consistency creates quality
3. **Purpose over decoration** — Every element has a reason to exist

---

## PART 1: AI Design Anti-Patterns (What to AVOID)

### Visual Clichés — NEVER DO THESE

| Anti-Pattern | Why It Looks AI-Generated | What to Do Instead |
|--------------|---------------------------|---------------------|
| Purple-to-blue diagonal gradients | Overused, default AI aesthetic | Solid colors or subtle single-hue gradients |
| Generic blob illustrations | Meaningless decoration | Purpose-driven imagery or clean whitespace |
| Everything is a card with shadow | No layout variety | Mix cards, lists, tables, inline layouts |
| Gradient text on headings | Decorative without purpose | Solid text color, use hierarchy for emphasis |
| Glassmorphism everywhere | Trend overuse | Reserve for 1-2 key overlays maximum |
| Stock photos with fake enthusiasm | Destroys authenticity | Real photos, custom illustrations, or none |
| Rounded corners on everything | Feels childish, lacks sophistication | Mix sharp and rounded intentionally |
| Centered everything | No visual tension, boring | Left-align body text, use asymmetry |

### Layout Anti-Patterns

```
❌ GENERIC:
┌─────────┐ ┌─────────┐ ┌─────────┐
│  Card   │ │  Card   │ │  Card   │  ← Same 3 cards, every section
└─────────┘ └─────────┘ └─────────┘

✓ PREMIUM:
┌─────────────────────┐ ┌─────────┐
│     Hero Card       │ │ Side    │  ← Varied sizes, asymmetric
└─────────────────────┘ │ Content │
┌───────┐ ┌───────────┐ │         │
│ Small │ │  Medium   │ └─────────┘
└───────┘ └───────────┘
```

### Typography Anti-Patterns

- **Single font weight everywhere** — Use 400, 500, 600 strategically
- **All headings look the same size** — Clear size jumps (1.25-1.5 ratio)
- **Lines too long (80+ characters)** — Keep body text 60-75 characters
- **All uppercase for no reason** — Reserve for labels, badges only
- **Default line heights (1.2)** — Adjust per context (1.5-1.7 for body)
- **Pure black (#000000) on white** — Use `--gray-900` or softer black

### Color Anti-Patterns

- **Oversaturated colors (S:100%)** — Sweet spot is 40-80% saturation
- **Pure grays with no tint** — Add slight warmth or cool tint
- **Random hex values** — Always use CSS custom properties
- **Rainbow gradients** — Almost never appropriate
- **Poor contrast ratios** — Minimum 4.5:1 for text (test with tools)

### Motion Anti-Patterns

- **Bounce effects** — Overused, feels amateurish
- **Fade-in on scroll (everything)** — Pick 1-2 key elements only
- **Slow animations (500ms+)** — Keep under 300ms for interactions
- **Spinning logos as loaders** — Use skeleton screens or subtle spinners
- **Slide-in from left** — Predictable, seen everywhere

---

## PART 2: IAML Design Tokens

### Color System

**Primary Palette:**
```css
--blue-primary: #188bf6      /* Main CTA, links */
--blue-dark: #28528c         /* Secondary actions */
--blue-darker: #222639       /* Dark backgrounds */
--red-accent: #e41e26        /* Registration CTAs */
--red-hover: #b91c1c         /* Red hover state */
--gold-accent: #af9232       /* Premium highlights */
--purple-accent: #7c3aed     /* Expert badges */
```

**Neutral Scale (use these, not raw values):**
```css
--gray-50:  #f8fafc   /* Subtle backgrounds */
--gray-100: #f1f5f9   /* Card backgrounds */
--gray-200: #e2e8f0   /* Borders, dividers */
--gray-300: #cbd5e1   /* Disabled states */
--gray-400: #94a3b8   /* Placeholder text */
--gray-500: #64748b   /* Secondary text */
--gray-600: #475569   /* Body text on light */
--gray-700: #334155   /* Strong text */
--gray-800: #1e293b   /* Headings */
--gray-900: #0f172a   /* Near-black text */
```

**Usage Rules:**
- Never use `#000000` for text — use `--gray-900`
- Never use `#ffffff` backgrounds without purpose — consider `--gray-50`
- Accent colors (`--gold-accent`, `--purple-accent`) are for highlights only

### Typography

**Font Stack:**
```css
--font-heading: 'Playfair Display', Georgia, 'Times New Roman', serif;
--font-body: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Type Scale (use these, not arbitrary values):**
```css
--text-xs:   0.75rem    /* 12px - Captions, labels */
--text-sm:   0.875rem   /* 14px - Small text, metadata */
--text-base: 1rem       /* 16px - Body text */
--text-lg:   1.125rem   /* 18px - Lead paragraphs */
--text-xl:   1.25rem    /* 20px - Section intros */
--text-2xl:  1.5rem     /* 24px - Card headings */
--text-3xl:  1.875rem   /* 30px - Section headings */
--text-4xl:  2.25rem    /* 36px - Page headings */
--text-5xl:  3rem       /* 48px - Hero headings */
--text-6xl:  3.75rem    /* 60px - Display text */
```

**Line Height Rules:**
| Context | Line Height | Reason |
|---------|-------------|--------|
| Display (48px+) | 1.0-1.1 | Large text needs tight leading |
| Headings (24-48px) | 1.2-1.3 | Comfortable, not sprawling |
| Body text (16-18px) | 1.5-1.7 | Optimal readability |
| Dense UI (12-14px) | 1.3-1.4 | Compact but legible |
| All caps | 1.4-1.6 | Needs extra space |

**Letter Spacing Rules:**
| Context | Letter Spacing | Example |
|---------|----------------|---------|
| Display headings | -0.02em to -0.03em | `letter-spacing: -0.02em` |
| Headings | -0.01em to 0 | `letter-spacing: -0.01em` |
| Body text | 0 (default) | No adjustment needed |
| All caps labels | 0.05em to 0.1em | `letter-spacing: 0.08em` |
| Buttons (uppercase) | 0.05em | `letter-spacing: 0.05em` |

### Spacing System (8px Base)

**Scale (use exclusively):**
```css
--space-xs:  0.25rem    /*  4px - Icon padding */
--space-sm:  0.5rem     /*  8px - Tight spacing */
--space-md:  1rem       /* 16px - Default gap */
--space-lg:  1.5rem     /* 24px - Card padding */
--space-xl:  2rem       /* 32px - Section gap */
--space-2xl: 3rem       /* 48px - Major sections */
--space-3xl: 4rem       /* 64px - Page sections */
--space-4xl: 6rem       /* 96px - Hero spacing */
--space-5xl: 8rem       /* 128px - Landing sections */
```

**Never use arbitrary values.** If `--space-lg` (24px) is too small and `--space-xl` (32px) is too big, use `--space-lg` — consistency trumps perfection.

### Border Radius

```css
--radius-sm:   0.375rem  /*  6px - Inputs, small elements */
--radius-md:   0.5rem    /*  8px - Buttons, tags */
--radius-lg:   0.75rem   /* 12px - Cards, containers */
--radius-xl:   1rem      /* 16px - Large cards */
--radius-2xl:  1.25rem   /* 20px - Modals, overlays */
--radius-full: 9999px    /* Pills, avatars */
```

**Usage:**
- Inputs: `--radius-sm` or `--radius-lg`
- Buttons: `--radius-md`
- Cards: `--radius-lg` or `--radius-xl`
- Badges/pills: `--radius-full`
- Never use arbitrary radii like `10px` or `15px`

### Shadows

```css
--shadow-sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

**Usage:**
- Subtle elevation: `--shadow-sm`
- Cards at rest: `--shadow-md`
- Cards on hover: `--shadow-lg` or `--shadow-xl`
- Modals/dropdowns: `--shadow-xl` or `--shadow-2xl`
- Never stack shadows — one shadow per element

### Transitions

```css
--transition-fast: 150ms ease;   /* Hover states, button press */
--transition-base: 200ms ease;   /* Standard transitions */
--transition-slow: 300ms ease;   /* Complex animations */
```

**Easing Functions:**
```css
/* Smooth deceleration (most common) */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);

/* Smooth acceleration (exit animations) */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);

/* Smooth both ends (general purpose) */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## PART 3: Component Patterns

### Buttons

**Base button principles:**
- Minimum touch target: 44x44px
- Clear hover/focus/active states
- Never rely on color alone (add icon or text change)

**Button Hierarchy:**
```
Primary (--blue-primary)  → Main action per section (1 max)
Secondary (white/outline) → Alternative actions
Tertiary (text only)      → Low-emphasis actions
Danger (--red-accent)     → Destructive actions only
```

**Button States:**
```css
/* Rest */
background: var(--blue-primary);
transform: none;

/* Hover */
background: #0066cc; /* Darker shade */
transform: translateY(-1px);
box-shadow: var(--shadow-lg);

/* Active/Pressed */
transform: translateY(0) scale(0.98);
box-shadow: var(--shadow-sm);

/* Focus */
outline: 3px solid rgba(24, 139, 246, 0.4);
outline-offset: 2px;

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
```

### Cards

**Card Variants (choose by purpose):**

| Variant | Use Case | Border | Shadow | Hover |
|---------|----------|--------|--------|-------|
| Flat | Dense lists, subtle | 1px `--gray-200` | None | Background change |
| Raised | Standard cards | None | `--shadow-md` | `--shadow-lg` + lift |
| Interactive | Clickable cards | 1px `--gray-200` | `--shadow-sm` | `--shadow-xl` + lift |
| Featured | Highlight card | 2px `--blue-primary` | `--shadow-lg` | Glow effect |

**Card Structure:**
```html
<article class="card">
  <div class="card-media"><!-- Image/icon --></div>
  <div class="card-content">
    <h3 class="card-title"><!-- Heading --></h3>
    <p class="card-description"><!-- Body text --></p>
  </div>
  <div class="card-footer"><!-- Actions --></div>
</article>
```

### Forms

**Input Styling:**
```css
.input {
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  font-size: var(--text-base);
  transition: var(--transition-base);
}

.input:focus {
  border-color: var(--blue-primary);
  outline: 3px solid rgba(24, 139, 246, 0.22);
  outline-offset: 0;
}

.input:invalid:not(:placeholder-shown) {
  border-color: var(--red-accent);
}
```

**Form Layout:**
- Labels above inputs (not inline)
- Error messages below inputs
- Group related fields with fieldsets
- 1 column on mobile, 2 on desktop (max)

### Modals

**Structure:**
```css
.modal-backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal-content {
  max-width: 560px; /* Small */
  max-width: 720px; /* Medium */
  max-width: 900px; /* Large */
  max-height: 90vh;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
}
```

**Behavior:**
- Close on Escape key
- Close on backdrop click
- Trap focus within modal
- Return focus to trigger on close
- Animate in: `opacity 0→1, translateY(20px→0)`

---

## PART 4: Layout Principles

### Grid System

**Container Widths:**
```css
.container    { max-width: 1200px; }
.container-sm { max-width: 768px; }  /* Content-focused */
.container-md { max-width: 960px; }  /* Reading */
.container-lg { max-width: 1400px; } /* Data-heavy */
```

**Column Layouts:**
```css
/* Responsive grid (preferred) */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-xl);
}

/* Fixed columns */
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
```

**Responsive Breakpoints:**
```css
/* Mobile first - base styles are mobile */
@media (min-width: 640px)  { /* sm: tablets */ }
@media (min-width: 768px)  { /* md: small laptops */ }
@media (min-width: 1024px) { /* lg: desktops */ }
@media (min-width: 1280px) { /* xl: large screens */ }
```

### Visual Hierarchy

**The 60-30-10 Rule:**
- 60% — Primary background (white/light gray)
- 30% — Secondary color (section backgrounds, cards)
- 10% — Accent color (CTAs, links, highlights)

**Creating Hierarchy:**
1. **Size** — Larger = more important
2. **Weight** — Bolder = more emphasis
3. **Color** — Higher contrast = more attention
4. **Position** — Top-left is seen first (F-pattern)
5. **Spacing** — More whitespace = more importance
6. **Grouping** — Proximity creates relationships

### Whitespace

**Section Spacing:**
```css
/* Between major sections */
.section { padding: var(--space-4xl) 0; } /* 96px */

/* Between section heading and content */
.section-header { margin-bottom: var(--space-2xl); } /* 48px */

/* Between cards/items */
.card-grid { gap: var(--space-xl); } /* 32px */

/* Inside cards */
.card { padding: var(--space-lg); } /* 24px */
```

**The Whitespace Rule:** When in doubt, double the whitespace. You can always reduce later.

---

## PART 5: Micro-Interactions

### Hover States

**Required for all interactive elements:**
```css
/* Links */
a:hover {
  color: var(--blue-dark);
  text-decoration-color: currentColor;
}

/* Buttons */
.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Cards */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* Icons */
.icon-btn:hover {
  background: var(--gray-100);
}
```

### Focus States

**Visible focus for accessibility:**
```css
:focus-visible {
  outline: 3px solid var(--blue-primary);
  outline-offset: 2px;
}

/* Remove outline only for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Loading States

**Skeleton Screens (preferred):**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-100) 25%,
    var(--gray-200) 50%,
    var(--gray-100) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Button Loading:**
```css
.btn-loading {
  color: transparent;
  pointer-events: none;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}
```

### Transitions

**Stagger Pattern (for lists):**
```css
.card {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 400ms ease forwards;
}

.card:nth-child(1) { animation-delay: 0ms; }
.card:nth-child(2) { animation-delay: 100ms; }
.card:nth-child(3) { animation-delay: 200ms; }
/* etc. */

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## PART 6: Quality Checklist

### Before Writing CSS

- [ ] Am I using design tokens from variables.css?
- [ ] Does this follow the spacing scale (4, 8, 16, 24, 32...)?
- [ ] Am I using the correct type scale size?
- [ ] Is the color from the defined palette?
- [ ] Will this work at all breakpoints?

### Before Committing

**Typography:**
- [ ] Headings have clear visual hierarchy
- [ ] Body text is 16px+ with 1.5+ line height
- [ ] Letter spacing adjusted for headings (-0.01 to -0.02em)
- [ ] Line length is 60-75 characters for body

**Color:**
- [ ] Using CSS custom properties, not hex values
- [ ] Contrast ratio is 4.5:1+ for text
- [ ] No pure #000000 or #ffffff (unless intentional)
- [ ] Accent colors used sparingly (10% rule)

**Spacing:**
- [ ] All spacing uses design tokens
- [ ] Consistent padding within components
- [ ] Generous whitespace between sections
- [ ] No cramped layouts

**Interactions:**
- [ ] All interactive elements have hover states
- [ ] Focus states are visible (outline or ring)
- [ ] Transitions are 150-300ms
- [ ] No bounce effects or excessive animations

**Accessibility:**
- [ ] Can navigate with keyboard alone
- [ ] Focus order is logical
- [ ] Touch targets are 44px+ minimum
- [ ] Color is not the only indicator

**Does NOT look AI-generated:**
- [ ] Layout has variety (not all cards)
- [ ] Asymmetric elements exist
- [ ] No gradient text
- [ ] No blob illustrations
- [ ] No generic stock photos
- [ ] Not everything is centered
- [ ] Not everything has the same border-radius
- [ ] Not everything has a drop shadow

---

## PART 7: Quick Reference

### Spacing Cheat Sheet

| Use Case | Token | Value |
|----------|-------|-------|
| Icon padding | `--space-xs` | 4px |
| Input padding | `--space-sm` `--space-md` | 8px 16px |
| Card padding | `--space-lg` | 24px |
| Section gap | `--space-xl` to `--space-2xl` | 32-48px |
| Page sections | `--space-3xl` to `--space-4xl` | 64-96px |
| Hero sections | `--space-4xl` to `--space-5xl` | 96-128px |

### Typography Cheat Sheet

| Element | Size Token | Weight | Line Height |
|---------|------------|--------|-------------|
| Hero heading | `--text-5xl/6xl` | 700 | 1.1 |
| Page heading | `--text-4xl` | 600-700 | 1.2 |
| Section heading | `--text-3xl` | 600 | 1.25 |
| Card heading | `--text-xl/2xl` | 600 | 1.3 |
| Body text | `--text-base/lg` | 400 | 1.6 |
| Small text | `--text-sm` | 400 | 1.5 |
| Labels | `--text-xs` | 600 | 1.4 |

### Color Decision Tree

```
Is it text?
├── Primary content → --gray-900 (light bg) or white (dark bg)
├── Secondary content → --gray-600
├── Disabled/placeholder → --gray-400
└── Links → --blue-primary

Is it a background?
├── Page background → white or --gray-50
├── Card background → white
├── Section alt → --gray-50 or --gray-100
├── Dark section → --blue-darker
└── Overlay/modal → rgba(0,0,0,0.6)

Is it interactive?
├── Primary action → --blue-primary
├── Danger action → --red-accent
├── Success → green (semantic)
└── Warning → gold (semantic)
```

---

## Final Principle

**When in doubt, choose:**
- More whitespace over less
- Simpler over complex
- Consistent over perfect
- Accessible over trendy
- Fast over flashy

**Remember:** Premium design isn't about adding more. It's about removing everything that doesn't serve the user.
