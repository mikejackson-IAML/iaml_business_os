// Serverless function to create registrations directly in Supabase
// Supports: POST (create new registration)
// Registration code format: {FORMAT}-{PROGRAM}-{CITY}-{MMYY}-{SEQ}

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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const registration = req.body;

    // Validate required fields
    if (!registration.email || !registration.first_name || !registration.last_name) {
      return res.status(400).json({
        error: 'Missing required fields: email, first_name, last_name'
      });
    }

    // Generate registration code with sequence number
    let registrationCode = registration.registration_code || null;

    if (registration.registration_code_prefix) {
      // Query for existing registrations with this prefix to get sequence number
      const prefix = registration.registration_code_prefix;
      const countResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/registrations?registration_code=like.${encodeURIComponent(prefix + '-*')}&select=id`,
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'count=exact'
          }
        }
      );

      // Get count from content-range header or response length
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

      // Generate sequence number (3 digits, zero-padded)
      const sequenceNumber = String(existingCount + 1).padStart(3, '0');
      registrationCode = `${prefix}-${sequenceNumber}`;
    }

    // Build the registration record
    const record = {
      first_name: registration.first_name,
      last_name: registration.last_name,
      email: registration.email,
      phone: registration.phone || null,
      job_title: registration.job_title || null,
      company_name: registration.company_name || null,
      program_instance_airtable_id: registration.session_id || null,
      program_name_snapshot: registration.program_name || null,
      program_format_snapshot: registration.program_format || null,
      session_start_date_snapshot: registration.session_start_date || null,
      session_end_date_snapshot: registration.session_end_date || null,
      session_location_snapshot: registration.session_location || null,
      registration_date: new Date().toISOString(),
      registration_source: 'Website',
      registration_status: 'Confirmed',
      registration_code: registrationCode,
      list_price: registration.list_price || 0,
      discount_amount: registration.discount_amount || 0,
      final_price: registration.final_price || 0,
      payment_status: registration.payment_status || 'Pending',
      payment_method: registration.payment_method || null,
      stripe_payment_intent: registration.stripe_payment_intent || null,
      stripe_invoice_id: registration.stripe_invoice_id || null,
      attendance_type: registration.attendance_type || 'Full',
      selected_blocks: registration.selected_blocks || null,
      utm_source: registration.utm_source || null,
      utm_medium: registration.utm_medium || null,
      utm_campaign: registration.utm_campaign || null,
      utm_content: registration.utm_content || null,
      utm_term: registration.utm_term || null
    };

    // Insert into Supabase. If the dashboard snapshot migration has not been applied
    // yet, retry without those optional columns so registration capture still works.
    const insertRecord = async (payload) => fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    let response = await insertRecord(record);

    if (!response.ok) {
      const error = await response.text();
      const mentionsSnapshotColumn = /program_name_snapshot|program_format_snapshot|session_start_date_snapshot|session_end_date_snapshot|session_location_snapshot/i.test(error);

      if (mentionsSnapshotColumn) {
        const fallbackRecord = { ...record };
        delete fallbackRecord.program_name_snapshot;
        delete fallbackRecord.program_format_snapshot;
        delete fallbackRecord.session_start_date_snapshot;
        delete fallbackRecord.session_end_date_snapshot;
        delete fallbackRecord.session_location_snapshot;
        response = await insertRecord(fallbackRecord);
      }

      if (!response.ok) {
        const finalError = await response.text();
        console.error('Supabase POST error:', finalError || error);
        return res.status(response.status).json({ error: 'Failed to create registration', details: finalError || error });
      }
    }

    const data = await response.json();
    const createdRecord = Array.isArray(data) ? data[0] : data;

    // Try to link to program_instance by airtable_id
    if (createdRecord.id && registration.session_id) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/link_registration_to_program`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_registration_id: createdRecord.id,
            p_program_airtable_id: registration.session_id
          })
        });
      } catch (linkError) {
        console.error('Failed to link registration to program:', linkError);
        // Non-blocking - registration was created successfully
      }
    }

    return res.status(201).json(createdRecord);
  } catch (error) {
    console.error('Supabase registration API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
