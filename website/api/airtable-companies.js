// Serverless function to handle COMPANIES table operations
// Supports: GET (search by company name), POST (create new company)

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const API_KEY = process.env.AIRTABLE_PROGRAMS_API_KEY;

    if (!BASE_ID || !API_KEY) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const TABLE_NAME = 'tbl90HikZUp0GEkKZ'; // COMPANIES table

    if (req.method === 'GET') {
      // Search for existing company
      const { filterByFormula, maxRecords } = req.query;

      if (!filterByFormula) {
        return res.status(400).json({ error: 'filterByFormula parameter is required for GET' });
      }

      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
      const params = new URLSearchParams();
      params.append('filterByFormula', filterByFormula);
      if (maxRecords) params.append('maxRecords', maxRecords);

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Airtable GET error:', error);
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // Create new company
      const { fields } = req.body;

      if (!fields || !fields['Company Name']) {
        return res.status(400).json({
          error: 'Missing required field: Company Name'
        });
      }

      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Airtable POST error:', error);
        return res.status(response.status).json(error);
      }

      const data = await response.json();
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Companies API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
