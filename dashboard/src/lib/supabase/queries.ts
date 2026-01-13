import { getServerClient } from './server';
import type {
  Campaign,
  CampaignFunnel,
  ChannelPerformance,
  CampaignContact,
  CampaignActivity,
  Contact,
} from './types';

/**
 * Fetch all campaigns with optional status filter
 */
export async function getCampaigns(status?: string): Promise<Campaign[]> {
  const supabase = getServerClient();

  let query = supabase
    .from('multichannel_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch a single campaign by ID
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('multichannel_campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }

  return data;
}

/**
 * Fetch campaign funnel metrics from the view
 */
export async function getCampaignFunnels(): Promise<CampaignFunnel[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('campaign_funnel')
    .select('*');

  if (error) {
    console.error('Error fetching campaign funnels:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch channel performance metrics from the view
 */
export async function getChannelPerformance(): Promise<ChannelPerformance[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('channel_performance')
    .select('*');

  if (error) {
    console.error('Error fetching channel performance:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch recent campaign activity
 */
export async function getRecentActivity(limit = 20): Promise<CampaignActivity[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('campaign_activity')
    .select('*')
    .order('activity_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch contacts with campaign status
 */
export async function getCampaignContacts(
  campaignId: string,
  options?: {
    status?: string;
    lifecycleTag?: string;
    ghlBranch?: string;
    limit?: number;
  }
): Promise<CampaignContact[]> {
  const supabase = getServerClient();

  let query = supabase
    .from('campaign_contacts')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('updated_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.lifecycleTag) {
    query = query.eq('lifecycle_tag', options.lifecycleTag);
  }
  if (options?.ghlBranch) {
    query = query.eq('ghl_branch', options.ghlBranch);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching campaign contacts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get dashboard overview metrics
 */
export async function getDashboardMetrics(): Promise<{
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  engagedContacts: number;
  registeredContacts: number;
  channelBreakdown: ChannelPerformance[];
}> {
  const supabase = getServerClient();

  // Fetch campaigns count
  const { count: totalCampaigns } = await supabase
    .from('multichannel_campaigns')
    .select('*', { count: 'exact', head: true });

  const { count: activeCampaigns } = await supabase
    .from('multichannel_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Fetch funnel data for totals
  const funnels = await getCampaignFunnels();
  const totalContacts = funnels.reduce((sum, f) => sum + (f.total_contacts || 0), 0);
  const engagedContacts = funnels.reduce((sum, f) => sum + (f.engaged_contacts || 0), 0);
  const registeredContacts = funnels.reduce((sum, f) => sum + (f.registered_contacts || 0), 0);

  // Fetch channel breakdown
  const channelBreakdown = await getChannelPerformance();

  return {
    totalCampaigns: totalCampaigns || 0,
    activeCampaigns: activeCampaigns || 0,
    totalContacts,
    engagedContacts,
    registeredContacts,
    channelBreakdown,
  };
}

/**
 * Get contact details with their campaign participation
 */
export async function getContactWithCampaigns(contactId: string): Promise<{
  contact: Contact | null;
  campaigns: CampaignContact[];
}> {
  const supabase = getServerClient();

  const [contactResult, campaignsResult] = await Promise.all([
    supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single(),
    supabase
      .from('campaign_contacts')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false }),
  ]);

  return {
    contact: contactResult.data,
    campaigns: campaignsResult.data || [],
  };
}

// ============================================
// Marketing Dashboard Queries
// ============================================

export interface MarketingMetricsData {
  totalContacts: number;
  validEmailContacts: number;
  invalidEmailContacts: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  replyRate: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalBounced: number;
}

/**
 * Get marketing-specific metrics from campaign activity
 */
export async function getMarketingMetrics(): Promise<MarketingMetricsData> {
  const supabase = getServerClient();

  // Get contact counts
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });

  const { count: validEmailContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .in('email_validation_result', ['valid', 'catch_all']);

  const { count: invalidEmailContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('email_validation_result', 'invalid');

  // Get activity counts for rate calculations
  const { count: totalSent } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'sent');

  const { count: totalOpened } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'opened');

  const { count: totalClicked } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'clicked');

  const { count: totalReplied } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'replied');

  const { count: totalBounced } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'bounced');

  const sent = totalSent || 0;
  const opened = totalOpened || 0;
  const clicked = totalClicked || 0;
  const replied = totalReplied || 0;
  const bounced = totalBounced || 0;

  return {
    totalContacts: totalContacts || 0,
    validEmailContacts: validEmailContacts || 0,
    invalidEmailContacts: invalidEmailContacts || 0,
    openRate: sent > 0 ? (opened / sent) * 100 : 0,
    clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
    bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
    replyRate: sent > 0 ? (replied / sent) * 100 : 0,
    totalSent: sent,
    totalOpened: opened,
    totalClicked: clicked,
    totalReplied: replied,
    totalBounced: bounced,
  };
}

export interface MarketingAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  timestamp: Date;
}

/**
 * Get marketing alerts based on thresholds
 */
export async function getMarketingAlerts(): Promise<MarketingAlert[]> {
  const metrics = await getMarketingMetrics();
  const alerts: MarketingAlert[] = [];

  // Check bounce rate (critical if > 5%, warning if > 2%)
  if (metrics.bounceRate > 5) {
    alerts.push({
      id: 'bounce-rate-critical',
      title: 'High Bounce Rate',
      description: `Bounce rate is ${metrics.bounceRate.toFixed(1)}% - above 5% threshold. Check email list quality.`,
      severity: 'critical',
      category: 'deliverability',
      timestamp: new Date(),
    });
  } else if (metrics.bounceRate > 2) {
    alerts.push({
      id: 'bounce-rate-warning',
      title: 'Elevated Bounce Rate',
      description: `Bounce rate is ${metrics.bounceRate.toFixed(1)}% - consider reviewing email list.`,
      severity: 'warning',
      category: 'deliverability',
      timestamp: new Date(),
    });
  }

  // Check open rate (warning if < 20%)
  if (metrics.totalSent > 100 && metrics.openRate < 20) {
    alerts.push({
      id: 'low-open-rate',
      title: 'Low Open Rate',
      description: `Open rate is ${metrics.openRate.toFixed(1)}% - below 20% target. Consider improving subject lines.`,
      severity: 'warning',
      category: 'campaign_performance',
      timestamp: new Date(),
    });
  }

  // Check for invalid emails in list
  const invalidRate = metrics.totalContacts > 0
    ? (metrics.invalidEmailContacts / metrics.totalContacts) * 100
    : 0;

  if (invalidRate > 10) {
    alerts.push({
      id: 'invalid-emails',
      title: 'High Invalid Email Rate',
      description: `${metrics.invalidEmailContacts} contacts (${invalidRate.toFixed(1)}%) have invalid emails.`,
      severity: 'warning',
      category: 'list_health',
      timestamp: new Date(),
    });
  }

  // Check for stalled campaigns
  const supabase = getServerClient();
  const { data: stalledCampaigns } = await supabase
    .from('multichannel_campaigns')
    .select('name, updated_at')
    .eq('status', 'active')
    .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (stalledCampaigns && stalledCampaigns.length > 0) {
    alerts.push({
      id: 'stalled-campaigns',
      title: 'Stalled Campaigns Detected',
      description: `${stalledCampaigns.length} active campaign(s) haven't been updated in 7+ days.`,
      severity: 'info',
      category: 'automation',
      timestamp: new Date(),
    });
  }

  return alerts;
}

export interface LinkedInAutomationData {
  connectionsSent: number;
  connectionsAccepted: number;
  acceptanceRate: number;
  messagesSent: number;
  messagesReplied: number;
  responseRate: number;
  activeContacts: number;
}

/**
 * Get LinkedIn automation status from campaign data
 */
export async function getLinkedInAutomationStatus(): Promise<LinkedInAutomationData> {
  const supabase = getServerClient();

  // Get LinkedIn channel activities
  const { count: connectionsSent } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'connection_sent');

  const { count: connectionsAccepted } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'connection_accepted');

  const { count: messagesSent } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'message_sent')
    .eq('channel', 'linkedin');

  const { count: messagesReplied } = await supabase
    .from('campaign_activity')
    .select('*', { count: 'exact', head: true })
    .eq('activity_type', 'message_replied')
    .eq('channel', 'linkedin');

  // Get active LinkedIn contacts
  const { count: activeContacts } = await supabase
    .from('campaign_contact_channels')
    .select('*, campaign_channels!inner(*)', { count: 'exact', head: true })
    .eq('campaign_channels.channel', 'linkedin')
    .eq('status', 'active');

  const sent = connectionsSent || 0;
  const accepted = connectionsAccepted || 0;
  const msgSent = messagesSent || 0;
  const msgReplied = messagesReplied || 0;

  return {
    connectionsSent: sent,
    connectionsAccepted: accepted,
    acceptanceRate: sent > 0 ? (accepted / sent) * 100 : 0,
    messagesSent: msgSent,
    messagesReplied: msgReplied,
    responseRate: msgSent > 0 ? (msgReplied / msgSent) * 100 : 0,
    activeContacts: activeContacts || 0,
  };
}
