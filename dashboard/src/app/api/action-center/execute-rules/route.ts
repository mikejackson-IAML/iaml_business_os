import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeRecurringRule, executeConditionRule } from '@/lib/action-center/task-rule-execution';
import { TaskRule } from '@/lib/action-center/task-rule-types';

const API_KEY = process.env.MOBILE_API_KEY;

/**
 * POST - Execute rules by type
 * Body: { rule_type: 'recurring' | 'condition', rule_ids?: string[] }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rule_type, rule_ids } = body;

    if (!rule_type || !['recurring', 'condition'].includes(rule_type)) {
      return NextResponse.json(
        { error: 'rule_type must be "recurring" or "condition"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get rules to execute
    let query = supabase
      .from('task_rules')
      .select('*')
      .eq('rule_type', rule_type)
      .eq('is_active', true);

    if (rule_ids && rule_ids.length > 0) {
      query = query.in('id', rule_ids);
    }

    const { data: rules, error: rulesError } = await query;

    if (rulesError) {
      return NextResponse.json(
        { error: 'Failed to fetch rules' },
        { status: 500 }
      );
    }

    const results = {
      rule_type,
      rules_found: rules?.length || 0,
      executed: 0,
      tasks_created: [] as string[],
      skipped: [] as { rule_id: string; reason: string }[],
      errors: [] as { rule_id: string; error: string }[],
    };

    for (const rule of rules || []) {
      const typedRule = rule as TaskRule;

      try {
        if (rule_type === 'recurring') {
          const result = await executeRecurringRule(supabase, typedRule);

          if (result.success && result.task_id) {
            results.executed++;
            results.tasks_created.push(result.task_id);
          } else if (result.skipped_reason) {
            results.skipped.push({
              rule_id: rule.id,
              reason: result.skipped_reason,
            });
          }
        } else if (rule_type === 'condition') {
          // Execute condition query
          if (!typedRule.condition_query) {
            results.skipped.push({
              rule_id: rule.id,
              reason: 'no_condition_query',
            });
            continue;
          }

          const { data: queryResult, error: queryError } = await supabase
            .rpc('execute_condition_query', { p_query: typedRule.condition_query });

          if (queryError) {
            results.errors.push({
              rule_id: rule.id,
              error: `Query failed: ${queryError.message}`,
            });
            continue;
          }

          const rows = queryResult as Record<string, unknown>[];

          // Create task for each row
          for (const row of rows) {
            const result = await executeConditionRule(supabase, typedRule, row);

            if (result.success && result.task_id) {
              results.executed++;
              results.tasks_created.push(result.task_id);
            } else if (result.skipped_reason) {
              results.skipped.push({
                rule_id: rule.id,
                reason: result.skipped_reason,
              });
            }
          }
        }
      } catch (error) {
        results.errors.push({
          rule_id: rule.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Execute rules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
