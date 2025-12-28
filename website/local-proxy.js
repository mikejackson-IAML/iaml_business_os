/**
 * Local Development Proxy for Airtable API
 * Run this alongside your local development server to test faculty integration
 *
 * Usage: node local-proxy.js
 * Then access your site at http://localhost:8000 as normal
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const loadEnvFile = () => {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
      console.log('✓ Loaded .env.local');
    } else {
      console.error('✗ .env.local not found');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Error loading .env.local:', error.message);
    process.exit(1);
  }
};

loadEnvFile();

// Strip quotes from environment variables (some editors add them automatically)
const BASE_ID = process.env.AIRTABLE_BASE_ID?.replace(/^["']|["']$/g, '');
const API_KEY = process.env.AIRTABLE_PROGRAMS_API_KEY?.replace(/^["']|["']$/g, '');

if (!BASE_ID || !API_KEY) {
  console.error('✗ Missing AIRTABLE_BASE_ID or AIRTABLE_PROGRAMS_API_KEY in .env.local');
  process.exit(1);
}

const PORT = 3001; // Proxy runs on different port than your dev server

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle /api/airtable-programs requests
  if (!req.url.startsWith('/api/airtable-programs')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse query parameters
  const urlParts = req.url.split('?');
  const queryString = urlParts[1] || '';
  const params = new URLSearchParams(queryString);

  const table = params.get('table');
  const recordId = params.get('recordId');
  const filterByFormula = params.get('filterByFormula');
  const maxRecords = params.get('maxRecords');
  const view = params.get('view');

  if (!table) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'table parameter is required' }));
    return;
  }

  // Build Airtable API URL
  let airtableUrl = `https://api.airtable.com/v0/${BASE_ID}/${table}`;

  if (recordId) {
    airtableUrl += `/${recordId}`;
  }

  // Add query parameters
  const airtableParams = new URLSearchParams();
  if (filterByFormula) airtableParams.append('filterByFormula', filterByFormula);
  if (maxRecords) airtableParams.append('maxRecords', maxRecords);
  if (view) airtableParams.append('view', view);

  // Handle sort parameters
  const sortParams = [];
  for (const [key, value] of params.entries()) {
    const match = key.match(/^sort\[(\d+)\]\[(field|direction)\]$/);
    if (match) {
      const index = parseInt(match[1]);
      const prop = match[2];
      if (!sortParams[index]) sortParams[index] = {};
      sortParams[index][prop] = value;
    }
  }

  sortParams.forEach((s, i) => {
    if (s && s.field) {
      airtableParams.append(`sort[${i}][field]`, s.field);
      if (s.direction) airtableParams.append(`sort[${i}][direction]`, s.direction);
    }
  });

  if (airtableParams.toString()) {
    airtableUrl += `?${airtableParams.toString()}`;
  }

  console.log(`→ Proxying: ${table}${filterByFormula ? ` (${filterByFormula.substring(0, 50)}...)` : ''}`);

  // Make request to Airtable
  const airtableRequest = https.get(airtableUrl, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }, (airtableRes) => {
    let data = '';

    airtableRes.on('data', (chunk) => {
      data += chunk;
    });

    airtableRes.on('end', () => {
      res.writeHead(airtableRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);

      if (airtableRes.statusCode === 200) {
        const parsedData = JSON.parse(data);
        const records = parsedData.records || [];
        console.log(`✓ Success: ${records.length} record(s)`);
        if (table === 'tblVz9VPGhZgE4jBD' && filterByFormula && filterByFormula.includes('SEARCH')) {
          console.log('DEBUG: Faculty query response:', JSON.stringify(parsedData, null, 2));
        }
      } else {
        console.log(`✗ Error: ${airtableRes.statusCode}`);
      }
    });
  });

  airtableRequest.on('error', (error) => {
    console.error('✗ Airtable request failed:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }));
  });
});

server.listen(PORT, () => {
  console.log('\n=================================');
  console.log('🚀 Local Airtable Proxy Running');
  console.log('=================================');
  console.log(`Port: ${PORT}`);
  console.log(`Base ID: ${BASE_ID}`);
  console.log('\nReady to handle faculty requests!\n');
});
