---
name: test-nightly
description: Start nightly workflow testing. Run this before bed and check results with /test-results in the morning.
---

# Start Nightly Workflow Tests

Run automated tests on priority n8n workflows overnight.

## What This Does

1. Tests 3 priority workflows (configurable)
2. Verifies each has error handling pattern
3. Adds `business-os` tag if missing
4. Saves results for morning review

## Default Workflows Tested

| Workflow | Purpose |
|----------|---------|
| Airtable Registrations Sync + GHL | Sales pipeline |
| Smartlead Activity Receiver | Email campaign tracking |
| HeyReach Activity Receiver | LinkedIn tracking |

---

<instructions>

When the user runs `/test-nightly`:

1. **Confirm the run:**
   ```
   Starting nightly workflow tests...

   Workflows to test:
   1. Airtable Registrations Sync + GHL
   2. Smartlead Activity Receiver
   3. HeyReach Activity Receiver

   Results will be saved to: .planning/workflow-tests/results/{today's date}/
   ```

2. **Run the bash script in background:**
   ```bash
   nohup /Users/mike/IAML\ Business\ OS/scripts/test-workflows-nightly.sh > /Users/mike/IAML\ Business\ OS/.planning/workflow-tests/nightly.log 2>&1 &
   ```

3. **Confirm started:**
   ```
   ✓ Nightly tests started in background

   The tests will run for approximately 15-20 minutes.

   Tomorrow morning, run:
     /test-results

   Or check the log now:
     tail -f .planning/workflow-tests/nightly.log
   ```

If the user says "all" or "--all", modify step 2 to add the --all flag.

</instructions>
