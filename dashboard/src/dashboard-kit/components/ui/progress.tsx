'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full w-full flex-1 bg-primary transition-all',
        indicatorClassName,
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Progress with color based on value
interface ColoredProgressProps extends ProgressProps {
  thresholds?: {
    warning: number;
    critical: number;
  };
  invertColors?: boolean;
}

const ColoredProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ColoredProgressProps
>(({ className, value, thresholds = { warning: 70, critical: 90 }, invertColors = false, indicatorClassName, ...props }, ref) => {
  const safeValue = value ?? 0;
  let colorClass = 'bg-emerald-500';

  if (invertColors) {
    // Lower is better (e.g., error rate)
    if (safeValue >= thresholds.critical) {
      colorClass = 'bg-red-500';
    } else if (safeValue >= thresholds.warning) {
      colorClass = 'bg-amber-500';
    }
  } else {
    // Higher is better (e.g., completion rate)
    if (safeValue < 100 - thresholds.critical) {
      colorClass = 'bg-red-500';
    } else if (safeValue < 100 - thresholds.warning) {
      colorClass = 'bg-amber-500';
    }
  }

  return (
    <Progress
      ref={ref}
      className={className}
      value={value}
      indicatorClassName={cn(colorClass, indicatorClassName)}
      {...props}
    />
  );
});
ColoredProgress.displayName = 'ColoredProgress';

export { Progress, ColoredProgress };
