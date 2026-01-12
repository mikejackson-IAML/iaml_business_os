#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_KEY = process.env.SUPABASE_TOKEN;

async function runMigration() {
  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_core_foundation_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Running migration on:', SUPABASE_URL);
  console.log('SQL file:', sqlPath);
  console.log('SQL length:', sql.length, 'characters');

  // Split into individual statements (rough split on semicolons followed by newlines)
  // This is needed because some endpoints don't support multiple statements
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`\nFound ${statements.length} SQL statements to execute\n`);

  // Use the Supabase REST API to execute SQL via a stored procedure
  // Or we can use the pg module directly if available

  // Actually, the service role key allows us to use the database directly
  // Let's try using fetch to call a custom RPC or the SQL endpoint

  // Supabase has a SQL endpoint at /rest/v1/rpc but we need a function
  // The better approach is to use the @supabase/supabase-js client

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // For raw SQL, we need to use the postgres connection directly
    // The JS client doesn't support raw SQL execution

    // Let's check if the tables already exist
    const { data: tables, error } = await supabase
      .from('programs')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('Tables do not exist yet. Please run the SQL in the Supabase Dashboard SQL Editor.');
      console.log('\n1. Go to: https://supabase.com/dashboard/project/' + process.env.SUPABASE_PROJECT_REF + '/sql/new');
      console.log('2. Paste the contents of: supabase/migrations/001_core_foundation_tables.sql');
      console.log('3. Click "Run"');
    } else if (error) {
      console.log('Error checking tables:', error.message);
    } else {
      console.log('Tables already exist!');
    }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log('Supabase JS client not installed. Installing...');
      const { execSync } = require('child_process');
      execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
      console.log('\nPlease run this script again.');
    } else {
      throw e;
    }
  }
}

runMigration().catch(console.error);
