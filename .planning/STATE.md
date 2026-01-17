# IAML Business OS - Current State

> Last Updated: 2026-01-17

## Current Focus

**Phase 2**: Marketing & Lead Intelligence Workers

## Active Work

None currently in progress.

## Recent Decisions

1. **2026-01-17**: Added GSD and Ralph tools for build efficiency
   - GSD for structured planning and context management
   - Ralph for autonomous worker deployment loops

2. **2026-01-16**: Completed Quarterly Employment Law Updates program page
   - Live at /programs/quarterly-employment-law-updates.html

3. **2026-01-15**: Updated Stripe to live mode IDs
   - All payment links now use production credentials

## Blockers

None currently.

## Questions to Resolve

1. Should A/B Test Manager auto-pause variants or just alert?
2. What statistical significance threshold for A/B tests? (95%? 90%?)
3. Lead scoring weights - need to define engagement factors

## Session Memory

### n8n-brain Patterns Available
- HeyReach activity receiver
- Smartlead activity receiver
- Company enrichment waterfall
- Branch C scheduler

### Credentials Mapped
Check n8n-brain for current credential mappings:
- Supabase (postgres)
- GHL (httpHeaderAuth)
- And others...

## Next Steps

1. Use `/gsd:plan-phase 2` to plan Phase 2 workers
2. Or use Ralph with prd.json to autonomously build workers
3. Store successful patterns in n8n-brain after each deployment

## Handoff Notes

When resuming work:
1. Check this file for current state
2. Review ROADMAP.md for phase status
3. Use n8n-brain's `find_similar_patterns()` before building new workflows
4. Update this file after completing work
