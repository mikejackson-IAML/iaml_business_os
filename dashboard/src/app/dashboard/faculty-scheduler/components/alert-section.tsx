'use client';

import { useState, useRef, useCallback } from 'react';
import { AlertList } from '@/dashboard-kit/components/dashboard/alert-list';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Undo2 } from 'lucide-react';
import { dismissAlert } from '../actions';
import type { FacultySchedulerAlert } from '@/lib/api/faculty-scheduler-queries';
import type { AlertItem } from '@/dashboard-kit/types';

interface AlertSectionProps {
  alerts: FacultySchedulerAlert[];
}

interface PendingDismiss {
  alert: FacultySchedulerAlert;
  timeoutId: NodeJS.Timeout;
}

/**
 * Maps our FacultySchedulerAlert to dashboard-kit AlertItem format.
 */
function toAlertItem(alert: FacultySchedulerAlert): AlertItem {
  return {
    id: alert.id,
    title: alert.title,
    description: alert.description || undefined,
    severity: alert.severity === 'critical' ? 'critical' : 'warning',
    category: alert.alert_type === 'tier_ending' ? 'Tier Deadline' : 'VIP Response',
    timestamp: new Date(alert.triggered_at),
    dismissable: true,
  };
}

export function AlertSection({ alerts: initialAlerts }: AlertSectionProps) {
  // State for optimistic dismissal
  const [visibleAlerts, setVisibleAlerts] = useState<FacultySchedulerAlert[]>(initialAlerts);
  const [pendingDismiss, setPendingDismiss] = useState<PendingDismiss | null>(null);
  const pendingRef = useRef<PendingDismiss | null>(null);

  // Handle dismiss - optimistically remove and start undo timer
  const handleDismiss = useCallback((alertId: string) => {
    // Find the alert being dismissed
    const alertToDismiss = visibleAlerts.find((a) => a.id === alertId);
    if (!alertToDismiss) return;

    // Clear any existing pending dismiss
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timeoutId);
    }

    // Optimistically remove from UI
    setVisibleAlerts((prev) => prev.filter((a) => a.id !== alertId));

    // Set up 10-second timeout for permanent dismiss
    const timeoutId = setTimeout(async () => {
      // Actually dismiss on server
      await dismissAlert(alertId);
      setPendingDismiss(null);
      pendingRef.current = null;
    }, 10000);

    const newPending: PendingDismiss = {
      alert: alertToDismiss,
      timeoutId,
    };

    setPendingDismiss(newPending);
    pendingRef.current = newPending;
  }, [visibleAlerts]);

  // Handle undo - restore alert to list and cancel server dismiss
  const handleUndo = useCallback(() => {
    if (!pendingRef.current) return;

    const { alert, timeoutId } = pendingRef.current;

    // Clear the timeout to prevent server dismiss
    clearTimeout(timeoutId);

    // Restore the alert to the list (maintain sort order by severity then time)
    setVisibleAlerts((prev) => {
      const newList = [...prev, alert];
      // Sort: critical first, then by triggered_at descending
      return newList.sort((a, b) => {
        if (a.severity !== b.severity) {
          return a.severity === 'critical' ? -1 : 1;
        }
        return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
      });
    });

    setPendingDismiss(null);
    pendingRef.current = null;
  }, []);

  // Map alerts to dashboard-kit format
  const alertItems: AlertItem[] = visibleAlerts.map(toAlertItem);

  // Don't render if no alerts and no pending undo
  if (visibleAlerts.length === 0 && !pendingDismiss) {
    return null;
  }

  return (
    <div id="alerts-section" className="relative">
      {visibleAlerts.length > 0 && (
        <AlertList
          alerts={alertItems}
          title="Alerts"
          maxItems={10}
          showViewAll={false}
          onDismiss={handleDismiss}
        />
      )}

      {/* Undo Toast */}
      {pendingDismiss && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-background border border-border rounded-lg shadow-lg px-4 py-3">
          <span className="text-sm text-foreground">Alert dismissed</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="flex items-center gap-1 text-primary hover:text-primary"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}
