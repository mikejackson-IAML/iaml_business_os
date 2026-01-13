'use client';

import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import type { QuickAction } from '../../types';

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  onAction: (action: QuickAction) => void;
  isLoading?: boolean;
  className?: string;
}

// Helper to get icon from string name
function getIcon(iconName?: string): LucideIcons.LucideIcon | undefined {
  if (!iconName) {
    return undefined;
  }
  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[pascalCase];
}

const layoutClasses = {
  horizontal: 'flex flex-wrap gap-2',
  vertical: 'flex flex-col gap-2',
  grid: 'grid grid-cols-2 sm:grid-cols-4 gap-2',
};

export function QuickActions({
  actions,
  title = 'Quick Actions',
  layout = 'horizontal',
  onAction,
  isLoading = false,
  className,
}: QuickActionsProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(layoutClasses[layout])}>
          {actions.map((action) => {
            const Icon = getIcon(action.icon);
            const variant = action.variant || 'outline';

            return (
              <Button
                key={action.id}
                variant={variant}
                size="sm"
                onClick={() => onAction(action)}
                disabled={isLoading}
                className={cn(
                  'justify-start',
                  layout === 'grid' && 'flex-col h-auto py-3 gap-1'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      layout === 'grid' ? 'mb-1' : 'mr-2'
                    )}
                  />
                )}
                <span className={cn(layout === 'grid' && 'text-xs')}>
                  {action.label || action.name}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Inline action buttons without card wrapper
interface ActionButtonsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ActionButtons({
  actions,
  onAction,
  size = 'sm',
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => {
        const Icon = getIcon(action.icon);
        const variant = action.variant || 'outline';

        return (
          <Button
            key={action.id}
            variant={variant}
            size={size}
            onClick={() => onAction(action)}
          >
            {Icon && <Icon className="h-4 w-4 mr-2" />}
            {action.label || action.name}
          </Button>
        );
      })}
    </div>
  );
}

// Floating action button for mobile
interface FloatingActionButtonProps {
  icon?: string;
  label?: string;
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({
  icon = 'plus',
  label,
  onClick,
  className,
}: FloatingActionButtonProps) {
  const Icon = getIcon(icon) || LucideIcons.Plus;

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center justify-center gap-2',
        'h-14 rounded-full bg-primary text-primary-foreground shadow-lg',
        'hover:bg-primary/90 transition-all',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        label ? 'px-6' : 'w-14',
        className
      )}
    >
      <Icon className="h-5 w-5" />
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
}

export default QuickActions;
