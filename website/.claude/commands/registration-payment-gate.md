# Registration + Payment Gate Command

End-to-end gate: Run registration test AND verify Stripe payment.

## Objective

Complete validation that:
1. Registration flow completes successfully
2. Stripe payment is processed correctly
3. Webhook events are delivered
4. All systems are working together

## Configuration

- **Base URL**: Configurable (local, preview, or production)
- **Payment**: Stripe test mode only
- **Output**: Single PASS/FAIL gate result

---

## CRITICAL GUARDRAILS

1. **TEST MODE ONLY**: Uses Stripe test cards
2. **NO PRODUCTION CHARGES**: Never runs against live Stripe
3. **TEST DATA**: Creates records with `test+*@local.dev` emails

---

## Execution Steps

### Phase 1: Setup

1. Determine target environment:
   - Local: `http://localhost:3000`
   - Preview: Get from Vercel MCP
   - Custom: Use provided URL

2. Generate unique test email: `test+YYYYMMDDHHMM@local.dev`

3. Verify environment is ready:
   - Server is accessible
   - Stripe test mode is configured

### Phase 2: Run Registration Test

Using Playwright MCP:

1. Navigate to `/register.html`
2. Complete registration flow:
   - Select format (Virtual - faster for testing)
   - Select program (first available)
   - Select session (first available)
   - Fill contact info with test data
   - Select Credit Card payment
   - Fill Stripe test card: 4242 4242 4242 4242
   - Submit registration

3. Capture:
   - Console errors
   - Network failures
   - Test email used
   - Registration confirmation

4. Verify confirmation page shows "Payment Successful"

### Phase 3: Verify Stripe Payment

Using Stripe MCP:

1. Search for PaymentIntent with test email
2. Verify:
   - Status: `succeeded`
   - Amount: Matches expected
   - Customer: Created with test email

3. Check metadata matches registration:
   - Program name
   - Format
   - Registration code

### Phase 4: Verify Webhook Delivery

Using Stripe MCP:

1. Find events for this PaymentIntent
2. Verify webhooks delivered:
   - `payment_intent.created`
   - `payment_intent.succeeded`
   - `charge.succeeded`

### Phase 5: Generate Gate Result

```
# Registration + Payment Gate Result

**Date**: [YYYY-MM-DD HH:MM:SS]
**Environment**: https://iaml-preview-abc123.vercel.app (preview)
**Test Email**: test+202512181445@local.dev

---

## Gate Status: PASS / FAIL

---

## Step 1: Registration Flow

| Step | Status | Time |
|------|--------|------|
| Navigate to register | PASS | 1.2s |
| Select format | PASS | 0.3s |
| Select program | PASS | 0.4s |
| Select session | PASS | 0.5s |
| Fill contact info | PASS | 0.8s |
| Fill payment | PASS | 1.5s |
| Submit | PASS | 2.1s |
| Confirmation | PASS | - |

**Total Time**: 6.8 seconds
**Console Errors**: 0
**Network Failures**: 0

---

## Step 2: Stripe Payment Verification

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| PaymentIntent found | Yes | Yes | PASS |
| Status | succeeded | succeeded | PASS |
| Amount | $2,375.00 | $2,375.00 | PASS |
| Customer email | test+...@local.dev | test+202512181445@local.dev | PASS |

**Payment Intent ID**: pi_xxxxxxxx
**Charge ID**: ch_xxxxxxxx

---

## Step 3: Webhook Verification

| Event | Status | Delivery |
|-------|--------|----------|
| payment_intent.created | delivered | 45ms |
| payment_intent.succeeded | delivered | 52ms |
| charge.succeeded | delivered | 48ms |

---

## Step 4: Metadata Match

| Field | Expected | Actual | Match |
|-------|----------|--------|-------|
| program | Certificate in Employee Relations Law | Certificate in Employee Relations Law | PASS |
| format | virtual | virtual | PASS |
| source | website | website | PASS |

---

## Summary

**GATE STATUS: PASS**

All checks passed:
- Registration flow completed
- Payment succeeded
- Webhooks delivered
- Metadata verified

This deployment is ready for production.

---

## Test Artifacts

- Screenshot: qa/screenshots/registration/gate-confirm-[ts].png
- Test email: test+202512181445@local.dev
- Payment ID: pi_xxxxxxxx
```

---

## Output Format

Quick summary for CI/automation:

PASS:
```
Registration + Payment Gate: PASS
=================================
Environment: preview (https://iaml-abc123.vercel.app)
Duration: 8.2 seconds

Registration: PASS (6.8s)
Payment: PASS (pi_xxxxxxxx - $2,375.00)
Webhooks: PASS (3/3 delivered)

GATE PASSED - Ready for production
```

FAIL:
```
Registration + Payment Gate: FAIL
=================================
Environment: preview (https://iaml-abc123.vercel.app)
Duration: 12.5 seconds

Registration: PASS (6.8s)
Payment: FAIL
Webhooks: N/A

FAILURE REASON:
Payment verification failed - PaymentIntent status is 'requires_action'
Expected: 'succeeded'

Possible causes:
1. 3D Secure triggered unexpectedly
2. Test card requires additional action
3. Payment flow incomplete

Debug steps:
1. Check Stripe Dashboard for payment details
2. Review browser console during registration
3. Verify Stripe.js version is current
```

---

## Options

- `--local`: Run against http://localhost:3000 (default)
- `--preview`: Run against latest Vercel preview
- `--prod`: Run against production (USES TEST MODE STRIPE)
- `--url <url>`: Run against specific URL

Examples:
```
/registration-payment-gate               # Local
/registration-payment-gate --preview     # Latest preview
/registration-payment-gate --url https://iaml-abc123.vercel.app
```

---

## Exit Codes (for CI)

- **0 (PASS)**: All checks passed
- **1 (FAIL)**: Any check failed
- **2 (ERROR)**: Unable to complete (environment issue)

---

## Integration with Daily Automation

This is the core gate for daily automation:

```yaml
# In daily-preview-registration.yml
- name: Run registration payment gate
  run: npm run qa:registration
  env:
    BASE_URL: ${{ steps.preview.outputs.url }}

- name: Verify Stripe payment
  run: # Stripe verification logic
```

---

## Cleanup (Optional)

Test data created:
- Airtable: Contact, Company, Registration records
- Stripe: Customer, PaymentIntent, Charge

These can be identified by:
- Email pattern: `test+*@local.dev`
- Metadata: `source: website, test: true`

Consider periodic cleanup of test data in staging Airtable base.

---

## Notes

- This is the most comprehensive end-to-end test
- Validates the complete happy path
- Should pass before any production deployment
- Failure here indicates a regression that would affect real users
