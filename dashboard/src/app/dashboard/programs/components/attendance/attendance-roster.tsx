'use client';

import { useState, useCallback, Fragment } from 'react';
import { Check, X, Ban } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';
import type { RegistrationWithAttendance, ProgramBlock } from '@/lib/api/programs-queries';
import { AttendanceCheckbox } from './attendance-checkbox';
import { BulkAttendanceButton } from './bulk-attendance-button';

interface AttendanceRosterProps {
  programId: string;
  registrations: RegistrationWithAttendance[];
  blocks: ProgramBlock[];
  isVirtualCertificate?: boolean;
  onRefresh?: () => void;
}

/**
 * Roster table with attendance tracking per block
 * Per CONTEXT.md: Same roster as Registrations tab with "Actually Attended" checkmarks
 * Per CONTEXT.md: Visual distinction between registered and attended
 */
export function AttendanceRoster({
  programId,
  registrations,
  blocks,
  isVirtualCertificate = false,
  onRefresh,
}: AttendanceRosterProps) {
  const [, setRefreshKey] = useState(0);

  // Check if a registrant has a specific block selected
  function isBlockSelected(selectedBlocks: string[] | null, blockId: string, blockName: string): boolean {
    if (!selectedBlocks) return false;
    if (selectedBlocks.includes('Full') || selectedBlocks.includes('full')) return true;
    return selectedBlocks.some(b =>
      b.toLowerCase().includes(blockName.toLowerCase()) ||
      b.toLowerCase().includes(blockId.toLowerCase())
    );
  }

  // Check if cancelled
  function isCancelled(reg: RegistrationWithAttendance): boolean {
    return reg.registration_status === 'Cancelled' || reg.cancelled_at !== null;
  }

  // Get count of non-cancelled registrations
  const activeCount = registrations.filter(r => !isCancelled(r)).length;

  // Force refresh when bulk action completes
  const handleBulkComplete = useCallback(() => {
    setRefreshKey(k => k + 1);
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className="space-y-4">
      {/* Header with bulk action */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Attendance ({activeCount} active registrations)
        </h3>
        <BulkAttendanceButton
          programId={programId}
          blockIds={blocks.map(b => b.id)}
          registrationCount={activeCount}
          onComplete={handleBulkComplete}
        />
      </div>

      {/* Roster table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Company
              </th>
              {/* Block columns with Registered/Attended pairs */}
              {blocks.map((block) => (
                <th
                  key={block.id}
                  className="text-center px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  colSpan={2}
                >
                  <div className="flex flex-col items-center">
                    <span>{block.shortName}</span>
                    <div className="flex gap-4 text-[10px] font-normal mt-1">
                      <span>Reg</span>
                      <span>Att</span>
                    </div>
                  </div>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={3 + blocks.length * 2} className="text-center py-12 text-muted-foreground">
                  No registrations to track attendance for.
                </td>
              </tr>
            ) : (
              registrations.map((reg) => {
                const cancelled = isCancelled(reg);

                return (
                  <tr
                    key={reg.id}
                    className={cn(
                      'border-b border-border/50 transition-colors',
                      cancelled ? 'bg-muted/30' : ''
                    )}
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className={cn(cancelled && 'line-through text-muted-foreground')}>
                        <span className="font-medium">{reg.full_name}</span>
                        {reg.job_title && (
                          <span className="block text-xs text-muted-foreground">{reg.job_title}</span>
                        )}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {reg.company_name || '-'}
                    </td>

                    {/* Block columns: Registered and Attended */}
                    {blocks.map((block) => {
                      const registered = isBlockSelected(reg.selected_blocks, block.id, block.name);
                      const attended = reg.attendance_by_block?.[block.id] ?? false;

                      return (
                        <Fragment key={block.id}>
                          {/* Registered indicator (static) */}
                          <td className="px-2 py-3 text-center">
                            {registered ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                          {/* Attended checkbox (interactive) */}
                          <td className="px-2 py-3 text-center">
                            <AttendanceCheckbox
                              programId={programId}
                              registrationId={reg.id}
                              blockId={block.id}
                              isRegistered={registered}
                              attended={attended}
                              disabled={cancelled}
                            />
                          </td>
                        </Fragment>
                      );
                    })}

                    {/* Status */}
                    <td className="px-4 py-3">
                      {cancelled ? (
                        <Badge variant="critical" className="flex items-center gap-1 w-fit">
                          <Ban className="h-3 w-3" />
                          Cancelled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="w-fit">
                          Active
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Virtual certificate progress note */}
      {isVirtualCertificate && (
        <p className="text-xs text-muted-foreground">
          Virtual certificate attendance is tracked across all linked block events.
        </p>
      )}
    </div>
  );
}
