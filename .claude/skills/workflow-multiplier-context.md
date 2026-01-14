# IAML Project Context Template

Copy this block to the start of any Claude.AI session, then add task-specific details below.

---

## Full Context Block

```markdown
## IAML Business OS Context

**Company:** IAML (Institute for Applied Management & Law)
- HR training company
- Programs: Employment Law, HR Management, Investigations, Leadership
- Target: HR professionals, in-house counsel, corporate training departments

---

### Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| **Website** | Vanilla HTML/CSS/JS | NO frameworks, progressive enhancement required |
| **Dashboard** | Next.js 16.1.1, React 19 | TypeScript strict mode |
| **Styling (Dashboard)** | Tailwind CSS | With tailwindcss-animate, @tailwindcss/forms |
| **UI Components** | Radix UI | Tabs, Tooltip, Progress, Slot |
| **Icons** | lucide-react | |
| **Animation** | Framer Motion | |
| **Database** | Supabase PostgreSQL | snake_case, UUID PKs |
| **Auth** | Supabase Auth | SSR via @supabase/ssr |
| **Hosting** | Vercel | |
| **Automation** | n8n | Self-hosted at n8n.realtyamp.ai |
| **CRM** | GHL (GoHighLevel) | Nurture sequences, webhooks |
| **Cold Email** | Smartlead | Multi-domain, A/B testing |
| **LinkedIn** | HeyReach | Automated outreach |
| **Lead Data** | Apollo, PhantomBuster | Enrichment, scraping |
| **Email Validation** | NeverBounce, ZeroBounce | |
| **AI** | Gemini | Classification in workflows |
| **Payments** | Stripe | Registration payments |

---

### File Structure

```
/Users/mike/IAML Business OS/
├── .claude/skills/           # Claude skills (this folder)
├── website/                  # Vanilla HTML/CSS/JS website
│   ├── index.html           # Homepage
│   ├── programs/            # Program pages
│   ├── css/main.css         # ALL styles go here
│   ├── js/                  # Feature modules
│   ├── api/                 # Vercel serverless functions
│   └── .claude/             # Website-specific instructions
├── dashboard/               # Next.js internal dashboard
│   ├── src/app/            # App Router pages
│   ├── src/components/     # React components
│   └── src/lib/            # Utilities, Supabase client
├── business-os/             # Business OS documentation
│   ├── docs/architecture/  # System design (8 docs)
│   ├── knowledge/          # ICP, voice, playbooks
│   └── departments/        # Department definitions
├── n8n-workflows/           # Workflow JSON exports
├── supabase/migrations/     # Database schemas
├── mcp-servers/             # MCP server code
│   ├── n8n-brain/          # Workflow learning layer
│   └── neverbounce/        # Email validation
└── scripts/                 # Utility scripts
```

---

### Code Conventions

**Website (Vanilla):**
- Progressive enhancement - must work without JS
- Semantic HTML5 (nav, main, section, article)
- CSS custom properties: `--blue-primary`, `--gray-900`, etc.
- Mobile-first media queries
- No build process - edit files directly
- Only external JS: Splide.js for carousels

**Dashboard (Next.js):**
- TypeScript with strict mode
- Tailwind utilities, minimal custom CSS
- Radix UI for accessible primitives
- Server components by default, 'use client' only when needed
- App Router conventions

**Database:**
- snake_case for tables and columns
- UUID primary keys (`gen_random_uuid()`)
- TIMESTAMPTZ for dates (not TIMESTAMP)
- Soft deletes where appropriate
- Always add indexes for foreign keys

**n8n Workflows:**
- Enable "Always Output Data" on Postgres nodes
- Use webhook-test URLs during development
- Log to `campaign_activity` table for observability
- Name end nodes clearly: "End - Success", "End - Skipped"

---

### Key Tables

| Table | Purpose |
|-------|---------|
| `contacts` | Master contact records |
| `multichannel_campaigns` | Campaign definitions |
| `campaign_contacts` | Contact journey through campaign |
| `campaign_activity` | Event log for all activity |
| `n8n_brain.patterns` | Successful workflow patterns |
| `n8n_brain.error_fixes` | Error→fix mappings |
| `n8n_brain.credentials` | Service→credential ID mapping |

---

### Active Projects

1. **Business OS** - Autonomous business command center
   - Departments: Marketing, Digital, Lead Intelligence, Programs
   - Workers: n8n monitors + Claude skills
   - Dashboard for health scores and approvals

2. **Alumni Reconnect Campaign** - Multi-channel outreach
   - Channels: LinkedIn (HeyReach), Email (Smartlead), Phone, GHL
   - 2,166 past participants
   - Branch routing: A (qualified), A+ (interested+), B (nurture), C (no contact)

3. **Lead Intelligence System** - Lead sourcing and quality
   - Sources: Apollo, LinkedIn (PhantomBuster), Apify
   - Validation: NeverBounce/ZeroBounce
   - Capacity planning for email sending

---

### Design Tokens (Website)

```css
/* Colors */
--blue-primary: #188bf6
--blue-dark: #28528c
--blue-darker: #222639
--red-accent: #e41e26
--gold-accent: #af9232

/* Grays */
--gray-50 through --gray-900

/* Typography */
--font-heading: 'Playfair Display', serif
--font-body: 'Lato', sans-serif

/* Spacing (8px base) */
--space-xs: 0.25rem (4px)
--space-sm: 0.5rem (8px)
--space-md: 1rem (16px)
--space-lg: 1.5rem (24px)
--space-xl: 2rem (32px)
```

---

[ADD TASK-SPECIFIC CONTEXT BELOW THIS LINE]

```

---

## Minimal Context Block

For quick tasks, use this shorter version:

```markdown
## Context
**Project:** IAML Business OS
**Stack:** [website: Vanilla HTML/CSS/JS | dashboard: Next.js + TypeScript + Tailwind]
**Database:** Supabase PostgreSQL

[TASK DETAILS]
```

---

## Per-Project Context Snippets

### Website Work
```markdown
**Project:** IAML Website (iaml.com)
**Tech:** Vanilla HTML5/CSS3/JS (ES6+) - NO frameworks
**CSS:** Add to `/website/css/main.css` (numbered files are reference only)
**Design system:** Uses CSS custom properties, 8px spacing scale
**Must:** Work without JavaScript, semantic HTML, ARIA labels
```

### Dashboard Work
```markdown
**Project:** IAML Dashboard
**Tech:** Next.js 16.1.1, React 19, TypeScript, Tailwind CSS
**Components:** Radix UI (Tabs, Tooltip, Progress), lucide-react icons
**Data:** Supabase client via `@supabase/ssr`
**Route:** App Router at `/dashboard/src/app/`
```

### n8n Workflow Work
```markdown
**Project:** n8n Workflow
**Instance:** n8n.realtyamp.ai
**Database:** Supabase PostgreSQL
**Learning layer:** n8n-brain MCP (patterns, credentials, error fixes)
**Critical:** Enable "Always Output Data" on all Postgres nodes
**Testing:** Use `/webhook-test/` URLs during development
```

### Database Work
```markdown
**Project:** Supabase Schema
**Conventions:** snake_case, UUID PKs, TIMESTAMPTZ for dates
**Migrations:** `/supabase/migrations/`
**Key schemas:** public (app data), n8n_brain (workflow learning)
```

---

## Copy-Paste Checklist

Before sending to Claude.AI:
- [ ] Context block included (full or minimal)
- [ ] Task clearly stated
- [ ] Output format specified
- [ ] File paths included if relevant
- [ ] What NOT to do specified (boundaries)
