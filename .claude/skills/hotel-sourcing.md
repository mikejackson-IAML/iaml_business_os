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

### Meeting Space Rules
- Each concurrent program requires its own dedicated meeting room
- Setup types:
  - "Investigations" programs → ROUNDS (round tables)
  - All other programs → CLASSROOM
- Meeting days calculation:
  - If `duration_days` = 4.5 → 5 meeting days
  - Otherwise → integer value of `duration_days`
- Meeting date range: `start_date` to `start_date + (meeting_days - 1)`

### Grouping Logic
1. Group programs by location (city, state)
2. Within each location, merge overlapping date windows
3. For each merged window, calculate max simultaneous rooms needed by setup type
4. Determine day-of-week ranges for each setup type
5. Count unique programs per location (for "*X programs total" line)

### Program Counting
- Count unique "base" programs per location (e.g., Certificate in Employee Relations Law = 1 program)
- Do NOT count sub-blocks separately (e.g., if a certificate has 3 blocks, count as 1 program)
- The program count helps the coordinator understand scale/complexity

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
2. **Process data**:
   - Parse dates and durations
   - Determine setup type (rounds vs classroom) based on program name
   - Calculate meeting days per program
3. **Group by location**: Create location buckets with (city, state)
4. **Merge date windows**: Within each location, merge overlapping meeting date ranges
5. **Calculate concurrency**: For each merged window, count max simultaneous rooms by setup type
6. **Generate email**: Format per the output specification above
7. **Display to user**: Show the generated email for copying

## Notes
- This skill queries live Supabase data
- Only includes programs with `hotel_status` IN ('not_started', 'sourcing')
- Only includes programs with `start_date >= today`
- Does not modify any data (read-only)
