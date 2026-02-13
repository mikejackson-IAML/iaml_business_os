# Hotel Sourcing Email Generator

Generate a polished hotel-sourcing email for upcoming in-person programs that need hotel arrangements.

## Trigger
User runs `/hotel-sourcing`

## Data Source
Query Supabase RPC `get_programs_for_hotel_sourcing()` which returns upcoming in-person programs where `hotel_status` is 'not_started' or 'sourcing'.

## Business Rules

### Global Requirements (all locations)
- ~12 participants per program
- ~10 sleeping rooms/night TOTAL per location (not per program), avoid attrition exposure
- Room rate target: < $200/night when feasible
- F&B minimum: ~$3,000/week/location (especially when multiple programs run)
- Cancellation: generous no-penalty terms (ideally cancel within ~2 weeks)
- Prefer Marriott properties when feasible

### Meeting Space Rules — CRITICAL

**Key principle: Count PARENT PROGRAMS, not blocks.**

A "Certificate" program (e.g., Certificate in Employee Relations Law) runs for 5 days and contains multiple blocks (Comprehensive Labor Relations, Discrimination Prevention, Special Issues). These blocks **share one meeting room** — they are sequential sessions within the same program, not concurrent programs.

**What counts as 1 program = 1 meeting room:**
- Certificate in Employee Relations Law (5 days) = 1 room Mon-Fri
- Certificate in Employee Benefits Law (5 days) = 1 room Mon-Fri
- Certificate in Workplace Investigations (2 days) = 1 room Mon-Tue
- Certificate in Strategic HR Leadership (5 days) = 1 room Mon-Fri
- Advanced Certificate in Strategic Employment Law (2 days) = 1 room Mon-Tue

**What does NOT count as separate programs:**
- Comprehensive Labor Relations (block within Employee Relations Law cert)
- Discrimination Prevention & Defense (block within Employee Relations Law cert)
- Retirement Plans (block within Employee Benefits Law cert)
- HR Law Fundamentals (block within Strategic HR Leadership cert)

**Setup types:**
- Programs with "Investigations" in name → ROUNDS (round tables)
- All other programs → CLASSROOM

### Room Duration Rules
- 5-day certificate programs → 1 room Mon-Fri
- 4.5-day programs → 1 room Mon-Fri (round up)
- 2-day programs → 1 room Mon-Tue (or appropriate 2-day span)
- 1-day programs → 1 room for that day

### Grouping Logic
1. Group programs by location (city, state)
2. Identify parent/certificate programs (ignore constituent blocks)
3. For each parent program, determine:
   - Room duration (Mon-Fri vs Mon-Tue etc.)
   - Setup type (rounds vs classroom)
4. Count rooms by duration and setup type
5. Sum total programs per location

### Program Counting
- Count **parent certificate programs only**
- The blocks within a certificate are NOT separate programs
- Total programs = sum of all room requirements (e.g., 2 Mon-Fri + 1 Mon-Tue = 3 programs)
- If database returns blocks separately, group by parent_program_id or by certificate name pattern

## Output Format

Generate email addressed to "Mike" with:

1. **Global section** - Business requirements that apply to all locations
2. **Meeting space needs by location** - Bullet list per location with:
   - Date window (e.g., "Apr 20-24, 2026")
   - Total meeting space needed (simultaneous):
     - X meeting rooms: Day-Day (classroom)
     - Y meeting rooms: Day-Day (rounds)
   - **Program count**: Add "*X programs total" at end of each location section
3. **Request section** - Ask coordinator to return:
   - Guest room rate + mandatory fees
   - Meeting room rental + waivers/concessions
   - Block minimums + attrition terms
   - Cancellation schedule/penalties
   - F&B minimum + taxes/service
   - Airport proximity

**Do NOT include:**
- Individual program names
- Signature block

## Example Output

```
Hi Mike —

We're planning our spring/summer 2026 programming and need to source hotels for several locations. Here are our standard requirements:

**Global Requirements:**
- ~12 participants per program
- ~10 sleeping rooms/night per location (want to minimize attrition exposure)
- Rate target: under $200/night when feasible
- F&B minimum: ~$3,000/week/location
- Cancellation: generous no-penalty terms (ideally within 2 weeks)
- Preference for Marriott properties

**Meeting Space Needs by Location:**

**Atlanta, GA — Apr 20–24, 2026**
- Total meeting space needed (simultaneous):
  - 2 meeting rooms: Mon–Fri (classroom)
  - 1 meeting room: Mon–Tue (rounds)
*3 programs total

**Chicago, IL — May 4–8, 2026**
- Total meeting space needed (simultaneous):
  - 1 meeting room: Mon–Fri (classroom)
  - 1 meeting room: Mon–Tue (classroom)
*2 programs total

[...additional locations...]

Please return proposals including:
- Guest room rate + mandatory fees
- Meeting room rental + any waivers/concessions
- Block minimums + attrition terms
- Cancellation schedule/penalties
- F&B minimum + taxes/service charges
- Airport proximity/convenience

Thanks!
```

## Execution Steps

1. **Fetch data**: Call Supabase RPC `get_programs_for_hotel_sourcing()`
2. **Identify parent programs**:
   - Filter to only parent/certificate programs (not blocks)
   - Use `parent_program_id IS NULL` or identify by "Certificate" naming pattern
   - Blocks like "Comprehensive Labor Relations" should be excluded if their parent cert is already counted
3. **Group by location**: Create location buckets with (city, state)
4. **Categorize by room duration**:
   - 5-day programs → Mon-Fri bucket
   - 2-day programs → Mon-Tue bucket (or appropriate span)
   - 1-day programs → single day bucket
5. **Determine setup type**: "Investigations" → rounds, everything else → classroom
6. **Count rooms per bucket**: Sum programs in each duration/setup combination
7. **Calculate total**: Sum all room counts = total programs
8. **Generate email**: Format per the output specification above
9. **Display to user**: Show the generated email for copying

## Notes
- This skill queries live Supabase data
- Only includes programs with `hotel_status` IN ('not_started', 'sourcing')
- Only includes programs with `start_date >= today`
- Does not modify any data (read-only)
