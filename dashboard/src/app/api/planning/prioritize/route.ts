// Planning Studio Priority Calculation API Route
// POST endpoint for batch AI priority scoring of ready-to-build projects

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logApiUsage } from '@/lib/api/usage-tracking';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const anthropic = new Anthropic();

interface ProjectRow {
  id: string;
  title: string;
  one_liner: string | null;
  created_at: string;
  ready_to_build_at: string | null;
}

interface GoalRow {
  id: string;
  goal_type: string;
  description: string;
  priority: number;
  active: boolean;
}

interface DocCountRow {
  project_id: string;
  doc_type: string;
}

interface ScoredProject {
  project_id: string;
  score: number;
  reasoning: string;
  goal_alignment: string;
}

function getTierLabel(priority: number): string {
  if (priority >= 3) return 'Must-have';
  if (priority >= 2) return 'Should-have';
  return 'Nice-to-have';
}

export async function POST() {
  const supabase = createServerClient();

  try {
    // 1. Fetch all ready_to_build projects
    const { data: projects, error: projErr } = await supabase
      .schema('planning_studio')
      .from('projects')
      .select('id, title, one_liner, created_at, ready_to_build_at')
      .eq('status', 'ready_to_build');

    if (projErr) throw projErr;

    const typedProjects = (projects || []) as ProjectRow[];

    if (typedProjects.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    // 2. Fetch active goals
    const { data: goals, error: goalsErr } = await supabase
      .schema('planning_studio')
      .from('user_goals')
      .select('id, goal_type, description, priority, active')
      .eq('active', true);

    if (goalsErr) throw goalsErr;

    const typedGoals = (goals || []) as GoalRow[];

    // 3. Fetch document counts per project
    const projectIds = typedProjects.map((p) => p.id);
    const { data: docs, error: docsErr } = await supabase
      .schema('planning_studio')
      .from('documents')
      .select('project_id, doc_type')
      .in('project_id', projectIds);

    if (docsErr) throw docsErr;

    const typedDocs = (docs || []) as DocCountRow[];

    // Build doc summary per project
    const docsByProject: Record<string, string[]> = {};
    for (const doc of typedDocs) {
      if (!docsByProject[doc.project_id]) docsByProject[doc.project_id] = [];
      docsByProject[doc.project_id].push(doc.doc_type);
    }

    // 4. Build Claude prompt
    const now = new Date();

    const goalsBlock =
      typedGoals.length > 0
        ? typedGoals
            .map(
              (g) =>
                `- [${getTierLabel(g.priority)}] ${g.goal_type}: ${g.description}`
            )
            .join('\n')
        : 'No active goals set. Score based on doc completeness, effort, and recency only.';

    const projectsBlock = typedProjects
      .map((p) => {
        const docTypes = docsByProject[p.id] || [];
        const createdDate = new Date(p.created_at);
        const daysInPipeline = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return `- ID: ${p.id}
  Title: ${p.title}
  One-liner: ${p.one_liner || 'None'}
  Documents (${docTypes.length}): ${docTypes.length > 0 ? docTypes.join(', ') : 'none'}
  Days in pipeline: ${daysInPipeline}`;
      })
      .join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a project prioritization assistant. Score each project 0-100 based on:
- Goal Alignment (40%): How well does this project serve the active goals?
- Doc Completeness (25%): More documents = more thought-through = higher score
- Effort Estimate (20%): Projects with clear scope (good docs) suggest manageable effort
- Recency (15%): Newer projects get a slight boost (momentum)

Return ONLY a JSON array. No other text.`,
      messages: [
        {
          role: 'user',
          content: `Score these ready-to-build projects.

ACTIVE GOALS:
${goalsBlock}

PROJECTS:
${projectsBlock}

Return a JSON array:
[{ "project_id": "...", "score": N, "reasoning": "one line", "goal_alignment": "primary goal tag or none" }]`,
        },
      ],
    });

    // Log API usage
    logApiUsage({
      department: 'planning',
      feature: 'prioritize',
      model: 'claude-sonnet-4-20250514',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    // 5. Parse response
    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Failed to parse priority response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const scored: ScoredProject[] = JSON.parse(jsonMatch[0]);

    // 6. Update each project
    const updateTime = new Date().toISOString();
    let updated = 0;

    for (const item of scored) {
      const { error: updateErr } = await supabase
        .schema('planning_studio')
        .from('projects')
        .update({
          priority_score: item.score,
          priority_reasoning: `${item.reasoning}${item.goal_alignment && item.goal_alignment !== 'none' ? ` [${item.goal_alignment}]` : ''}`,
          priority_updated_at: updateTime,
          updated_at: updateTime,
        })
        .eq('id', item.project_id);

      if (!updateErr) updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Priority calculation error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to calculate priorities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
