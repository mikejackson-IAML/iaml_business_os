// Serverless function to handle coupon validation and usage tracking
// Supports GET for validation and PATCH for updating usage count

// Load environment variables from .env.local if not already set (for local development)
if (!process.env.AIRTABLE_BASE_ID && process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
    }
  } catch (e) {
    // Silently fail if .env.local can't be loaded
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const API_KEY = process.env.AIRTABLE_REGISTRATION_API_KEY;
    const COUPONS_TABLE = 'tblBaUQKmYuIMsVQm';

    // Validate environment variables
    if (!BASE_ID || !API_KEY) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // GET - Validate coupon code
    if (req.method === 'GET') {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ error: 'Coupon code parameter is required' });
      }

      // Safely escape the coupon code for the filter formula
      const escapedCode = code.toLowerCase().replace(/'/g, "\\'");
      const filterFormula = `LOWER({Coupon Code})='${escapedCode}'`;
      const url = `https://api.airtable.com/v0/${BASE_ID}/${COUPONS_TABLE}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error?.message || 'Coupon validation failed',
          details: data.error
        });
      }

      return res.status(200).json(data);
    }

    // PATCH - Update coupon usage count
    if (req.method === 'PATCH') {
      const { recordId, timesUsed } = req.body;

      if (!recordId || timesUsed === undefined) {
        return res.status(400).json({
          error: 'recordId and timesUsed are required in request body'
        });
      }

      const url = `https://api.airtable.com/v0/${BASE_ID}/${COUPONS_TABLE}/${recordId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Times Used': timesUsed
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: data.error?.message || 'Coupon update failed',
          details: data.error
        });
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Airtable coupons proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
