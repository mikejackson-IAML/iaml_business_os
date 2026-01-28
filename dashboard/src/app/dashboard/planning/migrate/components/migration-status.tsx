'use client';

import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { MigrationResult } from '../actions';

interface MigrationStatusProps {
  results: MigrationResult[];
  isRunning: boolean;
  totalCount: number;
}

export function MigrationStatus({
  results,
  isRunning,
  totalCount,
}: MigrationStatusProps) {
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;
  const completedCount = results.length;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      {isRunning ? (
        <div className="text-center py-8">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-lg font-medium">
            Migrating {completedCount} of {totalCount}...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while projects are being migrated
          </p>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <h3 className="text-xl font-medium">Migration Complete</h3>
          </div>
          <p className="text-muted-foreground">
            {successCount} of {totalCount} projects migrated successfully
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Results list */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={result.oldProjectId}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                result.success
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Project {index + 1}
                </p>
                {result.success ? (
                  <p className="text-xs text-muted-foreground">
                    Migrated successfully
                  </p>
                ) : (
                  <p className="text-xs text-red-400">{result.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {!isRunning && results.length > 0 && (
        <div className="flex items-center justify-center gap-6 py-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">{successCount}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>
          {failureCount > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{failureCount}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!isRunning && successCount > 0 && (
        <div className="flex justify-center pt-4">
          <Button asChild>
            <Link href="/dashboard/planning">
              View in Planning Studio
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
