'use client';

import { useRouter } from 'next/navigation';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { cn } from '@/dashboard-kit/lib/utils';
import type { Opportunity } from '@/lib/api/lead-intelligence-opportunities-types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isOverlay?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function OpportunityCard({ opportunity, isOverlay }: OpportunityCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    data: { stage: opportunity.stage },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const displayName =
    opportunity.type === 'in_house' && opportunity.company
      ? opportunity.company.name
      : opportunity.contact
        ? `${opportunity.contact.first_name} ${opportunity.contact.last_name}`
        : null;

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/dashboard/lead-intelligence/opportunities/${opportunity.id}`);
    }
  };

  return (
    <Card
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      className={cn(
        'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
        isDragging && 'opacity-50',
        isOverlay && 'shadow-lg rotate-2'
      )}
      onClick={handleClick}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
    >
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate">{opportunity.title}</p>
        {displayName && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{displayName}</p>
        )}
        {opportunity.value != null && (
          <p className="text-xs font-semibold text-emerald-600 mt-1">
            {formatCurrency(opportunity.value)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
