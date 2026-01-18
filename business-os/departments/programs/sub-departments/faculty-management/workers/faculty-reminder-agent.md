# Faculty Reminder Agent

> **CEO Summary:** Automatically sends scheduled emails to faculty at key milestones: confirmation reminder (T-30), logistics brief (T-14), final reminder (T-7), and day-before details (T-1). Ensures faculty are prepared without manual follow-up.

## Purpose

Automatically send scheduled communications to faculty members at key milestones before their programs. This agent ensures faculty receive timely logistics information without manual intervention, reducing administrative burden and improving faculty preparedness.

## Type

Agent (Automated)

## Trigger

- **Schedule:** Daily at 9:00 AM EST (`0 9 * * *`)
- **Manual:** On-demand for specific faculty/programs

---

## Inputs

### Data Sources

**Supabase:**
- `faculty_assignments` — Faculty assigned to upcoming programs
- `program_instances` — Program dates, locations, details
- `faculty` — Faculty contact information, preferences
- `venues` — Venue details, addresses, contacts
- `communications_log` — What's already been sent

**Config:**
- Communication templates from `notification_templates`
- Timing rules from `config.json`

---

## Communication Schedule

| Days Before | Communication Type | Template ID | Condition |
|-------------|-------------------|-------------|-----------|
| T-60 | Initial Assignment | `faculty_assignment` | On assignment |
| T-30 | Confirmation Reminder | `faculty_confirm_reminder` | If not confirmed |
| T-14 | Faculty Brief | `faculty_logistics_brief` | All confirmed faculty |
| T-7 | Final Reminder | `faculty_final_reminder` | All confirmed faculty |
| T-1 | Day-Before Check-in | `faculty_day_before` | All confirmed faculty |

---

## Process

### Step 1: Identify Upcoming Programs Needing Communications

```sql
SELECT
  fa.id as assignment_id,
  fa.faculty_id,
  f.first_name,
  f.last_name,
  f.email,
  f.phone,
  pi.id as instance_id,
  p.name as program_name,
  pi.start_date,
  DATEDIFF(pi.start_date, CURRENT_DATE) as days_until_start,
  pi.venue_id,
  v.name as venue_name,
  v.address,
  v.city,
  v.state,
  fa.confirmed,
  fa.confirmed_date
FROM faculty_assignments fa
JOIN faculty f ON fa.faculty_id = f.id
JOIN program_instances pi ON fa.instance_id = pi.id
JOIN programs p ON pi.program_id = p.id
LEFT JOIN venues v ON pi.venue_id = v.id
WHERE pi.start_date >= CURRENT_DATE
  AND pi.status = 'scheduled'
  AND fa.status = 'active'
ORDER BY pi.start_date;
```

### Step 2: Determine Which Communications to Send

```javascript
async function determineCommsToSend(assignments) {
  const toSend = [];

  for (const assignment of assignments) {
    const daysOut = assignment.days_until_start;
    const alreadySent = await getCommsSentForAssignment(assignment.assignment_id);

    // T-30 Confirmation Reminder (only if not confirmed)
    if (daysOut === 30 && !assignment.confirmed) {
      if (!alreadySent.includes('faculty_confirm_reminder')) {
        toSend.push({
          assignment,
          template: 'faculty_confirm_reminder',
          priority: 'high'
        });
      }
    }

    // T-14 Faculty Brief (all confirmed faculty)
    if (daysOut === 14 && assignment.confirmed) {
      if (!alreadySent.includes('faculty_logistics_brief')) {
        toSend.push({
          assignment,
          template: 'faculty_logistics_brief',
          priority: 'normal'
        });
      }
    }

    // T-7 Final Reminder
    if (daysOut === 7 && assignment.confirmed) {
      if (!alreadySent.includes('faculty_final_reminder')) {
        toSend.push({
          assignment,
          template: 'faculty_final_reminder',
          priority: 'normal'
        });
      }
    }

    // T-1 Day-Before Check-in
    if (daysOut === 1 && assignment.confirmed) {
      if (!alreadySent.includes('faculty_day_before')) {
        toSend.push({
          assignment,
          template: 'faculty_day_before',
          priority: 'high'
        });
      }
    }
  }

  return toSend;
}
```

