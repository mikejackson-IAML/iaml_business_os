# Phase 1: Foundation & Data Migration

## Goal
Establish database schema and migrate existing faculty/program data from Airtable to Supabase.

## Context

### Existing Infrastructure
The Supabase database already has:
- `faculty` table with name, email, firm_state, teaching_specialties, etc.
- `programs` table (course catalog) with name, program_type, blocks JSONB, etc.
- `program_instances` table for scheduled programs with dates/locations

### What's Missing
1. `tier_designation` column on `faculty` (for VIP status)
2. `instructor_qualifications` junction table (faculty ↔ programs)
3. `faculty_scheduler` schema for scheduler-specific tables

### Airtable Data Analysis
- ~20 faculty members with linked program qualifications
- `Firm State` field available for Tier 1 matching
- `PROGRAMS (Faculty)` linked field contains qualification data
- `Program Record IDs` contains Airtable IDs for linked programs

---

## Execution Plan

### Wave 1: Schema Creation (No Dependencies)

#### Task 1.1: Create faculty_scheduler schema
**File:** `supabase/migrations/20260120_create_faculty_scheduler_schema.sql`

```sql
-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS faculty_scheduler;
```

#### Task 1.2: Add tier_designation to faculty table
**File:** `supabase/migrations/20260120_create_faculty_scheduler_schema.sql`

```sql
-- Add tier designation column (0 = VIP, NULL = normal)
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS tier_designation INTEGER;
COMMENT ON COLUMN faculty.tier_designation IS '0 = VIP (Tier 0 access to all programs), NULL = normal instructor';
```

#### Task 1.3: Create instructor_qualifications junction table
**File:** `supabase/migrations/20260120_create_faculty_scheduler_schema.sql`

```sql
CREATE TABLE faculty_scheduler.instructor_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculty_id, program_id)
);

CREATE INDEX idx_instructor_quals_faculty ON faculty_scheduler.instructor_qualifications(faculty_id);
CREATE INDEX idx_instructor_quals_program ON faculty_scheduler.instructor_qualifications(program_id);
```

#### Task 1.4: Create scheduled_programs table
Programs released for instructor claiming (distinct from `program_instances`).

```sql
CREATE TABLE faculty_scheduler.scheduled_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to course catalog
  program_id UUID REFERENCES programs(id),

  -- Program details (denormalized for display)
  name TEXT NOT NULL,
  program_type TEXT,

  -- Location (for Tier 1 local matching)
  city TEXT,
  state TEXT,
  venue TEXT,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Tier system
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Not yet released
    'tier_0',       -- VIP access (days 1-7)
    'tier_1',       -- Local access (days 8-12)
    'tier_2',       -- Open to all qualified (day 13+)
    'filled',       -- All blocks claimed
    'completed'     -- Program has occurred
  )),
  released_at TIMESTAMPTZ,           -- When released to Tier 0
  tier_0_ends_at TIMESTAMPTZ,        -- When Tier 0 window closes
  tier_1_ends_at TIMESTAMPTZ,        -- When Tier 1 window closes

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_programs_status ON faculty_scheduler.scheduled_programs(status);
CREATE INDEX idx_scheduled_programs_state ON faculty_scheduler.scheduled_programs(state);
CREATE INDEX idx_scheduled_programs_start ON faculty_scheduler.scheduled_programs(start_date);
```

#### Task 1.5: Create program_blocks table
Individual claimable teaching slots within a program.

```sql
CREATE TABLE faculty_scheduler.program_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_program_id UUID NOT NULL REFERENCES faculty_scheduler.scheduled_programs(id) ON DELETE CASCADE,

  -- Block details
  block_name TEXT NOT NULL,          -- e.g., "Block 1", "Day 1 AM"
  sequence_order INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,

  -- Assignment
  instructor_id UUID REFERENCES faculty(id),
  claimed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open',      -- Available for claiming
    'claimed',   -- Claimed by instructor
    'confirmed', -- Admin confirmed (if needed)
    'completed'  -- Block has been taught
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_program_blocks_program ON faculty_scheduler.program_blocks(scheduled_program_id);
CREATE INDEX idx_program_blocks_instructor ON faculty_scheduler.program_blocks(instructor_id);
CREATE INDEX idx_program_blocks_status ON faculty_scheduler.program_blocks(status);
```

