// Serverless function to handle REGISTRATIONS table operations
// Supports: POST (create new registration record)

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const API_KEY = process.env.AIRTABLE_PROGRAMS_API_KEY;

    if (!BASE_ID || !API_KEY) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const TABLE_NAME = 'tblhp9Llw7zSRqRnt'; // REGISTRATIONS table

    const { fields } = req.body;

    // Validate required fields
    if (!fields) {
      return res.status(400).json({ error: 'Missing fields object' });
    }

    if (!fields['Contact'] || !fields['Company'] || !fields['Program Instance']) {
      return res.status(400).json({
        error: 'Missing required fields: Contact, Company, Program Instance'
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
  } catch (error) {
    console.error('Registrations API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
