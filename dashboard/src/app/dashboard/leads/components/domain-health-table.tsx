'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { Globe, Snowflake, Flame, Ban } from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';
import type { DomainHealth } from '@/dashboard-kit/types/departments/lead-intelligence';

interface DomainHealthTableProps {
  domains: DomainHealth[];
  className?: string;
}

const statusConfig = {
  active: { icon: Globe, label: 'Active', variant: 'default' as const, iconClass: 'text-emerald-500' },
  warming: { icon: Flame, label: 'Warming', variant: 'secondary' as const, iconClass: 'text-orange-500' },
  resting: { icon: Snowflake, label: 'Resting', variant: 'outline' as const, iconClass: 'text-blue-500' },
  blacklisted: { icon: Ban, label: 'Blacklisted', variant: 'destructive' as const, iconClass: 'text-red-500' },
};

export function DomainHealthTable({ domains, className }: DomainHealthTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Domain Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {domains.map((domain) => {
            const config = statusConfig[domain.status];
            const Icon = config.icon;
            const usagePercent = domain.dailyLimit > 0
              ? (domain.sentToday / domain.dailyLimit) * 100
              : 0;

            return (
              <div
                key={domain.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  domain.status === 'blacklisted'
                    ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                    : domain.healthScore < 70
                      ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                      : 'border-border'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('p-2 rounded', 'bg-muted')}>
                    <Icon className={cn('h-4 w-4', config.iconClass)} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{domain.domain}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Health: {domain.healthScore}</span>
                      {domain.warmingDay && (
                        <span>Day {domain.warmingDay}</span>
                      )}
                      {domain.bounceRate > 2 && (
                        <span className="text-amber-600">
                          {domain.bounceRate.toFixed(1)}% bounce
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-32 hidden md:block">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Sent today</span>
                      <span>{domain.sentToday} / {domain.dailyLimit}</span>
                    </div>
                    <Progress value={usagePercent} className="h-1" />
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </div>
            );
          })}

          {domains.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No domains configured
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
