import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return formatDateShort(d);
}

export function getHealthColor(status: 'healthy' | 'warning' | 'critical'): string {
  const colors = {
    healthy: 'text-emerald-500',
    warning: 'text-amber-500',
    critical: 'text-red-500',
  };
  return colors[status];
}

export function getHealthBgColor(status: 'healthy' | 'warning' | 'critical'): string {
  const colors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };
  return colors[status];
}

export function calculateHealthStatus({
  value,
  target,
  warningThreshold = 0.8,
  criticalThreshold = 0.6,
  higherIsBetter = true,
}: {
  value: number;
  target: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  higherIsBetter?: boolean;
}): 'healthy' | 'warning' | 'critical' {
  const ratio = higherIsBetter ? value / target : target / value;

  if (ratio >= warningThreshold) {
    return 'healthy';
  }
  if (ratio >= criticalThreshold) {
    return 'warning';
  }
  return 'critical';
}
