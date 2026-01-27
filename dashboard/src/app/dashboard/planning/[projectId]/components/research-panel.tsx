'use client';

import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { PlanningResearch, ResearchType, ResearchStatus } from '@/dashboard-kit/types/departments/planning';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

const RESEARCH_TYPE_LABELS: Record<ResearchType, string> = {
  icp_deep_dive: 'ICP Deep Dive',
  competitive_analysis: 'Competitive Analysis',
  market_research: 'Market Research',
  user_workflows: 'User Workflows',
  technical_feasibility: 'Technical Feasibility',
  custom: 'Custom',
};

const STATUS_STYLES: Record<ResearchStatus, { className: string; label: string }> = {
  pending: { className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', label: 'Pending' },
  running: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse', label: 'Running' },
  complete: { className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Complete' },
  failed: { className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Failed' },
};

interface ResearchPanelProps {
  research: PlanningResearch[];
}

export function ResearchPanel({ research }: ResearchPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Research
        </CardTitle>
      </CardHeader>
      <CardContent>
        {research.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No research yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Research runs will appear here when triggered during conversations
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {research.map((item) => {
              const statusStyle = STATUS_STYLES[item.status];
              return (
                <div
                  key={item.id}
                  className="p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm truncate">
                    {item.query.length > 80
                      ? `${item.query.slice(0, 80)}...`
                      : item.query}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {RESEARCH_TYPE_LABELS[item.research_type] || item.research_type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(item.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
