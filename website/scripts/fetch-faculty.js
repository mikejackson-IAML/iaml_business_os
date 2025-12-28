/**
 * Faculty Cache Generator
 *
 * Fetches faculty members from Airtable and generates static JSON cache files
 * organized by program slug. Runs via GitHub Actions weekly alongside sessions.
 *
 * Usage: node scripts/fetch-faculty.js
 *
 * Environment variables required:
 *   - AIRTABLE_BASE_ID
 *   - AIRTABLE_PROGRAMS_API_KEY
 */

const fs = require('fs');
const path = require('path');

// Configuration - Airtable table IDs
const PROGRAMS_TABLE_ID = 'tbl6jgbX0WW641L84';
const FACULTY_TABLE_ID = 'tblVz9VPGhZgE4jBD';
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
 * Fetch all programs to get slug mappings
 */
async function fetchAllPrograms(baseId, apiKey) {
  const url = `${BASE_URL}/${baseId}/${PROGRAMS_TABLE_ID}?fields[]=Slug&fields[]=Program%20Name`;
  return fetchFromAirtable(url, apiKey);
}

/**
 * Fetch all faculty members
 */
async function fetchAllFaculty(baseId, apiKey) {
  const fields = [
    'Full Name with Credentials',
    'First Name',
    'Current Title',
    'Current Firm/Organization',
    'Short Bio (250-300 characters)',
    'Headshot Photo',
    'Full Bio URL',
    'PROGRAMS (Faculty)'
  ];

  const fieldParams = fields.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
  const url = `${BASE_URL}/${baseId}/${FACULTY_TABLE_ID}?${fieldParams}`;
  return fetchFromAirtable(url, apiKey);
}

/**
 * Map faculty record to our template format
 */
function mapFacultyRecord(record) {
  return {
    id: record.id,
    name: record.fields['Full Name with Credentials'] || '',
    firstName: record.fields['First Name'] || '',
    title: record.fields['Current Title'] || '',
    organization: record.fields['Current Firm/Organization'] || '',
    bio: record.fields['Short Bio (250-300 characters)'] || '',
    imageUrl: record.fields['Headshot Photo'] || '',
    bioLink: record.fields['Full Bio URL'] || '',
    programRecordIds: record.fields['PROGRAMS (Faculty)'] || []
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
  const dataDir = path.join(__dirname, '..', 'data', 'faculty');
  const byProgramDir = path.join(dataDir, 'by-program');

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(byProgramDir, { recursive: true });

  const generated = new Date().toISOString();

  console.log('Starting faculty cache generation...');
  console.log(`Timestamp: ${generated}`);
  console.log('');

  // 1. Fetch all programs to build slug mapping
  console.log('Fetching programs for slug mapping...');
  const programsData = await fetchAllPrograms(BASE_ID, API_KEY);

  // Create mapping: recordId -> slug
  const programSlugMap = {};
  const programNameMap = {};
  for (const record of programsData.records) {
    if (record.fields.Slug) {
      programSlugMap[record.id] = record.fields.Slug;
      programNameMap[record.id] = record.fields['Program Name'] || record.fields.Slug;
    }
  }
  console.log(`  Found ${Object.keys(programSlugMap).length} programs with slugs`);
  console.log('');

  // 2. Fetch all faculty
  console.log('Fetching all faculty members...');
  const facultyData = await fetchAllFaculty(BASE_ID, API_KEY);
  const allFaculty = facultyData.records.map(mapFacultyRecord);
  console.log(`  Found ${allFaculty.length} faculty members`);
  console.log('');

  // 3. Organize faculty by program slug
  const facultyByProgram = {};

  for (const faculty of allFaculty) {
    const programIds = faculty.programRecordIds;

    if (!Array.isArray(programIds) || programIds.length === 0) {
      continue; // Skip faculty not linked to any program
    }

    for (const programId of programIds) {
      const slug = programSlugMap[programId];
      if (!slug) continue; // Skip if program doesn't have a slug

      if (!facultyByProgram[slug]) {
        facultyByProgram[slug] = {
          programName: programNameMap[programId],
          faculty: []
        };
      }

      // Add faculty (without programRecordIds field in output)
      const { programRecordIds, ...facultyWithoutIds } = faculty;
      facultyByProgram[slug].faculty.push(facultyWithoutIds);
    }
  }

  // 4. Write all-faculty.json
  const allFacultyOutput = {
    generated,
    version: '1.0.0',
    source: 'airtable',
    recordCount: allFaculty.length,
    faculty: allFaculty.map(({ programRecordIds, ...f }) => f)
  };

  fs.writeFileSync(
    path.join(dataDir, 'all-faculty.json'),
    JSON.stringify(allFacultyOutput, null, 2)
  );
  console.log(`Wrote ${allFaculty.length} faculty to all-faculty.json`);

  // 5. Write per-program cache files
  console.log('');
  console.log('Writing per-program cache files...');

  const programStats = [];

  for (const [slug, data] of Object.entries(facultyByProgram)) {
    const programOutput = {
      generated,
      programSlug: slug,
      programName: data.programName,
      facultyCount: data.faculty.length,
      faculty: data.faculty
    };

    fs.writeFileSync(
      path.join(byProgramDir, `${slug}.json`),
      JSON.stringify(programOutput, null, 2)
    );

    programStats.push({ slug, count: data.faculty.length, name: data.programName });
    console.log(`  ${slug}: ${data.faculty.length} faculty`);
  }

  // 6. Write metadata
  const metadata = {
    generated,
    version: '1.0.0',
    totalFaculty: allFaculty.length,
    programsCount: Object.keys(facultyByProgram).length,
    programStats
  };

  fs.writeFileSync(
    path.join(dataDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log('');
  console.log('Faculty cache generation complete!');
  console.log(`  Total faculty: ${allFaculty.length}`);
  console.log(`  Programs with faculty: ${Object.keys(facultyByProgram).length}`);
  console.log(`  Output directory: ${dataDir}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
