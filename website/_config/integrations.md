# Website Integrations

> Reference documentation for all external service integrations used by the website.

---

## Overview

| Integration | Purpose | Method | Status |
|-------------|---------|--------|--------|
| Airtable | Data storage & forms | REST API | Active |
| GoHighLevel | CRM & automation | Webhooks | Active |
| Stripe | Payments | JS SDK | Active |
| GA4 | Analytics | GTM | Active |
| GTM | Tag management | Script | Active |

---

## Airtable Integration

### Purpose
- Store form submissions
- Manage quiz responses
- Track program registrations
- Pull dynamic content for pages

### Implementation
```javascript
// Location: /website/js/api/airtable.js

const AIRTABLE_CONFIG = {
  baseId: 'YOUR_BASE_ID',
  apiKey: 'YOUR_API_KEY',  // Note: Use environment variables in production
  tables: {
    registrations: 'tblXXXXXXXXXXXXXX',
    quizResponses: 'tblXXXXXXXXXXXXXX',
    formSubmissions: 'tblXXXXXXXXXXXXXX'
  }
};
```

### Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v0/{baseId}/{tableName}` | POST | Create records |
| `/v0/{baseId}/{tableName}` | GET | Fetch records |

### Security Notes
- API key should be restricted to specific tables
- Consider using Airtable Proxy for production
- Rate limit: 5 requests/second

---

## GoHighLevel Integration

### Purpose
- CRM contact creation
- Marketing automation triggers
- Lead scoring
- Follow-up sequences

### Implementation
Webhooks are used to push data to GHL:

```javascript
// Location: /website/js/api/ghl.js (or inline in forms)

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/XXXXXX';

async function submitToGHL(formData) {
  const response = await fetch(GHL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  return response.ok;
}
```

### Webhook Endpoints
| Form/Action | Webhook Purpose |
|-------------|-----------------|
| Contact form | Create contact, trigger welcome |
| Program registration | Add to program list, trigger sequence |
| Quiz completion | Tag based on score, trigger nurture |

---

## Stripe Integration

### Purpose
- Program registration payments
- One-time purchases
- (Future) Subscription management

### Implementation
```html
<!-- Stripe.js loaded in pages with payment functionality -->
<script src="https://js.stripe.com/v3/"></script>
```

```javascript
// Location: /website/js/payments/stripe.js

const stripe = Stripe('pk_live_XXXXXX');  // Publishable key only

// Payment flow handled via Stripe Checkout or Payment Links
```

### Payment Flows
| Flow | Implementation |
|------|----------------|
| Program registration | Stripe Payment Links |
| Custom payment | Stripe Checkout |

### Security Notes
- Only publishable key used client-side
- Secret key never exposed
- Webhook verification on backend (if applicable)

---

## Google Analytics 4 (GA4)

### Purpose
- Traffic analytics
- User behavior tracking
- Conversion tracking
- Event measurement

### Implementation
Loaded via Google Tag Manager:

```html
<!-- GTM Container -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');
</script>
```

### Events Tracked
| Event | Trigger | Parameters |
|-------|---------|------------|
| `page_view` | Page load | `page_title`, `page_location` |
| `form_submit` | Form submission | `form_name`, `form_location` |
| `quiz_complete` | Quiz finish | `quiz_name`, `score` |
| `registration_start` | Begin registration | `program_name` |
| `payment_complete` | Payment success | `program_name`, `value` |

---

## Environment Variables

For production, sensitive values should be managed securely:

| Variable | Service | Notes |
|----------|---------|-------|
| `AIRTABLE_API_KEY` | Airtable | Restricted to specific tables |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | Public, safe to expose |
| `GHL_WEBHOOK_URL` | GoHighLevel | Not secret but don't share |
| `GTM_CONTAINER_ID` | GTM | Public |

### Local Development
Create a `.env.local` file (gitignored):
```
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/XXXXXX
```

---

## Testing Integrations

### Airtable
1. Use test base for development
2. Verify records appear in correct tables
3. Check field mapping

### GoHighLevel
1. Use test webhook endpoint
2. Verify contact creation
3. Check automation triggers

### Stripe
1. Use test mode keys
2. Test card: `4242 4242 4242 4242`
3. Verify payment flow completes

### GA4
1. Use GA4 DebugView
2. Verify events fire correctly
3. Check parameter values

---

## Cross-Reference: Business OS

Integration documentation also exists in:
- `/business-os/_system/resources/inventory.md` - MCP server reference
- `/business-os/departments/cto/` - Technical architecture

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Airtable 401 | API key expired or invalid |
| Airtable 422 | Field name mismatch or invalid data type |
| GHL webhook fails | Endpoint URL correct, payload format |
| Stripe error | Check browser console, verify key |
| GA4 not tracking | GTM container ID, ad blockers |

---

## Last Updated

**Date:** 2025-12-27
**By:** Claude
**Changes:** Initial integration documentation
