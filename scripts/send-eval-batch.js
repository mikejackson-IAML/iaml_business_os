// Direct-send fallback for the Atlanta CLR cohort.
// Pulls the queue from eval_get_ready_to_send(), sends each via SendGrid, marks each sent.
// Mirrors exactly what the n8n workflow should do once we figure out why it's erroring.

const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('/Users/mike/Documents/IAML/iaml_business_os/.env.local', 'utf8');
const SG_KEY = (env.match(/^SENDGRID_API_KEY=(.+)$/m) || [])[1]?.trim();
const SUPA_URL = 'https://mnkuffgxemfyitcjnjdc.supabase.co';
// Read SUPABASE_SERVICE_ROLE_KEY from website/.env.vercel (the only place it lives locally).
const venv = fs.readFileSync('/Users/mike/Documents/IAML/iaml_business_os/website/.env.vercel', 'utf8');
const SRV_KEY = (venv.match(/^SUPABASE_SERVICE_ROLE_KEY="?([^"]+)"?$/m) || [])[1]?.trim();

if (!SG_KEY || !SRV_KEY) { console.error('missing keys'); process.exit(1); }

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    req.on('error', reject);
    req.write(payload); req.end();
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildSignatureHtml() {
  return `
<main style="font-family: Inter, Arial, sans-serif; font-size: 16px;">
  <table style="padding:0px;margin:10px 0;border:none"><tbody><tr>
    <td style="vertical-align:middle;padding:10px 7px 0 0">
      <p style="line-height: 1.5;"><img style="height: 75px;width: 75px;" alt="Company logo" height="75"
        src="https://storage.googleapis.com/signaturesatori/customer-C043gkzsd/images/companyLogo/KBouH.png" width="75"></p>
    </td>
    <td style="border-left:3px solid #dddddd;padding:7px 0 0 10px;font-family:arial,sans-serif;font-size:12px;line-height:14px;color:#555555">
      <div style="margin-bottom:10px"><p style="line-height:1.5;"><strong><span style="font-size:14px;color:rgb(255,152,0)">Phoebe Harper</span></strong><br>Director of Operations</p></div>
      <div style="margin-bottom:10px"><p style="line-height:1.5;"><span style="color:rgb(0,102,255)">Phone: (949) 760-1700</span></p></div>
      <div><p style="line-height:1.5;"><strong>Institute for Applied Management &amp; Law, Inc.</strong><br>1024 Bayside Dr., Suite 172<br>Newport Beach, CA 92660<br><a href="https://www.iaml.com"><span style="color:rgb(0,102,255)">www.iaml.com</span></a></p></div>
    </td>
  </tr></tbody></table>
</main>`;
}

function sigText() {
  return '\n\nPhoebe Harper\nDirector of Operations\nPhone: (949) 760-1700\nInstitute for Applied Management & Law, Inc.\n1024 Bayside Dr., Suite 172\nNewport Beach, CA 92660\nwww.iaml.com';
}

function buildEmail(row) {
  const firstName = (row.first_name || '').trim() || 'there';
  const programName = row.program_name || 'your IAML program';
  const city = (row.city || '').trim();
  const instructorFirst = (row.instructor_first_name || '').trim();
  const url = `https://iaml.com/evaluation.html?token=${row.resume_token}`;
  const subject = city ? `Your feedback on this week's program in ${city}` : `Your ${programName} evaluation`;

  let contextClause;
  if (instructorFirst && city) contextClause = `${programName} with ${instructorFirst} in ${city}`;
  else if (city)                contextClause = `${programName} in ${city}`;
  else if (instructorFirst)     contextClause = `${programName} with ${instructorFirst}`;
  else                          contextClause = programName;

  const text = `Hi ${firstName},\n\nNow that you've wrapped up ${contextClause}, I'd appreciate your feedback on the program. Takes about five minutes.\n\nOpen your evaluation:\n${url}\n\nYour responses shape how we teach the next cohort, and flag anything our team should follow up on with you. The link is unique to you and saves as you go, so pause and return whenever works.\n\nThanks,${sigText()}`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e; padding: 24px; line-height: 1.55;">
  <p style="font-size: 16px; margin: 0 0 16px;">Hi ${escapeHtml(firstName)},</p>
  <p style="font-size: 16px; margin: 0 0 16px;">Now that you&rsquo;ve wrapped up <strong>${escapeHtml(contextClause)}</strong>, I&rsquo;d appreciate your feedback on the program. Takes about five minutes.</p>
  <p style="margin: 24px 0;">
    <a href="${escapeHtml(url)}" style="display: inline-block; padding: 13px 24px; background: #188BF6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Open your evaluation</a>
  </p>
  <p style="font-size: 16px; margin: 0 0 16px;">Your responses shape how we teach the next cohort, and flag anything our team should follow up on with you. The link is unique to you and saves as you go, so pause and return whenever works.</p>
  <p style="font-size: 16px; margin: 0 0 8px;">Thanks,</p>
  ${buildSignatureHtml()}
</div>`;

  return { subject, text, html };
}

(async () => {
  console.log('=== 1. Pull queue from Supabase ===');
  const q = await postJson(`${SUPA_URL}/rest/v1/rpc/eval_get_ready_to_send`,
    { p_limit: 100 },
    { 'apikey': SRV_KEY, 'Authorization': `Bearer ${SRV_KEY}` });
  if (q.status !== 200) { console.error('RPC fail', q.status, q.body); process.exit(1); }
  const rows = JSON.parse(q.body);
  console.log(`  ${rows.length} rows in queue`);

  const results = [];
  for (const row of rows) {
    const { subject, text, html } = buildEmail(row);
    const payload = {
      personalizations: [{ to: [{ email: row.email, name: `${row.first_name || ''} ${row.last_name || ''}`.trim() }] }],
      from:     { email: 'phoebe.harper@iaml.com', name: 'Phoebe Harper' },
      reply_to: { email: 'phoebe.harper@iaml.com', name: 'Phoebe Harper' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html',  value: html }
      ],
      categories: ['eval', 'clr-block1'],
      custom_args: { evaluation_id: row.evaluation_id }
    };

    console.log(`  → ${row.email} (${row.first_name} ${row.last_name})`);
    const sg = await postJson('https://api.sendgrid.com/v3/mail/send', payload,
      { 'Authorization': `Bearer ${SG_KEY}` });
    const ok = sg.status === 202;
    console.log(`     sendgrid HTTP ${sg.status} msgId=${sg.headers['x-message-id'] || '-'}`);

    // Mark in Supabase
    const mark = await postJson(`${SUPA_URL}/rest/v1/rpc/eval_mark_email_sent`,
      { p_evaluation_id: row.evaluation_id, p_success: ok, p_error: ok ? null : `SendGrid ${sg.status}: ${sg.body.slice(0,200)}` },
      { 'apikey': SRV_KEY, 'Authorization': `Bearer ${SRV_KEY}` });
    if (mark.status >= 300) console.error('     mark FAILED', mark.status, mark.body);

    results.push({ email: row.email, ok, status: sg.status });
  }

  console.log('\n=== Summary ===');
  const okCount = results.filter(r => r.ok).length;
  console.log(`  ${okCount}/${results.length} sent successfully`);
  results.filter(r => !r.ok).forEach(r => console.log(`  FAIL: ${r.email} (HTTP ${r.status})`));
})();
