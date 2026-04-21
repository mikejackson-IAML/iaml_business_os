// Serverless function: submit answers for the current phase.
// POST /api/eval-phase-submit   Body: { token, phase, answers }
//
// Flow:
//   1. Call public.eval_submit_phase RPC — DB owns validation + state transition.
//   2. On success, call public.eval_pending_embeddings to find open-text rows
//      still needing vectors.
//   3. If OPENAI_API_KEY is set and there are pending rows, batch-embed via
//      OpenAI text-embedding-3-small and call public.eval_apply_embeddings.
//   4. Return to client. Embedding failures are non-blocking — the row stays
//      with embedding=NULL and can be backfilled by an admin script.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOTAL_PHASES = 5;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMS = 1536;

function sbRpc(url, key, fn, body) {
  return fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

async function generateEmbeddings(pendingRows, openaiKey) {
  if (!Array.isArray(pendingRows) || pendingRows.length === 0) return {};

  const inputs = pendingRows.map((r) => r.answer_text);
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs })
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`OpenAI embeddings failed: ${r.status} ${err}`);
  }
  const data = await r.json();
  if (!Array.isArray(data.data) || data.data.length !== pendingRows.length) {
    throw new Error('OpenAI embeddings returned unexpected shape');
  }

  const result = {};
  for (let i = 0; i < pendingRows.length; i++) {
    const emb = data.data[i].embedding;
    if (!Array.isArray(emb) || emb.length !== EMBEDDING_DIMS) continue;
    result[pendingRows[i].response_id] = emb;
  }
  return result;
}

async function handleEmbeddings(supabaseUrl, supabaseKey, openaiKey, token) {
  if (!openaiKey) {
    console.log('eval-phase-submit: no OPENAI_API_KEY set, skipping embeddings');
    return { skipped: 'no_api_key' };
  }
  try {
    const pendingR = await sbRpc(supabaseUrl, supabaseKey, 'eval_pending_embeddings', { p_token: token });
    if (!pendingR.ok) {
      console.error('eval_pending_embeddings failed', pendingR.status);
      return { error: 'pending_rpc_failed' };
    }
    const pending = await pendingR.json();
    if (!Array.isArray(pending) || pending.length === 0) return { embedded: 0 };

    const mapping = await generateEmbeddings(pending, openaiKey);
    if (Object.keys(mapping).length === 0) return { embedded: 0 };

    const applyR = await sbRpc(supabaseUrl, supabaseKey, 'eval_apply_embeddings', {
      p_token: token,
      p_embeddings: mapping
    });
    if (!applyR.ok) {
      console.error('eval_apply_embeddings failed', applyR.status, await applyR.text());
      return { error: 'apply_rpc_failed' };
    }
    const applied = await applyR.json();
    return { embedded: typeof applied === 'number' ? applied : Object.keys(mapping).length };
  } catch (err) {
    console.error('eval-phase-submit: embedding pipeline error', err);
    return { error: err.message };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('eval-phase-submit: missing Supabase configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { token, phase, answers } = req.body || {};

  if (!UUID_RE.test(token || '')) {
    return res.status(400).json({ error: 'Invalid or missing token' });
  }
  if (!Number.isInteger(phase) || phase < 1 || phase > TOTAL_PHASES) {
    return res.status(400).json({ error: 'Invalid phase' });
  }
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers must be an object keyed by question_id' });
  }

  try {
    const r = await sbRpc(SUPABASE_URL, SUPABASE_SERVICE_KEY, 'eval_submit_phase', {
      p_token: token, p_phase: phase, p_answers: answers
    });
    const body = await r.json().catch(() => null);

    if (!r.ok) {
      if (r.status === 400 && body && typeof body.message === 'string' && body.message.includes('missing_required')) {
        let missing = [];
        try {
          const detail = JSON.parse(body.details || '{}');
          if (Array.isArray(detail.missing)) missing = detail.missing;
        } catch (_) { /* ignore */ }
        return res.status(400).json({ error: 'Missing required answers', missing });
      }
      console.error('eval_submit_phase RPC error', r.status, body);
      return res.status(500).json({ error: 'Failed to save evaluation' });
    }

    const row = Array.isArray(body) ? body[0] : body;
    if (!row) return res.status(500).json({ error: 'Empty RPC response' });

    if (row.ok === false) {
      const code = row.error_code;
      const statusMap = { not_found: 404, already_complete: 409, phase_mismatch: 409, invalid_answers: 400 };
      return res.status(statusMap[code] || 400).json({
        error: code || 'Submission rejected',
        ...(row.error_detail || {})
      });
    }

    const embedResult = await handleEmbeddings(SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY, token);

    return res.status(200).json({
      ok: true,
      submitted_phase: row.submitted_phase,
      next_phase: row.next_phase,
      status: row.status,
      total_phases: row.total_phases,
      embeddings: embedResult
    });
  } catch (err) {
    console.error('eval-phase-submit unexpected error', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};
