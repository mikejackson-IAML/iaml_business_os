'use client';

import { Sparkles, AlertCircle } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/dashboard-kit/components/ui/tooltip';

interface ConfidenceBadgeProps {
  confidence: number | null;  // 0.00 - 1.00
  reasoning?: string | null;
  showLabel?: boolean;  // "AI 85%" vs just "85%"
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({
  confidence,
  reasoning,
  showLabel = true,
  size = 'sm'
}: ConfidenceBadgeProps) {
  if (confidence === null || confidence === undefined) {
    return null;  // Not an AI suggestion
  }

  const percentage = Math.round(confidence * 100);

  // Color coding based on confidence level
  let bgColor: string;

  if (percentage >= 80) {
    bgColor = 'bg-emerald-500/10 text-emerald-600';  // High confidence - green
  } else if (percentage >= 60) {
    bgColor = 'bg-amber-500/10 text-amber-600';  // Medium confidence - amber
  } else {
    bgColor = 'bg-slate-500/10 text-slate-600';  // Lower confidence - neutral
  }

  const label = showLabel ? `AI ${percentage}%` : `${percentage}%`;

  // If has reasoning (low confidence), show tooltip
  if (reasoning && percentage < 80) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${bgColor} gap-1 cursor-help`}>
              <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
              {label}
              <AlertCircle className="h-3 w-3 ml-1" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm"><strong>Why AI suggests this:</strong></p>
            <p className="text-sm text-muted-foreground">{reasoning}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge className={`${bgColor} gap-1`}>
      <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {label}
    </Badge>
  );
}
