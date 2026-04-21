// Morning digest — fires daily via Vercel Cron.
// Pulls every evaluation completed in the last 24 hours across all programs,
// composes an HTML email (headline summary + action items + per-eval cards
// with raw quotes), and sends to DIGEST_RECIPIENT via SendGrid.
//
// Skips silently if zero completions — no noise on quiet days.
// Protected via CRON_SECRET (Vercel Cron sends it in the Authorization header).

const POSTGREST_HEADERS = (key) => ({
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json'
});

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const npsTierLabel = (t) => ({ promoter: 'Promoter', passive: 'Passive', detractor: 'Detractor' }[t] || '—');
const consentLabel = (c) => ({
  public_full: 'Public (name · title · company)',
  public_name_title: 'Public (name · title)',
  public_anonymous: 'Public (anonymous)',
  internal_only: 'Internal only'
}[c] || null);

async function sbQuery(supabaseUrl, key, query) {
  // Use Supabase Management API? No — we'll use PostgREST queries via the service role.
  // For this endpoint we use the Supabase SQL-over-REST pattern via our own RPC
  // public.eval_digest_completions(since, until).
  const r = await fetch(`${supabaseUrl}/rest/v1/rpc/eval_digest_completions`, {
    method: 'POST',
    headers: POSTGREST_HEADERS(key),
    body: JSON.stringify({ p_since: query.since, p_until: query.until })
  });
  if (!r.ok) throw new Error(`digest RPC failed ${r.status}: ${await r.text()}`);
  return r.json();
}

function windowBounds(now = new Date()) {
  // Query the last 24 hours of completions. Using a rolling window instead of
  // "previous calendar day in ET" keeps this robust against DST and whether
  // the cron fires a few minutes late.
  const until = now.toISOString();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  return { since, until };
}

function renderActionItems(evals) {
  const items = [];

  const callbacks = evals.filter((e) => e.detractor_wants_callback);
  callbacks.forEach((e) => items.push({
    urgency: 'high',
    label: `<strong>Detractor wants a callback.</strong> ${esc(e.full_name)} at ${esc(e.company || 'their organization')} gave NPS ${e.nps_score}. Reach out to ${esc(e.email)}.`
  }));

  const hotLeads = evals.filter((e) => e.has_acute_pain && (e.iaml_intelligence_interest === 'Yes, very interested' || e.iaml_intelligence_interest === "Maybe, tell me more when it's available"));
  hotLeads.forEach((e) => items.push({
    urgency: 'high',
    label: `<strong>Hot lead — IAML Intelligence.</strong> ${esc(e.full_name)} at ${esc(e.company || 'their org')} has an active situation and opted into Intelligence updates (${esc(e.iaml_intelligence_interest)}).`
  }));

  const videoOK = evals.filter((e) => e.video_testimonial_ok);
  videoOK.forEach((e) => items.push({
    urgency: 'medium',
    label: `<strong>Video testimonial consent.</strong> ${esc(e.full_name)} at ${esc(e.company || 'their org')} opted in to video.`
  }));

  const referrers = evals.filter((e) => (e.referral_count || 0) > 0);
  referrers.forEach((e) => items.push({
    urgency: 'medium',
    label: `<strong>${e.referral_count} referral${e.referral_count > 1 ? 's' : ''}</strong> from ${esc(e.full_name)} at ${esc(e.company || 'their org')}.`
  }));

  return items;
}

function renderEvalCard(e) {
  const metaRows = [];
  const add = (label, val) => { if (val != null && val !== '') metaRows.push([label, val]); };
  add('Program', e.program_name);
  add('Cohort', e.instance_name);
  add('NPS', `${e.nps_score ?? '—'} (${npsTierLabel(e.nps_tier)})`);
  add('Expectations', e.q4_expectations);
  add('Pacing', e.q6_pacing);
  if (e.instructor_avg != null) add('Instructor avg', `${Number(e.instructor_avg).toFixed(1)}/5`);
  add('Decision-maker', e.decision_maker_tier);
  add('Budget cycle', e.budget_cycle_quarter);
  add('IAML Intelligence', e.iaml_intelligence_interest);
  if (consentLabel(e.testimonial_consent_tier)) {
    const v = consentLabel(e.testimonial_consent_tier) + (e.video_testimonial_ok ? ' · 🎥 video OK' : '');
    add('Testimonial consent', v);
  }
  if ((e.referral_count || 0) > 0) add('Referrals', `${e.referral_count} name${e.referral_count > 1 ? 's' : ''}`);

  const metaHtml = metaRows.map(([k, v]) =>
    `<tr><td style="padding:4px 14px 4px 0;color:#6b7280;font-size:13px;white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;color:#1a1a2e;font-size:13px;">${esc(v)}</td></tr>`
  ).join('');

  const quoteBlock = (label, val) => val ? `
    <div style="margin:12px 0;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;margin-bottom:4px;">${esc(label)}</div>
      <blockquote style="margin:0;padding:10px 14px;background:#f8f9fa;border-left:3px solid #188BF6;color:#1a1a2e;font-size:14px;line-height:1.5;white-space:pre-wrap;">${esc(val)}</blockquote>
    </div>` : '';

  const quotes = [
    ['Most valuable (Q8)', e.q8_most_valuable],
    ['Could be improved (Q9)', e.q9_could_improve],
    ['Missing topic (Q10)', e.q10_missing_topic],
    ['Instructor feedback (Q12)', e.q12_instructor_feedback],
    ['Hardest situation (Q16)', e.q16_hardest_situation],
    ['Other HR/law topics (Q19)', e.q19_other_topics],
    ['Most valuable to a promoter (Q25a)', e.q25a_valuable],
    ['30–60 day plan (Q26a)', e.q26a_work_plan],
    ['What would have been better (Q25b)', e.q25b_better],
    ['One change (Q28)', e.q28_one_change],
    ['Almost stopped them (Q29)', e.q29_almost_stopped],
    ['Anything else (Q31)', e.q31_anything_else]
  ].map(([label, val]) => quoteBlock(label, val)).join('');

  return `
<div style="margin:24px 0;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:white;">
  <div style="margin-bottom:12px;">
    <div style="font-size:17px;font-weight:600;color:#1a1a2e;">${esc(e.full_name || '(name missing)')} </div>
    <div style="font-size:13px;color:#6b7280;">${esc([e.job_title, e.company].filter(Boolean).join(' · '))}</div>
    <div style="font-size:12px;color:#9ca3af;margin-top:2px;">Submitted ${esc(new Date(e.completed_at).toLocaleString('en-US', { timeZone: 'America/New_York', timeStyle: 'short', dateStyle: 'medium' }))} ET</div>
  </div>
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:12px 0;">
    ${metaHtml}
  </table>
  ${quotes}
</div>`;
}

