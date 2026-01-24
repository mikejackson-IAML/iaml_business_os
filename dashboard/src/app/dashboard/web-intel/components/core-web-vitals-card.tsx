'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { DeviceToggle, type DeviceType } from './device-toggle';
import { CwvMetric } from './cwv-metric';
import type { CoreWebVitals } from '@/lib/api/web-intel-queries';

interface CoreWebVitalsCardProps {
  coreWebVitals: CoreWebVitals[];
}

function getOverallStatusBadge(status: 'good' | 'needs_improvement' | 'poor' | null | undefined) {
  if (status === 'good') {
    return <Badge variant="healthy">Passing</Badge>;
  }
  if (status === 'needs_improvement' || status === 'poor') {
    return <Badge variant="warning">Needs Work</Badge>;
  }
  return <Badge variant="info">Unknown</Badge>;
}

export function CoreWebVitalsCard({ coreWebVitals }: CoreWebVitalsCardProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');

  const currentCwv = coreWebVitals.find((cwv) => cwv.deviceType === deviceType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Core Web Vitals</CardTitle>
          <div className="flex-1 flex justify-center">
            <DeviceToggle deviceType={deviceType} onDeviceChange={setDeviceType} />
          </div>
          {getOverallStatusBadge(currentCwv?.overallStatus)}
        </div>
      </CardHeader>
      <CardContent>
        {!currentCwv ? (
          <p className="text-muted-foreground text-center py-4">
            No data available for {deviceType}.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <CwvMetric label="LCP" value={currentCwv.lcpGoodPct} />
            <CwvMetric label="INP" value={currentCwv.fidGoodPct} />
            <CwvMetric label="CLS" value={currentCwv.clsGoodPct} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
