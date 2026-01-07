# Component Variants Generator

Generate 3 distinct styled variations of a component after deep planning, all fitting the IAML design system. Variations are presented in a single file for easy comparison.

## Usage

```
/component-variants              # Auto-detects most recent deep plan
/component-variants "mega menu"  # Specify component name explicitly
```

---

## PROCESS

### Step 1: Detect Context

**Auto-detect the deep plan:**

1. Check the current conversation for a recent `/deep-plan-ui` output
2. Look for the `=== FINAL IMPLEMENTATION PLAN ===` section
3. Extract:
   - Component name/description
   - Key requirements
   - Technical constraints
   - Responsive behavior needs
   - Accessibility requirements

If no deep plan is found:
```
=== NO DEEP PLAN DETECTED ===

I couldn't find a recent deep plan in this conversation.

Options:
1. Run `/deep-plan-ui` first to plan the component
2. Tell me what component you want variants for: /component-variants "component name"
```

If found, confirm:
```
=== DEEP PLAN DETECTED ===

Component: [name]
Key requirements:
- [requirement 1]
- [requirement 2]
- [requirement 3]

Proceeding to generate 3 variants...
```

---

### Step 2: Analyze Design System

Before generating variants, review the IAML design system:

**Required file reads:**
- `website/css/1-variables.css` - Design tokens
- `website/css/3-components.css` - Existing component patterns
- Related existing components in `website/components/`

**Extract and note:**
```
=== DESIGN SYSTEM CONTEXT ===

Colors:
- Primary: var(--blue-primary) #188bf6
- Dark: var(--blue-dark) #28528c
- Accent: var(--gold-accent) #af9232
- Backgrounds: var(--gray-50), var(--gray-100)

Typography:
- Headings: var(--font-heading) Playfair Display
- Body: var(--font-body) Lato

Spacing scale: xs(4px) → sm(8px) → md(16px) → lg(24px) → xl(32px)
Border radius: sm(6px) → md(8px) → lg(12px) → xl(16px)
Shadows: sm → md → lg → xl → 2xl

Existing patterns found:
- [Pattern 1 from codebase]
- [Pattern 2 from codebase]
```

---

### Step 3: Generate Three Variants

Create three distinct approaches that all:
- Meet the functional requirements from deep plan
- Use IAML design tokens (never hardcode colors/spacing)
- Are responsive
- Are accessible
- Feel cohesive with the existing site

**Variant A: Conservative / Minimal**
- Simplest implementation
- Minimal visual weight
- Relies on existing patterns
- Safest choice, least risk
- Best for: situations where subtlety is preferred

**Variant B: Balanced / Recommended**
- Optimal balance of form and function
- Introduces thoughtful enhancements
- Professional and polished
- Best for: most use cases

**Variant C: Bold / Feature-Rich**
- Maximum visual impact
- Additional interactions/animations
- More distinctive styling
- Best for: hero elements, key conversion points

---

### Step 4: Present Variants

