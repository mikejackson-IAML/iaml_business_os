// Web Intelligence Dashboard API
// Queries Supabase for web intel data: traffic, rankings, technical health, and alerts
// Pattern: Similar to lead-intelligence-queries.ts

import { getServerClient } from '@/lib/supabase/server';
import type { AlertItem, HealthStatus } from '@/dashboard-kit/types';

// ============================================
// Database Types (snake_case matching Supabase)
// ============================================

/**
 * Daily aggregate traffic from GA4
 */
export interface DailyTrafficDb {
  id: string;
  collected_date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounce_rate: number | null;
  avg_session_duration: number | null;
  new_users: number | null;
  returning_users: number | null;
  pages_per_session: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Per-page traffic metrics
 */
export interface PageTrafficDb {
  id: string;
  collected_date: string;
  page_path: string;
  page_title: string | null;
  sessions: number;
  pageviews: number;
  unique_pageviews: number;
  avg_time_on_page: number | null;
  bounce_rate: number | null;
  exit_rate: number | null;
  entrances: number;
  created_at: string;
}

/**
 * Traffic by source/medium from GA4
 */
export interface TrafficSourceDb {
  id: string;
  collected_date: string;
  source: string;
  medium: string;
  sessions: number;
  users: number;
  new_users: number;
  bounce_rate: number | null;
  pages_per_session: number | null;
  avg_session_duration: number | null;
  created_at: string;
}

/**
 * Keywords to track for rankings
 */
export interface TrackedKeywordDb {
  id: string;
  keyword: string;
  search_volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_url: string | null;
  category: string | null;
  status: 'active' | 'paused' | 'archived';
  volume_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Daily ranking snapshots for tracked keywords
 */
export interface DailyRankingDb {
  id: string;
  keyword_id: string;
  collected_date: string;
  position: number | null;
  ranking_url: string | null;
  has_featured_snippet: boolean;
  featured_snippet_owner: string | null;
  has_people_also_ask: boolean;
  has_local_pack: boolean;
  has_knowledge_panel: boolean;
  has_video_results: boolean;
  has_image_pack: boolean;
  competitor_positions: Array<{ domain: string; position: number }>;
  created_at: string;
}

/**
 * Ranking changes (detected anomalies)
 */
export interface RankingChangeEventDb {
  id: string;
  keyword_id: string;
  detected_date: string;
  previous_position: number | null;
  current_position: number | null;
  change_amount: number | null;
  change_type: 'improved' | 'dropped' | 'new_ranking' | 'lost_ranking' | null;
  is_significant: boolean;
  alert_sent: boolean;
  created_at: string;
}

/**
 * Core Web Vitals measurements
 */
export interface CoreWebVitalsDb {
  id: string;
  collected_date: string;
  device_type: 'mobile' | 'desktop';
  lcp_good_pct: number | null;
  lcp_needs_improvement_pct: number | null;
  lcp_poor_pct: number | null;
  fid_good_pct: number | null;
  fid_needs_improvement_pct: number | null;
  fid_poor_pct: number | null;
  cls_good_pct: number | null;
  cls_needs_improvement_pct: number | null;
  cls_poor_pct: number | null;
  overall_status: 'good' | 'needs_improvement' | 'poor' | null;
  created_at: string;
}

/**
 * Index coverage from GSC
 */
export interface IndexCoverageDb {
  id: string;
  collected_date: string;
  indexed_count: number;
  crawled_not_indexed: number;
  discovered_not_indexed: number;
  excluded_count: number;
  error_count: number;
  error_details: Record<string, unknown>;
  excluded_details: Record<string, unknown>;
  created_at: string;
}

/**
 * Search performance from GSC
 */
export interface SearchPerformanceDb {
  id: string;
  collected_date: string;
  query: string | null;
  page: string | null;
  country: string | null;
  device: string | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
  created_at: string;
}

/**
 * Content decay tracking
 */
export interface ContentDecayDb {
  id: string;
  content_id: string;
  detected_date: string;
  baseline_period: string | null;
  baseline_sessions: number | null;
  current_sessions: number | null;
  decay_percentage: number | null;
  severity: 'minor' | 'moderate' | 'severe' | null;
  is_addressed: boolean;
  addressed_at: string | null;
  action_taken: string | null;
  created_at: string;
}

/**
 * Backlink profile snapshots
 */
export interface BacklinkProfileDb {
  id: string;
  collected_date: string;
  total_backlinks: number;
  referring_domains: number;
  dofollow_links: number;
  nofollow_links: number;
  domain_rating: number | null;
  url_rating: number | null;
  new_links_7d: number;
  lost_links_7d: number;
  created_at: string;
}

/**
 * Content inventory - tracked pages
 */
export interface ContentInventoryDb {
  id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  word_count: number | null;
  publish_date: string | null;
  last_modified: string | null;
  last_crawled: string | null;
  content_type: string | null;
  category: string | null;
  status: 'active' | 'redirect' | 'removed' | 'draft';
  avg_monthly_sessions: number | null;
  avg_monthly_pageviews: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Thin content flags
 */
export interface ThinContentDb {
  id: string;
  content_id: string;
  detected_date: string;
  word_count: number | null;
  avg_time_on_page: number | null;
  bounce_rate: number | null;
  reason: string | null;
  recommendation: string | null;
  is_addressed: boolean;
  addressed_at: string | null;
  created_at: string;
}

/**
 * Tracked competitors
 */
export interface CompetitorDb {
  id: string;
  domain: string;
  name: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SERP share of voice
 */
export interface SerpShareDb {
  id: string;
  collected_date: string;
  our_share: number | null;
  competitor_shares: Record<string, number>;
  keywords_tracked: number | null;
  keywords_ranking: number | null;
  created_at: string;
}

/**
 * Web Intel alerts
 */
export interface WebIntelAlertDb {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  source_workflow: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ============================================
// Frontend Types (camelCase for components)
// ============================================

export interface DailyTraffic {
  id: string;
  collectedDate: Date;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number | null;
  avgSessionDuration: number | null;
  newUsers: number | null;
  returningUsers: number | null;
  pagesPerSession: number | null;
}

export interface PageTraffic {
  id: string;
  collectedDate: Date;
  pagePath: string;
  pageTitle: string | null;
  sessions: number;
  pageviews: number;
  uniquePageviews: number;
  avgTimeOnPage: number | null;
  bounceRate: number | null;
  exitRate: number | null;
  entrances: number;
}

export interface TrafficSource {
  id: string;
  collectedDate: Date;
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number | null;
  pagesPerSession: number | null;
  avgSessionDuration: number | null;
}

export interface TrackedKeyword {
  id: string;
  keyword: string;
  searchVolume: number | null;
  difficulty: number | null;
  cpc: number | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetUrl: string | null;
  category: string | null;
  status: 'active' | 'paused' | 'archived';
}

export interface DailyRanking {
  id: string;
  keywordId: string;
  collectedDate: Date;
  position: number | null;
  rankingUrl: string | null;
  hasFeaturedSnippet: boolean;
  featuredSnippetOwner: string | null;
  hasPeopleAlsoAsk: boolean;
  hasLocalPack: boolean;
  hasKnowledgePanel: boolean;
  hasVideoResults: boolean;
  hasImagePack: boolean;
  competitorPositions: Array<{ domain: string; position: number }>;
}

export interface RankingChangeEvent {
  id: string;
  keywordId: string;
  detectedDate: Date;
  previousPosition: number | null;
  currentPosition: number | null;
  changeAmount: number | null;
  changeType: 'improved' | 'dropped' | 'new_ranking' | 'lost_ranking' | null;
  isSignificant: boolean;
}

export interface CoreWebVitals {
  id: string;
  collectedDate: Date;
  deviceType: 'mobile' | 'desktop';
  lcpGoodPct: number | null;
  lcpNeedsImprovementPct: number | null;
  lcpPoorPct: number | null;
  fidGoodPct: number | null;
  fidNeedsImprovementPct: number | null;
  fidPoorPct: number | null;
  clsGoodPct: number | null;
  clsNeedsImprovementPct: number | null;
  clsPoorPct: number | null;
  overallStatus: 'good' | 'needs_improvement' | 'poor' | null;
}

export interface IndexCoverage {
  id: string;
  collectedDate: Date;
  indexedCount: number;
  crawledNotIndexed: number;
  discoveredNotIndexed: number;
  excludedCount: number;
  errorCount: number;
}

export interface SearchPerformance {
  id: string;
  collectedDate: Date;
  query: string | null;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface ContentDecay {
  id: string;
  contentId: string;
  detectedDate: Date;
  baselineSessions: number | null;
  currentSessions: number | null;
  decayPercentage: number | null;
  severity: 'minor' | 'moderate' | 'severe' | null;
  isAddressed: boolean;
}

export interface BacklinkProfile {
  id: string;
  collectedDate: Date;
  totalBacklinks: number;
  referringDomains: number;
  dofollowLinks: number;
  nofollowLinks: number;
  domainRating: number | null;
  newLinks7d: number;
  lostLinks7d: number;
}

/**
 * Shared keyword with our position vs competitor positions
 */
export interface SharedKeyword {
  keywordId: string;
  keyword: string;
  ourPosition: number | null;
  competitorPositions: Array<{ domain: string; position: number }>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContentInventory {
  id: string;
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number | null;
  publishDate: Date | null;
  lastModified: Date | null;
  lastCrawled: Date | null;
  contentType: string | null;
  category: string | null;
  status: 'active' | 'redirect' | 'removed' | 'draft';
  avgMonthlySessions: number | null;
  avgMonthlyPageviews: number | null;
}

export interface ThinContent {
  id: string;
  contentId: string;
  detectedDate: Date;
  wordCount: number | null;
  avgTimeOnPage: number | null;
  bounceRate: number | null;
  reason: string | null;
  recommendation: string | null;
  isAddressed: boolean;
}

export interface ContentDecayWithInventory extends ContentDecay {
  url: string;
  title: string | null;
  wordCount: number | null;
}

export interface ThinContentWithInventory extends ThinContent {
  url: string;
  title: string | null;
}

export interface ContentSummary {
  totalIndexed: number;
  avgWordCount: number;
}

export interface Competitor {
  id: string;
  domain: string;
  name: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface SerpShare {
  id: string;
  collectedDate: Date;
  ourShare: number | null;
  competitorShares: Record<string, number>;
  keywordsTracked: number | null;
  keywordsRanking: number | null;
}

// ============================================
// Web Intel Dashboard Data Structure
// ============================================

export interface WebIntelMetrics {
  dailySessions: number;
  weeklyTrafficTrend: number; // Percentage change
  bounceRate: number;
  avgKeywordPosition: number;
  topPageviews: number;
  coreWebVitalsScore: number;
  indexedPages: number;
  backlinkCount: number;
}

export interface WebIntelDashboardData {
  metrics: WebIntelMetrics;
  dailyTraffic: DailyTraffic[];
  trafficSources: TrafficSource[];
  topPages: PageTraffic[];
  keywords: TrackedKeyword[];
  rankings: DailyRanking[];
  rankingChanges: RankingChangeEvent[];
  coreWebVitals: CoreWebVitals[];
  indexCoverage: IndexCoverage | null;
  searchPerformance: SearchPerformance[];
  contentDecay: ContentDecay[];
  backlinkProfile: BacklinkProfile | null;
  alerts: AlertItem[];
  health: {
    score: number;
    status: HealthStatus;
  };
}

// ============================================
// Supabase Query Functions
// ============================================

/**
 * Fetch daily traffic data
 */
export async function getDailyTraffic(days: number = 30): Promise<DailyTrafficDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.daily_traffic')
    .select('*')
    .order('collected_date', { ascending: false })
    .limit(days);

