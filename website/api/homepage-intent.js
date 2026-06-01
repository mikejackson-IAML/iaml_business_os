// Serverless endpoint for homepage Program Finder and route intent tracking.
// Uses Supabase service role on the server only. The browser posts lightweight events here.

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') out[key] = obj[key];
  }
  return out;
}

function compact(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

function parseIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
}

function browserFamily(ua) {
  ua = String(ua || '');
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Other';
}

function deviceType(ua) {
  ua = String(ua || '').toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

async function supabaseFetch(path, options = {}) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Missing Supabase configuration');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const details = await response.text();
    const error = new Error(details || `Supabase error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const eventType = body.event_type;
    const context = body.context || {};
    const utm = body.utm || {};
    const ua = req.headers['user-agent'] || body.user_agent || null;
    const ip = parseIp(req);

    const shared = {
      anonymous_id: body.anonymous_id || null,
      source_url: context.source_url || req.headers.referer || null,
      page_path: context.page_path || null,
      referrer: context.referrer || null,
      ...pick(utm, ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']),
      device_type: body.device_type || deviceType(ua),
      browser_family: browserFamily(ua),
      user_agent: ua,
      ip_address: body.collect_ip === false ? null : ip,
      metadata: body.metadata || {}
    };

    if (eventType === 'quiz_start') {
      const rows = await supabaseFetch('homepage_quiz_sessions', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          ...shared,
          current_step_reached: body.current_step_reached || 1,
          answers: body.answers || {},
          recommended_program_slug: body.recommended_program_slug || null,
          recommended_track: body.recommended_track || null,
          recommended_format: body.recommended_format || null
        })
      });
      return res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
    }

    if (eventType === 'quiz_answer') {
      if (!body.session_id) return res.status(400).json({ error: 'Missing session_id' });
      const step = Number(body.step_number || 1);
      const questionKey = body.question_key || 'unknown';
      const answerKey = body.answer_key || 'unknown';
      const answerLabel = body.answer_label || null;

      await supabaseFetch('homepage_quiz_answers', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          session_id: body.session_id,
          step_number: step,
          question_key: questionKey,
          answer_key: answerKey,
          answer_label: answerLabel,
          metadata: body.metadata || {}
        })
      });

      const patch = compact({
        current_step_reached: Math.max(step, Number(body.current_step_reached || step)),
        answers: body.answers || { [questionKey]: answerKey },
        recommended_program_slug: body.recommended_program_slug,
        secondary_program_slug: body.secondary_program_slug,
        recommended_track: body.recommended_track,
        recommended_format: body.recommended_format,
        recommendation_confidence: body.recommendation_confidence,
        metadata: body.session_metadata
      });

      const rows = await supabaseFetch(`homepage_quiz_sessions?id=eq.${encodeURIComponent(body.session_id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(patch)
      });
      return res.status(200).json(Array.isArray(rows) ? rows[0] : rows);
    }

    if (eventType === 'quiz_complete') {
      if (!body.session_id) return res.status(400).json({ error: 'Missing session_id' });
      const rows = await supabaseFetch(`homepage_quiz_sessions?id=eq.${encodeURIComponent(body.session_id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          completed: true,
          completed_at: new Date().toISOString(),
          answers: body.answers || {},
          recommended_program_slug: body.recommended_program_slug || null,
          secondary_program_slug: body.secondary_program_slug || null,
          recommended_track: body.recommended_track || null,
          recommended_format: body.recommended_format || null,
          recommendation_confidence: body.recommendation_confidence || null,
          cta_shown: body.cta_shown || null,
          cta_clicked: body.cta_clicked || null,
          metadata: body.metadata || {}
        })
      });
      return res.status(200).json(Array.isArray(rows) ? rows[0] : rows);
    }

    if (eventType === 'route_click') {
      const rows = await supabaseFetch('homepage_route_clicks', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          ...shared,
          quiz_session_id: body.session_id || null,
          route_key: body.route_key || 'unknown',
          route_label: body.route_label || null,
          destination_url: body.destination_url || null
        })
      });
      return res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
    }

    return res.status(400).json({ error: 'Unsupported event_type' });
  } catch (error) {
    console.error('Homepage intent API error:', error);
    return res.status(error.status || 500).json({ error: 'Failed to record homepage intent', details: error.message });
  }
};
