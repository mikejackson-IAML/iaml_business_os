# Materials Sub-Department

## Focus

Materials owns the production and delivery of all printed program materials—workbooks, handouts, certificates, and supplementary documents. This sub-department coordinates with faculty for content updates, manages print vendor relationships, and ensures materials arrive at venues on time.

## Key Responsibilities

- **Content Coordination** — Track faculty materials submissions and updates
- **Print Ordering** — Submit print jobs with correct specifications
- **Delivery Tracking** — Monitor shipment status and delivery confirmation
- **Inventory Management** — Track standard materials inventory
- **Quality Control** — Verify print quality and accuracy
- **Emergency Response** — Handle rush orders and shipping issues

## Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Materials Ordered by T-21 | 100% | Print jobs submitted on time |
| Materials Received by T-7 | 100% | Confirmed delivery before program |
| Faculty Content Received | T-30 | All materials from faculty on time |
| Print Quality Issues | <2% | Programs with material problems |

## Materials Timeline

| Days Before | Milestone | Action |
|-------------|-----------|--------|
| T-45 | Faculty materials request | Send request to faculty for updates |
| T-30 | Faculty content due | All presentations/handouts received |
| T-25 | Content finalization | Compile and format for print |
| T-21 | Print order submitted | Send to print vendor |
| T-14 | Print completed | Materials ready for shipping |
| T-10 | Ship to venue/coordinator | Initiate shipping |
| T-7 | Delivery confirmed | Verify receipt at destination |
| T-3 | Emergency window | Last chance for corrections |

## Decision Authority

**Autonomous:**
- Tracking materials status
- Logging delivery confirmations
- Generating materials reports
- Standard print ordering (within specs)

**Recommend + Approve:**
- Rush orders (additional cost)
- Print quantity changes
- Vendor changes
- Emergency shipping upgrades

## Workers

| Worker | Type | Purpose |
|--------|------|---------|
| Materials Update Tracker | Monitor | Track faculty submissions |
| Print Order Tracker | Monitor | Track print jobs and delivery timelines |
| Shipping Monitor | Monitor | Verify materials received at venue |
| Inventory Manager | Monitor | Track standard materials inventory |

## Print Specifications

| Material Type | Typical Quantity | Lead Time | Notes |
|---------------|------------------|-----------|-------|
| Workbook | 30-50 per program | 10-14 days | Spiral bound, color |
| Handouts | 30-50 per program | 7-10 days | Black & white |
| Certificates | 50 per program | 5-7 days | Card stock, color |
| Tent cards | 30-50 per program | 5 days | Name tents |
| Evaluations | 50 per program | 5 days | Paper forms |

## Integration Points

| System | Purpose |
|--------|---------|
| Supabase | Materials orders, tracking |
| Print Vendor API | Order submission, status |
| Shipping carriers | Tracking numbers, delivery status |
| Faculty portal | Content submission |

## Shipping Destinations

| Destination Type | Use Case | Notes |
|-----------------|----------|-------|
| Venue direct | In-person programs | Ship to hotel receiving |
| Coordinator | Complex logistics | Ship to IAML staff |
| Faculty | Virtual programs | Ship presentation materials |

## Handoffs

| From | To | Trigger |
|------|----|---------|
| Faculty Management | Materials | Faculty content updates due |
| Materials | Venue & Logistics | Shipping arrangements needed |
| Materials | Program Planning | Materials issue affecting program |
| Materials | Finance | Invoice for rush orders |
