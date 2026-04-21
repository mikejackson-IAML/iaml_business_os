// Serverless function: load an evaluation session by resume token.
// GET /api/eval-load?token=<uuid>
// Thin wrapper around public.eval_get_by_token() — the DB function owns all logic.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('eval-load: missing Supabase configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const token = (req.query && req.query.token) || '';
  if (!UUID_RE.test(token)) {
    return res.status(400).json({ error: 'Invalid or missing token' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/eval_get_by_token`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_token: token })
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('eval-load RPC failed', r.status, err);
      return res.status(500).json({ error: 'Failed to load evaluation' });
    }

    const rows = await r.json();
    const row = Array.isArray(rows) ? rows[0] : rows;

    if (!row || !row.evaluation_id) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    return res.status(200).json({
      evaluation_id: row.evaluation_id,
      status: row.status,
      current_phase: row.current_phase,
      total_phases: 5,
      program_code: row.program_code,
      block_code: row.block_code,
      program_name: row.program_name,
      instance_name: row.instance_name,
      questions: row.questions || [],
      existing_answers: row.existing_answers || {}
    });
  } catch (err) {
    console.error('eval-load unexpected error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
