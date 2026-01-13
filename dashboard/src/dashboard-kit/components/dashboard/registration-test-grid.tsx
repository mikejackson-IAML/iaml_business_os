'use client';

import { CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export interface RegistrationTestResult {
  programId: string;
  programName: string;
  format: 'in-person' | 'virtual';
  status: 'pass' | 'fail' | 'skipped' | 'pending';
  lastRunAt: Date | null;
  durationMs?: number;
  errorMessage?: string;
}

export interface RegistrationTestSummary {
  lastFullTestRun: Date | null;
  totalPaths: number;
  passingPaths: number;
  failingPaths: number;
  inPersonResults: RegistrationTestResult[];
  virtualResults: RegistrationTestResult[];
}

export interface IntegrationStatus {
  id: string;
  name: string;
  displayName: string;
  status: 'operational' | 'degraded' | 'down';
  lastChecked: Date;
  errorMessage?: string;
}

interface RegistrationTestGridProps {
  results: RegistrationTestSummary;
  integrations: IntegrationStatus[];
  onPathClick?: (result: RegistrationTestResult) => void;
}

function StatusIcon({ status }: { status: RegistrationTestResult['status'] }) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case 'fail':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'skipped':
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

function IntegrationIcon({ status }: { status: IntegrationStatus['status'] }) {
  switch (status) {
    case 'operational':
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case 'degraded':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'down':
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatLastRun(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

export function RegistrationTestGrid({
  results,
  integrations,
  onPathClick,
}: RegistrationTestGridProps) {
  const allPassing =
    results.failingPaths === 0 && results.passingPaths === results.totalPaths;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-heading-md">Registration Flows</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Last Full Test:</span>
            <span
              className={
                allPassing ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'
              }
            >
              {formatLastRun(results.lastFullTestRun)}
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          All {results.totalPaths} Paths:{' '}
          {allPassing ? (
            <span className="text-emerald-600 font-medium">Passing</span>
          ) : (
            <span className="text-red-600 font-medium">
              {results.failingPaths} Failing
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* In-Person Tests */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">
              In-Person ({results.inPersonResults.length}):
            </span>
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {results.inPersonResults.map((result) => (
                <Tooltip key={result.programId}>
                  <TooltipTrigger asChild>
                    <button
                      className={`
                        p-1.5 rounded-md transition-colors
                        ${
                          result.status === 'pass'
                            ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50'
                            : result.status === 'fail'
                            ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                            : 'bg-muted hover:bg-muted/80'
                        }
                      `}
                      onClick={() => onPathClick?.(result)}
                    >
                      <StatusIcon status={result.status} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="font-medium">{result.programName}</div>
                      <div className="text-xs text-muted-foreground">
                        In-Person • {result.status.toUpperCase()}
                      </div>
                      {result.durationMs && (
                        <div className="text-xs">
                          Duration: {formatDuration(result.durationMs)}
                        </div>
                      )}
                      {result.errorMessage && (
                        <div className="text-xs text-red-500">
                          {result.errorMessage}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Virtual Tests */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">
              Virtual ({results.virtualResults.length}):
            </span>
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {results.virtualResults.map((result) => (
                <Tooltip key={result.programId}>
                  <TooltipTrigger asChild>
                    <button
                      className={`
                        p-1.5 rounded-md transition-colors
                        ${
                          result.status === 'pass'
                            ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50'
                            : result.status === 'fail'
                            ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50'
                            : 'bg-muted hover:bg-muted/80'
                        }
                      `}
                      onClick={() => onPathClick?.(result)}
                    >
                      <StatusIcon status={result.status} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="font-medium">{result.programName}</div>
                      <div className="text-xs text-muted-foreground">
                        Virtual • {result.status.toUpperCase()}
                      </div>
                      {result.durationMs && (
                        <div className="text-xs">
                          Duration: {formatDuration(result.durationMs)}
                        </div>
                      )}
                      {result.errorMessage && (
                        <div className="text-xs text-red-500">
                          {result.errorMessage}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Integration Status */}
        <div className="pt-4 border-t border-border">
          <div className="flex flex-wrap gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center gap-2"
              >
                <IntegrationIcon status={integration.status} />
                <span className="text-sm font-medium">
                  {integration.displayName}
                </span>
                <span
                  className={`
                    text-xs
                    ${
                      integration.status === 'operational'
                        ? 'text-emerald-600'
                        : integration.status === 'degraded'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }
                  `}
                >
                  {integration.status === 'operational'
                    ? 'Operational'
                    : integration.status === 'degraded'
                    ? 'Degraded'
                    : 'Down'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