  if (error) {
    console.error('Error fetching daily traffic:', error);
    return [];
  }

  return (data as DailyTrafficDb[]) || [];
}

/**
 * Fetch top performing pages
 */
export async function getTopPages(days: number = 7, limit: number = 10): Promise<PageTrafficDb[]> {
  const supabase = getServerClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('web_intel.page_traffic')
    .select('*')
    .gte('collected_date', startDate.toISOString().split('T')[0])
    .order('pageviews', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top pages:', error);
    return [];
  }

  return (data as PageTrafficDb[]) || [];
}

/**
 * Fetch traffic by source/medium
 */
export async function getTrafficSources(days: number = 30): Promise<TrafficSourceDb[]> {
  const supabase = getServerClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('web_intel.traffic_sources')
    .select('*')
    .gte('collected_date', startDate.toISOString().split('T')[0])
    .order('collected_date', { ascending: true });

  if (error) {
    console.error('Error fetching traffic sources:', error);
    return [];
  }

  return (data as TrafficSourceDb[]) || [];
}

/**
 * Fetch tracked keywords
 */
export async function getTrackedKeywords(status: string = 'active'): Promise<TrackedKeywordDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.tracked_keywords')
    .select('*')
    .eq('status', status)
    .order('priority', { ascending: true }) // critical, high, medium, low
    .order('keyword', { ascending: true });

