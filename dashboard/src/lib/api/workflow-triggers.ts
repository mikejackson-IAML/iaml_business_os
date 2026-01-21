// Workflow Triggers API - Functions for listing and triggering n8n workflows
// Used by iOS app for quick actions feature

import { getServerClient } from '../supabase/server';

// ==================== Types ====================

export type RiskLevel = 'safe' | 'risky' | 'destructive';

export interface QuickAction {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  riskLevel: RiskLevel;
  category: string | null;
  canTrigger: boolean;
}

export interface TriggerResult {
  success: boolean;
  executionId?: string;
  message: string;
}

interface WorkflowRecord {
  workflow_id: string;
  workflow_name: string;
  description: string | null;
  quick_action_icon: string | null;
  risk_level: string | null;
  category: string | null;
  webhook_url: string | null;
}

// ==================== Functions ====================

/**
 * Trigger a workflow via its webhook URL
 * Fire-and-forget pattern with 10-second timeout
 */
export async function triggerWorkflow(
  workflowId: string,
  webhookUrl: string,
  parameters?: Record<string, unknown>
): Promise<TriggerResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters || {}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        message: `Workflow trigger failed with status ${response.status}`,
      };
    }

    // Webhook may return execution data or just 200 OK
    // Handle non-JSON responses gracefully
    let executionId: string | undefined;
    try {
      const data = await response.json();
      executionId = data.executionId || data.execution_id;
    } catch {
      // Response is not JSON, which is fine for fire-and-forget
    }

    return {
      success: true,
      executionId,
      message: 'Workflow triggered successfully',
    };
  } catch (error) {
    // Handle abort (timeout) differently from other errors
    if (error instanceof Error && error.name === 'AbortError') {
      // Timeout is actually okay for fire-and-forget - workflow may still be running
      return {
        success: true,
        message: 'Workflow triggered (response timed out, workflow may still be running)',
      };
    }

    console.error('Workflow trigger error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error triggering workflow',
    };
  }
}

/**
 * Get all workflows available as quick actions
 * Filters to enabled workflows with webhook URLs
 */
export async function getAvailableWorkflows(): Promise<QuickAction[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('workflow_registry')
    .select('workflow_id, workflow_name, description, quick_action_icon, risk_level, category, webhook_url')
    .eq('quick_action_enabled', true)
    .not('webhook_url', 'is', null)
    .order('workflow_name');

  if (error) {
    console.error('Error fetching workflows:', error);
    throw new Error('Failed to fetch available workflows');
  }

  // Map to QuickAction format
  return (data as WorkflowRecord[]).map((workflow) => ({
    id: workflow.workflow_id,
    name: workflow.workflow_name,
    description: workflow.description,
    icon: workflow.quick_action_icon || 'bolt.fill',
    riskLevel: (workflow.risk_level as RiskLevel) || 'safe',
    category: workflow.category,
    canTrigger: workflow.webhook_url !== null,
  }));
}

/**
 * Get a single workflow by ID
 * Returns null if not found
 */
export async function getWorkflowById(workflowId: string): Promise<WorkflowRecord | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('workflow_registry')
    .select('workflow_id, workflow_name, description, quick_action_icon, risk_level, category, webhook_url')
    .eq('workflow_id', workflowId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - not found
      return null;
    }
    console.error('Error fetching workflow:', error);
    throw new Error('Failed to fetch workflow');
  }

  return data as WorkflowRecord;
}
