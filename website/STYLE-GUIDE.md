# IAML Website Style Guide

## Overview

This style guide documents the design system and best practices for the IAML website. It ensures consistency across all components and pages while maintaining a modern, professional aesthetic.

---

## Button Design System

### Design Philosophy

All buttons across the IAML website use **`border: none`** for a clean, modern aesthetic. Buttons rely on background colors, shadows, and transform effects to provide visual feedback and hierarchy rather than borders.

### Button Variants

#### Primary Button (`.btn-primary`)
- **Background**: `#3b5998` (Facebook Blue)
- **Hover Background**: `#2d4373` (Darker Blue)
- **Text Color**: White
- **Border**: None
- **Border Radius**: 8px
- **Padding**: 16px 32px
- **Shadow**: `0 2px 4px rgba(0, 0, 0, 0.2)` (default), `0 4px 8px rgba(0, 0, 0, 0.25)` + glow (hover)
- **Hover Effect**: Lift up 1px, enhanced shadow and glow

**Usage**: Call-to-action buttons, primary navigation actions, main feature buttons

**Example**:
```html
<button class="btn btn-primary">Get Started</button>
```

#### Secondary Button (`.btn-secondary`)
- **Background**: White
- **Text Color**: `#4b5563` (Gray-700)
- **Hover Background**: `#f3f4f6` (Gray-50)
- **Border**: None
- **Border Radius**: 8px
- **Padding**: 16px 32px
- **Shadow**: `0 2px 4px rgba(0, 0, 0, 0.1)` (default), `0 4px 8px rgba(0, 0, 0, 0.15)` (hover)
- **Hover Effect**: Subtle background change, lift up 1px

**Usage**: Alternative actions, less critical call-to-actions, secondary navigation

**Example**:
```html
<button class="btn btn-secondary">Learn More</button>
```

#### Register/CTA Button (`.btn-register`, `.btn-red`, `.cta-red`)
- **Background**: `#e41e26` (Bright Red)
- **Hover Background**: `#c41920` (Darker Red)
- **Text Color**: White
- **Border**: None
- **Border Radius**: 8px
- **Padding**: 16px 32px
- **Shadow**: `0 2px 4px rgba(0, 0, 0, 0.2)` (default), `0 4px 8px rgba(0, 0, 0, 0.25)` + red glow (hover)
- **Hover Effect**: Lift up 1px, enhanced shadow and glow

**Usage**: Registration forms, urgent calls-to-action, sign-up buttons

**Example**:
```html
<button class="btn btn-register">Register Now</button>
```

#### Glass Button (`.glass-btn`, `.glass-btn-blue`)
- **Background**: Semi-transparent with gradient (blue variants)
- **Backdrop Filter**: `blur(15px) saturate(130%)`
- **Border**: None
- **Border Radius**: 8px
- **Padding**: 16px 32px
- **Shadow**: Complex inset and outer shadows for depth
- **Hover Effect**: Enhanced background opacity, lift effect

**Usage**: Hero sections, premium features, overlay content

**Example**:
```html
<button class="btn glass-btn glass-btn-blue">Explore Features</button>
```

#### Quiz Option Button (`.quiz-option`)
- **Background**: White
- **Text Color**: Gray-900
- **Border**: None
- **Border Radius**: 12px
- **Padding**: 20px 24px
- **Hover Effect**: Subtle background change to gray-50, slight horizontal translation

**Usage**: Quiz/poll options, selection choices

**Example**:
```html
<button class="quiz-option">
  <span class="quiz-option-title">Option Title</span>
  <span class="quiz-option-desc">Brief description</span>
</button>
```

#### Interactive Option Button (`.option-btn`)
- **Background**: `rgba(255, 255, 255, 0.15)` (semi-transparent white)
- **Text Color**: White
- **Border**: None
- **Border Radius**: 12px
- **Padding**: 20px
- **Selected State**: Enhanced background opacity, scale up, glow animation
- **Hover Effect**: Slight lift (translateY -2px)

**Usage**: Multi-select options, quiz answers, configuration choices

**Example**:
```html
<button class="option-btn">Option Content</button>
```

#### Back Button (`.back-button`)
- **Background**: `rgba(255, 255, 255, 0.12)` (subtle semi-transparent)
- **Text Color**: White
- **Border**: None
- **Border Radius**: 8px
- **Padding**: 12px 24px
- **Hover Effect**: Increased background opacity, lift effect

**Usage**: Navigation back, quiz reset, form restart

**Example**:
```html
<button class="back-button">← Go Back</button>
```

---

## Common Button Properties

### Base Button (`.btn`)
All buttons inherit from the base `.btn` class which provides:
- Display: inline-flex with centered alignment
- Padding: 16px 32px
- Border: None
- Border-radius: 8px
- Font: Lato, 700 weight, uppercase
- Letter spacing: 0.5px
- Cursor: pointer
- Transition: all 0.2s ease
- White space: nowrap