#### Task 1.6: Create claims table
Track instructor claims with full history.

```sql
CREATE TABLE faculty_scheduler.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES faculty(id),
  block_id UUID NOT NULL REFERENCES faculty_scheduler.program_blocks(id),

  -- Claim status
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'confirmed',  -- Active claim
    'cancelled',  -- Instructor or admin cancelled
    'completed'   -- Block was taught
  )),

  -- Timestamps
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,        -- 'instructor' or 'admin'
  cancelled_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claims_instructor ON faculty_scheduler.claims(instructor_id);
CREATE INDEX idx_claims_block ON faculty_scheduler.claims(block_id);
CREATE INDEX idx_claims_status ON faculty_scheduler.claims(status);
```

#### Task 1.7: Create helper views

```sql
-- View: Available programs for an instructor
CREATE OR REPLACE VIEW faculty_scheduler.available_programs AS
SELECT
  sp.*,
  pb.id as block_id,
  pb.block_name,
  pb.sequence_order,
  pb.start_date as block_start_date,
  pb.end_date as block_end_date,
  pb.status as block_status
FROM faculty_scheduler.scheduled_programs sp
JOIN faculty_scheduler.program_blocks pb ON pb.scheduled_program_id = sp.id
WHERE sp.status IN ('tier_0', 'tier_1', 'tier_2')
  AND pb.status = 'open';

-- View: Instructor dashboard summary
CREATE OR REPLACE VIEW faculty_scheduler.instructor_claims_summary AS
SELECT
  f.id as instructor_id,
  f.full_name,
  f.email,
  COUNT(c.id) FILTER (WHERE c.status = 'confirmed') as active_claims,
  COUNT(c.id) FILTER (WHERE c.status = 'completed') as completed_claims
FROM faculty f
LEFT JOIN faculty_scheduler.claims c ON c.instructor_id = f.id
WHERE f.faculty_status = 'active'
GROUP BY f.id, f.full_name, f.email;

-- View: Program recruitment pipeline
CREATE OR REPLACE VIEW faculty_scheduler.recruitment_pipeline AS
SELECT
  sp.id,
  sp.name,
  sp.city,
  sp.state,
  sp.start_date,
  sp.status,
  sp.released_at,
  CASE
    WHEN sp.status = 'tier_0' THEN sp.tier_0_ends_at - NOW()
    WHEN sp.status = 'tier_1' THEN sp.tier_1_ends_at - NOW()
    ELSE NULL
  END as time_remaining,
  COUNT(pb.id) as total_blocks,
  COUNT(pb.id) FILTER (WHERE pb.status = 'open') as open_blocks,
  COUNT(pb.id) FILTER (WHERE pb.status IN ('claimed', 'confirmed')) as filled_blocks
FROM faculty_scheduler.scheduled_programs sp
LEFT JOIN faculty_scheduler.program_blocks pb ON pb.scheduled_program_id = sp.id
WHERE sp.status NOT IN ('draft', 'completed')
GROUP BY sp.id
ORDER BY sp.start_date;
```

#### Task 1.8: Create helper functions

