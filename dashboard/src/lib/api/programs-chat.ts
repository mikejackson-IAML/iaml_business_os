// Programs Chat Helper Library
// Provides schema context and query execution for the AI reporting chat feature

import { getServerClient } from '@/lib/supabase/server';

// ============================================
// Schema Context for Claude
// ============================================

/**
 * Minimal schema context for Claude's system prompt.
 * This helps Claude understand what data is available and how to query it.
 */
export const SCHEMA_CONTEXT = `
Available tables:
1. program_dashboard_summary - Programs with enrollment and readiness
   Columns: id, instance_name, program_name, city, state, start_date, end_date,
            current_enrolled, min_capacity, max_capacity, readiness_score, status,
            format (in-person/virtual/on-demand), days_until_start, venue_name

2. registration_dashboard_summary - Individual registrations with payment
   Columns: id, full_name, email, company_name, registration_date, payment_status,
            final_price, program_instance_id, program_name, city, attendance_type

Common query patterns:
- Filter by city: eq('city', 'Austin')
- Filter by program name containing: ilike('program_name', '%ERL%')
- Filter by year: gte('start_date', '2025-01-01').lt('start_date', '2026-01-01')
- Get archived: lt('days_until_start', 0)
- Get upcoming: gte('days_until_start', 0)
`;

// ============================================
// Types
// ============================================

export interface QueryResult {
  data: Record<string, unknown>[];
  format: 'table' | 'chart' | 'text';
  chartConfig?: {
    type: 'bar';
    xKey: string;
    yKey: string;
    title?: string;
  };
}

export interface QueryParams {
  table: 'program_dashboard_summary' | 'registration_dashboard_summary';
  select?: string[];
  filters?: Record<string, unknown>;
  groupBy?: string[];
  aggregate?: {
    field: string;
    operation: 'count' | 'sum' | 'avg';
  };
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  limit?: number;
}

// ============================================
// Query Execution
// ============================================

/**
 * Execute a structured query against Supabase.
 * Takes query parameters and builds a safe query using Supabase client methods.
 * No raw SQL is used - all queries are constructed via the client API.
 */
export async function executeQuery(params: QueryParams): Promise<QueryResult> {
  const supabase = getServerClient();
  const { table, select, filters, orderBy, limit } = params;

  try {
    // Build the select clause
    const selectClause = select && select.length > 0 ? select.join(', ') : '*';

    // Start building the query
    let query = supabase.from(table).select(selectClause);

    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === undefined) continue;

        // Handle different filter types
        if (typeof value === 'object' && value !== null) {
          const filterObj = value as Record<string, unknown>;

          if ('eq' in filterObj) {
            query = query.eq(key, filterObj.eq);
          } else if ('neq' in filterObj) {
            query = query.neq(key, filterObj.neq);
          } else if ('gt' in filterObj) {
            query = query.gt(key, filterObj.gt);
          } else if ('gte' in filterObj) {
            query = query.gte(key, filterObj.gte);
          } else if ('lt' in filterObj) {
            query = query.lt(key, filterObj.lt);
          } else if ('lte' in filterObj) {
            query = query.lte(key, filterObj.lte);
          } else if ('like' in filterObj) {
            query = query.like(key, filterObj.like as string);
          } else if ('ilike' in filterObj) {
            query = query.ilike(key, filterObj.ilike as string);
          } else if ('in' in filterObj) {
            query = query.in(key, filterObj.in as unknown[]);
          } else if ('is' in filterObj) {
            query = query.is(key, filterObj.is as null);
          }
        } else {
          // Simple equality filter
          query = query.eq(key, value);
        }
      }
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    // Apply limit
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Query execution error:', error);
      return {
        data: [],
        format: 'text',
      };
    }

    // Determine format based on query type
    const format = formatQueryResult(params, data || []);

    return {
      data: (data || []) as Record<string, unknown>[],
      format: format.format,
      chartConfig: format.chartConfig,
    };
  } catch (err) {
    console.error('Query execution failed:', err);
    return {
      data: [],
      format: 'text',
    };
  }
}

// ============================================
// Format Detection
// ============================================

interface FormatResult {
  format: 'table' | 'chart' | 'text';
  chartConfig?: {
    type: 'bar';
    xKey: string;
    yKey: string;
    title?: string;
  };
}

/**
 * Determine the display format based on query structure and results.
 * - Comparison/aggregate queries -> chart format
 * - List queries -> table format
 * - Single value queries -> text format
 */
export function formatQueryResult(
  params: QueryParams,
  data: Record<string, unknown>[]
): FormatResult {
  // Empty results -> text
  if (!data || data.length === 0) {
    return { format: 'text' };
  }

  // Single value -> text
  if (data.length === 1 && Object.keys(data[0]).length <= 2) {
    return { format: 'text' };
  }

  // Aggregation with groupBy -> chart
  if (params.aggregate && params.groupBy && params.groupBy.length > 0) {
    const xKey = params.groupBy[0];
    const yKey = params.aggregate.field === '*' ? 'count' : params.aggregate.field;

    return {
      format: 'chart',
      chartConfig: {
        type: 'bar',
        xKey,
        yKey,
        title: `${params.aggregate.operation} of ${params.aggregate.field} by ${xKey}`,
      },
    };
  }

  // Small dataset with numeric columns -> potentially chart
  if (data.length <= 10 && data.length > 1) {
    const keys = Object.keys(data[0]);
    const hasNumericValue = keys.some((k) => typeof data[0][k] === 'number');
    const hasLabelColumn = keys.some(
      (k) =>
        typeof data[0][k] === 'string' &&
        (k.includes('name') || k.includes('city') || k.includes('program'))
    );

    if (hasNumericValue && hasLabelColumn) {
      // Find the label and value columns
      const labelKey =
        keys.find(
          (k) =>
            typeof data[0][k] === 'string' &&
            (k.includes('name') || k.includes('city') || k.includes('program'))
        ) || keys[0];
      const valueKey =
        keys.find((k) => typeof data[0][k] === 'number') || keys[1];

      return {
        format: 'chart',
        chartConfig: {
          type: 'bar',
          xKey: labelKey,
          yKey: valueKey,
        },
      };
    }
  }

  // Default to table for list results
  return { format: 'table' };
}

// ============================================
// Query Intent Detection (for natural language)
// ============================================

export type QueryIntent = 'count' | 'list' | 'compare' | 'aggregate' | 'detail';

/**
 * Detect query intent from natural language.
 * Used to help determine response format before query execution.
 */
export function detectQueryIntent(message: string): QueryIntent {
  const lower = message.toLowerCase();

  // Count queries
  if (
    lower.includes('how many') ||
    lower.includes('count') ||
    lower.includes('total number')
  ) {
    return 'count';
  }

  // Comparison queries
  if (
    lower.includes('compare') ||
    lower.includes('vs') ||
    lower.includes('versus') ||
    lower.includes('difference between')
  ) {
    return 'compare';
  }

  // Aggregation queries
  if (
    lower.includes('average') ||
    lower.includes('sum') ||
    lower.includes('by city') ||
    lower.includes('by program') ||
    lower.includes('per ')
  ) {
    return 'aggregate';
  }

  // List queries
  if (
    lower.includes('list') ||
    lower.includes('show me') ||
    lower.includes('which') ||
    lower.includes('who')
  ) {
    return 'list';
  }

  // Detail queries
  if (
    lower.includes('details') ||
    lower.includes('about') ||
    lower.includes('information on')
  ) {
    return 'detail';
  }

  // Default to list
  return 'list';
}
