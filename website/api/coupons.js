/**
 * Coupons API - Validates and manages discount coupons from Supabase
 *
 * Supports:
 * - GET ?code=XXX - Validate a coupon code
 * - PATCH - Update coupon usage count
 *
 * Returns data in Airtable-compatible format for minimal frontend changes.
 */

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // GET - Validate coupon code
    if (req.method === 'GET') {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ error: 'Coupon code parameter is required' });
      }

      // Query Supabase for coupon (case-insensitive)
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/coupons?code=ilike.${encodeURIComponent(code)}&limit=1`,
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase coupon query error:', errorText);
        return res.status(response.status).json({ error: 'Coupon validation failed' });
      }

      const coupons = await response.json();

      if (!coupons || coupons.length === 0) {
        // Return empty records array (Airtable-compatible format)
        return res.status(200).json({ records: [] });
      }

      const coupon = coupons[0];

      // Transform to Airtable-compatible format for minimal frontend changes
      const airtableFormat = {
        records: [{
          id: coupon.id,
          fields: {
            'Coupon Code': coupon.code,
            'Status': coupon.status === 'active' ? 'Active' : coupon.status,
            'Expiration Date': coupon.expiration_date,
            'Max Uses': coupon.max_uses,
            'Times Used': coupon.times_used,
            'Discount Amount': coupon.discount_amount ? parseFloat(coupon.discount_amount) : null,
            'Discount Percent': coupon.discount_percent,
            'Eligible Program Types': coupon.eligible_program_types || [],
            'Stripe Coupon ID': coupon.stripe_coupon_id
          }
        }]
      };

      return res.status(200).json(airtableFormat);
    }

    // PATCH - Update coupon usage count
    if (req.method === 'PATCH') {
      const { recordId, timesUsed } = req.body;

      if (!recordId || timesUsed === undefined) {
        return res.status(400).json({
          error: 'recordId and timesUsed are required in request body'
        });
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/coupons?id=eq.${encodeURIComponent(recordId)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            times_used: timesUsed
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase coupon update error:', errorText);
        return res.status(response.status).json({ error: 'Coupon update failed' });
      }

      const updated = await response.json();

      if (!updated || updated.length === 0) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      // Return in Airtable-compatible format
      return res.status(200).json({
        id: updated[0].id,
        fields: {
          'Times Used': updated[0].times_used
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Coupons API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
