// LinkedIn Content Engine - Database mutation functions
// Write operations for linkedin_engine schema

import { getServerClient } from '@/lib/supabase/server';
import type {
  TopicRecommendationDb,
  PostDb,
  ContentCalendarDb,
  EngagementNetworkDb,
  EngagementDigestDb,
} from './linkedin-content-queries';

/**
 * Update the status of a topic recommendation.
 * Sets approved_at when approving, clears it otherwise.
 */
export async function updateTopicStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<TopicRecommendationDb> {
  const supabase = getServerClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString();
  } else {
    updateData.approved_at = null;
  }

  const { data, error } = await supabase
    .schema('linkedin_engine').from('topic_recommendations')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Topic status update error:', error);
    throw new Error('Failed to update topic status');
  }

  return data as TopicRecommendationDb;
}

/**
 * Update the status of a draft post (approve, reject, or reset to draft).
 */
export async function updateDraftStatus(
  id: string,
  status: 'approved' | 'rejected' | 'draft'
): Promise<PostDb> {
  const supabase = getServerClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'approved') {
    updateData.scheduled_for = new Date().toISOString();
  }

  const { data, error } = await supabase
    .schema('linkedin_engine').from('posts')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Draft status update error:', error);
    throw new Error('Failed to update draft status');
  }

  return data as PostDb;
}

/**
 * Select a hook variation (A, B, or C) for a draft post.
 * Updates hook_text, hook_category, and hook_variation on the post row.
 */
export async function selectHookVariation(
  id: string,
  variation: 'A' | 'B' | 'C',
  hookVariations: { text: string; category: string; variation: string }[]
): Promise<PostDb> {
  const selected = hookVariations.find((h) => h.variation === variation);

  if (!selected) {
    throw new Error(`Hook variation ${variation} not found in provided variations`);
  }

  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('posts')
    .update({
      hook_text: selected.text,
      hook_category: selected.category,
      hook_variation: variation,
    } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Hook variation update error:', error);
    throw new Error('Failed to select hook variation');
  }

  return data as PostDb;
}

/**
 * Update draft text fields (full_text, first_comment_text, hook_text).
 * Only sets fields that are provided.
 */
export async function updateDraftText(
  id: string,
  updates: { full_text?: string; first_comment_text?: string; hook_text?: string }
): Promise<PostDb> {
  const supabase = getServerClient();

  const updateData: Record<string, unknown> = {};
  if (updates.full_text !== undefined) updateData.full_text = updates.full_text;
  if (updates.first_comment_text !== undefined) updateData.first_comment_text = updates.first_comment_text;
  if (updates.hook_text !== undefined) updateData.hook_text = updates.hook_text;

  const { data, error } = await supabase
    .schema('linkedin_engine').from('posts')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Draft text update error:', error);
    throw new Error('Failed to update draft text');
  }

  return data as PostDb;
}

/**
 * Trigger content regeneration via n8n webhook.
 * First marks the post as regenerating, then fires the webhook.
 * Non-blocking: returns success even if webhook call fails.
 */
export async function triggerRegeneration(
  id: string,
  instructions: string,
  regenerateScope: 'hooks' | 'body' | 'full'
): Promise<{ success: boolean; message: string }> {
  const supabase = getServerClient();

  // Fetch the post to get topic_id
  const { data: post, error: fetchError } = await supabase
    .schema('linkedin_engine').from('posts')
    .select('topic_id')
    .eq('id', id)
    .single();

  if (fetchError || !post) {
    console.error('Failed to fetch post for regeneration:', fetchError);
    throw new Error('Post not found');
  }

  // Mark the post as regenerating with instructions
  const { error: updateError } = await supabase
    .schema('linkedin_engine').from('posts')
    .update({
      generation_status: 'regenerating',
      generation_instructions: instructions,
    } as never)
    .eq('id', id);

  if (updateError) {
    console.error('Failed to mark post as regenerating:', updateError);
    throw new Error('Failed to update generation status');
  }

  // Fire-and-forget webhook call to n8n
  try {
    await fetch('https://n8n.realtyamp.ai/webhook/linkedin-content-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic_id: (post as Record<string, unknown>).topic_id,
        regenerate: true,
        scope: regenerateScope,
        instructions,
      }),
    });
  } catch (err) {
    // Non-blocking: post is already marked as regenerating, user can retry
    console.error('Failed to trigger n8n regeneration webhook:', err);
  }

  return { success: true, message: 'Regeneration triggered' };
}

/**
 * Assign a calendar slot to a post.
 * Updates the content_calendar row with the post_id and sets status to 'generated'.
 */
export async function assignCalendarSlot(
  postId: string,
  calendarSlotId: string
): Promise<ContentCalendarDb> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('content_calendar')
    .update({
      post_id: postId,
      status: 'generated',
    } as never)
    .eq('id', calendarSlotId)
    .select()
    .single();

  if (error) {
    console.error('Calendar slot assignment error:', error);
    throw new Error('Failed to assign calendar slot');
  }

  return data as ContentCalendarDb;
}

/**
 * Create a new engagement network contact.
 */
export async function createNetworkContact(contact: {
  linkedin_name: string;
  linkedin_url: string;
  linkedin_headline?: string;
  follower_count?: number;
  tier: 'tier_1' | 'tier_2';
  category: string;
  notes?: string;
}): Promise<EngagementNetworkDb> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('engagement_network')
    .insert({
      linkedin_name: contact.linkedin_name,
      linkedin_url: contact.linkedin_url,
      linkedin_headline: contact.linkedin_headline || null,
      follower_count: contact.follower_count || null,
      tier: contact.tier,
      category: contact.category,
      notes: contact.notes || null,
      active: true,
    } as never)
    .select()
    .single();

  if (error) {
    console.error('Network contact creation error:', error);
    throw new Error('Failed to create network contact');
  }

  return data as EngagementNetworkDb;
}

/**
 * Update an engagement network contact's fields.
 */
export async function updateNetworkContact(
  id: string,
  updates: { tier?: string; category?: string; notes?: string; linkedin_headline?: string; follower_count?: number }
): Promise<EngagementNetworkDb> {
  const supabase = getServerClient();

  const updateData: Record<string, unknown> = {};
  if (updates.tier !== undefined) updateData.tier = updates.tier;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.linkedin_headline !== undefined) updateData.linkedin_headline = updates.linkedin_headline;
  if (updates.follower_count !== undefined) updateData.follower_count = updates.follower_count;

  const { data, error } = await supabase
    .schema('linkedin_engine').from('engagement_network')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Network contact update error:', error);
    throw new Error('Failed to update network contact');
  }

  return data as EngagementNetworkDb;
}

/**
 * Soft-delete (deactivate) an engagement network contact.
 */
export async function deactivateNetworkContact(id: string): Promise<EngagementNetworkDb> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .schema('linkedin_engine').from('engagement_network')
    .update({ active: false } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Network contact deactivation error:', error);
    throw new Error('Failed to deactivate network contact');
  }

  return data as EngagementNetworkDb;
}

/**
 * Update a digest item's status to completed or skipped.
 */
export async function updateDigestItemStatus(
  id: string,
  status: 'completed' | 'skipped'
): Promise<EngagementDigestDb> {
  const supabase = getServerClient();

  const updateData: Record<string, unknown> = { status };
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .schema('linkedin_engine').from('engagement_digests')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Digest item status update error:', error);
    throw new Error('Failed to update digest item status');
  }

  return data as EngagementDigestDb;
}
