# GHL Approval Request Drip Handoff

Purpose: follow up with a website visitor who uses the IAML "Create Approval Request" modal before registration. The modal still gives the visitor copyable manager-approval text immediately; this workflow keeps the request in Supabase and starts a light approval-support sequence in GoHighLevel.

## Trigger

Start the GHL workflow when a contact is created or updated with all of these signals:

- `lead_type_approval_request`
- `approval_request_created`
- `drip_approval_support_start`
- `source_iaml_website`

Program-specific routing can use:

- `program_slug_employee-relations-law`
- `program_slug_advanced-employment-law`
- `program_slug_workplace-investigations`
- `program_interest_employee_relations_law`
- `program_interest_advanced_employment_law`
- `program_interest_workplace_investigations`
- `program_family_employment_law`
- `program_family_investigations`

The website API also sends `dripCampaign: approval_support` and `inquiryType: approval_request` in the GHL webhook payload.

## Contact fields supplied by website API

- email
- firstName, lastName
- company
- source: `IAML Website Approval Request`
- contactType: `lead`
- inquiryType: `approval_request`
- programSlug
- programName
- attendancePreference
- businessReason
- approvalContext
- approvalText
- dripCampaign: `approval_support`
- pageUrl, pagePath, referrer
- utmSource, utmMedium, utmCampaign, utmContent, utmTerm
- approvalRequestId from Supabase when persistence succeeds

## Recommended sequence

Tone: helpful approval support, not a hard registration push. CTA language should stay soft: "send program details," "share the brochure," "reply with the approval question," or "complete registration when approved."

1. Immediate email: "Your approval request is ready"
   - Confirm the approval-request text was generated.
   - Include the program name and brochure link.
   - Offer to help answer manager or finance questions.
   - CTA: copy/send the request or reply with the approval concern.

2. Day 2 email: "If your manager asks about business impact"
   - Provide three concise business-impact bullets aligned to `businessReason` when available.
   - Include program details and continuing-credit/team-training context.
   - CTA: "Want a shorter version for your manager? Reply and I’ll help tighten it."

3. Day 5 email: "Need anything for approval?"
   - Ask whether they need W-9/invoice, brochure, agenda, credit details, or employer approval language.
   - Mention invoice/PO approval is available as secondary path; card/Stripe remains primary registration path.
   - CTA: "Tell us what your approver needs."

4. Day 9 email: "Ready when approval is in"
   - Link to the correct registration page for `programSlug`.
   - Keep urgency factual only if dates/pricing are known in GHL fields.
   - CTA: "Register" or "send program details."

5. Exit rules
   - Stop sequence if contact registers, replies, is manually moved to active opportunity, or unsubscribes.
   - Add internal task if contact clicks registration link twice without registering.

## Internal notes

- Supabase is the source of truth: table `public.approval_requests`.
- GHL should use tags/workflow status for sequence state; do not rely only on email opens.
- If the GHL webhook fails, website API returns a partial failure after Supabase persistence so the record is not lost.
- Before activating externally, verify the GHL workflow maps these tags and fields exactly as sent by `/api/approval-request`.
