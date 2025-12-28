# Verify Latest Stripe Test Payment Command

Verify the most recent test payment in Stripe.

## Objective

Find and verify the most recent test mode payment, typically after running a registration test.

## Configuration

- **Mode**: TEST MODE ONLY - never query production
- **Search**: By email pattern or metadata
- **Output**: Payment status, amounts, customer info

---

## CRITICAL GUARDRAILS

1. **TEST MODE ONLY**: This command only queries Stripe test mode
2. **READ-ONLY**: No refunds, captures, or modifications
3. **NO PRODUCTION**: Never access live payment data

---

## Execution Steps

### Phase 1: Search for Payment

Using Stripe MCP:

1. List recent PaymentIntents (last 10, test mode)
2. Filter by criteria:
   - Email pattern: `test+*@local.dev`
   - Or specific email if provided
   - Or metadata if provided

### Phase 2: Verify Payment Details

For the matching payment, verify:

1. **Status**: Should be `succeeded` for completed payments
2. **Amount**: Matches expected registration fee
3. **Customer**: Email matches test pattern
4. **Metadata**: Contains registration info

### Phase 3: Check Related Objects

Retrieve and verify:

1. **Customer** - Was customer created/updated?
2. **Charge** - Was charge successful?
3. **Events** - Were webhooks triggered?

### Phase 4: Display Results

```
# Latest Test Payment Verification

**Search Criteria**: Email pattern `test+*@local.dev`
**Payments Found**: 1

---

## Payment Details

**Payment Intent ID**: pi_xxxxxxxxxxxxxxxx
**Status**: succeeded
**Amount**: $2,375.00 USD
**Created**: 2025-12-18 14:45:00 UTC

---

## Customer
| Field | Value |
|-------|-------|
| Customer ID | cus_xxxxxxxx |
| Email | test+202512181445@local.dev |
| Name | Test User |

---

## Charge
| Field | Value |
|-------|-------|
| Charge ID | ch_xxxxxxxx |
| Status | succeeded |
| Card | Visa •••• 4242 |
| Risk Level | normal |

---

## Metadata
| Key | Value |
|-----|-------|
| program | Certificate in Employee Relations Law |
| format | virtual |
| registrationCode | VI-ER-CHI-1225 |
| source | website |

---

## Webhook Events
| Event | Time | Status |
|-------|------|--------|
| payment_intent.created | 14:44:55 | delivered |
| payment_intent.succeeded | 14:45:00 | delivered |
| charge.succeeded | 14:45:00 | delivered |

---

## Verification Result

**Status**: PASS

All checks passed:
- Payment succeeded
- Amount correct ($2,375.00)
- Customer created
- Webhooks delivered
```

---

## Output Format

Display inline (quick verification):

Success:
```
Stripe Test Payment Verification
================================
Payment: pi_xxxxxxxx
Status: SUCCEEDED
Amount: $2,375.00

Customer: test+202512181445@local.dev
Card: Visa •••• 4242
Metadata: Certificate in Employee Relations Law (virtual)

Webhooks: 3 delivered, 0 failed

VERIFICATION: PASS
```

If payment not found:
```
Stripe Test Payment Verification
================================
No recent test payments found matching criteria.

Search: Email pattern test+*@local.dev
Time range: Last 1 hour

Possible reasons:
1. Payment not completed
2. Different email pattern used
3. Payment older than 1 hour

Try running registration test first:
  npm run qa:registration
```

If payment failed:
```
Stripe Test Payment Verification
================================
Payment: pi_xxxxxxxx
Status: FAILED
Amount: $2,375.00

Error: card_declined
Message: Your card was declined.

Customer: test+202512181445@local.dev
Card: Visa •••• 0002 (decline test card)

VERIFICATION: FAIL - Payment did not succeed
```

---

## Options

- `--email <email>`: Search for specific email
- `--metadata <key=value>`: Search by metadata
- `--id <pi_xxx>`: Verify specific PaymentIntent
- `--hours <n>`: Extend search window (default: 1 hour)

Examples:
```
/stripe-verify-latest-test-payment
/stripe-verify-latest-test-payment --email test+202512181445@local.dev
/stripe-verify-latest-test-payment --id pi_xxxxxxxx
```

---

## Integration with Registration Test

After running registration test:

1. Registration test completes with email `test+202512181445@local.dev`
2. Run `/stripe-verify-latest-test-payment`
3. Verify payment matches expected amount and status
4. Confirm webhooks were delivered

---

## Common Issues

### Payment Not Found
- Check if registration used Stripe (not Invoice)
- Verify test mode is enabled
- Check time window (default 1 hour)

### Payment Failed
- Check test card used (4242... should succeed)
- Verify Stripe publishable key is test mode
- Check for Stripe API errors in console

### Webhooks Not Delivered
- Check webhook endpoint configuration
- Verify webhook signing secret
- Review Vercel function logs

---

## Notes

- Only queries Stripe test mode data
- Safe to run repeatedly (read-only)
- Useful for debugging registration flow
- Can verify payment before checking Airtable record
