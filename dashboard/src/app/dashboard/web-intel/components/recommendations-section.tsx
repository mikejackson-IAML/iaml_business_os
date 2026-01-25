'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import {
  RecommendationPriorityFilter,
  type RecommendationPriorityFilterValue,
} from './recommendation-priority-filter';
import { RecommendationCard } from './recommendation-card';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  currentFilter: RecommendationPriorityFilterValue;
  className?: string;
}

export function RecommendationsSection({
  recommendations,
  currentFilter,
  className,
}: RecommendationsSectionProps) {
  // Track completed/snoozed IDs for optimistic updates
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  // Filter out completed/snoozed items
  const activeRecommendations = recommendations.filter((r) => !completedIds.has(r.id));

  // Calculate counts for filter chips (based on active recommendations)
  const counts = {
    all: activeRecommendations.length,
    high: activeRecommendations.filter((r) => r.priority === 'high').length,
    medium: activeRecommendations.filter((r) => r.priority === 'medium').length,
    low: activeRecommendations.filter((r) => r.priority === 'low').length,
  };

  // Apply priority filter
  const filteredRecommendations =
    currentFilter === 'all'
      ? activeRecommendations
      : activeRecommendations.filter((r) => r.priority === currentFilter);

  // Sort by priority (high > medium > low), then by createdAt desc
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const handleComplete = (id: string) => {
    setCompletedIds((prev) => new Set([...prev, id]));
  };

  const handleSnooze = (id: string) => {
    setCompletedIds((prev) => new Set([...prev, id]));
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>AI Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Chips */}
        <RecommendationPriorityFilter currentPriority={currentFilter} counts={counts} />

        {/* Recommendations Grid */}
        {sortedRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No pending recommendations right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                title={rec.title}
                description={rec.description}
                category={rec.category}
                priority={rec.priority}
                createdAt={rec.createdAt}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
