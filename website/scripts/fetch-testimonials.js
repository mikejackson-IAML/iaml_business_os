/**
 * Testimonials Cache Generator
 *
 * Fetches testimonials from Airtable and generates static JSON cache file.
 * Runs via GitHub Actions daily alongside sessions and faculty.
 *
 * Usage: node scripts/fetch-testimonials.js
 *
 * Environment variables required:
 *   - AIRTABLE_BASE_ID
 *   - AIRTABLE_PROGRAMS_API_KEY
 */

const fs = require('fs');
const path = require('path');

// Configuration - Airtable table IDs
const TESTIMONIALS_TABLE_ID = 'tbl6zcJf1KWGICwvy';
const BASE_URL = 'https://api.airtable.com/v0';

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
 * Fetch all testimonials
 */
async function fetchAllTestimonials(baseId, apiKey) {
  const fields = [
    'Testimonial Text',
    'Author Name',
    'Author Title',
    'Company Name',
    'FACULTY'
  ];

  const fieldParams = fields.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
  const url = `${BASE_URL}/${baseId}/${TESTIMONIALS_TABLE_ID}?${fieldParams}`;
  return fetchFromAirtable(url, apiKey);
}

/**
 * Map testimonial record to cache format
 */
function mapTestimonialRecord(record) {
  // Handle fields that may be arrays (linked records return arrays)
  const safeString = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) return value[0] || '';
    return String(value);
  };

  return {
    id: record.id,
    quote: safeString(record.fields['Testimonial Text']),
    authorName: safeString(record.fields['Author Name']),
    authorTitle: safeString(record.fields['Author Title']),
    company: safeString(record.fields['Company Name']),
    facultyRecordIds: record.fields['FACULTY'] || []
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
  const dataDir = path.join(__dirname, '..', 'data', 'testimonials');
  fs.mkdirSync(dataDir, { recursive: true });

  const generated = new Date().toISOString();

  console.log('Starting testimonials cache generation...');
  console.log(`Timestamp: ${generated}`);
  console.log('');

  // Fetch all testimonials
  console.log('Fetching all testimonials...');
  const testimonialsData = await fetchAllTestimonials(BASE_ID, API_KEY);
  const allTestimonials = testimonialsData.records
    .map(mapTestimonialRecord)
    .filter(t => t.quote.trim()); // Only include testimonials with actual quote text

  console.log(`  Found ${allTestimonials.length} testimonials with content`);
  console.log('');

  // Count testimonials by faculty
  const facultyWithTestimonials = new Set();
  allTestimonials.forEach(t => {
    t.facultyRecordIds.forEach(id => facultyWithTestimonials.add(id));
  });

  // Write all testimonials file
  const allTestimonialsFile = path.join(dataDir, 'all-testimonials.json');
  const allTestimonialsData = {
    generated,
    version: '1.0.0',
    source: 'airtable',
    recordCount: allTestimonials.length,
    facultyCount: facultyWithTestimonials.size,
    testimonials: allTestimonials
  };

  fs.writeFileSync(allTestimonialsFile, JSON.stringify(allTestimonialsData, null, 2));
  console.log(`Wrote ${allTestimonials.length} testimonials to all-testimonials.json`);

  // Write metadata
  const metadataFile = path.join(dataDir, 'metadata.json');
  const metadata = {
    generated,
    version: '1.0.0',
    totalTestimonials: allTestimonials.length,
    facultyWithTestimonials: facultyWithTestimonials.size
  };

  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  console.log('Wrote metadata.json');

  console.log('');
  console.log('Testimonials cache generation complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
