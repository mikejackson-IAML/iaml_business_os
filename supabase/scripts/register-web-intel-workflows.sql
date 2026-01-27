-- Register Web Intelligence Workflows in n8n_brain.workflow_registry
-- Generated: 2026-01-21
-- Purpose: Register all 46 Web Intelligence workflows with metadata

-- ============================================
-- PHASE 1: TRAFFIC WORKFLOWS (TRF-01 to TRF-06)
-- ============================================

SELECT n8n_brain.register_workflow(
  'UbnzS6cyOmeIAQg0',
  'Web Intel - Traffic - Daily Collector',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 6am CT',
  'Collects daily traffic metrics from GA4 including sessions, users, pageviews, bounce rate, and average session duration. Stores in web_intel.daily_traffic table.',
  ARRAY['ga4', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'ETVro3ICNtAtbAEq',
  'Web Intel - Traffic - Anomaly Detector',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 7am CT',
  'Analyzes daily traffic data for anomalies using statistical methods. Detects unusual spikes or drops in traffic metrics and flags them for review.',
  ARRAY['supabase'],
  TRUE,
  FALSE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'rF5rVvu53oHYNcVe',
  'Web Intel - Traffic - Alert Notifier',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 7:30am CT',
  'Sends Slack notifications for traffic anomalies detected by TRF-02. Includes context about the anomaly type and severity.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'wctl4o3mDeduPV4s',
  'Web Intel - Traffic - Page Performance',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 6:15am CT',
  'Collects page-level traffic metrics from GA4 including top pages, entry pages, and exit pages. Tracks individual page performance over time.',
  ARRAY['ga4', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'DtCML41ZGWAR2Srf',
  'Web Intel - Traffic - Source Breakdown',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 6:30am CT',
  'Breaks down traffic by source/medium including organic, direct, referral, social, and paid. Tracks channel performance trends.',
  ARRAY['ga4', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'znOkuszsG8O8qX6O',
  'Web Intel - Traffic - Geographic Analyzer',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 6:45am CT',
  'Analyzes traffic by geographic location including country, region, and city. Identifies geographic trends and opportunities.',
  ARRAY['ga4', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 1: RANKINGS WORKFLOWS (RNK-01 to RNK-07)
-- ============================================

SELECT n8n_brain.register_workflow(
  '9B0tw9jWKw6hC1oK',
  'Web Intel - Rankings - Daily Tracker',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 5am CT',
  'Tracks daily keyword rankings using DataForSEO SERP API. Monitors position changes for tracked keywords and stores competitor positions.',
  ARRAY['dataforseo', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'wQ0U9uUSHnIX0sdL',
  'Web Intel - Rankings - Change Detector',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 8am CT',
  'Detects significant ranking changes by comparing current positions to historical data. Flags keywords with notable gains or losses.',
  ARRAY['supabase'],
  TRUE,
  FALSE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'UTwZ1v1EffRRT2dv',
  'Web Intel - Rankings - Alert Notifier',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 8:30am CT',
  'Sends Slack alerts for significant ranking changes detected by RNK-02. Includes keyword, old position, new position, and change direction.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  '4ghDn661GG2k46HG',
  'Web Intel - Rankings - SERP Features',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 5:30am CT',
  'Tracks SERP features (featured snippets, knowledge panels, PAA, etc.) for tracked keywords. Monitors feature ownership and opportunities.',
  ARRAY['dataforseo', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'JwrnYD17LOSZUmra',
  'Web Intel - Rankings - Opportunity Finder',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Monday 9am CT',
  'Identifies ranking opportunities based on keywords close to page 1, declining competitors, and low-competition keywords.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'BceiAVXcEoJTo4cQ',
  'Web Intel - Rankings - Keyword Discovery',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Wednesday 10am CT',
  'Discovers new keyword opportunities using DataForSEO keyword suggestions and related searches. Adds promising keywords to tracking list.',
  ARRAY['dataforseo', 'supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'vr0oVa8P2EdCubo8',
  'Web Intel - Rankings - Volume Updater',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Monthly 1st 2am CT',
  'Updates search volume data for all tracked keywords using DataForSEO. Refreshes volume metrics to ensure accuracy.',
  ARRAY['dataforseo', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 2: GSC WORKFLOWS (GSC-01 to GSC-07)
-- ============================================

SELECT n8n_brain.register_workflow(
  '25KaAvlPHwZ8R88v',
  'Web Intel - GSC - Index Coverage Sync',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 4am CT',
  'Syncs index coverage data from Google Search Console. Tracks indexed, excluded, and error pages over time.',
  ARRAY['gsc', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'c7unJvBZ20ukIdVm',
  'Web Intel - GSC - Index Error Alerter',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 4:30am CT',
  'Alerts on new indexing errors detected in GSC. Categorizes errors and prioritizes by impact.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'RS5KDyZFlbybFkWy',
  'Web Intel - GSC - Core Web Vitals Monitor',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 4:15am CT',
  'Monitors Core Web Vitals (LCP, FID, CLS) from GSC. Tracks mobile and desktop performance separately.',
  ARRAY['gsc', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'IJss2eV5Jg9C1Xyr',
  'Web Intel - GSC - Search Performance',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 3:30am CT',
  'Collects search performance data including clicks, impressions, CTR, and position from GSC. Provides query-level insights.',
  ARRAY['gsc', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'LrQW5mTWvQ0hXuia',
  'Web Intel - GSC - Crawl Stats Analyzer',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 3am CT',
  'Analyzes crawl statistics from GSC including crawl requests, response times, and crawl budget usage.',
  ARRAY['gsc', 'supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  '9EBf7fQpSHouh5w8',
  'Web Intel - GSC - Mobile Usability Checker',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 3:15am CT',
  'Checks mobile usability issues reported in GSC. Tracks touch target, viewport, and font size issues.',
  ARRAY['gsc', 'supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'g6W58UpTlKmxi4k3',
  'Web Intel - GSC - Sitemap Status Monitor',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 3:45am CT',
  'Monitors sitemap submission status in GSC. Tracks submitted vs indexed URLs and sitemap errors.',
  ARRAY['gsc', 'supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 2: CONTENT WORKFLOWS (CNT-01 to CNT-06)
-- ============================================

SELECT n8n_brain.register_workflow(
  'z7TURDap2iKQrCCt',
  'Web Intel - Content Inventory Sync',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 2am CT',
  'Maintains content inventory by syncing page metadata, word counts, and publication dates. Foundation for content analysis.',
  ARRAY['supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'Wm63f2pD3KCTWKWL',
  'Web Intel - Content Decay Detector',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Monday 6am CT',
  'Identifies content decay by analyzing traffic trends over time. Flags pages with declining performance for refresh consideration.',
  ARRAY['supabase'],
  TRUE,
  FALSE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'XoXOoOpQMiTU9woK',
  'Web Intel - Content Decay Alerter',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Monday 7am CT',
  'Sends Slack alerts for content decay detected by CNT-02. Prioritizes pages by traffic impact and decay severity.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  '4zTsVh8uhGCwWgl4',
  'Web Intel - Thin Content Identifier',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Tuesday 6am CT',
  'Identifies thin content pages based on word count, time on page, and engagement metrics. Flags pages for improvement or consolidation.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'kRWCqNso4OGWlJwO',
  'Web Intel - Content Gap Analyzer',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Wednesday 6am CT',
  'Analyzes content gaps by comparing tracked keywords to existing content. Identifies topics without adequate content coverage.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'mUNKkdaPIPxfhhvJ',
  'Web Intel - Internal Link Analyzer',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Thursday 6am CT',
  'Analyzes internal linking structure. Identifies orphan pages, over-linked pages, and internal linking opportunities.',
  ARRAY['supabase'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 3: COMPETITOR WORKFLOWS (CMP-01 to CMP-05)
-- ============================================

SELECT n8n_brain.register_workflow(
  'zLfG2Cf9pUBYqPNG',
  'Web Intel - Competitor Rank Tracker',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 5:15am CT',
  'Tracks competitor rankings for shared keywords. Monitors competitive position changes and market share.',
  ARRAY['dataforseo', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'OIm5d77XTAGHDB47',
  'Web Intel - Competitor Content Monitor',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Friday 6am CT',
  'Monitors competitor content changes including new pages, updated content, and removed pages.',
  ARRAY['supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'NY29HsSSmqFvvZQ0',
  'Web Intel - Competitor Traffic Estimator',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Monthly 15th 6am CT',
  'Estimates competitor traffic using DataForSEO traffic estimation API. Provides competitive traffic benchmarks.',
  ARRAY['dataforseo', 'supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'LIpMv9IzJDE6UnIx',
  'Web Intel - SERP Share Calculator',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Monday 10am CT',
  'Calculates SERP share of voice across tracked keywords. Shows market share trends over time.',
  ARRAY['supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  '72QZmkSRZm35twAu',
  'Web Intel - Competitive Gap Finder',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Monthly 1st 8am CT',
  'Identifies keyword gaps where competitors rank but we don''t. Prioritizes opportunities by volume and difficulty.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 3: BACKLINK WORKFLOWS (BKL-01 to BKL-05)
-- ============================================

SELECT n8n_brain.register_workflow(
  '4GRjkhilT4d47rx4',
  'Web Intel - Backlink Profile Sync',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Sunday 2am CT',
  'Syncs backlink profile data from DataForSEO. Tracks total backlinks, referring domains, and link quality metrics.',
  ARRAY['dataforseo', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'heGC1O1wf9IZTSqW',
  'Web Intel - New/Lost Backlink Detector',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 11am CT',
  'Detects newly acquired and lost backlinks by comparing current profile to previous sync. Tracks link velocity.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'mrAB875zmaatetdg',
  'Web Intel - Backlink Quality Scorer',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Sunday 4am CT',
  'Scores backlink quality based on domain authority, relevance, and link placement. Identifies high-value and low-value links.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'YXMBiO2dNQMpLI7d',
  'Web Intel - Link Opportunity Finder',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Monthly 1st 10am CT',
  'Identifies link building opportunities by analyzing competitor backlinks, broken link opportunities, and unlinked mentions.',
  ARRAY['dataforseo', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'haagoO93MxLXY48o',
  'Web Intel - Toxic Link Alerter',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Sunday 6am CT',
  'Identifies potentially toxic or spammy backlinks that could harm SEO. Alerts for disavow consideration.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 4: AI INSIGHTS WORKFLOWS (INS-01 to INS-03)
-- ============================================

SELECT n8n_brain.register_workflow(
  'UprzbWx4V1PZo6yD',
  'Web Intel - AI Content Analyzer',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Saturday 6am CT',
  'Uses Claude AI to analyze content quality, readability, and SEO optimization. Provides actionable improvement suggestions.',
  ARRAY['anthropic', 'supabase'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'epBJOsp9Nco2aa93',
  'Web Intel - Trend Spotter',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Friday 8am CT',
  'Analyzes data across all web intel sources to identify trends. Uses statistical analysis to surface emerging patterns.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'F0IqIHxzMsVbQpET',
  'Web Intel - Recommendation Generator',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Friday 10am CT',
  'Generates prioritized SEO recommendations based on all web intel data. Creates actionable tasks ranked by impact.',
  ARRAY['supabase'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 4: REPORT WORKFLOWS (RPT-01 to RPT-03)
-- ============================================

SELECT n8n_brain.register_workflow(
  'mO9fbehGJFBPGIDU',
  'Web Intel - Weekly Digest',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Weekly Friday 5pm CT',
  'Compiles weekly SEO performance digest with key metrics, wins, and areas needing attention. Sent via Slack.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'uB4E9jYgyk7IWivz',
  'Web Intel - Monthly Report',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Monthly 1st 9am CT',
  'Generates comprehensive monthly SEO report with traffic, rankings, content, and competitive analysis. Sent via Slack.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  '9EsPgSZcHqyZfaZJ',
  'Web Intel - Dashboard Metrics Computer',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Every 15 minutes',
  'Computes real-time dashboard metrics for Web Intelligence dashboard. Aggregates KPIs across all data sources.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- PHASE 5: SYSTEM WORKFLOWS (SYS-01 to SYS-04)
-- ============================================

SELECT n8n_brain.register_workflow(
  '3aUQ6BQkiS5HphxA',
  'Web Intel - Error Handler',
  'web_intelligence',
  'Web Intelligence',
  'webhook',
  NULL,
  'Central error handler for all Web Intelligence workflows. Receives errors via webhook, logs them, and sends appropriate alerts.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'VgUaqjEadB5uRTqW',
  'Web Intel - Health Checker',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Every 30 minutes',
  'Monitors health of all Web Intelligence workflows. Checks for stale data, failed runs, and system issues.',
  ARRAY['supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'ZPnv8S51kJEWLncb',
  'Web Intel - Data Cleanup',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 1am CT',
  'Performs data cleanup and maintenance. Archives old data, removes duplicates, and optimizes tables.',
  ARRAY['supabase'],
  TRUE,
  FALSE,
  TRUE
);

SELECT n8n_brain.register_workflow(
  'WOMC0v0PDa8Wd3ie',
  'Web Intel - Credential Validator',
  'web_intelligence',
  'Web Intelligence',
  'schedule',
  'Daily 12am CT',
  'Validates all Web Intelligence credentials (GA4, GSC, DataForSEO, Slack) are working. Alerts on any credential issues.',
  ARRAY['ga4', 'gsc', 'dataforseo', 'supabase', 'slack'],
  TRUE,
  TRUE,
  TRUE
);

-- ============================================
-- SUMMARY
-- ============================================
SELECT
  test_status,
  COUNT(*) as count
FROM n8n_brain.workflow_registry
WHERE category = 'web_intelligence'
GROUP BY test_status;