  if (error) {
    console.error('Error fetching tracked keywords:', error);
    return [];
  }

  // Sort by priority manually since Supabase doesn't support custom ordering
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = (data as TrackedKeywordDb[])?.sort((a, b) => {
    const aPriority = priorityOrder[a.priority] ?? 4;
    const bPriority = priorityOrder[b.priority] ?? 4;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.keyword.localeCompare(b.keyword);
  });

  return sorted || [];
}

/**
 * Fetch daily rankings for tracked keywords
 */
export async function getDailyRankings(days: number = 7): Promise<DailyRankingDb[]> {
  const supabase = getServerClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('web_intel.daily_rankings')
    .select('*')
    .gte('collected_date', startDate.toISOString().split('T')[0])
    .order('collected_date', { ascending: false });

  if (error) {
    console.error('Error fetching daily rankings:', error);
    return [];
  }

  return (data as DailyRankingDb[]) || [];
}

/**
 * Fetch ranking change events
 */
export async function getRankingChanges(
  days: number = 7,
  significantOnly: boolean = false
): Promise<RankingChangeEventDb[]> {
  const supabase = getServerClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from('web_intel.ranking_change_events')
    .select('*')
    .gte('detected_date', startDate.toISOString().split('T')[0]);

  if (significantOnly) {
    query = query.eq('is_significant', true);
  }

  const { data, error } = await query
    .order('detected_date', { ascending: false })
    .order('change_amount', { ascending: false });

  if (error) {
    console.error('Error fetching ranking changes:', error);
    return [];
  }

  return (data as RankingChangeEventDb[]) || [];
}

/**
 * Fetch Core Web Vitals (most recent for each device type)
 */
export async function getCoreWebVitals(): Promise<CoreWebVitalsDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.core_web_vitals')
    .select('*')
    .order('collected_date', { ascending: false })
    .limit(2); // Get most recent for mobile + desktop

  if (error) {
    console.error('Error fetching Core Web Vitals:', error);
    return [];
  }

