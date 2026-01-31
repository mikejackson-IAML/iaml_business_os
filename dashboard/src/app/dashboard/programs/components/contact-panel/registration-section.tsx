'use client';

import type { RegistrationRosterItem } from '@/lib/api/programs-queries';
import { formatDate } from '@/dashboard-kit/lib/utils';

interface RegistrationSectionProps {
  registration: RegistrationRosterItem;
}

/**
 * Registration Section for Contact Panel
 * Displays program registration details: program, date, source, blocks, type
 */
export function RegistrationSection({ registration }: RegistrationSectionProps) {
  // Determine registration type based on attendance_type
  const isFullProgram = registration.attendance_type?.toLowerCase() === 'full';
  const registrationType = isFullProgram ? 'Full Program' : 'Block-only';

  // Format selected blocks for display
  const blocksDisplay = registration.selected_blocks?.length
    ? registration.selected_blocks.join(', ')
    : isFullProgram
      ? 'All Blocks'
      : 'None specified';

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Registration</h3>

      <div className="rounded-lg border bg-card p-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {/* Program */}
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">
              Program
            </dt>
            <dd className="text-sm font-medium mt-0.5">
              {registration.program_name || 'Unknown Program'}
            </dd>
          </div>

          {/* Registration Date */}
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">
              Registration Date
            </dt>
            <dd className="text-sm font-medium mt-0.5">
              {registration.registration_date
                ? formatDate(registration.registration_date)
                : 'Not recorded'}
            </dd>
          </div>

          {/* Source */}
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">
              Source
            </dt>
            <dd className="text-sm font-medium mt-0.5">
              {registration.registration_source || 'Direct'}
            </dd>
          </div>

          {/* Type */}
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">
              Type
            </dt>
            <dd className="text-sm font-medium mt-0.5">{registrationType}</dd>
          </div>

          {/* Blocks - full width */}
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">
              Blocks
            </dt>
            <dd className="text-sm font-medium mt-0.5">{blocksDisplay}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
