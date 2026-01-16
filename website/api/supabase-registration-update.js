// Serverless function to update registrations in Supabase
// Supports: PATCH (update existing registration)

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { id, ...updates } = req.body;

    // Validate required field
    if (!id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      'stripe_invoice_id',
      'stripe_payment_intent',
      'payment_status',
      'registration_status'
    ];

    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update in Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(filteredUpdates)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Supabase PATCH error:', error);
      return res.status(response.status).json({ error: 'Failed to update registration', details: error });
    }

    const data = await response.json();
    return res.status(200).json(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    console.error('Supabase registration update API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
