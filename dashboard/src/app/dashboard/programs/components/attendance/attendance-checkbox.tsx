'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface AttendanceCheckboxProps {
  programId: string;
  registrationId: string;
  blockId: string;
  isRegistered: boolean;  // Was this block in their selected_blocks?
  attended: boolean;      // Did they actually attend?
  disabled?: boolean;     // True for cancelled registrations
  onUpdate?: (attended: boolean) => void;
}

/**
 * Immediate-save checkbox for attendance tracking
 * Per CONTEXT.md: Checkboxes save immediately on click
 */
export function AttendanceCheckbox({
  programId,
  registrationId,
  blockId,
  isRegistered,
  attended,
  disabled = false,
  onUpdate,
}: AttendanceCheckboxProps) {
  const [saving, setSaving] = useState(false);
  const [localAttended, setLocalAttended] = useState(attended);

  async function handleToggle() {
    if (disabled || !isRegistered || saving) return;

    const newValue = !localAttended;
    setSaving(true);
    setLocalAttended(newValue); // Optimistic update

    try {
      const res = await fetch(`/api/programs/${programId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          blockId,
          attended: newValue,
        }),
      });

      if (res.ok) {
        toast.success('Attendance saved');
        onUpdate?.(newValue);
      } else {
        // Revert on failure
        setLocalAttended(!newValue);
        toast.error('Failed to save attendance');
      }
    } catch {
      setLocalAttended(!newValue);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  // Not registered for this block - show nothing or X
  if (!isRegistered) {
    return (
      <div className="flex justify-center">
        <X className="h-4 w-4 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || saving}
      className={cn(
        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        localAttended
          ? 'bg-emerald-500 border-emerald-500 text-white'
          : 'bg-background border-muted-foreground/30 hover:border-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        saving && 'opacity-50'
      )}
      title={
        disabled
          ? 'Cancelled registration'
          : localAttended
          ? 'Attended - click to unmark'
          : 'Click to mark as attended'
      }
    >
      {localAttended && <Check className="h-3 w-3" />}
    </button>
  );
}
