'use client';

import { cn } from '@/dashboard-kit/lib/utils';

interface WorkflowProgressProps {
  completed: number;
  total: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

/**
 * WorkflowProgress - Circular progress ring showing workflow completion
 *
 * Displays a circular progress indicator with percentage and text display.
 * Used in workflow headers and cards.
 */
export function WorkflowProgress({
  completed,
  total,
  className,
  size = 'md',
  showText = true,
}: WorkflowProgressProps) {
  // Calculate percentage
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Size configurations
  const sizeConfig = {
    sm: { ring: 36, stroke: 4, fontSize: 'text-xs', textSize: 'text-sm' },
    md: { ring: 48, stroke: 5, fontSize: 'text-sm', textSize: 'text-base' },
    lg: { ring: 64, stroke: 6, fontSize: 'text-base', textSize: 'text-lg' },
  };

  const config = sizeConfig[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on completion
  const getProgressColor = () => {
    if (percentage === 100) return 'text-emerald-500';
    if (percentage >= 75) return 'text-emerald-400';
    if (percentage >= 50) return 'text-amber-400';
    if (percentage >= 25) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Circular progress ring */}
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        <svg
          className="transform -rotate-90"
          width={config.ring}
          height={config.ring}
        >
          {/* Background circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-300', getProgressColor())}
          />
        </svg>
        {/* Percentage text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-semibold', config.fontSize)}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Text display */}
      {showText && (
        <div className={cn('text-muted-foreground', config.textSize)}>
          <span className="font-medium text-foreground">{completed}</span>
          {' of '}
          <span className="font-medium text-foreground">{total}</span>
          {' complete'}
        </div>
      )}
    </div>
  );
}
