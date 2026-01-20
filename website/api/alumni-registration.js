/**
 * Alumni Registration API
 * Creates a registration for Quarterly Employment Law Updates (alumni access)
 * Sets 12-month access expiration for legacy alumni
 * Sends data to GHL webhook
 *
 * POST body: { first_name, last_name, email, phone, job_title, company_name, contact_id }
 */

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const GHL_WEBHOOK_URL = process.env.GHL_REGISTRATION_WEBHOOK ||
      'https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/8a0aa0b8-52c0-4810-8475-c0e1b82adb70';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      job_title,
      company_name,
      contact_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term
    } = req.body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        error: 'Missing required fields: email, first_name, last_name'
      });
    }

    // Calculate dates
    const now = new Date();
    const accessExpires = new Date(now);
    accessExpires.setFullYear(accessExpires.getFullYear() + 1); // 12 months from now

    // Generate registration code: QU-ALUMNI-{MMYY}-{SEQ}
    const monthYear = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
    const prefix = `QU-ALUMNI-${monthYear}`;

    // Query for existing registrations with this prefix to get sequence number
    const countResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/registrations?registration_code=like.${encodeURIComponent(prefix)}*&select=id`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );

    let existingCount = 0;
    const contentRange = countResponse.headers.get('content-range');
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match) {
        existingCount = parseInt(match[1], 10);
      }
    } else {
      const countData = await countResponse.json();
      existingCount = Array.isArray(countData) ? countData.length : 0;
    }

    const sequenceNumber = String(existingCount + 1).padStart(3, '0');
    const registrationCode = `${prefix}-${sequenceNumber}`;

    // Build the registration record
    const registrationRecord = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      job_title: job_title || null,
      company_name: company_name || null,
      registration_date: now.toISOString(),
      registration_source: 'Website - Alumni Registration',
      registration_status: 'Confirmed',
      registration_code: registrationCode,
      list_price: 0,
      discount_amount: 0,
      final_price: 0,
      payment_status: 'Alumni - Complimentary',
      payment_method: 'Alumni Benefit',
      attendance_type: 'Annual Access',
      selected_blocks: 'Quarterly Updates - 4 Sessions',
      utm_source: utm_source || 'alumni_registration',
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || 'quarterly_updates_alumni',
      utm_content: utm_content || null,
      utm_term: utm_term || null
    };

    // Insert into Supabase registrations table
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(registrationRecord)
    });

    if (!supabaseResponse.ok) {
      const error = await supabaseResponse.text();
      console.error('Supabase registration error:', error);
      return res.status(500).json({ error: 'Failed to create registration', details: error });
    }

    const data = await supabaseResponse.json();
    const createdRegistration = Array.isArray(data) ? data[0] : data;

    // Format expiration date for display
    const expiresFormatted = accessExpires.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Send to GHL webhook
    const ghlPayload = {
      unique_identifier: createdRegistration.id || registrationCode,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      title: job_title || '',
      company_name: company_name || '',
      selected_program: 'Quarterly Employment Law Updates',
      program_format: 'Virtual',
      attendance_type__3_block_programs: 'Annual Access - 4 Sessions',
      coupon_code_used: 'ALUMNI',
      discount_amount: 0,
      registration_code: registrationCode,
      amount_due: 0,
      payment_status: 'Alumni - Complimentary',
      registration_status: 'Confirmed',
      registration_date: now.toISOString().split('T')[0],
      registration_source: 'Alumni Registration Page',
      quarterly_updates_access_expires: accessExpires.toISOString(),
      quarterly_updates_access_type: 'legacy_alumni',
      tags: ['alumni', 'quarterly_updates', 'complimentary', 'legacy_alumni']
    };

    try {
      const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ghlPayload)
      });

      if (!ghlResponse.ok) {
        console.error('GHL webhook error:', await ghlResponse.text());
        // Don't fail the registration if GHL fails
      }
    } catch (ghlError) {
      console.error('GHL webhook failed:', ghlError);
      // Don't fail the registration if GHL fails
    }

    // Update the contact record with quarterly updates access info
    if (contact_id) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/contacts?id=eq.${contact_id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quarterly_updates_registered_at: now.toISOString(),
            quarterly_updates_access_expires: accessExpires.toISOString(),
            quarterly_updates_access_type: 'legacy_alumni',
            // Also update contact info if they made changes
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            company: company_name || undefined,
            job_title: job_title || undefined,
            phone: phone || undefined
          })
        });
      } catch (updateError) {
        console.error('Failed to update contact record:', updateError);
        // Non-blocking - registration was successful
      }
    }

    return res.status(201).json({
      success: true,
      registration: {
        id: createdRegistration.id,
        registration_code: registrationCode,
        email: email.trim().toLowerCase(),
        name: `${first_name.trim()} ${last_name.trim()}`,
        access_registered: now.toISOString(),
        access_expires: accessExpires.toISOString(),
        access_expires_formatted: expiresFormatted,
        access_type: 'legacy_alumni'
      }
    });

  } catch (error) {
    console.error('Alumni registration API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
