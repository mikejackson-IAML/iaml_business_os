# Phase 1 Context

## Decisions from Discussion

| Question | Answer |
|----------|--------|
| GA4 Property | IAML main website (single property) |
| DataForSEO | Account already set up, credentials ready |
| Keyword Scope | Medium (200-500 keywords) |
| Slack Alerts | Create new #web-intel channel |

## Implications for Planning

### GA4 Integration
- Single property simplifies setup
- Use service account authentication
- Query dimensions: date, page, source/medium, country

### DataForSEO Integration
- Register credentials in n8n-brain
- Plan for 200-500 keyword checks daily
- Budget API credits accordingly

### Keyword Strategy
- Start with core brand keywords
- Add all program page keywords
- Include competitor brand terms
- Add top organic keywords from GSC (Phase 2)

### Slack Configuration
- Create #web-intel channel before workflow deployment
- All Phase 1 alerts go to this channel
- Consider severity-based threading later

## Technical Prerequisites

Before executing Phase 1:
1. [ ] GA4 service account JSON key available
2. [ ] DataForSEO API credentials available
3. [ ] Slack #web-intel channel created
4. [ ] Supabase connection verified

---
*Created: 2026-01-20*
