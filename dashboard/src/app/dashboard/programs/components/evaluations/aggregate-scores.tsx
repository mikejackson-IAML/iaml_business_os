'use client';

import { cn } from '@/lib/utils';
import type { EvaluationAggregate, EvaluationTemplate } from '@/lib/api/programs-queries';

interface AggregateScoresProps {
  aggregates: EvaluationAggregate;
  template: EvaluationTemplate;
  isVirtual?: boolean;
}

/**
 * Get color class based on score
 * Per CONTEXT.md: green for 4-5, yellow for 3, red for 1-2
 */
function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground bg-muted';
  if (score >= 4) return 'text-emerald-700 bg-emerald-100';
  if (score >= 3) return 'text-amber-700 bg-amber-100';
  return 'text-red-700 bg-red-100';
}

/**
 * Get rating label based on scale
 */
function getRatingLabel(score: number | null): string {
  if (score === null) return 'N/A';
  if (score >= 4.5) return 'Excellent';
  if (score >= 4) return 'Very Good';
  if (score >= 3) return 'Good';
  if (score >= 2) return 'Fair';
  return 'Poor';
}

export function AggregateScores({
  aggregates,
  template,
  isVirtual = false,
}: AggregateScoresProps) {
  // Map category keys to aggregate values
  const categoryScores: Record<string, number | null> = {
    instructor: aggregates.avg_instructor,
    content: aggregates.avg_content,
    venue: aggregates.avg_venue,
    overall: aggregates.avg_overall,
  };

  // Filter categories based on virtual (skip venue for virtual)
  const displayCategories = template.rating_categories.filter(
    (cat) => !(isVirtual && cat.virtual_skip)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Average Ratings</h3>
        <span className="text-sm text-muted-foreground">
          {aggregates.response_count} response{aggregates.response_count !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayCategories.map((category) => {
          const score = categoryScores[category.key];
          return (
            <div
              key={category.key}
              className="text-center p-4 rounded-lg border bg-card"
            >
              <div
                className={cn(
                  'text-3xl font-bold rounded-lg px-3 py-2 inline-block',
                  getScoreColor(score)
                )}
              >
                {score !== null ? score.toFixed(1) : '-'}
              </div>
              <p className="text-sm font-medium mt-2">{category.label}</p>
              <p className="text-xs text-muted-foreground">{getRatingLabel(score)}</p>
            </div>
          );
        })}
      </div>

      {/* Overall average */}
      {aggregates.avg_total !== null && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Overall Average:</span>
          <span
            className={cn(
              'text-lg font-bold rounded px-2 py-0.5',
              getScoreColor(aggregates.avg_total)
            )}
          >
            {aggregates.avg_total.toFixed(1)} / 5
          </span>
        </div>
      )}
    </div>
  );
}