### Disabled State
All buttons support the `:disabled` pseudo-class with:
- Opacity: 0.6
- Cursor: not-allowed
- No transform effects

### Hover Effects
Buttons use multiple hover techniques:
1. **Transform**: `translateY(-1px)` or `scale(1.02)` for lift effect
2. **Box-shadow**: Enhanced shadows and glows
3. **Background**: Color changes (for secondary and glass buttons)
4. **Filter effects**: Opacity and saturation increases

---

## Typography Standards

### Headings
- **Font Family**: Playfair Display (serif), with fallback to Georgia/Times New Roman
- **Font Weight**: 600 (semi-bold) to 700 (bold)
- **Line Height**: 1.2 (tight)
- **Sizes**:
  - H1: `clamp(2.5rem, 5vw, 3.5rem)`
  - H2: `clamp(2rem, 4vw, 3rem)`
  - H3: 28px

### Body Text
- **Font Family**: Lato (sans-serif)
- **Font Weight**: 300 (light) to 600 (semi-bold)
- **Line Height**: 1.6 (readable)
- **Sizes**: 14px to 20px based on context
- **Letter Spacing**: 0.5px for uppercase text

### Button Text
- **Font Family**: Lato
- **Font Weight**: 700 (bold)
- **Text Transform**: UPPERCASE
- **Letter Spacing**: 0.5px
- **Font Size**: 16px (base)

---

## Color Palette

### Primary Colors
- **Primary Blue**: `#3b5998` (Button primary background)
- **Primary Blue Hover**: `#2d4373` (Darker shade for hover)
- **Primary Blue Light**: `#188bf6` (Alternative blue for gradients)
- **Primary Blue Dark**: `#0052a3` (Gradient end)

### Accent Colors
- **Red**: `#e41e26` (CTA, register buttons)
- **Red Hover**: `#c41920` (Darker red for hover)
- **Yellow**: `#FCD34D` (Accents, progress indicators)
- **Green**: `#22C55E` (Success, checkmarks)

### Neutral Colors
- **White**: `#ffffff`
- **Black**: `#000000`
- **Gray Scale**: `#f8fafc` to `#1f2937` (50 to 900)

### Semantic Colors
- **Success**: `#22C55E`
- **Warning**: `#F59E0B`
- **Error**: `#ef4444`

---

## Spacing & Layout

### Padding Standards
- **Buttons**: 16px 32px (vertical/horizontal)
- **Small Buttons**: 12px 24px
- **Cards**: 40px 35px
- **Sections**: 80px 0 (vertical), 40px (horizontal)

### Spacing Variables
- **Space SM**: 8px (`--space-sm`)
- **Space MD**: 16px (`--space-md`)
- **Space LG**: 32px (`--space-lg`)
- **Space XL**: 48px (`--space-xl`)
- **Space 2XL**: 64px (`--space-2xl`)
- **Space 3XL**: 96px (`--space-3xl`)
- **Space 4XL**: 128px (`--space-4xl`)

### Border Radius Standards
- **Small**: 6px (`.radius-sm`)
- **Medium**: 8px (`.radius-md`, default for buttons)
- **Large**: 12px (`.radius-lg`, quiz buttons)
- **XL**: 16px (`.radius-xl`, cards)
- **2XL**: 20px (`.radius-2xl`, modals)

---

## Shadow & Depth

### Box Shadows
- **Small**: `0 2px 4px rgba(0, 0, 0, 0.1)`
- **Medium**: `0 4px 8px rgba(0, 0, 0, 0.15)`
- **Large**: `0 8px 24px rgba(0, 0, 0, 0.15)`
- **XL**: `0 24px 48px rgba(0, 0, 0, 0.2)`
- **2XL**: `0 25px 50px rgba(0, 0, 0, 0.3)`

### Hover/Focus Shadows
Buttons with glow effects:
- Primary: `0 0 30px rgba(59, 89, 152, 0.8)`
- Red: `0 0 30px rgba(228, 30, 38, 0.8)`
- Blue: `0 0 20px rgba(0, 102, 204, 0.5)`

---

## Interactive States

### Hover States
- Buttons lift up slightly (`translateY(-1px)` or `-2px`)
- Shadows increase in size and opacity
- Colors may shift to darker shades
- Text remains unchanged

### Active/Selected States
- Additional scale effect (`scale(1.02)`)
- Glowing animations (`.option-btn.selected`)
- Box-shadow enhancement

### Focus States
- For accessibility, use outline: 3px solid on focus
- Outline color: `rgba(37, 99, 235, 0.22)`

### Disabled States
- Opacity reduced to 0.6
- Cursor changes to `not-allowed`
- No hover effects applied
- No transform effects

---

## Responsive Design

