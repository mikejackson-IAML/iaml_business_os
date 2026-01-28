---
name: test-nightly
description: Start nightly workflow testing. Run this before bed and check results with /test-results in the morning.
---

# Start Nightly Workflow Tests

Run autonomous tests on ALL unverified n8n workflows overnight, then send an email summary with clickable links for morning verification.

## What This Does

1. Queries Supabase for ALL workflows where `test_status != 'verified'`
2. For each workflow, spawns a **fresh Claude session** running `/test-workflow <id>` (full protocol with clean context)
3. Parses structured result from each session, collects into results JSON
4. Sends HTML email via SendGrid with results table and clickable links

## Email Summary

Sent to `mike.jackson@iaml.com` with:
- Summary stats (X tested, Y passed, Z need manual fix)
- "Ready for Verification" section: workflow name + clickable n8n link
- "Needs Attention" section: workflow name + what went wrong

---

<instructions>

When the user runs `/test-nightly`:

1. **Confirm the run:**
   ```
   Starting nightly workflow tests...

   Mode: Up to 50 unverified workflows per night
   Protocol: Full autonomous testing (phases 1-8)
   Email: Results sent to mike.jackson@iaml.com

   Results will be saved to: .planning/workflow-tests/results/{today's date}/
   ```

2. **Run the bash script in background:**
   ```bash
   nohup /Users/mikejackson/Documents/IAML/iaml_business_os/scripts/test-workflows-nightly.sh --all > /Users/mikejackson/Documents/IAML/iaml_business_os/.planning/workflow-tests/nightly.log 2>&1 &
   ```

3. **Confirm started:**
   ```
   Nightly tests started in background (all unverified workflows).

   The script will:
   - Test each workflow with full RALPH loop
   - Send email summary when complete

   Tomorrow morning, run:
     /test-results

   Or check the log now:
     tail -f .planning/workflow-tests/nightly.log
   ```

</instructions>
