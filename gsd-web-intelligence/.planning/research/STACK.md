# Technology Stack Recommendations

## Overview

This document outlines the technology choices for the Web Intelligence Department, prioritizing integration with existing Business OS infrastructure.

---

## Data Collection Layer

### GA4 Integration

**Recommended:** GA4 Data API (REST) via n8n HTTP Request node

**Rationale:**
- Direct API access gives full control over data dimensions and metrics
- GA4 MCP may be available but REST API is more reliable for scheduled workflows
- Better error handling and retry control

**Alternative Considered:** GA4 MCP
- Pro: Simpler initial setup
- Con: Less control, dependency on MCP availability

**Implementation Notes:**
- Use service account authentication (JSON key file)
- Batch requests for multiple date ranges
- Cache property/stream IDs to reduce API calls

### DataForSEO Integration

**Recommended:** DataForSEO API via n8n HTTP Request node

**Rationale:**
- Comprehensive SERP data, competitor tracking, and backlink analysis
- Better pricing than SEMrush/Ahrefs APIs
- Good documentation and support

**API Endpoints to Use:**
| Endpoint | Purpose | Workflows |
|----------|---------|-----------|
| SERP API | Ranking data | RNK-01, CMP-01 |
| Keyword Data API | Search volume | RNK-07 |
| Backlinks API | Link analysis | CMP-03 |
| Domain Analytics | Competitor metrics | CMP-04 |

**Rate Limit Strategy:**
- Implement request queuing in n8n
- Use batch endpoints where available
- Cache results for 24 hours

### Google Search Console Integration

**Recommended:** GSC API via n8n HTTP Request node with OAuth2

**Rationale:**
- Only official source for index coverage and CWV data
- Required for search performance data at query level
- Free API with generous limits

**Authentication:**
- OAuth2 with refresh token (store in n8n credentials)
- Or service account with domain-wide delegation

---

## Data Storage Layer

### Supabase PostgreSQL

**Recommended:** Continue using existing Supabase instance

**Schema Design:**
- Create dedicated `web_intel` schema
- Use proper indexing for time-series queries
- Implement table partitioning for large tables (daily_rankings, search_performance)

**Table Partitioning Strategy:**
```sql
-- For high-volume tables, partition by month
CREATE TABLE web_intel.daily_rankings (
    ...
) PARTITION BY RANGE (collected_date);
```

**Retention Policy:**
| Data Type | Hot Storage | Archive After |
|-----------|-------------|---------------|
| Daily traffic | 90 days | 90 days |
| Rankings | 90 days | 90 days |
| Search performance | 16 months | Never (GSC limit) |
| Alerts | 1 year | 1 year |
| Reports | Forever | Never |

---

## Processing Layer

### n8n Workflow Engine

**Recommended:** Continue using n8n.realtyamp.ai

**Workflow Patterns:**
1. **Collector Pattern** - Fetch data, transform, store
2. **Detector Pattern** - Query stored data, apply rules, generate alerts
3. **Notifier Pattern** - Receive webhook, format message, send to Slack
4. **Reporter Pattern** - Query data, generate document, deliver

**Error Handling Standard:**
```
[Try Block]
  └── [Main Logic]
  └── [Error Handler]
        └── Log to n8n-brain
        └── Send Slack alert
        └── Mark workflow as failed
```

**Scheduling Considerations:**
- Stagger workflows to avoid API burst limits
- Use n8n's built-in retry for transient failures
- Implement circuit breaker for persistent failures

---

## AI Layer

### Claude API

**Recommended:** Claude claude-sonnet-4-5-20250929 via Anthropic API

**Use Cases:**
| Task | Model | Max Tokens | Notes |
|------|-------|------------|-------|
| Daily insights | Sonnet | 1000 | Speed matters |
| Weekly analysis | Sonnet | 2000 | Balance depth/cost |
| Anomaly explanation | Sonnet | 500 | Quick turnaround |
| Content recommendations | Sonnet | 2000 | Detailed suggestions |

**Prompt Engineering:**
- Use structured output (JSON) for programmatic use
- Include business context in system prompt
- Provide data in consistent format

**Cost Management:**
- Batch insights generation (don't call per-page)
- Cache recent insights
- Set max token limits

---

## Alerting Layer

### Slack Integration

**Recommended:** Slack Incoming Webhooks

**Channel Strategy:**
| Channel | Purpose | Alert Types |
|---------|---------|-------------|
| #web-intel-critical | Immediate attention | Traffic drops >30%, ranking losses >10 |
| #web-intel-alerts | Daily monitoring | All anomalies, index errors |
| #web-intel-reports | Scheduled reports | Weekly, monthly reports |

**Message Formatting:**
- Use Block Kit for rich formatting
- Include action buttons where appropriate
- Limit message frequency (batch when possible)

---

## n8n-brain Integration

### Credential Management

Register all credentials on project setup:
```javascript
// Example registration
register_credential({
  service_name: 'ga4',
  credential_id: 'xxx',
  credential_type: 'serviceAccount',
  notes: 'GA4 Data API - Web Intelligence'
})
```

### Pattern Storage

Store successful patterns for reuse:
- Collector workflow pattern
- Anomaly detection pattern
- Alert notification pattern
- Report generation pattern

### Error Learning

Capture and learn from errors:
- API rate limit errors
- Authentication failures
- Data validation errors
- Timeout handling

---

## Not Recommended

### Alternatives Evaluated and Rejected

| Tool | Reason for Rejection |
|------|---------------------|
| SEMrush API | Higher cost, less flexible |
| Ahrefs API | Very expensive, overkill for needs |
| Custom Python scripts | Adds maintenance burden, n8n handles this |
| Separate database | Unnecessary complexity, Supabase sufficient |
| Real-time streaming | Overkill, daily data sufficient |

---

## Decision Log

| Decision | Date | Rationale |
|----------|------|-----------|
| DataForSEO over SEMrush | 2026-01-20 | Better pricing, sufficient features |
| Supabase over dedicated DB | 2026-01-20 | Leverage existing infrastructure |
| n8n over custom backend | 2026-01-20 | Consistent with Business OS |
| Claude Sonnet for insights | 2026-01-20 | Balance of quality and cost |

---
*Last updated: 2026-01-20*
