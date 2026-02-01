'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type {
  EvaluationResponse,
  EvaluationAggregate,
  EvaluationTemplate,
} from '@/lib/api/programs-queries';
import { AggregateScores } from './aggregate-scores';
import { IndividualResponseCard } from './individual-response-card';
import { OverallThoughtsExcerpt } from './overall-thoughts-excerpt';

interface EvaluationsSectionProps {
  programId: string;
  isVirtual?: boolean;
}

interface EvaluationsData {
  template: EvaluationTemplate | null;
  aggregates: EvaluationAggregate | null;
  responses: EvaluationResponse[];
  responseCount: number;
}

/**
 * Container for evaluation display
 * Per CONTEXT.md: Aggregate summary first, individual responses below (expandable)
 */
export function EvaluationsSection({
  programId,
  isVirtual = false,
}: EvaluationsSectionProps) {
  const [data, setData] = useState<EvaluationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvaluations() {
      try {
        const res = await fetch(`/api/programs/${programId}/evaluations`);
        const json = await res.json();

        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Failed to load evaluations');
        }
      } catch {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    }

    fetchEvaluations();
  }, [programId]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  // No template loaded
  if (!data?.template) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Evaluation template not configured.</p>
      </div>
    );
  }

  // Empty state - no responses yet
  // Per CONTEXT.md: Clear message when no evaluations
  if (data.responseCount === 0 || !data.aggregates) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No Evaluations Yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Evaluation responses will appear here after the program completes
          and attendees submit their feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Aggregate scores section */}
      <AggregateScores
        aggregates={data.aggregates}
        template={data.template}
        isVirtual={isVirtual}
      />

      {/* Overall thoughts excerpts */}
      <div className="space-y-4">
        <OverallThoughtsExcerpt
          responses={data.responses}
          questionKey="liked_most"
          questionLabel="What attendees liked most"
        />
        <OverallThoughtsExcerpt
          responses={data.responses}
          questionKey="improvements"
          questionLabel="Suggestions for improvement"
        />
      </div>

      {/* Individual responses section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Individual Responses ({data.responses.length})
        </h3>
        <div className="space-y-3">
          {data.responses.map((response) => (
            <IndividualResponseCard
              key={response.id}
              response={response}
              template={data.template!}
              isVirtual={isVirtual}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
