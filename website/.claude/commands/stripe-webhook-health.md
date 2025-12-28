# Stripe Webhook Health Command

Check webhook delivery status and health over the last 24 hours.

## Objective

Monitor Stripe webhook health to catch delivery issues before they impact registrations.

## Configuration

- **Time Range**: Last 24 hours (default)
- **Mode**: Both test and live (read-only health check)
- **Output**: Delivery stats, failures, recommendations

---

## Execution Steps

### Phase 1: Get Webhook Endpoints

Using Stripe MCP:

1. List all webhook endpoints
2. Get endpoint status and configuration
3. Identify active endpoints

### Phase 2: Get Event Delivery Stats

For each endpoint, retrieve:

1. **Delivery summary**: Total sent, succeeded, failed
2. **Failure details**: Error types, affected events
3. **Pending retries**: Events awaiting retry

### Phase 3: Analyze Patterns

Look for:

1. **Consistent failures**: Same endpoint failing repeatedly
2. **Event type issues**: Specific events failing more than others
3. **Time patterns**: Failures clustered at specific times
4. **Error trends**: Increasing failure rate

### Phase 4: Generate Report

```
# Stripe Webhook Health Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Time Range**: Last 24 hours

---

## Webhook Endpoints

| Endpoint | Status | Success Rate | Events (24h) |
|----------|--------|--------------|--------------|
| https://iaml.vercel.app/api/stripe-webhook | enabled | 98.5% | 67 |

---

## Overall Health: HEALTHY / WARNING / CRITICAL

**Summary**:
- Total events: 67
- Delivered: 66 (98.5%)
- Failed: 1 (1.5%)
- Pending retry: 0

---

## Event Delivery by Type

| Event Type | Sent | Delivered | Failed | Success Rate |
|------------|------|-----------|--------|--------------|
| payment_intent.created | 18 | 18 | 0 | 100% |
| payment_intent.succeeded | 15 | 15 | 0 | 100% |
| payment_intent.payment_failed | 2 | 2 | 0 | 100% |
| charge.succeeded | 15 | 15 | 0 | 100% |
| customer.created | 12 | 11 | 1 | 91.7% |
| checkout.session.completed | 5 | 5 | 0 | 100% |

---

## Failed Deliveries (1)

### 1. customer.created - Failed
- **Event ID**: evt_xxxxxxxx
- **Time**: 2025-12-18 10:23:45 UTC
- **Endpoint**: https://iaml.vercel.app/api/stripe-webhook
- **HTTP Status**: 500
- **Error**: Internal Server Error
- **Response Body**: `{"error": "Database connection failed"}`
- **Next Retry**: 2025-12-18 11:23:45 UTC

---

## Pending Retries (0)

No events awaiting retry.

---

## Failure Analysis

### By Error Type
| Error | Count | % of Failures |
|-------|-------|---------------|
| 500 Internal Server Error | 1 | 100% |

### By Time of Day
| Hour (UTC) | Failures |
|------------|----------|
| 10:00-11:00 | 1 |

### Pattern Analysis
- No consistent failure pattern detected
- Single isolated failure at 10:23 UTC
- Likely transient database issue

---

## Health Status

### Current: HEALTHY

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Success Rate | 98.5% | >= 95% | PASS |
| Failed (24h) | 1 | <= 5 | PASS |
| Pending | 0 | <= 3 | PASS |
| Endpoint Status | enabled | enabled | PASS |

### Thresholds
- **HEALTHY**: >= 99% success rate, <= 2 failures
- **WARNING**: 95-99% success rate, 3-5 failures
- **CRITICAL**: < 95% success rate, > 5 failures

---

## Recommendations

### Immediate Actions
None required - webhook health is good.

### Monitoring
1. Continue monitoring for the isolated 500 error
2. Check Vercel function logs around 10:23 UTC if investigating

### Best Practices
1. Ensure idempotent webhook handling (for retries)
2. Log all webhook receipts for debugging
3. Set up alerting for high failure rates

---

## Quick Troubleshooting

If failures increase:
1. Check Vercel function logs: `/vercel-logs-latest`
2. Verify webhook signing secret is correct
3. Test endpoint manually: `stripe trigger payment_intent.created`
4. Check Stripe Dashboard for event details

---

## Historical Comparison

| Period | Events | Success Rate | Trend |
|--------|--------|--------------|-------|
| Today | 67 | 98.5% | - |
| Yesterday | 45 | 100% | ↓ 1.5% |
| Last 7 days | 312 | 99.4% | - |
```

---

## Output Format

Display summary inline:

Healthy:
```
Stripe Webhook Health: HEALTHY
==============================
Time Range: Last 24 hours

Endpoint: https://iaml.vercel.app/api/stripe-webhook
Status: enabled
Events: 67 sent, 66 delivered (98.5%)
Failed: 1 (customer.created at 10:23 UTC)
Pending: 0

Health: HEALTHY (meets all thresholds)
```

Warning:
```
Stripe Webhook Health: WARNING
==============================
Time Range: Last 24 hours

Endpoint: https://iaml.vercel.app/api/stripe-webhook
Status: enabled
Events: 100 sent, 96 delivered (96%)
Failed: 4
Pending: 2

Issues:
- 4 failures in last 24h (threshold: <= 5)
- 3 payment_intent.succeeded events failed

Action: Review Vercel function logs
```

Critical:
```
Stripe Webhook Health: CRITICAL
===============================
Time Range: Last 24 hours

Endpoint: https://iaml.vercel.app/api/stripe-webhook
Status: enabled
Events: 50 sent, 40 delivered (80%)
Failed: 10
Pending: 5

CRITICAL: Success rate below 95%!

Top Failures:
- 500 Internal Server Error (8)
- 504 Gateway Timeout (2)

Immediate Action Required:
1. Check Vercel function logs
2. Verify database connectivity
3. Check API rate limits
```

---

## Integration with Daily Checks

This command is part of the daily prod health workflow:

```yaml
# In daily-prod-health.yml
- name: Check Stripe webhook health
  run: |
    # Command checks webhook health
    # Fails workflow if CRITICAL status
```

---

## Notes

- Read-only operation, does not modify webhooks
- Works for both test and live mode endpoints
- Historical data may be limited by Stripe plan
- Consider setting up Stripe's built-in webhook alerting