function renderEmail({ evals, actionItems, windowLabel }) {
  const total = evals.length;
  const counts = { promoter: 0, passive: 0, detractor: 0 };
  const nps = [];
  evals.forEach((e) => {
    if (e.nps_tier && counts[e.nps_tier] != null) counts[e.nps_tier]++;
    if (typeof e.nps_score === 'number') nps.push(e.nps_score);
  });
  const npsAvg = nps.length ? (nps.reduce((a, b) => a + b, 0) / nps.length).toFixed(1) : '—';

  const summaryBits = [];
  summaryBits.push(`<strong>${total}</strong> response${total === 1 ? '' : 's'}`);
  summaryBits.push(`NPS avg <strong>${npsAvg}</strong>`);
  const tierBits = [];
  if (counts.promoter) tierBits.push(`${counts.promoter} promoter${counts.promoter > 1 ? 's' : ''}`);
  if (counts.passive) tierBits.push(`${counts.passive} passive`);
  if (counts.detractor) tierBits.push(`${counts.detractor} detractor${counts.detractor > 1 ? 's' : ''}`);
  if (tierBits.length) summaryBits.push(tierBits.join(' · '));

  const actionHtml = actionItems.length === 0 ? '' : `
<div style="margin:16px 0 24px;padding:16px 18px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;">
  <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#92400e;font-weight:700;margin-bottom:8px;">Action items</div>
  <ul style="margin:0;padding-left:18px;line-height:1.6;color:#1a1a2e;font-size:14px;">
    ${actionItems.map((a) => `<li style="margin:4px 0;">${a.label}</li>`).join('')}
  </ul>
</div>`;

  const cardsHtml = evals.map(renderEvalCard).join('');

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Arial, sans-serif; max-width:720px; margin:0 auto; padding:24px; color:#1a1a2e; background:#ffffff;">
  <div style="border-bottom:1px solid #e5e7eb; padding-bottom:16px; margin-bottom:20px;">
    <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280;">IAML morning digest</div>
    <h1 style="font-family:Georgia,serif; font-size:24px; margin:6px 0 0;">${esc(windowLabel)}</h1>
    <div style="margin-top:6px; font-size:15px; color:#1a1a2e;">${summaryBits.join(' · ')}</div>
  </div>

  ${actionHtml}

  ${cardsHtml}

  <div style="margin-top:32px; font-size:12px; color:#9ca3af; text-align:center;">Generated from iaml_evaluations · unsubscribe by pausing the eval-morning-digest Vercel Cron</div>
</div>`;
}

module.exports = async function handler(req, res) {
  // Vercel Cron passes `Authorization: Bearer <CRON_SECRET>` from the project env.
  const expected = process.env.CRON_SECRET;
  const received = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!expected) {
    return res.status(500).json({ error: 'CRON_SECRET not configured' });
  }
  if (received !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const RECIPIENT = process.env.DIGEST_RECIPIENT;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SENDGRID_API_KEY || !RECIPIENT) {
    return res.status(500).json({ error: 'Missing required env vars' });
  }

  try {
    const { since, until } = windowBounds(new Date());
    const evals = await sbQuery(SUPABASE_URL, SUPABASE_SERVICE_KEY, { since, until });

    if (!Array.isArray(evals) || evals.length === 0) {
      return res.status(200).json({ sent: false, reason: 'no_completions', window: { since, until } });
    }

    const actionItems = renderActionItems(evals);

    // Label the window in ET so the subject line makes sense to a human.
    const windowLabel = new Date(since).toLocaleDateString('en-US', {
      timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric'
    });

    const html = renderEmail({ evals, actionItems, windowLabel });
    const subjectSuffix = actionItems.length ? ` · ${actionItems.length} action item${actionItems.length > 1 ? 's' : ''}` : '';
    const subject = `Morning digest: ${evals.length} evaluation${evals.length === 1 ? '' : 's'} yesterday${subjectSuffix}`;

    const sg = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: RECIPIENT }] }],
        from:     { email: 'phoebe.harper@iaml.com', name: 'IAML Digest' },
        reply_to: { email: 'phoebe.harper@iaml.com', name: 'Phoebe Harper' },
        subject,
        content: [{ type: 'text/html', value: html }],
        categories: ['eval', 'digest']
      })
    });

    if (sg.status !== 202) {
      const body = await sg.text();
      return res.status(500).json({ error: 'SendGrid failed', status: sg.status, body: body.slice(0, 400) });
    }

    return res.status(200).json({
      sent: true,
      count: evals.length,
      action_items: actionItems.length,
      recipient: RECIPIENT,
      window: { since, until }
    });
  } catch (err) {
    console.error('eval-morning-digest error', err);
    return res.status(500).json({ error: err.message });
  }
};
