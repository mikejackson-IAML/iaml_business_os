'use client';

import { useState } from 'react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { MessageSquare } from 'lucide-react';
import type { EvaluationResponse } from '@/lib/api/programs-queries';

interface OverallThoughtsExcerptProps {
  responses: EvaluationResponse[];
  questionKey: string; // Which free-text question to show (e.g., 'liked_most')
  questionLabel: string;
  maxVisible?: number;
}

export function OverallThoughtsExcerpt({
  responses,
  questionKey,
  questionLabel,
  maxVisible = 3,
}: OverallThoughtsExcerptProps) {
  const [showAll, setShowAll] = useState(false);

  // Get responses that have this question answered
  const responsesWithAnswer = responses.filter(
    (r) => r.free_text_responses?.[questionKey]
  );

  if (responsesWithAnswer.length === 0) {
    return null;
  }

  const visibleResponses = showAll
    ? responsesWithAnswer
    : responsesWithAnswer.slice(0, maxVisible);

  const hasMore = responsesWithAnswer.length > maxVisible;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">{questionLabel}</h4>
        <span className="text-xs text-muted-foreground">
          ({responsesWithAnswer.length} responses)
        </span>
      </div>

      <div className="space-y-2">
        {visibleResponses.map((response) => (
          <div
            key={response.id}
            className="text-sm bg-muted/30 p-3 rounded-lg"
          >
            <p className="text-muted-foreground">
              &quot;{response.free_text_responses[questionKey]}&quot;
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              - {response.attendee_name || 'Anonymous'}
            </p>
          </div>
        ))}
      </div>

      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="text-xs"
        >
          Show {responsesWithAnswer.length - maxVisible} more...
        </Button>
      )}

      {showAll && hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="text-xs"
        >
          Show less
        </Button>
      )}
    </div>
  );
}