Create a single comparison file at `website/components/variants/[component-name]-variants.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Component Name] - Variant Comparison</title>
    <link rel="stylesheet" href="../css/main.css">
    <style>
        /* Variant comparison layout */
        .variant-showcase {
            max-width: 1400px;
            margin: 0 auto;
            padding: var(--space-xl);
        }

        .variant-section {
            margin-bottom: var(--space-4xl);
            padding: var(--space-xl);
            border: 2px solid var(--gray-200);
            border-radius: var(--radius-lg);
        }

        .variant-header {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            margin-bottom: var(--space-xl);
            padding-bottom: var(--space-md);
            border-bottom: 1px solid var(--gray-200);
        }

        .variant-label {
            font-family: var(--font-heading);
            font-size: var(--text-2xl);
            color: var(--blue-dark);
        }

        .variant-tag {
            padding: var(--space-xs) var(--space-sm);
            border-radius: var(--radius-full);
            font-size: var(--text-sm);
            font-weight: 600;
        }

        .tag-minimal { background: var(--gray-100); color: var(--gray-700); }
        .tag-recommended { background: var(--blue-primary); color: white; }
        .tag-bold { background: var(--gold-accent); color: white; }

        .variant-description {
            color: var(--gray-600);
            margin-bottom: var(--space-lg);
            font-size: var(--text-lg);
        }

        .variant-demo {
            background: var(--gray-50);
            padding: var(--space-xl);
            border-radius: var(--radius-md);
        }

        /* Component-specific styles for each variant */
        /* VARIANT A STYLES */
        [variant-a-styles-here]

        /* VARIANT B STYLES */
        [variant-b-styles-here]

        /* VARIANT C STYLES */
        [variant-c-styles-here]
    </style>
</head>
<body>
    <div class="variant-showcase">
        <h1 style="font-family: var(--font-heading); margin-bottom: var(--space-xl);">
            [Component Name] Variants
        </h1>
        <p style="color: var(--gray-600); margin-bottom: var(--space-2xl); max-width: 800px;">
            Three styling approaches for [component description].
            Choose the one that best fits your needs, or mix elements from multiple variants.
        </p>

        <!-- VARIANT A -->
        <section class="variant-section">
            <div class="variant-header">
                <span class="variant-label">Variant A</span>
                <span class="variant-tag tag-minimal">Minimal</span>
            </div>
            <p class="variant-description">
                [Description of minimal approach - when to use it, what makes it different]
            </p>
            <div class="variant-demo">
                <!-- VARIANT A HTML HERE -->
            </div>
        </section>

        <!-- VARIANT B -->
        <section class="variant-section">
            <div class="variant-header">
                <span class="variant-label">Variant B</span>
                <span class="variant-tag tag-recommended">Recommended</span>
            </div>
            <p class="variant-description">
                [Description of balanced approach - why it's recommended, key features]
            </p>
            <div class="variant-demo">
                <!-- VARIANT B HTML HERE -->
            </div>
        </section>

        <!-- VARIANT C -->
        <section class="variant-section">
            <div class="variant-header">
                <span class="variant-label">Variant C</span>
                <span class="variant-tag tag-bold">Bold</span>
            </div>
            <p class="variant-description">
                [Description of bold approach - when maximum impact is needed]
            </p>
            <div class="variant-demo">
                <!-- VARIANT C HTML HERE -->
            </div>
        </section>
    </div>

    <script>
        // Any JavaScript needed for interactive variants
    </script>
</body>
</html>
```

---

### Step 5: Present Comparison Summary

After creating the file, present a summary:

```
=== VARIANT COMPARISON ===

File created: website/components/variants/[component-name]-variants.html

┌─────────────┬──────────────────────────────────────────────────┐
│ VARIANT A   │ Minimal                                          │
│ (Safe)      │ - [Key characteristic 1]                         │
│             │ - [Key characteristic 2]                         │
│             │ Best for: [use case]                             │
├─────────────┼──────────────────────────────────────────────────┤
│ VARIANT B   │ Balanced ⭐ Recommended                          │
│ (Balanced)  │ - [Key characteristic 1]                         │
│             │ - [Key characteristic 2]                         │
│             │ Best for: [use case]                             │
├─────────────┼──────────────────────────────────────────────────┤
│ VARIANT C   │ Bold                                             │
│ (Impactful) │ - [Key characteristic 1]                         │
│             │ - [Key characteristic 2]                         │
│             │ Best for: [use case]                             │
└─────────────┴──────────────────────────────────────────────────┘

To preview: Open website/components/variants/[component-name]-variants.html in browser

Next steps:
1. Review all three variants in browser
2. Tell me which variant you prefer (or elements to combine)
3. I'll implement the final version in the actual codebase
```

---

### Step 6: Await Selection

Wait for user to choose:

**If user picks one variant:**
```
=== IMPLEMENTING VARIANT [X] ===

I'll now implement Variant [X] into the codebase.

Files to modify:
- [file 1]
- [file 2]

Proceeding with implementation...
```

**If user wants to combine elements:**
```
=== CREATING HYBRID VARIANT ===

Combining:
- [Element from Variant A]
- [Element from Variant B]
- [Element from Variant C]

Creating final implementation...
```

**If user wants modifications:**
```
=== MODIFYING VARIANT [X] ===

Changes requested:
- [Modification 1]
- [Modification 2]

Updating the variant file with changes...
```

---

## DESIGN GUIDELINES

When creating variants, always:

### Use Design Tokens
```css
/* Good */
color: var(--blue-primary);
padding: var(--space-lg);

/* Bad */
color: #188bf6;
padding: 24px;
```

### Maintain Accessibility
- Sufficient color contrast (4.5:1 for text)
- Focus states for interactive elements
- ARIA labels where needed
- Keyboard navigation support

### Responsive Considerations
- All variants must work on mobile
- Use relative units (rem, em, %)
- Test at 320px, 768px, 1024px, 1440px breakpoints

### Animation Guidelines
- Variant A: Minimal/no animation
- Variant B: Subtle, purposeful transitions (200-300ms)
- Variant C: More expressive animations (still tasteful)

---

## RELATED COMMANDS

- `/deep-plan-ui` - Run this first to plan the component
- `/preview` - Deploy to preview environment
- `/brand-upgrade` - Ensure content matches brand voice
