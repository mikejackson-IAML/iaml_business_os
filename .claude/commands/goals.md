# Goals - View and Manage Goals

View, add, edit, and track progress on multi-horizon goals.

## Usage

```
/goals                          # View all active goals
/goals add                      # Add a new goal (interactive)
/goals daily                    # View today's goals only
/goals weekly                   # View this week's goals
/goals monthly                  # View this month's goals
/goals quarterly                # View this quarter's goals
/goals complete <id>            # Mark a goal as complete
/goals edit <id>                # Edit a goal
/goals rollover                 # Roll over uncompleted daily goals
```

## Workflow

### View Goals (Default)

Query active goals:

```sql
SELECT * FROM accomplishments.get_active_goals();
```

Display grouped by horizon:

```
=== ACTIVE GOALS ===

TODAY (January 14, 2026)
------------------------------------------------------------------------------
[ ] Review 3 pull requests                                    [team] 1/3 done
    Progress: [===-------] 33%

THIS WEEK (Jan 13-19)
------------------------------------------------------------------------------
[=] Q1 Dashboard MVP                           [customer_experience] 5 days left
    Progress: [=====-----] 55%

[ ] Deploy lead intelligence feature                     [foundation] 5 days left
    Progress: [----------] 0%

JANUARY 2026
------------------------------------------------------------------------------
[=] Ship 5 major features                      [customer_experience] 17 days left
    Progress: [======----] 60% (3/5)

Q1 2026
------------------------------------------------------------------------------
[=] Revenue dashboard live                                [revenue] 76 days left
    Progress: [=---------] 10%

------------------------------------------------------------------------------
Summary: 5 active goals | 3 in progress | 2 not started | 0 at risk
```

### Add New Goal

Interactive goal creation with `/goals add`:

```
>>> Add New Goal

1. What's the goal title?
   > Ship lead scoring feature

2. Description (optional, press Enter to skip):
   > Build and deploy the lead intelligence scoring system

3. What's the time horizon?
   [D] Daily | [W] Weekly | [M] Monthly | [Q] Quarterly
   > W

4. What's the impact category?
   [1] revenue
   [2] efficiency
   [3] foundation
   [4] customer_experience
   [5] team
   [6] compliance
   > 4

5. Target value (optional, for trackable goals - press Enter to skip)?
   > 1

6. Unit (if target provided)?
   > feature

7. Link to parent goal? (enter goal ID or 'skip')
   Active higher-level goals:
   - abc123: Ship 5 major features (monthly)
   - def456: Revenue dashboard live (quarterly)
   > abc123

---
Goal created:

Title: Ship lead scoring feature
Horizon: Weekly (Jan 13-19, 2026)
Category: customer_experience
Target: 1 feature
Parent: Ship 5 major features

ID: ghi789
```

### Filter by Horizon

```
/goals daily
```

Shows only daily goals:

```
=== TODAY'S GOALS (January 14, 2026) ===

[ ] Review 3 pull requests                                    [team] 1/3 done
    Progress: [===-------] 33%

[ ] Respond to client emails                                  [team] 0/5 done
    Progress: [----------] 0%

------------------------------------------------------------------------------
2 daily goals | 0 completed | 2 remaining
```

### Complete a Goal

```
/goals complete ghi789
```

```
Marking complete: "Ship lead scoring feature"

Current progress: 0/1
Target not yet met. Mark as complete anyway? [Y/n] > y

Goal marked complete!

Parent goal "Ship 5 major features" progress: 3/5 -> 4/5 (80%)
```

### Edit a Goal

```
/goals edit ghi789
```

```
Editing Goal: "Ship lead scoring feature" (ghi789)

[T] Title: Ship lead scoring feature
[D] Description: Build and deploy the lead intelligence scoring system
[H] Horizon: weekly
[C] Category: customer_experience
[V] Target Value: 1
[U] Unit: feature
[S] Status: active
[P] Parent Goal: Ship 5 major features

What to edit? (T/D/H/C/V/U/S/P or 'done') > T
New title: > Deploy lead scoring feature to production

Goal updated.
```

### Rollover Daily Goals

At the end of the day, roll over uncompleted daily goals:

```
/goals rollover
```

```
=== DAILY GOALS ROLLOVER ===

Uncompleted daily goals from January 14:

1. Review 3 pull requests (1/3 done)
2. Respond to client emails (0/5 done)

For each goal, choose:
[C] Carry forward to tomorrow
[A] Abandon (mark incomplete)
[E] Escalate to weekly goal
[S] Skip for now

Goal 1 - Review 3 pull requests:
> C

Carried forward to January 15.

Goal 2 - Respond to client emails:
> A

Marked as abandoned.

---
Rollover complete:
- 1 goal carried forward
- 1 goal abandoned
```

## Goal Hierarchy

Goals can be nested. Progress cascades up:

```
Q1 2026: Revenue dashboard live
├── January: Build data pipeline (completed)
├── February: Create visualization components (in progress)
│   └── Week 3: Ship charts component (in progress)
└── March: Deploy and iterate (not started)
```

When a child goal is completed, the parent's `current_value` is automatically incremented.

## Database Operations

### Query Active Goals

```sql
SELECT * FROM accomplishments.get_active_goals();
-- Or filter by horizon:
SELECT * FROM accomplishments.get_active_goals('weekly');
```

### Insert New Goal

```sql
INSERT INTO accomplishments.goals (
  title,
  description,
  horizon,
  period_start,
  period_end,
  impact_category,
  target_value,
  unit,
  parent_goal_id
) VALUES (
  $title,
  $description,
  $horizon,
  $period_start,
  $period_end,
  $impact_category,
  $target_value,
  $unit,
  $parent_goal_id
);
```

### Get Period Boundaries

```sql
-- Get current week boundaries
SELECT * FROM accomplishments.get_period_boundaries('weekly');

-- Get current month boundaries
SELECT * FROM accomplishments.get_period_boundaries('monthly');

-- Get specific date's quarter
SELECT * FROM accomplishments.get_period_boundaries('quarterly', '2026-02-15');
```

### Mark Goal Complete

```sql
UPDATE accomplishments.goals
SET status = 'completed', completed_at = NOW()
WHERE id = $goal_id;
```

### Carry Forward Goal

```sql
-- Get tomorrow's period for daily goal
WITH new_period AS (
  SELECT * FROM accomplishments.get_period_boundaries('daily', CURRENT_DATE + 1)
)
UPDATE accomplishments.goals
SET
  period_start = (SELECT period_start FROM new_period),
  period_end = (SELECT period_end FROM new_period),
  status = 'carried_forward'
WHERE id = $goal_id;
```

## Progress Visualization

Progress bars are rendered based on `current_value / target_value`:

| Progress | Bar |
|----------|-----|
| 0% | `[----------]` |
| 10% | `[=---------]` |
| 25% | `[==--------]` |
| 50% | `[=====-----]` |
| 75% | `[=======---]` |
| 100% | `[==========]` |

For goals without a numeric target, show checkmark status:
- `[ ]` - Not started
- `[=]` - In progress (has linked accomplishments)
- `[x]` - Completed

## Impact Categories

| Category | Description | Color |
|----------|-------------|-------|
| revenue | Direct revenue impact | Green |
| efficiency | Time/cost savings | Blue |
| foundation | Infrastructure work | Gray |
| customer_experience | UX improvements | Purple |
| team | Team productivity | Orange |
| compliance | Security/legal | Red |

## Related Commands

- `/done` - Log accomplishments (auto-links to goals)
- `/email-summary` - Email summary with goal progress
