// Serverless function to persist approval-request modal submissions and route them to GoHighLevel.
// Source of truth: Supabase table public.approval_requests.
// CRM/drip trigger: GoHighLevel contact webhook with approval-request tags.

if (!(process.env.SUPABASE_URL || process.env.GHL_CONTACT_US_WEBHOOK || process.env.GHL_CONTACT_WEBHOOK) && process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
      });
    }
  } catch (_) {
    // Local env loading is best-effort only.
  }
}

const PROGRAM_TAGS = {
  'employee-relations-law': ['program_interest_employee_relations_law', 'program_family_employment_law'],
  'advanced-employment-law': ['program_interest_advanced_employment_law', 'program_family_employment_law'],
  'workplace-investigations': ['program_interest_workplace_investigations', 'program_family_investigations'],
  'strategic-hr-leadership': ['program_interest_strategic_hr_leadership', 'program_family_hr_leadership'],
  'managers-supervisors-employment-law-training': ['program_interest_managers_supervisors', 'program_family_manager_training']
};

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeProgramSlug(data) {
  const explicit = slugify(data.programSlug || data.program_slug);
  if (explicit) return explicit;
  const pagePath = cleanString(data.pagePath || data.page_path);
  const match = pagePath.match(/\/programs\/([^/.]+)/);
  if (match) return slugify(match[1].replace(/-b3b-preview$/, ''));
  return slugify(data.programName || data.program_name || 'unknown-program');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildTags(data, programSlug) {
  const providedTags = Array.isArray(data.tags) ? data.tags : [];
  return unique([
    'source_iaml_website',
    'lead_type_approval_request',
    'approval_request_created',
    'intent_internal_approval_support',
    'web_form_approval_request',
    'drip_approval_support_start',
    `program_slug_${programSlug}`,
    ...(PROGRAM_TAGS[programSlug] || []),
    ...providedTags.map(slugify)
  ]);
}

async function postJson(url, serviceKey, table, payload) {
  return fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const data = body.data || body;
    const dryRun = Boolean(body.dryRun) && process.env.NODE_ENV !== 'production';

    const email = cleanString(data.email);
    if (!email) return res.status(400).json({ error: 'Missing required field: email' });

    const programSlug = normalizeProgramSlug(data);
    const tags = buildTags(data, programSlug);
    const submittedAt = new Date().toISOString();
    const approvalText = cleanString(data.approvalText || data.approval_text);

    const supabaseRecord = {
      email,
      name: cleanString(data.name) || null,
      organization: cleanString(data.organization) || null,
      program_slug: programSlug,
      program_name: cleanString(data.programName || data.program_name) || null,
      attendance_preference: cleanString(data.attendance || data.attendancePreference || data.attendance_preference) || null,
      business_reason: cleanString(data.challenge || data.businessReason || data.business_reason) || null,
      context: cleanString(data.context) || null,
      approval_text: approvalText || null,
      page_url: cleanString(data.pageUrl || data.page_url) || null,
      page_path: cleanString(data.pagePath || data.page_path) || null,
      referrer: cleanString(data.referrer) || null,
      utm_source: cleanString(data.utmSource || data.utm_source) || null,
      utm_medium: cleanString(data.utmMedium || data.utm_medium) || null,
      utm_campaign: cleanString(data.utmCampaign || data.utm_campaign) || null,
      utm_content: cleanString(data.utmContent || data.utm_content) || null,
      utm_term: cleanString(data.utmTerm || data.utm_term) || null,
      tags,
      drip_campaign: 'approval_support',
      submitted_at: submittedAt,
      metadata: {
        source: 'approval_request_modal',
        userAgent: cleanString(req.headers['user-agent']),
        ctaLocation: cleanString(data.ctaLocation || data.cta_location) || null
      }
    };

    const ghlPayload = {
      firstName: cleanString(data.firstName) || cleanString(data.name).split(/\s+/)[0] || '',
      lastName: cleanString(data.lastName) || cleanString(data.name).split(/\s+/).slice(1).join(' ') || '',
      email,
      company: supabaseRecord.organization || '',
      tags,
      source: 'IAML Website Approval Request',
      contactType: 'lead',
      inquiryType: 'approval_request',
      programSlug,
      programName: supabaseRecord.program_name || programSlug,
      attendancePreference: supabaseRecord.attendance_preference || '',
      businessReason: supabaseRecord.business_reason || '',
      approvalContext: supabaseRecord.context || '',
      approvalText,
      dripCampaign: 'approval_support',
      pageUrl: supabaseRecord.page_url || '',
      pagePath: supabaseRecord.page_path || '',
      referrer: supabaseRecord.referrer || '',
      utmSource: supabaseRecord.utm_source || '',
      utmMedium: supabaseRecord.utm_medium || '',
      utmCampaign: supabaseRecord.utm_campaign || '',
      utmContent: supabaseRecord.utm_content || '',
      utmTerm: supabaseRecord.utm_term || ''
    };

    if (dryRun) {
      return res.status(200).json({ success: true, dryRun: true, supabaseRecord, ghlPayload, tags });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const GHL_WEBHOOK = process.env.GHL_APPROVAL_REQUEST_WEBHOOK || process.env.GHL_CONTACT_US_WEBHOOK || process.env.GHL_CONTACT_WEBHOOK || process.env.GHL_CONTACT_WEBHOOK_URL;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration for approval request capture');
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }
    if (!GHL_WEBHOOK) {
      console.error('Missing GHL webhook configuration for approval request capture');
      return res.status(500).json({ error: 'GoHighLevel configuration missing' });
    }

    const supabaseResponse = await postJson(SUPABASE_URL, SUPABASE_SERVICE_KEY, 'approval_requests', supabaseRecord);
    if (!supabaseResponse.ok) {
      const details = await supabaseResponse.text();
      console.error('Supabase approval_requests insert failed:', details);
      return res.status(supabaseResponse.status).json({ error: 'Failed to persist approval request', details });
    }
    const supabaseData = await supabaseResponse.json();
    const approvalRequest = Array.isArray(supabaseData) ? supabaseData[0] : supabaseData;

    const ghlResponse = await fetch(GHL_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ghlPayload, approvalRequestId: approvalRequest && approvalRequest.id })
    });

    const ghlText = await ghlResponse.text();
    if (!ghlResponse.ok) {
      console.error('GHL approval request webhook failed:', ghlText);
      return res.status(502).json({ success: false, approvalRequest, error: 'GoHighLevel webhook failed', ghlStatus: ghlResponse.status });
    }

    return res.status(201).json({ success: true, approvalRequest, tags, ghlStatus: ghlResponse.status });
  } catch (error) {
    console.error('Approval request API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
