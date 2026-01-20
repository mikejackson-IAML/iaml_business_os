/**
 * Verify Alumni API
 * Checks if an email exists in the Supabase contacts table (past participants)
 * and returns their quarterly updates access status
 *
 * GET ?email=test@example.com
 *
 * Returns:
 * - { verified: false } - Not found in alumni database
 * - { verified: true, access_status: 'not_registered', contact: {...} } - Alumni, hasn't claimed access
 * - { verified: true, access_status: 'active', contact: {...}, access_expires: '...' } - Has active access
 * - { verified: true, access_status: 'expired', contact: {...}, access_expired: '...' } - Access expired
 */

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    // Normalize email: lowercase, trim
    const normalizedEmail = email.trim().toLowerCase();

    // Query contacts table for this email
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/contacts?email=ilike.${encodeURIComponent(normalizedEmail)}&limit=1`,
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
      console.error('Supabase contacts query error:', errorText);
      return res.status(500).json({ error: 'Failed to verify alumni status' });
    }

    const contacts = await response.json();

    if (!contacts || contacts.length === 0) {
      // Not found in alumni database
      return res.status(200).json({
        verified: false,
        message: 'Email not found in alumni records'
      });
    }

    const contact = contacts[0];

    // Build base contact data (excluding sensitive fields)
    const contactData = {
      id: contact.id,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      company: contact.company || '',
      job_title: contact.job_title || '',
      phone: contact.phone || ''
    };

    // Check quarterly updates access status
    const registeredAt = contact.quarterly_updates_registered_at;
    const accessExpires = contact.quarterly_updates_access_expires;
    const accessType = contact.quarterly_updates_access_type;

    // If they haven't registered for quarterly updates yet
    if (!registeredAt) {
      return res.status(200).json({
        verified: true,
        access_status: 'not_registered',
        contact: contactData
      });
    }

    // They have registered - check if access is still active
    const now = new Date();
    const expirationDate = accessExpires ? new Date(accessExpires) : null;

    if (expirationDate && now > expirationDate) {
      // Access has expired
      return res.status(200).json({
        verified: true,
        access_status: 'expired',
        contact: contactData,
        access_type: accessType || 'legacy_alumni',
        access_registered: registeredAt,
        access_expired: accessExpires
      });
    }

    // Access is still active
    return res.status(200).json({
      verified: true,
      access_status: 'active',
      contact: contactData,
      access_type: accessType || 'legacy_alumni',
      access_registered: registeredAt,
      access_expires: accessExpires
    });

  } catch (error) {
    console.error('Verify alumni API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
