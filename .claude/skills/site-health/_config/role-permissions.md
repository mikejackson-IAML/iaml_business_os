# Role Permissions Matrix

## Skill Access by Role Level

| Role Level | Can Execute | Reports Received | Alert Level |
|------------|-------------|------------------|-------------|
| Specialist | Own domain skills only | Own audits | All issues |
| Manager | All specialist skills in domain | Manager summaries + specialist details | High+ issues |
| Director | All manager skills | Director briefs + on-demand manager reports | Critical issues |
| Executive | Director/Executive skills | Executive dashboards | Critical only |

## Data Detail Levels

### Specialist Level
- Full technical details
- Raw metric values
- Specific element references
- Code-level recommendations
- All issues regardless of severity

### Manager Level
- Aggregated metrics with trends
- Issue counts by severity
- Top 10 issues prioritized
- Resource estimation for fixes
- Team assignment recommendations

### Director Level
- Score summaries with WoW/MoM trends
- Strategic issue groupings
- Cross-functional dependencies
- Investment/resource needs
- Competitive context

### Executive Level
- Business impact translation
- Red/Yellow/Green status
- 3-5 bullet point summary
- Risk/Opportunity assessment
- Decision recommendations

## Escalation Rules

### Auto-Escalate to Manager
- Any Critical severity issue
- High severity issues > 24 hours old
- Score drops > 10 points

### Auto-Escalate to Director
- Multiple Critical issues
- Critical issues > 48 hours old
- Score drops > 20 points
- Cross-functional blocking issues

### Auto-Escalate to Executive
- Business-impacting Critical issues
- Security breaches/vulnerabilities
- Google manual actions
- Compliance/legal risks
- Major ranking/traffic drops
