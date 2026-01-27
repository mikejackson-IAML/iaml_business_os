---
name: workflow-queue
description: Claim and test n8n workflows in parallel. Claims a workflow from the queue and automatically runs autonomous testing.
allowed-tools: [Read, Write, Bash, Grep, Glob, Skill, mcp__n8n-mcp__*, mcp__n8n-brain__*]
---

# Workflow Queue - Parallel Testing Coordinator

> Enables multiple Claude sessions to work on different workflows in parallel without conflicts.

## Usage

```
/workflow-queue              # Show queue status and claimed workflows
/workflow-queue claim        # Claim next workflow and start autonomous testing
/workflow-queue release      # Release your current claim
/workflow-queue list         # List all workflows needing work
```

---

<instructions>

## IMPORTANT: Session Identification

Generate a unique session ID for this terminal session. Use format: `session-{random-4-chars}`

Store this in your context and use it for all claiming operations.

---

## Command: /workflow-queue (no args) - Show Status

### Step 1: Get Queue Status

```bash
cd "/Users/mike/IAML Business OS/dashboard" && source ../.env && node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function status() {
  // Get counts
  const { data: all } = await sb.schema('n8n_brain').from('workflow_registry').select('test_status, claimed_by, claimed_at');

  const now = new Date();
  const oneHourAgo = new Date(now - 60*60*1000);

  const counts = {
    broken: 0,
    needs_review: 0,
    untested: 0,
    in_progress: 0,
    verified: 0,
    claimed: 0
  };

  all.forEach(w => {
    if (counts[w.test_status] !== undefined) counts[w.test_status]++;
    if (w.claimed_by && new Date(w.claimed_at) > oneHourAgo) counts.claimed++;
  });

  console.log('## Workflow Queue Status\n');
  console.log('| Status | Count |');
  console.log('|--------|-------|');
  console.log('| Broken (priority 1) | ' + counts.broken + ' |');
  console.log('| Needs Review (priority 2) | ' + counts.needs_review + ' |');
  console.log('| Untested (priority 3) | ' + counts.untested + ' |');
  console.log('| In Progress | ' + counts.in_progress + ' |');
  console.log('| Verified | ' + counts.verified + ' |');
  console.log('| **Currently Claimed** | ' + counts.claimed + ' |');
  console.log('');
  console.log('**Available to claim:** ' + (counts.broken + counts.needs_review + counts.untested - counts.claimed));

  // Show claimed workflows
  const claimed = all.filter(w => w.claimed_by && new Date(w.claimed_at) > oneHourAgo);
  if (claimed.length > 0) {
    const { data: details } = await sb.schema('n8n_brain')
      .from('workflow_registry')
      .select('workflow_name, claimed_by, claimed_at')
      .not('claimed_by', 'is', null)
      .gt('claimed_at', oneHourAgo.toISOString());

    console.log('\n### Currently Claimed\n');
    console.log('| Workflow | Claimed By | Duration |');
    console.log('|----------|------------|----------|');
    details?.forEach(w => {
      const mins = Math.round((now - new Date(w.claimed_at)) / 60000);
      console.log('| ' + w.workflow_name.substring(0,30) + ' | ' + w.claimed_by + ' | ' + mins + ' min |');
    });
  }
}
status();
"
```

### Step 2: Output

Display the status table and suggest:
```
Run `/workflow-queue claim` to claim the next workflow and start testing.
```

---

## Command: /workflow-queue claim - Claim and Test

### Step 1: Generate Session ID (if not already set)

```javascript
const sessionId = 'session-' + Math.random().toString(36).substring(2, 6);
```

Store this - you'll need it for the claim.

### Step 2: Claim Next Workflow

```bash
cd "/Users/mike/IAML Business OS/dashboard" && source ../.env && node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const sessionId = '${SESSION_ID}';

async function claim() {
  const now = new Date();
  const oneHourAgo = new Date(now - 60*60*1000);

  // Release stale claims first
  await sb.schema('n8n_brain')
    .from('workflow_registry')
    .update({ claimed_by: null, claimed_at: null })
    .lt('claimed_at', oneHourAgo.toISOString());

  // Find highest priority unclaimed workflow
  const { data: workflows } = await sb.schema('n8n_brain')
    .from('workflow_registry')
    .select('*')
    .in('test_status', ['broken', 'needs_review', 'untested'])
    .or('claimed_by.is.null,claimed_at.lt.' + oneHourAgo.toISOString())
    .order('test_status', { ascending: true })  // broken < needs_review < untested alphabetically
    .limit(10);

  if (!workflows || workflows.length === 0) {
    console.log('NO_WORKFLOWS_AVAILABLE');
    return;
  }

  // Sort by priority
  const priority = { 'broken': 1, 'needs_review': 2, 'untested': 3 };
  workflows.sort((a, b) => (priority[a.test_status] || 99) - (priority[b.test_status] || 99));

  const target = workflows[0];

  // Claim it
  const { error } = await sb.schema('n8n_brain')
    .from('workflow_registry')
    .update({
      claimed_by: sessionId,
      claimed_at: now.toISOString(),
      test_status: 'in_progress'
    })
    .eq('workflow_id', target.workflow_id);

  if (error) {
    console.log('CLAIM_ERROR:' + error.message);
    return;
  }

  console.log('CLAIMED');
  console.log('WORKFLOW_ID:' + target.workflow_id);
  console.log('WORKFLOW_NAME:' + target.workflow_name);
  console.log('PREVIOUS_STATUS:' + target.test_status);
  console.log('CATEGORY:' + (target.category || 'unknown'));
  console.log('URL:https://n8n.realtyamp.ai/workflow/' + target.workflow_id);
}
claim();
"
```

