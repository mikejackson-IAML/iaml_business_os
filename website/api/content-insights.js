/**
 * Content Insights API
 *
 * Aggregates data from quiz responses, registrations, and external sources
 * to provide content optimization insights.
 *
 * Endpoints:
 *   GET  /api/content-insights                  - Get all latest insights
 *   GET  /api/content-insights?type=challenges  - Get specific insight type
 *   GET  /api/content-insights?type=quiz-stats  - Get aggregated quiz statistics
 *   POST /api/content-insights                  - Create new insight (from n8n)
 *
 * Uses Supabase for storage, Airtable for quiz data
 */

// Load environment variables in development
if (!process.env.SUPABASE_URL && process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          const cleanValue = value.trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = cleanValue;
        }
      });
    }
  } catch (e) {
    // Silently fail
  }
}

// Supabase client setup
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_TOKEN
  );
}

// Airtable fetch helper
async function fetchAirtable(table, params = {}) {
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const API_KEY = process.env.AIRTABLE_QUIZ_API_KEY;

  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Airtable error: ${response.status}`);
  }

  return response.json();
}

// Aggregate quiz statistics
async function aggregateQuizStats() {
  try {
    // Fetch quiz sessions (completed quizzes)
    const sessionsData = await fetchAirtable('Quiz Sessions', {
      filterByFormula: 'NOT({Status} = "")',
      maxRecords: 1000
    });

    const sessions = sessionsData.records || [];

    // Calculate distributions
    const roleDistribution = {};
    const challengeDistribution = {};
    const experienceDistribution = {};
    const formatDistribution = {};

    sessions.forEach(session => {
      const fields = session.fields || {};

      // Role distribution
      const role = fields['Role Answer'] || 'unknown';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;

      // Challenge distribution
      const challenge = fields['Challenge Answer'] || 'unknown';
      challengeDistribution[challenge] = (challengeDistribution[challenge] || 0) + 1;

      // Experience distribution
      const experience = fields['Experience Answer'] || 'unknown';
      experienceDistribution[experience] = (experienceDistribution[experience] || 0) + 1;

      // Format distribution
      const format = fields['Format Answer'] || 'unknown';
      formatDistribution[format] = (formatDistribution[format] || 0) + 1;
    });

    return {
      total_responses: sessions.length,
      role_distribution: roleDistribution,
      challenge_distribution: challengeDistribution,
      experience_distribution: experienceDistribution,
      format_distribution: formatDistribution,
      top_challenge: Object.entries(challengeDistribution)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
      top_role: Object.entries(roleDistribution)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
      aggregated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error aggregating quiz stats:', error);
    throw error;
  }
}

// Get latest insights from Supabase
async function getLatestInsights(supabase, type = null) {
  let query = supabase
    .from('content_insights')
    .select('*')
    .order('aggregated_at', { ascending: false });

  if (type) {
    query = query.eq('insight_type', type);
  }

  const { data, error } = await query.limit(50);

  if (error) throw error;
  return data;
}

// Get pending recommendations
async function getPendingRecommendations(supabase, pagePath = null) {
  let query = supabase
    .from('content_recommendations')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });

  if (pagePath) {
    query = query.eq('page_path', pagePath);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Store new insight
async function storeInsight(supabase, insightData) {
  const { data, error } = await supabase
    .from('content_insights')
    .insert([insightData])
    .select();

  if (error) throw error;
  return data[0];
}

// Store new recommendation
async function storeRecommendation(supabase, recommendationData) {
  const { data, error } = await supabase
    .from('content_recommendations')
    .insert([recommendationData])
    .select();

  if (error) throw error;
  return data[0];
}

// Update recommendation status
async function updateRecommendationStatus(supabase, id, status, updatedBy = 'system') {
  const updateData = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: updatedBy
  };

  if (status === 'applied') {
    updateData.applied_at = new Date().toISOString();
    updateData.applied_by = updatedBy;
  }

  const { data, error } = await supabase
    .from('content_recommendations')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

// Get brand voice config
async function getBrandVoiceConfig(supabase) {
  const { data, error } = await supabase
    .from('brand_voice_config')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;

  // Transform to easier-to-use format
  const config = {};
  data.forEach(row => {
    config[row.config_type] = row.data;
  });

  return config;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = await getSupabaseClient();
    const { type, page, action, id } = req.query;

    // GET requests
    if (req.method === 'GET') {

      // Get aggregated quiz stats (live from Airtable)
      if (type === 'quiz-stats') {
        const stats = await aggregateQuizStats();
        return res.status(200).json({
          success: true,
          data: stats
        });
      }

      // Get pending recommendations
      if (type === 'recommendations') {
        const recommendations = await getPendingRecommendations(supabase, page);
        return res.status(200).json({
          success: true,
          data: recommendations,
          count: recommendations.length
        });
      }

      // Get brand voice config
      if (type === 'brand-voice') {
        const config = await getBrandVoiceConfig(supabase);
        return res.status(200).json({
          success: true,
          data: config
        });
      }

      // Get insights by type or all
      const insights = await getLatestInsights(supabase, type);
      return res.status(200).json({
        success: true,
        data: insights,
        count: insights.length
      });
    }

    // POST requests
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Store new insight
      if (action === 'insight') {
        const insight = await storeInsight(supabase, {
          insight_type: body.insight_type,
          source: body.source,
          data: body.data,
          period: body.period || 'daily',
          page_path: body.page_path
        });
        return res.status(201).json({
          success: true,
          data: insight
        });
      }

      // Store new recommendation
      if (action === 'recommendation') {
        const recommendation = await storeRecommendation(supabase, {
          page_path: body.page_path,
          element_selector: body.element_selector,
          content_type: body.content_type,
          recommendation_type: body.recommendation_type,
          priority: body.priority || 'medium',
          current_content: body.current_content,
          suggested_content: body.suggested_content,
          rationale: body.rationale,
          data_sources: body.data_sources,
          metrics: body.metrics,
          created_by: body.created_by || 'claude-code'
        });
        return res.status(201).json({
          success: true,
          data: recommendation
        });
      }

      // Aggregate and store quiz stats
      if (action === 'aggregate-quiz') {
        const stats = await aggregateQuizStats();
        const insight = await storeInsight(supabase, {
          insight_type: 'quiz_aggregate',
          source: 'quiz',
          data: stats,
          period: body.period || 'daily'
        });
        return res.status(201).json({
          success: true,
          data: insight
        });
      }

      return res.status(400).json({ error: 'Invalid action. Use: insight, recommendation, or aggregate-quiz' });
    }

    // PATCH requests (update recommendation status)
    if (req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json({ error: 'id parameter required' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!body.status) {
        return res.status(400).json({ error: 'status field required' });
      }

      const updated = await updateRecommendationStatus(
        supabase,
        id,
        body.status,
        body.updated_by || 'user'
      );

      return res.status(200).json({
        success: true,
        data: updated
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Content insights API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
