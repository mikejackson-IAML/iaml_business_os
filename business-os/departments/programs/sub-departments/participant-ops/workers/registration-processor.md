# Registration Processor

## Purpose

Process incoming registrations received via Stripe webhooks, creating participant records, sending confirmation emails, and updating enrollment counts. This agent is triggered in real-time for each new registration.

## Type

Agent (Automated)

## Trigger

- **Webhook:** Stripe `checkout.session.completed` event
- **Manual:** Re-process failed registrations via dashboard

---

## Inputs

### Webhook Payload (Stripe)

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "customer_email": "jsmith@company.com",
      "customer_details": {
        "name": "John Smith",
        "email": "jsmith@company.com",
        "phone": "+1-555-123-4567"
      },
      "metadata": {
        "program_instance_id": "pi_xyz789",
        "program_name": "Certificate in Employee Relations Law",
        "session_dates": "2025-01-27 to 2025-01-31"
      },
      "amount_total": 339500,
      "payment_status": "paid"
    }
  }
}
```

### Data Sources

**Supabase:**
- `program_instances` — Program details, capacity
- `registrations` — Existing registrations
- `contacts` — Contact database

**GoHighLevel:**
- Contact lookup/creation
- Email sending

---

## Process

### Step 1: Validate Webhook

```javascript
async function validateWebhook(event, signature) {
  // Verify Stripe signature
  const isValid = stripe.webhooks.constructEvent(
    event.body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  // Check for duplicate processing
  const existing = await supabase
    .from('registrations')
    .select('id')
    .eq('stripe_session_id', event.data.object.id)
    .single();

  if (existing) {
    console.log('Already processed, skipping');
    return { skip: true };
  }

  return { valid: true, event };
}
```

### Step 2: Extract Registration Data

```javascript
function extractRegistrationData(checkoutSession) {
  const { customer_details, metadata, amount_total, id } = checkoutSession;

  return {
    stripe_session_id: id,
    instance_id: metadata.program_instance_id,
    program_name: metadata.program_name,
    session_dates: metadata.session_dates,

    // Participant info
    email: customer_details.email,
    first_name: extractFirstName(customer_details.name),
    last_name: extractLastName(customer_details.name),
    phone: customer_details.phone,

    // Payment info
    amount_paid: amount_total / 100,  // Convert cents to dollars
    payment_status: 'paid',

    // Metadata
    registered_at: new Date(),
    status: 'confirmed',
    source: 'website'
  };
}
```

### Step 3: Create Registration Record

```javascript
async function createRegistration(data) {
  // Insert registration
  const registration = await supabase
    .from('registrations')
    .insert({
      instance_id: data.instance_id,
      stripe_session_id: data.stripe_session_id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      amount_paid: data.amount_paid,
      payment_status: data.payment_status,
      status: data.status,
      source: data.source,
      registered_at: data.registered_at
    })
    .select()
    .single();

  return registration;
}
```

### Step 4: Update Enrollment Count

```javascript
async function updateEnrollmentCount(instanceId) {
  // Get current enrollment
  const { count } = await supabase
    .from('registrations')
    .select('id', { count: 'exact' })
    .eq('instance_id', instanceId)
    .in('status', ['confirmed', 'pending']);

  // Update program instance
  await supabase
    .from('program_instances')
    .update({
      current_enrollment: count,
      updated_at: new Date()
    })
    .eq('id', instanceId);

  return count;
}
```

### Step 5: Create/Update Contact in CRM

```javascript
async function syncToCRM(registration, programDetails) {
  // Check if contact exists in GHL
  let contact = await ghl.contacts.search({
    email: registration.email
  });

  if (contact) {
    // Update existing contact
    await ghl.contacts.update(contact.id, {
      tags: [...contact.tags, `registered_${programDetails.program_slug}`],
      customFields: {
        last_registration_date: registration.registered_at,
        last_program_registered: programDetails.program_name
      }
    });
  } else {
    // Create new contact
    contact = await ghl.contacts.create({
      firstName: registration.first_name,
      lastName: registration.last_name,
      email: registration.email,
      phone: registration.phone,
      tags: [`registered_${programDetails.program_slug}`, 'new_registrant'],
      source: 'Website Registration'
    });
  }

  // Store GHL contact ID
  await supabase
    .from('registrations')
    .update({ ghl_contact_id: contact.id })
    .eq('id', registration.id);

  return contact;
}
```

### Step 6: Send Confirmation Email

```javascript
async function sendConfirmationEmail(registration, programDetails, ghlContactId) {
  const emailContent = {
    to: registration.email,
    subject: `Registration Confirmed: ${programDetails.program_name}`,
    body: buildConfirmationEmail(registration, programDetails)
  };

  const result = await ghl.contacts.sendEmail(ghlContactId, emailContent);

  // Log communication
  await supabase
    .from('communications_log')
    .insert({
      registration_id: registration.id,
      type: 'registration_confirmation',
      channel: 'email',
      sent_at: new Date(),
      status: result.success ? 'sent' : 'failed',
      message_id: result.messageId
    });

  return result;
}

function buildConfirmationEmail(registration, program) {
  return `
Dear ${registration.first_name},

Thank you for registering for ${program.program_name}!

REGISTRATION DETAILS
--------------------
Program: ${program.program_name}
Dates: ${program.session_dates}
Location: ${program.venue_name}
         ${program.venue_address}
         ${program.venue_city}, ${program.venue_state}

Amount Paid: $${registration.amount_paid.toLocaleString()}
Confirmation #: ${registration.id.slice(0, 8).toUpperCase()}

WHAT'S NEXT
-----------
- You'll receive a logistics email 2 weeks before the program
- Book your hotel room using code: ${program.room_block_code}
- Review the program agenda: ${program.agenda_url}

QUESTIONS?
----------
Contact us at programs@iaml.com or call (800) 458-4265

We look forward to seeing you!

IAML Programs Team
  `;
}
```

### Step 7: Add to Communication Queue

```javascript
async function addToCommQueue(registration, instanceId) {
  const programInstance = await getProgramInstance(instanceId);
  const daysUntilProgram = daysBetween(new Date(), programInstance.start_date);

  // Schedule appropriate communications based on timing
  const commsToSchedule = [];

  if (daysUntilProgram > 14) {
    commsToSchedule.push({
      type: 'logistics_email',
      scheduled_date: subtractDays(programInstance.start_date, 14)
    });
  }

  if (daysUntilProgram > 7) {
    commsToSchedule.push({
      type: 'final_reminder',
      scheduled_date: subtractDays(programInstance.start_date, 7)
    });
  }

  if (daysUntilProgram > 1) {
    commsToSchedule.push({
      type: 'day_before',
      scheduled_date: subtractDays(programInstance.start_date, 1)
    });
  }

  // Insert scheduled communications
  for (const comm of commsToSchedule) {
    await supabase
      .from('scheduled_communications')
      .insert({
        registration_id: registration.id,
        communication_type: comm.type,
        scheduled_date: comm.scheduled_date,
        status: 'pending'
      });
  }
}
```

### Step 8: Log Activity

```javascript
async function logRegistrationActivity(registration, program, enrollment) {
  await supabase
    .from('activity_log')
    .insert({
      department: 'programs',
      activity_type: 'new_registration',
      entity_type: 'registration',
      entity_id: registration.id,
      description: `New registration: ${registration.first_name} ${registration.last_name} for ${program.program_name}`,
      metadata: {
        program_id: program.id,
        instance_id: registration.instance_id,
        enrollment_count: enrollment,
        amount: registration.amount_paid
      },
      created_at: new Date()
    });
}
```

---

## Outputs

### To Dashboard

```json
{
  "registration_processed": {
    "registration_id": "reg_abc123",
    "participant": "John Smith",
    "email": "jsmith@company.com",
    "program": "Certificate in Employee Relations Law",
    "dates": "Jan 27-31, 2025",
    "amount": 3395,
    "new_enrollment_count": 19
  }
}
```

### To Supabase

Table: `registrations`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Registration ID |
| `instance_id` | uuid | Program instance |
| `stripe_session_id` | text | Stripe checkout session |
| `email` | text | Participant email |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `phone` | text | Phone number |
| `amount_paid` | decimal | Amount paid |
| `payment_status` | text | paid/refunded/partial |
| `status` | text | confirmed/cancelled/transferred |
| `ghl_contact_id` | text | GHL contact ID |
| `registered_at` | timestamp | Registration time |

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Registration failed | Warning | Log error, alert for manual processing |
| Capacity reached | Info | Notify Programs team |
| VIP registration | Info | Flag for personal follow-up |
| Webhook retry failed 3x | Critical | Manual intervention needed |

---

## Error Handling

### Payment Issues
- If payment status is not 'paid': Hold registration, alert for review
- If amount mismatch: Flag for verification

### CRM Sync Issues
- If GHL fails: Continue with registration, queue for retry
- Log error for manual CRM update

### Email Failures
- If confirmation fails: Queue for retry
- After 3 failures: Alert for manual send

---

## Integration Requirements

### APIs Needed
- Stripe Webhooks
- Supabase (registration data)
- GoHighLevel (CRM, email)

### Credentials
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_API_KEY`
- `SUPABASE_TOKEN`
- `GHL_PIT_TOKEN`

---

## n8n Implementation Notes

**Workflow Structure:**
```
Trigger: Webhook (Stripe checkout.session.completed)
    |
    v
Function: Validate webhook signature
    |
    v
Function: Check for duplicate
    |
    v
IF: Already processed?
    |
    +-- Yes --> Return success (idempotent)
    |
    +-- No --> Continue
         |
         v
    Function: Extract registration data
         |
         v
    Supabase: Create registration record
         |
         v
    Supabase: Update enrollment count
         |
         v
    GHL: Create/update contact
         |
         v
    GHL: Send confirmation email
         |
         v
    Supabase: Schedule future communications
         |
         v
    Supabase: Log activity
         |
         v
    Return success response
```

**Estimated Runtime:** 3-10 seconds

---

## Status

- [x] Worker specification complete
- [ ] Stripe webhook configured
- [ ] GHL integration built
- [ ] Supabase tables created
- [ ] Email templates finalized
- [ ] n8n workflow built
- [ ] Testing complete
- [ ] Production deployment