```sql
-- Function: Get eligible instructors for a program at current tier
CREATE OR REPLACE FUNCTION faculty_scheduler.get_eligible_instructors(
  p_program_id UUID
)
RETURNS TABLE (
  instructor_id UUID,
  full_name TEXT,
  email TEXT,
  tier INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_program RECORD;
BEGIN
  -- Get program details
  SELECT * INTO v_program
  FROM faculty_scheduler.scheduled_programs
  WHERE id = p_program_id;

  IF v_program IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.full_name,
    f.email,
    CASE
      WHEN f.tier_designation = 0 THEN 0
      WHEN f.firm_state = v_program.state THEN 1
      ELSE 2
    END as tier,
    CASE
      WHEN f.tier_designation = 0 THEN 'VIP instructor'
      WHEN f.firm_state = v_program.state THEN 'Local instructor (same state)'
      ELSE 'Qualified instructor'
    END as reason
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  JOIN faculty_scheduler.scheduled_programs sp ON sp.program_id = iq.program_id
  WHERE sp.id = p_program_id
    AND f.faculty_status = 'active'
    AND f.available_for_teaching = true
    AND (
      -- Tier 0: Only VIPs
      (v_program.status = 'tier_0' AND f.tier_designation = 0)
      -- Tier 1: VIPs + Local
      OR (v_program.status = 'tier_1' AND (f.tier_designation = 0 OR f.firm_state = v_program.state))
      -- Tier 2: All qualified
      OR (v_program.status = 'tier_2')
    )
  ORDER BY tier;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Release a program to Tier 0
CREATE OR REPLACE FUNCTION faculty_scheduler.release_program(
  p_program_id UUID,
  p_tier_0_days INTEGER DEFAULT 7,
  p_tier_1_days INTEGER DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
  UPDATE faculty_scheduler.scheduled_programs
  SET
    status = 'tier_0',
    released_at = NOW(),
    tier_0_ends_at = NOW() + (p_tier_0_days || ' days')::INTERVAL,
    tier_1_ends_at = NOW() + ((p_tier_0_days + p_tier_1_days) || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_program_id
    AND status = 'draft';
END;
$$ LANGUAGE plpgsql;

-- Function: Advance tier (called by n8n scheduler)
CREATE OR REPLACE FUNCTION faculty_scheduler.advance_tiers()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Advance Tier 0 → Tier 1
  UPDATE faculty_scheduler.scheduled_programs
  SET status = 'tier_1', updated_at = NOW()
  WHERE status = 'tier_0'
    AND tier_0_ends_at <= NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Advance Tier 1 → Tier 2
  UPDATE faculty_scheduler.scheduled_programs
  SET status = 'tier_2', updated_at = NOW()
  WHERE status = 'tier_1'
    AND tier_1_ends_at <= NOW();
  GET DIAGNOSTICS v_count = v_count + ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

---

### Wave 2: Data Migration (Depends on Wave 1)

#### Task 2.1: Create migration script for faculty qualifications
**File:** `supabase/scripts/migrate-faculty-qualifications.sql`

This script will:
1. Map Airtable faculty IDs to Supabase faculty IDs
2. Map Airtable program IDs to Supabase program IDs
3. Create records in `instructor_qualifications`

```sql
-- Migration script: Faculty qualifications
-- Run after schema creation

-- First, create a temporary mapping table
CREATE TEMP TABLE airtable_program_map (
  airtable_id TEXT,
  program_name TEXT,
  supabase_id UUID
);

-- Map Airtable programs to Supabase programs by name
-- (Manual step: populate this based on actual data)
INSERT INTO airtable_program_map (airtable_id, program_name, supabase_id)
SELECT
  p.airtable_record_id,
  p.name,
  p.id
FROM programs p
WHERE p.airtable_record_id IS NOT NULL;

-- Insert qualifications
-- This will be generated from the Airtable export
-- Example for one faculty member:
/*
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f, programs p
WHERE f.airtable_record_id = 'rech00qD2rjunIoGX'  -- John Wymer
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Advanced Certificate in Strategic Employment Law',
    'Certificate in Strategic HR Leadership',
    -- ... etc from PROGRAMS (Faculty) field
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;
*/
```

#### Task 2.2: Create Node.js migration script
**File:** `supabase/scripts/migrate-faculty-from-airtable.ts`

A script that:
1. Reads the Airtable CSV export
2. Matches faculty by `airtable_record_id` or email
3. Parses the `PROGRAMS (Faculty)` field
4. Creates qualification records

---

### Wave 3: Validation (Depends on Wave 2)

#### Task 3.1: Create validation queries
**File:** `supabase/scripts/validate-faculty-migration.sql`

```sql
-- Validation queries

