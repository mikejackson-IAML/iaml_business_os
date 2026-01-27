'use client';

import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard-kit/components/ui/tooltip';

interface ReadinessBadgeProps {
  result: { passed: boolean; reason?: string };
}

export function ReadinessBadge({ result }: ReadinessBadgeProps) {
  if (result.passed) {
    return (
      <Badge variant="healthy" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Ready to advance
      </Badge>
    );
  }

  const truncatedReason =
    result.reason && result.reason.length > 60
      ? result.reason.slice(0, 57) + '...'
      : result.reason;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="warning" className="gap-1 cursor-help">
            <AlertTriangle className="h-3 w-3" />
            {truncatedReason || 'Not ready'}
          </Badge>
        </TooltipTrigger>
        {result.reason && result.reason.length > 60 && (
          <TooltipContent className="max-w-xs">
            <p>{result.reason}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