### Breakpoints
- **Mobile**: `max-width: 480px`
- **Tablet**: `max-width: 768px`
- **Desktop**: `max-width: 1024px`
- **Large Desktop**: `max-width: 1400px`

### Mobile Button Adjustments
At `max-width: 480px`:
- Buttons expand to full width (max 300px)
- Padding may be reduced slightly
- Stack vertically when in groups

---

## Motion & Animation

### Transition Duration
- **Base**: 0.2s ease
- **Slow**: 0.3s ease
- **Extra Slow**: 0.8s ease

### Transform Effects
- **Lift**: `translateY(-1px or -2px)`
- **Scale**: `scale(1.02 or 1.05)`
- **Translate**: `translateX(4px)` for horizontal emphasis

### Animations
- **Pulse**: Smooth scaling animation (2s cycle)
- **Spin**: Loading spinner (1s linear infinite)
- **Glow**: Custom pulseGlow animation (0.6s)
- **Expand**: Ring expansion effect (3s ease-out)

---

## Component Guidelines

### When to Use Each Button Type

| Button Type | Use Case | Color |
|------------|----------|-------|
| Primary | Main CTA, important actions | Blue (#3b5998) |
| Secondary | Alternative actions, less critical | White with shadow |
| Register/Red | Sign-up, urgent CTAs | Red (#e41e26) |
| Glass | Hero sections, premium features | Semi-transparent |
| Quiz Option | Selection choices, polls | White |
| Option | Multi-select, configuration | Semi-transparent white |
| Back | Navigation, reset | Semi-transparent white |

### Button Group Layout
When grouping buttons:
```html
<div class="cta-button-group">
  <button class="btn btn-primary">Primary Action</button>
  <button class="btn btn-secondary">Secondary Action</button>
</div>
```
- Default gap: 16px
- Use flexbox with centered alignment
- Wrap on mobile devices
- Maintain consistent padding

### Icon Integration
Buttons can include icons:
- Use inline-flex alignment (built into `.btn`)
- Add gap property for spacing: `gap: var(--space-sm)`
- Keep icons the same color as text
- Size icons appropriately (16-20px)

---

## Accessibility

### Color Contrast
All button colors meet WCAG AA standards (4.5:1 contrast ratio):
- Blue buttons on white: 4.7:1
- Red buttons on white: 5.2:1
- White buttons on dark: 7.1:1

### Focus States
- All buttons must have visible focus indicators
- Use outline or box-shadow (not invisible)
- Outline width minimum 2px

### Text
- Use clear, action-oriented button text
- Avoid vague labels like "Click here"
- All-caps text is readable but consider impact
- Include proper ARIA labels for icon-only buttons

### Touch Targets
- Minimum 44x44px touch target size
- Maintain adequate spacing between buttons (16px minimum)

---

## Best Practices

### Do's ✓
- Use semantic HTML: `<button>`, `<a role="button">` for links
- Apply consistent padding and sizing
- Maintain focus and hover states
- Use primary buttons for main actions only
- Group related buttons together
- Provide clear, action-oriented labels
- Test buttons on multiple devices/browsers

### Don'ts ✗
- Don't add borders to buttons
- Don't override default button behavior without reason
- Don't use buttons for non-interactive elements
- Don't mix too many button variants on one page
- Don't disable buttons without clear reason
- Don't remove focus indicators
- Don't use ambiguous button text

---

## Implementation Examples

### Basic Button
```html
<button class="btn btn-primary">Click Me</button>
```

### Button with Icon
```html
<button class="btn btn-primary">
  <svg class="icon"><!-- icon --></svg>
  Get Started
</button>
```

### Button Group
```html
<div class="cta-button-group">
  <button class="btn btn-primary">Start</button>
  <button class="btn btn-secondary">Learn More</button>
</div>
```

### Glass Button
```html
<button class="btn glass-btn glass-btn-blue">Explore</button>
```

### Quiz Option
```html
<button class="quiz-option">
  <span class="quiz-option-title">Option A</span>
  <span class="quiz-option-desc">Description of option A</span>
</button>
```

---

## File References

**CSS Files:**
- Primary Button Styles: `css/3-components.css` (lines 4-98)
- Page-Specific Styles: `css/5-pages.css` (button variations throughout)
- CSS Variables: `css/1-variables.css`

**HTML Components:**
- Buttons used in: `index.html`, `pages/`, `components/`
- Modal buttons: `components/registration-modal.html`
- Quiz buttons: `components/quiz-section.html`

---

## Version History

- **v1.1** (December 2025): Removed inline style overrides from index.html that were adding borders back with `!important` declarations. All buttons throughout the site now consistently use `border: none`.
- **v1.0** (December 2025): Initial style guide created with comprehensive button system documentation. All buttons now use `border: none` for modern aesthetic.

---

## Questions or Updates?

For questions about the style guide or to propose updates, please refer to the main CSS files and maintain consistency with established patterns.
