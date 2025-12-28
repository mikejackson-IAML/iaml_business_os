// Serverless function to proxy Airtable programs/sessions/instructors requests
// This keeps API keys server-side and never exposes them to browsers

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
          // Remove quotes from value if present
          const cleanValue = value.trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { table, recordId, filterByFormula, maxRecords, view } = req.query;

    // Validate required parameters
    if (!table) {
      return res.status(400).json({ error: 'table parameter is required' });
    }

    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const API_KEY = process.env.AIRTABLE_PROGRAMS_API_KEY;

    // Debug logging
    console.log('BASE_ID:', BASE_ID ? `${BASE_ID.substring(0, 8)}...` : 'MISSING');
    console.log('API_KEY:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING');

    // Validate environment variables
    if (!BASE_ID || !API_KEY) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Build Airtable API URL
    let url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;

    if (recordId) {
      url += `/${recordId}`;
    }

    // Add query parameters
    const params = new URLSearchParams();
    if (filterByFormula) params.append('filterByFormula', filterByFormula);
    if (maxRecords) params.append('maxRecords', maxRecords);
    if (view) params.append('view', view);

    // Parse sort array from query string (sort[0][field], sort[0][direction], etc.)
    const sortParams = [];
    Object.keys(req.query).forEach(key => {
      const match = key.match(/^sort\[(\d+)\]\[(field|direction)\]$/);
      if (match) {
        const index = parseInt(match[1]);
        const prop = match[2];
        if (!sortParams[index]) sortParams[index] = {};
        sortParams[index][prop] = req.query[key];
      }
    });

    // Append to Airtable API params
    sortParams.forEach((s, i) => {
      if (s && s.field) {
        params.append(`sort[${i}][field]`, s.field);
        if (s.direction) params.append(`sort[${i}][direction]`, s.direction);
      }
    });

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Make request to Airtable API
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
        error: data.error?.message || 'Airtable request failed',
        details: data.error
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Airtable programs proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