  return (data as CoreWebVitalsDb[]) || [];
}

/**
 * Fetch index coverage data
 */
export async function getIndexCoverage(): Promise<IndexCoverageDb | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.index_coverage')
    .select('*')
    .order('collected_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No data yet is expected
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching index coverage:', error);
    return null;
  }

  return data as IndexCoverageDb;
}

/**
 * Fetch search performance data from GSC
 */
export async function getSearchPerformance(
  days: number = 7,
  limit: number = 20
): Promise<SearchPerformanceDb[]> {
  const supabase = getServerClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('web_intel.search_performance')
    .select('*')
    .gte('collected_date', startDate.toISOString().split('T')[0])
    .order('clicks', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching search performance:', error);
    return [];
  }

  return (data as SearchPerformanceDb[]) || [];
}

/**
 * Fetch content decay items
 */
export async function getContentDecay(unresolvedOnly: boolean = true): Promise<ContentDecayDb[]> {
  const supabase = getServerClient();

  let query = supabase.from('web_intel.content_decay').select('*');

  if (unresolvedOnly) {
    query = query.eq('is_addressed', false);
  }

  const { data, error } = await query.order('decay_percentage', { ascending: false });

  if (error) {
    console.error('Error fetching content decay:', error);
    return [];
  }

  return (data as ContentDecayDb[]) || [];
}

/**
 * Fetch backlink profile
 */
export async function getBacklinkProfile(): Promise<BacklinkProfileDb | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('web_intel.backlink_profile')
    .select('*')
    .order('collected_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No data yet is expected
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching backlink profile:', error);
    return null;
  }

  return data as BacklinkProfileDb;
}

/**
 * Fetch Web Intel alerts
 */
export async function getWebIntelAlerts(unresolvedOnly: boolean = true): Promise<WebIntelAlertDb[]> {
  const supabase = getServerClient();

  let query = supabase.from('web_intel.alerts').select('*');

  if (unresolvedOnly) {
    query = query.is('acknowledged_at', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching web intel alerts:', error);
    return [];
  }

  // Sort by severity manually (critical, warning, info)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = (data as WebIntelAlertDb[])?.sort((a, b) => {
    const aSeverity = severityOrder[a.severity] ?? 3;
    const bSeverity = severityOrder[b.severity] ?? 3;
    if (aSeverity !== bSeverity) return aSeverity - bSeverity;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return sorted || [];
}

/**
 * Fetch content decay with joined inventory data (URL, title, word_count)
 */
export async function getContentDecayWithInventory(
  limit: number = 5
): Promise<ContentDecayWithInventory[]> {
  const supabase = getServerClient();

  const { data, error } = await (
    supabase.from('web_intel.content_decay') as any
  )
    .select(
      `
      *,
      content_inventory:content_id (
        url,
        title,
        word_count
      )
    `
    )
    .eq('is_addressed', false)
    .order('decay_percentage', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching content decay with inventory:', error);
    return [];
  }

  // Transform and flatten
  return (data || []).map((item: any) => ({
    id: item.id,
    contentId: item.content_id,
    detectedDate: new Date(item.detected_date),
    baselineSessions: item.baseline_sessions,
    currentSessions: item.current_sessions,
    decayPercentage: item.decay_percentage ? Number(item.decay_percentage) : null,
    severity: item.severity,
    isAddressed: item.is_addressed,
    url: item.content_inventory?.url || '',
    title: item.content_inventory?.title || null,
    wordCount: item.content_inventory?.word_count || null,
  }));
}

/**
 * Fetch thin content with joined inventory data (URL, title)
 */
export async function getThinContentWithInventory(
  limit: number = 5
): Promise<ThinContentWithInventory[]> {
  const supabase = getServerClient();

  const { data, error } = await (
    supabase.from('web_intel.thin_content') as any
  )
    .select(
      `
      *,
      content_inventory:content_id (
        url,
        title
      )
    `
    )
    .eq('is_addressed', false)
    .order('bounce_rate', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching thin content with inventory:', error);
    return [];
  }

  // Transform and flatten
  return (data || []).map((item: any) => ({
    id: item.id,
    contentId: item.content_id,
    detectedDate: new Date(item.detected_date),
    wordCount: item.word_count,
    avgTimeOnPage: item.avg_time_on_page ? Number(item.avg_time_on_page) : null,
    bounceRate: item.bounce_rate ? Number(item.bounce_rate) : null,
    reason: item.reason,
    recommendation: item.recommendation,
    isAddressed: item.is_addressed,
    url: item.content_inventory?.url || '',
    title: item.content_inventory?.title || null,
  }));
}

/**
 * Fetch content summary stats (total indexed pages, average word count)
 */
export async function getContentSummary(): Promise<ContentSummary> {
  const supabase = getServerClient();

  const { data, error } = await (
    supabase.from('web_intel.content_inventory') as any
  )
    .select('word_count')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching content summary:', error);
    return { totalIndexed: 0, avgWordCount: 0 };
  }

  const wordCounts = (data || [])
    .map((d: any) => d.word_count)
    .filter((wc: number | null): wc is number => wc !== null);

  return {
    totalIndexed: data?.length || 0,
    avgWordCount:
      wordCounts.length > 0
        ? Math.round(wordCounts.reduce((a: number, b: number) => a + b, 0) / wordCounts.length)
        : 0,
  };
}

/**
 * Fetch active competitors
 */
export async function getCompetitors(): Promise<Competitor[]> {
  const supabase = getServerClient();

  const { data, error } = await (supabase.from('web_intel.competitors') as any)
    .select('*')
    .eq('is_active', true)
    .order('domain', { ascending: true });

  if (error) {
    console.error('Error fetching competitors:', error);
    return [];
  }

  return transformCompetitors(data || []);
}

/**
 * Fetch latest SERP share data
 */
export async function getSerpShare(): Promise<SerpShare | null> {
  const supabase = getServerClient();

  const { data, error } = await (supabase.from('web_intel.serp_share') as any)
    .select('*')
    .order('collected_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No data yet is expected
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching SERP share:', error);
    return null;
  }

  return transformSerpShare(data);
}

/**
 * Fetch shared keywords with our position and competitor positions
 * Joins daily_rankings (latest) with tracked_keywords
 */
export async function getSharedKeywords(limit: number = 10): Promise<SharedKeyword[]> {
  const supabase = getServerClient();

  // Get latest rankings with competitor positions joined to tracked_keywords
  const { data, error } = await (
    supabase.from('web_intel.daily_rankings') as any
  )
    .select(`
      keyword_id,
      position,
      competitor_positions,
      collected_date,
      tracked_keywords:keyword_id (
        id,
        keyword,
        priority
      )
    `)
    .order('collected_date', { ascending: false })
    .limit(limit * 2); // Fetch extra to handle deduplication

  if (error) {
    console.error('Error fetching shared keywords:', error);
    return [];
  }

  // Deduplicate by keyword_id (keep latest entry for each keyword)
  const latestByKeyword = new Map<string, any>();
  for (const item of data || []) {
    if (!latestByKeyword.has(item.keyword_id)) {
      latestByKeyword.set(item.keyword_id, item);
    }
  }

  // Transform and filter to only those with competitor data
  const results: SharedKeyword[] = [];
  for (const item of Array.from(latestByKeyword.values())) {
    const competitors = item.competitor_positions || [];
    // Only include keywords that have at least one competitor position
    if (competitors.length > 0 && item.tracked_keywords) {
      results.push({
        keywordId: item.keyword_id,
        keyword: item.tracked_keywords.keyword,
        ourPosition: item.position,
        competitorPositions: competitors,
        priority: item.tracked_keywords.priority,
      });
    }
  }

  // Sort by priority (critical first) then by ourPosition
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  results.sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 4;
    const pB = priorityOrder[b.priority] ?? 4;
    if (pA !== pB) return pA - pB;
    // Then by position (null positions last)
    const posA = a.ourPosition ?? 101;
    const posB = b.ourPosition ?? 101;
    return posA - posB;
  });

