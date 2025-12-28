/**
 * Session Cache Generator
 *
 * Fetches program sessions from Airtable and generates static JSON cache files.
 * Runs via GitHub Actions weekly or on-demand.
 *
 * Usage: node scripts/fetch-sessions.js
 *
 * Environment variables required:
 *   - AIRTABLE_BASE_ID
 *   - AIRTABLE_PROGRAMS_API_KEY
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TABLE_ID = 'tblympiL1p6PmQz9i';
const BASE_URL = 'https://api.airtable.com/v0';

// View IDs from register.js SESSION_VIEW_IDS
// These map to specific Airtable views for each program/format combination
const SESSION_VIEW_IDS = {
  // Certificate programs (full program views)
  'Certificate in Employee Relations Law': {
    'in-person': 'viwfys9oVCU3gFsel'
  },
  'Certificate in Strategic HR Leadership': {
    'in-person': 'viwjSrF7oSzlzYuIc'
  },
  'Advanced Certificate in Strategic Employment Law': {
    'in-person': 'viwqyJc8gx3hOppAu'
  },
  'Certificate in Workplace Investigations': {
    'in-person': 'viw3l8oabLZC5abrq'
  },
  'Certificate in Employee Benefits Law': {
    'in-person': 'viwui1caJxkkGKXiO'
  },
  'Advanced Certificate in Employee Benefits Law': {
    'in-person': 'viwlzVMIk78qDmL2W'
  },

  // Individual block views (for partial attendance)
  'Comprehensive Labor Relations': {
    'in-person': 'viwfRNxWVMk9nUxCc',
    'virtual': 'viwkxehH3VECGQrVU'
  },
  'Discrimination Prevention and Defense': {
    'in-person': 'viwgBsDDQfaHdPREf',
    'virtual': 'viw5ydjKfvbDKMzaf'
  },
  'HR Law Fundamentals': {
    'in-person': 'viwOR51HSgvqnvvtM',
    'virtual': 'viwI0VscueaVxM4Vk'
  },
  'Strategic HR Management': {
    'in-person': 'viwVZQi5IShScOoOP',
    'virtual': 'viw3RC4Ti0v2Xi5VJ'
  },
  'Retirement Plans': {
    'in-person': 'viwuXlg9Lk4I7AeCY'
  },
  'Benefit Plan Claims, Appeals and Litigation': {
    'in-person': 'viw0LjpGuf6lGKLZu'
  },
  'Welfare Benefits Plan Issues': {
    'in-person': 'viwa8yRYP99luXOQc'
  },
  'Special Issues in Employment Law': {
    'in-person': 'viwfRNxWVMk9nUxCc'
  }
};

/**
 * Fetch data from Airtable API with pagination support
 */
async function fetchFromAirtable(url, apiKey) {
  const allRecords = [];
  let offset = null;

  do {
    const fetchUrl = offset ? `${url}&offset=${offset}` : url;

    const response = await fetch(fetchUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    allRecords.push(...(data.records || []));
    offset = data.offset;

  } while (offset);

  return { records: allRecords };
}

/**
 * Fetch all sessions with Show on Website = TRUE
 */
async function fetchAllSessions(baseId, apiKey) {
  const filterFormula = encodeURIComponent("{Show on Website}=TRUE()");
  const sortField = encodeURIComponent("Start Date");
  const url = `${BASE_URL}/${baseId}/${TABLE_ID}?filterByFormula=${filterFormula}&sort[0][field]=${sortField}&sort[0][direction]=asc`;
  return fetchFromAirtable(url, apiKey);
}

/**
 * Fetch sessions for a specific Airtable view
 */
async function fetchViewSessions(baseId, apiKey, viewId) {
  const url = `${BASE_URL}/${baseId}/${TABLE_ID}?view=${viewId}`;
  return fetchFromAirtable(url, apiKey);
}

/**
 * Get unique view IDs from SESSION_VIEW_IDS
 */
function getUniqueViewIds() {
  const viewIds = new Set();
  for (const program of Object.values(SESSION_VIEW_IDS)) {
    for (const viewId of Object.values(program)) {
      viewIds.add(viewId);
    }
  }
  return Array.from(viewIds);
}

/**
 * Create a reverse mapping of viewId to program/format names
 */
function createViewIdMapping() {
  const mapping = {};
  for (const [programName, formats] of Object.entries(SESSION_VIEW_IDS)) {
    for (const [format, viewId] of Object.entries(formats)) {
      if (!mapping[viewId]) {
        mapping[viewId] = [];
      }
      mapping[viewId].push({ program: programName, format });
    }
  }
  return mapping;
}

/**
 * Main execution
 */
async function main() {
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const API_KEY = process.env.AIRTABLE_PROGRAMS_API_KEY;

  if (!BASE_ID || !API_KEY) {
    console.error('Error: Missing required environment variables');
    console.error('  AIRTABLE_BASE_ID:', BASE_ID ? 'set' : 'missing');
    console.error('  AIRTABLE_PROGRAMS_API_KEY:', API_KEY ? 'set' : 'missing');
    process.exit(1);
  }

  // Setup directories
  const dataDir = path.join(__dirname, '..', 'data', 'sessions');
  const viewsDir = path.join(dataDir, 'by-view');

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(viewsDir, { recursive: true });

  const generated = new Date().toISOString();
  const viewIdMapping = createViewIdMapping();

  console.log('Starting session cache generation...');
  console.log(`Timestamp: ${generated}`);
  console.log('');

  // 1. Fetch all sessions for program-schedule page
  console.log('Fetching all sessions (Show on Website = TRUE)...');
  const allSessions = await fetchAllSessions(BASE_ID, API_KEY);

  const allSessionsData = {
    generated,
    version: '1.0.0',
    source: 'airtable',
    recordCount: allSessions.records.length,
    records: allSessions.records
  };

  fs.writeFileSync(
    path.join(dataDir, 'all-sessions.json'),
    JSON.stringify(allSessionsData, null, 2)
  );
  console.log(`  Wrote ${allSessions.records.length} sessions to all-sessions.json`);
  console.log('');

  // 2. Fetch each view for registration system
  const viewIds = getUniqueViewIds();
  console.log(`Fetching ${viewIds.length} view-specific caches...`);

  const viewStats = [];

  for (const viewId of viewIds) {
    try {
      const viewData = await fetchViewSessions(BASE_ID, API_KEY, viewId);
      const usedBy = viewIdMapping[viewId] || [];

      const viewOutput = {
        generated,
        viewId,
        usedBy,
        recordCount: viewData.records.length,
        records: viewData.records
      };

      fs.writeFileSync(
        path.join(viewsDir, `${viewId}.json`),
        JSON.stringify(viewOutput, null, 2)
      );

      viewStats.push({ viewId, count: viewData.records.length, usedBy });
      console.log(`  ${viewId}: ${viewData.records.length} records`);

      // Rate limit: Airtable allows 5 requests/second
      await new Promise(resolve => setTimeout(resolve, 220));

    } catch (error) {
      console.error(`  Error fetching view ${viewId}: ${error.message}`);
      viewStats.push({ viewId, count: 0, error: error.message });
    }
  }

  console.log('');

  // 3. Write metadata
  const metadata = {
    generated,
    version: '1.0.0',
    totalSessions: allSessions.records.length,
    viewsCount: viewIds.length,
    viewStats
  };

  fs.writeFileSync(
    path.join(dataDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log('Cache generation complete!');
  console.log(`  Total sessions: ${allSessions.records.length}`);
  console.log(`  Views cached: ${viewIds.length}`);
  console.log(`  Output directory: ${dataDir}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
