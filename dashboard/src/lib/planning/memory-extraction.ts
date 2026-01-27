// Planning Studio Memory Extraction
// Uses Claude tool_use to extract structured memories from conversations

import Anthropic from '@anthropic-ai/sdk';

export type MemoryType =
  | 'decision'
  | 'inspiration'
  | 'insight'
  | 'pivot'
  | 'research_finding'
  | 'constraint'
  | 'user_preference'
  | 'rejection_reason';

export interface ExtractedMemory {
  content: string;
  memory_type: MemoryType;
  source_phase?: string;
}

const MEMORY_TYPES: MemoryType[] = [
  'decision',
  'inspiration',
  'insight',
  'pivot',
  'research_finding',
  'constraint',
  'user_preference',
  'rejection_reason',
];

const anthropic = new Anthropic();

const extractMemoriesTool: Anthropic.Tool = {
  name: 'extract_memories',
  description:
    'Extract notable memories from a planning conversation. Each memory should be a self-contained statement useful in future conversations.',
  input_schema: {
    type: 'object' as const,
    properties: {
      memories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'A self-contained statement capturing the memory',
            },
            memory_type: {
              type: 'string',
              enum: MEMORY_TYPES,
              description: 'The category of this memory',
            },
          },
          required: ['content', 'memory_type'],
        },
      },
    },
    required: ['memories'],
  },
};

/**
 * Extract notable memories from conversation text using Claude tool_use.
 * Returns empty array on failure (logs error, does not throw).
 */
export async function extractMemories(
  conversationText: string,
  projectName: string,
  phaseType: string
): Promise<ExtractedMemory[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      tools: [extractMemoriesTool],
      tool_choice: { type: 'tool', name: 'extract_memories' },
      system:
        'Extract notable memories from this planning conversation. Include decisions made, insights discovered, pivots in direction, constraints identified, user preferences expressed, rejected alternatives, and research findings. Each memory should be a self-contained statement that would be useful in future conversations. Be selective — only extract genuinely notable items, not routine exchanges.',
      messages: [
        {
          role: 'user',
          content: `Project: ${projectName}\nPhase: ${phaseType}\n\n---\n\n${conversationText}`,
        },
      ],
    });

    // Find tool_use block in response
    const toolBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (!toolBlock) {
      console.error('Memory extraction: no tool_use block in response');
      return [];
    }

    const input = toolBlock.input as { memories: Array<{ content: string; memory_type: string }> };

    return input.memories.map((m) => ({
      content: m.content,
      memory_type: m.memory_type as MemoryType,
      source_phase: phaseType,
    }));
  } catch (error) {
    console.error('Memory extraction failed:', error);
    return [];
  }
}
