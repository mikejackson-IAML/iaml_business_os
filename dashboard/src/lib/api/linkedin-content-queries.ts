// LinkedIn Content Engine Dashboard API
// Queries Supabase linkedin_engine schema for content management data

import { getServerClient } from '@/lib/supabase/server';

// ============================================
// Database Types (snake_case matching Supabase)
// ============================================

export interface TopicRecommendationDb {
  id: string;
  week_of: string;
  topic_title: string;
  angle: string | null;
  total_score: number | null;
  engagement_score: number | null;
  freshness_score: number | null;
  gap_score: number | null;
  positioning_score: number | null;
  format_score: number | null;
  recommended_format: string | null;
  recommended_series: string | null;
  hook_suggestion: string | null;
  key_data_points: Record<string, unknown> | null;
  source_signal_ids: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  created_at: string;
}

export interface PostDb {
  id: string;
  topic_id: string | null;
  linkedin_post_id: string | null;
  hook_text: string | null;
  hook_category: string | null;
  hook_variation: string | null;
  full_text: string;
  first_comment_text: string | null;
  format: string | null;
  series: string | null;
  pillar: string | null;
  carousel_pdf_url: string | null;
  hashtags: string[] | null;
  tagged_people: string[] | null;
  status: 'draft' | 'approved' | 'rejected' | 'scheduled' | 'published' | 'failed';
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  hook_variations: { text: string; category: string; variation: string }[] | null;
  generation_status: 'pending' | 'generating' | 'completed' | 'failed' | 'regenerating' | null;
  generation_instructions: string | null;
}

export interface PostAnalyticsDb {
  id: string;
  post_id: string;
  captured_at: string;
  impressions: number | null;
  reactions_total: number | null;
  reactions_by_type: Record<string, number> | null;
  comments_count: number | null;
  shares_count: number | null;
  engagement_rate: number | null;
  profile_views_day: number | null;
  new_followers_day: number | null;
  click_through_rate: number | null;
  hours_since_publish: number | null;
}

export interface ContentCalendarDb {
  id: string;
  week_of: string | null;
  post_date: string;
  day_of_week: string | null;
  series: string | null;
  pillar: string | null;
  recommended_format: string | null;
  topic_id: string | null;
  post_id: string | null;
  status: 'open' | 'assigned' | 'generated' | 'approved' | 'published';
  notes: string | null;
}

export interface WeeklyAnalyticsDb {
  id: string;
  week_of: string;
  total_posts: number | null;
  total_impressions: number | null;
  total_reactions: number | null;
  total_comments: number | null;
  total_shares: number | null;
  avg_engagement_rate: number | null;
  best_post_id: string | null;
  worst_post_id: string | null;
  new_followers: number | null;
  total_profile_views: number | null;
  format_performance: Record<string, number> | null;
  topic_performance: Record<string, number> | null;
  hook_performance: Record<string, number> | null;
  recommendations: string[] | null;
  created_at: string;
}

