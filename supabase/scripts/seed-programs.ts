/**
 * Seed Programs Data from Airtable Cache
 *
 * This script imports program data from the Airtable cache into Supabase.
 * Run with: npx tsx supabase/scripts/seed-programs.ts
 *
 * Prerequisites:
 * 1. Run the migration first: supabase/migrations/20260113_create_programs_schema.sql
 * 2. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const AIRTABLE_CACHE_PATH = path.join(__dirname, '../../website/data/sessions/all-sessions.json');

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: {
    'Instance ID'?: number;
    'Instance Name'?: string;
    'Program Name'?: string[];
    'Programs'?: string[];
    'Format'?: string;
    'Start Date'?: string;
    'End Date'?: string;
    'City'?: string;
    'State/Province'?: string;
    'City (from Venue)'?: string[];
    'State (from Venue)'?: string[];
    'Venue Name (from Venue)'?: string[];
    'Venue'?: string[];
    'Current Enrolled'?: number;
    'Min. Capacity'?: number[];
    'Enrollment Status'?: string;
    'Show on Website'?: boolean;
    'Room Rate'?: number;
    'Resort Fee'?: number;
    'Group Rate Cutoff Date'?: string;
    'Room Block Booking Link'?: string;
    'Hotel Booking Link'?: string;
    'Full Name with Credentials (from Block 1 Instructor)'?: string[];
    'Full Name with Credentials (from Block 2 Instructor)'?: string[];
    'Block 1 Instructor'?: string[];
    'Block 2 Instructor'?: string[];
    'Block 1 Title'?: string;
    'Block 2 Title'?: string;
    'Registration Deadline'?: string;
    'Duration (Days)'?: number[];
  };
}

interface AirtableCache {
  generated: string;
  version: string;
  source: string;
  recordCount: number;
  records: AirtableRecord[];
}

// Normalize format string
function normalizeFormat(format: string | undefined): string {
  if (!format) return 'virtual';
  const lower = format.toLowerCase();
  if (lower.includes('in-person') || lower === 'in person') return 'in-person';
  if (lower.includes('on-demand') || lower.includes('on demand')) return 'on-demand';
  return 'virtual';
}

// Determine program status based on dates and enrollment
function determineStatus(record: AirtableRecord): string {
  const fields = record.fields;
  const startDate = fields['Start Date'] ? new Date(fields['Start Date']) : null;
  const today = new Date();

  if (!startDate) return 'scheduled';
  if (startDate < today) return 'completed';
  return 'scheduled';
}

// Main seeding function
async function seedPrograms() {
  console.log('Reading Airtable cache...');

  // Read Airtable cache
  const cacheContent = fs.readFileSync(AIRTABLE_CACHE_PATH, 'utf-8');
  const cache: AirtableCache = JSON.parse(cacheContent);

  console.log(`Found ${cache.recordCount} records in cache (generated: ${cache.generated})`);

  // Track stats
  const stats = {
    programsInserted: 0,
    programsSkipped: 0,
    readinessCreated: 0,
    roomBlocksCreated: 0,
    facultyAssigned: 0,
    errors: 0,
  };

  // Process each record
  for (const record of cache.records) {
    const fields = record.fields;

    // Skip records without Instance Name
    if (!fields['Instance Name']) {
      console.log(`Skipping record ${record.id}: no Instance Name`);
      stats.programsSkipped++;
      continue;
    }

    try {
      // 1. Insert program_instance
      const programData = {
        airtable_id: record.id,
        instance_name: fields['Instance Name'],
        program_name: fields['Program Name']?.[0] || fields['Instance Name'],
        format: normalizeFormat(fields['Format']),
        start_date: fields['Start Date'] || null,
        end_date: fields['End Date'] || null,
        city: fields['City'] || fields['City (from Venue)']?.[0] || null,
        state: fields['State/Province'] || fields['State (from Venue)']?.[0] || null,
        venue_name: fields['Venue Name (from Venue)']?.[0] || null,
        current_enrolled: fields['Current Enrolled'] || 0,
        min_capacity: fields['Min. Capacity']?.[0] || 15,
        max_capacity: 35, // Default max
        status: determineStatus(record),
      };

      const { data: program, error: programError } = await supabase
        .from('program_instances')
        .upsert(programData, { onConflict: 'airtable_id' })
        .select('id')
        .single();

      if (programError) {
        console.error(`Error inserting program ${fields['Instance Name']}:`, programError);
        stats.errors++;
        continue;
      }

      stats.programsInserted++;
      const programId = program.id;

      // 2. Create empty program_readiness record
      const { error: readinessError } = await supabase
        .from('program_readiness')
        .upsert(
          {
            program_instance_id: programId,
            // All checklist items start as null (not completed)
          },
          { onConflict: 'program_instance_id' }
        );

      if (readinessError) {
        console.error(`Error creating readiness for ${fields['Instance Name']}:`, readinessError);
      } else {
        stats.readinessCreated++;
      }

      // 3. Create room_block if room rate data exists
      if (fields['Room Rate'] && fields['Venue Name (from Venue)']?.[0]) {
        const roomBlockData = {
          program_instance_id: programId,
          hotel_name: fields['Venue Name (from Venue)'][0],
          rate_per_night: fields['Room Rate'],
          cutoff_date: fields['Group Rate Cutoff Date'] || null,
          booking_link:
            fields['Room Block Booking Link'] || fields['Hotel Booking Link'] || null,
          block_size: 20, // Default block size
          rooms_booked: 0,
          status: 'active',
        };

        const { error: roomError } = await supabase.from('room_blocks').upsert(roomBlockData, {
          onConflict: 'program_instance_id',
          ignoreDuplicates: true,
        });

        if (roomError && !roomError.message.includes('duplicate')) {
          console.error(`Error creating room block for ${fields['Instance Name']}:`, roomError);
        } else if (!roomError) {
          stats.roomBlocksCreated++;
        }
      }

      // 4. Create faculty_assignments
      const facultyAssignments: { name: string; block: number }[] = [];

      if (fields['Full Name with Credentials (from Block 1 Instructor)']?.[0]) {
        facultyAssignments.push({
          name: fields['Full Name with Credentials (from Block 1 Instructor)'][0],
          block: 1,
        });
      }
      if (fields['Full Name with Credentials (from Block 2 Instructor)']?.[0]) {
        facultyAssignments.push({
          name: fields['Full Name with Credentials (from Block 2 Instructor)'][0],
          block: 2,
        });
      }

      for (const faculty of facultyAssignments) {
        const { error: facultyError } = await supabase.from('faculty_assignments').upsert(
          {
            program_instance_id: programId,
            faculty_name: faculty.name,
            block_number: faculty.block,
            confirmed: false, // Start as unconfirmed
          },
          {
            onConflict: 'program_instance_id,block_number',
            ignoreDuplicates: true,
          }
        );

        if (facultyError && !facultyError.message.includes('duplicate')) {
          console.error(`Error creating faculty for ${fields['Instance Name']}:`, facultyError);
        } else if (!facultyError) {
          stats.facultyAssigned++;
        }
      }

      console.log(`✓ Seeded: ${fields['Instance Name']}`);
    } catch (err) {
      console.error(`Error processing ${fields['Instance Name']}:`, err);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n========================================');
  console.log('SEEDING COMPLETE');
  console.log('========================================');
  console.log(`Programs inserted/updated: ${stats.programsInserted}`);
  console.log(`Programs skipped: ${stats.programsSkipped}`);
  console.log(`Readiness records created: ${stats.readinessCreated}`);
  console.log(`Room blocks created: ${stats.roomBlocksCreated}`);
  console.log(`Faculty assignments created: ${stats.facultyAssigned}`);
  console.log(`Errors: ${stats.errors}`);
}

// Run
seedPrograms()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
