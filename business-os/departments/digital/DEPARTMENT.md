# Digital Department

## Director Role

**Digital Director** oversees all website development, deployment, performance optimization, and technical operations. The Director maintains awareness of site health, deployment status, performance metrics, and can answer "How's the website doing?" at any time.

## Domain Scope

**Owns:**
- Website development and maintenance
- Program page creation and updates
- Frontend performance optimization
- Deployment and hosting (Vercel)
- QA testing and visual regression
- API proxy management
- Technical SEO implementation
- Site monitoring and uptime

**Does Not Own:**
- Content strategy and copywriting (→ Content/Marketing)
- Email campaign sending (→ Marketing)
- Lead capture form logic (→ Lead Intelligence)
- Payment processing business logic (→ Finance)
- Brand voice and messaging (→ Marketing)

---

## Employees (Claude Code)

Interactive roles you can invoke via commands.

| Employee | Role | Commands |
|----------|------|----------|
| WebDev Specialist | Build and update program pages, implement features | `/new-program`, `/component-variants`, `/deep-plan-ui` |
| QA Specialist | Test sites, verify deployments, run audits | `/smoke`, `/fullqa`, `/a11y`, `/responsive`, `/links` |
| DevOps Specialist | Deploy, monitor, optimize infrastructure | `/deploy`, `/preview`, `/speed-optimize` |
| Content Specialist | Optimize content for SEO and brand voice | `/seo-optimize`, `/brand-upgrade`, `/brochure` |

---

## Workers (Automated)

Background monitors and agents that run via n8n or scheduled tasks.

### Website Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Uptime Monitor | Monitor | Site availability, response times | Every 5 min |
| Link Checker | Monitor | Broken links, 404 errors | Daily |
| SSL Certificate Monitor | Monitor | Certificate expiration | Daily |
| Form Submission Monitor | Monitor | Registration form health | Hourly |

### Performance Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Lighthouse Auditor | Monitor | Core Web Vitals, performance scores | Daily |
| Page Speed Monitor | Monitor | Load times across key pages | Every 4 hours |
| Image Optimization Checker | Monitor | Unoptimized images, new uploads | On deploy |
| Bundle Size Tracker | Monitor | JS/CSS size changes | On deploy |

### SEO Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Sitemap Validator | Monitor | Sitemap accuracy, new pages | Daily |
| Meta Tag Auditor | Monitor | Missing/duplicate meta tags | Weekly |
| Schema Validator | Monitor | Structured data validity | Weekly |
| Indexability Checker | Monitor | Robots.txt, canonical issues | Daily |

---

## Key Integrations

| Tool | Purpose | Data Flow |
|------|---------|-----------|
| Vercel | Hosting, serverless functions, CDN | Out (deploys), In (logs) |
| Airtable | Program data, sessions, faculty | In (content) |
| Stripe | Payment processing | In/Out (webhooks) |
| GoHighLevel | CRM webhook integration | Out (leads) |
| Google Analytics 4 | User behavior tracking | In (metrics) |
| Supabase | Content insights storage | In/Out |
| NeverBounce | Email verification for forms | Out (verify) |
| Playwright | Automated testing | Internal |

---

## Decision Authority

### Autonomous (No Approval Needed)
- Routine monitoring and health checks
- Preview deployments for review
- Running QA tests and audits
- Performance optimizations (image compression, caching)
- Bug fixes with no user-facing changes

### Recommend + Approve
- Production deployments
- New program page launches
- UI/UX changes to existing pages
- New feature implementations
- API endpoint changes
- Third-party integration updates

### Escalate Immediately
- Site down or critical errors
- Payment flow broken
- Security vulnerabilities discovered
- SSL certificate issues
- Major deployment failures
- Data breach concerns

---

## Health Score Components

| Component | Weight | Measurement |
|-----------|--------|-------------|
| Uptime | 0.25 | % availability over 30 days (target: 99.9%) |
| Performance | 0.20 | Avg Lighthouse score across key pages |
| Deployment Health | 0.15 | Successful deployments vs failures |
| Test Coverage | 0.15 | QA test pass rate |
| SEO Health | 0.10 | Core Web Vitals + indexability |
| Security | 0.10 | No vulnerabilities, valid SSL |
| No Critical Blockers | 0.05 | Binary: 100 if no critical alerts, 0 if any |

---

## Learning Objectives

What Digital Department should get better at over time:

1. **Performance Patterns** — Learn which optimizations have biggest impact on load times
2. **User Flow Analysis** — Identify where users drop off in registration flow
3. **Content Effectiveness** — Track which page layouts drive most conversions
4. **Test Coverage Gaps** — Identify areas with frequent bugs that need more testing
5. **Deployment Timing** — Learn optimal deployment windows for minimal disruption
6. **SEO Patterns** — Understand which technical SEO changes improve rankings

---

## Cross-Department Coordination

| Scenario | Coordinates With | How |
|----------|------------------|-----|
| Content updates needed | Marketing/Content | Receive content, implement changes |
| New lead capture requirements | Lead Intelligence | Implement form changes, pass data |
| Email template embeds | Marketing | Provide hosted asset URLs |
| Campaign landing pages | Marketing | Build and deploy, measure conversions |
| Payment issues | Finance | Debug, fix, coordinate with Stripe |
| New program launch | All | Orchestrate technical launch |

---

## Knowledge Base References

The Digital Department draws on these knowledge resources:

- `website/STYLE-GUIDE.md` — Design system, button styles, typography
- `website/.claude/CLAUDE.md` — Developer guidelines for Claude Code
- `website/.claude/ARCHITECTURE.md` — Codebase structure
- `website/docs/PROGRAM_PAGE_SETUP.md` — Program page creation guide
- `website/VERCEL_DEPLOYMENT.md` — Deployment procedures
- `website/README-DEV.md` — Local development setup
- `website/ENV_SETUP.md` — Environment configuration

---

## Tech Stack Reference

### Frontend
- **HTML5** — Semantic, accessible markup
- **CSS3** — Pure CSS, no preprocessors (14,961 lines in main.css)
- **Vanilla JavaScript (ES6+)** — No frameworks
- **Splide.js** — Only external library (carousels)

### Backend
- **Vercel Serverless Functions** — 16 API endpoints
- **Node.js** — Server-side scripts

### Data
- **Airtable** — CMS for programs, sessions, faculty
- **Supabase** — Analytics and insights storage
- **JSON** — Program page data files

### Testing
- **Playwright** — E2E and visual regression
- **Puppeteer** — Browser automation
- **Semgrep** — Security scanning

### CI/CD
- **Vercel** — Automatic deployments from Git
- **GitHub** — Source control
- **Pre-commit hooks** — CSS audit
