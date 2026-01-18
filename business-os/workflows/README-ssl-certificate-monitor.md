# SSL Certificate Monitor

> **CEO Summary:** This workflow checks the SSL certificate expiration for www.iaml.com every day. If the certificate is expiring within 14 days, it sends alerts via Slack and email so we can renew before visitors see security warnings.

## Overview

```
Schedule (Daily)
       │
       ▼
 Check SSL Certificate (Node.js)
       │
       ▼
 Expiring Soon? (< 14 days)
       │
       ├── No ──► Certificate OK (log only)
       │
       └── Yes ──► Slack Alert
                   │
                   └── Email Alert
```

## Schedule

- **Runs:** Daily (every 24 hours)
- **Trigger:** Schedule

## What It Does

1. **Connects to www.iaml.com** via HTTPS
2. **Reads the SSL certificate** and extracts:
   - Issuer (certificate authority)
   - Valid from date
   - Valid to date (expiration)
3. **Calculates days until expiry**
4. **Alerts if ≤14 days remaining** via:
   - Slack notification
   - Email to mike.jackson@iaml.com

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Certificate expires in ≤14 days | Slack alert + email alert |
| Certificate expires in >14 days | No alert (silent success) |
| Cannot retrieve certificate | Error logged |

**Slack Alert Format:**
```
:warning: SSL Certificate Expiring Soon

Domain: www.iaml.com
Days Until Expiry: 12
Expiry Date: Feb 1, 2026 23:59:59 GMT
Issuer: Let's Encrypt

Please renew the certificate before it expires.
```

## Configuration

| Setting | Value |
|---------|-------|
| Domain monitored | www.iaml.com |
| Warning threshold | 14 days |
| Alert email | mike.jackson@iaml.com |

## Setup

### Prerequisites

1. **Slack webhook** configured at: `https://hooks.slack.com/services/T09D27N8KSP/...`
2. **SendGrid API key** for email alerts

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `ssl-certificate-monitor.json`
3. Workflow is self-contained (no database needed)
4. Activate the workflow

**n8n Workflow ID:** `rQPUHpLhXKVHi8NB`

## Monitoring

### Check workflow history

In n8n:
1. Go to Workflows → SSL Certificate Monitor
2. Click "Executions" tab
3. Review recent runs for success/failure

### Manual certificate check

```bash
# Check certificate expiration from command line
echo | openssl s_client -servername www.iaml.com -connect www.iaml.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Troubleshooting

### Not receiving alerts
1. Verify workflow is active in n8n
2. Check Slack webhook URL is valid
3. Check SendGrid API key hasn't expired

### Certificate check failing
1. Site may be temporarily down
2. DNS resolution issues
3. Check n8n execution history for error details

### False alarms
1. Certificate may have been renewed but cached data shows old expiry
2. Re-run workflow manually to refresh

## Response Playbook

When you receive an SSL expiration alert:

1. **Verify the alert** by checking the certificate manually
2. **Identify the certificate provider** (usually Vercel/Let's Encrypt)
3. **For Vercel-hosted sites:**
   - SSL is auto-renewed; check Vercel dashboard
   - If stuck, trigger re-deployment
4. **For manual certificates:**
   - Contact certificate provider
   - Renew and install new certificate
5. **After renewal:** Re-run workflow manually to confirm fix

## Related

- [Uptime Monitor](README.md#uptime-monitor) - Checks if site is accessible
- [Link Checker](README-link-checker.md) - Checks for broken links
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns website security
