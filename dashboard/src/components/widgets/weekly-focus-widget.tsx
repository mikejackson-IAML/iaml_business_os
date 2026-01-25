'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight, Lightbulb, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import type { TaskExtended } from '@/lib/api/task-types';

interface WeeklyFocusWidgetProps {
  focusTask: TaskExtended | null;
  suggestionCount: number;
  isLoading?: boolean;
}

/**
 * Extract the focus summary from the Weekly Focus task description
 * Looks for "## This Week's Focus" section and extracts first 2-3 sentences
 */
function extractFocusSummary(description: string | null): string | null {
  if (!description) return null;

  // Look for the "This Week's Focus" section
  const focusMatch = description.match(/##\s*This Week's Focus\s*\n+([\s\S]*?)(?=\n##|$)/i);
  if (focusMatch && focusMatch[1]) {
    const content = focusMatch[1].trim();
    // Get first 2-3 sentences (up to ~200 chars)
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    const summary = sentences.slice(0, 3).join(' ').trim();
    // Truncate if too long
    if (summary.length > 200) {
      return summary.substring(0, 197) + '...';
    }
    return summary;
  }

  // Fallback: use first paragraph
  const firstParagraph = description.split('\n\n')[0];
  if (firstParagraph.length > 200) {
    return firstParagraph.substring(0, 197) + '...';
  }
  return firstParagraph;
}

/**
 * Format the week range from task title
 * e.g., "Weekly Focus Review: Jan 20-26" -> "Jan 20-26"
 */
function formatWeekRange(title: string): string | null {
  const match = title.match(/:\s*(.+)$/);
  return match ? match[1].trim() : null;
}

/**
 * Weekly Focus Dashboard Widget
 * Displays the current week's AI-generated focus summary with encouraging coach tone
 */
export function WeeklyFocusWidget({ focusTask, suggestionCount, isLoading }: WeeklyFocusWidgetProps) {
  if (isLoading) {
    return <WeeklyFocusWidgetSkeleton />;
  }

  const summary = focusTask ? extractFocusSummary(focusTask.description) : null;
  const weekRange = focusTask ? formatWeekRange(focusTask.title) : null;

  return (
    <Card className="overflow-hidden">
      {/* Subtle gradient background for encouraging feel */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--accent-primary)) 0%, transparent 60%)',
        }}
      />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: 'hsl(var(--accent-primary))' }} />
            Weekly Focus
          </CardTitle>
          {suggestionCount > 0 && (
            <Link
              href="/dashboard/action-center?source=ai"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'hsl(var(--accent-primary) / 0.15)',
                color: 'hsl(var(--accent-primary))',
              }}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {suggestionCount} AI suggestion{suggestionCount !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
        {weekRange && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Calendar className="h-3.5 w-3.5" />
            {weekRange}
          </div>
        )}
      </CardHeader>

      <CardContent className="relative">
        {focusTask ? (
          <div className="space-y-4">
            {/* Summary preview */}
            <p className="text-sm text-foreground/90 leading-relaxed">
              {summary || 'Review your weekly focus for actionable insights and priorities.'}
            </p>

            {/* View full analysis link */}
            <Link
              href={`/dashboard/action-center/${focusTask.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'hsl(var(--accent-primary))' }}
            >
              View full analysis
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              AI Focus analysis coming Sunday evening.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Your personalized weekly priorities and action items will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for the Weekly Focus widget
 */
export function WeeklyFocusWidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}
