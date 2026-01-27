// Planning Studio Chat Helpers
// Context assembly, message saving, and conversation management

import { createServerClient } from '@/lib/supabase/server';
import { getPhaseContext } from './planning-queries';
import type {
  PlanningConversation,
  PlanningMessage,
  MessageRole,
} from '@/dashboard-kit/types/departments/planning';

/**
 * Save a message to the planning_studio.messages table
 */
export async function saveMessage(
  conversationId: string,
  role: MessageRole,
  content: string
): Promise<PlanningMessage> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }

  // Update conversation message count
  await updateConversationMessageCount(conversationId);

  return data as PlanningMessage;
}

/**
 * Create a new conversation for a project phase
 */
export async function createConversation(
  projectId: string,
  phaseId: string,
  title?: string
): Promise<PlanningConversation> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('conversations')
    .insert({
      project_id: projectId,
      phase_id: phaseId,
      title: title || null,
      message_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data as PlanningConversation;
}

/**
 * Update conversation message_count by counting messages
 */
export async function updateConversationMessageCount(
  conversationId: string
): Promise<void> {
  const supabase = createServerClient();

  // Count messages for this conversation
  const { count, error: countError } = await supabase
    .schema('planning_studio')
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  if (countError) {
    console.error('Error counting messages:', countError);
    return;
  }

  // Update the conversation record
  const { error: updateError } = await supabase
    .schema('planning_studio')
    .from('conversations')
    .update({ message_count: count || 0 })
    .eq('id', conversationId);

  if (updateError) {
    console.error('Error updating conversation message count:', updateError);
  }
}

/**
 * Fetch all messages for a conversation ordered by created_at ascending
 */
export async function getConversationMessages(
  conversationId: string
): Promise<PlanningMessage[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching conversation messages:', error);
    return [];
  }

  return (data || []) as PlanningMessage[];
}

/**
 * Load chat context for a project phase via the getPhaseContext RPC
 */
export async function loadChatContext(
  projectId: string,
  phaseType: string
): Promise<{
  conversationSummaries: string[];
  documents: Array<{ type: string; content: string; version: number }>;
  recentMessages: Array<{ role: string; content: string }>;
}> {
  const context = await getPhaseContext(projectId, phaseType);

  if (!context) {
    return {
      conversationSummaries: [],
      documents: [],
      recentMessages: [],
    };
  }

  return {
    conversationSummaries: context.conversation_summaries || [],
    documents: (context.document_contents || []).map((d) => ({
      type: d.type,
      content: d.content,
      version: d.version,
    })),
    recentMessages: (context.recent_messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };
}
