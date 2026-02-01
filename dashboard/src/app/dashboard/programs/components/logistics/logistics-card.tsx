'use client';

import { ReactNode, useState, useEffect } from 'react';
import { ChevronDown, Check, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusIndicator = 'complete' | 'warning' | 'incomplete';

interface LogisticsCardProps {
  title: string;
  icon: ReactNode;
  statusSummary: string;
  statusIndicator: StatusIndicator;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Base expandable card for logistics items
 * Adapted from EngagementCard pattern (Phase 3)
 * Per CONTEXT.md: Status icon visible in collapsed state alongside summary text
 */
export function LogisticsCard({
  title,
  icon,
  statusSummary,
  statusIndicator,
  expanded,
  onToggle,
  children,
}: LogisticsCardProps) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Status icon per CONTEXT.md */}
          {statusIndicator === 'complete' && (
            <Check className="h-4 w-4 text-emerald-500" />
          )}
          {statusIndicator === 'warning' && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          {statusIndicator === 'incomplete' && (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{statusSummary}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>
      {expanded && (
        <div className="p-4 pt-0 border-t space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Inline text field with auto-save on blur
 * Per CONTEXT.md: auto-save on blur for simple fields
 */
interface InlineTextFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'date';
  disabled?: boolean;
}

export function InlineTextField({
  label,
  value,
  onSave,
  placeholder,
  type = 'text',
  disabled = false,
}: InlineTextFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  async function handleBlur() {
    if (localValue !== value && !disabled) {
      setSaving(true);
      await onSave(localValue);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled || saving}
        className={cn(
          'w-full px-3 py-1.5 rounded-md border bg-background text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          saving && 'opacity-50'
        )}
      />
    </div>
  );
}

/**
 * Inline checkbox field with immediate save
 */
interface InlineCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => Promise<void>;
  disabled?: boolean;
}

export function InlineCheckbox({
  label,
  checked,
  onToggle,
  disabled = false,
}: InlineCheckboxProps) {
  const [saving, setSaving] = useState(false);

  async function handleChange() {
    if (!disabled) {
      setSaving(true);
      await onToggle(!checked);
      setSaving(false);
    }
  }

  return (
    <label className={cn(
      'flex items-center gap-2 cursor-pointer',
      disabled && 'cursor-not-allowed opacity-50'
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled || saving}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <span className="text-sm">{label}</span>
      {saving && (
        <span className="text-xs text-muted-foreground">(saving...)</span>
      )}
    </label>
  );
}