export interface EngagementNetworkDb {
  id: string;
  linkedin_name: string;
  linkedin_url: string | null;
  linkedin_headline: string | null;
  follower_count: number | null;
  tier: string | null;
  category: string | null;
  engagement_history: Record<string, unknown> | null;
  last_monitored: string | null;
  last_engaged: string | null;
  avg_post_engagement: number | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface CommentActivityDb {
  id: string;
  target_post_url: string | null;
  target_author: string | null;
  target_author_followers: number | null;
  comment_text: string | null;
  commented_at: string | null;
  likes_received: number;
  replies_received: number;
  profile_visits_driven: number | null;
  connection_requests_driven: number | null;
  roi_score: number | null;
  created_at: string;
}

export interface EngagementDigestDb {
  id: string;
  digest_date: string;
  digest_type: 'daily' | 'warming';
  target_post_url: string | null;
  target_post_content: string | null;
  target_author: string | null;
  target_author_url: string | null;
  target_author_followers: number | null;
  network_contact_id: string | null;
  post_engagement: { likes: number; comments: number; shares: number } | null;
  comment_suggestions: { style: string; text: string }[] | null;
  status: 'pending' | 'completed' | 'skipped';
  completed_at: string | null;
  warming_context: string | null;
  created_at: string;
}

export interface HookDb {
  id: string;
  hook_text: string;
  hook_category: string | null;
  character_count: number | null;
  source: string | null;
  times_used: number;
  avg_engagement_rate: number | null;
  best_engagement_rate: number | null;
  score: number;
  status: 'active' | 'retired';
  created_at: string;
}

// ============================================
// Dashboard Summary Types
// ============================================

export interface LinkedInContentSummary {
  thisWeekTopics: TopicRecommendationDb[];
  drafts: PostDb[];
  upcomingCalendar: ContentCalendarDb[];
  recentPosts: PostDb[];
  weeklyStats: WeeklyAnalyticsDb | null;
  engagementNetwork: { total: number; tier1: number; tier2: number };
  recentComments: CommentActivityDb[];
  hookLibraryCount: number;
  todayDigest: EngagementDigestDb[];
  engagementNetworkFull: EngagementNetworkDb[];
  engagementROI: { totalCommentsThisWeek: number; avgRoiScore: number; totalLikesReceived: number; totalRepliesReceived: number };
}

// ============================================
// Query Functions
// ============================================

/**
 * Get topic recommendations for the current week
 */
export async function getThisWeekTopics(): Promise<TopicRecommendationDb[]> {
  const supabase = getServerClient();

  // Get Monday of current week
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  const weekOf = monday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .schema('linkedin_engine').from('topic_recommendations')
    .select('*')
    .eq('week_of', weekOf)
    .order('total_score', { ascending: false });

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  return (data as TopicRecommendationDb[]) || [];
}

/**
 * Get draft posts awaiting review
 */
export async function getDraftPosts(): Promise<PostDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('posts')
    .select('*')
    .in('status', ['draft', 'approved', 'scheduled'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching drafts:', error);
    return [];
  }

  return (data as PostDb[]) || [];
}

/**
 * Get content calendar for the next 4 weeks
 */
export async function getUpcomingCalendar(): Promise<ContentCalendarDb[]> {
  const supabase = getServerClient();

  const today = new Date().toISOString().split('T')[0];
  const fourWeeks = new Date();
  fourWeeks.setDate(fourWeeks.getDate() + 28);
  const endDate = fourWeeks.toISOString().split('T')[0];

  const { data, error } = await supabase
    .schema('linkedin_engine').from('content_calendar')
    .select('*')
    .gte('post_date', today)
    .lte('post_date', endDate)
    .order('post_date', { ascending: true });

  if (error) {
    console.error('Error fetching calendar:', error);
    return [];
  }

  return (data as ContentCalendarDb[]) || [];
}

/**
 * Get recently published posts with their latest analytics
 */
export async function getRecentPublishedPosts(): Promise<PostDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }

  return (data as PostDb[]) || [];
}

/**
 * Get the most recent weekly analytics summary
 */
export async function getLatestWeeklyAnalytics(): Promise<WeeklyAnalyticsDb | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('weekly_analytics')
    .select('*')
    .order('week_of', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows
    console.error('Error fetching weekly analytics:', error);
    return null;
  }

  return data as WeeklyAnalyticsDb;
}

/**
 * Get engagement network summary
 */
export async function getEngagementNetworkSummary(): Promise<{ total: number; tier1: number; tier2: number }> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('engagement_network')
    .select('tier')
    .eq('active', true);

  if (error) {
    console.error('Error fetching engagement network:', error);
    return { total: 0, tier1: 0, tier2: 0 };
  }

  const rows = data || [];
  return {
    total: rows.length,
    tier1: rows.filter((r: { tier: string }) => r.tier === 'tier_1').length,
    tier2: rows.filter((r: { tier: string }) => r.tier === 'tier_2').length,
  };
}

/**
 * Get recent comment activity
 */
