const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CSV_PATH = process.argv[2];

if (!CSV_PATH) {
  console.error('Usage: node import_smartlead_contacts.js <csv-file>');
  process.exit(1);
}

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapVerificationStatus(status) {
  const map = { valid: 'valid', invalid: 'invalid', catch_all: 'catch_all', unknown: 'unknown', risky: 'risky' };
  return map[status] || 'unknown';
}

function deriveTier(title, level) {
  if (!title && !level) return null;
  const t = (title || '').toLowerCase();
  const l = (level || '').toLowerCase();
  // Tier 2: Executives
  if (/\b(vp|vice president|svp|chro|chief|evp)\b/.test(t) || l.includes('vp') || l.includes('c-level')) return 'tier_2';
  // Tier 1: Directors
  if (/\b(director|senior.*manager|head of)\b/.test(t) || l.includes('director')) return 'tier_1';
  // Tier 3: Managers and below
  if (/\b(manager|generalist|business partner|specialist|coordinator|analyst|associate)\b/.test(t) || l.includes('manager')) return 'tier_3';
  return null;
}

function parseHeadcount(hc) {
  if (!hc) return null;
  // Extract the lower bound number: "1K - 10K" -> 1000, "100 - 250" -> 100
  const match = hc.match(/^[>]?\s*([\d.]+)\s*(K)?/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  if (match[2]) num *= 1000;
  return Math.round(num);
}

async function supaFetch(path, opts = {}) {
  const h = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: h });
  return r;
}

async function upsertCompany(row) {
  const name = row.companyName;
  if (!name) return null;

  // Check if company exists by name
  const r = await supaFetch(`companies?name=eq.${encodeURIComponent(name)}&select=id`);
  const existing = await r.json();
  if (existing.length > 0) return existing[0].id;

  // Create company
  const company = {
    name,
    website: row.companyWebsite || null,
    industry: row.industry || null,
    employee_count: parseHeadcount(row.companyHeadCount),
    revenue_range: row.companyRevenue || null,
    country: row.country || null,
    state: row.state || null,
    city: row.city || null,
  };

  const r2 = await supaFetch('companies', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(company),
  });
  const created = await r2.json();
  if (Array.isArray(created) && created.length > 0) return created[0].id;
  return null;
}

async function run() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} contacts from CSV`);

  // Cache company IDs to avoid duplicate lookups
  const companyCache = {};
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let dupes = 0;
  const BATCH_SIZE = 50;

  // Process in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const contacts = [];

    for (const row of batch) {
      if (!row.email) { skipped++; continue; }

      // Get or create company
      let companyId = null;
      if (row.companyName) {
        if (companyCache[row.companyName]) {
          companyId = companyCache[row.companyName];
        } else {
          companyId = await upsertCompany(row);
          if (companyId) companyCache[row.companyName] = companyId;
        }
      }

      const tier = deriveTier(row.title, row.level);
      const linkedinUrl = row.linkedin && !row.linkedin.startsWith('http')
        ? `https://${row.linkedin}`
        : row.linkedin || null;

      contacts.push({
        first_name: row.firstName || null,
        last_name: row.lastName || null,
        email: row.email.toLowerCase().trim(),
        title: row.title || null,
        department: row.department || null,
        seniority_level: row.level || null,
        country: row.country || null,
        state: row.state || null,
        city: row.city || null,
        linkedin_url: linkedinUrl,
        company_id: companyId,
        // SmartLead specific
        status: 'lead',
        pipeline_stage: 'new',
        tier,
        email_status: mapVerificationStatus(row.verificationStatus),
        email_verified_at: row.verificationStatus === 'valid' ? new Date().toISOString() : null,
        smartlead_status: row.status || null,
        lead_source: 'smartlead',
        enrichment_source: 'smartlead',
        enrichment_data: JSON.stringify({
          catch_all_status: row.catchAllStatus || null,
          sub_industry: row.subIndustry || null,
          filter_status: row._filter_status || null,
          filter_reason: row._filter_reason || null,
          company_headcount_range: row.companyHeadCount || null,
          company_revenue_range: row.companyRevenue || null,
          address: row.address || null,
          imported_at: new Date().toISOString(),
        }),
      });
    }

    if (contacts.length === 0) continue;

    // Try batch insert first
    const r = await supaFetch('contacts', {
      method: 'POST',
      headers: { Prefer: 'return=headers-only,count=exact' },
      body: JSON.stringify(contacts),
    });

    if (r.status === 201 || r.status === 200) {
      imported += contacts.length;
    } else {
      // Batch failed - retry individually to skip only actual duplicates
      for (const contact of contacts) {
        const r2 = await supaFetch('contacts', {
          method: 'POST',
          headers: { Prefer: 'return=headers-only' },
          body: JSON.stringify(contact),
        });
        if (r2.status === 201 || r2.status === 200) {
          imported++;
        } else {
          const errBody = await r2.text();
          if (errBody.includes('duplicate key')) {
            dupes++;
          } else {
            errors++;
            if (errors <= 5) console.error(`\nError for ${contact.email}: ${errBody.substring(0, 150)}`);
          }
        }
      }
    }

    // Progress
    const pct = Math.round(((i + batch.length) / rows.length) * 100);
    process.stdout.write(`\rProgress: ${pct}% | Imported: ${imported} | Dupes: ${dupes} | Skipped: ${skipped} | Errors: ${errors}`);
  }

  console.log('\n\nImport complete!');
  console.log(`  Imported: ${imported}`);
  console.log(`  Duplicates skipped: ${dupes}`);
  console.log(`  No email: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Companies created/found: ${Object.keys(companyCache).length}`);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