  return results.slice(0, limit);
}

// ============================================
// Transform Functions (snake_case to camelCase)
// ============================================

/**
 * Transform daily traffic data to frontend format
 */
export function transformDailyTraffic(data: DailyTrafficDb[]): DailyTraffic[] {
  return data.map((item) => ({
    id: item.id,
    collectedDate: new Date(item.collected_date),
    sessions: item.sessions,
    users: item.users,
    pageviews: item.pageviews,
    bounceRate: item.bounce_rate ? Number(item.bounce_rate) : null,
    avgSessionDuration: item.avg_session_duration ? Number(item.avg_session_duration) : null,
    newUsers: item.new_users,
    returningUsers: item.returning_users,
    pagesPerSession: item.pages_per_session ? Number(item.pages_per_session) : null,
  }));
}

/**
 * Transform page traffic data to frontend format
 */
export function transformPageTraffic(data: PageTrafficDb[]): PageTraffic[] {
  return data.map((item) => ({
    id: item.id,
    collectedDate: new Date(item.collected_date),
    pagePath: item.page_path,
    pageTitle: item.page_title,
    sessions: item.sessions,
    pageviews: item.pageviews,
    uniquePageviews: item.unique_pageviews,
    avgTimeOnPage: item.avg_time_on_page ? Number(item.avg_time_on_page) : null,
    bounceRate: item.bounce_rate ? Number(item.bounce_rate) : null,
    exitRate: item.exit_rate ? Number(item.exit_rate) : null,
    entrances: item.entrances,
  }));
}

/**
 * Transform traffic sources to frontend format
 */
export function transformTrafficSources(data: TrafficSourceDb[]): TrafficSource[] {
  return data.map((item) => ({
    id: item.id,
    collectedDate: new Date(item.collected_date),
    source: item.source,
    medium: item.medium,
    sessions: item.sessions,
    users: item.users,
    newUsers: item.new_users,
    bounceRate: item.bounce_rate ? Number(item.bounce_rate) : null,
    pagesPerSession: item.pages_per_session ? Number(item.pages_per_session) : null,
    avgSessionDuration: item.avg_session_duration ? Number(item.avg_session_duration) : null,
  }));
}

/**
 * Transform tracked keywords to frontend format
 */
export function transformKeywords(data: TrackedKeywordDb[]): TrackedKeyword[] {
  return data.map((item) => ({
    id: item.id,
    keyword: item.keyword,
    searchVolume: item.search_volume,
    difficulty: item.difficulty,
    cpc: item.cpc ? Number(item.cpc) : null,
    priority: item.priority,
    targetUrl: item.target_url,
    category: item.category,
    status: item.status,
  }));
}

/**
 * Transform daily rankings to frontend format
 */
export function transformRankings(data: DailyRankingDb[]): DailyRanking[] {
  return data.map((item) => ({
    id: item.id,
    keywordId: item.keyword_id,
    collectedDate: new Date(item.collected_date),
    position: item.position,
    rankingUrl: item.ranking_url,
    hasFeaturedSnippet: item.has_featured_snippet,
    featuredSnippetOwner: item.featured_snippet_owner,
    hasPeopleAlsoAsk: item.has_people_also_ask,
    hasLocalPack: item.has_local_pack,
    hasKnowledgePanel: item.has_knowledge_panel,
    hasVideoResults: item.has_video_results,
    hasImagePack: item.has_image_pack,
    competitorPositions: item.competitor_positions || [],
  }));
}

/**
 * Transform ranking change events to frontend format
 */
export function transformRankingChanges(data: RankingChangeEventDb[]): RankingChangeEvent[] {
  return data.map((item) => ({
    id: item.id,
    keywordId: item.keyword_id,
    detectedDate: new Date(item.detected_date),
    previousPosition: item.previous_position,
    currentPosition: item.current_position,
    changeAmount: item.change_amount,
    changeType: item.change_type,
    isSignificant: item.is_significant,
  }));
}

/**
 * Transform Core Web Vitals to frontend format
 */
export function transformCoreWebVitals(data: CoreWebVitalsDb[]): CoreWebVitals[] {
  return data.map((item) => ({
    id: item.id,
    collectedDate: new Date(item.collected_date),
    deviceType: item.device_type,
    lcpGoodPct: item.lcp_good_pct ? Number(item.lcp_good_pct) : null,
    lcpNeedsImprovementPct: item.lcp_needs_improvement_pct ? Number(item.lcp_needs_improvement_pct) : null,
    lcpPoorPct: item.lcp_poor_pct ? Number(item.lcp_poor_pct) : null,
    fidGoodPct: item.fid_good_pct ? Number(item.fid_good_pct) : null,
    fidNeedsImprovementPct: item.fid_needs_improvement_pct ? Number(item.fid_needs_improvement_pct) : null,
    fidPoorPct: item.fid_poor_pct ? Number(item.fid_poor_pct) : null,
    clsGoodPct: item.cls_good_pct ? Number(item.cls_good_pct) : null,
    clsNeedsImprovementPct: item.cls_needs_improvement_pct ? Number(item.cls_needs_improvement_pct) : null,
    clsPoorPct: item.cls_poor_pct ? Number(item.cls_poor_pct) : null,
    overallStatus: item.overall_status,
  }));
}

/**
 * Transform index coverage to frontend format
 */
export function transformIndexCoverage(data: IndexCoverageDb): IndexCoverage {
  return {
    id: data.id,
    collectedDate: new Date(data.collected_date),
    indexedCount: data.indexed_count,
    crawledNotIndexed: data.crawled_not_indexed,
    discoveredNotIndexed: data.discovered_not_indexed,
    excludedCount: data.excluded_count,
    errorCount: data.error_count,
  };
}

/**
 * Transform search performance to frontend format
 */
export function transformSearchPerformance(data: SearchPerformanceDb[]): SearchPerformance[] {
  return data.map((item) => ({
    id: item.id,
    collectedDate: new Date(item.collected_date),
    query: item.query,
    page: item.page,
    clicks: item.clicks,
    impressions: item.impressions,
    ctr: item.ctr ? Number(item.ctr) : null,
    position: item.position ? Number(item.position) : null,
  }));
}

/**
 * Transform content decay to frontend format
 */
export function transformContentDecay(data: ContentDecayDb[]): ContentDecay[] {
  return data.map((item) => ({
    id: item.id,
    contentId: item.content_id,
    detectedDate: new Date(item.detected_date),
    baselineSessions: item.baseline_sessions,
    currentSessions: item.current_sessions,
    decayPercentage: item.decay_percentage ? Number(item.decay_percentage) : null,
    severity: item.severity,
    isAddressed: item.is_addressed,
  }));
}

/**
 * Transform backlink profile to frontend format
 */
export function transformBacklinkProfile(data: BacklinkProfileDb): BacklinkProfile {
  return {
    id: data.id,
    collectedDate: new Date(data.collected_date),
    totalBacklinks: data.total_backlinks,
    referringDomains: data.referring_domains,
    dofollowLinks: data.dofollow_links,
    nofollowLinks: data.nofollow_links,
    domainRating: data.domain_rating ? Number(data.domain_rating) : null,
    newLinks7d: data.new_links_7d,
    lostLinks7d: data.lost_links_7d,
  };
}

/**
 * Transform alerts to dashboard-kit AlertItem format
 */
export function transformAlerts(data: WebIntelAlertDb[]): AlertItem[] {
  return data.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.message,
    severity: item.severity,
    category: item.alert_type,
    timestamp: new Date(item.created_at),
    dismissable: true,
  }));
}

