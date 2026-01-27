# Phase 2 Context

## Decisions from Discussion

| Question | Answer |
|----------|--------|
| GSC API Access | Already set up, credentials ready |
| Content Decay Threshold | 20% traffic drop over 3 months |

## Implications for Planning

### GSC Integration
- Use existing OAuth/service account credentials
- Register in n8n-brain like other credentials
- GSC API endpoints: Search Analytics, URL Inspection, Sitemaps

### Content Decay Detection
- 20% threshold is more aggressive than typical 30%
- Compare current 30-day traffic to same period 3 months ago
- Flag pages that were getting meaningful traffic (>50 sessions/month)

### Additional Tables Needed
- `web_intel.index_coverage` - GSC index status
- `web_intel.core_web_vitals` - CWV metrics
- `web_intel.search_performance` - GSC search data
- `web_intel.content_inventory` - All site pages

---
*Created: 2026-01-20*
