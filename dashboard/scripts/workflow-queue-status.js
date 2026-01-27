const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function status() {
  const { data: all } = await sb.schema('n8n_brain').from('workflow_registry').select('test_status, claimed_by, claimed_at');

  const now = new Date();
  const oneHourAgo = new Date(now - 60*60*1000);

  const counts = { broken: 0, needs_review: 0, untested: 0, in_progress: 0, verified: 0, claimed: 0 };

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
}
status();
