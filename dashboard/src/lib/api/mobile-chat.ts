// Mobile Chat API - Types and helpers for Claude streaming
// Provides mobile-optimized chat types for iOS app consumption

import Anthropic from '@anthropic-ai/sdk';
import type {
  Tool,
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import { getMobileHealthData } from './mobile-health';
import { triggerWorkflow, getAvailableWorkflows, getWorkflowById } from './workflow-triggers';
import { logApiUsage } from './usage-tracking';

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
 * Looks up workflow by ID and triggers via webhook
 */
async function executeTriggerWorkflow(input: TriggerWorkflowInput): Promise<string> {
  // Look up workflow to get webhook URL
  const workflow = await getWorkflowById(input.workflow_id);

  if (!workflow) {
    return JSON.stringify({
      error: `Workflow not found: ${input.workflow_id}`,
    });
  }

  if (!workflow.webhook_url) {
    return JSON.stringify({
      error: `Workflow "${workflow.workflow_name}" does not have a webhook URL configured`,
    });
  }

  // Trigger the workflow
  const result = await triggerWorkflow(
    input.workflow_id,
    workflow.webhook_url,
    input.parameters
  );

  return JSON.stringify({
    status: result.success ? 'triggered' : 'failed',
    workflow_name: workflow.workflow_name,
    execution_id: result.executionId,
    message: result.message,
  });
}

/**
 * Execute query_workflows tool
 * Queries available workflows from the database
 */
async function executeQueryWorkflows(input: QueryWorkflowsInput): Promise<string> {
  // Get all available workflows
  const allWorkflows = await getAvailableWorkflows();

  // Apply limit (default 10)
  const limit = input.limit || 10;
  const workflows = allWorkflows.slice(0, limit);

  // For now, filter is not fully implemented (all/active/failed/recent all return the same)
  // This could be extended later with execution history tracking
  return JSON.stringify({
    workflows: workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      category: w.category,
      canTrigger: w.canTrigger,
    })),
    total: allWorkflows.length,
    filter: input.filter || 'all',
  });
}

// ==================== Chat Processing with Tools ====================

/**
 * Process a chat conversation with tool support
 * Handles the conversation loop when Claude requests tool use
 *
 * @param anthropic - Anthropic client instance
 * @param messages - Conversation history
 * @param onEvent - Callback for each SSE event to stream
 * @returns Stop reason and final message content
 */
export async function processChatWithTools(
  anthropic: Anthropic,
  messages: ChatMessage[],
  onEvent: (event: ChatEvent) => void
): Promise<{ stopReason: string; content: string }> {
  // Convert to Anthropic message format
  let conversationMessages: MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Maximum tool use iterations (prevent infinite loops)
  const MAX_TOOL_ITERATIONS = 5;
  let iterations = 0;
  let finalContent = '';

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    // Call Claude with streaming
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: conversationMessages,
      tools: CHAT_TOOLS,
    });

    // Track current response content blocks
    const contentBlocks: ContentBlockParam[] = [];
    let currentToolUseId: string | null = null;
    let currentToolName: string | null = null;
    let toolInputJson = '';

    // Process streaming events
    for await (const event of stream) {
      switch (event.type) {
        case 'content_block_start':
          if (event.content_block.type === 'tool_use') {
            currentToolUseId = event.content_block.id;
            currentToolName = event.content_block.name;
            toolInputJson = '';
            onEvent({
              type: 'tool_use_start',
              id: event.content_block.id,
              name: event.content_block.name,
            });
          }
          break;

        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            finalContent += event.delta.text;
            onEvent({ type: 'text', content: event.delta.text });
          } else if (event.delta.type === 'input_json_delta') {
            toolInputJson += event.delta.partial_json;
          }
          break;

        case 'content_block_stop':
          if (currentToolUseId && currentToolName) {
            // Parse complete tool input
            let toolInput: Record<string, unknown> = {};
            try {
              if (toolInputJson) {
                toolInput = JSON.parse(toolInputJson);
              }
            } catch {
              console.error('Failed to parse tool input:', toolInputJson);
            }

            // Add tool use block to content
            contentBlocks.push({
              type: 'tool_use',
              id: currentToolUseId,
              name: currentToolName,
              input: toolInput,
            });

            // Send tool_use event to client
            onEvent({
              type: 'tool_use',
              id: currentToolUseId,
              name: currentToolName,
              input: toolInput,
            });

            currentToolUseId = null;
            currentToolName = null;
            toolInputJson = '';
          }
          break;
      }
    }

    // Get final message to check stop reason
    const finalMessage = await stream.finalMessage();

    // Log API usage for this iteration
    logApiUsage({
      department: 'mobile',
      feature: 'chat',
      model: 'claude-sonnet-4-5-20250929',
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    });

    // If no tool use, we're done
    if (finalMessage.stop_reason !== 'tool_use') {
      return {
        stopReason: finalMessage.stop_reason || 'end_turn',
        content: finalContent,
      };
    }

    // Execute tools and continue conversation
    const toolUseBlocks = finalMessage.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    const toolResults: ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      // Execute the tool
      const result = await executeTool(
        toolUse.name,
        toolUse.input as Record<string, unknown>
      );

      // Send tool result event to client
      onEvent({
        type: 'tool_result',
        id: toolUse.id,
        content: result,
      });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    // Add assistant message with tool use to conversation
    conversationMessages.push({
      role: 'assistant',
      content: finalMessage.content,
    });

    // Add tool results as user message
    conversationMessages.push({
      role: 'user',
      content: toolResults,
    });

    // Continue loop to get Claude's response to tool results
  }

  // If we hit max iterations, return what we have
  return {
    stopReason: 'max_iterations',
    content: finalContent,
  };
}
