'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  Mail,
  Flame,
  Pause,
  WifiOff,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  AlertTriangle,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';
import type { EmailInbox, DomainHealth } from '@/dashboard-kit/types/departments/lead-intelligence';

interface InboxPerformanceTableProps {
  inboxes: EmailInbox[];
  domains: DomainHealth[];
  className?: string;
}

type SortField = 'healthScore' | 'replyRate' | 'bounceRate' | 'sentToday' | 'inboxEmail';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'warming' | 'paused' | 'disconnected' | 'issues';

const statusConfig = {
  active: { icon: Mail, label: 'Active', variant: 'default' as const, iconClass: 'text-emerald-500' },
  warming: { icon: Flame, label: 'Warming', variant: 'secondary' as const, iconClass: 'text-orange-500' },
  paused: { icon: Pause, label: 'Paused', variant: 'outline' as const, iconClass: 'text-yellow-500' },
  disconnected: { icon: WifiOff, label: 'Disconnected', variant: 'destructive' as const, iconClass: 'text-red-500' },
};

export function InboxPerformanceTable({ inboxes, domains, className }: InboxPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('healthScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [expandedInbox, setExpandedInbox] = useState<string | null>(null);

  // Filter and sort inboxes
  const filteredInboxes = useMemo(() => {
    let result = [...inboxes];

    // Apply status filter
    if (filterStatus === 'issues') {
      result = result.filter((inbox) =>
        !inbox.isConnected || inbox.healthScore < 70 || inbox.bounceRate > 5
      );
    } else if (filterStatus !== 'all') {
      result = result.filter((inbox) => inbox.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'healthScore':
          comparison = a.healthScore - b.healthScore;
          break;
        case 'replyRate':
          comparison = a.replyRate - b.replyRate;
          break;
        case 'bounceRate':
          comparison = a.bounceRate - b.bounceRate;
          break;
        case 'sentToday':
          comparison = a.sentToday - b.sentToday;
          break;
        case 'inboxEmail':
          comparison = a.inboxEmail.localeCompare(b.inboxEmail);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [inboxes, filterStatus, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleExpand = (inboxId: string) => {
    setExpandedInbox(expandedInbox === inboxId ? null : inboxId);
  };

  // Count underperforming inboxes
  const underperformingCount = inboxes.filter(
    (i) => i.healthScore < 70 || !i.isConnected || i.bounceRate > 5
  ).length;

  // Count by status
  const statusCounts = {
    all: inboxes.length,
    active: inboxes.filter((i) => i.status === 'active').length,
    warming: inboxes.filter((i) => i.status === 'warming').length,
    paused: inboxes.filter((i) => i.status === 'paused').length,
    disconnected: inboxes.filter((i) => i.status === 'disconnected').length,
    issues: underperformingCount,
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Inbox Performance</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {inboxes.length} total inboxes
              {underperformingCount > 0 && (
                <span className="text-amber-600 ml-2">
                  ({underperformingCount} need attention)
                </span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter buttons */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1 mr-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filter:</span>
          </div>
          {(['all', 'active', 'warming', 'paused', 'disconnected', 'issues'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All' : status === 'issues' ? 'Issues' : status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-1 text-muted-foreground">({statusCounts[status]})</span>
              )}
            </Button>
          ))}
          {filterStatus !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterStatus('all')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Sort buttons */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1 mr-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
          </div>
          <Button
            variant={sortField === 'healthScore' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleSort('healthScore')}
          >
            Health {sortField === 'healthScore' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={sortField === 'replyRate' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleSort('replyRate')}
          >
            Reply Rate {sortField === 'replyRate' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={sortField === 'bounceRate' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleSort('bounceRate')}
          >
            Bounce Rate {sortField === 'bounceRate' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={sortField === 'sentToday' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleSort('sentToday')}
          >
            Sent Today {sortField === 'sentToday' && (sortDirection === 'asc' ? '↑' : '↓')}
          </Button>
        </div>

        {/* Inbox list */}
        <div className="space-y-2">
          {filteredInboxes.map((inbox) => {
            const config = statusConfig[inbox.status];
            const Icon = config.icon;
            const isExpanded = expandedInbox === inbox.id;
            const usagePercent =
              inbox.dailyLimit > 0 ? (inbox.sentToday / inbox.dailyLimit) * 100 : 0;
            const hasIssues =
              !inbox.isConnected || inbox.healthScore < 70 || inbox.bounceRate > 5;

            return (
              <div key={inbox.id}>
                <div
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                    !inbox.isConnected
                      ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                      : inbox.healthScore < 70
                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                        : 'border-border'
                  )}
                  onClick={() => toggleExpand(inbox.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn('p-2 rounded', 'bg-muted')}>
                      <Icon className={cn('h-4 w-4', config.iconClass)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{inbox.inboxEmail}</p>
                        {hasIssues && (
                          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="text-muted-foreground/70">{inbox.domainName}</span>
                        <span>Health: {inbox.healthScore}</span>
                        <span>Reply: {inbox.replyRate.toFixed(1)}%</span>
                        {inbox.bounceRate > 2 && (
                          <span className="text-amber-600">
                            Bounce: {inbox.bounceRate.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 hidden md:block">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Sent</span>
                        <span>
                          {inbox.sentToday} / {inbox.dailyLimit}
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-1" />
                    </div>
                    <Badge variant={config.variant} className="w-24 justify-center">
                      {config.label}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-1 ml-12 p-3 bg-muted/30 rounded-lg text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-muted-foreground text-xs">Health Score</p>
                        <p
                          className={cn(
                            'font-medium',
                            inbox.healthScore >= 85
                              ? 'text-emerald-600'
                              : inbox.healthScore >= 70
                                ? 'text-amber-600'
                                : 'text-red-600'
                          )}
                        >
                          {inbox.healthScore}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Open Rate</p>
                        <p className="font-medium">{inbox.openRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Reply Rate</p>
                        <p className="font-medium">{inbox.replyRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Bounce Rate</p>
                        <p
                          className={cn(
                            'font-medium',
                            inbox.bounceRate > 5
                              ? 'text-red-600'
                              : inbox.bounceRate > 2
                                ? 'text-amber-600'
                                : ''
                          )}
                        >
                          {inbox.bounceRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Spam Rate</p>
                        <p
                          className={cn('font-medium', inbox.spamRate > 1 ? 'text-red-600' : '')}
                        >
                          {inbox.spamRate.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Sent This Week</p>
                        <p className="font-medium">{inbox.sentThisWeek.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Daily Limit</p>
                        <p className="font-medium">{inbox.dailyLimit}</p>
                      </div>
                      {inbox.warmupEnabled && (
                        <div>
                          <p className="text-muted-foreground text-xs">Warmup Day</p>
                          <p className="font-medium">{inbox.warmupDay || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                    {inbox.lastError && (
                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/30 rounded text-red-700 dark:text-red-400 text-xs">
                        <strong>Last Error:</strong> {inbox.lastError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredInboxes.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {inboxes.length === 0
                ? 'No inboxes configured'
                : 'No inboxes match the current filters'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
