# Venue & Logistics Sub-Department

## Focus

Venue & Logistics owns all physical program delivery infrastructure—venue selection, contracting, room blocks, AV equipment, and catering. This sub-department ensures every in-person program has a confirmed venue with all logistics coordinated.

## Key Responsibilities

- **Venue Selection** — Identify and recommend venues based on location, capacity, cost
- **Contract Management** — Track venue contracts, deposits, cancellation terms
- **Room Block Management** — Monitor room pickup rates, manage attrition risk
- **AV Coordination** — Order and track equipment from Amazon, coordinate with venues
- **Catering Management** — Coordinate meal breaks, special dietary needs
- **On-Site Logistics** — Ensure meeting room setup, signage, materials placement

## Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Venues Confirmed at T-90 | 100% | All programs have signed contracts |
| Room Block Pickup | ≥80% | Pickup rate at attrition date |
| AV Ordered by T-14 | 100% | Equipment ordered on time |
| Catering Confirmed by T-7 | 100% | Final counts submitted |

## Decision Authority

**Autonomous:**
- Tracking venue contract status
- Monitoring room block pickups
- Logging AV order status
- Generating logistics reports

**Recommend + Approve:**
- Venue changes after contract
- Room block adjustments (release/increase)
- Budget exceptions for venues
- Catering count changes (>±20%)

## Workers

| Worker | Type | Purpose |
|--------|------|---------|
| Room Block Monitor | Monitor | Track pickup rates, alert on attrition risk |
| Venue Contract Tracker | Monitor | Track contract status and deadlines |
| AV Order Tracker | Monitor | Track Amazon orders and delivery |
| Catering Coordinator | Hybrid | Confirm catering counts before programs |

## Room Block Financial Risk

Hotels charge attrition penalties when room blocks aren't picked up:

| Pickup Rate | Typical Penalty |
|-------------|-----------------|
| ≥80% | No penalty |
| 70-79% | 50% of unsold room nights |
| 60-69% | 75% of unsold room nights |
| <60% | 100% of unsold room nights |

**Attrition Management:**
1. Monitor pickup weekly starting T-60
2. Alert at 50% pickup with <14 days to attrition
3. Consider releasing rooms if trend won't improve
4. Balance marketing push vs. releasing rooms

## Integration Points

| System | Purpose |
|--------|---------|
| Supabase | Venue contracts, room blocks, logistics |
| Google Sheets | Hotel pickup reports |
| Amazon | AV equipment orders |
| Email | Venue communications |

## Venue Partners

| Chain | Properties | Typical Rate | Notes |
|-------|------------|--------------|-------|
| Marriott | JW, Renaissance, Sheraton | $180-280/night | M&C preferred rates |
| Hilton | Conrad, DoubleTree, Embassy | $160-250/night | Good meeting space |
| Caesars | Flamingo, Harrah's, Paris | $140-200/night | Vegas only |
| Hyatt | Regency, Grand | $175-275/night | West coast |

## Handoffs

| From | To | Trigger |
|------|----|---------|
| Program Planning | Venue & Logistics | Program scheduled, need venue |
| Venue & Logistics | Finance | Contract ready for signature |
| Venue & Logistics | Program Planning | Venue issue affecting program |
| Venue & Logistics | Participant Ops | Room block code for communications |
