# Program Planning Sub-Department

## Focus

Program Planning owns the master calendar, scheduling optimization, and registration page coordination. This sub-department ensures programs are scheduled without conflicts, that all program instances are tracked against the readiness checklist, and that website listings are accurate and live.

## Key Responsibilities

- **Master Calendar Management** — Maintain the 90-day and annual program calendar
- **Scheduling Optimization** — Avoid conflicts with holidays, SHRM conferences, competing events
- **Readiness Tracking** — Monitor all program instances against the 10-point readiness checklist
- **Registration Page Coordination** — Ensure website listings are live, accurate, and functional
- **Enrollment Monitoring** — Track enrollment vs. minimums and flag at-risk programs
- **Capacity Planning** — Balance program frequency with market demand

## Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Programs with Readiness ≥80% | ≥90% | % of programs in next 90 days |
| Registration Pages Live | 100% | All scheduled programs have active pages |
| Enrollment at T-30 | ≥60% | Avg enrollment % at 30 days out |
| Schedule Conflicts | 0 | Programs overlapping with major events |

## Decision Authority

**Autonomous:**
- Updating readiness checklist statuses
- Generating readiness reports
- Flagging enrollment alerts
- Verifying registration page status

**Recommend + Approve:**
- Program scheduling changes
- New program additions
- Program postponement recommendations
- Capacity adjustments

## Workers

| Worker | Type | Purpose |
|--------|------|---------|
| Readiness Monitor | Monitor | Track all programs' readiness scores continuously |
| Schedule Optimizer | Hybrid | Flag and prevent scheduling conflicts |
| Registration Page Monitor | Monitor | Verify website listings are live and accurate |
| Enrollment Alert | Monitor | Flag programs with low enrollment |

## Integration Points

| System | Purpose |
|--------|---------|
| Supabase | Program instances, readiness data |
| Website/Vercel | Registration page status |
| Airtable | Legacy program data |
| Google Calendar | Schedule visualization |

## Handoffs

| From | To | Trigger |
|------|----|---------|
| Marketing | Program Planning | New program instance created |
| Program Planning | Faculty Management | Program scheduled, needs faculty |
| Program Planning | Marketing | Low enrollment alert, need promotion |
| Program Planning | Digital | Registration page needs update |