/**
 * Transform content inventory to frontend format
 */
export function transformContentInventory(data: ContentInventoryDb[]): ContentInventory[] {
  return data.map((item) => ({
    id: item.id,
    url: item.url,
    title: item.title,
    metaDescription: item.meta_description,
    h1: item.h1,
    wordCount: item.word_count,
    publishDate: item.publish_date ? new Date(item.publish_date) : null,
    lastModified: item.last_modified ? new Date(item.last_modified) : null,
    lastCrawled: item.last_crawled ? new Date(item.last_crawled) : null,
    contentType: item.content_type,
    category: item.category,
    status: item.status,
    avgMonthlySessions: item.avg_monthly_sessions,
    avgMonthlyPageviews: item.avg_monthly_pageviews,
  }));
}

/**
 * Transform thin content to frontend format
 */
export function transformThinContent(data: ThinContentDb[]): ThinContent[] {
  return data.map((item) => ({
    id: item.id,
    contentId: item.content_id,
    detectedDate: new Date(item.detected_date),
    wordCount: item.word_count,
    avgTimeOnPage: item.avg_time_on_page ? Number(item.avg_time_on_page) : null,
    bounceRate: item.bounce_rate ? Number(item.bounce_rate) : null,
    reason: item.reason,
    recommendation: item.recommendation,
    isAddressed: item.is_addressed,
  }));
}

