// Mobile Chat API - Types and helpers for Claude streaming
// Provides mobile-optimized chat types for iOS app consumption

import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { getMobileHealthData } from './mobile-health';

// ==================== Message Types ====================

/**
 * Message format for conversation history
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ==================== SSE Event Types ====================

/**
 * SSE event types sent to iOS client
 * These are simplified from Anthropic's verbose event structure
 */
export type ChatEventType = 'text' | 'tool_use_start' | 'tool_use' | 'tool_result' | 'done' | 'error';

/**
 * Text content streaming event
 */
export interface TextEvent {
  type: 'text';
  content: string;
}

/**
 * Tool call starting event (announces tool before input is complete)
 */
export interface ToolUseStartEvent {
  type: 'tool_use_start';
  id: string;
  name: string;
}

/**
 * Tool call complete with input
 */
export interface ToolUseEvent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolResultEvent {
  type: 'tool_result';
  id: string;
  content: string;
}

/**
 * Message complete event
 */
export interface DoneEvent {
  type: 'done';
  stop_reason: string;
}

/**
 * Error event
 */
export interface ErrorEvent {
  type: 'error';
  message: string;
}

/**
 * Union type of all possible chat events
 */
export type ChatEvent = TextEvent | ToolUseStartEvent | ToolUseEvent | ToolResultEvent | DoneEvent | ErrorEvent;

// ==================== Helper Functions ====================

/**
 * Format a chat event as an SSE message
 * SSE format: `data: <json>\n\n`
 */
export function formatSSEEvent(event: ChatEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// ==================== System Prompt ====================

/**
 * System prompt for the IAML Business OS mobile assistant
 */
export const SYSTEM_PROMPT = `You are an AI assistant for the IAML Business OS mobile app. You help the user:
- Monitor system health and workflows
- Trigger n8n workflows for automation tasks
- Query business data and metrics
- Perform quick actions

Be concise and helpful. When the user asks to do something that requires a tool, use the appropriate tool.`;

// ==================== Tool Definitions ====================

/**
 * Tool definitions for Claude chat
 * These define the capabilities Claude can use when responding to user queries
 */
export const CHAT_TOOLS: Tool[] = [
  {
    name: 'get_health_status',
    description: 'Get current system health status including department scores and alerts. Use when user asks about system status, health, problems, or alerts.',
    input_schema: {
      type: 'object' as const,
      properties: {
        department: {
          type: 'string',
          enum: ['workflows', 'digital', 'all'],
          description: 'Which department to check. Use "all" to get overall health.',
        },
        include_alerts: {
          type: 'boolean',
          description: 'Whether to include active alerts in the response.',
        },
      },
      required: ['department'],
    },
  },
  {
    name: 'trigger_workflow',
    description: 'Trigger an n8n workflow by ID. Use when user wants to run a specific automation workflow. IMPORTANT: Always confirm the workflow name with the user before triggering.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The n8n workflow ID (alphanumeric string like "HnZQopXL7xjZnX3O")',
        },
        workflow_name: {
          type: 'string',
          description: 'Human-readable name of the workflow for confirmation',
        },
        parameters: {
          type: 'object',
          description: 'Optional parameters to pass to the workflow',
          additionalProperties: true,
        },
      },
      required: ['workflow_id', 'workflow_name'],
    },
  },
  {
    name: 'query_workflows',
    description: 'Query information about available n8n workflows. Use when user asks about workflows, what automations exist, or recent workflow runs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'active', 'failed', 'recent'],
          description: 'Filter workflows by status',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of workflows to return (default 10)',
        },
      },
      required: [],
    },
  },
];

// ==================== Tool Input Types ====================

interface HealthToolInput {
  department: 'workflows' | 'digital' | 'all';
  include_alerts?: boolean;
}

interface TriggerWorkflowInput {
  workflow_id: string;
  workflow_name: string;
  parameters?: Record<string, unknown>;
}

interface QueryWorkflowsInput {
  filter?: 'all' | 'active' | 'failed' | 'recent';
  limit?: number;
}

// ==================== Tool Execution ====================

/**
 * Execute a tool and return the result as a string
 * This is called when Claude requests tool use
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case 'get_health_status':
        return await executeHealthStatus(input as unknown as HealthToolInput);

      case 'trigger_workflow':
        return await executeTriggerWorkflow(input as unknown as TriggerWorkflowInput);

      case 'query_workflows':
        return await executeQueryWorkflows(input as unknown as QueryWorkflowsInput);

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Tool execution error (${name}):`, error);
    return JSON.stringify({ error: message });
  }
}

// ==================== Tool Implementations ====================

/**
 * Execute get_health_status tool
 * Returns real health data from mobile-health.ts
 */
async function executeHealthStatus(input: HealthToolInput): Promise<string> {
  const healthData = await getMobileHealthData();

  if (input.department === 'all') {
    // Return full health data
    if (input.include_alerts === false) {
      const { alerts, ...rest } = healthData;
      return JSON.stringify(rest);
    }
    return JSON.stringify(healthData);
  }

  // Return specific department
  const dept = healthData.departments.find(d => d.id === input.department);
  if (!dept) {
    return JSON.stringify({ error: `Department not found: ${input.department}` });
  }

  const result: Record<string, unknown> = { department: dept };
  if (input.include_alerts !== false) {
    result.alerts = healthData.alerts.filter(a => a.department === input.department);
  }
  return JSON.stringify(result);
}

/**
 * Execute trigger_workflow tool
 * Placeholder - actual n8n webhook trigger will be implemented in Phase 10
 */
async function executeTriggerWorkflow(input: TriggerWorkflowInput): Promise<string> {
  // Placeholder - actual n8n webhook trigger will be implemented in Phase 10
  // For now, return a message indicating what would happen
  return JSON.stringify({
    status: 'pending',
    message: `Workflow trigger requested: ${input.workflow_name} (${input.workflow_id})`,
    note: 'Workflow triggering will be fully implemented in Phase 10',
    parameters: input.parameters || {},
  });
}

/**
 * Execute query_workflows tool
 * Placeholder - actual n8n API query will be implemented in Phase 10
 */
async function executeQueryWorkflows(_input: QueryWorkflowsInput): Promise<string> {
  // Placeholder - actual n8n API query will be implemented in Phase 10
  // Return a helpful message about available workflows
  return JSON.stringify({
    message: 'Workflow querying will be implemented in Phase 10',
    note: 'For now, use the n8n dashboard to view workflows',
    workflows: [],
  });
}