export async function getRecentComments(): Promise<CommentActivityDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('comment_activity')
    .select('*')
    .order('commented_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  return (data as CommentActivityDb[]) || [];
}

/**
 * Get today's engagement digest items (daily + warming)
 */
export async function getTodayDigest(): Promise<EngagementDigestDb[]> {
  const supabase = getServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .schema('linkedin_engine').from('engagement_digests')
    .select('*')
    .eq('digest_date', today)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching today digest:', error);
    return [];
  }

  return (data as EngagementDigestDb[]) || [];
}

/**
 * Get full engagement network (all contacts, not just summary)
 */
export async function getEngagementNetworkFull(): Promise<EngagementNetworkDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('engagement_network')
    .select('*')
    .order('tier', { ascending: true })
    .order('linkedin_name', { ascending: true });

  if (error) {
    console.error('Error fetching engagement network:', error);
    return [];
  }

  return (data as EngagementNetworkDb[]) || [];
}

/**
 * Get weekly engagement ROI metrics from comment_activity
 */
export async function getEngagementROIMetrics(): Promise<{
  totalCommentsThisWeek: number;
  avgRoiScore: number;
  totalLikesReceived: number;
  totalRepliesReceived: number;
}> {
  const supabase = getServerClient();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('comment_activity')
    .select('likes_received, replies_received, roi_score')
    .gte('commented_at', oneWeekAgo);

  if (error) {
    console.error('Error fetching ROI metrics:', error);
    return { totalCommentsThisWeek: 0, avgRoiScore: 0, totalLikesReceived: 0, totalRepliesReceived: 0 };
  }

  const rows = data || [];
  const totalComments = rows.length;
  const avgRoi = totalComments > 0
    ? rows.reduce((sum: number, r: { roi_score: number | null }) => sum + (r.roi_score || 0), 0) / totalComments
    : 0;
  const totalLikes = rows.reduce((sum: number, r: { likes_received: number }) => sum + (r.likes_received || 0), 0);
  const totalReplies = rows.reduce((sum: number, r: { replies_received: number }) => sum + (r.replies_received || 0), 0);

  return {
    totalCommentsThisWeek: totalComments,
    avgRoiScore: Math.round(avgRoi * 10) / 10,
    totalLikesReceived: totalLikes,
    totalRepliesReceived: totalReplies,
  };
}

/**
 * Get hook library count
 */
export async function getHookLibraryCount(): Promise<number> {
  const supabase = getServerClient();

  const { count, error } = await supabase
    .schema('linkedin_engine').from('hooks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching hook count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get analytics for a specific post
 */
export async function getPostAnalytics(postId: string): Promise<PostAnalyticsDb[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('post_analytics')
    .select('*')
    .eq('post_id', postId)
    .order('captured_at', { ascending: true });

  if (error) {
    console.error('Error fetching post analytics:', error);
    return [];
  }

  return (data as PostAnalyticsDb[]) || [];
}

/**
 * Get all data needed for the LinkedIn Content dashboard
 */
export async function getLinkedInContentDashboardData(): Promise<LinkedInContentSummary> {
  const [
    thisWeekTopics,
    drafts,
    upcomingCalendar,
    recentPosts,
    weeklyStats,
    engagementNetwork,
    recentComments,
    hookLibraryCount,
    todayDigest,
    engagementNetworkFull,
    engagementROI,
  ] = await Promise.all([
    getThisWeekTopics(),
    getDraftPosts(),
    getUpcomingCalendar(),
    getRecentPublishedPosts(),
    getLatestWeeklyAnalytics(),
    getEngagementNetworkSummary(),
    getRecentComments(),
    getHookLibraryCount(),
    getTodayDigest(),
    getEngagementNetworkFull(),
    getEngagementROIMetrics(),
  ]);

  return {
    thisWeekTopics,
    drafts,
    upcomingCalendar,
    recentPosts,
    weeklyStats,
    engagementNetwork,
    recentComments,
    hookLibraryCount,
    todayDigest,
    engagementNetworkFull,
    engagementROI,
  };
}