/**
 * Transform competitors to frontend format
 */
export function transformCompetitors(data: CompetitorDb[]): Competitor[] {
  return data.map((item) => ({
    id: item.id,
    domain: item.domain,
    name: item.name,
    isActive: item.is_active,
    notes: item.notes,
  }));
}

/**
 * Transform SERP share to frontend format
 */
export function transformSerpShare(data: SerpShareDb): SerpShare {
  return {
    id: data.id,
    collectedDate: new Date(data.collected_date),
    ourShare: data.our_share ? Number(data.our_share) : null,
    competitorShares: data.competitor_shares || {},
    keywordsTracked: data.keywords_tracked,
    keywordsRanking: data.keywords_ranking,
  };
}

// ============================================
// Health & Metrics Calculation
// ============================================

/**
 * Calculate Web Intel health score
 * Based on 4 weighted components:
 * - CWV status (25%): good=100, needs_improvement=50, poor=0
 * - Ranking stability (25%): significant drops reduce score
 * - Index coverage (25%): error_count impacts score
 * - Alert status (25%): critical alerts reduce score
 */
export function calculateWebIntelHealth(
  coreWebVitals: CoreWebVitals[],
  rankingChanges: RankingChangeEvent[],
  indexCoverage: IndexCoverage | null,
  alerts: AlertItem[]
): { score: number; status: HealthStatus } {
  // CWV score (25%)
  let cwvScore = 100;
  if (coreWebVitals.length > 0) {
    const latestCwv = coreWebVitals[0];
    if (latestCwv.overallStatus === 'good') {
      cwvScore = 100;
    } else if (latestCwv.overallStatus === 'needs_improvement') {
      cwvScore = 50;
    } else if (latestCwv.overallStatus === 'poor') {
      cwvScore = 0;
    }
  }

  // Ranking stability score (25%)
  const significantDrops = rankingChanges.filter(
    (r) => r.isSignificant && r.changeType === 'dropped'
  ).length;
  const rankingScore = Math.max(0, 100 - significantDrops * 20); // Each significant drop = -20 points

  // Index coverage score (25%)
  let indexScore = 100;
  if (indexCoverage) {
    const errorRate =
      indexCoverage.indexedCount > 0
        ? (indexCoverage.errorCount / indexCoverage.indexedCount) * 100
        : 0;
    indexScore = Math.max(0, 100 - errorRate * 10); // Each 1% error rate = -10 points
  }

  // Alert score (25%)
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const warningAlerts = alerts.filter((a) => a.severity === 'warning').length;
  const alertScore = Math.max(0, 100 - criticalAlerts * 30 - warningAlerts * 10);

  // Weighted total
  const totalScore = Math.round(
    cwvScore * 0.25 + rankingScore * 0.25 + indexScore * 0.25 + alertScore * 0.25
  );

  const status: HealthStatus =
    totalScore >= 70 ? 'healthy' : totalScore >= 40 ? 'warning' : 'critical';

  return { score: totalScore, status };
}

/**
 * Build Web Intel metrics from fetched data
 */