-- 1. Check all faculty have at least one qualification
SELECT f.full_name, f.email, COUNT(iq.id) as qualification_count
FROM faculty f
LEFT JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
WHERE f.faculty_status = 'active'
GROUP BY f.id
HAVING COUNT(iq.id) = 0;

-- 2. Check qualification distribution
SELECT p.name, COUNT(iq.id) as instructor_count
FROM programs p
LEFT JOIN faculty_scheduler.instructor_qualifications iq ON iq.program_id = p.id
GROUP BY p.id
ORDER BY instructor_count DESC;

-- 3. Verify tier eligibility logic
SELECT
  f.full_name,
  f.firm_state,
  f.tier_designation,
  CASE
    WHEN f.tier_designation = 0 THEN 'Tier 0 (VIP)'
    ELSE 'Normal (Tier 1/2 based on location)'
  END as tier_status
FROM faculty f
WHERE f.faculty_status = 'active'
ORDER BY f.tier_designation NULLS LAST, f.firm_state;
```

#### Task 3.2: Create seed data for testing
**File:** `supabase/scripts/seed-test-programs.sql`

```sql
-- Seed test scheduled programs

-- Insert a test program
INSERT INTO faculty_scheduler.scheduled_programs (
  name, program_type, city, state, venue, start_date, end_date, status
) VALUES (
  'Certificate in Employee Relations Law - Test',
  'Employment Law',
  'Denver',
  'Colorado',
  'Grand Hyatt Denver',
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '32 days',
  'draft'
);

-- Insert blocks for that program
INSERT INTO faculty_scheduler.program_blocks (
  scheduled_program_id, block_name, sequence_order, start_date, end_date
)
SELECT
  sp.id,
  'Block ' || generate_series(1, 3),
  generate_series(1, 3),
  sp.start_date + (generate_series(1, 3) - 1) * INTERVAL '1 day',
  sp.start_date + (generate_series(1, 3) - 1) * INTERVAL '1 day'
FROM faculty_scheduler.scheduled_programs sp
WHERE sp.name = 'Certificate in Employee Relations Law - Test';
```

---

## Deliverables

| # | Deliverable | File |
|---|-------------|------|
| 1 | Schema migration | `supabase/migrations/20260120_create_faculty_scheduler_schema.sql` |
| 2 | Faculty qualification migration script | `supabase/scripts/migrate-faculty-qualifications.sql` |
| 3 | Node.js migration helper | `supabase/scripts/migrate-faculty-from-airtable.ts` |
| 4 | Validation queries | `supabase/scripts/validate-faculty-migration.sql` |
| 5 | Test seed data | `supabase/scripts/seed-test-programs.sql` |

---

## Acceptance Criteria

- [ ] Schema migration runs without errors
- [ ] All 20 faculty members have qualification records
- [ ] Tier designation field exists and is editable
- [ ] `get_eligible_instructors()` returns correct results for each tier
- [ ] Test program can be released and tier logic works
- [ ] Validation queries return expected results

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| VIP management | `tier_designation` field editable by admin (0 = VIP, NULL = normal) |
| Local definition | Same state (`firm_state` = program `state`) |
| Qualification tracking | Junction table `instructor_qualifications` linking `faculty` ↔ `programs` |

---

## Dependencies

- Existing `faculty` table (✓ exists)
- Existing `programs` table (✓ exists)
- Airtable export with `PROGRAMS (Faculty)` field (✓ provided)

---

## Notes

1. **Phase 2 tables** (notifications, magic_tokens) will be created in Phase 2 but designed to integrate with this schema.

2. **Tier timing** is configurable via `release_program()` function parameters (default: 7 days Tier 0, 5 days Tier 1).

3. **The scheduled_programs table** is separate from `program_instances` intentionally — they serve different purposes (instructor recruitment vs. operational readiness).
