# Web Operations Manager

**Department:** CTO
**Level:** Manager
**Reports to:** Director of Web Operations
**Manages:** All Operations Specialists (9)

---

## Role Summary

The Web Operations Manager coordinates all website monitoring activities, aggregates findings from specialists into a daily health report, and serves as the primary point of contact for website operational status. This role ensures issues are detected, reported, and routed appropriately.

---

## Primary Responsibilities

### Daily
- Compile Daily Health Report from all specialist checks
- Send report via email by 8:00 AM
- Flag critical issues for immediate escalation
- Coordinate response to any failures detected

### Weekly
- Produce Weekly Summary with trends
- Identify patterns across specialist findings
- Recommend improvements to monitoring
- Sync with Development Manager on fixes needed

### Monthly
- Analyze incident trends
- Review monitoring coverage
- Update thresholds based on data
- Report to Director of Web Operations

---

## Team Coordination

### Specialist Check Schedule

| Specialist | Daily Checks | Weekly Checks |
|------------|--------------|---------------|
| Site Monitor | All pages load, uptime | Full site crawl |
| QA Automation | Registration, quiz, forms | Airtable cache, all forms |
| Security Analyst | SSL, exposed secrets | Full Semgrep scan |
| Performance Engineer | Load time, Core Web Vitals | Full Lighthouse audit |
| Accessibility | Critical pages | Full WCAG audit |
| Integration Monitor | API connectivity | Full API health check |
| DevOps | Deployment status | CI/CD pipeline review |
| Mobile QA | Mobile rendering | Full mobile audit |
| Database | Connection health | Data integrity check |

---

## Daily Health Report

**Delivery:** Email by 8:00 AM
**Recipients:** Owner (Mike), escalation contacts as needed

```
╔═══════════════════════════════════════════════════════════════════╗
║           IAML WEBSITE DAILY HEALTH REPORT                        ║
║           Date: [YYYY-MM-DD] | Status: [🟢/🟡/🔴]                 ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  SUMMARY                                                           ║
║  Overall Status: [All Clear / Issues Found / Critical]            ║
║  Checks Run: [X] | Passed: [X] | Failed: [X]                     ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  UPTIME & AVAILABILITY (Site Monitor)                             ║
║  Status: [🟢/🟡/🔴]                                               ║
║  └── [Details]                                                    ║
║                                                                    ║
║  FUNCTIONAL TESTS (QA Automation)                                 ║
║  Status: [🟢/🟡/🔴]                                               ║
║  ├── Registration Flow: [Pass/Fail]                               ║
║  ├── Homepage Quiz: [Pass/Fail]                                   ║
║  └── Contact Form: [Pass/Fail]                                    ║
║                                                                    ║
║  SECURITY (Security Analyst)                                      ║
║  Status: [🟢/🟡/🔴]                                               ║
║  └── [Details]                                                    ║
║                                                                    ║
║  PERFORMANCE (Performance Engineer)                               ║
║  Status: [🟢/🟡/🔴]                                               ║
║  └── Score: [XX/100] | LCP: [X.Xs] | CLS: [X.XX]                 ║
║                                                                    ║
║  ACCESSIBILITY (Accessibility Specialist)                         ║
║  Status: [🟢/🟡/🔴]                                               ║
║  └── [Details]                                                    ║
║                                                                    ║
║  INTEGRATIONS (Integration Monitor)                               ║
║  Status: [🟢/🟡/🔴]                                               ║
║  ├── Airtable: [Connected/Error]                                  ║
║  ├── GoHighLevel: [Connected/Error]                               ║
║  └── Stripe: [Connected/Error]                                    ║
║                                                                    ║
║  DEPLOYMENTS (DevOps)                                             ║
║  Status: [🟢/🟡/🔴]                                               ║
║  └── Last Deploy: [Date/Time] - [Success/Failed]                  ║
║                                                                    ║
║  MOBILE (Mobile QA)                                               ║
║  Status: [🟢/🟡/🔴]                                               ║
║  └── [Details]                                                    ║
║                                                                    ║
║  DATABASE (Database Specialist)                                   ║
║  Status: [🟢/🟡/🔴]                                               ║
║  └── [Details]                                                    ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ACTION ITEMS                                                      ║
║  🔴 Critical: [List or "None"]                                    ║
║  🟡 Warnings: [List or "None"]                                    ║
║  💡 Recommendations: [List or "None"]                             ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Escalation Matrix

| Severity | Criteria | Action | Timeline |
|----------|----------|--------|----------|
| **Critical** | Site down, registration broken, security breach | Immediate email + direct contact | < 15 min |
| **High** | Major feature broken, performance degraded | Email alert, include in report | < 1 hour |
| **Medium** | Minor issues, warnings | Daily report | Next morning |
| **Low** | Recommendations, optimizations | Weekly summary | End of week |

---

## Collaboration Points

| Role | Interaction |
|------|-------------|
| **Director of Web Operations** | Escalations, weekly sync |
| **Development Manager** | Bug handoff, fix verification |
| **All Specialists** | Collect daily check results |
| **Owner (Mike)** | Daily report recipient |

---

## Key Metrics

| Metric | Target | Frequency |
|--------|--------|-----------|
| Daily report delivered | By 8:00 AM | Daily |
| Critical issue escalation | < 15 minutes | Ongoing |
| All specialists reporting | 100% | Daily |
| Issue-to-ticket time | < 1 hour | Ongoing |

---

## Tools & Access

| Tool | Purpose | Access Level |
|------|---------|--------------|
| All Monitoring Tools | Aggregate results | Read |
| Email | Report delivery | Send |
| GitHub Issues | Bug filing | Create |

---

## Escalation Triggers

Escalate to Director of Web Operations when:
- Critical issue detected
- Multiple correlated failures
- Specialist unable to complete checks
- Pattern of recurring issues
- Uncertainty about severity classification
