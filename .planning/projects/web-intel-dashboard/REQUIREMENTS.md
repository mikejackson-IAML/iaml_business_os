# Requirements: Web Intel Dashboard

**Core Value:** See website health and SEO performance at a glance without logging into multiple tools.

## Shipped Requirements

### v1.0 MVP (39 requirements — shipped 2026-01-25)

All v1.0 requirements have been satisfied and archived.

**Full details:** `milestones/v1.0-REQUIREMENTS.md`

**Summary:**
- Foundation: 4 requirements
- Traffic: 6 requirements
- Rankings: 6 requirements
- Core Web Vitals: 5 requirements
- GSC: 5 requirements
- Alerts: 5 requirements
- Content: 3 requirements
- Competitors: 3 requirements
- AI Recommendations: 3 requirements

## Active Requirements

(None — planning next milestone)

## v2 Candidates

### Advanced Analytics

- **ADV-01**: Historical trend charts with interactive zoom
- **ADV-02**: Custom date range picker (beyond presets)
- **ADV-03**: Export data to CSV
- **ADV-04**: Email report scheduling

### Enhanced Rankings

- **RANK-07**: Competitor ranking overlay on sparklines
- **RANK-08**: Keyword grouping/tagging
- **RANK-09**: Position distribution chart

### Advanced Content

- **CONT-04**: Content gap analysis display
- **CONT-05**: Internal linking visualization

## Out of Scope

| Feature | Reason |
|---------|--------|
| Data editing | Dashboard is read-only; data management via direct Supabase or workflows |
| SEO audit tools | Workflows handle auditing; dashboard only displays results |
| Direct API connections | All data flows through n8n workflows to Supabase |
| Custom report builder | Fixed layouts; complexity not justified |
| Real-time updates | Daily workflow runs are sufficient |

---
*Last updated: 2026-01-25 after v1.0 milestone*