export function buildWebIntelMetrics(
  dailyTraffic: DailyTraffic[],
  topPages: PageTraffic[],
  keywords: TrackedKeyword[],
  rankings: DailyRanking[],
  coreWebVitals: CoreWebVitals[],
  indexCoverage: IndexCoverage | null,
  backlinkProfile: BacklinkProfile | null
): WebIntelMetrics {
  // Daily sessions (most recent day)
  const dailySessions = dailyTraffic.length > 0 ? dailyTraffic[0].sessions : 0;

  // Weekly traffic trend (compare last 7 days to previous 7 days)
  let weeklyTrafficTrend = 0;
  if (dailyTraffic.length >= 14) {
    const recent7 = dailyTraffic.slice(0, 7).reduce((sum, d) => sum + d.sessions, 0);
    const previous7 = dailyTraffic.slice(7, 14).reduce((sum, d) => sum + d.sessions, 0);
    if (previous7 > 0) {
      weeklyTrafficTrend = ((recent7 - previous7) / previous7) * 100;
    }
  }

  // Average bounce rate (last 7 days)
  const recentBounceRates = dailyTraffic
    .slice(0, 7)
    .filter((d) => d.bounceRate !== null)
    .map((d) => d.bounceRate as number);
  const bounceRate =
    recentBounceRates.length > 0
      ? recentBounceRates.reduce((sum, r) => sum + r, 0) / recentBounceRates.length
      : 0;

  // Average keyword position (active keywords with rankings)
  const activeKeywordIds = new Set(keywords.map((k) => k.id));
  const keywordPositions = rankings
    .filter((r) => activeKeywordIds.has(r.keywordId) && r.position !== null)
    .map((r) => r.position as number);
  const avgKeywordPosition =
    keywordPositions.length > 0
      ? keywordPositions.reduce((sum, p) => sum + p, 0) / keywordPositions.length
      : 0;

  // Top page pageviews
  const topPageviews = topPages.length > 0 ? topPages[0].pageviews : 0;

  // Core Web Vitals score (average of good percentages)
  let coreWebVitalsScore = 0;
  if (coreWebVitals.length > 0) {
    const latestCwv = coreWebVitals[0];
    const goodPcts = [
      latestCwv.lcpGoodPct,
      latestCwv.fidGoodPct,
      latestCwv.clsGoodPct,
    ].filter((p) => p !== null) as number[];
    if (goodPcts.length > 0) {
      coreWebVitalsScore = goodPcts.reduce((sum, p) => sum + p, 0) / goodPcts.length;
    }
  }

  // Indexed pages
  const indexedPages = indexCoverage?.indexedCount || 0;

  // Backlink count
  const backlinkCount = backlinkProfile?.totalBacklinks || 0;

  return {
    dailySessions,
    weeklyTrafficTrend: Math.round(weeklyTrafficTrend * 10) / 10,
    bounceRate: Math.round(bounceRate * 10) / 10,
    avgKeywordPosition: Math.round(avgKeywordPosition * 10) / 10,
    topPageviews,
    coreWebVitalsScore: Math.round(coreWebVitalsScore),
    indexedPages,
    backlinkCount,
  };
}

// ============================================
// Main Data Fetcher
// ============================================

/**
 * Fetch all Web Intel dashboard data
 */
export async function getWebIntelDashboardData(days: number = 30): Promise<WebIntelDashboardData> {
  // Fetch all data in parallel
  const [
    dailyTrafficDb,
    trafficSourcesDb,
    topPagesDb,
    keywordsDb,
    rankingsDb,
    rankingChangesDb,
    coreWebVitalsDb,
    indexCoverageDb,
    searchPerformanceDb,
    contentDecayDb,
    backlinkProfileDb,
    alertsDb,
  ] = await Promise.all([
    getDailyTraffic(days),
    getTrafficSources(days),
    getTopPages(days, 10),
    getTrackedKeywords('active'),
    getDailyRankings(days),
    getRankingChanges(days, false),
    getCoreWebVitals(),
    getIndexCoverage(),
    getSearchPerformance(days, 20),
    getContentDecay(true),
    getBacklinkProfile(),
    getWebIntelAlerts(true),
  ]);

  // Transform all data
  const dailyTraffic = transformDailyTraffic(dailyTrafficDb);
  const trafficSources = transformTrafficSources(trafficSourcesDb);
  const topPages = transformPageTraffic(topPagesDb);
  const keywords = transformKeywords(keywordsDb);
  const rankings = transformRankings(rankingsDb);
  const rankingChanges = transformRankingChanges(rankingChangesDb);
  const coreWebVitals = transformCoreWebVitals(coreWebVitalsDb);
  const indexCoverage = indexCoverageDb ? transformIndexCoverage(indexCoverageDb) : null;
  const searchPerformance = transformSearchPerformance(searchPerformanceDb);
  const contentDecay = transformContentDecay(contentDecayDb);
  const backlinkProfile = backlinkProfileDb ? transformBacklinkProfile(backlinkProfileDb) : null;
  const alerts = transformAlerts(alertsDb);

  // Build metrics
  const metrics = buildWebIntelMetrics(
    dailyTraffic,
    topPages,
    keywords,
    rankings,
    coreWebVitals,
    indexCoverage,
    backlinkProfile
  );

  // Calculate health
  const health = calculateWebIntelHealth(coreWebVitals, rankingChanges, indexCoverage, alerts);

  return {
    metrics,
    dailyTraffic,
    trafficSources,
    topPages,
    keywords,
    rankings,
    rankingChanges,
    coreWebVitals,
    indexCoverage,
    searchPerformance,
    contentDecay,
    backlinkProfile,
    alerts,
    health,
  };
}
