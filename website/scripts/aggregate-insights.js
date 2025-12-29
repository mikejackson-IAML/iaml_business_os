/**
 * Aggregate Content Insights Script
 *
 * This script aggregates data from various sources and stores insights
 * in Supabase for the Content Optimization System.
 *
 * Can be run:
 * - Manually: node scripts/aggregate-insights.js
 * - Via n8n workflow (scheduled)
 * - Via Claude Code command
 *
 * Environment variables required:
 * - AIRTABLE_BASE_ID
 * - AIRTABLE_QUIZ_API_KEY
 * - SUPABASE_URL or SUPABASE_PROJECT_REF
 * - SUPABASE_SERVICE_KEY or SUPABASE_TOKEN
 */

const https = require('https');

// Configuration
const CONFIG = {
  airtable: {
    baseId: process.env.AIRTABLE_BASE_ID,
    apiKey: process.env.AIRTABLE_QUIZ_API_KEY,
    tables: {
      quizSessions: 'Quiz Sessions',
      quizAnswers: 'Quiz Answers'
    }
  },
  supabase: {
    url: process.env.SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`,
    key: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_TOKEN
  }
};

// Helper: Make HTTPS request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Fetch all records from Airtable (handles pagination)
async function fetchAllAirtableRecords(table, filterFormula = null) {
  const records = [];
  let offset = null;

  do {
    const url = new URL(`https://api.airtable.com/v0/${CONFIG.airtable.baseId}/${encodeURIComponent(table)}`);
    if (filterFormula) url.searchParams.append('filterByFormula', filterFormula);
    if (offset) url.searchParams.append('offset', offset);
    url.searchParams.append('maxRecords', '100');

    const response = await makeRequest(url.toString(), {
      headers: {
        'Authorization': `Bearer ${CONFIG.airtable.apiKey}`
      }
    });

    if (response.records) {
      records.push(...response.records);
    }
    offset = response.offset;

    // Rate limiting: 5 requests per second
    await new Promise(r => setTimeout(r, 220));
  } while (offset);

  return records;
}

