// Programs Chat API Route
// SSE streaming endpoint for natural language queries against program data

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SCHEMA_CONTEXT, executeQuery, type QueryParams, type QueryResult } from '@/lib/api/programs-chat';
import { getProgram } from '@/lib/api/programs-queries';
import { logApiUsage } from '@/lib/api/usage-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// Types
// ============================================

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  programId?: string;
}

// ============================================
// System Prompt
// ============================================

function buildSystemPrompt(programContext?: string): string {
  return `You are a helpful assistant for querying program and registration data. You help users understand their program enrollment, attendance, payments, and evaluations.

${SCHEMA_CONTEXT}

${programContext ? `Current program context: ${programContext}` : 'No specific program context - queries are global across all programs.'}

## Your Capabilities

You can answer questions about:
- Program enrollment and capacity
- Registration lists and details
- Payment status and revenue
- Attendance records
- Evaluation scores
- Company/organization patterns
- Historical comparisons

## Response Guidelines

1. **For data queries**: Use the query_programs tool to fetch data, then provide a natural language explanation of the results.

2. **Format selection**:
   - Use "table" format for lists of items (registrations, programs)
   - Use "chart" format for comparisons or aggregations (enrollment by city, revenue by program)
   - Use "text" format for single values (counts, totals)

3. **Be conversational**: Explain what the data shows, highlight interesting patterns, and suggest follow-up questions when appropriate.

4. **Handle edge cases**: If a query returns no data, explain why (e.g., "No programs found in that date range") and suggest alternatives.

5. **Stay within scope**: You can only READ data, not modify it. If asked to change something, explain that data modifications must be done through the Programs dashboard.
`;
}

// ============================================
// Tool Definition
// ============================================

const tools: Anthropic.Tool[] = [
  {
    name: 'query_programs',
    description: 'Query program or registration data from the database. Returns structured data that can be displayed as a table, chart, or text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        table: {
          type: 'string',
          enum: ['program_dashboard_summary', 'registration_dashboard_summary'],
          description: 'The table to query',
        },
        select: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns to select. Omit for all columns.',
        },
        filters: {
          type: 'object',
          description: 'Filter conditions. Keys are column names, values can be direct values (for equality) or objects like {eq: value}, {gte: value}, {ilike: "%pattern%"}',
          additionalProperties: true,
        },
        groupBy: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns to group by (for aggregations)',
        },
        aggregate: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field to aggregate (use "*" for count)' },
            operation: { type: 'string', enum: ['count', 'sum', 'avg'] },
          },
          description: 'Aggregation to perform',
        },
        orderBy: {
          type: 'object',
          properties: {
            column: { type: 'string' },
            ascending: { type: 'boolean' },
          },
          description: 'Sort order',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of rows to return',
        },
      },
      required: ['table'],
    },
  },
];

// ============================================
// SSE Helpers
// ============================================

function formatSSE(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest) {
  // Parse request body
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { messages, programId } = body;

  // Validate required fields
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'messages array is required and must not be empty' },
      { status: 400 }
    );
  }

  // Load program context if programId provided
  let programContext: string | undefined;
  if (programId) {
    const program = await getProgram(programId);
    if (program) {
      programContext = `${program.program_name} - ${program.instance_name} (${program.city || 'Virtual'}, ${program.start_date || 'On-demand'})`;
    }
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const anthropic = new Anthropic();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const systemPrompt = buildSystemPrompt(programContext);

        // Convert messages to Anthropic format
        const formattedMessages: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        // Stream Claude response
        let fullContent = '';
        let toolUseBlocks: Anthropic.ToolUseBlock[] = [];

        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: formattedMessages,
          tools,
        });

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const text = event.delta.text;
              fullContent += text;
              controller.enqueue(encoder.encode(formatSSE({ type: 'text', content: text })));
            }
          } else if (event.type === 'content_block_stop') {
            // Check if this was a tool use block
            const finalMessage = await messageStream.finalMessage();
            for (const block of finalMessage.content) {
              if (block.type === 'tool_use') {
                toolUseBlocks.push(block);
              }
            }
          }
        }

        // Log API usage
        const finalMessage = await messageStream.finalMessage();
        logApiUsage({
          department: 'programs',
          feature: 'chat',
          model: 'claude-sonnet-4-20250514',
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
          projectId: programId,
        });

        // Process tool calls if any
        if (toolUseBlocks.length > 0) {
          for (const toolUse of toolUseBlocks) {
            if (toolUse.name === 'query_programs') {
              const params = toolUse.input as QueryParams;

              // Execute the query
              const result = await executeQuery(params);

              // Stream the data result
              controller.enqueue(
                encoder.encode(
                  formatSSE({
                    type: 'data',
                    result: {
                      data: result.data,
                      format: result.format,
                      chartConfig: result.chartConfig,
                    },
                  })
                )
              );

              // If there's data and Claude stopped at tool use, we need to continue the conversation
              // to get Claude's interpretation of the results
              if (result.data.length > 0 && finalMessage.stop_reason === 'tool_use') {
                // Build tool result message
                const toolResultMessages: Anthropic.MessageParam[] = [
                  ...formattedMessages,
                  {
                    role: 'assistant',
                    content: finalMessage.content,
                  },
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'tool_result',
                        tool_use_id: toolUse.id,
                        content: JSON.stringify({
                          rowCount: result.data.length,
                          data: result.data.slice(0, 20), // Limit data sent back to Claude
                          format: result.format,
                        }),
                      },
                    ],
                  },
                ];

                // Get Claude's interpretation
                const interpretStream = anthropic.messages.stream({
                  model: 'claude-sonnet-4-20250514',
                  max_tokens: 2048,
                  system: systemPrompt,
                  messages: toolResultMessages,
                  tools,
                });

                for await (const event of interpretStream) {
                  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    controller.enqueue(encoder.encode(formatSSE({ type: 'text', content: event.delta.text })));
                  }
                }

                // Log the follow-up usage
                const interpretMessage = await interpretStream.finalMessage();
                logApiUsage({
                  department: 'programs',
                  feature: 'chat-interpret',
                  model: 'claude-sonnet-4-20250514',
                  inputTokens: interpretMessage.usage.input_tokens,
                  outputTokens: interpretMessage.usage.output_tokens,
                  projectId: programId,
                });
              }
            }
          }
        }

        // Send done event
        controller.enqueue(encoder.encode(formatSSE({ type: 'done' })));
        controller.close();
      } catch (error) {
        console.error('Programs chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(formatSSE({ type: 'error', message: errorMessage })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
