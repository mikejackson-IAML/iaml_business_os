'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { AlertTypeFilter, type AlertTypeFilterValue } from './alert-type-filter';
import { AlertCard } from './alert-card';
import { acknowledgeAllAlertsAction } from '../actions';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  alertType: string;
  createdAt: Date;
}

interface AlertsSectionProps {
  alerts: Alert[];
  currentFilter: AlertTypeFilterValue;
  className?: string;
}

// Map alert_type values to filter categories
function getFilterCategory(alertType: string): 'traffic' | 'ranking' | 'technical' {
  const trafficTypes = ['traffic_anomaly', 'traffic_drop', 'traffic_spike'];
  const rankingTypes = ['ranking_change', 'ranking_drop', 'ranking_gain'];

  if (trafficTypes.includes(alertType)) return 'traffic';
  if (rankingTypes.includes(alertType)) return 'ranking';
  return 'technical';
}

export function AlertsSection({ alerts, currentFilter, className }: AlertsSectionProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Filter out dismissed alerts (client-side optimistic update)
  const activeAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  // Calculate counts for filter chips
  const counts = {
    all: activeAlerts.length,
    traffic: activeAlerts.filter((a) => getFilterCategory(a.alertType) === 'traffic').length,
    ranking: activeAlerts.filter((a) => getFilterCategory(a.alertType) === 'ranking').length,
    technical: activeAlerts.filter((a) => getFilterCategory(a.alertType) === 'technical').length,
  };

  // Apply filter
  const filteredAlerts =
    currentFilter === 'all'
      ? activeAlerts
      : activeAlerts.filter((a) => getFilterCategory(a.alertType) === currentFilter);

  // Sort by severity: critical > warning > info
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleDismissAll = () => {
    const ids = sortedAlerts.map((a) => a.id);
    if (ids.length === 0) return;

    startTransition(async () => {
      const result = await acknowledgeAllAlertsAction(ids);
      if (result.success) {
        setDismissedIds((prev) => new Set([...prev, ...ids]));
      } else {
        console.error('Failed to dismiss all alerts:', result.error);
      }
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Alerts</CardTitle>
        {sortedAlerts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismissAll}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dismissing...
              </>
            ) : (
              `Dismiss All (${sortedAlerts.length})`
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Chips */}
        <AlertTypeFilter currentType={currentFilter} counts={counts} />

        {/* Alert List */}
        {sortedAlerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No alerts</p>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                id={alert.id}
                title={alert.title}
                message={alert.message}
                severity={alert.severity}
                createdAt={alert.createdAt}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