// Store insight in Supabase
async function storeInsight(insightType, source, data, period = 'daily') {
  const url = `${CONFIG.supabase.url}/rest/v1/content_insights`;

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.supabase.key}`,
      'apikey': CONFIG.supabase.key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: {
      insight_type: insightType,
      source: source,
      data: data,
      period: period,
      aggregated_at: new Date().toISOString()
    }
  });

  return response;
}

// Aggregate quiz response statistics
async function aggregateQuizStats() {
  console.log('Fetching quiz sessions from Airtable...');

  const sessions = await fetchAllAirtableRecords(
    CONFIG.airtable.tables.quizSessions,
    'NOT({Status} = "")'
  );

  console.log(`Found ${sessions.length} quiz sessions`);

  // Initialize distributions
  const distributions = {
    role: {},
    challenge: {},
    experience: {},
    format: {}
  };

  // Process each session
  sessions.forEach(session => {
    const fields = session.fields || {};

    // Map field names to distribution keys
    const mappings = {
      role: fields['Role Answer'] || fields['role'] || 'unknown',
      challenge: fields['Challenge Answer'] || fields['challenge'] || 'unknown',
      experience: fields['Experience Answer'] || fields['experience'] || 'unknown',
      format: fields['Format Answer'] || fields['format'] || 'unknown'
    };

    Object.entries(mappings).forEach(([key, value]) => {
      distributions[key][value] = (distributions[key][value] || 0) + 1;
    });
  });

  // Calculate percentages
  const total = sessions.length;
  const percentages = {};

  Object.entries(distributions).forEach(([key, dist]) => {
    percentages[key] = {};
    Object.entries(dist).forEach(([value, count]) => {
      percentages[key][value] = {
        count: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    });
  });

  // Find top values
  const getTop = (dist) => {
    const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'unknown';
  };

  return {
    total_responses: total,
    distributions: percentages,
    top_values: {
      role: getTop(distributions.role),
      challenge: getTop(distributions.challenge),
      experience: getTop(distributions.experience),
      format: getTop(distributions.format)
    },
    content_recommendations: generateContentRecommendations(distributions, total),
    aggregated_at: new Date().toISOString()
  };
}

// Generate content recommendations based on quiz data
function generateContentRecommendations(distributions, total) {
  const recommendations = [];

  // Challenge-based recommendations
  const challengeRanking = Object.entries(distributions.challenge)
    .sort((a, b) => b[1] - a[1]);

  if (challengeRanking[0]) {
    const [topChallenge, count] = challengeRanking[0];
    const percentage = Math.round((count / total) * 100);

    recommendations.push({
      type: 'messaging',
      priority: 'high',
      insight: `${percentage}% of visitors cite "${topChallenge}" as their primary challenge`,
      action: `Lead with ${topChallenge}-focused messaging in hero sections`,
      pages: ['homepage', 'program pages']
    });
  }

  // Role-based recommendations
  const roleRanking = Object.entries(distributions.role)
    .sort((a, b) => b[1] - a[1]);

  if (roleRanking[0]) {
    const [topRole, count] = roleRanking[0];
    const percentage = Math.round((count / total) * 100);

    recommendations.push({
      type: 'targeting',
      priority: 'medium',
      insight: `${percentage}% of visitors are ${topRole}s`,
      action: `Ensure copy speaks directly to ${topRole} pain points and goals`,
      pages: ['program pages', 'landing pages']
    });
  }

  // Format preference recommendations
  const formatRanking = Object.entries(distributions.format)
    .sort((a, b) => b[1] - a[1]);

  if (formatRanking[0]) {
    const [topFormat, count] = formatRanking[0];
    const percentage = Math.round((count / total) * 100);

    recommendations.push({
      type: 'ux',
      priority: 'medium',
      insight: `${percentage}% prefer ${topFormat} format`,
      action: `Feature ${topFormat} option prominently in format selectors`,
      pages: ['program pages']
    });
  }

  // Experience level recommendations
  const expRanking = Object.entries(distributions.experience)
    .sort((a, b) => b[1] - a[1]);

  if (expRanking[0] && expRanking[1]) {
    const [topExp] = expRanking[0];
    const [secondExp] = expRanking[1];

    recommendations.push({
      type: 'content',
      priority: 'low',
      insight: `Primary audience: ${topExp}, Secondary: ${secondExp}`,
      action: `Balance content complexity for ${topExp} while still serving ${secondExp}`,
      pages: ['curriculum sections', 'FAQ']
    });
  }

  return recommendations;
}

// Main aggregation function
async function runAggregation() {
  console.log('=== Content Insights Aggregation ===');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  // Check configuration
  if (!CONFIG.airtable.baseId || !CONFIG.airtable.apiKey) {
    console.error('Error: Missing Airtable configuration');
    console.error('Required: AIRTABLE_BASE_ID, AIRTABLE_QUIZ_API_KEY');
    process.exit(1);
  }

  if (!CONFIG.supabase.url || !CONFIG.supabase.key) {
    console.error('Error: Missing Supabase configuration');
    console.error('Required: SUPABASE_URL/SUPABASE_PROJECT_REF, SUPABASE_SERVICE_KEY/SUPABASE_TOKEN');
    process.exit(1);
  }

  try {
    // Aggregate quiz statistics
    console.log('--- Quiz Statistics ---');
    const quizStats = await aggregateQuizStats();

    console.log(`Total responses: ${quizStats.total_responses}`);
    console.log(`Top challenge: ${quizStats.top_values.challenge}`);
    console.log(`Top role: ${quizStats.top_values.role}`);
    console.log(`Generated ${quizStats.content_recommendations.length} recommendations`);
    console.log('');

    // Store in Supabase
    console.log('Storing insights in Supabase...');

    // Store challenge distribution
    await storeInsight('challenge', 'quiz', {
      distribution: quizStats.distributions.challenge,
      top_value: quizStats.top_values.challenge,
      total_responses: quizStats.total_responses
    });

    // Store role distribution
    await storeInsight('role', 'quiz', {
      distribution: quizStats.distributions.role,
      top_value: quizStats.top_values.role,
      total_responses: quizStats.total_responses
    });

    // Store format distribution
    await storeInsight('format', 'quiz', {
      distribution: quizStats.distributions.format,
      top_value: quizStats.top_values.format,
      total_responses: quizStats.total_responses
    });

    // Store full aggregate
    await storeInsight('quiz_aggregate', 'quiz', quizStats);

    console.log('Insights stored successfully!');
    console.log('');

    // Output summary
    console.log('=== Summary ===');
    console.log(`Processed: ${quizStats.total_responses} quiz responses`);
    console.log(`Insights stored: 4`);
    console.log(`Recommendations generated: ${quizStats.content_recommendations.length}`);
    console.log('');

    // Output content recommendations
    console.log('=== Content Recommendations ===');
    quizStats.content_recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.insight}`);
      console.log(`   Action: ${rec.action}`);
      console.log('');
    });

    console.log(`Completed: ${new Date().toISOString()}`);

    return quizStats;

  } catch (error) {
    console.error('Aggregation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAggregation();
}

// Export for use in other modules
module.exports = {
  runAggregation,
  aggregateQuizStats,
  storeInsight,
  fetchAllAirtableRecords
};