### Step 3: Build Email Content

```javascript
function buildEmailContent(assignment, templateId) {
  const templates = {
    faculty_confirm_reminder: {
      subject: `Action Required: Please Confirm Your Assignment - ${assignment.program_name}`,
      body: buildConfirmationReminder(assignment)
    },
    faculty_logistics_brief: {
      subject: `Faculty Brief: ${assignment.program_name} - ${formatDate(assignment.start_date)}`,
      body: buildLogisticsBrief(assignment)
    },
    faculty_final_reminder: {
      subject: `One Week Away: ${assignment.program_name}`,
      body: buildFinalReminder(assignment)
    },
    faculty_day_before: {
      subject: `Tomorrow: ${assignment.program_name} - Final Details`,
      body: buildDayBeforeEmail(assignment)
    }
  };

  return templates[templateId];
}

function buildLogisticsBrief(assignment) {
  return `
Dear ${assignment.first_name},

Thank you for teaching at ${assignment.program_name}. Here are your logistics details:

PROGRAM DETAILS
---------------
Program: ${assignment.program_name}
Dates: ${formatDateRange(assignment.start_date, assignment.end_date)}
Location: ${assignment.venue_name}
         ${assignment.address}
         ${assignment.city}, ${assignment.state}

YOUR SCHEDULE
-------------
${assignment.session_schedule}

VENUE INFORMATION
-----------------
Hotel Contact: ${assignment.venue_contact}
Check-in: ${assignment.checkin_instructions}
Room Block: Use code "${assignment.room_block_code}" when booking

MATERIALS
---------
${assignment.materials_status}

TRAVEL
------
${assignment.travel_notes || 'Please arrange your own travel. Submit expenses within 30 days of the program.'}

CONTACTS
--------
Program Coordinator: ${assignment.coordinator_name}
Phone: ${assignment.coordinator_phone}
Email: ${assignment.coordinator_email}

Emergency Line: ${assignment.emergency_phone}

Please reply to confirm you've received this information.

Thank you,
IAML Programs Team
  `;
}
```

### Step 4: Send Communications via GoHighLevel

```javascript
async function sendFacultyEmail(assignment, emailContent) {
  // Send via GHL
  const response = await ghl.contacts.sendEmail({
    contactId: assignment.ghl_contact_id,
    subject: emailContent.subject,
    body: emailContent.body,
    from: 'programs@iaml.com'
  });

  // Log the communication
  await supabase
    .from('communications_log')
    .insert({
      assignment_id: assignment.assignment_id,
      faculty_id: assignment.faculty_id,
      instance_id: assignment.instance_id,
      template_id: emailContent.templateId,
      sent_at: new Date(),
      status: response.success ? 'sent' : 'failed',
      message_id: response.messageId,
      error: response.error || null
    });

  return response;
}
```

### Step 5: Update Readiness Checklist

```javascript
async function updateReadinessChecklist(instanceId, templateId) {
  if (templateId === 'faculty_logistics_brief') {
    // Mark faculty brief as sent for this instance
    await supabase
      .from('readiness_checklist')
      .update({ faculty_brief_sent: true, faculty_brief_sent_date: new Date() })
      .eq('instance_id', instanceId);
  }
}
```

---

## Outputs

### To Dashboard

```json
{
  "communications_sent_today": {
    "total": 12,
    "by_type": {
      "faculty_confirm_reminder": 2,
      "faculty_logistics_brief": 5,
      "faculty_final_reminder": 3,
      "faculty_day_before": 2
    },
    "success_rate": 100
  },
  "pending_confirmations": 4,
  "upcoming_briefs_due": 8
}
```

### To Supabase

