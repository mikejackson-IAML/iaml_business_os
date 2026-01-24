'use client';

import { cn } from '@/dashboard-kit/lib/utils';

export type DeviceType = 'mobile' | 'desktop';

interface DeviceToggleProps {
  deviceType: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  className?: string;
}

const devices = [
  { label: 'Mobile', value: 'mobile' as const },
  { label: 'Desktop', value: 'desktop' as const },
];

export function DeviceToggle({ deviceType, onDeviceChange, className }: DeviceToggleProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
      {devices.map((d) => (
        <button
          key={d.value}
          onClick={() => onDeviceChange(d.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            deviceType === d.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
