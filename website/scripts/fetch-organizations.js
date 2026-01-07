/**
 * Organizations Cache Generator
 *
 * Fetches participating organizations from Airtable and generates static JSON cache.
 * Used by the Participating Organizations directory page.
 *
 * Usage: node scripts/fetch-organizations.js
 *
 * Environment variables required:
 *   - AIRTABLE_BASE_ID
 *   - AIRTABLE_PROGRAMS_API_KEY
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ORGANIZATIONS_TABLE_ID = 'tbl90HikZUp0GEkKZ';
const BASE_URL = 'https://api.airtable.com/v0';

// Size tier thresholds
const SIZE_TIERS = {
  enterprise: 10000,  // 10,000+ employees
  large: 1000,        // 1,000-9,999 employees
  mid: 100,           // 100-999 employees
  small: 1            // 1-99 employees
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

    // Rate limit: Airtable allows 5 requests/second
    if (offset) {
      await new Promise(resolve => setTimeout(resolve, 220));
    }

  } while (offset);

  return { records: allRecords };
}

/**
 * Fetch all organizations
 * Note: Currently only 'Company Name' field exists in Airtable.
 * If Industry, Employee Count, Region fields are added later, update this function.
 */
async function fetchAllOrganizations(baseId, apiKey) {
  // Fetch all fields - we'll use what's available
  const url = `${BASE_URL}/${baseId}/${ORGANIZATIONS_TABLE_ID}`;
  return fetchFromAirtable(url, apiKey);
}

/**
 * Calculate size tier from employee count
 */
function getSizeTier(employeeCount) {
  if (!employeeCount || employeeCount < 1) return 'unknown';
  if (employeeCount >= SIZE_TIERS.enterprise) return 'enterprise';
  if (employeeCount >= SIZE_TIERS.large) return 'large';
  if (employeeCount >= SIZE_TIERS.mid) return 'mid';
  return 'small';
}

/**
 * Generate sort key from company name (lowercase, remove special chars)
 */
function generateSortKey(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map organization record to our output format
 * Note: Industry, Employee Count, Region fields may not exist yet.
 * The script handles missing fields gracefully with defaults.
 */
function mapOrganizationRecord(record) {
  const name = record.fields['Company Name'] || '';
  const employeeCount = record.fields['Employee Count'] || 0;

  return {
    id: record.id,
    name: name,
    industry: record.fields['Industry'] || '',
    size: employeeCount ? getSizeTier(employeeCount) : '',
    region: record.fields['Region'] || '',
    sortKey: generateSortKey(name)
  };
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
  const dataDir = path.join(__dirname, '..', 'data', 'organizations');
  fs.mkdirSync(dataDir, { recursive: true });

  const generated = new Date().toISOString();

  console.log('Starting organizations cache generation...');
  console.log(`Timestamp: ${generated}`);
  console.log('');

  // Fetch all organizations
  console.log('Fetching all organizations from Airtable...');
  const orgsData = await fetchAllOrganizations(BASE_ID, API_KEY);

  // Map and filter valid records
  const allOrganizations = orgsData.records
    .map(mapOrganizationRecord)
    .filter(org => org.name.trim() !== '')
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  console.log(`  Found ${allOrganizations.length} organizations`);
  console.log('');

  // Collect unique industries and regions
  const industries = [...new Set(allOrganizations.map(org => org.industry))].sort();
  const regions = [...new Set(allOrganizations.map(org => org.region))].sort();

  // Calculate statistics
  const stats = {
    byIndustry: {},
    bySize: {},
    byRegion: {}
  };

  for (const org of allOrganizations) {
    stats.byIndustry[org.industry] = (stats.byIndustry[org.industry] || 0) + 1;
    stats.bySize[org.size] = (stats.bySize[org.size] || 0) + 1;
    stats.byRegion[org.region] = (stats.byRegion[org.region] || 0) + 1;
  }

  console.log('Statistics:');
  console.log('  By Industry:');
  for (const [industry, count] of Object.entries(stats.byIndustry).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${industry}: ${count}`);
  }
  console.log('');
  console.log('  By Size:');
  for (const [size, count] of Object.entries(stats.bySize)) {
    console.log(`    ${size}: ${count}`);
  }
  console.log('');
  console.log('  By Region:');
  for (const [region, count] of Object.entries(stats.byRegion).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${region}: ${count}`);
  }
  console.log('');

  // Build output
  const output = {
    generated,
    version: '1.0.0',
    source: 'airtable',
    totalCount: allOrganizations.length,
    industries,
    regions,
    organizations: allOrganizations
  };

  // Write main cache file
  const outputPath = path.join(dataDir, 'all-organizations.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('Organizations cache generation complete!');
  console.log(`  Total organizations: ${allOrganizations.length}`);
  console.log(`  Industries: ${industries.length}`);
  console.log(`  Regions: ${regions.length}`);
  console.log(`  Output: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
