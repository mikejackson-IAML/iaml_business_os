'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { cn } from '@/dashboard-kit/lib/utils';
import type { CapacityMetrics } from '@/dashboard-kit/types/departments/lead-intelligence';

interface CapacityGaugeProps {
  capacity: CapacityMetrics;
  className?: string;
}

export function CapacityGauge({ capacity, className }: CapacityGaugeProps) {
  const utilizationPercent = capacity.utilizationPercent;
  const status = utilizationPercent < 85 ? 'healthy' : utilizationPercent < 95 ? 'warning' : 'critical';

  const strokeColor = status === 'healthy'
    ? 'text-emerald-500'
    : status === 'warning'
      ? 'text-amber-500'
      : 'text-red-500';

  // SVG arc calculation
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(utilizationPercent / 100) * circumference} ${circumference}`;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sending Capacity</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Circular gauge */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <svg className="h-32 w-32 transform -rotate-90" viewBox="0 0 128 128">
              <circle
                className="text-muted stroke-current"
                strokeWidth="8"
                fill="transparent"
                r={radius}
                cx="64"
                cy="64"
              />
              <circle
                className={cn('stroke-current transition-all duration-500', strokeColor)}
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="64"
                cy="64"
                strokeDasharray={strokeDasharray}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{utilizationPercent.toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground">utilized</span>
            </div>
          </div>
        </div>

        {/* Capacity breakdown */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold">{capacity.totalDailyCapacity.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Capacity</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{capacity.usedCapacity.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Used Today</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-emerald-600">{capacity.availableCapacity.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
        </div>

        {/* Domain counts */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Active Domains</span>
            <span className="font-medium">{capacity.activeDomains}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Warming Domains</span>
            <span className="font-medium text-orange-600">{capacity.warmingDomains}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Resting Domains</span>
            <span className="font-medium text-blue-600">{capacity.restingDomains}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
