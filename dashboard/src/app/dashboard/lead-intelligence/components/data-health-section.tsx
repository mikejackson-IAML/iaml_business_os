'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, AlertTriangle, Mail, Phone, Briefcase, Clock } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';

interface DataHealthProps {
  dataHealth: {
    email_valid_pct: number;
    email_invalid_count: number;
    stale_count: number;
    missing_email_count: number;
    missing_phone_count: number;
    missing_title_count: number;
    last_calculated: string;
  };
}

interface HealthMetric {
  label: string;
  value: string;
  severity: 'healthy' | 'warning' | 'critical';
  icon: React.ElementType;
  filterParams: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function severity(count: number, threshold: number): 'healthy' | 'warning' | 'critical' {
  if (count === 0) return 'healthy';
  if (count < threshold) return 'warning';
  return 'critical';
}

const severityColors = {
  healthy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function DataHealthSection({ dataHealth }: DataHealthProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const staleDate = sixMonthsAgo.toISOString().split('T')[0];

  const metrics: HealthMetric[] = [
    {
      label: 'Email Valid Rate',
      value: `${dataHealth.email_valid_pct}%`,
      severity: dataHealth.email_valid_pct > 80 ? 'healthy' : dataHealth.email_valid_pct >= 50 ? 'warning' : 'critical',
      icon: Mail,
      filterParams: '?email_status=valid',
    },
    {
      label: 'Invalid Emails',
      value: String(dataHealth.email_invalid_count),
      severity: severity(dataHealth.email_invalid_count, 10),
      icon: AlertTriangle,
      filterParams: '?email_status=invalid',
    },
    {
      label: 'Stale Contacts',
      value: String(dataHealth.stale_count),
      severity: severity(dataHealth.stale_count, 20),
      icon: Clock,
      filterParams: `?created_before=${staleDate}`,
    },
    {
      label: 'Missing Email',
      value: String(dataHealth.missing_email_count),
      severity: severity(dataHealth.missing_email_count, 10),
      icon: Mail,
      filterParams: '?email_status=missing',
    },
    {
      label: 'Missing Phone',
      value: String(dataHealth.missing_phone_count),
      severity: severity(dataHealth.missing_phone_count, 20),
      icon: Phone,
      filterParams: '?phone=_missing_',
    },
    {
      label: 'Missing Title',
      value: String(dataHealth.missing_title_count),
      severity: severity(dataHealth.missing_title_count, 15),
      icon: Briefcase,
      filterParams: '?title=_missing_',
    },
  ];

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <span>Data Health</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <button
                  key={metric.label}
                  onClick={() =>
                    router.push(`/dashboard/lead-intelligence${metric.filterParams}`)
                  }
                  className="flex items-center gap-3 rounded-md border p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {metric.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-medium">{metric.value}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0 border-0', severityColors[metric.severity])}
                      >
                        {metric.severity}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Last calculated: {formatDate(dataHealth.last_calculated)}
          </p>
        </div>
      )}
    </div>
  );
}
