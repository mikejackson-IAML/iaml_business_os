'use client';

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import type { WorkflowRun, WorkflowHealth as WorkflowHealthType } from '@/lib/api/workflow-queries';

interface WorkflowHealthProps {
  recentErrors: WorkflowRun[];
  healthSummary: WorkflowHealthType[];
  stats: {
    totalWorkflows: number;
    totalErrorsToday: number;
    unresolvedErrors: number;
    overallSuccessRate: number;
  };
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function getHealthColor(rate: number | null): string {
  if (rate === null) return 'text-muted-foreground';
  if (rate >= 95) return 'text-emerald-600';
  if (rate >= 80) return 'text-amber-600';
  return 'text-red-600';
}

function getHealthBg(rate: number | null): string {
  if (rate === null) return 'bg-gray-100 dark:bg-gray-800';
  if (rate >= 95) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (rate >= 80) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

export function WorkflowHealthCard({ recentErrors, healthSummary, stats }: WorkflowHealthProps) {
  const hasErrors = stats.unresolvedErrors > 0 || stats.totalErrorsToday > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Workflow Health
            {hasErrors && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded dark:bg-red-900/30 dark:text-red-400">
                {stats.unresolvedErrors} unresolved
              </span>
            )}
          </CardTitle>
          <Link
            href="/dashboard/digital/workflows"
            className="text-sm text-accent-primary hover:underline flex items-center gap-1"
          >
            View All
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold">{stats.totalWorkflows}</div>
            <div className="text-xs text-muted-foreground">Workflows</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-semibold ${getHealthColor(stats.overallSuccessRate)}`}>
              {stats.overallSuccessRate}%
            </div>
            <div className="text-xs text-muted-foreground">Success (7d)</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-semibold ${stats.totalErrorsToday > 0 ? 'text-red-600' : ''}`}>
              {stats.totalErrorsToday}
            </div>
            <div className="text-xs text-muted-foreground">Errors Today</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-semibold ${stats.unresolvedErrors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {stats.unresolvedErrors}
            </div>
            <div className="text-xs text-muted-foreground">Unresolved</div>
          </div>
        </div>

        {/* Recent Errors */}
        {recentErrors.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Recent Errors</div>
            <div className="space-y-2">
              {recentErrors.slice(0, 3).map((error) => (
                <div
                  key={error.id}
                  className={`p-3 rounded-lg ${error.resolved ? 'bg-gray-50 dark:bg-gray-800' : 'bg-red-50 dark:bg-red-900/20'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {error.resolved ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm truncate">{error.workflow_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimeAgo(error.started_at)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate pl-6">
                    {error.error_node && <span className="text-amber-600">[{error.error_node}]</span>}{' '}
                    {error.error_message?.slice(0, 100)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 pl-6">
                    {error.slack_notified && (
                      <span className="text-xs text-muted-foreground">Slack sent</span>
                    )}
                    {error.email_notified && (
                      <span className="text-xs text-muted-foreground">Email sent</span>
                    )}
                    {error.has_known_fix && (
                      <span className="text-xs text-emerald-600">Known fix available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Health Summary */}
        {healthSummary.length > 0 && (
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Workflow Status</div>
            <div className="space-y-2">
              {healthSummary.slice(0, 5).map((workflow) => (
                <div
                  key={workflow.workflow_id}
                  className={`flex items-center justify-between p-2 rounded ${getHealthBg(workflow.success_rate_7d)}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {workflow.unresolved_errors > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    ) : workflow.success_rate_7d && workflow.success_rate_7d >= 95 ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{workflow.workflow_name}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-xs text-muted-foreground">
                      {workflow.runs_last_7_days} runs
                    </div>
                    <div className={`text-sm font-medium ${getHealthColor(workflow.success_rate_7d)}`}>
                      {workflow.success_rate_7d !== null ? `${workflow.success_rate_7d}%` : '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{formatDuration(workflow.avg_duration_ms)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentErrors.length === 0 && healthSummary.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No workflow data yet</p>
            <p className="text-xs">Workflows will appear here after they run</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
