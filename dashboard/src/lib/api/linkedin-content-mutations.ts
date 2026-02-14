// LinkedIn Content Engine - Database mutation functions
// Write operations for linkedin_engine schema

import { getServerClient } from '@/lib/supabase/server';
import type { TopicRecommendationDb } from './linkedin-content-queries';

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

  // Use dot notation to match existing query patterns in linkedin-content-queries.ts
  // The Database type doesn't include linkedin_engine schema, so .schema() fails TS checks
  const { data, error } = await supabase
    .from('linkedin_engine.topic_recommendations')
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
