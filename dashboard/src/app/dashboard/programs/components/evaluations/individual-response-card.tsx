'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EvaluationResponse, EvaluationTemplate } from '@/lib/api/programs-queries';

interface IndividualResponseCardProps {
  response: EvaluationResponse;
  template: EvaluationTemplate;
  isVirtual?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 4) return 'text-emerald-600';
  if (score >= 3) return 'text-amber-600';
  return 'text-red-600';
}

export function IndividualResponseCard({
  response,
  template,
  isVirtual = false,
}: IndividualResponseCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Get overall score for preview
  const overallScore = response.ratings?.overall;

  // Filter categories for virtual
  const displayCategories = template.rating_categories.filter(
    (cat) => !(isVirtual && cat.virtual_skip)
  );

  // Format date
  const submittedDate = new Date(response.submitted_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium">{response.attendee_name || 'Anonymous'}</span>
          <span className="text-xs text-muted-foreground">{submittedDate}</span>
        </div>
        <div className="flex items-center gap-3">
          {overallScore !== undefined && (
            <span className={cn('font-medium', getScoreColor(overallScore))}>
              {overallScore}/5
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="p-4 pt-0 border-t space-y-4">
          {/* Ratings grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {displayCategories.map((category) => {
              const score = response.ratings?.[category.key];
              return (
                <div key={category.key} className="text-center p-2 rounded bg-muted/30">
                  <span className={cn('text-xl font-bold', score ? getScoreColor(score) : 'text-muted-foreground')}>
                    {score ?? '-'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{category.label}</p>
                </div>
              );
            })}
          </div>

          {/* Free text responses */}
          {template.free_text_questions.map((question) => {
            const answer = response.free_text_responses?.[question.key];
            if (!answer) return null;
            return (
              <div key={question.key} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {question.question}
                </p>
                <p className="text-sm bg-muted/30 p-3 rounded-lg">
                  {answer}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