### Step 3: Parse Result

If output contains `NO_WORKFLOWS_AVAILABLE`:
```
All workflows are either verified or currently claimed by other sessions.

Run `/workflow-queue` to see current status.
```

If output contains `CLAIMED`:
- Extract WORKFLOW_ID, WORKFLOW_NAME from output
- Store these in your context for the session
- Display:
```
## Claimed: {WORKFLOW_NAME}

**ID:** {WORKFLOW_ID}
**Previous Status:** {PREVIOUS_STATUS}
**URL:** {URL}

Starting autonomous testing...
```

### Step 4: Launch Autonomous Testing

**CRITICAL: Invoke the test-workflow-auto skill with the claimed workflow ID**

```
/test-workflow-auto {WORKFLOW_ID}
```

The test-workflow-auto skill will:
1. Analyze the workflow
2. Run tests
3. Diagnose and fix errors
4. Only return when workflow is working or truly unfixable

### Step 5: After Testing Completes

When test-workflow-auto finishes, it will either:

**A) Workflow is working:**
- The skill marks it as `tested` (pending human verification)
- Present verification summary to user
- Ask: "Reply `confirm` to mark verified, `broken` if issues found, or `next` to claim another"

**B) Workflow is unfixable:**
- The skill marks it as `broken` or `needs_review` with notes
- Present the issues to user
- Ask: "Reply `next` to claim another workflow, or investigate manually"

### Step 6: Handle User Response

On `confirm`:
- Mark workflow as `verified`
- Release claim
- Display: "Verified! Run `/workflow-queue claim` for next workflow."

On `broken`:
- Mark workflow as `broken`
- Release claim
- Display: "Marked as broken. Run `/workflow-queue claim` for next workflow."

On `next`:
- Release current claim
- Automatically claim and test next workflow (repeat from Step 2)

---

## Command: /workflow-queue release - Release Claim

### Step 1: Release

```bash
cd "/Users/mike/IAML Business OS/dashboard" && source ../.env && node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const sessionId = '${SESSION_ID}';

async function release() {
  const { data, error } = await sb.schema('n8n_brain')
    .from('workflow_registry')
    .update({
      claimed_by: null,
      claimed_at: null,
      test_status: 'untested'  // Reset if was in_progress
    })
    .eq('claimed_by', sessionId)
    .select('workflow_name');

  if (data && data.length > 0) {
    console.log('RELEASED:' + data[0].workflow_name);
  } else {
    console.log('NO_CLAIM_FOUND');
  }
}
release();
"
```

### Step 2: Confirm

```
Released claim on "{workflow_name}". It's now available for other sessions.
```

---

## Command: /workflow-queue list - Show All Workflows Needing Work

```bash
cd "/Users/mike/IAML Business OS/dashboard" && source ../.env && node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function list() {
  const now = new Date();
  const oneHourAgo = new Date(now - 60*60*1000);

  const { data } = await sb.schema('n8n_brain')
    .from('workflow_registry')
    .select('workflow_id, workflow_name, test_status, category, claimed_by, claimed_at, is_active')
    .in('test_status', ['broken', 'needs_review', 'untested', 'in_progress'])
    .order('test_status');

  const priority = { 'broken': 1, 'needs_review': 2, 'untested': 3, 'in_progress': 4 };
  data.sort((a, b) => (priority[a.test_status] || 99) - (priority[b.test_status] || 99));

  console.log('## Workflows Needing Work (' + data.length + ' total)\n');
  console.log('| Priority | Status | Workflow | Category | Claimed |');
  console.log('|----------|--------|----------|----------|---------|');

  data.forEach((w, i) => {
    const claimed = w.claimed_by && new Date(w.claimed_at) > oneHourAgo ? w.claimed_by : '-';
    const name = w.workflow_name.length > 35 ? w.workflow_name.substring(0,32) + '...' : w.workflow_name;
    console.log('| ' + (i+1) + ' | ' + w.test_status + ' | ' + name + ' | ' + (w.category || '-') + ' | ' + claimed + ' |');
  });
}
list();
"
```

---

## Session State

Throughout the session, maintain:
- `SESSION_ID`: Your unique session identifier
- `CURRENT_WORKFLOW_ID`: The workflow you have claimed (if any)
- `CURRENT_WORKFLOW_NAME`: Human-readable name

When the conversation ends or user runs `/workflow-queue release`, always release the claim.

---

## Parallel Safety

This system ensures parallel safety through:

1. **Atomic claims** - Only one session can claim a workflow
2. **Timeout expiry** - Claims expire after 60 minutes (auto-released)
3. **Session IDs** - Each terminal has unique identifier
4. **Status tracking** - `in_progress` shows which workflows are being worked on

If you see a workflow is claimed by another session, skip it and claim the next one.

</instructions>
