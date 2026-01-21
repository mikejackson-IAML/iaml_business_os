// Mobile Chat API - Types and helpers for Claude streaming
// Provides mobile-optimized chat types for iOS app consumption

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
