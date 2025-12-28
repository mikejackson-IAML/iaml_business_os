// Serverless function to handle all quiz operations
// Supports GET, POST, and PATCH methods for quiz questions, answers, and sessions

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const API_KEY = process.env.AIRTABLE_QUIZ_API_KEY;


    // Validate environment variables
    if (!BASE_ID || !API_KEY) {
      console.error('Missing Airtable configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Extract parameters based on request method
    const { table, recordId, filterByFormula, maxRecords, view, pageSize, offset } =
      req.method === 'GET' ? req.query : req.body;

    if (!table) {
      return res.status(400).json({ error: 'table parameter is required' });
    }

    // Build Airtable API URL
    let url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;

    if (recordId && req.method === 'GET') {
      url += `/${recordId}`;
    } else if (recordId && (req.method === 'PATCH' || req.method === 'PUT')) {
      url += `/${recordId}`;
    }

    // Add query parameters for GET requests
    if (req.method === 'GET') {
      const params = new URLSearchParams();
      if (filterByFormula) params.append('filterByFormula', filterByFormula);
      if (maxRecords) params.append('maxRecords', maxRecords);
      if (view) params.append('view', view);
      if (pageSize) params.append('pageSize', pageSize);
      if (offset) params.append('offset', offset);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    // Add body for POST and PATCH requests
    if ((req.method === 'POST' || req.method === 'PATCH') && req.body) {
      if (req.body.fields) {
        fetchOptions.body = JSON.stringify({
          fields: req.body.fields
        });
      } else if (req.body.records) {
        // Support batch operations for POST
        fetchOptions.body = JSON.stringify({
          records: req.body.records
        });
      } else {
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    // Make request to Airtable API
    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Airtable request failed',
        details: data.error
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Airtable quiz proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
