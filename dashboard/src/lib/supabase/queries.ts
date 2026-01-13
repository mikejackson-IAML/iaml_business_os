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