Table: `communications_log`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Communication ID |
| `assignment_id` | uuid | Faculty assignment ID |
| `faculty_id` | uuid | Faculty member ID |
| `instance_id` | uuid | Program instance ID |
| `template_id` | text | Template used |
| `sent_at` | timestamp | When sent |
| `status` | text | sent/failed/bounced |
| `message_id` | text | GHL message ID |
| `opened_at` | timestamp | When opened (if tracked) |
| `error` | text | Error message if failed |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Email send failed | Warning | Log error, retry queue |
| Faculty not confirmed at T-21 | Warning | Alert to Programs Director |
| Faculty brief not sent at T-10 | Critical | Manual intervention needed |
| Day-before not sent | Critical | Immediate manual follow-up |

---

## Email Templates

### T-30: Confirmation Reminder

**Subject:** Action Required: Please Confirm Your Assignment - {program_name}

**Body:**
```
Dear {first_name},

We're reaching out to confirm your upcoming teaching assignment:

Program: {program_name}
Dates: {date_range}
Location: {venue_city}

Please confirm your participation by replying to this email or clicking the link below:

[CONFIRM MY ASSIGNMENT]

If you have any scheduling conflicts, please let us know immediately so we can make arrangements.

Thank you,
IAML Programs Team
```

### T-14: Faculty Logistics Brief

**Subject:** Faculty Brief: {program_name} - {start_date}

*(Full logistics packet - see buildLogisticsBrief function above)*

### T-7: Final Reminder

**Subject:** One Week Away: {program_name}

**Body:**
```
Dear {first_name},

Just a reminder that {program_name} is one week away!

Quick Details:
- Dates: {date_range}
- Location: {venue_name}, {venue_city}
- Your sessions: {session_times}

If you have any questions or need to update your travel arrangements, please contact {coordinator_name} at {coordinator_email}.

We look forward to seeing you!

Best,
IAML Programs Team
```

### T-1: Day-Before

**Subject:** Tomorrow: {program_name} - Final Details

**Body:**
```
Dear {first_name},

Tomorrow is the day! Here's everything you need:

VENUE
{venue_name}
{venue_address}
{venue_city}, {venue_state}

YOUR FIRST SESSION: {first_session_time}
Arrive by: {arrival_time}

MEETING ROOM: {room_name}

ON-SITE CONTACTS
Program Coordinator: {coordinator_name} - {coordinator_phone}
Venue Contact: {venue_contact} - {venue_phone}

EMERGENCY: {emergency_phone}

Materials and AV will be set up. Please arrive {minutes_early} minutes early.

Safe travels!
IAML Programs Team
```

---

## Integration Requirements

### APIs Needed
- Supabase (faculty data, communications log)
- GoHighLevel (email sending)

### Credentials
- `SUPABASE_TOKEN`
- `GHL_PIT_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Schedule (9 AM daily)
    |
    v
Supabase: Get upcoming faculty assignments
    |
    v
Supabase: Get communications already sent
    |
    v
Function: Determine which communications to send
    |
    v
Loop: For each communication needed
    |
    +-- Function: Build email content
    |
    +-- GHL: Send email
    |
    +-- Supabase: Log communication
    |
    +-- IF: Is faculty brief? --> Update readiness checklist
    |
    v
Function: Aggregate results
    |
    v
IF: Any failures?
    |
    +-- Yes --> Alert, add to retry queue
    |
    +-- No --> Complete
    |
    v
Complete
```

**Estimated Runtime:** 5-15 minutes depending on volume

---

## Error Handling

### Send Failures
1. Log failure with error details
2. Add to retry queue
3. Retry up to 3 times over 4 hours
4. If still failing, alert for manual intervention

### Missing Data
- If venue info missing: Send partial brief, flag for follow-up
- If contact info missing: Alert, require manual update
- If schedule missing: Block send, alert coordinator

---

## Status

- [x] Worker specification complete
- [ ] Email templates finalized
- [ ] GHL integration built
- [ ] Supabase tables created
- [ ] n8n workflow built
- [ ] Testing complete
- [ ] Production deployment
