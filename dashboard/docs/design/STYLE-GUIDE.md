# Nexus OS Dashboard — Comprehensive Style Guide

> **Version:** 1.0
> **Last Updated:** January 12, 2026
> **Purpose:** Reference document for maintaining visual consistency across the Nexus OS dashboard implementation

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Reference Images](#reference-images)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Card System](#card-system)
7. [Navigation](#navigation)
8. [Components](#components)
9. [Interactive States](#interactive-states)
10. [Status & Feedback](#status--feedback)
11. [Icons](#icons)
12. [Background Pattern](#background-pattern)
13. [Responsive Behavior](#responsive-behavior)
14. [Animation Guidelines](#animation-guidelines)
15. [Implementation Reference](#implementation-reference)

---

## Design Philosophy

The Nexus OS dashboard follows a **"Command Center" aesthetic** — a futuristic operations interface that balances information density with visual clarity. The design draws inspiration from:

- **Sci-fi control panels** — Clean, functional, data-rich
- **Modern glassmorphism** — Depth through transparency and blur
- **Terminal interfaces** — Monospace typography for data, high contrast

### Core Principles

1. **Hierarchy through luminosity** — Brighter elements demand attention, darker elements recede
2. **Color as meaning** — Each color serves a semantic purpose (status, category, interaction)
3. **Density without clutter** — Pack information tightly, but maintain breathing room
4. **Subtle motion** — The falling pattern provides ambient life without distraction

---

## Reference Images

All design decisions should be validated against these reference images:

### Full Dashboard View
**File:** `references/dashboard-overview.png`

![Dashboard Overview](references/dashboard-overview.png)

This is the primary reference showing:
- Overall layout structure (sidebar, main content, right panel)
- Navigation hierarchy and active states
- Stat cards (CPU, Memory, Network) with spotlight treatment
- System time display with monospace typography
- Quick Actions grid layout

### Card Details & Alerts
**File:** `references/dashboard-cards.png`

![Dashboard Cards](references/dashboard-cards.png)

Reference for:
- Security Status card with Active badges
- System Alerts list with colored status indicators
- Resource Allocation progress bars
- Environment Controls toggles
- Communications Log with unread indicators

### Communications Input Area
**File:** `references/dashboard-comms.png`

![Dashboard Communications](references/dashboard-comms.png)

Reference for:
- Message input field styling
- Icon button treatments (microphone, message)
- List item structure with avatars
- Timestamp formatting

### Background Pattern - Dark Mode
**File:** `references/pattern-dark.png`

![Pattern Dark](references/pattern-dark.png)

Reference for:
- Falling dot matrix effect in dark mode
- Blur overlay intensity
- How the pattern appears behind content

### Background Pattern - Light Mode
**File:** `references/pattern-light.png`

![Pattern Light](references/pattern-light.png)

Reference for:
- Falling dot matrix effect in light mode
- Adjusted blur for lighter backgrounds
- Pattern visibility against white/gray

---

## Color System

### Dark Mode (Primary)

> **Reference:** See `references/dashboard-overview.png` for color context

#### Base Colors

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--background` | `#0a0f1a` | `220 45% 7%` | Page background behind pattern |
| `--background-elevated` | `#111827` | `220 35% 11%` | Card backgrounds, elevated surfaces |
| `--background-card` | `#1a2332` | `218 30% 15%` | Primary card background |
| `--background-card-light` | `#243044` | `216 28% 20%` | Highlighted cards (stats cards) |
| `--surface-muted` | `#2a3548` | `215 25% 22%` | Input backgrounds, inactive elements |

#### Border Colors

| Token | Hex | Opacity | Usage |
|-------|-----|---------|-------|
| `--border-default` | `#3b4a63` | 100% | Card borders, dividers |
| `--border-subtle` | `#ffffff` | 8% | Very subtle separators |
| `--border-emphasis` | `#00d4ff` | 20% | Highlighted card borders |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#ffffff` | Headings, important values |
| `--text-secondary` | `#94a3b8` | Body text, descriptions |
| `--text-muted` | `#64748b` | Labels, timestamps, captions |
| `--text-accent` | `#00d4ff` | Interactive text, emphasis |

#### Accent Colors

> **Reference:** See the cyan "LIVE" badge and system time in `references/dashboard-overview.png`

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--accent-primary` | `#00d4ff` | `189 100% 50%` | Primary actions, active states, key data |
| `--accent-primary-muted` | `#00d4ff` | at 20% opacity | Backgrounds for active items |
| `--accent-secondary` | `#a855f7` | `270 91% 65%` | Secondary data (memory in charts) |

#### Semantic Colors

> **Reference:** See alert icons and badges in `references/dashboard-cards.png`

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#22c55e` | Active status, completed, healthy |
| `--success-muted` | `#22c55e` at 20% | Success backgrounds |
| `--warning` | `#f59e0b` | Warnings, attention needed |
| `--warning-muted` | `#f59e0b` at 20% | Warning backgrounds |
| `--error` | `#ef4444` | Errors, critical alerts |
| `--error-muted` | `#ef4444` at 20% | Error backgrounds |
| `--info` | `#3b82f6` | Informational, network-related |
| `--info-muted` | `#3b82f6` at 20% | Info backgrounds |

---

### Light Mode

#### Base Colors

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `--background` | `#f8fafc` | `210 40% 98%` | Page background behind pattern |
| `--background-elevated` | `#ffffff` | `0 0% 100%` | Card backgrounds |
| `--background-card` | `#ffffff` | `0 0% 100%` | Primary card background |
| `--background-card-light` | `#f1f5f9` | `210 40% 96%` | Highlighted cards |
| `--surface-muted` | `#e2e8f0` | `214 32% 91%` | Input backgrounds |

#### Border Colors

| Token | Hex | Opacity | Usage |
|-------|-----|---------|-------|
| `--border-default` | `#cbd5e1` | 100% | Card borders |
| `--border-subtle` | `#000000` | 5% | Subtle separators |
| `--border-emphasis` | `#0891b2` | 30% | Highlighted borders |

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#0f172a` | Headings, important values |
| `--text-secondary` | `#475569` | Body text, descriptions |
| `--text-muted` | `#94a3b8` | Labels, timestamps |
| `--text-accent` | `#0891b2` | Interactive text (slightly darker cyan for contrast) |

#### Accent Adjustment for Light Mode

The primary cyan (`#00d4ff`) is too bright for light backgrounds. Use these adjusted values:

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-primary` | `#0891b2` | Primary actions (darker cyan) |
| `--accent-primary-hover` | `#0e7490` | Hover state |
| `--success` | `#16a34a` | Active status (slightly darker) |

---

## Typography

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `display-lg` | 48px / 3rem | 700 | 1.1 | System time display |
| `display-sm` | 32px / 2rem | 700 | 1.2 | Large stat values (43%, 63%) |
| `heading-lg` | 24px / 1.5rem | 600 | 1.3 | Section titles (System Overview) |
| `heading-md` | 18px / 1.125rem | 600 | 1.4 | Card titles (Security Status) |
| `heading-sm` | 14px / 0.875rem | 600 | 1.4 | Subsection titles |
| `body` | 14px / 0.875rem | 400 | 1.5 | Body text, descriptions |
| `body-sm` | 13px / 0.8125rem | 400 | 1.5 | Secondary body text |
| `caption` | 12px / 0.75rem | 500 | 1.4 | Labels, timestamps |
| `overline` | 11px / 0.6875rem | 600 | 1.3 | Category labels (SYSTEM TIME) |

### Font Usage Rules

> **Reference:** Compare system time (mono) vs stat values (sans) in `references/dashboard-overview.png`

| Context | Font | Example |
|---------|------|---------|
| Time displays | Mono | `17:48:46` |
| Timestamps | Mono | `14:32:12` |
| Uptime counters | Mono | `14d 06:42:18` |
| Percentage values | Sans | `43%` |
| Stat values | Sans | `16.4 GB / 24 GB` |
| Body text | Sans | All descriptions |
| Labels | Sans | `CPU Usage`, `Memory` |
| Overlines | Sans (uppercase) | `SYSTEM STATUS` |

### Letter Spacing

| Context | Tracking |
|---------|----------|
| Overlines / Labels (uppercase) | `0.05em` |
| Time displays (mono) | `0.02em` |
| Body text | `0` (default) |
| Large stats | `-0.02em` |

---

## Spacing & Layout

> **Reference:** See overall structure in `references/dashboard-overview.png`

### Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Layout Grid

| Element | Value |
|---------|-------|
| Page max-width | `1600px` (or fluid) |
| Page padding | `24px` |
| Sidebar width | `240px` (expanded) / `72px` (collapsed) |
| Right panel width | `320px` |
| Main content gap | `24px` |
| Card internal padding | `20px` - `24px` |
| Card gap (between cards) | `20px` |

### Border Radius Scale

```css
--radius-sm: 6px;    /* Buttons, badges, small elements */
--radius-md: 8px;    /* Input fields, small cards */
--radius-lg: 12px;   /* Standard cards */
--radius-xl: 16px;   /* Large cards, modals */
--radius-full: 9999px; /* Pills, avatars, toggles */
```

---

## Card System

> **Reference:** Compare card backgrounds in `references/dashboard-overview.png` — note how stat cards are brighter than the Security Status card

### Card Hierarchy

The dashboard uses three tiers of card emphasis:

#### Tier 1: Spotlight Cards (Stats Cards)
- **Background:** `--background-card-light` (`#243044`)
- **Border:** 1px solid `--border-default` with subtle cyan tint
- **Use for:** Primary metrics (CPU, Memory, Network)
- **Shadow:** None (flat design, depth from color)

#### Tier 2: Standard Cards
- **Background:** `--background-card` (`#1a2332`)
- **Border:** 1px solid `--border-default` (`#3b4a63`)
- **Use for:** Security Status, System Alerts, Communications Log

#### Tier 3: Contained Cards / Sections
- **Background:** `--background-elevated` (`#111827`)
- **Border:** 1px solid `--border-subtle`
- **Use for:** Sidebar, nested sections, grouped controls

### Card Anatomy

```
┌─────────────────────────────────────────────┐
│  [Icon] Title                    [Action]   │  ← Header: 48-56px height
├─────────────────────────────────────────────┤
│                                             │
│  Content Area                               │  ← Padding: 20-24px
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

### Card CSS Reference

```css
.card-standard {
  background: var(--background-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.card-spotlight {
  background: var(--background-card-light);
  border: 1px solid color-mix(in srgb, var(--accent-primary) 15%, var(--border-default));
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
```

### Glassmorphism Effect (Light Mode)

```css
.card-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}
```

---

## Navigation

> **Reference:** See sidebar in `references/dashboard-overview.png`

### Sidebar Structure

```
┌──────────────────────┐
│  ◇ NEXUS OS          │  ← Logo: 64px height
├──────────────────────┤
│                      │
│  ⌘ Dashboard    ←──────── Active (cyan background wash)
│  ⚡ Diagnostics      │
│  🗄 Data Center      │
│  🌐 Network          │
│  🛡 Security         │
│  >_ Console          │
│  💬 Communications   │
│  ⚙ Settings          │
│                      │
├──────────────────────┤
│  SYSTEM STATUS       │  ← Footer section
│  Core Systems   80%  │
│  Security       75%  │
│  Network        82%  │
└──────────────────────┘
```

### Navigation Item States

| State | Background | Text Color | Icon Color |
|-------|------------|------------|------------|
| Default | Transparent | `--text-secondary` | `--text-secondary` |
| Hover | `--accent-primary` at 8% | `--text-primary` | `--text-primary` |
| Active | `--accent-primary` at 15% | `--accent-primary` | `--accent-primary` |
| Disabled | Transparent | `--text-muted` | `--text-muted` |

### Navigation Item Sizing

| Property | Value |
|----------|-------|
| Height | 44px |
| Padding (horizontal) | 16px |
| Icon size | 20px |
| Icon-text gap | 12px |
| Border radius | 8px |

---

## Components

### Badges

> **Reference:** See "Active" badges and "4 New Messages" in `references/dashboard-cards.png`

#### Status Badges (Active/Inactive)

```css
.badge-active {
  background: var(--success);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-full);
}

.badge-inactive {
  background: var(--surface-muted);
  color: var(--text-muted);
}

.badge-updated {
  background: transparent;
  color: var(--accent-primary);
  font-weight: 500;
}
```

#### Notification Badges

```css
.badge-notification {
  background: var(--accent-primary);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--accent-primary);
}
```

#### Live Indicator

> **Reference:** See "LIVE" badge next to System Overview in `references/dashboard-overview.png`

```css
.badge-live {
  background: transparent;
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--accent-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-live::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--accent-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
```

### Progress Bars

> **Reference:** See Resource Allocation section in `references/dashboard-cards.png`

All progress bars use a consistent solid-fill style:

```css
.progress-bar {
  height: 6px;
  background: var(--surface-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

/* Color variants */
.progress-bar-fill.success { background: var(--success); }
.progress-bar-fill.info { background: var(--info); }
.progress-bar-fill.warning { background: var(--warning); }
.progress-bar-fill.accent { background: var(--accent-primary); }
.progress-bar-fill.secondary { background: var(--accent-secondary); }
```

### Sliders

> **Reference:** See Priority Level slider in `references/dashboard-cards.png`

```css
.slider-track {
  height: 6px;
  background: var(--surface-muted);
  border-radius: var(--radius-full);
}

.slider-fill {
  background: var(--accent-primary);
}

.slider-thumb {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

### Toggle Switches

> **Reference:** See Environment Controls in `references/dashboard-cards.png`

```css
.toggle {
  width: 44px;
  height: 24px;
  border-radius: var(--radius-full);
  padding: 2px;
  transition: background 0.2s ease;
}

.toggle-off {
  background: var(--surface-muted);
}

.toggle-on {
  background: var(--accent-primary);
}

.toggle-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}
```

### Buttons

#### Primary Button

```css
.btn-primary {
  background: var(--accent-primary);
  color: var(--background);
  font-weight: 600;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

#### Secondary/Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  padding: 10px 20px;
  border-radius: var(--radius-md);
}

.btn-ghost:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}
```

#### Icon Button

> **Reference:** See microphone and message buttons in `references/dashboard-comms.png`

```css
.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: var(--background);
  border-radius: var(--radius-md);
}
```

### Input Fields

> **Reference:** See "Type a message..." input in `references/dashboard-comms.png`

```css
.input {
  background: var(--surface-muted);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 20%, transparent);
}
```

### Stat Cards (CPU, Memory, Network)

> **Reference:** See stat cards in `references/dashboard-overview.png`

```
┌─────────────────────────────────┐
│  CPU Usage              [icon]  │  ← Label + icon row
│                                 │
│  43%                            │  ← Large value (display-sm)
│  3.8 GHz | 12 Cores    [graph]  │  ← Subtext + mini sparkline
└─────────────────────────────────┘
```

---

## Interactive States

### Focus States

All focusable elements use a cyan focus ring:

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--accent-primary);
}
```

### Hover Transitions

Standard transition for all interactive elements:

```css
transition: all 0.15s ease;
```

### List Item Hover (Communications Log)

> **Reference:** See Communications Log in `references/dashboard-cards.png`

```css
.list-item {
  padding: 16px;
  border-radius: var(--radius-md);
  transition: background 0.15s ease;
}

.list-item:hover {
  background: var(--surface-muted);
}
```

### Unread Indicator

The cyan dots on communications log items indicate unread status:

```css
.unread-indicator {
  width: 8px;
  height: 8px;
  background: var(--accent-primary);
  border-radius: 50%;
}
```

---

## Status & Feedback

### Alert Types

> **Reference:** See System Alerts in `references/dashboard-cards.png` — note the different icon colors

| Type | Icon Color | Background | Border | Use Case |
|------|------------|------------|--------|----------|
| Success | `--success` | `--success-muted` | `--success` at 30% | Completed, passed, healthy |
| Warning | `--warning` | `--warning-muted` | `--warning` at 30% | Attention needed, spikes |
| Error | `--error` | `--error-muted` | `--error` at 30% | Failed, critical |
| Info | `--info` | `--info-muted` | `--info` at 30% | Updates available, notices |

### Alert Item Structure

```
┌─────────────────────────────────────────────────────┐
│  [●] Security Scan Complete         14:32:12        │
│      No threats detected in system scan             │
└─────────────────────────────────────────────────────┘
```

- Icon: 16px, colored by type
- Title: `heading-sm`, `--text-primary`
- Timestamp: `caption`, `--text-muted`, monospace
- Description: `body-sm`, `--text-secondary`

### System Status Indicators (Sidebar)

> **Reference:** See SYSTEM STATUS section at bottom of sidebar in `references/dashboard-overview.png`

Mini progress bars with percentage labels:

```css
.status-bar {
  height: 4px;
  background: var(--surface-muted);
  border-radius: var(--radius-full);
}

.status-bar-core { /* Green */ }
.status-bar-security { /* Green */ }
.status-bar-network { /* Blue */ }
```

---

## Icons

### Recommended Icon Set

Use **Lucide React** for consistency with shadcn/ui ecosystem.

```bash
npm install lucide-react
```

### Icon Mapping

| UI Element | Lucide Icon |
|------------|-------------|
| Dashboard | `LayoutDashboard` or `Command` |
| Diagnostics | `Activity` |
| Data Center | `Database` or `HardDrive` |
| Network | `Globe` or `Wifi` |
| Security | `Shield` |
| Console | `Terminal` |
| Communications | `MessageSquare` |
| Settings | `Settings` |
| CPU | `Cpu` |
| Memory | `MemoryStick` or `Server` |
| Search | `Search` |
| Notifications | `Bell` |
| Refresh | `RefreshCw` |
| Download/Backup | `Download` |
| Sync | `RefreshCcw` |
| Power | `Power` |
| Lock | `Lock` |
| Lightning (Power Saving) | `Zap` |

### Icon Sizing

| Context | Size |
|---------|------|
| Navigation items | 20px |
| Card headers | 20px |
| Stat card icons | 24px |
| Action buttons | 18px |
| Inline with text | 16px |

### Icon Stroke Width

Use `strokeWidth={1.5}` for a refined, modern look matching the dashboard aesthetic.

---

## Background Pattern

> **Reference:** See `references/pattern-dark.png` and `references/pattern-light.png`

### Component Code

The falling pattern component creates the ambient matrix rain effect. Place this in `/src/components/ui/falling-pattern.tsx`:

```tsx
'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type FallingPatternProps = React.ComponentProps<'div'> & {
  /** Primary color of the falling elements (default: 'var(--primary)') */
  color?: string;
  /** Background color (default: 'var(--background)') */
  backgroundColor?: string;
  /** Animation duration in seconds (default: 150) */
  duration?: number;
  /** Blur intensity for the overlay effect (default: '1em') */
  blurIntensity?: string;
  /** Pattern density - affects spacing (default: 1) */
  density?: number;
};

export function FallingPattern({
  color = 'var(--primary)',
  backgroundColor = 'var(--background)',
  duration = 150,
  blurIntensity = '1em',
  density = 1,
  className,
}: FallingPatternProps) {
  // Generate background image style with customizable color
  const generateBackgroundImage = () => {
    const patterns = [
      // Row 1
      `radial-gradient(4px 100px at 0px 235px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 235px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 117.5px, ${color} 100%, transparent 150%)`,
      // Row 2
      `radial-gradient(4px 100px at 0px 252px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 252px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 126px, ${color} 100%, transparent 150%)`,
      // Row 3
      `radial-gradient(4px 100px at 0px 150px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 150px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 75px, ${color} 100%, transparent 150%)`,
      // Row 4
      `radial-gradient(4px 100px at 0px 253px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 253px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 126.5px, ${color} 100%, transparent 150%)`,
      // Row 5
      `radial-gradient(4px 100px at 0px 204px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 204px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 102px, ${color} 100%, transparent 150%)`,
      // Row 6
      `radial-gradient(4px 100px at 0px 134px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 134px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 67px, ${color} 100%, transparent 150%)`,
      // Row 7
      `radial-gradient(4px 100px at 0px 179px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 179px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 89.5px, ${color} 100%, transparent 150%)`,
      // Row 8
      `radial-gradient(4px 100px at 0px 299px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 299px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 149.5px, ${color} 100%, transparent 150%)`,
      // Row 9
      `radial-gradient(4px 100px at 0px 215px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 215px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 107.5px, ${color} 100%, transparent 150%)`,
      // Row 10
      `radial-gradient(4px 100px at 0px 281px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 281px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 140.5px, ${color} 100%, transparent 150%)`,
      // Row 11
      `radial-gradient(4px 100px at 0px 158px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 158px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 79px, ${color} 100%, transparent 150%)`,
      // Row 12
      `radial-gradient(4px 100px at 0px 210px, ${color}, transparent)`,
      `radial-gradient(4px 100px at 300px 210px, ${color}, transparent)`,
      `radial-gradient(1.5px 1.5px at 150px 105px, ${color} 100%, transparent 150%)`,
    ];

    return patterns.join(', ');
  };

  const backgroundSizes = [
    '300px 235px',
    '300px 235px',
    '300px 235px',
    '300px 252px',
    '300px 252px',
    '300px 252px',
    '300px 150px',
    '300px 150px',
    '300px 150px',
    '300px 253px',
    '300px 253px',
    '300px 253px',
    '300px 204px',
    '300px 204px',
    '300px 204px',
    '300px 134px',
    '300px 134px',
    '300px 134px',
    '300px 179px',
    '300px 179px',
    '300px 179px',
    '300px 299px',
    '300px 299px',
    '300px 299px',
    '300px 215px',
    '300px 215px',
    '300px 215px',
    '300px 281px',
    '300px 281px',
    '300px 281px',
    '300px 158px',
    '300px 158px',
    '300px 158px',
    '300px 210px',
    '300px 210px',
  ].join(', ');

  const startPositions =
    '0px 220px, 3px 220px, 151.5px 337.5px, 25px 24px, 28px 24px, 176.5px 150px, 50px 16px, 53px 16px, 201.5px 91px, 75px 224px, 78px 224px, 226.5px 230.5px, 100px 19px, 103px 19px, 251.5px 121px, 125px 120px, 128px 120px, 276.5px 187px, 150px 31px, 153px 31px, 301.5px 120.5px, 175px 235px, 178px 235px, 326.5px 384.5px, 200px 121px, 203px 121px, 351.5px 228.5px, 225px 224px, 228px 224px, 376.5px 364.5px, 250px 26px, 253px 26px, 401.5px 105px, 275px 75px, 278px 75px, 426.5px 180px';
  const endPositions =
    '0px 6800px, 3px 6800px, 151.5px 6917.5px, 25px 13632px, 28px 13632px, 176.5px 13758px, 50px 5416px, 53px 5416px, 201.5px 5491px, 75px 17175px, 78px 17175px, 226.5px 17301.5px, 100px 5119px, 103px 5119px, 251.5px 5221px, 125px 8428px, 128px 8428px, 276.5px 8495px, 150px 9876px, 153px 9876px, 301.5px 9965.5px, 175px 13391px, 178px 13391px, 326.5px 13540.5px, 200px 14741px, 203px 14741px, 351.5px 14848.5px, 225px 18770px, 228px 18770px, 376.5px 18910.5px, 250px 5082px, 253px 5082px, 401.5px 5161px, 275px 6375px, 278px 6375px, 426.5px 6480px';

  return (
    <div className={cn('relative h-full w-full p-1', className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="size-full"
      >
        <motion.div
          className="relative size-full z-0"
          style={{
            backgroundColor,
            backgroundImage: generateBackgroundImage(),
            backgroundSize: backgroundSizes,
          }}
          variants={{
            initial: {
              backgroundPosition: startPositions,
            },
            animate: {
              backgroundPosition: [startPositions, endPositions],
              transition: {
                duration: duration,
                ease: 'linear',
                repeat: Number.POSITIVE_INFINITY,
              },
            },
          }}
          initial="initial"
          animate="animate"
        />
      </motion.div>
      <div
        className="absolute inset-0 z-1 dark:brightness-600"
        style={{
          backdropFilter: `blur(${blurIntensity})`,
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, ${backgroundColor} 2px)`,
          backgroundSize: `${8 * density}px ${8 * density}px`,
        }}
      />
    </div>
  );
}
```

### Required Dependencies

```bash
npm install framer-motion
```

### Usage in Dashboard

```tsx
// In your root layout or dashboard page
import { FallingPattern } from "@/components/ui/falling-pattern";

export default function DashboardLayout({ children }) {
  return (
    <div className="relative min-h-screen">
      {/* Background pattern - fixed behind everything */}
      <FallingPattern
        color="var(--accent-primary)"
        backgroundColor="var(--background)"
        duration={150}
        blurIntensity="1em"
        density={1}
        className="fixed inset-0 -z-10"
      />

      {/* Dashboard content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
```

### CSS Requirements

Add to your `globals.css` or `index.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --background: oklch(0.12 0.02 240);
  --accent-primary: oklch(0.8 0.15 195);
}

.dark {
  --background: oklch(0.07 0.02 240);
}

.light {
  --background: oklch(0.98 0.01 220);
}
```

### Pattern Configuration by Theme

| Theme | color | backgroundColor | blurIntensity |
|-------|-------|-----------------|---------------|
| Dark | `var(--accent-primary)` | `var(--background)` | `1em` |
| Light | `var(--accent-primary)` | `var(--background)` | `0.8em` |

---

## Responsive Behavior

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Layout Adaptations

| Viewport | Sidebar | Right Panel | Main Grid |
|----------|---------|-------------|-----------|
| ≥1280px | Expanded (240px) | Visible (320px) | 2-3 columns |
| 1024-1279px | Collapsed (72px) | Visible (280px) | 2 columns |
| 768-1023px | Collapsed (72px) | Hidden (toggle) | 1-2 columns |
| <768px | Hidden (hamburger) | Hidden (modal) | 1 column |

### Collapsed Sidebar (Icon Rail)

```
┌──────┐
│  ◇   │  ← Logo icon only
├──────┤
│  ⌘   │
│  ⚡   │
│  🗄   │
│  🌐   │
│  🛡   │
│  >_  │
│  💬   │
│  ⚙   │
├──────┤
│ ▓▓▓  │  ← Mini status bars
│ ▓▓   │
│ ▓▓▓▓ │
└──────┘
```

Width: 72px
Icon size: 24px
Tooltip on hover showing full label

---

## Animation Guidelines

### Timing Functions

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Duration Scale

| Type | Duration | Use Case |
|------|----------|----------|
| Instant | 0ms | Immediate feedback |
| Fast | 100-150ms | Hovers, small state changes |
| Normal | 200-300ms | Expanding panels, modals |
| Slow | 400-500ms | Page transitions, large movements |
| Ambient | 2000ms+ | Background pattern, pulsing indicators |

### Specific Animations

#### Live Pulse

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### Count Up (for stats)

```tsx
// Use framer-motion's useSpring or a count-up library
// Duration: 1000ms
// Easing: easeOut
```

#### Card Entrance

```css
@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Duration: 300ms, stagger: 50ms between cards */
```

---

## Implementation Reference

### CSS Custom Properties Setup

```css
:root {
  /* Colors - Dark Mode (default) */
  --background: oklch(0.12 0.02 240);
  --background-elevated: oklch(0.15 0.02 230);
  --background-card: oklch(0.18 0.025 225);
  --background-card-light: oklch(0.22 0.03 220);
  --surface-muted: oklch(0.26 0.025 218);

  --border-default: oklch(0.35 0.02 220);
  --border-subtle: oklch(1 0 0 / 0.08);

  --text-primary: oklch(1 0 0);
  --text-secondary: oklch(0.7 0.01 230);
  --text-muted: oklch(0.55 0.01 230);

  --accent-primary: oklch(0.8 0.15 195);
  --accent-secondary: oklch(0.65 0.25 300);

  --success: oklch(0.7 0.2 145);
  --warning: oklch(0.75 0.18 70);
  --error: oklch(0.65 0.25 25);
  --info: oklch(0.65 0.2 250);

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

.light {
  --background: oklch(0.98 0.01 220);
  --background-elevated: oklch(1 0 0);
  --background-card: oklch(1 0 0);
  --background-card-light: oklch(0.97 0.005 220);
  --surface-muted: oklch(0.92 0.01 220);

  --border-default: oklch(0.85 0.01 220);
  --border-subtle: oklch(0 0 0 / 0.05);

  --text-primary: oklch(0.15 0.02 240);
  --text-secondary: oklch(0.4 0.02 240);
  --text-muted: oklch(0.6 0.01 230);

  --accent-primary: oklch(0.55 0.15 200);
}
```

### Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        'background-elevated': 'var(--background-elevated)',
        'background-card': 'var(--background-card)',
        'background-card-light': 'var(--background-card-light)',
        'surface-muted': 'var(--surface-muted)',
        border: 'var(--border-default)',
        'border-subtle': 'var(--border-subtle)',
        foreground: 'var(--text-primary)',
        'foreground-secondary': 'var(--text-secondary)',
        'foreground-muted': 'var(--text-muted)',
        accent: 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
}
```

---

## Quick Reference Cheat Sheet

### Color by Context

| What | Color Token |
|------|-------------|
| Page background | `--background` |
| Card background | `--background-card` |
| Important card | `--background-card-light` |
| Input background | `--surface-muted` |
| Primary button | `--accent-primary` |
| Active nav item | `--accent-primary` |
| Success badge | `--success` |
| Warning alert | `--warning` |
| Body text | `--text-secondary` |
| Headings | `--text-primary` |
| Labels | `--text-muted` |
| Timestamps | `--text-muted` + mono |

### Typography Quick Reference

| Element | Classes (Tailwind) |
|---------|-------------------|
| System time | `font-mono text-5xl font-bold tracking-tight text-accent` |
| Stat value | `text-3xl font-bold text-foreground` |
| Card title | `text-lg font-semibold text-foreground` |
| Body | `text-sm text-foreground-secondary` |
| Label | `text-xs font-medium uppercase tracking-wide text-foreground-muted` |
| Timestamp | `font-mono text-xs text-foreground-muted` |

---

## File Structure

```
/docs
  /design
    STYLE-GUIDE.md           <- This file
    /references
      dashboard-overview.png  <- Full dashboard view
      dashboard-cards.png     <- Card details, alerts, controls
      dashboard-comms.png     <- Communications input area
      pattern-dark.png        <- Falling pattern dark mode
      pattern-light.png       <- Falling pattern light mode
```

---

*End of Style Guide*
